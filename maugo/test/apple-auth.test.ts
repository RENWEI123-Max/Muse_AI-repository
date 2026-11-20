import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose';
import pg from 'pg';
import { buildApp } from '../src/app.js';

test('Apple authentication with local signing keys and real PostgreSQL', async t => {
  const admin = new pg.Pool({connectionString:process.env.DATABASE_URL});
  const schema = 'apple_auth_'+randomUUID().replaceAll('-','');
  await admin.query(`CREATE SCHEMA ${schema}`);
  const pool = new pg.Pool({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema}`});
  const key = await generateKeyPair('RS256');
  const kid = 'apple-test-key';
  const appleClientId = 'com.maugo.app';
  const appleJwks = createLocalJWKSet({keys:[{...await exportJWK(key.publicKey),kid}]});
  const app = buildApp(pool,false,{appleClientId,appleJwks});
  t.after(async () => {
    await app.close();
    await pool.end();
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
    await admin.end();
  });
  const migrations = new URL('../server/migrations/',import.meta.url);
  for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) {
    await pool.query(await readFile(new URL(file,migrations),'utf8'));
  }
  await pool.query(await readFile(new URL('022_apple_signin.sql',migrations),'utf8'));

  const consent = {privacyVersion:'1.0',termsVersion:'1.0'};
  const relay = 'reader@privaterelay.appleid.com';
  function sign({
    sub = 'apple-reader', email, audience = appleClientId, expires = '5m', privateKey = key.privateKey
  }: {sub?:string;email?:string;audience?:string;expires?:string|number;privateKey?:CryptoKey} = {}) {
    return new SignJWT(email ? {email} : {})
      .setProtectedHeader({alg:'RS256',kid})
      .setIssuer('https://appleid.apple.com')
      .setAudience(audience)
      .setSubject(sub)
      .setIssuedAt()
      .setExpirationTime(expires)
      .sign(privateKey);
  }
  const post = (url:string, payload:object) => app.inject({method:'POST',url,payload});
  const apple = (identityToken:string, names:object = {}) => post('/auth/apple',{identityToken,...consent,...names});
  let readerId: string;
  let readerToken: string;

  await t.test('creates an account and issues a session accepted by GET /profiles/me', async () => {
    const identityToken = await sign({email:relay});
    const result = await apple(identityToken,{givenName:' Little ',familyName:'Reader'});
    assert.equal(result.statusCode,200,result.body);
    const {id,token} = result.json();
    assert.deepEqual(Object.keys(result.json()).sort(),['id','token']);
    assert.match(token,/^[a-f0-9]{64}$/);
    const profile = await app.inject({method:'GET',url:'/profiles/me',headers:{authorization:`Bearer ${token}`}});
    assert.equal(profile.statusCode,200,profile.body);
    assert.equal(profile.json().id,id);
    assert.equal(profile.json().displayName,'Little Reader');
    const row = (await pool.query('SELECT * FROM users WHERE id=$1',[id])).rows[0];
    assert.equal(row.email,relay);
    assert.equal(row.apple_sub,'apple-reader');
    assert.equal(row.privacy_version,'1.0');
    assert.equal(row.terms_version,'1.0');
    assert.ok(row.consented_at);
    assert.match(row.password_hash,/^[a-f0-9]{32}:[a-f0-9]{128}$/);
    assert.equal((await post('/auth/login',{email:relay,password:'IncorrectPass1',...consent})).statusCode,401);
    readerId = id;
    readerToken = token;
  });

  await t.test('rejects the wrong audience', async () => {
    assert.equal((await apple(await sign({audience:'wrong.audience',email:relay}))).statusCode,401);
  });
  await t.test('rejects an expired token', async () => {
    assert.equal((await apple(await sign({expires:Math.floor(Date.now()/1000)-60,email:relay}))).statusCode,401);
  });
  await t.test('rejects an invalid signature even with the expected kid', async () => {
    const other = await generateKeyPair('RS256');
    assert.equal((await apple(await sign({privateKey:other.privateKey,email:relay}))).statusCode,401);
  });
  await t.test('reuses the subject without email and preserves a user-edited name', async () => {
    await pool.query("UPDATE users SET display_name='Edited Name' WHERE id=$1",[readerId]);
    const result = await apple(await sign(),{givenName:'Different'});
    assert.equal(result.statusCode,200,result.body);
    assert.equal(result.json().id,readerId);
    assert.notEqual(result.json().token,readerToken);
    const rows = (await pool.query('SELECT display_name FROM users WHERE apple_sub=$1',['apple-reader'])).rows;
    assert.deepEqual(rows,[{display_name:'Edited Name'}]);
  });
  await t.test('links a matching password account and fills an empty display name', async () => {
    const email = 'password@example.test';
    const signup = await post('/auth/signup',{email,password:'Password123',...consent});
    assert.equal(signup.statusCode,201,signup.body);
    const {id} = signup.json();
    await pool.query("UPDATE users SET display_name='' WHERE id=$1",[id]);
    const result = await apple(await sign({sub:'apple-password',email:'Password@example.test'}),{familyName:'Bird'});
    assert.equal(result.statusCode,200,result.body);
    assert.equal(result.json().id,id);
    const row = (await pool.query('SELECT apple_sub,display_name,email FROM users WHERE id=$1',[id])).rows[0];
    assert.deepEqual(row,{apple_sub:'apple-password',display_name:'Bird',email});
    assert.equal((await apple(await sign({sub:'different-subject',email}))).statusCode,401);
  });
  await t.test('reports missing client configuration', async () => {
    const unconfigured = buildApp(pool,false,{appleClientId:'',appleJwks});
    try {
      const result = await unconfigured.inject({method:'POST',url:'/auth/apple',payload:{identityToken:await sign(),...consent}});
      assert.equal(result.statusCode,503,result.body);
      assert.match(result.json().message,/APPLE_CLIENT_ID/);
    } finally {
      await unconfigured.close();
    }
  });
  await t.test('requires consent and an email for initial linking, and rejects deleted accounts', async () => {
    const identityToken = await sign({sub:'no-email'});
    assert.equal((await post('/auth/apple',{})).statusCode,400);
    assert.equal((await post('/auth/apple',{identityToken})).statusCode,400);
    assert.equal((await post('/auth/apple',{identityToken,...consent,cancelled:true})).statusCode,400);
    assert.equal((await apple('invalid')).statusCode,401);
    assert.equal((await apple(identityToken)).statusCode,401);
    await pool.query('UPDATE users SET deleted_at=NOW() WHERE id=$1',[readerId]);
    assert.equal((await apple(await sign({email:relay}))).statusCode,401);
    assert.equal((await apple(await sign({sub:'new-subject',email:relay}))).statusCode,401);
  });
  await t.test('serializes concurrent initial sign-ins', async () => {
    const sub = 'apple-concurrent';
    const identityToken = await sign({sub,email:'concurrent@example.test'});
    const results = await Promise.all([apple(identityToken),apple(identityToken)]);
    for (const result of results) assert.equal(result.statusCode,200,result.body);
    assert.equal(results[0]!.json().id,results[1]!.json().id);
    assert.equal((await pool.query('SELECT id FROM users WHERE apple_sub=$1',[sub])).rowCount,1);
  });
});
