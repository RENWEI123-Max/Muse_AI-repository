# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r16-audit.spec.ts >> 667 en R16 API fixture walkthrough
- Location: tests/r16-audit.spec.ts:6:61

# Error details

```
TimeoutError: locator.evaluate: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('.person-page').locator('.d4-body')

```

# Page snapshot

```yaml
- main "MauGo" [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - button "Messages" [pressed] [ref=e8] [cursor=pointer]
        - button "Following" [ref=e9] [cursor=pointer]: Friends
      - button "Inbox menu" [ref=e10] [cursor=pointer]
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]:
          - button "Tea friend A small moment worth keeping. 18:00" [ref=e17] [cursor=pointer]:
            - generic [ref=e18]:
              - strong [ref=e19]: Tea friend
              - generic [ref=e20]: A small moment worth keeping.
            - generic [ref=e21]: 18:00
          - button "Conversation options · Tea friend" [ref=e23] [cursor=pointer]: •••
        - generic [ref=e24]:
          - button "Your sent letter Your letter is on its way 18:00 Awaiting reply" [ref=e25] [cursor=pointer]:
            - generic [ref=e26]:
              - strong [ref=e27]: Your sent letter
              - generic [ref=e28]: Your letter is on its way
            - generic [ref=e29]:
              - generic [ref=e30]: 18:00
              - generic [ref=e31]: Awaiting reply
          - button "Conversation options · Your sent letter" [ref=e32] [cursor=pointer]: •••
        - generic [ref=e33]:
          - button "Tea friend Your letter is on its way 18:00 Awaiting reply" [ref=e34] [cursor=pointer]:
            - generic [ref=e35]:
              - strong [ref=e36]: Tea friend
              - generic [ref=e37]: Your letter is on its way
            - generic [ref=e38]:
              - generic [ref=e39]: 18:00
              - generic [ref=e40]: Awaiting reply
          - button "Conversation options · Tea friend" [ref=e41] [cursor=pointer]: •••
      - generic [ref=e42]:
        - generic [ref=e43]: ♧
        - paragraph [ref=e44]: Keep up with replies
        - button "Enable" [ref=e45] [cursor=pointer]
        - button "Dismiss notification reminder" [ref=e46] [cursor=pointer]: ×
    - navigation [ref=e47]:
      - button "Home" [ref=e48] [cursor=pointer]
      - button "Messages" [ref=e49] [cursor=pointer]
      - button "Profile" [ref=e50] [cursor=pointer]
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test'
  2  | import {readFileSync,writeFileSync} from 'node:fs'
  3  | const out='docs/ui-redo/r16-audit'
  4  | const source=readFileSync('src/lib/i18n.ts','utf8')
  5  | const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
  6  | for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R16 API fixture walkthrough`,async({page})=>{
  7  |  test.setTimeout(180000);page.setDefaultTimeout(10000)
  8  |  const t=(s:string)=>lang==='ko'?(ko[s]||s):s
  9  |  await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
  10 |  let followFailure=false,profileFailure=false
  11 |  const calls:any[]=[],records:any[]=[],checks:any={},errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  12 |  const rows=['open','waiting','empty'].map(id=>({id,peerId:'peer-'+id,displayName:id==='waiting'?'Your sent letter':'Tea friend',remark:'',status:id==='open'?'open':'waiting',pinned:false,muted:false,hidden:false,following:false,unreadCount:0,lastMessage:'A small moment worth keeping.',updatedAt:'2026-11-14T10:00:00Z'}))
  13 |  await page.route('**/api/**',async route=>{
  14 |   const req=route.request(),url=new URL(req.url()),p=url.pathname.replace('/api',''),method=req.method();calls.push({path:p,query:url.search,method,body:method==='PATCH'?req.postDataJSON():undefined});const ok=(json:any)=>route.fulfill({json})
  15 |   if(p==='/auth/login')return ok({id:'r16-reader',token:'r16-api-fixture'})
  16 |   if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  17 |   if(p==='/filter-pass')return ok({active:false,plans:[]})
  18 |   if(p==='/letters'||p==='/letters/refresh')return ok({items:[],responses:[]})
  19 |   if(p==='/blocks')return ok({items:[]})
  20 |   if(p.startsWith('/media/'))return route.fulfill({contentType:'image/png',body:readFileSync('src/assets/05-avatars/'+(p.endsWith('life')?'portrait-4.png':'portrait-3.png'))})
  21 |   if(/^\/profiles\/peer-(open|waiting|empty)$/.test(p)){
  22 |    if(profileFailure)return route.fulfill({status:503,json:{message:t('Please try again.')}})
  23 |    const row=rows.find(r=>p.endsWith(r.id))!,waiting=row.id==='waiting'
  24 |    return ok({id:row.peerId,displayName:'Tea friend',age:waiting?null:25,city:waiting?null:'Seoul',zodiac:null,bio:'',avatar:'/media/avatar',avatars:[],following:row.following,permissions:{canFollow:row.status==='open',conversationId:row.id}})
  25 |   }
  26 |   if(p.endsWith('/image-cards'))return ok({items:Array.from({length:p.includes('open')?4:1},(_,i)=>({url:'/media/card-'+i}))})
  27 |   if(p==='/posts')return ok({items:url.searchParams.get('userId')==='peer-open'?[{id:'day',content:t('A small moment worth keeping.'),attachments:[{kind:'image',url:'/media/life'}]}]:[]})
  28 |   if(p==='/conversations')return ok({items:rows,hasMore:false})
  29 |   if(p.endsWith('/replies/pending'))return ok({items:[],hasMore:false})
  30 |   if(p.startsWith('/conversations/')&&method==='PATCH'){
  31 |    if(followFailure)return route.fulfill({status:503,json:{message:t('Please try again.')}})
  32 |    rows.find(r=>p.endsWith('/'+r.id))!.following=req.postDataJSON().following;return ok({})
  33 |   }
  34 |   if(p.endsWith('/messages'))return ok({items:[{id:'m1',content:'Thank you for listening.',kind:'reply',createdAt:'2026-11-14T10:00:00Z',mine:false}],hasMore:false})
  35 |   if(method!=='GET')throw Error('Unexpected mutation '+method+' '+p)
  36 |   return ok({items:[],cities:[]})
  37 |  })
  38 |  const person=page.locator('.person-page')
  39 |  const snap=async(name:string)=>{
  40 |   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})))})
  41 |   await page.waitForTimeout(350);await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  42 |   const measure=await page.evaluate(()=>({document:{height:document.documentElement.scrollHeight,y:scrollY,width:document.documentElement.scrollWidth},regions:[...document.querySelectorAll('.person-page .d4-body,.person-cards,.person-sheet')].filter(e=>e.getClientRects().length).map(e=>({selector:e.className,height:e.clientHeight,content:e.scrollHeight,top:e.scrollTop,left:e.scrollLeft,width:e.clientWidth,scrollWidth:e.scrollWidth,overscroll:getComputedStyle(e).overscrollBehavior,animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration})),copy:[...document.querySelectorAll('.person-page button,.person-page p,.person-page h2,.person-page small')].filter(e=>e.getClientRects().length).map(e=>({text:e.textContent?.trim(),clipped:e.scrollWidth>e.clientWidth+1})),images:[...document.querySelectorAll('.person-page img')].map(e=>({decoded:(e as HTMLImageElement).complete&&(e as HTMLImageElement).naturalWidth>0}))}))
  43 |   records.push({name,...measure});writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,calls,records,checks,errors},null,2))
  44 |   expect(measure.document).toEqual({height,y:0,width:375})
  45 |  }
  46 |  await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r16-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await page.locator('#open-inbox').click()
  47 |  const enter=async(id:string)=>{await page.locator(`[data-chat="${id}"]`).click();await page.locator('#chat-details').click();await page.locator('#view-public-profile').click();await expect(person).toBeVisible();if(!profileFailure)await expect(person.locator('.person-name')).toHaveText('Tea friend')}
  48 |  const returnInbox=async()=>{await person.locator('#page-back').click();await page.locator('.c6-chat').getByLabel(t('Back to messages')).click();await page.locator('.c6-chat').getByLabel(t('Back to messages')).click()}
  49 |  await enter('open');await expect(person.locator('.person-cards img')).toHaveCount(4);await snap('person-profile')
  50 |  await person.locator('#public-follow').click();await expect(person.locator('#public-follow')).toHaveText(t('✓ Following'));await snap('person-followed')
  51 |  await person.locator('#public-follow').click();await expect(person.locator('#public-follow')).toHaveText(t('＋ Follow'));await snap('unfollowed')
  52 |  followFailure=true;await person.locator('#public-follow').click();await expect(person.getByRole('alert')).toBeVisible();await expect(person.locator('#public-follow')).toHaveText(t('＋ Follow'));await snap('follow-failure');followFailure=false
  53 |  await person.locator('#public-avatar').click();await snap('person-photo');await person.locator('.person-close').click();await expect(person.getByRole('dialog')).toHaveCount(0)
  54 |  await person.locator('.ui-person-card').first().click();await snap('card-photo');await person.locator('.person-veil').click({position:{x:5,y:5}});await expect(person.getByRole('dialog')).toHaveCount(0)
  55 |  await person.locator('.person-cards').hover();await page.mouse.wheel(600,0);await page.waitForTimeout(150);checks.cards=await person.locator('.person-cards').evaluate(e=>({left:e.scrollLeft,width:e.clientWidth,content:e.scrollWidth}));expect(checks.cards.left).toBeGreaterThan(0);await snap('cards-scrolled')
  56 |  await person.locator('.d4-body').hover();await page.mouse.wheel(0,700);await page.waitForTimeout(150);checks.body=await person.locator('.d4-body').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight}));expect(checks.body.top).toBeGreaterThan(0);await snap('moments-scrolled')
