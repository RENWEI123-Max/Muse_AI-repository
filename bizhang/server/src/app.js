import { summary } from './summaries.js';
import { alerts, AlertError } from './alerts.js';
import { binding } from './telegram.js';
import { ledger, LedgerError } from "./ledger.js";
import Fastify from "fastify";
import { randomBytes } from "node:crypto";
import { hashPassword, verifyPassword, tokenHash } from "./password.js";
export const protectedRoutes = [
  ["POST", "/auth/logout"],
  ["GET", "/me"],
  ["PATCH", "/me/settings"],
  ["GET", "/market/quotes"],
  ["GET", "/transactions"],
  ["POST", "/transactions"],
  ["PUT", "/transactions/:id"],
  ["DELETE", "/transactions/:id"],
  ["GET", "/portfolio"],
  ["GET", "/transactions/export.csv"],
  ["GET", "/alerts"],
  ["POST", "/alerts"],
  ["PATCH", "/alerts/:id"],
  ["DELETE", "/alerts/:id"],
  ["GET", "/alerts/events"],
  ["GET", "/summary/daily/latest"],
  ["GET", "/summary/daily/preview"],
  ["GET", "/telegram/binding"],
  ["POST", "/telegram/bind-token"],
  ["DELETE", "/telegram/binding"],
  ["GET", "/healthz"],
];
const error = (reply, status, code, message) =>
  reply.code(status).send({ error: { code, message, detail: {} } });
