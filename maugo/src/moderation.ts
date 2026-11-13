import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';
const uuid = { type:'string',format:'uuid' };
const fail = (statusCode:number,message:string):never => { throw Object.assign(new Error(message),{statusCode}); };
export async function lockPair(c:PoolClient,a:string,b:string) {
  await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[[a,b].sort().join(':')]);
}
export function registerModeration(app:FastifyInstance,
  tx:(work:(c:PoolClient)=>Promise<unknown>)=>Promise<unknown>,
  auth:(c:PoolClient,authorization?:string)=>Promise<any>) {
  const params = {type:'object',required:['id'],properties:{id:uuid}};
  const page = {limit:{type:'integer',minimum:1,maximum:100,default:20},offset:{type:'integer',minimum:0,default:0}};
  const resultText = {type:'string',minLength:1,maxLength:2000,pattern:'\\S'};
  const view = `id,reporter_id AS "reporterId",reported_user_id AS "reportedUserId",message_id AS "messageId",attachment_media_id AS "attachmentMediaId",CASE WHEN attachment_media_id IS NULL THEN NULL ELSE json_build_object('id',attachment_media_id,'url','/media/uploads/'||attachment_media_id) END AS attachment,category,reason,status,created_at AS "createdAt",action,result,handled_by AS "handledBy",handled_at AS "handledAt"`;
  app.post<{Body:{reportedUserId:string;messageId?:string;attachmentMediaId?:string;category:string;reason:string}}>('/reports',{schema:{body:{type:'object',additionalProperties:false,required:['reportedUserId','category','reason'],properties:{reportedUserId:uuid,messageId:uuid,attachmentMediaId:uuid,category:{type:'string',enum:['spam','harassment','sexual','violence','hate','other']},reason:resultText}}}},async(req,reply)=>{
    const report=await tx(async c=>{
      const u=await auth(c,req.headers.authorization),b=req.body;
      if(u.id===b.reportedUserId) fail(400,'Cannot report yourself');
      if(!(await c.query('SELECT id FROM users WHERE id=$1',[b.reportedUserId])).rowCount) fail(404,'User not found');
      if(b.messageId && !(await c.query(`SELECT m.id FROM messages m JOIN conversations v ON v.id=m.conversation_id WHERE m.id=$1 AND m.sender_id=$2 AND (v.opener_id=$3 OR v.peer_id=$3)`,[b.messageId,b.reportedUserId,u.id])).rowCount) fail(404,'Message not found');
      if(b.attachmentMediaId) {
        const media=(await c.query('SELECT * FROM media_uploads WHERE id=$1 FOR SHARE',[b.attachmentMediaId])).rows[0];
        if(!media) fail(404,'Attachment not found');
        if(media.uploader_id!==u.id) fail(403,'Attachment belongs to another user');
        if(media.purpose!=='report' || media.kind!=='image') fail(400,'Attachment must be a report image');
      }
      return (await c.query(`INSERT INTO reports(id,reporter_id,reported_user_id,message_id,category,reason,attachment_media_id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING ${view}`,[randomUUID(),u.id,b.reportedUserId,b.messageId??null,b.category,b.reason,b.attachmentMediaId??null])).rows[0];
    }); return reply.code(201).send(report);
  });
  app.get<{Params:{id:string}}>('/reports/:id',{schema:{params}},async req=>tx(async c=>{
    const u=await auth(c,req.headers.authorization);
    const r=await c.query(`SELECT ${view} FROM reports WHERE id=$1 AND reporter_id=$2`,[req.params.id,u.id]);
    if(!r.rowCount) fail(404,'Report not found'); return r.rows[0];
  }));
  app.get('/blocks',async req=>tx(async c=>{
    const u=await auth(c,req.headers.authorization);
    return {items:(await c.query('SELECT blocked_id AS "userId",created_at AS "createdAt" FROM user_blocks WHERE blocker_id=$1 ORDER BY created_at DESC,blocked_id',[u.id])).rows};
  }));
  for(const method of ['PUT','DELETE'] as const) app.route<{Params:{id:string}}>({method,url:'/blocks/:id',schema:{params},handler:async req=>tx(async c=>{
    const u=await auth(c,req.headers.authorization),peer=req.params.id;
    if(u.id===peer) fail(400,'Cannot block yourself');
    if(!(await c.query('SELECT id FROM users WHERE id=$1',[peer])).rowCount) fail(404,'User not found');
    await lockPair(c,u.id,peer);
    if(method==='PUT') await c.query('INSERT INTO user_blocks(blocker_id,blocked_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[u.id,peer]);
    else await c.query('DELETE FROM user_blocks WHERE blocker_id=$1 AND blocked_id=$2',[u.id,peer]);
    return {userId:peer,blocked:method==='PUT'};
  })});
  app.get<{Querystring:{status?:string;limit:number;offset:number}}>('/admin/reports',{schema:{querystring:{type:'object',additionalProperties:false,properties:{...page,status:{type:'string',enum:['pending','processed','rejected']}}}}},async req=>tx(async c=>{
    const u=await auth(c,req.headers.authorization); if(!u.is_moderator) fail(403,'Moderator required');
    return {items:(await c.query(`SELECT ${view} FROM reports WHERE ($1::text IS NULL OR status=$1) ORDER BY created_at DESC,id DESC LIMIT $2 OFFSET $3`,[req.query.status??null,req.query.limit,req.query.offset])).rows};
  }));
  app.post<{Params:{id:string};Body:{decision:'approve'|'reject';action:'none'|'suspend';result:string}}>('/admin/reports/:id/resolve',{schema:{params,body:{type:'object',additionalProperties:false,required:['decision','result'],properties:{decision:{type:'string',enum:['approve','reject']},action:{type:'string',enum:['none','suspend'],default:'none'},result:resultText}}}},async req=>tx(async c=>{
    const u=await auth(c,req.headers.authorization); if(!u.is_moderator) fail(403,'Moderator required');
    const b=req.body;
    if(b.decision==='reject' && b.action!=='none') fail(400,'Rejected report cannot suspend account');
    const r=(await c.query('SELECT * FROM reports WHERE id=$1 FOR UPDATE',[req.params.id])).rows[0];
    if(!r) fail(404,'Report not found'); if(r.status!=='pending') fail(409,'Report already resolved');
    if(b.action==='suspend') await c.query('UPDATE users SET is_suspended=true WHERE id=$1',[r.reported_user_id]);
    return (await c.query(`UPDATE reports SET status=$2,action=$3,result=$4,handled_by=$5,handled_at=clock_timestamp() WHERE id=$1 RETURNING ${view}`,[r.id,b.decision==='approve'?'processed':'rejected',b.action,b.result,u.id])).rows[0];
  }));
}
