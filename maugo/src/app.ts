import Fastify from 'fastify';
import { randomUUID, randomBytes, createHash, scryptSync } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const uuid = { type: 'string', format: 'uuid' };
const text = { type: 'string', minLength: 1, maxLength: 200, pattern: '\\S' };
export function buildApp(db: { query(sql: string): Promise<unknown>; connect?: Pool['connect'] }, logger = false) {
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
    const result = await client.query('SELECT * FROM users WHERE token_hash=$1 FOR UPDATE', [hash(authorization.slice(7))]);
    if (!result.rowCount) fail(401, 'Invalid token');
    return result.rows[0];
  }
  app.post<{ Body: { email: string; password: string } }>('/auth/signup', {
    schema: { body: { type: 'object', additionalProperties: false, required: ['email','password'], properties: {
      email: { type: 'string', maxLength: 254, pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
      password: { type: 'string', minLength: 8, maxLength: 128 }
    } } }
  }, async (request, reply) => {
    const id = randomUUID(), token = randomBytes(32).toString('hex'), salt = randomBytes(16).toString('hex');
    const passwordHash = salt + ':' + scryptSync(request.body.password, salt, 64).toString('hex');
    await transaction(async c => {
      const result = await c.query('INSERT INTO users(id,email,password_hash,token_hash) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id',
        [id, request.body.email.toLowerCase(), passwordHash, hash(token)]);
      if (!result.rowCount) fail(409, 'Email already registered');
    });
    return reply.code(201).send({ id, token });
  });
  app.post<{ Params: { peerId: string }; Body: { content: string } }>('/conversations/:peerId/opening', {
    schema: { params: { type: 'object', required: ['peerId'], properties: { peerId: uuid } },
      body: { type: 'object', additionalProperties: false, required: ['content'], properties: { content: text } } }
  }, async (request, reply) => {
    const result = await transaction(async c => {
      const user = await authenticate(c, request.headers.authorization);
      if (user.id === request.params.peerId) fail(400, 'Cannot open conversation with yourself');
      if (!(await c.query('SELECT id FROM users WHERE id=$1', [request.params.peerId])).rowCount) fail(404, 'Peer not found');
      const id = randomUUID();
      const inserted = await c.query('INSERT INTO conversations(id,opener_id,peer_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id', [id,user.id,request.params.peerId]);
      if (!inserted.rowCount) fail(409, 'Conversation already opened');
      const messageId = randomUUID();
      await c.query("INSERT INTO messages(id,conversation_id,sender_id,kind,content) VALUES($1,$2,$3,'opening',$4)", [messageId,id,user.id,request.body.content]);
      return { id, messageId, content: request.body.content };
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
    const cost = user.collected_count < 10 ? 0 : 10;
    if (user.diamonds < cost) fail(402, 'Insufficient diamonds');
    const id = randomUUID();
    await c.query('INSERT INTO reply_collections(id,user_id,reply_id,idempotency_key,cost) VALUES($1,$2,$3,$4,$5)', [id,user.id,request.params.replyId,key,cost]);
    await c.query('UPDATE users SET collected_count=collected_count+1, diamonds=diamonds-$2 WHERE id=$1', [user.id,cost]);
    if (cost) await c.query('INSERT INTO wallet_ledger(id,user_id,collection_id,amount) VALUES($1,$2,$3,$4)', [randomUUID(),user.id,id,-cost]);
    return { id, cost, content: message.rows[0].content };
  }));
  return app;
}
