import {test,expect} from '@playwright/test'
import {readFileSync,writeFileSync} from 'node:fs'
const out='docs/ui-redo/r20-fixes/avatar'
const source=readFileSync('src/lib/i18n.ts','utf8')
const ko=Object.fromEntries([...source.matchAll(/^  (".*?"): (".*?"),?$/gm)].map(m=>[JSON.parse(m[1]!),JSON.parse(m[2]!)]))
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R20 fixes avatar walkthrough`,async({page})=>{
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
 const snap=async(name:string)=>{await page.waitForTimeout(350);for(const toast of await page.locator('.ui-toast').all()){const box=await toast.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(375)};await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`});records.push({name,doc:await page.evaluate(()=>({width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,y:scrollY}))});save()}
 const open=async()=>{await root.locator('#edit-avatar').click();checks.entryVeilTransition=await root.locator('.d4-veil').evaluate(e=>getComputedStyle(e).transitionDuration)},close=()=>root.locator('.d4-close').click()
 const upload=async(slot=false)=>{const chooser=page.waitForEvent('filechooser');await root.locator(slot?'[data-upload-avatar]':'#upload-avatar').first().click();await(await chooser).setFiles('src/assets/05-avatars/portrait-5.png');await expect(root.locator('#avatar-canvas')).toBeVisible()}
 const commit=async()=>{await root.locator('#save-avatar').click();await expect(panel).toHaveCount(0)}
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r18-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('#open-profile').click();await expect(root.locator('#edit-profile')).toHaveText('Audit reader')
 await open();await upload();await close();await expect(panel).toHaveCount(0);await expect(root.locator('#edit-avatar')).toBeFocused();await snap('crop-close-source')
 await root.locator('#edit-profile').click();await root.locator('#change-avatar').click();await upload();await close();await expect(root.locator('#edit-name')).toBeVisible();await expect(root.locator('#change-avatar')).toBeFocused();await snap('crop-close-edit')
 await root.locator('#change-avatar').click();const large=page.waitForEvent('filechooser');await root.locator('#upload-avatar').click();await(await large).setFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(20*1024*1024+1)});await expect(root.locator('.ui-toast')).toContainText('20 MB');await snap('avatar-size-toast');await expect(root.locator('.ui-toast')).toHaveCount(0,{timeout:4000});expect(calls.filter(c=>c.path==='/media/uploads')).toHaveLength(0);await close()
 await root.locator('#page-back').click();await open();await upload();await commit();await expect(root.locator('.ui-toast')).toContainText(t('Avatar saved.'));await snap('avatar-saved-toast');await expect(root.locator('.ui-toast')).toHaveCount(0,{timeout:4000})
 await root.locator('#likes').click();await expect(root.locator('.d4-body')).toHaveAttribute('inert','');await expect(root.locator('.d4-close')).toBeFocused();await snap('likes-focus');await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(root.locator('#likes')).toBeFocused()
 for(const target of ['gallery','crop']){await open();if(target==='crop')await upload();await root.locator('.d4-close').focus();await page.keyboard.press('Escape');await expect(root).toBeVisible();await expect(panel).toHaveCount(0)}
 await open();await root.locator('[data-remove-avatar]').first().click();await root.locator('.d4-close').focus();await page.keyboard.press('Escape');await expect(root.locator('.avatar-gallery')).toBeVisible();await root.locator('[data-remove-avatar]').first().click();await root.locator('#confirm-remove-avatar').click();await root.locator('#removed-avatars').click();await root.locator('.d4-close').focus();await page.keyboard.press('Escape');await expect(root.locator('.avatar-gallery')).toBeVisible();await close()
 save();expect(errors).toEqual([])
})
