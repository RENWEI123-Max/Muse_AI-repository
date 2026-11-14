import {test,expect} from '@playwright/test'
import {readFile,writeFile} from 'node:fs/promises'
test('R20 local JSON geometry and style samples, Korean overflow and short viewport',async({page})=>{
 const f=JSON.parse(await readFile('/tmp/r20-account.json','utf8'))
 await page.addInitScript(t=>localStorage.setItem('maugo-token',t),f.author.token)
 await page.goto('/');await page.locator('#open-profile').click();await expect(page.locator('#new-profile-moment')).toBeEnabled();await page.locator('#profile-moments').click();await page.locator('#new-moment').click();await page.waitForTimeout(400)
 const results:any[]=[]
 const box=async(s:string,target:number[])=>{const b=await page.locator(s).first().boundingBox();const pass=!!b&&['x','y','width','height'].every((k,i)=>Math.abs((b as any)[k]-target[i]!)<=1);results.push({kind:'geometry',selector:s,target,actual:b,pass});expect.soft(pass,s).toBeTruthy()}
 const css=async(s:string,p:string,v:string)=>{const actual=await page.locator(s).first().evaluate((e,p)=>getComputedStyle(e).getPropertyValue(p),p);results.push({kind:'style',selector:s,property:p,target:v,actual,pass:actual===v});expect.soft(actual,s+' '+p).toBe(v)}
 await box('.d5-page',[0,48,375,764]);await box('.d5-page>header',[0,48,375,64]);await box('#d5-back',[16,59.5,40,40]);await box('.d5-page h1',[68,67.5,239,24]);await box('#moment-text',[24,136,327,160]);await box('#compose-category',[24,452,327,48]);await box('#moment-audience',[24,524,327,56]);
 await css('.d5-page','background-color','rgb(13, 23, 19)');await css('.d5-page h1','font-size','17px');await css('.d5-page h1','font-weight','550');await css('#moment-text','font-size','14px');await css('#moment-text','line-height','21px');await css('#compose-category','background-color','rgb(32, 47, 36)');await css('#compose-category','border-radius','12px')
 await page.locator('#moment-audience').click();await page.waitForTimeout(400);await box('.sheet',[12,494,351,294]);await box('.sheet h2',[33,527,309,24]);await css('.sheet','background-color','rgb(24, 33, 30)');await css('.sheet','border-radius','24px');await page.getByRole('button',{name:'Close D5 dialog'}).click()
 await page.locator('#moment-sticker').click();await page.waitForTimeout(400);await box('.sheet',[14,336,347,376]);await css('.sheet','background-color','rgb(29, 41, 35)');await page.screenshot({path:'docs/ui-redo/r20/moment-stickers.png',animations:'disabled'});await page.getByRole('button',{name:'Close D5 dialog'}).click()
 await page.evaluate(()=>localStorage.setItem('maugo-language','ko'));await page.reload();await page.locator('#open-profile').click();await page.locator('#profile-moments').click();await page.locator('#new-moment').click();await page.waitForTimeout(400)
 for(const s of ['.d5-page','.page-body','#compose-category','#moment-audience']){const pass=await page.locator(s).evaluate(e=>e.scrollWidth<=e.clientWidth);results.push({kind:'ko-overflow',selector:s,pass});expect.soft(pass,s).toBeTruthy()}
 await page.setViewportSize({width:375,height:700});await page.locator('#moment-sticker').click();await expect(page.locator('.sheet')).toBeInViewport();await page.waitForTimeout(400);await box('.sheet',[14,300,347,376]);await page.getByRole('button',{name:'Close D5 dialog'}).click();
 await writeFile('docs/ui-redo/r20/measurements-browser.json',JSON.stringify(results,null,2))
})
