import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile,readdir,mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { digest } from '../src/auth.js';

test('post and image card likes through authenticated APIs',async t=>{
 const connectionString=process.env.TEST_DATABASE_URL||process.env.DATABASE_URL;
 const admin=new pg.Pool({connectionString});
 const schema='likes_'+randomUUID().replaceAll('-','');await admin.query(`CREATE SCHEMA ${schema}`);
 const db=new pg.Pool({connectionString,options:`-c search_path=${schema}`});
 const directory=await mkdtemp(join(tmpdir(),'maugo-likes-'));
 const previous=process.env.MEDIA_DIRECTORY;process.env.MEDIA_DIRECTORY=directory;
 const app=buildApp(db);
 t.after(async()=>{await app.close();await db.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();await rm(directory,{recursive:true,force:true});if(previous===undefined)delete process.env.MEDIA_DIRECTORY;else process.env.MEDIA_DIRECTORY=previous;});
 const dir=new URL('../server/migrations/',import.meta.url);
 for(const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await db.query(await readFile(new URL(f,dir),'utf8'));
 async function user(){const id=randomUUID(),token=randomUUID();await db.query('INSERT INTO users(id,email,password_hash,token_hash) VALUES($1,$2,$3,$4)',[id,id+'@test.local','unused',digest(token)]);return {id,token};}
 const owner=await user(),a=await user(),b=await user();
 const call=(method:any,url:string,u:any=a,payload?:any)=>app.inject({method,url,headers:u?{authorization:'Bearer '+u.token}:{},payload});
 const status=(r:any,n:number)=>assert.equal(r.statusCode,n,r.body);
 const publish=async(visibility='everyone')=>{const r=await call('POST','/posts',owner,{content:'Likeable',visibility});status(r,201);return r.json().id;};
 const postId=await publish(),privateId=await publish('only_me');
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const upload=await app.inject({method:'POST',url:'/media/uploads?purpose=post&filename=photo.png',headers:{authorization:'Bearer '+owner.token,'content-type':'image/png'},payload:png});status(upload,201);
 const created=await call('POST','/users/me/image-cards',owner,{mediaId:upload.json().id,type:'portrait'});status(created,201);const imageCardId=created.json().id;
 const stats=async()=>{const r=await call('GET','/profiles/me/stats',owner);status(r,200);return r.json();};
 for(const [kind,id,key] of [['posts',postId,'postId'],['image-cards',imageCardId,'imageCardId']]) {
  await t.test(`${kind}: PUT, serialization, idempotency, two users and DELETE`,async()=>{
   const path=`/${kind}/${id}/like`;
   const expected=(liked:boolean,likesCount:number)=>({[key]:id,liked,likesCount});
   const put=await call('PUT',path);status(put,200);assert.deepEqual(put.json(),expected(true,1));
   const serialized=async(viewer=a)=>{
    const r=await call('GET',kind==='posts'?`/posts/${id}`:`/profiles/${owner.id}/image-cards`,viewer);status(r,200);
    return kind==='posts'?r.json():r.json().items.find((i:any)=>i.id===id);
   };
   assert.equal((await serialized()).liked,true);assert.equal((await serialized()).likesCount,1);
   if(kind==='posts')assert.equal((await call('GET','/posts')).json().items.find((i:any)=>i.id===id).liked,true);
   else assert.equal((await call('GET','/users/me/image-cards',owner)).json().items[0].likesCount,1);
   assert.equal((await serialized(b)).liked,false);
   assert.deepEqual((await call('PUT',path)).json(),expected(true,1));
   const removed=await call('DELETE',path);status(removed,200);assert.deepEqual(removed.json(),expected(false,0));
   const absent=await call('DELETE',path);status(absent,200);assert.deepEqual(absent.json(),expected(false,0));
   assert.deepEqual((await call('PUT',path)).json(),expected(true,1));
   const second=await call('PUT',path,b);status(second,200);assert.deepEqual(second.json(),expected(true,2));
   assert.equal((await stats()).likesCount,2);
   assert.equal((await stats())[kind==='posts'?'postLikesCount':'imageCardLikesCount'],2);
   const deleted=await call('DELETE',path);status(deleted,200);assert.deepEqual(deleted.json(),expected(false,1));
   await call('DELETE',path,b);
   const again=await call('DELETE',path);status(again,200);assert.deepEqual(again.json(),expected(false,0));
   assert.equal((await serialized()).liked,false);assert.equal((await serialized()).likesCount,0);
   assert.equal((await stats()).likesCount,0);
   status(await call('PUT',path,owner),200); // Self-likes follow the same visibility rule.
   await call('DELETE',path,owner);
  });
 }
 await t.test('authentication, missing content and visibility on both methods',async()=>{
  for(const method of ['PUT','DELETE']) {
   for(const kind of ['posts','image-cards']) {
    status(await call(method,`/${kind}/${randomUUID()}/like`),404);
    status(await call(method,`/${kind}/${kind==='posts'?postId:imageCardId}/like`,null),401);
    status(await call(method,`/${kind}/invalid/like`),400);
   }
   status(await call(method,`/posts/${privateId}/like`),403);
   await call('PATCH',`/users/me/image-cards/${imageCardId}`,owner,{visibility:'only_me'});
   status(await call(method,`/image-cards/${imageCardId}/like`),403);
   status(await call(method,`/image-cards/${imageCardId}/like`,owner),403);
   await call('PATCH',`/users/me/image-cards/${imageCardId}`,owner,{visibility:'friends'});
   status(await call(method,`/image-cards/${imageCardId}/like`,owner),403);
   await call('PATCH',`/users/me/image-cards/${imageCardId}`,owner,{visibility:'everyone'});
   status(await call('PUT',`/blocks/${owner.id}`),200);
   status(await call(method,`/posts/${postId}/like`),403);
   status(await call(method,`/image-cards/${imageCardId}/like`),403);
   await call('DELETE',`/blocks/${owner.id}`);
  }
  // The owner's private post is visible to the owner under contentVisible.
  status(await call('PUT',`/posts/${privateId}/like`,owner),200);
 });
});
