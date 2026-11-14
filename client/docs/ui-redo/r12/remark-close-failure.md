# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: r12-chat-details.spec.ts >> R12 seven safe states and cancel path
- Location: tests/r12-chat-details.spec.ts:5:1

# Error details

```
Test timeout of 100000ms exceeded.
```

```
Error: locator.click: Test timeout of 100000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Cancel', exact: true })
    - locator resolved to <button data-v-acc76d6f="" aria-label="Cancel" class="ui-icon-button ui-icon-button--reply-close chat-dialog-close">×</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <h2 data-v-acc76d6f="" class="chat-dialog-title">Remark name</h2> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <h2 data-v-acc76d6f="" class="chat-dialog-title">Remark name</h2> intercepts pointer events
    - retrying click action
      - waiting 100ms
    155 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <h2 data-v-acc76d6f="" class="chat-dialog-title">Remark name</h2> intercepts pointer events
      - retrying click action
        - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed

```

# Page snapshot

```yaml
- main "MauGo" [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e7]:
      - generic [ref=e8]:
        - button "Back to messages" [ref=e9] [cursor=pointer]: ‹
        - heading "Chat details" [level=1] [ref=e10]
      - generic [ref=e11]:
        - generic [ref=e12]:
          - button "View profile ›" [ref=e13] [cursor=pointer]
          - heading "Quiet friend" [level=2] [ref=e14]
          - paragraph [ref=e15]: You can now chat freely.
          - button "Follow" [disabled] [ref=e16]
        - generic [ref=e17]:
          - button "Remark name 조용한 친구 ›" [ref=e18] [cursor=pointer]:
            - text: Remark name
            - generic [ref=e19]: 조용한 친구
            - generic [ref=e20]: ›
          - generic [ref=e21]:
            - text: Pin conversation
            - checkbox "Pin conversation" [disabled] [ref=e22]
          - button "Chat background ›" [ref=e23] [cursor=pointer]:
            - text: Chat background
            - generic [ref=e24]: ›
          - button "Chat bubbles ›" [ref=e25] [cursor=pointer]:
            - text: Chat bubbles
            - generic [ref=e26]: ›
          - button "Search chat history" [ref=e27] [cursor=pointer]:
            - text: Search messages
            - generic [ref=e28]: ›
        - generic [ref=e29]:
          - generic [ref=e30]:
            - text: Mute notifications
            - checkbox "Mute notifications" [disabled] [ref=e31]
          - button "Block ›" [ref=e32] [cursor=pointer]:
            - text: Block
            - generic [ref=e33]: ›
          - button "Report ›" [ref=e34] [cursor=pointer]:
            - text: Report
            - generic [ref=e35]: ›
          - button "Clear chat history" [ref=e36] [cursor=pointer]:
            - text: Clear messages
            - generic [ref=e37]: ›
      - dialog "Remark name" [ref=e39]:
        - button "Cancel" [ref=e41] [cursor=pointer]: ×
        - heading "Remark name" [level=2] [ref=e42]
        - generic [ref=e43]:
          - text: Only visible to you
          - textbox "Remark" [active] [ref=e44]:
            - /placeholder: Add a name you’ll remember
            - text: 조용한 친구
        - button "Save remark" [ref=e45] [cursor=pointer]: Save
    - status [ref=e46]: One reply collected.
    - navigation [ref=e47]:
      - button "Home" [ref=e48] [cursor=pointer]
      - button "Messages" [ref=e49] [cursor=pointer]
      - button "Profile" [ref=e50] [cursor=pointer]
```

# Test source

