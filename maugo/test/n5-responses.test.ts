import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import { buildApp } from '../src/app.js';

// A real localhost HTTP server and a unique schema in the explicitly supplied test DB.
test('N5 durable pending capsules over HTTP', async t => {
  assert.ok(process.env.DATABASE_URL, 'N5 requires an isolated PostgreSQL DATABASE_URL');
  const admin = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const schema = 'n5_' + randomUUID().replaceAll('-', '');
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema}` });
  const app = buildApp(pool);
  t.after(async () => { await app.close(); await pool.end(); await admin.query(`DROP SCHEMA ${schema} CASCADE`); await admin.end(); });
  const dir = new URL('../server/migrations/', import.meta.url);
  for (const name of (await readdir(dir)).filter(n => n.endsWith('.sql')).sort())
    await pool.query(await readFile(new URL(name, dir), 'utf8'));
  const address = await app.listen({ host: '127.0.0.1', port: 0 });
  type User = { id: string; token: string; email: string };
  async function call(method: string, path: string, u?: User, body?: object, key?: string) {
    const r = await fetch(address + path, { method, headers: {
      ...(u ? { authorization: `Bearer ${u.token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(key ? { 'idempotency-key': key } : {})
    }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: r.status, data: await r.json() as any };
  }
  const credentials = { password: 'N5TestPassword1!', termsVersion: '1.0', privacyVersion: '1.0' };
  async function user(name: string): Promise<User> {
    const email = name + '@n5.test';
    const r = await call('POST', '/auth/signup', undefined, { ...credentials, email });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    return { ...r.data, email };
  }
  let smith = await user('smith');
  const chen = await user('chen'), outsider = await user('outsider');
  const opening = await call('POST', `/conversations/${chen.id}/opening`, smith, { content: 'Hello Chen' });
  assert.equal(opening.status, 201);
  const cid = opening.data.id, openingId = opening.data.openingMessageId;
  const base = `/conversations/${cid}`;
  const reply = await call('POST', base + '/messages', chen, { content: 'N5 secret pending content' });
  assert.equal(reply.status, 201);
  const replyId = reply.data.id;
  const expected = [{ openingMessageId: openingId, conversationId: cid }];
  async function capsules(u = smith, path = '/letters') {
    const r = await call('GET', path, u);
    assert.equal(r.status, 200, JSON.stringify(r.data));
    assert.ok(!JSON.stringify(r.data).includes('N5 secret pending content'));
    return r.data;
  }
  await t.test('01 opener receives capsule; repeated GET, new page and refresh retain it', async () => {
    const first = await capsules();
    assert.equal(first.state, 'home-response');
    assert.deepEqual(first.responses, expected);
    assert.deepEqual((await capsules(smith, `/letters?batchId=${first.batchId}`)).responses, expected);
    assert.deepEqual((await capsules()).responses, expected);
    const refreshed = await call('POST', '/letters/refresh', smith, {});
    assert.equal(refreshed.status, 200);
    assert.deepEqual(refreshed.data.responses, expected);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM discovery_response_seen')).rows[0].n, 0);
  });
  await t.test('02 logout/login reconstructs capsule; revoked session denied', async () => {
    assert.equal((await call('POST', '/auth/logout', smith, {})).status, 200);
    assert.equal((await call('GET', '/letters', smith)).status, 401);
    const login = await call('POST', '/auth/login', undefined, { ...credentials, email: smith.email });
    assert.equal(login.status, 200);
    assert.equal(login.data.id, smith.id);
    smith = { ...smith, token: login.data.token };
    assert.deepEqual((await capsules()).responses, expected);
  });
  await t.test('03 opening conversation and pending panel without collecting retains capsule and hides reply', async () => {
    // Capsules navigate by conversationId; /letters/:id remains a peer-only opening view.
    assert.equal((await call('GET', '/letters/' + openingId, smith)).status, 404);
    const history = await call('GET', base + '/messages', smith);
    assert.equal(history.status, 200);
    assert.equal(history.data.unlocked, false);
    assert.ok(!JSON.stringify(history.data).includes('N5 secret pending content'));
    const pending = await call('GET', base + '/replies/pending', smith);
    assert.equal(pending.status, 200);
    assert.equal(pending.data.items[0].id, replyId);
    assert.ok(!JSON.stringify(pending.data).includes('N5 secret pending content'));
    assert.deepEqual((await capsules()).responses, expected);
    assert.equal((await call('POST', base + '/messages', smith, { content: 'Still locked' })).status, 403);
  });
  await t.test('04 legacy response_seen ignored, multiple pending replies deduplicated', async () => {
    await pool.query('INSERT INTO discovery_response_seen(user_id,message_id) VALUES($1,$2)', [smith.id, replyId]);
    assert.deepEqual((await capsules()).responses, expected);
    const second = await call('POST', base + '/messages', chen, { content: 'Second pending' });
    assert.equal(second.status, 201);
    assert.deepEqual((await capsules()).responses, expected);
    const collected = await call('POST', base + '/replies/' + replyId + '/collect', smith, {}, 'n5-first');
    assert.equal(collected.status, 200);
    assert.equal(collected.data.state, 'collected');
    assert.equal(collected.data.cost, 0);
    assert.equal(collected.data.unlocked, true);
    assert.deepEqual((await capsules()).responses, expected, 'one pending remains');
    const last = await call('POST', base + '/replies/' + second.data.id + '/collect', smith, {}, 'n5-second');
    assert.equal(last.status, 200);
    assert.equal(last.data.state, 'collected');
    assert.deepEqual((await capsules()).responses, []);
    assert.equal((await call('GET', base + '/replies/pending', smith)).data.items.length, 0);
    assert.equal((await call('GET', base + '/messages', smith)).data.unlocked, true);
  });
  await t.test('05 reverse direction: peer sees opener reply until collected; own reply excluded', async () => {
    const back = await call('POST', base + '/messages', smith, { content: 'Opener reply' });
    assert.equal(back.status, 201);
    assert.deepEqual((await capsules(chen)).responses, expected);
    assert.deepEqual((await capsules()).responses, []);
    assert.equal((await call('GET', '/letters/' + openingId, chen)).status, 200);
    const collected = await call('POST', base + '/replies/' + back.data.id + '/collect', chen, {}, 'n5-reverse');
    assert.equal(collected.status, 200);
    assert.deepEqual((await capsules(chen)).responses, []);
  });
  await t.test('06 both block directions, suspension, visibility and authentication', async () => {
    assert.equal((await call('POST', base + '/messages', chen, { content: 'Pending again' })).status, 201);
    assert.deepEqual((await capsules()).responses, expected);
    for (const [blocker, blocked] of [[smith, chen], [chen, smith]]) {
      await pool.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2)', [blocker.id, blocked.id]);
      assert.deepEqual((await capsules()).responses, []);
      await pool.query('DELETE FROM user_blocks WHERE blocker_id=$1 AND blocked_id=$2', [blocker.id, blocked.id]);
      assert.deepEqual((await capsules()).responses, expected);
    }
    await pool.query('UPDATE users SET is_suspended=true WHERE id=$1', [chen.id]);
    assert.deepEqual((await capsules()).responses, []);
    await pool.query('UPDATE users SET is_suspended=false,visibility=\'only_me\' WHERE id=$1', [chen.id]);
    assert.deepEqual((await capsules()).responses, []);
    await pool.query('UPDATE users SET visibility=\'friends\' WHERE id=$1', [chen.id]);
    assert.deepEqual((await capsules()).responses, expected, 'collected conversation is a friend');
    await pool.query('UPDATE conversations SET unlocked_at=NULL WHERE id=$1', [cid]);
    assert.deepEqual((await capsules()).responses, []);
    await pool.query('UPDATE users SET visibility=\'everyone\' WHERE id=$1', [chen.id]);
    assert.deepEqual((await capsules()).responses, expected);
    assert.equal((await call('GET', '/letters')).status, 401);
    assert.equal((await call('GET', '/letters', { ...smith, token: 'invalid' })).status, 401);
    assert.deepEqual((await capsules(outsider)).responses, []);
    for (const path of [base + '/messages', base + '/replies/pending', '/letters/' + openingId])
      assert.equal((await call('GET', path, outsider)).status, 404);
    await pool.query('UPDATE users SET is_suspended=true WHERE id=$1', [smith.id]);
    assert.equal((await call('GET', '/letters', smith)).status, 403);
  });
  async function discoveryCounts(u: User) {
    return (await pool.query(`SELECT
      (SELECT count(*)::int FROM discovery_batches WHERE user_id=$1) AS batches,
      (SELECT count(*)::int FROM discovery_seen WHERE user_id=$1) AS seen`, [u.id])).rows[0];
  }
  async function incoming(u: User, name: string) {
    const sender = await user(name);
    const opening = await call('POST', `/conversations/${u.id}/opening`, sender, { content: 'Unread opening' });
    assert.equal(opening.status, 201);
    return opening.data.openingMessageId;
  }
  await t.test('07 unscoped response refresh consumes three unseen openings into an undisplayed batch', async () => {
    const recipient = await user('lost-recipient');
    const ids = [];
    for (let i = 0; i < 3; i++) ids.push(await incoming(recipient, `lost-sender-${i}`));
    const before = await discoveryCounts(recipient);
    // The old client kept only responses from this GET and discarded these items.
    const discarded = await capsules(recipient);
    assert.deepEqual(discarded.items.map((x: any) => x.openingMessageId).sort(), ids.sort());
    assert.deepEqual(await discoveryCounts(recipient), { batches: before.batches + 1, seen: before.seen + 3 });
    const seen = await pool.query('SELECT opening_message_id FROM discovery_seen WHERE user_id=$1 AND batch_id=$2', [recipient.id, discarded.batchId]);
    assert.deepEqual(seen.rows.map(x => x.opening_message_id).sort(), ids);
    const next = await capsules(recipient);
    assert.notEqual(next.batchId, discarded.batchId);
    assert.deepEqual(next.items, [], 'the next normal load cannot rediscover the discarded openings');
    assert.deepEqual(await discoveryCounts(recipient), { batches: before.batches + 2, seen: before.seen + 3 });
  });
  const scopedUser = await user('scoped-recipient');
  let scopedBatch: string;
  let scopedResponses: { openingMessageId: string; conversationId: string }[];
  let collectedConversation: string, collectedReply: string;
  await t.test('08 batch-scoped refresh preserves items and responses without reserving new openings', async () => {
    await incoming(scopedUser, 'scoped-initial');
    scopedResponses = [];
    for (let i = 0; i < 2; i++) {
      const peer = await user(`scoped-peer-${i}`);
      const opening = await call('POST', `/conversations/${peer.id}/opening`, scopedUser, { content: 'Hello peer' });
      assert.equal(opening.status, 201);
      const reply = await call('POST', `/conversations/${opening.data.id}/messages`, peer, { content: 'Pending response' });
      assert.equal(reply.status, 201);
      scopedResponses.push({ openingMessageId: opening.data.openingMessageId, conversationId: opening.data.id });
      if (i === 0) { collectedConversation = opening.data.id; collectedReply = reply.data.id; }
    }
    scopedResponses.sort((a, b) => a.conversationId.localeCompare(b.conversationId));
    const first = await capsules(scopedUser);
    scopedBatch = first.batchId;
    assert.equal(first.items.length, 1);
    assert.deepEqual(first.responses, scopedResponses);
    await incoming(scopedUser, 'scoped-new-unread');
    const before = await discoveryCounts(scopedUser);
    const refreshed = await capsules(scopedUser, `/letters?batchId=${scopedBatch}`);
    assert.equal(refreshed.batchId, scopedBatch);
    assert.deepEqual(refreshed.items, first.items);
    assert.deepEqual(refreshed.responses, scopedResponses);
    assert.deepEqual(await discoveryCounts(scopedUser), before);
  });
  await t.test('09 batch-scoped refresh removes collected response and retains the other', async () => {
    const before = await discoveryCounts(scopedUser);
    const collected = await call('POST', `/conversations/${collectedConversation}/replies/${collectedReply}/collect`, scopedUser, {}, 'n5-scoped');
    assert.equal(collected.status, 200);
    assert.equal(collected.data.state, 'collected');
    const refreshed = await capsules(scopedUser, `/letters?batchId=${scopedBatch}`);
    assert.deepEqual(refreshed.responses, scopedResponses.filter(x => x.conversationId !== collectedConversation));
    assert.deepEqual(await discoveryCounts(scopedUser), before);
  });

  await t.test('10 batch-scoped refresh after Filter Pass expiry returns locked without responses or new reservations', async () => {
    await pool.query("UPDATE users SET filter_pass_expires_at=NOW()+interval '1 day' WHERE id=$1", [scopedUser.id]);
    const first = await capsules(scopedUser, '/letters?city=Seoul');
    assert.ok(first.batchId);
    assert.equal(first.locked, false);
    assert.deepEqual(first.responses, scopedResponses.filter(x => x.conversationId !== collectedConversation));
    await pool.query("UPDATE users SET filter_pass_expires_at=NOW()-interval '1 second' WHERE id=$1", [scopedUser.id]);
    const before = await discoveryCounts(scopedUser);
    const locked = await capsules(scopedUser, `/letters?batchId=${first.batchId}`);
    assert.equal(locked.state, 'filters-free');
    assert.equal(locked.locked, true);
    assert.equal(locked.code, 'FILTER_PASS_REQUIRED');
    assert.equal(locked.batchId, null);
    assert.deepEqual(locked.items, []);
    assert.equal(locked.hasMore, false);
    assert.equal(locked.nextOffset, null);
    assert.equal(Object.hasOwn(locked, 'responses'), false);
    assert.deepEqual(await discoveryCounts(scopedUser), before);
  });

});
