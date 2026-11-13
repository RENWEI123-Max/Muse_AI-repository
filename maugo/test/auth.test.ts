import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { digest } from '../src/auth.js';

test('B2 authentication routes with real PostgreSQL', async t => {
  const admin=new pg.Pool({connectionString:process.env.DATABASE_URL});
  const schema='auth_'+randomUUID().replaceAll('-','');
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
  let code='', mailFailure=false;
  const app=buildApp(pool,false,{sendMail:async (_email,value)=>{code=value;if(mailFailure) throw Error('offline');}});
  t.after(async()=>{await app.close();await pool.end();await admin.end();});
  for(const name of ['002_domain.sql','003_auth.sql','003_auth.sql']) await pool.query(await readFile(new URL('../server/migrations/'+name,import.meta.url),'utf8'));
  await pool.query(await readFile(new URL('../server/migrations/004_conversation_ledger.sql',import.meta.url),'utf8'));
  const post=(url:string,payload:object={},token?:string,remoteAddress='127.0.0.1')=>app.inject({method:'POST',url,payload,remoteAddress,headers:token?{authorization:`Bearer ${token}`}:{}});
  const credentials={email:'User@example.test',password:'StrongPassword1!',privacyVersion:'2026-11',termsVersion:'2026-10'};
  assert.equal((await post('/auth/signup')).statusCode,400);
  assert.equal((await post('/auth/signup',{...credentials,email:'wrong'})).statusCode,400);
  assert.equal((await post('/auth/signup',{...credentials,password:'abcdefgh'})).statusCode,400);
  assert.equal((await post('/auth/signup',{...credentials,confirmPassword:'OtherPassword1'})).statusCode,400);
  const signup=await post('/auth/signup',credentials);assert.equal(signup.statusCode,201,signup.body);
  assert.equal((await post('/auth/signup',credentials)).statusCode,409);
  assert.equal((await post('/auth/login')).statusCode,400);
  assert.equal((await post('/auth/login',{...credentials,password:'WrongPassword1'})).statusCode,401);
  const login=await post('/auth/login',{...credentials,privacyVersion:'new'});assert.equal(login.statusCode,200,login.body);
  const {token,id}=login.json();assert.notEqual(token,signup.json().token);
  const user=(await pool.query('SELECT * FROM users WHERE id=$1',[id])).rows[0];assert.equal(user.privacy_version,'new');assert.ok(user.consented_at);
  const stored=(await pool.query('SELECT token_hash FROM auth_sessions WHERE user_id=$1',[id])).rows;
  assert.ok(stored.some(r=>r.token_hash===digest(token)));assert.ok(stored.every(r=>r.token_hash!==token));
  const opening=()=>post(`/conversations/${randomUUID()}/opening`,{content:'hello'},token);
  assert.equal((await opening()).statusCode,404);
  assert.equal((await post('/auth/logout',{},token)).statusCode,200);
  assert.equal((await opening()).statusCode,401);
  assert.equal((await post('/auth/logout')).statusCode,401);
  assert.equal((await post('/auth/logout',{},token)).statusCode,200);
  const expiring=(await post('/auth/login',credentials)).json().token;
  await pool.query("UPDATE auth_sessions SET expires_at=NOW()-interval '1 second' WHERE token_hash=$1",[digest(expiring)]);
  assert.equal((await post(`/conversations/${randomUUID()}/opening`,{content:'hi'},expiring)).statusCode,401);
  assert.equal((await post('/auth/code/send',{})).statusCode,400);
  assert.equal((await post('/auth/code/send',{email:'bad'})).statusCode,400);
  const address='code@example.test';
  const sent=await post('/auth/code/send',{email:address});assert.equal(sent.statusCode,200,sent.body);assert.equal(sent.json().retryAfter,60);assert.match(code,/^\d{6}$/);assert.notEqual(code,'123456');assert.equal(sent.json().code,undefined);
  assert.equal((await pool.query('SELECT code_hash FROM auth_codes WHERE email=$1',[address])).rows[0].code_hash,digest(code));
  const retry=await post('/auth/code/send',{email:address});assert.equal(retry.statusCode,429);assert.ok(Number(retry.headers['retry-after'])>0);
  assert.equal((await post('/auth/code/verify',{email:address,code:code==='000000'?'999999':'000000'})).statusCode,401);
  assert.equal((await post('/auth/code/verify',{email:address,code})).statusCode,200);
  assert.equal((await post('/auth/code/verify',{email:address,code})).statusCode,401);
  await pool.query("UPDATE auth_codes SET used_at=NULL,expires_at=NOW()-interval '1 second' WHERE email=$1",[address]);
  assert.equal((await post('/auth/code/verify',{email:address,code})).statusCode,410);
  // Password recovery uses the existing mail sender, code store and limits.
  const reset=(payload:object)=>post('/auth/password/reset',payload,undefined,'192.0.10.1');
  const resetEmail=credentials.email.toLowerCase();
  const newPassword='ReplacementPassword2!';
  const recovery=await post('/auth/code/send',{email:credentials.email},undefined,'192.0.10.1');
  assert.equal(recovery.statusCode,200,recovery.body);
  const resetCode=code;
  assert.equal(recovery.json().code,undefined);
  const resetBody={email:credentials.email,code:resetCode,newPassword};
  for(const payload of [{},{email:resetEmail},{...resetBody,code:''},{...resetBody,email:'bad'},{...resetBody,newPassword:''},{...resetBody,newPassword:'Short1'},{...resetBody,newPassword:'onlyletters'},{...resetBody,newPassword:'x'.repeat(129)}]) {
    const r=await reset(payload);assert.equal(r.statusCode,400,r.body);assert.ok(r.json().message);
  }
  const wrong=await reset({...resetBody,code:resetCode==='000000'?'999999':'000000'});
  assert.equal(wrong.statusCode,401);assert.equal(wrong.json().message,'Invalid code');
  assert.equal((await pool.query('SELECT attempts FROM auth_codes WHERE email=$1',[resetEmail])).rows[0].attempts,1);
  await pool.query("UPDATE auth_codes SET expires_at=NOW()-interval '1 second' WHERE email=$1",[resetEmail]);
  const expiredReset=await reset(resetBody);assert.equal(expiredReset.statusCode,410);assert.equal(expiredReset.json().message,'Code expired');
  await pool.query("UPDATE auth_codes SET expires_at=NOW()+interval '10 minutes',attempts=5 WHERE email=$1",[resetEmail]);
  assert.equal((await reset(resetBody)).statusCode,429);
  await pool.query('UPDATE auth_codes SET attempts=0 WHERE email=$1',[resetEmail]);
  // Include both current sessions and the legacy bearer token in revocation checks.
  const legacyToken=randomUUID();
  await pool.query('UPDATE users SET token_hash=$2 WHERE id=$1',[id,digest(legacyToken)]);
  const active=(await post('/auth/login',credentials,undefined,'192.0.10.2')).json().token;
  assert.equal((await post(`/conversations/${randomUUID()}/opening`,{content:'hi'},active)).statusCode,404);
  const completed=await reset(resetBody);assert.equal(completed.statusCode,200,completed.body);assert.deepEqual(completed.json(),{reset:true});
  assert.equal((await pool.query('SELECT * FROM auth_sessions WHERE user_id=$1',[id])).rowCount,0);
  for(const oldToken of [active,signup.json().token,legacyToken]) {
    assert.equal((await post(`/conversations/${randomUUID()}/opening`,{content:'hi'},oldToken)).statusCode,401);
  }
  assert.equal((await reset(resetBody)).statusCode,401);
  assert.equal((await post('/auth/login',credentials,undefined,'192.0.10.2')).statusCode,401);
  const recoveredLogin=await post('/auth/login',{...credentials,password:newPassword},undefined,'192.0.10.2');
  assert.equal(recoveredLogin.statusCode,200,recoveredLogin.body);
  assert.equal((await post(`/conversations/${randomUUID()}/opening`,{content:'hi'},recoveredLogin.json().token)).statusCode,404);
  const resend=await post('/auth/code/send',{email:resetEmail},undefined,'192.0.10.3');
  assert.equal(resend.statusCode,429);assert.ok(resend.headers['retry-after']);
  mailFailure=true;
  const failed=await post('/auth/code/send',{email:'failure@example.test'});assert.equal(failed.statusCode,503);assert.equal(failed.json().code,undefined);mailFailure=false;
  // Independent IP and email limits survive app recreation and cannot be bypassed by rotating the other dimension.
  for(let i=0;i<11;i++) {
    const r=await post('/auth/login',{...credentials,email:`missing${i}@example.test`},undefined,'192.0.2.1');assert.equal(r.statusCode,i===10?429:401);
  }
  for(let i=0;i<11;i++) {
    const r=await post('/auth/login',{...credentials,email:'limited@example.test'},undefined,`192.0.3.${i}`);assert.equal(r.statusCode,i===10?429:401);
  }
  for(let i=0;i<6;i++) {
    const r=await post('/auth/code/send',{email:`send${i}@example.test`},undefined,'192.0.4.1');assert.equal(r.statusCode,i===5?429:200);
  }
  for(let i=0;i<6;i++) {
    await pool.query("UPDATE auth_codes SET sent_at=NOW()-interval '61 seconds' WHERE email='hour@example.test'");
    const r=await post('/auth/code/send',{email:'hour@example.test'},undefined,`192.0.5.${i}`);assert.equal(r.statusCode,i===5?429:200);
  }
  assert.equal((await post('/auth/apple',{cancelled:true})).statusCode,200);
  assert.equal((await post('/auth/apple',{})).statusCode,400);
  assert.equal((await post('/auth/apple',{identityToken:'invalid'})).statusCode,401);
  const original=process.env.APPLE_CLIENT_ID; delete process.env.APPLE_CLIENT_ID;
  try {assert.equal((await post('/auth/apple',{identityToken:'e30.e30.fake'})).statusCode,503);} finally {if(original!==undefined) process.env.APPLE_CLIENT_ID=original;}
  const unconfigured=buildApp(pool);t.after(()=>unconfigured.close());
  const saved=process.env.SMTP_HOST; delete process.env.SMTP_HOST;
  try {const r=await unconfigured.inject({method:'POST',url:'/auth/code/send',payload:{email:'smtp@example.test'},remoteAddress:'192.0.9.1'});assert.equal(r.statusCode,503);assert.equal(r.json().code,undefined);} finally {if(saved!==undefined)process.env.SMTP_HOST=saved;}
});
