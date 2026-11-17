import pg from "pg";
// pg receives credentials only from the caller's environment; never log configuration.
export const pool = new pg.Pool({ max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000,
  statement_timeout: 30000, lock_timeout: 10000, idle_in_transaction_session_timeout: 20000, application_name: "bizhang" });

// Error messages may contain connection details; emit only a safe event marker.
pool.on("error", () => console.error("BiZhang PostgreSQL pool connection error"));
