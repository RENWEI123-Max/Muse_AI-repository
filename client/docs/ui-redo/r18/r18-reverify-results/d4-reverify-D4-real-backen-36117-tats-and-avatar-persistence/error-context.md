# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: d4-reverify.spec.ts >> D4 real backend profile, stats and avatar persistence
- Location: tests/d4-reverify.spec.ts:4:1

# Error details

```
Error: expect(locator).toHaveJSProperty(expected) failed

Locator: locator('#edit-avatar img')
Expected: 320
Error: strict mode violation: locator('#edit-avatar img') resolved to 2 elements:
    1) <img alt="Your avatar" data-v-e838ed77="" class="profile-avatar-image" src="blob:http://127.0.0.1:5173/9323e943-1251-42e7-9425-5dcf50d35b82"/> aka getByRole('button', { name: 'Change avatar' })
    2) <img alt="" data-v-e838ed77="" class="profile-camera-icon" src="/src/assets/08-interface-icons/icon-camera-dark-15.png"/> aka getByRole('button', { name: 'Change avatar' })

Call log:
  - Expect "toHaveJSProperty" locator('#edit-avatar img') with timeout 5000ms
  - waiting for locator('#edit-avatar img')

```

# Page snapshot

```yaml
- main "MauGo" [ref=f2e3]:
  - generic [ref=f2e4]:
    - generic [ref=f2e5]:
      - generic:
        - img "MauGo"
        - generic:
          - button "Bird appearance" [ref=f2e6] [cursor=pointer]
          - button "Filters" [ref=f2e7] [cursor=pointer]
      - generic:
        - generic [aria-hidden]: ✦
        - generic [aria-hidden]: ✦
        - generic [aria-hidden]: ✦
        - button "Tap the hat to meet three new letters" [ref=f2e8] [cursor=pointer]:
          - img "A black magic hat with a glowing green ribbon" [ref=f2e9]
      - paragraph [ref=f2e10]: Everyone
      - paragraph [ref=f2e11]: No letters yet. Try a wider search.
      - generic [ref=f2e12]:
        - button "Diamonds" [ref=f2e13] [cursor=pointer]
        - button "Filter Pass ›" [ref=f2e14] [cursor=pointer]
      - generic [ref=f2e15]:
        - button "Refresh" [ref=f2e16] [cursor=pointer]:
          - generic [ref=f2e17]: Edit filters
        - button "Write a letter" [ref=f2e18] [cursor=pointer]: Send a letter
      - navigation [ref=f2e19]:
        - button "Home" [ref=f2e20] [cursor=pointer]
        - button "Messages" [ref=f2e21] [cursor=pointer]
        - button "My profile" [active] [ref=f2e22] [cursor=pointer]: Profile
    - generic [ref=f2e23]:
      - generic [ref=f2e24]:
        - button "Back" [ref=f2e25] [cursor=pointer]
        - heading "My little corner" [level=1] [ref=f2e26]
        - button "Settings" [ref=f2e27] [cursor=pointer]
      - generic [ref=f2e28]:
        - generic [ref=f2e29]:
          - button "Change avatar" [ref=f2e30] [cursor=pointer]:
            - img "Your avatar" [ref=f2e31]
          - button [ref=f2e33] [cursor=pointer]:
            - strong [ref=f2e34]: Reader revised
          - paragraph [ref=f2e35]: 26 · Libra · Seoul
          - paragraph [ref=f2e36]: Real saved profile
        - generic [ref=f2e37]:
          - button "0 Following" [ref=f2e38] [cursor=pointer]:
            - text: "0"
            - generic [ref=f2e39]: Following
          - button "0 Followers" [ref=f2e40] [cursor=pointer]:
            - text: "0"
            - generic [ref=f2e41]: Followers
          - button "0 Likes" [ref=f2e42] [cursor=pointer]:
            - text: "0"
            - generic [ref=f2e43]: Likes
          - button "◷ Visitors ›" [ref=f2e44] [cursor=pointer]:
            - text: ◷
            - generic [ref=f2e45]: Visitors ›
        - generic [ref=f2e46]:
          - generic [ref=f2e47]:
            - heading "Image cards" [level=2] [ref=f2e48]
            - button "Profile visibility ›" [ref=f2e49] [cursor=pointer]:
              - text: Profile visibility
              - generic [ref=f2e50]: ›
          - generic [ref=f2e51]:
            - button "Image card portrait Main · Everyone" [ref=f2e52] [cursor=pointer]:
              - img "Image card" [ref=f2e53]
              - generic [ref=f2e54]: portrait
              - generic [ref=f2e55]: Main · Everyone
            - button "＋ Upload a photo" [ref=f2e56] [cursor=pointer]:
              - generic [ref=f2e57]: ＋
              - generic [ref=f2e58]: Upload a photo
          - generic [ref=f2e59]:
            - button "My moments ›" [ref=f2e60] [cursor=pointer]
            - button "A little moment" [ref=f2e61] [cursor=pointer]:
              - generic [aria-hidden] [ref=f2e62]: ＋
        - button "My letters ›" [ref=f2e64] [cursor=pointer]:
          - text: My letters
          - generic [ref=f2e65]: ›
      - navigation "Main navigation" [ref=f2e66]:
        - button "Home" [ref=f2e67] [cursor=pointer]
        - button "Messages" [ref=f2e68] [cursor=pointer]
        - button "Profile" [ref=f2e69] [cursor=pointer]
```

