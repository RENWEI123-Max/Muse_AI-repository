import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const out='docs/ui-redo/r17-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R17 API fixture walkthrough`,async({page})=>{
 test.setTimeout(180000);page.setDefaultTimeout(10000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 let populated=false,failSave=false,failLoad=false
 const profile={id:'r17-reader',displayName:'Audit reader',age:24,city:'Seoul',zodiac:'Libra',bio:'',avatar:null,avatars:[],following:false,permissions:{canFollow:false,conversationId:null}}
 const rows=[{id:'audit-chat',peerId:'audit-peer',displayName:'Audit connection',status:'open',following:true}]
 const calls:any[]=[],records:any[]=[],checks:any={},errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace('/api',''),method=req.method();calls.push({path:p,query:url.search,method,body:method==='PATCH'?req.postDataJSON():undefined});const ok=(json:any)=>route.fulfill({json})
  if(p==='/auth/login')return ok({id:profile.id,token:'r17-api-fixture'})
  if(p==='/profiles/me'){
   if(failLoad||method==='PATCH'&&failSave)return route.fulfill({status:503,json:{message:t('Please try again.')}})
   if(method==='PATCH')Object.assign(profile,req.postDataJSON())
   return ok(profile)
  }
  if(p==='/profiles/me/stats')return ok({followingCount:populated?1:0,followersCount:0,likesCount:0,postLikesCount:0,imageCardLikesCount:0,visits:populated?[{visitorId:profile.id,profileId:'audit-peer',visitedAt:'2026-11-14T10:00:00Z'}]:[],letters:populated?[{content:t('A small moment worth keeping.')}]:[]})
  if(p==='/profiles/me/followers')return ok({items:[]})
  if(p==='/profiles/audit-peer/summary')return ok({id:'audit-peer',displayName:'Audit connection'})
  if(p==='/profiles/audit-peer')return ok({...profile,id:'audit-peer',displayName:'Audit connection',permissions:{canFollow:true,conversationId:'audit-chat'}})
  if(p==='/users/me/image-cards')return ok({items:populated?[{id:'audit-card',url:'/media/audit-card',type:'portrait',visibility:'everyone',isPrimary:true}]:[]})
  if(p.startsWith('/profiles/')&&p.endsWith('/image-cards'))return ok({items:[]})
  if(p.startsWith('/media/'))return route.fulfill({contentType:'image/png',body:readFileSync('src/assets/05-avatars/portrait-3.png')})
  if(p==='/conversations')return ok({items:populated?rows:[],hasMore:false})
  if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  if(p==='/filter-pass')return ok({active:false,plans:[]})
  if(method!=='GET')throw Error('Unexpected mutation '+method+' '+p)
  return ok({items:[],cities:[],responses:[]})
 })
 const root=page.locator('.profile-page').first()
 const snap=async(name:string)=>{
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})))})
  await page.waitForTimeout(350);await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  const m=await root.evaluate(e=>({document:{height:document.documentElement.scrollHeight,y:scrollY,width:document.documentElement.scrollWidth},regions:[...e.querySelectorAll('.d4-body,.profile-likes')].filter(x=>x.getClientRects().length).map(x=>({selector:x.className,height:x.clientHeight,content:x.scrollHeight,top:x.scrollTop,width:x.clientWidth,scrollWidth:x.scrollWidth,overscroll:getComputedStyle(x).overscrollBehavior,animation:getComputedStyle(x).animationName,duration:getComputedStyle(x).animationDuration})),copy:[...e.querySelectorAll('button,p,h1,h2,h3,small,label')].filter(x=>x.getClientRects().length&&!x.querySelector('input,textarea,select')&&getComputedStyle(x).visibility!=='hidden').map(x=>({text:x.textContent?.trim(),clipped:x.scrollWidth>x.clientWidth+1})),images:[...e.querySelectorAll('img')].filter(x=>x.getClientRects().length).map(x=>({decoded:x.complete&&x.naturalWidth>0}))}))
  records.push({name,...m});writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,calls,records,checks,errors},null,2));expect(m.document).toEqual({height,y:0,width:375})
 }
 const back=()=>root.locator('#page-back').click()
 const enter=async()=>{await page.locator('#open-profile').click();await expect(root.locator('#edit-profile')).toHaveText(profile.displayName)}
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r17-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await enter()
 await snap('profile-empty')
 await root.locator('#edit-profile').click();await snap('profile-edit')
 await root.locator('#edit-name').fill('Cancelled draft');await back();await expect(root.locator('#edit-profile')).toHaveText('Audit reader')
 await root.locator('#edit-profile').click();await root.locator('#edit-age').fill('17');await root.locator('#save-profile').click();await expect(root.getByRole('alert')).toHaveText(t('Enter a name and an age between 18 and 100.'));await snap('profile-invalid');expect(calls.filter(c=>c.method==='PATCH')).toHaveLength(0)
 await root.locator('#edit-age').fill('25');failSave=true;await root.locator('#save-profile').click();await expect(root.getByRole('alert')).toHaveText(t('Please try again.'));await snap('save-failure');failSave=false
 await root.locator('#edit-name').fill('Audit saved');await root.locator('#save-profile').click();await expect(root.locator('#edit-profile')).toHaveText('Audit saved');await snap('save-success')
 await root.locator('#likes').click();await snap('profile-likes');checks.likes=await root.locator('.profile-likes').evaluate(e=>({animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration,focusInside:e.contains(document.activeElement),underlayInert:!!e.closest('.profile-page')?.querySelector('.d4-body[inert]')}));await root.getByRole('button',{name:t('Got it'),exact:true}).click();await expect(root.getByRole('dialog')).toHaveCount(0)
 await root.locator('#likes').click();await root.locator('.d4-close').click();await expect(root.getByRole('dialog')).toHaveCount(0)
 await root.locator('#likes').click();await root.locator('.d4-veil').click({position:{x:5,y:5}});await expect(root.getByRole('dialog')).toHaveCount(0)
 await root.locator('#likes').click();await page.keyboard.press('Escape');await expect(root.getByRole('dialog')).toHaveCount(0)
 for(const [id,name] of [['following','following-empty'],['followers','followers-empty'],['profile-visitors','visitors-empty'],['profile-letters','my-letters-empty']]){await root.locator('#'+id).click();await snap(name!);await back()}
 await root.locator('#following').click();await root.locator('.ui-profile-tabs button').nth(1).click();await expect(root.locator('.ui-profile-tabs button').nth(1)).toHaveAttribute('aria-pressed','true');await back()
 await root.locator('#edit-profile').click();await root.locator('#change-avatar').click();await snap('edit-avatar-boundary');await root.locator('.d4-close').click();await expect(root.locator('#edit-name')).toBeVisible();await back()
 await root.locator('#edit-avatar').click();await snap('avatar-boundary');await root.locator('.d4-close').click()
 await root.locator('#upload-image-card').click();await snap('cards-boundary');await page.locator('.cards-cancel').click()
 await root.locator('#profile-moments').click();await snap('moments-boundary');await page.locator('#d5-back').click()
 await back();populated=true;await enter();await expect(root.locator('.image-card img')).toBeVisible();await snap('profile-content')
 await root.locator('#following').click();await snap('following-list');await root.locator('[data-connection]').click();await expect(page.locator('.person-page .person-name')).toHaveText('Audit connection');await snap('following-person-boundary');await page.locator('.person-page #page-back').click();await expect(root.locator('[data-connection]')).toBeVisible();await back()
 await root.locator('#profile-visitors').click();await root.locator('.ui-profile-tabs button').nth(1).click();await expect(root.locator('.ui-row--profile-visitor')).toBeVisible();await snap('visitors-outgoing');await root.locator('.ui-row--profile-visitor').click();await expect(page.locator('.person-page')).toBeVisible();await page.locator('.person-page #page-back').click();await expect(root.locator('.ui-row--profile-visitor')).toBeVisible();await back()
 await root.locator('#profile-letters').click();await snap('my-letters');await root.locator('.profile-letter').click();checks.letterClickStays=await root.locator('.profile-letter').isVisible();await snap('letter-click-gap');await back()
 await root.locator('#edit-profile').click();await root.locator('.d4-body').hover();await page.mouse.wheel(0,1800);await page.waitForTimeout(150);checks.scroll=await root.locator('.d4-body').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight}));expect(checks.scroll.top).toBeGreaterThan(0);await snap('edit-scrolled');await back()
 const press=root.locator('#likes');await press.hover();await page.mouse.down();checks.press=await press.evaluate(e=>({transform:getComputedStyle(e).transform,transition:getComputedStyle(e).transitionDuration}));await page.mouse.move(1,1);await page.mouse.up()
 await back();failLoad=true;await page.locator('#open-profile').click();await expect(root.locator(':scope > .d4-error')).toBeVisible();await snap('load-failure');await back();failLoad=false;await enter();await snap('load-recovered')
 checks.clipped=records.flatMap(r=>r.copy.filter((c:any)=>c.clipped).map((c:any)=>({step:r.name,...c})));expect(errors).toEqual([])
 checks.motion=await root.locator('.d4-body').evaluate(e=>({animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration}))
 writeFileSync(`${out}/${height}-${lang}-checks.json`,JSON.stringify({fixture:true,checks,calls,errors},null,2))
 expect.soft(checks.motion.animation).toBe('none');expect.soft(checks.likes.duration).toBe('0.22s')
})
