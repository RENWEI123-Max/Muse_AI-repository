import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { Market } from '../src/market.js';
import { schedule } from '../src/summaries.js';
import { evaluateAlerts } from '../src/alerts.js';
import { ledger } from '../src/ledger.js';
import { begin, release } from '../src/transactions.js';

test('D9 concurrent ticks and ledger finish without nested pool checkout', { timeout: 60000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), 'bizhang-d9-')), data = join(root, 'pg');
  let pool, started = false;
  try {
    execFileSync('initdb', ['-D', data, '-A', 'trust', '-U', 'd9_test', '--no-locale'], { stdio: 'pipe' });
    execFileSync('pg_ctl', ['-D', data, '-l', join(root, 'postgres.log'), '-o', `-h '' -k ${root} -p 55480`, '-w', 'start'], { stdio: 'pipe' });
    started = true;
    // max=1 makes any nested pool checkout fail deterministically, even without load.
    pool = new pg.Pool({ host: root, port: 55480, user: 'd9_test', database: 'postgres', max: 1, connectionTimeoutMillis: 1500, statement_timeout: 30000 });
    await pool.query('CREATE ROLE bizhang_app');
    for (const file of ['001_initial.sql','002_market.sql','003_ledger.sql','004_alerts.sql','005_summaries.sql','006_settings.sql'])
      await pool.query(await readFile(new URL('../migrations/' + file, import.meta.url), 'utf8'));
    const uid = (await pool.query("INSERT INTO users(username,password_hash,timezone,daily_summary_enabled) VALUES('d9_temp','unused','Asia/Singapore',true) RETURNING id")).rows[0].id;
    const market = new Market(pool);
    const now = Date.parse('2026-11-17T13:01:00Z');
    const req = { method:'POST', url:'/transactions', headers:{'idempotency-key':randomUUID()}, bzUser:{id:uid}, body:{asset:'BTC',side:'buy',quantity:'1',price_usd:'100',traded_at:'2026-11-17T12:00:00Z'} };
    const startedAt = Date.now();
    await Promise.all([schedule(pool,market,now), schedule(pool,market,now), evaluateAlerts(pool), ledger(pool,market,req)]);
    await ledger(pool,market,{...req,method:'GET',url:'/portfolio',query:{}});
    assert(Date.now() - startedAt < 10000);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM daily_summaries WHERE user_id=$1',[uid])).rows[0].n,1);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE pid<>pg_backend_pid() AND ((wait_event='advisory' AND query_start<now()-interval '60 seconds') OR (state='idle in transaction' AND xact_start<now()-interval '60 seconds'))")).rows[0].n,0);
    assert.equal(pool.waitingCount,0);
    const c = await pool.connect();
    try {
      await begin(c);
      assert.equal((await c.query('SHOW lock_timeout')).rows[0].lock_timeout,'10s');
      assert.equal((await c.query('SHOW statement_timeout')).rows[0].statement_timeout,'30s');
      await c.query("INSERT INTO users(username,password_hash) VALUES('must_rollback','unused')");
    } finally { await release(c); }
    assert.equal((await pool.query("SELECT 1 FROM users WHERE username='must_rollback'")).rowCount,0);
  } finally {
    if (pool) await pool.end();
    if (started) execFileSync('pg_ctl',['-D',data,'-m','immediate','-w','stop'],{stdio:'pipe'});
    await rm(root,{recursive:true,force:true});
  }
});
