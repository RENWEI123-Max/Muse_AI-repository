# D6 Implementation Plan

Goal: implement the authorized D6 ledger and portfolio in Objective-C/UIKit, preserving login and market behavior.
Spec: ~/crypto-d1-architecture.md (§2.1, §2.2, §3.4, §5, §7), ~/crypto-d5-acceptance.md and the D6 task.

Constraints: iOS 15+, no dependencies, decimal strings/NSDecimalNumber only; server owns replay and FX. Source edits only under bizhang/ios; requested evidence under bizhang/evidence/d6. No existing secrets, no backend edits/deployments, only disposable d6_ accounts. Branch starts at 6c764ea.

- [x] Task 1: Add failing tests for ledger decimal input, fixed portfolio rendering, malformed payloads, and write headers/error details. Add ledger-specific validated presentation helpers and an API headers overload, preserving the old request interface. Verify via BiZhangTests.
- [x] Task 2: Add BZLedgerViewController and sheet editor. GET limit=50/before_id, refresh, stable per-submission UUID, If-Match update/delete, raw error codes/details, opening quantity/cost/date, no client cost calculation. Wire only the ledger tab.
- [x] Task 3: Replace overview holdings placeholders with /portfolio results, USD/SGD formatting, price/FX/incomplete/offline labels, 60s foreground polling. Cache read-only portfolio and first ledger page per user.
- [x] Task 4: Run all existing/new XCTest, Debug/Release simulator builds. Exercise real d6_ account fixtures plus create/edit/delete using actual form actions, capture screenshots, verify fixed and live figures. Always clean DB/account/session and simulator session in finally.
- [x] Task 5: Fresh code/evidence review, scoped diff/secret checks, commit and push codex/bizhang-d6 (stop on push failure), write ~/crypto-d6-report.md with evidence, cleanup and unresolved items.

Review focus: lost POST response must reuse key and payload; 412 must prompt reload; refresh/page races must not duplicate rows; invalid/missing amounts must never become zero; stale or partial prices must never appear current. Opening cost explicit, hidden fields omitted, timestamps whole-minute UTC displayed SGT. No original credentials may enter evidence.

Execution: tasks 1–4 verified; task 5 review complete, scoped commit/push is final handoff. Independent reviewer findings (note types, source age, refresh races) fixed; regression suite green (17 tests, 2 expected phase skips), live phase 1/1. Debug and Release simulator builds succeed.
