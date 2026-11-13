// Run from any directory; creates a new database and never drops existing data.
import pg from '../../maugo/node_modules/pg/lib/index.js'
import dotenv from '../../maugo/node_modules/dotenv/lib/main.js'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const backend=fileURLToPath(new URL('../../maugo/',import.meta.url))
dotenv.config({path:backend+'.env',quiet:true})
if(!process.env.DATABASE_URL)throw Error('DATABASE_URL is required; no default database fallback')
const source=process.env.DATABASE_URL
const admin=new pg.Pool({connectionString:source})
const name='maugo_c7_acceptance_'+Date.now()
await admin.query(`CREATE DATABASE ${name}`)
await admin.end()
const url=new URL(source);url.pathname='/'+name
console.log('Dedicated test database: '+name)
const child=spawn('npm',['test'],{cwd:backend,env:{...process.env,DATABASE_URL:url.toString()},stdio:'inherit'})
child.on('error',()=>{process.exitCode=1})
child.on('exit',code=>{process.exitCode=code??1})
