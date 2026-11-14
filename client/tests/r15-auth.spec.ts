import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
const states=JSON.parse(readFileSync(new URL('./module01.json',import.meta.url),'utf8'))
const dir='docs/ui-redo/r15'
// Chromium serializes a zero letter-spacing as normal in getComputedStyle.
const targets=JSON.parse(readFileSync('docs/ui-redo/r15/assertion-targets.json','utf8'))
test('R15 safe auth states, geometry and styles',async({page})=>{
 test.setTimeout(90000);mkdirSync(dir,{recursive:true})
 const baseline=process.env.R15_BASELINE==='1', results:any[]=[]
 let prohibited=0
 await page.route('**/api/auth/**',r=>{if(r.request().url().endsWith('/auth/code/verify'))return r.continue();prohibited++;return r.abort()})
 for(const state of states){
  if(state.id==='verify-resend')continue
  const mode=state.task.replace('auth:','').replace('policy','privacy')
  await page.goto(mode==='welcome'?'/':`/?auth=${mode}${['verify','recovery'].includes(mode)?'&email=reader@example.com':''}`)
  await page.locator('.auth-top').waitFor();await page.evaluate(()=>document.fonts.ready)
  for(const [kind,selector,value] of state.actions){
   const field=page.locator(selector)
   if(kind==='fill')await field.fill(selector==='#auth-email'&&value==='reader@example.com'?'mina@maugo.demo':String(value))
   if(kind==='check')await field.setChecked(Boolean(value))
   if(kind==='click')await field.click()
   if(kind==='submit'){
    if(state.id==='verify-error'&&baseline)await page.locator('#auth-code').fill('123')
    await field.evaluate((f:HTMLFormElement)=>f.requestSubmit())
   }
  }
  if(state.id==='verify-error'&&!baseline)await expect(page.locator('#auth-error')).toHaveText('Incorrect verification code. Please try again.')
  await page.waitForTimeout(300)
  const elements:any={}
  for(const selector of ['.wordmark','.flow-content h1','.auth-content h1','.field-label input','.terms-scroll','#accept-terms','#terms-continue','#apple-hide','#apple-share','.auth-error']){
   const loc=page.locator(selector).first();if(!await loc.count())continue
   elements[selector]={box:await loc.boundingBox(),style:await loc.evaluate(el=>{const s=getComputedStyle(el);return Object.fromEntries(['color','backgroundColor','backgroundImage','borderRadius','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','boxShadow'].map(k=>[k,s[k as any]]))})}
  }
  results.push({state:state.id,elements})
  await page.screenshot({path:`${dir}/${baseline?'baseline-':''}${state.id}.png`})
  if(!baseline&&state.id==='signup-mismatch'){await page.locator('#auth-error').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/signup-mismatch-scrolled.png`})}
  if(!baseline){
   for(const [selector,actual] of Object.entries(elements) as any){const target=targets[state.id][selector];if(target)for(const k of ['x','y','width','height'])expect(Math.abs(actual.box[k]-target.box[k]),`${state.id} ${selector} ${k}`).toBeLessThanOrEqual(1)}
   const heading=elements['.flow-content h1']||elements['.auth-content h1'];expect(heading.style.color).toBe('rgb(228, 239, 217)');expect(heading.style.fontWeight).toBe('500');expect(heading.style.lineHeight).toBe('32px');expect(heading.style.letterSpacing).toBe('-0.3px')
   const mark=elements['.wordmark'].box;expect(mark.x).toBeCloseTo(140.5,0);expect(Math.abs(mark.y-(state.id==='welcome'?67.73:67.23))).toBeLessThanOrEqual(1);expect(mark.width).toBeCloseTo(94,0);expect(mark.height).toBeCloseTo(24.54,0)
   expect(elements['.flow-content h1']?.style.fontSize||elements['.auth-content h1']?.style.fontSize).toBe(state.id==='welcome'?'26px':'24px')
   if(elements['.field-label input']){expect(elements['.field-label input'].style.color).toBe('rgb(228, 239, 217)');expect(elements['.field-label input'].style.fontWeight).toBe('400');expect(elements['.field-label input'].style.lineHeight).toBe('20px');expect(elements['.field-label input'].style.letterSpacing).toBe('normal');expect(elements['.field-label input'].style.backgroundColor).toBe('rgb(32, 47, 36)');expect(elements['.field-label input'].style.borderRadius).toBe('12px');expect(elements['.field-label input'].style.fontSize).toBe('13px');const b=elements['.field-label input'].box;expect(b.y).toBeCloseTo(state.id.startsWith('verify')||state.id==='recovery-code'?451:261,0);expect(b.x).toBeCloseTo(24,0);expect(b.width).toBeCloseTo(327,0);expect(b.height).toBeCloseTo(48,0)}
  }
 }
 writeFileSync(`${dir}/${baseline?'baseline':'implementation'}-computed.json`,JSON.stringify(results,null,2))
 expect(prohibited).toBe(0)
})
test('R15 Korean and short viewport',async({page})=>{
 await page.goto('/?auth=signup');await page.locator('.language').click();await page.evaluate(()=>document.fonts.ready)
 await expect(page.locator('.flow-content')).toHaveCSS('font-family',/GowunDodum/)
 await page.screenshot({path:`${dir}/signup-ko.png`});await page.setViewportSize({width:375,height:700});await page.screenshot({path:`${dir}/signup-ko-small.png`})
 expect(await page.locator('.auth-flow').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBeTruthy()
})
test('R15 seed demo login keeps existing navigation',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Continue with email',exact:true}).click()
 await page.locator('#accept-terms').check();await page.locator('#terms-continue').click()
 await page.locator('#auth-email').fill('mina@maugo.demo');await page.locator('#auth-password').fill('Test2026!')
 await page.getByRole('button',{name:'Sign in',exact:true}).click()
 await expect(page.getByText('You are signed in.',{exact:true})).toBeVisible()
 await page.getByRole('button',{name:'Meet your letters',exact:true}).click();await expect(page.locator('.home-flow')).toBeVisible()
})

test('R15 verification and recovery cancel paths stay local',async({page})=>{
 let calls=0;await page.route('**/api/auth/**',r=>{calls++;return r.abort()})
 for(const mode of ['verify','recovery','password','forgot','apple']){await page.goto(`/?auth=${mode}&email=reader@example.com`);await page.locator('.back').click();await expect(page.getByRole('heading',{name:'Welcome to MauGo',exact:true})).toBeVisible()}
 await page.goto('/?auth=privacy');await page.locator('.auth-privacy-back').click();await expect(page.getByRole('heading',{name:'Before you continue',exact:true})).toBeVisible();expect(calls).toBe(0)
})
