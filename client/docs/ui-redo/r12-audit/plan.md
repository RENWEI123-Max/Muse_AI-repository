# R12 audit implementation plan

Spec: /Users/anna/task-r12-audit.md. Execute locally in the user-specified repository and branch.

- [x] Read local prototype first, eight state steps, local Figma, baseline R12 and R11 results; extract source before editing.
- [x] Reproduce navigation, remark cancellation and short-screen scrolling with independent API fixtures and UI login. Do not write auth storage.
- [x] Fix only R12 navigation/draft presentation/scroll gaps in ChatFlow.vue and its R12 CSS. Keep static geometry/colors, server protocols and permission rules unchanged.
- [x] Walk seven safe states in EN/KO at 375x667 and 375x812; preserve screenshots, failure/cancel steps, computed motion and inner scrolling evidence. Never click clear confirmation or submit report; reject destructive requests in fixtures.
- [x] Build with specified environment, scan whole changed source files and added lines, write honest four-verdict report, inspect diff, commit and push.

Review focus: waiting permissions remain server/business boundary; search errors must not be mistaken for successful empty results; cancelled remark draft must not appear saved; report Back must preserve details origin; cleared and real backend regression remain unexecuted/pending Smith.
