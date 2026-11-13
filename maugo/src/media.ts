import { profileAccess } from './profiles.js';
import { contentVisible } from './posts.js';
import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import { lockPair } from './moderation.js';

const MB = 1024 * 1024;
const formats: Record<string, { extensions: string[]; kind: string; limit: number }> = {
 'image/jpeg': { extensions:['jpg','jpeg'],kind:'image',limit:10*MB },
 'image/png': { extensions:['png'],kind:'image',limit:10*MB },
 'image/webp': { extensions:['webp'],kind:'image',limit:10*MB },
 'audio/ogg': { extensions:['ogg','opus'],kind:'audio',limit:10*MB },
 'audio/wav': { extensions:['wav'],kind:'audio',limit:10*MB },
 'audio/mpeg': { extensions:['mp3'],kind:'audio',limit:10*MB },
 'video/mp4': { extensions:['mp4'],kind:'video',limit:30*MB },
 'video/webm': { extensions:['webm'],kind:'video',limit:30*MB }
};
const uuid = {type:'string',format:'uuid'};
const fail = (statusCode:number,message:string):never => { throw Object.assign(new Error(message),{statusCode}); };
export function registerMedia(app: FastifyInstance,
 transaction:(work:(c:PoolClient)=>Promise<unknown>)=>Promise<unknown>,
 authenticate:(c:PoolClient,authorization?:string)=>Promise<any>) {
 const directory=resolve(process.env.MEDIA_DIRECTORY || 'var/media');
 async function authorize(c:PoolClient,authorization:string|undefined,purpose:string,conversationId?:string) {
  const u=await authenticate(c,authorization);
  if(purpose==='chat') {
   if(!conversationId) fail(400,'conversationId required for chat');
   const v=(await c.query('SELECT * FROM conversations WHERE id=$1 AND (opener_id=$2 OR peer_id=$2)',[conversationId,u.id])).rows[0];
   if(!v) fail(404,'Conversation not found');
   const peer=u.id===v.opener_id?v.peer_id:v.opener_id;
   await lockPair(c,u.id,peer);
   if((await c.query('SELECT 1 FROM user_blocks WHERE (blocker_id=$1 AND blocked_id=$2) OR (blocker_id=$2 AND blocked_id=$1)',[u.id,peer])).rowCount) fail(403,'Conversation blocked');
   const account=(await c.query('SELECT * FROM users WHERE id=$1',[peer])).rows[0];
   if(account?.deleted_at) fail(410,'Account deleted');
   if(account?.is_suspended) fail(403,'Account suspended');
   if(!v.unlocked_at) fail(403,'Wait for recipient reply');
  } else if(conversationId) fail(400,'conversationId only allowed for chat');
  if(purpose==='avatar' && (await c.query('SELECT count(*)::int AS count FROM profile_avatars WHERE user_id=$1 AND removed_at IS NULL',[u.id])).rows[0].count>=8) fail(409,'All 8 avatar slots are occupied');
  return u;
 }
 // Encapsulated parser accepts raw bytes, never multipart or client supplied base64 sizes.
 app.register(async media=>{
  media.addContentTypeParser('*',{parseAs:'buffer',bodyLimit:30*MB},(_r,b,done)=>done(null,b));
  media.post<{Querystring:{purpose:string;filename:string;conversationId?:string}}>('/media/uploads',{
   bodyLimit:30*MB,
   schema:{querystring:{type:'object',additionalProperties:false,required:['purpose','filename'],properties:{purpose:{type:'string',enum:['chat','avatar','post','report']},filename:{type:'string',minLength:1,maxLength:128,pattern:'^[A-Za-z0-9][A-Za-z0-9_-]*\\.[A-Za-z0-9]+$'},conversationId:uuid}}},
   preParsing:async request=>{
    // Query validation normally runs after parsing: validate permission context before reading bytes.
    const q=request.query;
    if(!['chat','avatar','post','report'].includes(q.purpose)) fail(400,'Invalid purpose');
    if(q.conversationId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q.conversationId)) fail(400,'Invalid conversationId');
    await transaction(c=>authorize(c,request.headers.authorization,q.purpose,q.conversationId));
   }
  },async(request,reply)=>{
   const q=request.query;
   if(!Buffer.isBuffer(request.body)||!request.body.length) fail(400,'Empty or invalid media body');
   const bytes=request.body as Buffer;
   const declared=request.headers['content-type']?.split(';')[0].trim().toLowerCase() || '';
   const format=formats[declared];
   if(!format) fail(415,'Unsupported media type');
   if(bytes.length>=format.limit) fail(413,'Media size limit exceeded');
   if(['avatar','report'].includes(q.purpose) && format.kind!=='image') fail(415,'Purpose requires an image');
   let detected;
   try { detected=await fileTypeFromBuffer(bytes); } catch { fail(415,'Invalid media content'); }
   if(!detected || detected.mime!==declared || !format.extensions.includes(q.filename.split('.').pop()!.toLowerCase())) fail(415,'Media content, type and extension must match');
   const id=randomUUID(),path=join(directory,id);
   let written=false;
   try {
    const result=await transaction(async c=>{
     const u=await authorize(c,request.headers.authorization,q.purpose,q.conversationId);
     await mkdir(directory,{recursive:true,mode:0o700});
     await writeFile(path,bytes,{flag:'wx',mode:0o600}); written=true;
     const row=(await c.query(`INSERT INTO media_uploads(id,uploader_id,purpose,conversation_id,kind,mime_type,size_bytes,original_name)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING created_at`,[id,u.id,q.purpose,q.conversationId??null,format.kind,declared,bytes.length,q.filename])).rows[0];
     return {id,url:`/media/uploads/${id}`,uploaderId:u.id,purpose:q.purpose,kind:format.kind,mimeType:declared,size:bytes.length,createdAt:row.created_at};
    });
    return reply.code(201).send(result);
   } catch(error) { if(written) await unlink(path); throw error; }
  });
 });
 app.get<{Params:{id:string}}>('/media/uploads/:id',{schema:{params:{type:'object',required:['id'],properties:{id:uuid}}}},async(request,reply)=>{
  const result:any=await transaction(async c=>{
   const u=await authenticate(c,request.headers.authorization);
   const row=(await c.query('SELECT * FROM media_uploads WHERE id=$1',[request.params.id])).rows[0];
   if(!row) fail(404,'Media not found');
   if(row.purpose==='chat') await authorize(c,request.headers.authorization,'chat',row.conversation_id);
   else if(row.purpose==='avatar' && row.uploader_id!==u.id) {
    await profileAccess(c,u.id,row.uploader_id);
    if(!(await c.query('SELECT 1 FROM profile_avatars WHERE user_id=$1 AND media_id=$2 AND removed_at IS NULL',[row.uploader_id,row.id])).rowCount) fail(403,'Avatar is not public');
   } else if(row.uploader_id!==u.id) {
    const evidence=row.purpose==='report' && u.is_moderator && (await c.query('SELECT 1 FROM reports WHERE attachment_media_id=$1',[row.id])).rowCount;
    const published=row.purpose==='post' && (await c.query(`SELECT 1 FROM user_posts p JOIN post_attachments a ON a.post_id=p.id WHERE a.media_id=$2 AND ${contentVisible('p')}
     UNION ALL SELECT 1 FROM image_cards p WHERE p.media_id=$2 AND ${contentVisible('p')} LIMIT 1`,[u.id,row.id])).rowCount;
    if(!evidence && !published) fail(403,'Media belongs to another user');
   }
   return row;
  });
  let bytes; try {bytes=await readFile(join(directory,request.params.id));} catch(error:any) {if(error.code==='ENOENT') fail(404,'Media file missing');throw error;}
  return reply.header('X-Content-Type-Options','nosniff').header('Cache-Control','private, no-store').header('Content-Disposition','inline').type(result.mime_type).send(bytes);
 });
 app.post<{Params:{id:string};Body:{mediaId:string}}>('/conversations/:id/media',{
  schema:{params:{type:'object',required:['id'],properties:{id:uuid}},body:{type:'object',additionalProperties:false,required:['mediaId'],properties:{mediaId:uuid}}}
 },async(request,reply)=>{
  const result=await transaction(async c=>{
   const u=await authorize(c,request.headers.authorization,'chat',request.params.id);
   const row=(await c.query("SELECT * FROM media_uploads WHERE id=$1 AND uploader_id=$2 AND purpose='chat' AND conversation_id=$3",[request.body.mediaId,u.id,request.params.id])).rows[0];
   if(!row) fail(404,'Media not found');
   const id=randomUUID();
   await c.query("INSERT INTO messages(id,conversation_id,sender_id,kind,content,media_id) VALUES($1,$2,$3,'reply',$4,$5)",[id,request.params.id,u.id,`/media/uploads/${row.id}`,row.id]);
   return {id,conversationId:request.params.id,mediaId:row.id};
  });
  return reply.code(201).send(result);
 });
}
