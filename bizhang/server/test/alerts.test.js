import test from 'node:test';
import assert from 'node:assert/strict';
import { crosses, message } from '../src/alerts.js';
test('inclusive exact decimal thresholds and paused prices', () => {
 for(const direction of ['above','below']) assert.equal(crosses({direction,threshold_usd:'1.000000000000000001'},{status:'ok',usd_price:'1.000000000000000001'}),true);
 for(const status of ['stale','paused_divergence','unverified']) assert.equal(crosses({direction:'above',threshold_usd:'1'},{status,usd_price:'2'}),false);
 assert.equal(crosses({direction:'above',threshold_usd:'1.000000000000000002'},{status:'ok',usd_price:'1.000000000000000001'}),false);
});
test('message captures SGD/source/SGT and stale exchange wording',()=>{
 const e={asset:'BTC',direction:'below',threshold_usd:'92000',price_usd:'91842',price_sgd:'120497',price_source:'binance',ref_source:'kraken',price_ts:'2026-11-15T06:32:10Z'};
 assert.equal(message(e),'🔔 价格提醒：BTC 跌破 $92,000.00 / 现价 $91,842.00（约 S$120,497.00）/ 来源：Binance（USDT/USD：Kraken）· 2026-11-15 14:32:10 SGT / 该提醒已触发并自动停用，回到 App 可重新开启。');
 assert.match(message({...e,price_sgd:null}),/（SGD 汇率过期，未换算）/);
});
test('SGD price rounding follows unit-price precision, including zero conversion',()=>{
 const e={asset:'DOGE',direction:'above',threshold_usd:'0.1',price_usd:'0.12505',price_sgd:'0.162565',price_source:'kraken',price_ts:'2026-11-15T06:32:10Z'};
 assert.match(message(e),/现价 \$0.1251（约 S\$0.1626）/);
 assert.match(message({...e,price_sgd:'0.000000000000000000'}),/约 S\$0.0000/);
});
import { Market } from '../src/market.js';
test('actual collector evaluates only after Binance refresh',async()=>{
 const calls=[];
 const market=new Market({query:async()=>({rows:[]})},{afterBinance:async()=>calls.push('evaluate')});
 market.assets=[];market.request=async()=>[];market.refresh=async()=>calls.push('refresh');
 await market.collect('binance');assert.deepEqual(calls,['refresh','evaluate']);
 calls.length=0;market.request=async()=>({error:[],result:{}});await market.collect('kraken');assert.deepEqual(calls,['refresh']);
});
