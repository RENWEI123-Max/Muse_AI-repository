# 测试迁移结果

基线：origin/main `aeff571`；分支：`codex/test-migration`。

已完成测试迁移与快表验证：55 个 spec 文件 + 本结果文档。快表 18 步已由主 agent 在本分支实跑（2026-11-15 19:04-19:14 CST，约 10 分钟），FAST_EXIT 0：Playwright 15 套件 69/69（0 unexpected），后端 57/1 已知失败（auth 登录限流 401 不等于 429，maugo/test/auth.test.ts:106），构建 exit 0，smoke HTTP 200。提交与推送见本文档末尾。

## 验收表

| 任务 | 本次处理 | 验证 |
| --- | --- | --- |
| 1：登录 helper / CTA 迁移 | 删除英文、韩文 CTA 及 audit 同一 CTA 的通用选择器点击；保留登录及后续操作，沿用首页检查或补充 `.home-flow` 可见断言 | 通过：快表 Playwright 69/69，46 个旧失败清零，无新增失败 |
| 2：r15 signin-session 改写 | 改为首页断言与 signin-home 快照；记录验收状态变更，详见下表 | 通过：tests_r15-audit.config.ts 4/4（原 4 个 line 63 断言失败清零） |
| 3：只改测试，不改产品代码 | 本次仅修改 client/tests/ 与本结果文档；设计参考、Info.plist 及产品代码未改 | 通过：git diff 仅 55 个 client/tests/ 文件 + 本文档；page-states.json、Info.plist、产品代码无改动 |
| 4：快表 18 步、构建与 smoke | 快表实跑 18 步约 10 分钟，FAST_EXIT 0；Playwright 69/69，后端 57/1 已知失败，构建 exit 0，smoke HTTP 200 | 通过，详见“快表实测数字” |
| 5：结果文档、提交推送 | 本文档已按实测数字更新；提交哈希见末尾 | 见末尾提交记录 |

## r15 改动清单与验收状态变更

以下行号以 HEAD 修改前和当前工作区为准。

| 文件 | 原行 → 新行 | 原内容 | 新内容 |
| --- | --- | --- | --- |
| `r15-audit.spec.ts` | 31 → 31 | `states` 中 `'signin-session':'session'` | 删除旧状态映射 |
| `r15-audit.spec.ts` | 33 → 33 | `titles` 中 `session:'Welcome to MauGo'` | 删除不再使用的旧标题映射 |
| `r15-audit.spec.ts` | 34 → 34–36 | 固定断言 `.auth-screen h1` | `signin-home` 选择 `.home-flow` 并断言可见；其他快照保留原 auth 标题断言 |
| `r15-audit.spec.ts` | 39 → 41 | 固定从 `.auth-screen` 采集，缺省 `mode: welcome` | 从当前 `screen` 采集；首页记录 `mode: home`，其他 auth 采集逻辑不变 |
| `r15-audit.spec.ts` | 63 → 65 | `await mode('session')` | `await expect(page.locator('.home-flow')).toBeVisible()` |
| `r15-audit.spec.ts` | 63 → 65 | `await snap('signin-session')` | `await snap('signin-home')` |
| `r15-audit.spec.ts` | 63 → 65 | `await click('Meet your letters')` | 删除，保留后续 `#open-inbox` 可见断言及 `r06-boundary` 截图 |
| `r15-auth.spec.ts` | 59–60 → 59 | `You are signed in.` 文案断言及 CTA 点击 | 删除已消失中间页的文案断言与点击，保留 `.home-flow` 可见断言 |

原 `signin-session` 状态去向：该中间态随 N4 修复已不存在，邮箱登录后直接进首页。本次将 189 态验收清单中的该项改为 `signin-home`，覆盖 667/812 高度与 en/ko 的四个组合；没有声称完成 189 态验收。

首页没有可用于该处断言的 `data-auth-mode`：它属于 `.auth-flow`，首页为 `.home-flow`。因此删除该处 `mode('session')` 断言，以首页可见性断言替代。walkthrough 中的 `mode: home` 是采集器对首页的记录标签，不是产品 DOM 的 `data-auth-mode`。

快照文件由原 `{height}-{lang}-signin-session.png` 改为 `{height}-{lang}-signin-home.png`。验证重跑已实际生成 4 张新 signin-home 截图并重写 walkthrough JSON（`667-en-walkthrough.json` 现以 `signin-home` 结尾，mode 记为 `home`，completed 为 True）；这些是测试运行产物，提交前已全部 revert，不随分支提交，测试每次运行会重新生成。旧 signin-session 截图仍留在仓库，未动。

与设计参考的差异：`client/docs/design-reference/page-states.json` 未改，仍含旧 session 状态。该差异与验收清单的最终取舍由主 agent 定。

## 其他必要迁移说明

- `d6.spec.ts` 同时删除英文与韩文正则 CTA 点击。
- `d6-recommendation.spec.ts` 将原有 `/letters` 响应监听移到提交登录之前，以配合登录立即触发首页请求；监听条件、响应检查及后续逻辑保留。这是避免删除 CTA 后漏接响应的时序调整。
- `d7.spec.ts` 保留原 PIN 解锁步骤及后续 `open-profile` 等导航，删除 CTA 点击，不在解锁前强加首页可见断言。
- 其余保留登录、已有首页断言和后续导航；缺少直接首页检查的入口补充 `.home-flow` 可见断言。

## 静态自查

