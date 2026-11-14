import { mkdirSync, writeFileSync } from 'node:fs'
import { test, expect } from '@playwright/test'
async function enter(page:any,request:any,mode:string){const u=await(await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode}})).json();await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click();await page.locator('#open-inbox').click();await expect(page.locator('.inbox-flow')).toHaveAttribute('aria-busy','false');await page.getByLabel('Dismiss notification reminder').click();return u}
async function state(page:any,id:string){
 await expect(page.locator('.inbox-flow')).toHaveAttribute('data-state',id)
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400)
 const root=page.locator('.inbox-flow');await expect(root).toHaveCSS('background-color','rgb(13, 23, 19)')
 if(id.startsWith('inbox-hidden')){const b=await page.locator('.inbox-hidden-back').boundingBox();expect([b!.x,b!.y,b!.width,b!.height]).toEqual([16,59.5,40,40]);await expect(page.locator('.inbox-hidden-title')).toHaveCSS('font-size','17px')} 
 for(const line of await page.locator('#inbox-menu:visible i').all()){
  const b=await line.boundingBox();expect(b.width).toBe(21);expect(b.height).toBe(2)
  await expect(line).toHaveCSS('background-color','rgb(232, 243, 222)')
 }
 if(await page.locator('.inbox-empty-image').count()){
  const b=await page.locator('.inbox-empty-image').boundingBox();expect(b.width).toBe(112);expect(b.height).toBe(112);expect(b.x).toBe(131.5);expect(b.y).toBe(id==='inbox-hidden-empty'?176:164)
 }
 if(await page.locator('.chat-row').count()){
  const b=await page.locator('.chat-row').first().boundingBox();expect(b.x).toBe(24);expect(b.width).toBe(327);expect(b.height).toBe(await page.locator('.chat-row').first().locator('.inbox-muted-icon').count()?90:84)
  await expect(page.locator('.inbox-row-name').first()).toHaveCSS('font-size','15px')
  await expect(page.locator('.inbox-row-name').first()).toHaveCSS('font-weight','550')
  await expect(page.locator('.inbox-row-name').first()).toHaveCSS('line-height','21px')
  await expect(page.locator('.inbox-row-preview').first()).toHaveCSS('line-height','18px')
  const avatar=await page.locator('.inbox-row-avatar').first().boundingBox();expect(avatar!.width).toBe(48);expect(avatar!.height).toBe(48)
  const y=['inbox-pending','inbox-collected-one'].includes(id)?200:124;expect(b.y).toBe(y)
  await expect(page.locator('.inbox-row-avatar').first()).toHaveCSS('border-radius','24px')
  await expect(page.locator('.inbox-row-preview').first()).toHaveCSS('color','rgb(134, 151, 140)')
 }
 mkdirSync('docs/ui-redo/screenshots',{recursive:true})
 await page.screenshot({path:`docs/ui-redo/screenshots/R09-${id}.png`})
 const measured=await root.evaluate((r:any)=>Array.from(r.querySelectorAll('*')).map((e:any)=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return {element:e.id||e.className,box:[b.x,b.y,b.width,b.height],style:Object.fromEntries(['color','backgroundColor','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','borderRadius','boxShadow'].map(k=>[k,s[k as any]]))}}))
 mkdirSync('/tmp/r09',{recursive:true})
 writeFileSync(`/tmp/r09/${id}.json`,JSON.stringify(measured,null,2))
}
test('R09: pending 3 → 2 → 0, history, unread → read, following, options, search, hide and restore',async({page,request})=>{
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const u=await enter(page,request,'pending');await state(page,'inbox-pending');
 for(let n=3;n>0;n--){await expect(page.locator('#collect-replies>b')).toHaveText(String(n));await page.locator('#collect-replies').click();await expect(page.getByRole('dialog')).toContainText('0 diamonds');await page.locator('#confirm-reply-payment').click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('.inbox-flow')).toHaveAttribute('aria-busy','false');if(n===3)await state(page,'inbox-collected-one')}
 await state(page,'inbox-collected-all');await expect(page.locator('#collect-replies')).toHaveCount(0);await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(3);
 // Re-enter resets transient collection state, preserving server unread counts.
 await page.locator('.main-nav button').first().click();await page.locator('#open-inbox').click();await state(page,'inbox-unread');
 await page.locator('#inbox-menu').click();await page.locator('#inbox-drawer-search').fill('Thank you for the tea story.');await page.locator('#drawer-search').click();await expect(page.locator('[data-chat]')).toHaveCount(3);await expect(page.getByLabel('Unread',{exact:true})).toHaveCount(3);await page.getByRole('button',{name:'Clear search'}).click();
 for(let i=0;i<3;i++){await expect(page.locator('.inbox-flow')).toHaveAttribute('aria-busy','false');await page.locator('[data-chat]').nth(i).click();await expect(page.locator('.c6-thread')).toContainText('Thank you for the tea story.');await page.getByLabel('Back to messages').click()};await state(page,'inbox-read');
 await page.locator('#tab-friends').click();await state(page,'inbox-friends-empty');await page.locator('#tab-messages').click();await page.locator('[data-options]').first().click();await state(page,'inbox-options');await page.getByRole('button',{name:'Follow conversation',exact:true}).click();await page.locator('#tab-friends').click();await state(page,'inbox-friends');await expect(page.locator('[data-chat]')).toHaveCount(1);
 await page.locator('#tab-messages').click();await page.locator('[data-options]').first().click();await page.locator('#option-pin').click();await page.locator('[data-options]').first().click();await page.locator('#option-mute').click();await state(page,'inbox-pinned');
 await page.locator('[data-options]').first().click();await page.getByLabel('Remark',{exact:true}).fill('Window tea');await page.getByRole('button',{name:'Save remark'}).click();await expect(page.locator('[data-chat]').first()).toContainText('Window tea');
 await page.locator('#inbox-menu').click();await state(page,'inbox-drawer');await page.locator('#inbox-drawer-search').fill('Window tea');await page.locator('#drawer-search').click();await state(page,'inbox-search');await expect(page.locator('[data-chat]')).toHaveCount(1);
 await page.locator('#inbox-menu').click();await page.locator('#inbox-drawer-search').fill('unmatched-query');await page.locator('#drawer-search').click();await state(page,'inbox-search-empty');await page.getByRole('button',{name:'Clear search'}).click();
 await page.locator('[data-options]').first().click();await page.locator('#option-hide').click();await page.locator('#inbox-menu').click();await page.getByRole('button',{name:'Hidden conversations',exact:false}).click();await state(page,'inbox-hidden');await page.locator('[data-options]').first().click();await page.locator('#option-hide').click();await state(page,'inbox-hidden-empty');
 expect(errors).toEqual([]);const wallet=await(await request.get('http://127.0.0.1:3001/wallet',{headers:{Authorization:`Bearer ${u.token}`}})).json();expect(wallet.diamonds).toBe(100);expect(wallet.freeRemaining).toBe(7)
})
for(const mode of ['empty','waiting'])test(`R09: ${mode} and notification reminder`,async({page,request})=>{await enter(page,request,mode);await state(page,`inbox-${mode}`);await page.evaluate(()=>sessionStorage.removeItem('maugo-inbox-prompt'));await page.locator('.main-nav button').first().click();await page.locator('#open-inbox').click();await state(page,'inbox-notifications-off');await expect(page.locator('.inbox-notification-prompt')).toBeVisible()})

test('R09 Korean labels and short viewport keep artwork size',async({page,request})=>{
 const u=await(await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode:'empty'}})).json()
 await page.addInitScript(()=>localStorage.setItem('maugo-language','ko'))
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click()
 await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password)
 await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .primary').click();await page.locator('#open-inbox').click()
 await expect(page.locator('.inbox-empty-image')).toBeVisible();await page.evaluate(()=>document.fonts.ready)
 for(const selector of ['.inbox-tab','.inbox-empty-title','.inbox-empty-description','.inbox-notice-copy'])for(const el of await page.locator(selector).all()){
  await expect(el).toHaveCSS('font-family',/GowunDodum/)
  expect(await el.evaluate(e=>e.scrollWidth<=e.clientWidth+1),selector).toBeTruthy()
 }
 await page.setViewportSize({width:375,height:700});await expect(page.locator('.inbox-empty-image')).toHaveCSS('width','112px');await expect(page.locator('.inbox-empty-image')).toHaveCSS('height','112px')
 await page.locator('#inbox-menu').click();await expect(page.locator('#inbox-drawer-search')).toBeVisible()
 expect(await page.locator('.inbox-drawer').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBeTruthy()
})
