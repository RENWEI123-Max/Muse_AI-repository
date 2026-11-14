import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const out='docs/ui-redo/r12-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R12 safe UI walkthrough with API fixtures`,async({page})=>{
 test.setTimeout(120000);page.setDefaultTimeout(8000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 let remarkFail=false,searchFail=false
 const calls:any[]=[],records:any[]=[],checks:any={},errors:string[]=[],forbidden:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 const rows=[{id:'open',peerId:'peer-open',displayName:'Tea friend',remark:'',status:'open'},{id:'waiting',peerId:'peer-waiting',displayName:'Your sent letter',remark:'',status:'waiting'}].map(r=>({...r,pinned:false,muted:false,hidden:false,following:false,unreadCount:0,lastMessage:'Thank you for listening.',updatedAt:'2026-11-14T10:00:00Z'}))
 const messages=Array.from({length:24},(_,i)=>({id:`m${i}`,content:`${i+1}. Thank you for listening.`,kind:'reply',createdAt:'2026-11-14T10:00:00Z',mine:i%2===0}))
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace('/api',''),method=req.method();calls.push({path:p,query:url.search,method,body:method==='PATCH'?req.postDataJSON():undefined});const ok=(json:any)=>route.fulfill({json})
  if((p==='/reports'&&method==='POST')||(method==='PATCH'&&req.postDataJSON().clearHistory)||(p.startsWith('/blocks/')&&method!=='GET')){forbidden.push(p);return route.abort()}
  if(p==='/auth/login')return ok({id:'r12-reader',token:'r12-api-fixture'})
  if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  if(p==='/filter-pass')return ok({active:false,plans:[]})
  if(p==='/letters'||p==='/letters/refresh')return ok({items:[],responses:[]})
  if(p==='/blocks')return ok({items:[]})
  if(p==='/profiles/peer-open')return ok({id:'peer-open',displayName:'Tea friend',age:24,city:'Seoul',zodiac:null,bio:'',avatar:null,avatars:[],following:false,permissions:{canFollow:true,conversationId:'open'}})
  if(p==='/conversations')return ok({items:rows,hasMore:false})
  if(p.endsWith('/replies/pending'))return ok({items:[],hasMore:false})
  if(p==='/conversations/open'&&method==='PATCH'){if(remarkFail)return route.fulfill({status:503,json:{message:t('Please try again.')}});rows[0]!.remark=req.postDataJSON().remark;return ok({})}
  if(p.endsWith('/messages')){if(url.searchParams.has('search')){if(searchFail)return route.fulfill({status:503,json:{message:t('Please try again.')}});return ok({items:url.searchParams.get('search')==='listening'?messages:[],hasMore:false})}return ok({items:messages,hasMore:false})}
  return ok({items:[],cities:[]})
 })
 const root=page.locator('.c6-chat'),back=()=>root.getByLabel(t('Back to messages')).click()
 const snap=async(name:string,state?:string)=>{
  if(state)await expect(root).toHaveAttribute('data-state',state)
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(350)
  await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  records.push({name,state:await root.getAttribute('data-state'),document:await page.evaluate(()=>({height:document.documentElement.scrollHeight,y:scrollY,viewport:innerHeight})),copy:await root.locator('button,p,h1,h2,h3,small,label').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})))})
  writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,calls,records,checks,errors,forbidden},null,2))
 }
 const scroll=async(selector:string)=>{const el=page.locator(selector);await el.hover();await page.mouse.wheel(0,10000);await page.waitForTimeout(150);return el.evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight,bottom:e.getBoundingClientRect().bottom}))}
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r12-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await page.locator('#open-inbox').click()
 await page.locator('[data-chat="waiting"]').click();await page.locator('#chat-details').click();await snap('chat-details-waiting','chat-details-waiting')
 checks.waitingControls=await root.locator('#remark-name,#chat-background,#chat-bubbles,#block-chat,#report-person,.ui-switch,.chat-follow,#view-public-profile').evaluateAll(es=>es.map(e=>({id:e.id,disabled:(e as HTMLButtonElement).disabled})))
 checks.waitingScroll=await scroll('.chat-settings-body');expect(checks.waitingScroll.top).toBeGreaterThan(0);await snap('waiting-scrolled');await back();await expect(root).toHaveAttribute('data-state','chat-waiting');await back()
 await page.locator('[data-chat="open"]').click();await page.locator('#chat-details').click();await snap('chat-details','chat-details');checks.unlockedDisabled=await root.locator('.chat-follow,.ui-switch').evaluateAll(es=>es.map(e=>({disabled:(e as HTMLInputElement).disabled})));checks.detailsScroll=await scroll('.chat-settings-body');expect(checks.detailsScroll.top).toBeGreaterThan(0);expect(checks.detailsScroll.bottom).toBe(height-28);await snap('details-scrolled');await root.locator('#remark-name').click();await snap('chat-remark','chat-remark')
 checks.remarkMotion=await page.locator('.chat-settings-dialog').evaluate(e=>({animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration,easing:getComputedStyle(e).animationTimingFunction,box:e.getBoundingClientRect().toJSON()}))
 await page.getByLabel(t('Remark'),{exact:true}).fill('Unsaved draft');await page.locator('.chat-dialog-close').click();await expect(page.locator('#remark-name')).not.toContainText('Unsaved draft');await page.locator('#remark-name').click();await expect(page.getByLabel(t('Remark'),{exact:true})).toHaveValue('')
 await page.getByLabel(t('Remark'),{exact:true}).fill(lang==='ko'?'조용한 친구':'Quiet friend');remarkFail=true;await page.getByRole('button',{name:t('Save remark'),exact:true}).click();await expect(root.getByRole('alert')).toBeVisible();await expect(page.locator('.chat-settings-dialog')).toBeVisible();await snap('remark-save-failure');remarkFail=false;await page.getByRole('button',{name:t('Save remark'),exact:true}).click();await expect(page.locator('.chat-settings-dialog')).toHaveCount(0);await expect(page.locator('.chat-person-name')).toHaveText(lang==='ko'?'조용한 친구':'Quiet friend');await snap('remark-saved')
 await page.getByRole('button',{name:t('Search chat history')}).click();await snap('chat-search-empty','chat-search-empty');await page.locator('#message-search').fill('listening');await expect(page.locator('.chat-search-result')).toHaveCount(24);await snap('chat-search-result','chat-search-result');checks.resultsScroll=await scroll('.c6-results');expect(checks.resultsScroll.top).toBeGreaterThan(0);await snap('search-scrolled');await page.locator('#message-search').fill('unmatched-query');await expect(page.locator('.chat-search-none')).toBeVisible();await snap('chat-search-none','chat-search-none');await back();await expect(root).toHaveAttribute('data-state','chat-details')
 await page.getByRole('button',{name:t('Search chat history')}).click();await expect(page.locator('#message-search')).toHaveValue('');searchFail=true;await page.locator('#message-search').fill('failure');await expect(root.getByRole('alert')).toBeVisible();await snap('search-failure');searchFail=false;await page.locator('#message-search').fill('listening');await expect(page.locator('.chat-search-result')).toHaveCount(24);await back()
 await page.locator('#clear-chat').click();await snap('chat-clear-confirm','chat-clear-confirm');checks.clearMotion=await page.locator('.chat-settings-dialog').evaluate(e=>({animation:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration,easing:getComputedStyle(e).animationTimingFunction,box:e.getBoundingClientRect().toJSON()}));await page.locator('.chat-dialog-cancel').click();await expect(root).toHaveAttribute('data-state','chat-details');await page.locator('#clear-chat').click();await page.locator('.chat-dialog-close').click();await expect(root).toHaveAttribute('data-state','chat-details')
 await page.locator('#block-chat').click();await snap('block-boundary','block-confirm');await page.locator('.safety-dialog-cancel').click();await expect(root).toHaveAttribute('data-state','chat-details');await page.locator('#report-person').click();await snap('report-choice-boundary','safety-choice');await page.locator('#safety-report').click();await snap('report-form-boundary','report-empty');await back();await expect(root).toHaveAttribute('data-state','chat-details');await snap('report-return');await page.locator('#view-public-profile').click();await expect(page.locator('#public-more')).toBeVisible();await page.locator('#page-back').click();await expect(root).toHaveAttribute('data-state','chat-details');checks.profileReturn=true
 await back();await expect(root).toHaveAttribute('data-state','chat-open');await back();await expect(page.locator('.inbox-flow')).toBeVisible()
 expect(errors).toEqual([]);expect(forbidden).toEqual([]);for(const r of records){expect.soft(r.document.height).toBe(height);expect.soft(r.document.y).toBe(0)}
 writeFileSync(`${out}/${height}-${lang}-checks.json`,JSON.stringify({fixture:true,checks,errors,forbidden,calls,clipped:records.flatMap(r=>r.copy.filter((c:any)=>c.clipped).map((c:any)=>({step:r.name,...c})))},null,2))
})
