import test from 'node:test';
import assert from 'node:assert/strict';
import {compose,message,local} from '../src/summaries.js';
const rows=[{id:'1',asset:'BTC',side:'buy',quantity:'1',price_usd:'100',fee_amount:'1',traded_at:'2026-01-01'},{id:'2',asset:'BTC',side:'buy',quantity:'1',price_usd:'120',fee_amount:'1',traded_at:'2026-01-02'},{id:'3',asset:'BTC',side:'sell',quantity:'0.5',price_usd:'130',fee_amount:'1',traded_at:'2026-01-03'}];
const snap={quotes:[{asset:'BTC',usd_price:'140',status:'ok'}],fx:{rate:'1.30',stale:false,fetched_at:'2026-11-17T12:00:00Z'}};
test('D8 exact baseline and first day',()=>{const s=compose(rows,snap,{unrealized_usd:'20',realized_cum_usd:'8.50'},'2026-11-17');assert.equal(s.day_pnl_usd,'23.500000000000000000');assert.match(message(s),/\+\$23.50/);const first=compose(rows,snap,null,'2026-11-17');assert.equal(first.day_pnl_usd,null);assert.match(message(first),/首日，无对比/);});
test('D8 bad prices null corresponding preview numbers',()=>{for(const status of ['stale','paused_divergence','unverified']){const s=compose(rows,{...snap,quotes:[{...snap.quotes[0],status}]},null,'2026-11-17');assert.equal(s.data_complete,false);assert.equal(s.total_value_usd,null);assert.equal(s.payload.positions[0].price_usd,null);}});
test('D8 stale FX does not block and local clock uses user zone',()=>{const s=compose(rows,{...snap,fx:{...snap.fx,stale:true}},null,'2026-11-17');assert.equal(s.data_complete,true);assert.match(message(s),/汇率过期/);assert.equal(local(Date.parse('2026-11-17T13:00:00Z'),'Asia/Singapore').hour,21);});
