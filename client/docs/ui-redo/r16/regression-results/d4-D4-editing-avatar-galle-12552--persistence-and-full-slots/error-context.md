# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: d4.spec.ts >> D4 editing, avatar gallery, remove, restore, crop, persistence and full slots
- Location: tests/d4.spec.ts:9:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#edit-profile')
Expected substring: "Book wanderer"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" locator('#edit-profile') with timeout 5000ms
  - waiting for locator('#edit-profile')

```

```yaml
- main "MauGo":
  - button "Back"
  - heading "Edit profile" [level=1]
  - button "Settings"
  - alert: p.avatars is not iterable
  - text: Nickname
  - textbox "Nickname": Book wanderer
  - text: Age
  - spinbutton "Age" [invalid]: "26"
  - text: City
  - textbox "City"
  - text: Zodiac
  - combobox "Zodiac":
    - option "—" [disabled] [selected]
    - option "Aries"
    - option "Taurus"
    - option "Gemini"
    - option "Cancer"
    - option "Leo"
    - option "Virgo"
    - option "Libra"
    - option "Scorpio"
    - option "Sagittarius"
    - option "Capricorn"
    - option "Aquarius"
    - option "Pisces"
  - text: About me
  - textbox "About me"
  - button "Change avatar"
  - button "Save changes"
