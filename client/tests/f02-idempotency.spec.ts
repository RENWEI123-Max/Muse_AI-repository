import { test, expect, type Page, type APIRequestContext } from '@playwright/test'

async function enter(page: Page, request: APIRequestContext) {
 const response = await request.post('http://127.0.0.1:3001/__c3/seed')
 expect(response.ok()).toBeTruthy()
 const user = await response.json()
 await page.goto('/?auth=consent')
 await page.locator('#accept-terms').check()
 await page.locator('#terms-continue').click()
 await page.locator('#auth-email').fill(user.email)
 await page.locator('#auth-password').fill(user.password)
 await page.getByRole('button', { name: 'Sign in', exact: true }).click()
 await expect(page.locator('.letter-bird')).toHaveCount(3)
 const headers = { Authorization: `Bearer ${user.token}` }
 const wallet = async () => {
  const r = await request.get('http://127.0.0.1:3001/wallet', { headers })
  expect(r.ok()).toBeTruthy()
  return (await r.json()).diamonds as number
 }
 const ledger = async () => {
  const r = await request.get('http://127.0.0.1:3001/wallet/ledger', { headers })
  expect(r.ok()).toBeTruthy()
  return (await r.json()).items as { amount: number }[]
 }
 await page.getByRole('button', { name: 'Filters', exact: true }).click()
 return { wallet, ledger }
}

async function choose(page: Page, index = 0) {
 await page.locator('.pass-badge').first().click()
 await page.locator('.pass-plan').nth(index).click()
 await page.locator('#pass-page-buy').click()
 await expect(page.getByRole('dialog', { name: 'Confirm Filter Pass', exact: true })).toBeVisible()
}

async function expectFailure(page: Page) {
 await page.locator('#confirm-pass-payment').click()
 await expect(page.locator('.ui-toast')).toBeVisible()
 await expect(page.locator('#confirm-pass-payment')).toBeEnabled()
}

test('F02: repeated failures and a lost debit response reuse one key and debit once', async ({ page, request }) => {
 const { wallet, ledger } = await enter(page, request)
 const before = await wallet()
 const keys: string[] = []
 await page.route('**/filter-pass/purchase', async route => {
  keys.push(route.request().headers()['idempotency-key']!)
  if (keys.length === 1 || keys.length === 3) {
   await route.fulfill({ status: 503, json: { message: 'Test payment unavailable' } })
  } else if (keys.length === 2) {
   const response = await route.fetch()
   expect(response.ok()).toBeTruthy()
   await route.abort('failed')
  } else {
   await route.continue()
  }
 })
 await choose(page, 2)
 await expectFailure(page)
 expect(await wallet()).toBe(before)
 await page.locator('#cancel-pass').click()
 await choose(page, 2)
 await expectFailure(page)
 expect(await wallet()).toBe(before - 480)
 await expectFailure(page)
 expect(await wallet()).toBe(before - 480)
 await page.locator('#confirm-pass-payment').click()
 await expect(page.locator('.pass-confirmation')).toHaveCount(0)
 expect(keys).toHaveLength(4)
 expect(keys.every(Boolean)).toBeTruthy()
 expect(new Set(keys).size).toBe(1)
 expect(await wallet()).toBe(before - 480)
 expect((await ledger()).filter(r => r.amount === -480)).toHaveLength(1)
})

test('F02: failing plans retain independent keys across switching, every close path and reload', async ({ page, request }) => {
 const { wallet, ledger } = await enter(page, request)
 const before = await wallet()
 const attempts: { days: number; key: string }[] = []
 await page.route('**/filter-pass/purchase', async route => {
  attempts.push({ days: route.request().postDataJSON().days, key: route.request().headers()['idempotency-key']! })
  await route.fulfill({ status: 503, json: { message: 'Test payment unavailable' } })
 })
 // A -> B -> A, then exercise the remaining close paths and reload both plans.
 for (const [index, close] of [[0, 'cancel'], [1, 'close'], [0, 'escape'], [0, 'backdrop']] as const) {
  await choose(page, index)
  await expectFailure(page)
  if (close === 'cancel') await page.locator('#cancel-pass').click()
  if (close === 'close') await page.getByRole('button', { name: 'Close', exact: true }).click()
  if (close === 'escape') await page.keyboard.press('Escape')
  if (close === 'backdrop') await page.locator('.home-veil').click({ position: { x: 8, y: 8 } })
 }
 // Drop the test-only auth=consent entry route when reloading the signed-in app.
 await page.goto('/')
 await expect(page.locator('.letter-bird')).toHaveCount(3)
 await page.getByRole('button', { name: 'Filters', exact: true }).click()
 for (const index of [0, 1]) {
  await choose(page, index)
  await expectFailure(page)
  await page.locator('#cancel-pass').click()
 }
 expect(attempts.map(a => a.days)).toEqual([1, 7, 1, 1, 1, 7])
 const planA = attempts.filter(a => a.days === 1).map(a => a.key)
 const planB = attempts.filter(a => a.days === 7).map(a => a.key)
 expect(attempts.every(a => Boolean(a.key))).toBeTruthy()
 expect(new Set(planA).size).toBe(1)
 expect(new Set(planB).size).toBe(1)
 expect(planA[0]).not.toBe(planB[0])
 expect(await wallet()).toBe(before)
 expect(await ledger()).toHaveLength(0)
})

test('F02: a successful purchase clears its key so extension uses a fresh key', async ({ page, request }) => {
 const { wallet, ledger } = await enter(page, request)
 const before = await wallet()
 const keys: string[] = []
 await page.route('**/filter-pass/purchase', async route => {
  keys.push(route.request().headers()['idempotency-key']!)
  await route.continue()
 })
 for (let i = 0; i < 2; i++) {
  await choose(page, 1)
  if (i === 1) await expect(page.locator('.pass-confirmation h3')).toContainText('Extend')
  await page.locator('#confirm-pass-payment').click()
  await expect(page.locator('.pass-confirmation')).toHaveCount(0)
  expect(await wallet()).toBe(before - (i + 1) * 150)
 }
 expect(keys).toHaveLength(2)
 expect(keys.every(Boolean)).toBeTruthy()
 expect(keys[0]).not.toBe(keys[1])
 expect((await ledger()).filter(r => r.amount === -150)).toHaveLength(2)
})
