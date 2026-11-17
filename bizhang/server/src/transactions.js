// Every transaction is bounded; cleanup destroys a connection if rollback/unlock fails.
export async function begin(c) {
  await c.query('BEGIN');
  await c.query("SET LOCAL lock_timeout = '10s'; SET LOCAL statement_timeout = '30s'; SET LOCAL idle_in_transaction_session_timeout = '20s'");
}
export async function release(c, unlock) {
  let failure;
  try { await c.query('ROLLBACK'); if (unlock) await unlock(); }
  catch (e) { failure = e; }
  finally { c.release(failure); }
}
// Scoped by pool so independent app instances do not suppress one another.
export async function exclusive(pool, name, work) {
  let jobs = running.get(pool);
  if (!jobs) running.set(pool, jobs = new Set());
  if (jobs.has(name)) { console.warn(`BiZhang ${name} tick overlap skipped`); return; }
  jobs.add(name);
  try { return await work(); } finally { jobs.delete(name); }
}
const running = new WeakMap();
