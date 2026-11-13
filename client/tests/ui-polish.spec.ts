// Visual evidence for task #96 (UI polish). API responses are stubbed in the browser
// only to reach each main-flow page for screenshots; business behaviour is covered by
// the real-backend suites (d1–d11, c7). Run with UI_SHOT=before|after.
import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const prefix = process.env.UI_SHOT || 'after'
const portrait = readFile(new URL('../src/assets/05-avatars/portrait-2.png', import.meta.url))
const now = new Date().toISOString()
const conversations = [
 {id:'c1',peerId:'p1',displayName:'Little wanderer',pinned:true,muted:false,hidden:false,following:true,unreadCount:2,status:'open',lastMessage:'The bookshop smelled like rain and old paper.',updatedAt:now},
 {id:'c2',peerId:'p2',displayName:'Quiet friend',pinned:false,muted:false,hidden:false,following:false,unreadCount:0,status:'open',lastMessage:'See you under the same moon.',updatedAt:now},
 {id:'c3',peerId:'p3',displayName:'Moonlit reader',pinned:false,muted:false,hidden:false,following:false,unreadCount:0,status:'waiting',lastMessage:'',updatedAt:now}
]
const letters = ['Little wanderer','Sea breeze','Paper moon'].map((name,i)=>({openingMessageId:'l'+i,conversationId:'lc'+i,content:'Today I found a quiet little bookshop. What small discovery stayed with you this week?',sender:{id:'s'+i,displayName:name,city:'Seoul',age:24+i},state:'unread',canReply:true,canChat:false}))
async function stub(page: Page) {
 await page.route('**/api/**', async route => {
  const url = new URL(route.request().url()), path = url.pathname.replace('/api','')
  if (path.startsWith('/media/')) return route.fulfill({body: await portrait, contentType:'image/png'})
  let body: unknown = {}
  if (path==='/auth/login') body={token:'visual-only'}
  else if (path==='/auth/me'||path==='/users/me') body={id:'me',email:'reader@example.com',emailVerified:true}
  else if (path==='/wallet') body={diamonds:120,freeRemaining:3,paidCost:10}
  else if (path==='/filter-pass') body={active:false,expiresAt:null,remainingDays:0,plans:[{days:1,diamonds:30},{days:7,diamonds:100},{days:30,diamonds:480}]}
  else if (path==='/discovery/filters') body={cities:['Seoul','Busan','Tokyo']}
  else if (path==='/letters'||path==='/letters/refresh') body={items:letters,responses:[]}
  else if (path.startsWith('/letters/')) body=letters[0]
  else if (path==='/conversations') body={items:url.searchParams.get('tab')==='friends'?conversations.filter(c=>c.following):conversations,hasMore:false}
  else if (path.endsWith('/replies/pending')) body={items:path.includes('c3')?[{id:'r1'}]:[],hasMore:false}
  else if (path.endsWith('/messages')) body={items:path.includes('c1')?[
   {id:'m1',kind:'opening',content:'Today I found a quiet little bookshop. What small discovery stayed with you?',createdAt:now,senderId:'p1'},
   {id:'m2',kind:'reply',content:'A tiny café with a cat sleeping in the window. It made my whole afternoon.',createdAt:now,senderId:'me',mine:true},
   {id:'m3',kind:'text',content:'The bookshop smelled like rain and old paper.',createdAt:now,senderId:'p1'}]:[],hasMore:false}
  else if (path==='/profiles/me') body={id:'me',displayName:'Reader',age:26,city:'Seoul',zodiac:'Pisces',bio:'Collecting small, kind stories.',avatar:'/media/a1',avatars:[{mediaId:'a1',url:'/media/a1',position:0}],recentlyRemoved:[],following:false,permissions:{canFollow:false,conversationId:null}}
  else if (path==='/profiles/me/stats') body={followingCount:1,followersCount:3,likesCount:12,postLikesCount:8,imageCardLikesCount:4,visits:[],letters:[{content:'Hello from Seoul.'}]}
  else if (path.startsWith('/profiles/')) body={items:[],hasMore:false}
  else if (path==='/users/me/image-cards'||path==='/posts'||path==='/blocks') body={items:[],hasMore:false}
  await route.fulfill({json:body})
 })
}
async function shot(page: Page, name: string) {
 await page.waitForTimeout(900)
 await page.screenshot({path:`docs/ui-polish/${prefix}-${name}.png`})
}
test('main-flow screenshots', async ({ page }) => {
 await stub(page)
 await page.goto('/')
 await page.evaluate(() => document.fonts.ready)
 await shot(page,'01-welcome')
 await page.goto('/?auth=consent')
 await shot(page,'02-terms')
 await page.locator('#accept-terms').check(); await page.locator('#terms-continue').click()
 await shot(page,'03-signin')
 await page.locator('#auth-email').fill('reader@example.com'); await page.locator('#auth-password').fill('SamplePass2026')
 await page.getByRole('button',{name:'Sign in',exact:true}).click()
 await page.getByRole('button',{name:'Meet your letters'}).click()
 await expect(page.locator('.letter-bird')).toHaveCount(3)
 await shot(page,'04-home')
 await page.getByRole('button',{name:'Filters',exact:true}).click()
 await shot(page,'05-filters')
 await page.keyboard.press('Escape'); await page.waitForTimeout(400)
 await page.locator('.letter-bird').first().click({force:true})
 await shot(page,'06-letter-open')
 await page.getByRole('button',{name:'Close',exact:true}).first().click(); await page.waitForTimeout(700)
 await page.locator('#compose').click()
 await shot(page,'07-compose')
 await page.getByRole('button',{name:'Close',exact:true}).first().click(); await page.waitForTimeout(700)
 await page.locator('#open-wallet').click()
 await shot(page,'08-wallet')
 await page.keyboard.press('Escape'); await page.waitForTimeout(500)
 await page.locator('#open-inbox').click()
 await expect(page.locator('.chat-row').first()).toBeVisible()
 await shot(page,'09-inbox')
 await page.locator('.chat-row').first().click()
 await shot(page,'10-chat')
})
test('profile and settings screenshots', async ({ page }) => {
 await stub(page)
 await page.goto('/?auth=consent')
 await page.locator('#accept-terms').check(); await page.locator('#terms-continue').click()
 await page.locator('#auth-email').fill('reader@example.com'); await page.locator('#auth-password').fill('SamplePass2026')
 await page.getByRole('button',{name:'Sign in',exact:true}).click()
 await page.getByRole('button',{name:'Meet your letters'}).click()
 await page.locator('#open-profile').click()
 await expect(page.locator('.d4-profile')).toBeVisible()
 await shot(page,'11-profile')
 await page.locator('#open-settings').click()
 await shot(page,'12-settings')
})
test('tab, sheet, push and list motion recording', async ({ browser, baseURL }) => {
  const context = await browser.newContext({baseURL,viewport:{width:375,height:812},recordVideo:{dir:'test-results/ui-polish-motion',size:{width:375,height:812}}})
  const page = await context.newPage()
  await stub(page)
  await page.goto('/?auth=consent')
  await page.locator('#accept-terms').check(); await page.locator('#terms-continue').click()
  await page.locator('#auth-email').fill('reader@example.com'); await page.locator('#auth-password').fill('SamplePass2026')
  await page.getByRole('button',{name:'Sign in',exact:true}).click()
  await page.getByRole('button',{name:'Meet your letters'}).click(); await page.waitForTimeout(1200)
  await page.getByRole('button',{name:'Filters',exact:true}).click(); await page.waitForTimeout(700)
  await page.getByRole('button',{name:'Close',exact:true}).click(); await page.waitForTimeout(600)
  await page.locator('.letter-bird').first().click({force:true}); await page.waitForTimeout(1000)
  await page.getByRole('button',{name:'Close',exact:true}).first().click(); await page.waitForTimeout(700)
  await page.locator('#open-inbox').click()
  // Tab cross-fade and staggered rows are running right after the switch.
  expect(await page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0)
  await page.waitForTimeout(900)
  await page.locator('#tab-friends').click(); await page.waitForTimeout(600)
  await page.locator('#tab-messages').click(); await page.waitForTimeout(600)
  await page.locator('.chat-row').first().click(); await page.waitForTimeout(900)
  await page.getByLabel('Back to messages').first().click(); await page.waitForTimeout(700)
  await page.locator('.inbox-nav button').last().click(); await page.waitForTimeout(900)
  await page.locator('#open-settings').click(); await page.waitForTimeout(900)
  await context.close()
  await page.video()!.saveAs(`docs/ui-polish/${prefix}-motion.webm`)
})
