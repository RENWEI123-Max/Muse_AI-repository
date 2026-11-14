import { test, expect } from '@playwright/test'
async function enter(page:any,request:any){const u=await(await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode:'pending'}})).json();await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .primary').click();await page.locator('#open-inbox').click();await expect(page.locator('.inbox-flow')).toHaveAttribute('aria-busy','false');return u}
async function box(page:any,selector:string,expected:number[]){
 const b=await page.locator(selector).boundingBox();expect(b,selector).toBeTruthy()
 for(const [i,k] of ['x','y','width','height'].entries())expect(Math.abs(b![k]-expected[i]),selector+' '+k).toBeLessThanOrEqual(1)
}
async function verify(page:any,state:string){
 await page.evaluate(()=>document.fonts.ready)
 await expect(page.locator('.inbox-flow')).toHaveAttribute('data-reply-state',state)
 if(state==='reply-payment'||state==='reply-shortage'){
  const shortage=state==='reply-shortage'
  await box(page,'.reply-dialog',[24,shortage?235.5:210.25,327,shortage?341:391.5])
  await box(page,'.reply-title',[49,shortage?272.5:247.25,277,28])
  await box(page,'.reply-summary',[49,shortage?356.5:351.25,277,shortage?79:109.5])
  await box(page,shortage?'#reply-topup':'#confirm-reply-payment',[49,shortage?459.5:484.75,277,48])
  await expect(page.locator('.reply-title')).toHaveCSS('font-size','22px')
  await expect(page.locator('.reply-title')).toHaveCSS('font-weight','550')
  await expect(page.locator('.reply-title')).toHaveCSS('color','rgb(228, 239, 217)')
  await expect(page.locator('.reply-dialog')).toHaveCSS('border-radius','28px')
  await expect(page.locator('.reply-description')).toHaveCSS('color','rgb(161, 178, 159)')
  await expect(page.locator('.reply-line').first()).toHaveCSS('font-size','11px')
  const row=await page.locator('.reply-line').first().boundingBox();expect(Math.abs(row!.y-(shortage?373.5:368.25))).toBeLessThanOrEqual(1)
 }else if(state==='reply-topup'){
  await box(page,'.reply-topup',[12,104,351,684])
  await box(page,'.reply-diamond',[147.5,185,80,70])
  await box(page,'.reply-balance',[33,319,309,48])
  await box(page,'.reply-pack:first-child',[33,387,148.5,158])
 }else if(state==='reply-paid')await box(page,'.reply-receipt',[28,646.5,319,40.5])
 else await box(page,'#collect-replies',[24,124,327,56])
}
test('R10 six states: free collection → paid confirmation → cancel → shortage → topup → resume → paid; retry once',async({page,request})=>{
 test.setTimeout(120000);const u=await enter(page,request),headers={Authorization:`Bearer ${u.token}`};
 const wallet=async()=>await(await request.get('http://127.0.0.1:3001/wallet',{headers})).json();
 // Consume nine real free replies, leaving the three inbox replies untouched.
 for(let i=0;i<9;i++){await request.post('http://127.0.0.1:3001/__c6/reply',{data:{id:u.conversations[0]}});const pending=await(await request.get(`http://127.0.0.1:3001/conversations/${u.conversations[0]}/replies/pending`,{headers})).json();const r=await request.post(`http://127.0.0.1:3001/conversations/${u.conversations[0]}/replies/${pending.items.at(-1).id}/collect`,{headers:{...headers,'Idempotency-Key':`d1-free-${i}`},data:{}});expect(r.ok()).toBeTruthy()}
 await page.locator('.main-nav button').first().click();await page.locator('#open-inbox').click();await expect(page.locator('#collect-replies')).toContainText('1 free today');await page.waitForTimeout(450);await verify(page,'reply-last-free');await page.screenshot({path:'docs/ui-redo/r10/reply-last-free.png'});
 await page.locator('#collect-replies').click();await expect(page.getByRole('dialog')).toContainText('0 diamonds');await page.locator('#confirm-reply-payment').click();await expect(page.getByRole('dialog')).toHaveCount(0);expect((await wallet()).freeRemaining).toBe(0);expect((await wallet()).diamonds).toBe(100);
 await page.locator('#collect-replies').click();await expect(page.getByRole('dialog')).toContainText('10 diamonds');await page.waitForTimeout(450);await verify(page,'reply-payment');await page.screenshot({path:'docs/ui-redo/r10/reply-payment.png'});await page.locator('#reply-payment-cancel').click();await expect(page.locator('#collect-replies>b')).toHaveText('2');expect((await wallet()).diamonds).toBe(100);await page.waitForTimeout(450);await verify(page,'reply-cancelled');await page.screenshot({path:'docs/ui-redo/r10/reply-cancelled.png'});
 await request.post('http://127.0.0.1:3001/__c5/balance',{data:{id:u.id,diamonds:0}});await page.locator('#collect-replies').click();await expect(page.locator('#reply-topup')).toBeVisible();await page.waitForTimeout(450);await verify(page,'reply-shortage');await page.screenshot({path:'docs/ui-redo/r10/reply-shortage.png'});await page.locator('#reply-topup').click();await expect(page.getByRole('dialog',{name:'Diamonds',exact:true})).toBeVisible();await page.waitForTimeout(450);await verify(page,'reply-topup');await page.screenshot({path:'docs/ui-redo/r10/reply-topup.png'});await page.locator('#confirm-pack').click();await expect(page.getByRole('status')).toContainText('No charge');expect((await wallet()).diamonds).toBe(0);
 await page.keyboard.press('Escape');await expect(page.getByRole('status')).toContainText('selection saved');expect((await wallet()).diamonds).toBe(0);await expect(page.locator('#collect-replies>b')).toHaveText('2');await page.locator('#reply-topup').click();await request.post('http://127.0.0.1:3001/__c5/balance',{data:{id:u.id,diamonds:100}});await expect(page.getByRole('dialog',{name:'Diamonds',exact:true})).toHaveCount(0);await expect(page.getByRole('status')).toContainText('Diamonds added');await expect(page.locator('#confirm-reply-payment')).toBeEnabled();let keys:string[]=[];await page.route('**/replies/*/collect',async route=>{keys.push(route.request().headers()['idempotency-key']!);if(keys.length===1){await route.fetch();await route.abort()}else await route.continue()});await page.locator('#confirm-reply-payment').click();await expect(page.locator('#confirm-reply-payment')).toBeEnabled();await page.locator('#confirm-reply-payment').click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(keys).toHaveLength(2);expect(keys[0]).toBe(keys[1]);expect((await wallet()).diamonds).toBe(90);await expect(page.locator('#collect-replies>b')).toHaveText('1');const ledger=await(await request.get('http://127.0.0.1:3001/wallet/ledger',{headers})).json();expect(ledger.items).toHaveLength(1);expect(ledger.items[0].amount).toBe(-10);await page.waitForTimeout(450);await verify(page,'reply-paid');await page.screenshot({path:'docs/ui-redo/r10/reply-paid.png'});
})

