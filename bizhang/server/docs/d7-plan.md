# D7 implementation plan

Goal: implement architecture §3.8–3.11, §4.4, §5 and D7 acceptance in the existing server.
Spec: ~/crypto-d1-architecture.md; ~/crypto-d5-acceptance.md; user D7 instructions.
Architecture: PostgreSQL atomic event/outbox writes; rule row locks and generation uniqueness; injectable Telegram transport and clock. No credentials or live services in tests.

- [x] Add disposable PostgreSQL integration tests: immediate create, idempotency/concurrency, restart, manual disable, pause/recovery, isolation, version conflicts, soft delete, history.
- [x] Add 004: persisted POST responses, nullable unbound outbox destination with explicit failed status, sending lease, persistent chat rate slots, poll offset, runtime grants.
- [x] Implement alerts.js CRUD and evaluator. Read current prices inside creation transaction using shared market status function; use exact decimals. Add routes and Binance-after-collection hook.
- [x] Implement telegram.js: environment-only production transport; persisted leases/retries, 2/8/30/120/600-second schedule with five send attempts, 429 retry_after, one-second chat slots, binding tokens, private /start handling and long polling.
- [x] Test sending subprocess SIGKILL recovery against disposable PostgreSQL; fake transport only. Verify no duplicate event and resend after >60 seconds.
- [x] Run all npm tests, inspect diff and scope, document evidence/limitations, commit and push codex/bizhang-d7. Stop on push failure.

Review focus: unbound/revoked destinations, simultaneous workers, stale status computed at read time, expired/replayed bind tokens, safe error messages that never include transport URLs or tokens.
