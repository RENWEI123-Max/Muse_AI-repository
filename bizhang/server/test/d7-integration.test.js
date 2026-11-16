import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync,fork} from 'node:child_process';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import pg from 'pg';
import {alerts,evaluateAlerts} from '../src/alerts.js';
import {binding,TelegramWorker,TelegramPoller,RETRY_MS} from '../src/telegram.js';
import {tokenHash} from '../src/password.js';
import {buildApp} from '../src/app.js';

test('D7 disposable PostgreSQL acceptance',{timeout:120000},async t=>{
 const root=await mkdtemp(join(tmpdir(),'bizhang-d7-')),data=join(root,'pg');let pool,started=false,app;
 try{
  execFileSync('initdb',['-D',data,'-A','trust','-U','d7_test','--no-locale'],{stdio:'pipe'});
  execFileSync('pg_ctl',['-D',data,'-l',join(root,'postgres.log'),'-o',`-h '' -k ${root} -p 55479`,'-w','start'],{stdio:'pipe'});started=true;
  pool=new pg.Pool({host:root,port:55479,user:'d7_test',database:'postgres',max:10});await pool.query('CREATE ROLE bizhang_app');
  for(const f of ['001_initial.sql','002_market.sql','003_ledger.sql','004_alerts.sql'])await pool.query(await readFile(new URL('../migrations/'+f,import.meta.url),'utf8'));
  const uid=(await pool.query("INSERT INTO users(username,password_hash) VALUES('d7_temp','unused') RETURNING id")).rows[0].id;
  const other=(await pool.query("INSERT INTO users(username,password_hash) VALUES('d7_other','unused') RETURNING id")).rows[0].id;
  await pool.query("INSERT INTO price_cache(asset,usd_price,raw_source,raw_source_ts,ref_ts,last_pass_at,status) VALUES('BTC','100','binance',now(),now(),now(),'ok'),('USDT','1','kraken',now(),NULL,now(),'ok')");
  await pool.query("INSERT INTO reference_rates(pair,rate,source,fetched_at) VALUES('USD/SGD','1.3','coinbase',now())");
  const req=(method,url,body,headers={},id,who=uid)=>({method,url,body,headers,params:{id},query:{},bzUser:{id:who}});
  const create=(b={},key=randomUUID())=>alerts(pool,req('POST','/alerts',{asset:'BTC',direction:'above',threshold_usd:'100',...b},{'idempotency-key':key}));
  const patch=(r,b,who=uid)=>alerts(pool,req('PATCH','/alerts/'+r.id,b,{'if-match':r.version},r.id,who));
  const count=async table=>Number((await pool.query(`SELECT count(*) FROM ${table}`)).rows[0].count);
  let first;
  await t.test('crossed creation concurrent idempotency, restart dedupe and manual disable',async()=>{
   const key=randomUUID(),rs=await Promise.all([create({},key),create({},key)]);assert.deepEqual(JSON.parse(JSON.stringify(rs[0])),rs[1]);first=rs[0].alert;
   assert.equal(rs[0].triggered_immediately,true);assert.equal(first.state,'disabled');assert.equal(await count('alert_events'),1);assert.equal(await count('telegram_outbox'),1);
   assert.equal((await pool.query('SELECT trigger_kind FROM alert_events')).rows[0].trigger_kind,'on_create');
   assert.equal((await pool.query('SELECT last_error FROM telegram_outbox')).rows[0].last_error,'TELEGRAM_NOT_BOUND');
   await evaluateAlerts(pool);assert.equal(await count('alert_events'),1);
   first=(await patch(first,{enabled:true})).alert;assert.equal(first.generation,'2');assert.equal(await count('alert_events'),1);
   await Promise.all([evaluateAlerts(pool),evaluateAlerts(pool)]);assert.equal(await count('alert_events'),2);assert.equal(await count('telegram_outbox'),2);
   assert.equal((await pool.query('SELECT trigger_kind FROM alert_events ORDER BY id DESC LIMIT 1')).rows[0].trigger_kind,'on_restart');
   first=(await alerts(pool,req('GET','/alerts'))).alerts[0];first=(await patch(first,{enabled:false})).alert;assert.equal(first.disabled_reason,'manual');await evaluateAlerts(pool);assert.equal(await count('alert_events'),2);
  });
  await t.test('all paused statuses suppress; recover by current price only; edit restarts',async()=>{
   for(const state of ['divergence','unverified','stale']){
    await pool.query("UPDATE price_cache SET paused_since=$1,last_pass_at=$2,raw_source_ts=$3 WHERE asset='BTC'",[state==='divergence'?new Date():null,new Date(Date.now()-(state==='unverified'?1801000:0)),new Date(Date.now()-(state==='stale'?121000:0))]);
    const n=await count('alert_events'),r=(await create()).alert;assert.equal(r.state,'active');assert.equal((await alerts(pool,req('GET','/alerts'))).alerts.find(a=>a.id===r.id).alerts_paused,true);
    await evaluateAlerts(pool);assert.equal(await count('alert_events'),n);
    await pool.query("UPDATE price_cache SET paused_since=NULL,last_pass_at=now(),raw_source_ts=now(),usd_price='99' WHERE asset='BTC'");await evaluateAlerts(pool);assert.equal(await count('alert_events'),n);
    await pool.query("UPDATE price_cache SET usd_price='100' WHERE asset='BTC'");await evaluateAlerts(pool);assert.equal(await count('alert_events'),n+1);
   }
   let r=(await create({threshold_usd:'101'})).alert;r=(await patch(r,{threshold_usd:'100'})).alert;assert.equal(r.generation,'2');await evaluateAlerts(pool);
   assert.equal((await pool.query('SELECT trigger_kind FROM alert_events WHERE rule_id=$1',[r.id])).rows[0].trigger_kind,'on_restart');
  });
  await t.test('CRUD isolation, validation, If-Match, soft delete and immutable idempotent response',async()=>{
   await assert.rejects(create({},''),{code:'INVALID_IDEMPOTENCY_KEY'});await assert.rejects(create({threshold_usd:100}),{status:422});
   await assert.rejects(patch(first,{enabled:true},other),{status:404});await assert.rejects(patch({...first,version:'0'},{enabled:true}),{status:412});
   const key=randomUUID(),original=await create({threshold_usd:'1000'},key);await alerts(pool,req('DELETE','/alerts/'+original.alert.id,null,{},original.alert.id));assert.deepEqual(await create({},key),JSON.parse(JSON.stringify(original)));
   assert.equal((await alerts(pool,req('GET','/alerts'))).alerts.some(a=>a.id===original.alert.id),false);
   const history=await alerts(pool,{...req('GET','/alerts/events'),query:{limit:'1'}});assert.equal(history.events.length,1);assert.equal(history.events[0].delivery_status,'failed');
   assert.deepEqual((await alerts(pool,req('GET','/alerts/events',null,{},null,other))).events,[]);
  });
  await t.test('event/outbox/rule/idempotency writes roll back together on queue failure',async()=>{
   const before=await Promise.all(['alert_rules','alert_events','telegram_outbox','alert_requests'].map(count));
   await pool.query("CREATE FUNCTION d7_queue_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected queue failure'; END $$; CREATE TRIGGER d7_queue_fail BEFORE INSERT ON telegram_outbox FOR EACH ROW EXECUTE FUNCTION d7_queue_fail()");
   try{await assert.rejects(create(),/injected queue failure/);}finally{await pool.query('DROP TRIGGER d7_queue_fail ON telegram_outbox; DROP FUNCTION d7_queue_fail()');}
   assert.deepEqual(await Promise.all(['alert_rules','alert_events','telegram_outbox','alert_requests'].map(count)),before);
  });
  await t.test('50-rule cap is serialized across concurrent creates and excludes soft deletes',async()=>{
   await pool.query("INSERT INTO alert_rules(user_id,asset,direction,threshold_usd,state) SELECT $1,'BTC','above','1000','active' FROM generate_series(1,49)",[other]);
   const add=()=>alerts(pool,req('POST','/alerts',{asset:'BTC',direction:'above',threshold_usd:'1000'},{'idempotency-key':randomUUID()},null,other));
   const rs=await Promise.allSettled([add(),add()]);assert.equal(rs.filter(r=>r.status==='fulfilled').length,1);assert.equal(rs.find(r=>r.status==='rejected').reason.code,'ALERT_LIMIT');
   const id=rs.find(r=>r.status==='fulfilled').value.alert.id;await alerts(pool,req('DELETE','/alerts/'+id,null,{},id,other));assert.equal((await add()).alert.state,'active');
  });
  let now=Date.now(),waits=[],sends=[];const chat='123456789';
  const successful=async(c,text)=>{sends.push({chat:c,text,at:now});return {message_id:sends.length};};
  const transport={sendMessage:successful};const worker=new TelegramWorker(pool,transport,{now:()=>now,sleep:async ms=>{waits.push(ms);now+=ms;}});
  const drive=async predicate=>{
   let ticks=0;const wait=worker.sleep;worker.stopped=false;
   worker.sleep=async ms=>{await wait(ms);if(predicate())worker.stop();if(++ticks>10000){worker.stop();throw Error('worker did not make progress');}};
   try{await worker.run();}finally{worker.sleep=wait;}
  };
  await t.test('binding token hash, single use, expiry, private start and unknown-chat silence',async()=>{
   let updates=[];const poller=new TelegramPoller(pool,{getUpdates:async()=>updates});
   const p=await binding(pool,req('POST','/telegram/bind-token'));assert.equal(p.bot_configured,false);assert.equal(p.bind_url,p.token);
   assert.ok((await pool.query('SELECT bind_token_hash FROM telegram_bindings WHERE user_id=$1',[uid])).rows[0].bind_token_hash.equals(tokenHash(p.token)));
   const u=(id,text,c=Number(chat),type='private')=>({update_id:id,message:{text,chat:{id:c,type}}});const n=await count('telegram_outbox');
   updates=[u(1,'hello'),u(2,'/start nope'),u(3,'/start '+p.token,Number(chat),'group')];await poller.pollOnce();assert.equal(await count('telegram_outbox'),n);
   updates=[u(4,'/start '+p.token)];await poller.pollOnce();assert.equal(await count('telegram_outbox'),n+1);
   assert.equal((await binding(pool,req('GET','/telegram/binding'))).chat_id_last4,'6789');
   updates=[u(5,'/start '+p.token),u(6,'anything',987654321)];await poller.pollOnce();assert.equal(await count('telegram_outbox'),n+1);
   const p2=await binding(pool,req('POST','/telegram/bind-token'));await pool.query("UPDATE telegram_bindings SET bind_token_expires_at=now()-interval '1 second' WHERE user_id=$1",[uid]);updates=[u(7,'/start '+p2.token)];await poller.pollOnce();assert.equal(await count('telegram_outbox'),n+1);
   now=Date.now()+100;await worker.runOnce();assert.equal(sends.at(-1).text,'绑定成功');
  });
  const enqueue=async()=>(await pool.query("INSERT INTO telegram_outbox(user_id,chat_id,kind,ref_id,dedupe_key,text,status,next_attempt_at) VALUES($1,$2,'alert',1,$3,'test only','pending',$4) RETURNING *",[uid,chat,randomUUID(),new Date(now)])).rows[0];
  const row=async id=>(await pool.query('SELECT * FROM telegram_outbox WHERE id=$1',[id])).rows[0];
  await t.test('persistent per-chat limit and five-attempt 2/8/30/120/600 schedule',async()=>{
   assert.deepEqual(RETRY_MS,[2000,8000,30000,120000,600000]);const total=sends.length;await enqueue();await enqueue();await drive(()=>sends.length===total+2);assert.ok(sends.at(-1).at-sends.at(-2).at>=1000);
   now+=1000;const r=await enqueue();transport.sendMessage=async()=>{throw Error('untrusted upstream text');};
   for(let i=1;i<=5;i++){await worker.runOnce();const a=await row(r.id);assert.equal(a.attempts,i);assert.equal(a.status,i===5?'failed':'pending');assert.equal(a.last_error,'TELEGRAM_SEND_FAILED');if(i<5){assert.equal(+a.next_attempt_at-now,RETRY_MS[i]);now=+a.next_attempt_at;}}
   transport.sendMessage=successful;
  });
  await t.test('429 retry_after enforced with fake transport wait recording',async()=>{
   now+=1000;const r=await enqueue();transport.sendMessage=async()=>{throw {status:429,retry_after:17};};await worker.runOnce();assert.equal(+(await row(r.id)).next_attempt_at-now,17000);
   const next=await enqueue(),before=now,total=sends.length;transport.sendMessage=successful;
   await worker.runOnce();assert.equal(sends.length,total);assert.equal(+(await row(next.id)).next_attempt_at,before+17000);
   const waitsBefore=waits.length;await drive(()=>sends.length===total+2);
   assert.ok(waits.slice(waitsBefore).reduce((a,b)=>a+b,0)>=17000);assert.ok(sends.slice(total).every(s=>s.at>=before+17000));
   assert.equal((await row(next.id)).status,'sent');assert.equal((await row(r.id)).status,'sent');
  });
  await t.test('long cooldown on chat A does not block chat B',async()=>{
   now+=1000;const a=await enqueue();transport.sendMessage=async()=>{throw {status:429,retry_after:600};};await worker.runOnce();
   await enqueue();const secondChat='222222222';await pool.query("INSERT INTO telegram_bindings(user_id,status,chat_id) VALUES($1,'bound',$2)",[other,secondChat]);
   const b=(await pool.query("INSERT INTO telegram_outbox(user_id,chat_id,kind,ref_id,dedupe_key,text,status,next_attempt_at) VALUES($1,$2,'alert',1,$3,'second chat','pending',$4) RETURNING id",[other,secondChat,randomUUID(),new Date(now)])).rows[0];
   transport.sendMessage=successful;const before=now;await worker.runOnce();await worker.runOnce();assert.equal(now,before);assert.equal((await row(b.id)).status,'sent');assert.equal((await row(a.id)).status,'pending');
   await pool.query("UPDATE telegram_outbox SET status='failed' WHERE chat_id=$1 AND status='pending'",[chat]);
   await pool.query('UPDATE telegram_chat_slots SET next_send_at=$2 WHERE chat_id=$1',[chat,new Date(now)]);
  });
  await t.test('active sending lease is not reclaimed by another worker',async()=>{
   await pool.query("CREATE FUNCTION d7_old_lease() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.status='sending' THEN NEW.sending_at=now()-interval '61 seconds'; END IF; RETURN NEW; END $$; CREATE TRIGGER d7_old_lease BEFORE UPDATE ON telegram_outbox FOR EACH ROW EXECUTE FUNCTION d7_old_lease()");
   now+=1000;const r=await enqueue();let releaseSend,entered;
   const sending=new Promise(resolve=>{entered=resolve;});
   transport.sendMessage=async()=>{entered();await new Promise(resolve=>{releaseSend=resolve;});return {message_id:1};};
   const delivery=worker.runOnce();await sending;
   // A trigger backdates the committed lease, making recovery eligible during a live send.
   const recovering=new TelegramWorker(pool,transport);
   try {await Promise.race([recovering.recover(),new Promise((_,reject)=>setTimeout(()=>reject(Error('recovery blocked')),2000))]);}
   finally {releaseSend();await delivery;transport.sendMessage=successful;await pool.query('DROP TRIGGER d7_old_lease ON telegram_outbox; DROP FUNCTION d7_old_lease()');}
   assert.equal((await row(r.id)).status,'sent');
  });
  await t.test('SIGKILL in fake send: recover lease after 60s, resend without another event',async()=>{
   const created=await create(),n=await count('alert_events');const event=(await pool.query('SELECT id FROM alert_events WHERE rule_id=$1',[created.alert.id])).rows[0];const out=(await pool.query('SELECT * FROM telegram_outbox WHERE dedupe_key=$1',['alert:'+event.id])).rows[0];
   await pool.query('UPDATE telegram_outbox SET next_attempt_at=now() WHERE id=$1',[out.id]);
   await pool.query('UPDATE telegram_chat_slots SET next_send_at=now()');
   const child=fork(new URL('../test-support/d7-crash-worker.mjs',import.meta.url),[root,'55479'],{stdio:['ignore','ignore','pipe','ipc'],env:{PATH:process.env.PATH}});
   try{const [msg]=await once(child,'message',{signal:AbortSignal.timeout(10000)});assert.equal(msg,'sending');child.kill('SIGKILL');await once(child,'exit');}finally{if(child.exitCode===null)child.kill('SIGKILL');}
   assert.equal((await row(out.id)).status,'sending');await worker.recover();assert.equal((await row(out.id)).status,'sending');await pool.query("UPDATE telegram_outbox SET sending_at=now()-interval '61 seconds' WHERE id=$1",[out.id]);now+=1000;await worker.runOnce();assert.equal((await row(out.id)).status,'sent');await evaluateAlerts(pool);assert.equal(await count('alert_events'),n);
  });
  await t.test('unbind cancels queue; chat alone cannot log in; route errors follow D5',async()=>{
   const r=await enqueue();await binding(pool,req('DELETE','/telegram/binding'));await worker.runOnce();assert.equal((await row(r.id)).status,'failed');assert.equal((await binding(pool,req('GET','/telegram/binding'))).bound,false);
   app=await buildApp(pool);assert.equal((await app.inject({method:'GET',url:'/api/v1/telegram/binding',headers:{authorization:'Bearer '+chat}})).statusCode,401);
   const session='a'.repeat(64);await pool.query("INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '1 day')",[uid,tokenHash(session)]);
   const bad=await app.inject({method:'POST',url:'/api/v1/alerts',headers:{authorization:'Bearer '+session},payload:{}});assert.equal(bad.statusCode,422);assert.deepEqual(Object.keys(bad.json().error).sort(),['code','detail','message']);assert.equal((await app.inject({method:'GET',url:'/api/v1/alerts',headers:{authorization:'Bearer '+session}})).statusCode,200);
  });
  await t.test('004 runtime role grants',async()=>{
   const c=await pool.connect();try{await c.query('SET ROLE bizhang_app');for(const table of ['alert_rules','alert_events','telegram_outbox','telegram_bindings','alert_requests','telegram_chat_slots','telegram_poll_state'])await c.query(`SELECT * FROM ${table} LIMIT 1`);await c.query("SELECT nextval('alert_events_id_seq')");}finally{await c.query('RESET ROLE');c.release();}
  });
 }finally{if(app)await app.close();if(pool)await pool.end();if(started)execFileSync('pg_ctl',['-D',data,'-m','immediate','-w','stop'],{stdio:'pipe'});await rm(root,{recursive:true,force:true});}
});
