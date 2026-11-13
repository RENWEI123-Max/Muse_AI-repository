import { profileVisible } from './posts.js';
import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';
// TODO replace this fixed MOCK list with the real city data provider.
const cities = ['Seoul', 'Shanghai', 'Beijing', 'Tokyo', 'London', 'New York'];
const properties = {
  gender: { type: 'string', enum: ['male', 'female', 'other'] },
  city: { type: 'string', minLength: 1, maxLength: 100 },
  minAge: { type: 'integer', minimum: 18, maximum: 120 },
  maxAge: { type: 'integer', minimum: 18, maximum: 120 },
  limit: { type: 'integer', minimum: 1, maximum: 50, default: 3 },
  batchId: { type: 'string', format: 'uuid' },
  offset: { type: 'integer', minimum: 0, default: 0 }
};
type Filters = { gender?: string; city?: string; minAge?: number; maxAge?: number; limit: number; batchId?: string; offset: number };
const fail = (statusCode: number, message: string): never => { throw Object.assign(new Error(message), { statusCode }); };
const active = (u: any) => u.filter_pass_expires_at != null && new Date(u.filter_pass_expires_at).getTime() > Date.now();
const advanced = (f: Filters) => f.city !== undefined || f.minAge !== undefined || f.maxAge !== undefined;
const selection = (f: Filters) => ({ gender: f.gender ?? null, city: f.city ?? null, minAge: f.minAge ?? null, maxAge: f.maxAge ?? null });
const visible = `NOT u.is_suspended AND ${profileVisible('u')} AND NOT EXISTS(SELECT 1 FROM user_blocks b WHERE
 (b.blocker_id=$1 AND b.blocked_id=u.id) OR (b.blocker_id=u.id AND b.blocked_id=$1))`;
const columns = `v.id AS conversation_id,v.opening_message_id,v.unlocked_at,m.content,m.created_at,
 to_jsonb(u)->>'deleted_at' AS deleted_at,u.id AS sender_id,u.display_name,u.avatar,u.city,u.age,u.gender,
 (v.unlocked_at IS NOT NULL OR EXISTS(SELECT 1 FROM messages r WHERE r.conversation_id=v.id AND r.kind='reply' AND r.sender_id=v.peer_id)) AS replied,
 EXISTS(SELECT 1 FROM messages r WHERE r.conversation_id=v.id AND r.kind='reply' AND r.sender_id=v.opener_id) AS received_reply`;
