# Simulator walkthrough fix batch

Branch: `codex/sim-fixes`, based on origin/main `597451e3df2b7060f68cf8755065357ea35cfbb0`.
Client changes only. Committed + pushed on branch `codex/sim-fixes` per the task file (the handoff note about not committing is superseded). The local ATS exception in `client/ios/App/App/Info.plist` is NOT part of this branch (working-tree only, demo-only). Existing `full-regression/` left alone (untracked, not committed).

## Verification

- PASS: `cd client && npm run build` after all source edits (verify:assets: 343 PNGs, vue-tsc, Vite). Build log: `/tmp/maugo-sim-fixes-build.log`.
- PASS: `git diff --check`.
- PASS: Node VM spot check executing the actual checkBalance function with its TypeScript generic removed: stale prop 0, nine server snapshots at 200 produce no funded event; increase to 230 produces one event, subsequent snapshot produces no duplicate. This is a logic check, not a browser or purchase test.
- Playwright fast-list RUN on the Mac (see Playwright fast-list section): build + smoke PASS; backend 57/1 (known pre-existing auth rate-limit failure); Playwright 23 expected / 46 unexpected — all 46 are the N4 behavior change (removed session CTA), none in the fixed features. Codex's sandbox could not run Playwright (EPERM on localhost bind); this run is on the Mac directly.
- Simulator RUN (supervising agent, 2026-11-15 ~17:47-18:23 CST): rebuilt from this branch + local ATS exception (see Simulator verification), installed on MauGo iPhone (iPhone 17, iOS 27.2, UDID 7C5AD388-00DB-4F7D-B514-3C32AA264F7E), verified N1/N2/N3/N4/O1/N6 + collect end-to-end by idb + screenshots. Client build from branch PASS (bundle index-DkdJ5p6u.js, 8082 API URL baked in); xcodebuild BUILD SUCCEEDED.
- Duplicate-run process inspection was unavailable (`ps: operation not permitted`). No preexisting sim-fixes branch was listed before branch creation.

## Per-item acceptance

