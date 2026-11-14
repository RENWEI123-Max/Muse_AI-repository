// R24: isolated database, real routes only; no balance or Pass fixture endpoints.
import pg from '../../../../maugo/node_modules/pg/lib/index.js'
import dotenv from '../../../../maugo/node_modules/dotenv/lib/main.js'
import {readdir,readFile} from 'node:fs/promises'
import {buildApp} from '../../../../maugo/src/app.ts'
dotenv.config({path:new URL('../../../../maugo/.env',import.meta.url).pathname,quiet:true})
const admin=new pg.Pool({connectionString:process.env.DATABASE_URL}),name='maugo_r24_'+Date.now()
await admin.query(`CREATE DATABASE ${name}`)
const url=new URL(process.env.DATABASE_URL);url.pathname='/'+name
const db=new pg.Pool({connectionString:url.toString()}),dir=new URL('../../../../maugo/server/migrations/',import.meta.url)
for(const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort())await db.query(await readFile(new URL(f,dir),'utf8'))
process.env.MEDIA_DIRECTORY='/tmp/'+name+'-media'
const app=buildApp(db);await app.listen({host:'127.0.0.1',port:3001});console.log('R24 isolated database '+name)
async function stop(){await app.close();await db.end();await admin.end();process.exit(0)}
process.on('SIGTERM',stop);process.on('SIGINT',stop)
