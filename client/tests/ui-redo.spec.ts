// Visual measurements only. Navigation, missing references and tool errors still fail.
import { test, expect, type Page } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
const require = createRequire(import.meta.url)
// Playwright internal API: support both the bundled and pre-bundle layouts.
const core = dirname(require.resolve('playwright-core/package.json'))
let getComparator: any
try { ({ getComparator } = require(join(core, 'lib/coreBundle.js')).utils) }
catch { ({ getComparator } = require(join(core, 'lib/server/utils/comparators.js'))) }
const out = new URL('../docs/ui-redo/r04-compare/', import.meta.url)
const states = ['home-ready', 'terms-unchecked', 'signin-empty', 'signup-empty']
const requested = process.env.UI_REDO_STATES?.split(',') || states
for (const id of requested) if (!states.includes(id)) throw new Error(`Unsupported state ID: ${id}; add an explicit navigation recipe first`)
async function enter(page: Page, id: string) {
  await page.route(/\/api\/|:3000\//, async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
    let body: unknown = {}
    if (path === '/auth/login') body = { token: 'r04-fixture' }
    else if (path === '/auth/me' || path === '/users/me') body = { id: 'me', email: 'reader@example.com', emailVerified: true }
    else if (path === '/wallet') body = { diamonds: 120, freeRemaining: 3, paidCost: 10 }
    else if (path === '/discovery/filters') body = { cities: ['Seoul', 'Busan', 'Tokyo'] }
    else if (path === '/letters' || path === '/letters/refresh') body = { items: ['Little wanderer', 'Sea breeze', 'Paper moon'].map((displayName, i) => ({ openingMessageId: `l${i}`, conversationId: `lc${i}`, content: 'Today I found a quiet little bookshop. What small discovery stayed with you this week?', sender: { id: `s${i}`, displayName, city: 'Seoul', age: 24 + i }, state: 'unread', canReply: true, canChat: false })), responses: [] }
    await route.fulfill({ json: body })
  })
  const auth = id === 'signup-empty' ? 'signup' : id === 'signin-empty' ? 'signin' : 'consent'
  await page.goto(`/?auth=${auth}`)
  if (id === 'home-ready') {
    await page.locator('#accept-terms').check()
    await page.locator('#terms-continue').click()
    await page.locator('#auth-email').fill('reader@example.com')
    await page.locator('#auth-password').fill('SamplePass2026')
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await page.getByRole('button', { name: 'Meet your letters' }).click()
    await expect(page.locator('.letter-bird')).toHaveCount(3)
  } else await expect(page.locator(id === 'terms-unchecked' ? '#accept-terms' : '#auth-email')).toBeVisible()
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(img => img.decode().catch(() => {}))) })
  await page.waitForTimeout(1000)
}
for (const id of requested) test(id, async ({ page }) => {
  await mkdir(out, { recursive: true })
  await enter(page, id)
  const actual = await page.screenshot({ animations: 'disabled' })
  const reference = await readFile(new URL(`../docs/design-reference/figma/${id}.png`, import.meta.url))
  // Canvas only decodes/composes PNGs. Pixel comparison is Playwright's own comparator.
  const images = await page.evaluate(async ({ a, b }) => {
    async function load(base64: string) { const img = new Image(); img.src = `data:image/png;base64,${base64}`; await img.decode(); if (img.width !== 375 || img.height !== 812) throw new Error('Expected 375×812'); return img }
    const [actual, reference] = await Promise.all([load(a), load(b)])
    const canvas = document.createElement('canvas'); canvas.width = 750; canvas.height = 812
    const ctx = canvas.getContext('2d')!; ctx.drawImage(actual, 0, 0); ctx.drawImage(reference, 375, 0)
    const side = canvas.toDataURL().split(',')[1]
    const masked = [actual, reference].map(img => { const c = document.createElement('canvas'); c.width = 375; c.height = 812; const x = c.getContext('2d')!; x.drawImage(img, 0, 0); x.fillStyle = '#ff00ff'; x.fillRect(0, 0, 375, 44); return c.toDataURL().split(',')[1] })
    return { side, masked }
  }, { a: actual.toString('base64'), b: reference.toString('base64') })
  const result = getComparator('image/png')(Buffer.from(images.masked[0], 'base64'), Buffer.from(images.masked[1], 'base64'))
  const count = result ? Number(result.errorMessage.match(/(\d+) pixels \(ratio /)?.[1]) : 0
  if (!Number.isFinite(count)) throw new Error(`Unexpected Playwright comparator response: ${result?.errorMessage}`)
  const measurement = { id, differentPixels: count, totalPixels: 375 * 812, maskedPixels: 375 * 44, ratio: count / (375 * 812), percent: count / (375 * 812) * 100 }
  await writeFile(new URL(`${id}-actual.png`, out), actual)
  await writeFile(new URL(`${id}-side-by-side.png`, out), Buffer.from(images.side, 'base64'))
  if (result?.diff) await writeFile(new URL(`${id}-diff.png`, out), result.diff)
  await writeFile(new URL(`${id}.json`, out), JSON.stringify(measurement, null, 2) + '\n')
  console.log(JSON.stringify(measurement))
})
test.afterAll(async () => {
  const rows = await Promise.all(requested.map(async id => JSON.parse(await readFile(new URL(`${id}.json`, out), 'utf8'))))
  await writeFile(new URL('ratios.json', out), JSON.stringify(rows, null, 2) + '\n')
  await writeFile(new URL('ratios.csv', out), 'state,different_pixels,total_pixels,ratio,percent\n' + rows.map(r => `${r.id},${r.differentPixels},${r.totalPixels},${r.ratio},${r.percent}`).join('\n') + '\n')
})
