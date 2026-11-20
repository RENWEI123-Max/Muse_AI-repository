// Uses a dedicated test database only; never loads production application tables.
import { registerInboxContract } from './inbox-contract.mjs'
import pg from '../../maugo/node_modules/pg/lib/index.js'
import dotenv from '../../maugo/node_modules/dotenv/lib/main.js'
import { readdir, readFile } from 'node:fs/promises'
import { buildApp } from '../../maugo/src/app.js'
dotenv.config({path:new URL('../../maugo/.env',import.meta.url).pathname,quiet:true})
const source = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
if(!source)throw Error('Test database connection unavailable')
const url=new URL(source)
const database='maugo_client_d7_test_'+Date.now()
const admin=new pg.Pool({connectionString:source})
await admin.query(`CREATE DATABASE ${database}`)
url.pathname='/'+database
const db=new pg.Pool({connectionString:url.toString()})
const migrations=new URL('../../maugo/server/migrations/',import.meta.url)
for(const file of (await readdir(migrations)).filter(f=>f.endsWith('.sql')).sort())await db.query(await readFile(new URL(file,migrations),'utf8'))
process.env.MEDIA_DIRECTORY="/tmp/"+database+"-media"
// Capture generated codes in the isolated test mailbox.
const recoveryMailbox=new Map()
const app=buildApp(db,false,{sendMail:async(email,code)=>{recoveryMailbox.set(email,code)}})
app.get('/__d7/recovery-mail',async(req,reply)=>{
 const email=req.query.email
 const code=recoveryMailbox.get(email)
 if(!code)return reply.code(404).send()
 recoveryMailbox.delete(email)
 return {code}
})
await registerInboxContract(app,db)
await app.listen({host:'127.0.0.1',port:3001})
console.log('D7 isolated test backend ready: '+database)
async function stop(){await app.close();await db.end();await admin.end();process.exit(0)}
process.on('SIGTERM',stop);process.on('SIGINT',stop)
