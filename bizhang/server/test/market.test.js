import { test } from 'node:test';
import assert from 'node:assert/strict';
import { status,validate,multiply } from '../src/market.js';
const now=1800000000000;
const row={asset:'BTC',raw_source:'binance',raw_source_ts:new Date(now),ref_ts:new Date(now),last_pass_at:new Date(now),consecutive_pass:0,paused_since:null};
const ref={last_pass_at:new Date(now)};
test('Binance cut: 120 seconds then stale',()=>{assert.equal(status(row,ref,now+120000),'ok'); assert.equal(status(row,ref,now+120001),'stale');});
test('Kraken cut propagates to quoted assets and USDT',()=>{assert.equal(status({...row,raw_source_ts:new Date(now+181000)},ref,now+181000),'stale');assert.equal(status({...row,asset:'USDT',raw_source:'kraken'},ref,now+181000),'stale');});
test('2.1% divergence requires two valid passes',()=>{let r=validate(row,{price:'102.1',ts:now},{price:'100',ts:now},now);assert.equal(status(r,ref,now),'paused_divergence');r=validate(r,{price:'100',ts:now},{price:'100',ts:now},now);assert.equal(status(r,ref,now),'paused_divergence');r=validate(r,{price:'100',ts:now},{price:'100',ts:now},now);assert.equal(status(r,ref,now),'ok');});
test('CoinGecko cut: fresh primary becomes unverified after 30 minutes',()=>{assert.equal(status({...row,raw_source_ts:new Date(now+1800001),ref_ts:new Date(now+1800001)}, {last_pass_at:new Date(now+1800001)},now+1800001),'unverified');});
test('invalid pairing resets recovery; decimal multiplication exact',()=>{assert.equal(validate({...row,consecutive_pass:1},{price:'100',ts:now-121000},{price:'100',ts:now},now).consecutive_pass,0);assert.equal(multiply('0.1','0.2'),'0.020000000000000000');});
test('FX cut: expired SGD while USD stays ok', async()=>{
  const {Market}=await import('../src/market.js');
  const pool={query:async sql=>({rows:sql.includes('JOIN')?[{...row,symbol:'BTC',usd_price:'100'}]:[{rate:'1.3',source:'coinbase',fetched_at:new Date(now-7200001)}]})};
  const market=new Market(pool,{now:()=>now});
  // Include USDT verification reference in the returned snapshot.
  pool.query=async sql=>({rows:sql.includes('JOIN')?[{...row,symbol:'BTC',usd_price:'100'},{...row,asset:'USDT',raw_source:'kraken',usd_price:'1'}]:[{rate:'1.3',source:'coinbase',fetched_at:new Date(now-7200001)}]});
  const snapshot=await market.quotes();assert.equal(snapshot.fx.stale,true);assert.equal(snapshot.quotes[0].status,'ok');assert.equal(snapshot.quotes[0].price_sgd,'130.000000000000000000');
});
test('121-second-old Binance tick is not inserted; 120-second boundary is accepted', async()=>{
  const {Market}=await import('../src/market.js');
  const writes=[];
  const market=new Market({query:async (...args)=>{writes.push(args);return {rows:[]};}},{now:()=>now});
  await market.tick('binance','BTC','100',new Date(now-121000),'USDT');
  assert.equal(writes.length,0);
  await market.tick('binance','BTC','100',new Date(now-120000),'USDT');
  assert.equal(writes.length,1);
});
