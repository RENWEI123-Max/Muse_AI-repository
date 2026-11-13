import {test,expect,type Page} from '@playwright/test'

async function signIn(page:Page,user:{email:string;password:string}){
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click()
 await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill(user.password)
 await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click()
 await page.locator('#open-profile').click();await page.locator('#open-settings').click()
 await expect(page.locator('.settings-flow')).toBeVisible()
}
async function shot(page:Page,state:string){await expect(page.locator('.settings-body')).toHaveCSS('opacity','1');await page.screenshot({path:`docs/d6-${state}.png`})}

test('D6 local settings persistence, states and cache confirmation preserve real account and ledgers',async({page,request})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 const seed=await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode:'read'}});expect(seed.ok()).toBeTruthy();const user=await seed.json()
 const headers={Authorization:`Bearer ${user.token}`}
 const plans=await (await request.get('http://127.0.0.1:3001/filter-pass',{headers})).json()
 const purchase=await request.post('http://127.0.0.1:3001/filter-pass/purchase',{headers:{...headers,'Idempotency-Key':crypto.randomUUID()},data:{days:plans.plans[0].days}});expect(purchase.ok()).toBeTruthy()
 const exported=await request.get('http://127.0.0.1:3001/users/me/export',{headers});expect(exported.ok()).toBeTruthy();const before=await exported.json()
 expect(before.wallet.length).toBeGreaterThan(0);expect(before.collections.length).toBeGreaterThan(0);expect(before.conversations[0].unlocked_at).toBeTruthy()
 await signIn(page,user);await shot(page,'settings-home')
 await page.locator('#language-settings').click();await shot(page,'language-en');await page.locator('[data-language="ko"]').click()
 await expect(page.locator('.settings-flow h1')).toHaveText('언어');await expect(page.locator('html')).toHaveAttribute('lang','ko');await shot(page,'language-ko')
 await signIn(page,user);await expect(page.locator('.settings-flow h1')).toHaveText('설정');await page.locator('#language-settings').click();await expect(page.locator('[data-language="ko"]')).toHaveAttribute('aria-pressed','true')
 await page.locator('[data-language="en"]').click();await page.locator('#settings-back').click();await page.locator('#notifications-settings').click();await shot(page,'notifications-on')
 await page.locator('#incoming-notifications').uncheck();await page.locator('#replies-notifications').uncheck();await page.locator('#system-notifications').uncheck();await page.locator('#allow-notifications').uncheck()
 for(const id of ['incoming','replies','system'])await expect(page.locator(`#${id}-notifications`)).toBeDisabled()
 await shot(page,'notifications-off');await signIn(page,user);await page.locator('#notifications-settings').click();await expect(page.locator('#allow-notifications')).not.toBeChecked();await page.locator('#allow-notifications').check()
 for(const id of ['incoming','replies','system']){await expect(page.locator(`#${id}-notifications`)).not.toBeChecked();await page.locator(`#${id}-notifications`).check()}
 await page.locator('#settings-back').click();await page.locator('#privacySettings-settings').click();await expect(page.locator('#profile-visibility')).toBeDisabled();await shot(page,'privacy-unavailable')
 await page.locator('#settings-back').click();await page.locator('#general-settings').click();await shot(page,'general');await page.locator('#systemFont').check();await expect(page.locator('html')).toHaveClass(/system-font/);await shot(page,'general-font')
 await page.locator('#haptics').uncheck();await page.locator('#recommendations').uncheck();await signIn(page,user);await page.locator('#general-settings').click()
 await expect(page.locator('#systemFont')).toBeChecked();await expect(page.locator('#haptics')).not.toBeChecked();await expect(page.locator('#recommendations')).not.toBeChecked()
 await page.evaluate(()=>{sessionStorage.setItem('chat-draft-d6','Keep this draft');localStorage.setItem('maugo-bird',JSON.stringify({gender:'male',variant:2,motion:true,trails:true}))})
 const beforeCache=await (await request.get('http://127.0.0.1:3001/users/me/export',{headers})).json()
 for(const key of ['wallet','collections','conversations','messages','filterPassPurchases'])expect(beforeCache[key]).toEqual(before[key])
 const stored=await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}))
 let mutations=0;page.on('request',r=>{if(['POST','PATCH','DELETE'].includes(r.method())&&r.url().includes('/api/'))mutations++})
 await page.locator('#clear-cache').click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.settings-veil')).toHaveCSS('opacity','1');await shot(page,'cache-confirm');await page.locator('#cancel-clear-cache').click();await expect(page.getByRole('dialog')).toHaveCount(0)
 await page.locator('#clear-cache').click();await page.locator('#confirm-clear-cache').click();await expect(page.locator('.settings-body [role="status"]')).toContainText('No temporary cache')
 expect(mutations).toBe(0);expect(await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}))).toEqual(stored)
 const after=await (await request.get('http://127.0.0.1:3001/users/me/export',{headers})).json()
 for(const key of ['profile','wallet','collections','conversations','messages','filterPassPurchases'])expect(after[key]).toEqual(beforeCache[key])
 await signIn(page,user);await expect(page.locator('.settings-flow')).toBeVisible();expect(errors).toEqual([])
 // Missing contract is asserted explicitly; these responses do not count as settings integration success.
 expect((await request.get('http://127.0.0.1:3001/settings',{headers})).status()).toBe(404)
 expect((await request.patch('http://127.0.0.1:3001/settings',{headers,data:{}})).status()).toBe(404)
})
