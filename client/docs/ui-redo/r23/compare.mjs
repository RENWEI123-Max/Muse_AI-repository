import {chromium} from '@playwright/test'
import {readFile,writeFile} from 'node:fs/promises'
const base=new URL('./',import.meta.url),browser=await chromium.launch(),page=await browser.newPage(),rows=[]
for(const state of ['help','faq','faq-expanded','feedback-empty','feedback-filled','feedback-invalid','about','guidelines','safety-guide','privacy-policy','terms-full','system-empty','interactions-empty']){
 const a=await readFile(new URL(`812-en-${state}.png`,base)),b=await readFile(new URL(`../../design-reference/figma/${state}.png`,base))
 const r=await page.evaluate(async({a,b})=>{const load=async s=>{const i=new Image();i.src=`data:image/png;base64,${s}`;await i.decode();return i};const [x,y]=await Promise.all([load(a),load(b)]);const c=document.createElement('canvas');c.width=750;c.height=812;const ctx=c.getContext('2d');ctx.drawImage(x,0,0);ctx.drawImage(y,375,0);const side=c.toDataURL().split(',')[1];const px=ctx.getImageData(0,0,375,812).data,py=ctx.getImageData(375,0,375,812).data;let count=0;for(let i=0;i<px.length;i+=4)if(px[i]!==py[i]||px[i+1]!==py[i+1]||px[i+2]!==py[i+2]||px[i+3]!==py[i+3])count++;return {side,count}}, {a:a.toString('base64'),b:b.toString('base64')})
 await writeFile(new URL(`${state}-side-by-side.png`,base),Buffer.from(r.side,'base64'));rows.push({state,differentPixels:r.count,totalPixels:375*812,percent:r.count/(375*812)*100,method:'exact RGBA inequality, no mask or threshold'})
}
await writeFile(new URL('comparison.json',base),JSON.stringify(rows,null,2));await browser.close()
