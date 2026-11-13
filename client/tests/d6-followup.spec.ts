import {test,expect} from '@playwright/test'
test('real global visibility and account logout',async({page,request})=>{
 test.setTimeout(120000)
 const root='http://127.0.0.1:3179'
 const seed=async()=>{const r=await request.post(root+'/__c5/seed',{data:{mode:'read'}});expect(r.ok()).toBeTruthy();return r.json()}
 const a=await seed(),b=await seed(),headers={Authorization:`Bearer ${a.token}`}
 const own=await (await request.get(root+'/profiles/me',{headers})).json()
 const other=()=>request.get(root+'/profiles/'+own.id,{headers:{Authorization:`Bearer ${b.token}`}})
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click()
 await page.locator('#auth-email').fill(a.email);await page.locator('#auth-password').fill(a.password)
 const signed=page.waitForResponse(r=>r.url().endsWith('/auth/login')&&r.request().method()==='POST')
 await page.locator('#auth-form button.primary').click();const session=await (await signed).json()
 await page.getByRole('button',{name:'Meet your letters'}).click();await page.locator('#open-profile').click();await page.locator('#profile-global-visibility').click()
 await expect(page.locator('#global-profile-visibility small')).toHaveText('Everyone')
 await page.screenshot({path:'docs/d6-followup/profile-visibility.png'})
 expect((await other()).status()).toBe(200)
 for(const scope of ['friends','only_me','everyone'] as const){
  await page.locator('#global-profile-visibility').click();await page.locator(`[data-visibility="${scope}"]`).click()
  await page.screenshot({path:`docs/d6-followup/visibility-${scope}.png`})
  await page.locator('#save-visibility').click();await expect(page.getByRole('dialog')).toHaveCount(0)
  expect((await other()).status()).toBe(scope==='everyone'?200:403)
  const self=await request.get(root+'/profiles/'+own.id,{headers});expect(self.status()).toBe(200);expect((await self.json()).visibility).toBe(scope)
 }
 await page.locator('#settings-back').click();await page.locator('#privacySettings-settings').click();await expect(page.locator('#global-profile-visibility small')).toHaveText('Everyone')
 await page.locator('#settings-back').click();await page.screenshot({path:'docs/d6-followup/settings.png'})
 await page.locator('#security-settings').click();await page.locator('#account-signin').click();await expect(page.locator('#account-email')).toHaveText(a.email.toLowerCase());await page.screenshot({path:'docs/d6-followup/account.png'})
 await page.locator('.account-security header button').click();await expect(page.locator('#export-data')).toBeVisible();await page.screenshot({path:'docs/d6-followup/security.png'})
 await page.locator('#logout').click();await page.locator('#confirm-logout').click();await expect(page.locator('.auth-content h1')).toBeVisible()
 expect((await request.get(root+'/profiles/me',{headers:{Authorization:`Bearer ${session.token}`}})).status()).toBe(401)
})
