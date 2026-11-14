import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const out='docs/ui-redo/r15-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const dictionary=(pattern:RegExp)=>Function('return ('+source.match(pattern)![1]+')')() as Record<string,string>
const enKeys=dictionary(/const en = (\{[\s\S]*?\n\})/),koKeys=dictionary(/const ko: Record<keyof typeof en, string> = (\{[\s\S]*?\n\})/)
const ko=dictionary(/const businessKo: Record<string,string> = (\{[\s\S]*?\n\})/)
for(const [key,value] of Object.entries(enKeys))if(koKeys[key])ko[value]=koKeys[key]!
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} auth click walkthrough`,async({page})=>{
 test.setTimeout(120000);page.setDefaultTimeout(8000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 const checks:any={},calls:any[]=[],records:any[]=[],errors:string[]=[],forbidden:string[]=[];let loginFail=true,verifyFail=true
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/**',async route=>{
  const req=route.request(),p=new URL(req.url()).pathname.replace('/api','');calls.push({path:p,method:req.method()})
  const ok=(json:any)=>route.fulfill({json})
  if(p==='/auth/apple'||p==='/auth/logout'||/reset|password/.test(p)){forbidden.push(p);return route.abort()}
  if(p==='/auth/login')return loginFail?route.fulfill({status:401,json:{message:'Invalid email or password.'}}):ok({id:'r15-fixture-reader',token:'r15-fixture-token'})
  if(p==='/auth/signup')return ok({id:'r15-fixture-reader',token:'r15-fixture-token'})
  // No success receipt, countdown or real email: only transport into verify UI.
  if(p==='/auth/code/send')return ok({sent:false,retryAfter:0})
  if(p==='/auth/code/verify')return verifyFail?route.fulfill({status:401,json:{message:'Incorrect verification code. Please try again.'}}):ok({verified:true})
  if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  if(p==='/filter-pass')return ok({active:false,plans:[]})
  return ok({items:[],responses:[],cities:[]})
 })
 const flow=page.locator('.auth-flow'),mode=async(s:string)=>expect(flow).toHaveAttribute('data-auth-mode',s)
 const click=async(text:string)=>page.getByRole('button',{name:t(text),exact:true}).click()
 const snap=async(name:string)=>{
  const states:Record<string,string>={'welcome':'welcome','terms-unchecked':'consent','terms-scrolled':'consent','terms-checked':'consent','consent-privacy':'privacy','auth-privacy':'privacy','verify-back-signup':'signup','password-back-signin':'signin','apple-cancel':'welcome','signin-session':'session'}
  const expected=states[name]||name.split('-')[0]!
  const titles:Record<string,string>={consent:'Before you continue',privacy:'Privacy information',signup:'Create your account',signin:'Welcome back',forgot:'Forgot your password?',password:'Choose a new password',new:'Choose a new password',verify:'Verify your email',recovery:'Password recovery',apple:'Apple sign-in',session:'Welcome to MauGo',welcome:'Welcome to MauGo'}
  const heading=page.locator('.auth-screen h1');await expect(heading).toHaveText(t(titles[expected]!))

  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})));(document.activeElement as HTMLElement)?.blur()})
  if(!/scrolled|verify-error|new-password-error/.test(name))await flow.evaluateAll(es=>es.forEach(e=>e.scrollTop=0))
  await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  const m=await page.locator('.auth-screen').evaluate(e=>({document:{height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,y:scrollY},mode:e.querySelector('.auth-flow')?.getAttribute('data-auth-mode')||'welcome',containers:[...e.querySelectorAll('.auth-flow,.terms-scroll,.auth-content')].map(b=>({class:b.className,height:b.clientHeight,content:b.scrollHeight,top:b.scrollTop,overflow:getComputedStyle(b).overflowY,overscroll:getComputedStyle(b).overscrollBehaviorY})),copy:[...e.querySelectorAll('p,h1,button,label')].filter(b=>b.getClientRects().length).map(b=>({text:b.textContent?.trim(),clipped:b.scrollWidth>b.clientWidth+1})),motion:[...e.querySelectorAll('.flow-content,.ui-button,.back')].map(b=>({class:b.className,animation:getComputedStyle(b).animationName,transition:getComputedStyle(b).transitionDuration}))}))
  records.push({name,...m});writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,checks,calls,records,errors,forbidden},null,2))
  expect(m.document).toEqual({height,width:375,y:0})
 }
 const welcome=async()=>{await page.goto('/');await expect(page.locator('.welcome-screen')).toBeVisible()}
 const enter=async(target='Continue with email')=>{await click(target);await mode('consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click()}
 const back=async()=>flow.getByRole('button',{name:t('Back'),exact:true}).first().click()
 await welcome();await snap('welcome');await page.locator('.auth-content').hover();await page.mouse.wheel(0,1000);checks.welcomeScroll=await page.locator('.auth-content').evaluate(e=>({top:e.scrollTop,overflow:getComputedStyle(e).overflowY}));expect(checks.welcomeScroll.top).toBe(0)
 const press=async(selector:string)=>{const el=page.locator(selector);await el.hover();await page.mouse.down();const m=await el.evaluate(e=>({transform:getComputedStyle(e).transform,transition:getComputedStyle(e).transitionDuration}));await page.mouse.move(1,1);await page.mouse.up();return m}
 checks.mainPress=await press('.auth-actions > .ui-button:first-child');expect(checks.mainPress.transform).toBe('matrix(0.96, 0, 0, 0.96, 0, 0)');await click('Continue with email');await mode('consent');checks.backPress=await press('.auth-flow .back');expect(checks.backPress.transform).toBe('matrix(0.94, 0, 0, 0.94, 0, 0)');await expect(page.locator('#terms-continue')).toBeDisabled();await snap('terms-unchecked')
 await page.locator('.terms-scroll').hover();await page.mouse.wheel(0,1000);await expect.poll(()=>page.locator('.terms-scroll').evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await snap('terms-scrolled')
 await page.locator('#accept-terms').check();await snap('terms-checked');await click('Privacy information');await snap('consent-privacy');await page.locator('.auth-privacy-back').click();await mode('consent');await page.locator('#terms-continue').click();await mode('signin');await snap('signin-empty')
 await page.locator('#auth-email').fill('reader@example.com');await page.locator('#auth-password').fill('SamplePass2026');await snap('signin-filled');await page.locator('#auth-email').fill('invalid');await page.locator('#auth-form .auth-main').click();await snap('signin-invalid');await expect(page.locator('#auth-error')).toContainText(t('Enter a valid email address.'))
 await page.locator('#auth-email').fill('reader@example.com');await page.locator('#auth-form .auth-main').click();await expect(page.locator('#auth-error')).toBeVisible();await snap('signin-api-failure')
 await click('Create an account');await mode('signup');await page.locator('#auth-email').fill('');await snap('signup-empty');await page.locator('#auth-name').fill('A little wanderer');await page.locator('#auth-email').fill('reader@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-confirm').fill('SamplePass2026');await snap('signup-filled')
 await page.locator('.show-password input').check();await expect(page.locator('#auth-password')).toHaveAttribute('type','text');await page.locator('.show-password input').uncheck()
 await page.locator('#auth-confirm').fill('Different2026');await page.locator('#auth-form .auth-main').click();await expect(page.locator('#auth-error')).toContainText(t('Passwords do not match.'));await snap('signup-mismatch');await flow.hover();await page.mouse.wheel(0,1600);await expect.poll(()=>flow.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await expect(page.locator('#auth-error')).toBeInViewport();await snap('signup-mismatch-scrolled')
 await click('Privacy information');await snap('auth-privacy');await page.locator('.auth-privacy-back').click();await mode('signup')
 await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-confirm').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await mode('verify');await snap('verify-empty');await page.locator('#auth-code').fill('000000');await page.locator('#code-form .auth-main').click();await expect(page.locator('#auth-error')).toContainText(t('Incorrect verification code. Please try again.'));await page.locator('#auth-error').scrollIntoViewIfNeeded();await snap('verify-error');await back();await mode('signup');await snap('verify-back-signup')
 await click('Sign in');await click('Forgot password?');await mode('forgot');await page.locator('#auth-email').fill('');await snap('forgot-empty');await page.locator('#auth-form .auth-main').click();await expect(page.locator('#auth-error')).toContainText(t('Enter a valid email address.'));await snap('forgot-validation')
 await page.locator('#auth-email').fill('reader@example.com');await page.locator('#auth-form .auth-main').click();await mode('verify');await snap('recovery-code');await back();await mode('forgot');await page.locator('#auth-form .auth-main').click();await mode('verify');verifyFail=false;await page.locator('#auth-code').fill('123456');await page.locator('#code-form .auth-main').click();await mode('password');await snap('new-password');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-confirm').fill('Different2026');await page.locator('#auth-form .auth-main').click();await expect(page.locator('#auth-error')).toContainText(t('Passwords do not match.'));await page.locator('#auth-error').scrollIntoViewIfNeeded();await snap('new-password-error');await back();await mode('signin');await snap('password-back-signin');await back();await expect(page.locator('.welcome-screen')).toBeVisible()
 await enter('Continue with Apple');await mode('apple');await snap('apple-private');await page.locator('#apple-share').click();await expect(page.locator('#apple-share')).toHaveAttribute('aria-pressed','true');await snap('apple-share');await click('Cancel');await expect(page.locator('.welcome-screen')).toBeVisible();await snap('apple-cancel')
 await click('Privacy Policy');await page.locator('.auth-privacy-back').click();await expect(page.locator('.welcome-screen')).toBeVisible();await click('Terms of Service');await back();await expect(page.locator('.welcome-screen')).toBeVisible()
 await click('Create an account');await click('Not now');await expect(page.locator('.welcome-screen')).toBeVisible()
 await enter();loginFail=false;await page.locator('#auth-email').fill('reader@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await mode('session');await snap('signin-session');await click('Meet your letters');await expect(page.locator('#open-inbox')).toBeVisible();await page.screenshot({path:`${out}/${height}-${lang}-r06-boundary.png`})
 expect(forbidden).toEqual([]);expect(errors).toEqual([])
 writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,checks,calls,records,errors,forbidden,completed:true},null,2))
})