const userJSON = (u) => ({
  id: u.id,
  username: u.username,
  timezone: u.timezone,
  display_currency: u.display_currency,
  daily_summary_enabled: u.daily_summary_enabled,
});
export async function buildApp(pool, market) {
  const app = Fastify({ logger: false, trustProxy: false, bodyLimit: 16384 });
  const dummy = await hashPassword(randomBytes(32).toString("hex"));
  app.setErrorHandler((e, req, reply) =>
    error(
      reply,
      e.statusCode >= 400 && e.statusCode < 500 ? e.statusCode : 500,
      e.statusCode === 400 ? "BAD_REQUEST" : "INTERNAL_ERROR",
      e.statusCode === 400 ? "请求格式错误" : "服务暂时不可用",
    ),
  );
  app.addHook("onSend", async (req, reply, payload) => {
    reply.header("Cache-Control", "no-store");
    return payload;
  });
  app.addHook("onRequest", async (req, reply) => {
    if (req.method === "POST" && req.url.split("?")[0] === "/api/v1/auth/login")
      return;
    const bearer = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/);
    if (!bearer) return error(reply, 401, "UNAUTHORIZED", "请重新登录");
    const { rows } = await pool.query(
      `UPDATE sessions s SET last_seen_at=now() FROM users u WHERE s.user_id=u.id AND s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() RETURNING s.id AS session_id,u.id,u.username,u.timezone,u.display_currency,u.daily_summary_enabled`,
      [tokenHash(bearer[1])],
    );
    if (!rows.length) return error(reply, 401, "UNAUTHORIZED", "请重新登录");
    req.bzUser = rows[0];
  });
  app.post("/api/v1/auth/login", async (req, reply) => {
    // Commit failure counters even when authentication fails. Serialize across processes.
    const c = await pool.connect();
    let result;
    try {
      await c.query("BEGIN");
      const ip = (
        await c.query(
          `INSERT INTO auth_ip_limits(ip,window_start,attempts) VALUES($1,now(),1) ON CONFLICT(ip) DO UPDATE SET window_start=CASE WHEN auth_ip_limits.window_start<=now()-interval '1 minute' THEN now() ELSE auth_ip_limits.window_start END, attempts=CASE WHEN auth_ip_limits.window_start<=now()-interval '1 minute' THEN 1 ELSE auth_ip_limits.attempts+1 END RETURNING attempts,ceil(extract(epoch FROM window_start+interval '1 minute'-now()))::integer AS retry`,
          [req.ip],
        )
      ).rows[0];
      if (ip.attempts > 10) {
        result = {
          status: 429,
          code: "RATE_LIMITED",
          retry: Math.max(1, ip.retry),
        };
      } else if (
        !req.body ||
        typeof req.body.username !== "string" ||
        typeof req.body.password !== "string" ||
        req.body.username.length > 64 ||
        req.body.password.length > 128
      ) {
        result = { status: 400, code: "BAD_REQUEST" };
      } else {
        const username = req.body.username.trim().toLowerCase();
        await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
          "bizhang-login:" + username,
        ]);
        const u = (
          await c.query(
            "SELECT *,locked_until>now() AS locked,ceil(extract(epoch FROM locked_until-now()))::integer AS retry FROM users WHERE lower(username)=$1 FOR UPDATE",
            [username],
          )
        ).rows[0];
        const valid = await verifyPassword(
          req.body.password,
          u?.password_hash ?? dummy,
        );
        if (u?.locked)
          result = {
            status: 429,
            code: "ACCOUNT_LOCKED",
            retry: Math.max(1, u.retry),
          };
        else if (!u || !valid) {
          if (u)
            await c.query(
              `UPDATE users SET failed_logins=CASE WHEN locked_until IS NOT NULL AND locked_until<=now() THEN 1 ELSE failed_logins+1 END,locked_until=CASE WHEN (CASE WHEN locked_until IS NOT NULL AND locked_until<=now() THEN 1 ELSE failed_logins+1 END)>=5 THEN now()+interval '15 minutes' ELSE NULL END,updated_at=now() WHERE id=$1`,
              [u.id],
            );
          result = { status: 401, code: "UNAUTHORIZED" };
        } else {
          await c.query(
            "UPDATE users SET failed_logins=0,locked_until=NULL,updated_at=now() WHERE id=$1",
            [u.id],
          );
          const token = randomBytes(32).toString("hex");
          const session = (
            await c.query(
              "INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '30 days') RETURNING expires_at",
              [u.id, tokenHash(token)],
            )
          ).rows[0];
          result = {
            body: {
              token,
              expires_at: session.expires_at,
              user: userJSON(u),
              server_time: new Date().toISOString(),
            },
          };
        }
      }
      await c.query("COMMIT");
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    } finally {
      c.release();
    }
    if (result.retry) reply.header("Retry-After", String(result.retry));
    return (
      result.body ??
      error(
        reply,
        result.status,
        result.code,
        result.status === 429 ? "登录尝试过多，请稍后再试" : "账号或密码错误",
      )
    );
  });
  for (const [method, path] of protectedRoutes) {
    app.route({
      method,
      url: "/api/v1" + path,
      handler: async (req, reply) => {
        if (path.startsWith('/summary/')) return summary(pool,market,req);
        if (path.startsWith('/alerts') || path.startsWith('/telegram')) {
          try { return await (path.startsWith('/alerts') ? alerts(pool,req) : binding(pool,req)); }
          catch(e) {
            if(e instanceof AlertError) return reply.code(e.status).send({error:{code:e.code,message:e.message,detail:e.detail}});
            return reply.code(500).send({error:{code:'INTERNAL_ERROR',message:'服务暂时不可用',detail:{}}});
          }
        }
        if (["/transactions", "/transactions/:id", "/portfolio"].includes(path)) {
          try { return await ledger(pool, market, req); } catch(e) {
            if (e instanceof LedgerError) return reply.code(e.status).send({error:{code:e.code,message:e.message,detail:e.detail}});
            throw e;
          }
        }
        if (path === "/auth/logout") {
          await pool.query(
            "UPDATE sessions SET revoked_at=now() WHERE id=$1 AND user_id=$2",
            [req.bzUser.session_id, req.bzUser.id],
          );
          return { ok: true, server_time: new Date().toISOString() };
        }
        if (path === "/me")
          return {
            user: userJSON(req.bzUser),
            server_time: new Date().toISOString(),
          };
        if (path === "/me/settings") {
          const b = req.body ?? {};
          const keys = Object.keys(b);
          if (
            !keys.length ||
            keys.some((k) => !["display_currency", "daily_summary_enabled"].includes(k)) ||
            ("display_currency" in b && !["USD", "SGD"].includes(b.display_currency)) ||
            ("daily_summary_enabled" in b && typeof b.daily_summary_enabled !== "boolean")
          )
            return error(reply, 422, "INVALID_SETTINGS", "设置项不正确");
          const sets = [], vals = [];
          if ("display_currency" in b) { vals.push(b.display_currency); sets.push(`display_currency=$${vals.length}`); }
          if ("daily_summary_enabled" in b) { vals.push(b.daily_summary_enabled); sets.push(`daily_summary_enabled=$${vals.length}`); }
          vals.push(req.bzUser.id);
          const r = await pool.query(
            `UPDATE users SET ${sets.join(",")},updated_at=now() WHERE id=$${vals.length} RETURNING *`,
            vals,
          );
          return { user: userJSON(r.rows[0]), server_time: new Date().toISOString() };
        }
        if (path === "/market/quotes" && market) return market.quotes();
        if (path === "/healthz")
          return { ok: true, server_time: new Date().toISOString() };
        return error(reply, 501, "NOT_IMPLEMENTED", "此功能将在后续开发日提供");
      },
    });
  }
  app.setNotFoundHandler((req, reply) =>
    error(reply, 404, "NOT_FOUND", "接口不存在"),
  );
  return app;
}
