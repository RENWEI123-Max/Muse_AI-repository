import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { generateKeyPair, exportPKCS8, SignJWT, jwtVerify } from 'jose';
import pg from 'pg';
import { buildApp } from '../src/app.js';
import { digest } from '../src/auth.js';
import { verifyAppleJws } from '../src/payments.js';

test('B12 Apple verification, idempotent credit, refunds and atomic ledger', async t => {
  const admin = new pg.Pool({connectionString:process.env.DATABASE_URL});
  const schema = 'apple_'+randomUUID().replaceAll('-','');
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
  const { privateKey, publicKey } = await generateKeyPair('ES256',{extractable:true});
  const directory = await mkdtemp(tmpdir()+'/maugo-apple-');
  const keyPath = directory+'/test.p8';
  await writeFile(keyPath,await exportPKCS8(privateKey),{mode:0o600});
  const env = {APPLE_BUNDLE_ID:'com.maugo.app',APPLE_API_KEY_ID:'test',APPLE_API_ISSUER_ID:randomUUID(),APPLE_API_KEY_PATH:keyPath};
  const sign = (payload:any) => new SignJWT(payload).setProtectedHeader({alg:'ES256'}).sign(privateKey);
  const verifyJws = async (signed:string) => {
    try { return (await jwtVerify(signed,publicKey,{algorithms:['ES256']})).payload; }
    catch { throw Object.assign(new Error('Invalid Apple JWS signature'),{statusCode:400}); }
  };
  const transactions = new Map<string,string>();
  const app = buildApp(pool,false,{}, {env,verifyJws,getTransaction:async(id,environment)=>{
    const signed = transactions.get(id)!;
    assert.equal((await verifyJws(signed)).environment,environment);
    return signed;
  }});
  t.after(async()=>{await app.close();await pool.end();await admin.end();});
  for (const name of (await readdir(new URL('../server/migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())
    await pool.query(await readFile(new URL('../server/migrations/'+name,import.meta.url),'utf8'));
  const migration = await readFile(new URL('../server/migrations/012_apple_payments.sql',import.meta.url),'utf8');
  await pool.query(migration);
  const id=randomUUID(),token=randomUUID(),other=randomUUID(),otherToken=randomUUID();
  for (const [user,secret] of [[id,token],[other,otherToken]])
    await pool.query("INSERT INTO users(id,email,password_hash,token_hash,diamonds) VALUES($1,$2,'unused',$3,0)",[user,user+'@test.local',digest(secret)]);
  const headers={authorization:`Bearer ${token}`};
  const tx = (transactionId:string,extra={}) => ({transactionId,bundleId:env.APPLE_BUNDLE_ID,productId:'maugo.diamonds.100',environment:'Sandbox',appAccountToken:id,...extra});
  const submit = (signedTransaction:string,auth=headers) => app.inject({method:'POST',url:'/payments/apple/verify',headers:auth,payload:{signedTransaction}});
  const prepare = async (transaction:any) => {
    const signed = await sign(transaction); transactions.set(transaction.transactionId,signed); return signed;
  };
  const notify = async(transaction:any,type='REFUND') => app.inject({method:'POST',url:'/payments/apple/notifications',payload:{signedPayload:await sign({notificationType:type,notificationUUID:randomUUID(),data:{bundleId:env.APPLE_BUNDLE_ID,signedTransactionInfo:await sign(transaction)}})}});
  const balance = async () => (await pool.query('SELECT diamonds FROM users WHERE id=$1',[id])).rows[0].diamonds;
  const products = (await app.inject('/payments/apple/products')).json().products;
  assert.deepEqual(products.map((p:any)=>[p.id,p.diamonds,p.usd]),[
    ['maugo.diamonds.100',100,0.99],['maugo.diamonds.550',550,4.99],['maugo.diamonds.1200',1200,9.99],['maugo.diamonds.2600',2600,19.99]]);
  const signed = await prepare(tx('10001'));
  assert.equal((await submit(signed,{} as any)).statusCode,401);
  const results = await Promise.all([submit(signed),submit(signed),submit(signed)]);
  for (const result of results) { assert.equal(result.statusCode,200,result.body); assert.deepEqual(result.json(),{balance:100,credited:100,transactionId:'10001'}); }
  assert.equal(await balance(),100);
  assert.equal((await submit(signed,{authorization:`Bearer ${otherToken}`})).statusCode,403);
  for (const extra of [{bundleId:'wrong'},{productId:'unknown'},{revocationDate:Date.now()},{appAccountToken:other},{environment:'Xcode'}]) {
    const response = await submit(await prepare(tx('20001',extra)));
    assert.ok([400,403].includes(response.statusCode),response.body);
    assert.equal(await balance(),100);
  }
  const parts=signed.split('.');
  parts[1]=Buffer.from(JSON.stringify(tx('10001',{productId:'maugo.diamonds.2600'}))).toString('base64url');
  assert.equal((await submit(parts.join('.'))).statusCode,400);
  await assert.rejects(verifyAppleJws(signed),{statusCode:400});
  const missing = buildApp(pool,false,{}, {env:{}});
  t.after(()=>missing.close());
  const unavailable = await missing.inject({method:'POST',url:'/payments/apple/verify',headers,payload:{signedTransaction:signed}});
  assert.equal(unavailable.statusCode,503);
  for (const key of Object.keys(env)) assert.ok(unavailable.json().message.includes(key));
  const unreadable=buildApp(pool,false,{}, {env:{...env,APPLE_API_KEY_PATH:directory+'/missing.p8'}});
  t.after(()=>unreadable.close());
  assert.equal((await unreadable.inject({method:'POST',url:'/payments/apple/verify',headers,payload:{signedTransaction:signed}})).statusCode,503);
  assert.equal((await app.inject({method:'POST',url:'/payments/apple/notifications',payload:{signedPayload:parts.join('.')}})).statusCode,400);
  assert.equal((await notify(tx('10001'),'DID_RENEW')).statusCode,200);
  assert.equal(await balance(),100);
  // Refund fully reverses the original bundle; duplicate delivery has no effect.
  const refunds=await Promise.all([notify(tx('10001')),notify(tx('10001'))]);
  for (const response of refunds) assert.equal(response.statusCode,200,response.body);
  assert.equal(await balance(),0);
  assert.equal((await submit(signed)).statusCode,409);
  assert.equal((await pool.query('SELECT count(*)::int AS n FROM wallet_ledger')).rows[0].n,2);
  const production=await prepare(tx('30001',{environment:'Production',productId:'maugo.diamonds.550'}));
  assert.equal((await submit(production)).json().credited,550);
  await pool.query('UPDATE users SET diamonds=20 WHERE id=$1',[id]);
  // Retry returns the first committed result even after spending.
  assert.deepEqual((await submit(production)).json(),{balance:550,credited:550,transactionId:'30001'});
  assert.equal((await notify(tx('30001',{environment:'Production',productId:'maugo.diamonds.550'}))).statusCode,200);
  assert.equal(await balance(),20);
  assert.equal((await pool.query('SELECT amount,balance_after FROM wallet_ledger WHERE apple_refund_transaction_id=$1',['30001'])).rows[0].amount,-550);
  assert.equal((await notify(tx('40001'))).statusCode,200);
  assert.equal((await submit(await prepare(tx('40001')))).statusCode,409);
  await pool.query('UPDATE users SET diamonds=0 WHERE id=$1',[id]);
  // Ledger failures roll back both credit and durable transaction identity.
  await pool.query(`CREATE FUNCTION reject_apple_credit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'ledger unavailable'; END $$`);
  await pool.query('CREATE TRIGGER reject_apple_credit BEFORE INSERT ON wallet_ledger FOR EACH ROW EXECUTE FUNCTION reject_apple_credit()');
  const retry=await prepare(tx('50001'));
  assert.equal((await submit(retry)).statusCode,500);
  assert.equal(await balance(),0);
  assert.equal((await pool.query('SELECT * FROM apple_transactions WHERE transaction_id=$1',['50001'])).rowCount,0);
  await pool.query('DROP TRIGGER reject_apple_credit ON wallet_ledger');
  assert.equal((await submit(retry)).json().balance,100);
  await pool.query('CREATE TRIGGER reject_apple_credit BEFORE INSERT ON wallet_ledger FOR EACH ROW EXECUTE FUNCTION reject_apple_credit()');
  assert.equal((await notify(tx('50001'))).statusCode,500);
  assert.equal(await balance(),100);
  assert.equal((await pool.query('SELECT refunded FROM apple_transactions WHERE transaction_id=$1',['50001'])).rows[0].refunded,false);
  await pool.query('DROP TRIGGER reject_apple_credit ON wallet_ledger');
  assert.equal((await notify(tx('50001'))).statusCode,200);
  assert.equal(await balance(),0);
  const wrongNotification=await sign({notificationType:'REFUND',data:{bundleId:'wrong',signedTransactionInfo:signed}});
  assert.equal((await app.inject({method:'POST',url:'/payments/apple/notifications',payload:{signedPayload:wrongNotification}})).statusCode,400);
  await pool.query(migration);
});
