// Uses a dedicated test database only; never loads production application tables.
// F06 fixture: captures verification mail in memory instead of SMTP so tests can read the real code.
import pg from '../../maugo/node_modules/pg/lib/index.js'
import dotenv from '../../maugo/node_modules/dotenv/lib/main.js'
import { readFile } from 'node:fs/promises'
import { buildApp } from '../../maugo/src/app.js'
dotenv.config({path:process.env.MAUGO_TEST_ENV || new URL('../../maugo/.env',import.meta.url).pathname,quiet:true})
const source = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
if(!source)throw Error('Test database connection unavailable')
const url=new URL(source)
const database='maugo_client_f06_test_'+Date.now()
const admin=new pg.Pool({connectionString:source})
await admin.query(`CREATE DATABASE ${database}`)
url.pathname='/'+database
const db=new pg.Pool({connectionString:url.toString()})
for(const file of ['002_domain.sql','003_auth.sql','004_conversation_ledger.sql'])await db.query(await readFile(new URL('../../maugo/server/migrations/'+file,import.meta.url),'utf8'))
const inbox=new Map()
const app=buildApp(db,false,{sendMail:async(email,code)=>{inbox.set(email,code)}})
// Test-only fixture endpoints exist only in this isolated runner.
app.get('/__f06/mail',async req=>({code:inbox.get(req.query.email)}))
app.post('/__f06/expire',async req=>{await db.query("UPDATE auth_codes SET expires_at=NOW()-interval '1 second' WHERE email=$1",[req.body.email]);return {ok:true}})
app.post('/__f06/cooldown',async req=>{await db.query("UPDATE auth_codes SET sent_at=NOW()-interval '61 seconds' WHERE email=$1",[req.body.email]);return {ok:true}})
await app.listen({host:'127.0.0.1',port:3196})
console.log('F06 isolated test backend ready: '+database)
async function stop(){await app.close();await db.end();await admin.end();process.exit(0)}
process.on('SIGTERM',stop);process.on('SIGINT',stop)
