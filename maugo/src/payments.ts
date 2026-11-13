import type { FastifyInstance } from 'fastify';
import type { PoolClient } from 'pg';
import { X509Certificate, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { decodeProtectedHeader, importPKCS8, jwtVerify, SignJWT } from 'jose';
import economy from './economy.json' with { type: 'json' };
import { creditWallet } from './wallet.js';

const fail = (statusCode: number, message: string): never => { throw Object.assign(new Error(message), { statusCode }); };
export type AppleOptions = {
  env?: NodeJS.ProcessEnv;
  verifyJws?: (signed: string) => Promise<any>;
  getTransaction?: (id: string, environment: string) => Promise<string>;
};

// Trust only Apple's public G3 root, never a root supplied by the caller alone.
// https://www.apple.com/certificateauthority/AppleRootCA-G3.cer
export async function verifyAppleJws(signed: string) {
  try {
    const header = decodeProtectedHeader(signed);
    if (header.alg !== 'ES256' || header.x5c?.length !== 3) throw new Error('Invalid chain');
    const chain = header.x5c.map(cert => new X509Certificate(Buffer.from(cert, 'base64')));
    if (chain[2].fingerprint256 !== '63:34:3A:BF:B8:9A:6A:03:EB:B5:7E:9B:3F:5F:A7:BE:7C:4F:5C:75:6F:30:17:B3:A8:C4:88:C3:65:3E:91:79') throw new Error('Untrusted root');
    for (let i = 0; i < chain.length; i++) {
      const cert = chain[i];
      if (Date.now() < Date.parse(cert.validFrom) || Date.now() > Date.parse(cert.validTo) ||
        !cert.verify(chain[Math.min(i + 1, 2)].publicKey) || (i > 0 && !cert.ca)) throw new Error('Invalid certificate');
    }
    // Apple's App Store signing leaf and intermediate certificate policy OIDs.
    if (!chain[0].raw.includes(Buffer.from('060a2a864886f76364060b01','hex')) ||
      !chain[1].raw.includes(Buffer.from('060a2a864886f76364060201','hex'))) throw new Error('Invalid certificate purpose');
    return (await jwtVerify(signed, chain[0].publicKey, { algorithms: ['ES256'] })).payload;
  } catch { return fail(400, 'Invalid Apple JWS signature'); }
}

export function registerApplePayments(app: FastifyInstance,
  transaction: (work: (c: PoolClient) => Promise<unknown>) => Promise<unknown>,
  authenticate: (c: PoolClient, authorization?: string) => Promise<any>, options: AppleOptions = {}) {
  const env = options.env ?? process.env;
  const verify = options.verifyJws ?? verifyAppleJws;
  async function credentials() {
    const missing = ['APPLE_BUNDLE_ID','APPLE_API_KEY_ID','APPLE_API_ISSUER_ID','APPLE_API_KEY_PATH'].filter(key => !env[key]);
    if (missing.length) fail(503, 'Missing Apple configuration: ' + missing.join(', '));
    try { return await importPKCS8(await readFile(env.APPLE_API_KEY_PATH!, 'utf8'), 'ES256'); }
    catch { return fail(503, 'Invalid or unreadable APPLE_API_KEY_PATH'); }
  }
  async function getTransaction(id: string, environment: string) {
    const key = await credentials();
    if (options.getTransaction) return options.getTransaction(id, environment);
    const token = await new SignJWT({ bid: env.APPLE_BUNDLE_ID }).setProtectedHeader({ alg:'ES256', kid:env.APPLE_API_KEY_ID, typ:'JWT' })
      .setIssuer(env.APPLE_API_ISSUER_ID!).setAudience('appstoreconnect-v1').setIssuedAt().setExpirationTime('5m').sign(key);
    const host = environment === 'Sandbox' ? 'api.storekit-sandbox.apple.com' : 'api.storekit.apple.com';
    let response: Response;
    try { response = await fetch(`https://${host}/inApps/v1/transactions/${encodeURIComponent(id)}`, { headers:{ authorization:`Bearer ${token}` }, signal:AbortSignal.timeout(10000) }); }
    catch { return fail(503, 'App Store Server API unavailable'); }
    if (!response.ok) fail(response.status === 404 ? 400 : 503, 'App Store transaction lookup failed');
    return (await response.json() as { signedTransactionInfo: string }).signedTransactionInfo;
  }
  function validate(tx: any) {
    if (tx.bundleId !== env.APPLE_BUNDLE_ID) fail(400, 'Apple bundleId mismatch');
    const product = economy.bundles.find(p => p.id === tx.productId);
    if (!product) return fail(400, 'Unknown Apple productId');
    if (typeof tx.transactionId !== 'string' || !/^\d{1,128}$/.test(tx.transactionId) ||
      !['Sandbox','Production'].includes(tx.environment)) fail(400, 'Invalid Apple transaction');
    return product;
  }
  const bodySchema = (field: string) => ({ type:'object', additionalProperties:false, required:[field], properties:{ [field]:{type:'string',minLength:1,maxLength:100000} } });
  app.get('/payments/apple/products', async () => ({ products:economy.bundles }));
  app.post<{ Body: { signedTransaction: string } }>('/payments/apple/verify', { schema:{ body:bodySchema('signedTransaction') } }, async request => {
    await credentials();
    const submitted = await verify(request.body.signedTransaction);
    validate(submitted);
    const tx = await verify(await getTransaction(submitted.transactionId, submitted.environment));
    const product = validate(tx);
    if (tx.transactionId !== submitted.transactionId || tx.environment !== submitted.environment || tx.productId !== submitted.productId || tx.revocationDate) fail(400, 'Apple transaction mismatch or revoked');
    return transaction(async c => {
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', ['apple:'+tx.transactionId]);
      const user = await authenticate(c, request.headers.authorization);
      if (tx.appAccountToken?.toLowerCase() !== user.id.toLowerCase()) fail(403, 'Apple transaction owner mismatch');
      const previous = (await c.query('SELECT * FROM apple_transactions WHERE transaction_id=$1', [tx.transactionId])).rows[0];
      if (previous?.refunded) fail(409, 'Apple transaction refunded');
      if (previous && previous.user_id !== user.id) fail(409, 'Apple transaction already claimed');
      if (previous) return { balance:previous.balance, credited:previous.diamonds, transactionId:tx.transactionId };
      const entry = await creditWallet(c, user.id, product.diamonds, 'apple:'+tx.transactionId);
      await c.query('INSERT INTO apple_transactions(transaction_id,user_id,product_id,diamonds,balance) VALUES($1,$2,$3,$4,$5)', [tx.transactionId,user.id,product.id,product.diamonds,entry.balance_after]);
      return { balance:entry.balance_after, credited:product.diamonds, transactionId:tx.transactionId };
    });
  });
  app.post<{ Body: { signedPayload: string } }>('/payments/apple/notifications', { schema:{ body:bodySchema('signedPayload') } }, async request => {
    await credentials();
    const notification = await verify(request.body.signedPayload);
    if (notification.data?.bundleId !== env.APPLE_BUNDLE_ID) fail(400, 'Apple bundleId mismatch');
    if (notification.notificationType !== 'REFUND') {
      request.log.info({ notificationType:notification.notificationType, notificationUUID:notification.notificationUUID }, 'Apple notification');
      return { received:true };
    }
    const tx = await verify(notification.data.signedTransactionInfo);
    validate(tx);
    return transaction(async c => {
      await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', ['apple:'+tx.transactionId]);
      const original = (await c.query('SELECT * FROM apple_transactions WHERE transaction_id=$1',[tx.transactionId])).rows[0];
      if (original?.refunded) return { received:true };
      // A refund arriving before client verification permanently prevents credit.
      if (!original) {
        await c.query('INSERT INTO apple_transactions(transaction_id,refunded) VALUES($1,true)',[tx.transactionId]);
        return { received:true };
      }
      const user = (await c.query('SELECT * FROM users WHERE id=$1 FOR UPDATE',[original.user_id])).rows[0];
      const balance = user.diamonds >= original.diamonds ? user.diamonds - original.diamonds : user.diamonds;
      await c.query('UPDATE users SET diamonds=$2 WHERE id=$1',[user.id,balance]);
      await c.query('INSERT INTO wallet_ledger(id,user_id,amount,balance_after,apple_refund_transaction_id) VALUES($1,$2,$3,$4,$5)',[randomUUID(),user.id,-original.diamonds,balance,tx.transactionId]);
      await c.query('UPDATE apple_transactions SET refunded=true WHERE transaction_id=$1',[tx.transactionId]);
      return { received:true };
    });
  });
}
