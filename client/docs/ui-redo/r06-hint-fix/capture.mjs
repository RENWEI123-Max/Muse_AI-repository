import {chromium} from '@playwright/test'
import {writeFileSync} from 'node:fs'
const phase=process.argv[2]||'after', out=new URL('.',import.meta.url).pathname
const browser=await chromium.launch({headless:true})
const results=[]
for(const [width,height] of [[375,667],[390,700],[390,744],[375,812],[390,844]])for(const lang of ['en','ko'])for(const state of ['empty','ready']){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'})
 await page.addInitScript(lang=>{localStorage.setItem('maugo-language',lang);localStorage.setItem('maugo-token','layout-fixture');localStorage.setItem('maugo-account','layout-reader')},lang)
 await page.route('**/api/**',route=>{
 const p=new URL(route.request().url()).pathname.replace('/api','')
 const letters=Array.from({length:3},(_,i)=>({openingMessageId:`letter-${i}`,sender:{id:`sender-${i}`,displayName:`Little bird ${i}`,city:'Seoul',age:25},content:'A little story.'}))
 const json=p==='/letters'||p==='/letters/refresh'?{items:state==='empty'?[]:letters,responses:[]}:p==='/filter-pass'?{active:false,plans:[]}:p==='/discovery/filters'?{cities:[]}:p==='/wallet'?{diamonds:0}:{items:[]}
 return route.fulfill({json})
 })
 await page.goto('http://127.0.0.1:5326')
 await page.locator(`[data-state="home-${state}"]`).waitFor()
 await page.locator('.home-flow.refreshing').waitFor({state:'detached'})
 await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(800)
 const boxes=await page.evaluate(()=>Object.fromEntries(Object.entries({hat:'.magic-hat',hint:'.scene-hint',actions:'.home-actions',economy:'.economy-actions',nav:'.main-nav'}).map(([k,s])=>{const r=document.querySelector(s).getBoundingClientRect();return[k,{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}]})))
 const overlap=(a,b)=>Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y))*(Math.min(a.x+a.width,b.x+b.width)>Math.max(a.x,b.x)?1:0)
 const pairs={};const keys=['hint','actions','economy','nav'];for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)pairs[`${keys[i]}/${keys[j]}`]=overlap(boxes[keys[i]],boxes[keys[j]])
 const row={width,height,lang,state,boxes,hatHintOverlap:overlap(boxes.hat,boxes.hint),pairs,navInside:boxes.nav.bottom<=height,filename:`${phase}-${width}x${height}-${lang}-${state}.png`}
 await page.screenshot({path:out+row.filename});results.push(row);await page.close()
}
writeFileSync(out+`${phase}-measurements.json`,JSON.stringify(results,null,2));await browser.close()
if(phase==='after'&&results.some(r=>r.hatHintOverlap||Object.values(r.pairs).some(Boolean)||!r.navInside))process.exitCode=1
console.log(`${phase}: ${results.length} captures; overlaps: ${results.filter(r=>r.hatHintOverlap||Object.values(r.pairs).some(Boolean)).length}`)
