// Uses a dedicated test database only; never loads production application tables.
import pg from '../../maugo/node_modules/pg/lib/index.js'
import dotenv from '../../maugo/node_modules/dotenv/lib/main.js'
import { readFile } from 'node:fs/promises'
import { buildApp } from '../../maugo/src/app.js'
dotenv.config({path:new URL('../../maugo/.env',import.meta.url).pathname,quiet:true})
const source = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
if(!source)throw Error('Test database connection unavailable')
const url=new URL(source)
const database='maugo_client_c2_test_'+Date.now()
const admin=new pg.Pool({connectionString:source})
await admin.query(`CREATE DATABASE ${database}`)
url.pathname='/'+database
const db=new pg.Pool({connectionString:url.toString()})
for(const file of ['002_domain.sql','003_auth.sql','004_conversation_ledger.sql','005_discovery.sql','006_reply_wallet.sql','007_filter_pass.sql','008_moderation.sql','009_media.sql','010_account_privacy.sql'])await db.query(await readFile(new URL('../../maugo/server/migrations/'+file,import.meta.url),'utf8'))
// No mail adapter: exercise actual SMTP-unavailable response.
for(const key of ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','SMTP_FROM'])delete process.env[key]
const app=buildApp(db)
// Test-only fixture endpoints exist only in this isolated runner.
app.post('/__c3/seed', async () => {
 const email=`c3-${Date.now()}-${Math.random()}@test.local`,password='SamplePass2026'
 const signed=(await app.inject({method:'POST',url:'/auth/signup',payload:{email,password,termsVersion:'1.0',privacyVersion:'1.0'}})).json()
 await db.query('UPDATE users SET diamonds=5000 WHERE id=$1',[signed.id])
 for(let i=0;i<15;i++){
  const sender=(await app.inject({method:'POST',url:'/auth/signup',payload:{email:`sender-${i}-${email}`,password,termsVersion:'1.0',privacyVersion:'1.0'}})).json()
  await db.query("UPDATE users SET display_name=$2,city='Seoul',age=25,gender='female' WHERE id=$1",[sender.id,`Little bird ${i}`])
  const opening=(await app.inject({method:'POST',url:`/conversations/${signed.id}/opening`,headers:{authorization:`Bearer ${sender.token}`},payload:{content:`A little story ${i}. The world felt gentle again.`}})).json()
  if(i===0)await db.query("INSERT INTO messages(id,conversation_id,sender_id,kind,content) VALUES(gen_random_uuid(),$1,$2,'reply','A response for you')",[opening.id,sender.id])
 }
 return {email,password,id:signed.id,token:signed.token}
})
app.post('/__c3/expire', async req=>{await db.query("UPDATE users SET filter_pass_expires_at=NOW()+interval '2 seconds' WHERE id=$1",[req.body.id]);return {ok:true}})

await app.listen({host:'127.0.0.1',port:3001})
console.log('C2 isolated test backend ready: '+database)
async function stop(){await app.close();await db.end();await admin.end();process.exit(0)}
process.on('SIGTERM',stop);process.on('SIGINT',stop)
