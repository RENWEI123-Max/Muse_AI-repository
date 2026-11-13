// Fixtures and migrations only touch the newly created, retained D11 database.
import pg from '../../maugo/node_modules/pg/lib/index.js'
import dotenv from '../../maugo/node_modules/dotenv/lib/main.js'
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises'
import {buildApp} from '../../maugo/src/app.ts'
import {registerInboxContract} from './inbox-contract.mjs'
dotenv.config({path:process.env.D11_ENV_FILE||new URL('../../maugo/.env',import.meta.url).pathname,quiet:true})
const source=process.env.TEST_DATABASE_URL||process.env.DATABASE_URL
if(!source)throw Error('Test database connection unavailable')
const name='maugo_d11_task80_'+Date.now(),admin=new pg.Pool({connectionString:source})
await admin.query(`CREATE DATABASE ${name}`)
const url=new URL(source);url.pathname='/'+name
const db=new pg.Pool({connectionString:url.toString()})
const migrations=new URL('../../maugo/server/migrations/',import.meta.url)
for(const file of (await readdir(migrations)).filter(f=>f.endsWith('.sql')).sort())await db.query(await readFile(new URL(file,migrations),'utf8'))
process.env.MEDIA_DIRECTORY='/tmp/'+name+'-media'
const app=buildApp(db)
await registerInboxContract(app,db)
app.post('/__d11/letter',async()=>{
 const password='SamplePass2026',stamp=Date.now()
 async function user(label){const email=`${label}-${stamp}@test.local`,r=await app.inject({method:'POST',url:'/auth/signup',payload:{email,password,termsVersion:'1.0',privacyVersion:'1.0'}});if(r.statusCode!==201)throw Error(r.body);const u=r.json();await db.query("UPDATE users SET display_name=$2,city='Seoul',age=25 WHERE id=$1",[u.id,label]);return {...u,email,password}}
 const viewer=await user('Reader'),author=await user('Wanderer'),target=await user('Friend')
 const r=await app.inject({method:'POST',url:`/conversations/${viewer.id}/opening`,headers:{authorization:'Bearer '+author.token},payload:{content:'Today I found a quiet little bookshop.'}})
 if(r.statusCode!==201)throw Error(r.body)
 return {viewer,author,target,conversationId:r.json().id,database:name}
})
app.get('/__d11/evidence/:id',async req=>({database:name,
 user:(await db.query('SELECT diamonds,collected_count FROM users WHERE id=$1',[req.params.id])).rows[0],
 ledger:(await db.query('SELECT amount,balance_after FROM wallet_ledger WHERE user_id=$1 ORDER BY created_at',[req.params.id])).rows,
 collections:(await db.query('SELECT cost,reply_id FROM reply_collections WHERE user_id=$1',[req.params.id])).rows
}))
await mkdir('docs/d11',{recursive:true})
await writeFile('docs/d11/database.json',JSON.stringify({database:name,migrations:(await readdir(migrations)).filter(f=>f.endsWith('.sql')).sort()},null,2))
await app.listen({host:'127.0.0.1',port:3180})
console.log('D11 isolated backend ready: '+name)
async function stop(){await app.close();await db.end();await admin.end();process.exit(0)}
process.on('SIGTERM',stop);process.on('SIGINT',stop)
