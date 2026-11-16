import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, tokenHash } from "../src/password.js";
import { buildApp, protectedRoutes } from "../src/app.js";
test("scrypt uses unique salts and verifies without plaintext storage", async () => {
  const a = await hashPassword("new-test-password");
  const b = await hashPassword("new-test-password");
  assert.notEqual(a, b);
  assert(await verifyPassword("new-test-password", a));
  assert.equal(await verifyPassword("wrong", a), false);
  assert.equal(tokenHash("test").length, 32);
});
test("every planned endpoint rejects missing and forged tokens before handlers", async () => {
  const app = await buildApp({ query: async () => ({ rows: [] }) });
  try {
    for (const [method, path] of protectedRoutes)
      for (const authorization of [
        undefined,
        "Bearer " + "a".repeat(64),
        "Bearer malformed",
      ]) {
        const r = await app.inject({
          method,
          url: "/api/v1" + path.replace(":id", "1"),
          headers: authorization ? { authorization } : {},
        });
        assert.equal(r.statusCode, 401, `${method} ${path}`);
        assert.equal(r.json().error.code, "UNAUTHORIZED");
      }
  } finally {
    await app.close();
  }
});
