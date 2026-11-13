import { test, expect } from '@playwright/test'
import { readdirSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
const root='/root/MauGo-handover/extracted/MauGo完整项目交接-2026-10-27'
test('C7 offline deliverables open, local images decode',async({page})=>{
 test.setTimeout(120000)
 for(const file of readdirSync(root+'/03-成品UI/离线预览').filter(f=>f.endsWith('.html'))){
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto(pathToFileURL(root+'/03-成品UI/离线预览/'+file).href,{waitUntil:'domcontentloaded'})
  await expect(page.locator('body')).not.toBeEmpty()
  const images=await page.locator('img').evaluateAll(async imgs=>{imgs.forEach(i=>i.loading="eager");await Promise.all(imgs.map(i=>Promise.race([i.decode().catch(()=>{}),new Promise(r=>setTimeout(r,5000))])));return imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>({id:i.id,alt:i.alt,source:i.getAttribute('src')?.slice(0,70)}))})
  await page.screenshot({path:'test-results/c7-'+(file.includes('平铺')?'boards':'shell')+'.png'})
  expect.soft(images,file).toEqual([]);expect.soft(errors,file).toEqual([])
 }
})
test('C7 chat network failure and upload failure preserve retry intent; empty send disabled',async({page,request})=>{
 const u=await(await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode:'read'}})).json()
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click();await page.locator('#open-inbox').click();await page.locator('[data-chat]').click()
 await expect(page.locator('#chat-send')).toBeDisabled()
 await page.locator('#chat-input').fill('C7 network retry')
 await page.route('**/api/conversations/*/messages',route=>route.abort('internetdisconnected'))
 await page.locator('#chat-send').click();await expect(page.locator('.c6-error')).toBeVisible();await expect(page.locator('#chat-input')).toHaveValue('C7 network retry')
 await page.unroute('**/api/conversations/*/messages');await page.locator('#chat-send').click();await expect(page.locator('#chat-input')).toHaveValue('');await expect(page.locator('.c6-thread')).toContainText('C7 network retry')
 await page.locator('#chat-photo').setInputFiles('src/assets/05-avatars/portrait-1.png');await page.route('**/api/media/uploads?*',route=>route.fulfill({status:503,json:{message:'C7 upload unavailable'}}));await page.locator('#chat-send').click();await expect(page.locator('.c6-error')).toBeVisible();await expect(page.locator('.c6-attachment')).toBeVisible()
 await page.unroute('**/api/media/uploads?*');await page.locator('#chat-send').click();await expect(page.locator('.c6-attachment')).toHaveCount(0)
})
