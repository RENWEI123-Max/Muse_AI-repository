import { test, expect } from '@playwright/test'
const api='http://127.0.0.1:3196'
test('F06 wrong code, expired code and resend invalidates old code', async ({page,request})=>{
  const email=`f06-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`
  const mail=async()=>(await (await request.get(`${api}/__f06/mail?email=${encodeURIComponent(email)}`)).json()).code as string
  const enter=async(code:string)=>{await page.locator('#auth-code').fill(code);await page.getByRole('button',{name:'Verify & continue'}).click()}
  await page.clock.install()
  await page.goto('/?auth=forgot')
  await page.locator('#auth-email').fill(email)
  await page.locator('#auth-form').evaluate((form:HTMLFormElement)=>form.requestSubmit())
  await expect.poll(mail).toMatch(/^\d{6}$/)
  const first=await mail()

  await enter(first==='000000'?'111111':'000000')
  await expect(page.locator('#auth-error')).toHaveText('Incorrect verification code. Please try again.')

  await request.post(`${api}/__f06/expire`,{data:{email}})
  await enter(first)
  await expect(page.locator('#auth-error')).toHaveText('Verification code expired. Please request a new code.')

  await expect(page.locator('#resend-email')).toBeDisabled()
  await request.post(`${api}/__f06/cooldown`,{data:{email}})
  await page.clock.fastForward(61000)
  await page.locator('#resend-email').click()
  await expect.poll(mail).not.toBe(first)
  const second=await mail()
  expect(second).toMatch(/^\d{6}$/)
  await expect(page.locator('#resend-email')).toBeDisabled()

  await enter(first)
  await expect(page.locator('#auth-error')).toHaveText('Incorrect verification code. Please try again.')
  await enter(second)
  await expect(page.getByText('Choose a new password')).toBeVisible()
  await expect(page.locator('#auth-error')).toHaveCount(0)
})
