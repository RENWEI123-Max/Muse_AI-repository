import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

async function enter(page:Page,request:APIRequestContext){
 const response=await request.post('http://127.0.0.1:3001/__c3/seed');expect(response.ok()).toBeTruthy();const user=await response.json()
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill(user.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click();await expect(page.locator('.letter-bird')).toHaveCount(3)
 const headers={Authorization:`Bearer ${user.token}`}
 const wallet=async()=>{const r=await request.get('http://127.0.0.1:3001/wallet',{headers});expect(r.ok()).toBeTruthy();return (await r.json()).diamonds as number}
 const status=async()=>{const r=await request.get('http://127.0.0.1:3001/filter-pass',{headers});expect(r.ok()).toBeTruthy();return r.json()}
 await page.getByRole('button',{name:'Filters',exact:true}).click()
 return {user,wallet,status,headers}
}
async function choose(page:Page,index=0){await page.locator('.pass-badge').first().click();await page.locator('.pass-plan').nth(index).click();await expect(page.getByRole('dialog',{name:'Confirm Filter Pass',exact:true})).toBeVisible()}
async function selected(page:Page){await expect(page.getByRole('button',{name:'Filter Woman',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByLabel('Minimum age')).toHaveValue('23');await expect(page.getByLabel('Maximum age')).toHaveValue('40');await expect(page.getByLabel('City',{exact:true})).toHaveValue('Seoul')}

test('F02: confirmation, every cancel path, complete filters, purchase and cumulative renewal',async({page,request})=>{
 const {wallet,status}=await enter(page,request);const before=await wallet();let purchases=0;page.on('request',r=>{if(r.url().endsWith('/filter-pass/purchase'))purchases++})
 await page.getByRole('button',{name:'Filter Woman',exact:true}).click();await choose(page,1)
 await expect(page.locator('.pass-confirmation')).toContainText('7 days');await expect(page.locator('.pass-payment-summary')).toContainText('150 diamonds');await expect(page.locator('.pass-confirmation')).toContainText('Valid until');await expect(page.locator('.pass-confirmation')).toHaveCSS('animation-name',/pass-confirm-in/)
 await page.locator('#cancel-pass').click();expect(purchases).toBe(0);expect(await wallet()).toBe(before);await expect(page.getByRole('button',{name:'Filter Woman',exact:true})).toHaveAttribute('aria-pressed','true')
 await choose(page,1);await page.locator('#confirm-pass-payment').click();await expect(page.getByLabel('Minimum age')).toBeEnabled();expect(await wallet()).toBe(before-150);const firstExpiry=Date.parse((await status()).expiresAt)
 await page.getByLabel('Minimum age').fill('23');await page.getByLabel('Maximum age').fill('40');await page.getByLabel('City',{exact:true}).selectOption('Seoul')
 for(const cancel of ['button','close','escape','backdrop']){
  await choose(page,1)
  if(cancel==='button')await page.locator('#cancel-pass').click()
  if(cancel==='close')await page.getByRole('button',{name:'Close',exact:true}).click()
  if(cancel==='escape')await page.keyboard.press('Escape')
  if(cancel==='backdrop')await page.locator('.home-veil').click({position:{x:8,y:8}})
  await selected(page);expect(await wallet()).toBe(before-150)
 }
 expect(purchases).toBe(1);await choose(page,1);await expect(page.locator('.pass-confirmation h3')).toContainText('Extend');await expect(page.locator('.pass-confirmation')).toHaveCSS('opacity','1');await page.screenshot({path:'test-results/f02-extend-confirmation.png'})
 const confirm=await page.locator('#confirm-pass-payment').boundingBox(),cancel=await page.locator('#cancel-pass').boundingBox();expect(confirm).toBeTruthy();expect(cancel!.y).toBeGreaterThanOrEqual(confirm!.y+confirm!.height);expect(cancel!.y+cancel!.height).toBeLessThanOrEqual(812)
 await page.locator('#confirm-pass-payment').click();await selected(page);expect(await wallet()).toBe(before-300);expect(Date.parse((await status()).expiresAt)-firstExpiry).toBe(7*86400000);expect(purchases).toBe(2)
})

test('F02: failure preserves intention; response lost after debit retries once with the same key',async({page,request})=>{
 const {wallet,headers}=await enter(page,request);await choose(page);await page.locator('#confirm-pass-payment').click();await expect(page.getByLabel('Minimum age')).toBeEnabled()
 await page.getByRole('button',{name:'Filter Woman',exact:true}).click();await page.getByLabel('Minimum age').fill('23');await page.getByLabel('Maximum age').fill('40');await page.getByLabel('City',{exact:true}).selectOption('Seoul')
 const before=await wallet();const keys:string[]=[];let attempt=0;let release:(()=>void)|undefined
 await page.route('**/filter-pass/purchase',async route=>{
  keys.push(route.request().headers()['idempotency-key']!);attempt++
  if(attempt===1){await route.fulfill({status:503,json:{message:'Test payment unavailable'}});return}
  if(attempt===2){const response=await route.fetch();expect(response.ok()).toBeTruthy();await route.abort('failed');return}
  await new Promise<void>(resolve=>{release=resolve});await route.continue()
 })
 await choose(page,2);await page.locator('#confirm-pass-payment').click();await expect(page.locator('.pass-confirmation [role=alert]')).toContainText('Test payment unavailable');expect(await wallet()).toBe(before);await expect(page.locator('.pass-confirmation h3')).toContainText('30 days');await expect(page.locator('.pass-confirmation')).toHaveCSS('opacity','1');await page.screenshot({path:'test-results/f02-retry.png'})
 await page.locator('#cancel-pass').click();await selected(page);await choose(page,2);await page.locator('#confirm-pass-payment').click();await expect(page.locator('.pass-confirmation [role=alert]')).toBeVisible();expect(await wallet()).toBe(before-480)
 await page.locator('#confirm-pass-payment').click();await expect(page.locator('#confirm-pass-payment')).toBeDisabled();await expect(page.locator('#cancel-pass')).toBeDisabled();await expect(page.getByRole('button',{name:'Close',exact:true})).toBeDisabled();await page.keyboard.press('Escape');await expect(page.locator('.pass-confirmation')).toBeVisible();await expect.poll(()=>typeof release).toBe('function');release!();await selected(page);expect(keys).toHaveLength(3);expect(new Set(keys).size).toBe(1);expect(await wallet()).toBe(before-480)
 const ledger=await(await request.get('http://127.0.0.1:3001/wallet/ledger',{headers})).json();expect(ledger.items.filter((r:{amount:number})=>r.amount===-480)).toHaveLength(1)
})
