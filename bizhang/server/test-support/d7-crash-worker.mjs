import pg from 'pg';
import { TelegramWorker } from '../src/telegram.js';
const pool=new pg.Pool({host:process.argv[2],port:Number(process.argv[3]),user:'d7_test',database:'postgres'});
const worker=new TelegramWorker(pool,{sendMessage:async()=>{process.send('sending');await new Promise(()=>{});}});
await worker.runOnce();
await pool.end();
