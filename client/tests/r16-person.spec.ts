import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
// Isolated component contract tests: existing D4 fixed profile/content and 1x images.
// No login requests, no production session, no fixture screenshots claimed as A7.
const measurements=JSON.parse(readFileSync('docs/ui-redo/r16/figma-measurements.json','utf8'))
const states=['person-profile','person-waiting','person-followed','person-no-content','person-photo','person-safety']
for(const state of states)test(`R16 isolated ${state} geometry and computed styles`,async({page})=>{
 const waiting=state==='person-waiting',empty=waiting||state==='person-no-content'
 let following=state==='person-followed'
 await page.route(/\/(?:api\/)?(?:profiles|posts|media|conversations)(?:\/|\?)/,async r=>{
  const path=new URL(r.request().url()).pathname.replace(/^\/api/, '')
  if(path==='/profiles/peer')return r.fulfill({json:{id:'peer',displayName:'Tea friend',age:waiting?null:25,city:waiting?null:'Seoul',zodiac:null,bio:'',avatar:'/media/avatar',avatars:[],following,permissions:{canFollow:!empty,conversationId:'tea'}}})
  if(path.endsWith('/image-cards'))return r.fulfill({json:{items:(empty?['card']:['card','life']).map(id=>({url:'/media/'+id}))}})
  if(path==='/posts')return r.fulfill({json:{items:empty?[]:[{id:'day',content:'A small moment worth keeping.',attachments:[{kind:'image',url:'/media/life'}]}]}})
  if(path.startsWith('/media/'))return r.fulfill({contentType:'image/png',body:readFileSync('src/assets/05-avatars/'+(path.endsWith('life')?'portrait-4.png':'portrait-3.png'))})
  if(path==='/conversations/tea'&&r.request().method()==='PATCH'){following=r.request().postDataJSON().following;return r.fulfill({json:{}})}
  throw Error('Unexpected isolated request '+path)
 })
 const moduleSource=await (await page.request.get('/src/components/ProfileFlow.vue')).text()
 const vueUrl=moduleSource.match(/from "([^"]*vue\.js[^"]*)"/)![1]
 await page.route('**/__r16-fixture',r=>r.fulfill({contentType:'text/html',body:`<html lang="en"><body><div class="device" id="fixture"></div><script type="module">import {createApp} from '${vueUrl}';import ProfileFlow from '/src/components/ProfileFlow.vue';import '/src/styles/base.css';import '/src/styles/components.css';import '/src/styles/tokens.css';import '/src/fidelity.css';createApp(ProfileFlow,{token:'isolated-d4-fixture',person:{id:'tea',peerId:'peer',displayName:'Tea friend',status:'${empty?'waiting':'open'}',following:${following}}}).mount('#fixture')</script></body></html>`}))
 await page.goto('/__r16-fixture');await expect(page.locator('.person-name')).toHaveText('Tea friend');await page.evaluate(()=>document.fonts.ready)
 await expect(page.locator('.person-cards img')).toHaveCount(empty?1:2)
 if(state==='person-photo')await page.locator('#public-avatar').click()
 if(state==='person-safety')await page.locator('#public-more').click()
 const targets:Record<string,number[]>={'.person-header':[0,48,375,64],'#page-back':[16,60,40,40],'#public-more':[319,60,40,40],'#public-avatar':[141.5,134,92,92],'.person-name':[24,242,327,28],'.person-cards':[24,waiting?309:327,327,190],'.person-moments-title':[24,waiting?525:543,327,17],'#public-follow':[24,730,171.5,48],'#public-chat':[207.5,730,143.5,48]}
 if(empty){targets['.person-empty']=[24,waiting?582:600,327,21];targets['.person-unlock']=[24,waiting?621:639,327,21]}else{targets['.person-moment-text']=[24,605.5,327,23];targets['.ui-person-moment-photo']=[24,642.5,327,260]}
 if(state==='person-photo'){targets['.person-sheet']=[12,350.5,351,437.5];targets['.person-photo']=[33,431.5,309,309]}
 if(state==='person-safety'){targets['.person-sheet']=[12,490,351,298];targets['#safety-report']=[33,607,309,74];targets['#safety-block']=[33,693,309,74]}
 const actual:any={}
 for(const [selector,target] of Object.entries(targets)){
  const loc=page.locator(selector),box=await loc.boundingBox();actual[selector]={box,style:await loc.evaluate(e=>{const s=getComputedStyle(e);return {color:s.color,background:s.background,borderRadius:s.borderRadius,fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,opacity:s.opacity}})}
  for(const [i,k] of ['x','y','width','height'].entries())expect.soft(Math.abs(box![k as keyof typeof box]-target[i]!),`${state} ${selector} ${k}`).toBeLessThanOrEqual(1)
 }
 mkdirSync('docs/ui-redo/r16/isolated',{recursive:true});writeFileSync(`docs/ui-redo/r16/isolated/${state}.json`,JSON.stringify({source:'isolated D4 fixture, not real-session acceptance',figma:measurements.find((s:any)=>s.name.startsWith(state))?.id,actual},null,2))
 await expect(page.locator('.person-name')).toHaveCSS('font-family','Fredoka')
 await expect(page.locator('.person-name')).toHaveCSS('font-size','20px')
 await expect(page.locator('.person-name')).toHaveCSS('font-weight','550')
 await expect(page.locator('#public-follow')).toHaveCSS('background-color','rgb(38, 49, 43)')
 await expect(page.locator('#public-follow')).toHaveCSS('border-radius','24px')
 await expect(page.locator('#public-follow')).toHaveCSS('color','rgb(202, 228, 181)')
 await expect(page.locator('#public-follow')).toHaveCSS('opacity',empty?'0.5':'1')
 if(!empty){if(await page.locator('.person-close').count())await page.locator('.person-close').click();await page.locator('#public-follow').click();await expect(page.locator('#public-follow')).toHaveText(following?'✓ Following':'＋ Follow')}
 if(state==='person-safety'){await page.locator('#public-more').click();await page.locator('#safety-report').click()}
 // Korean font/overflow and short-screen positioning use this same isolated page.
 if(await page.locator('.person-close').count())await page.locator('.person-close').click()
 await page.evaluate(async path=>{const {locale}=await import(path);locale.value='ko';document.documentElement.lang='ko'},'/src/lib/i18n.ts')
 await expect(page.locator('.person-name')).toHaveCSS('font-family','GowunDodum, Fredoka, sans-serif')
 await expect(page.locator('#public-chat')).toHaveText('채팅')
 if(state==='person-safety')await page.locator('#public-more').click()
 for(const selector of ['#public-chat','#public-follow','.person-empty','.person-option-description','.person-safety-description'])for(const loc of await page.locator(selector).all())expect(await loc.evaluate(e=>e.scrollWidth<=e.clientWidth+1),`Korean overflow ${selector}`).toBe(true)
 if(await page.locator('.person-close').count())await page.locator('.person-close').click()
 await page.setViewportSize({width:375,height:700});expect((await page.locator('#public-follow').boundingBox())!.y).toBe(632)
})
