# R20 fixes implementation plan

Goal: apply the authorized client fixes from baseline 06d02b3, with truthful fixture evidence.
Architecture: reuse existing tokens and API contracts; shared toast presentation and image preparation, minimal component state changes.
Tech stack: Vue 3, TypeScript, Vite, Playwright.
Spec: user R20 batch, Smith 2026-11-14 22:50.

- [x] Check duplicate process, branch and baseline; current run is PID 69173 in tmux r20-fixes.
- [x] Read prototype source and audit gaps. Avatar prototype crops at JPEG .85; card prototype scales to 1600 and JPEG .88. Apply shared preprocessing before avatar crop, retain crop .85.
- [x] Add failing fixture assertions for toast expiry, image limit, cancellation, focus, and error reset.
- [x] Fix ProfileFlow/MomentsFlow state and i18n, preserving Escape/Retry.
- [x] Fix HomeFlow/LettersFlow/InboxFlow/ChatFlow client routes and free collection.
- [x] Check remaining R06–R16 gaps against available API contracts; document exclusions.
- [x] Build, run real-click fixtures at 375×667/812 EN/KO, inspect PNGs; audit A5 and diff.
- [x] Record item conclusions, screenshots, bundle hash and uncompleted list.

Delivery: commit/push and verify remote SHA; the delivery git result is authoritative.

Review focus: 503 followed by reopen; upload cancellation; oversized/undecodable images; nested modal Escape/focus; free allowance changing on server.
