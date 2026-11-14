import {test,expect} from '@playwright/test'
import {termsSections,termsVersion} from '../src/lib/support-content'
import {readFileSync} from 'node:fs'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang}: full copy, scroll and navigation`,async({page})=>{
 const translate=(text:string)=>lang==='ko'?ko[text]:text
 await page.setViewportSize({width:375,height})
 await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 await page.goto('/')
 await page.locator('.auth-legal button').first().click()
 const auth=page.locator('.terms-scroll')
 await expect(auth).toHaveCSS('height','350px')
 await expect(auth).toHaveCSS('overflow-y','auto')
 const beforeWheel=await page.locator('.auth-flow').evaluate(e=>e.scrollTop)
 await auth.hover();await page.mouse.wheel(0,450)
 await expect.poll(()=>auth.evaluate(e=>e.scrollTop)).toBeGreaterThan(0)
 expect(await page.locator('.auth-flow').evaluate(e=>e.scrollTop)).toBe(beforeWheel)
 await auth.evaluate(e=>e.scrollTop=0)
 const capture=async(kind:string,scroll:any,copy:any)=>{
  await expect(copy.locator('section')).toHaveCount(11)
  for(const section of termsSections){await expect(copy).toContainText(translate(section.title));await expect(copy).toContainText(translate(section.body))}
  await expect(copy).toContainText(translate(termsVersion));await expect(copy).not.toContainText('_PENDING_SMITH')
  await page.evaluate(()=>document.fonts.ready)
  const outer=await page.locator('.auth-flow').count()?await page.locator('.auth-flow').evaluate(e=>e.scrollTop):0
  for(const [position,fraction] of [['top',0],['middle',0.5],['bottom',1]] as const){
   await scroll.evaluate((e:HTMLElement,f:number)=>e.scrollTop=(e.scrollHeight-e.clientHeight)*f,fraction)
   await page.screenshot({animations:'disabled',path:`docs/ui-redo/legal-copy/${kind}-${position}-375x${height}-${lang}.png`})
  }
  const metrics=await scroll.evaluate((e:HTMLElement)=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight,width:e.clientWidth,scrollWidth:e.scrollWidth}))
  expect(metrics.top).toBeGreaterThan(0);expect(metrics.top+metrics.height).toBe(metrics.content);expect(metrics.scrollWidth).toBe(metrics.width)
  await expect(copy.locator('section').last().locator('p')).toBeInViewport()
  expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBe(height)
  if(kind==='auth')expect(await page.locator('.auth-flow').evaluate(e=>e.scrollTop)).toBe(outer)
  await test.info().attach(kind+' metrics',{body:JSON.stringify(metrics),contentType:'application/json'})
 }
 await capture('auth',auth,auth)
 await page.locator('.auth-flow .back').click();await expect(page.locator('#accept-terms')).toBeVisible()
 await page.locator('.auth-flow .auth-link').click();await expect(page.locator('.privacy-copy')).toContainText(lang==='ko'?'정식 문안':'pending Smith');await page.locator('.auth-privacy-back').click()
 // Guest preview opens the real settings UI; no backend or account fixture.
 await page.locator('.auth-flow .auth-preview').click();await page.locator('.welcome-screen .auth-preview').click()
 await page.locator('#open-profile').click();await page.locator('#open-settings').click();await page.locator('#about-settings').click();await page.locator('#about-terms').click()
 await capture('settings',page.locator('.settings-body'),page.locator('.support-policy'))
 await page.locator('#settings-back').click();await page.locator('#about-privacy').click();await expect(page.locator('.support-policy')).toContainText(lang==='ko'?'정식 문안':'pending Smith')
 await page.locator('#settings-back').click();await page.locator('#settings-back').click();await page.locator('#settings-back').click();await expect(page.locator('#open-settings')).toBeVisible()
})
