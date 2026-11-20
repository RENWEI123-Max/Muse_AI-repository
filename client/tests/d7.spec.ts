import {test,expect,type Page} from '@playwright/test'
async function login(page:Page,u:{email:string;password:string},pin?:string){
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);const signed=page.waitForResponse(r=>r.url().endsWith('/auth/login')&&r.request().method()==='POST');await page.getByRole('button',{name:'Sign in',exact:true}).click();const session=await (await signed).json();if(pin){await page.locator('#unlock-pin').fill(pin);await page.locator('#unlock-session').click()}await page.locator('#open-profile').click();await page.locator('#open-settings').click();await page.locator('#security-settings').click();await expect(page.locator('#account-signin')).toBeVisible();return session.token
}
async function shot(page:Page,id:string){await page.waitForTimeout(300);await page.screenshot({path:`${process.env.D7_SCREENSHOT_DIR||'docs'}/d7-${id}.png`})}
test('D7 thirteen states, real logout/deletion and account isolation',async({page,request})=>{
 test.setTimeout(120000)
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 const signOut=page.locator('.account-body').getByRole('button',{name:'Sign out',exact:true})
 const make=async()=>{const r=await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode:'read'}});expect(r.ok()).toBeTruthy();return r.json()}
 const a=await make(),b=await make();const headers=(u:any)=>({Authorization:`Bearer ${u.token}`})
 const snapshot=async(u:any)=>(await request.get('http://127.0.0.1:3001/users/me/export',{headers:headers(u)})).json()
 const aBefore=await snapshot(a);let bBefore=await snapshot(b)
 const sessionA=await login(page,a)
 await expect(page.locator('.account-security .account-group button')).toHaveText([/^Preview account/,/^Password recovery/,/^App lock/,/^Identity verification/,/^Export my data/,/^Delete account/])
 await shot(page,'security');await page.locator('#account-signin').click();await expect(page.locator('#account-email')).toHaveText(a.email.toLowerCase());await shot(page,'account-info');await page.locator('.account-security header button').click()
 await page.locator('#identity-verification').click();await expect(page.locator('.account-body')).toContainText('Not connected');await shot(page,'verification');await page.getByRole('button',{name:'Back to security'}).click()
 await page.locator('#app-lock').click();await shot(page,'pin-create');await page.locator('#lock-pin').fill('12');await page.locator('#save-lock').click();await expect(page.locator('.account-security .ui-toast')).toHaveText('Enter a 4-digit PIN.');await shot(page,'pin-invalid');await page.locator('#lock-pin').fill('1234');await page.locator('#save-lock').click();await expect(page.locator('#app-lock')).toContainText('On')
 await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await expect(page.locator('#unlock-pin')).toBeVisible();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false})});await shot(page,'pin-locked');await page.locator('#unlock-pin').press('Escape');await expect(page.locator('#unlock-pin')).toBeVisible();await page.locator('#unlock-pin').fill('0000');await page.locator('#unlock-session').click();await expect(page.locator('.account-security .ui-toast')).toHaveText('Incorrect PIN.');await shot(page,'pin-wrong');await page.locator('#unlock-pin').fill('1234');await page.locator('#unlock-session').click();await expect(page.getByRole('dialog')).toHaveCount(0)
 // Backgrounding locks the complete app when the security page is closed.
 await page.locator('.account-security header button').click();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await expect(page.locator('#unlock-pin')).toBeVisible();await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false})});await page.locator('#unlock-pin').fill('1234');await page.locator('#unlock-session').click()
 await page.locator('#security-settings').click();await page.locator('#account-signin').click();await signOut.click();await shot(page,'signout-confirm');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(signOut).toBeVisible();await signOut.click();await page.locator('#confirm-logout').click();await expect(page.locator('.auth-content h1')).toBeVisible();await shot(page,'signed-out');expect((await request.get('http://127.0.0.1:3001/users/me/export',{headers:{Authorization:`Bearer ${sessionA}`}})).status()).toBe(401);await expect(page.locator('.account-security')).toHaveCount(0)
 // Sign into another real database account: no first account email, lock or records.
 await login(page,b);await expect(page.locator('#app-lock')).toContainText('Off');await page.locator('#account-signin').click();await expect(page.locator('#account-email')).toHaveText(b.email.toLowerCase());await expect(page.locator('.account-security')).not.toContainText(a.email.toLowerCase());await shot(page,'account-isolation');await signOut.click();await page.locator('#confirm-logout').click();await expect(page.locator('.auth-content h1')).toBeVisible();await expect(page.locator('.account-security')).toHaveCount(0)
 bBefore=await snapshot(b);const denied=await request.get(`http://127.0.0.1:3001/conversations/${aBefore.conversations[0].id}/messages`,{headers:headers(b)});expect([403,404]).toContain(denied.status());await login(page,a,'1234');await page.locator('#app-lock').click();await page.locator('#lock-pin').fill('0000');await page.locator('#save-lock').click();await expect(page.locator('.account-security .ui-toast')).toHaveText('Incorrect PIN.');await page.locator('#lock-pin').fill('1234');await page.locator('#save-lock').click();await expect(page.locator('#app-lock')).toContainText('Off')
 await page.locator('#delete-local').click();await expect(page.locator('#request-account-deletion')).toBeDisabled();await shot(page,'delete-disabled');await page.locator('#delete-account-input').fill('DELETE');await expect(page.locator('#request-account-deletion')).toBeDisabled();await shot(page,'delete-typed');await page.locator('#delete-account-check').check();await expect(page.locator('#request-account-deletion')).toBeEnabled();await shot(page,'delete-ready');await page.locator('#request-account-deletion').click();await expect(page.locator('#confirm-account-deletion')).toBeDisabled();await shot(page,'delete-final')
 await page.locator('#deletion-password').fill('WrongPass2026');await page.locator('#confirm-account-deletion').click();await expect(page.locator('.account-security .ui-toast')).toBeVisible();await expect(page.locator('#deletion-password')).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('#request-account-deletion')).toBeEnabled()
 // No deletion on cancellation or wrong password.
 expect((await snapshot(a)).profile.id).toEqual(aBefore.profile.id)
 await page.locator('#request-account-deletion').click();await page.locator('#deletion-password').fill(a.password);await page.locator('#confirm-account-deletion').click();await expect(page.locator('.auth-content h1')).toBeVisible();await shot(page,'deleted-welcome')
 expect((await request.get('http://127.0.0.1:3001/users/me/export',{headers:headers(a)})).status()).toBe(401)
 const bAfter=await snapshot(b);for(const key of ['profile','conversations','messages','posts','wallet','collections'])expect(bAfter[key]).toEqual(bBefore[key])
 await login(page,b);await page.locator('#account-signin').click();await expect(page.locator('#account-email')).toHaveText(b.email.toLowerCase())
 expect(errors).toEqual([])
})

