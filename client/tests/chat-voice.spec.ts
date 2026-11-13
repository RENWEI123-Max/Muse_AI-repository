import {test,expect} from '@playwright/test'
async function enter(page:any,request:any,mode='waiting'){const u=await(await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode}})).json();await page.goto('/?auth=consent');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('button',{name:'Meet your letters'}).click();await page.locator('#open-inbox').click();await expect(page.locator('[data-chat]')).toHaveCount(1);await page.locator('[data-chat]').click();return u}

test.use({channel:'chromium',launchOptions:{args:['--use-fake-device-for-media-stream']}})
test('F03 permission, empty, cancel, offline retry, real B8 audio playback and history',async({page,request,context})=>{
 test.setTimeout(90000)
 await enter(page,request,'read')
 const hold=page.locator('#chat-hold')
 const down=async()=>{const b=(await hold.boundingBox())!;await page.mouse.move(b.x+20,b.y+10);await page.mouse.down()}
 const cdp=await context.newCDPSession(page);await cdp.send('Browser.setPermission',{permission:{name:'microphone'},setting:'denied',origin:'http://127.0.0.1:5173'});await down();await expect(page.locator('.c6-voice-notice')).toContainText('permission denied');await page.mouse.up()
 await context.grantPermissions(['microphone'])
 await page.evaluate(()=>{const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);(window as any).__voiceStreams=[];navigator.mediaDevices.getUserMedia=async constraints=>{const stream=await get(constraints);(window as any).__voiceStreams.push(stream);return stream}})
 await down();await expect(page.locator('.c6-record')).toContainText('0:00');await page.mouse.up();await expect(page.locator('.c6-voice-notice')).toContainText('too short')
 let uploads=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/media/uploads'))uploads++})
 await down();await expect(page.locator('.c6-record')).toContainText('0:00');await page.waitForTimeout(1100);const b=(await hold.boundingBox())!;await page.mouse.move(b.x+20,b.y-220);await expect(page.locator('.c6-record')).toContainText('Release to cancel');await page.mouse.up();await expect(page.locator('.c6-voice-notice')).toContainText('cancelled');expect(uploads).toBe(0);await expect(page.locator('.c6-voice-preview')).toHaveCount(0);expect(await page.evaluate(()=>(window as any).__voiceStreams.every((s:MediaStream)=>s.getTracks().every(t=>t.readyState==='ended')))).toBe(true)
 await down();await expect(page.locator('.c6-record')).toContainText('0:00');await page.waitForTimeout(1700);await page.mouse.up();await expect(page.locator('.c6-voice-preview')).toContainText('0:01')
 await context.setOffline(true);await page.locator('#voice-send').click();await expect(page.locator('.c6-voice-notice')).toContainText('offline');expect(uploads).toBe(0);await context.setOffline(false)
 await page.route('**/api/media/uploads?*',r=>r.abort(),{times:1});await page.locator('#voice-send').click();await expect(page.locator('.c6-voice-notice')).toContainText('failed');await expect(page.locator('.c6-voice-preview')).toBeVisible()
 await page.locator('#voice-send').click();await expect(page.locator('.c6-voice-notice')).toContainText('Voice message sent');expect(uploads).toBe(2)
 const audio=page.getByLabel('Voice message');await expect(audio).toHaveCount(1);await audio.evaluate(async(a:HTMLAudioElement)=>{await a.play()});await expect.poll(()=>audio.evaluate((a:HTMLAudioElement)=>a.currentTime)).toBeGreaterThan(0)
 await page.getByLabel('Back to messages').click();await page.locator('[data-chat]').click();await expect(page.getByLabel('Voice message')).toHaveCount(1);await expect.poll(()=>page.getByLabel('Voice message').evaluate((a:HTMLAudioElement)=>a.duration)).toBeGreaterThan(1)
 await page.screenshot({path:'test-results/f03-voice.png'})
})

test('F03 silent microphone is rejected without upload',async({page,request,context})=>{
 await context.grantPermissions(['microphone']);await enter(page,request,'read')
 await page.evaluate(()=>{const get=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);navigator.mediaDevices.getUserMedia=async c=>{const stream=await get(c);stream.getAudioTracks().forEach(t=>t.enabled=false);return stream}})
 let uploads=0;page.on('request',r=>{if(r.method()==='POST'&&r.url().includes('/media/uploads'))uploads++})
 const b=(await page.locator('#chat-hold').boundingBox())!;await page.mouse.move(b.x+20,b.y+10);await page.mouse.down();await expect(page.locator('.c6-record')).toContainText('0:00');await page.waitForTimeout(1200);await page.mouse.up();await expect(page.locator('.c6-voice-notice')).toContainText('no sound detected');await expect(page.locator('.c6-voice-preview')).toHaveCount(0);expect(uploads).toBe(0)
})
test('F03 real 60 second limit stops capture and permits discard',async({page,request,context})=>{
 test.setTimeout(90000);await context.grantPermissions(['microphone']);await enter(page,request,'read')
 const b=(await page.locator('#chat-hold').boundingBox())!;await page.mouse.move(b.x+20,b.y+10);await page.mouse.down();await expect(page.locator('.c6-record')).toContainText('0:00')
 await expect(page.locator('.c6-voice-preview')).toBeVisible({timeout:65000});await page.mouse.up();await expect(page.locator('.c6-voice-notice')).toContainText('60 second limit')
 const duration=await page.getByLabel('Preview voice',{exact:true}).evaluate(async(a:HTMLAudioElement)=>{if(!a.duration)await new Promise(r=>a.addEventListener('loadedmetadata',r,{once:true}));return a.duration});expect(duration).toBeGreaterThan(59);expect(duration).toBeLessThanOrEqual(60)
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.locator('.c6-voice-preview')).toHaveCount(0);await expect(page.getByLabel('Voice message',{exact:true})).toHaveCount(0)
})
