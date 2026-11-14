import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const out='docs/ui-redo/r13-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R13 appearance walkthrough with API fixtures`,async({page})=>{
 test.setTimeout(120000);page.setDefaultTimeout(8000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 let remarkFail=false,searchFail=false
 const calls:any[]=[],records:any[]=[],checks:any={},errors:string[]=[],forbidden:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 const rows=[{id:'open',peerId:'peer-open',displayName:'Tea friend',remark:'',status:'open'},{id:'other',peerId:'peer-other',displayName:'Other friend',remark:'',status:'open'},{id:'waiting',peerId:'peer-waiting',displayName:'Your sent letter',remark:'',status:'waiting'}].map(r=>({...r,pinned:false,muted:false,hidden:false,following:false,unreadCount:0,lastMessage:'Thank you for listening.',updatedAt:'2026-11-14T10:00:00Z'}))
 const messages=Array.from({length:24},(_,i)=>({id:`m${i}`,content:`${i+1}. Thank you for listening.`,kind:'reply',createdAt:'2026-11-14T10:00:00Z',mine:i%2===0}))
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace('/api',''),method=req.method();calls.push({path:p,query:url.search,method,body:method==='PATCH'?req.postDataJSON():undefined});const ok=(json:any)=>route.fulfill({json})
  if((p==='/reports'&&method==='POST')||(method==='PATCH'&&req.postDataJSON().clearHistory)||(p.startsWith('/blocks/')&&method!=='GET')){forbidden.push(p);return route.abort()}
  if(p==='/auth/login')return ok({id:'r13-reader',token:'r13-api-fixture'})
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
 const appearance=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('maugo-chat-appearance-open')||'{}'))
 const snap=async(name:string,state?:string)=>{
  if(state)await expect(root).toHaveAttribute('data-state',state)
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})))})
  await page.waitForTimeout(450)
  await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  const measure=await root.evaluate(e=>({state:e.getAttribute('data-state'),document:{height:document.documentElement.scrollHeight,y:scrollY,width:document.documentElement.scrollWidth},body:[...e.querySelectorAll('.d2-body,.c6-thread')].map(b=>({height:b.clientHeight,content:b.scrollHeight,top:b.scrollTop,bottom:b.getBoundingClientRect().bottom,overscroll:getComputedStyle(b).overscrollBehaviorY,animation:getComputedStyle(b).animationName,duration:getComputedStyle(b).animationDuration})),copy:[...e.querySelectorAll('button,p,h1,figcaption,label,span')].filter(b=>b.getClientRects().length).map(b=>({text:b.textContent?.trim(),clipped:b.scrollWidth>b.clientWidth+1})),images:[...e.querySelectorAll('img')].filter(b=>b.getClientRects().length).map(b=>({src:b.getAttribute('src'),decoded:b.complete&&b.naturalWidth>0})),gradients:[...e.querySelectorAll('.wallpaper-default,.wallpaper-name,.appearance-caption,.theme-card,.appearance-apply')].map(b=>({selector:b.className,theme:b.getAttribute('data-theme'),background:getComputedStyle(b).backgroundImage}))}))
  records.push({name,...measure});writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,calls,records,checks,errors},null,2))
  expect(measure.document.height).toBe(height);expect(measure.document.y).toBe(0);expect(measure.document.width).toBe(375)
 }
 const scroll=async(selector:string)=>{const el=page.locator(selector);await el.waitFor({state:'visible'});await page.waitForTimeout(450);await el.hover();await page.mouse.wheel(0,4000);await page.waitForTimeout(180);return el.evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight,bottom:e.getBoundingClientRect().bottom}))}
 const details=async()=>{await page.locator('#chat-details').click();await expect(root).toHaveAttribute('data-state','chat-details')}
 const background=async()=>{await details();await page.locator('#chat-background').click();await expect(page.locator('.wallpaper-grid')).toBeVisible()}
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r13-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await page.locator('#open-inbox').click();await page.locator('[data-chat="open"]').click()
 await background();await snap('wallpapers','wallpapers');checks.wallpaperScroll=await scroll('.d2-body');expect(checks.wallpaperScroll.top).toBeGreaterThan(0);await snap('wallpapers-scrolled')
 await page.locator('[data-wallpaper="aurora-sky"]').click();await snap('preview-cancel');expect((await appearance()).wallpaperId).toBeUndefined();await back();await expect(root).toHaveAttribute('data-state','wallpapers');await snap('preview-return');expect((await appearance()).wallpaperId).toBeUndefined()
 await page.locator('[data-wallpaper="moon-road"]').click();await snap('wallpaper-preview','wallpaper-preview');checks.previewScroll=await scroll('.d2-body');await snap('preview-scrolled');await page.locator('#apply-wallpaper').click();await snap('wallpaper-applied','wallpaper-applied');expect((await appearance()).wallpaperId).toBe('moon-road');await expect(root).toHaveClass(/theme-wallpaper/)
 await background();await expect(page.locator('[data-wallpaper="moon-road"]')).toHaveAttribute('aria-pressed','true');await page.locator('#color-tab').click();await snap('wallpaper-colors','wallpaper-colors');await page.locator('[data-theme="ocean"]').click();await expect(page.locator('[data-theme="ocean"]')).toHaveAttribute('aria-pressed','true');expect((await appearance()).wallpaperId).toBeUndefined();await back();await expect(root).toHaveAttribute('data-state','chat-details');await back();await expect(root).toHaveClass(/theme-ocean/);await snap('color-back-applied')
 await background();await page.locator('#color-tab').click();checks.colorScroll=await scroll('.d2-body');expect(checks.colorScroll.top).toBeGreaterThan(0);await snap('colors-scrolled');await page.locator('[data-theme="stars"]').click();await page.locator('#background-done').click();await snap('color-done','wallpaper-applied');await expect(root).toHaveClass(/theme-stars/)
 await background();await page.locator('#wallpaper-default').click();await expect(root).toHaveClass(/theme-night/);expect((await appearance()).wallpaperId).toBeUndefined();await snap('default-applied')
 await details();await page.locator('#chat-bubbles').click();await snap('chat-bubbles','chat-bubbles');
 const custom={myBubble:'#d9c6ff',myText:'#1a102a',theirBubble:'#244039',theirText:'#ffffff'}
 for(const [key,value]of Object.entries(custom)){await page.locator(`#color-${key}`).fill(value);await expect(page.locator(`#color-${key}`)).toHaveValue(value)}
 await snap('chat-bubbles-custom','chat-bubbles-custom');checks.custom=await appearance();expect(checks.custom).toMatchObject(custom);checks.customColors=await root.locator('#my-bubble,#their-bubble').evaluateAll(es=>es.map(e=>({background:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color})));await back();await back();await snap('custom-applied');await expect(root.locator('.chat-bubble--mine').first()).toHaveCSS('background-color','rgb(217, 198, 255)');await expect(root.locator('.chat-bubble:not(.chat-bubble--mine)').first()).toHaveCSS('background-color','rgb(36, 64, 57)');
 await details();await page.locator('#chat-bubbles').click();await expect(root).toHaveAttribute('data-state','chat-bubbles-custom');checks.bubbleScroll=await scroll('.d2-body');await snap('bubbles-scrolled');await page.locator('#reset-bubbles').click();await expect(root).toHaveAttribute('data-state','chat-bubbles');for(const key of Object.keys(custom))expect((await appearance())[key]).toBeUndefined();await snap('bubbles-reset');await back();await back();await back();await expect(page.locator('.inbox-flow')).toBeVisible()
 await page.locator('[data-chat="other"]').click();await details();await page.locator('#chat-background').click();await expect(page.locator('#wallpaper-default')).toHaveAttribute('aria-pressed','true');checks.otherAppearance=await page.evaluate(()=>localStorage.getItem('maugo-chat-appearance-other'));await back();await back();await back()
 checks.errors=errors;expect(forbidden).toEqual([]);checks.clipped=records.flatMap(r=>r.copy.filter((c:any)=>c.clipped).map((c:any)=>({step:r.name,...c})))
 writeFileSync(`${out}/${height}-${lang}-checks.json`,JSON.stringify({fixture:true,checks,calls,errors},null,2));expect(errors).toEqual([])
 // Prototype .page-body contains wheel/touch scroll instead of chaining it to the shell.
 await page.locator('[data-chat="open"]').click();await background();expect(await page.locator('.d2-body').evaluate(e=>getComputedStyle(e).overscrollBehaviorY)).toBe('contain');expect(await page.locator('.d2-body').evaluate(e=>getComputedStyle(e).animationName)).toBe('none')
 checks.motion=await page.locator('.d2-body').evaluate(e=>({animation:getComputedStyle(e).animationName,transition:getComputedStyle(e).transitionDuration}))
 await page.route('**/*glowing-deer*.png',route=>route.fulfill({status:503,body:''}));await page.goto('/');await page.locator('#open-inbox').click();await page.locator('[data-chat="open"]').click();await background();await page.locator('[data-wallpaper="glowing-deer"]').click();await snap('wallpaper-image-failure','wallpaper-preview');checks.failedImage=await page.locator('.appearance-preview-image').evaluate(e=>({decoded:(e as HTMLImageElement).naturalWidth>0,alt:e.getAttribute('alt'),alert:!!document.querySelector('[role=alert]')}));expect(checks.failedImage.decoded).toBe(false);await page.unroute('**/*glowing-deer*.png');await back();await expect(root).toHaveAttribute('data-state','wallpapers')
 writeFileSync(`${out}/${height}-${lang}-checks.json`,JSON.stringify({fixture:true,checks,calls,errors,forbidden},null,2))
})
