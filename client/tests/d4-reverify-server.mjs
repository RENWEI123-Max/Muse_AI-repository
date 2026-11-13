import {pathToFileURL} from 'node:url'
import {readdir,readFile} from 'node:fs/promises'
const backend=process.env.D4_BACKEND_ROOT||new URL('../../maugo/',import.meta.url).pathname
const {default:pg}=await import(pathToFileURL(backend+'/node_modules/pg/lib/index.js'))
const {default:dotenv}=await import(pathToFileURL(backend+'/node_modules/dotenv/lib/main.js'))
dotenv.config({path:backend+'/.env',quiet:true})
const {buildApp}=await import(pathToFileURL(backend+'/src/app.ts'))
const source=process.env.TEST_DATABASE_URL||process.env.DATABASE_URL
const name='maugo_d4_'+Date.now(),admin=new pg.Pool({connectionString:source})
await admin.query(`CREATE DATABASE ${name}`);await admin.end()
const url=new URL(source);url.pathname='/'+name
const db=new pg.Pool({connectionString:url.toString()})
for(const file of (await readdir(backend+'/server/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.query(await readFile(backend+'/server/migrations/'+file,'utf8'))
process.env.MEDIA_DIRECTORY='/tmp/'+name+'-media'
const app=buildApp(db)
const {registerInboxContract}=await import('./inbox-contract.mjs');await registerInboxContract(app,db)
app.post('/__d4/likes',async req=>{const {owner,peer}=req.body;const p=await db.query("INSERT INTO user_posts(id,user_id,content,visibility,category) VALUES(gen_random_uuid(),$1,'Real liked post','everyone','Life') RETURNING id",[owner]);await db.query('INSERT INTO post_likes(user_id,post_id) VALUES($1,$2)',[peer,p.rows[0].id]);return {ok:true}})
console.log('D4 isolated database: '+name)
await app.listen({host:'127.0.0.1',port:3195})
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await app.close();await db.end();process.exit(0)})
