import {chromium} from '@playwright/test'
import {writeFile} from 'node:fs/promises'
const b=await chromium.launch(),p=await b.newPage({viewport:{width:375,height:812}}),rows=[]
await p.goto('http://127.0.0.1:5353/');for(const s of ['.auth-preview','#open-profile','#open-settings','#help-settings']){await p.locator(s).click();await p.waitForTimeout(500)}
for(const s of ['#settings-back','#help-centre','#community-guidelines','#safety-guide','#help-delete','#support-feedback','#help-privacy','.support-message button']){const e=p.locator(s).first();await e.hover();await p.mouse.down();await p.waitForTimeout(200);rows.push({selector:s,style:await e.evaluate(x=>({transform:getComputedStyle(x).transform,scale:getComputedStyle(x).scale}))});await p.mouse.move(370,120);await p.mouse.up()}
await p.locator('#help-centre').click();await p.waitForTimeout(500);await p.locator('summary').first().click();rows.push({faqOpen:await p.locator('details').first().getAttribute('open'),animation:await p.locator('details p').first().evaluate(e=>getComputedStyle(e).animationName)});
await writeFile(new URL('effects.json',import.meta.url),JSON.stringify(rows,null,2));await b.close()
