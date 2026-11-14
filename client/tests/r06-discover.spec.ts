import { writeFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'

async function box(page:Page, selector:string, expected:number[]){
 const b=await page.locator(selector).boundingBox();expect(b,selector).not.toBeNull()
 for(const [i,key] of ['x','y','width','height'].entries())expect(Math.abs(b![key as keyof typeof b]-expected[i]!),`${selector} ${key}`).toBeLessThanOrEqual(1)
}
for(const state of ['home-ready','home-empty','home-response'])test(`R06 ${state}: geometry, exact styles and capture`,async({page,request})=>{
 const seeded=await request.post('http://127.0.0.1:3001/__c3/seed');expect(seeded.ok()).toBeTruthy();const user=await seeded.json()
 await page.addInitScript(id=>{localStorage.setItem('maugo-account',id);localStorage.setItem('maugo-bird',JSON.stringify({motion:false}))},user.id)
 await page.route('**/api/letters?*',async route=>{
  const response=await route.fetch();const data=await response.json()
  await route.fulfill({json:{...data,items:state==='home-empty'?[]:data.items,responses:state==='home-response'?[...data.responses,{openingMessageId:data.items[1].openingMessageId}]:[]}})
 })
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click()
 await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill(user.password)
 await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click()
 await expect(page.locator('.home-flow')).toHaveAttribute('data-state',state)
 await page.evaluate(()=>document.fonts.ready)
 await expect(page.locator('.home-flow')).toHaveClass(/motion-off/)
 for(const [sel,expected] of Object.entries({'.home-flow':[0,0,375,812],'.aura':[69,354,240,271],'.hat-glow':[75,536,234,52],'.hat-highlight':[147,454,85,21],'.scene-mist':[70,319,242,244],'.scene-particles':[0,0,375,812],'.magic-hat':[99,435,178,143],'.scene-hint':[20,608,335,16],'#refresh':[24.113,644,150,48],'#compose':[186.113,644,165,48],'#magic':[251,60,44,44],'#settings':[307,60,44,44],'.home-header>img':[24,63.203,144,37.594],'.spark-one':[96,409,15.07,23],'.spark-two':[246,379,15.07,23],'.spark-three':[240.5705,441,8,11],'.economy-actions':[24,695,327,20],'.client-statusbar':[0,0,375,57.828125],'.main-nav':[0,716,375,96]}))await box(page,sel,expected)
 for(const id of ['refresh','compose']){
  const btn=page.locator('#'+id)
  await expect(btn).toHaveCSS('border-radius','30px');await expect(btn).toHaveCSS('font-size','16px');await expect(btn).toHaveCSS('font-weight','600');await expect(btn).toHaveCSS('line-height','22px');await expect(btn).toHaveCSS('gap','10px');await expect(btn).toHaveCSS('display','flex')
  await expect(btn).toHaveCSS('color',id==='refresh'?'rgb(228, 239, 217)':'rgb(10, 20, 6)')
  await expect(btn).toHaveCSS('background-image',id==='refresh'?'linear-gradient(to right, rgb(28, 34, 35) 0%, rgb(23, 29, 30) 100%)':'linear-gradient(to right, rgb(189, 255, 129) 0%, rgb(176, 251, 97) 100%)')
  const image=await btn.locator('img').boundingBox();expect(image!.width).toBe(24);expect(image!.height).toBe(24);expect(image!.y).toBe(656)
 }
 await expect(page.locator('#magic')).toHaveCSS('border-radius','22px')
 await expect(page.locator('#magic')).toHaveCSS('background-image','linear-gradient(to right, rgb(27, 33, 33) 0%, rgb(19, 24, 24) 100%)')
 await box(page,'#magic img',[260.5,69.5,25,25]);await box(page,'#settings img',[316.5,69.5,25,25])
 for(const [sel,prop,value] of [['.home-flow','background-color','rgb(9, 14, 14)'],['.scene-mist','opacity','0.4'],['.hat-highlight','opacity','0.4'],['.hat-highlight','background-color','rgb(211, 255, 128)'],['.hat-glow','border-radius','26px'],['.hat-highlight','border-radius','10.5px'],['.scene-hint','color','rgb(132, 146, 132)'],['.scene-hint','letter-spacing','0.4px'],['.scene-hint','opacity','0.8'],['.scene-hint','font-size','11px'],['.scene-hint','line-height','16px'],['.magic-hat img','filter','none'],['.magic-hat','animation-name','none'],['.magic-trails','opacity','0'],['.magic-trails','stroke','rgb(214, 255, 156)'],['.magic-trails','stroke-width','0.85px'],['.trail-blur','stroke','rgb(170, 255, 104)'],['.trail-blur','stroke-width','5px'],['.trail-blur','filter','blur(6px)'],['.spark-one','color','rgb(229, 255, 179)'],['.spark-one','font-size','19px'],['.spark-three','font-size','9px'],['.economy-actions button:first-child','font-size','9px']])await expect(page.locator(sel!)).toHaveCSS(prop!,value!)
 if(state==='home-empty'){
  await expect(page.locator('.letter-bird')).toHaveCount(0);await box(page,'.filter-summary',[24,156,327,12]);await expect(page.locator('.filter-summary')).toHaveCSS('color','rgb(169, 181, 165)');await expect(page.locator('.filter-summary')).toHaveCSS('letter-spacing','0.3px');await expect(page.locator('#refresh')).toContainText('Edit filters');await expect(page.locator('.scene-hint')).toHaveText('No letters yet. Try a wider search.')
 }else{
  for(const [i,b] of [[51.8,296.8,92.4,92.4],[142.6,182.6,118.8,118.8],[231.48,296.48,95.04,95.04]].entries()){
   await box(page,`.letter-bird:nth-child(${i+1})`,b);await expect(page.locator('.home-flight-sprite').nth(i)).toHaveCSS('animation-name','none');await expect(page.locator('.home-flight-sprite').nth(i)).toHaveCSS('background-position','0px 0px')
  }
 }
 if(state==='home-response'){
  await box(page,'.response-strip button:first-child',[24,120,157.656,28]);await box(page,'.response-strip button:nth-child(2)',[190.656,120,157.656,28]);await expect(page.locator('.response-strip')).toHaveCSS('gap','9px');await expect(page.locator('.response-strip button').first()).toHaveCSS('border-radius','18px');await expect(page.locator('.response-strip button').first()).toHaveCSS('background-color','rgba(32, 40, 39, 0.5)');await expect(page.locator('.response-strip button').first()).toHaveCSS('white-space','nowrap')
 }
 for(const [selector,value] of Object.entries({'.home-flow':'radial-gradient(ellipse closest-side at 50% 50%, rgb(16 32 23 / .4000000059604645) 0%, transparent 100%)','.aura':'radial-gradient(ellipse closest-side at 50% 50%, rgb(152 250 72 / .12) 0%, rgb(104 167 52 / .04) 50%, transparent 100%)','.hat-glow':'radial-gradient(ellipse closest-side at 50% 50%, rgb(173 249 89 / .44) 0%, rgb(117 177 64 / .18) 50%, transparent 100%)'})){
  const expected=await page.evaluate(v=>{const e=document.createElement('div');e.style.backgroundImage=v;document.body.append(e);const value=getComputedStyle(e).backgroundImage;e.remove();return value},value)
  await expect(page.locator(selector)).toHaveCSS('background-image',expected)
 }
 const measured=await page.locator('.home-flow').evaluate(root=>Object.fromEntries([...root.querySelectorAll('.aura,.hat-glow,.hat-highlight,.scene-mist,.scene-particles,.letter-bird,.magic-spark,.magic-hat,.scene-hint,.filter-summary,.ui-button,.economy-actions,.response-capsule,.home-wordmark,.ui-icon-button')].map(el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el);return [el.id||el.className,{box:[b.x,b.y,b.width,b.height],style:Object.fromEntries(['backgroundColor','backgroundImage','color','opacity','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','borderRadius','filter','boxShadow','gap','display'].map(k=>[k,s[k as keyof CSSStyleDeclaration]]))}]})))
 writeFileSync(`/tmp/r06-${state}-values.json`,JSON.stringify(measured,null,2))
 await test.info().attach('computed-styles-and-geometry',{body:JSON.stringify(measured,null,2),contentType:'application/json'})
 // Chromium's Playwright SVG boundingBox includes Bezier control/stroke bounds.
 // Figma absoluteBoundingBox is the curve geometry; getBBox compares the same quantity.
 for(const [i,b] of [[96.909,343,91.091,116],[163.163,242,38.837,217],[188,344,92.435,115]].entries()){
  const actual=await page.locator(`.magic-trails > g:last-child > path:nth-child(${i+1})`).evaluate(e=>{const b=(e as SVGPathElement).getBBox();return [b.x,b.y,b.width,b.height]})
  actual.forEach((v,j)=>expect(Math.abs(v-b[j]!)).toBeLessThanOrEqual(1))
 }
 await page.screenshot({path:`docs/ui-redo/screenshots/R06-${state}.png`})
 if(state!=='home-empty'){
  await page.locator('#magic').click();await page.getByLabel('Flight & hover').check();await page.getByRole('button',{name:'Done',exact:true}).click()
  await expect(page.locator('.home-flight-sprite').first()).toHaveCSS('animation-name','sprite-loop');await expect(page.locator('.home-flight-sprite').first()).toHaveCSS('animation-timing-function','steps(6)');await expect(page.locator('.letter-bird').first()).toHaveCSS('transform','none')
  await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.home-flight-sprite').first()).toHaveCSS('background-position','0px 0px')
 }
 await page.evaluate(()=>localStorage.setItem('maugo-language','ko'));await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill(user.password);await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .primary').click();await expect(page.locator('.home-flow')).toHaveAttribute('data-state',state)
 await expect(page.locator('.scene-hint')).toHaveCSS('font-family',/GowunDodum/)
 for(const sel of ['#refresh','#compose','.scene-hint','.response-strip button'])for(const el of await page.locator(sel).all())expect(await el.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBeTruthy()
 await page.setViewportSize({width:375,height:700});await expect(page.locator('.magic-hat')).toHaveCSS('width','178px');await expect(page.locator('.magic-hat')).toHaveCSS('height','143px')
})
