// Fixed API responses are only visual fixtures. Real-backend regression is separate.
// Run against npm run build + preview; UI_SHOT=before is for the HEAD baseline only.
import { test, expect, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
const prefix = process.env.UI_SHOT || 'after'
const portrait = readFile(new URL('../../src/assets/05-avatars/portrait-2.png', import.meta.url))
const now = new Date().toISOString()
const conversations = [
 {id:'c1',peerId:'p1',displayName:'Little wanderer',pinned:true,muted:false,hidden:false,following:true,unreadCount:2,status:'open',lastMessage:'The bookshop smelled like rain and old paper.',updatedAt:now},
 {id:'c2',peerId:'p2',displayName:'Quiet friend',pinned:false,muted:false,hidden:false,following:false,unreadCount:0,status:'open',lastMessage:'See you under the same moon.',updatedAt:now},
 {id:'c3',peerId:'p3',displayName:'Moonlit reader',pinned:false,muted:false,hidden:false,following:false,unreadCount:0,status:'waiting',lastMessage:'',updatedAt:now}
]
const letters = ['Little wanderer','Sea breeze','Paper moon'].map((name,i)=>({openingMessageId:'l'+i,conversationId:'lc'+i,content:'Today I found a quiet little bookshop. What small discovery stayed with you this week?',sender:{id:'s'+i,displayName:name,city:'Seoul',age:24+i},state:'unread',canReply:true,canChat:false}))
async function stub(page: Page) {
 await page.route(/\/api\/|:3000\//, async route => {
  const url = new URL(route.request().url()), path = url.pathname.replace('/api','')
  if (path.startsWith('/media/')) return route.fulfill({body: await portrait, contentType:'image/png'})
  let body: unknown = {}
  if (path==='/auth/login') body={token:'visual-only'}
  else if (path==='/auth/me'||path==='/users/me') body={id:'me',email:'reader@example.com',emailVerified:true}
  else if (path==='/wallet') body={diamonds:120,freeRemaining:3,paidCost:10}
  else if (path==='/filter-pass') body={active:false,expiresAt:null,remainingDays:0,plans:[{days:1,diamonds:30},{days:7,diamonds:150},{days:30,diamonds:480}]}
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
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.complete).map(i=>i.decode().catch(()=>{})))})
 await page.screenshot({path:`docs/fidelity-refactor/${prefix}/${name}.png`})
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
 if(prefix==='after') await expect(page.locator('#new-profile-moment')).toHaveCSS('color','rgb(25, 54, 43)')
 await shot(page,'11-profile')
 await page.locator('#open-settings').click()
 await shot(page,'12-settings')
})
async function enter(page:Page){
 await stub(page);await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('reader@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click();await expect(page.locator('#compose')).toBeVisible()
}
test('authentication state catalogue',async({page})=>{
 await stub(page)
 for(const [id,route] of [['terms-unchecked','consent'],['signin-empty','signin'],['signup-empty','signup'],['forgot-empty','forgot'],['verify-empty','verify'],['recovery-code','recovery'],['new-password','password'],['apple-private','apple'],['auth-privacy','privacy']]){
  await page.goto('/?auth='+route);await shot(page,id!)
 }
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await shot(page,'terms-checked');await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('invalid');await page.locator('#auth-password').fill('SamplePass2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('alert')).toBeVisible();await shot(page,'signin-invalid')
})
test('home loading, empty and error',async({page})=>{
 await enter(page)
 let release!:()=>void;const gate=new Promise<void>(r=>release=r)
 await page.route(/\/letters\/refresh$/,async r=>{await gate;await r.fulfill({json:{items:[],responses:[]}})})
 await page.locator('#refresh').click();await expect(page.locator('.magic-scene')).toHaveAttribute('aria-busy','true');await shot(page,'home-loading');release();await expect(page.locator('.magic-scene')).toHaveAttribute('aria-busy','false');await expect(page.locator('.letter-bird')).toHaveCount(0);await shot(page,'home-empty')
 await page.route(/\/letters\/refresh$/,r=>r.fulfill({status:503,json:{message:'Could not load letters. Please try again.'}}));await page.locator('#refresh').click();await expect(page.getByRole('alert')).toBeVisible();await shot(page,'home-error')
})
test('letter editing, safety and appearance',async({page})=>{
 await enter(page);await page.locator('.letter-bird').first().click({force:true});await page.locator('#reply').fill('Thank you for sharing your little story.');await shot(page,'letter-typed');await page.locator('#report-note').click();await shot(page,'letter-safety');await page.locator('#safety-report').click();await shot(page,'letter-report')
 await page.getByRole('button',{name:'Close safety menu'}).click();await page.getByRole('button',{name:'Close',exact:true}).first().click();await page.locator('#compose').click();await page.getByLabel('Recipient ID',{exact:true}).fill('sample-recipient');await page.locator('#letter-text').fill('Today I found a quiet little bookshop.');await shot(page,'compose-draft');await page.locator('#letter-text').fill('First line\nSecond line');await expect(page.locator('#publish')).toBeDisabled();await shot(page,'compose-invalid');await page.getByRole('button',{name:'Close',exact:true}).first().click()
 await page.locator('#magic').click();await shot(page,'bird-female');await page.locator('#appearance-genders button').first().click();await shot(page,'bird-male');await page.getByLabel('Flight & hover').uncheck();await shot(page,'bird-motion-off')
})
test('inbox empty, search and locked conversation',async({page})=>{
 await enter(page);await page.locator('#open-inbox').click();await expect(page.locator('.chat-row')).toHaveCount(3);await page.locator('#tab-friends').click();await shot(page,'inbox-friends');await page.locator('#tab-messages').click();await page.locator('#inbox-menu').click();await shot(page,'inbox-drawer');await page.keyboard.press('Escape');await page.locator('[data-chat="c3"]').click();await expect(page.locator('.waiting-card')).toBeVisible();await shot(page,'chat-receipt-waiting');await page.locator('#chat-details').click();await shot(page,'chat-details-waiting')
})
test('empty inbox',async({page})=>{
 await enter(page);await page.route(/\/conversations(?:\?.*)?$/,r=>r.fulfill({json:{items:[],hasMore:false}}));await page.locator('#open-inbox').click();await expect(page.locator('.feature-empty')).toBeVisible();await shot(page,'inbox-empty');await page.locator('#tab-friends').click();await shot(page,'inbox-friends-empty')
})
test('profile and settings detail states',async({page})=>{
 await enter(page);await page.locator('#open-profile').click();await page.locator('#edit-profile').click();await shot(page,'profile-edit');await page.locator('#page-back').click();await page.locator('#edit-avatar').click();await shot(page,'avatar-gallery');await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('#open-settings').click();await page.locator('#language-settings').click();await shot(page,'language-en');await page.locator('[data-language="ko"]').click();await shot(page,'language-ko');await page.locator('[data-language="en"]').click();await page.locator('#settings-back').click();await page.locator('#notifications-settings').click();await shot(page,'notifications-on');await page.locator('#allow-notifications').uncheck();await shot(page,'notifications-off');await page.locator('#settings-back').click();await page.locator('#general-settings').click();await shot(page,'general');await page.locator('#clear-cache').click();await shot(page,'cache-confirm')
})
test('wallet selection and unavailable payment',async({page})=>{
 await enter(page);await page.locator('#open-wallet').click();await expect(page.locator('.d1-topup')).toBeVisible();await page.locator('.diamond-pack').nth(1).click();await shot(page,'topup-confirm');await page.locator('#confirm-pack').click();await expect(page.getByRole('status')).toContainText('No charge');await shot(page,'wallet-payment-unavailable')
})
test('D11 opening, sending, collection and unlock motion',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:375,height:812},recordVideo:{dir:'/tmp/maugo-fidelity-video',size:{width:375,height:812}}})
 await context.addInitScript(()=>{(window as any).__motion=[];for(const event of ['animationstart','transitionrun'])document.addEventListener(event,e=>{const el=e.target as HTMLElement;if(!el.closest('.letters-veil,.inbox-flow')&&!el.matches('.d11-flying-letter'))return;const c=getComputedStyle(el);(window as any).__motion.push({event,classes:el.className,animation:c.animationName,duration:c.animationDuration,transition:c.transitionProperty,transitionDuration:c.transitionDuration,easing:c.transitionTimingFunction,delay:c.transitionDelay})})})
 const page=await context.newPage();await enter(page)
 await page.locator('.letter-bird').first().click({force:true});await expect(page.locator('#reply')).toBeVisible();await page.locator('#reply').fill('Your little story made me smile.');await page.locator('#reply-send').click();await expect(page.locator('#continue-chat')).toBeVisible();await shot(page,'letter-waiting');await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('#compose').click();await page.getByLabel('Recipient ID',{exact:true}).fill('11111111-1111-4111-8111-111111111111');await page.locator('#letter-text').fill('Hello from a quiet little bookshop.');await page.locator('#publish').click();await expect(page.getByRole('button',{name:'Back to home'})).toBeVisible();await shot(page,'compose-sent');await page.getByRole('button',{name:'Back to home'}).click()
 let collected=false
 await page.route(/\/conversations(?:\?.*)?$/,r=>r.fulfill({json:{items:conversations.map(c=>c.id==='c3'&&collected?{...c,status:'open'}:c),hasMore:false}}))
 await page.route(/\/conversations\/c3\//,async r=>{const path=new URL(r.request().url()).pathname;let body:unknown={};if(path.endsWith('/pending'))body={items:collected?[]:[{id:'r1'}],hasMore:false};else if(path.endsWith('/collect')){collected=true;body={state:'collected',cost:0}}else if(path.endsWith('/messages'))body={items:collected?[{id:'unlock-reply',kind:'reply',content:'Thank you for your letter.',createdAt:now,senderId:'p3'}]:[],hasMore:false};await r.fulfill({json:body})})
 await page.locator('#open-inbox').click();await expect(page.locator('#collect-replies')).toBeVisible();await shot(page,'inbox-pending');await page.locator('[data-chat="c3"]').click();await page.getByRole('button',{name:'Collect your reply',exact:true}).click();await expect(page.locator('#confirm-reply-payment')).toBeEnabled();await shot(page,'reply-last-free');await page.locator('#confirm-reply-payment').click();await expect(page.locator('#chat-input')).toBeEditable();await shot(page,'conversation-unlocked')
 const {writeFile}=await import('node:fs/promises');await writeFile(`docs/fidelity-refactor/${prefix}/motion.json`,JSON.stringify(await page.evaluate(()=>(window as any).__motion),null,2));await context.close();await page.video()!.saveAs(`docs/fidelity-refactor/${prefix}/motion.webm`)
})
test('Filter Pass and shortage states',async({page})=>{
 await enter(page);await page.locator('#settings').click();await page.getByRole('button',{name:'Unlock Filter Pass',exact:true}).click();await shot(page,'pass-sheet');await page.locator('.pass-plan').last().click();await expect(page.locator('#confirm-pass-payment')).toBeDisabled();await shot(page,'pass-shortage');await page.keyboard.press('Escape');await page.keyboard.press('Escape')
})
test('unlocked chat tools and wallpaper',async({page})=>{
 await enter(page);await page.locator('#open-inbox').click();await page.locator('[data-chat="c1"]').click();await expect(page.locator('#chat-input')).toBeEditable();await page.locator('#chat-input').fill('That sounds like a lovely little moment.');await shot(page,'chat-draft');await page.locator('#chat-stickers').click();await shot(page,'chat-stickers');await page.locator('#chat-stickers').click();await page.locator('#chat-details').click();await shot(page,'chat-details');await page.locator('#chat-background').click();await shot(page,'wallpapers');await page.locator('[data-wallpaper]').first().click();await shot(page,'wallpaper-preview')
})
