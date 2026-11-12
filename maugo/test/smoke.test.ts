import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { buildApp } from '../src/app.js';

test('PostgreSQL signup, opening, free and paid collection smoke', async t => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL required for real PostgreSQL smoke tests');
  const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const schema = 'smoke_' + randomUUID().replaceAll('-', '');
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}` });
  const app = buildApp(pool);
  t.after(async () => { await app.close(); await pool.end(); await admin.end(); });
  await pool.query(await readFile(new URL('../server/migrations/002_domain.sql', import.meta.url), 'utf8'));
  const signup = async (email: string) => {
    const response = await app.inject({ method: 'POST', url: '/auth/signup', payload: { email, password: randomUUID() } });
    assert.equal(response.statusCode, 201, response.body);
    return response.json();
  };
  const a = await signup('a@example.test'), b = await signup('b@example.test'), outsider = await signup('c@example.test');
  const headers = { authorization: `Bearer ${a.token}` };
  assert.equal((await app.inject({ method:'POST', url:'/auth/signup', payload: { email:'a@example.test',password:'different-password' } })).statusCode,409);
  const open = (content: string, auth = headers) => app.inject({ method:'POST', url:`/conversations/${b.id}/opening`,headers:auth,payload:{content} });
  assert.equal((await open('hello',{} as typeof headers)).statusCode,401);
  assert.equal((await open('字'.repeat(201))).statusCode,400);
  assert.equal((await open('   ')).statusCode,400);
  const opened = await open('你好'); assert.equal(opened.statusCode,201,opened.body);
  const conversation = opened.json().id;
  assert.equal((await open('重复')).statusCode,409);
  const collect = (id: string, key: string, auth = headers) => app.inject({ method:'POST', url:`/conversations/${conversation}/replies/${id}/collect`, headers:{...auth,'idempotency-key':key} });
  const replies: string[] = [];
  // No reply-writing API is in this task: seed B's replies directly in the isolated schema.
  for (let n=0;n<13;n++) {
    const id = randomUUID(); replies.push(id);
    await pool.query("INSERT INTO messages(id,conversation_id,sender_id,kind,content) VALUES($1,$2,$3,'reply',$4)",[id,conversation,b.id,`回复${n}`]);
  }
  assert.equal((await collect(replies[0],'outsider',{authorization:`Bearer ${outsider.token}`})).statusCode,404);
  assert.equal((await collect(replies[0],'self',{authorization:`Bearer ${b.token}`})).statusCode,404);
  for(let n=0;n<10;n++) {
    const response = await collect(replies[n],`free-${n}`);
    assert.equal(response.statusCode,200,response.body); assert.equal(response.json().cost,0);
  }
  const first = await collect(replies[0],'free-0'); assert.equal(first.json().cost,0);
  assert.equal((await collect(replies[10],'free-0')).statusCode,409);
  assert.equal((await collect(replies[10],'paid')).statusCode,402);
  assert.equal(Number((await pool.query('SELECT count(*) FROM reply_collections')).rows[0].count),10);
  await pool.query('UPDATE users SET diamonds=20 WHERE id=$1',[a.id]);
  const results = await Promise.all(Array.from({length:5},()=>collect(replies[10],'paid')));
  for(const result of results) { assert.equal(result.statusCode,200,result.body); assert.equal(result.json().cost,10); }
  assert.equal(new Set(results.map(r=>r.json().id)).size,1);
  assert.equal((await collect(replies[10],'alternate')).json().id,results[0].json().id);
  let user = (await pool.query('SELECT diamonds,collected_count FROM users WHERE id=$1',[a.id])).rows[0];
  assert.deepEqual(user,{diamonds:10,collected_count:11});
  assert.equal(Number((await pool.query('SELECT count(*) FROM wallet_ledger')).rows[0].count),1);
  const concurrent = await Promise.all([collect(replies[11],'next'),collect(replies[12],'last')]);
  assert.deepEqual(concurrent.map(r=>r.statusCode).sort(),[200,402]);
  user = (await pool.query('SELECT diamonds,collected_count FROM users WHERE id=$1',[a.id])).rows[0];
  assert.deepEqual(user,{diamonds:0,collected_count:12});
  assert.equal(Number((await pool.query('SELECT count(*) FROM wallet_ledger')).rows[0].count),2);
  assert.equal((await app.inject('/health')).statusCode,200);
  assert.equal((await app.inject('/ready')).statusCode,200);
});
