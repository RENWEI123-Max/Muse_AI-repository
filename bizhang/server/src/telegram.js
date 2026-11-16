import { randomBytes, randomUUID } from 'node:crypto';
import { tokenHash } from './password.js';
export const RETRY_MS = [2000,8000,30000,120000,600000];
const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));

// No URL, body, token or upstream error text escapes this transport.
export class BotTransport {
  constructor({fetcher=fetch}={}) { this.fetcher=fetcher; }
  async call(method, body) {
    const token=process.env.BIZHANG_TELEGRAM_BOT_TOKEN;
    if (!token) throw Object.assign(new Error('TELEGRAM_NOT_CONFIGURED'),{safeCode:'TELEGRAM_NOT_CONFIGURED'});
    try {
      const response=await this.fetcher(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(method==='getUpdates'?35000:10000)});
      const data=await response.json();
      if (!response.ok || !data.ok) throw { status:response.status===429?429:data.error_code, retry_after:data.parameters?.retry_after };
      return data.result;
    } catch(e) {
      throw Object.assign(new Error('TELEGRAM_REQUEST_FAILED'),{safeCode:'TELEGRAM_REQUEST_FAILED',status:e.status,retry_after:e.retry_after});
    }
  }
  sendMessage(chat_id,text) { return this.call('sendMessage',{chat_id,text}); }
  getUpdates(offset) { return this.call('getUpdates',{offset,timeout:30,allowed_updates:['message']}); }
}
export async function binding(pool, req) {
  const uid=req.bzUser.id,c=await pool.connect();
  try {
    await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock($1::bigint)',[uid]);
    let result;
    if(req.method==='GET') {
      const r=(await c.query('SELECT status,chat_id FROM telegram_bindings WHERE user_id=$1',[uid])).rows[0];
      result={bound:r?.status==='bound',status:r?.status??'revoked',chat_id_last4:r?.status==='bound'?String(r.chat_id).slice(-4):null};
    } else if(req.method==='DELETE') {
      await c.query("UPDATE telegram_bindings SET status='revoked',chat_id=NULL,bind_token_hash=NULL,bind_token_expires_at=NULL,revoked_at=now(),updated_at=now() WHERE user_id=$1",[uid]);
      await c.query("UPDATE telegram_outbox SET status='failed',last_error='TELEGRAM_UNBOUND',lease_id=NULL WHERE user_id=$1 AND status IN ('pending','sending')",[uid]);
      result={ok:true};
    } else {
      const token=randomBytes(32).toString('hex');
      const r=(await c.query(`INSERT INTO telegram_bindings(user_id,status,bind_token_hash,bind_token_expires_at) VALUES($1,'pending',$2,now()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE SET bind_token_hash=excluded.bind_token_hash,bind_token_expires_at=excluded.bind_token_expires_at,updated_at=now() RETURNING bind_token_expires_at`,[uid,tokenHash(token)])).rows[0];
      const bot=process.env.BIZHANG_TELEGRAM_BOT_USERNAME;
      const configured=typeof bot==='string' && /^[A-Za-z0-9_]{5,32}$/.test(bot);
      result={token,bot_configured:configured,bind_url:configured?`https://t.me/${bot}?start=${token}`:token,expires_at:r.bind_token_expires_at};
    }
    await c.query('COMMIT');return {...result,server_time:new Date().toISOString()};
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
export class TelegramWorker {
  constructor(pool,transport,{now=Date.now,sleep:wait=sleep}={}) { Object.assign(this,{pool,transport,now,sleep:wait});this.stopped=false; }
  async recover() {
    await this.pool.query("UPDATE telegram_outbox SET status='pending',next_attempt_at=now(),lease_id=NULL,sending_at=NULL WHERE id IN (SELECT id FROM telegram_outbox WHERE status='sending' AND sending_at<now()-interval '60 seconds' FOR UPDATE SKIP LOCKED)");
  }
  async runOnce() {
    await this.recover();
    const c=await this.pool.connect();let chat,locked=false;
    try {
      await c.query('BEGIN');
      const r=(await c.query("SELECT * FROM telegram_outbox WHERE status='pending' AND next_attempt_at<=$1 ORDER BY next_attempt_at,id FOR UPDATE SKIP LOCKED LIMIT 1",[new Date(this.now())])).rows[0];
      if(!r){await c.query('COMMIT');return false;}
      chat=String(r.chat_id);
      locked=(await c.query("SELECT pg_try_advisory_lock(hashtextextended($1,17)) AS locked",['bizhang-telegram:'+chat])).rows[0].locked;
      if(!locked){await c.query('ROLLBACK');return false;}
      const slot=(await c.query('SELECT next_send_at FROM telegram_chat_slots WHERE chat_id=$1',[r.chat_id])).rows[0];
      if(slot && +new Date(slot.next_send_at)>this.now()) {
        await c.query('UPDATE telegram_outbox SET next_attempt_at=$2 WHERE id=$1',[r.id,slot.next_send_at]);
        await c.query('COMMIT');return true;
      }
      const lease=randomUUID();
      await c.query("UPDATE telegram_outbox SET status='sending',sending_at=now(),lease_id=$2 WHERE id=$1",[r.id,lease]);
      await c.query('COMMIT');
      await c.query('BEGIN');
      // Lock binding through delivery: after unbind commits no send can start for this chat.
      const allowed=(await c.query("SELECT 1 FROM telegram_bindings WHERE user_id=$1 AND chat_id=$2 AND status='bound' FOR SHARE",[r.user_id,r.chat_id])).rowCount;
      if(!allowed){await c.query("UPDATE telegram_outbox SET status='failed',last_error='TELEGRAM_UNBOUND',lease_id=NULL WHERE id=$1 AND lease_id=$2",[r.id,lease]);await c.query('COMMIT');return true;}
      const owned=(await c.query('SELECT id FROM telegram_outbox WHERE id=$1 AND lease_id=$2 FOR UPDATE',[r.id,lease])).rowCount;
      if(!owned){await c.query('COMMIT');return true;}
      await c.query(`INSERT INTO telegram_chat_slots(chat_id,next_send_at) VALUES($1,$2) ON CONFLICT(chat_id) DO UPDATE SET next_send_at=excluded.next_send_at`,[r.chat_id,new Date(this.now()+1000)]);
      try {
        const sent=await this.transport.sendMessage(r.chat_id,r.text);
        await c.query("UPDATE telegram_outbox SET status='sent',attempts=attempts+1,sent_at=now(),telegram_message_id=$3,last_error=NULL,lease_id=NULL WHERE id=$1 AND lease_id=$2",[r.id,lease,String(sent.message_id)]);
      }catch(e){
        const attempts=r.attempts+1;
        const retryAfter=Number(e.retry_after);
        const wait=e.status===429 && Number.isFinite(retryAfter) && retryAfter>=0 ? retryAfter*1000 : RETRY_MS[Math.min(attempts,4)];
        const next=this.now()+wait;
        if(e.status===429) await c.query('UPDATE telegram_chat_slots SET next_send_at=GREATEST(next_send_at,$2) WHERE chat_id=$1',[r.chat_id,new Date(next)]);
        await c.query("UPDATE telegram_outbox SET status=$3,attempts=$4,next_attempt_at=$5,last_error=$6,lease_id=NULL WHERE id=$1 AND lease_id=$2",[r.id,lease,attempts>=r.max_attempts?'failed':'pending',attempts,new Date(next),e.status===429?'TELEGRAM_RATE_LIMITED':['TELEGRAM_NOT_CONFIGURED','TELEGRAM_REQUEST_FAILED'].includes(e.safeCode)?e.safeCode:'TELEGRAM_SEND_FAILED']);
      }
      await c.query('COMMIT');return true;
    }catch(e){await c.query('ROLLBACK');throw e;}finally{
      if(locked) await c.query('SELECT pg_advisory_unlock(hashtextextended($1,17))',['bizhang-telegram:'+chat]);
      c.release();
    }
  }
  async run() {while(!this.stopped){try{await this.runOnce();}catch{/* never log transport errors */}await this.sleep(250);}}
  stop(){this.stopped=true;}
}
// Update processing and offset commit atomically; duplicate /start cannot enqueue a second reply.
export async function processUpdate(c,update) {
  const m=update.message,match=m?.text?.match(/^\/start ([a-f0-9]{64})$/);
  if(!match || m.chat?.type!=='private' || !Number.isSafeInteger(m.chat.id))return;
  const hash=tokenHash(match[1]);
  const r=(await c.query('SELECT * FROM telegram_bindings WHERE bind_token_hash=$1 AND bind_token_expires_at>now() FOR UPDATE',[hash])).rows[0];
  if(!r)return;
  const chat=String(m.chat.id);
  if((await c.query("SELECT 1 FROM telegram_bindings WHERE chat_id=$1 AND user_id<>$2",[chat,r.user_id])).rowCount)return;
  await c.query("UPDATE telegram_bindings SET status='bound',chat_id=$2,bind_token_hash=NULL,bind_token_expires_at=NULL,tg_username=$3,bound_at=now(),revoked_at=NULL,updated_at=now() WHERE id=$1",[r.id,chat,m.from?.username??null]);
  await c.query("INSERT INTO telegram_outbox(user_id,chat_id,kind,ref_id,dedupe_key,text,status,next_attempt_at) VALUES($1,$2,'bind_ok',$3,$4,'绑定成功','pending',now()) ON CONFLICT(dedupe_key) DO NOTHING",[r.user_id,chat,r.id,`bind:${hash.toString('hex')}`]);
}
export class TelegramPoller {
  constructor(pool,transport,{sleep:wait=sleep}={}){Object.assign(this,{pool,transport,sleep:wait});this.stopped=false;}
  async pollOnce(){
    const c=await this.pool.connect();let locked=false;
    try{
      locked=(await c.query('SELECT pg_try_advisory_lock(727074707) AS locked')).rows[0].locked;
      if(!locked)return;
      const offset=(await c.query('SELECT next_offset FROM telegram_poll_state WHERE id=1')).rows[0].next_offset;
      const updates=await this.transport.getUpdates(Number(offset));
      for(const update of updates){
        if(!Number.isSafeInteger(update.update_id)||BigInt(update.update_id)<BigInt(offset))continue;
        await c.query('BEGIN');
        await processUpdate(c,update);
        await c.query('UPDATE telegram_poll_state SET next_offset=GREATEST(next_offset,$1) WHERE id=1',[String(update.update_id+1)]);
        await c.query('COMMIT');
      }
    }catch(e){await c.query('ROLLBACK');throw e;}finally{if(locked)await c.query('SELECT pg_advisory_unlock(727074707)');c.release();}
  }
  async run(){let failures=0;while(!this.stopped){try{await this.pollOnce();failures=0;await this.sleep(100);}catch{await this.sleep([5000,10000,30000,60000][Math.min(failures++,3)]);}}}
  stop(){this.stopped=true;}
}