- `rg -n 'Meet your letters|편지 만나기' client/tests`：无匹配（退出码 1）。
- `rg -n 'flow-content\s*>\s*\.ui-button' client/tests`：无匹配（退出码 1）；没有非登录用途残留需要列出。
- `rg -n "signin-session|mode\('session'\)" client/tests`：无匹配（退出码 1）。
- r15 快照采集器仍有 `.flow-content,.ui-button,.back` 联合选择器，用于读取 motion 样式，不是 CTA 点击，不是 `.flow-content > .ui-button` 残留。
- `git diff --check`：无输出；`git diff --stat` 与修改路径检查：已跟踪改动仅 55 个 `client/tests/` 文件；本文档为新增未跟踪文件，另用 `git diff --no-index --stat /dev/null client/docs/ui-redo/test-migration-result.md` 确认。
- 提交前清理：快表验证与一次全目录 r15 重跑共再生约 660 个已跟踪证据产物（截图 PNG、walkthrough JSON、r04-compare 文件），已用 `git checkout` 全部 revert，新生成的 4 张 signin-home 截图已删除；本次提交仅 55 个 `client/tests/` 文件 + 本文档。
- 开工时已存在未跟踪目录 `client/docs/ui-redo/full-regression/` 与 `client/ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/`；未修改、清理或纳入本次文件列表。
- `git log --oneline origin/main..HEAD` 无输出，当前分支无新增提交；`ps aux` 被沙箱拒绝（operation not permitted），未能核实是否有同任务进程，未另起 codex、测试或构建进程。

## 快表实测数字（2026-11-15 19:04-19:14 CST，约 10 分钟，FAST_EXIT 0）

18 步全部完成。Playwright 15 套件合计 expected 69 / unexpected 0 / flaky 0；后端 57 pass / 1 fail（已知失败）；构建 exit 0（含 verify-assets）；smoke HTTP 200 且 bundle 引用存在。原始记录：`client/docs/ui-redo/full-regression/regression-fast.json`（本地运行产物，未入版本库）及各套件 `.log`。

| 快表套件 | 通过 / 失败 |
| --- | --- |
| build（npm run build，含 verify-assets） | exit 0 |
| default-chat-media.spec.ts | 1 / 0 |
| default-chat-voice.spec.ts | 3 / 0 |
| default-client.spec.ts | 2 / 0 |
| tests_d9.config.ts | 1 / 0 |
| tests_d9-storekit.config.ts | 6 / 0 |
| tests_f06.config.ts | 1 / 0 |
| tests_f07.config.ts | 2 / 0 |
| tests_r12-audit.config.ts | 4 / 0 |
| tests_r13-audit.config.ts | 4 / 0 |
| tests_r15-audit.config.ts | 4 / 0 |
| tests_r20-fixes.config.ts | 24 / 0 |
| tests_shell-fix.config.ts | 8 / 0 |
| tests_ui-polish.config.ts | 3 / 0 |
| tests_ui-redo.config.ts | 4 / 0 |
| tests_d7.config.ts | 2 / 0 |
| backend（npm test） | 57 pass / 1 fail（已知：auth 登录限流 401 不等于 429，maugo/test/auth.test.ts:106，与 R25 基线及快表首轮相同） |
| smoke（vite preview） | HTTP 200，bundle 引用存在 |

合计：Playwright 69 expected / 0 unexpected。快表第二轮的 46 个失败全部清零（18 个 Meet your letters 超时、24 个 `.flow-content > .ui-button`、4 个 r15-audit line 63 断言），无新增失败。

## 改动文件列表

共 55 个测试文件 + 1 个结果文档（`client/docs/ui-redo/test-migration-result.md`）：

c7-acceptance.spec.ts、chat-media.spec.ts、chat-voice.spec.ts、chat.spec.ts、d1.spec.ts、d11.spec.ts、d2.spec.ts、d3.spec.ts、d4-reverify.spec.ts、d4.spec.ts、d6-feedback.spec.ts、d6-followup.spec.ts、d6-recommendation.spec.ts、d6.spec.ts、d7.spec.ts、d8.spec.ts、d9-storekit.spec.ts、d9.spec.ts、f01-ui.spec.ts、f01.spec.ts、f07.spec.ts、home.spec.ts、inbox.spec.ts、ko-help.spec.ts、letters.spec.ts、pass-confirmation.spec.ts、r05-shell.spec.ts、r06-audit.spec.ts、r06-discover.spec.ts、r07-filter.spec.ts、r08-audit.spec.ts、r09-audit.spec.ts、r09-inbox.spec.ts、r10-audit.spec.ts、r11-audit.spec.ts、r11-chat.spec.ts、r12-audit.spec.ts、r12-chat-details.spec.ts、r12-safe-chat.spec.ts、r13-audit.spec.ts、r14-audit.spec.ts、r15-audit.spec.ts、r15-auth.spec.ts、r16-audit.spec.ts、r17-audit.spec.ts、r18-audit.spec.ts、r19-audit.spec.ts、r20-audit.spec.ts、r20-fixes-avatar.spec.ts、r20-fixes-moments.spec.ts、r20-fixes-navigation.spec.ts、r20-fixes.spec.ts、report-attachment.spec.ts、ui-polish.spec.ts、ui-redo.spec.ts（均在 client/tests/ 下）

## 提交记录

分支 `codex/test-migration`，提交哈希：ea02f5e209006ad84cd7c6bbaad0fd26e5e23f57。
