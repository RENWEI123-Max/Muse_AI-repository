import { registerFeedback } from './feedback.js';
import { registerProfiles } from './profiles.js';
import { registerPosts } from './posts.js';
import { registerApplePayments, type AppleOptions } from './payments.js';
import { registerInbox } from './inbox.js';
import { registerPrivacy } from './privacy.js';
import { registerMedia } from './media.js';
import { registerModeration, lockPair } from './moderation.js';
import { registerFilterPass } from './filter-pass.js';
import { registerWallet } from './wallet.js';
import { registerDiscovery } from './discovery.js';
import { registerAuth, type AuthOptions } from './auth.js';
import Fastify from 'fastify';
import { randomUUID, createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const uuid = { type: 'string', format: 'uuid' };
const text = { type: 'string', minLength: 1, pattern: '\\S' };
export function buildApp(db: { query(sql: string): Promise<unknown>; connect?: Pool['connect'] }, logger = false, authOptions: AuthOptions = {}, appleOptions: AppleOptions = {}) {
  const app = Fastify({ logger, ajv: { customOptions: { removeAdditional: false } } });
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
    // Serialize this user's transactions while allowing peer foreign-key checks
    // (KEY SHARE) during concurrent openings in the opposite direction.
    const result = await client.query('SELECT * FROM users WHERE token_hash=$1 OR id IN (SELECT user_id FROM auth_sessions WHERE token_hash=$1 AND expires_at>NOW()) FOR NO KEY UPDATE', [hash(authorization.slice(7))]);
    if (!result.rowCount || result.rows[0].deleted_at) fail(401, 'Invalid token');
    if (result.rows[0].is_suspended) fail(403, 'Account suspended');
    return result.rows[0];
  }
  registerAuth(app, db as Pool, authOptions);
  registerInbox(app, transaction, authenticate);
  registerPrivacy(app, transaction, authenticate);
  registerMedia(app, transaction, authenticate);
  registerProfiles(app, transaction, authenticate);
  registerPosts(app, transaction, authenticate);
  registerDiscovery(app, transaction, authenticate);
  registerModeration(app, transaction, authenticate);
  registerFeedback(app, transaction, authenticate);
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
      if (existing.rowCount) fail(409, 'Opening already exists');
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
    await lockPair(c,sender,recipient);
    if ((await c.query('SELECT 1 FROM user_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)', [recipient,sender])).rowCount) fail(403, 'Conversation blocked');
    const peer = (await c.query('SELECT * FROM users WHERE id=$1',[recipient])).rows[0];
    if(peer?.deleted_at) fail(410, 'Account deleted');
    if(peer?.is_suspended) fail(403, 'Account suspended');
  }
  app.post<{ Params: { id: string }; Body: { content: string } }>('/conversations/:id/messages', {
    schema: { params: { type:'object', required:['id'], properties:{id:uuid} },
      body: { type:'object', additionalProperties:false, required:['content'], properties:{content:text} } }
  }, async (request, reply) => {
    if ([...request.body.content].length > 200) fail(400, 'Message exceeds 200 characters');
    const result = await transaction(async c => {
      const user = await authenticate(c, request.headers.authorization);
      const found = await c.query('SELECT * FROM conversations WHERE id=$1 AND (opener_id=$2 OR peer_id=$2)', [request.params.id,user.id]);
      if (!found.rowCount) fail(404, 'Conversation not found');
      let v = found.rows[0];
      await checkBlocked(c,user.id,user.id === v.opener_id ? v.peer_id : v.opener_id);
      v = (await c.query('SELECT * FROM conversations WHERE id=$1 FOR UPDATE',[v.id])).rows[0];
      if (!v.unlocked_at && user.id === v.opener_id) fail(403, 'Wait for recipient reply');
      const id = randomUUID();
      await c.query("INSERT INTO messages(id,conversation_id,sender_id,kind,content) VALUES($1,$2,$3,'reply',$4)", [id,v.id,user.id,request.body.content]);
      // Reply remains locked until its sender's peer collects it atomically.
      return { id, conversationId:v.id, unlocked:v.unlocked_at != null };
    });
    return reply.code(201).send(result);
  });
  registerApplePayments(app, transaction, authenticate, appleOptions);
  registerWallet(app, transaction, authenticate);
  registerFilterPass(app, transaction, authenticate);
  return app;
}
