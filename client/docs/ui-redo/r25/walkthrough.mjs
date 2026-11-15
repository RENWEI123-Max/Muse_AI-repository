// Real registered accounts, ordinary APIs and UI. No fixture endpoints, balance seeds or API interception.
import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
const out=new URL('./',import.meta.url),browser=await chromium.launch(),context=await browser.newContext({viewport:{width:375,height:667}}),page=await context.newPage(),rows=[],requests=[]
page.setDefaultTimeout(8000)
page.on('response',r=>{if(r.url().includes('/api/'))requests.push({path:new URL(r.url()).pathname,status:r.status()})})
const password='SamplePass2026',stamp=Date.now()
async function register(suffix){const email=`r25-${stamp}-${suffix}@test.local`,r=await context.request.post('http://127.0.0.1:3001/auth/signup',{data:{email,password,termsVersion:'1.0',privacyVersion:'1.0'}});if(r.status()!==201)throw Error('signup '+r.status());return {...await r.json(),email,password}}
const user=await register('reader'),peer=await register('peer')
// A real ordinary opening message enables a waiting conversation; no reply collection or purchase is performed.
const opening=await context.request.post(`http://127.0.0.1:3001/conversations/${peer.id}/opening`,{headers:{Authorization:`Bearer ${user.token}`},data:{content:'Hello, I enjoyed a quiet walk today. What small moment made you smile?'}})
if(opening.status()!==201)throw Error('opening '+opening.status()+' '+await opening.text())
async function click(s){await page.locator(s).first().click();await page.waitForTimeout(350)}
async function home(lang){await page.evaluate(l=>localStorage.setItem('maugo-language',l),lang);await page.goto('http://127.0.0.1:5355/');await page.waitForTimeout(700)}
async function capture(module,state,selector,lang){
 const el=page.locator(selector).last();await el.waitFor({state:'visible'});await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});await page.waitForTimeout(250)
 const metrics=await el.evaluate(root=>{
  const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'}
  const containers=[root,...root.querySelectorAll('*')].filter(e=>visible(e)&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).map(e=>({tag:e.tagName,class:e.className,client:e.clientHeight,scroll:e.scrollHeight,scrollable:e.scrollHeight>e.clientHeight+1}))
  const overflow=[...root.querySelectorAll('h1,h2,h3,p,button,label,summary,input,textarea,small,strong')].filter(visible).filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({tag:e.tagName,class:e.className,text:e.textContent?.slice(0,100),client:e.clientWidth,scroll:e.scrollWidth}))
  const verticalClipCandidates=[],viewportOverflowCandidates=[]
  for(const e of [...root.querySelectorAll('h1,h2,h3,p,button,label,summary,input,textarea,small,strong')].filter(visible)){
   const r=e.getBoundingClientRect();let scrollAncestor=false
   for(let a=e.parentElement;a;a=a.parentElement){const style=getComputedStyle(a),b=a.getBoundingClientRect();if(['auto','scroll'].includes(style.overflowY))scrollAncestor=true;if(!scrollAncestor&&['hidden','clip'].includes(style.overflowY)&&(r.top<b.top-1||r.bottom>b.bottom+1))verticalClipCandidates.push({class:e.className,id:e.id,text:e.textContent?.slice(0,70),clippedBy:a.className,top:r.top,bottom:r.bottom});if(a===root)break}
   if(!scrollAncestor&&(r.top< -1||r.bottom>innerHeight+1||r.left< -1||r.right>innerWidth+1))viewportOverflowCandidates.push({class:e.className,id:e.id,text:e.textContent?.slice(0,70),rect:r.toJSON()})
  }
  return {text:root.innerText,documentScroll:document.documentElement.scrollHeight>innerHeight+1,documentHorizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,containers,horizontalOverflowCandidates:overflow,verticalClipCandidates,viewportOverflowCandidates,animations:root.getAnimations({subtree:true}).map(a=>({name:a.animationName||a.transitionProperty,state:a.playState,duration:a.effect?.getTiming().duration}))}
 })
 const file=`667-${lang}-${state}.png`;await page.screenshot({path:new URL(file,out).pathname})
 const scrollProof=await el.evaluate(root=>[root,...root.querySelectorAll('*')].filter(e=>e.scrollHeight>e.clientHeight+1&&['auto','scroll'].includes(getComputedStyle(e).overflowY)).map(e=>{const before=e.scrollTop;e.scrollTop=e.scrollHeight;const after=e.scrollTop;return {class:e.className,before,after,max:e.scrollHeight-e.clientHeight}}))
 if(scrollProof.length){await page.screenshot({path:new URL(`667-${lang}-${state}-bottom.png`,out).pathname});await el.evaluate(root=>[root,...root.querySelectorAll('*')].forEach(e=>{if(['auto','scroll'].includes(getComputedStyle(e).overflowY))e.scrollTop=0}))}
 let press=null;const btn=el.locator('button:visible:enabled').first()
 if(await btn.count()){
  try{await btn.hover();await page.mouse.down();await page.waitForTimeout(200);press=await btn.evaluate(e=>({class:e.className,scale:getComputedStyle(e).scale,transform:getComputedStyle(e).transform}));await page.mouse.move(374,1);await page.mouse.up()}catch(e){await page.mouse.up();press={error:String(e)}}
 }
 const motionEvents=await page.evaluate(()=>window.__r25Motion||[]);
 rows.push({module,state,lang,file,...metrics,scrollProof,press,motionEvents,clipping:'candidate metrics only; no complete glyph or touch-device audit'})
 await writeFile(new URL('walkthrough.json',out),JSON.stringify(rows,null,2)+'\n')
}
async function attempt(module,state,lang,fn){try{await fn()}catch(e){rows.push({module,state,lang,error:String(e),status:'未验证'});await writeFile(new URL('walkthrough.json',out),JSON.stringify(rows,null,2)+'\n')}}
await context.addInitScript(()=>{window.__r25Motion=[];for(const type of ['animationstart','animationend','transitionrun','transitionend'])document.addEventListener(type,e=>{const t=e.target,s=getComputedStyle(t);window.__r25Motion.push({type,name:e.animationName||e.propertyName,elapsed:e.elapsedTime,class:t.className,animationDuration:s.animationDuration,transitionDuration:s.transitionDuration});if(window.__r25Motion.length>200)window.__r25Motion.shift()})});
await page.goto('http://127.0.0.1:5355/?auth=consent');await page.locator('#accept-terms').check();await click('#terms-continue');await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill(password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click();await page.waitForTimeout(600)
for(const lang of ['en','ko']){
 // Entry is inspected in an independent unauthenticated page, without deleting the real session.
 await attempt('entry','welcome',lang,async()=>{const entry=await browser.newPage({viewport:{width:375,height:667}});await entry.addInitScript(l=>localStorage.setItem('maugo-language',l),lang);await entry.goto('http://127.0.0.1:5355/');await entry.waitForTimeout(350);const selector='.auth-screen';if(await entry.locator(selector).count()){await entry.screenshot({path:new URL(`667-${lang}-welcome.png`,out).pathname});rows.push({module:'entry',state:'welcome',lang,file:`667-${lang}-welcome.png`,documentScroll:await entry.evaluate(()=>document.documentElement.scrollHeight>innerHeight+1),note:'independent unauthenticated browser context; no session mutation'})}await entry.close()})
 for(const [module,state,selector,steps]of [
  ['home','home-empty','.home-flow',[]],
  ['home','filters-free','.home-sheet',['#settings']],
  ['letters','compose-empty','.letters-panel',['#compose']],
  ['inbox','inbox-messages','.inbox-flow',['#open-inbox']],
  ['chat','chat-waiting','.c6-chat',['#open-inbox','.chat-row']],
  ['chat','chat-details-waiting','.c6-chat',['#open-inbox','.chat-row','#chat-details']],
  ['appearance','wallpapers','.c6-chat',['#open-inbox','.chat-row','#chat-details','#chat-background']],
  ['safety','blocked-list-empty','.d3-blocked',['#open-inbox','#inbox-menu','#blocked-people']],
  ['public-profile','person-waiting','.d4-profile',['#open-inbox','.chat-row','#chat-details','#view-public-profile']],
  ['profile','profile-content','.d4-profile',['#open-profile']],
  ['profile','avatar-gallery','.avatar-panel',['#open-profile','#edit-avatar']],
  ['image-cards','card-type','.cards-panel',['#open-profile','#upload-image-card']],
  ['moments','moments-empty','.d5-page',['#open-profile','#profile-moments']],
  ['settings','settings-home','.settings-flow',['#open-profile','#open-settings']],
  ['account','security','.account-security',['#open-profile','#open-settings','#security-settings']],
  ['support','help','.settings-flow',['#open-profile','#open-settings','#help-settings']],
  ['diamonds','wallet-empty','.reply-topup',['#open-wallet']],
  ['diamonds','pass-default','.wallet-pass',['#open-pass']]
 ])await attempt(module,state,lang,async()=>{await home(lang);for(const s of steps)await click(s);await capture(module,state,selector,lang)})
 rows.push({module:'reply-cost',state:'reply-payment',lang,status:'待 Smith',reason:'fresh ordinary accounts have no paid reply requirement; no wallet seeds or diamond deductions executed'})
}
await writeFile(new URL('requests.json',out),JSON.stringify(requests,null,2)+'\n');await writeFile(new URL('walkthrough.json',out),JSON.stringify(rows,null,2)+'\n');await browser.close();console.log('captures',rows.filter(r=>r.file).length,'errors',rows.filter(r=>r.error).length)
