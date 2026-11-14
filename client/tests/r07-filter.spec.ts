import { writeFileSync } from 'node:fs'
import { test, expect, type Page } from '@playwright/test'

async function box(page:Page, selector:string, expected:number[]){
 const b=await page.locator(selector).boundingBox();expect(b,selector).not.toBeNull()
 for(const [i,key] of ['x','y','width','height'].entries())expect(Math.abs(b![key as keyof typeof b]-expected[i]!),`${selector} ${key}`).toBeLessThanOrEqual(1)
}
for(const state of ['filters-free','filters-active','filters-selected','bird-female','bird-male','bird-motion-off'])test(`R07 ${state}`,async({page,request})=>{
 const seeded=await request.post('http://127.0.0.1:3001/__c3/seed');expect(seeded.ok()).toBeTruthy();const user=await seeded.json()
 await page.addInitScript(id=>{localStorage.setItem('maugo-account',id);localStorage.setItem('maugo-bird',JSON.stringify({motion:true,variant:4}));localStorage.removeItem('maugo-discovery-filters')},user.id)
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click()
 await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill(user.password)
 await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click()

 if(state.startsWith('filters')){
  if(state!=='filters-free')await page.route('**/api/filter-pass',r=>r.fulfill({json:{active:true,expiresAt:new Date(Date.now()+86400000*7).toISOString(),remainingDays:7,plans:[]}}))
  await page.locator('#settings').click()
  if(state==='filters-selected'){
   await page.getByRole('button',{name:'Filter Woman',exact:true}).click()
   await page.getByLabel('Minimum age',{exact:true}).fill('22');await page.getByLabel('Maximum age',{exact:true}).fill('28')
   await page.getByLabel('City',{exact:true}).selectOption('Seoul')
  }
 }else{
  await page.locator('#magic').click()
  if(state==='bird-male')await page.getByRole('button',{name:'Male bird',exact:true}).click()
  if(state==='bird-motion-off')await page.getByLabel('Flight & hover').uncheck()
 }
 const sheet=page.locator('.r07-sheet');await expect(sheet).toHaveAttribute('data-state',state)
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(450)
 const appearance=state.startsWith('bird')
 await box(page,'.r07-sheet',[12,appearance?110:260,351,appearance?678:528])
 await box(page,'.r07-done',[33,719,309,48]);await box(page,'.ui-sheet__grabber',[169.5,appearance?123:273,36,4])
 await expect(sheet).toHaveCSS('background-color','rgb(24, 33, 30)');await expect(sheet).toHaveCSS('border-radius','24px')
 await expect(page.locator('.r07-header h2')).toHaveCSS('font-size','18px');await expect(page.locator('.r07-header h2')).toHaveCSS('font-weight','500');await expect(page.locator('.r07-header h2')).toHaveCSS('line-height','24px')
 await expect(page.locator('.r07-done')).toHaveCSS('background-image','linear-gradient(to right, rgb(189, 255, 129) 0%, rgb(176, 251, 97) 100%)')
 if(appearance){
  await box(page,'.appearance-genders',[33,191,309,64]);await box(page,'.appearance-grid',[33,271,309,252]);await box(page,'.flight-preview',[33,539,309,64])
  await box(page,'.switch-row input >> nth=0',[303,626,38,22]);await box(page,'.switch-row input >> nth=1',[303,670,38,22])
  for(let i=0;i<9;i++)await box(page,`.appearance-grid button:nth-child(${i+1})`,[33+(i%3)*107,271+Math.floor(i/3)*88,95,74])
  await expect(page.locator('.appearance-grid button').first()).toHaveCSS('font-size','10px')
  await expect(page.locator('.switch-row').first()).toHaveCSS('color','rgb(164, 179, 156)')
  if(state==='bird-motion-off')await expect(page.locator('.flight-preview img')).toBeVisible()
 }else{
  await box(page,'.gender-options',[53,373,269,70]);await box(page,'.gender-options i >> nth=0',[67,374,44,44]);await box(page,'.premium-zone',[33,503,309,48]);await box(page,'.range-art >> nth=0',[33,527,146.5,24]);await box(page,'.filter-city',[33,611,309,48]);await box(page,'.pass-status',[33,675,309,20])
  await box(page,'.range-track >> nth=0',[40,537,132.5,4]);await box(page,'.range-thumb >> nth=0',[33+(state==='filters-selected'?16.3125:0),527,16,24])
  await expect(page.locator('.range-art').first()).toHaveCSS('opacity',state==='filters-free'?'0.45':'1')
  await expect(page.locator('.gender-options [aria-pressed=true] i')).toHaveCSS('background-color','rgb(181, 250, 112)')
  await expect(page.locator('.gender-options button').first()).toHaveCSS('font-size','12px')
 }

 const styles = [[".r07-header h2", {"font-size": "18.0px", "font-weight": "500", "line-height": "24.0px", "letter-spacing": "-0.30000001192092896px", "color": "rgb(228, 239, 217)"}]]
 const stateStyles = appearance ? [[".appearance-grid button:first-child", {"font-size": "10.0px", "font-weight": "400", "line-height": "12.100000381469727px", "letter-spacing": "0.30000001192092896px", "color": "rgb(179, 191, 176)"}], [".flight-preview", {"font-size": "10.0px", "font-weight": "400", "line-height": "12.100000381469727px", "letter-spacing": "0.0px", "color": "rgb(141, 157, 132)"}], [".flight-preview button", {"font-size": "10.0px", "font-weight": "400", "line-height": "12.100000381469727px", "letter-spacing": "0.0px", "color": "rgb(194, 223, 170)"}]] : [[".gender-options button:first-child", {"font-size": "12.0px", "font-weight": "400", "line-height": "16.0px", "letter-spacing": "0.0px", "color": "rgb(170, 182, 163)"}], [".premium-zone label:first-child", {"font-size": "11.0px", "font-weight": "400", "line-height": "16.0px", "letter-spacing": "0.0px", "color": "rgb(129, 145, 125)"}], [".pass-status", {"font-size": "11.0px", "font-weight": "400", "line-height": "20.0px", "letter-spacing": "0.0px", "color": "rgb(158, 164, 145)"}], [".filter-city", {"font-size": "13.0px", "font-weight": "400", "line-height": "20.0px", "letter-spacing": "0.0px", "color": "rgb(228, 239, 217)"}], [".filter-gender-label", {"font-size": "13.0px", "font-weight": "400", "line-height": "20.0px", "letter-spacing": "0.0px", "color": "rgb(228, 239, 217)"}]]
 for(const [sel,props] of [...styles,...stateStyles] as [string,Record<string,string>][]){
  for(const [property,value] of Object.entries(props)){
   const expected=property==='color'?value:await page.evaluate(({property,value})=>{const el=document.createElement('span');el.style.setProperty(property,value);document.body.append(el);const result=getComputedStyle(el).getPropertyValue(property);el.remove();return result},{property,value})
   await expect(page.locator(sel).first()).toHaveCSS(property,sel==='.filter-city'&&property==='color'&&state==='filters-free'?'rgba(228, 239, 217, 0.55)':expected)
  }
 }
 const measured=await sheet.evaluate(root=>[root,...root.querySelectorAll('*')].map(el=>{const b=el.getBoundingClientRect(),s=getComputedStyle(el);return {element:el.id||el.className||el.tagName,box:[b.x,b.y,b.width,b.height],style:Object.fromEntries(['color','backgroundColor','backgroundImage','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','borderRadius','boxShadow'].map(k=>[k,s[k as keyof CSSStyleDeclaration]]))}}))
 writeFileSync(`/tmp/r07-${state}.json`,JSON.stringify(measured,null,2));await test.info().attach('measurements',{body:JSON.stringify(measured,null,2),contentType:'application/json'})
 await page.screenshot({path:`docs/ui-redo/screenshots/R07-${state}.png`})
 if(state==='filters-selected'){
  await page.getByLabel('Minimum age',{exact:true}).fill('26');await page.getByLabel('Maximum age',{exact:true}).fill('38')
  await box(page,'.range-thumb >> nth=0',[65.625,527,16,24]);await box(page,'.range-thumb >> nth=1',[277.0625,527,16,24])
 }
 await page.setViewportSize({width:375,height:700});await expect(page.locator('.r07-sheet')).toHaveCSS('width','351px')
 if(appearance)await expect(page.locator('.appearance-grid img').first()).toHaveCSS('width','64px')
})

