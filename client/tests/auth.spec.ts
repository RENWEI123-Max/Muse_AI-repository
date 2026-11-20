import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
const states = JSON.parse(readFileSync(new URL('./module01.json',import.meta.url),'utf8'))
test('19 prototype states', async ({page}) => {
  test.setTimeout(90000)
  await page.addInitScript(() => Object.assign(window,{CapacitorCustomPlatform:{name:'ios'}}))
  await page.route('**/api/auth/code/send', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({sent:true,retryAfter:60})}))
  const failures: string[]=[]
  for(const state of states) {
    const mode=state.task.replace('auth:','')
    await page.goto(mode==='welcome'?'/':`/?auth=${mode==='policy'?'privacy':mode}`)
    if(mode==='apple'){
      await page.locator('#accept-terms').check()
      await page.locator('#terms-continue').click()
    }
    if(['verify','recovery'].includes(mode)) await page.goto(`/?auth=${mode}&email=reader@example.com`)
    for(const action of state.actions) {
      const [kind,selector,value]=action
      const field=page.locator(String(selector))
      if(kind==='fill')await field.fill(String(value))
      if(kind==='check')await field.setChecked(Boolean(value))
      if(kind==='click')await field.click()
      if(kind==='submit')await field.evaluate((form:HTMLFormElement)=>form.requestSubmit())
    }
    if(state.id==='terms-unchecked')await expect(page.locator('#terms-continue')).toBeDisabled()
    if(state.id==='terms-checked')await expect(page.locator('#terms-continue')).toBeEnabled()
    if(['signin-invalid','signup-mismatch','new-password-error','verify-error'].includes(state.id))await expect(page.locator('.auth-flow .ui-toast')).toBeVisible()
    if(state.id==='verify-resend')await expect(page.locator('#resend-email')).toBeDisabled()
    if(state.id==='apple-private')await expect(page.locator('#apple-hide')).toHaveAttribute('aria-pressed','true')
    if(state.id==='apple-share')await expect(page.locator('#apple-share')).toHaveAttribute('aria-pressed','true')
    await page.screenshot({path:`test-results/module01/${state.id}.png`})
    failures.push(state.id)
  }
  expect(failures).toHaveLength(19)
})
test('real database signup, SMTP failure, wrong code, logout and login', async ({page})=>{
  const email=`c2-${Date.now()}@example.test`
  await page.goto('/')
  await page.getByRole('button',{name:'Create an account',exact:true}).click()
  await expect(page.locator('#accept-terms')).not.toBeChecked()
  await page.locator('#accept-terms').check()
  await page.locator('#terms-continue').click()
  await page.locator('#auth-name').fill('A little wanderer')
  await page.locator('#auth-email').fill(email)
  await page.locator('#auth-password').fill('ClientTest2026!')
  await page.locator('#auth-confirm').fill('ClientTest2026!')
  await page.getByRole('button',{name:'Create account',exact:true}).click()
  await expect(page.locator('.auth-flow .ui-toast')).toContainText('Email delivery is unavailable')
  await page.locator('#auth-code').fill('000000')
  await page.getByRole('button',{name:'Verify & continue'}).click()
  await expect(page.locator('.auth-flow .ui-toast')).toContainText('Incorrect verification code')
  await page.getByRole('button',{name:'Sign out',exact:true}).click()
  await page.getByRole('button',{name:'Continue with email'}).click()
  await page.locator('#accept-terms').check()
  await page.locator('#terms-continue').click()
  await page.locator('#auth-email').fill(email)
  await page.locator('#auth-password').fill('ClientTest2026!')
  await page.getByRole('button',{name:'Sign in',exact:true}).click()
  await expect(page.getByText('You are signed in.')).toBeVisible()
  await page.getByRole('button',{name:'Sign out',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Welcome to MauGo'})).toBeVisible()
})
test('empty email validation and Apple entry hidden on the web',async({page})=>{
 await page.goto('/?auth=signin')
 await page.locator('#auth-form').evaluate((form:HTMLFormElement)=>form.requestSubmit())
 await expect(page.locator('.auth-flow .ui-toast')).toHaveText('Enter a valid email address.')
 for(const url of ['/','/?auth=apple']){
  await page.goto(url)
  await expect(page.getByRole('button',{name:'Continue with email'})).toBeVisible()
  await expect(page.getByRole('button',{name:'Continue with Apple'})).toHaveCount(0)
 }
})

for(const outcome of ['success','cancelled','native error','server error'] as const){
 test(`native Apple sign-in: ${outcome}`,async({page})=>{
  await page.addInitScript(result => {
   Object.assign(window,{
    CapacitorCustomPlatform:{name:'ios'},
    Capacitor:{
     PluginHeaders:[{name:'AppleSignIn',methods:[{name:'authorize',rtype:'promise'}]}],
     nativePromise: async () => {
      if(result==='cancelled') throw Object.assign(new Error('Cancelled'),{code:'APPLE_SIGN_IN_CANCELLED'})
      if(result==='native error') throw new Error('Native authorization unavailable')
      return {identityToken:'fixture-identity-token',givenName:'Little',familyName:'Bird',email:'unused@example.test'}
     }
    }
   })
  },outcome)
  const appleRequests: unknown[]=[]
  await page.route('**/api/**', route=>{
   if(!route.request().url().endsWith('/auth/apple'))return route.fulfill({json:{items:[],cities:[],responses:[]}})
   appleRequests.push(route.request().postDataJSON())
   if(outcome==='server error')return route.fulfill({status:401,json:{message:'Invalid Apple identityToken'}})
   return route.fulfill({json:{id:'apple-account',token:'apple-session'}})
  })

  await page.goto('/')
  await page.getByRole('button',{name:'Continue with Apple'}).click()
  await expect(page.locator('#terms-continue')).toBeDisabled()
  await page.locator('#accept-terms').check()
  await page.locator('#terms-continue').click()
  await expect(page.getByText('Use your Apple ID to sign in to MauGo.')).toBeVisible()
  await page.getByRole('button',{name:'Continue with Apple'}).click()
  if(outcome==='success'){
   await expect(page.locator('.home-flow')).toBeVisible()
   expect(await page.evaluate(()=>[localStorage.getItem('maugo-account'),localStorage.getItem('maugo-token')])).toEqual(['apple-account','apple-session'])
  }else if(outcome==='cancelled'){
   await expect(page.locator('.welcome-screen')).toBeVisible()
   await expect(page.locator('.ui-toast')).toHaveCount(0)
  }else{
   await expect(page.locator('.auth-flow .ui-toast')).toHaveText(outcome==='native error'?'Native authorization unavailable':'Invalid Apple identityToken')
  }
  expect(appleRequests).toEqual(outcome==='success'||outcome==='server error'?
   [{identityToken:'fixture-identity-token',givenName:'Little',familyName:'Bird',privacyVersion:'1.0',termsVersion:'1.0'}]:[])
 })
}
