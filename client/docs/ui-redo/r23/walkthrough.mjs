import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
const out=new URL('./',import.meta.url),browser=await chromium.launch(),results=[]
for(const height of [812,667])for(const lang of ['en','ko']){
 const page=await browser.newPage({viewport:{width:375,height}}),steps=[]
 await page.goto('http://127.0.0.1:5353/');await page.locator('.auth-preview').click();await page.locator('#open-profile').click();await page.locator('#open-settings').click();await page.waitForTimeout(400)
 if(lang==='ko'){await page.locator('#language-settings').click();await page.locator('[data-language=ko]').click();await page.locator('#settings-back').click();await page.waitForTimeout(400)}
 async function click(selector){await page.locator(selector).click();await page.waitForTimeout(400)}
 async function capture(state){
  const data=await page.locator('.settings-flow').evaluate(el=>{const b=el.querySelector('.settings-body');return {text:el.innerText,page:el.dataset.page,documentScroll:document.documentElement.scrollHeight>innerHeight,body:{height:b.clientHeight,scroll:b.scrollHeight,width:b.clientWidth,contentWidth:b.scrollWidth},elements:[...el.querySelectorAll('h1,h2,button,summary,input,textarea')].map(e=>{let r=e.getBoundingClientRect(),s=getComputedStyle(e);return {tag:e.tagName,id:e.id,text:e.textContent,x:r.x,y:r.y,width:r.width,height:r.height,font:s.font,color:s.color,background:s.backgroundColor}})}})
  steps.push({state,...data});await page.screenshot({path:new URL(`${height}-${lang}-${state}.png`,out).pathname})
  if(data.body.scroll>data.body.height+1){for(const [name,fraction]of [['middle',.5],['bottom',1]]){await page.locator('.settings-body').evaluate((el,f)=>el.scrollTop=(el.scrollHeight-el.clientHeight)*f,fraction);await page.waitForTimeout(100);await page.screenshot({path:new URL(`${height}-${lang}-${state}-${name}.png`,out).pathname})}await page.locator('.settings-body').evaluate(el=>el.scrollTop=0)}
 }
 await click('#help-settings');await capture('help');await click('#help-centre');await capture('faq');await click('details:first-of-type summary');await capture('faq-expanded');await click('#settings-back')
 for(const [control,state]of [['#community-guidelines','guidelines'],['#safety-guide','safety-guide'],['#help-privacy','privacy-policy']]){await click(control);await capture(state);await click('#settings-back')}
 await click('#support-feedback');await capture('feedback-empty');await page.locator('#feedback-text').fill('I would like to save letters into collections.');await capture('feedback-filled');await page.locator('#feedback-email').fill('invalid');await click('#save-feedback');await capture('feedback-invalid');steps.push({action:'invalid email submit',actual:await page.locator('[role=alert]').innerText(),note:'client validation only; no valid server submission'})
 await click('#settings-back');await click('#about-settings');await capture('about');await click('#about-terms');await capture('terms-full');await click('#settings-back');await click('#about-system');await capture('system-empty');await click('#settings-back');await click('#about-interactions');await capture('interactions-empty');await click('#settings-back');await click('#settings-back')
 results.push({height,lang,entry:'Welcome → Explore preview → Profile → Settings; real clicks, no token or API mocks',steps,missing:['feedback-history: no implementation or history endpoint in SettingsFlow'],validSubmission:'Not executed: backend 3001 unavailable; no fake account/session'});await page.close()
}
await writeFile(new URL('walkthrough.json',out),JSON.stringify(results,null,2));await browser.close()
