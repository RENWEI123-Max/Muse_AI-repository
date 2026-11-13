import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';

const uuid={type:'string',format:'uuid'};
const visibility={type:'string',enum:['everyone','friends','only_me']};
const category={type:'string',enum:['Life','Portrait','Style','Outfit']};
const cardType={type:'string',enum:['portrait','physique','outfit','life']};
const params={type:'object',required:['id'],properties:{id:uuid}};
const fail=(statusCode:number,message:string):never=>{throw Object.assign(new Error(message),{statusCode});};
// $1 is the viewer. Friends use the existing collected-reply unlock ledger.
// Everyone permits strangers, but an existing pending conversation remains locked.
export function contentVisible(alias:string) {
 return `(${alias}.user_id=$1 OR (${alias}.visibility<>'only_me'
 AND EXISTS (SELECT 1 FROM users owner WHERE owner.id=${alias}.user_id AND owner.deleted_at IS NULL AND NOT owner.is_suspended)
 AND NOT EXISTS (SELECT 1 FROM user_blocks b WHERE (b.blocker_id=$1 AND b.blocked_id=${alias}.user_id) OR (b.blocked_id=$1 AND b.blocker_id=${alias}.user_id))
 AND NOT EXISTS (SELECT 1 FROM conversations v WHERE ((v.opener_id=$1 AND v.peer_id=${alias}.user_id) OR (v.peer_id=$1 AND v.opener_id=${alias}.user_id)) AND v.unlocked_at IS NULL)
 AND (${alias}.visibility='everyone' OR EXISTS (SELECT 1 FROM conversations v WHERE ((v.opener_id=$1 AND v.peer_id=${alias}.user_id) OR (v.peer_id=$1 AND v.opener_id=${alias}.user_id)) AND v.unlocked_at IS NOT NULL))))`;
}
export function registerPosts(app:FastifyInstance,
 transaction:(work:(c:PoolClient)=>Promise<unknown>)=>Promise<unknown>,
 authenticate:(c:PoolClient,authorization?:string)=>Promise<any>) {
 async function media(c:PoolClient,ids:string[],owner:string,imageOnly=false) {
  const rows=(await c.query('SELECT * FROM media_uploads WHERE id=ANY($1::uuid[])',[ids])).rows;
  if(rows.length!==ids.length) fail(400,'Media missing or duplicated');
  for(const row of rows) {
   if(row.uploader_id!==owner) fail(403,'Media belongs to another user');
   const types:Record<string,string[]>={image:['image/jpeg','image/png','image/webp'],audio:['audio/ogg','audio/wav','audio/mpeg'],video:['video/mp4','video/webm']};
   if(row.purpose!=='post' || (imageOnly && row.kind!=='image') || !types[row.kind]?.includes(row.mime_type)) fail(400,'Invalid media type or purpose');
   if(row.size_bytes<=0 || row.size_bytes>=(row.kind==='video'?30:10)*1024*1024) fail(400,'Media size limit exceeded');
  }
 }
 const post=(r:any,attachments:any[])=>({id:r.id,userId:r.user_id,content:r.content,visibility:r.visibility,category:r.category,createdAt:r.created_at,attachments});
 async function attachments(c:PoolClient,id:string) {
  return (await c.query(`SELECT m.id, '/media/uploads/'||m.id AS url,m.kind,m.mime_type AS "mimeType",m.size_bytes AS size
   FROM post_attachments a JOIN media_uploads m ON m.id=a.media_id WHERE a.post_id=$1 ORDER BY a.position`,[id])).rows;
 }
 app.post<{Body:{content:string;mediaIds?:string[];visibility?:string;category?:string}}>('/posts',{
  schema:{body:{type:'object',additionalProperties:false,required:['content'],properties:{content:{type:'string',maxLength:1000},mediaIds:{type:'array',maxItems:6,uniqueItems:true,items:uuid},visibility,category}}}
 },async(request,reply)=>{
  const result=await transaction(async c=>{
   const u=await authenticate(c,request.headers.authorization),b=request.body,ids=b.mediaIds??[];
   if([...b.content].length>1000 || (!b.content.trim()&&!ids.length)) fail(400,'Post requires text or media, up to 1000 characters');
   await media(c,ids,u.id);
   const row=(await c.query('INSERT INTO user_posts(id,user_id,content,visibility,category) VALUES($1,$2,$3,$4,$5) RETURNING *',[randomUUID(),u.id,b.content,b.visibility??'everyone',b.category??'Life'])).rows[0];
   for(const [position,id] of ids.entries()) await c.query('INSERT INTO post_attachments(post_id,media_id,position) VALUES($1,$2,$3)',[row.id,id,position]);
   return post(row,await attachments(c,row.id));
  });return reply.code(201).send(result);
 });
 app.get<{Querystring:{limit?:number;offset?:number;userId?:string;category?:string}}>('/posts',{
  schema:{querystring:{type:'object',additionalProperties:false,properties:{limit:{type:'integer',minimum:1,maximum:100,default:20},offset:{type:'integer',minimum:0,default:0},userId:uuid,category:{type:'string',enum:['All',...category.enum]}}}}
 },async request=>transaction(async c=>{
  const u=await authenticate(c,request.headers.authorization),q=request.query;
  const rows=(await c.query(`SELECT p.* FROM user_posts p WHERE ${contentVisible('p')} AND ($2::uuid IS NULL OR p.user_id=$2) AND ($5::text IS NULL OR p.category=$5) ORDER BY p.created_at DESC,p.id DESC LIMIT $3 OFFSET $4`,[u.id,q.userId??null,q.limit,q.offset,q.category==='All'?null:q.category??null])).rows;
  const items=[];for(const row of rows) items.push(post(row,await attachments(c,row.id)));
  return {items,limit:q.limit,offset:q.offset};
 }));
 app.get<{Params:{id:string}}>('/posts/:id',{schema:{params}},async request=>transaction(async c=>{
  const u=await authenticate(c,request.headers.authorization);
  const row=(await c.query('SELECT * FROM user_posts WHERE id=$1',[request.params.id])).rows[0];
  if(!row) fail(404,'Post not found');
  if(!(await c.query(`SELECT 1 FROM user_posts p WHERE p.id=$2 AND ${contentVisible('p')}`,[u.id,row.id])).rowCount) fail(403,'Post is not visible');
  return post(row,await attachments(c,row.id));
 }));
 app.patch<{Params:{id:string};Body:{visibility?:string;category?:string}}>('/posts/:id',{
  schema:{params,body:{type:'object',additionalProperties:false,minProperties:1,properties:{visibility,category}}}
 },async request=>transaction(async c=>{
  const u=await authenticate(c,request.headers.authorization),b=request.body;
  const row=(await c.query('SELECT user_id FROM user_posts WHERE id=$1',[request.params.id])).rows[0];
  if(!row) fail(404,'Post not found');if(row.user_id!==u.id) fail(403,'Only the author can update a post');
  const updated=(await c.query('UPDATE user_posts SET visibility=COALESCE($2,visibility),category=COALESCE($3,category) WHERE id=$1 RETURNING *',[request.params.id,b.visibility??null,b.category??null])).rows[0];
  return post(updated,await attachments(c,updated.id));
 }));
 app.delete<{Params:{id:string}}>('/posts/:id',{schema:{params}},async request=>transaction(async c=>{
  const u=await authenticate(c,request.headers.authorization);
  const row=(await c.query('SELECT user_id FROM user_posts WHERE id=$1',[request.params.id])).rows[0];
  if(!row) fail(404,'Post not found');if(row.user_id!==u.id) fail(403,'Only the author can delete a post');
  await c.query('DELETE FROM user_posts WHERE id=$1',[request.params.id]);return {deleted:true};
 }));
 const card=(r:any)=>({id:r.id,userId:r.user_id,mediaId:r.media_id,url:`/media/uploads/${r.media_id}`,type:r.type,isPrimary:r.is_primary,position:r.position,visibility:r.visibility,createdAt:r.created_at});
 app.get('/users/me/image-cards',async request=>transaction(async c=>{
  const u=await authenticate(c,request.headers.authorization);
  return {items:(await c.query('SELECT * FROM image_cards WHERE user_id=$1 ORDER BY position',[u.id])).rows.map(card)};
 }));
 app.post<{Body:{mediaId:string;type:string;visibility?:string}}>('/users/me/image-cards',{
  schema:{body:{type:'object',additionalProperties:false,required:['mediaId','type'],properties:{mediaId:uuid,type:cardType,visibility}}}
 },async(request,reply)=>{
  const result=await transaction(async c=>{
   const u=await authenticate(c,request.headers.authorization),b=request.body;
   await media(c,[b.mediaId],u.id,true);
   const cards=(await c.query('SELECT * FROM image_cards WHERE user_id=$1 ORDER BY position',[u.id])).rows;
   if(cards.length>=8) fail(409,'Image card slots are full');
   if(cards.some(r=>r.media_id===b.mediaId)) fail(409,'Image already associated');
   const position=Array.from({length:8},(_,i)=>i).find(i=>!cards.some(r=>r.position===i))!;
   return card((await c.query('INSERT INTO image_cards(id,user_id,media_id,type,is_primary,position,visibility) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',[randomUUID(),u.id,b.mediaId,b.type,cards.length===0,position,b.visibility??'everyone'])).rows[0]);
  });return reply.code(201).send(result);
 });
 app.patch<{Params:{id:string};Body:{type?:string;isPrimary?:boolean;visibility?:string}}>('/users/me/image-cards/:id',{
  schema:{params,body:{type:'object',additionalProperties:false,minProperties:1,properties:{type:cardType,isPrimary:{type:'boolean',const:true},visibility}}}
 },async request=>transaction(async c=>{
  const u=await authenticate(c,request.headers.authorization),b=request.body;
  if(!(await c.query('SELECT 1 FROM image_cards WHERE id=$1 AND user_id=$2',[request.params.id,u.id])).rowCount) fail(404,'Image card not found');
  if(b.isPrimary) await c.query('UPDATE image_cards SET is_primary=false WHERE user_id=$1 AND is_primary',[u.id]);
  return card((await c.query('UPDATE image_cards SET type=COALESCE($3,type),visibility=COALESCE($4,visibility),is_primary=COALESCE($5,is_primary) WHERE id=$1 AND user_id=$2 RETURNING *',[request.params.id,u.id,b.type??null,b.visibility??null,b.isPrimary??null])).rows[0]);
 }));
 app.delete<{Params:{id:string}}>('/users/me/image-cards/:id',{schema:{params}},async request=>transaction(async c=>{
  const u=await authenticate(c,request.headers.authorization);
  const row=(await c.query('DELETE FROM image_cards WHERE id=$1 AND user_id=$2 RETURNING *',[request.params.id,u.id])).rows[0];
  if(!row) fail(404,'Image card not found');
  if(row.is_primary) await c.query('UPDATE image_cards SET is_primary=true WHERE id=(SELECT id FROM image_cards WHERE user_id=$1 ORDER BY position LIMIT 1)',[u.id]);
  return {deleted:true};
 }));
}