test('R10 Korean payment, shortage and topup fit; short screen keeps diamond size',async({page,request})=>{
 test.setTimeout(120000);await page.addInitScript(()=>localStorage.setItem('maugo-language','ko'));const u=await enter(page,request)
 // Consume the real free allowance through the backend; do not fake UI state.
 const headers={Authorization:`Bearer ${u.token}`}
 for(let i=0;i<10;i++){
  await request.post('http://127.0.0.1:3001/__c6/reply',{data:{id:u.conversations[0]}})
  const q=await(await request.get(`http://127.0.0.1:3001/conversations/${u.conversations[0]}/replies/pending`,{headers})).json()
  await request.post(`http://127.0.0.1:3001/conversations/${u.conversations[0]}/replies/${q.items.at(-1).id}/collect`,{headers:{...headers,'Idempotency-Key':`r10-ko-${i}`},data:{}})
 }
 await page.locator('.main-nav button').first().click();await page.locator('#open-inbox').click();await page.locator('#collect-replies').click()
 for(const selector of ['.reply-title','.reply-description','.reply-confirm']){
  await expect(page.locator(selector).first()).toHaveCSS('font-family',/GowunDodum/)
  expect(await page.locator(selector).first().evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBeTruthy()
 }
 await page.keyboard.press('Escape');await request.post('http://127.0.0.1:3001/__c5/balance',{data:{id:u.id,diamonds:0}})
 await page.locator('#collect-replies').click();await page.locator('#reply-topup').click()
 await expect(page.locator('.reply-diamond')).toBeVisible();await page.setViewportSize({width:375,height:700})
 await expect(page.locator('.reply-diamond')).toHaveCSS('width','80px');await expect(page.locator('.reply-diamond')).toHaveCSS('height','70px')
 expect(await page.locator('.reply-topup').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBeTruthy()
})
