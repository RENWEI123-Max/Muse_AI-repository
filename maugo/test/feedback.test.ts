import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir,readFile } from 'node:fs/promises';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { digest } from '../src/auth.js';

test('B19 registered feedback submission, limits and administrator workflow',async t=>{
  const schema='feedback_'+randomUUID().replaceAll('-','');
  const admin=new pg.Pool({connectionString:process.env.DATABASE_URL});
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
  const app=buildApp(pool);
  t.after(async()=>{await app.close();await pool.end();await admin.end();});
  const dir=new URL('../server/migrations/',import.meta.url);
  for(const name of (await readdir(dir)).filter(x=>x.endsWith('.sql')).sort()) await pool.query(await readFile(new URL(name,dir),'utf8'));
  await pool.query(await readFile(new URL('018_feedback.sql',dir),'utf8'));
  const user=async(moderator=false)=>{
    const id=randomUUID(),token=randomUUID();
    await pool.query('INSERT INTO users(id,email,password_hash,token_hash,is_moderator) VALUES($1,$2,$3,$4,$5)',[id,id+'@test.local','unused',digest(token),moderator]);
    return {id,token};
  };
  const a=await user(),b=await user(),mod=await user(true);
  type User={id:string;token:string};
  const call=(method:'POST'|'GET'|'PATCH',url:string,u?:User,payload?:object)=>app.inject({method,url,headers:u?{authorization:'Bearer '+u.token}:{},payload});
  const submit=(u?:User,payload:object={content:'Feedback'})=>call('POST','/feedback',u,payload);
  await t.test('submission and B2 session authentication',async()=>{
    assert.equal((await submit()).statusCode,401);
    assert.equal((await submit({...a,token:'invalid'})).statusCode,401);
    await pool.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,NOW()+interval '1 day')",[digest('feedback-session'),a.id]);
    const result=await submit({...a,token:'feedback-session'},{content:'Found a bug',type:'bug',contact:'reply@test.local'});
    assert.equal(result.statusCode,201);
    assert.deepEqual(result.json(),{id:result.json().id,status:'new'});
    const stored=(await pool.query('SELECT * FROM feedback WHERE id=$1',[result.json().id])).rows[0];
    assert.equal(stored.user_id,a.id);assert.equal(stored.content,'Found a bug');
    assert.equal(stored.type,'bug');assert.equal(stored.contact,'reply@test.local');
    assert.ok(stored.created_at);assert.ok(stored.updated_at);
  });
  await t.test('required content and character boundaries',async()=>{
    for(const payload of [{},{content:''},{content:' \n\t'},{content:'x'.repeat(2001)},{content:'😀'.repeat(2001)},{content:'ok',type:'x'.repeat(51)},{content:'ok',contact:'x'.repeat(201)}]) {
      assert.equal((await submit(a,payload)).statusCode,400,JSON.stringify(payload).slice(0,80));
    }
    assert.equal((await submit(b,{content:'😀'.repeat(2000),type:'x'.repeat(50),contact:'x'.repeat(200)})).statusCode,201);
    const result=await submit(b);
    assert.equal(result.statusCode,201);
    const row=(await pool.query('SELECT type,contact FROM feedback WHERE id=$1',[result.json().id])).rows[0];
    assert.deepEqual(row,{type:null,contact:null});
  });
  await t.test('five per user per rolling hour including concurrent requests',async()=>{
    const results=await Promise.all(Array.from({length:7},()=>submit(a)));
    assert.equal(results.filter(r=>r.statusCode===201).length,4);
    assert.equal(results.filter(r=>r.statusCode===429).length,3);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM feedback WHERE user_id=$1',[a.id])).rows[0].n,5);
    assert.equal((await submit(b)).statusCode,201);
    await pool.query("UPDATE feedback SET created_at=NOW()-interval '61 minutes' WHERE user_id=$1",[a.id]);
    assert.equal((await submit(a)).statusCode,201);
  });
  await t.test('administrator authorization, statuses, filtering and pagination',async()=>{
    const id=(await pool.query('SELECT id FROM feedback ORDER BY created_at DESC,id DESC LIMIT 1')).rows[0].id;
    for(const u of [undefined,a]) {
      assert.equal((await call('GET','/admin/feedback',u)).statusCode,u?403:401);
      assert.equal((await call('PATCH','/admin/feedback/'+id,u,{status:'resolved'})).statusCode,u?403:401);
    }
    const list=await call('GET','/admin/feedback',mod);
    assert.equal(list.statusCode,200);assert.equal(list.json().total,9);assert.equal(list.json().items.length,9);
    const before=list.json().items.find((x:{id:string})=>x.id===id);
    for(const status of ['in_progress','resolved','new']) {
      const result=await call('PATCH','/admin/feedback/'+id,mod,{status});
      assert.equal(result.statusCode,200);assert.equal(result.json().status,status);
      assert.equal(result.json().createdAt,before.createdAt);assert.ok(result.json().updatedAt>=before.updatedAt);
    }
    await call('PATCH','/admin/feedback/'+id,mod,{status:'resolved'});
    const resolved=(await call('GET','/admin/feedback?status=resolved',mod)).json();
    assert.equal(resolved.total,1);assert.equal(resolved.items[0].id,id);
    const fresh=(await call('GET','/admin/feedback?status=new',mod)).json();
    assert.equal(fresh.total,8);assert.ok(fresh.items.every((x:{status:string})=>x.status==='new'));
    const page=(await call('GET','/admin/feedback?status=new&limit=2&offset=1',mod)).json();
    assert.equal(page.total,8);assert.deepEqual(page.items,fresh.items.slice(1,3));
    assert.deepEqual((await call('GET','/admin/feedback?status=new&offset=100',mod)).json(),{items:[],total:8});
    assert.deepEqual((await call('GET','/admin/feedback?status=in_progress',mod)).json(),{items:[],total:0});
    assert.equal((await call('PATCH','/admin/feedback/'+id,mod,{status:'invalid'})).statusCode,400);
    assert.equal((await call('PATCH','/admin/feedback/'+id,mod,{})).statusCode,400);
    assert.equal((await call('PATCH','/admin/feedback/'+randomUUID(),mod,{status:'resolved'})).statusCode,404);
    for(const query of ['status=invalid','limit=0','limit=101','offset=-1']) assert.equal((await call('GET','/admin/feedback?'+query,mod)).statusCode,400);
  });
});