for(const sheet of ['filters','appearance'])test(`R07 Korean ${sheet}: no overflow and small-screen artwork`,async({page,request})=>{
 const seeded=await request.post('http://127.0.0.1:3001/__c3/seed');expect(seeded.ok()).toBeTruthy();const user=await seeded.json()
 await page.addInitScript(()=>localStorage.setItem('maugo-language','ko'))
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill(user.password);await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .primary').click()
 await page.locator(sheet==='filters'?'#settings':'#magic').click();await expect(page.locator('.r07-sheet')).toBeVisible()
 for(const selector of ['.r07-header h2','.r07-done',...(sheet==='filters'?['.gender-options button','.filter-age-label','.filter-city-label','.pass-status']:['.appearance-genders button','.appearance-grid button','.switch-row'])]){
  for(const el of await page.locator(selector).all()){
   await expect(el).toHaveCSS('font-family',/GowunDodum/)
   expect(await el.evaluate(e=>e.scrollWidth<=e.clientWidth+1),selector).toBeTruthy()
  }
 }
 await page.setViewportSize({width:375,height:700});await expect(page.locator('.r07-sheet')).toHaveCSS('width','351px')
 if(sheet==='appearance')await expect(page.locator('.appearance-grid img').first()).toHaveCSS('width','64px')
})
