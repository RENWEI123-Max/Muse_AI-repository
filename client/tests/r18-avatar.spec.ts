import {test,expect} from '@playwright/test'
import {readFile,writeFile} from 'node:fs/promises'
test('six avatar states share one real account session',async({page,request})=>{
 test.setTimeout(180000)
 const a=JSON.parse(await readFile('/tmp/r18-account.json','utf8')),headers={Authorization:`Bearer ${a.token}`},root='http://127.0.0.1:3001'
 expect((await request.get(root+'/profiles/me',{headers})).ok()).toBeTruthy()
 await page.addInitScript(token=>localStorage.setItem('maugo-token',token),a.token)
 await page.goto('/');await page.locator('#open-profile').click();await expect(page.locator('#edit-profile')).toContainText('Reader')
 const metrics:any[]=[]
 const box=async(selector:string,target:number[])=>{const b=await page.locator(selector).first().boundingBox();metrics.push({selector,target,actual:b});expect.soft(b).not.toBeNull();if(b)for(const [i,k] of ['x','y','width','height'].entries())expect.soft(Math.abs(b[k as keyof typeof b]-target[i]!)).toBeLessThanOrEqual(1)}
 const shot=async(name:string)=>{await page.waitForTimeout(350);await page.screenshot({animations:'disabled',path:`docs/ui-redo/r18/${name}.png`})}
 const open=()=>page.locator('#edit-avatar').click()
 const upload=async()=>{const chooser=page.waitForEvent('filechooser');await page.locator('#upload-avatar').click();await(await chooser).setFiles('src/assets/05-avatars/portrait-5.png');await expect(page.locator('#avatar-canvas')).toBeVisible()}
 await page.waitForTimeout(350);await box('#edit-avatar',[143.5,152,88,88]);await open();await upload();await shot('avatar-crop');await box('.avatar-panel',[12,270,351,518]);await box('.avatar-crop-window',[75.5,351,224,224]);await box('#avatar-canvas',[76.5,352,320,320]);await box('#save-avatar',[33,719,309,48]);await page.locator('#avatar-zoom').fill('1.5');await page.locator('#save-avatar').click();await expect(page.locator('#save-avatar')).toHaveCount(0)
 await open();await shot('avatar-gallery');await box('.avatar-panel',[12,442.5,351,345.5]);await box('.avatar-option',[33,527.5,66.75,66.75]);await expect.soft(page.locator('.avatar-option')).toHaveCSS('border-radius','16px');await expect.soft(page.locator('.avatar-panel h2')).toHaveCSS('font-size','18px')
 await page.locator('[data-remove-avatar="0"]').click();await shot('avatar-remove');await box('.avatar-confirm',[24,277,327,258]);await box('#confirm-remove-avatar',[49,418,277,48]);await page.locator('#confirm-remove-avatar').click();await expect(page.locator('#removed-avatars')).toBeVisible();await shot('avatar-removed');await box('.avatar-panel',[12,378.5,351,409.5]);await page.locator('#removed-avatars').click();await shot('avatar-restore');await box('.avatar-panel',[12,487.25,351,300.75]);await box('[data-restore-avatar]',[33,608.25,66.75,66.75]);await page.locator('[data-restore-avatar="0"]').click();await expect(page.locator('.avatar-option')).toHaveCount(1)
 for(let i=1;i<8;i++){await upload();await page.locator('#save-avatar').click();await expect(page.locator('#save-avatar')).toHaveCount(0);await open()}
 await expect(page.locator('#upload-avatar')).toBeDisabled();await shot('avatar-full');await box('.avatar-panel',[12,442.5,351,345.5]);await page.locator('.d4-close').click();await page.evaluate(()=>localStorage.setItem('maugo-language','ko'));await page.reload();await page.locator('#open-profile').click();await open();expect.soft(await page.locator('.avatar-panel').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBeTruthy();await page.setViewportSize({width:375,height:700});await expect(page.locator('#upload-avatar')).toBeVisible()
 await writeFile('docs/ui-redo/r18/geometry.json',JSON.stringify(metrics,null,2))
})
