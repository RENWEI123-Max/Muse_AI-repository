import {chromium} from '@playwright/test'
import {mkdir,writeFile} from 'node:fs/promises'
import {homedir} from 'node:os'
const root=new URL('shell-reference/',import.meta.url).pathname;await mkdir(root,{recursive:true})
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1201,height:1100}})
const url=`file://${homedir()}/maugo-design/MauGo-手机壳交互版-离线.html`
const results=[]
async function start(){await page.goto(url);await page.waitForTimeout(800)}
async function shot(name){await page.waitForTimeout(700);await page.locator('#screen').screenshot({path:root+name+'.png'});results.push({name,status:'captured'})}
for(const [name,run] of [
 ['home',async()=>{}],['filters',async()=>page.locator('#settings').click()],['appearance',async()=>page.locator('#magic').click()],['letter',async()=>page.getByLabel('Open letter 1',{exact:true}).click({force:true})],['compose',async()=>page.locator('#compose').click()],['inbox',async()=>page.locator('#inbox').click()],['chat',async()=>{await page.locator('#inbox').click();await page.locator('.chat-row').first().click()}],['profile',async()=>page.locator('#profile').click()],['settings',async()=>{await page.locator('#profile').click();await page.locator('.profile-settings-gear').click()}],['welcome',async()=>page.evaluate(()=>window.MauGoAuth.open('welcome'))],['signin',async()=>page.evaluate(()=>window.MauGoAuth.open('signin'))]
]){try{await start();await run();await shot(name)}catch(e){results.push({name,status:'failed',error:String(e).slice(0,300)})}console.log(results.at(-1))}
await writeFile(root+'manifest.json',JSON.stringify(results,null,2));await browser.close()
