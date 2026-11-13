// Test fixtures only. All /conversations routes are provided by the real backend.
export async function registerInboxContract(app,db){
 async function call(method,url,token,payload,headers={}){const r=await app.inject({method,url,headers:{...(token?{authorization:'Bearer '+token}:{}),...headers},payload});if(r.statusCode>=400)throw Error(r.body);return r.json()}
 app.post('/__c5/seed',async req=>{
 // Independent browser actors share loopback in this dedicated test DB. Reset only
 // the shared test IP's window; retain email counters and production rate limits.
 await db.query("UPDATE auth_limits SET starts_at=NOW()-interval '2 hours' WHERE key='login:ip:127.0.0.1'")
 const password='SamplePass2026',stamp=Date.now()+'-'+Math.random();async function user(name){const email=name.replaceAll(' ','-')+'-'+stamp+'@test.local';const u=await call('POST','/auth/signup',null,{email,password,termsVersion:'1.0',privacyVersion:'1.0'});await db.query('UPDATE users SET display_name=$2,diamonds=100 WHERE id=$1',[u.id,name]);return {...u,email,password}}
 const u=await user('Reader'),mode=req.body?.mode||'pending',count=mode==='pagination'?25:mode==='pending'?3:mode==='empty'?0:1,conversations=[];
 for(let i=0;i<count;i++){const peer=await user('Tea wanderer '+i);const v=await call('POST',`/conversations/${peer.id}/opening`,u.token,{content:'A quiet hello, over tea.'});conversations.push(v.id);if(mode!=='waiting'&&mode!=='pagination'){const reply=await call('POST',`/conversations/${v.id}/messages`,peer.token,{content:'Thank you for the tea story.'});if(mode!=='pending')await call('POST',`/conversations/${v.id}/replies/${reply.id}/collect`,u.token,{}, {'idempotency-key':'seed-'+i})}
 if(['read','following','pinned','hidden'].includes(mode)){await db.query('INSERT INTO conversation_preferences(user_id,conversation_id,read_at,following,pinned,muted,hidden) VALUES($1,$2,clock_timestamp(),$3,$4,$4,$5)',[u.id,v.id,mode==='following',mode==='pinned',mode==='hidden'])}}
 return {...u,conversations}
 })
 app.post('/__c6/reply',async req=>{const v=(await db.query('SELECT peer_id FROM conversations WHERE id=$1',[req.body.id])).rows[0];await db.query("INSERT INTO messages(id,conversation_id,sender_id,kind,content) VALUES(gen_random_uuid(),$1,$2,'reply','Thank you for listening.')",[req.body.id,v.peer_id]);return {ok:true}})
 app.post('/__c5/balance',async req=>{await db.query('UPDATE users SET diamonds=$2 WHERE id=$1',[req.body.id,req.body.diamonds]);return {ok:true}})
 app.post('/__c5/exhaust',async req=>{const u=(await db.query('SELECT * FROM users WHERE id=$1',[req.body.id])).rows[0];if(!u)throw Error('Fixture not found');for(let i=0;i<10;i++){const peer=(await call('POST','/auth/signup',null,{email:`quota-${i}-${Date.now()}-${Math.random()}@test.local`,password:'SamplePass2026',termsVersion:'1.0',privacyVersion:'1.0'}));const v=await call('POST',`/conversations/${peer.id}/opening`,req.body.token,{content:'Quota fixture'});const m=await call('POST',`/conversations/${v.id}/messages`,peer.token,{content:'Quota reply'});await call('POST',`/conversations/${v.id}/replies/${m.id}/collect`,req.body.token,{}, {'idempotency-key':'quota-'+i})}return {ok:true}})
}
