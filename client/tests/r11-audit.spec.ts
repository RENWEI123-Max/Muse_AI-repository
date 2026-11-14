import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const out='docs/ui-redo/r11-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
test.use({launchOptions:{args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']}})
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R11 actual clicks API fixture`,async({page})=>{
 test.setTimeout(120000);page.setDefaultTimeout(10000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 let pending=false,opened=false,fail=false,uploadFail=false,media=false,n=0
 const calls:any[]=[],records:any[]=[],errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 const row={id:'chat-0',peerId:'peer-0',displayName:'Tea friend',remark:'',pinned:false,muted:false,hidden:false,following:false,unreadCount:0,status:'waiting',lastMessage:'A gentle little story.',updatedAt:'2026-11-14T10:00:00Z'}
 const messages=Array.from({length:24},(_,i)=>({id:`m${i}`,content:`${i+1}. A gentle little story.`,kind:'reply',createdAt:row.updatedAt,mine:i%2===0}))
 await page.route('**/api/**',async route=>{
  const req=route.request(),p=new URL(req.url()).pathname.replace('/api','');calls.push({path:p,method:req.method()});const ok=(json:any)=>route.fulfill({json})
  if(p==='/auth/login')return ok({id:'r11-reader',token:'r11-api-fixture'})
  if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  if(p==='/filter-pass')return ok({active:false,plans:[]})
  if(p==='/letters'||p==='/letters/refresh')return ok({items:[],responses:[]})
  if(p==='/blocks')return ok({items:[]})
  if(p==='/conversations')return ok({items:[row],hasMore:false})
  if(p.endsWith('/replies/pending'))return ok({items:pending?[{id:'reply-0'}]:[],hasMore:false})
  if(p.endsWith('/collect')){pending=false;opened=true;row.status='open';return ok({state:'collected',cost:0})}
  if(p.startsWith('/media/uploads')){if(uploadFail)return route.fulfill({status:503,json:{message:'Please try again.'}});return ok({id:'media-fixture'})}
  if(p.endsWith('/media')){media=true;return ok({id:`sent-${++n}`})}
  if(p.endsWith('/messages')){
   if(req.method()==='POST'){if(fail)return route.fulfill({status:503,json:{message:'Please try again.'}});const m={id:`sent-${++n}`,content:req.postDataJSON().content,kind:'reply',createdAt:row.updatedAt,mine:true};messages.push(m);return ok({id:m.id})}
   return ok({items:[...messages,...(media?[{id:'photo',content:'',media:[{url:'/src/assets/05-avatars/portrait-1.png',kind:'image'}],mine:true,kind:'reply',createdAt:row.updatedAt}]:[])],hasMore:false,canChat:opened})
  }
  return ok({items:[],cities:[]})
 })
 const root=page.locator('.c6-chat')
 const shot=async(name:string,state?:string)=>{if(state)await expect(root).toHaveAttribute('data-state',state);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(650);await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`});records.push({name,state:await root.getAttribute('data-state'),document:await page.evaluate(()=>({height:document.documentElement.scrollHeight,y:scrollY,viewport:innerHeight})),copy:await root.locator('button,p,strong,h1,small').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>({text:e.textContent,clipped:e.scrollWidth>e.clientWidth+1}))) });writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,calls,records,errors},null,2))}
 const back=()=>page.getByLabel(t('Back to messages')).click()
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r11-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await page.locator('#open-inbox').click();await page.locator('[data-chat]').click()
 await shot('chat-waiting','chat-waiting');await page.locator('#chat-details').click();await expect(root).toHaveAttribute('data-state','chat-details-waiting');await back();await expect(root).toHaveAttribute('data-state','chat-waiting')
 pending=true;await expect(root).toHaveAttribute('data-state','chat-receipt-waiting',{timeout:7000});await shot('chat-receipt-waiting','chat-receipt-waiting');await page.getByRole('button',{name:t('Collect your reply'),exact:true}).click();await page.locator('#reply-payment-cancel').click();await expect(root).toHaveAttribute('data-state','chat-receipt-waiting');await page.getByRole('button',{name:t('Collect your reply'),exact:true}).click();await page.locator('#confirm-reply-payment').click();
 // Collection preserves the originating chat; only enter a row if returned to inbox.
 if(!await root.count())await page.locator('[data-chat]').click()
 await shot('chat-open','chat-open');const initial=await page.locator('#chat-thread').evaluate(e=>({top:e.scrollTop,content:e.scrollHeight,height:e.clientHeight}));expect(initial.top).toBeGreaterThan(0)
 await page.locator('#chat-thread').hover();await page.mouse.wheel(0,-10000);await page.waitForTimeout(250);const up=await page.locator('#chat-thread').evaluate(e=>e.scrollTop);expect(up).toBe(0)
 await page.locator('#chat-input').fill('A kind message.');await shot('chat-draft','chat-draft');await back();await page.locator('[data-chat]').click();await expect(page.locator('#chat-input')).toHaveValue('A kind message.');fail=true;await page.locator('#chat-send').click();await expect(root.getByRole('alert')).toBeVisible();await shot('send-failure');await expect(page.locator('#chat-input')).toHaveValue('A kind message.');fail=false;await page.locator('#chat-send').click();await shot('chat-sent','chat-sent');expect(await page.locator('#chat-thread').evaluate(e=>e.scrollHeight-e.clientHeight-e.scrollTop)).toBeLessThan(2)
 await page.locator('#chat-photo').setInputFiles('src/assets/05-avatars/portrait-1.png');await shot('chat-attachment','chat-attachment');await page.getByLabel(t('Remove attachment')).click();await expect(page.locator('.c6-attachment')).toHaveCount(0);await page.locator('#chat-photo').setInputFiles('src/assets/05-avatars/portrait-1.png');await page.locator('#chat-send').click();await expect(page.locator('.c6-attachment')).toHaveCount(0);await back();await page.locator('[data-chat]').click();await shot('chat-photo','chat-photo')
 await page.locator('#chat-stickers').click();await shot('chat-stickers','chat-stickers');await page.locator('.ui-sticker-grid').hover();await page.mouse.wheel(0,900);await page.waitForTimeout(200);const stickerScroll=await page.locator('.ui-sticker-grid').evaluate(e=>({top:e.scrollTop,height:e.clientHeight,content:e.scrollHeight}));expect(stickerScroll.top).toBeGreaterThan(0);await shot('sticker-scroll');await page.keyboard.press('Escape');await expect(page.locator('.c6-stickers')).toHaveCount(0);await page.locator('#chat-stickers').click();await page.locator('.sticker-option').first().click();await shot('chat-sticker-selected','chat-sticker-selected');await page.getByLabel(t('Remove attachment')).click();await page.getByLabel(t('Close emoji picker')).click();await page.locator('#chat-stickers').click();await page.locator('.sticker-option').first().click();await page.locator('#chat-send').click();await expect(page.locator('.c6-attachment')).toHaveCount(0)
 const hold=await page.locator('#chat-hold').boundingBox();await page.mouse.move(hold!.x+20,hold!.y+10);await page.mouse.down();await expect(root).toHaveAttribute('data-state','chat-recording');await shot('chat-recording','chat-recording');const wave=await page.locator('.chat-wave-bar').first().evaluate(e=>({name:getComputedStyle(e).animationName,duration:getComputedStyle(e).animationDuration}));expect(wave.duration).toBe('0.6s');await page.mouse.move(hold!.x+20,hold!.y-100);await shot('chat-record-cancel','chat-record-cancel');await page.mouse.up();await expect(page.locator('.c6-record')).toHaveCount(0);await expect(page.locator('#voice-send')).toHaveCount(0)
 await page.mouse.move(hold!.x+20,hold!.y+10);await page.mouse.down();await expect(page.locator('.c6-record')).toBeVisible();await page.keyboard.press('Escape');await page.mouse.up();await expect(page.locator('.c6-record')).toHaveCount(0)
 await page.mouse.move(hold!.x+20,hold!.y+10);await page.mouse.down();await expect(root).toHaveAttribute('data-state','chat-recording');await page.waitForTimeout(1600);await page.mouse.up();await expect(page.locator('#voice-send')).toBeVisible();await shot('voice-preview');uploadFail=true;await page.locator('#voice-send').click();await expect(page.locator('#voice-send')).toHaveText(t('Retry voice'));await shot('voice-upload-failure');uploadFail=false;await page.locator('#voice-send').click();await expect(page.locator('#voice-send')).toHaveCount(0);await expect(root.locator('audio').first()).toBeVisible();await shot('voice-sent')
 await page.evaluate(()=>{navigator.mediaDevices.getUserMedia=async()=>{throw new DOMException('Denied by fixture','NotAllowedError')}});await page.locator('#chat-hold').click();await shot('chat-mic-denied','chat-mic-denied');await page.locator('#chat-input').fill('Text still works.');await page.locator('#chat-send').click();await expect(page.locator('#chat-input')).toHaveValue('')
 await page.locator('#chat-details').click();await expect(root).toHaveAttribute('data-state','chat-details');await shot('details-boundary');await back();await expect(root).toHaveAttribute('data-state','chat-mic-denied');await back();await expect(page.locator('.inbox-flow')).toBeVisible()
 expect(errors).toEqual([]);for(const r of records){expect.soft(r.document.height).toBe(height);expect.soft(r.document.y).toBe(0)}writeFileSync(`${out}/${height}-${lang}-checks.json`,JSON.stringify({initial,up,stickerScroll,wave,errors,calls,clipped:records.flatMap(r=>r.copy.filter((c:any)=>c.clipped).map((c:any)=>({state:r.name,...c})))},null,2))
})
