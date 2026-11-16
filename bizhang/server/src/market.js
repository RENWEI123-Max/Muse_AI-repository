// Fixed point arithmetic: never convert a monetary input through Number.
const SCALE = 10n ** 18n;
export function decimal(value) {
  const s = String(value);
  if (!/^\d+(\.\d{1,18})?$/.test(s)) throw Error('Invalid positive decimal');
  const [whole, fraction = ''] = s.split('.');
  const n = BigInt(whole) * SCALE + BigInt(fraction.padEnd(18, '0'));
  if (n <= 0n || n >= 10n ** 38n) throw Error('Decimal out of range');
  return n;
}
export const format = n => `${n / SCALE}.${(n % SCALE).toString().padStart(18, '0')}`;
export const multiply = (a, b) => format(decimal(a) * decimal(b) / SCALE);
const age = (now, ts, seconds) => !ts || now - new Date(ts).getTime() > seconds * 1000 || new Date(ts).getTime() > now;
export function status(row, reference, now = Date.now()) {
  if (age(now, row.raw_source_ts, row.raw_source === 'binance' ? 120 : 180) ||
      (row.raw_source === 'binance' && age(now, row.ref_ts, 180))) return 'stale';
  if (row.paused_since || (row.raw_source === 'binance' && reference?.paused_since)) return 'paused_divergence';
  if (age(now, row.last_pass_at, 1800) || (row.raw_source === 'binance' && age(now, reference?.last_pass_at, 1800))) return 'unverified';
  return 'ok';
}
export function validate(row, primary, backup, now) {
  if (!primary || age(now, backup.ts, 900) || Math.abs(new Date(primary.ts) - new Date(backup.ts)) > 120000) return { ...row, consecutive_pass: 0 };
  const p = decimal(primary.price), b = decimal(backup.price);
  const difference = p > b ? p - b : b - p;
  const failed = difference * 1000n > b * (['USDT','USDC'].includes(row.asset) ? 5n : 20n);
  const passes = failed ? 0 : row.consecutive_pass + 1;
  return { ...row, last_check_at: new Date(now), last_check_diff_pct: format(difference * 100n * SCALE / b),
    consecutive_pass: passes, last_pass_at: failed ? row.last_pass_at : new Date(now),
    paused_since: failed ? row.paused_since || new Date(now) : passes >= 2 ? null : row.paused_since };
}
export class Market {
  constructor(pool, { fetcher = fetch, now = Date.now, sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
    Object.assign(this, { pool, fetcher, now, sleep }); this.stopped = false; this.jobs = [];
  }
  async request(url, timeout, counted = false, retry = false) {
    if (counted) {
      const result = await this.pool.query(`INSERT INTO market_budget(month,calls) VALUES(date_trunc('month',now())::date,1) ON CONFLICT(month) DO UPDATE SET calls=market_budget.calls+1 WHERE NOT $1 OR market_budget.calls<6000 RETURNING calls`, [retry]);
      if (!result.rowCount) throw Error('Retry budget exhausted');
    }
    const response = await this.fetcher(url, { signal: AbortSignal.timeout(timeout) });
    if (!response.ok) { const e = Error('Source HTTP failure'); e.status = response.status; throw e; }
    return response.json();
  }
  async tick(source, asset, price, ts, quote = 'USD') {
    decimal(price);
    if (age(this.now(), ts, source === 'coingecko' ? 900 : source === 'binance' ? 120 : 180)) return;
    await this.pool.query('INSERT INTO price_ticks(source,asset,price,quote_ccy,source_ts,fetched_at) VALUES($1,$2,$3,$4,$5,$6)', [source, asset, price, quote, ts, new Date(this.now())]);
  }
  async collect(source) {
    const now = new Date(this.now());
    if (source === 'binance') {
      const symbols = this.assets.filter(a => a.binance_symbol).map(a => a.binance_symbol);
      const data = await this.request('https://api.binance.com/api/v3/ticker/24hr?symbols=' + encodeURIComponent(JSON.stringify(symbols)), 5000);
      for (const a of this.assets.filter(a => a.binance_symbol)) {
        const item = data.find(x => x.symbol === a.binance_symbol);
        if (!item) continue;
        await this.tick(source, a.symbol, item.lastPrice, new Date(item.closeTime), 'USDT');
        await this.pool.query('UPDATE price_cache SET change_24h_pct=$2 WHERE asset=$1', [a.symbol, item.priceChangePercent]);
      }
    } else if (source === 'kraken') {
      const data = await this.request('https://api.kraken.com/0/public/Ticker?pair=USDTZUSD,USDCUSD', 5000);
      if (data.error?.length) throw Error('Kraken error');
      for (const a of this.assets.filter(a => a.kraken_pair)) {
        const price = data.result[a.kraken_pair]?.c?.[0];
        await this.tick(source, a.symbol, price, now);
        await this.pool.query('INSERT INTO reference_rates(pair,rate,source,fetched_at) VALUES($1,$2,$3,$4)', [a.symbol + '/USD', price, source, now]);
      }
    } else {
      const data = await this.request('https://api.coingecko.com/api/v3/simple/price?ids=' + this.assets.map(a => a.coingecko_id).join(',') + '&vs_currencies=usd&include_last_updated_at=true', 10000, true, this.cgRetry);
      for (const a of this.assets) {
        const item = data[a.coingecko_id];
        if (!item || !item.last_updated_at) continue;
        const backup = {price: String(item.usd), ts: new Date(item.last_updated_at * 1000)};
        await this.tick(source, a.symbol, backup.price, backup.ts);
        const primary = (await this.pool.query(`SELECT price,source_ts AS ts FROM price_ticks WHERE asset=$1 AND source=$2 AND quote_ccy='USD' AND abs(extract(epoch FROM source_ts-$3::timestamptz))<=120 ORDER BY abs(extract(epoch FROM source_ts-$3::timestamptz)),id DESC LIMIT 1`, [a.symbol, a.binance_symbol ? 'binance' : 'kraken', backup.ts])).rows[0];
        const row = (await this.pool.query('SELECT * FROM price_cache WHERE asset=$1', [a.symbol])).rows[0];
        const checked = validate(row, primary, backup, this.now());
        await this.pool.query('UPDATE price_cache SET last_check_at=$2,last_check_diff_pct=$3,consecutive_pass=$4,last_pass_at=$5,paused_since=$6 WHERE asset=$1', [a.symbol, checked.last_check_at, checked.last_check_diff_pct, checked.consecutive_pass, checked.last_pass_at, checked.paused_since]);
      }
    }
    await this.refresh();
  }
  async refresh() {
    for (const a of this.assets) {
      const raw = (await this.pool.query(`SELECT * FROM price_ticks WHERE asset=$1 AND source=$2 AND quote_ccy=$3 ORDER BY source_ts DESC,id DESC LIMIT 1`, [a.symbol, a.binance_symbol ? 'binance' : 'kraken', a.binance_symbol ? 'USDT' : 'USD'])).rows[0];
      if (!raw) continue;
      const ref = a.binance_symbol ? (await this.pool.query("SELECT * FROM reference_rates WHERE pair='USDT/USD' ORDER BY fetched_at DESC LIMIT 1")).rows[0] : null;
      if (a.binance_symbol && !ref) continue;
      const price = ref ? multiply(raw.price, ref.rate) : raw.price;
      await this.pool.query(`UPDATE price_cache SET usd_price=$2,raw_price=$3,raw_quote_ccy=$4,raw_source=$5,raw_source_ts=$6,ref_rate=$7,ref_source=$8,ref_ts=$9,updated_at=$10 WHERE asset=$1`, [a.symbol, price, raw.price, raw.quote_ccy, raw.source, raw.source_ts, ref?.rate, ref?.source, ref?.fetched_at, new Date(this.now())]);
      if (ref && !age(this.now(), raw.source_ts,120) && !age(this.now(),ref.fetched_at,180)) await this.tick('binance', a.symbol, price, raw.source_ts);
    }
    const rows = (await this.pool.query('SELECT * FROM price_cache')).rows;
    const reference = rows.find(r => r.asset === 'USDT');
    for (const row of rows) { const s = status(row, reference, this.now()); await this.pool.query('UPDATE price_cache SET status=$2,reason=$2 WHERE asset=$1', [row.asset,s]); }
  }
  async fx() {
    let data, source = 'coinbase', ts = new Date(this.now()), rate;
    for (const delay of [0,60000,300000]) {
      if (delay) await this.sleep(delay);
      if (this.stopped) return;
      try { data = await this.request('https://api.coinbase.com/v2/exchange-rates?currency=USD',10000); rate = data.data.rates.SGD; decimal(rate); break; } catch { rate = null; }
    }
    if (!rate) { data = await this.request('https://open.er-api.com/v6/latest/USD',10000); rate = String(data.rates.SGD); source='open.er-api'; ts = new Date(data.time_last_update_unix*1000); }
    decimal(rate);
    await this.pool.query('INSERT INTO reference_rates(pair,rate,source,source_ts,fetched_at) VALUES($1,$2,$3,$4,$5)', ['USD/SGD',rate,source,source==='coinbase'?null:ts,new Date(this.now())]);
  }
  async quotes() {
    const rows = (await this.pool.query('SELECT a.*,p.* FROM assets a JOIN price_cache p ON p.asset=a.symbol ORDER BY a.display_order')).rows;
    const ref = rows.find(r=>r.asset==='USDT');
    const fx = (await this.pool.query("SELECT rate::text,source,source_ts,fetched_at FROM reference_rates WHERE pair='USD/SGD' ORDER BY fetched_at DESC LIMIT 1")).rows[0];
    return { server_time: new Date(this.now()).toISOString(), fx: {...fx, stale: age(this.now(),fx?.source_ts || fx?.fetched_at,7200)}, quotes: rows.map(r=>({...r, consecutive_pass:String(r.consecutive_pass), display_order:String(r.display_order), status:status(r,ref,this.now()), alerts_paused:status(r,ref,this.now())!=='ok', price_sgd:r.usd_price && fx ? multiply(r.usd_price,fx.rate):null})) };
  }
  async start() {
    this.assets = (await this.pool.query('SELECT * FROM assets ORDER BY display_order')).rows;
    await this.pool.query("INSERT INTO price_cache(asset,status) SELECT symbol,'unverified' FROM assets ON CONFLICT DO NOTHING");
    await this.pool.query('UPDATE price_cache SET last_pass_at=NULL,consecutive_pass=0');
    const schedule = (fn, delay) => { if (!this.stopped) this.jobs.push(setTimeout(fn,delay)); };
    for (const source of ['binance','kraken','coingecko']) {
      let failures=0;
      const run = async () => {
        try { this.cgRetry=false; await this.collect(source); failures=0; }
        catch (e) {
          failures++;
          if (source!=='coingecko' || !e.status || e.status>=500) {
            await this.sleep(source==='coingecko'?60000:2000);
            if (!this.stopped) try { this.cgRetry=source==='coingecko'; await this.collect(source); failures=0; } catch { /* keep last valid samples */ }
          }
        }
        const delays = source==='binance'?[30000,60000,120000,240000,300000]:source==='kraken'?[60000,120000,300000]:[600000];
        schedule(run,delays[Math.min(failures,delays.length-1)]);
      };
      schedule(run, source==='coingecko'?1000:0);
    }
    const fxRun = async()=>{ try {await this.fx();} catch {} const next=new Date(this.now()); next.setUTCHours(next.getUTCHours()+1,2,0,0); schedule(fxRun,next-this.now()); };
    schedule(fxRun,0);
    const maintain=async()=>{try {await this.refresh(); await this.pool.query("DELETE FROM price_ticks WHERE fetched_at<now()-interval '48 hours'; DELETE FROM reference_rates WHERE fetched_at<now()-CASE WHEN pair='USD/SGD' THEN interval '400 days' ELSE interval '48 hours' END");} catch {} schedule(maintain,30000);};
    schedule(maintain,30000);
  }
  stop(){this.stopped=true; for(const job of this.jobs) clearTimeout(job);}
}
