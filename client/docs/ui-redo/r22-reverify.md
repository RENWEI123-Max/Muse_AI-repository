# R22 补验（r22-icon-fix）：d7 重跑 + 13 个账号安全态 + R21 3 个隐私态

执行日期：2026-11-15 ~05:00，Mac mini。分支 `codex/r22-icon-fix`（提交 877eca4，基线 R23 5c9467c）。不合入 main。

## 背景

- d7.spec.ts 首次实测（~04:47）发现 R22 引入的真实产品 bug：`AccountSecurity.vue:82` 页头返回按钮用了素材 manifest 里不存在的 `08-interface-icons/icon-back-light-22`，`lib/assets.ts` 找不到就 throw，AccountSecurity 一渲染就抛错、整个 section 挂载失败，`#account-signin` 永不出现。任何已登录用户打开账号安全页都会撞上。
- 修复（877eca4，一行）：图标换成其他页头都在用的 `icon-chevron-left-light-22`。构建通过（bundle index-B5ug4wW7.js），已推送。
- 测试数据库已就绪（PostgreSQL 16.16，`maugo/.env` 有 DATABASE_URL）。本次补验不改任何产品代码与测试代码。

## d7.spec.ts 重跑结果：通过 1/1

| 轮次 | 结果 | 说明 |
|---|---|---|
| 第 1 次重跑 | 失败（2.0m 超时） | 全程走到最后一次登录 `login(page,a,'1234')`，等 `#unlock-pin` 等到 120s 测试超时；失败时页面停在首页，带一个 "Internal server error" 提示（首页信件加载 500，见下文 harness 问题）。聚焦复现（/tmp/d7-repro.mjs，A 设 PIN → 退出 → B 登录退出 → 再登 A）证明重登录后解锁弹层正常出现（`unlockPin: 1, visible: true`，锁 key 仍在），机制本身没问题。 |
| 第 2 次重跑 | **通过 1/1（16.1s）** | `D7 thirteen states, real logout/deletion and account isolation` 全过。第一次失败未能复现，判定为冷启动偶发（首轮 vite/dev 与后端启动时序），如实记录，不掩盖。 |

d7 通过证明：AccountSecurity 正常挂载；13 态流程、真实退出/删除、账号隔离全部按 spec 断言走通；会话链路（真实注册/登录/token）在测试库上端到端可用。

## 16 态走查表（全部 375×812 真实截图，英文）

### R22 账号安全 13 态（d7.spec.ts 通过即走查证据；截图为 04:57 通过轮次新拍，存本目录）

| 态 | 截图 | 结果 | spec 断言 |
|---|---|---|---|
| security | d7-security.png | 可达可操作 | `#account-signin` 可见（此前因图标 bug 永不出现） |
| account-info | d7-account-info.png | 可达可操作 | `#account-email` 与登录账号一致 |
| verification | d7-verification.png | 可达可操作 | 显示 "Not connected" |
| pin-create | d7-pin-create.png | 可达可操作 | 点 App lock 打开 PIN sheet |
| pin-invalid | d7-pin-invalid.png | 可达可操作 | 填 12 → "Enter a 4-digit PIN." |
| pin-locked | d7-pin-locked.png | 可达可操作 | Lock now 后锁屏出现 |
| pin-wrong | d7-pin-wrong.png | 可达可操作 | 填 0000 → "Incorrect PIN." |
| signout-confirm | d7-signout-confirm.png | 可达可操作 | 点 Sign out 弹出确认；Cancel 回到安全页 |
| signed-out | d7-signed-out.png | 可达可操作 | 确认退出后回欢迎页；旧 token 调 export 返回 401 |
| delete-disabled | d7-delete-disabled.png | 可达可操作 | 未输 DELETE、未勾选时删除按钮禁用 |
| delete-typed | d7-delete-typed.png | 可达可操作 | 只输 DELETE 仍禁用 |
| delete-ready | d7-delete-ready.png | 可达可操作 | 输 DELETE + 勾选后按钮启用 |
| delete-final | d7-delete-final.png | 可达可操作 | 点删除后弹确认密码框，按钮禁用；输错密码报错、Cancel 回到可删态；输正确密码后账号删除、旧 token 401、B 账号数据不受影响 |

