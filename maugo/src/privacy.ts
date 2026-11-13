import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { digest } from './auth.js';

const fail = (statusCode:number,message:string):never => { throw Object.assign(new Error(message),{statusCode}); };
export function registerPrivacy(app:FastifyInstance,
 transaction:(work:(c:PoolClient)=>Promise<unknown>)=>Promise<unknown>,
 authenticate:(c:PoolClient,authorization?:string)=>Promise<any>) {
 const directory=resolve(process.env.MEDIA_DIRECTORY || 'var/media');
 async function cleanup() {
  await transaction(async c=>{
   // Some embedded callers use only the early migrations.
   if(!(await c.query("SELECT to_regclass('media_deletion_queue') AS name")).rows[0].name) return;
   const rows=await c.query('SELECT media_id FROM media_deletion_queue FOR UPDATE SKIP LOCKED');
   for(const {media_id} of rows.rows) {
    try { await unlink(join(directory,media_id)); }
    catch(error:any) { if(error.code!=='ENOENT') { app.log.error({err:error},'Media deletion will retry'); continue; } }
    await c.query('DELETE FROM media_deletion_queue WHERE media_id=$1',[media_id]);
   }
  });
 }
 let timer:ReturnType<typeof setInterval>;
 app.addHook('onReady',async()=>{
  await cleanup().catch(err=>app.log.error({err},'Media cleanup unavailable; will retry'));
  timer=setInterval(()=>{void cleanup().catch(err=>app.log.error({err},'Media cleanup failed'));},60000);
  timer.unref();
 });
 app.addHook('onClose',async()=>{clearInterval(timer);});
 app.get('/users/me/export',async(request,reply)=>{
  const data=await transaction(async c=>{
   await c.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
   const u=await authenticate(c,request.headers.authorization);
   // Explicit allowlists: never serialize users/auth rows wholesale.
   const profile=(await c.query(`SELECT id,email,display_name,avatar,city,age,gender,diamonds,collected_count,
    created_at,privacy_version,terms_version,consented_at,filter_pass_expires_at FROM users WHERE id=$1`,[u.id])).rows[0];
   const conversations=(await c.query(`SELECT v.id,v.opener_id,v.peer_id,v.created_at,v.opening_message_id,v.unlocked_at,
    p.deleted_at IS NOT NULL AS peer_deleted FROM conversations v JOIN users p ON p.id=CASE WHEN v.opener_id=$1 THEN v.peer_id ELSE v.opener_id END
    WHERE v.opener_id=$1 OR v.peer_id=$1 ORDER BY v.created_at,v.id`,[u.id])).rows;
   const messages=(await c.query(`SELECT m.id,m.conversation_id,m.sender_id,m.kind,m.content,m.media_id,m.created_at
    FROM messages m JOIN conversations v ON v.id=m.conversation_id WHERE v.opener_id=$1 OR v.peer_id=$1 ORDER BY m.created_at,m.id`,[u.id])).rows;
   const posts=(await c.query('SELECT id,content,created_at FROM user_posts WHERE user_id=$1 ORDER BY created_at,id',[u.id])).rows;
   const wallet=(await c.query(`SELECT id,amount,balance_after,collection_id,filter_pass_purchase_id,payment_reference,created_at
    FROM wallet_ledger WHERE user_id=$1 ORDER BY created_at,id`,[u.id])).rows;
   const media=(await c.query(`SELECT id,purpose,conversation_id,kind,mime_type,size_bytes,original_name,created_at
    FROM media_uploads WHERE uploader_id=$1 ORDER BY created_at,id`,[u.id])).rows;
   const collections=(await c.query('SELECT id,reply_id,cost,created_at,unlocked_at FROM reply_collections WHERE user_id=$1 ORDER BY created_at,id',[u.id])).rows;
   const purchases=(await c.query('SELECT id,days,cost,starts_at,expires_at,created_at FROM filter_pass_purchases WHERE user_id=$1 ORDER BY created_at,id',[u.id])).rows;
   return {version:1,exportedAt:new Date().toISOString(),profile,conversations,messages,posts,wallet,media,collections,filterPassPurchases:purchases};
  });
  return reply.header('Cache-Control','no-store').header('X-Content-Type-Options','nosniff')
   .header('Content-Disposition','attachment; filename="maugo-export.json"').type('application/json').send(data);
 });
 app.delete<{Body:{confirm:boolean;deletionToken?:string;password?:string}}>('/users/me',{
  schema:{body:{type:'object',additionalProperties:false,required:['confirm'],properties:{
   confirm:{type:'boolean',const:true},deletionToken:{type:'string',pattern:'^[a-f0-9]{64}$'},password:{type:'string',minLength:1,maxLength:128}
  }}}
 },async(request,reply)=>{
  const result:any=await transaction(async c=>{
   const u=await authenticate(c,request.headers.authorization);
   if(!request.body.deletionToken) {
    const token=randomBytes(32).toString('hex');
    await c.query(`INSERT INTO account_deletion_challenges(user_id,challenge_hash,session_hash,expires_at)
     VALUES($1,$2,$3,NOW()+interval '10 minutes') ON CONFLICT(user_id) DO UPDATE
     SET challenge_hash=$2,session_hash=$3,expires_at=NOW()+interval '10 minutes'`,[u.id,digest(token),digest(request.headers.authorization!.slice(7))]);
    return {status:202,body:{confirmationRequired:true,deletionToken:token,expiresIn:600,identityCheck:'password'}};
   }
   const challenge=(await c.query(`SELECT 1 FROM account_deletion_challenges WHERE user_id=$1 AND challenge_hash=$2
    AND session_hash=$3 AND expires_at>NOW()`,[u.id,digest(request.body.deletionToken),digest(request.headers.authorization!.slice(7))])).rowCount;
   if(!challenge) fail(401,'Invalid or expired deletion confirmation');
   if(!request.body.password) fail(400,'Password required for identity verification');
   // Commit attempt counts even on failure; replacing a challenge cannot reset this limit.
   const attempts=(await c.query(`INSERT INTO auth_limits(key,count,starts_at) VALUES($1,1,NOW()) ON CONFLICT(key)
    DO UPDATE SET count=CASE WHEN auth_limits.starts_at<NOW()-interval '1 hour' THEN 1 ELSE auth_limits.count+1 END,
    starts_at=CASE WHEN auth_limits.starts_at<NOW()-interval '1 hour' THEN NOW() ELSE auth_limits.starts_at END RETURNING count`,['delete:'+u.id])).rows[0].count;
   if(attempts>5) return {status:429,body:{message:'Too many identity verification attempts'}};
   const [salt,stored]=u.password_hash.split(':');
   const expected=Buffer.from(stored??'','hex');
   const actual=scryptSync(request.body.password!,salt,64);
   if(expected.length!==actual.length || !timingSafeEqual(expected,actual)) return {status:401,body:{message:'Invalid password'}};
   await c.query('DELETE FROM auth_sessions WHERE user_id=$1',[u.id]);
   await c.query('DELETE FROM auth_codes WHERE email=$1',[u.email]);
   await c.query('DELETE FROM account_deletion_challenges WHERE user_id=$1',[u.id]);
   await c.query('DELETE FROM auth_limits WHERE key=ANY($1::text[])',[[
    'delete:'+u.id,...['login','code-send','code-verify'].map(action=>action+':email:'+u.email)]]);
   await c.query('INSERT INTO media_deletion_queue(media_id) SELECT id FROM media_uploads WHERE uploader_id=$1 ON CONFLICT DO NOTHING',[u.id]);
   // Preserve references held by the peer and the financial ledger, erase authored content.
   await c.query("UPDATE messages SET content='[已注销]',media_id=NULL WHERE sender_id=$1 OR media_id IN (SELECT id FROM media_uploads WHERE uploader_id=$1)",[u.id]);
   await c.query("UPDATE users SET avatar=NULL WHERE avatar IN (SELECT '/media/uploads/'||id FROM media_uploads WHERE uploader_id=$1)",[u.id]);
   await c.query('DELETE FROM media_uploads WHERE uploader_id=$1',[u.id]);
   await c.query('DELETE FROM user_posts WHERE user_id=$1',[u.id]);
   await c.query('DELETE FROM discovery_seen WHERE user_id=$1 OR batch_id IN (SELECT id FROM discovery_batches WHERE user_id=$1)',[u.id]);
   await c.query('DELETE FROM discovery_response_seen WHERE user_id=$1',[u.id]);
   await c.query('DELETE FROM discovery_batches WHERE user_id=$1',[u.id]);
   await c.query('DELETE FROM user_blocks WHERE blocker_id=$1 OR blocked_id=$1',[u.id]);
   await c.query("UPDATE reports SET reason='[已注销]',result=CASE WHEN result IS NULL THEN NULL ELSE '[已注销]' END WHERE reporter_id=$1 OR reported_user_id=$1 OR handled_by=$1",[u.id]);
   await c.query('DELETE FROM wallet_ledger WHERE user_id=$1',[u.id]);
   await c.query('DELETE FROM reply_collection_requests WHERE user_id=$1',[u.id]);
   await c.query('DELETE FROM reply_collections WHERE user_id=$1',[u.id]);
   await c.query('DELETE FROM filter_pass_purchases WHERE user_id=$1',[u.id]);
   await c.query(`UPDATE users SET email=$2,password_hash='',token_hash=$3,display_name='已注销',avatar=NULL,
    city=NULL,age=NULL,gender=NULL,diamonds=0,collected_count=0,privacy_version=NULL,terms_version=NULL,
    consented_at=NULL,filter_pass_expires_at=NULL,is_moderator=false,is_suspended=false,deleted_at=NOW() WHERE id=$1`,
    [u.id,'deleted-'+u.id+'@deleted.invalid',digest(randomBytes(32).toString('hex'))]);
   return {status:200,body:{deleted:true}};
  });
  if(result.body.deleted) await cleanup().catch(err=>app.log.error({err},'Media cleanup queued for retry'));
  return reply.code(result.status).header('Cache-Control','no-store').send(result.body);
 });
}
