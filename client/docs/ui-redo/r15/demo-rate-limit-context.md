# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r15-auth.spec.ts >> R15 seed demo login keeps existing navigation
- Location: tests/r15-auth.spec.ts:54:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('You are signed in.', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('You are signed in.', { exact: true }) with timeout 5000ms
  - waiting for getByText('You are signed in.', { exact: true })

```

```yaml
- main "MauGo":
  - img "MauGo"
  - button "Switch language": 한국어
  - button "Back": ‹ ‹ Back
  - heading "Welcome back" [level=1]
  - paragraph: Your little corner is waiting for you.
  - text: Email address
  - textbox "Email address": mina@maugo.demo
  - text: Password
  - textbox "Password": Test2026!
  - checkbox "Show password"
  - text: Show password
  - button "Forgot password?"
  - button "Sign in"
  - paragraph:
    - text: New here?
    - button "Create an account"
  - alert: Rate limit exceeded
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test'
  2  | import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
  3  | const states=JSON.parse(readFileSync(new URL('./module01.json',import.meta.url),'utf8'))
  4  | const dir='docs/ui-redo/r15'
  5  | // Chromium serializes a zero letter-spacing as normal in getComputedStyle.
  6  | const targets=JSON.parse(readFileSync('docs/ui-redo/r15/assertion-targets.json','utf8'))
  7  | test('R15 safe auth states, geometry and styles',async({page})=>{
  8  |  test.setTimeout(90000);mkdirSync(dir,{recursive:true})
  9  |  const baseline=process.env.R15_BASELINE==='1', results:any[]=[]
  10 |  let prohibited=0
  11 |  await page.route('**/api/auth/**',r=>{if(r.request().url().endsWith('/auth/code/verify'))return r.continue();prohibited++;return r.abort()})
  12 |  for(const state of states){
  13 |   if(state.id==='verify-resend')continue
  14 |   const mode=state.task.replace('auth:','').replace('policy','privacy')
  15 |   await page.goto(mode==='welcome'?'/':`/?auth=${mode}${['verify','recovery'].includes(mode)?'&email=reader@example.com':''}`)
  16 |   await page.locator('.auth-top').waitFor();await page.evaluate(()=>document.fonts.ready)
  17 |   for(const [kind,selector,value] of state.actions){
  18 |    const field=page.locator(selector)
  19 |    if(kind==='fill')await field.fill(selector==='#auth-email'&&value==='reader@example.com'?'mina@maugo.demo':String(value))
  20 |    if(kind==='check')await field.setChecked(Boolean(value))
  21 |    if(kind==='click')await field.click()
  22 |    if(kind==='submit'){
  23 |     if(state.id==='verify-error'&&baseline)await page.locator('#auth-code').fill('123')
  24 |     await field.evaluate((f:HTMLFormElement)=>f.requestSubmit())
  25 |    }
  26 |   }
  27 |   if(state.id==='verify-error'&&!baseline)await expect(page.locator('#auth-error')).toHaveText('Incorrect verification code. Please try again.')
  28 |   await page.waitForTimeout(300)
  29 |   const elements:any={}
  30 |   for(const selector of ['.wordmark','.flow-content h1','.auth-content h1','.field-label input','.terms-scroll','#accept-terms','#terms-continue','#apple-hide','#apple-share','.auth-error']){
  31 |    const loc=page.locator(selector).first();if(!await loc.count())continue
  32 |    elements[selector]={box:await loc.boundingBox(),style:await loc.evaluate(el=>{const s=getComputedStyle(el);return Object.fromEntries(['color','backgroundColor','backgroundImage','borderRadius','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','boxShadow'].map(k=>[k,s[k as any]]))})}
  33 |   }
  34 |   results.push({state:state.id,elements})
  35 |   await page.screenshot({path:`${dir}/${baseline?'baseline-':''}${state.id}.png`})
  36 |   if(!baseline&&state.id==='signup-mismatch'){await page.locator('#auth-error').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/signup-mismatch-scrolled.png`})}
  37 |   if(!baseline){
  38 |    for(const [selector,actual] of Object.entries(elements) as any){const target=targets[state.id][selector];if(target)for(const k of ['x','y','width','height'])expect(Math.abs(actual.box[k]-target.box[k]),`${state.id} ${selector} ${k}`).toBeLessThanOrEqual(1)}
  39 |    const heading=elements['.flow-content h1']||elements['.auth-content h1'];expect(heading.style.color).toBe('rgb(228, 239, 217)');expect(heading.style.fontWeight).toBe('500');expect(heading.style.lineHeight).toBe('32px');expect(heading.style.letterSpacing).toBe('-0.3px')
  40 |    const mark=elements['.wordmark'].box;expect(mark.x).toBeCloseTo(140.5,0);expect(Math.abs(mark.y-(state.id==='welcome'?67.73:67.23))).toBeLessThanOrEqual(1);expect(mark.width).toBeCloseTo(94,0);expect(mark.height).toBeCloseTo(24.54,0)
  41 |    expect(elements['.flow-content h1']?.style.fontSize||elements['.auth-content h1']?.style.fontSize).toBe(state.id==='welcome'?'26px':'24px')
  42 |    if(elements['.field-label input']){expect(elements['.field-label input'].style.color).toBe('rgb(228, 239, 217)');expect(elements['.field-label input'].style.fontWeight).toBe('400');expect(elements['.field-label input'].style.lineHeight).toBe('20px');expect(elements['.field-label input'].style.letterSpacing).toBe('normal');expect(elements['.field-label input'].style.backgroundColor).toBe('rgb(32, 47, 36)');expect(elements['.field-label input'].style.borderRadius).toBe('12px');expect(elements['.field-label input'].style.fontSize).toBe('13px');const b=elements['.field-label input'].box;expect(b.y).toBeCloseTo(state.id.startsWith('verify')||state.id==='recovery-code'?451:261,0);expect(b.x).toBeCloseTo(24,0);expect(b.width).toBeCloseTo(327,0);expect(b.height).toBeCloseTo(48,0)}
  43 |   }
  44 |  }
  45 |  writeFileSync(`${dir}/${baseline?'baseline':'implementation'}-computed.json`,JSON.stringify(results,null,2))
  46 |  expect(prohibited).toBe(0)
  47 | })
  48 | test('R15 Korean and short viewport',async({page})=>{
  49 |  await page.goto('/?auth=signup');await page.locator('.language').click();await page.evaluate(()=>document.fonts.ready)
  50 |  await expect(page.locator('.flow-content')).toHaveCSS('font-family',/GowunDodum/)
  51 |  await page.screenshot({path:`${dir}/signup-ko.png`});await page.setViewportSize({width:375,height:700});await page.screenshot({path:`${dir}/signup-ko-small.png`})
  52 |  expect(await page.locator('.auth-flow').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBeTruthy()
  53 | })
  54 | test('R15 seed demo login keeps existing navigation',async({page})=>{
  55 |  await page.goto('/');await page.getByRole('button',{name:'Continue with email',exact:true}).click()
  56 |  await page.locator('#accept-terms').check();await page.locator('#terms-continue').click()
  57 |  await page.locator('#auth-email').fill('mina@maugo.demo');await page.locator('#auth-password').fill('Test2026!')
  58 |  await page.getByRole('button',{name:'Sign in',exact:true}).click()
> 59 |  await expect(page.getByText('You are signed in.',{exact:true})).toBeVisible()
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  60 |  await page.getByRole('button',{name:'Meet your letters',exact:true}).click();await expect(page.locator('.home-flow')).toBeVisible()
  61 | })
  62 | 
  63 | test('R15 verification and recovery cancel paths stay local',async({page})=>{
  64 |  let calls=0;await page.route('**/api/auth/**',r=>{calls++;return r.abort()})
  65 |  for(const mode of ['verify','recovery','password','forgot','apple']){await page.goto(`/?auth=${mode}&email=reader@example.com`);await page.locator('.back').click();await expect(page.getByRole('heading',{name:'Welcome to MauGo',exact:true})).toBeVisible()}
  66 |  await page.goto('/?auth=privacy');await page.locator('.auth-privacy-back').click();await expect(page.getByRole('heading',{name:'Before you continue',exact:true})).toBeVisible();expect(calls).toBe(0)
  67 | })
  68 | 
```