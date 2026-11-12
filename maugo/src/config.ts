export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL required');
  if (!['postgres:', 'postgresql:'].includes(new URL(env.DATABASE_URL).protocol)) {
    throw new Error('DATABASE_URL must use PostgreSQL');
  }
  return { port, host: env.HOST ?? '0.0.0.0', databaseUrl: env.DATABASE_URL };
}
