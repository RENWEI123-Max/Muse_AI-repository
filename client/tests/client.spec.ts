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
  await page.getByRole('button', { name: '언어 변경' }).click()
  await page.getByRole('button', { name: 'Explore preview' }).click()
  await expect(page.locator('.home-flow')).toBeVisible()
  await expect(page.getByRole('button', {name:'Filters',exact:true})).toBeVisible()
  expect(errors).toEqual([])
})
test('production preview hides the asset audit screen', async ({ page }) => {
  test.skip(process.env.TEST_PREVIEW !== '1', 'asset audit screen is dev-only')
  await page.goto('/?assets=1')
  await expect(page.getByRole('heading', { name: 'Welcome to MauGo' })).toBeVisible()
  await expect(page.locator('.device')).toBeVisible()
  await expect(page.locator('.asset-audit')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: '343 MauGo assets' })).toHaveCount(0)
})
test('all 343 manifest images load and decode without 404', async ({ page }) => {
  test.skip(process.env.TEST_PREVIEW === '1', 'asset audit screen is dev-only')
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
test('letter avatars fall back to default art when loading fails', async ({ page }) => {
  const sender = (id: string, avatar: string) => ({ openingMessageId: id, conversationId: 'c-' + id, content: 'Hello', state: 'unread', canReply: true, canChat: false, sender: { id: 'u-' + id, displayName: 'Sender ' + id, avatar, city: 'Seoul', age: 24 } })
  const letters = [sender('a', '/media/uploads/00000000-0000-4000-8000-000000000001'), sender('b', '/broken-avatar.png')]
  await page.route('**/broken-avatar.png', route => route.fulfill({ status: 404 }))
  await page.route(url => url.pathname.startsWith('/api/') || url.port === '3000', route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
    if (path === '/auth/login') return route.fulfill({ json: { id: 'reader', token: 'fixture' } })
    if (path.startsWith('/media/uploads/')) return route.fulfill({ status: 403, json: { message: 'Forbidden' } })
    if (path === '/letters/a') return route.fulfill({ json: letters[0] })
    if (path === '/letters') return route.fulfill({ json: { batchId: 'batch', items: letters, responses: [] } })
    if (path === '/wallet') return route.fulfill({ json: { diamonds: 0, freeRemaining: 10, cost: 0, paidCost: 10 } })
    if (path === '/filter-pass') return route.fulfill({ json: { active: false, plans: [] } })
    return route.fulfill({ json: { items: [], hasMore: false, cities: [], responses: [] } })
  })
  await page.goto('/?auth=consent')
  await page.locator('#accept-terms').check()
  await page.locator('#terms-continue').click()
  await page.locator('#auth-email').fill('reader@example.com')
  await page.locator('#auth-password').fill('SamplePass2026')
  await page.locator('#auth-form .auth-main').click()
  await expect(page.locator('.letter-bird')).toHaveCount(2)
  await expect(page.locator('.letter-bird .home-flight-sprite')).toHaveCount(2)
  await expect(page.locator('.letter-bird-avatar')).toHaveCount(0)
  await page.getByRole('button', { name: 'Open letter from Sender a' }).dispatchEvent('click')
  await expect(page.locator('.letter-avatar')).toHaveAttribute('src', /female-1/)
})

test('discovery keeps a displayed letter avatar alive across token refresh', async ({ page }) => {
  const avatar = '/media/uploads/00000000-0000-4000-8000-000000000001'
  const letter = {
    openingMessageId: 'letter', conversationId: 'conversation', content: 'Hello',
    state: 'unread', canReply: true, canChat: false,
    sender: { id: 'sender', displayName: 'Sender', avatar }
  }
  const authorizations: (string | undefined)[] = []
  await page.addInitScript(() => {
    localStorage.setItem('maugo-token', 'original-token')
    localStorage.setItem('maugo-account', 'reader')
    // Isolate token refresh from WebKit's separate initial error on a source-less img.
    let photoLoaded = false
    document.addEventListener('load', event => {
      const img = event.target
      if (img instanceof HTMLImageElement && img.matches('.letter-bird-avatar[src^="blob:"]')) photoLoaded = true
    }, true)
    document.addEventListener('error', event => {
      const img = event.target
      if (!photoLoaded && img instanceof HTMLImageElement && img.matches('.letter-bird-avatar:not([src])')) {
        event.stopImmediatePropagation()
      }
    }, true)
  })
  await page.route(url => url.pathname.startsWith('/api/') || url.port === '3000', route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api/, '')
    if (path === avatar) {
      authorizations.push(route.request().headers().authorization)
      return route.fulfill({ path: 'src/assets/05-avatars/portrait-2.png' })
    }
    if (path === '/letters') return route.fulfill({ json: { items: [letter], responses: [] } })
    if (path === '/wallet') return route.fulfill({ json: { diamonds: 0, freeRemaining: 10, paidCost: 10 } })
    return route.fulfill({ json: { items: [], active: false, plans: [], cities: [] } })
  })
  await page.goto('/')
  const bird = page.getByRole('button', { name: 'Open letter from Sender' })
  const photo = bird.locator('img.letter-bird-avatar')
  const loaded = () => photo.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)
  await expect.poll(loaded).toBe(true)
  const originalUrl = await photo.getAttribute('src')
  expect(originalUrl).toMatch(/^blob:/)

  const revokedDuringRefresh = await bird.evaluate(async (button, url) => {
    const revoke = URL.revokeObjectURL
    const revoked: string[] = []
    URL.revokeObjectURL = value => { revoked.push(value); revoke.call(URL, value) }
    try {
      // Simulate a new session token without remounting HomeFlow or replacing its letters.
      type VNode = {
        children?: VNode[]
        component?: { props: { userId?: string; token?: string }; subTree: VNode }
      }
      const root = document.querySelector('#app') as Element & { _vnode: VNode }
      function findHome(node: VNode): NonNullable<VNode['component']> | undefined {
        const component = node.component
        if (component?.props.userId === 'reader' && component.props.token === 'original-token') return component
        if (component) return findHome(component.subTree)
        for (const child of Array.isArray(node.children) ? node.children : []) {
          const match = findHome(child)
          if (match) return match
        }
      }
      const home = findHome(root._vnode)
      if (!home || button.querySelector('img')?.getAttribute('src') !== url) throw Error('Expected a mounted letter photo')
      home.props.token = 'refreshed-token'
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      return revoked
    } finally {
      URL.revokeObjectURL = revoke
    }
  }, originalUrl)

  expect(revokedDuringRefresh).toEqual([])
  await expect(photo).toHaveAttribute('src', originalUrl!)
  await expect.poll(loaded).toBe(true)
  await expect(bird.locator('.home-flight-sprite')).toHaveCount(0)
  expect(authorizations).toEqual(['Bearer original-token'])
})
