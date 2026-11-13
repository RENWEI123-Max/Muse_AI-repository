import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { digest } from '../src/auth.js';

test('B21 zodiac: migration replay, twelve signs, persistence, null/omission and invalid values', async t => {
 const schema='zodiac_'+randomUUID().replaceAll('-','');
 const admin=new pg.Pool({connectionString:process.env.DATABASE_URL});
 await admin.query(`CREATE SCHEMA ${schema}`);
 const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
 const app=buildApp(pool);
 t.after(async()=>{await app.close();await pool.end();await admin.end();});
 const dir=new URL('../server/migrations/',import.meta.url);
 const names=(await readdir(dir)).filter(x=>x.endsWith('.sql')).sort();
 for(const name of names.filter(x=>x<'021')) await pool.query(await readFile(new URL(name,dir),'utf8'));
 const user=async()=>{
  const id=randomUUID(),token=randomUUID();
  await pool.query('INSERT INTO users(id,email,password_hash,token_hash) VALUES($1,$2,$3,$4)',[id,id+'@test.local','unused',digest(token)]);
  return {id,token};
 };
 const owner=await user(),viewer=await user();
 const migration=await readFile(new URL('021_profile_zodiac.sql',dir),'utf8');
 await pool.query(migration);
 await pool.query(migration);
 const address=await app.listen({port:0,host:'127.0.0.1'});
 const get=async(path:string,token=owner.token)=>{
  const r=await fetch(address+path,{headers:{authorization:'Bearer '+token}});
  assert.equal(r.status,200);return r.json() as Promise<any>;
 };
 const patch=(body:unknown)=>fetch(address+'/profiles/me',{method:'PATCH',headers:{authorization:'Bearer '+owner.token,'content-type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await get('/profiles/me')).zodiac,null);
 assert.equal((await get('/profiles/'+owner.id,viewer.token)).zodiac,null);
 assert.equal((await patch({zodiac:null})).status,200);
 assert.equal((await get('/profiles/me')).zodiac,null);
 for(const zodiac of ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']) {
  const r=await patch({zodiac});assert.equal(r.status,200);assert.equal((await r.json() as any).zodiac,zodiac);
  assert.equal((await get('/profiles/me')).zodiac,zodiac);
  assert.equal((await get('/profiles/'+owner.id,viewer.token)).zodiac,zodiac);
  assert.equal((await pool.query('SELECT zodiac FROM users WHERE id=$1',[owner.id])).rows[0].zodiac,zodiac);
 }
 for(const body of [{bio:'B21'},{zodiac:null}]) {
  const r=await patch(body);assert.equal(r.status,200);assert.equal((await r.json() as any).zodiac,'Pisces');
 }
 for(const zodiac of ['aries','Ophiuchus','', ' Aries ',12,false,[],{}]) {
  assert.equal((await patch({zodiac,bio:'must not persist'})).status,400);
  const profile=await get('/profiles/me');assert.equal(profile.zodiac,'Pisces');assert.equal(profile.bio,'B21');
 }
 await assert.rejects(pool.query("UPDATE users SET zodiac='invalid' WHERE id=$1",[owner.id]),{code:'23514'});
 // null PATCH is a no-op per contract; clear only the isolated fixture to verify nullable storage and reads.
 await pool.query('UPDATE users SET zodiac=NULL WHERE id=$1',[owner.id]);
 assert.equal((await get('/profiles/me')).zodiac,null);
 assert.equal((await get('/profiles/'+owner.id,viewer.token)).zodiac,null);
 assert.equal((await patch({zodiac:'Aries'})).status,200);
 assert.equal((await get('/profiles/me')).zodiac,'Aries');
});
