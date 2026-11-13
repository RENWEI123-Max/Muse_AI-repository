import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { digest } from '../src/auth.js';
import { creditWallet } from '../src/wallet.js';

test('B6 purchases, renewal, expiry, retry, cancellation and atomic ledger on PostgreSQL', async t => {
  const admin=new pg.Pool({connectionString:process.env.DATABASE_URL});
  const schema='pass_'+randomUUID().replaceAll('-','');
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
  const app=buildApp(pool);
  t.after(async()=>{await app.close();await pool.end();await admin.end();});
  for (const name of (await readdir(new URL('../server/migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())
    await pool.query(await readFile(new URL('../server/migrations/'+name,import.meta.url),'utf8'));
  await pool.query(await readFile(new URL('../server/migrations/007_filter_pass.sql',import.meta.url),'utf8'));
  const id=randomUUID(), token=randomUUID();
  await pool.query("INSERT INTO users(id,email,password_hash,token_hash,diamonds) VALUES($1,$2,'unused',$3,2000)",[id,id+'@test.local',digest(token)]);
  const headers={authorization:`Bearer ${token}`};
  const get=(url:string)=>app.inject({url,headers});
  const buy=(days:number,key=randomUUID(),extra={})=>app.inject({method:'POST',url:'/filter-pass/purchase',headers:{...headers,'idempotency-key':key},payload:{days,...extra}});
  const counts=async()=> (await pool.query(`SELECT (SELECT count(*)::int FROM filter_pass_purchases) AS purchases,
    (SELECT count(*)::int FROM wallet_ledger WHERE filter_pass_purchase_id IS NOT NULL) AS charges`)).rows[0];
  assert.equal((await app.inject('/filter-pass')).statusCode,401);
  assert.equal((await app.inject({method:'POST',url:'/filter-pass/purchase',headers,payload:{days:1}})).statusCode,400);
  assert.equal((await buy(2)).statusCode,400);
  assert.equal((await get('/filter-pass')).json().active,false);
  assert.equal((await get('/filter-pass')).json().remainingDays,0);
  assert.equal((await get('/letters?city=Seoul&minAge=20')).json().locked,true);
  const filters={city:'Seoul',minAge:20,maxAge:30};
  const cancelled=(await buy(7,'cancel',{cancel:true,filters})).json();
  assert.equal(cancelled.state,'cancelled');assert.deepEqual(cancelled.context.filters,filters);
  assert.deepEqual(await counts(),{purchases:0,charges:0});
  for (const [days,cost] of [[1,30],[7,150],[30,480]]) {
    const key=randomUUID();
    const results=await Promise.all([buy(days,key),buy(days,key),buy(days,key)]);
    for(const r of results) {assert.equal(r.statusCode,200,r.body);assert.equal(r.json().active,true);assert.equal(r.json().purchase.cost,cost);}
    assert.equal(new Set(results.map(r=>r.json().purchase.id)).size,1);
    assert.equal((await buy(days===1?7:1,key)).statusCode,409);
    assert.equal((await get('/discovery/filters')).json().passActive,true);
    assert.equal((await get('/letters?city=Seoul&minAge=20')).json().locked,false);
  }
  assert.deepEqual(await counts(),{purchases:3,charges:3});
  assert.equal((await pool.query('SELECT diamonds FROM users WHERE id=$1',[id])).rows[0].diamonds,1340);
  const original=(await pool.query("UPDATE users SET filter_pass_expires_at=clock_timestamp()+interval '5 days' WHERE id=$1 RETURNING filter_pass_expires_at",[id])).rows[0].filter_pass_expires_at;
  const renewed=(await buy(7)).json();
  assert.equal(Date.parse(renewed.purchase.starts_at),original.getTime());
  assert.equal(Date.parse(renewed.expiresAt),original.getTime()+7*86400000);
  assert.equal(renewed.remainingDays,12);
  await pool.query("UPDATE users SET filter_pass_expires_at=clock_timestamp()-interval '1 second' WHERE id=$1",[id]);
  assert.equal((await get('/filter-pass')).json().active,false);
  assert.equal((await get('/filter-pass')).json().remainingDays,0);
  assert.equal((await get('/letters?city=Seoul')).json().locked,true);
  const before=Date.now(), expiredRenewal=(await buy(1)).json();
  assert.ok(Date.parse(expiredRenewal.purchase.starts_at)>=before-1000);
  assert.equal(Date.parse(expiredRenewal.expiresAt)-Date.parse(expiredRenewal.purchase.starts_at),86400000);
  // Distinct concurrent purchases must also accumulate rather than overwrite each other.
  const base=Date.parse(expiredRenewal.expiresAt);
  await Promise.all([buy(1),buy(7)]);
  assert.equal(Date.parse((await get('/filter-pass')).json().expiresAt),base+8*86400000);
  await pool.query('UPDATE users SET diamonds=0 WHERE id=$1',[id]);
  const prior=await counts(), key=randomUUID();
  const insufficient=await buy(30,key,{filters});
  assert.equal(insufficient.statusCode,402);assert.deepEqual(insufficient.json().context,{days:30,filters,idempotencyKey:key});
  assert.deepEqual(await counts(),prior);
  const expiry=(await get('/filter-pass')).json().expiresAt;
  await buy(30,key,{cancel:true,filters});
  assert.equal((await get('/filter-pass')).json().expiresAt,expiry);
  await creditWallet(pool,id,480,'B6-topup-'+id);
  assert.equal((await buy(30,key,{filters})).json().state,'purchased');
  assert.equal((await buy(30,key,{filters})).json().state,'purchased');
  // A ledger insert failure must roll back the deduction, entitlement and purchase.
  await creditWallet(pool,id,30,'B6-rollback-'+id);
  const snapshot=(await pool.query('SELECT diamonds,filter_pass_expires_at FROM users WHERE id=$1',[id])).rows[0];
  const priorFailure=await counts();
  await pool.query(`CREATE FUNCTION reject_pass_charge() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected ledger failure'; END $$`);
  await pool.query('CREATE TRIGGER reject_charge BEFORE INSERT ON wallet_ledger FOR EACH ROW EXECUTE FUNCTION reject_pass_charge()');
  const retryKey=randomUUID();
  assert.equal((await buy(1,retryKey)).statusCode,500);
  assert.deepEqual(await counts(),priorFailure);
  assert.deepEqual((await pool.query('SELECT diamonds,filter_pass_expires_at FROM users WHERE id=$1',[id])).rows[0],snapshot);
  await pool.query('DROP TRIGGER reject_charge ON wallet_ledger');
  assert.equal((await buy(1,retryKey)).statusCode,200);
  const ledger=(await get('/wallet/ledger')).json().items;
  assert.ok(ledger.some((e:any)=>e.filterPassPurchaseId && e.amount===-30));
});
