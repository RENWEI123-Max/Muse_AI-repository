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
for(const file of ['002_domain.sql','003_auth.sql'])await db.query(await readFile(new URL('../../maugo/server/migrations/'+file,import.meta.url),'utf8'))
// No mail adapter: exercise actual SMTP-unavailable response.
for(const key of ['SMTP_HOST','SMTP_PORT','SMTP_USER','SMTP_PASS','SMTP_FROM'])delete process.env[key]
const app=buildApp(db)
await app.listen({host:'127.0.0.1',port:3001})
console.log('C2 isolated test backend ready: '+database)
async function stop(){await app.close();await db.end();await admin.end();process.exit(0)}
process.on('SIGTERM',stop);process.on('SIGINT',stop)
