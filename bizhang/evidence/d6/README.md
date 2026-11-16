# D6 evidence

Base: main/origin/main 6c764ea2e0aa93e7d957d6bcc189ddf9e5f73d75. Branch codex/bizhang-d6.

XCTest: 17 discovered, 15 executed passed, 2 deliberate phase skips (D4 evidence mode, D6 dedicated live). Dedicated D6 real-backend simulator phase: 1/1 passed. Debug and Release builds: BUILD SUCCEEDED.

Fixture USD BTC=140, FX=1.30: quantity 1.5; average 111.00; remaining cost 166.50; realized 8.50; market value 210.00; unrealized 43.50; SGD unrealized S$56.55. Fixtures in BiZhangTests/Fixtures, rendered through actual ledger and overview cells. Fixture screenshots are test-host injection; live screenshots use API results. No backend price cache was changed.

Real API results: quantity 1.500000000000000000; average 111.000000000000000000; remaining cost 166.500000000000000000; realized 8.500000000000000000; market value 96895.257750000000000000; unrealized 96728.757750000000000000; value − 166.50 = unrealized exactly. Implied live BTC unit price = 64596.83850000000000000.

UIKit action acceptance (hosted XCTest in iPhone 17, iOS27.2 simulator): API seed 3 records → actual new form buy0.1@150 fee1 → 4 rows/quantity1.6 → edit price151 version2 → 4 rows → delete via confirmation action handler → 3 rows and cost166.50 restored. The test uses production controls/actions within the running App, not physical manual touches or a separate XCUITest runner.

Cleanup: each run's newly generated d6_ account only. Latest run deleted transaction_requests4, transactions4 (including soft-deleted row), sessions3, users1. Remaining users0, transaction_requests/transactions/sessions orphan counts0. Prior run cleanup retained in cleanup-run1.log. Keychain/cache cleared by test tearDown. No preexisting password/token files read.

Screenshots:
- d6-after-create.png
- d6-after-delete.png
- d6-after-edit.png
- d6-delete-confirm.png
- d6-edit-form.png
- d6-ledger-fixed.png
- d6-new-form.png
- d6-overview-fixture-sgd.png
- d6-overview-fixture-usd.png
- d6-overview-live.png

Additional evidence: d6-live-portfolio.json, d6-live-transactions.json, xctest-all.log, xctest-live.log, build-debug.log, build-release.log, cleanup.log.

Review: independent code and native screenshot review, material issues fixed and regression tested. No visual detector ran (launcher download unavailable); native screenshots inspected directly. Existing style retained; no design tokens changed. D5 positions only expose USD average/remaining cost/asset realized; these remain clearly USD-labelled even when total/value/unrealized and current quote switch to SGD. No client FX arithmetic. No backend/login/market-page source changes.
