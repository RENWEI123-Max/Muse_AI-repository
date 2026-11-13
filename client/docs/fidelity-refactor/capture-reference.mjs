import { chromium } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
const out = new URL('./reference/', import.meta.url).pathname
await mkdir(out,{recursive:true})
const browser=await chromium.launch()
const page=await browser.newPage({viewport:{width:1201,height:1100},deviceScaleFactor:1})
await page.goto(`file://${homedir()}/maugo-design/MauGo-手机壳交互版-离线.html`)
await page.waitForTimeout(1200)
await page.locator('#screen').screenshot({path:out+'shell-home.png'})
const metrics=await page.evaluate(()=>['#screen','.home-header','.scene','.hat','.bottom-nav','.actions','.scene-hint'].map(selector=>{const e=document.querySelector(selector),c=getComputedStyle(e);return {selector,box:e.getBoundingClientRect().toJSON(),css:Object.fromEntries(['fontFamily','fontSize','color','backgroundColor','padding','borderRadius','display','opacity'].map(k=>[k,c[k]]))}}))
await writeFile(out+'shell-metrics.json',JSON.stringify(metrics,null,2))
await page.goto(`file://${homedir()}/maugo-handover/03-成品UI/离线预览/MauGo-全状态平铺-离线.html`)
await page.waitForFunction(()=>!!window.__atlasPrepare)
const states=await page.evaluate(()=>window.MauGoAtlasCatalog.flatMap(g=>g.pages))
const results=[]
for(const state of states){
 try{
  await page.locator(`[data-page-id="${state.id}"] .expand`).click()
  const frame=page.locator(`[data-page-id="${state.id}"] iframe`)
  await frame.waitFor({state:'visible',timeout:15000})
  await page.waitForTimeout(180)
  await frame.screenshot({path:out+state.id+'.png'})
  results.push({id:state.id,status:'captured'})
  await page.locator('#close-focus').click()
 }catch(error){results.push({id:state.id,status:'failed',error:String(error)});await page.keyboard.press('Escape')}
 console.log(state.id,results.at(-1).status)
}
await writeFile(out+'manifest.json',JSON.stringify(results,null,2))
await browser.close()
