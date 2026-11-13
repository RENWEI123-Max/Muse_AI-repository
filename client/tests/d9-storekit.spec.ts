// Client StoreKit chain with a fake native bridge and stubbed API; real sandbox purchase is out of scope here.
import {test,expect,type Page} from '@playwright/test'
const user='6F1C2A44-3B5D-4E61-9A7B-1C2D3E4F5A6B',products=[100,550,1200,2600].map((d,i)=>({id:`maugo.diamonds.${d}`,diamonds:d,usd:0,label:['A little boost','Most popular','More possibilities','Best value'][i]}))
type Mode={purchase:string;verify:number;unfinished?:{signedTransaction:string;transactionId:string;appAccountToken:string}[]}
async function setup(page:Page,mode?:Mode){
 const log:{calls:[string,any][];verify:any[];balance:number}={calls:[],verify:[],balance:0}
 if(mode){
  await page.exposeFunction('storeKit',(method:string,options:any)=>{log.calls.push([method,options]);return mode})
  await page.addInitScript(()=>{const w=window as any;w.Capacitor={PluginHeaders:[{name:'StoreKit',methods:['getProducts','purchase','unfinished','finish'].map(name=>({name,rtype:'promise'}))}],
   nativePromise:async(_:string,method:string,o:any)=>{const m=await w.storeKit(method,o)
    if(method==='getProducts')return{products:o.ids.map((id:string)=>({id,displayPrice:'₩'+id.split('.').pop()}))}
    if(method==='purchase'){if(m.purchase==='error')throw Error('Cannot connect to iTunes Store');return m.purchase==='purchased'?{state:'purchased',signedTransaction:'jws.'+o.productId,transactionId:'2000000123'}:{state:m.purchase}}
    if(method==='unfinished')return{transactions:m.unfinished||[]}}}})
 }
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname.replace(/^\/api/,''),json=(body:any,status=200)=>route.fulfill({status,json:body})
  if(path==='/auth/login')return json({id:user,token:'t'})
  if(path==='/wallet')return json({diamonds:log.balance,freeRemaining:10,paidCost:10})
  if(path==='/payments/apple/products')return json({products})
  if(path==='/payments/apple/verify'){log.verify.push({body:route.request().postDataJSON(),auth:route.request().headers().authorization,finishedBefore:log.calls.some(c=>c[0]==='finish')})
   if(mode!.verify!==200)return json({message:'Missing Apple configuration: APPLE_BUNDLE_ID'},mode!.verify)
   const credited=products.find(p=>'jws.'+p.id===route.request().postDataJSON().signedTransaction)?.diamonds??100;log.balance+=credited;return json({balance:log.balance,credited,transactionId:'2000000123'})}
  if(path==='/filter-pass')return json({active:false,plans:[]})
  if(path==='/discovery/filters')return json({cities:[]})
  return json({items:[],responses:[]})
 })
 await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill('a@test.local');await page.locator('#auth-password').fill('SamplePass2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click()
 await page.locator('#open-wallet').click()
 return log
}
const status=(page:Page)=>page.locator('.d1-topup [role=status]')
test('topup-confirm: catalog from server, localized StoreKit prices, no hard-coded USD',async({page})=>{
 const log=await setup(page,{purchase:'cancelled',verify:200})
 await expect(page.locator('.diamond-pack b')).toHaveText(['₩100','₩550','₩1200','₩2600'])
 await expect(page.locator('.d1-topup')).not.toContainText('$')
 expect(log.calls[0]).toEqual(['getProducts',{ids:products.map(p=>p.id)}])
})
test('topup-success: purchase with appAccountToken, server verify, finish after verify, balance read back',async({page})=>{
 const log=await setup(page,{purchase:'purchased',verify:200})
 await page.locator('.diamond-pack').nth(1).click();await expect(page.locator('#confirm-pack')).toHaveText('Get 550 diamonds · ₩550');await page.locator('#confirm-pack').click()
 await expect(status(page)).toHaveText('Added 550 diamonds. Your balance is 550 diamonds.');await expect(page.locator('.d1-topup p strong')).toHaveText('550 diamonds')
 expect(log.calls.find(c=>c[0]==='purchase')![1]).toEqual({productId:'maugo.diamonds.550',appAccountToken:user})
 expect(log.verify).toEqual([{body:{signedTransaction:'jws.maugo.diamonds.550'},auth:'Bearer t',finishedBefore:false}])
 expect(log.calls.find(c=>c[0]==='finish')![1]).toEqual({transactionId:'2000000123'})
})
test('cancel and store errors: no verify, no balance change',async({page})=>{
 const mode={purchase:'cancelled',verify:200},log=await setup(page,mode)
 await page.locator('#confirm-pack').click();await expect(status(page)).toHaveText('Purchase cancelled. No charge has been made.')
 mode.purchase='pending';await page.locator('#confirm-pack').click();await expect(status(page)).toContainText('pending approval')
 mode.purchase='error';await page.locator('#confirm-pack').click();await expect(status(page)).toHaveText('Purchase failed: Cannot connect to iTunes Store. No charge has been made.')
 expect(log.verify).toEqual([]);await expect(page.locator('.d1-topup p strong')).toHaveText('0 diamonds')
})
test('verify failure: transaction left unfinished, no diamonds shown',async({page})=>{
 const log=await setup(page,{purchase:'purchased',verify:503})
 await page.locator('#confirm-pack').click();await expect(status(page)).toContainText('Payment received but not yet confirmed: Missing Apple configuration');await expect(status(page)).toContainText('No diamonds were added yet')
 expect(log.calls.some(c=>c[0]==='finish')).toBe(false);await expect(page.locator('.d1-topup p strong')).toHaveText('0 diamonds')
})
test('unfinished transactions of this account are resubmitted on open',async({page})=>{
 const log=await setup(page,{purchase:'cancelled',verify:200,unfinished:[{signedTransaction:'jws.maugo.diamonds.100',transactionId:'1',appAccountToken:user.toLowerCase()},{signedTransaction:'jws.maugo.diamonds.2600',transactionId:'2',appAccountToken:'00000000-0000-0000-0000-000000000000'}]})
 await expect(status(page)).toHaveText('Added 100 diamonds. Your balance is 100 diamonds.')
 expect(log.verify.map(v=>v.body.signedTransaction)).toEqual(['jws.maugo.diamonds.100']);expect(log.calls.filter(c=>c[0]==='finish').map(c=>c[1])).toEqual([{transactionId:'1'}])
})
test('browser without StoreKit: no price, no charge',async({page})=>{
 const log=await setup(page)
 await expect(page.locator('.diamond-pack b')).toHaveText(Array(4).fill('Unavailable'))
 await page.locator('#confirm-pack').click();await expect(status(page)).toHaveText('In-app purchases are only available in the MauGo iOS app. No charge has been made.');expect(log.verify).toEqual([])
})
