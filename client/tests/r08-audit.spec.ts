import {test,expect} from '@playwright/test'
import {writeFileSync,readFileSync} from 'node:fs'
const out='docs/ui-redo/r08-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang}: click walkthrough (API fixtures)`,async({page})=>{
 test.setTimeout(90000);page.setDefaultTimeout(12000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.setViewportSize({width:375,height})
 await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 let empty=false,fail=false,respond=true,refreshes=0,openingCalls=0,blockFail=true,reportFail=true,replyState='letter-open'
 const letters=Array.from({length:3},(_,i)=>({openingMessageId:`letter-${i}`,conversationId:`conversation-${i}`,content:('A little story. The world felt gentle again. ').repeat(45),sender:{id:`sender-${i}`,displayName:`Little bird ${i}`,city:'Seoul',age:25},state:'letter-open',canReply:true,canChat:false}))
 await page.route('**/api/**',async route=>{
  const p=new URL(route.request().url()).pathname.replace('/api','')
  if(p==='/auth/login')return route.fulfill({json:{id:'audit-reader',token:'audit-fixture-session'}})
  if(p==='/filter-pass')return route.fulfill({json:{active:false,expiresAt:null,remainingDays:0,plans:[{days:7,diamonds:100}]}})
  if(p==='/discovery/filters')return route.fulfill({json:{cities:['Seoul']}})
  if(p==='/payments/apple/products')return route.fulfill({json:{products:[]}})
  if(p==='/wallet')return route.fulfill({json:{diamonds:0}})
  if(p==='/letters/refresh'){refreshes++;if(fail)return route.fulfill({status:503,json:{message:'Unable to save right now. Please try again.'}})}
  if(p==='/letters'||p==='/letters/refresh')return route.fulfill({json:{items:empty?[]:letters,responses:respond?letters.map(l=>({openingMessageId:l.openingMessageId})):[]}})
  if(p.startsWith('/letters/')){respond=false;return route.fulfill({json:{...letters[0],state:replyState,canReply:replyState==='letter-open',canChat:replyState==='letter-replied'}})}
  if(p.endsWith('/opening')){openingCalls++;return openingCalls===1?route.fulfill({status:503,json:{message:'Unavailable'}}):route.fulfill({status:201,json:{id:'opening-fixture'}})}
  if(p.endsWith('/messages')){replyState='letter-waiting';return route.fulfill({status:201,json:{id:'reply-fixture'}})}
  if(p.startsWith('/blocks/'))return blockFail?route.fulfill({status:503,json:{message:'Unavailable'}}):route.fulfill({status:200,json:{ok:true}})
  if(p==='/reports')return reportFail?route.fulfill({status:503,json:{message:'Unavailable'}}):route.fulfill({status:201,json:{id:'report-fixture'}})
  return route.fulfill({json:{items:[],packs:[],transactions:[]}})
 })
 const steps:any[]=[]
 const shot=async(name:string)=>{await page.waitForTimeout(650);await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`});steps.push({step:name,time:new Date().toISOString()});console.log(height,lang,name)}
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click()

 const panel=page.locator('.letters-panel'),records:any[]=[]
 const state=async(s:string)=>{await expect(panel).toHaveAttribute('data-state',s);if(s==='letter-safety'||s==='letter-report'){
  const sheet=page.locator('.letter-safety');await expect.poll(async()=>{const b=await sheet.boundingBox();return b?b.y+b.height:Infinity}).toBeLessThanOrEqual(height)
  const copy=await sheet.locator('button,p,h2,small').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})));expect(copy.every(e=>!e.clipped)).toBeTruthy()
 }
 await shot(s);records.push({state:s,document:await page.evaluate(()=>({height:document.documentElement.scrollHeight,viewport:innerHeight,y:scrollY})),copy:await panel.locator('button,p,h2,small').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1})))})}
 await page.locator('.response-capsule').first().click();await state('letter-open')
 const opening=await panel.evaluate(e=>({duration:getComputedStyle(e).transitionDuration,animation:getComputedStyle(e).animationName}))
 await page.locator('.letter-conversation').hover();await page.mouse.wheel(0,700);await expect.poll(()=>page.locator('.letter-conversation').evaluate(e=>e.scrollTop)).toBeGreaterThan(0)
 const conversationScroll=await page.locator('.letter-conversation').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight}))
 await page.locator('#reply').fill('That small moment made me smile.');await state('letter-typed')
 await page.locator('#report-note').click();await state('letter-safety');await page.locator('#safety-block').click();await shot('block-confirmation');await page.locator('.letter-safety').getByRole('button',{name:t('Block'),exact:true}).click();await expect(page.locator('.letter-safety .letter-error')).toBeVisible();await shot('block-failure');await page.locator('.letter-safety').getByRole('button',{name:t('Cancel'),exact:true}).click();await page.locator('#safety-report').click();await state('letter-report');await expect(page.locator('.letter-safety .letter-error')).toHaveCount(0)
 await page.locator('.report-option').first().click();await expect(page.locator('.letter-safety .letter-error')).toBeVisible();await shot('report-failure');reportFail=false;await page.locator('.report-option').first().click();await expect(page.locator('.letter-safety')).toHaveCount(0)
 await page.locator('#reply-send').click();await state('letter-waiting');await page.locator('#continue-chat').click();await expect(panel).toHaveAttribute('data-state','letter-waiting')
 replyState='letter-replied';await page.locator('#continue-chat').click();await state('letter-replied')
 await page.locator('.letter-close').click();await expect(panel).toHaveCount(0)
 await page.locator('#compose').click();await state('compose-empty');await expect(page.locator('#publish')).toBeDisabled()
 await page.getByLabel(t('Recipient ID'),{exact:true}).fill('11111111-1111-4111-8111-111111111111')
 await page.locator('#letter-text').fill('Today I found a quiet little bookshop. What small discovery stayed with you?');await state('compose-draft')
 await page.locator('#letter-text').fill('A first line.\nA second line.');await state('compose-invalid');await expect(page.locator('#publish')).toBeDisabled()
 await page.locator('#letter-text').fill('A quiet hello. '.repeat(300));await page.locator('#letter-text').hover();await page.mouse.wheel(0,700)
 const textareaScroll=await page.locator('#letter-text').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight}));expect(textareaScroll.top).toBeGreaterThan(0)
 await shot('compose-text-scroll');await page.locator('#letter-text').fill('A quiet little hello, from my window.')
 await page.locator('#publish').click();await expect(page.locator('#letter-validation')).toContainText(t('Could not send. Your draft is saved. Please try again.'));await shot('compose-failure')
 await page.locator('.compose-cancel').click();await expect(panel).toHaveCount(0);await page.locator('#compose').click();await page.getByLabel(t('Recipient ID'),{exact:true}).fill('11111111-1111-4111-8111-111111111111');await expect(page.locator('#letter-text')).toHaveValue('A quiet little hello, from my window.');await shot('draft-restored')
 await page.locator('.change-bird').click();await expect(page.locator('.appearance-sheet')).toBeVisible();await page.getByRole('button',{name:t('Done'),exact:true}).click();await expect(page.locator('#letter-text')).toHaveValue('A quiet little hello, from my window.')
 await page.evaluate(()=>{
 const root=document.querySelector('.letters-flow')!;(window as any).__sendTiming=[]
 const observer=new MutationObserver(()=>{(window as any).__sendTiming.push({phase:root.getAttribute('data-phase'),time:performance.now()})})
 observer.observe(root,{attributes:true,attributeFilter:['data-phase']})
 })
 await page.locator('#publish').click();await expect(page.locator('.letters-flow')).toHaveAttribute('data-phase','sending');await page.screenshot({path:`${out}/${height}-${lang}-sending.png`});await state('compose-sent');const timing=await page.evaluate(()=>(window as any).__sendTiming);const flightMs=timing[1].time-timing[0].time;expect(flightMs).toBeGreaterThanOrEqual(1490);expect(flightMs).toBeLessThan(1800);expect(openingCalls).toBe(2)
 await page.getByRole('button',{name:t('Back to home'),exact:true}).click();await expect(panel).toHaveCount(0)
 await page.locator('.response-capsule').first().click();await expect(panel).toBeVisible();await page.locator('#report-note').click();await page.keyboard.press('Escape');await expect(page.locator('.letter-safety')).toHaveCount(0);await expect(panel).toBeVisible();await page.keyboard.press('Escape');await expect(panel).toHaveCount(0)
 await page.locator('.response-capsule').first().click();await page.locator('#report-note').click();await page.locator('#safety-block').click();blockFail=false;await page.locator('.letter-safety').getByRole('button',{name:t('Block'),exact:true}).click();await expect(panel).toHaveCount(0);await shot('blocked-home')
 await page.mouse.wheel(0,700);const scroll=await page.evaluate(()=>({height:document.documentElement.scrollHeight,viewport:innerHeight,y:scrollY}));expect(scroll.height).toBe(height);expect(scroll.y).toBe(0)
 for(const r of records){expect(r.document.height).toBe(height);expect(r.document.y).toBe(0)}
 expect(errors).toEqual([])
 writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,steps,records,conversationScroll,textareaScroll,opening,flightMs,timing,scroll,errors},null,2))
})
