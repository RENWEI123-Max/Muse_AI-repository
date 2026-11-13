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

test('B14 profiles, validation, avatar slots, archives and permissions', async t => {
 const schema='profiles_'+randomUUID().replaceAll('-','');
 const admin=new pg.Pool({connectionString:process.env.DATABASE_URL});
 await admin.query(`CREATE SCHEMA ${schema}`);
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
 const directory=await mkdtemp(join(tmpdir(),'maugo-profile-'));
 const previous=process.env.MEDIA_DIRECTORY;process.env.MEDIA_DIRECTORY=directory;
 const app=buildApp(pool);
 t.after(async()=>{await app.close();await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();await rm(directory,{recursive:true,force:true});if(previous===undefined) delete process.env.MEDIA_DIRECTORY;else process.env.MEDIA_DIRECTORY=previous;});
 const dir=new URL('../server/migrations/',import.meta.url);
 for(const name of (await readdir(dir)).filter(x=>x.endsWith('.sql')).sort()) await pool.query(await readFile(new URL(name,dir),'utf8'));
 for(let i=0;i<2;i++) await pool.query(await readFile(new URL('014_profiles.sql',dir),'utf8'));
 const user=async()=>{
  const id=randomUUID(),token=randomUUID();
  await pool.query('INSERT INTO users(id,email,password_hash,token_hash) VALUES($1,$2,$3,$4)',[id,id+'@test.local','unused',digest(token)]);
  return {id,token};
 };
 const a=await user(),b=await user();
 const call=(method:any,url:string,u:any,payload?:any)=>app.inject({method,url,headers:u?{authorization:'Bearer '+u.token}:{},payload});
 const action=(action:string,mediaId:string,confirm?:boolean)=>call('POST','/profiles/me/avatars',a,{action,mediaId,...(confirm===undefined?{}:{confirm})});
 for(const [method,url,payload] of [['GET',`/profiles/${a.id}`,undefined],['PATCH','/profiles/me',{age:24}],['POST','/profiles/me/avatars',{action:'add',mediaId:randomUUID()}]] as const) assert.equal((await call(method,url,undefined,payload)).statusCode,401);
 assert.equal((await call('GET',`/profiles/${randomUUID()}`,a)).statusCode,404);
 for(const payload of [{age:17},{age:101},{age:18.5},{displayName:''},{displayName:'   '},{bio:'x'.repeat(201)},{city:'x'.repeat(41)},{displayName:'x'.repeat(25)},{displayName:'changed',age:17},{email:'leak@test.local'}]) assert.equal((await call('PATCH','/profiles/me',a,payload)).statusCode,400,JSON.stringify(payload));
 assert.equal((await call('GET','/profiles/me',a)).json().displayName,'Reader');
 const edited=await call('PATCH','/profiles/me',a,{displayName:' Alice ',age:18,city:'Seoul',bio:'Hello'});
 assert.equal(edited.statusCode,200,edited.body);assert.equal(edited.json().displayName,'Alice');
 assert.equal((await call('PATCH','/profiles/me',a,{age:100})).statusCode,200);
 const publicProfile=(await call('GET',`/profiles/${a.id}`,b)).json();
 assert.equal(publicProfile.bio,'Hello');assert.equal(publicProfile.permissions.canChat,false);assert.equal(publicProfile.permissions.canOpen,true);
 for(const key of ['email','password_hash','token_hash','diamonds','recentlyRemoved','is_moderator']) assert.equal(key in publicProfile,false,key);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64');
 const upload=(u:any,purpose='avatar')=>app.inject({method:'POST',url:`/media/uploads?purpose=${purpose}&filename=photo.png`,headers:{authorization:'Bearer '+u.token,'content-type':'image/png'},payload:png});
 const foreign=(await upload(b)).json();
 for(const operation of ['add','select','remove','restore']) assert.equal((await action(operation,foreign.id,true)).statusCode,403);
 const post=(await upload(a,'post')).json();assert.equal((await action('add',post.id)).statusCode,400);
 const ids:string[]=[];
 for(let i=0;i<9;i++){const r=await upload(a);assert.equal(r.statusCode,201,r.body);ids.push(r.json().id);}
 for(let i=0;i<8;i++) assert.equal((await action('add',ids[i])).statusCode,200);
 assert.equal((await action('add',ids[8])).statusCode,409);
 assert.equal((await upload(a)).statusCode,409);
 assert.equal((await action('add',ids[0])).json().avatars.length,8); // retry does not duplicate
 assert.equal((await action('select',ids[3])).json().avatar,`/media/uploads/${ids[3]}`);
 assert.equal((await call('GET',`/media/uploads/${ids[3]}`,b)).statusCode,200);
 assert.equal((await action('remove',ids[3])).statusCode,400);
 const removed=await action('remove',ids[3],true);assert.equal(removed.json().avatars.length,7);assert.equal(removed.json().recentlyRemoved[0].mediaId,ids[3]);assert.equal(removed.json().avatar,`/media/uploads/${ids[0]}`);
 assert.equal((await call('GET',`/media/uploads/${ids[3]}`,b)).statusCode,403);
 assert.equal((await action('remove',ids[3],true)).json().avatars.length,7);
 const concurrent=await Promise.all([action('restore',ids[3]),action('add',ids[8])]);
 assert.deepEqual(concurrent.map(r=>r.statusCode).sort(),[200,409]);
 assert.equal((await call('GET','/profiles/me',a)).json().avatars.length,8);
 // Leave a free slot and restore the archived image, including repeated recovery.
 if(concurrent[0].statusCode===409){await action('remove',ids[8],true);await action('restore',ids[3]);}
 assert.equal((await action('restore',ids[3])).json().avatars.length,8);
 const opening=await call('POST',`/conversations/${a.id}/opening`,b,{content:'Hello'});const cid=opening.json().id;
 assert.equal((await call('GET',`/profiles/${a.id}`,b)).json().permissions.canChat,false);
 const reply=await call('POST',`/conversations/${cid}/messages`,a,{content:'Reply'});
 const collect=await app.inject({method:'POST',url:`/conversations/${cid}/replies/${reply.json().id}/collect`,headers:{authorization:'Bearer '+b.token,'idempotency-key':'profile-unlock'},payload:{}});assert.equal(collect.statusCode,200,collect.body);
 await call('PATCH',`/conversations/${cid}`,b,{following:true});
 const unlocked=(await call('GET',`/profiles/${a.id}`,b)).json();assert.equal(unlocked.permissions.canChat,true);assert.equal(unlocked.following,true);
 for(const blocker of [a,b]){
  const peer=blocker===a?b:a;
  await call('PUT',`/blocks/${peer.id}`,blocker);
  assert.equal((await call('GET',`/profiles/${a.id}`,b)).statusCode,403);
  assert.equal((await call('GET',`/profiles/${b.id}`,a)).statusCode,403);
  assert.equal((await call('GET',`/media/uploads/${ids[0]}`,b)).statusCode,403);
  await call('DELETE',`/blocks/${peer.id}`,blocker);
 }
 await pool.query('UPDATE users SET is_suspended=true WHERE id=$1',[a.id]);assert.equal((await call('GET',`/profiles/${a.id}`,b)).statusCode,403);
 await pool.query('UPDATE users SET is_suspended=false,deleted_at=NOW() WHERE id=$1',[a.id]);assert.equal((await call('GET',`/profiles/${a.id}`,b)).statusCode,410);
});
