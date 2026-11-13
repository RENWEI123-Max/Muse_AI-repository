// Uses a dedicated test database only; never loads production application tables.
import { registerInboxContract } from './inbox-contract.mjs'
import pg from '../../maugo/node_modules/pg/lib/index.js'
import dotenv from '../../maugo/node_modules/dotenv/lib/main.js'
import { readFile } from 'node:fs/promises'
import { buildApp } from '../../maugo/src/app.js'
dotenv.config({path:process.env.MAUGO_TEST_ENV || new URL('../../maugo/.env',import.meta.url).pathname,quiet:true})
const source = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
if(!source)throw Error('Test database connection unavailable')
const url=new URL(source)
const database='maugo_client_d8_test_'+Date.now()
const admin=new pg.Pool({connectionString:source})
await admin.query(`CREATE DATABASE ${database}`)
url.pathname='/'+database
const db=new pg.Pool({connectionString:url.toString()})
for(const file of ['002_domain.sql','003_auth.sql','004_conversation_ledger.sql','005_discovery.sql','006_reply_wallet.sql','007_filter_pass.sql','008_moderation.sql','009_media.sql','010_account_privacy.sql','011_inbox.sql','012_apple_payments.sql','013_report_attachments.sql','014_profiles.sql','015_posts_image_cards.sql'])await db.query(await readFile(new URL('../../maugo/server/migrations/'+file,import.meta.url),'utf8'))
process.env.MEDIA_DIRECTORY="/tmp/"+database+"-media"
const app=buildApp(db)
await registerInboxContract(app,db)
await app.listen({host:'127.0.0.1',port:3178})
console.log('D8 isolated test backend ready: '+database)
async function stop(){await app.close();await db.end();await admin.end();process.exit(0)}
process.on('SIGTERM',stop);process.on('SIGINT',stop)
