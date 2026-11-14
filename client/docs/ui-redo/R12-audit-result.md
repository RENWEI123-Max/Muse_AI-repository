# R12 chat-details follow-up audit

Baseline `codex/r11-audit` at `9a2bfaa`; branch `codex/r12-audit`; Mac mini, repository `/Users/anna/Muse_AI-repository`. Only this local audit ran; process check found the current Codex invocation, and no pre-existing R12 audit branch. No sg-claude execution, Figma API/token, Issue, Telegram, or main merge.

## Executive summary

- Branch: `codex/r12-audit`.
- Build: passed, exit 0. JavaScript bundle: `index-BDkLDSTj.js`; SHA256 `117ea19f1d15e98614494c12028163066db4921adea468b933c26dc1b9de6719`.
- Screenshots: 68 real PNGs; 34 at 375×667 and 34 at 375×812. Each height has 17 EN and 17 KO images. Seven safe R12 states × two languages × two heights = 28 state screenshots; 40 additional walkthrough screenshots. `chat-cleared`: **not executed / pending Smith**, no screenshot.
- Static: **not passed / pending Smith**.
- Flow: **not passed / pending Smith**.
- Motion: **not passed / pending Smith**.
- Scrolling-and-copy: **not passed / pending Smith**.
- Fixture walkthrough: 4/4 groups passed, Playwright exit 0. Original database regression: **NOT executed**; Mac has no test database (`Test database connection unavailable`). No test/database configuration was changed to fake a pass.

## Prototype excerpts, read before implementation

Sources: local `/Users/anna/maugo-design/MauGo.html`, repository `page-states.json`, local `/Users/anna/maugo-figma/maugo-file-full.json`, baseline R12 and R11 audit reports. [Reference hashes](r12-audit/references.json), [verbatim functions/styles](r12-audit/prototype-excerpts.md), [eight operation scripts](r12-audit/state-script.json), [eight Figma frames](r12-audit/local-figma-frames.json). The atlas embeds an HTML/CSS/script bundle; extracted and read locally without running its destructive demo actions. Each Figma frame is 375×812; frame solid fill RGBA is approximately (0.0509804, 0.0901961, 0.0745098, 1). Size/color authority remains Figma; flow/motion/copy authority remains prototype; conflicts are listed below rather than silently resolved.

| State | Click/type → destination → return/cancel |
|---|---|
| details `29:10251` | Inbox unlocked row → chat → ••• → details. Profile photo → public-profile → Back to details. Back from details → originating chat → inbox. Groups: remark, pin, background, bubbles, search; mute, block, report, clear. |
| details-waiting `29:10389` | Inbox waiting-only row → waiting chat → ••• → waiting details → Back to same waiting chat. Prototype disables remark/pin/background/bubbles/search/mute/follow via `rules.canContinue`; sent-letter waiting additionally suppresses photo profile action and disables block/report. Clear confirmation remains available. |
| remark `29:10524` | details `#remark-name` → `showSheet`; type into `#remark-input`; `#save-remark` → trim, persist, close, redraw details. Close/back/Escape → close without applying. Prototype maxlength 24. |
| search-empty `29:10678` | details `#chat-search` → `chatSearch`, blank query/results → Back to details. |
| search-result `29:10758` | type `listening` into `#message-search` → matching message cards. Click result → chat with `messageId`; `drawMessages` centers target and outlines bubble. Prototype history then returns to search. |
| search-none `29:10845` | type `unmatched-query` → `No messages found.` → replace query or Back to details. |
| clear-confirm `29:10933` | details `#clear-chat` → `confirm('Clear messages?',...)`. Cancel/backdrop/Escape closes to details. Prototype copy: “This removes messages from this conversation on this device.” Confirm would mutate demo messages; **not executed**. |
| cleared `29:11085` | State script uses chat-cleared seed; destructive confirmation also clears prototype data. **not executed / pending Smith**, no seed substitution, image or clearance claim. |

Functions read: `chatDetails`, `chatSearch`, `drawMessages`, `page`, `open`, `back`, `confirm`, `showSheet`, `closeSheet`, `showPaymentDialog`; report routes through `showSafetyMenu`, block through confirmation. Prototype local `persist`, toggle state and client-side search are demonstration business rules and were not ported into production.