```ts
  1  | import {test,expect,type Page} from '@playwright/test'
  2  | import {mkdir,writeFile} from 'node:fs/promises'
  3  | test.use({channel:'chromium'})
  4  | async function box(page:Page,selector:string,target:number[]){const b=await page.locator(selector).boundingBox();expect(b).toBeTruthy();for(const [i,k] of ['x','y','width','height'].entries())expect(Math.abs(b![k as keyof typeof b]!-target[i]),selector+' '+k).toBeLessThanOrEqual(1)}
  5  | test('R12 seven safe states and cancel path',async({page,request})=>{
  6  |  test.setTimeout(100000);await mkdir('docs/ui-redo/r12',{recursive:true});const evidence:any[]=[]
  7  |  const capture=async(state:string)=>{await expect(page.locator('.c6-chat')).toHaveAttribute('data-state',state);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(450);await page.screenshot({path:`docs/ui-redo/r12/${state}.png`});evidence.push({state,elements:await page.locator('.ui-header,#view-public-profile,#remark-name,#message-search,.chat-settings-dialog,.chat-dialog-save,.chat-search-result').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect(),c=getComputedStyle(el);return {id:el.id,class:el.className,box:{x:b.x,y:b.y,width:b.width,height:b.height},style:{color:c.color,background:c.background,borderRadius:c.borderRadius,font:c.font,letterSpacing:c.letterSpacing,boxShadow:c.boxShadow}}}))});await writeFile('docs/ui-redo/r12/browser-measurements.json',JSON.stringify(evidence,null,2))}
  8  |  const u=await(await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode:'waiting'}})).json()
  9  |  await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click();await page.locator('#open-inbox').click();await page.locator('[data-chat]').click();await page.locator('#chat-details').click();await capture('chat-details-waiting');await box(page,'#view-public-profile',[131.5,136,112,112]);await box(page,'#remark-name',[40,437.5,295,56]);await page.getByLabel('Back to messages').click();await request.post('http://127.0.0.1:3001/__c6/reply',{data:{id:u.conversations[0]}});await page.getByRole('button',{name:'Collect your reply',exact:true}).click();await page.locator('#confirm-reply-payment').click();await page.locator('#chat-details').click();await capture('chat-details');await box(page,'#view-public-profile',[152.5,136,70,70]);await box(page,'#remark-name',[40,349,295,56]);await expect(page.locator('#remark-name')).toHaveCSS('font-size','13px');await expect(page.locator('#remark-name')).toHaveCSS('line-height','20px');await expect(page.locator('#remark-name')).toHaveCSS('color','rgb(228, 239, 217)')
  10 |  await page.locator('#remark-name').click();await capture('chat-remark');await box(page,'.chat-settings-dialog',[12,518,351,270]);await box(page,'.chat-remark-input',[33,631,309,48]);await box(page,'.chat-dialog-save',[33,719,309,48]);await expect(page.locator('.chat-settings-dialog')).toHaveCSS('border-radius','24px');await page.getByLabel('Remark',{exact:true}).fill('Quiet friend');await page.getByRole('button',{name:'Save remark',exact:true}).click();await expect(page.locator('.chat-settings-dialog')).toHaveCount(0)
> 11 |  await page.getByRole('button',{name:'Search chat history'}).click();await capture('chat-search-empty');await box(page,'#message-search',[24,136,327,48]);await expect(page.locator('#message-search')).toHaveCSS('background-color','rgb(27, 41, 32)');await expect(page.locator('#message-search')).toHaveCSS('border-radius','14px');await page.locator('#message-search').fill('listening');await capture('chat-search-result');await page.locator('#message-search').fill('unmatched-query');await expect(page.locator('.c6-results')).toContainText('No messages found.');await capture('chat-search-none');await box(page,'.chat-search-none-title',[32,380,311,22]);await page.getByLabel('Back to messages').click();await page.locator('#chat-details').click();await page.locator('#clear-chat').click();await capture('chat-clear-confirm');await box(page,'.chat-settings-dialog',[24,277,327,258]);await box(page,'.chat-dialog-save',[49,418,277,48]);await expect(page.locator('.c6-veil')).toHaveCSS('background-color','rgba(3, 8, 5, 0.79)');await expect(page.locator('.chat-dialog-save')).toHaveCSS('background-color','rgb(225, 163, 155)');await page.getByRole('button',{name:'Cancel',exact:true}).last().click();await expect(page.locator('.c6-chat')).toHaveAttribute('data-state','chat-details');await page.locator('#remark-name').click();await page.getByLabel('Remark',{exact:true}).fill('조용한 친구');await page.screenshot({path:'docs/ui-redo/r12/chat-remark-ko-content.png'});await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.setViewportSize({width:375,height:700});await page.locator('#clear-chat').click();await page.waitForTimeout(300);await page.screenshot({path:'docs/ui-redo/r12/chat-clear-small.png'})
     |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              ^ Error: locator.click: Test timeout of 100000ms exceeded.
  12 | })
  13 | 
  14 | test('R12 Korean settings, remark and small screen',async({page,request})=>{
  15 |  test.setTimeout(60000)
  16 |  const u=await(await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode:'read'}})).json()
  17 |  await page.goto('/?auth=consent');await page.evaluate(()=>localStorage.setItem('maugo-language','ko'));await page.reload();await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);await page.locator('#auth-form .auth-main').click();await page.locator('.flow-content > .primary').click();await page.locator('#open-inbox').click();await page.locator('[data-chat]').click();await page.locator('#chat-details').click();await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);await expect(page.locator('#remark-name')).toHaveCSS('font-family',/GowunDodum/);await page.screenshot({path:'docs/ui-redo/r12/chat-details-ko.png'});await page.locator('#remark-name').click();await page.waitForTimeout(300);await expect(page.locator('.chat-remark-input')).toHaveCSS('font-family',/GowunDodum/);await page.screenshot({path:'docs/ui-redo/r12/chat-remark-ko.png'});await page.setViewportSize({width:375,height:700});await page.waitForTimeout(300);await page.screenshot({path:'docs/ui-redo/r12/chat-remark-small.png'});const b=await page.locator('.chat-settings-dialog').boundingBox();expect(b!.y+b!.height).toBeLessThanOrEqual(700)
  18 | })
  19 | 
```