test('D7 full migration schema serves profile and letters without 500',async({request})=>{
 const signed=await request.post('http://127.0.0.1:3001/auth/signup',{data:{email:`r25-schema-${Date.now()}@test.local`,password:'SamplePass2026',termsVersion:'1.0',privacyVersion:'1.0'}})
 expect(signed.status()).toBe(201)
 const user=await signed.json(),headers={Authorization:`Bearer ${user.token}`}
 for(const path of ['/profiles/me','/letters']){
  const response=await request.get('http://127.0.0.1:3001'+path,{headers})
  console.log('D7 migrated schema',path,response.status())
  expect(response.status(),path+' '+await response.text()).toBe(200)
 }
})

test('D7 password recovery submits the email code with the new password',async({page,request},testInfo)=>{
 const backend='http://127.0.0.1:3001'
 const email=`d7-recovery-${Date.now()}@example.test`,password='OldPassword2026!',newPassword='NewPassword2026!'
 const consent={termsVersion:'1.0',privacyVersion:'1.0'}
 const signup=await request.post(backend+'/auth/signup',{data:{email,password,...consent}})
 expect(signup.status()).toBe(201)
 const {id}=await signup.json()
 const priorToken=await login(page,{email,password})
 const steps: Record<string,number>={}
 const authCalls:string[]=[]
 page.on('request',req=>{
  const path=new URL(req.url()).pathname
  if(path.startsWith('/api/auth/'))authCalls.push(path)
 })
 const row=page.getByRole('button',{name:'Password recovery',exact:true})
 await expect(row).toBeEnabled()
 await page.screenshot({path:testInfo.outputPath('security-password-recovery.png')})
 expect(await page.locator('.account-group > button').evaluateAll(rows=>rows.slice(0,3).map(row=>row.id)))
  .toEqual(['account-signin','account-recovery','app-lock'])

 const sent=page.waitForResponse(r=>r.url().endsWith('/auth/code/send'))
 await row.click()
 const sendResponse=await sent
 steps.send=sendResponse.status()
 expect(steps.send).toBe(200)
 expect(sendResponse.request().postDataJSON()).toEqual({email})
 await expect(page.getByRole('heading',{name:'Password recovery'})).toBeVisible()
 await expect(page.locator('.account-body')).toContainText(email)
 const mail=await request.get(backend+'/__d7/recovery-mail',{params:{email}})
 expect(mail.status()).toBe(200)
 const {code}=await mail.json()
 expect(code).toMatch(/^\d{6}$/)
 const codeField=page.getByLabel('6-digit code')
 const submit=page.getByRole('button',{name:'Update password'})
 await page.getByLabel('New password',{exact:true}).fill(newPassword)
 await page.getByLabel('Confirm password',{exact:true}).fill(newPassword)

 await codeField.fill(code==='000000'?'111111':'000000')
 let reset=page.waitForResponse(r=>r.url().endsWith('/auth/password/reset'))
 await submit.click()
 steps.wrongCode=(await reset).status()
 expect(steps.wrongCode).toBe(401)
 await expect(page.getByText('Incorrect verification code. Please try again.')).toBeVisible()

 await codeField.fill(code)
 reset=page.waitForResponse(r=>r.url().endsWith('/auth/password/reset'))
 await submit.click()
 const resetResponse=await reset
 steps.correctCode=resetResponse.status()
 expect(steps.correctCode).toBe(200)
 expect(resetResponse.request().postDataJSON()).toEqual({email,code,newPassword})
 expect(await resetResponse.json()).toEqual({reset:true})
 expect(authCalls).toEqual(['/api/auth/code/send','/api/auth/password/reset','/api/auth/password/reset'])
 await expect(page.getByRole('heading',{name:'Welcome to MauGo'})).toBeVisible()
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('maugo-token'))).toBeNull()
 expect((await request.get(backend+'/users/me/export',{headers:{Authorization:`Bearer ${priorToken}`}})).status()).toBe(401)

 await page.getByRole('button',{name:'Continue with email'}).click()
 await page.locator('#accept-terms').check()
 await page.locator('#terms-continue').click()
 await page.locator('#auth-email').fill(email)
 const signIn=page.getByRole('button',{name:'Sign in',exact:true})
 const loginResponse=()=>page.waitForResponse(r=>r.url().endsWith('/auth/login'))
 await page.locator('#auth-password').fill(password)
 let signed=loginResponse()
 await signIn.click()
 steps.oldPassword=(await signed).status()
 expect(steps.oldPassword).toBe(401)
 await expect(page.getByText('Invalid email or password')).toBeVisible()
 await page.locator('#auth-password').fill(newPassword)
 signed=loginResponse()
 await signIn.click()
 const newSession=await signed
 steps.newPassword=newSession.status()
 expect(steps.newPassword).toBe(200)
 expect((await newSession.json()).id).toBe(id)
 await expect(page.locator('.home-flow')).toBeVisible()
 console.log('Password recovery HTTP results',JSON.stringify(steps))
})

