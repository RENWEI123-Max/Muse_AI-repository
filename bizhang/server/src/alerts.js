import { begin, release, exclusive } from './transactions.js';
import { decimal, multiply, status } from './market.js';

export class AlertError extends Error {
  constructor(status, code) { super(code); Object.assign(this, { status, code, detail: {} }); }
}
const invalid = code => { throw new AlertError(422, code); };
const jsonRule = r => ({ ...r, id: String(r.id), generation: String(r.generation), version: String(r.version) });
export function crosses(rule, quote) {
  if (quote?.status !== 'ok' || !quote.usd_price) return false;
  return rule.direction === 'above' ? decimal(quote.usd_price) >= decimal(rule.threshold_usd) : decimal(quote.usd_price) <= decimal(rule.threshold_usd);
}
export const money = (value, fixed = false) => {
  const n = /^0(\.0+)?$/.test(String(value)) ? 0n : decimal(value), unit = fixed || n >= 10n ** 18n ? 100n : 10000n;
  const rounded = (n * unit + 5n * 10n ** 17n) / (10n ** 18n);
  const digits = unit === 100n ? 2 : 4;
  return (rounded / unit).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + (rounded % unit).toString().padStart(digits, '0');
};
export function message(e) {
  const date = new Date(new Date(e.price_ts).getTime() + 8 * 3600000).toISOString().slice(0,19).replace('T',' ');
  const source = e.price_source === 'binance' ? 'Binance' : 'Kraken';
  return `🔔 价格提醒：${e.asset} ${e.direction === 'above' ? '突破' : '跌破'} $${money(e.threshold_usd)} / 现价 $${money(e.price_usd)}${e.price_sgd ? `（约 S$${money(e.price_sgd)}）` : '（SGD 汇率过期，未换算）'}/ 来源：${source}${e.ref_source ? '（USDT/USD：Kraken）' : ''}· ${date} SGT / 该提醒已触发并自动停用，回到 App 可重新开启。`;
}
// Read inside the caller's transaction; recompute freshness rather than trusting stored status.
async function snapshot(c) {
  const rows = (await c.query('SELECT * FROM price_cache')).rows;
  const now = Date.now(), ref = rows.find(r => r.asset === 'USDT');
  const fx = (await c.query("SELECT * FROM reference_rates WHERE pair='USD/SGD' ORDER BY fetched_at DESC,id DESC LIMIT 1")).rows[0];
  const ts = fx?.source_ts ?? fx?.fetched_at;
  return { quotes: rows.map(r => ({ ...r, status: status(r,ref,now) })), fx, fxFresh: !!ts && now - +new Date(ts) <= 7200000 && +new Date(ts) <= now };
}
async function trigger(c, r, s, kind) {
  const q = s.quotes.find(q => q.asset === r.asset);
  if (!crosses(r,q)) return false;
  const fx = s.fx;
  const e = (await c.query(`INSERT INTO alert_events(rule_id,user_id,generation,trigger_kind,triggered_at,direction,threshold_usd,price_usd,price_source,price_ts,ref_source,ref_rate,ref_ts,usd_sgd_rate,fx_ts,price_sgd)
    VALUES($1,$2,$3,$4,now(),$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT(rule_id,generation) DO NOTHING RETURNING *`,
    [r.id,r.user_id,r.generation,kind,r.direction,r.threshold_usd,q.usd_price,q.raw_source,q.raw_source_ts,q.ref_source,q.ref_rate,q.ref_ts,fx?.rate,fx?.source_ts??fx?.fetched_at,s.fxFresh ? multiply(q.usd_price,fx.rate):null])).rows[0];
  if (!e) return false;
  const binding = (await c.query("SELECT chat_id FROM telegram_bindings WHERE user_id=$1 AND status='bound'",[r.user_id])).rows[0];
  await c.query(`INSERT INTO telegram_outbox(user_id,chat_id,kind,ref_id,dedupe_key,text,status,next_attempt_at,last_error) VALUES($1,$2,'alert',$3,$4,$5,$6,now()+interval '2 seconds',$7)`,
    [r.user_id,binding?.chat_id,e.id,`alert:${e.id}`,message({...e,asset:r.asset}),binding?'pending':'failed',binding?null:'TELEGRAM_NOT_BOUND']);
  await c.query("UPDATE alert_rules SET state='disabled',disabled_reason='triggered',last_triggered_at=now(),version=version+1,updated_at=now() WHERE id=$1",[r.id]);
  return true;
}
export async function evaluateAlerts(pool) {
  return exclusive(pool, 'alerts', () => evaluateOnce(pool));
}
async function evaluateOnce(pool) {
  const c = await pool.connect();
  try {
    await begin(c);
    const rules = (await c.query("SELECT * FROM alert_rules WHERE state='active' AND deleted_at IS NULL ORDER BY id FOR UPDATE SKIP LOCKED")).rows;
    const s = await snapshot(c);
    for (const r of rules) await trigger(c,r,s, r.generation > 1 ? 'on_restart' : 'reached');
    await c.query('COMMIT');
  } catch(e) { throw e; } finally { await release(c); }
}
export async function alerts(pool, req) {
  const uid = req.bzUser.id, c = await pool.connect();
  try {
    await begin(c);
    await c.query('SELECT pg_advisory_xact_lock($1::bigint)',[uid]);
    let result;
    if (req.method === 'GET' && req.url.split('?')[0].endsWith('/events')) {
      if (req.query.limit && !/^\d+$/.test(req.query.limit)) invalid('INVALID_PAGINATION');
      const limit = Math.min(100,Math.max(1,Number(req.query.limit??50)));
      const events = (await c.query(`SELECT e.*,r.asset,o.status AS delivery_status,o.last_error,o.attempts FROM alert_events e JOIN alert_rules r ON r.id=e.rule_id LEFT JOIN telegram_outbox o ON o.dedupe_key='alert:'||e.id::text WHERE e.user_id=$1 ORDER BY e.id DESC LIMIT $2`,[uid,limit])).rows.map(e=>({...e,generation:String(e.generation),attempts:String(e.attempts??0)}));
      result = {events};
    } else if (req.method === 'GET') {
      const s = await snapshot(c);
      const rules = (await c.query('SELECT * FROM alert_rules WHERE user_id=$1 AND deleted_at IS NULL ORDER BY id',[uid])).rows;
      result = {alerts:rules.map(r=>{ const q=s.quotes.find(q=>q.asset===r.asset); return {...jsonRule(r),current_price_usd:q?.usd_price??null,price_status:q?.status??'stale',alerts_paused:q?.status!=='ok'}; })};
    } else if (req.method === 'POST') {
      const key = req.headers['idempotency-key'];
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key??'')) invalid('INVALID_IDEMPOTENCY_KEY');
      const saved = (await c.query('SELECT response FROM alert_requests WHERE user_id=$1 AND idempotency_key=$2',[uid,key])).rows[0];
      if (saved) { await c.query('COMMIT'); return saved.response; }
      const b=req.body;
      validateRule(b);
      if (!(await c.query('SELECT 1 FROM assets WHERE symbol=$1',[b.asset])).rowCount) invalid('INVALID_ASSET');
      if (Number((await c.query('SELECT count(*) FROM alert_rules WHERE user_id=$1 AND deleted_at IS NULL',[uid])).rows[0].count)>=50) throw new AlertError(409,'ALERT_LIMIT');
      let r=(await c.query("INSERT INTO alert_rules(user_id,asset,direction,threshold_usd,state) VALUES($1,$2,$3,$4,'active') RETURNING *",[uid,b.asset,b.direction,b.threshold_usd])).rows[0];
      const immediate=await trigger(c,r,await snapshot(c),'on_create');
      r=(await c.query('SELECT * FROM alert_rules WHERE id=$1',[r.id])).rows[0];
      result={alert:jsonRule(r),triggered_immediately:immediate,server_time:new Date().toISOString()};
      await c.query('INSERT INTO alert_requests VALUES($1,$2,$3)',[uid,key,result]);
    } else {
      if (!/^\d+$/.test(req.params.id)) throw new AlertError(404,'NOT_FOUND');
      const r=(await c.query('SELECT * FROM alert_rules WHERE user_id=$1 AND id=$2 AND deleted_at IS NULL FOR UPDATE',[uid,req.params.id])).rows[0];
      if (!r) throw new AlertError(404,'NOT_FOUND');
      if (req.method==='DELETE') { await c.query('UPDATE alert_rules SET deleted_at=now(),version=version+1,updated_at=now() WHERE id=$1',[r.id]); result={ok:true}; }
      else {
        if (req.headers['if-match']!==String(r.version)) throw new AlertError(412,'VERSION_CONFLICT');
        const b=req.body;
        if (!b || Array.isArray(b) || Object.keys(b).some(k=>!['enabled','direction','threshold_usd'].includes(k)) || !Object.keys(b).length || ('enabled' in b && typeof b.enabled!=='boolean')) invalid('INVALID_ALERT');
        validateRule({...r,...b});
        const restart=b.enabled===true || 'direction' in b || 'threshold_usd' in b;
        const next=(await c.query(`UPDATE alert_rules SET direction=$2,threshold_usd=$3,state=$4,disabled_reason=$5,generation=generation+$6,version=version+1,updated_at=now() WHERE id=$1 RETURNING *`,[r.id,b.direction??r.direction,b.threshold_usd??r.threshold_usd,restart?'active':'disabled',restart?null:'manual',restart?1:0])).rows[0];
        result={alert:jsonRule(next)};
      }
    }
    await c.query('COMMIT'); return {...result,server_time:result.server_time??new Date().toISOString()};
  } catch(e) { throw e; } finally { await release(c); }
}
function validateRule(b) {
  if (!b || typeof b.asset!=='string' || !['above','below'].includes(b.direction) || typeof b.threshold_usd!=='string' || !/^(0|[1-9]\d{0,19})(\.\d{1,18})?$/.test(b.threshold_usd)) invalid('INVALID_ALERT');
  try { decimal(b.threshold_usd); } catch { invalid('INVALID_DECIMAL'); }
}