function letter(r: any) {
  return { openingMessageId: r.opening_message_id, conversationId: r.conversation_id, content: r.content,
    createdAt: r.created_at, sender: { id: r.sender_id, displayName: r.display_name, deleted: r.deleted_at != null, avatar: r.avatar,
      city: r.city, age: r.age, gender: r.gender }, replied: r.replied, unlocked: r.unlocked_at != null,
    unlockedAt: r.unlocked_at, state: r.deleted_at ? 'account-deleted' : r.received_reply ? 'letter-replied' : r.replied ? 'letter-waiting' : 'letter-open',
    canReply: !r.deleted_at && !r.replied, canChat: !r.deleted_at && r.unlocked_at != null };
}
export function registerDiscovery(app: FastifyInstance,
  transaction: (work: (c: PoolClient) => Promise<unknown>) => Promise<unknown>,
  authenticate: (c: PoolClient, authorization?: string) => Promise<any>) {
  app.get('/discovery/filters', async request => transaction(async c => {
    const u = await authenticate(c, request.headers.authorization);
    return { state: active(u) ? 'filters-active' : 'filters-free', passActive: active(u),
      lockedFields: active(u) ? [] : ['city', 'minAge', 'maxAge'], genders: ['male', 'female', 'other'],
      ageRange: { min: 18, max: 120 }, cities, citySource: 'mock-fixed-list',
      passExpiresAt: u.filter_pass_expires_at };
  }));
  const schema = { type: 'object', additionalProperties: false, properties };
  async function list(c: PoolClient, u: any, f: Filters, refresh: boolean) {
    if (f.minAge !== undefined && f.maxAge !== undefined && f.minAge > f.maxAge) fail(400, 'Invalid age range');
    let batchId = f.batchId;
    let filters = selection(f);
    if (batchId) {
      const batch = await c.query('SELECT filters FROM discovery_batches WHERE id=$1 AND user_id=$2', [batchId, u.id]);
      if (!batch.rowCount) fail(404, 'Batch not found');
      const saved = batch.rows[0].filters;
      if (Object.values(filters).some(x => x !== null) && JSON.stringify(filters) !== JSON.stringify(selection(saved))) fail(400, 'Batch filters cannot change');
      filters = saved;
    }
    const hasAdvanced = advanced({ ...filters, city: filters.city ?? undefined, minAge: filters.minAge ?? undefined, maxAge: filters.maxAge ?? undefined } as Filters);
    if (hasAdvanced && !active(u)) return { state: 'filters-free', locked: true, code: 'FILTER_PASS_REQUIRED',
      message: '开通 Filter Pass 后可按年龄和城市筛选', items: [], hasMore: false, nextOffset: null, batchId: null };
    if (refresh && batchId) fail(400, 'Refresh does not accept batchId');
    if (!batchId) {
      if (f.offset !== 0) fail(400, 'Pagination requires batchId');
      // authenticate locks the user row: concurrent refreshes/devices cannot reserve the same opening.
      batchId = randomUUID();
      await c.query('INSERT INTO discovery_batches(id,user_id,filters) VALUES($1,$2,$3)', [batchId, u.id, filters]);
      await c.query(`INSERT INTO discovery_seen(user_id,opening_message_id,batch_id,position)
        SELECT $1,v.opening_message_id,$2,(row_number() OVER(ORDER BY m.created_at,m.id))::int-1
        FROM conversations v JOIN messages m ON m.id=v.opening_message_id JOIN users u ON u.id=v.opener_id
        WHERE v.peer_id=$1 AND ${visible}
        AND ($3::text IS NULL OR u.gender=$3) AND ($4::text IS NULL OR u.city=$4)
        AND ($5::int IS NULL OR u.age >= $5) AND ($6::int IS NULL OR u.age <= $6)
        AND NOT EXISTS(SELECT 1 FROM discovery_seen s WHERE s.user_id=$1 AND s.opening_message_id=v.opening_message_id)
        ORDER BY m.created_at,m.id LIMIT $7`, [u.id,batchId,filters.gender,filters.city,filters.minAge,filters.maxAge,f.limit]);
    }
    const result = await c.query(`SELECT ${columns},s.position FROM discovery_seen s
      JOIN conversations v ON v.opening_message_id=s.opening_message_id
      JOIN messages m ON m.id=v.opening_message_id JOIN users u ON u.id=v.opener_id
      WHERE s.user_id=$1 AND s.batch_id=$2 AND v.peer_id=$1 AND ${visible} AND s.position >= $3
      ORDER BY s.position LIMIT $4`, [u.id,batchId,f.offset,f.limit+1]);
    const items = result.rows.slice(0,f.limit), hasMore = result.rows.length > f.limit;
    const responses = await c.query(`SELECT DISTINCT v.opening_message_id,r.id FROM conversations v
      JOIN users u ON u.id=v.opener_id JOIN messages r ON r.conversation_id=v.id AND r.sender_id=v.opener_id AND r.kind='reply'
      WHERE v.peer_id=$1 AND ${visible} AND NOT EXISTS
      (SELECT 1 FROM discovery_response_seen s WHERE s.user_id=$1 AND s.message_id=r.id)`, [u.id]);
    for (const r of responses.rows) await c.query('INSERT INTO discovery_response_seen(user_id,message_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[u.id,r.id]);
    return { state: responses.rowCount ? 'home-response' : items.length ? 'home-ready' : 'home-empty',
      filterState: Object.values(filters).some(x => x !== null) ? 'filters-selected' : active(u) ? 'filters-active' : 'filters-free',
      locked: false, batchId, items: items.map(letter), hasMore,
      nextOffset: hasMore ? items[items.length-1].position+1 : null,
      responses: responses.rows.map(r => ({ openingMessageId: r.opening_message_id })) };
  }
  app.get<{ Querystring: Filters }>('/letters', { schema: { querystring: schema } }, async request => transaction(async c =>
    list(c, await authenticate(c, request.headers.authorization), request.query, false)));
  app.post<{ Body: Filters }>('/letters/refresh', { schema: { body: schema } }, async request => transaction(async c =>
    list(c, await authenticate(c, request.headers.authorization), request.body, true)));
  app.get<{ Params: { id: string } }>('/letters/:id', { schema: { params: { type: 'object', required: ['id'], properties: { id: { type: 'string', format: 'uuid' } } } } }, async request => transaction(async c => {
    const user = await authenticate(c, request.headers.authorization);
    const result = await c.query(`SELECT ${columns} FROM conversations v JOIN messages m ON m.id=v.opening_message_id
      JOIN users u ON u.id=v.opener_id WHERE v.peer_id=$1 AND v.opening_message_id=$2 AND ${visible}`, [user.id,request.params.id]);
    if (!result.rowCount) fail(404, 'Letter not found');
    return letter(result.rows[0]);
  }));
}
