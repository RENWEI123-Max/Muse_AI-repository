import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const out='docs/ui-redo/r18-audit'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R18 fixture walkthrough`,async({page})=>{
 test.setTimeout(180000);page.setDefaultTimeout(8000)
 const t=(s:string)=>lang==='ko'?(ko[s]||s):s
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 type Photo={mediaId:string,url:string,position:number}
 const profile={id:'r18-reader',displayName:'Audit reader',age:24,city:'Seoul',zodiac:'Libra',bio:'',avatar:null as string|null,avatars:[] as Photo[],recentlyRemoved:[] as Photo[],following:false,permissions:{canFollow:false,conversationId:null}}
 const uploads=new Map<string,Buffer>();let fail='',seq=0
 const calls:any[]=[],records:any[]=[],checks:any={},errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/**',async route=>{
  const req=route.request(),p=new URL(req.url()).pathname.replace('/api',''),method=req.method(),body=p==='/profiles/me/avatars'?req.postDataJSON():undefined;calls.push({path:p,method,body,bytes:p==='/media/uploads'?req.postDataBuffer()?.length:undefined})
  const ok=(json:any)=>route.fulfill({json})
  if(p==='/auth/login')return ok({id:profile.id,token:'r18-fixture'})
  if(p==='/profiles/me')return ok(profile)
  if(p==='/profiles/me/stats')return ok({followingCount:0,followersCount:0,likesCount:0,postLikesCount:0,imageCardLikesCount:0,visits:[],letters:[]})
  if(p==='/media/uploads'){if(fail==='upload')return route.fulfill({status:503,json:{message:t('Please try again.')}});const id='00000000-0000-4000-8000-'+String(++seq).padStart(12,'0');uploads.set(id,req.postDataBuffer()!);return ok({id})}
  if(p.startsWith('/media/'))return route.fulfill({contentType:'image/jpeg',body:uploads.get(p.split('/').pop()!)!})
  if(p==='/profiles/me/avatars'){
   if(fail===body.action)return route.fulfill({status:503,json:{message:t('Please try again.')}})
   const position=()=>Array.from({length:8},(_,i)=>i).find(i=>!profile.avatars.some(a=>a.position===i))
   if(body.action==='add'){profile.avatars.push({mediaId:body.mediaId,url:'/media/uploads/'+body.mediaId,position:position()!})}
   if(body.action==='select')profile.avatar=profile.avatars.find(a=>a.mediaId===body.mediaId)!.url
   if(body.action==='remove'){const photo=profile.avatars.find(a=>a.mediaId===body.mediaId)!;profile.avatars=profile.avatars.filter(a=>a!==photo);profile.recentlyRemoved.push(photo);if(profile.avatar===photo.url)profile.avatar=profile.avatars[0]?.url||null}
   if(body.action==='restore'){const photo=profile.recentlyRemoved.find(a=>a.mediaId===body.mediaId)!;if(position()===undefined)return route.fulfill({status:409,json:{message:'All 8 avatar slots are occupied'}});profile.avatars.push({...photo,position:position()!});profile.recentlyRemoved=profile.recentlyRemoved.filter(a=>a!==photo)}
   return ok(profile)
  }
  if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  if(p==='/filter-pass')return ok({active:false,plans:[]})
  if(method!=='GET')throw Error('Unexpected mutation '+p)
  return ok({items:[],hasMore:false,cities:[],responses:[]})
 })
 const root=page.locator('.profile-page').first(),panel=root.getByRole('dialog')
 const save=()=>writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,uploads:'Only browser-uploaded bytes; no seeded avatar slots',calls,records,checks,errors},null,2))
 const snap=async(name:string)=>{
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})))})
  await page.waitForTimeout(350);await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  const m=await panel.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {document:{height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,y:scrollY},panel:{x:r.x,y:r.y,width:r.width,height:r.height,client:e.clientHeight,content:e.scrollHeight,overflow:s.overflowY,overscroll:s.overscrollBehavior,animation:s.animationName,duration:s.animationDuration,veilTransition:getComputedStyle(e.parentElement!).transitionDuration},copy:[...e.querySelectorAll('button,p,h2,small,label')].filter(x=>x.getClientRects().length).map(x=>({text:x.textContent?.trim(),clipped:x.scrollWidth>x.clientWidth+1})),images:[...e.querySelectorAll('img')].map(i=>i.complete&&i.naturalWidth>0)}})
  records.push({name,...m});save();expect(m.document).toEqual({height,width:375,y:0});expect(m.images.every(Boolean)).toBeTruthy()
 }
 const open=async()=>{await root.locator('#edit-avatar').click();checks.entryVeilTransition=await root.locator('.d4-veil').evaluate(e=>getComputedStyle(e).transitionDuration)},close=()=>root.locator('.d4-close').click()
 const upload=async(slot=false)=>{const chooser=page.waitForEvent('filechooser');await root.locator(slot?'[data-upload-avatar]':'#upload-avatar').first().click();await(await chooser).setFiles('src/assets/05-avatars/portrait-5.png');await expect(root.locator('#avatar-canvas')).toBeVisible()}
 const commit=async()=>{await root.locator('#save-avatar').click();await expect(panel).toHaveCount(0)}
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r18-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await page.locator('#open-profile').click();await expect(root.locator('#edit-profile')).toHaveText('Audit reader')
 await open();await snap('empty-gallery');const press=await root.locator('#upload-avatar').boundingBox();await page.mouse.move(press!.x+20,press!.y+20);await page.mouse.down();await page.waitForTimeout(180);checks.buttonPress=await root.locator('#upload-avatar').evaluate(e=>getComputedStyle(e).transform);const pressPicker=page.waitForEvent('filechooser');await page.mouse.up();await(await pressPicker).setFiles([]);await close();await expect(panel).toHaveCount(0)
 await root.locator('#edit-profile').click();await root.locator('#change-avatar').click();await close();await expect(root.locator('#edit-name')).toBeVisible();await root.locator('#page-back').click()
 await open();const picker=page.waitForEvent('filechooser');await root.locator('#upload-avatar').click();await(await picker).setFiles([]);await expect(root.locator('#upload-avatar')).toBeVisible();checks.pickerCancel=true
 const bad=page.waitForEvent('filechooser');await root.locator('#upload-avatar').click();await(await bad).setFiles({name:'broken.png',mimeType:'image/png',buffer:Buffer.from('invalid image')});await expect(root.getByRole('alert')).toHaveText(t('This photo could not be opened.'));await snap('decode-failure')
 await upload(true);await snap('avatar-crop');const beforeZoom=await root.locator('#avatar-canvas').evaluate(e=>(e as HTMLCanvasElement).toDataURL());await root.locator('#avatar-zoom').fill('1.5');checks.zoomRedraw=beforeZoom!==await root.locator('#avatar-canvas').evaluate(e=>(e as HTMLCanvasElement).toDataURL());checks.zoom=await root.locator('#avatar-zoom').inputValue();await root.locator('.d4-close').focus();await page.keyboard.press('Escape');await expect(root.locator('#upload-avatar')).toBeVisible();checks.cropCancel=true
 await upload();fail='upload';await root.locator('#save-avatar').click();await expect(root.getByRole('alert')).toHaveText(t('Please try again.'));await expect(root.locator('#save-avatar')).toBeEnabled();await snap('upload-failure');checks.failureAlertOutsideDialog=await root.getByRole('alert').evaluate(e=>!e.closest('[role=dialog]'));fail='';await commit()
 await open();await snap('avatar-gallery');fail='select';await root.locator('[data-avatar-slot]').click();await expect(root.getByRole('alert')).toHaveText(t('Please try again.'));await snap('select-failure');fail='';await root.locator('[data-avatar-slot]').click();await expect(panel).toHaveCount(0)
 await open();await root.locator('[data-remove-avatar]').click();await snap('avatar-remove');await root.getByRole('button',{name:t('Cancel'),exact:true}).click();await expect(root.locator('#upload-avatar')).toBeVisible();await root.locator('[data-remove-avatar]').click();await close();await expect(root.locator('#upload-avatar')).toBeVisible()
 await root.locator('[data-remove-avatar]').click();await root.locator('.d4-close').focus();await page.keyboard.press('Escape');await expect(root.locator('#upload-avatar')).toBeVisible();checks.removeEscape=true;await root.locator('[data-remove-avatar]').click();fail='remove';await root.locator('#confirm-remove-avatar').click();await expect(root.getByRole('alert')).toHaveText(t('Please try again.'));await snap('remove-failure');fail='';await root.locator('#confirm-remove-avatar').click();await expect(root.locator('#removed-avatars')).toBeVisible();await snap('avatar-removed')
 await root.locator('#removed-avatars').click();await snap('avatar-restore');await root.locator('.d4-close').focus();await page.keyboard.press('Escape');await expect(root.locator('#upload-avatar')).toBeVisible();checks.archiveEscape=true;await root.locator('#removed-avatars').click();fail='restore';await root.locator('[data-restore-avatar]').click();await expect(root.getByRole('alert')).toHaveText(t('Please try again.'));await snap('restore-failure');fail='';await root.locator('[data-restore-avatar]').click();await expect(root.locator('.avatar-option')).toHaveCount(1)
 for(let i=1;i<8;i++){await upload();await commit();await open()}
 await expect(root.locator('#upload-avatar')).toBeDisabled();await snap('avatar-full')
 await root.locator('[data-remove-avatar]').first().click();await root.locator('#confirm-remove-avatar').click();await root.locator('#removed-avatars').click();await root.locator('#avatar-gallery-back').click();await upload();await commit();await open();await root.locator('#removed-avatars').click();await root.locator('[data-restore-avatar]').click();await expect(root.getByRole('alert')).toHaveText('All 8 avatar slots are occupied');await snap('restore-full-failure');await close();await close()
 await open();await root.locator('.d4-veil').click({position:{x:5,y:5}});await expect(panel).toHaveCount(0);checks.backdropClose=true
 // Archive entries arise only from actual uploads/removals through the UI.
 for(let i=0;i<9;i++){await open();await root.locator('[data-remove-avatar]').first().click();await root.locator('#confirm-remove-avatar').click();await upload();await commit()}
 await open();await root.locator('#removed-avatars').click();await snap('archive-overflow');checks.archiveLayout=await panel.evaluate(e=>({gridBottom:e.querySelector('.avatar-gallery')!.getBoundingClientRect().bottom,backTop:e.querySelector('#avatar-gallery-back')!.getBoundingClientRect().top}));expect.soft(checks.archiveLayout.backTop).toBeGreaterThanOrEqual(checks.archiveLayout.gridBottom);await panel.hover();await page.mouse.wheel(0,500);await page.waitForTimeout(350);checks.archiveScroll=await panel.evaluate(e=>({top:e.scrollTop,documentY:scrollY}));await snap('archive-scrolled');await close();await close()
 await open();await root.locator('.d4-close').focus();await page.keyboard.press('Escape');await page.waitForTimeout(350);checks.escape={profileVisible:await root.isVisible(),dialogs:await panel.count()};await page.screenshot({path:`${out}/${height}-${lang}-escape.png`})
 checks.clipped=records.flatMap(r=>r.copy.filter((c:any)=>c.clipped).map((c:any)=>({step:r.name,...c})));save();expect.soft(checks.zoomRedraw).toBe(true);expect.soft(checks.buttonPress).toBe('matrix(0.96, 0, 0, 0.96, 0, 0)');expect.soft(checks.entryVeilTransition).toBe('0s');expect.soft(checks.archiveScroll.top).toBeGreaterThan(0);expect.soft(checks.archiveScroll.documentY).toBe(0);expect.soft(checks.escape).toEqual({profileVisible:true,dialogs:0});expect(errors).toEqual([])
 for(const r of records){expect.soft(r.panel.animation).toBe('sheet-in');expect.soft(r.panel.duration).toBe(['avatar-remove','remove-failure'].includes(r.name)?'0.22s':'0.3s');expect.soft(r.panel.overflow,`${r.name} panel scroll`).toBe('auto');expect.soft(r.panel.veilTransition,`${r.name} no extra veil fade`).toBe('0s')}
})
