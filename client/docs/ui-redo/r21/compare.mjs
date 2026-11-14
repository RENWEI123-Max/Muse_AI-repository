import {chromium} from '@playwright/test'
import {readFile,writeFile} from 'node:fs/promises'
const out=new URL('./',import.meta.url),ref=new URL('../../design-reference/figma/',import.meta.url),browser=await chromium.launch(),page=await browser.newPage({viewport:{width:750,height:812},deviceScaleFactor:1});const results=[]
for(const state of ['settings-home','language-en','language-ko','notifications-on','notifications-off','general','general-font','cache-confirm']){
 const left='data:image/png;base64,'+(await readFile(new URL(state+'.png',ref))).toString('base64'),right='data:image/png;base64,'+(await readFile(new URL('812-en-'+state+'.png',out))).toString('base64')
 await page.setContent(`<body style="margin:0;display:flex"><img src="${left}" width="375" height="812"><img src="${right}" width="375" height="812"></body>`)
 await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())))
 const metric=await page.locator('img').evaluateAll(imgs=>{const pixels=imgs.map(img=>{const c=document.createElement('canvas');c.width=375;c.height=812;const ctx=c.getContext('2d');ctx.drawImage(img,0,0,375,812);return ctx.getImageData(0,0,375,812).data});let different=0,absolute=0;for(let i=0;i<pixels[0].length;i+=4){let diff=false;for(let k=0;k<4;k++){const d=Math.abs(pixels[0][i+k]-pixels[1][i+k]);absolute+=d;diff ||= d!==0}if(diff)different++}return {differentPixels:different,totalPixels:375*812,differenceRatio:different/(375*812),meanAbsoluteChannelDifference:absolute/(375*812*4),method:'Exact RGBA inequality, no acceptance threshold; reference left, real preview capture right'}})
 await page.screenshot({path:new URL('compare-'+state+'.png',out).pathname});results.push({state,...metric})
}
await writeFile(new URL('comparisons.json',out),JSON.stringify(results,null,2));await browser.close()
