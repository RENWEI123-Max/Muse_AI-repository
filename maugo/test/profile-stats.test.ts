import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { digest } from '../src/auth.js';

test('B15 live HTTP: empty stats, durable counts, visits and letter ownership', async t => {
 const schema='stats_'+randomUUID().replaceAll('-','');
 const admin=new pg.Pool({connectionString:process.env.DATABASE_URL});
 await admin.query(`CREATE SCHEMA ${schema}`);
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
 const app=buildApp(pool);
 // Keep the isolated schema for inspection; never touch existing application data.
 t.after(async()=>{await app.close();await pool.end();await admin.end();});
 const dir=new URL('../server/migrations/',import.meta.url);
 for(const name of (await readdir(dir)).filter(x=>x.endsWith('.sql')).sort()) await pool.query(await readFile(new URL(name,dir),'utf8'));
 for(let i=0;i<2;i++) await pool.query(await readFile(new URL('019_profile_stats.sql',dir),'utf8'));
 const user=async()=>{
  const id=randomUUID(),token=randomUUID();
  await pool.query('INSERT INTO users(id,email,password_hash,token_hash) VALUES($1,$2,$3,$4)',[id,id+'@test.local','unused',digest(token)]);
  return {id,token};
 };
 const a=await user(),b=await user(),c=await user(),empty=await user();
 const address=await app.listen({port:0,host:'127.0.0.1'});
 const get=async(path:string,u?:{token:string})=>fetch(address+path,{headers:u?{authorization:'Bearer '+u.token}:{}});
 const stats=async(u:{token:string},suffix='')=>{const r=await get('/profiles/me/stats'+suffix,u);assert.equal(r.status,200);return r.json() as Promise<any>;};
 assert.equal((await get('/profiles/me/stats')).status,401);
 assert.equal((await get('/profiles/me/stats',{token:'invalid'})).status,401);
 const zero={followingCount:0,followersCount:0,likesCount:0,postLikesCount:0,imageCardLikesCount:0,visits:[],letters:[]};
 assert.deepEqual(await stats(a),zero);
 const conversation=async(opener:string,peer:string)=>{
  const id=randomUUID();await pool.query('INSERT INTO conversations(id,opener_id,peer_id,unlocked_at,opening_message_id) VALUES($1,$2,$3,NOW(),gen_random_uuid())',[id,opener,peer]);return id;
 };
 const ab=await conversation(a.id,b.id),bc=await conversation(b.id,c.id);
 await pool.query('INSERT INTO conversation_preferences(user_id,conversation_id,following) VALUES($1,$2,true),($3,$2,true),($3,$4,false)',[a.id,ab,b.id,bc]);
 const letter=randomUUID(),foreign=randomUUID();
 await pool.query(`INSERT INTO messages(id,conversation_id,sender_id,kind,content) VALUES($1,$2,$3,'opening','My letter'),($4,$5,$6,'opening','Foreign letter'),($7,$2,$6,'reply','Private reply')`,[letter,ab,a.id,foreign,bc,b.id,randomUUID()]);
 const post=randomUUID(),otherPost=randomUUID();
 await pool.query("INSERT INTO user_posts(id,user_id,content) VALUES($1,$2,'Own post'),($3,$4,'Other post')",[post,a.id,otherPost,b.id]);
 await pool.query('INSERT INTO post_likes(user_id,post_id) VALUES($1,$2),($3,$2),($3,$4)',[b.id,post,c.id,otherPost]);
 const media=randomUUID(),card=randomUUID();
 await pool.query(`INSERT INTO media_uploads(id,uploader_id,purpose,kind,mime_type,size_bytes,original_name) VALUES($1,$2,'post','image','image/png',1,'test')`,[media,a.id]);
 await pool.query("INSERT INTO image_cards(id,user_id,media_id,type,position) VALUES($1,$2,$3,'portrait',0)",[card,a.id,media]);
 await pool.query('INSERT INTO image_card_likes(user_id,image_card_id) VALUES($1,$2)',[b.id,card]);
 for(const [viewer,target] of [[a,b],[b,a],[b,c]] as const) assert.equal((await get('/profiles/'+target.id,viewer)).status,200);
 // Repeated and self views must not manufacture extra history.
 assert.equal((await get('/profiles/'+b.id,a)).status,200);
 assert.equal((await get('/profiles/me',a)).status,200);
 const result=await stats(a);
 assert.equal(result.followingCount,1);assert.equal(result.followersCount,1);assert.equal(result.likesCount,3);
 assert.equal(result.letters.length,1);assert.equal(result.letters[0].id,letter);assert.equal(result.letters[0].content,'My letter');
 assert.equal(result.visits.length,2);
 for(const v of result.visits) {assert.ok(v.visitorId===a.id||v.profileId===a.id);assert.ok(v.visitedAt);}
 assert.deepEqual(await stats(empty),zero);
 // A forged owner selector cannot change the authenticated user's scope.
 assert.deepEqual(await stats(empty,'?userId='+a.id),zero);
 assert.equal((await get('/profiles/'+a.id+'/stats',empty)).status,404);
 await pool.query('UPDATE conversation_preferences SET following=false WHERE user_id=$1',[b.id]);
 await pool.query('DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2',[post,c.id]);
 const updated=await stats(a);assert.equal(updated.followersCount,0);assert.equal(updated.likesCount,2);
 await pool.query("UPDATE users SET visibility='only_me' WHERE id=$1",[c.id]);
 assert.equal((await get('/profiles/'+c.id,a)).status,403);
 assert.equal((await stats(a)).visits.length,2);
 assert.equal((await get('/profiles/'+randomUUID(),a)).status,404);
 await pool.query('UPDATE users SET is_suspended=true WHERE id=$1',[a.id]);
 assert.equal((await get('/profiles/me/stats',a)).status,403);
});
