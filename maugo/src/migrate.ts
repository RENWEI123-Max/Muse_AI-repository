import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import pg from 'pg';
import { readConfig } from './config.js';

const pool = new pg.Pool({ connectionString: readConfig().databaseUrl, connectionTimeoutMillis: 3000 });
const client = await pool.connect().catch(async (error) => { await pool.end(); throw error; });
try {
  await client.query('BEGIN');
  await client.query('SELECT pg_advisory_xact_lock(904210)');
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
  const directory = new URL('../server/migrations/', import.meta.url);
  for (const name of (await readdir(directory)).filter(n => n.endsWith('.sql')).sort()) {
    const applied = await client.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    if (applied.rowCount) continue;
    await client.query(await readFile(new URL(name, directory), 'utf8'));
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    console.log('Applied', name);
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
