import { test, expect } from '@playwright/test'
for(const flow of ['reply','pass'])test(`F01 simulated wallet: ${flow} cancellation and funded return`,async({page})=>{
 let diamonds=0,charges=0,pending=true
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace('/api','')
  let body:any={}
  if(path==='/auth/login')body={token:'test-only'}
  else if(path==='/auth/me')body={id:'u',email:'test@example.com',emailVerified:true}
  else if(path==='/wallet')body={diamonds,freeRemaining:0,paidCost:10}
  else if(path==='/filter-pass')body={active:false,expiresAt:null,remainingDays:0,plans:[{days:7,diamonds:100}]}
  else if(path==='/payments/apple/products')body={products:[{id:'maugo.diamonds.100',diamonds:100,label:'A little boost'}]}
  else if(path==='/discovery/filters')body={cities:['Seoul']}
  else if(path==='/letters')body={items:[],responses:[]}
  else if(path==='/conversations')body={items:[{id:'c',displayName:'Test bird',status:'active',unreadCount:0}],hasMore:false}
  else if(path.endsWith('/replies/pending'))body={items:pending?[{id:'r'}]:[],hasMore:false}
  else if(path.endsWith('/collect')){charges++;diamonds-=10;pending=false;body={state:'collected',cost:10}}
  else if(path==='/filter-pass/purchase'){charges++;diamonds-=100;body={active:true,expiresAt:new Date(Date.now()+7*86400000).toISOString(),remainingDays:7}}
  await route.fulfill({json:body})
 })
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('test@example.com');await page.locator('#auth-password').fill('SamplePass2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click()
 if(flow==='reply'){await page.locator('#open-inbox').click();await page.locator('#collect-replies').click()}
 else{await page.getByRole('button',{name:'Filters',exact:true}).click();await page.getByRole('button',{name:'Filter Woman',exact:true}).click();await page.getByRole('button',{name:'Unlock Filter Pass',exact:true}).click();await page.locator('.pass-plan').click()}
 const confirm=page.locator(flow==='reply'?'#confirm-reply-payment':'#confirm-pass-payment'),topup=page.locator(flow==='reply'?'#reply-topup':'#pass-topup')
 await expect(confirm).toBeDisabled();await expect(topup).toBeVisible();await page.screenshot({path:`docs/c7-evidence/f01-${flow}-shortage.png`})
 await topup.click();await page.locator('#confirm-pack').click();await expect(page.getByRole('status')).toContainText('No charge');expect(charges).toBe(0)
 await page.keyboard.press('Escape');await expect(confirm).toBeDisabled();await expect(page.getByText(/selection saved/)).toBeVisible();expect(diamonds).toBe(0);expect(charges).toBe(0)
 await topup.click();diamonds=200
 await expect(page.getByRole('dialog',{name:'Diamonds',exact:true})).toHaveCount(0);await expect(confirm).toBeEnabled();expect(charges).toBe(0)
 await page.screenshot({path:`docs/c7-evidence/f01-${flow}-funded.png`})
 await confirm.dblclick();await expect(confirm).toHaveCount(0);expect(charges).toBe(1);expect(diamonds).toBe(flow==='reply'?190:100)
 if(flow==='pass')await expect(page.getByRole('button',{name:'Filter Woman',exact:true})).toHaveAttribute('aria-pressed','true')
})
