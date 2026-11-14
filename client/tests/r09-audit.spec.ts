import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
const out='docs/ui-redo/r09-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang}: inbox real-click walkthrough (API fixture)`,async({page})=>{
 test.setTimeout(120000);page.setDefaultTimeout(10000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>{localStorage.setItem('maugo-language',lang);(window as any).__r09Effects=[];document.addEventListener('animationstart',event=>{const e=event.target as HTMLElement;if(e.closest('.inbox-flow'))(window as any).__r09Effects.push({kind:'animation',name:event.animationName,duration:getComputedStyle(e).animationDuration,time:performance.now()})});document.addEventListener('transitionend',event=>{const e=event.target as HTMLElement;if(e.matches('.reply-receipt'))(window as any).__r09Effects.push({kind:'transition',property:event.propertyName,elapsed:event.elapsedTime,time:performance.now()})})},lang)
 const make=(n:number,status='open')=>Array.from({length:n},(_,i)=>({id:`chat-${i}`,peerId:`peer-${i}`,displayName:i===0?'Tea friend':`Little bird ${i}`,remark:'',pinned:false,muted:false,hidden:false,following:false,unreadCount:0,status,lastMessage:'A gentle little story.',updatedAt:'2026-11-14T10:00:00Z'}))
 let rows=make(3),queue=rows.map(c=>({id:`reply-${c.id}`,conversationId:c.id})),failList=false,failPatch=false,failRead=false
 const calls:any[]=[],errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace('/api',''),q=url.searchParams,method=req.method();calls.push({path:p,query:url.search,method,body:req.postDataJSON()})
  const ok=(json:any)=>route.fulfill({json}),bad=()=>route.fulfill({status:503,json:{message:'Conversation API is unavailable. Please try again later.'}})
  if(p==='/auth/login')return ok({id:'r09-reader',token:'r09-api-fixture'})
  if(p==='/wallet')return ok({diamonds:100,freeRemaining:10,cost:0,paidCost:10})
  if(p==='/filter-pass')return ok({active:false,plans:[]})
  if(p==='/letters'||p==='/letters/refresh')return ok({items:[],responses:[]})
  if(p==='/conversations'){
   if(failList)return bad()
   let list=rows.filter(c=>c.hidden===(q.get('hidden')==='true')&&(q.get('tab')!=='friends'||c.following)).sort((a,b)=>Number(b.pinned)-Number(a.pinned))
   const offset=Number(q.get('offset')||0),limit=Number(q.get('limit')||20);return ok({items:list.slice(offset,offset+limit),hasMore:offset+limit<list.length})
  }
  const id=p.split('/')[2],c=rows.find(c=>c.id===id)
  if(p.endsWith('/replies/pending'))return ok({items:queue.filter(r=>r.conversationId===id),hasMore:false})
  if(p.endsWith('/collect')){queue=queue.filter(r=>r.id!==p.split('/')[4]);if(c){c.status='open';c.unreadCount++}return ok({state:'collected',cost:0})}
  if(p.endsWith('/messages')){
   if(failRead&&q.get('markRead')==='true')return bad()
   if(c&&q.get('markRead')==='true')c.unreadCount=0
   const match=!q.get('search')||'A gentle little story.'.includes(q.get('search')!)
   return ok({items:match?[{id:`message-${id}`,content:'A gentle little story.',kind:'reply',createdAt:'2026-11-14T10:00:00Z',senderId:c?.peerId,mine:false}]:[],hasMore:false,canChat:c?.status==='open'})
  }
  if(p.startsWith('/conversations/')&&method==='PATCH'){if(failPatch)return bad();Object.assign(c!,req.postDataJSON());return ok(c)}
  return ok({items:[],cities:[],products:[],packs:[]})
 })
 const records:any[]=[],steps:any[]=[]
 const root=page.locator('.inbox-flow')
 const shot=async(name:string)=>{await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`});steps.push({step:name,time:new Date().toISOString()});console.log(height,lang,name)}
 const settled=()=>expect(root).toHaveAttribute('aria-busy','false')
 const state=async(name:string)=>{await settled();await expect(root).toHaveAttribute('data-state',name);if(name==='inbox-drawer')await expect(page.locator('.inbox-drawer')).toHaveCSS('animation-name','none');await shot(name);records.push({state:name,document:await page.evaluate(()=>({height:document.documentElement.scrollHeight,y:scrollY,viewport:innerHeight})),copy:await root.locator('button,p,h1,h2,h3,small').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})))})}
 const reopen=async()=>{await page.locator('.inbox-flow > .main-nav button').first().click();await page.locator('#open-inbox').click();await settled()}
 const menu=()=>page.locator('#inbox-menu').click()
 const option=async()=>{await settled();await page.locator('[data-options]').first().click()}
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r09-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await page.locator('#open-inbox').click();await settled();await page.getByLabel(t('Dismiss notification reminder')).click()
 await page.evaluate(()=>{let visible=false;const observer=new MutationObserver(()=>{const receipt=document.querySelector('.inbox-flow .reply-receipt');if(receipt&&!visible){visible=true;(window as any).__r09Effects.push({kind:'toast-enter',time:performance.now()})}if(receipt?.classList.contains('reply-receipt-leave-active')){(window as any).__r09Effects.push({kind:'toast-leave',time:performance.now()})}if(!receipt&&visible){visible=false;(window as any).__r09Effects.push({kind:'toast-removed',time:performance.now()})}});observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})})
 await state('inbox-pending');if(lang==='ko')await expect(page.locator('.inbox-tab').first()).toHaveCSS('font-family',/GowunDodum/)
 await page.locator('#collect-replies').hover();await page.mouse.down();const press=await page.locator('#collect-replies').evaluate(e=>getComputedStyle(e).transform);await page.mouse.move(5,100);await page.mouse.up();expect(press).toBe('matrix(0.99, 0, 0, 0.99, 0, 0)')
 await page.locator('#collect-replies').click();await expect(page.locator('.reply-dialog')).toHaveCSS('animation-duration','0.22s');await page.locator('#reply-payment-cancel').click();await expect(page.locator('#collect-replies>b')).toHaveText('3');await shot('collect-cancelled')
 for(let n=3;n>0;n--){await page.locator('#collect-replies').click();await page.locator('#confirm-reply-payment').click();await settled();await expect(page.getByRole('dialog')).toHaveCount(0);if(n===3)await state('inbox-collected-one')}
 await state('inbox-collected-all');await expect(page.locator('#collect-replies')).toHaveCount(0);await expect.soft(page.locator('.reply-receipt')).toHaveCount(0,{timeout:4000})
 await reopen();await state('inbox-unread');await menu();await page.getByRole('button',{name:t('✓ Mark all as read')}).click();await settled();await state('inbox-read');rows.forEach(c=>c.unreadCount=1);await reopen();await settled()
 await option();failRead=true;await page.getByRole('button',{name:t('Mark as read'),exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();await shot('mark-read-failure');await expect(page.getByRole('dialog')).toBeVisible();failRead=false;await page.getByRole('button',{name:t('Mark as read'),exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0)
 for(let i=0;i<3;i++){await settled();await page.locator(`[data-chat="chat-${i}"]`).click();await expect(page.locator('.c6-thread')).toBeVisible();await page.getByLabel(t('Back to messages')).click()}
 await state('inbox-read');await page.locator('#tab-friends').click();await state('inbox-friends-empty');await page.locator('#tab-messages').click();await option();await state('inbox-options');await page.keyboard.press('Escape');await page.locator('[data-chat]').first().click({button:'right'});await expect(page.getByRole('dialog')).toBeVisible()
 failPatch=true;await page.locator('#option-pin').click();await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();await shot('pin-failure');failPatch=false;await page.locator('#option-pin').click();await expect(page.getByRole('dialog')).toHaveCount(0)
 await option();await page.locator('#option-mute').click();await state('inbox-pinned')
 await option();await page.getByRole('button',{name:t('Follow conversation'),exact:true}).click();await page.locator('#tab-friends').click();await state('inbox-friends');await page.locator('#tab-messages').click();await settled()
 await option();await page.getByLabel(t('Remark'),{exact:true}).fill('Window tea');await page.getByRole('button',{name:t('Save remark')}).click();await settled();await expect(page.locator('[data-chat]').first()).toContainText('Window tea')
 await menu();await state('inbox-drawer');expect.soft(await page.locator('.inbox-flow > .main-nav').evaluate(e=>(e as HTMLElement).inert)).toBeTruthy();expect.soft(await page.locator('.inbox-top').evaluate(e=>(e as HTMLElement).inert)).toBeTruthy();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.locator('#inbox-menu')).toBeFocused()
 await menu();await page.locator('#inbox-drawer-search').fill('Window tea');await page.locator('#inbox-drawer-search').press('Enter');await state('inbox-search');await expect(page.locator('[data-chat]')).toHaveCount(1)
 await menu();await page.locator('#inbox-drawer-search').fill('unmatched-query');await page.locator('#drawer-search').click();await state('inbox-search-empty');await page.getByRole('button',{name:t('Clear search')}).click();await settled()
 await option();await page.locator('#option-hide').click();await settled();await menu();await page.getByRole('button',{name:t('Hidden conversations'),exact:false}).click();await state('inbox-hidden');await option();await page.locator('#option-hide').click();await state('inbox-hidden-empty');await page.getByLabel(t('Back to messages')).click();await settled()
 rows=make(1,'waiting');await reopen();await state('inbox-waiting');await page.locator('[data-chat]').first().click();await expect(page.locator('#chat-form')).toHaveCount(0);await expect(page.locator('.c6-thread')).toBeVisible();await shot('waiting-chat');await page.getByLabel(t('Back to messages')).click();await settled()
 rows=[];await reopen();await state('inbox-empty')
 // New fixture scenario with reminder not dismissed; auth/session storage is untouched.
 await page.evaluate(()=>sessionStorage.removeItem('maugo-inbox-prompt'));await reopen();await state('inbox-notifications-off');await page.getByLabel(t('Dismiss notification reminder')).click()
 // Failure and retry follow normal navigation, without injecting component state.
 failList=true;await page.locator('#tab-friends').click();await expect(root.getByRole('alert')).toBeVisible();await shot('list-failure');failList=false;await root.getByRole('button',{name:t('Retry'),exact:true}).click();await settled();await page.locator('#tab-messages').click();await settled()
 rows=make(25);queue=[{id:'reply-chat-10',conversationId:'chat-10'}];await reopen();await page.getByRole('button',{name:t('Load more conversations')}).click();await settled();await expect(page.locator('[data-chat]')).toHaveCount(25)
 await page.locator('.inbox-body').hover();await page.mouse.wheel(0,550);await expect.poll(()=>page.locator('.inbox-body').evaluate(e=>e.scrollTop)).toBeGreaterThan(0)
 const strip=await page.locator('#collect-replies').boundingBox();expect(strip!.y).toBeGreaterThanOrEqual(112);await shot('list-scroll-sticky')
 await page.locator('#collect-replies').click();await page.locator('#confirm-reply-payment').click();await settled();await expect.poll(async()=>{const row=await page.locator('[data-chat="chat-10"]').boundingBox();return !!row&&row.y>=112&&row.y+row.height<=height-96}).toBeTruthy();await shot('collected-row-visible')
 await menu();await page.locator('.inbox-drawer').hover();await page.mouse.wheel(0,600);if(await page.locator('.inbox-drawer').evaluate(e=>e.scrollHeight>e.clientHeight))await expect.poll(()=>page.locator('.inbox-drawer').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);const drawerScroll=await page.locator('.inbox-drawer').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight}));await page.keyboard.press('Escape')
 await expect(page.locator('.reply-receipt')).toHaveCount(0,{timeout:4000});const effects=await page.evaluate(()=>(window as any).__r09Effects as any[]);expect(effects.some(e=>e.kind==='animation'&&e.name==='r09-arrive'&&e.duration==='0.45s')).toBeTruthy();expect(effects.some(e=>e.kind==='animation'&&e.name==='sheet-in'&&e.duration==='0.3s')).toBeTruthy();const toastEntered=effects.filter(e=>e.kind==='toast-enter').at(-1),toastLeft=effects.find(e=>e.kind==='toast-leave'&&e.time>toastEntered.time);expect(toastLeft.time-toastEntered.time).toBeGreaterThanOrEqual(2600);expect(toastLeft.time-toastEntered.time).toBeLessThan(3000)
 const scroll=await page.locator('.inbox-body').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight}));await page.mouse.wheel(0,1500);const documentScroll=await page.evaluate(()=>({height:window.document.documentElement.scrollHeight,y:scrollY,viewport:innerHeight}));expect(documentScroll.height).toBe(height);expect(documentScroll.y).toBe(0)
 for(const r of records){expect(r.document.height).toBe(height);expect(r.document.y).toBe(0)}expect(errors).toEqual([])
 writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,steps,records,scroll,drawerScroll,document:documentScroll,effects,press,errors,calls},null,2))
})
