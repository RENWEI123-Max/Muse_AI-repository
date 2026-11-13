import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { digest } from '../src/auth.js';

test('B4 discovery, locked filters, durable refresh and B3 states on PostgreSQL', async t => {
  const admin = new pg.Pool({connectionString:process.env.DATABASE_URL});
  const schema='discovery_'+randomUUID().replaceAll('-','');
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
  const app=buildApp(pool);
  t.after(async()=>{await app.close();await pool.end();await admin.end();});
  for(const name of ['002_domain.sql','003_auth.sql','004_conversation_ledger.sql','005_discovery.sql','005_discovery.sql'])
    await pool.query(await readFile(new URL('../server/migrations/'+name,import.meta.url),'utf8'));
  async function user() {
    const id=randomUUID(),token=randomUUID();
    await pool.query("INSERT INTO users(id,email,password_hash,token_hash,city,age,gender) VALUES($1,$2,'unused',$3,'Seoul',25,'female')",[id,id+'@test.local',digest(token)]);
    return {id,token};
  }
  const reader=await user(), outsider=await user();
  const headers={authorization:`Bearer ${reader.token}`};
  const get=(url:string)=>app.inject({url,headers});
  const refresh=(payload={})=>app.inject({method:'POST',url:'/letters/refresh',headers,payload});
  const openings:string[]=[];
  for(let i=0;i<8;i++) {
    const sender=await user();
    const r=await app.inject({method:'POST',url:`/conversations/${reader.id}/opening`,headers:{authorization:`Bearer ${sender.token}`},payload:{content:'Opening '+i}});
    assert.equal(r.statusCode,201);openings.push(r.json().openingMessageId);
  }
  assert.equal((await app.inject('/letters')).statusCode,401);
  assert.equal((await get('/discovery/filters')).json().citySource,'mock-fixed-list');
  for(const url of ['/letters?city=Seoul','/letters?minAge=20','/letters?maxAge=30']) {
    const r=await get(url);assert.equal(r.statusCode,200);assert.equal(r.json().locked,true);assert.deepEqual(r.json().items,[]);
  }
  assert.equal((await pool.query('SELECT * FROM discovery_seen')).rowCount,0);
  assert.equal((await get('/letters?minAge=40&maxAge=20')).statusCode,400);
  assert.equal((await get('/letters?limit=0')).statusCode,400);
  assert.equal((await get('/letters?offset=1')).statusCode,400);
  const first=(await get('/letters?gender=female')).json();
  assert.equal(first.state,'home-ready');assert.equal(first.items.length,3);
  const b=first.batchId;
  const page=(await get(`/letters?batchId=${b}&limit=2`)).json();
  assert.equal(page.hasMore,true);assert.equal(page.nextOffset,2);
  const last=(await get(`/letters?batchId=${b}&offset=2&limit=2`)).json();
  assert.equal(last.items.length,1);assert.equal(last.hasMore,false);
  assert.equal((await get(`/letters?batchId=${b}&offset=3`)).json().state,'home-empty');
  assert.equal((await app.inject({url:`/letters?batchId=${b}`,headers:{authorization:`Bearer ${outsider.token}`}})).statusCode,404);
  const details=first.items[0];
  assert.equal((await get(`/letters/${details.openingMessageId}`)).json().state,'letter-open');
  assert.equal((await app.inject({url:`/letters/${details.openingMessageId}`,headers:{authorization:`Bearer ${outsider.token}`}})).statusCode,404);
  await app.inject({method:'POST',url:`/conversations/${details.conversationId}/messages`,headers,payload:{content:'Reply'}});
  assert.equal((await get(`/letters/${details.openingMessageId}`)).json().state,'letter-waiting');
  const senderId=details.sender.id;
  await pool.query("INSERT INTO messages(id,conversation_id,sender_id,kind,content) VALUES($1,$2,$3,'reply','Back')",[randomUUID(),details.conversationId,senderId]);
  assert.equal((await get(`/letters/${details.openingMessageId}`)).json().state,'letter-replied');
  assert.equal((await get(`/letters?batchId=${b}`)).json().state,'home-response');
  assert.equal((await get(`/letters?batchId=${b}`)).json().state,'home-ready');
  const marked=(await get(`/letters?batchId=${b}`)).json().items.find((x:any)=>x.openingMessageId===details.openingMessageId);
  assert.equal(marked.replied,true);assert.equal(marked.unlocked,false);
  await pool.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2)',[reader.id,senderId]);
  assert.equal((await get(`/letters/${details.openingMessageId}`)).statusCode,404);
  assert.ok(!(await get(`/letters?batchId=${b}`)).json().items.some((x:any)=>x.sender.id===senderId));
  const batches=await Promise.all([refresh(),refresh(),refresh()]);
  const ids=batches.flatMap(r=>{assert.equal(r.statusCode,200);return r.json().items.map((x:any)=>x.openingMessageId);});
  assert.equal(ids.length,5);assert.equal(new Set([...first.items.map((x:any)=>x.openingMessageId),...ids]).size,8);
  assert.equal((await refresh()).json().state,'home-empty');
  await pool.query("UPDATE users SET filter_pass_expires_at=NOW()+interval '1 day' WHERE id=$1",[reader.id]);
  assert.equal((await get('/discovery/filters')).json().state,'filters-active');
  const filtered=(await get('/letters?city=Seoul&minAge=20&maxAge=30')).json();
  assert.equal(filtered.locked,false);assert.equal(filtered.state,'home-empty');
  const newSender=await user();
  await app.inject({method:'POST',url:`/conversations/${reader.id}/opening`,headers:{authorization:`Bearer ${newSender.token}`},payload:{content:'new'}});
  assert.equal((await get('/letters?city=Tokyo')).json().items.length,0);
  const selected=(await get('/letters?city=Seoul&minAge=25&maxAge=25')).json();
  assert.equal(selected.items.length,1);assert.equal(selected.filterState,'filters-selected');
  await pool.query("UPDATE users SET filter_pass_expires_at=NOW()-interval '1 second' WHERE id=$1",[reader.id]);
  assert.equal((await get(`/letters?batchId=${selected.batchId}`)).json().locked,true);
  await pool.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2)',[newSender.id,reader.id]);
  assert.equal((await get(`/letters/${selected.items[0].openingMessageId}`)).statusCode,404);
});
