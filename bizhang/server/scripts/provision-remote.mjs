// Run only on sg-claude, via stdin: NEW Smith password. Never reads existing secrets.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
const root = "/srv/bizhang";
const sql = (query, db = "postgres") =>
  execFileSync(
    "docker",
    [
      "exec",
      "-i",
      "maugo-postgres-1",
      "psql",
      "-X",
      "-v",
      "ON_ERROR_STOP=1",
      "-U",
      "maugo",
      "-d",
      db,
      "-At",
    ],
    { input: query, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
  );
if (
  sql("SELECT 1 FROM pg_database WHERE datname='bizhang'").trim() ||
  sql(
    "SELECT 1 FROM pg_roles WHERE rolname IN ('bizhang_owner','bizhang_app')",
  ).trim()
)
  throw Error("Existing bizhang DB/roles: stop; inspect metadata before rerun");
if (existsSync(root + "/private/runtime.json"))
  throw Error("Existing runtime configuration: stop");
let smith = "";
for await (const chunk of process.stdin) smith += chunk;
smith = smith.trim();
if (smith.length < 12 || smith.length > 128)
  throw Error("Supply a NEW password via stdin");
const password = randomBytes(32).toString("hex");
sql(
  `CREATE ROLE bizhang_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;CREATE ROLE bizhang_app LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;CREATE DATABASE bizhang OWNER bizhang_owner;REVOKE ALL ON DATABASE bizhang FROM PUBLIC;GRANT CONNECT ON DATABASE bizhang TO bizhang_app;`,
);
sql(
  "REVOKE ALL ON SCHEMA public FROM PUBLIC;ALTER SCHEMA public OWNER TO bizhang_owner;",
  "bizhang",
);
mkdirSync(root + "/private", { recursive: true, mode: 0o700 });
writeFileSync(
  root + "/private/runtime.json",
  JSON.stringify({
    PGHOST: "127.0.0.1",
    PGPORT: "5432",
    PGDATABASE: "bizhang",
    PGUSER: "bizhang_app",
    PGPASSWORD: password,
    PORT: "3100",
  }),
  { mode: 0o600 },
);
// Migrations execute with the NOLOGIN owner, through the existing local admin socket.
const { readFileSync } = await import("node:fs");
sql(
  "SET ROLE bizhang_owner;BEGIN;" +
    readFileSync(root + "/server/migrations/001_initial.sql", "utf8") +
    "CREATE TABLE schema_migrations(version text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now());INSERT INTO schema_migrations(version) VALUES('001');COMMIT;",
  "bizhang",
);
const { hashPassword } = await import("../src/password.js");
const hash = await hashPassword(smith);
sql(
  `SET ROLE bizhang_owner;INSERT INTO users(username,password_hash) VALUES('Smith','${hash}');GRANT USAGE ON SCHEMA public TO bizhang_app;GRANT SELECT ON users TO bizhang_app;GRANT UPDATE(failed_logins,locked_until,updated_at) ON users TO bizhang_app;GRANT SELECT,INSERT,UPDATE ON sessions,auth_ip_limits TO bizhang_app;GRANT USAGE ON SEQUENCE sessions_id_seq TO bizhang_app;`,
  "bizhang",
);
console.log(
  "Created isolated bizhang database; seeded Smith; runtime role has auth-only privileges.",
);
