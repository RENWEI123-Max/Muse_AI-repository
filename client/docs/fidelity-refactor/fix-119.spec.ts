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
async function enter(page:Page){
 await stub(page);await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('reader@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click();await expect(page.locator('#compose')).toBeVisible()
}

test('fix 119 visual evidence',async({page})=>{
 await stub(page);await page.goto('/');await shot(page,'welcome');
 await enter(page);await shot(page,'home');
 await page.locator('#compose').click();await shot(page,'compose');
 if(prefix.endsWith('/after')){await page.locator('#letter-text').fill('A little story');await page.getByRole('button',{name:'Change bird',exact:true}).click();await page.locator('#appearance-genders button').first().click();await page.getByRole('button',{name:'Done',exact:true}).click();await expect(page.locator('#letter-text')).toHaveValue('A little story');await page.getByRole('button',{name:'Change bird',exact:true}).click();await page.keyboard.press('Escape');await expect(page.locator('#letter-text')).toHaveValue('A little story');await page.locator('#letter-text').fill('');}
 await page.getByRole('button',{name:'Close',exact:true}).first().click();
 await page.locator('#magic').click();await shot(page,'appearance');
 if(prefix.endsWith('/after')){
  const done=page.getByRole('button',{name:'Done',exact:true});const box=await done.boundingBox();expect(box!.y+box!.height).toBeLessThan(788+1);
  expect(await done.evaluate(el=>{const p=el.closest('.home-sheet')!;return p.scrollHeight<=p.clientHeight+1})).toBe(true);
  await page.locator('#appearance-genders button').first().click();await expect(page.locator('#appearance-genders button').first()).toHaveAttribute('aria-pressed','true');
  await page.locator('.appearance-grid button').nth(3).click();await expect(page.locator('.appearance-grid button').nth(3)).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Replay',exact:true}).click();await page.getByLabel('Flight & hover').uncheck();await expect(page.getByLabel('Flight & hover')).not.toBeChecked();await shot(page,'appearance-selected-off');
 }
await page.keyboard.press('Escape');
 await page.route(/\/users\/me\/image-cards$/,r=>r.fulfill({json:{items:Array.from({length:4},(_,i)=>({id:'card'+i,url:'/media/a1',type:'portrait',visibility:'everyone',isPrimary:i===0}))}}));
 await page.locator('#open-profile').click();await expect(page.locator('.image-card')).toHaveCount(4);await page.locator('.d4-body').evaluate(el=>el.scrollTop=el.scrollHeight);await shot(page,'profile-four');
 if(prefix.endsWith('/after')){
  const grid=await page.locator('.card-grid').boundingBox(),actions=await page.locator('.profile-card-actions').boundingBox();expect(actions!.y).toBeGreaterThanOrEqual(grid!.y+grid!.height);
  await page.locator('#profile-moments').click();await expect(page.locator('.d5-page')).toBeVisible();
  await page.locator('.d5-page header button').first().click();
 }

 await page.setViewportSize({width:375,height:667});await page.locator('.profile-nav button').first().click();await shot(page,'home-short');await page.locator('#compose').click();await shot(page,'compose-short');
 if(prefix.endsWith('/after')){const footer=await page.locator('.opening-form footer').boundingBox(),nav=await page.locator('.home-nav').boundingBox();expect(footer!.y+footer!.height).toBeLessThanOrEqual(nav!.y);}

})