| Item | Change / evidence | Acceptance status |
| --- | --- | --- |
| N1 | ReplyTopup takes its baseline from the first successful server wallet snapshot on opening, never from stale parent props. Immediate snapshot and polling share one in-flight guard. Only a subsequent increase meeting the required balance emits funded. Existing server-verified purchase/leave path retained. Node logic check passes. | Simulator **PASS**: wallet sheet opened from home Diamonds, still open at +13s (maugo-simfix-wallet13s.png); balance 200 shown; close button works. No auto-close. |
| N3 / O2 | Auth input font was `--font-body` = 13px. iOS focus enlargement to 16px gives 16/13 = 1.23077, matching reported ~1.232 scale. Set auth inputs to 16px to prevent focus zoom at its source, without disabling user zoom or forcing layout. Blur active input before successful email login leaves auth. No client visualViewport/zoom mutation was found. | Simulator **PASS**: two logout/email-login cycles (round 1 ~18:15, round 2 ~18:18); home + profile positions normal both times, no zoom/shift, Everyone capsule clear. No terminate+launch. |
| N2 | Explicitly center wallet Pass header with flex alignment and reserve separate 44px close target, overriding legacy home-sheet header cascade regardless of import order. Full-page title has 64px side reserves, close at left 16px; sheet title retains centered 40px header and separate right close area. Inspected original `maugo-sim-pass.png`. | Simulator **PASS**: Filter Pass page title fully visible and centered, close x at top-left separated from title (maugo-simfix-pass.png). |
| N4 | Successful email login now emits authenticated immediately after server success, entering home directly instead of stopping at session CTA. No success timer or extra click required. Auth CTA background also repaired. | Simulator **PASS**: both login rounds auto-advanced straight to home within 3s, no session CTA page; Sign in button bright green and tappable. |
| O1 | Auth primary buttons referenced undefined `--grad-primary-height-48`, producing transparent background and dark text over the hat. Use defined Figma gradient `--grad-primary` (#BDFF81 → #B0FB61) with existing dark ink. Preserve Figma email button position (canvas x24/y547, 327×48). Applies to EN and KO. | Simulator **PASS**: EN welcome - Continue with email green pill, text fully readable, clear of the hat (maugo-simfix-welcome1.png); KO - 이메일로 계속하기 same (maugo-simfix-welcome-ko.png). |
| N6 | Haptics checkbox renders checked only when capability is available AND preference is enabled. Existing disabled binding remains; unavailable devices now display OFF and disabled even with saved/default ON preference. | Simulator **PASS**: Settings > General - Haptics label greyed, switch OFF + disabled, "Haptic feedback is unavailable on this device." (maugo-simfix-general2.png). |
| N5 | Investigation only; see below. No capsule behavior edits. | Investigation complete; disappearance cause **pending** server evidence. |
| Collect | Client idempotency path reviewed; see below. No code change needed. | Simulator **PASS**: inbox Collect replies (badge 2) -> "One reply collected." toast; free today 10->9, badge 2->1, no Load failed (maugo-simfix-collect1.png). POST reached backend; CORS Idempotency-Key fix holds. |

## References checked

Read `~/task-sim-fixes.md`, `~/maugo-figma/FIGMA.md` and relevant welcome/pass-sheet nodes in `maugo-file-full.json`. Read embedded implementation from `~/maugo-design/MauGo.html` (welcome actions/flow). Figma welcome email button is x24/y547, width327/height48; Pass sheet has centered title and separate 44px close area. The supplied Pass screenshot confirms title at left with close over the letters. No claim of rendered Figma parity without browser/simulator verification.

## N5 investigation (no behavior change)

`HomeFlow.vue` starts responses as an empty ref and fills it from server `data.responses` returned by authenticated GET `/letters?...` (or POST `/letters/refresh`). Rendering uses each response's `openingMessageId`. Successful `openLetter` locally removes the matching capsule; the next load takes server state again. Errors leave the initial array empty.

F07 `App.vue.clearDevice()` clears sessionStorage and localStorage preferences/drafts (preserving language and per-account locks). Responses are not sourced from that storage, so F07 does not directly explain their disappearance and there is no basis to declare disappearance intended under F07. Clearing preferences can change discovery filters on the next request, and remounting home starts empty until load completes. Whether the server response is empty due to read state, filters, or a request error needs the actual before/after `/letters` payloads and status. Backend inspection/changes intentionally excluded. Product decision remains pending; do not persist or synthesize capsules without it.

## Collect client path

`InboxFlow.prepare()` generates `crypto.randomUUID()` when selecting a new receipt and retains it for that receipt through confirmation/retry. `collect()` POSTs `/conversations/{conversationId}/replies/{id}/collect` with `Idempotency-Key: key.value` and `{confirmPaid: cost > 0}`. Its request helper spreads extra headers into fetch options; `lib/api.ts` forwards those options unchanged. Thus the client still sends the key. On collected response it removes the receipt, updates the UI, and reloads data. Server CORS fix is supplied context, not independently verified here.

Supervising agent still needs to verify actual POST status, wallet/freeRemaining change and absence of Load failed on simulator. No preflight/POST/backend logs were collected in this sandbox, so no end-to-end pass is claimed.

## Simulator verification (supervising agent, 2026-11-15 ~17:47-18:23 CST)

Device: MauGo iPhone (iPhone 17, iOS 27.2, UDID 7C5AD388-00DB-4F7D-B514-3C32AA264F7E). App built from this branch (`client` build PASS, bundle index-DkdJ5p6u.js with 8082 API URL; `xcodebuild` BUILD SUCCEEDED; installed + launched via simctl; idb for taps/input, simctl screenshots). Screenshots on the Mac: `~/maugo-simfix-*.png`.

- Environment note (not a code regression): the first launch from a fresh main-repo checkout showed persistent "Load failed" on home. Backend, wrapper preflight (Idempotency-Key present), stored token, and simulator network were all verified healthy one by one. Root cause: main-repo `client/ios/App/App/Info.plist` has no `NSAppTransportSecurity` / `NSAllowsArbitraryLoads`; the flag exists only in the `~/worktrees/ios-shell` copy (uncommitted, demo-only). An ATS exception was added to the main-repo working-tree Info.plist only to unblock this verification; it is NOT part of this branch and MUST NOT be committed. A fresh build from the main repo will hit "Load failed" until the shell packaging is reconciled (demo-only workaround; remove before submission).
- N1: wallet sheet opened from home Diamonds, screenshot at +3s and +13s — still open, balance 200, 4 packs Unavailable. PASS.
- N2: Filter Pass page — title fully visible and centered, close x at top-left, separated. PASS.
- N3/O2: two full logout -> email-login cycles; home and profile positions normal both times, Everyone capsule clear, no 1.232x zoom/shift. PASS.
- N4: both login rounds auto-advanced straight to home within 3s; no session CTA page; Sign in button bright green and tappable. PASS.
- O1: welcome EN + KO — email button is a full green pill, text readable, clear of the hat. PASS.
- N6: Settings > General — Haptics label greyed, switch OFF + disabled, "Haptic feedback is unavailable on this device." PASS.
- Collect: inbox "Collect replies" (badge 2) -> "One reply collected." toast; free today 10 -> 9, badge 2 -> 1; Reader row gained unread badge 1; no "Load failed". The Idempotency-Key POST reached the backend — the CORS fix holds end-to-end. PASS.
- N5: no new server evidence collected in this session (no before/after /letters payloads captured); investigation conclusion unchanged — product decision pending.
- Login input incident (test artifact, not an app bug): the first login attempts failed with "Invalid email or password" because the simulator keyboard was in Chinese Pinyin mode and `idb ui text` typed the password through pinyin composition (suggestion bar showed a composed form, the field displayed "MauGo2026!" but the submitted value differed; clearing left a stray "M"). curl login with the same credentials returned 200 throughout and the backend stayed healthy. Fixed by switching the keyboard to English via the globe key and retyping. Future simulator logins: switch the keyboard to English first.
- Playwright: fast-list run (`full-regression-run.py --fast`, 18 steps) finished ~18:47; see Playwright fast-list section below.

## Execution summary

- N1 PASS, N2 PASS, N3 PASS, N4 PASS, O1 PASS, N6 PASS (all simulator-verified, screenshots listed above).
- N5 investigation only — cause pending server evidence; product decision pending.
- Collect end-to-end PASS (free 10 -> 9, one reply collected, no Load failed).
- Playwright fast-list: build + smoke PASS, backend 57/1 (known), Playwright 23 expected / 46 unexpected — all 46 are the N4 session-CTA removal (login helpers + r15-audit signin-session state need a follow-up test migration; not done in this batch).

## Playwright fast-list (supervising agent, 2026-11-15 ~18:22-18:47 CST)

Ran `client/docs/ui-redo/full-regression/full-regression-run.py --fast` (18 steps) on the Mac against this branch. Build PASS (exit 0), smoke PASS (HTTP 200 + bundle ref). Backend vitest 57 pass / 1 fail — the known pre-existing auth login rate-limit assertion (401 vs 429), identical to the R25 baseline and the 17:03 fast run; no new backend failure.

Playwright: 23 expected / 46 unexpected / 0 skipped. Passing suites: default-client (2), f06 (1), shell-fix (8). All 46 unexpected share one cause — the N4 fix, by design:

- 18 failures wait for `getByRole('button', { name: 'Meet your letters' })` after Sign in (chat-media 1, chat-voice 3, d9 1, d9-storekit 6, f07 2, ui-polish 3, ui-redo 1, d7 1).
- 24 failures wait for `.flow-content > .ui-button` after the sign-in click — the same session CTA by selector (r12-audit 4, r13-audit 4, r20-fixes 16).
- 4 failures are r15-audit expecting `data-auth-mode="session"` after a successful mocked login (line 63: `mode('session')`, snap `signin-session`, click `Meet your letters`). With N4, login emits `authenticated` immediately and the app goes home — the session stop no longer occurs in the email-login flow, so the state the audit asserts no longer exists there.

No failure is in the fixed features themselves (wallet, Pass header, auth input size, Haptics, collect) — every failing test dies at the removed login CTA before reaching the feature under test. The `Meet your letters` click is the shared login-helper pattern in ~39 spec files under `client/tests/`, and r15-audit lists `signin-session` as one of its audited states, so the migration is not a blind sed: the helpers need the click removed and r15-audit's session-state section needs a product decision (the state is gone from the email-login flow). Follow-up task recommended; deliberately NOT done inside this batch.

Per-suite (fast list): build 0; default-chat-media 0/1; default-chat-voice 0/3; default-client 2/0; d9 0/1; d9-storekit 0/6; f06 1/0; f07 0/2; r12-audit 0/4; r13-audit 0/4; r15-audit 0/4; r20-fixes 8/16; shell-fix 8/0; ui-polish 0/3; ui-redo 3/1; d7 1/1; backend 57/1 (known); smoke 0. Full rows: `client/docs/ui-redo/full-regression/regression-fast.json` (this run overwrote the 17:03 file).
