// Real backend routes; all fixtures and media live in a fresh, retained test database.
import {fileURLToPath,pathToFileURL} from 'node:url'
const backend=process.env.D6_BACKEND_ROOT||fileURLToPath(new URL('../../maugo/',import.meta.url))
const {default:pg}=await import(pathToFileURL(backend+'/node_modules/pg/lib/index.js').href)
const {default:dotenv}=await import(pathToFileURL(backend+'/node_modules/dotenv/lib/main.js').href)
import {readdir,readFile} from 'node:fs/promises'
const {buildApp}=await import(pathToFileURL(backend+'/src/app.ts').href)
dotenv.config({path:process.env.D6_ENV_FILE||backend+'/.env',quiet:true})
const source=process.env.TEST_DATABASE_URL||process.env.DATABASE_URL
if(!source)throw Error('Database connection unavailable')
const name='maugo_d6_followup_'+Date.now(),admin=new pg.Pool({connectionString:source})
await admin.query(`CREATE DATABASE ${name}`);await admin.end()
const url=new URL(source);url.pathname='/'+name
const db=new pg.Pool({connectionString:url.toString()})
const migrations=new URL('../../maugo/server/migrations/',import.meta.url)
for(const file of (await readdir(migrations)).filter(n=>n.endsWith('.sql')).sort())await db.query(await readFile(new URL(file,migrations),'utf8'))
process.env.MEDIA_DIRECTORY='/tmp/'+name+'-media'
const app=buildApp(db)
const {registerInboxContract}=await import('./inbox-contract.mjs');await registerInboxContract(app,db)
// Test setup only: real feedback moderation and incoming-letter fixtures.
app.post('/__d6/setup',async req=>{
 const {id}=req.body
 await db.query('UPDATE users SET is_moderator=true WHERE id=$1',[id])
 const peers=[]
 for(const [gender,city] of [['female','Seoul'],['male','Tokyo'],['female','Seoul'],['male','Tokyo']]){
  const email=`d6-${crypto.randomUUID()}@test.local`
  const r=await app.inject({method:'POST',url:'/auth/signup',payload:{email,password:'SamplePass2026',termsVersion:'1.0',privacyVersion:'1.0'}})
  const peer=r.json();if(r.statusCode!==201)throw Error(r.body)
  await db.query('UPDATE users SET display_name=$2,gender=$3,city=$4,age=25 WHERE id=$1',[peer.id,gender+' '+city,gender,city])
  const letter=await app.inject({method:'POST',url:`/conversations/${id}/opening`,headers:{authorization:`Bearer ${peer.token}`},payload:{content:'D6 real incoming '+gender+' '+city}})
  if(letter.statusCode!==201)throw Error(letter.body)
  peers.push(peer.id)
 }
 return {peers}
})
await app.listen({host:'127.0.0.1',port:Number(process.env.D6_PORT||3179)})
console.log('D6 followup isolated database: '+name)
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await app.close();await db.end();process.exit(0)})
