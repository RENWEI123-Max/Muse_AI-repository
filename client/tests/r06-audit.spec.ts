import {test,expect} from '@playwright/test'
import {writeFileSync,readFileSync} from 'node:fs'
const out='docs/ui-redo/r06-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang}: click walkthrough (API fixtures)`,async({page})=>{
 test.setTimeout(90000);page.setDefaultTimeout(12000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.setViewportSize({width:375,height})
 await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 let empty=false,fail=false,respond=true,refreshes=0
 const letters=Array.from({length:3},(_,i)=>({openingMessageId:`letter-${i}`,conversationId:`conversation-${i}`,content:'A little story. The world felt gentle again.',sender:{id:`sender-${i}`,displayName:`Little bird ${i}`,city:'Seoul',age:25},state:'letter-open',canReply:true,canChat:false}))
 await page.route('**/api/**',async route=>{
  const p=new URL(route.request().url()).pathname.replace('/api','')
  if(p==='/auth/login')return route.fulfill({json:{id:'audit-reader',token:'audit-fixture-session'}})
  if(p==='/filter-pass')return route.fulfill({json:{active:false,expiresAt:null,remainingDays:0,plans:[{days:7,diamonds:100}]}})
  if(p==='/discovery/filters')return route.fulfill({json:{cities:['Seoul']}})
  if(p==='/payments/apple/products')return route.fulfill({json:{products:[]}})
  if(p==='/wallet')return route.fulfill({json:{diamonds:0}})
  if(p==='/letters/refresh'){refreshes++;if(fail)return route.fulfill({status:503,json:{message:'Unable to save right now. Please try again.'}})}
  if(p==='/letters'||p==='/letters/refresh')return route.fulfill({json:{items:empty?[]:letters,responses:respond?letters.map(l=>({openingMessageId:l.openingMessageId})):[]}})
  if(p.startsWith('/letters/')){respond=false;return route.fulfill({json:letters[0]})}
  if(p.startsWith('/conversations/'))return route.fulfill({status:503,json:{message:'Unavailable'}})
  return route.fulfill({json:{items:[],packs:[],transactions:[]}})
 })
 const steps:any[]=[]
 const shot=async(name:string)=>{await page.waitForTimeout(650);await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`});steps.push({step:name,time:new Date().toISOString()});console.log(height,lang,name)}
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click()
 await expect(page.locator('.home-flow')).toHaveAttribute('data-state','home-response');await shot('01-response')
 await page.locator('.response-strip').hover();await page.mouse.wheel(500,0);await expect.poll(()=>page.locator('.response-strip').evaluate(e=>e.scrollLeft)).toBeGreaterThan(0);await page.locator('.response-capsule').first().click();await expect(page.locator('.letter-content')).toContainText('A little story');await shot('02-letter');await page.locator('.letter-close').click()
 await expect(page.locator('.response-capsule')).toHaveCount(2)
 await page.locator('#refresh').click();await expect.poll(()=>refreshes).toBe(1);await expect(page.locator('.home-flow')).not.toHaveClass(/refreshing/)
 await page.waitForTimeout(2800)
 const motion=await page.locator('.letter-bird').first().evaluate(e=>({transform:getComputedStyle(e).transform,sprite:getComputedStyle(e.firstElementChild!).animationName,duration:getComputedStyle(e.firstElementChild!).animationDuration}))
 const effects=await page.locator('.hat-glow,.scene-mist,.magic-spark').evaluateAll(es=>es.map(e=>({name:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration,delay:getComputedStyle(e).animationDelay})));expect(effects.map(e=>e.duration)).toEqual(['4s','5.4s','3.3s','3.3s','3.3s']);
 expect(motion.transform).not.toBe('none');expect(motion.sprite).toBe('sprite-loop');expect(motion.duration).toBe('0.65s')
 await shot('03-ready-motion')
 // Fixed home: viewport regions, not fictitious page scrolling.
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>document.fonts.ready)
 for(const [name,y,h] of [['top',0,180],['middle',180,height-360],['bottom',height-180,180]] as const)await page.screenshot({path:`${out}/${height}-${lang}-home-${name}.png`,clip:{x:0,y,width:375,height:h}})
 await page.mouse.move(20,200);await page.mouse.wheel(0,500)
 const scroll=await page.evaluate(()=>({document:document.documentElement.scrollHeight,viewport:innerHeight,top:scrollY,home:document.querySelector('.home-flow')!.scrollTop}))
 expect(scroll.document).toBe(height);expect(scroll.top).toBe(0);expect(scroll.home).toBe(0)
 const copy=await page.locator('.scene-hint,#refresh,#compose,.economy-action').evaluateAll(es=>es.map(e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth})))
 expect(copy.every(x=>!x.clipped)).toBeTruthy()
 await page.locator('.letter-bird').first().click();await expect(page.locator('.letter-content')).toBeVisible();await shot('03b-bird-letter');await page.locator('.letter-close').click();
 await page.locator('#settings').click();await expect(page.locator('.filter-sheet')).toBeVisible();await page.locator('.filter-gender-choice').nth(1).click();await page.getByRole('button',{name:t('Done'),exact:true}).click();await expect(page.locator('.home-veil')).toHaveCount(0)
 await page.locator('#settings').click();await page.keyboard.press('Escape');await expect(page.locator('.home-veil')).toHaveCount(0)
 await page.locator('#magic').click();await expect(page.locator('.appearance-sheet')).toBeVisible();await page.getByRole('button',{name:t('Male bird'),exact:true}).click();await page.getByLabel(t('Flight & hover'),{exact:true}).uncheck();await shot('04-appearance')
 const sheetScroll=await page.locator('.appearance-sheet').evaluate(e=>{e.scrollTop=999;return {top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight}})
 if(height===667)expect(sheetScroll.top).toBeGreaterThan(0)
 await page.getByRole('button',{name:t('Done'),exact:true}).click();await expect(page.locator('.home-flight-sprite').first()).toHaveCSS('animation-name','none')
 await page.locator('#compose').click();await page.getByLabel(t('Recipient ID'),{exact:true}).fill('11111111-1111-4111-8111-111111111111');await page.locator('#letter-text').fill('A kind hello from the home audit.');await expect(page.locator('#publish')).toBeEnabled();await page.waitForTimeout(650);await shot('05-compose-filled');await page.locator('#publish').click();await expect(page.locator('.letter-error')).toBeVisible();await shot('06-compose-failure');await page.locator('.compose-cancel').click();await expect(page.locator('.letters-veil')).toHaveCount(0)
 await page.locator('#compose').click();await page.getByLabel(t('Recipient ID'),{exact:true}).fill('11111111-1111-4111-8111-111111111111');await expect(page.locator('#letter-text')).toHaveValue('A kind hello from the home audit.');await page.locator('.letter-close').click()
 await page.locator('#open-wallet').click();await expect(page.locator('.reply-topup')).toBeVisible();await shot('07-wallet');await page.locator('.reply-back').click()
 await page.locator('#open-pass').click();await expect(page.locator('[data-state="pass-page"]')).toBeVisible();await shot('08-pass');await page.getByRole('button',{name:t('Close'),exact:true}).click()
 fail=true;await page.locator('#refresh').click();await expect(page.locator('.home-flow > .home-error')).toBeVisible();await shot('09-refresh-failure');fail=false;await page.locator('.home-retry').click();await expect(page.locator('.home-flow > .home-error')).toHaveCount(0)
 empty=true;await page.locator('#hat').click();await expect(page.locator('.home-flow')).toHaveAttribute('data-state','home-empty');await shot('10-empty');const n=refreshes;await page.locator('#refresh').click();await expect(page.locator('.filter-sheet')).toBeVisible();expect(refreshes).toBe(n);await page.keyboard.press('Escape')
 expect(errors).toEqual([])
 writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,steps,scroll,sheetScroll,copy,motion,effects,errors},null,2))
})
