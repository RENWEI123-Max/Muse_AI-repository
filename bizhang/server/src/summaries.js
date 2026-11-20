import { begin, release, exclusive } from './transactions.js';
import { portfolio } from './ledger.js';
import { money } from './alerts.js';
const S=10n**18n;
const num=x=>{const s=String(x),[a,b='']=s.replace('-','').split('.');return (BigInt(a)*S+BigInt(b.padEnd(18,'0')))*(s.startsWith('-')?-1n:1n)};
const str=x=>`${x<0n?'-':''}${(x<0n?-x:x)/S}.${((x<0n?-x:x)%S).toString().padStart(18,'0')}`;
const time=x=>x?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Singapore',hour:'2-digit',minute:'2-digit'}).format(new Date(x)):'未知';
const cash=x=>`${num(x)<0n?'-':''}${money(str(num(x)<0n?-num(x):num(x)),true)}`;
const signed=(x,ccy)=>`${num(x)<0n?'-':'+'}${ccy}${cash(str(num(x)<0n?-num(x):num(x)))}`;
export function local(now,zone){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23',minute:'2-digit',second:'2-digit'}).formatToParts(new Date(now));const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));return {date:`${o.year}-${o.month}-${o.day}`,hour:Number(o.hour),offset:Date.UTC(+o.year,+o.month-1,+o.day,+o.hour,+o.minute,+o.second)-Math.floor(+new Date(now)/1000)*1000};}
export function compose(rows,snapshot,baseline,date){
 const p=portfolio(rows,snapshot),complete=p.positions.every(x=>x.price_status==='ok'&&x.market_value);
 const positions=p.positions.map(x=>{const q=snapshot.quotes.find(q=>q.asset===x.asset);return {asset:x.asset,quantity:x.quantity,price_status:x.price_status,price_usd:x.price_status==='ok'?q?.usd_price:null,market_value_usd:x.price_status==='ok'?x.market_value?.usd:null,unrealized_usd:x.price_status==='ok'?x.unrealized?.usd:null};});
 const unreal=complete?p.total_unrealized.usd:null,real=p.total_realized.usd,fx=snapshot.fx;
 const day=complete&&baseline?str(num(unreal)+num(real)-num(baseline.unrealized_usd)-num(baseline.realized_cum_usd)):null;
 return {summary_date:date,total_value_usd:complete?p.total_value.usd:null,unrealized_usd:unreal,realized_cum_usd:real,day_pnl_usd:day,day_pnl_sgd:day!==null&&fx?.rate?str(num(day)*num(fx.rate)/S):null,usd_sgd_rate:fx?.rate??null,fx_ts:fx?.source_ts??fx?.fetched_at??null,fx_stale:fx?.stale??true,data_complete:complete,payload:{positions}};
}
export function message(s){
 const stale=s.fx_stale?`（汇率过期，最后更新 ${time(s.fx_ts)}）`:'';
 return `📊 每日汇总（${s.summary_date}）\n${s.day_pnl_usd===null?'当日盈亏：首日，无对比':`当日盈亏 ${signed(s.day_pnl_usd,'$')}（约 ${s.day_pnl_sgd===null?'SGD 不可用':signed(s.day_pnl_sgd,'S$')}${stale}）`}\n持仓总市值 $${cash(s.total_value_usd)} · 未实现 $${cash(s.unrealized_usd)} · 累计已实现 $${cash(s.realized_cum_usd)}\n${s.payload.positions.map(p=>`${p.asset} ${p.quantity.replace(/\.?0+$/,'')} · 现价 $${cash(p.price_usd)} · 市值 $${cash(p.market_value_usd)}`).join('\n')}\n汇率 ${s.usd_sgd_rate??'不可用'}（${time(s.fx_ts)} SGT）${s.day_pnl_usd===null?stale:''}`;
}
async function current(c,market,uid,date){const rows=(await c.query('SELECT * FROM transactions WHERE user_id=$1 AND deleted_at IS NULL ORDER BY asset,traded_at,id',[uid])).rows;const base=(await c.query("SELECT * FROM daily_summaries WHERE user_id=$1 AND status='sent' AND summary_date<$2 ORDER BY summary_date DESC LIMIT 1",[uid,date])).rows[0];return compose(rows,await market.quotes(c),base,date);}
export async function summary(pool,market,req,now=Date.now()){
 if(req.url.split('?')[0].endsWith('/latest'))return {summary:(await pool.query('SELECT *,summary_date::text FROM daily_summaries WHERE user_id=$1 ORDER BY daily_summaries.summary_date DESC LIMIT 1',[req.bzUser.id])).rows[0]??null};
 const c=await pool.connect();try{return {summary:await current(c,market,req.bzUser.id,local(now,req.bzUser.timezone).date)};}finally{await release(c);}
}
export async function schedule(pool,market,now=Date.now()){
 return exclusive(pool, 'summary', () => scheduleOnce(pool,market,now));
}
async function scheduleOnce(pool,market,now){
 const users=(await pool.query('SELECT id,timezone FROM users WHERE daily_summary_enabled=true')).rows;
 for(const u of users){const c=await pool.connect();try{
 await begin(c);await c.query('SELECT pg_advisory_xact_lock($1::bigint)',[u.id]);
 const l=local(now,u.timezone);
 const old=(await c.query("SELECT *,summary_date::text FROM daily_summaries WHERE user_id=$1 AND status='deferred' ORDER BY daily_summaries.summary_date LIMIT 1",[u.id])).rows[0];
 const date=old?.summary_date??l.date;
 if(!old&&l.hour<21){await c.query('COMMIT');continue;}
 const end=old?.window_end??new Date(Date.parse(date+'T21:00:00Z')-l.offset);
 const deadline=+new Date(end)+7200000;
 await c.query("INSERT INTO daily_summaries(user_id,summary_date,status,window_start,window_end) VALUES($1,$2,'deferred',$3,$4) ON CONFLICT DO NOTHING",[u.id,date,new Date(+new Date(end)-86400000),end]);
 const r=(await c.query('SELECT * FROM daily_summaries WHERE user_id=$1 AND summary_date=$2 FOR UPDATE',[u.id,date])).rows[0];
 if(r.status!=='deferred'||(r.next_retry_at&&+new Date(r.next_retry_at)>now&&now<deadline)){await c.query('COMMIT');continue;}
 const s=await current(c,market,u.id,date);let text,kind;
 if(!s.data_complete&&now<deadline){await c.query('UPDATE daily_summaries SET next_retry_at=$2 WHERE id=$1',[r.id,new Date(now+900000)]);await c.query('COMMIT');continue;}
 if(!s.data_complete||now>=deadline){const reasons=s.payload.positions.filter(p=>p.price_status!=='ok').map(p=>p.asset+' '+p.price_status).join('、');text='每日汇总暂缓：'+(reasons||'生成超时');kind='daily_summary_deferred';await c.query("UPDATE daily_summaries SET status='skipped_stale' WHERE id=$1",[r.id]);}
 else {text=message(s);s.payload.text=text;s.payload.day_pnl_sgd=s.day_pnl_sgd;kind='daily_summary';const keys=['total_value_usd','unrealized_usd','realized_cum_usd','day_pnl_usd','usd_sgd_rate','fx_ts','fx_stale','payload'];await c.query(`UPDATE daily_summaries SET status='sent',${keys.map((k,i)=>k+'=$'+(i+2)).join(',')} WHERE id=$1`,[r.id,...keys.map(k=>s[k])]);}
 const binding=(await c.query("SELECT chat_id FROM telegram_bindings WHERE user_id=$1 AND status='bound'",[u.id])).rows[0];
 await c.query('INSERT INTO telegram_outbox(user_id,chat_id,kind,ref_id,dedupe_key,text,status,next_attempt_at,last_error) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(dedupe_key) DO NOTHING',[u.id,binding?.chat_id,kind,r.id,`summary:${u.id}:${date}`,text,binding?'pending':'failed',new Date(now),binding?null:'TELEGRAM_NOT_BOUND']);await c.query('COMMIT');
 }catch(e){throw e;}finally{await release(c);}}
}
