import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { randomUUID } from 'node:crypto';
const fail = (statusCode:number,message:string):never => { throw Object.assign(new Error(message),{statusCode}); };
const status = {type:'string',enum:['new','in_progress','resolved']};
const view = `id,user_id AS "userId",content,type,contact,status,created_at AS "createdAt",updated_at AS "updatedAt"`;
export function registerFeedback(app:FastifyInstance,
  tx:(work:(c:PoolClient)=>Promise<unknown>)=>Promise<unknown>,
  auth:(c:PoolClient,authorization?:string)=>Promise<any>) {
  app.post<{Body:{content:string;type?:string;contact?:string}}>('/feedback',{schema:{body:{type:'object',additionalProperties:false,required:['content'],properties:{
    content:{type:'string',minLength:1,maxLength:2000,pattern:'\\S'},type:{type:'string',maxLength:50},contact:{type:'string',maxLength:200}
  }}}},async(req,reply)=>{
    const result=await tx(async c=>{
      const u=await auth(c,req.headers.authorization),b=req.body;
      const count=await c.query("SELECT count(*)::int AS total FROM feedback WHERE user_id=$1 AND created_at>clock_timestamp()-interval '1 hour'",[u.id]);
      if(count.rows[0].total>=5) fail(429,'Feedback limit exceeded');
      return (await c.query('INSERT INTO feedback(id,user_id,content,type,contact) VALUES($1,$2,$3,$4,$5) RETURNING id,status',[randomUUID(),u.id,b.content,b.type??null,b.contact??null])).rows[0];
    });
    return reply.code(201).send(result);
  });
  app.get<{Querystring:{status?:string;limit:number;offset:number}}>('/admin/feedback',{schema:{querystring:{type:'object',additionalProperties:false,properties:{
    status,limit:{type:'integer',minimum:1,maximum:100,default:20},offset:{type:'integer',minimum:0,default:0}
  }}}},async req=>tx(async c=>{
    const u=await auth(c,req.headers.authorization); if(!u.is_moderator) fail(403,'Moderator required');
    const filter=req.query.status??null;
    const total=(await c.query('SELECT count(*)::int AS total FROM feedback WHERE ($1::text IS NULL OR status=$1)',[filter])).rows[0].total;
    const items=(await c.query(`SELECT ${view} FROM feedback WHERE ($1::text IS NULL OR status=$1) ORDER BY created_at DESC,id DESC LIMIT $2 OFFSET $3`,[filter,req.query.limit,req.query.offset])).rows;
    return {items,total};
  }));
  app.patch<{Params:{id:string};Body:{status:string}}>('/admin/feedback/:id',{schema:{
    params:{type:'object',required:['id'],properties:{id:{type:'string',format:'uuid'}}},
    body:{type:'object',additionalProperties:false,required:['status'],properties:{status}}
  }},async req=>tx(async c=>{
    const u=await auth(c,req.headers.authorization); if(!u.is_moderator) fail(403,'Moderator required');
    const result=await c.query(`UPDATE feedback SET status=$2,updated_at=clock_timestamp() WHERE id=$1 RETURNING ${view}`,[req.params.id,req.body.status]);
    if(!result.rowCount) fail(404,'Feedback not found');
    return result.rows[0];
  }));
}