# Test source

```ts
  1  | import {readFile} from 'node:fs/promises'
  2  | import {test,expect} from '@playwright/test'
  3  | const root=process.env.D4_API_ROOT||'http://127.0.0.1:3195'
  4  | test('D4 real backend profile, stats and avatar persistence',async({page,request})=>{
  5  |  test.setTimeout(180000)
  6  |  const a=process.env.D4_SHARED_ACCOUNT?JSON.parse(await readFile(process.env.D4_SHARED_ACCOUNT,'utf8')):await(await request.post(root+'/__c5/seed',{data:{mode:'empty'}})).json()
  7  |  const headers={Authorization:`Bearer ${a.token}`}
  8  |  const shot=async(name:string)=>{await page.screenshot({animations:'disabled',path:`test-results/d4-round2/${name}.png`})}
  9  |  async function login(name='Reader'){if(process.env.D4_SHARED_ACCOUNT){await page.addInitScript(token=>localStorage.setItem('maugo-token',token),a.token);await page.goto('/')}else{await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(a.email);await page.locator('#auth-password').fill(a.password);await page.locator('#auth-form button.primary').click();await page.getByRole('button',{name:'Meet your letters'}).click();}await page.locator('#open-profile').click();await expect(page.locator('#edit-profile')).toContainText(name)}
  10 |  await login();await shot('profile-empty');await expect(page.locator('.d4-body')).toHaveCSS('animation-name',/d4-open/);await expect(page.locator('.d4-body')).toHaveCSS('animation-duration','0.3s');await page.locator('#likes').click();await page.getByRole('button',{name:'Close',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.locator('#likes').click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.d4-body')).toHaveCSS('animation-name','none');await page.locator('#likes').click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Close',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await page.emulateMedia({reducedMotion:'no-preference'})
  11 |  for(const [id,state] of [['following','following-empty'],['followers','followers-empty'],['profile-visitors','visitors-empty'],['profile-letters','my-letters-empty']]){await page.locator('#'+id).click();await shot(state!);await page.locator('#page-back').click()}
  12 |  await page.locator('#edit-profile').click();await shot('profile-edit');await page.locator('#edit-age').fill('17');await page.locator('#save-profile').click();await expect(page.getByRole('alert')).toContainText('between 18 and 100');await shot('profile-invalid');await page.locator('#edit-age').fill('26');await page.locator('#edit-name').fill('Reader revised');await page.locator('#edit-city').fill('Seoul');await page.locator('#edit-zodiac').selectOption('Libra');await page.locator('#edit-bio').fill('Real saved profile');await page.locator('#save-profile').click();await expect(page.locator('#edit-profile')).toContainText('Reader revised');expect((await(await request.get(root+'/profiles/me',{headers})).json()).bio).toBe('Real saved profile')
  13 |  await page.locator('#edit-avatar').click();await expect(page.locator('.avatar-empty')).toHaveCount(8)
  14 |  async function upload(){const chooser=page.waitForEvent('filechooser');await page.locator('#upload-avatar').click();await(await chooser).setFiles('src/assets/05-avatars/portrait-5.png');await expect(page.locator('#avatar-canvas')).toBeVisible();await page.locator('#avatar-zoom').fill('1.5');await shot('avatar-crop');await page.locator('#save-avatar').click();await expect(page.locator('#save-avatar')).toHaveCount(0)}
  15 |  await upload();const cardUpload=await request.post(root+'/media/uploads?purpose=post&filename=card.png',{headers:{...headers,'Content-Type':'image/png'},data:await readFile('src/assets/05-avatars/portrait-5.png')});expect(cardUpload.ok()).toBeTruthy();const cardMedia=await cardUpload.json();expect((await request.post(root+'/users/me/image-cards',{headers,data:{mediaId:cardMedia.id,type:'portrait'}})).ok()).toBeTruthy();await page.locator('#page-back').click();await page.locator('#open-profile').click();await expect(page.locator('.image-card img')).toBeVisible();await expect.poll(()=>page.locator('.image-card img').evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);await shot('profile-content');await page.locator('#edit-avatar').click();await expect(page.locator('.avatar-empty')).toHaveCount(7);await shot('avatar-gallery');await page.locator('[data-remove-avatar="0"]').click();await shot('avatar-remove');await page.locator('#confirm-remove-avatar').click();await expect(page.locator('.avatar-empty')).toHaveCount(8);await shot('avatar-removed');await page.locator('#removed-avatars').click();await shot('avatar-restore');await page.locator('[data-restore-avatar="0"]').click();await expect(page.locator('.avatar-empty')).toHaveCount(7);await page.getByRole('button',{name:'Close',exact:true}).click()
> 16 |  await page.reload();await login('Reader revised');await expect(page.locator('#edit-profile')).toContainText('Reader revised');await expect(page.locator('.profile-hero')).toContainText('Libra');await expect(page.locator('#edit-avatar img')).toHaveJSProperty('naturalWidth',320)
     |                                                                                                                                                                                                                                                  ^ Error: expect(locator).toHaveJSProperty(expected) failed
  17 |  await page.locator('#edit-avatar').click();for(let i=1;i<8;i++)await upload().then(()=>page.locator('#edit-avatar').click());await expect(page.locator('#upload-avatar')).toBeDisabled();await shot('avatar-full');await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('#likes').click();await shot('profile-likes');await page.getByRole('button',{name:'Got it'}).click()
  18 |  const b=await(await request.post(root+'/__c5/seed',{data:{mode:'empty'}})).json()
  19 |  const peerHeaders={Authorization:`Bearer ${b.token}`}
  20 |  const uploaded=await request.post(root+'/media/uploads?purpose=avatar&filename=peer.png',{headers:{...peerHeaders,'Content-Type':'image/png'},data:await readFile('src/assets/05-avatars/portrait-5.png')});expect(uploaded.ok()).toBeTruthy();const peerMedia=await uploaded.json();expect((await request.post(root+'/profiles/me/avatars',{headers:peerHeaders,data:{action:'add',mediaId:peerMedia.id}})).ok()).toBeTruthy()
  21 |  expect((await request.post(root+'/__d4/likes',{data:{owner:a.id,peer:b.id}})).ok()).toBeTruthy()
  22 |  await request.patch(root+'/profiles/me',{headers:{Authorization:`Bearer ${b.token}`},data:{displayName:'Real peer',age:25,city:'Busan',zodiac:'Leo'}})
  23 |  const opening=await request.post(root+`/conversations/${b.id}/opening`,{headers,data:{content:'A real D4 letter'}});expect(opening.status()).toBe(201);const v=await opening.json()
  24 |  await page.locator('#page-back').click();await page.locator('#open-inbox').click();await page.locator(`[data-chat="${v.id}"]`).click();await page.locator('#chat-details').click();await page.locator('#view-public-profile').click();await expect(page.locator('.profile-hero h2')).toHaveText('Real peer');await expect(page.locator('#public-follow')).toBeDisabled();await expect(page.locator('.profile-hero')).toContainText('Leo');await shot('person-waiting');await shot('person-no-content');await page.locator('#public-avatar').click();await expect.poll(()=>page.locator('.d4-photo').evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);await shot('person-photo');await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('#public-more').click();await shot('person-safety');await page.getByRole('button',{name:'Close',exact:true}).click()
  25 |  const reply=await(await request.post(root+`/conversations/${v.id}/messages`,{headers:{Authorization:`Bearer ${b.token}`},data:{content:'Real reply'}})).json();await request.post(root+`/conversations/${v.id}/replies/${reply.id}/collect`,{headers:{...headers,'Idempotency-Key':'d4'},data:{}})
  26 |  await request.patch(root+`/conversations/${v.id}`,{headers,data:{following:true}});expect((await request.patch(root+`/conversations/${v.id}`,{headers:peerHeaders,data:{following:true}})).ok()).toBeTruthy();expect((await request.get(root+'/profiles/'+a.id,{headers:peerHeaders})).ok()).toBeTruthy()
  27 |  const peerCard=await(await request.post(root+'/media/uploads?purpose=post&filename=peer-card.png',{headers:{...peerHeaders,'Content-Type':'image/png'},data:await readFile('src/assets/05-avatars/portrait-5.png')})).json();expect((await request.post(root+'/users/me/image-cards',{headers:peerHeaders,data:{mediaId:peerCard.id,type:'portrait'}})).ok()).toBeTruthy();expect((await request.post(root+'/posts',{headers:peerHeaders,data:{content:'Real peer moment'}})).ok()).toBeTruthy();
  28 |  const before=(await(await request.get(root+'/profiles/me/stats',{headers})).json()).visits;
  29 |  await page.reload();await login('Reader revised');expect((await(await request.get(root+'/profiles/me/stats',{headers})).json()).visits).toEqual(before);await expect(page.locator('#following')).toContainText('1');await expect(page.locator('#likes')).toContainText('2');await expect(page.locator('#followers')).toContainText('1');await page.locator('#likes').click();await expect(page.locator('[data-likes="posts"] strong')).toHaveText('1');await expect(page.locator('[data-likes="cards"] strong')).toHaveText('1');await page.getByRole('button',{name:'Got it'}).click();await page.locator('#followers').click();await expect(page.locator('.d4-row').first()).toContainText('Real peer');await page.locator('.d4-row').first().click();await expect(page.locator('.profile-hero h2')).toHaveText('Real peer');await page.locator('#page-back:visible').click();await page.locator('#page-back').click();await page.locator('#following').click();await expect(page.locator('.d4-row').first()).toContainText('Real peer');await shot('following-list');await page.locator('.d4-row').first().click();await expect(page.locator('#public-follow')).toBeEnabled();await expect(page.locator('#public-follow')).toContainText('Following');await expect(page.locator('.d4-cards img')).toHaveCount(1);await expect.poll(()=>page.locator('.d4-cards img').evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);await expect(page.locator('.d4-moment')).toContainText('Real peer moment');await shot('person-profile');await page.locator('.d4-cards button').click();await expect.poll(()=>page.locator('.d4-photo').evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBeGreaterThan(0);await page.getByRole('button',{name:'Close',exact:true}).click();await shot('person-followed');await page.locator('#page-back:visible').click();await page.locator('#page-back').click();await page.locator('#profile-visitors').click();await page.getByRole('button',{name:'I visited',exact:true}).click();await expect(page.locator('.d4-row')).toContainText('Real peer');await shot('visitors-outgoing');await page.locator('#page-back').click();await page.locator('#profile-letters').click();await expect(page.locator('.d4-moment')).toContainText('A real D4 letter');await shot('my-letters')
  30 | })
  31 | test('offline prototype comparison evidence',async({page})=>{
  32 |  test.setTimeout(120000)
  33 |  test.skip(!process.env.D4_PROTOTYPE_FILE,'Provide the offline MauGo.html path')
  34 |  await page.goto('file://'+process.env.D4_PROTOTYPE_FILE)
  35 |  for(const id of ['profile-empty','profile-content','profile-edit','avatar-gallery','profile-likes','person-profile']){
  36 |   await page.goto('file://'+process.env.D4_PROTOTYPE_FILE)
  37 |   const tile=page.locator(`[data-page-id="${id}"]`)
  38 |   await tile.locator('.expand').click();await expect(tile.locator('.tile-status')).toHaveText('可交互')
  39 |   await tile.locator('iframe').evaluate(el=>{document.body.append(el);el.setAttribute('style','position:fixed!important;inset:0 auto auto 0!important;transform:none!important;margin:0!important;width:375px!important;height:812px!important;z-index:2147483647!important;border:0!important;visibility:visible!important')})
  40 |   await expect(page.frameLocator('body > iframe').locator('.device')).toBeVisible()
  41 |   await page.screenshot({animations:'disabled',clip:{x:0,y:0,width:375,height:812},path:`test-results/d4-round2/prototype-${id}.png`})
  42 |  }
  43 | })
  44 | 
```