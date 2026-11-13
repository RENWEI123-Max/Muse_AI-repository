import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir, readFile, mkdtemp, rm, mkdir, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { digest } from '../src/auth.js';
import { creditWallet } from '../src/wallet.js';

test('B9 export allowlists, two-stage deletion, tombstones, media retries and new identity',async t=>{
 const schema='privacy_'+randomUUID().replaceAll('-','');
 const admin=new pg.Pool({connectionString:process.env.DATABASE_URL});
 await admin.query(`CREATE SCHEMA ${schema}`);
 const db=new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
 const directory=await mkdtemp(join(tmpdir(),'maugo-privacy-'));
 const old=process.env.MEDIA_DIRECTORY;process.env.MEDIA_DIRECTORY=directory;
 const app=buildApp(db);
 t.after(async()=>{await app.close();await db.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();await rm(directory,{recursive:true,force:true});if(old===undefined)delete process.env.MEDIA_DIRECTORY;else process.env.MEDIA_DIRECTORY=old;});
 const dir=new URL('../server/migrations/',import.meta.url);
 for(const name of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort())await db.query(await readFile(new URL(name,dir),'utf8'));
 for(let n=0;n<2;n++)await db.query(await readFile(new URL('010_account_privacy.sql',dir),'utf8'));
 const password='PrivatePassword1!';
 const signup=async(email:string)=>{
  const r=await app.inject({method:'POST',url:'/auth/signup',payload:{email,password,privacyVersion:'1',termsVersion:'1'}});
  assert.equal(r.statusCode,201,r.body);return {...r.json(),email};
 };
 const a=await signup('a@privacy.test'),b=await signup('b@privacy.test'),other=await signup('other@privacy.test');
 const call=(method:any,url:string,u:any,payload?:any)=>app.inject({method,url,headers:u?{authorization:'Bearer '+u.token}:{},payload});
 const login=await app.inject({method:'POST',url:'/auth/login',payload:{email:a.email,password,privacyVersion:'1',termsVersion:'1'}});
 const device=login.json();assert.equal(login.statusCode,200);
 const legacy=randomUUID();await db.query('UPDATE users SET token_hash=$2,display_name=$3,city=$4 WHERE id=$1',[a.id,digest(legacy),'私人昵称','Seoul']);
 const opened=await call('POST',`/conversations/${b.id}/opening`,a,{content:'personal opening'});
 const cid=opened.json().id,openingId=opened.json().openingMessageId;
 const reply=await call('POST',`/conversations/${cid}/messages`,b,{content:'peer reply'});assert.equal(reply.statusCode,201);
 const collected=await app.inject({method:'POST',url:`/conversations/${cid}/replies/${reply.json().id}/collect`,headers:{authorization:`Bearer ${a.token}`,'idempotency-key':'privacy'},payload:{}});assert.equal(collected.statusCode,200,collected.body);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const uploads=[];
 for(const purpose of ['avatar','chat','post']) {
  const r=await app.inject({method:'POST',url:`/media/uploads?purpose=${purpose}&filename=image.png`+(purpose==='chat'?`&conversationId=${cid}`:''),headers:{authorization:'Bearer '+a.token,'content-type':'image/png'},payload:png});
  assert.equal(r.statusCode,201,r.body);uploads.push(r.json());
 }
 await call('POST',`/conversations/${cid}/media`,a,{mediaId:uploads[1].id});
 await db.query('INSERT INTO user_posts(id,user_id,content) VALUES($1,$2,$3)',[randomUUID(),a.id,'private post']);
 await creditWallet(db,a.id,100,'verified-payment');
 // Use domain records directly to verify cleanup of all FK-linked private data.
 const purchaseId=randomUUID(),collectionId=collected.json().id,batchId=randomUUID();
 await db.query("INSERT INTO filter_pass_purchases(id,user_id,idempotency_key,days,cost,starts_at,expires_at) VALUES($1,$2,'privacy',1,30,NOW(),NOW()+interval '1 day')",[purchaseId,a.id]);
 await db.query("INSERT INTO wallet_ledger(id,user_id,amount,filter_pass_purchase_id,balance_after) VALUES($1,$2,-30,$3,70)",[randomUUID(),a.id,purchaseId]);
 await db.query("INSERT INTO discovery_batches(id,user_id,filters) VALUES($1,$2,'{}')",[batchId,a.id]);
 await db.query('INSERT INTO discovery_seen(user_id,opening_message_id,batch_id,position) VALUES($1,$2,$3,0)',[a.id,openingId,batchId]);
 await db.query("INSERT INTO reports(id,reporter_id,reported_user_id,category,reason) VALUES($1,$2,$3,'other','private reason')",[randomUUID(),a.id,b.id]);
 await db.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2)',[a.id,other.id]);
 await db.query('INSERT INTO auth_codes(email,code_hash,sent_at,expires_at) VALUES($1,$2,NOW(),NOW()+interval \'10 minutes\')',[a.email,digest('888888')]);
 assert.equal((await call('GET','/users/me/export',null)).statusCode,401);
 const exported=await call('GET','/users/me/export',a);assert.equal(exported.statusCode,200,exported.body);
 assert.match(String(exported.headers['content-disposition']),/attachment.*\.json/);
 assert.equal(exported.headers['cache-control'],'no-store');
 const data=exported.json();assert.equal(data.profile.id,a.id);assert.equal(data.profile.display_name,'私人昵称');
 assert.equal(data.conversations.length,1);assert.equal(data.messages.length,3);assert.equal(data.posts[0].content,'private post');assert.equal(data.wallet[0].amount,100);assert.equal(data.media.length,3);assert.equal(data.filterPassPurchases.length,1);assert.equal(data.collections.length,1);
 const sensitive=(await db.query('SELECT password_hash,token_hash FROM users WHERE id=$1',[a.id])).rows[0];
 for(const secret of [password,sensitive.password_hash,sensitive.token_hash,a.token,device.token,legacy,digest('888888'),other.email])assert.ok(!exported.body.includes(secret),secret);
 const keys=(value:any):string[]=>value&&typeof value==='object'?Object.entries(value).flatMap(([k,v])=>[k,...keys(v)]):[];
 assert.ok(keys(data).every(k=>!/password|hash|token/i.test(k)));
 assert.equal((await call('DELETE','/users/me',null,{confirm:true})).statusCode,401);
 for(const payload of [{},{confirm:false},{confirm:true,password}]) {
  const r=await call('DELETE','/users/me',a,payload);
  assert.equal(r.statusCode,payload.confirm===true?202:400,r.body);
 }
 const first=await call('DELETE','/users/me',a,{confirm:true});assert.equal(first.statusCode,202);
 const deletionToken=first.json().deletionToken;
 assert.equal((await call('DELETE','/users/me',device,{confirm:true,deletionToken,password})).statusCode,401);
 assert.equal((await call('DELETE','/users/me',a,{confirm:true,deletionToken})).statusCode,400);
 assert.equal((await call('DELETE','/users/me',a,{confirm:true,deletionToken,password:'wrong'})).statusCode,401);
 assert.equal((await db.query('SELECT count FROM auth_limits WHERE key=$1',['delete:'+a.id])).rows[0].count,1);
 assert.equal((await call('GET','/users/me/export',a)).statusCode,200);
 // Simulate an OS deletion failure: durable queue must survive until the next startup.
 const retryId=uploads[2].id;await rm(join(directory,retryId));await mkdir(join(directory,retryId));
 const deleted=await call('DELETE','/users/me',a,{confirm:true,deletionToken,password});assert.equal(deleted.statusCode,200,deleted.body);
 for(const token of [a.token,device.token,legacy])for(const url of ['/users/me/export','/wallet'])assert.equal((await call('GET',url,{token})).statusCode,401);
 assert.equal((await db.query('SELECT 1 FROM auth_sessions WHERE user_id=$1',[a.id])).rowCount,0);
 assert.equal((await db.query('SELECT reason FROM reports WHERE reporter_id=$1',[a.id])).rows[0].reason,'[已注销]');
 assert.equal((await db.query('SELECT 1 FROM user_blocks WHERE blocker_id=$1 OR blocked_id=$1',[a.id])).rowCount,0);
 assert.equal((await db.query('SELECT 1 FROM auth_codes WHERE email=$1',[a.email])).rowCount,0);
 for(const table of ['media_uploads','user_posts','wallet_ledger','discovery_batches','reply_collections','filter_pass_purchases']) {
  const owner=table==='media_uploads'?'uploader_id':'user_id';assert.equal((await db.query(`SELECT 1 FROM ${table} WHERE ${owner}=$1`,[a.id])).rowCount,0,table);
 }
 const tombstone=(await db.query('SELECT * FROM users WHERE id=$1',[a.id])).rows[0];assert.ok(tombstone.deleted_at);assert.equal(tombstone.display_name,'已注销');assert.equal(tombstone.password_hash,'');assert.equal(tombstone.city,null);
 assert.equal((await db.query('SELECT content FROM messages WHERE sender_id=$1',[a.id])).rows.every(r=>r.content==='[已注销]'),true);
 assert.equal((await call('POST',`/conversations/${cid}/messages`,b,{content:'hello'})).statusCode,410);
 assert.equal((await call('POST',`/conversations/${a.id}/opening`,b,{content:'hello'})).statusCode,410);
 const letter=await call('GET',`/letters/${openingId}`,b);assert.equal(letter.statusCode,200,letter.body);assert.equal(letter.json().sender.deleted,true);assert.equal(letter.json().state,'account-deleted');assert.equal(letter.json().canChat,false);
 const peerExport=await call('GET','/users/me/export',b);assert.equal(peerExport.json().conversations[0].peer_deleted,true);
 assert.equal((await call('GET',uploads[0].url,b)).statusCode,404);
 await assert.rejects(access(join(directory,uploads[0].id)));
 assert.equal((await db.query('SELECT * FROM media_deletion_queue')).rowCount,1);
 await rm(join(directory,retryId),{recursive:true});
 const restarted=buildApp(db);await restarted.ready();await restarted.close();
 assert.equal((await db.query('SELECT * FROM media_deletion_queue')).rowCount,0);
 const oldLogin=await app.inject({method:'POST',url:'/auth/login',payload:{email:a.email,password,privacyVersion:'1',termsVersion:'1'}});assert.equal(oldLogin.statusCode,401);
 await assert.rejects(creditWallet(db,a.id,10,'late-payment'),/User not found/);
 const fresh=await signup(a.email);assert.notEqual(fresh.id,a.id);assert.equal((await call('GET','/wallet',fresh)).json().diamonds,0);assert.equal((await call('GET','/users/me/export',fresh)).json().messages.length,0);
 // A fresh confirmation still cannot bypass password verification or the attempt limit.
 const challenge=(await call('DELETE','/users/me',fresh,{confirm:true})).json().deletionToken;
 await db.query("UPDATE account_deletion_challenges SET expires_at=NOW()-interval '1 second' WHERE user_id=$1",[fresh.id]);
 assert.equal((await call('DELETE','/users/me',fresh,{confirm:true,deletionToken:challenge,password})).statusCode,401);
 const next=(await call('DELETE','/users/me',fresh,{confirm:true})).json().deletionToken;
 for(let i=0;i<5;i++)assert.equal((await call('DELETE','/users/me',fresh,{confirm:true,deletionToken:next,password:'bad'})).statusCode,401);
 const renewed=(await call('DELETE','/users/me',fresh,{confirm:true})).json().deletionToken;
 assert.equal((await call('DELETE','/users/me',fresh,{confirm:true,deletionToken:renewed,password})).statusCode,429);
});
