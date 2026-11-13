import { lockPair } from './moderation.js';
import type { FastifyInstance } from 'fastify';
import type { Pool, PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';
const uuid = { type: 'string', format: 'uuid' };
const fail = (statusCode: number, message: string): never => { throw Object.assign(new Error(message), { statusCode }); };

// Only invoke after the payment adapter verifies signature, order owner and server-side
// product amount. This is deliberately not exposed as a client-controlled credit endpoint.
export async function creditWallet(db: Pool | PoolClient, userId: string, amount: number, paymentReference: string) {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 2147483647 || !paymentReference.trim() || paymentReference.length > 256)
    fail(400, 'Invalid payment credit');
  const ownsTransaction = !('release' in db);
  const c = ownsTransaction ? await (db as Pool).connect() : db as PoolClient;
  try {
    if (ownsTransaction) await c.query('BEGIN');
    await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', ['payment:'+paymentReference]);
    const user = (await c.query('SELECT * FROM users WHERE id=$1 FOR UPDATE', [userId])).rows[0];
    if (!user || user.deleted_at) fail(404, 'User not found');
    const previous = (await c.query('SELECT * FROM wallet_ledger WHERE payment_reference=$1', [paymentReference])).rows[0];
    if (previous && (previous.user_id !== userId || previous.amount !== amount)) fail(409, 'Payment reference reused');
    let entry = previous;
    if (!entry) {
      const balance = user.diamonds + amount;
      if (balance > 2147483647) fail(409, 'Wallet balance limit exceeded');
      await c.query('UPDATE users SET diamonds=$2 WHERE id=$1', [userId,balance]);
      entry = (await c.query(`INSERT INTO wallet_ledger(id,user_id,amount,balance_after,payment_reference)
        VALUES($1,$2,$3,$4,$5) RETURNING *`, [randomUUID(),userId,amount,balance,paymentReference])).rows[0];
    }
    if (ownsTransaction) await c.query('COMMIT');
    return entry;
  } catch (error) { if (ownsTransaction) await c.query('ROLLBACK'); throw error; }
  finally { if (ownsTransaction) c.release(); }
}

