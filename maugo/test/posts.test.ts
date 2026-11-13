import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir, readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { digest } from '../src/auth.js';

test('B16 posts, image card slots and server visibility including media downloads',async t=>{
 const schema='posts_'+randomUUID().replaceAll('-','');
 const admin=new pg.Pool({connectionString:process.env.DATABASE_URL});
 await admin.query(`CREATE SCHEMA ${schema}`);
 const db=new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
 const directory=await mkdtemp(join(tmpdir(),'maugo-posts-'));
 const previous=process.env.MEDIA_DIRECTORY;process.env.MEDIA_DIRECTORY=directory;
 const app=buildApp(db);
 t.after(async()=>{await app.close();await db.end();await admin.end();await rm(directory,{recursive:true,force:true});if(previous===undefined)delete process.env.MEDIA_DIRECTORY;else process.env.MEDIA_DIRECTORY=previous;});
 const dir=new URL('../server/migrations/',import.meta.url);
 for(const name of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort()) await db.query(await readFile(new URL(name,dir),'utf8'));
 for(let i=0;i<2;i++) await db.query(await readFile(new URL('015_posts_image_cards.sql',dir),'utf8'));
 const user=async()=>{
  const id=randomUUID(),token=randomUUID();
  await db.query('INSERT INTO users(id,email,password_hash,token_hash) VALUES($1,$2,$3,$4)',[id,id+'@test.local','unused',digest(token)]);
  return {id,token};
 };
 const a=await user(),b=await user(),stranger=await user();
 const call=(method:any,url:string,u:any,payload?:any)=>app.inject({method,url,headers:u?{authorization:'Bearer '+u.token}:{},payload});
 const status=(r:any,expected:number)=>assert.equal(r.statusCode,expected,r.body);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const upload=(u=a,purpose='post',bytes=png,mime='image/png',filename='photo.png')=>app.inject({method:'POST',url:'/media/uploads?'+new URLSearchParams({purpose,filename}),headers:{authorization:'Bearer '+u.token,'content-type':mime},payload:bytes});
 const uploaded=await upload();status(uploaded,201);const media=uploaded.json();
 const publish=(u:any,visibility='everyone',mediaIds:string[]=[media.id],content='动态')=>call('POST','/posts',u,{content,visibility,mediaIds});
 const list=(u:any)=>call('GET','/posts',u);
 const createCard=(mediaId:string,visibility='everyone')=>call('POST','/users/me/image-cards',a,{mediaId,type:'portrait',visibility});
 await t.test('validation: authentication, Unicode length, attachment count/type/size/purpose/ownership',async()=>{
  status(await list(undefined),401);status(await publish(undefined),401);
  status(await publish(a,'everyone',[],'字'.repeat(1001)),400);
  status(await publish(a,'everyone',[],'😀'.repeat(1001)),400);
  status(await publish(a,'everyone',[],'😀'.repeat(1000)),201);
  status(await publish(a,'everyone',Array.from({length:7},()=>randomUUID())),400);
  status(await publish(a,'everyone',[media.id,media.id]),400);
  status(await publish(a,'invalid'),400);status(await publish(a,'everyone',[],''),400);
  status(await publish(a,'everyone',[randomUUID()]),400);status(await publish(b),403);
  const avatar=await upload(a,'avatar');status(avatar,201);status(await publish(a,'everyone',[avatar.json().id]),400);
  status(await upload(a,'post',png,'text/html','bad.html'),415);
  status(await upload(a,'post',Buffer.alloc(10*1024*1024)),413);
  // Imported/legacy metadata must be validated again at association time.
  await db.query("UPDATE media_uploads SET mime_type='text/html' WHERE id=$1",[media.id]);
  status(await publish(a),400);status(await createCard(media.id),400);
  await db.query("UPDATE media_uploads SET mime_type='image/png' WHERE id=$1",[media.id]);
  await db.query('ALTER TABLE media_uploads DROP CONSTRAINT media_uploads_check');
  await db.query('UPDATE media_uploads SET size_bytes=10485760 WHERE id=$1',[media.id]);
  status(await publish(a),400);status(await createCard(media.id),400);
  await db.query('UPDATE media_uploads SET size_bytes=$2 WHERE id=$1',[media.id,png.length]);
  await db.query("ALTER TABLE media_uploads ADD CHECK(size_bytes>0 AND ((kind='video' AND size_bytes<31457280) OR (kind IN ('image','audio') AND size_bytes<10485760)))");
  await db.query("UPDATE media_uploads SET kind='audio',mime_type='audio/wav' WHERE id=$1",[media.id]);
  status(await createCard(media.id),400);const audioPost=await publish(a);status(audioPost,201);status(await call('DELETE',`/posts/${audioPost.json().id}`,a),200);
  await db.query("UPDATE media_uploads SET kind='image',mime_type='image/png' WHERE id=$1",[media.id]);
  const six=[];for(let i=0;i<6;i++){const r=await upload();status(r,201);six.push(r.json().id);}
  const full=await publish(a,'everyone',six,'');status(full,201);assert.deepEqual(full.json().attachments.map((m:any)=>m.id),six);
  status(await call('DELETE',`/posts/${full.json().id}`,a),200);
 });
 let publicId:string,privateId:string,friendsId:string;
 await t.test('publishing, pagination and private/friends/pending/block visibility',async()=>{
  const pub=await publish(a);status(pub,201);publicId=pub.json().id;
  assert.equal(pub.json().attachments[0].id,media.id);
  const priv=await publish(a,'only_me',[]);status(priv,201);privateId=priv.json().id;
  const friend=await publish(a,'friends',[]);status(friend,201);friendsId=friend.json().id;
  status(await call('GET',`/posts/${publicId}`,b),200);
  status(await call('GET',`/posts/${privateId}`,b),403);
  status(await call('GET',`/posts/${friendsId}`,b),403);
  const listed=await list(b);status(listed,200);assert.equal(listed.json().items.some((r:any)=>r.id===privateId||r.id===friendsId),false);
  const first=await call('GET','/posts?limit=1&offset=0',a),second=await call('GET','/posts?limit=1&offset=1',a);
  assert.equal(first.json().items[0].id,friendsId);assert.equal(second.json().items[0].id,privateId);
  status(await call('GET','/posts?limit=0',a),400);
  const open=await call('POST',`/conversations/${b.id}/opening`,a,{content:'hi'});status(open,201);
  for(const viewer of [a,b]) {
   const other=viewer===a?b:a;
   if(viewer===b) status(await call('GET',`/posts/${publicId}`,viewer),403);
   // The same pending ledger gates both directions.
   if(viewer===a) {const p=await publish(b,'everyone',[]);status(p,201);status(await call('GET',`/posts/${p.json().id}`,other===b?a:b),403);}
  }
  status(await call('GET',media.url,b),403);
  assert.equal((await list(b)).json().items.some((r:any)=>r.userId===a.id),false);
  const reply=await call('POST',`/conversations/${open.json().id}/messages`,b,{content:'hello'});status(reply,201);
  const collect=await app.inject({method:'POST',url:`/conversations/${open.json().id}/replies/${reply.json().id}/collect`,headers:{authorization:'Bearer '+a.token,'idempotency-key':'posts-unlock'},payload:{}});status(collect,200);
  status(await call('GET',`/posts/${friendsId}`,b),200);
  status(await call('GET',`/posts/${friendsId}`,stranger),403);
  status(await call('GET',`/posts/${privateId}`,b),403);
  const download=await call('GET',media.url,b);status(download,200);assert.deepEqual(download.rawPayload,png);
  for(const [blocker,blocked] of [[a,b],[b,a]]) {
   status(await call('PUT',`/blocks/${blocked.id}`,blocker),200);
   status(await call('GET',`/posts/${publicId}`,b),403);status(await call('GET',media.url,b),403);
   assert.equal((await list(b)).json().items.some((r:any)=>r.userId===a.id),false);
   status(await call('DELETE',`/blocks/${blocked.id}`,blocker),200);
  }
  await db.query('UPDATE users SET is_suspended=true WHERE id=$1',[a.id]);
  status(await call('GET',`/posts/${publicId}`,b),403);status(await call('GET',media.url,b),403);
  await db.query('UPDATE users SET is_suspended=false WHERE id=$1',[a.id]);
 });
 await t.test('image cards: ownership, type, primary, eight slots, concurrent full and deletion/refill',async()=>{
  assert.deepEqual((await call('GET','/users/me/image-cards',a)).json(),{items:[]});
  status(await call('POST','/users/me/image-cards',b,{mediaId:media.id,type:'life'}),403);
  status(await call('POST','/users/me/image-cards',a,{mediaId:media.id,type:'invalid'}),400);
  status(await createCard(media.id,'invalid'),400);
  const first=await createCard(media.id);status(first,201);assert.equal(first.json().isPrimary,true);assert.equal(first.json().position,0);
  status(await createCard(media.id),409);
  const ids=[first.json().id];
  for(let i=1;i<7;i++) {const m=await upload();status(m,201);const r=await createCard(m.json().id);status(r,201);ids.push(r.json().id);assert.equal(r.json().position,i);}
  const m1=await upload(),m2=await upload();
  const concurrent=await Promise.all([createCard(m1.json().id),createCard(m2.json().id)]);
  assert.deepEqual(concurrent.map(r=>r.statusCode).sort(),[201,409]);ids.push(concurrent.find(r=>r.statusCode===201)!.json().id);
  const extra=await upload();status(await createCard(extra.json().id),409);
  status(await call('PATCH',`/users/me/image-cards/${ids[1]}`,b,{isPrimary:true}),404);
  status(await call('DELETE',`/users/me/image-cards/${ids[1]}`,b),404);
  const changed=await call('PATCH',`/users/me/image-cards/${ids[1]}`,a,{type:'life',isPrimary:true,visibility:'friends'});status(changed,200);assert.equal(changed.json().type,'life');
  let cards=(await call('GET','/users/me/image-cards',a)).json().items;
  assert.equal(cards.filter((r:any)=>r.isPrimary).length,1);assert.equal(cards.find((r:any)=>r.isPrimary).id,ids[1]);
  status(await call('DELETE',`/users/me/image-cards/${ids[1]}`,a),200);
  cards=(await call('GET','/users/me/image-cards',a)).json().items;assert.equal(cards.find((r:any)=>r.isPrimary).id,ids[0]);
  const refill=await createCard(extra.json().id);status(refill,201);assert.equal(refill.json().position,1);
 });
 await t.test('delete cascades attachments; retained media requires an independently visible reference',async()=>{
  status(await call('DELETE',`/posts/${publicId}`,b),403);
  status(await call('DELETE',`/posts/${publicId}`,a),200);
  status(await call('GET',`/posts/${publicId}`,a),404);
  assert.equal((await db.query('SELECT * FROM post_attachments WHERE post_id=$1',[publicId])).rowCount,0);
  // The public image card still grants access after the post is removed.
  status(await call('GET',media.url,b),200);
  const cards=(await call('GET','/users/me/image-cards',a)).json().items;
  const card=cards.find((r:any)=>r.mediaId===media.id);
  status(await call('PATCH',`/users/me/image-cards/${card.id}`,a,{visibility:'only_me'}),200);
  status(await call('GET',media.url,b),403);status(await call('GET',media.url,a),200);
  status(await call('PATCH',`/users/me/image-cards/${card.id}`,a,{visibility:'friends'}),200);
  status(await call('GET',media.url,b),200);status(await call('GET',media.url,stranger),403);
  status(await call('PUT',`/blocks/${a.id}`,b),200);status(await call('GET',media.url,b),403);
  status(await call('DELETE',`/blocks/${a.id}`,b),200);
  for(const item of cards) status(await call('DELETE',`/users/me/image-cards/${item.id}`,a),200);
  assert.deepEqual((await call('GET','/users/me/image-cards',a)).json().items,[]);
  status(await call('GET',media.url,b),403);status(await call('GET',media.url,a),200);
  assert.deepEqual(await readFile(join(directory,media.id)),png);
  assert.equal((await db.query('SELECT 1 FROM media_uploads WHERE id=$1',[media.id])).rowCount,1);
 });
});
