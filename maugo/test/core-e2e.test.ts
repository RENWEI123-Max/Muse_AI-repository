import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { creditWallet } from '../src/wallet.js';

// Real routes, real registered accounts and real PostgreSQL; only mail delivery is captured.
// Time fixtures alter this test's collection timestamps, never the server clock or production data.
test('B10 registration → discovery → opening → reply → collection → chat', async t => {
  assert.ok(process.env.DATABASE_URL, 'B10 requires PostgreSQL DATABASE_URL');
  const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const schema = 'b10_' + randomUUID().replaceAll('-', '');
  await admin.query(`CREATE SCHEMA ${schema}`);
  const db = new pg.Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}`, max: 20 });
  const codes = new Map<string, string>();
  const app = buildApp(db, false, { sendMail: async (email, code) => { codes.set(email, code); } });
  t.after(async () => { await app.close(); await db.end(); await admin.end(); });
  await t.test('00 全量数据库迁移连续执行两次，迁移记录不重复', async () => {
    const url = new URL(process.env.DATABASE_URL!);
    url.searchParams.set('options', `-c search_path=${schema}`);
    const migrate = () => promisify(execFile)(process.execPath, [
      fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url)),
      fileURLToPath(new URL('../src/migrate.ts', import.meta.url))
    ], { env: { ...process.env, DATABASE_URL: url.toString() } });
    await migrate();
    const first = (await db.query('SELECT name,applied_at FROM schema_migrations ORDER BY name')).rows;
    await migrate();
    assert.deepEqual((await db.query('SELECT name,applied_at FROM schema_migrations ORDER BY name')).rows, first);
    assert.equal(first.length, (await readdir(new URL('../server/migrations/', import.meta.url))).filter(n => n.endsWith('.sql')).length);
  });
  type User = { id: string; token: string };
  const call = (method: 'GET' | 'POST', url: string, user?: User, payload?: object, key?: string) => app.inject({
    method, url, payload, headers: { ...(user ? { authorization: `Bearer ${user.token}` } : {}), ...(key ? { 'idempotency-key': key } : {}) }
  });
  const credentials = { password: 'B10PasswordStrong!', confirmPassword: 'B10PasswordStrong!', privacyVersion: '1', termsVersion: '1' };
  const ok = (r: { statusCode: number; body: string }, status: number, step: string) => assert.equal(r.statusCode, status, `${step}: ${r.body}`);
  let a: User, b: User, cid: string, openingId: string;
  const replies: string[] = [];
  const collect = (replyId: string, key: string, confirmPaid = true) => call('POST', `/conversations/${cid}/replies/${replyId}/collect`, a, { confirmPaid }, key);
  await t.test('01 注册与认证异常：真实邮件验证码、非法邮箱、密码不一致、错误及重复验证码', async () => {
    ok(await call('POST', '/auth/signup', undefined, { ...credentials, email: 'bad' }), 400, 'invalid email');
    ok(await call('POST', '/auth/signup', undefined, { ...credentials, email: 'bad@example.test', confirmPassword: 'Different1!' }), 400, 'password mismatch');
    for (const email of ['a@b10.test', 'b@b10.test']) {
      ok(await call('POST', '/auth/code/send', undefined, { email }), 200, 'send code');
      const code = codes.get(email); assert.match(code!, /^\d{6}$/, 'mail must contain generated code');
      ok(await call('POST', '/auth/code/verify', undefined, { email, code: code === '000000' ? '999999' : '000000' }), 401, 'wrong code');
      ok(await call('POST', '/auth/code/verify', undefined, { email, code }), 200, 'verify delivered code');
      ok(await call('POST', '/auth/code/verify', undefined, { email, code }), 401, 'one-use code');
      const registered = await call('POST', '/auth/signup', undefined, { ...credentials, email });
      ok(registered, 201, 'signup');
      if (email.startsWith('a')) a = registered.json(); else b = registered.json();
    }
    assert.notEqual(a.id, b.id);
  });
  await t.test('02 并发开场白仅创建一条账本，第二条 409，未解锁消息与媒体拒绝', async () => {
    ok(await call('POST', `/conversations/${b.id}/opening`, a, { content: '字'.repeat(201) }), 400, '201 characters');
    const results = await Promise.all(Array.from({ length: 12 }, () => call('POST', `/conversations/${b.id}/opening`, a, { content: '字'.repeat(200) })));
    assert.equal(results.filter(r => r.statusCode === 201).length, 1, 'one successful opening');
    assert.equal(results.filter(r => r.statusCode === 409).length, 11, 'all competing openings conflict');
    const opened = results.find(r => r.statusCode === 201)!.json(); cid = opened.id; openingId = opened.openingMessageId;
    ok(await call('POST', `/conversations/${b.id}/opening`, a, { content: 'second' }), 409, 'second opening');
    assert.equal((await db.query('SELECT * FROM conversations')).rowCount, 1);
    assert.equal((await db.query('SELECT * FROM messages')).rowCount, 1);
    ok(await call('POST', `/conversations/${cid}/messages`, a, { content: 'premature chat' }), 403, 'locked text');
    const upload = await app.inject({ method: 'POST', url: `/media/uploads?purpose=chat&filename=test.png&conversationId=${cid}`, headers: { authorization: `Bearer ${a.token}`, 'content-type': 'image/png' }, payload: Buffer.from('locked upload') });
    ok(upload, 403, 'locked media');
  });
  await t.test('03 B 发现 A 来信，详情、免费筛选和 Refresh', async () => {
    const list = await call('GET', '/letters', b); ok(list, 200, 'letters');
    assert.equal(list.json().items[0].openingMessageId, openingId);
    assert.equal(list.json().items[0].sender.id, a.id);
    const detail = await call('GET', `/letters/${openingId}`, b); ok(detail, 200, 'detail');
    assert.equal(detail.json().content, '字'.repeat(200)); assert.equal(detail.json().canChat, false);
    const filtered = await call('GET', '/letters?gender=other', b); ok(filtered, 200, 'basic filter'); assert.equal(filtered.json().locked, false);
    const refreshed = await call('POST', '/letters/refresh', b, {}); ok(refreshed, 200, 'refresh');
    assert.ok(Array.isArray(refreshed.json().items)); assert.ok(!refreshed.json().items.some((x: any) => x.openingMessageId === openingId), 'refresh must not repeat seen opening');
  });
  await t.test('04 B 有效回信仍锁定，A 首次免费收取原子解锁，双方可聊天', async () => {
    const reply = await call('POST', `/conversations/${cid}/messages`, b, { content: '你好，这是有效回信' }); ok(reply, 201, 'reply'); replies.push(reply.json().id);
    assert.equal(reply.json().unlocked, false);
    ok(await call('POST', `/conversations/${cid}/messages`, a, { content: 'before collection' }), 403, 'reply alone cannot unlock');
    const first = await collect(replies[0], 'first'); ok(first, 200, 'first collection');
    assert.equal(first.json().cost, 0); assert.equal(first.json().unlocked, true);
    const again = await collect(replies[0], 'first'); assert.equal(again.json().id, first.json().id);
    assert.equal(again.json().unlockedAt, first.json().unlockedAt);
    assert.equal((await db.query('SELECT * FROM reply_collections')).rowCount, 1);
    assert.equal((await db.query('SELECT collected_count FROM users WHERE id=$1', [a.id])).rows[0].collected_count, 1);
    for (const user of [a, b]) ok(await call('POST', `/conversations/${cid}/messages`, user, { content: 'unlocked chat' }), 201, 'both participants chat');
    assert.equal((await call('GET', `/letters/${openingId}`, b)).json().canChat, true);
  });
  await t.test('05 前十次免费，第十一次付费，并发及不同重试键只扣一次', async () => {
    for (let n = 1; n <= 10; n++) {
      const reply = await call('POST', `/conversations/${cid}/messages`, b, { content: `reply ${n}` }); ok(reply, 201, `reply ${n}`); replies.push(reply.json().id);
      if (n < 10) { const r = await collect(replies[n], `free-${n}`); ok(r, 200, `free collection ${n + 1}`); assert.equal(r.json().cost, 0); }
    }
    const confirm = await collect(replies[10], 'paid', false); ok(confirm, 200, 'paid confirmation'); assert.equal(confirm.json().cost, 10); assert.equal(confirm.json().state, 'confirmation-required');
    await creditWallet(db, a.id, 50, 'b10-verified-credit');
    const results = await Promise.all(Array.from({ length: 12 }, (_, n) => collect(replies[10], n % 2 ? 'paid' : 'paid-alias')));
    for (const r of results) { ok(r, 200, 'concurrent paid collection'); assert.equal(r.json().cost, 10); }
    assert.equal(new Set(results.map(r => r.json().id)).size, 1);
    const state = (await db.query('SELECT diamonds,collected_count FROM users WHERE id=$1', [a.id])).rows[0];
    assert.deepEqual(state, { diamonds: 40, collected_count: 11 });
    assert.equal((await db.query('SELECT * FROM wallet_ledger WHERE collection_id IS NOT NULL')).rowCount, 1);
    ok(await collect(replies[0], 'paid'), 409, 'key cannot bind another reply');
  });
  await t.test('06 上海自然日边界：前日 23:59:59 不计额度，当日 00:00 计入', async () => {
    await db.query(`UPDATE reply_collections SET created_at=(date_trunc('day',clock_timestamp() AT TIME ZONE 'Asia/Shanghai')-interval '1 second') AT TIME ZONE 'Asia/Shanghai'`);
    assert.equal((await call('GET', '/wallet', a)).json().freeRemaining, 10);
    await db.query(`UPDATE reply_collections SET created_at=date_trunc('day',clock_timestamp() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai' WHERE reply_id=$1`, [replies[0]]);
    const wallet = (await call('GET', '/wallet', a)).json(); assert.equal(wallet.timeZone, 'Asia/Shanghai'); assert.equal(wallet.freeRemaining, 9);
    const next = await call('POST', `/conversations/${cid}/messages`, b, { content: 'new Shanghai day' }); ok(next, 201, 'next reply');
    assert.equal((await collect(next.json().id, 'new-day')).json().cost, 0);
    assert.equal((await collect(replies[10], 'paid')).json().cost, 10, 'historical paid retry keeps original price');
  });
  await t.test('07 Filter Pass 购买与到期撤销高级筛选', async () => {
    assert.equal((await call('GET', '/letters?city=Shanghai', b)).json().locked, true);
    await creditWallet(db, b.id, 30, 'b10-pass-credit');
    const bought = await call('POST', '/filter-pass/purchase', b, { days: 1 }, 'pass'); ok(bought, 200, 'buy pass'); assert.equal(bought.json().active, true);
    assert.equal((await call('GET', '/letters?city=Shanghai', b)).json().locked, false);
    await db.query("UPDATE users SET filter_pass_expires_at=clock_timestamp()-interval '1 second' WHERE id=$1", [b.id]);
    assert.equal((await call('GET', '/filter-pass', b)).json().active, false);
    assert.equal((await call('GET', '/letters?city=Shanghai', b)).json().locked, true);
  });
  await t.test('08 账本写入失败回滚收取、扣费及解锁，重试仅解锁一次', async () => {
    const registered = await call('POST', '/auth/signup', undefined, { ...credentials, email: 'c@b10.test' }); ok(registered, 201, 'register rollback peer');
    const c: User = registered.json();
    const opened = await call('POST', `/conversations/${c.id}/opening`, a, { content: 'atomic collection' }); ok(opened, 201, 'rollback opening');
    const conversation = opened.json().id;
    const reply = await call('POST', `/conversations/${conversation}/messages`, c, { content: 'atomic reply' }); ok(reply, 201, 'rollback reply');
    await db.query('UPDATE reply_collections SET created_at=clock_timestamp() WHERE user_id=$1', [a.id]);
    const snapshot = (await db.query('SELECT diamonds,collected_count FROM users WHERE id=$1', [a.id])).rows[0];
    const request = () => call('POST', `/conversations/${conversation}/replies/${reply.json().id}/collect`, a, { confirmPaid: true }, 'atomic');
    await db.query(`CREATE FUNCTION b10_reject_debit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'B10 injected ledger failure'; END $$`);
    await db.query('CREATE TRIGGER b10_reject_debit BEFORE INSERT ON wallet_ledger FOR EACH ROW EXECUTE FUNCTION b10_reject_debit()');
    try {
      ok(await request(), 500, 'injected ledger failure');
      assert.deepEqual((await db.query('SELECT diamonds,collected_count FROM users WHERE id=$1', [a.id])).rows[0], snapshot);
      assert.equal((await db.query('SELECT unlocked_at FROM conversations WHERE id=$1', [conversation])).rows[0].unlocked_at, null);
      assert.equal((await db.query('SELECT * FROM reply_collections WHERE reply_id=$1', [reply.json().id])).rowCount, 0);
      assert.equal((await db.query("SELECT * FROM reply_collection_requests WHERE idempotency_key='atomic'")).rowCount, 0);
    } finally { await db.query('DROP TRIGGER b10_reject_debit ON wallet_ledger'); }
    const results = await Promise.all(Array.from({ length: 8 }, request));
    for (const r of results) { ok(r, 200, 'atomic retry'); assert.equal(r.json().cost, 10); }
    assert.equal(new Set(results.map(r => r.json().unlockedAt)).size, 1);
    assert.equal(new Set(results.map(r => r.json().id)).size, 1);
    assert.deepEqual((await db.query('SELECT diamonds,collected_count FROM users WHERE id=$1', [a.id])).rows[0], { diamonds: snapshot.diamonds - 10, collected_count: snapshot.collected_count + 1 });
    for (const user of [a, c]) ok(await call('POST', `/conversations/${conversation}/messages`, user, { content: 'after atomic retry' }), 201, 'chat after atomic retry');
  });

});
