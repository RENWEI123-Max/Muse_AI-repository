import 'dotenv/config';
import pg from 'pg';
import { buildApp } from './app.js';
import { readConfig } from './config.js';

const config = readConfig();
const pool = new pg.Pool({ connectionString: config.databaseUrl, connectionTimeoutMillis: 3000 });
const app = buildApp(pool, true);
pool.on('error', (error) => app.log.error({ err: error }, 'Database pool error'));
app.addHook('onClose', async () => { await pool.end(); });
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  try { await app.close(); } catch (error) { app.log.error(error); process.exitCode = 1; }
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error);
  await shutdown();
  process.exitCode = 1;
}