> 57 |  await person.locator('.ui-person-moment-photo').click();await snap('moment-photo');await page.keyboard.press('Escape');await expect(person.getByRole('dialog')).toHaveCount(0);expect(await person.locator('.d4-body').evaluate(e=>e.scrollTop)).toBe(checks.body.top)
     |                                                                                                                                                                                                                         ^ TimeoutError: locator.evaluate: Timeout 10000ms exceeded.
  58 |  await person.locator('#public-more').click();await snap('person-safety');await person.locator('.person-close').click();await person.locator('#public-more').click();await page.keyboard.press('Escape');await expect(person.getByRole('dialog')).toHaveCount(0)
  59 |  await person.locator('#public-more').click();await person.locator('#safety-report').click();await expect(page.locator('.d3-report')).toBeVisible();await page.locator('#report-details').fill('R16 fixture report, cancelled without submission.');await snap('report-boundary');await page.locator('.c6-chat').getByLabel(t('Back to messages')).click()
  60 |  await page.locator('#view-public-profile').click();await person.locator('#public-more').click();await person.locator('#safety-block').click();await expect(page.locator('.safety-confirm-dialog')).toBeVisible();await snap('block-boundary');await page.locator('.safety-dialog-cancel').click()
  61 |  await page.locator('#view-public-profile').click();await person.locator('#public-chat').click();await expect(page.locator('#chat-form')).toBeVisible();await snap('chat-boundary');await page.locator('.c6-chat').getByLabel(t('Back to messages')).click()
  62 |  await enter('waiting');await expect(person.locator('#public-follow')).toBeDisabled();await snap('person-waiting');await person.locator('#public-chat').click();await expect(page.locator('#chat-form')).toHaveCount(0);await snap('waiting-chat');await page.locator('.c6-chat').getByLabel(t('Back to messages')).click()
  63 |  await enter('empty');await expect(person.locator('.person-empty')).toHaveText(t('No moments yet.'));await snap('person-no-content');await returnInbox()
  64 |  profileFailure=true;await enter('open');await expect(person.getByRole('alert')).toBeVisible();await snap('profile-failure');await returnInbox();profileFailure=false
  65 |  await enter('open');await expect(person.getByRole('alert')).toHaveCount(0);await snap('profile-recovered');await returnInbox()
  66 |  checks.clipped=records.flatMap(r=>r.copy.filter((c:any)=>c.clipped).map((c:any)=>({step:r.name,...c})));expect(errors).toEqual([])
  67 |  writeFileSync(`${out}/${height}-${lang}-checks.json`,JSON.stringify({fixture:true,checks,calls,errors},null,2))
  68 | })
  69 |
```
