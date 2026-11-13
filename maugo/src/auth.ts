import { randomBytes, randomInt, randomUUID, createHash, scryptSync, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { Pool, PoolClient } from 'pg';
import nodemailer from 'nodemailer';
import { createRemoteJWKSet, jwtVerify } from 'jose';
export const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const email = { type: 'string', maxLength: 254, pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' };
const version = { type: 'string', minLength: 1, maxLength: 64, pattern: '\\S' };
const consent = { privacyVersion: version, termsVersion: version };
const password = { type: 'string', minLength: 8, maxLength: 128 };
export type AuthOptions = { sendMail?: (email: string, code: string) => Promise<void> };
const keys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
export function registerAuth(app: FastifyInstance, db: Pool, options: AuthOptions = {}) {
  const fail = (statusCode: number, message: string): never => { throw Object.assign(new Error(message), { statusCode }); };
  async function tx<T>(work: (c: PoolClient) => Promise<T>) { const c = await db.connect(); try { await c.query('BEGIN'); const r = await work(c); await c.query('COMMIT'); return r; } catch(e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); } }
  const body = (properties: object, required: string[]) => ({ body: { type:'object', additionalProperties:false, properties, required } });
  async function limit(ip: string, address: string, action: string, maximum: number) {
    const retry = await tx(async c => {
      let wait = 0;
      for (const key of [`${action}:ip:${ip}`, `${action}:email:${address}`].sort()) {
        await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);
        const r = await c.query(`INSERT INTO auth_limits(key,count,starts_at) VALUES($1,1,NOW()) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN auth_limits.starts_at < NOW()-interval '1 hour' THEN 1 ELSE auth_limits.count+1 END, starts_at=CASE WHEN auth_limits.starts_at < NOW()-interval '1 hour' THEN NOW() ELSE auth_limits.starts_at END RETURNING count, GREATEST(1,ceil(extract(epoch from starts_at+interval '1 hour'-NOW())))::int AS retry`,[key]);
        if(r.rows[0].count > maximum) wait = Math.max(wait,r.rows[0].retry);
      }
      return wait;
    });
    if(retry) throw Object.assign(new Error('Rate limit exceeded'),{statusCode:429,retryAfter:retry});
  }
  app.setErrorHandler((err, _req, reply) => {
    const e = err as Error & {statusCode?:number;retryAfter?:number};
    if(e.retryAfter) reply.header('Retry-After',e.retryAfter);
    const status = e.statusCode ?? 500;
    if(status >= 500) app.log.error({err},'Request failed');
    reply.code(status).send({ message: status === 500 ? 'Internal server error' : e.message, ...(e.retryAfter ? {retryAfter:e.retryAfter}: {}) });
  });
  async function session(c: PoolClient, id: string) {
    const token = randomBytes(32).toString('hex');
    await c.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,NOW()+interval '30 days')",[digest(token),id]);
    return {id,token};
  }
  function strong(p: string) { if(!/[a-zA-Z]/.test(p) || !/[^a-zA-Z]/.test(p)) fail(400,'Password must contain letters and a number or symbol'); }
  app.post<{Body:{email:string;password:string;confirmPassword?:string;privacyVersion:string;termsVersion:string}}>('/auth/signup',{schema:body({email,password,confirmPassword:password,...consent},['email','password','privacyVersion','termsVersion'])},async(req,reply)=>{
    const b=req.body; strong(b.password); if(b.confirmPassword !== undefined && b.password!==b.confirmPassword) fail(400,'Passwords do not match');
    const result=await tx(async c=>{
      const id=randomUUID(),salt=randomBytes(16).toString('hex');
      const r=await c.query('INSERT INTO users(id,email,password_hash,token_hash,privacy_version,terms_version,consented_at) VALUES($1,$2,$3,$4,$5,$6,NOW()) ON CONFLICT(email) DO NOTHING RETURNING id',[id,b.email.toLowerCase(),salt+':'+scryptSync(b.password,salt,64).toString('hex'),digest(randomBytes(32).toString('hex')),b.privacyVersion,b.termsVersion]);
      if(!r.rowCount) fail(409,'Email already registered'); return session(c,id);
    }); return reply.code(201).send(result);
  });
  app.post<{Body:{email:string;password:string;privacyVersion:string;termsVersion:string}}>('/auth/login',{schema:body({email,password,...consent},['email','password','privacyVersion','termsVersion'])},async req=>{
    const b=req.body,address=b.email.toLowerCase(); await limit(req.ip,address,'login',10);
    return tx(async c=>{
      const r=await c.query('SELECT * FROM users WHERE email=$1 FOR UPDATE',[address]);
      const user=r.rows[0]; const [salt,stored]=(user?.password_hash ?? 'dummy:'+ '00'.repeat(64)).split(':');
      const actual=scryptSync(b.password,salt,64); const expected=Buffer.from(stored,'hex');
      if(!user || expected.length!==actual.length || !timingSafeEqual(expected,actual)) fail(401,'Invalid email or password');
      await c.query('UPDATE users SET privacy_version=$2,terms_version=$3,consented_at=NOW() WHERE id=$1',[user.id,b.privacyVersion,b.termsVersion]);
      return session(c,user.id);
    });
  });
  app.post<{Body:{email:string}}>('/auth/code/send',{schema:body({email},['email'])},async(req,reply)=>{
    const address=req.body.email.toLowerCase(); await limit(req.ip,address,'code-send',5);
    let code: string; do { code=String(randomInt(0,1000000)).padStart(6,'0'); } while(code==='123456');
    await tx(async c=>{
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['code:'+address]);
      const r=await c.query("SELECT GREATEST(1,ceil(extract(epoch from sent_at+interval '60 seconds'-NOW())))::int AS retry FROM auth_codes WHERE email=$1 AND sent_at>NOW()-interval '60 seconds'",[address]);
      if(r.rowCount) throw Object.assign(new Error('Please wait before resending'),{statusCode:429,retryAfter:r.rows[0].retry});
      await c.query("INSERT INTO auth_codes(email,code_hash,sent_at,expires_at) VALUES($1,$2,NOW(),NOW()+interval '10 minutes') ON CONFLICT(email) DO UPDATE SET code_hash=$2,sent_at=NOW(),expires_at=NOW()+interval '10 minutes',used_at=NULL,attempts=0",[address,digest(code)]);
    });
    try {
      if(options.sendMail) await options.sendMail(address,code);
      else {
        const env=process.env;
        if(!['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','SMTP_FROM'].every(k=>env[k]) || !Number.isInteger(Number(env.SMTP_PORT)) || Number(env.SMTP_PORT)<1 || Number(env.SMTP_PORT)>65535) throw new Error('SMTP configuration missing or invalid');
        const transport=nodemailer.createTransport({host:env.SMTP_HOST,port:Number(env.SMTP_PORT),secure:Number(env.SMTP_PORT)===465,auth:{user:env.SMTP_USER!,pass:env.SMTP_PASS!},connectionTimeout:5000,socketTimeout:10000});
        try { await transport.sendMail({from:env.SMTP_FROM,to:address,subject:'MauGo verification code',text:`Your verification code is ${code}. It expires in 10 minutes.`}); } finally { transport.close(); }
      }
    } catch { app.log.warn({email:address},'SMTP unavailable'); fail(503,'SMTP configuration unavailable or delivery failed'); }
    return reply.send({sent:true,retryAfter:60,expiresIn:600});
  });
  const codeSchema = {type:'string',pattern:'^[0-9]{6}$'};
  // Return failures so the transaction commits failed-attempt counters as well.
  async function verifyCode(c: PoolClient, address: string, code: string) {
    const r=await c.query('SELECT *,expires_at<=NOW() AS expired FROM auth_codes WHERE email=$1 FOR UPDATE',[address]);
    const row=r.rows[0];
    if(!row || row.used_at) return 401;
    if(row.expired) return 410;
    if(row.attempts>=5) return 429;
    await c.query('UPDATE auth_codes SET attempts=attempts+1 WHERE email=$1',[address]);
    if(!timingSafeEqual(Buffer.from(row.code_hash,'hex'),Buffer.from(digest(code),'hex'))) return 401;
    return 200;
  }
  function checkCodeStatus(status: number) {
    if(status!==200) fail(status,status===410?'Code expired':status===429?'Too many code attempts':'Invalid code');
  }
  app.post<{Body:{email:string;code:string}}>('/auth/code/verify',{schema:body({email,code:codeSchema},['email','code'])},async req=>{
    const address=req.body.email.toLowerCase();
    await limit(req.ip,address,'code-verify',30);
    const status=await tx(async c=>{
      const status=await verifyCode(c,address,req.body.code);
      if(status===200) await c.query('UPDATE auth_codes SET used_at=NOW() WHERE email=$1',[address]);
      return status;
    });
    checkCodeStatus(status); return {verified:true};
  });
  app.post<{Body:{email:string;code:string;newPassword:string}}>('/auth/password/reset',{schema:body({email,code:codeSchema,newPassword:password},['email','code','newPassword'])},async req=>{
    const b=req.body,address=b.email.toLowerCase();
    strong(b.newPassword);
    await limit(req.ip,address,'code-verify',30);
    const status=await tx(async c=>{
      const status=await verifyCode(c,address,b.code);
      if(status!==200) return status;
      const user=await c.query('SELECT id FROM users WHERE email=$1 FOR UPDATE',[address]);
      if(!user.rowCount) return 401;
      const salt=randomBytes(16).toString('hex');
      await c.query('UPDATE users SET password_hash=$2,token_hash=$3 WHERE id=$1',[user.rows[0].id,salt+':'+scryptSync(b.newPassword,salt,64).toString('hex'),digest(randomBytes(32).toString('hex'))]);
      await c.query('DELETE FROM auth_sessions WHERE user_id=$1',[user.rows[0].id]);
      await c.query('UPDATE auth_codes SET used_at=NOW() WHERE email=$1',[address]);
      return 200;
    });
    checkCodeStatus(status); return {reset:true};
  });
  app.post('/auth/logout',async req=>{
    if(!req.headers.authorization?.startsWith('Bearer ')) fail(401,'Bearer token required');
    await tx(async c=>{ const token=digest(req.headers.authorization!.slice(7)); await c.query('DELETE FROM auth_sessions WHERE token_hash=$1',[token]); await c.query('UPDATE users SET token_hash=$2 WHERE token_hash=$1',[token,digest(randomBytes(32).toString('hex'))]); }); return {revoked:true};
  });
  app.post<{Body:{identityToken?:string;cancelled?:boolean}}>('/auth/apple',{schema:body({identityToken:{type:'string',minLength:1,maxLength:16384},cancelled:{type:'boolean'}},[])},async(req,reply)=>{
    if(req.body.cancelled) return reply.code(200).send({cancelled:true});
    if(!req.body.identityToken) fail(400,'identityToken required');
    if(!/^[\w-]+\.[\w-]+\.[\w-]+$/.test(req.body.identityToken!)) fail(401,'Invalid Apple identityToken');
    if(!process.env.APPLE_CLIENT_ID) fail(503,'Apple configuration missing: APPLE_CLIENT_ID; account login integration pending');
    try { await jwtVerify(req.body.identityToken!,keys,{issuer:'https://appleid.apple.com',audience:process.env.APPLE_CLIENT_ID,algorithms:['RS256'],requiredClaims:['sub','exp','iat']}); }
    catch { fail(401,'Invalid Apple identityToken'); }
    return reply.code(503).send({message:'Apple identity verified; account binding and server nonce integration pending. No session issued.'});
  });
}
