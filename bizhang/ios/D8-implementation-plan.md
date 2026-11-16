# D8b iOS Implementation Plan

**Goal:** Replace Alerts/Settings placeholders and connect overview cards to real APIs.
**Architecture:** Existing Objective-C/UIKit table controllers, strict dictionary boundary validation, shared D6 decimal/error utilities. All trigger decisions and monetary calculations remain on server.
**Spec:** ~/crypto-d1-architecture.md §4.4/§5, D6/D7 acceptance, user's D8b brief.
**Constraints:** Only ios/ and evidence/d8/; main ff7d340; no credentials read, no Smith, no server edits. Disposable d8_ users only; loopback DEBUG acceptance. User explicitly authorizes branch/commit/push and implementation; execute inline.

- [ ] 1. Add failing strict JSON / binding / summary / validation tests. Implement BZAlertSupport to validate/render real D7 fields, SGT counting, restart warning only using returned price. Summary uses latest record contract, malformed/error => unavailable.
- [ ] 2. Add Alerts controller, event history, Telegram binding, alert editor with frozen request retries, If-Match/Idempotency-Key, conflict disabled save. Test production controllers and outgoing network requests, confirmation gates and service failures.
- [ ] 3. Add Settings with GET /me authoritative state and PATCH /me/settings. Synchronize overview currency via notification and fresh server reads. Replace placeholder root tabs and overview two cards. Test rendering and persistence.
- [ ] 4. Run all existing tests plus new fixture tests on iPhone 17. DEBUG live test with dedicated temporary d8_ account verifies immediate/active create, stop/restart, unconfigured binding, SGD persistence, unavailable/no-summary state. Capture actual controller screenshots and redact temporary binding credential in evidence only.
- [ ] 5. Clean all temporary account rows, record counts. Build Release, review scope, commit and push once. Write ~/crypto-d8b-report.md with individual results and unresolved issues, last line D8B_DONE.

Review focus: malformed JSON must never crash; writes with uncertain outcome must not change request or headers; alerts paused is separate from disabled; failed summary must not fake no record; stale async responses must not overwrite latest state. Events API caps at 100; today's count must report limitation if truncated.

Progress: baseline 17 tests green; new 5 fixture tests RED with 29 assertions (tdd-red.log). Support/parser and screens implemented. Existing D6 delayed-response test captured all overview traffic; D8 adds 4 independent requests. Scope its delayed capture to portfolio/quotes, retaining exact same stale-response assertions. Summary wire shape provisional flat day_pnl_usd/day_pnl_sgd, no conversion; verify against D8a deployment before finish.
Full suite with no live credentials: 28 tests, 5 skipped, 0 failures. Live-credential suite exposed another D6 mock capturing background overview requests as editor POST writes. Filter only /transactions, keeping original frozen body/header assertions. Dependency check 02:50 SGT: no summary module deployed and baseline /me/settings returns 501; pending D8a, do not fake acceptance.
