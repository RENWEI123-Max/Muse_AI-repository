import {test,expect} from '@playwright/test'
import {readFile,writeFile} from 'node:fs/promises'
test('six card states use one real registered session',async({page,request})=>{
 test.setTimeout(120000)
 const fixture=JSON.parse(await readFile('/tmp/r19-account.json','utf8')),a=fixture.author
 expect((await request.get('http://127.0.0.1:3069/profiles/me',{headers:{Authorization:`Bearer ${a.token}`}})).ok()).toBeTruthy()
 await page.addInitScript(token=>localStorage.setItem('maugo-token',token),a.token)
 await page.goto('/');await page.locator('#open-profile').click();await expect(page.locator('#upload-image-card')).toBeEnabled()
 const metrics:any[]=[]
 const box=async(selector:string,target:number[])=>{const b=await page.locator(selector).first().boundingBox();metrics.push({selector,target,actual:b});expect.soft(b).not.toBeNull();if(b)for(const [i,k] of ['x','y','width','height'].entries())expect.soft(Math.abs(b[k as keyof typeof b]-target[i]!)).toBeLessThanOrEqual(1)}
 const shot=async(name:string)=>{await page.waitForTimeout(400);await page.screenshot({path:`docs/ui-redo/r19/${name}.png`,animations:'disabled'})}
 await page.locator('#upload-image-card').click();await shot('card-type');await box('.cards-panel',[12,418,351,370]);await box('.cards-title',[33,451,309,24]);await box('[data-card-type=portrait]',[33,499,309,52]);await box('.cards-cancel',[33,719,309,48])
 await expect.soft(page.locator('.cards-panel')).toHaveCSS('background-color','rgb(24, 33, 30)');await expect.soft(page.locator('.cards-title')).toHaveCSS('font-size','18px');await expect.soft(page.locator('.cards-panel')).toHaveCSS('border-radius','24px')
 const chooser=page.waitForEvent('filechooser');await page.locator('[data-card-type=portrait]').click();await(await chooser).setFiles('src/assets/05-avatars/portrait-5.png');await expect(page.locator('.image-card')).toHaveCount(1)
 const open=()=>page.locator('.image-card').click(),close=()=>page.getByRole('button',{name:'Close D5 dialog'}).click()
 await open();await shot('card-options');await box('.cards-panel',[12,462,351,326]);await box('#card-view',[33,543,309,56]);await box('#card-type',[33,599,309,56]);await box('#card-visibility',[33,655,309,56]);await box('#card-remove',[33,711,309,56])
 await page.locator('#card-view').click();await shot('card-preview');await box('.cards-panel',[12,179.5,351,608.5]);await box('.preview',[33,260.5,309,480]);expect(await page.locator('.preview').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);await close()
 await open();await page.locator('#card-type').click();await shot('card-change-type');await box('.cards-panel',[12,418,351,370]);await box('[data-card-type=life]',[33,655,309,52]);await page.locator('[data-card-type=outfit]').click();await expect(page.locator('.image-card span')).toHaveText('outfit')
 await open();await page.locator('#card-visibility').click();await shot('card-visibility');await box('.cards-panel',[12,494,351,294]);for(const [i,v] of ['everyone','friends','only_me'].entries())await box(`[data-visibility=${v}]`,[33,575+i*68,309,56]);await expect.soft(page.locator('[data-visibility=everyone]')).toHaveCSS('border-top-color','rgb(181, 250, 112)');await page.locator('[data-visibility=only_me]').click();await expect(page.locator('.image-card small')).toContainText('Only me')
 await open();await page.locator('#card-remove').click();await shot('card-remove');await box('.cards-panel',[24,287,327,238]);await box('#d5-confirm-delete',[49,408,277,48]);await box('.cards-cancel',[49,464,277,44]);await close()
 await page.evaluate(()=>localStorage.setItem('maugo-language','ko'));await page.reload();await page.locator('#open-profile').click();await page.locator('#upload-image-card').click();expect.soft(await page.locator('.cards-panel').evaluate(e=>e.scrollWidth<=e.clientWidth)).toBeTruthy();await page.setViewportSize({width:375,height:700});await expect(page.locator('.cards-cancel')).toBeInViewport();await close();await page.setViewportSize({width:375,height:812});await open();await page.locator('#card-remove').click();await page.locator('#d5-confirm-delete').click();await expect(page.locator('.image-card')).toHaveCount(0)
 await writeFile('docs/ui-redo/r19/geometry.json',JSON.stringify(metrics,null,2))
})
