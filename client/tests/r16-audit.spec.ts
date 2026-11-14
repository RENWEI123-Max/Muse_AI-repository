import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const out='docs/ui-redo/r16-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R16 API fixture walkthrough`,async({page})=>{
 test.setTimeout(180000);page.setDefaultTimeout(10000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 let followFailure=false,profileFailure=false
 const calls:any[]=[],records:any[]=[],checks:any={},errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 const rows=['open','waiting','empty'].map(id=>({id,peerId:'peer-'+id,displayName:id==='waiting'?'Your sent letter':'Tea friend',remark:'',status:id==='open'?'open':'waiting',pinned:false,muted:false,hidden:false,following:false,unreadCount:0,lastMessage:'A small moment worth keeping.',updatedAt:'2026-11-14T10:00:00Z'}))
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace('/api',''),method=req.method();calls.push({path:p,query:url.search,method,body:method==='PATCH'?req.postDataJSON():undefined});const ok=(json:any)=>route.fulfill({json})
  if(p==='/auth/login')return ok({id:'r16-reader',token:'r16-api-fixture'})
  if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  if(p==='/filter-pass')return ok({active:false,plans:[]})
  if(p==='/letters'||p==='/letters/refresh')return ok({items:[],responses:[]})
  if(p==='/blocks')return ok({items:[]})
  if(p.startsWith('/media/'))return route.fulfill({contentType:'image/png',body:readFileSync('src/assets/05-avatars/'+(p.endsWith('life')?'portrait-4.png':'portrait-3.png'))})
  if(/^\/profiles\/peer-(open|waiting|empty)$/.test(p)){
   if(profileFailure)return route.fulfill({status:503,json:{message:t('Please try again.')}})
   const row=rows.find(r=>p.endsWith(r.id))!,waiting=row.id==='waiting'
   return ok({id:row.peerId,displayName:'Tea friend',age:waiting?null:25,city:waiting?null:'Seoul',zodiac:null,bio:'',avatar:'/media/avatar',avatars:[],following:row.following,permissions:{canFollow:row.status==='open',conversationId:row.id}})
  }
  if(p.endsWith('/image-cards'))return ok({items:Array.from({length:p.includes('open')?4:1},(_,i)=>({url:'/media/card-'+i}))})
  if(p==='/posts')return ok({items:url.searchParams.get('userId')==='peer-open'?[{id:'day',content:t('A small moment worth keeping.'),attachments:[{kind:'image',url:'/media/life'}]}]:[]})
  if(p==='/conversations')return ok({items:rows,hasMore:false})
  if(p.endsWith('/replies/pending'))return ok({items:[],hasMore:false})
  if(p.startsWith('/conversations/')&&method==='PATCH'){
   if(followFailure)return route.fulfill({status:503,json:{message:t('Please try again.')}})
   rows.find(r=>p.endsWith('/'+r.id))!.following=req.postDataJSON().following;return ok({})
  }
  if(p.endsWith('/messages'))return ok({items:[{id:'m1',content:'Thank you for listening.',kind:'reply',createdAt:'2026-11-14T10:00:00Z',mine:false}],hasMore:false})
  if(method!=='GET')throw Error('Unexpected mutation '+method+' '+p)
  return ok({items:[],cities:[]})
 })
 const person=page.locator('.person-page')
 const snap=async(name:string)=>{
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})))})
  await page.waitForTimeout(350);await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  const measure=await page.evaluate(()=>({document:{height:document.documentElement.scrollHeight,y:scrollY,width:document.documentElement.scrollWidth},regions:[...document.querySelectorAll('.person-page .d4-body,.person-cards,.person-sheet')].filter(e=>e.getClientRects().length).map(e=>({selector:e.className,height:e.clientHeight,content:e.scrollHeight,top:e.scrollTop,left:e.scrollLeft,width:e.clientWidth,scrollWidth:e.scrollWidth,overscroll:getComputedStyle(e).overscrollBehavior,animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration})),copy:[...document.querySelectorAll('.person-page button,.person-page p,.person-page h2,.person-page small')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent?.trim(),clipped:e.scrollWidth>e.clientWidth+1})),images:[...document.querySelectorAll('.person-page img')].map(e=>({decoded:(e as HTMLImageElement).complete&&(e as HTMLImageElement).naturalWidth>0}))}))
  records.push({name,...measure});writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,calls,records,checks,errors},null,2))
  expect(measure.document).toEqual({height,y:0,width:375})
 }
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r16-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await page.locator('#open-inbox').click()
 const enter=async(id:string)=>{await page.locator(`[data-chat="${id}"]`).click();await page.locator('#chat-details').click();await page.locator('#view-public-profile').click();await expect(person).toBeVisible();if(!profileFailure)await expect(person.locator('.person-name')).toHaveText('Tea friend')}
 const returnInbox=async()=>{await person.locator('#page-back').click();await page.locator('.c6-chat').getByLabel(t('Back to messages')).click();await page.locator('.c6-chat').getByLabel(t('Back to messages')).click()}
 await enter('open');await expect(person.locator('.person-cards img')).toHaveCount(4);await snap('person-profile')
 const press=person.locator('#public-follow');await press.hover();await page.mouse.down();checks.press=await press.evaluate(e=>({transform:getComputedStyle(e).transform,transition:getComputedStyle(e).transitionDuration}));await page.mouse.move(1,1);await page.mouse.up()
 checks.motion=await person.evaluate(e=>({animation:getComputedStyle(e).animationName,transition:getComputedStyle(e).transitionDuration}))
 await person.locator('#public-follow').click();await expect(person.locator('#public-follow')).toHaveText(t('✓ Following'));await snap('person-followed')
 await person.locator('#public-follow').click();await expect(person.locator('#public-follow')).toHaveText(t('＋ Follow'));await snap('unfollowed')
 followFailure=true;await person.locator('#public-follow').click();await expect(person.getByRole('alert')).toBeVisible();await expect(person.locator('#public-follow')).toHaveText(t('＋ Follow'));await snap('follow-failure');followFailure=false;await person.locator('#page-back').click();await page.locator('#view-public-profile').click();await expect(person.getByRole('alert')).toHaveCount(0);await expect(person.locator('#public-follow')).toHaveText(t('＋ Follow'))
 await person.locator('#public-avatar').click();await snap('person-photo');await person.locator('.person-close').click();await expect(person.getByRole('dialog')).toHaveCount(0)
 await person.locator('.ui-person-card').first().click();await snap('card-photo');await person.locator('.person-veil').click({position:{x:5,y:5}});await expect(person.getByRole('dialog')).toHaveCount(0)
 await person.locator('.person-cards').hover();await page.mouse.wheel(600,0);await page.waitForTimeout(150);checks.cards=await person.locator('.person-cards').evaluate(e=>({left:e.scrollLeft,width:e.clientWidth,content:e.scrollWidth}));expect(checks.cards.left).toBeGreaterThan(0);await snap('cards-scrolled')
 await person.locator('.d4-body').hover();await page.mouse.wheel(0,700);await page.waitForTimeout(150);checks.body=await person.locator('.d4-body').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight}));expect(checks.body.top).toBeGreaterThan(0);await snap('moments-scrolled')
 await person.locator('.ui-person-moment-photo').click();await snap('moment-photo');await page.keyboard.press('Escape');await expect(person.getByRole('dialog')).toHaveCount(0);expect(await person.locator('.d4-body').evaluate(e=>e.scrollTop)).toBe(checks.body.top)
 await person.locator('#public-more').click();await snap('person-safety');await person.locator('.person-close').click();await person.locator('#public-more').click();await page.keyboard.press('Escape');await expect(person.getByRole('dialog')).toHaveCount(0)
 await person.locator('#public-more').click();await person.locator('#safety-report').click();await expect(page.locator('.d3-report')).toBeVisible();await page.locator('#report-details').fill('R16 fixture report, cancelled without submission.');await snap('report-boundary');await page.locator('.c6-chat').getByLabel(t('Back to messages')).click()
 await page.locator('#view-public-profile').click();await person.locator('#public-more').click();await person.locator('#safety-block').click();await expect(page.locator('.safety-confirm-dialog')).toBeVisible();await snap('block-boundary');await page.locator('.safety-dialog-cancel').click()
 await page.locator('#view-public-profile').click();await person.locator('#public-chat').click();await expect(page.locator('#chat-form')).toBeVisible();await snap('chat-boundary');await page.locator('.c6-chat').getByLabel(t('Back to messages')).click()
 await enter('waiting');await expect(person.locator('#public-follow')).toBeDisabled();await snap('person-waiting');await person.locator('#public-chat').click();await expect(page.locator('#chat-form')).toHaveCount(0);await snap('waiting-chat');await page.locator('.c6-chat').getByLabel(t('Back to messages')).click()
 await enter('empty');await expect(person.locator('.person-empty')).toHaveText(t('No moments yet.'));await snap('person-no-content');await returnInbox()
 profileFailure=true;await enter('open');await expect(person.getByRole('alert')).toBeVisible();await snap('profile-failure');await returnInbox();profileFailure=false
 await enter('open');await expect(person.getByRole('alert')).toHaveCount(0);await snap('profile-recovered');await returnInbox()
 checks.clipped=records.flatMap(r=>r.copy.filter((c:any)=>c.clipped).map((c:any)=>({step:r.name,...c})));expect(errors).toEqual([])
 writeFileSync(`${out}/${height}-${lang}-checks.json`,JSON.stringify({fixture:true,checks,calls,errors},null,2))
})
