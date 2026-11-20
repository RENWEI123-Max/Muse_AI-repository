import { test, expect } from '@playwright/test'
const api='http://127.0.0.1:3001'
test('F06 wrong code, expired code and resend invalidates old code', async ({page,request})=>{
  const email=`f06-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  const signup=await request.post(`${api}/auth/signup`,{data:{email,password:'OldPassword2026!',termsVersion:'1.0',privacyVersion:'1.0'}})
  expect(signup.status()).toBe(201)
  const mail=async()=>(await (await request.get(`${api}/__f06/mail?email=${encodeURIComponent(email)}`)).json()).code as string
  const enter=async(code:string)=>{
    await page.locator('#auth-code').fill(code)
    const result=page.waitForResponse(r=>r.url().endsWith('/auth/password/reset'))
    await page.getByRole('button',{name:'Update password'}).click()
    return (await result).status()
  }
  await page.clock.install()
  await page.goto('/?auth=forgot')
  await page.locator('#auth-email').fill(email)
  await page.locator('#auth-form').evaluate((form:HTMLFormElement)=>form.requestSubmit())
  await expect.poll(mail).toMatch(/^\d{6}$/)
  const first=await mail()
  const newPassword='NewPassword2026!'
  await page.locator('#auth-password').fill(newPassword)
  await page.locator('#auth-confirm').fill(newPassword)

  expect(await enter(first==='000000'?'111111':'000000')).toBe(401)
  await expect(page.locator('.auth-flow .ui-toast')).toHaveText('Incorrect verification code. Please try again.')

  await request.post(`${api}/__f06/expire`,{data:{email}})
  expect(await enter(first)).toBe(410)
  await expect(page.locator('.auth-flow .ui-toast')).toHaveText('Verification code expired. Please request a new code.')

  await expect(page.locator('#resend-email')).toBeDisabled()
  await request.post(`${api}/__f06/cooldown`,{data:{email}})
  await page.clock.fastForward(61000)
  await page.locator('#resend-email').click()
  await expect.poll(mail).not.toBe(first)
  const second=await mail()
  expect(second).toMatch(/^\d{6}$/)
  await expect(page.locator('#resend-email')).toBeDisabled()

  expect(await enter(first)).toBe(401)
  await expect(page.locator('.auth-flow .ui-toast')).toHaveText('Incorrect verification code. Please try again.')
  expect(await enter(second)).toBe(200)
  await expect(page.getByRole('heading',{name:'Welcome back'})).toBeVisible()
  await expect(page.locator('.auth-flow .ui-toast')).toHaveText('Password updated. Sign in with your new password.')
})
