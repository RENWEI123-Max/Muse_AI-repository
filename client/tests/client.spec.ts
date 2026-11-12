import { test, expect } from '@playwright/test'
test('welcome, language entry, preview and circular avatar', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Welcome to MauGo' })).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.device')).toHaveCSS('width', '375px')
  await expect(page.locator('.device')).toHaveCSS('height', '812px')
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(375)
  expect(await page.evaluate(() => document.fonts.check('16px Fredoka'))).toBeTruthy()
  await page.screenshot({ path: 'test-results/welcome-375x812.png' })
  await page.getByRole('button', { name: 'Switch language' }).click()
  await expect(page.getByRole('heading', { name: 'MauGo에 오신 것을 환영해요' })).toBeVisible()
  await page.getByRole('button', { name: 'Switch language' }).click()
  await page.getByRole('button', { name: 'Explore preview' }).click()
  await expect(page.getByRole('heading', { name: 'MauGo Home' })).toBeVisible()
  await expect(page.locator('.avatar')).toHaveCSS('border-radius', '50%')
  expect(errors).toEqual([])
})
test('all 343 manifest images load and decode without 404', async ({ page }) => {
  const failed: string[] = []
  page.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`) })
  page.on('requestfailed', r => failed.push(r.url()))
  await page.goto('/?assets=1')
  await expect(page.locator('img')).toHaveCount(343)
  const results = await page.locator('img').evaluateAll(async images => Promise.all(images.map(async image => {
    try { await (image as HTMLImageElement).decode(); return (image as HTMLImageElement).naturalWidth > 0 } catch { return false }
  })))
  expect(results.filter(Boolean)).toHaveLength(343)
  expect(failed).toEqual([])
})