Scroll/effects: outer body/screen fixed with overflow hidden; `.page-body` inner overflow auto and overscroll containment; sheet max-height/overflow auto; payment dialog max-height/overflow auto. Details has no dedicated page entrance. Remark sheet uses `sheet-in` 300ms ease-out, opacity plus translateY(30px) to rest. Confirmation dialog uses the same keyframes at 220ms ease-out. Toggle background/thumb transition 200ms. Result highlight is a static outline, not a timed animation. Shared close/focus restoration and overlay dismissal are also part of the prototype flow; toast is 2700ms with 200ms transition, not a persistent inline error. No additional R12-specific page animation was found.

## Implementation and verified boundaries

Production edits are only `ChatFlow.vue` and R12 rules in `styles/pages/chat.css`:

- Remark row reads the saved conversation remark, not the edit draft. Opening remark copies the saved value into the input; cancel/reopen no longer presents an unsaved name as saved. Existing PATCH payload, save semantics, maxlength and server authority are unchanged.
- Search and report Back return to originating details. Entering search starts with a blank query; screen changes to details/search clear the previous view error. Details Back still returns to the originating chat.
- Remark-save failure now appears inside its sheet, above Save, rather than behind the dimmed scrim. Entered text remains for retry. This changes the failure presentation only.
- Removed the duplicate short-screen bottom compensation on R12, and added overscroll containment to settings/results. At 375×667, settings viewport height increases from observed 382 to 527, with bottom 639 rather than 494. At 375×812 it remains 672 high with bottom 784. Existing normal-state positions/colors and R11 CSS are unchanged.
- Reused shell `sheet-in` 300/220ms; no animation duplication or static restyling. No changes to App.vue, token/account storage, server, payment, login/session, appearance persistence, report submission or clear-history implementation.

Read-only independent diff review found no critical or important introduced regression. Review did not run tests. Its limits are retained: recorded animation/clipping properties are observations, not assertions of complete visual/motion compliance; settled screenshots do not prove animation smoothness.

## Four acceptance items

| Item | Verdict | Actual evidence and limits |
|---|---|---|
| Static | **not passed / pending Smith** | Existing static references in [R12-result](R12-result.md) retained; no new pixel-diff or all-element geometry claim. Required build exit 0. Whole changed production/test source scan: ChatFlow has 10 baseline R13 appearance hex literals, all unchanged; other changed source files have 0. All have 0 important directives and 0 device-prefix selectors. Added production lines have 0/0/0. Strict whole-file hex-zero requirement is therefore unmet; no unrelated appearance refactor to manufacture compliance. |
| Flow | **not passed / pending Smith** | 4 fixture groups verify waiting/unlocked entry and Back, remark cancel/reopen, PATCH 503/retry, fresh search, query matches/no matches, search Back, clear confirmation cancel and close, block cancel, report choice/form/Back, profile/Back and inbox return. Follow/pin/mute capability, waiting gates, search-result destination and failure recovery gaps remain. Clear/report submission and real backend verification are not executed. |
| Motion | **not passed / pending Smith** | Computed remark sheet `sheet-in` 0.3s ease-out and clear dialog `sheet-in` 0.22s ease-out match prototype and already existed in shell. No R12 page transition was required or added. Per-control pressed-state/toggle timing, focus restoration, Escape and reduced-motion behavior were not comprehensively exercised; disabled toggles cannot demonstrate 200ms changes. No claim that settled PNGs prove motion smoothness. |
| Scrolling-and-copy | **not passed / pending Smith** | All 68 recorded steps have document height equal to viewport and scrollY 0; real wheel scrolling works in settings/waiting/results at both heights and languages. Visible text horizontal overflow records are empty for sampled fixture copy. Copy conflicts, long names, full backend error localization, native keyboard/focus behavior and cleared state remain pending. DOM overflow scans do not prove absence of all clipping or visual overlap. |

## Motion checklist

| Effect/behavior | Prototype | Product finding |
|---|---|---|
| Shared pressed state | existing control active styles; no single R12-wide duration | Shell styles retained. Not all controls pointer-held/computed; **not passed / pending Smith**. |
| Remark entrance | sheet-in 300ms ease-out, opacity and 30px translation | Computed in all four groups: matching name/duration/easing. Already supplied by shell, no new rule. |
| Clear-confirm entrance | sheet-in 220ms ease-out | Computed in all four groups: matching. Confirmation only; no clear click. |
| Pin/mute | background and thumb 200ms | Product inputs disabled even when unlocked; cannot exercise toggle animation. **not passed / pending Smith**. |
| Details/search page | direct redraw, no named timed entrance | No new page animation added. |
| Search target | navigate to chat, center target, static highlight outline | Product cards remain noninteractive articles without target navigation. **not passed / pending Smith**. |
| Close/focus/Escape | sheet closes and restores previous focus; dialog Escape/backdrop closes | Close/Cancel/Back tested where listed; Escape, backdrop and focus restoration not fully tested. **not passed / pending Smith**. |
| Error notice | local demo toast vs production API error | Remark inline error now visible; no invented toast timer. Error recovery/copy differences remain. **not passed / pending Smith**. |

