# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: race-before.spec.ts >> race-before D7 thirteen states, real logout/deletion and account isolation
- Location: docs/ui-redo/r21-r24-fixes/race-before.spec.ts:7:1

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('#unlock-pin')

```

# Page snapshot

```yaml
- main "MauGo" [ref=f2e3]:
  - generic [ref=f2e5]:
    - generic:
      - img "MauGo"
      - generic:
        - button "Bird appearance" [ref=f2e6] [cursor=pointer]
        - button "Filters" [ref=f2e7] [cursor=pointer]
    - generic:
      - generic [aria-hidden]: ✦
      - generic [aria-hidden]: ✦
      - generic [aria-hidden]: ✦
      - button "Tap the hat to meet three new letters" [ref=f2e8] [cursor=pointer]:
        - img "A black magic hat with a glowing green ribbon" [ref=f2e9]
    - paragraph [ref=f2e10]: Everyone
    - paragraph: No letters yet. Try a wider search.
    - generic [ref=f2e11]:
      - button "Diamonds" [ref=f2e12] [cursor=pointer]
      - button "Filter Pass ›" [ref=f2e13] [cursor=pointer]
    - generic [ref=f2e14]:
      - button "Edit filters" [ref=f2e15] [cursor=pointer]
      - button "Write a letter" [ref=f2e17] [cursor=pointer]: Send a letter
    - navigation [ref=f2e18]:
      - button "Home" [ref=f2e19] [cursor=pointer]
      - button "Messages" [ref=f2e20] [cursor=pointer]
      - button "My profile" [ref=f2e21] [cursor=pointer]: Profile
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test'
  2  | async function login(page:Page,u:{email:string;password:string},pin?:string){
  3  |  console.log('login navigation', {pinExpected:!!pin,previousSessionStillPresent:await page.evaluate(()=>!!localStorage.getItem('maugo-token')).catch(()=>false)});
> 4  |  await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);const signed=page.waitForResponse(r=>r.url().endsWith('/auth/login')&&r.request().method()==='POST');await page.getByRole('button',{name:'Sign in',exact:true}).click();const session=await (await signed).json();await page.getByRole('button',{name:'Meet your letters'}).click();if(pin){await page.locator('#unlock-pin').fill(pin);await page.locator('#unlock-session').click()}await page.locator('#open-profile').click();await page.locator('#open-settings').click();await page.locator('#security-settings').click();await expect(page.locator('#account-signin')).toBeVisible();return session.token
     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  5  | }
  6  | async function shot(page:Page,id:string){await page.waitForTimeout(300);await page.screenshot({path:`docs/ui-redo/r21-r24-fixes/race-${id}.png`})}
  7  | test('race-before D7 thirteen states, real logout/deletion and account isolation',async({page,request})=>{
  8  |  test.setTimeout(30000)
  9  |  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  10 |  const make=async()=>{const r=await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode:'read'}});expect(r.ok()).toBeTruthy();return r.json()}
  11 |  const a=await make(),b=await make();const headers=(u:any)=>({Authorization:`Bearer ${u.token}`})
  12 |  const snapshot=async(u:any)=>(await request.get('http://127.0.0.1:3001/users/me/export',{headers:headers(u)})).json()
  13 |  const aBefore=await snapshot(a);let bBefore=await snapshot(b)
  14 |  const sessionA=await login(page,a);await shot(page,'security');await page.locator('#account-signin').click();await expect(page.locator('#account-email')).toHaveText(a.email.toLowerCase());await shot(page,'account-info');await page.locator('.account-security header button').click()
  15 |  await page.locator('#identity-verification').click();await expect(page.locator('.account-body')).toContainText('Not connected');await shot(page,'verification');await page.getByRole('button',{name:'Back to security'}).click()
  16 |  await page.locator('#app-lock').click();await shot(page,'pin-create');await page.locator('#lock-pin').fill('12');await page.locator('#save-lock').click();await expect(page.locator('.account-security [role=alert]')).toHaveText('Enter a 4-digit PIN.');await shot(page,'pin-invalid');await page.locator('#lock-pin').fill('1234');await page.locator('#save-lock').click();await expect(page.locator('#app-lock')).toContainText('On')
  17 |  await page.locator('#lock-now').click();await shot(page,'pin-locked');await page.keyboard.press('Escape');await expect(page.locator('#unlock-pin')).toBeVisible();await page.locator('#unlock-pin').fill('0000');await page.locator('#unlock-session').click();await expect(page.locator('.account-security [role=alert]')).toHaveText('Incorrect PIN.');await shot(page,'pin-wrong');await page.locator('#unlock-pin').fill('1234');await page.locator('#unlock-session').click();await expect(page.getByRole('dialog')).toHaveCount(0)
  18 |  // Backgrounding locks the complete app, including when settings is closed.
  19 |  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await expect(page.locator('#unlock-pin')).toBeVisible();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false})});await page.locator('#unlock-pin').fill('1234');await page.locator('#unlock-session').click()
  20 |  await page.locator('#logout').click();await shot(page,'signout-confirm');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('#logout')).toBeVisible();await page.locator('#logout').click();await page.locator('#confirm-logout').click();await expect(page.locator('.auth-content h1')).toBeVisible();await shot(page,'signed-out');expect((await request.get('http://127.0.0.1:3001/users/me/export',{headers:{Authorization:`Bearer ${sessionA}`}})).status()).toBe(401);await expect(page.locator('.account-security')).toHaveCount(0)
  21 |  // Sign into another real database account: no first account email, lock or records.
  22 |  await login(page,b);await expect(page.locator('#app-lock')).toContainText('Off');await page.locator('#account-signin').click();await expect(page.locator('#account-email')).toHaveText(b.email.toLowerCase());await expect(page.locator('.account-security')).not.toContainText(a.email.toLowerCase());await shot(page,'account-isolation');await page.locator('.account-security header button').click();await page.locator('#logout').click();await page.locator('#confirm-logout').click()
  23 |  bBefore=await snapshot(b);const denied=await request.get(`http://127.0.0.1:3001/conversations/${aBefore.conversations[0].id}/messages`,{headers:headers(b)});expect([403,404]).toContain(denied.status());await login(page,a,'1234');await page.locator('#app-lock').click();await page.locator('#lock-pin').fill('0000');await page.locator('#save-lock').click();await expect(page.locator('.account-security [role=alert]')).toHaveText('Incorrect PIN.');await page.locator('#lock-pin').fill('1234');await page.locator('#save-lock').click();await expect(page.locator('#app-lock')).toContainText('Off')
  24 |  await page.locator('#delete-local').click();await expect(page.locator('#request-account-deletion')).toBeDisabled();await shot(page,'delete-disabled');await page.locator('#delete-account-input').fill('DELETE');await expect(page.locator('#request-account-deletion')).toBeDisabled();await shot(page,'delete-typed');await page.locator('#delete-account-check').check();await expect(page.locator('#request-account-deletion')).toBeEnabled();await shot(page,'delete-ready');await page.locator('#request-account-deletion').click();await expect(page.locator('#confirm-account-deletion')).toBeDisabled();await shot(page,'delete-final')
  25 |  await page.locator('#deletion-password').fill('WrongPass2026');await page.locator('#confirm-account-deletion').click();await expect(page.locator('.account-security [role=alert]')).toBeVisible();await expect(page.locator('#deletion-password')).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('#request-account-deletion')).toBeEnabled()
  26 |  // No deletion on cancellation or wrong password.
  27 |  expect((await snapshot(a)).profile.id).toEqual(aBefore.profile.id)
  28 |  await page.locator('#request-account-deletion').click();await page.locator('#deletion-password').fill(a.password);await page.locator('#confirm-account-deletion').click();await expect(page.locator('.auth-content h1')).toBeVisible();await shot(page,'deleted-welcome')
  29 |  expect((await request.get('http://127.0.0.1:3001/users/me/export',{headers:headers(a)})).status()).toBe(401)
  30 |  const bAfter=await snapshot(b);for(const key of ['profile','conversations','messages','posts','wallet','collections'])expect(bAfter[key]).toEqual(bBefore[key])
  31 |  await login(page,b);await page.locator('#account-signin').click();await expect(page.locator('#account-email')).toHaveText(b.email.toLowerCase())
  32 |  expect(errors).toEqual([])
  33 | })
  34 |
  35 |
  36 | test.beforeEach(async({page})=>{let logouts=0;await page.route('**/auth/logout',async route=>{const response=await route.fetch();if(++logouts===2)await new Promise(r=>setTimeout(r,500));try{await route.fulfill({response})}catch{console.log('logout response lost after navigation')}})})
  37 |
```
