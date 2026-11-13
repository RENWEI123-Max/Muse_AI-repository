import { profileVisible } from './posts.js';
import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { lockPair } from './moderation.js';
const uuid = { type: 'string', format: 'uuid' };
const fail = (statusCode: number, message: string): never => { throw Object.assign(new Error(message), { statusCode }); };

// Used for profile JSON and avatar bytes so a media URL cannot bypass a block.
export async function profileAccess(c: PoolClient, viewer: string, id: string) {
 if (viewer !== id) await lockPair(c, viewer, id);
 const u = (await c.query('SELECT id,display_name,age,city,bio,zodiac,avatar,visibility,deleted_at,is_suspended FROM users WHERE id=$1', [id])).rows[0];
 if (!u) fail(404, 'Profile not found');
 if (u.deleted_at) fail(410, 'Account deleted');
 if (u.is_suspended) fail(403, 'Account suspended');
 if (viewer !== id && (await c.query('SELECT 1 FROM user_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)', [viewer,id])).rowCount) fail(403, 'Conversation blocked');
 if (!(await c.query(`SELECT 1 FROM users u WHERE u.id=$2 AND ${profileVisible('u')}`, [viewer,id])).rowCount) fail(403, 'Profile is private');
 return u;
}
export function registerProfiles(app: FastifyInstance,
 transaction: (work: (c: PoolClient) => Promise<unknown>) => Promise<unknown>,
 authenticate: (c: PoolClient, authorization?: string) => Promise<any>) {
 async function view(c: PoolClient, viewer: string, id: string) {
  const u = await profileAccess(c, viewer, id);
  const avatars = (await c.query(`SELECT media_id AS "mediaId",'/media/uploads/'||media_id AS url,position FROM profile_avatars WHERE user_id=$1 AND removed_at IS NULL ORDER BY position`, [id])).rows;
  const v = (await c.query(`SELECT v.id,v.unlocked_at,COALESCE(p.following,false) following FROM conversations v
   LEFT JOIN conversation_preferences p ON p.conversation_id=v.id AND p.user_id=$1
   WHERE (v.opener_id=$1 AND v.peer_id=$2) OR (v.opener_id=$2 AND v.peer_id=$1)`, [viewer,id])).rows[0];
  const own = viewer === id;
  if (!own) await c.query(`INSERT INTO profile_visits(visitor_id,profile_id) VALUES($1,$2) ON CONFLICT(visitor_id,profile_id) DO UPDATE SET visited_at=clock_timestamp()`,[viewer,id]);
  return { id:u.id, displayName:u.display_name, age:u.age, city:u.city, bio:u.bio, zodiac:u.zodiac, visibility:u.visibility, avatar:u.avatar, avatars,
   following:!own && !!v?.following,
   permissions:{canOpen:!own && !v,canChat:!own && v?.unlocked_at != null,canFollow:!own && v?.unlocked_at != null,conversationId:v?.id ?? null},
   ...(own ? {recentlyRemoved:(await c.query(`SELECT media_id AS "mediaId",'/media/uploads/'||media_id AS url,position,removed_at AS "removedAt" FROM profile_avatars WHERE user_id=$1 AND removed_at IS NOT NULL ORDER BY removed_at DESC,media_id`, [id])).rows} : {}) };
 }
 app.get('/profiles/me/stats', async req => transaction(async c => {
  const u = await authenticate(c,req.headers.authorization);
  const counts = (await c.query(`SELECT
   (SELECT count(*)::integer FROM conversation_preferences p JOIN conversations v ON v.id=p.conversation_id
    WHERE p.user_id=$1 AND p.following AND p.user_id IN (v.opener_id,v.peer_id)) AS "followingCount",
   (SELECT count(*)::integer FROM conversation_preferences p JOIN conversations v ON v.id=p.conversation_id
    WHERE p.following AND p.user_id<>$1 AND ((v.opener_id=$1 AND v.peer_id=p.user_id) OR (v.peer_id=$1 AND v.opener_id=p.user_id))) AS "followersCount",
   ((SELECT count(*) FROM post_likes l JOIN user_posts p ON p.id=l.post_id WHERE p.user_id=$1) +
    (SELECT count(*) FROM image_card_likes l JOIN image_cards i ON i.id=l.image_card_id WHERE i.user_id=$1))::integer AS "likesCount"`,[u.id])).rows[0];
  const visits = (await c.query(`SELECT visitor_id AS "visitorId",profile_id AS "profileId",visited_at AS "visitedAt"
   FROM profile_visits WHERE visitor_id=$1 OR profile_id=$1 ORDER BY visited_at DESC,visitor_id,profile_id`,[u.id])).rows;
  const letters = (await c.query(`SELECT m.id,m.conversation_id AS "conversationId",m.content,m.created_at AS "createdAt"
   FROM messages m JOIN conversations v ON v.id=m.conversation_id
   WHERE m.sender_id=$1 AND m.kind='opening' AND v.opener_id=$1 ORDER BY m.created_at DESC,m.id DESC`,[u.id])).rows;
  return {...counts,visits,letters};
 }));
 app.get<{Params:{id:string}}>('/profiles/:id', {schema:{params:{type:'object',required:['id'],properties:{id:{type:'string',pattern:'^(me|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$'}}}}}, async req => transaction(async c => {
  const u = await authenticate(c,req.headers.authorization);
  return view(c,u.id,req.params.id === 'me' ? u.id : req.params.id);
 }));
 app.patch<{Body:{displayName?:string;age?:number;city?:string;bio?:string;zodiac?:string|null;visibility?:string}}>('/profiles/me', {schema:{body:{type:'object',additionalProperties:false,minProperties:1,properties:{displayName:{type:'string',maxLength:24},age:{type:'integer'},city:{type:'string',maxLength:40},bio:{type:'string',maxLength:200},zodiac:{type:['string','null'],enum:['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',null]},visibility:{type:'string',enum:['everyone','friends','only_me']}}}}}, async req => transaction(async c => {
  const u = await authenticate(c,req.headers.authorization), b = req.body;
  if ((b.displayName !== undefined && !b.displayName.trim()) || (b.age !== undefined && (b.age < 18 || b.age > 100))) fail(400,'Enter a name and an age between 18 and 100.');
  await c.query(`UPDATE users SET display_name=COALESCE($2,display_name),age=COALESCE($3,age),city=COALESCE($4,city),bio=COALESCE($5,bio),visibility=COALESCE($6,visibility),zodiac=COALESCE($7,zodiac) WHERE id=$1`, [u.id,b.displayName?.trim(),b.age,b.city?.trim(),b.bio,b.visibility,b.zodiac]);
  return view(c,u.id,u.id);
 }));
 app.post<{Body:{action:string;mediaId:string;confirm?:boolean}}>('/profiles/me/avatars', {schema:{body:{type:'object',additionalProperties:false,required:['action','mediaId'],properties:{action:{type:'string',enum:['add','select','remove','restore']},mediaId:uuid,confirm:{type:'boolean'}}}}}, async req => transaction(async c => {
  // authenticate locks the owner row, serializing slot allocation and main-avatar changes.
  const u = await authenticate(c,req.headers.authorization), b = req.body;
  const media = (await c.query('SELECT uploader_id,purpose,kind FROM media_uploads WHERE id=$1 FOR SHARE',[b.mediaId])).rows[0];
  if (!media) fail(404,'Media not found');
  if (media.uploader_id !== u.id) fail(403,'Media belongs to another user');
  if (media.purpose !== 'avatar' || media.kind !== 'image') fail(400,'Avatar requires an avatar image upload');
  const rows = (await c.query('SELECT * FROM profile_avatars WHERE user_id=$1 ORDER BY position',[u.id])).rows;
  const current = rows.find(r => r.media_id === b.mediaId), active = rows.filter(r => !r.removed_at);
  if (b.action === 'add' || b.action === 'restore') {
   if (!current || current.removed_at) {
    if (b.action === 'restore' && !current) fail(404,'Archived avatar not found');
    if (b.action === 'add' && current) fail(409,'Use restore for archived avatar');
    if (active.length === 8) fail(409,'All 8 avatar slots are occupied');
    const position = Array.from({length:8},(_,i)=>i).find(i=>!active.some(r=>r.position===i))!;
    await c.query(`INSERT INTO profile_avatars(user_id,media_id,position) VALUES($1,$2,$3) ON CONFLICT(user_id,media_id) DO UPDATE SET position=$3,removed_at=NULL`,[u.id,b.mediaId,position]);
    if (!active.length) await c.query("UPDATE users SET avatar='/media/uploads/'||$2::text WHERE id=$1",[u.id,b.mediaId]);
   }
  } else {
   if (!current) fail(404,'Avatar not found');
   if (b.action === 'select') {
    if (current.removed_at) fail(409,'Avatar is archived');
    await c.query("UPDATE users SET avatar='/media/uploads/'||$2::text WHERE id=$1",[u.id,b.mediaId]);
   } else {
    if (b.confirm !== true) fail(400,'Removal confirmation required');
    if (!current.removed_at) {
     await c.query('UPDATE profile_avatars SET removed_at=clock_timestamp() WHERE user_id=$1 AND media_id=$2',[u.id,b.mediaId]);
     if (u.avatar === `/media/uploads/${b.mediaId}`) await c.query('UPDATE users SET avatar=$2 WHERE id=$1',[u.id,active.filter(r=>r.media_id!==b.mediaId).map(r=>`/media/uploads/${r.media_id}`)[0] ?? null]);
    }
   }
  }
  return view(c,u.id,u.id);
 }));
}
