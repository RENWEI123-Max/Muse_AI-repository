import {test,expect} from '@playwright/test'
import {writeFileSync} from 'node:fs'
const out='docs/ui-redo/r20-fixes/moments'
for(const height of [667,812])for(const lang of ['en','ko'])test(`${height} ${lang} R20 fixes moments walkthrough`,async({page})=>{
 test.setTimeout(240000);page.setDefaultTimeout(8000)
 await page.setViewportSize({width:375,height});await page.addInitScript(lang=>localStorage.setItem('maugo-language',lang),lang)
 const profile={id:'r20-reader',displayName:'Audit reader',age:24,city:'Seoul',zodiac:'Libra',bio:'',avatar:null,avatars:[],recentlyRemoved:[],following:false,permissions:{canFollow:false,conversationId:null}}
 type Media={id:string,url:string,kind:string};type Post={id:string,userId:string,content:string,category:string,visibility:string,createdAt:string,attachments:Media[]}
 let posts:Post[]=[],fail='',seq=0;const uploads=new Map<string,{body:Buffer,type:string}>(),calls:any[]=[],records:any[]=[],checks:any={},errors:string[]=[]
 page.on('pageerror',e=>errors.push(e.message))
 await page.route('**/api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname.replace('/api',''),method=req.method();calls.push({path:p,query:url.search,method,body:['POST','PATCH'].includes(method)&&p!=='/media/uploads'?req.postDataJSON():undefined,bytes:p==='/media/uploads'?req.postDataBuffer()?.length:undefined})
  const ok=(json:any)=>route.fulfill({json}),failure=()=>route.fulfill({status:503,json:{message:'Please try again.'}})
  if(p==='/auth/login')return ok({id:profile.id,token:'r20-fixture'})
  if(p==='/profiles/me')return ok(profile)
  if(p==='/profiles/me/stats')return ok({followingCount:0,followersCount:0,likesCount:0,postLikesCount:0,imageCardLikesCount:0,visits:[],letters:[]})
  if(p==='/users/me/image-cards')return ok({items:[]})
  if(p==='/media/uploads'&&method==='POST'){if(fail==='upload')return failure();const id=String(++seq),type=req.headers()['content-type']!;uploads.set(id,{body:req.postDataBuffer()!,type});return ok({id,url:'/media/uploads/'+id,kind:type.startsWith('video/')?'video':type.startsWith('audio/')?'audio':'image'})}
  if(p.startsWith('/media/')){const m=uploads.get(p.split('/').pop()!)!;return route.fulfill({contentType:m.type,body:m.body})}
  if(p==='/posts'&&method==='GET'){if(fail==='list')return failure();const category=url.searchParams.get('category'),offset=Number(url.searchParams.get('offset')||0);return ok({items:posts.filter(x=>!category||category==='All'||x.category===category).slice(offset,offset+20)})}
  if(p==='/posts'&&method==='POST'){if(fail==='publish')return failure();const b=req.postDataJSON();const row={id:'post-'+(++seq),userId:profile.id,content:b.content,visibility:b.visibility,category:b.category,createdAt:new Date().toISOString(),attachments:b.mediaIds.map((id:string)=>({id,url:'/media/uploads/'+id,kind:uploads.get(id)!.type.startsWith('image/')?'image':'audio'}))};posts.unshift(row);return ok(row)}
  if(p.startsWith('/posts/')){const id=p.split('/').pop(),row=posts.find(x=>x.id===id)!;if(method==='PATCH'){if(fail==='patch')return failure();Object.assign(row,req.postDataJSON());return ok(row)}if(method==='DELETE'){if(fail==='delete')return failure();posts=posts.filter(x=>x.id!==id);return ok({deleted:true})}return ok(row)}
  if(p==='/wallet')return ok({diamonds:100,freeRemaining:1,cost:0,paidCost:10})
  if(p==='/filter-pass')return ok({active:false,plans:[]})
  if(method!=='GET')throw Error('Unexpected mutation '+method+' '+p)
  return ok({items:[],hasMore:false,cities:[],responses:[]})
 })
 const profilePage=page.locator('.profile-page').first(),d5=profilePage.locator('.d5'),view=d5.locator('.d5-page'),body=view.locator('.page-body'),overlay=d5.locator('.moments-overlay'),panel=overlay.locator('.sheet')
 const save=()=>writeFileSync(`${out}/${height}-${lang}-walkthrough.json`,JSON.stringify({fixture:true,initialPosts:0,contentOrigin:'Only browser typed content and UI uploads/publish; no seeded posts/likes/comments or Vue state injection',calls,records,checks,errors},null,2))
 const shot=async(name:string,primary=false)=>{
  const entry=await panel.count()?await panel.evaluate(e=>({animations:e.getAnimations().map(a=>({keyframes:(a.effect as KeyframeEffect).getKeyframes(),timing:a.effect?.getTiming()})),transition:getComputedStyle(e).transitionDuration,veilTransition:getComputedStyle(e.parentElement!).transitionDuration})):null
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getClientRects().length).map(i=>i.decode().catch(()=>{})))})
  const decoded=await d5.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.getClientRects().length).map(i=>({loaded:(i as HTMLImageElement).complete&&(i as HTMLImageElement).naturalWidth>0,src:(i as HTMLImageElement).src.startsWith('blob:')?'uploaded blob':'repository asset'})));expect(decoded.every(i=>i.loaded),name+' visible images decode').toBe(true)
  await page.waitForTimeout(600);for(const toast of await page.locator('.ui-toast').all()){const box=await toast.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(375)};await page.screenshot({path:`${out}/${height}-${lang}-${name}.png`})
  const doc=await page.evaluate(()=>({height:document.documentElement.scrollHeight,width:document.documentElement.scrollWidth,y:scrollY}));expect.soft(doc,name+' document fixed').toEqual({height,width:375,y:0})
  const metric=await panel.count()?await panel.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {box:{x:r.x,y:r.y,width:r.width,height:r.height},overflow:s.overflowY,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,animation:{name:s.animationName,duration:s.animationDuration,timing:s.animationTimingFunction},transition:s.transitionDuration}}):null
  const copy=await (await panel.count()?panel:view).evaluate(e=>[...e.querySelectorAll('h1,h2,h3,button,p,small,textarea')].filter(x=>x.getClientRects().length).map(x=>({text:(x as HTMLInputElement).placeholder||(x as HTMLElement).innerText,clipped:x.scrollWidth>x.clientWidth+1})))
  records.push({name,primary,decoded,state:await d5.getAttribute('data-state'),doc,entry,metric,copy});save()
 }
 const close=async()=>{await panel.locator('.close').click();await expect(panel).toHaveCount(0)}
 const upload=async(files:any='src/assets/05-avatars/portrait-5.png')=>{const picker=page.waitForEvent('filechooser');await view.locator('#moment-photo').click();await(await picker).setFiles(files)}
 const options=()=>view.locator('[data-more]').first().click()
 const scroll=async(name:string,loc=body)=>{await loc.hover();await page.mouse.wheel(0,900);await page.waitForTimeout(200);checks[name]=await loc.evaluate(e=>({top:e.scrollTop,client:e.clientHeight,content:e.scrollHeight,documentY:scrollY}));save()}
 const press=async(name:string,loc:any)=>{await loc.scrollIntoViewIfNeeded();const b=await loc.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();checks[name]=await loc.evaluate((e:Element)=>getComputedStyle(e).transform);await page.mouse.move(b.x+b.width/2,b.y-5);await page.mouse.up();save()}
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('r20-audit@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .ui-button').click();await page.locator('#open-profile').click();await expect(d5.locator('#new-profile-moment')).toBeEnabled();await d5.locator('#profile-moments').click();await shot('moments-empty',true)
 fail='list';await view.locator('#d5-back').click();await d5.locator('#profile-moments').click();await expect(d5.locator('.ui-toast')).toBeVisible();await shot('list-failure');fail='';await view.getByRole('button',{name:lang==='ko'?'다시 시도':'Retry',exact:true}).click();await expect(view.locator('article')).toHaveCount(0);await expect(view.getByRole('button',{name:lang==='ko'?'다시 시도':'Retry',exact:true})).toHaveCount(0)
 await view.locator('#new-moment').click();await view.locator('#moment-text').fill(lang==='ko'?'테스트 순간':'A moment from a real UI click');await shot('compose-translated')
 await view.locator('#moment-audience').click();await shot('visibility-translated');await panel.locator('.close').focus();await page.keyboard.press('Escape');await expect(panel).toHaveCount(0);await expect(view).toBeVisible();await expect(view.locator('#moment-audience')).toBeFocused()
 fail='publish';await view.locator('#save-moment').click();await expect(d5.locator('.ui-toast')).toBeVisible();await shot('publish-error');fail='';await view.locator('#d5-back').click();await panel.locator('#discard-moment-draft').click();await view.locator('#new-moment').click();await expect(d5.locator('.ui-toast')).toHaveCount(0);await view.locator('#moment-text').fill(lang==='ko'?'게시한 순간':'Published moment');await view.locator('#save-moment').click();await expect(d5.locator('.ui-toast')).toBeVisible();await shot('published-toast');await expect(d5.locator('.ui-toast')).toHaveCount(0,{timeout:4000})
 await options();await panel.locator('#delete-moment').click();await shot('delete-translated');await panel.locator('#d5-confirm-delete').click();await expect(view.locator('article')).toHaveCount(0);await shot('deleted-toast');await expect(d5.locator('.ui-toast')).toHaveCount(0,{timeout:4000});save();expect(errors).toEqual([])
})
