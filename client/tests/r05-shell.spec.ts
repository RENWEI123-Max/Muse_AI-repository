import { test, expect } from '@playwright/test'

test('R05: real home, inbox and profile navigation share geometry and computed styles', async ({page, request}) => {
 const response=await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode:'empty'}})
 expect(response.ok()).toBeTruthy();const user=await response.json()
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click()
 await page.locator('#auth-email').fill(user.email);await page.locator('#auth-password').fill(user.password)
 await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click()
 await page.evaluate(()=>document.fonts.ready)
 await expect(page.locator('.device')).toHaveCSS('width','375px')
 await expect(page.locator('.device')).toHaveCSS('height','812px')
 expect(await page.locator('.client-statusbar').evaluate(el=>Math.abs(parseFloat(getComputedStyle(el).height)-57.828125))).toBeLessThanOrEqual(0.01)
 const indicator=await page.locator('.device').evaluate(el=>{const s=getComputedStyle(el,'::after');return {width:s.width,height:s.height,bottom:s.bottom,background:s.backgroundColor}})
 expect(indicator).toEqual({width:'144px',height:'5px',bottom:'8px',background:'rgb(255, 255, 255)'})
 const samples:any[]=[]
 for(let active=0;active<3;active++){
  if(active===1)await page.locator('#open-inbox').click()
  if(active===2)await page.locator('.inbox-flow .main-nav__item').nth(2).click()
  const nav=page.locator('.main-nav:visible').last();await expect(nav).toBeVisible()
  await expect(nav.locator('[aria-current=page]')).toHaveCount(1)
  await expect(nav.locator('.main-nav__item').nth(active)).toHaveAttribute('aria-current','page')
  await expect.poll(async()=>{const b=await nav.boundingBox();return b && Math.abs(b.x)<1 && Math.abs(b.y-716)<1 && Math.abs(b.width-375)<1 && Math.abs(b.height-96)<1}).toBeTruthy()
  const box=await nav.boundingBox();expect(box).not.toBeNull()
  for(const [k,v] of Object.entries({x:0,y:716,width:375,height:96}))expect(Math.abs(box![k as keyof typeof box]-v)).toBeLessThanOrEqual(1)
  const sample=await nav.evaluate(el=>{
   const props=['backgroundColor','backgroundImage','height','width','padding','borderRadius','borderTopWidth','fontFamily','fontSize','fontWeight','lineHeight','letterSpacing','color','gap','display','alignContent','justifyContent'] as const
   const styles=(n:Element)=>{const s=getComputedStyle(n);return Object.fromEntries(props.map(p=>[p,s[p]]))}
   return {nav:styles(el),items:[...el.children].map(n=>({style:styles(n),image:styles(n.querySelector('img')!)}))}
  })
  expect(sample.nav.backgroundColor).toBe('rgb(13, 24, 18)');expect(sample.nav.backgroundImage).toBe('none');expect(sample.nav.borderTopWidth).toBe('0px')
  for(let i=0;i<3;i++){
   const item=nav.locator('.main-nav__item').nth(i), b=await item.boundingBox(),img=await item.locator('img').boundingBox()
   for(const actual of [b,img])for(const [k,v] of Object.entries({x:[52.25,166.5,280.75][i],y:741.5,width:42,height:42}))expect(Math.abs(actual![k as keyof typeof actual]-v)).toBeLessThanOrEqual(1)
   expect(sample.items[i].style.fontSize).toBe('0px');expect(sample.items[i].style.color).toBe('rgb(132, 146, 136)')
  }
  samples.push(sample);if(active>0)expect(sample).toEqual(samples[0])
  await page.screenshot({path:`test-results/r05-nav-${active}.png`})
 }
 await test.info().attach('navigation-computed-styles',{body:JSON.stringify(samples,null,2),contentType:'application/json'})
})
for(const active of ['home','inbox','profile'])test.skip(`R05: ${active} unread badge (no existing rendering state; follow-up required)`,()=>{})
