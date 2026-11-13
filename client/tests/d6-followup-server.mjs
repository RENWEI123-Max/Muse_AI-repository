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
await app.listen({host:'127.0.0.1',port:3179})
console.log('D6 followup isolated database: '+name)
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{await app.close();await db.end();process.exit(0)})
