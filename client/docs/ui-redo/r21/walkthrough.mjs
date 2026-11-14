import {chromium} from '@playwright/test'
import {writeFile,readFile} from 'node:fs/promises'
const out=new URL('./',import.meta.url),browser=await chromium.launch();const results=[]
for(const height of [812,667])for(const lang of ['en','ko']){
 const page=await browser.newPage({viewport:{width:375,height}}),steps=[]
 const step=async(action,fn)=>{await fn();await page.waitForTimeout(500);steps.push({action,actual:await page.locator('.settings-flow').innerText()})}
 await page.goto('http://127.0.0.1:5351/');await page.locator('.auth-preview').click();await page.locator('#open-profile').click();await page.locator('#open-settings').click();await page.waitForTimeout(450)
 if(lang==='ko'){await page.locator('#language-settings').click();await page.locator('[data-language=ko]').click();await page.locator('#settings-back').click();await page.waitForTimeout(400)}
 const shot=async name=>{
  await page.screenshot({path:new URL(`${height}-${lang}-${name}.png`,out).pathname});
  const measures=await page.locator('.settings-flow').evaluate(root=>({pageScroll:document.scrollingElement.scrollTop,rootOverflow:root.scrollHeight>root.clientHeight,body:[root.querySelector('.settings-body').clientHeight,root.querySelector('.settings-body').scrollHeight],elements:[...root.querySelectorAll('header,h1,.settings-main,.settings-row,.language-options button,.settings-confirm')].map(e=>{const b=e.getBoundingClientRect(),s=getComputedStyle(e);return {selector:e.id||e.className,box:{x:b.x,y:b.y,width:b.width,height:b.height},font:s.font,color:s.color,background:s.background,borderRadius:s.borderRadius,horizontalOverflow:e.scrollWidth>e.clientWidth}})}));
  steps.push({state:name,screenshot:`${height}-${lang}-${name}.png`,...measures})
 }
 await shot('settings-home')
 const body=page.locator('.settings-body');if(await body.evaluate(e=>e.scrollHeight>e.clientHeight)){await body.evaluate(e=>e.scrollTop=(e.scrollHeight-e.clientHeight)/2);await shot('settings-middle');await body.evaluate(e=>e.scrollTop=e.scrollHeight);await shot('settings-bottom');await body.evaluate(e=>e.scrollTop=0)}
 const back=async()=>step('Back to settings',()=>page.locator('#settings-back').click())
 await step('Open language',()=>page.locator('#language-settings').click());await shot(lang==='en'?'language-en':'language-ko')
 await step('Switch language',()=>page.locator(`[data-language=${lang==='en'?'ko':'en'}]`).click());await shot(lang==='en'?'language-ko':'language-en');await page.locator(`[data-language=${lang}]`).click();await back()
 await step('Open notifications',()=>page.locator('#notifications-settings').click());await shot('notifications-on');await step('Disable all notifications',()=>page.locator('#allow-notifications').uncheck());steps.push({disabledCategories:await page.locator('.category-disabled input').count()});await shot('notifications-off');await page.locator('#allow-notifications').check();await back()
 await step('Open general',()=>page.locator('#general-settings').click());await shot('general');await step('Enable system font',()=>page.locator('#systemFont').check());await shot('general-font');await page.locator('#systemFont').uncheck()
 await step('Open cache confirmation',()=>page.locator('#clear-cache').click());await shot('cache-confirm');await step('Cancel cache clearing',()=>page.locator('#cancel-clear-cache').click());await page.locator('#clear-cache').click();await step('Confirm cache clearing',()=>page.locator('#confirm-clear-cache').click());steps.push({cacheResult:await page.locator('.settings-body').innerText()});await back()
 await step('Open privacy',()=>page.locator('#privacySettings-settings').click());await shot('privacy-backend-unavailable');steps.push({missingAuthenticatedStates:['privacy','privacy-visibility','privacy-only-me'],reason:'No backend on isolated port 3001; real profile/card API load fails.'});await back()
 // Capture actual pointer-down feedback, including the global individual scale property.
 const button=page.locator('#language-settings'),b=await button.boundingBox();await page.mouse.move(b.x+20,b.y+20);await page.mouse.down();await page.waitForTimeout(180);steps.push({pressed:await button.evaluate(e=>({transform:getComputedStyle(e).transform,scale:getComputedStyle(e).scale}))});await page.mouse.up()
 results.push({height,lang,mode:'real preview entry; no fixtures, interception or injected account',steps});await page.close()
}
await writeFile(new URL('walkthrough.json',out),JSON.stringify(results,null,2));await browser.close()
