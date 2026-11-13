import {test,expect} from '@playwright/test'
import {readFileSync} from 'node:fs'
const base='http://127.0.0.1:3001'
const png=readFileSync('src/assets/05-avatars/portrait-1.png')
const photo={name:'proof.png',mimeType:'image/png',buffer:png}
async function enter(page:any,request:any){
 const u=await(await request.post(base+'/__c5/seed',{data:{mode:'read'}})).json()
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click();await page.locator('#open-inbox').click();await page.locator('[data-chat]').click();await page.locator('#chat-details').click();await page.locator('#report-person').click();await page.locator('#safety-report').click()
 const c=await(await request.get(base+'/conversations',{headers:{Authorization:`Bearer ${u.token}`}})).json()
 return {...u,peer:c.items[0].peerId,headers:{Authorization:`Bearer ${u.token}`}}
}
async function submit(page:any){const response=page.waitForResponse((r:any)=>r.url().endsWith('/reports')&&r.request().method()==='POST');await page.locator('#save-report').click();const r=await response;expect(r.status()).toBe(201);return {body:await r.json(),sent:r.request().postDataJSON()}}
async function upload(page:any){await page.locator('#report-photo').setInputFiles(photo);await expect(page.getByText('Photo ready to submit.',{exact:true})).toBeVisible()}
async function capture(page:any,name:string){await page.evaluate(()=>{(document.activeElement as HTMLElement)?.blur()});await page.waitForTimeout(300);await page.screenshot({path:`docs/report-attachment-${name}.png`})}
test('B13 image report persists; foreign media rejected; remove and plain reports omit attachment',async({page,request})=>{
 test.setTimeout(90000);const u=await enter(page,request)
 await expect(page.locator('.d3-report')).toHaveCSS('animation-name',/^d3-in/);await expect(page.locator('.d3-add-photo')).toHaveCSS('transition-duration','0.18s, 0.18s');await capture(page,'empty');await page.locator('#report-details').fill('Unwanted messages with evidence.');await upload(page);await expect(page.locator('#report-attachment img')).toBeVisible();await capture(page,'preview')
 const saved=await submit(page);expect(saved.sent.attachmentMediaId).toBeTruthy();expect(saved.body.attachment.id).toBe(saved.sent.attachmentMediaId)
 const detail=await request.get(base+'/reports/'+saved.body.id,{headers:u.headers});expect(detail.status()).toBe(200);expect((await detail.json()).attachment).toEqual(saved.body.attachment)
 await expect(page.locator('.d3-saved')).toContainText('Photo submitted');await capture(page,'saved')
 const other=await(await request.post(base+'/__c5/seed',{data:{mode:'read'}})).json()
 const forged=await request.post(base+'/reports',{headers:{Authorization:`Bearer ${other.token}`},data:{reportedUserId:u.peer,category:'other',reason:'forged evidence',attachmentMediaId:saved.sent.attachmentMediaId}});expect(forged.status()).toBe(403)
 for(const remove of [true,false]){
  await page.locator('#report-person').click();await page.locator('#safety-report').click();await expect(page.locator('#report-attachment')).toHaveCount(0)
  if(remove){await upload(page);await page.getByRole('button',{name:'Remove attachment',exact:true}).click();await expect(page.locator('#report-attachment')).toHaveCount(0);await capture(page,'removed')}
  const plain=await submit(page);expect(plain.sent).not.toHaveProperty('attachmentMediaId');expect(plain.body.attachment).toBeNull();expect((await(await request.get(base+'/reports/'+plain.body.id,{headers:u.headers})).json()).attachment).toBeNull();await expect(page.locator('.d3-saved')).not.toContainText('Photo submitted')
 }
})
test('invalid and oversized images rejected; upload failure permits plain report',async({page,request})=>{
 test.setTimeout(90000);const u=await enter(page,request)
 for(const file of [{name:'note.txt',mimeType:'text/plain',buffer:Buffer.from('not a picture')},{name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(10*1024*1024)}]){
  await page.locator('#report-photo').setInputFiles(file);await expect(page.locator('.d3-upload-error')).toContainText('smaller than 10 MB');await expect(page.locator('#save-report')).toBeEnabled()
 }
 for(const [bytes,mime,status] of [[Buffer.from('not a picture'),'image/png',415],[Buffer.alloc(10*1024*1024),'image/png',413],[Buffer.from('not a picture'),'text/plain',400]] as const){const r=await request.post(base+'/media/uploads?purpose=report&filename=proof.png',{headers:{...u.headers,'Content-Type':mime},data:bytes});expect(r.status()).toBe(status)}
 await page.locator('#report-photo').setInputFiles({name:'fake.png',mimeType:'image/png',buffer:Buffer.from('not a picture')});await expect(page.locator('.d3-upload-error')).toContainText('Photo upload failed');await capture(page,'failed');expect((await submit(page)).sent).not.toHaveProperty('attachmentMediaId')
})
test('removing an in-flight photo ignores its eventual upload result',async({page,request})=>{
 test.setTimeout(60000);await enter(page,request)
 let release!:()=>void;const held=new Promise<void>(r=>release=r)
 await page.route('**/api/media/uploads?**',async route=>{await held;await route.continue()})
 await page.locator('#report-photo').setInputFiles(photo);await expect(page.getByText('Uploading photo…',{exact:false})).toBeVisible();await page.getByRole('button',{name:'Remove attachment',exact:true}).click()
 const uploaded=page.waitForResponse(r=>r.url().includes('/media/uploads?'));release();await uploaded;await expect(page.getByText('Photo ready to submit.',{exact:true})).toHaveCount(0);expect((await submit(page)).sent).not.toHaveProperty('attachmentMediaId')
})
