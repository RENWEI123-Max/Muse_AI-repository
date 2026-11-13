// Real B16 routes; all fixtures and media live in a fresh, retained test database.
import {fileURLToPath,pathToFileURL} from 'node:url'
const backend=process.env.D5_BACKEND_ROOT||fileURLToPath(new URL('../../maugo/',import.meta.url))
const {default:pg}=await import(pathToFileURL(backend+'/node_modules/pg/lib/index.js').href)
const {default:dotenv}=await import(pathToFileURL(backend+'/node_modules/dotenv/lib/main.js').href)
import {readdir,readFile} from 'node:fs/promises'
const {buildApp}=await import(pathToFileURL(backend+'/src/app.ts').href)
dotenv.config({path:process.env.D5_ENV_FILE||backend+'/.env',quiet:true})
const source=process.env.TEST_DATABASE_URL||process.env.DATABASE_URL
if(!source)throw Error('Database connection unavailable')
const name='maugo_d5_task69_'+Date.now(),admin=new pg.Pool({connectionString:source})
await admin.query(`CREATE DATABASE ${name}`);await admin.end()
const url=new URL(source);url.pathname='/'+name
const db=new pg.Pool({connectionString:url.toString()})
const migrations=new URL('../../maugo/server/migrations/',import.meta.url)
for(const file of (await readdir(migrations)).filter(n=>n.endsWith('.sql')).sort())await db.query(await readFile(new URL(file,migrations),'utf8'))
process.env.MEDIA_DIRECTORY='/tmp/'+name+'-media'
const app=buildApp(db)
app.post('/__d5/seed',async()=>{
 const password='SamplePass2026',stamp=Date.now()+'-'+Math.random()
 async function user(name){const email=name+'-'+stamp+'@test.local';const r=await app.inject({method:'POST',url:'/auth/signup',payload:{email,password,termsVersion:'1.0',privacyVersion:'1.0'}});if(r.statusCode!==201)throw Error(r.body);return {...r.json(),email,password}}
 return {author:await user('Author'),viewer:await user('Viewer'),database:name}
})
await app.listen({host:'127.0.0.1',port:3069})
console.log('D5 isolated database: '+name)
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await app.close();await db.end();process.exit(0)})
