import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const out='docs/ui-redo/r14-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R14 safety walkthrough with API fixtures`,async({page})=>{
 test.setTimeout(120000);page.setDefaultTimeout(8000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 let remarkFail=false,searchFail=false,blocked=false,blockFailure=false,manyBlocks=false
 const calls:any[]=[],records:any[]=[],checks:any={},errors:string[]=[],forbidden:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 const rows=[{id:'open',peerId:'peer-open',displayName:'Tea friend',remark:'',status:'open'},{id:'other',peerId:'peer-other',displayName:'Other friend',remark:'',status:'open'},{id:'waiting',peerId:'peer-waiting',displayName:'Your sent letter',remark:'',status:'waiting'}].map(r=>({...r,pinned:false,muted:false,hidden:false,following:false,unreadCount:0,lastMessage:'Thank you for listening.',updatedAt:'2026-11-14T10:00:00Z'}))
 const messages=Array.from({length:24},(_,i)=>({id:`m${i}`,content:`${i+1}. Thank you for listening.`,kind:'reply',createdAt:'2026-11-14T10:00:00Z',mine:i%2===0}))
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace('/api',''),method=req.method();calls.push({path:p,query:url.search,method,body:method==='PATCH'?req.postDataJSON():undefined});const ok=(json:any)=>route.fulfill({json})
  if((p==='/reports'&&method==='POST')||(method==='PATCH'&&req.postDataJSON().clearHistory)||(p.startsWith('/blocks/')&&method!=='GET')){forbidden.push(p);return route.abort()}
  if(p==='/auth/login')return ok({id:'r14-reader',token:'r14-api-fixture'})
  if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  if(p==='/filter-pass')return ok({active:false,plans:[]})
  if(p==='/letters'||p==='/letters/refresh')return ok({items:[],responses:[]})
  if(p==='/blocks')return blockFailure?route.fulfill({status:503,json:{message:t('Please try again.')}}):ok({items:manyBlocks?Array.from({length:20},(_,i)=>({userId:i?'peer-'+i:'peer-open',createdAt:'2026-11-14T10:00:00Z'})):blocked?[{userId:'peer-open',createdAt:'2026-11-14T10:00:00Z'}]:[]})
  if(p==='/profiles/peer-open')return ok({id:'peer-open',displayName:'Tea friend',age:24,city:'Seoul',zodiac:null,bio:'',avatar:null,avatars:[],following:false,permissions:{canFollow:true,conversationId:'open'}})
  if(p==='/conversations')return ok({items:rows,hasMore:false})
  if(p.endsWith('/replies/pending'))return ok({items:[],hasMore:false})
  if(p==='/conversations/open'&&method==='PATCH'){if(remarkFail)return route.fulfill({status:503,json:{message:t('Please try again.')}});rows[0]!.remark=req.postDataJSON().remark;return ok({})}
  if(p.endsWith('/messages')){if(url.searchParams.has('search')){if(searchFail)return route.fulfill({status:503,json:{message:t('Please try again.')}});return ok({items:url.searchParams.get('search')==='listening'?messages:[],hasMore:false})}return ok({items:messages,hasMore:false})}
  return ok({items:[],cities:[]})
 })
 const root=page.locator('.c6-chat')
 const snap=async(name:string,state?:string)=>{
  if(state)await expect(root).toHaveAttribute('data-state',state)
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})))})
  await page.waitForTimeout(450)
  await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  const measure=await page.locator('.app-shell').evaluate(e=>({state:e.getAttribute('data-state'),document:{height:document.documentElement.scrollHeight,y:scrollY,width:document.documentElement.scrollWidth},body:[...e.querySelectorAll('.d3-report,.d3-blocked,.safety-choice-sheet,.safety-confirm-dialog')].map(b=>({height:b.clientHeight,content:b.scrollHeight,top:b.scrollTop,bottom:b.getBoundingClientRect().bottom,overscroll:getComputedStyle(b).overscrollBehaviorY,animation:getComputedStyle(b).animationName,duration:getComputedStyle(b).animationDuration})),copy:[...e.querySelectorAll('button,p,h1,figcaption,label,span')].filter(b=>b.getClientRects().length).map(b=>({text:b.textContent?.trim(),clipped:b.scrollWidth>b.clientWidth+1})),images:[...e.querySelectorAll('img')].filter(b=>b.getClientRects().length).map(b=>({src:b.getAttribute('src'),decoded:b.complete&&b.naturalWidth>0})),gradients:[...e.querySelectorAll('.wallpaper-default,.wallpaper-name,.appearance-caption,.theme-card,.appearance-apply')].map(b=>({selector:b.className,theme:b.getAttribute('data-theme'),background:getComputedStyle(b).backgroundImage}))}))
  records.push({name,...measure});writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,calls,records,checks,errors},null,2))
  expect(measure.document.height).toBe(height);expect(measure.document.y).toBe(0);expect(measure.document.width).toBe(375)
 }
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r14-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await page.locator('#open-inbox').click();await page.locator('[data-chat="open"]').click()

 const backChat=()=>root.getByLabel(t('Back to messages')).click()
 await page.locator('#chat-details').click();await page.locator('#report-person').click();await snap('safety-choice');checks.sheet=await page.locator('.safety-choice-sheet').evaluate(e=>({animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration}));await page.locator('.safety-choice-close').click();await expect(page.getByRole('dialog')).toHaveCount(0)
 await page.locator('#report-person').click();await page.locator('#safety-block').click();await snap('block-confirm');checks.dialog=await page.locator('.safety-confirm-dialog').evaluate(e=>({animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration}));await page.locator('.safety-dialog-cancel').click();await expect(page.getByRole('dialog')).toHaveCount(0)
 await page.locator('#report-person').click();await page.locator('#safety-report').click();await snap('report-empty');await page.locator('#report-reason').selectOption('spam');await page.locator('#report-details').fill('Repeated unwanted messages after I asked to stop.');await snap('report-filled')
 await page.locator('.d3-report').hover();await page.mouse.wheel(0,1800);await page.waitForTimeout(200);checks.reportScroll=await page.locator('.d3-report').evaluate(e=>{return {top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight,overscroll:getComputedStyle(e).overscrollBehaviorY,animation:getComputedStyle(e).animationName}});await snap('report-scrolled');await backChat();await snap('report-cancel-return');await backChat();await backChat()
 await page.locator('#inbox-menu').click();await page.locator('#blocked-people').click();await snap('blocked-empty');await page.locator('.d3-blocked').getByLabel(t('Back to messages')).click()
 blocked=true
 await page.locator('[data-chat="open"]').click();await snap('chat-blocked');await page.locator('#chat-details').click();await page.locator('#block-chat').click();await snap('unblock-confirm');await page.locator('.safety-dialog-cancel').click();await backChat();await backChat()
 await page.locator('#inbox-menu').click();await page.locator('#blocked-people').click();await snap('blocked-list');await page.locator('[data-unblock]').click();await snap('list-unblock-confirm');await page.locator('.safety-dialog-cancel').click();await snap('list-cancel-return');await page.locator('[data-unblock]').click();await page.locator('.safety-dialog-close').click();await page.locator('.d3-blocked').getByLabel(t('Back to messages')).click()
 manyBlocks=true;await page.locator('#inbox-menu').click();await page.locator('#blocked-people').click();await page.locator('.d3-blocked').hover();await page.mouse.wheel(0,1400);await page.waitForTimeout(250);checks.listScroll=await page.locator('.d3-blocked').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight,overscroll:getComputedStyle(e).overscrollBehaviorY}));expect(checks.listScroll.top).toBeGreaterThan(0);await snap('blocked-list-scrolled');await page.locator('.d3-blocked').getByLabel(t('Back to messages')).click();manyBlocks=false;blockFailure=true;await page.locator('#inbox-menu').click();await page.locator('#blocked-people').click();await snap('blocked-list-failure');blockFailure=false
 checks.clipped=records.flatMap(r=>r.copy.filter((c:any)=>c.clipped).map((c:any)=>({step:r.name,...c})))
 expect(forbidden).toEqual([]);expect(errors).toEqual([])
 writeFileSync(`${out}/${height}-${lang}-checks.json`,JSON.stringify({fixture:true,checks,calls,errors,forbidden},null,2))
})
