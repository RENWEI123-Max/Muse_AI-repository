import { registerDiscovery } from './discovery.js';
import { registerAuth, type AuthOptions } from './auth.js';
import Fastify from 'fastify';
import { randomUUID, createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const uuid = { type: 'string', format: 'uuid' };
const text = { type: 'string', minLength: 1, pattern: '\\S' };
export function buildApp(db: { query(sql: string): Promise<unknown>; connect?: Pool['connect'] }, logger = false, authOptions: AuthOptions = {}) {
  const app = Fastify({ logger });
  app.get('/health', async () => ({ status: 'ok', service: 'maugo-backend' }));
  app.get('/ready', async (_request, reply) => {
    try { await db.query('SELECT 1'); return { status: 'ready' }; }
    catch { return reply.code(503).send({ status: 'unavailable' }); }
  });
  async function transaction(work: (client: PoolClient) => Promise<unknown>) {
    const client = await (db as Pool).connect();
    try { await client.query('BEGIN'); const result = await work(client); await client.query('COMMIT'); return result; }
    catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  function fail(statusCode: number, message: string): never { throw Object.assign(new Error(message), { statusCode }); }
  async function authenticate(client: PoolClient, authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) fail(401, 'Bearer token required');
    const result = await client.query('SELECT * FROM users WHERE token_hash=$1 OR id IN (SELECT user_id FROM auth_sessions WHERE token_hash=$1 AND expires_at>NOW()) FOR UPDATE', [hash(authorization.slice(7))]);
    if (!result.rowCount) fail(401, 'Invalid token');
    return result.rows[0];
  }
  registerAuth(app, db as Pool, authOptions);
  registerDiscovery(app, transaction, authenticate);
  app.post<{ Params: { peerId: string }; Body: { content: string } }>('/conversations/:peerId/opening', {
    schema: { params: { type: 'object', required: ['peerId'], properties: { peerId: uuid } },
      body: { type: 'object', additionalProperties: false, required: ['content'], properties: { content: text } } }
  }, async (request, reply) => {
    if ([...request.body.content].length > 200) fail(400, 'Opening exceeds 200 characters');
    const result = await transaction(async c => {
      const user = await authenticate(c, request.headers.authorization);
      if (user.id === request.params.peerId) fail(400, 'Cannot open conversation with yourself');
      if (!(await c.query('SELECT id FROM users WHERE id=$1', [request.params.peerId])).rowCount) fail(404, 'Peer not found');
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [[user.id,request.params.peerId].sort().join(':')]);
      await checkBlocked(c, user.id, request.params.peerId);
      const existing = await c.query(`SELECT * FROM conversations WHERE
        LEAST(opener_id,peer_id)=LEAST($1::uuid,$2::uuid) AND GREATEST(opener_id,peer_id)=GREATEST($1::uuid,$2::uuid) FOR UPDATE`, [user.id,request.params.peerId]);
      if (existing.rowCount) return { ...conversationResult(existing.rows[0]), created: false };
      const id = randomUUID(), messageId = randomUUID();
      await c.query('INSERT INTO conversations(id,opener_id,peer_id,opening_message_id) VALUES($1,$2,$3,$4)', [id,user.id,request.params.peerId,messageId]);
      await c.query("INSERT INTO messages(id,conversation_id,sender_id,kind,content) VALUES($1,$2,$3,'opening',$4)", [messageId,id,user.id,request.body.content]);
      return { ...conversationResult({id, opener_id:user.id, peer_id:request.params.peerId, opening_message_id:messageId, unlocked_at:null}), created: true };
    }) as Record<string, unknown>;
    const { created, ...body } = result;
    return reply.code(created ? 201 : 200).send(body);
  });
  function conversationResult(row: any) {
    return { id: row.id, messageId: row.opening_message_id, openingMessageId: row.opening_message_id,
      openerId: row.opener_id, peerId: row.peer_id, unlocked: row.unlocked_at != null, unlockedAt: row.unlocked_at };
  }
  async function checkBlocked(c: PoolClient, sender: string, recipient: string) {
    if ((await c.query('SELECT 1 FROM user_blocks WHERE blocker_id=$1 AND blocked_id=$2', [recipient,sender])).rowCount) fail(403, 'Blocked by recipient');
  }
  app.post<{ Params: { id: string }; Body: { content: string } }>('/conversations/:id/messages', {
    schema: { params: { type:'object', required:['id'], properties:{id:uuid} },
      body: { type:'object', additionalProperties:false, required:['content'], properties:{content:text} } }
  }, async (request, reply) => {
    if ([...request.body.content].length > 200) fail(400, 'Message exceeds 200 characters');
    const result = await transaction(async c => {
      const user = await authenticate(c, request.headers.authorization);
      const found = await c.query('SELECT * FROM conversations WHERE id=$1 AND (opener_id=$2 OR peer_id=$2) FOR UPDATE', [request.params.id,user.id]);
      if (!found.rowCount) fail(404, 'Conversation not found');
      const v = found.rows[0];
      await checkBlocked(c,user.id,user.id === v.opener_id ? v.peer_id : v.opener_id);
      if (!v.unlocked_at && user.id === v.opener_id) fail(403, 'Wait for recipient reply');
      const id = randomUUID();
      await c.query("INSERT INTO messages(id,conversation_id,sender_id,kind,content) VALUES($1,$2,$3,'reply',$4)", [id,v.id,user.id,request.body.content]);
      if (!v.unlocked_at) await c.query('UPDATE conversations SET unlocked_at=NOW() WHERE id=$1', [v.id]);
      return { id, conversationId:v.id, unlocked:true };
    });
    return reply.code(201).send(result);
  });
  app.post<{ Params: { id: string; replyId: string } }>('/conversations/:id/replies/:replyId/collect', {
    schema: { params: { type: 'object', required: ['id','replyId'], properties: { id: uuid, replyId: uuid } },
      headers: { type: 'object', required: ['idempotency-key'], properties: { 'idempotency-key': { type: 'string', minLength: 1, maxLength: 128, pattern: '\\S' } } } }
  }, async request => transaction(async c => {
    const user = await authenticate(c, request.headers.authorization);
    const key = request.headers['idempotency-key'] as string;
    const message = await c.query(`SELECT m.* FROM messages m JOIN conversations v ON v.id=m.conversation_id
      WHERE m.id=$1 AND v.id=$2 AND (v.opener_id=$3 OR v.peer_id=$3) AND m.sender_id<>$3 AND m.kind='reply'`,
      [request.params.replyId,request.params.id,user.id]);
    if (!message.rowCount) fail(404, 'Reply not found');
    const existing = await c.query('SELECT * FROM reply_collections WHERE user_id=$1 AND (idempotency_key=$2 OR reply_id=$3)', [user.id,key,request.params.replyId]);
    if (existing.rows.some(r => r.idempotency_key === key && r.reply_id !== request.params.replyId)) fail(409, 'Idempotency key reused');
    if (existing.rowCount) return { id: existing.rows[0].id, cost: existing.rows[0].cost, content: message.rows[0].content };
    // The user row is locked before counting, so concurrent collections share the quota.
    // Capture the day after acquiring the lock, including when a request waits across midnight.
    const { rows: [day] } = await c.query(`SELECT
      date_trunc('day', clock_timestamp() AT TIME ZONE 'Asia/Shanghai') ::text AS start`);
    const daily = await c.query(`SELECT count(*)::int AS count FROM reply_collections
      WHERE user_id=$1 AND created_at >= ($2::timestamp AT TIME ZONE 'Asia/Shanghai')
      AND created_at < (($2::timestamp + interval '1 day') AT TIME ZONE 'Asia/Shanghai')`,
      [user.id, day.start]);
    const cost = daily.rows[0].count < 10 ? 0 : 10;
    if (user.diamonds < cost) fail(402, 'Insufficient diamonds');
    const id = randomUUID();
    await c.query('INSERT INTO reply_collections(id,user_id,reply_id,idempotency_key,cost,created_at) VALUES($1,$2,$3,$4,$5,clock_timestamp())', [id,user.id,request.params.replyId,key,cost]);
    await c.query('UPDATE users SET collected_count=collected_count+1, diamonds=diamonds-$2 WHERE id=$1', [user.id,cost]);
    if (cost) await c.query('INSERT INTO wallet_ledger(id,user_id,collection_id,amount) VALUES($1,$2,$3,$4)', [randomUUID(),user.id,id,-cost]);
    return { id, cost, content: message.rows[0].content };
  }));
  return app;
}
