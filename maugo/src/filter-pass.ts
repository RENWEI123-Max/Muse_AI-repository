import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';
import economy from './economy.json' with { type: 'json' };

export function registerFilterPass(app: FastifyInstance,
  transaction: (work: (c: PoolClient) => Promise<unknown>) => Promise<unknown>,
  authenticate: (c: PoolClient, authorization?: string) => Promise<any>) {
  async function status(c: PoolClient, userId: string) {
    return (await c.query(`SELECT filter_pass_expires_at AS "expiresAt",
      COALESCE(filter_pass_expires_at>clock_timestamp(),false) AS active,
      GREATEST(0,ceil(extract(epoch FROM (filter_pass_expires_at-clock_timestamp()))/86400))::int AS "remainingDays"
      FROM users WHERE id=$1`, [userId])).rows[0];
  }
  app.get('/filter-pass', async request => transaction(async c => {
    const u = await authenticate(c, request.headers.authorization);
    return { ...await status(c,u.id), plans:economy.filterPass, features:economy.filterPassFeatures };
  }));
  app.post<{ Body: { days: number; cancel?: boolean; filters?: { gender?: string; city?: string; minAge?: number; maxAge?: number } } }>('/filter-pass/purchase', {
    schema: {
      headers:{type:'object',required:['idempotency-key'],properties:{'idempotency-key':{type:'string',minLength:1,maxLength:128,pattern:'\\S'}}},
      body:{type:'object',additionalProperties:false,required:['days'],properties:{
        days:{type:'integer',enum:economy.filterPass.map(p=>p.days)},cancel:{type:'boolean'},
        filters:{type:'object',additionalProperties:false,properties:{gender:{type:'string',enum:['male','female','other']},
          city:{type:'string',minLength:1,maxLength:100},minAge:{type:'integer',minimum:18,maximum:120},maxAge:{type:'integer',minimum:18,maximum:120}}}
      }}
    }
  }, async (request, reply) => {
    const result: any = await transaction(async c => {
      const u = await authenticate(c,request.headers.authorization);
      const key = request.headers['idempotency-key'] as string;
      const context = { days:request.body.days, filters:request.body.filters ?? {}, idempotencyKey:key };
      const previous = (await c.query('SELECT * FROM filter_pass_purchases WHERE user_id=$1 AND idempotency_key=$2',[u.id,key])).rows[0];
      if (previous && previous.days !== request.body.days) throw Object.assign(new Error('Idempotency key reused'),{statusCode:409});
      if (previous) return { state:'purchased',purchase:previous,...await status(c,u.id),context };
      if (request.body.cancel) return { state:'cancelled',...await status(c,u.id),context };
      const plan = economy.filterPass.find(p=>p.days===request.body.days)!;
      if (u.diamonds < plan.diamonds) return { status:402,state:'insufficient-balance',code:'INSUFFICIENT_DIAMONDS',
        message:'余额不足，请充值后继续购买',cost:plan.diamonds,diamonds:u.diamonds,...await status(c,u.id),context };
      // User row is locked by authenticate: renewals and wallet operations serialize.
      // Capture time after the lock; each day is exactly 24 hours regardless of DB timezone.
      const purchase = (await c.query(`INSERT INTO filter_pass_purchases(id,user_id,idempotency_key,days,cost,starts_at,expires_at)
        SELECT $1,$2,$3,$4,$5,start,start+($4::integer*interval '24 hours')
        FROM (SELECT GREATEST(filter_pass_expires_at,clock_timestamp()) AS start FROM users WHERE id=$2) s RETURNING *`,
        [randomUUID(),u.id,key,plan.days,plan.diamonds])).rows[0];
      await c.query('UPDATE users SET diamonds=diamonds-$2,filter_pass_expires_at=$3 WHERE id=$1',[u.id,plan.diamonds,purchase.expires_at]);
      await c.query(`INSERT INTO wallet_ledger(id,user_id,filter_pass_purchase_id,amount,balance_after)
        VALUES($1,$2,$3,$4,$5)`,[randomUUID(),u.id,purchase.id,-plan.diamonds,u.diamonds-plan.diamonds]);
      return { state:'purchased',purchase,...await status(c,u.id),context };
    });
    const {status:code=200,...body}=result;
    return reply.code(code).send(body);
  });
}