for(const lang of ['en','ko'] as const)test(`D7 signed-out password recovery (${lang})`,async({page,request},testInfo)=>{
 const backend='http://127.0.0.1:3001'
 const email=`d7-forgot-${lang}-${Date.now()}@example.test`
 const password='OldPassword2026!',newPassword='NewPassword2026!'
 const signup=await request.post(backend+'/auth/signup',{data:{email,password,termsVersion:'1.0',privacyVersion:'1.0'}})
 expect(signup.status()).toBe(201)
 const {id}=await signup.json()
 await page.addInitScript(language=>localStorage.setItem('maugo-language',language),lang)
 await page.goto('/?auth=consent')
 await page.locator('#accept-terms').check()
 await page.locator('#terms-continue').click()
 const flow=page.locator('.auth-flow')
 const form=page.locator('#auth-form')
 const submit=form.locator('.auth-main')
 const toast=flow.getByRole('status')
 await expect(flow).toHaveAttribute('data-auth-mode','signin')
 expect(await page.evaluate(()=>localStorage.getItem('maugo-token'))).toBeNull()

 const authCalls:string[]=[]
 page.on('request',req=>{
  const path=new URL(req.url()).pathname.replace(/^\/api\//,'/')
  if(path.startsWith('/auth/'))authCalls.push(`${req.method()} ${path}`)
 })
 const response=(path:string)=>page.waitForResponse(r=>r.request().method()==='POST'&&r.url().endsWith(path))
 const steps: Record<string,number>={}
 await form.locator('.auth-link').click()
 await expect(flow).toHaveAttribute('data-auth-mode','forgot')
 await form.locator('#auth-email').fill(email)
 const sent=response('/auth/code/send')
 await submit.click()
 const sendResponse=await sent
 steps.send=sendResponse.status()
 expect(steps.send).toBe(200)
 expect(sendResponse.request().postDataJSON()).toEqual({email})
 await expect(flow).toHaveAttribute('data-auth-mode','password')
 await expect(flow.locator('.auth-address')).toHaveText(email)
 await expect(flow.locator('#resend-email')).toBeDisabled()

 const mail=await request.get(backend+'/__d7/recovery-mail',{params:{email}})
 steps.mail=mail.status()
 expect(steps.mail).toBe(200)
 const {code}=await mail.json()
 expect(code).toMatch(/^\d{6}$/)
 const wrongCode=code==='000000'?'111111':'000000'
 const codeField=form.locator('#auth-code')
 await codeField.fill(wrongCode)
 await form.locator('#auth-password').fill(newPassword)
 await form.locator('#auth-confirm').fill(newPassword)
 let reset=response('/auth/password/reset')
 await submit.click()
 const rejected=await reset
 steps.wrongCode=rejected.status()
 expect(steps.wrongCode).toBe(401)
 expect(rejected.request().postDataJSON()).toEqual({email,code:wrongCode,newPassword})
 await expect(toast).toHaveText(lang==='ko'?'인증 코드가 올바르지 않아요. 다시 입력하세요.':'Incorrect verification code. Please try again.')
 await expect(flow).toHaveAttribute('data-auth-mode','password')
 await expect(codeField).toHaveValue(wrongCode)
 await page.screenshot({path:testInfo.outputPath('wrong-code.png')})

 // Correct only the code and use the very same email delivery.
 await codeField.fill(code)
 reset=response('/auth/password/reset')
 await submit.click()
 const updated=await reset
 steps.correctCode=updated.status()
 expect(steps.correctCode).toBe(200)
 expect(updated.request().postDataJSON()).toEqual({email,code,newPassword})
 expect(await updated.json()).toEqual({reset:true})
 const recoveryCalls=['POST /auth/code/send','POST /auth/password/reset','POST /auth/password/reset']
 expect(authCalls).toEqual(recoveryCalls)
 await expect(flow).toHaveAttribute('data-auth-mode','signin')
 await expect(toast).toHaveText(lang==='ko'?'비밀번호가 변경됐어요. 새 비밀번호로 로그인하세요.':'Password updated. Sign in with your new password.')
 await expect(form.locator('#auth-email')).toHaveValue(email)
 await expect(form.locator('#auth-password')).toHaveValue('')
 await page.screenshot({path:testInfo.outputPath('reset-success.png')})

 await form.locator('#auth-password').fill(password)
 let signed=response('/auth/login')
 await submit.click()
 steps.oldPassword=(await signed).status()
 expect(steps.oldPassword).toBe(401)
 await expect(toast).toBeVisible()
 await expect(flow).toHaveAttribute('data-auth-mode','signin')
 await form.locator('#auth-password').fill(newPassword)
 signed=response('/auth/login')
 await submit.click()
 const newSession=await signed
 steps.newPassword=newSession.status()
 expect(steps.newPassword).toBe(200)
 expect((await newSession.json()).id).toBe(id)
 await expect(page.locator('.home-flow')).toBeVisible()
 expect(authCalls).toEqual([...recoveryCalls,'POST /auth/login','POST /auth/login'])
 console.log('Signed-out password recovery',JSON.stringify({lang,steps,authCalls,originalAccount:true}))
})