export function registerWallet(app: FastifyInstance,
  transaction: (work: (c: PoolClient) => Promise<unknown>) => Promise<unknown>,
  authenticate: (c: PoolClient, authorization?: string) => Promise<any>) {
  app.get('/wallet', async request => transaction(async c => {
    const u = await authenticate(c, request.headers.authorization);
    const { rows: [quota] } = await c.query(`SELECT count(*)::int AS used FROM reply_collections
      WHERE user_id=$1 AND (created_at AT TIME ZONE 'Asia/Shanghai')::date =
      (clock_timestamp() AT TIME ZONE 'Asia/Shanghai')::date`, [u.id]);
    return { diamonds: u.diamonds, freeRemaining: Math.max(0,10-quota.used), dailyFreeLimit:10, paidCost:10, timeZone:'Asia/Shanghai' };
  }));
  app.get<{ Querystring: { limit?: number; offset?: number } }>('/wallet/ledger', {
    schema: { querystring: { type:'object', additionalProperties:false, properties: {
      limit:{ type:'integer', minimum:1, maximum:100, default:20 }, offset:{ type:'integer', minimum:0, default:0 }
    } } }
  }, async request => transaction(async c => {
    const u = await authenticate(c, request.headers.authorization);
    const entries = await c.query(`SELECT id,filter_pass_purchase_id AS "filterPassPurchaseId",collection_id AS "collectionId",amount,balance_after AS "balanceAfter",
      payment_reference AS "paymentReference",created_at AS "createdAt" FROM wallet_ledger
      WHERE user_id=$1 ORDER BY created_at DESC,id DESC LIMIT $2 OFFSET $3`, [u.id,request.query.limit,request.query.offset]);
    return { items:entries.rows };
  }));
  app.post<{ Params: { id: string; replyId: string }; Body: { confirmPaid?: boolean; cancel?: boolean } }>('/conversations/:id/replies/:replyId/collect', {
    schema: { params:{ type:'object', required:['id','replyId'], properties:{ id:uuid, replyId:uuid } },
      body:{ type:'object', additionalProperties:false, properties:{ confirmPaid:{type:'boolean'},cancel:{type:'boolean'} } },
      headers:{ type:'object', required:['idempotency-key'], properties:{ 'idempotency-key':{type:'string',minLength:1,maxLength:128,pattern:'\\S'} } } }
  }, async (request, reply) => {
    const result: any = await transaction(async c => {
      const u = await authenticate(c, request.headers.authorization);
      const key = request.headers['idempotency-key'] as string;
      const context = { conversationId:request.params.id, replyId:request.params.replyId, idempotencyKey:key };
      const message = (await c.query(`SELECT m.*,v.opening_message_id FROM messages m JOIN conversations v ON v.id=m.conversation_id
        WHERE m.id=$1 AND v.id=$2 AND (v.opener_id=$3 OR v.peer_id=$3) AND m.sender_id<>$3
        AND m.kind='reply'`, [request.params.replyId,request.params.id,u.id])).rows[0];
      if (!message) fail(404, 'Reply not found');
      if((await c.query('SELECT * FROM users WHERE id=$1',[message.sender_id])).rows[0]?.deleted_at) fail(410,'Account deleted');
      await lockPair(c,u.id,message.sender_id);
      if ((await c.query(`SELECT 1 FROM user_blocks WHERE (blocker_id=$1 AND blocked_id=$2)
        OR (blocker_id=$2 AND blocked_id=$1)`, [u.id,message.sender_id])).rowCount) fail(403, 'Conversation blocked');
      if (request.body?.cancel) return { state:'cancelled',unlocked:false,context };
      const bound = (await c.query(`SELECT r.reply_id FROM reply_collection_requests k
        JOIN reply_collections r ON r.id=k.collection_id WHERE k.user_id=$1 AND k.idempotency_key=$2`, [u.id,key])).rows[0];
      if (bound && bound.reply_id !== message.id) fail(409, 'Idempotency key reused');
      let entry = (await c.query('SELECT * FROM reply_collections WHERE user_id=$1 AND reply_id=$2', [u.id,message.id])).rows[0];
      if (!entry) {
        // Capture the Shanghai day only after authenticate acquired the wallet row lock.
        const { rows:[day] } = await c.query(`SELECT date_trunc('day',stamp AT TIME ZONE 'Asia/Shanghai')::text AS start,stamp::text AS collected_at FROM (SELECT clock_timestamp() AS stamp) captured`);
        const { rows:[daily] } = await c.query(`SELECT count(*)::int AS count FROM reply_collections WHERE user_id=$1
          AND created_at >= ($2::timestamp AT TIME ZONE 'Asia/Shanghai')
          AND created_at < (($2::timestamp+interval '1 day') AT TIME ZONE 'Asia/Shanghai')`, [u.id,day.start]);
        const cost = daily.count < 10 ? 0 : 10;
        if (cost && !request.body?.confirmPaid) return { state:'confirmation-required',code:'PAID_CONFIRMATION_REQUIRED',cost,unlocked:false,context };
        if (u.diamonds < cost) return { status:402,state:'insufficient-balance',code:'INSUFFICIENT_DIAMONDS',message:'余额不足，请充值后继续收取',cost,diamonds:u.diamonds,unlocked:false,context };
        entry = (await c.query(`INSERT INTO reply_collections(id,user_id,reply_id,idempotency_key,cost,created_at)
          VALUES($1,$2,$3,$4,$5,$6::timestamptz) RETURNING *`, [randomUUID(),u.id,message.id,key,cost,day.collected_at])).rows[0];
        await c.query('UPDATE conversations SET unlocked_at=COALESCE(unlocked_at,$2::timestamptz) WHERE id=$1 AND peer_id=$3', [message.conversation_id,day.collected_at,message.sender_id]);
        await c.query('UPDATE users SET diamonds=diamonds-$2,collected_count=collected_count+1 WHERE id=$1', [u.id,cost]);
        if (cost) await c.query(`INSERT INTO wallet_ledger(id,user_id,collection_id,amount,balance_after)
          VALUES($1,$2,$3,$4,$5)`, [randomUUID(),u.id,entry.id,-cost,u.diamonds-cost]);
      }
      await c.query(`INSERT INTO reply_collection_requests(user_id,idempotency_key,collection_id)
        VALUES($1,$2,$3) ON CONFLICT DO NOTHING`, [u.id,key,entry.id]);
      const conversation = (await c.query('SELECT unlocked_at FROM conversations WHERE id=$1',[message.conversation_id])).rows[0];
      return { id:entry.id,state:'collected',cost:entry.cost,unlocked:conversation.unlocked_at!=null,unlockedAt:entry.unlocked_at,
        collectionCount:entry.collection_count,openingMessageId:message.opening_message_id,content:message.content,context };
    });
    const { status=200,...body } = result;
    return reply.code(status).send(body);
  });
}
