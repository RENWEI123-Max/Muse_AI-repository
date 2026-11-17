import { begin, release } from './transactions.js';
// Exact decimal arithmetic: scale 18, with HALF_EVEN only at division.
const S=10n**18n;
const n=x=>{const [a,b='']=String(x).split('.');return BigInt(a)*S+BigInt((b+'0'.repeat(18)).slice(0,18))*(a.startsWith('-')?-1n:1n)};
const str=x=>`${x<0n?'-':''}${(x<0n?-x:x)/S}.${((x<0n?-x:x)%S).toString().padStart(18,'0')}`;
const div=(a,b)=>{const q=a/b,r=a%b;return q+(r*2n>b||(r*2n===b&&q%2n)?1n:0n)};
export class LedgerError extends Error { constructor(status,code,detail={}){super(code);Object.assign(this,{status,code,detail});} }
const fail=(code,detail={})=>{throw new LedgerError(409,code,detail)};
export function validate(b){
 if(!b||!['BTC','ETH','SOL','USDT','USDC','BNB','XRP','DOGE','ADA','LINK'].includes(b.asset)||!['buy','sell','opening'].includes(b.side)) throw new LedgerError(422,'INVALID_TRANSACTION');
 if((b.fee_currency??'USD')!=='USD')throw new LedgerError(422,'FEE_CURRENCY_UNSUPPORTED');
 const dec=(v,positive=false,scale=8)=>{if(typeof v!=='string'||!new RegExp(`^(0|[1-9][0-9]{0,19})(\\.[0-9]{1,${scale}})?$`).test(v)|| (positive&&n(v)===0n))throw new LedgerError(422,'INVALID_DECIMAL');return v;};
 const t=new Date(b.traded_at);if(!Number.isFinite(+t)||+t%60000)throw new LedgerError(422,'INVALID_DATE');
 if(typeof (b.note??'')!=='string'||[...(b.note??'')].length>200)throw new LedgerError(422,'INVALID_NOTE');
 return {asset:b.asset,side:b.side,traded_at:t.toISOString(),quantity:dec(b.quantity,true),price_usd:b.side==='opening'?null:dec(b.price_usd),opening_cost_usd:b.side==='opening'?dec(b.opening_cost_usd,false,18):null,fee_amount:dec(b.fee_amount??'0'),fee_currency:'USD',note:b.note??''};
}
export function replay(input,code='NEGATIVE_HISTORY'){
 let qty=0n,cost=0n,realized=0n;const rows=[];
 const sorted=[...input].sort((a,b)=>+new Date(a.traded_at)-+new Date(b.traded_at)||(BigInt(a.id)<BigInt(b.id)?-1:1));
 for(const [i,t] of sorted.entries()){
 const q=n(t.quantity),fee=n(t.fee_amount??'0');const before=qty?div(cost*S,qty):0n;let gain=0n;
 if(t.side==='opening'){if(i!==0)fail('INVALID_OPENING',{transaction_id:String(t.id)});qty+=q;cost+=n(t.opening_cost_usd);}
 else if(t.side==='buy'){qty+=q;cost+=q*n(t.price_usd)/S+fee;}
 else {if(q>qty)fail(code,{transaction_id:String(t.id)});const sold=q===qty?cost:div(cost*q,qty);gain=q*n(t.price_usd)/S-fee-sold;realized+=gain;cost-=sold;qty-=q;}
 rows.push({...t,id:String(t.id),version:String(t.version),avg_cost_before_usd:str(before),realized_usd:str(gain),qty_after:str(qty)});
 }
 return {rows,quantity:str(qty),remaining_cost_usd:str(cost),avg_cost_usd:str(qty?div(cost*S,qty):0n),realized_usd:str(realized)};
}
export function portfolio(rows,snapshot){
 const positions=[];let value=0n,unreal=0n,real=0n,complete=true;const rate=snapshot.fx?.rate;const pair=x=>({usd:str(x),sgd:rate?str(x*n(rate)/S):null});
 for(const asset of new Set(rows.map(t=>t.asset))){const r=replay(rows.filter(t=>t.asset===asset));real+=n(r.realized_usd);if(n(r.quantity)===0n)continue;const quote=snapshot.quotes.find(q=>q.asset===asset);const v=quote?.usd_price?n(r.quantity)*n(quote.usd_price)/S:null;const u=v===null?null:v-n(r.remaining_cost_usd);if(v===null||quote.status!=='ok')complete=false;value+=v??0n;unreal+=u??0n;positions.push({asset,...r,rows:undefined,market_value:v===null?null:pair(v),unrealized:u===null?null:pair(u),price_status:quote?.status??'stale'});}
 return {positions,total_value:complete?pair(value):null,total_unrealized:complete?pair(unreal):null,total_realized:pair(real),fx:snapshot.fx,data_complete:complete&&!snapshot.fx?.stale,server_time:snapshot.server_time};
}
export async function ledger(pool,market,req){
 const uid=req.bzUser.id,c=await pool.connect();
 try {await begin(c);await c.query('SELECT pg_advisory_xact_lock($1::bigint)',[uid]);
 const all=(await c.query('SELECT * FROM transactions WHERE user_id=$1 AND deleted_at IS NULL ORDER BY asset,traded_at,id FOR UPDATE',[uid])).rows;
 if(req.method==='GET'){let result;if(req.url.split('?')[0].endsWith('/portfolio'))result=portfolio(all,await market.quotes(c));else {const q=req.query;if(q.before_id&&!/^\d+$/.test(q.before_id)||q.limit&&!/^\d+$/.test(q.limit))throw new LedgerError(422,'INVALID_PAGINATION');const rows=[...new Set(all.map(t=>t.asset))].flatMap(a=>replay(all.filter(t=>t.asset===a)).rows).filter(t=>(!q.asset||t.asset===q.asset)&&(!q.before_id||BigInt(t.id)<BigInt(q.before_id))).sort((a,b)=>BigInt(a.id)>BigInt(b.id)?-1:1);result={transactions:rows.slice(0,Math.min(100,Math.max(1,Number(q.limit??50)))),server_time:new Date().toISOString()};}await c.query('COMMIT');return result;}
 let result;
 if(req.method==='POST'){
 const key=req.headers['idempotency-key'];if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key??''))throw new LedgerError(422,'INVALID_IDEMPOTENCY_KEY');
 const saved=(await c.query('SELECT response FROM transaction_requests WHERE user_id=$1 AND idempotency_key=$2',[uid,key])).rows[0];if(saved){await c.query('COMMIT');return saved.response;}
 const b=validate(req.body),id=(await c.query("SELECT nextval('transactions_id_seq')::text AS id")).rows[0].id;const candidate={...b,id,version:1};replay([...all.filter(t=>t.asset===b.asset),candidate],'OVERSELL');
 const keys=Object.keys(b);result=(await c.query(`INSERT INTO transactions(id,user_id,idempotency_key,${keys.join(',')}) VALUES($1,$2,$3,${keys.map((_,i)=>'$'+(i+4)).join(',')}) RETURNING *`,[id,uid,key,...Object.values(b)])).rows[0];result={transaction:{...result,id:String(result.id),version:String(result.version)},server_time:new Date().toISOString()};await c.query('INSERT INTO transaction_requests VALUES($1,$2,$3)',[uid,key,result]);
 }else {const old=all.find(t=>String(t.id)===req.params.id);if(!old)throw new LedgerError(404,'NOT_FOUND');if(req.headers['if-match']!==String(old.version))throw new LedgerError(412,'VERSION_CONFLICT');const b=req.method==='PUT'?validate(req.body):null;const next=all.filter(t=>t!==old);if(b)next.push({...old,...b});for(const a of new Set([old.asset,b?.asset].filter(Boolean)))replay(next.filter(t=>t.asset===a));if(b){const keys=Object.keys(b);result=(await c.query(`UPDATE transactions SET ${keys.map((k,i)=>`${k}=$${i+3}`).join(',')},version=version+1,updated_at=now() WHERE user_id=$1 AND id=$2 RETURNING *`,[uid,old.id,...Object.values(b)])).rows[0];result={transaction:{...result,version:String(result.version)}};}else {await c.query('UPDATE transactions SET deleted_at=now(),updated_at=now(),version=version+1 WHERE user_id=$1 AND id=$2',[uid,old.id]);result={ok:true};}}
 await c.query('COMMIT');return result;
 }catch(e){throw e;}finally{await release(c);}
}
