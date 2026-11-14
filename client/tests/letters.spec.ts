import { mkdirSync, writeFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
test('C4 module03: ten states, B3/B4/B7 and safe retries on isolated database',async({page,request})=>{
 test.setTimeout(90000);page.setDefaultTimeout(12000)
 const fixture=await (await request.post('http://127.0.0.1:3001/__c4/seed')).json()
 const {viewer,author,target,letter}=fixture
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(viewer.email);await page.locator('#auth-password').fill(viewer.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click()
 await page.locator('.letter-bird').first().click({force:true})
 mkdirSync('docs/ui-redo/r08',{recursive:true})
 const panel=page.locator('.letters-panel');const state=async(s:string)=>{
  await expect(panel).toHaveAttribute('data-state',s);await expect(panel).toHaveCSS('transform','none')
  const geometry=async(selector:string,values:number[])=>{await expect.poll(async()=>{const b=await page.locator(selector).boundingBox();return b?Math.max(...['x','y','width','height'].map((k,i)=>Math.abs(b[k as keyof typeof b]-values[i]!))):Infinity},{message:selector+' Figma geometry'}).toBeLessThanOrEqual(1)}
  await geometry('.letters-panel',[12,144,351,s.startsWith('compose-')&&s!=='compose-sent'?496:560])
  if(s.startsWith('compose-')&&s!=='compose-sent'){
   await expect(page.locator('.letter-count')).toHaveText(`${[...await page.locator('#letter-text').inputValue()].length} / 200`)
   await geometry('#letter-text',[33,257,309,321]);await geometry('#publish',[129,657,225,48]);await geometry('.sender-preview',[33,201,309,56]);await geometry('.letter-count',[33,578,309,32])
   await expect(page.locator('#letter-text')).toHaveCSS('font-size','14px');await expect(page.locator('#letter-text')).toHaveCSS('line-height','21px')
   await expect(panel).toHaveCSS('border-radius','27px')
  }else if(s.startsWith('letter-')){
   await geometry('.letter-conversation',[33,249,309,345]);await geometry('.message-bubble',[85,249,257,291])
   await expect(panel).toHaveCSS('border-radius','28px');await expect(page.locator('.letter-content')).toHaveCSS('color','rgb(228, 239, 217)');await expect(page.locator('.letter-content')).toHaveCSS('font-size','14px');await expect(page.locator('.letter-content')).toHaveCSS('line-height','21.7px');await expect(page.locator('.letter-content')).toHaveCSS('font-weight','400')
   if(s==='letter-open'||s==='letter-typed')await geometry('.reply-bar',[33,639,309,48])
   if(s==='letter-safety'){await geometry('.letter-safety',[12,490,351,298]);await geometry('#safety-report',[33,607,309,74]);await geometry('#safety-block',[33,693,309,74])}
   if(s==='letter-report'){await geometry('.letter-safety',[12,446,351,342]);await geometry('.report-option:first-of-type',[33,583,309,38.5])}
  }
  const evidence=await page.locator('.letters-flow').evaluate(root=>Array.from(root.querySelectorAll('*')).filter(e=>e.getBoundingClientRect().width).map(e=>{const b=e.getBoundingClientRect(),c=getComputedStyle(e);return {tag:e.tagName,id:e.id,class:e.className,box:{x:b.x,y:b.y,width:b.width,height:b.height},style:{color:c.color,background:c.backgroundImage,backgroundColor:c.backgroundColor,radius:c.borderRadius,font:c.fontFamily,size:c.fontSize,weight:c.fontWeight,lineHeight:c.lineHeight,letterSpacing:c.letterSpacing,shadow:c.boxShadow}}}))
  writeFileSync(`docs/ui-redo/r08/${s}.json`,JSON.stringify(evidence,null,2));await page.screenshot({path:`docs/ui-redo/r08/${s}.png`})
 }
 await state('letter-open');await expect(page.locator('.letter-content')).toContainText('bookshop')
 await page.locator('#reply').fill('That small moment made me smile.');await state('letter-typed')
 await page.locator('#report-note').click();await state('letter-safety');await expect(page.locator('#safety-block')).toBeVisible();await page.locator('#safety-report').click();await state('letter-report');await page.getByRole('button',{name:'Spam or advertising',exact:true}).click();await expect(page.getByText('Report received.',{exact:false})).toBeVisible()
 await page.locator('#reply-send').click();await state('letter-waiting')
 await request.post('http://127.0.0.1:3001/__c4/reply',{data:{conversationId:letter.id,senderId:author.id}});await state('letter-replied')
 await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('#compose').click();await state('compose-empty');await expect(page.locator('#publish')).toBeDisabled()
 await page.getByLabel('Recipient ID',{exact:true}).fill(target.id)
 await page.locator('#letter-text').fill('Today I found a quiet little bookshop. What small discovery stayed with you?');await state('compose-draft')
 await page.locator('#letter-text').fill('A first line.\nA second line.');await state('compose-invalid');await expect(page.locator('#publish')).toBeDisabled();await expect(page.locator('#letter-text')).toHaveAttribute('aria-invalid','true')
 await page.locator('#letter-text').fill('字'.repeat(201));await expect(page.locator('#publish')).toBeDisabled();await expect(page.locator('#letter-validation')).toContainText('200')
 await page.locator('#letter-text').fill('   ');await expect(page.locator('#publish')).toBeDisabled()
 const draft='A quiet little hello, from my window.';await page.locator('#letter-text').fill(draft)
 let calls=0;await page.route('**/conversations/*/opening',async route=>{calls++;if(calls===1)await route.fulfill({status:503,json:{message:'Test failure'}});else {await new Promise(r=>setTimeout(r,500));await route.continue()}})
 await page.locator('#publish').click();await expect(page.locator('.letter-error')).toContainText('Your draft is saved');await expect(page.locator('#letter-text')).toHaveValue(draft)
 await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('#compose').click();await page.getByLabel('Recipient ID',{exact:true}).fill(target.id);await expect(page.locator('#letter-text')).toHaveValue(draft)
 const response=page.waitForResponse(r=>r.url().includes(`/conversations/${target.id}/opening`)&&r.status()===201)
 await page.locator('#publish').evaluate((el:HTMLButtonElement)=>{el.click();el.click();el.click()});const created=await (await response).json();await state('compose-sent');expect(calls).toBe(2)
 const count=await (await request.get(`http://127.0.0.1:3001/__c4/count/${created.id}`)).json();expect(count.count).toBe(1)
 await page.getByRole('button',{name:'Back to home'}).click();await page.evaluate(()=>{for(const key of Object.keys(sessionStorage))if(key.startsWith('maugo-opening-sent:'))sessionStorage.removeItem(key)});await page.locator('#compose').click();await page.getByLabel('Recipient ID',{exact:true}).fill(target.id);await page.locator('#letter-text').fill('Another hello');await page.locator('#publish').click();await expect(page.locator('.waiting-status')).toContainText('already sent');await expect(page.locator('#publish')).toHaveCount(0)
 await page.getByRole('button',{name:'Back to home'}).click();await expect(panel).toHaveCount(0);await page.locator('.letter-bird').first().click({force:true});await page.locator('#report-note').click();await page.locator('#safety-block').click();await page.locator('.letter-safety').getByRole('button',{name:'Block',exact:true}).click();await expect(panel).toHaveCount(0);await expect(page.locator('.letter-bird')).toHaveCount(0)
 const blocks=await (await request.get('http://127.0.0.1:3001/blocks',{headers:{Authorization:`Bearer ${viewer.token}`}})).json();expect(blocks.items.some((b:{userId:string})=>b.userId===author.id)).toBeTruthy();expect(errors).toEqual([])
})