## Rechecked gaps and conflicts

1. **P1 flow:** unlocked Follow, Pin and Mute remain disabled, confirmed from browser DOM in every group. This is not solved by copying prototype local storage state. Requires authorized business capability work and server verification; pending Smith.
2. **P1 flow:** waiting remark/background/bubbles/profile/block/report remain enabled in current product, confirmed browser properties and source. Prototype waiting-only sent-letter rules differ. The current conversation props do not expose a sent-letter origin flag sufficient to reproduce the exact prototype distinction; no permission logic was changed.
3. **P1 flow:** search result cards are `<article>` elements with no click/keyboard destination handler. Prototype result click opens and highlights the exact message. A result may be outside currently loaded chat rows, so complete behavior needs a message-location/loading contract; no incomplete navigation was added.
4. **P1 failure:** search 503 leaves `Searching…`; global Retry calls normal `load()` rather than retrying that query. Fixture walkthrough captures failure and recovers by changing query; it does **not** claim Retry is correct. Search requests/debounce/API logic unchanged.
5. **P2 copy/flow:** remark input maxlength remains 60 vs prototype 24; original save PATCH does not copy prototype trim/persist semantics. Server validation remains authoritative. Cancel after a failed save can retain the old error on reopening (minor pre-existing lifecycle gap noted by review). Long saved names can intentionally ellipsize in the row; not globally certified untruncated.
6. **P2 copy:** clear warning describes retained connection/unlocked permissions rather than prototype device-local removal. Waiting description, no-results supporting copy, remark placeholder and profile data also differ from demo. Do not replace server-related warnings with potentially misleading demo copy. English/Korean baseline copy was not rewritten in this audit. User-generated English fixture names/messages in KO are intentional content, not translated UI. `Please try again.` fixture uses available dictionary lookup and remains English where no mapping exists; fixture errors are not evidence of complete backend i18n.
7. **P2 verification:** old scoped report 20-hex issue no longer exists; current script-only R13 literals total 10. Old D2/D11 failures were not rerun or declared fixed. Original database regression **NOT executed**; no DB on this Mac, no real backend. Existing Figma export/geometry/token acceptance gaps were not reclassified as passed by this flow audit.
8. R13 background/bubbles remain their existing module; R14 block/report mutation behavior and return after successful submission are unverified. Only their R12 entry/cancel/Back boundaries are evidenced. R11 ••• → R12 → same chat is verified here, but other R11/R08/R09/R10 gaps are not changed or claimed fixed.
9. Cleared state: **not executed / pending Smith**. Report submit: **not executed / pending Smith**. No clear-history/report/block mutation was attempted in the final fixture run; guards abort those request types if reached. No cleared screenshot exists.

## Walkthrough and screenshot inventory

[Fixture test](../../tests/r12-audit.spec.ts), [independent local configuration](../../tests/r12-audit.config.ts), [final log](r12-audit/browser.log). Command: `cd client && npx playwright test --config tests/r12-audit.config.ts`.

UI login protocol: consent check → Continue → email/password typing → Sign in → Meet your letters → Messages → waiting/open row → •••. Only language preference is initialized in storage. No direct token/account writes, Vue-state injection or direct state routing. Every API response is a Playwright fixture; UI authentication exercises the fixture login response, not a real account. The separate fixture configuration does not alter the original database regression configuration.

Each group follows the eight-state operation script for seven safe states, adding actual entry/return/failure/cancel steps: waiting details and inner scroll → Back waiting chat/inbox → unlocked details and inner scroll → remark cancel/reopen → save 503 then retry → blank search → type `listening` → results/scroll → type `unmatched-query` → no results → Back details → fresh search and 503 → change query to recover → clear-confirm Cancel and × → block confirmation Cancel → report choice/form Back → profile Back → chat/inbox. Clear/report final action is never clicked.

