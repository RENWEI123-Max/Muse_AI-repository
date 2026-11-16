import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
Object.assign(
  process.env,
  JSON.parse(readFileSync("/srv/bizhang/private/runtime.json", "utf8")),
);
const { pool } = await import("../src/db.js");
const { buildApp, protectedRoutes } = await import("../src/app.js");
const { tokenHash } = await import("../src/password.js");
let password = "";
for await (const c of process.stdin) password += c;
password = password.trim();
const admin = (query) =>
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
      "bizhang",
      "-At",
    ],
    {
      input: "SET ROLE bizhang_owner;" + query,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
const app = await buildApp(pool);
let count = 0;
const check = (v, message) => {
  assert(v, message);
  count++;
};
const login = (body, ip = "127.0.1.1", headers = {}) =>
  app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    remoteAddress: ip,
    headers,
    payload: body,
  });
const reset = () =>
  admin(
    "UPDATE users SET failed_logins=0,locked_until=NULL WHERE username='Smith';DELETE FROM auth_ip_limits WHERE ip << '127.0.1.0/24'::inet;",
  );
try {
  reset();
  for (const [method, path] of protectedRoutes)
    for (const auth of [undefined, "Bearer " + "f".repeat(64)]) {
      const r = await app.inject({
        method,
        url: "/api/v1" + path.replace(":id", "1"),
        headers: auth ? { authorization: auth } : {},
      });
      check(r.statusCode === 401, `anonymous/forged ${method} ${path}`);
    }
  const r = await login({ username: "Smith", password });
  check(r.statusCode === 200, "Smith login");
  const session = r.json();
  check(/^[a-f0-9]{64}$/.test(session.token), "32 random bytes as hex");
  check(typeof session.user.id === "string", "numeric ID is string");
  check(
    Math.abs(Date.parse(session.expires_at) - Date.now() - 30 * 86400000) <
      5000,
    "30 day lifetime",
  );
  const rows = await pool.query(
    "SELECT token_hash FROM sessions WHERE token_hash=$1",
    [tokenHash(session.token)],
  );
  check(
    rows.rowCount === 1 && rows.rows[0].token_hash.length === 32,
    "DB stores only SHA256",
  );
  const headers = { authorization: "Bearer " + session.token };
  check(
    (await app.inject({ url: "/api/v1/me", headers })).statusCode === 200,
    "authenticated me",
  );
  admin(
    "UPDATE sessions SET expires_at=now()-interval '1 second' WHERE user_id=(SELECT id FROM users WHERE username='Smith') AND revoked_at IS NULL;",
  );
  check(
    (await app.inject({ url: "/api/v1/me", headers })).statusCode === 401,
    "expired token rejected",
  );
  const second = (await login({ username: "smith", password })).json();
  const h = { authorization: "Bearer " + second.token };
  check(
    (
      await app.inject({
        method: "POST",
        url: "/api/v1/auth/logout",
        headers: h,
      })
    ).statusCode === 200,
    "logout",
  );
  check(
    (await app.inject({ url: "/api/v1/me", headers: h })).statusCode === 401,
    "revoked token rejected",
  );
  reset();
  for (let i = 0; i < 10; i++)
    check(
      (
        await login({ username: "nobody", password: "wrong" }, "127.0.1.2", {
          "x-forwarded-for": `10.0.0.${i}`,
        })
      ).statusCode === 401,
      "IP window first ten",
    );
  const limit = await login(
    { username: "nobody", password: "wrong" },
    "127.0.1.2",
  );
  check(
    limit.statusCode === 429 && Number(limit.headers["retry-after"]) > 0,
    "IP 11th limited despite spoofed forwarded headers",
  );
  reset();
  const failures = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      login(
        { username: i % 2 ? "SMITH" : "Smith", password: "wrong" },
        `127.0.1.${10 + i}`,
      ),
    ),
  );
  check(
    failures.every((x) => x.statusCode === 401),
    "five concurrent failures counted",
  );
  const lock = await login({ username: "Smith", password }, "127.0.1.20");
  check(
    lock.statusCode === 429 && Number(lock.headers["retry-after"]) >= 895,
    "five failures lock even correct password for 15 minutes",
  );
  admin(
    "UPDATE users SET locked_until=now()-interval '1 second' WHERE username='Smith'",
  );
  check(
    (await login({ username: "Smith", password }, "127.0.1.21")).statusCode ===
      200,
    "lock expires; successful login resets counters",
  );
  reset();
  for (let i = 0; i < 4; i++)
    await login({ username: "Smith", password: "wrong" }, "127.0.1.22");
  check(
    (await login({ username: "Smith", password }, "127.0.1.22")).statusCode ===
      200,
    "success before fifth resets failures",
  );
  check(
    (await pool.query("SELECT failed_logins FROM users WHERE username='Smith'"))
      .rows[0].failed_logins === 0,
    "counter reset persisted",
  );
  check(
    admin("SELECT count(*) FROM assets").trim().endsWith("10"),
    "ten assets seeded",
  );
  check(
    admin(
      "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','sessions','assets','transactions','price_cache','price_ticks','reference_rates','alert_rules','alert_events','telegram_outbox','telegram_bindings','daily_summaries')",
    )
      .trim()
      .endsWith("12"),
    "all twelve architecture tables",
  );
  check(
    admin(
      "SELECT has_table_privilege('bizhang_app','transactions','INSERT') OR has_schema_privilege('bizhang_app','public','CREATE')",
    )
      .trim()
      .endsWith("f"),
    "runtime lacks business write and schema creation privileges",
  );
  console.log(
    `PASS: ${count} PostgreSQL-backed assertions (all routes, token lifecycle, IP/account limits, concurrency, schema, privileges).`,
  );
} finally {
  reset();
  admin(
    "DELETE FROM sessions WHERE user_id=(SELECT id FROM users WHERE username='Smith');",
  );
  await app.close();
  await pool.end();
}