```

# Test source

```ts
  1  | import {test,expect} from '@playwright/test'
  2  | 
  3  | async function enter(page:any,status='open',blocked=false){
  4  |  await page.route('**/api/**',async(route:any)=>{const p=new URL(route.request().url()).pathname;let data:object={};if(p.endsWith('/auth/login'))data={token:'d4-test'};else if(p.endsWith('/filter-pass'))data={active:false,expiresAt:null,remainingDays:0,plans:[]};else if(p.endsWith('/discovery/filters'))data={cities:[]};else if(p.endsWith('/wallet'))data={diamonds:100,freeRemaining:10,paidCost:10};else if(p.endsWith('/conversations'))data={items:['tea','ocean'].map(id=>({id,displayName:id,status,peerId:'peer',following:true,unreadCount:0,updatedAt:new Date().toISOString()}))};else if(p.endsWith('/blocks'))data={items:blocked?[{userId:'peer'}]:[]};else if(p.includes('/messages'))data={items:[{id:'hello',content:'A little hello for you.',mine:false,createdAt:new Date().toISOString()},{id:'reply',content:'Lovely to meet you!',mine:true,kind:'opening',createdAt:new Date().toISOString()}]};else data={items:[],responses:[]};await route.fulfill({json:data})})
  5  |  await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('d4@test.local');await page.locator('#auth-password').fill('SamplePass2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click()
  6  | }
  7  | async function mine(page:any){await page.locator('#open-profile').click();await expect(page.locator('.d4-profile')).toBeVisible()}
  8  | async function person(page:any){await page.locator('#open-inbox').click();await page.locator('[data-chat="tea"]').click();await page.locator('#chat-details').click();await page.locator('#view-public-profile').click();await expect(page.locator('#public-avatar')).toBeVisible()}
  9  | test('D4 editing, avatar gallery, remove, restore, crop, persistence and full slots',async({page})=>{
> 10 |  await enter(page);await mine(page);await expect(page.locator('.d4-body')).toHaveCSS('animation-name',/d4-open/);await expect(page.getByText('No photos uploaded yet.')).toBeVisible();await page.locator('#edit-profile').click();await page.locator('#edit-age').fill('17');await page.locator('#save-profile').click();await expect(page.getByRole('alert')).toContainText('between 18 and 100');await page.locator('#edit-age').fill('26');await page.locator('#edit-name').fill('Book wanderer');await page.locator('#save-profile').click();await expect(page.locator('#edit-profile')).toContainText('Book wanderer');await page.locator('#edit-avatar').click();await expect(page.locator('.avatar-empty')).toHaveCount(4);await page.locator('[data-avatar-slot="1"]').click();await page.locator('#edit-avatar').click();await expect(page.locator('[data-avatar-slot="1"]')).toHaveAttribute('aria-pressed','true');await page.locator('[data-remove-avatar="1"]').click();await expect(page.getByText('Remove this photo?')).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('.avatar-empty')).toHaveCount(4);await page.locator('[data-remove-avatar="1"]').click();await page.locator('#confirm-remove-avatar').click();await expect(page.locator('.avatar-empty')).toHaveCount(5);await page.locator('#removed-avatars').click();await page.locator('[data-restore-avatar="0"]').click();await expect(page.locator('.avatar-empty')).toHaveCount(4)
     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               ^ Error: expect(locator).toContainText(expected) failed
  11 |  const chooser=page.waitForEvent('filechooser');await page.locator('#upload-avatar').click();await (await chooser).setFiles('src/assets/05-avatars/portrait-5.png');await expect(page.locator('#avatar-canvas')).toBeVisible();const before=await page.locator('#avatar-canvas').evaluate((e:HTMLCanvasElement)=>e.toDataURL());await page.locator('#avatar-zoom').fill('2');await page.locator('#avatar-zoom').dispatchEvent('input');expect(await page.locator('#avatar-canvas').evaluate((e:HTMLCanvasElement)=>e.toDataURL())).not.toEqual(before);await page.locator('#save-avatar').click();await page.locator('#edit-avatar').click();await expect(page.locator('.avatar-empty')).toHaveCount(3);await page.getByRole('button',{name:'Close',exact:true}).click();await enter(page);await mine(page);await expect(page.locator('#edit-profile')).toContainText('Book wanderer');await page.locator('#edit-avatar').click();await expect(page.locator('.avatar-empty')).toHaveCount(3);await page.screenshot({path:'test-results/d4-gallery.png'})
  12 |  await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('#likes').click();await expect(page.getByRole('dialog')).toContainText('Image cards');await page.getByRole('button',{name:'Got it'}).click();await page.locator('#following').click();await expect(page.locator('[data-connection="tea"]')).toBeVisible();await page.locator('#page-back').click();await page.locator('#followers').click();await expect(page.getByText('No followers yet.')).toBeVisible();await page.locator('#page-back').click();await page.locator('#profile-visitors').click();await expect(page.getByText('No visitors yet.')).toBeVisible();await page.locator('#page-back').click();await page.locator('#profile-letters').click();await expect(page.locator('.d4-moment').first()).toContainText('Lovely to meet you!')
  13 |  await page.evaluate(()=>{const k='maugo-profile-d4-test',p=JSON.parse(localStorage.getItem(k)!);p.slots=p.slots.map((s:any,i:number)=>s||{...p.slots[0],id:'full-'+i});localStorage.setItem(k,JSON.stringify(p))});await page.locator('#page-back').click();await page.locator('#page-back').click();await mine(page);await page.locator('#edit-avatar').click();await expect(page.locator('.avatar-empty')).toHaveCount(0);await expect(page.locator('#upload-avatar')).toBeDisabled()
  14 | })
  15 | for(const status of ['open','waiting'])test(`D4 public profile and chat gate ${status}`,async({page})=>{
  16 |  await enter(page,status);await person(page);await page.locator('#public-avatar').click();await expect(page.locator('.d4-photo')).toBeVisible();await page.getByRole('button',{name:'Close',exact:true}).click();if(status==='open'){await expect(page.locator('#public-follow')).toBeEnabled();const patch=page.waitForRequest(r=>r.method()==='PATCH'&&r.url().endsWith('/conversations/tea'));await page.locator('#public-follow').click();expect((await patch).postDataJSON()).toEqual({following:false});await expect(page.locator('#public-follow')).toHaveText('＋ Follow')}else await expect(page.locator('#public-follow')).toBeDisabled();await page.locator('#public-more').click();await expect(page.getByRole('dialog')).toContainText('Report');await page.getByRole('button',{name:'Close',exact:true}).click();await page.locator('#public-chat').click();if(status==='waiting'){await expect(page.locator('#chat-form')).toHaveCount(0);await expect(page.locator('.waiting-card')).toBeVisible()}else await expect(page.locator('#chat-form')).toBeVisible()
  17 | })
  18 | test('D4 profile cannot bypass block',async({page})=>{await enter(page,'open',true);await person(page);await expect(page.locator('#public-follow')).toBeDisabled();await page.locator('#public-chat').click();await expect(page.locator('#chat-form')).toHaveCount(0);await expect(page.locator('.waiting-card')).toContainText('Conversation blocked')})
  19 | test('D4 public full content, photo previews, own image cards and outgoing visits',async({page})=>{
  20 |  await enter(page);await page.route(/\/api\/conversations\?/,route=>route.fulfill({json:{items:[{id:'tea',displayName:'Tea friend',status:'open',following:true,peerId:'peer',age:25,city:'Seoul',cards:['/src/assets/05-avatars/portrait-3.png'],moments:[{id:'day',text:'A small moment worth keeping.',src:'/src/assets/05-avatars/portrait-4.png'}]}]}}));await person(page);await expect(page.locator('.profile-hero')).toContainText('25 · Seoul');await expect(page.locator('.d4-cards img')).toHaveCount(1);await expect(page.locator('.d4-moment')).toContainText('A small moment worth keeping.');await page.locator('.d4-cards button').click();await expect(page.locator('.d4-photo')).toBeVisible();await page.screenshot({path:'test-results/d4-person-photo.png'});await page.getByRole('button',{name:'Close',exact:true}).click();await enter(page);await mine(page);await page.locator('#profile-visitors').click();await page.getByRole('button',{name:'I visited',exact:true}).click();await expect(page.locator('.d4-row')).toContainText('Tea friend');await page.locator('#page-back').click();await page.locator('#edit-profile').click();await page.locator('#edit-name').fill('Image wanderer');await page.locator('#save-profile').click();await page.evaluate(()=>{const k='maugo-profile-d4-test',p=JSON.parse(localStorage.getItem(k)!);p.cards=['/src/assets/05-avatars/portrait-3.png'];localStorage.setItem(k,JSON.stringify(p))});await page.locator('#page-back').click();await mine(page);await expect(page.locator('.d4-cards img')).toHaveCount(1)
  21 | })
  22 | test('D4 following empty, my letters empty and no public moments',async({page})=>{
  23 |  await enter(page);await person(page);await expect(page.getByText('No moments yet.')).toBeVisible();await enter(page);await page.route(/\/api\/conversations\?/,route=>route.fulfill({json:{items:[]}}));await mine(page);await page.locator('#following').click();await expect(page.getByText('No following yet.')).toBeVisible();await page.locator('#page-back').click();await page.locator('#profile-letters').click();await expect(page.getByText('No letters yet.')).toBeVisible()
  24 | })
  25 | 
```