Each `${height}-${language}-walkthrough.json` records 17 screenshots, actual data-state, document height/scrollY and visible copy measurements; `${height}-${language}-checks.json` records fixture API calls, forbidden mutations, errors, scroll measurements and computed sheet animation. Final four groups record zero page errors and zero forbidden mutations. [All PNG links](r12-audit/evidence-index.md); [dimensions and SHA256 manifest](r12-audit/screenshots.json). No fabricated reference/export/cleared images.

| Safe state | 375×667 EN | 375×667 KO | 375×812 EN | 375×812 KO |
|---|---|---|---|---|
| details | [PNG](r12-audit/667-en-chat-details.png) | [PNG](r12-audit/667-ko-chat-details.png) | [PNG](r12-audit/812-en-chat-details.png) | [PNG](r12-audit/812-ko-chat-details.png) |
| waiting details | [PNG](r12-audit/667-en-chat-details-waiting.png) | [PNG](r12-audit/667-ko-chat-details-waiting.png) | [PNG](r12-audit/812-en-chat-details-waiting.png) | [PNG](r12-audit/812-ko-chat-details-waiting.png) |
| remark | [PNG](r12-audit/667-en-chat-remark.png) | [PNG](r12-audit/667-ko-chat-remark.png) | [PNG](r12-audit/812-en-chat-remark.png) | [PNG](r12-audit/812-ko-chat-remark.png) |
| search empty | [PNG](r12-audit/667-en-chat-search-empty.png) | [PNG](r12-audit/667-ko-chat-search-empty.png) | [PNG](r12-audit/812-en-chat-search-empty.png) | [PNG](r12-audit/812-ko-chat-search-empty.png) |
| search result | [PNG](r12-audit/667-en-chat-search-result.png) | [PNG](r12-audit/667-ko-chat-search-result.png) | [PNG](r12-audit/812-en-chat-search-result.png) | [PNG](r12-audit/812-ko-chat-search-result.png) |
| search none | [PNG](r12-audit/667-en-chat-search-none.png) | [PNG](r12-audit/667-ko-chat-search-none.png) | [PNG](r12-audit/812-en-chat-search-none.png) | [PNG](r12-audit/812-ko-chat-search-none.png) |
| clear confirm | [PNG](r12-audit/667-en-chat-clear-confirm.png) | [PNG](r12-audit/667-ko-chat-clear-confirm.png) | [PNG](r12-audit/812-en-chat-clear-confirm.png) | [PNG](r12-audit/812-ko-chat-clear-confirm.png) |
| cleared | not executed / pending Smith | not executed / pending Smith | not executed / pending Smith | not executed / pending Smith |

Additional ten screenshots per group: waiting-scrolled, details-scrolled, remark-save-failure, remark-saved, search-scrolled, search-failure, block-boundary, report-choice-boundary, report-form-boundary, report-return. Profile return is asserted without an additional image.

Final scroll measurements (EN and KO identical): 667 settings/waiting/results scrollTop 262/351/1887, viewport heights 527/527/431, bottom 639; 812 scrollTop 117/206/1742, viewport heights 672/672/576, bottom 784. Four groups × 17 recorded steps have document height equal to 667/812 and scrollY 0. Clipping observations are empty for sampled visible text; this is not a universal copy or accessibility pass.

## Verification record and remaining work

[Build log](r12-audit/build.log) exit 0, [bundle hashes](r12-audit/build-bundles.json), [source checks](r12-audit/source-checks.json). CSS bundle `index-CUtlMidP.css`, SHA256 `83293900b8388979a99a01e8b5b3d1f45858621508c988a7b62fd70bf820d136`.

Earlier attempts retained: baseline browser reproduced cancelled draft leakage; attempt-2 reproduced search Back going to chat; attempt-3 single group passed before short-screen/error presentation changes; attempt-4 expanded profile boundary failed because fixture lacked `permissions.canFollow`. Corrected that fixture, with production profile code untouched. Final frozen source four-group run: **4 passed (46.0s), exit 0**. Do not add failed/repeated attempts to a pass count. Initial sandbox localhost startup EPERM required escalated local execution; not a product failure.

No DB regression was started; `Test database connection unavailable` is the established environment limitation, not a newly reproduced error from this run. No real server/storage, real network, native keyboard or device accessibility/motion approval. Overall **not passed / pending Smith**. Commit identity is the commit containing this report on `codex/r12-audit`; branch is pushed without merge.
