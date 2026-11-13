import {test,expect,type Page} from '@playwright/test'
// F07: account switch must not expose the previous account's drafts/preferences/messages; signed-out tokens are rejected.
const api='http://127.0.0.1:3172'
async function login(page:Page,u:{email:string;password:string}){
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);const signed=page.waitForResponse(r=>r.url().endsWith('/auth/login')&&r.request().method()==='POST');await page.getByRole('button',{name:'Sign in',exact:true}).click();const session=await (await signed).json();await page.getByRole('button',{name:'Meet your letters'}).click();return session.token as string
}
async function openChat(page:Page){await page.locator('#open-inbox').click();await expect(page.locator('[data-chat]')).toHaveCount(1);await page.locator('[data-chat]').click();await expect(page.locator('#chat-input')).toBeVisible()}
async function toSettings(page:Page){await page.getByLabel('Back to messages').click();await page.getByRole('button',{name:'Home',exact:true}).click();await page.locator('#open-profile').click();await page.locator('#open-settings').click()}
async function signOut(page:Page){await page.locator('#security-settings').click();await page.locator('#logout').click();await page.locator('#confirm-logout').click();await expect(page.locator('.auth-content h1')).toBeVisible()}
const stored=(page:Page)=>page.evaluate(()=>JSON.stringify({...localStorage})+JSON.stringify({...sessionStorage}))
test('F07 account switch isolation and revoked token',async({page,request})=>{
 test.setTimeout(120000)
 const a=await (await request.post(api+'/__c5/seed',{data:{mode:'read'}})).json()
 // The seeded peer shares A's unlocked conversation, so both accounts open the same conversation id.
 const b={email:a.email.replace('Reader','Tea-wanderer-0'),password:a.password},conversation=a.conversations[0]
 const tokenA=await login(page,a);await openChat(page);await page.locator('#chat-input').fill('A private draft for F07')
 await toSettings(page);await page.locator('#general-settings').click();await page.locator('#systemFont').check();await expect(page.locator('html')).toHaveClass(/system-font/)
 expect(await stored(page)).toContain('A private draft for F07')
 await page.locator('#settings-back').click();await signOut(page)
 // Old token is revoked server side for reads and writes.
 const auth={Authorization:`Bearer ${tokenA}`}
 expect((await request.get(api+'/users/me/export',{headers:auth})).status()).toBe(401)
 expect((await request.get(api+'/conversations',{headers:auth})).status()).toBe(401)
 expect((await request.post(`${api}/conversations/${conversation}/messages`,{headers:auth,data:{content:'replayed'}})).status()).toBe(401)
 // B signs in on the same device: no A draft, preference or cached message text.
 const tokenB=await login(page,b);await expect(page.locator('html')).not.toHaveClass(/system-font/)
 expect(await stored(page)).not.toContain('A private draft for F07');expect(await stored(page)).not.toContain('systemFont')
 await openChat(page);await expect(page.locator('#chat-input')).toHaveValue('');await expect(page.locator('.c6-thread')).not.toContainText('A private draft for F07');await page.locator('#chat-input').fill('B private draft for F07')
 await toSettings(page);await page.locator('#general-settings').click();await expect(page.locator('#systemFont')).not.toBeChecked()
 // Switching without sign-out (reload drops the in-memory session) also keeps B's cache from A.
 await login(page,a);expect(await stored(page)).not.toContain('B private draft for F07');await openChat(page);await expect(page.locator('#chat-input')).toHaveValue('')
 expect((await request.get(api+'/users/me/export',{headers:{Authorization:`Bearer ${tokenB}`}})).status()).toBe(200)
})
test('F07 sign-out clears this device immediately (#103)',async({page,request})=>{
 test.setTimeout(120000)
 const a=await (await request.post(api+'/__c5/seed',{data:{mode:'read'}})).json()
 const b={email:a.email.replace('Reader','Tea-wanderer-0'),password:a.password},conversation=a.conversations[0]
 const tokenA=await login(page,a);await openChat(page);await page.locator('#chat-input').fill('A draft cleared on sign-out')
 await page.locator('#chat-details').click();await page.locator('#chat-background').click();await page.locator('[data-wallpaper="moon-road"]').click();await page.locator('#apply-wallpaper').click();await page.evaluate(()=>localStorage.setItem('maugo-language','en'))
 await toSettings(page);await page.locator('#general-settings').click();await page.locator('#systemFont').check();await expect(page.locator('html')).toHaveClass(/system-font/)
 expect(await stored(page)).toContain('A draft cleared on sign-out');expect(await stored(page)).toContain('maugo-chat-appearance')
 await page.locator('#settings-back').click();await signOut(page)
 // Nobody signs in yet: drafts, settings/filter preferences and chat appearance are already gone; language stays.
 await expect(page.locator('html')).not.toHaveClass(/system-font/)
 const after=await stored(page)
 for(const text of ['A draft cleared on sign-out','systemFont','maugo-settings','maugo-chat-appearance','chat-draft-','maugo-discovery-filters','maugo-account'])expect(after).not.toContain(text)
 expect(await page.evaluate(()=>localStorage.getItem('maugo-language'))).toBe('en')
 const auth={Authorization:`Bearer ${tokenA}`}
 expect((await request.get(api+'/profiles/me',{headers:auth})).status()).toBe(401)
 expect((await request.get(api+'/conversations',{headers:auth})).status()).toBe(401)
 expect((await request.post(`${api}/conversations/${conversation}/messages`,{headers:auth,data:{content:'replayed'}})).status()).toBe(401)
 // Same account signs back in: nothing is restored.
 await login(page,a);await expect(page.locator('html')).not.toHaveClass(/system-font/)
 await openChat(page);await expect(page.locator('#chat-input')).toHaveValue('')
 await toSettings(page);await page.locator('#general-settings').click();await expect(page.locator('#systemFont')).not.toBeChecked()
 await page.locator('#settings-back').click();await signOut(page)
 // B after A's sign-out sees none of A's data.
 await login(page,b);expect(await stored(page)).not.toContain('A draft cleared on sign-out');await openChat(page);await expect(page.locator('#chat-input')).toHaveValue('')
})
