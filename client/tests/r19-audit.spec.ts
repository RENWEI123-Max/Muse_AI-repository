import {test,expect} from '@playwright/test'
import {writeFileSync} from 'node:fs'
const out='docs/ui-redo/r19-audit'
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R19 fixture walkthrough`,async({page})=>{
 test.setTimeout(180000);page.setDefaultTimeout(8000)
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 const profile={id:'r19-reader',displayName:'Audit reader',age:24,city:'Seoul',zodiac:'Libra',bio:'',avatar:null,avatars:[],recentlyRemoved:[],following:false,permissions:{canFollow:false,conversationId:null}}
 type Card={id:string,url:string,type:string,visibility:string,isPrimary:boolean}
 let cards:Card[]=[],fail='',seq=0;const uploads=new Map<string,Buffer>(),calls:any[]=[],records:any[]=[],checks:any={},errors:string[]=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/**',async route=>{
  const req=route.request(),p=new URL(req.url()).pathname.replace('/api',''),method=req.method();calls.push({path:p,method,body:['POST','PATCH'].includes(method)&&p!=='/media/uploads'?req.postDataJSON():undefined,bytes:p==='/media/uploads'?req.postDataBuffer()?.length:undefined})
  const ok=(json:any)=>route.fulfill({json}),failure=()=>route.fulfill({status:503,json:{message:'Please try again.'}})
  if(p==='/auth/login')return ok({id:profile.id,token:'r19-fixture'})
  if(p==='/profiles/me')return ok(profile)
  if(p==='/profiles/me/stats')return ok({followingCount:0,followersCount:0,likesCount:0,postLikesCount:0,imageCardLikesCount:0,visits:[],letters:[]})
  if(p==='/media/uploads'&&method==='POST'){if(fail==='upload')return failure();const id=String(++seq);uploads.set(id,req.postDataBuffer()!);return ok({id,url:'/media/uploads/'+id,kind:'image'})}
  if(p.startsWith('/media/'))return route.fulfill({contentType:'image/png',body:uploads.get(p.split('/').pop()!)!})
  if(p==='/users/me/image-cards'&&method==='GET'){if(fail==='list')return failure();return ok({items:cards})}
  if(p==='/users/me/image-cards'&&method==='POST'){if(fail==='create')return failure();const b=req.postDataJSON();if(cards.length>=8)return route.fulfill({status:409,json:{message:'Image card slots are full'}});cards.push({id:b.mediaId,url:'/media/uploads/'+b.mediaId,type:b.type,visibility:'everyone',isPrimary:cards.length===0});return ok(cards.at(-1))}
  if(p.startsWith('/users/me/image-cards/')){if(fail===method.toLowerCase())return failure();const id=p.split('/').pop(),c=cards.find(c=>c.id===id)!;if(method==='PATCH'){const b=req.postDataJSON();if(b.isPrimary)cards.forEach(c=>c.isPrimary=false);Object.assign(c,b);return ok(c)}if(method==='DELETE'){const primary=c.isPrimary;cards=cards.filter(c=>c.id!==id);if(primary&&cards.length)cards[0]!.isPrimary=true;return ok({deleted:true})}}
  if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  if(p==='/filter-pass')return ok({active:false,plans:[]})
  if(method!=='GET')throw Error('Unexpected mutation '+method+' '+p)
  return ok({items:[],hasMore:false,cities:[],responses:[]})
 })
 const root=page.locator('.profile-page').first(),d5=root.locator('.d5'),panel=d5.locator('.cards-panel')
 const save=()=>writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,initialCards:0,media:'Only browser-uploaded repository portrait-5.png bytes; never seeded cards',calls,records,checks,errors},null,2))
 const shot=async(name:string,dialog=true)=>{
  const entry=dialog?await panel.evaluate(e=>({animations:e.getAnimations().map(a=>({keyframes:(a.effect as KeyframeEffect).getKeyframes(),timing:a.effect?.getTiming()})),veilTransition:getComputedStyle(e.parentElement!).transitionDuration})):null
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})))})
  await page.waitForTimeout(350);await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  const doc=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,y:scrollY}));expect(doc).toEqual({height,width:375,y:0})
  const metric=dialog?await panel.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {box:{x:r.x,y:r.y,width:r.width,height:r.height},scroll:{client:e.clientHeight,content:e.scrollHeight,top:e.scrollTop,overflow:s.overflowY},animation:{name:s.animationName,duration:s.animationDuration,timing:s.animationTimingFunction,keyframes:e.getAnimations().map(a=>(a.effect as KeyframeEffect).getKeyframes()),veilTransition:getComputedStyle(e.parentElement!).transitionDuration},copy:[...e.querySelectorAll('button,p,h2,small')].filter(x=>x.getClientRects().length).map(x=>({text:(x as HTMLElement).innerText,clipped:x.scrollWidth>x.clientWidth+1})),images:[...e.querySelectorAll('img')].map(i=>({loaded:i.complete&&i.naturalWidth>0,width:i.width,height:i.height}))}}):null
  records.push({name,doc,entry,metric});save()
 }
 const open=()=>d5.locator('.image-card').first().click(),close=()=>panel.locator('.cards-close').click()
 const upload=async()=>{await d5.locator('#upload-image-card').click();const chooser=page.waitForEvent('filechooser');await panel.locator('[data-card-type=portrait]').click();await(await chooser).setFiles('src/assets/05-avatars/portrait-5.png');await expect(panel).toHaveCount(0)}
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r19-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await page.locator('#open-profile').click();await expect(d5.locator('#upload-image-card')).toBeEnabled()
 await shot('empty',false);fail='list';await page.goto('/');await page.locator('#open-profile').click();await expect(d5.getByRole('alert').first()).toContainText('Please try again.');await shot('list-failure',false);fail='';await d5.getByRole('button',{name:'Retry',exact:true}).click();await expect(d5.getByRole('alert')).toHaveCount(0)
 await d5.locator('#upload-image-card').click();await shot('card-type');const picker=page.waitForEvent('filechooser');await panel.locator('[data-card-type=portrait]').click();await(await picker).setFiles([]);checks.pickerCancelPanelRemains=await panel.isVisible();await close()
 await d5.locator('#upload-image-card').click();const invalid=page.waitForEvent('filechooser');await panel.locator('[data-card-type=portrait]').click();await(await invalid).setFiles({name:'bad.txt',mimeType:'text/plain',buffer:Buffer.from('not a photo')});await expect(panel.getByRole('alert')).toHaveText('Choose an image.');await shot('invalid-file');await close()
 await d5.locator('#upload-image-card').click();const large=page.waitForEvent('filechooser');await panel.locator('[data-card-type=portrait]').click();await(await large).setFiles({name:'large.png',mimeType:'image/png',buffer:Buffer.alloc(10*1024*1024)});await expect(panel.getByRole('alert')).toContainText('below 10 MB');await shot('size-boundary');await close()
 await d5.locator('#upload-image-card').click();fail='upload';const up=page.waitForEvent('filechooser');await panel.locator('[data-card-type=portrait]').click();await(await up).setFiles('src/assets/05-avatars/portrait-5.png');await expect(panel.getByRole('alert')).toHaveText('Please try again.');await shot('upload-failure');fail='';await close();await upload();await expect(d5.locator('.image-card')).toHaveCount(1)
 await d5.locator('#upload-image-card').click();fail='create';const create=page.waitForEvent('filechooser');await panel.locator('[data-card-type=portrait]').click();await(await create).setFiles('src/assets/05-avatars/portrait-5.png');await expect(panel.getByRole('alert')).toHaveText('Please try again.');await shot('create-failure');fail='';await close()
 await open();await shot('card-options');await panel.locator('#card-view').click();await shot('card-preview');checks.preview=await panel.locator('.cards-preview').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,loaded:(e as HTMLImageElement).naturalWidth>0}));await panel.hover();await page.mouse.wheel(0,500);await page.waitForTimeout(200);checks.previewScroll=await panel.evaluate(e=>({top:e.scrollTop,client:e.clientHeight,content:e.scrollHeight,documentY:scrollY}));await shot('preview-scrolled');await close()
 await open();await panel.locator('#card-type').click();await shot('card-change-type');fail='patch';await panel.locator('[data-card-type=outfit]').click();await expect(panel.getByRole('alert')).toHaveText('Please try again.');await shot('type-failure');fail='';await panel.locator('[data-card-type=outfit]').click();await expect(panel).toHaveCount(0);expect(cards[0]!.type).toBe('outfit')
 await open();await panel.locator('#card-visibility').click();await shot('card-visibility');for(const v of ['friends','only_me','everyone']){await panel.locator(`[data-visibility=${v}]`).click();await expect(panel).toHaveCount(0);expect(cards[0]!.visibility).toBe(v);await open();await panel.locator('#card-visibility').click();await expect(panel.locator(`[data-visibility=${v}]`)).toHaveAttribute('aria-pressed','true')}
 fail='patch';await panel.locator('[data-visibility=friends]').click();await expect(panel.getByRole('alert')).toHaveText('Please try again.');await shot('visibility-failure');fail='';await close()
 await open();await panel.locator('#card-remove').click();await shot('card-remove');const b=await panel.locator('#d5-confirm-delete').boundingBox();await page.mouse.move(b!.x+20,b!.y+20);await page.mouse.down();await page.waitForTimeout(180);checks.deletePress=await panel.locator('#d5-confirm-delete').evaluate(e=>getComputedStyle(e).transform);await page.mouse.move(b!.x-10,b!.y);await page.mouse.up();await panel.locator('.cards-cancel').click();await expect(panel).toHaveCount(0);checks.deleteCancelToProfile=true
 await open();await panel.locator('#card-remove').click();fail='delete';await panel.locator('#d5-confirm-delete').click();await expect(panel.getByRole('alert')).toHaveText('Please try again.');await shot('delete-failure');fail='';await panel.locator('#d5-confirm-delete').click();await expect(d5.locator('.image-card')).toHaveCount(0);await shot('removed-empty',false)
 for(let i=0;i<8;i++)await upload();await expect(d5.locator('#upload-image-card')).toBeDisabled();await shot('full',false);checks.uploadLimit=true;const body=root.locator('.d4-body');await body.hover();await page.mouse.wheel(0,600);await page.waitForTimeout(200);checks.gridScroll=await body.evaluate(e=>({top:e.scrollTop,documentY:scrollY}));await shot('full-scrolled',false);expect.soft(checks.gridScroll.top).toBeGreaterThan(0);expect.soft(checks.gridScroll.documentY).toBe(0)
 for(const target of ['card-options','card-preview','card-change-type','card-visibility','card-remove','card-type']){
  if(target==='card-type'){await open();await panel.locator('#card-remove').click();await panel.locator('#d5-confirm-delete').click();await d5.locator('#upload-image-card').click()}
  else{await open();if(target!=='card-options')await panel.locator({'card-preview':'#card-view','card-change-type':'#card-type','card-visibility':'#card-visibility','card-remove':'#card-remove'}[target]!).click()}
  await panel.locator('.cards-close').focus();await page.keyboard.press('Escape');await page.waitForTimeout(350);checks[target+'Escape']={profile:await root.isVisible(),dialogs:await panel.count()};save();expect.soft(checks[target+'Escape']).toEqual({profile:true,dialogs:0})
  if(!await root.isVisible())return
 }
 await open();await d5.locator('.cards-overlay').click({position:{x:3,y:3}});await expect(panel).toHaveCount(0);checks.backdropClose=true
 checks.clipped=records.flatMap(r=>r.metric?.copy.filter((c:any)=>c.clipped).map((c:any)=>({step:r.name,...c}))||[]);save()
 expect.soft(checks.preview).toEqual({width:309,height:480,loaded:true});expect.soft(checks.deletePress).toBe('matrix(0.96, 0, 0, 0.96, 0, 0)');expect(errors).toEqual([])
 if(height===667)expect.soft(checks.previewScroll.top,'short preview must scroll').toBeGreaterThan(0)
 for(const r of records.filter(r=>r.metric)){expect.soft(r.metric.scroll.overflow,r.name+' overflow').toBe('auto');expect.soft(r.metric.animation.veilTransition,r.name+' veil').toBe('0s');expect.soft(r.metric.animation.name,r.name).toBe('sheet-in');expect.soft(r.metric.animation.duration,r.name).toBe(['card-remove','delete-failure'].includes(r.name)?'0.22s':'0.3s')}
})
