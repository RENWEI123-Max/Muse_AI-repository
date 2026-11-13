import { profileVisible } from './posts.js';
import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
const uuid={type:'string',format:'uuid'};
const params={type:'object',required:['id'],properties:{id:uuid}};
const pagination={offset:{type:'integer',minimum:0,default:0},limit:{type:'integer',minimum:1,maximum:100,default:20}};
const visible=`NOT EXISTS(SELECT 1 FROM users sender WHERE sender.id=m.sender_id AND sender.is_suspended) AND (m.kind='opening' OR m.sender_id=$1 OR EXISTS(SELECT 1 FROM reply_collections r WHERE r.reply_id=m.id AND r.user_id=$1))
 AND (p.cleared_at IS NULL OR m.created_at>p.cleared_at)`;
export function registerInbox(app:FastifyInstance,transaction:(work:(c:PoolClient)=>Promise<unknown>)=>Promise<unknown>,authenticate:(c:PoolClient,authorization?:string)=>Promise<any>){
 async function own(c:PoolClient,id:string,user:string){
  const v=(await c.query('SELECT * FROM conversations WHERE id=$1 AND (opener_id=$2 OR peer_id=$2)',[id,user])).rows[0];
  if(!v)throw Object.assign(Error('Conversation not found'),{statusCode:404});
  return v;
 }
 async function rows(c:PoolClient,user:string){return (await c.query(`SELECT v.id,u.display_name AS "displayName",u.avatar,
 CASE WHEN v.opener_id=$1 THEN v.peer_id ELSE v.opener_id END AS "peerId",v.opening_message_id AS "openingMessageId",
 COALESCE(p.remark,'') remark,COALESCE(p.pinned,false) pinned,COALESCE(p.muted,false) muted,
 COALESCE(p.hidden,false) hidden,COALESCE(p.following,false) following,COALESCE(p.background,'') background,COALESCE(p.bubble,'') bubble,
 v.unlocked_at IS NOT NULL AS unlocked,CASE WHEN v.unlocked_at IS NULL THEN 'waiting' ELSE 'open' END status,
 (SELECT count(*)::int FROM messages m JOIN reply_collections r ON r.reply_id=m.id AND r.user_id=$1
 WHERE m.conversation_id=v.id AND ${visible} AND r.created_at>COALESCE(p.read_at,'epoch')) AS "unreadCount",
 (SELECT m.content FROM messages m WHERE m.conversation_id=v.id AND ${visible} ORDER BY m.created_at DESC,m.id DESC LIMIT 1) AS "lastMessage",
 COALESCE((SELECT max(m.created_at) FROM messages m WHERE m.conversation_id=v.id AND ${visible}),v.created_at) AS "updatedAt"
 FROM conversations v JOIN users u ON u.id=CASE WHEN v.opener_id=$1 THEN v.peer_id ELSE v.opener_id END
 LEFT JOIN conversation_preferences p ON p.conversation_id=v.id AND p.user_id=$1
 WHERE (v.opener_id=$1 OR v.peer_id=$1) AND ${profileVisible('u')} ORDER BY COALESCE(p.pinned,false) DESC,"updatedAt" DESC,v.id`,[user])).rows;}
 app.get<{Querystring:{tab:string;hidden:boolean;offset:number;limit:number}}>('/conversations',{schema:{querystring:{type:'object',additionalProperties:false,properties:{...pagination,tab:{type:'string',enum:['messages','friends'],default:'messages'},hidden:{type:'boolean',default:false}}}}},async req=>transaction(async c=>{
  const u=await authenticate(c,req.headers.authorization),q=req.query;
  const all=(await rows(c,u.id)).filter(v=>v.hidden===q.hidden&&(q.tab!=='friends'||v.following));
  return {items:all.slice(q.offset,q.offset+q.limit),hasMore:q.offset+q.limit<all.length};
 }));
 app.get<{Params:{id:string};Querystring:{offset:number;limit:number}}>('/conversations/:id/replies/pending',{schema:{params,querystring:{type:'object',additionalProperties:false,properties:pagination}}},async req=>transaction(async c=>{
  const u=await authenticate(c,req.headers.authorization);await own(c,req.params.id,u.id);
  const items=(await c.query(`SELECT m.id,m.created_at AS "createdAt" FROM messages m WHERE m.conversation_id=$1 AND m.kind='reply' AND m.sender_id<>$2
  AND NOT EXISTS(SELECT 1 FROM users sender WHERE sender.id=m.sender_id AND sender.is_suspended)
  AND NOT EXISTS(SELECT 1 FROM reply_collections r WHERE r.reply_id=m.id AND r.user_id=$2) ORDER BY m.created_at,m.id LIMIT $3 OFFSET $4`,[req.params.id,u.id,req.query.limit+1,req.query.offset])).rows;
  const {rows:[quota]}=await c.query(`SELECT count(*)::int AS used FROM reply_collections WHERE user_id=$1
  AND created_at >= (date_trunc('day',clock_timestamp() AT TIME ZONE 'Asia/Shanghai') AT TIME ZONE 'Asia/Shanghai')
  AND created_at < ((date_trunc('day',clock_timestamp() AT TIME ZONE 'Asia/Shanghai')+interval '1 day') AT TIME ZONE 'Asia/Shanghai')`,[u.id]);
  const freeRemaining=Math.max(0,10-quota.used);
  return {items:items.slice(0,req.query.limit),hasMore:items.length>req.query.limit,freeRemaining,used:quota.used,nextCost:freeRemaining?0:10,diamonds:u.diamonds};
 }));
 app.get<{Params:{id:string};Querystring:{offset:number;limit:number;search:string;markRead:boolean}}>('/conversations/:id/messages',{schema:{params,querystring:{type:'object',additionalProperties:false,properties:{...pagination,search:{type:'string',maxLength:200,default:''},markRead:{type:'boolean',default:false}}}}},async req=>transaction(async c=>{
  const u=await authenticate(c,req.headers.authorization);const v=await own(c,req.params.id,u.id);
  const q=req.query;
  const items=(await c.query(`SELECT m.id,m.kind,m.content,m.sender_id AS "senderId",(m.sender_id=$1) AS mine,m.media_id AS "mediaId",m.created_at AS "createdAt"
  FROM messages m LEFT JOIN conversation_preferences p ON p.conversation_id=m.conversation_id AND p.user_id=$1
  WHERE m.conversation_id=$2 AND ${visible} AND ($3='' OR strpos(lower(m.content),lower($3))>0)
  ORDER BY m.created_at,m.id LIMIT $4 OFFSET $5`,[u.id,v.id,q.search,q.limit+1,q.offset])).rows;
  if(q.markRead)await c.query(`INSERT INTO conversation_preferences(user_id,conversation_id,read_at) VALUES($1,$2,clock_timestamp())
  ON CONFLICT(user_id,conversation_id) DO UPDATE SET read_at=EXCLUDED.read_at`,[u.id,v.id]);
  return {items:items.slice(0,q.limit),hasMore:items.length>q.limit,unlocked:v.unlocked_at!=null};
 }));
 const properties={remark:{type:'string',maxLength:200},pinned:{type:'boolean'},muted:{type:'boolean'},hidden:{type:'boolean'},following:{type:'boolean'},background:{type:'string',maxLength:500},bubble:{type:'string',maxLength:500},clearHistory:{type:'boolean'}};
 app.patch<{Params:{id:string};Body:Record<string,any>}>('/conversations/:id',{schema:{params,body:{type:'object',additionalProperties:false,minProperties:1,properties}}},async req=>transaction(async c=>{
  const u=await authenticate(c,req.headers.authorization);await own(c,req.params.id,u.id);
  await c.query('INSERT INTO conversation_preferences(user_id,conversation_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[u.id,req.params.id]);
  for(const key of ['remark','pinned','muted','hidden','following','background','bubble'])if(req.body[key]!==undefined)
   await c.query(`UPDATE conversation_preferences SET ${key}=$3 WHERE user_id=$1 AND conversation_id=$2`,[u.id,req.params.id,req.body[key]]);
  if(req.body.clearHistory)await c.query('UPDATE conversation_preferences SET cleared_at=clock_timestamp(),read_at=clock_timestamp() WHERE user_id=$1 AND conversation_id=$2',[u.id,req.params.id]);
  return (await rows(c,u.id)).find(v=>v.id===req.params.id);
 }));
}
