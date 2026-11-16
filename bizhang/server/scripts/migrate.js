import { readFile } from "node:fs/promises";
import { pool } from "../src/db.js";
const c = await pool.connect();
try {
  await c.query("BEGIN");
  await c.query("SELECT pg_advisory_xact_lock(2720261116)");
  await c.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  if (
    !(await c.query("SELECT 1 FROM schema_migrations WHERE version='001'"))
      .rowCount
  ) {
    await c.query(
      await readFile(
        new URL("../migrations/001_initial.sql", import.meta.url),
        "utf8",
      ),
    );
    await c.query("INSERT INTO schema_migrations(version) VALUES('001')");
  }
  if (!(await c.query("SELECT 1 FROM schema_migrations WHERE version='002'")).rowCount) {
    await c.query(await readFile(new URL("../migrations/002_market.sql", import.meta.url), "utf8"));
    await c.query("INSERT INTO schema_migrations(version) VALUES('002')");
  }
  await c.query("COMMIT");
  console.log("Migration 001 ready");
} catch (e) {
  await c.query("ROLLBACK");
  throw e;
} finally {
  c.release();
  await pool.end();
}
