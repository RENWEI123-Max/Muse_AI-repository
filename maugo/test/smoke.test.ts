import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { creditWallet } from '../src/wallet.js';

test('PostgreSQL signup, opening, free and paid collection smoke', async t => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL required for real PostgreSQL smoke tests');
  const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const schema = 'smoke_' + randomUUID().replaceAll('-', '');
  assert.match(schema, /^[a-z0-9_]+$/, 'Schema must contain only lowercase letters, digits and underscores');
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}` });
  const app = buildApp(pool);
  t.after(async () => { await app.close(); await pool.end(); await admin.end(); });
  await pool.query(await readFile(new URL('../server/migrations/002_domain.sql', import.meta.url), 'utf8'));
  await pool.query(await readFile(new URL('../server/migrations/003_auth.sql', import.meta.url), 'utf8'));
  await pool.query(await readFile(new URL('../server/migrations/004_conversation_ledger.sql',import.meta.url),'utf8'));
  for (let n=0;n<2;n++) await pool.query(await readFile(new URL('../server/migrations/006_reply_wallet.sql',import.meta.url),'utf8'));
  await pool.query(await readFile(new URL('../server/migrations/007_filter_pass.sql',import.meta.url),'utf8'));
  const signup = async (email: string) => {
    const response = await app.inject({ method: 'POST', url: '/auth/signup', payload: { email, password: 'Password1!'+randomUUID(), privacyVersion:'1',termsVersion:'1' } });
    assert.equal(response.statusCode, 201, response.body);
    return response.json();
  };
  const a = await signup('a@example.test'), b = await signup('b@example.test'), outsider = await signup('c@example.test');
  const headers = { authorization: `Bearer ${a.token}` };
  assert.equal((await app.inject({ method:'POST', url:'/auth/signup', payload: { email:'a@example.test',password:'different-password1',privacyVersion:'1',termsVersion:'1' } })).statusCode,409);
  const open = (content: string, auth = headers) => app.inject({ method:'POST', url:`/conversations/${b.id}/opening`,headers:auth,payload:{content} });
  assert.equal((await open('hello',{} as typeof headers)).statusCode,401);
  assert.equal((await open('字'.repeat(201))).statusCode,400);
  assert.equal((await open('   ')).statusCode,400);
  assert.equal((await open('😀'.repeat(201))).statusCode,400);
  const opened = await open('😀'.repeat(200)); assert.equal(opened.statusCode,201,opened.body);
  const conversation = opened.json().id;
  assert.equal((await open('重复')).statusCode,200);
  const collect = (id: string, key: string, auth = headers, payload: {confirmPaid?:boolean;cancel?:boolean} = {confirmPaid:true}) => app.inject({ method:'POST', url:`/conversations/${conversation}/replies/${id}/collect`, headers:{...auth,'idempotency-key':key},payload });
  const replies: string[] = [];
  // No reply-writing API is in this task: seed B's replies directly in the isolated schema.
  for (let n=0;n<13;n++) {
    const id = randomUUID(); replies.push(id);
    await pool.query("INSERT INTO messages(id,conversation_id,sender_id,kind,content) VALUES($1,$2,$3,'reply',$4)",[id,conversation,b.id,`回复${n}`]);
  }
  assert.equal((await collect(replies[0],'not-replied')).statusCode,404);
  await pool.query('UPDATE conversations SET unlocked_at=NOW() WHERE id=$1',[conversation]);
  await pool.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2)',[a.id,b.id]);
  assert.equal((await collect(replies[0],'blocked')).statusCode,403);
  await pool.query('DELETE FROM user_blocks WHERE blocker_id=$1',[a.id]);
  await pool.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2)',[b.id,a.id]);
  assert.equal((await collect(replies[0],'blocked')).statusCode,403);
  await pool.query('DELETE FROM user_blocks WHERE blocker_id=$1',[b.id]);
  assert.equal((await collect(replies[0],'outsider',{authorization:`Bearer ${outsider.token}`})).statusCode,404);
  assert.equal((await collect(replies[0],'self',{authorization:`Bearer ${b.token}`})).statusCode,404);
  for(let n=0;n<10;n++) {
    const response = await collect(replies[n],`free-${n}`);
    assert.equal(response.statusCode,200,response.body); assert.equal(response.json().cost,0);
  }
  assert.equal((await app.inject({url:'/wallet',headers})).json().freeRemaining,0);
  assert.equal((await app.inject('/wallet')).statusCode,401);
  assert.equal((await app.inject('/wallet/ledger')).statusCode,401);
  const first = await collect(replies[0],'free-0'); assert.equal(first.json().cost,0);
  assert.equal((await collect(replies[10],'free-0')).statusCode,409);
  const confirm = await collect(replies[10],'paid',headers,{});
  assert.equal(confirm.json().code,'PAID_CONFIRMATION_REQUIRED');
  assert.equal(confirm.json().cost,10);
  assert.equal(confirm.json().content,undefined);
  assert.equal((await collect(replies[10],'paid',headers,{cancel:true})).json().state,'cancelled');
  const insufficient = await collect(replies[10],'paid');
  assert.equal(insufficient.statusCode,402);
  assert.deepEqual(insufficient.json().context,{conversationId:conversation,replyId:replies[10],idempotencyKey:'paid'});
  assert.equal(Number((await pool.query('SELECT count(*) FROM reply_collections')).rows[0].count),10);
  const credits = await Promise.all(Array.from({length:5},()=>creditWallet(pool,a.id,20,'verified-order-1')));
  assert.equal(new Set(credits.map(c=>c.id)).size,1);
  await assert.rejects(creditWallet(pool,a.id,30,'verified-order-1'),/reused/);
  await assert.rejects(creditWallet(pool,b.id,20,'verified-order-1'),/reused/);
  assert.equal((await app.inject({url:'/wallet',headers})).json().diamonds,20);
  // A database failure after inserting the unlock must roll back the entire charge.
  await pool.query(`CREATE FUNCTION reject_debit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF NEW.amount<0 THEN RAISE EXCEPTION 'simulated debit failure'; END IF; RETURN NEW; END $$`);
  await pool.query('CREATE TRIGGER reject_debit BEFORE INSERT ON wallet_ledger FOR EACH ROW EXECUTE FUNCTION reject_debit()');
  assert.equal((await collect(replies[10],'paid')).statusCode,500);
  assert.equal((await pool.query('SELECT diamonds FROM users WHERE id=$1',[a.id])).rows[0].diamonds,20);
  assert.equal(Number((await pool.query('SELECT count(*) FROM reply_collections')).rows[0].count),10);
  await pool.query('DROP TRIGGER reject_debit ON wallet_ledger');
  const results = await Promise.all(Array.from({length:6},(_,i)=>collect(replies[10],i%2?'paid':'paid-alias')));
  for(const result of results) { assert.equal(result.statusCode,200,result.body); assert.equal(result.json().cost,10); }
  assert.equal(new Set(results.map(r=>r.json().id)).size,1);
  assert.equal((await collect(replies[10],'alternate')).json().id,results[0].json().id);
  let user = (await pool.query('SELECT diamonds,collected_count FROM users WHERE id=$1',[a.id])).rows[0];
  assert.deepEqual(user,{diamonds:10,collected_count:11});
  assert.equal(Number((await pool.query('SELECT count(*) FROM wallet_ledger WHERE amount<0')).rows[0].count),1);
  assert.equal((await collect(replies[11],'alternate')).statusCode,409);
  const ledger = (await app.inject({url:'/wallet/ledger',headers})).json().items;
  assert.equal(ledger.length,2);
  assert.equal(ledger.find((e:any)=>e.amount===-10).balanceAfter,10);
  assert.deepEqual((await app.inject({url:'/wallet/ledger',headers:{authorization:`Bearer ${outsider.token}`}})).json().items,[]);
  const concurrent = await Promise.all([collect(replies[11],'next'),collect(replies[12],'last')]);
  assert.deepEqual(concurrent.map(r=>r.statusCode).sort(),[200,402]);
  user = (await pool.query('SELECT diamonds,collected_count FROM users WHERE id=$1',[a.id])).rows[0];
  assert.deepEqual(user,{diamonds:0,collected_count:12});
  assert.equal(Number((await pool.query('SELECT count(*) FROM wallet_ledger WHERE amount<0')).rows[0].count),2);
  // Move all prior collections to the preceding Shanghai day; lifetime count stays 12.
  await pool.query(`UPDATE reply_collections SET created_at =
    ((date_trunc('day', clock_timestamp() AT TIME ZONE 'Asia/Shanghai') - interval '1 second')
      AT TIME ZONE 'Asia/Shanghai') WHERE user_id=$1`, [a.id]);
  assert.equal((await app.inject({url:'/wallet',headers})).json().freeRemaining,10);
  // Exactly 00:00 Shanghai belongs to the new day, even though UTC is the prior date.
  await pool.query(`UPDATE reply_collections SET created_at =
    (date_trunc('day',clock_timestamp() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai')
    WHERE user_id=$1 AND reply_id=$2`,[a.id,replies[0]]);
  assert.equal((await app.inject({url:'/wallet',headers})).json().freeRemaining,9);
  const remaining = concurrent[0].statusCode === 402 ? replies[11] : replies[12];
  const reset = await collect(remaining, 'new-day');
  assert.equal(reset.statusCode,200,reset.body);
  assert.equal(reset.json().cost,0);
  assert.equal((await collect(replies[10], 'paid')).json().cost,10);
  user = (await pool.query('SELECT diamonds,collected_count FROM users WHERE id=$1',[a.id])).rows[0];
  assert.deepEqual(user,{diamonds:0,collected_count:13});
  assert.equal(Number((await pool.query('SELECT count(*) FROM wallet_ledger WHERE amount<0')).rows[0].count),2);
  assert.equal((await app.inject('/health')).statusCode,200);
  assert.equal((await app.inject('/ready')).statusCode,200);
});
