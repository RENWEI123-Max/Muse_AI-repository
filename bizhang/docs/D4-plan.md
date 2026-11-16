# D4 implementation plan
Spec: ~/crypto-d1-architecture.md §1, §7; approved ~/crypto-ui-prototype.html; D4 task.

1. Add Binance 121-second tick rejection regression; run red, change age gate, run npm test.
2. Add strict read-only decimal quote/snapshot parsing, monotonic age and protected per-user raw JSON cache. Test malformed decimal, price precision, status boundary, persistence.
3. Add native navigation currency switch, status banner, market rows with source/input times and 30-second foreground refresh. Render cache before refresh and keep cache display stale conservatively across process restart.
4. Add four overview cards with no balances or P&L until D5; foreground 60-second refresh and pull refresh.
5. Build/test iPhone 17; temporary account only; verify live USD/SGD, offline relaunch and Binance outage/recovery. Clean temporary account and sessions. Save evidence and report; commit/push only bizhang.

Constraints: no third-party client libraries, ATS/auth/session unchanged; prices always decimal strings, no client currency conversion or portfolio calculations. Only own API. No deployment.
Review focus: invalid/missing fields, logout races, old cache across reboot, background timer cleanup, unavailable SGD.