另附 d7-account-isolation.png（B 账号登录后 App lock 为 Off、无 A 的邮箱与记录）与 d7-deleted-welcome.png（删除后回欢迎页）。

### R21 隐私 3 态（单独走查，见 /tmp/privacy-walk.log；截图存本目录）

R21 时这 3 态因无测试数据库（ECONNREFUSED）无法走查。本次用全量迁移的 auth 后端（3001，21 个迁移）走查——d7 后端只应用 002–015，`/profiles/me` 在该环境返 500，隐私页打不开（见"遗留问题"）。

| 态 | 截图 | 结果 |
|---|---|---|
| privacy | privacy.png | 可达：隐私页正常加载，"Profile visibility — Everyone"，无加载失败；0 控制台错误、0 页面错误、0 失败请求 |
| privacy-visibility | privacy-visibility.png | 可达可操作：点 Profile visibility 打开底部 sheet，Everyone ✓ / Friends / Only me 三项齐全 |
| privacy-only-me | privacy-only-me.png | 可达可操作：选 Only me → Save → 提示 "Visibility saved on the server."，行显示 "Only me"；API 复核 `GET /profiles/me` 200，`visibility=only_me` |

注意：种子账号无形象照（cards 为空），页内显示 "No server image cards yet."；单卡可见范围分支（profile-visibility）未走查——无卡可点，非失败。

## 与 Figma/原型的差异（未重新测量，沿用 R22-result.md）

- 本次补验只验证"挂载/可达/可操作 + 会话链路"，不重做逐元素几何与计算样式对照。R22-result.md 的 8 项差异（security 缺 Password recovery、多 Lock now/Sign out；原型预览账号 vs 产品服务器账号；signout-confirm 文案与 F07 冲突——已按 F07 定；delete-final 挑战 token+密码；PIN 行内 alert vs 原型 toast；PIN sheet 缺右上关闭；部分颜色/字体；全仓 hex 114）维持原结论，未变。
- 隐私 3 态：与原型一致的是底部 sheet 点选、保存后行内即时显示；与原型不同的是产品走 Save 按钮 + 服务端 PATCH（原型点选立即保存），属 R21 已上报的流程冲突，未改。

## 遗留问题（未修，如实记录）

1. **d7 harness 迁移清单过时**：`tests/d7-server.mjs` 只应用 002–015，跳过 017（visibility）、019（profile_visits）、021（zodiac）。后果：d7 测试环境里 `/profiles/me` 与 `/letters` 返 500（首页出现 "Internal server error" 提示）。d7 本身不依赖这两个接口，所以能过；但 harness 应补到全部 21 个（d6 与 auth-server 已是全量）。本次按任务要求未改测试代码。
2. **第 1 次 d7 重跑偶发失败**（见上表）：未能复现，判定冷启动偶发；如再出现需查 vite/dev 与后端启动时序。
3. `client/docs/ui-redo/r21/preview.log` 是 R21/R23 期间 vite 开发/预览服务的生成日志（10KB），无害，未提交、未删。
4. R23 的 feedback-history 未实现、terms-full 节点号（25:19082 vs 实际 29:19082）、法律文案评审草稿等待定项与本次无关，维持原状。

## 清理

- d7 重跑与隐私走查的测试服务器/开发服务器均已停；本次产生的测试库（d7、c2 各 1 个）均已删；Postgres 仍在跑。
- 诊断与日志留在 Mac /tmp/：`/tmp/d7-rerun.log`、`/tmp/d7-rerun2.log`（通过轮次）、`/tmp/d7-repro.mjs`、`/tmp/d7-repro.log`、`/tmp/privacy-walk.mjs`、`/tmp/privacy-walk.log`。
- 仓库改动：仅本分支的图标修复（877eca4）+ 本文档与截图；`client/docs/d7-*.png` 为 d7 通过轮次新拍的 spec 自带截图，随本次提交更新。
