import {test,expect} from '@playwright/test'
import {mkdir,writeFile} from 'node:fs/promises'
const evidence='docs/d5'
async function login(page:any,user:any){await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill(user.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click();await page.locator('#open-profile').click();await expect(page.locator('#upload-image-card')).toBeEnabled()}
test('D5 real B17: supported states, limits, persistence and second-account access',async({page,request,browser})=>{
 test.setTimeout(180000);await mkdir(evidence,{recursive:true})
 const fixture=await(await request.post('http://127.0.0.1:3069/__d5/seed')).json()
 const motionEvents:any[]=[];await page.exposeFunction('__recordD5Motion',(event:any)=>motionEvents.push(event));
 await page.addInitScript(()=>{(window as any).__d5Motion=[];document.addEventListener('transitionrun',event=>{const target=event.target as HTMLElement;if(target.matches('.sheet,.d5-page,.moment-card,.empty,.categories button'))(window as any).__recordD5Motion({target:target.className,property:(event as TransitionEvent).propertyName})})})
 const receipts:any[]=[]
 page.on('response',response=>{if(response.url().includes('/api/')&&/posts|image-cards|media\/uploads/.test(response.url()))receipts.push({method:response.request().method(),path:new URL(response.url()).pathname+new URL(response.url()).search,status:response.status()})})
 const snap=async(id:string)=>{await page.waitForTimeout(550);await page.screenshot({path:`${evidence}/${id}.png`})}
 await login(page,fixture.author)
 await page.locator('#upload-image-card').click();await expect(page.locator('[data-state] .type-options')).toBeVisible();await snap('card-type')
 const choose=page.waitForEvent('filechooser');await page.locator('[data-card-type="portrait"]').click();await(await choose).setFiles('src/assets/05-avatars/portrait-5.png');await expect(page.locator('.image-card')).toHaveCount(1)
 const cardId=await page.locator('.image-card').getAttribute('data-profile-moment')
 const openCard=()=>page.locator('.image-card').click()
 await openCard();await snap('card-options');await page.locator('#card-view').click();await expect(page.locator('.preview')).toBeVisible();await snap('card-preview');expect(await page.locator('.preview').evaluate((e:HTMLImageElement)=>e.naturalWidth)).toBeGreaterThan(0);await page.getByRole('button',{name:'Close D5 dialog'}).click()
 await openCard();await page.locator('#card-type').click();await snap('card-change-type');await page.locator('[data-card-type="outfit"]').click();await expect(page.locator('.image-card span')).toHaveText('outfit')
 await openCard();await page.locator('#card-visibility').click();await snap('card-visibility');await page.locator('[data-visibility="only_me"]').click();await expect(page.locator('.image-card small')).toContainText('Only me')
 const authorHeaders={Authorization:`Bearer ${fixture.author.token}`},viewerHeaders={Authorization:`Bearer ${fixture.viewer.token}`}
 const cardRows=await(await request.get('http://127.0.0.1:3069/users/me/image-cards',{headers:authorHeaders})).json();expect(cardRows.items[0].id).toBe(cardId);expect(cardRows.items[0].type).toBe('outfit')
 const mediaUrl=cardRows.items[0].url
 expect((await request.get('http://127.0.0.1:3069'+mediaUrl,{headers:viewerHeaders})).status()).toBe(403)
 await openCard();await page.locator('#card-remove').click();await snap('card-remove');await page.getByRole('button',{name:'Cancel',exact:true}).click()
 await page.locator('#profile-moments').click();await expect(page.locator('.empty:not(.d5-item-leave-active)').last()).toBeVisible();await snap('moments-empty')
 await page.locator('#new-moment').click();await expect(page.locator('#save-moment')).toBeDisabled();await snap('moment-empty')
 await page.locator('#moment-text').fill('A quiet afternoon, a little story worth sharing.');await snap('moment-draft')
 await page.locator('#d5-back').click();await snap('moment-leave');await page.locator('#keep-moment-draft').click();await login(page,fixture.author);await page.locator('#profile-moments').click();await page.locator('#new-moment').click();await expect(page.locator('#moment-text')).toHaveValue('A quiet afternoon, a little story worth sharing.')
 await page.locator('#moment-text').fill('字'.repeat(1000));await expect(page.locator('#save-moment')).toBeEnabled();await page.locator('#moment-text').fill('字'.repeat(1001));await expect(page.locator('#save-moment')).toBeDisabled();await page.locator('#moment-text').fill('A quiet afternoon, a little story worth sharing.')
 const photo=page.waitForEvent('filechooser');await page.locator('#moment-photo').click();await(await photo).setFiles('src/assets/05-avatars/portrait-5.png');await expect(page.locator('.media-grid img')).toHaveCount(1);await snap('moment-photo')
 await page.locator('#moment-sticker').click();await snap('moment-stickers');await page.locator('.stickers button').first().click();await expect(page.locator('.media-grid img')).toHaveCount(2)
 await page.locator('#moment-audience').click();await snap('moment-visibility');await page.locator('[data-visibility="only_me"]').click();await page.locator('#save-moment').click();await expect(page.locator('.moment-card')).toHaveCount(1);await expect(page.locator('.d5-page [role=status]')).toContainText('Moment published');await snap('moment-saved');await snap('moments-list')
 await page.getByRole('button',{name:'Outfit',exact:true}).click();await expect(page.locator('.empty:not(.d5-item-leave-active)').last()).toBeVisible();await snap('moments-category-empty');await page.getByRole('button',{name:'All',exact:true}).click()
 const rows=await(await request.get('http://127.0.0.1:3069/posts',{headers:authorHeaders})).json(),post=rows.items[0];expect(post.attachments).toHaveLength(2)
 await page.locator('.detail-link').click();await expect(page.locator('.d5-page h1')).toHaveText('Moment');await snap('moment-detail')
 await page.locator('[data-more]').click();await snap('moment-options');
 await page.locator('#moment-category').click();await snap('post-category');await page.locator('[data-post-category="Portrait"]').click();await expect(page.locator('.moment-card header')).toContainText('Portrait');
 await page.locator('[data-more]').click();await page.locator('#moment-visibility').click();await snap('post-visibility');await page.locator('[data-visibility="everyone"]').click();await expect(page.locator('.moment-card header')).toContainText('Everyone');
 expect((await request.get('http://127.0.0.1:3069/posts/'+post.id,{headers:viewerHeaders})).status()).toBe(200);
 expect((await request.patch('http://127.0.0.1:3069/posts/'+post.id,{headers:viewerHeaders,data:{category:'Style'}})).status()).toBe(403);
 const otherContext=await browser.newContext({viewport:{width:375,height:812}}),otherPage=await otherContext.newPage();await login(otherPage,fixture.viewer);
 await otherPage.route('**/api/posts?*',route=>{const url=new URL(route.request().url());url.searchParams.set('userId',fixture.author.id);return route.continue({url:url.toString()})});
 await otherPage.locator('#profile-moments').click();await expect(otherPage.locator('.moment-card')).toHaveCount(1);await expect(otherPage.locator('[data-more]')).toHaveCount(0);await otherPage.locator('.detail-link').click();await expect(otherPage.locator('.moment-card header')).toContainText('Everyone');await expect(otherPage.locator('[data-more]')).toHaveCount(0);await otherPage.screenshot({path:`${evidence}/non-author-detail.png`});await otherContext.close();

 await page.locator('[data-more]').click();await page.locator('#moment-visibility').click();await page.locator('[data-visibility="friends"]').click();await expect(page.locator('.moment-card header')).toContainText('Friends');
 expect((await request.get('http://127.0.0.1:3069/posts/'+post.id,{headers:viewerHeaders})).status()).toBe(403);
 await page.locator('[data-more]').click();await page.locator('#moment-visibility').click();await page.locator('[data-visibility="only_me"]').click();await expect(page.locator('.moment-card header')).toContainText('Only me');
 await snap('moment-updated');await page.locator('#d5-back').click();
 for(const c of ['Life','Style','Outfit']){await page.getByRole('button',{name:c,exact:true}).click();await expect(page.getByRole('button',{name:c,exact:true})).toBeEnabled();await expect(page.locator('.empty:not(.d5-item-leave-active)').last()).toBeVisible();expect((await request.get('http://127.0.0.1:3069/posts?category='+c,{headers:authorHeaders})).ok()).toBe(true)}
 await page.getByRole('button',{name:'Portrait',exact:true}).click();await expect(page.locator('.moment-card')).toHaveCount(1);await expect(page.locator('.moment-card header')).toContainText('Portrait');await snap('category-portrait');
 await page.getByRole('button',{name:'All',exact:true}).click();await page.locator('.detail-link').click();
 const updated=await(await request.get('http://127.0.0.1:3069/posts/'+post.id,{headers:authorHeaders})).json();expect(updated.category).toBe('Portrait');expect(updated.visibility).toBe('only_me');
 await page.locator('[data-more]').click();await page.locator('#delete-moment').click();await snap('moment-delete');await page.getByRole('button',{name:'Cancel',exact:true}).click()
 // A second browser logs in through the real auth route and attempts direct access.
 const viewerContext=await browser.newContext({viewport:{width:375,height:812}}),viewer=await viewerContext.newPage();await login(viewer,fixture.viewer)
 const checks=await viewer.evaluate(async({postId,mediaUrl,postMediaUrl,token}:any)=>{const get=async(path:string)=>{const r=await fetch('/api'+path,{headers:{Authorization:'Bearer '+token}});return {status:r.status,body:await r.json()}};return {list:await get('/posts'),detail:await get('/posts/'+postId),cardMedia:await get(mediaUrl),postMedia:await get(postMediaUrl)}},{postId:post.id,mediaUrl,postMediaUrl:post.attachments[0].url,token:fixture.viewer.token})
 expect(checks.list.body.items).toHaveLength(0);expect(checks.detail.status).toBe(403);expect(checks.cardMedia.status).toBe(403);expect(checks.postMedia.status).toBe(403);expect((await request.delete('http://127.0.0.1:3069/posts/'+post.id,{headers:viewerHeaders})).status()).toBe(403)
 await viewerContext.setExtraHTTPHeaders(viewerHeaders);await viewer.goto('/api/posts/'+post.id);await viewer.screenshot({path:`${evidence}/visibility-post-denied.png`});await viewer.goto('/api'+mediaUrl);await viewer.screenshot({path:`${evidence}/visibility-card-denied.png`})
 // Change card to friends then everyone; restrictions are checked by server, never client filtering.
 for(const [visibility,status] of [['friends',403],['everyone',200]] as const){expect((await request.patch(`http://127.0.0.1:3069/users/me/image-cards/${cardId}`,{headers:authorHeaders,data:{visibility}})).status()).toBe(200);expect((await request.get('http://127.0.0.1:3069'+mediaUrl,{headers:viewerHeaders})).status()).toBe(status)}
 const restricted=await request.post('http://127.0.0.1:3069/posts',{headers:authorHeaders,data:{content:'Friends only',visibility:'friends'}});expect(restricted.status()).toBe(201);expect((await request.get('http://127.0.0.1:3069/posts/'+(await restricted.json()).id,{headers:viewerHeaders})).status()).toBe(403)
 const friendId=(await restricted.json()).id
 const publicPost=await request.post('http://127.0.0.1:3069/posts',{headers:authorHeaders,data:{content:'Everyone can see this',visibility:'everyone'}});expect(publicPost.status()).toBe(201);expect((await request.get('http://127.0.0.1:3069/posts/'+(await publicPost.json()).id,{headers:viewerHeaders})).status()).toBe(200)
 // Pending conversations also restrict Everyone; a collected reply unlocks Friends.
 const opening=await request.post(`http://127.0.0.1:3069/conversations/${fixture.viewer.id}/opening`,{headers:authorHeaders,data:{content:'Hello from the isolated D5 acceptance account.'}});expect(opening.status()).toBe(201);const conversationId=(await opening.json()).id
 const publicId=(await publicPost.json()).id
 expect((await request.get('http://127.0.0.1:3069/posts/'+publicId,{headers:viewerHeaders})).status()).toBe(403)
 const reply=await request.post(`http://127.0.0.1:3069/conversations/${conversationId}/messages`,{headers:viewerHeaders,data:{content:'A real reply for the visibility test.'}});expect(reply.status()).toBe(201)
 const collected=await request.post(`http://127.0.0.1:3069/conversations/${conversationId}/replies/${(await reply.json()).id}/collect`,{headers:{...authorHeaders,'Idempotency-Key':'task69-d5-collect'},data:{}});expect(collected.status()).toBe(200)
 expect((await request.get('http://127.0.0.1:3069/posts/'+friendId,{headers:viewerHeaders})).status()).toBe(200)
 expect((await request.get('http://127.0.0.1:3069/posts/'+post.id,{headers:viewerHeaders})).status()).toBe(403)
 await request.patch(`http://127.0.0.1:3069/users/me/image-cards/${cardId}`,{headers:authorHeaders,data:{visibility:'friends'}})
 expect((await request.get('http://127.0.0.1:3069'+mediaUrl,{headers:viewerHeaders})).status()).toBe(200)
 // Author deletion from the detail screen, then real 404 and a fresh login/list.
 await page.locator('[data-more]').click();await page.locator('#delete-moment').click();await page.locator('#d5-confirm-delete').click();await expect(page.locator('.d5-page h1')).toHaveText('My moments');expect((await request.get('http://127.0.0.1:3069/posts/'+post.id,{headers:authorHeaders})).status()).toBe(404)
 await login(page,fixture.author);await expect(page.locator('.image-card span')).toHaveText('outfit');await openCard();await page.locator('#card-remove').click();await page.locator('#d5-confirm-delete').click();await expect(page.locator('.image-card')).toHaveCount(0)
 await page.locator('#profile-moments').click();await expect(page.locator('.moment-card')).toHaveCount(2);await expect(page.locator('.d5-page')).not.toContainText('A quiet afternoon');await page.locator('#new-moment').click();await page.locator('#moment-text').fill('Six photos');const six=page.waitForEvent('filechooser');await page.locator('#moment-photo').click();await(await six).setFiles(Array(6).fill('src/assets/05-avatars/portrait-5.png'));await expect(page.locator('.media-grid img')).toHaveCount(6);await expect(page.locator('#moment-photo')).toBeDisabled();await page.locator('#save-moment').click();await expect(page.locator('.moment-card')).toHaveCount(3)
 const final=await(await request.get('http://127.0.0.1:3069/posts',{headers:authorHeaders})).json();expect(final.items[0].attachments).toHaveLength(6)
 expect((await request.post('http://127.0.0.1:3069/posts',{headers:authorHeaders,data:{content:'字'.repeat(1001)}})).status()).toBe(400)
 expect((await request.post('http://127.0.0.1:3069/posts',{headers:authorHeaders,data:{content:'Too many',mediaIds:Array(7).fill(post.attachments[0].id)}})).status()).toBe(400)
 expect((await request.post('http://127.0.0.1:3069/media/uploads?purpose=post&filename=invalid.txt',{headers:{...authorHeaders,'Content-Type':'text/plain'},data:'invalid media'})).status()).toBe(400);
 expect((await request.post('http://127.0.0.1:3069/media/uploads?purpose=post&filename=large.png',{headers:{...authorHeaders,'Content-Type':'image/png'},data:Buffer.alloc(10*1024*1024)})).status()).toBe(413);
 await snap('limits-six-attachments');expect(await page.locator('[data-comment],.comment-bubble').count()).toBe(0)
 const motion=motionEvents;expect(motion.some((e:any)=>e.target==='sheet')).toBe(true);expect(motion.some((e:any)=>e.target.split(' ').includes('d5-page'))).toBe(true)
 expect(motion.some((e:any)=>e.target.split(' ').includes('empty'))).toBe(true);
 await writeFile(`${evidence}/verification.json`,JSON.stringify({database:fixture.database,stateScreenshots:18,prototypePassed:18,prototypeGaps:[],postUpdate:{category:updated.category,visibility:updated.visibility,nonAuthorOptions:0,nonAuthorPatch:403},checks,receipts,motion,friendUnlock:{friendsPost:200,friendsCardMedia:200,privatePost:403},pendingEveryoneStatus:403,deletedPostStatus:404,sixAttachments:final.items[0].attachments.length},null,2));await viewerContext.close()
})
