// Real backend routes, fixtures restricted to a new retained database.
import pg from '../../maugo/node_modules/pg/lib/index.js'
import dotenv from '../../maugo/node_modules/dotenv/lib/main.js'
import {readdir,readFile} from 'node:fs/promises'
import {buildApp} from '../../maugo/src/app.ts'
dotenv.config({path:process.env.D9_ENV_FILE||new URL('../../maugo/.env',import.meta.url).pathname,quiet:true})
const source=process.env.TEST_DATABASE_URL||process.env.DATABASE_URL
if(!source)throw Error('Test database connection unavailable')
const name='maugo_d9_task78_'+Date.now(),admin=new pg.Pool({connectionString:source})
await admin.query(`CREATE DATABASE ${name}`)
const url=new URL(source);url.pathname='/'+name
const db=new pg.Pool({connectionString:url.toString()})
const migrations=new URL('../../maugo/server/migrations/',import.meta.url)
for(const file of (await readdir(migrations)).filter(f=>f.endsWith('.sql')).sort())await db.query(await readFile(new URL(file,migrations),'utf8'))
process.env.MEDIA_DIRECTORY='/tmp/'+name+'-media'
const app=buildApp(db)
app.post('/__d9/seed',async()=>{
 const email=`d9-${Date.now()}@test.local`,password='SamplePass2026'
 const r=await app.inject({method:'POST',url:'/auth/signup',payload:{email,password,termsVersion:'1.0',privacyVersion:'1.0'}})
 if(r.statusCode!==201)throw Error(r.body)
 return {...r.json(),email,password,database:name}
})
app.post('/__d9/state',async req=>{
 await db.query('UPDATE users SET diamonds=$2,filter_pass_expires_at=$3 WHERE id=$1',[req.body.id,req.body.diamonds,req.body.expiresAt||null])
 return {ok:true}
})
app.get('/__d9/evidence/:id',async req=>({
 user:(await db.query('SELECT diamonds,filter_pass_expires_at FROM users WHERE id=$1',[req.params.id])).rows[0],
 ledger:(await db.query('SELECT amount,balance_after FROM wallet_ledger WHERE user_id=$1 ORDER BY created_at',[req.params.id])).rows,
 purchases:(await db.query('SELECT days,cost,starts_at,expires_at FROM filter_pass_purchases WHERE user_id=$1',[req.params.id])).rows
}))
await app.listen({host:'127.0.0.1',port:3176})
console.log('D9 isolated backend ready: '+name)
async function stop(){await app.close();await db.end();await admin.end();process.exit(0)}
process.on('SIGTERM',stop);process.on('SIGINT',stop)
