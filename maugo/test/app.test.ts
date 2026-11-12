import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildApp } from '../src/app.js';
import { readConfig } from '../src/config.js';

test('health is independent of database', async t => {
  const app = buildApp({ query: async () => { throw new Error('offline'); } });
  t.after(() => app.close());
  const res = await app.inject('/health');
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().status, 'ok');
});
test('ready checks database', async t => {
  let query = '';
  const app = buildApp({ query: async sql => { query = sql; } });
  t.after(() => app.close());
  assert.equal((await app.inject('/ready')).statusCode, 200);
  assert.equal(query, 'SELECT 1');
});
test('database failure returns 503 without exposing details', async t => {
  const app = buildApp({ query: async () => { throw new Error('secret'); } });
  t.after(() => app.close());
  const res = await app.inject('/ready');
  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.json(), { status: 'unavailable' });
});
test('configuration validates database and port', () => {
  assert.throws(() => readConfig({}), /DATABASE_URL/);
  assert.throws(() => readConfig({ PORT: '0', DATABASE_URL: 'postgres://localhost/db' }), /PORT/);
  assert.throws(() => readConfig({ DATABASE_URL: 'https://localhost' }), /PostgreSQL/);
  assert.equal(readConfig({ DATABASE_URL: 'postgres://localhost/db' }).port, 3000);
});
