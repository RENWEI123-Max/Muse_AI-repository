# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r17-audit.spec.ts >> 667 en R17 API fixture walkthrough
- Location: tests/r17-audit.spec.ts:6:61

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('.profile-page').first().locator('#following')

```

# Page snapshot

```yaml
- main "MauGo" [ref=e3]:
  - generic [ref=e5]:
    - generic:
      - img "MauGo"
      - generic:
        - button "Bird appearance" [ref=e6] [cursor=pointer]
        - button "Filters" [ref=e7] [cursor=pointer]
    - generic:
      - generic [aria-hidden]: ✦
      - generic [aria-hidden]: ✦
      - generic [aria-hidden]: ✦
      - button "Tap the hat to meet three new letters" [ref=e8] [cursor=pointer]:
        - img "A black magic hat with a glowing green ribbon" [ref=e9]
    - paragraph [ref=e10]: Everyone
    - paragraph: No letters yet. Try a wider search.
    - generic [ref=e11]:
      - button "Diamonds" [ref=e12] [cursor=pointer]
      - button "Filter Pass ›" [ref=e13] [cursor=pointer]
    - generic [ref=e14]:
      - button "Edit filters" [ref=e15] [cursor=pointer]
      - button "Write a letter" [ref=e17] [cursor=pointer]: Send a letter
    - navigation [ref=e18]:
      - button "Home" [ref=e19] [cursor=pointer]
      - button "Messages" [ref=e20] [cursor=pointer]
      - button "My profile" [ref=e21] [cursor=pointer]: Profile
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test'
  2  | import {readFileSync,writeFileSync} from 'node:fs'
  3  | const out='docs/ui-redo/r17-audit'
  4  | const source=readFileSync('src/lib/i18n.ts','utf8')
  5  | const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
  6  | for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R17 API fixture walkthrough`,async({page})=>{
  7  |  test.setTimeout(180000);page.setDefaultTimeout(10000)
  8  |  const t=(s:string)=>lang==='ko'?(ko[s]||s):s
  9  |  await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
  10 |  let populated=false,failSave=false,failLoad=false
  11 |  const profile={id:'r17-reader',displayName:'Audit reader',age:24,city:'Seoul',zodiac:'Libra',bio:'',avatar:null,avatars:[],following:false,permissions:{canFollow:false,conversationId:null}}
  12 |  const rows=[{id:'audit-chat',peerId:'audit-peer',displayName:'Audit connection',status:'open',following:true}]
  13 |  const calls:any[]=[],records:any[]=[],checks:any={},errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  14 |  await page.route('**/api/**',async route=>{
  15 |   const req=route.request(),url=new URL(req.url()),p=url.pathname.replace('/api',''),method=req.method();calls.push({path:p,query:url.search,method,body:method==='PATCH'?req.postDataJSON():undefined});const ok=(json:any)=>route.fulfill({json})
  16 |   if(p==='/auth/login')return ok({id:profile.id,token:'r17-api-fixture'})
  17 |   if(p==='/profiles/me'){
  18 |    if(failLoad||method==='PATCH'&&failSave)return route.fulfill({status:503,json:{message:t('Please try again.')}})
  19 |    if(method==='PATCH')Object.assign(profile,req.postDataJSON())
  20 |    return ok(profile)
  21 |   }
  22 |   if(p==='/profiles/me/stats')return ok({followingCount:populated?1:0,followersCount:0,likesCount:0,postLikesCount:0,imageCardLikesCount:0,visits:populated?[{visitorId:profile.id,profileId:'audit-peer',visitedAt:'2026-11-14T10:00:00Z'}]:[],letters:populated?[{content:t('A small moment worth keeping.')}]:[]})
  23 |   if(p==='/profiles/me/followers')return ok({items:[]})
  24 |   if(p==='/profiles/audit-peer/summary')return ok({id:'audit-peer',displayName:'Audit connection'})
  25 |   if(p==='/profiles/audit-peer')return ok({...profile,id:'audit-peer',displayName:'Audit connection',permissions:{canFollow:true,conversationId:'audit-chat'}})
  26 |   if(p==='/users/me/image-cards')return ok({items:populated?[{id:'audit-card',url:'/media/audit-card',type:'portrait',visibility:'everyone',isPrimary:true}]:[]})
  27 |   if(p.startsWith('/profiles/')&&p.endsWith('/image-cards'))return ok({items:[]})
  28 |   if(p.startsWith('/media/'))return route.fulfill({contentType:'image/png',body:readFileSync('src/assets/05-avatars/portrait-3.png')})
  29 |   if(p==='/conversations')return ok({items:populated?rows:[],hasMore:false})
  30 |   if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  31 |   if(p==='/filter-pass')return ok({active:false,plans:[]})
  32 |   if(method!=='GET')throw Error('Unexpected mutation '+method+' '+p)
  33 |   return ok({items:[],cities:[],responses:[]})
  34 |  })
  35 |  const root=page.locator('.profile-page').first()
  36 |  const snap=async(name:string)=>{
  37 |   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})))})
  38 |   await page.waitForTimeout(350);await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  39 |   const m=await root.evaluate(e=>({document:{height:document.documentElement.scrollHeight,y:scrollY,width:document.documentElement.scrollWidth},regions:[...e.querySelectorAll('.d4-body,.profile-likes')].filter(x=>x.getClientRects().length).map(x=>({selector:x.className,height:x.clientHeight,content:x.scrollHeight,top:x.scrollTop,width:x.clientWidth,scrollWidth:x.scrollWidth,overscroll:getComputedStyle(x).overscrollBehavior,animation:getComputedStyle(x).animationName,duration:getComputedStyle(x).animationDuration})),copy:[...e.querySelectorAll('button,p,h1,h2,h3,small,label')].filter(x=>x.getClientRects().length&&!x.querySelector('input,textarea,select')&&getComputedStyle(x).visibility!=='hidden').map(x=>({text:x.textContent?.trim(),clipped:x.scrollWidth>x.clientWidth+1})),images:[...e.querySelectorAll('img')].filter(x=>x.getClientRects().length).map(x=>({decoded:x.complete&&x.naturalWidth>0}))}))
  40 |   records.push({name,...m});writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,calls,records,checks,errors},null,2));expect(m.document).toEqual({height,y:0,width:375})
  41 |  }
  42 |  const back=()=>root.locator('#page-back').click()
  43 |  const enter=async()=>{await page.locator('#open-profile').click();await expect(root.locator('#edit-profile')).toHaveText(profile.displayName)}
  44 |  await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r17-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await enter()
  45 |  await snap('profile-empty')
  46 |  await root.locator('#edit-profile').click();await snap('profile-edit')
  47 |  await root.locator('#edit-name').fill('Cancelled draft');await back();await expect(root.locator('#edit-profile')).toHaveText('Audit reader')
  48 |  await root.locator('#edit-profile').click();await root.locator('#edit-age').fill('17');await root.locator('#save-profile').click();await expect(root.getByRole('alert')).toHaveText(t('Enter a name and an age between 18 and 100.'));await snap('profile-invalid');expect(calls.filter(c=>c.method==='PATCH')).toHaveLength(0)
  49 |  await root.locator('#edit-age').fill('25');failSave=true;await root.locator('#save-profile').click();await expect(root.getByRole('alert')).toHaveText(t('Please try again.'));await snap('save-failure');failSave=false
  50 |  await root.locator('#edit-name').fill('Audit saved');await root.locator('#save-profile').click();await expect(root.locator('#edit-profile')).toHaveText('Audit saved');await snap('save-success')
  51 |  await root.locator('#likes').click();await snap('profile-likes');checks.likes=await root.locator('.profile-likes').evaluate(e=>({animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration}));await root.getByRole('button',{name:t('Got it'),exact:true}).click();await expect(root.getByRole('dialog')).toHaveCount(0)
  52 |  await root.locator('#likes').click();await root.locator('.d4-close').click();await expect(root.getByRole('dialog')).toHaveCount(0)
  53 |  await root.locator('#likes').click();await root.locator('.d4-veil').click({position:{x:5,y:5}});await expect(root.getByRole('dialog')).toHaveCount(0)
  54 |  await root.locator('#likes').click();await page.keyboard.press('Escape');await expect(root.getByRole('dialog')).toHaveCount(0)
> 55 |  for(const [id,name] of [['following','following-empty'],['followers','followers-empty'],['profile-visitors','visitors-empty'],['profile-letters','my-letters-empty']]){await root.locator('#'+id).click();await snap(name!);await back()}
     |                                                                                                                                                                                                    ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  56 |  await root.locator('#following').click();await root.locator('.ui-profile-tabs button').nth(1).click();await expect(root.locator('.ui-profile-tabs button').nth(1)).toHaveAttribute('aria-pressed','true');await back()
  57 |  await root.locator('#edit-profile').click();await root.locator('#change-avatar').click();await snap('edit-avatar-boundary');await root.locator('.d4-close').click();await expect(root.locator('#edit-name')).toBeVisible();await back()
  58 |  await root.locator('#edit-avatar').click();await snap('avatar-boundary');await root.locator('.d4-close').click()
  59 |  await root.locator('#upload-image-card').click();await snap('cards-boundary');await page.locator('.cards-cancel').click()
  60 |  await root.locator('#profile-moments').click();await snap('moments-boundary');await page.locator('#d5-back').click()
  61 |  await back();populated=true;await enter();await expect(root.locator('.image-card img')).toBeVisible();await snap('profile-content')
  62 |  await root.locator('#following').click();await snap('following-list');await root.locator('[data-connection]').click();await expect(page.locator('.person-page .person-name')).toHaveText('Audit connection');await snap('following-person-boundary');await page.locator('.person-page #page-back').click();await expect(root.locator('[data-connection]')).toBeVisible();await back()
  63 |  await root.locator('#profile-visitors').click();await root.locator('.ui-profile-tabs button').nth(1).click();await expect(root.locator('.ui-row--profile-visitor')).toBeVisible();await snap('visitors-outgoing');await root.locator('.ui-row--profile-visitor').click();await expect(page.locator('.person-page')).toBeVisible();await page.locator('.person-page #page-back').click();await expect(root.locator('.ui-row--profile-visitor')).toBeVisible();await back()
  64 |  await root.locator('#profile-letters').click();await snap('my-letters');await root.locator('.profile-letter').click();checks.letterClickStays=await root.locator('.profile-letter').isVisible();await snap('letter-click-gap');await back()
  65 |  await root.locator('#edit-profile').click();await root.locator('.d4-body').hover();await page.mouse.wheel(0,1800);await page.waitForTimeout(150);checks.scroll=await root.locator('.d4-body').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight}));expect(checks.scroll.top).toBeGreaterThan(0);await snap('edit-scrolled');await back()
  66 |  const press=root.locator('#likes');await press.hover();await page.mouse.down();checks.press=await press.evaluate(e=>({transform:getComputedStyle(e).transform,transition:getComputedStyle(e).transitionDuration}));await page.mouse.move(1,1);await page.mouse.up()
  67 |  await back();failLoad=true;await page.locator('#open-profile').click();await expect(root.getByRole('alert')).toBeVisible();await snap('load-failure');await back();failLoad=false;await enter();await snap('load-recovered')
  68 |  checks.clipped=records.flatMap(r=>r.copy.filter((c:any)=>c.clipped).map((c:any)=>({step:r.name,...c})));expect(errors).toEqual([])
  69 |  checks.motion=await root.locator('.d4-body').evaluate(e=>({animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration}))
  70 |  writeFileSync(`${out}/${height}-${lang}-checks.json`,JSON.stringify({fixture:true,checks,calls,errors},null,2))
  71 |  expect.soft(checks.motion.animation).toBe('none')
  72 | })
  73 | 
```