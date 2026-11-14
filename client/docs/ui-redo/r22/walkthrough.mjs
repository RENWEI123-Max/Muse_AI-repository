import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
const out=new URL('./',import.meta.url),browser=await chromium.launch(),results=[]
for(const height of [812,667])for(const lang of ['en','ko']){
 const page=await browser.newPage({viewport:{width:375,height}}),steps=[]
 await page.goto('http://127.0.0.1:5352/')
 await page.locator('.auth-preview').click();await page.locator('#open-profile').click();await page.locator('#open-settings').click();await page.waitForTimeout(500)
 if(lang==='ko'){await page.locator('#language-settings').click();await page.locator('[data-language=ko]').click();await page.locator('#settings-back').click();await page.waitForTimeout(400)}
 steps.push({action:'Welcome → Explore preview → Profile → Settings; choose language',actual:await page.locator('.settings-flow').innerText()})
 await page.locator('#security-settings').click();await page.waitForTimeout(500)
 steps.push({action:'Click Account & security',actual:await page.locator('.settings-flow').innerText(),accountSecurityCount:await page.locator('.account-security').count(),reason:'App.vue only mounts AccountSecurity when sessionToken is present; preview entry has no real account session.'})
 await page.screenshot({path:new URL(`${height}-${lang}-security-entry-blocked.png`,out).pathname})
 results.push({height,lang,steps,missingStates:['security','account-info','verification','pin-create','pin-invalid','pin-locked','pin-wrong','signout-confirm','signed-out','delete-disabled','delete-typed','delete-ready','delete-final']});await page.close()
}
await writeFile(new URL('walkthrough.json',out),JSON.stringify(results,null,2));await browser.close()
