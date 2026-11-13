# MauGo · Claude 交接简报

本文件是给新接手写代码的 Claude 的项目全貌说明（任务 #92 整理，基线 main `db82d8d`，2026-11-13）。
内容依据仓库代码与 `maugo/README.md`、`maugo/B11-inbox.md`、`maugo/docs/*`、`client/README.md`、`client/docs/*`。
标注“待核实”的条目在仓库内找不到直接依据，动手前先向 Muse/Smith 确认。

> 开发计划 `MauGo开发计划.md` 及交接包（`/root/MauGo-handover/extracted/MauGo完整项目交接-2026-10-27/`）**不在本仓库内**，
> 位于服务器 sg-claude。本文中 B/C/D/E/F 编号与这些计划一致，但计划原文的具体条目（尤其 D10、E1、E2、E4）待核实。

## 1. 项目简介

- **产品**：MauGo，慢节奏“信使鸟”交友 App。用户收到陌生人开场白（来信）→ 回应 → 发信人“收取”回信后会话解锁聊天。
  每日 10 次免费收取（上海自然日），之后每次 10 钻；钻石通过苹果内购充值；Filter Pass（钻石购买）解锁年龄/城市筛选。
  另有资料与头像、形象照、动态、举报/屏蔽、设置、帮助反馈、账号注销等模块。目标年龄 18+。
- **界面语言**：英文默认，韩文（`client/src/lib/i18n.ts`，`locale: 'en' | 'ko'`）。仓库文档、提交信息、验收记录用中文。
- **技术栈**
  - 后端 `maugo/`：Node.js 22+、TypeScript（ESM）、Fastify 5、PostgreSQL 16（`pg` 连接池）、`jose`（Apple JWS/JWT）、`nodemailer`（SMTP）、`file-type`（媒体内容识别）。测试用 `node:test` + `tsx`。
  - 客户端 `client/`：Vue 3 + Vite 7 + TypeScript（`vue-tsc`），Capacitor 8（iOS/Android 原生工程已生成，占位包名 `com.maugo.app`），Playwright 浏览器测试（视口 375×812）。
- **目录结构**

```
maugo/                     后端
  src/app.ts               buildApp：transaction()/authenticate()/fail()，注册各模块；B1/B3 开场白与发消息路由也在此
  src/server.ts config.ts migrate.ts
  src/auth.ts              B2 注册/登录/验证码/重置密码/Apple/会话
  src/discovery.ts         B4 发现与来信（含 B18 可见性过滤）
  src/wallet.ts            B5 收取回信、钱包、creditWallet
  src/filter-pass.ts       B6
  src/moderation.ts        B7 举报/屏蔽/审核、B13 附件、E3 内容过滤规则
  src/media.ts             B8 上传/下载/发送媒体
  src/privacy.ts           B9 导出与注销
  src/inbox.ts             B11 会话列表/待收/历史/PATCH
  src/payments.ts          B12 苹果内购
  src/profiles.ts          B14/B15/B18/B20/B21 资料
  src/posts.ts             B16/B17 动态与形象照
  src/feedback.ts          B19 反馈
  src/economy.json         商品目录（钻石包、Pass 档位、价格）
  server/migrations/       001–021 SQL 迁移（只新增，不改旧文件）
  test/*.test.ts           真实 PostgreSQL 集成测试
  docs/                    B3 修复、B15/B19/B20/B21 合入、E3 验收记录
client/                    客户端
  src/App.vue main.ts      入口；欢迎/认证 → HomeFlow
  src/components/          AuthFlow HomeFlow LettersFlow InboxFlow ChatFlow ReplyTopup ProfileFlow MomentsFlow SettingsFlow AccountSecurity Avatar PageTransition
  src/lib/api.ts           api()/post()/ApiError，统一请求封装
  src/lib/assets.ts        asset(name)：343 张交接 PNG 的静态 glob
  src/lib/i18n.ts          t()/tr() 英韩翻译
  src/lib/support-content.ts  FAQ、法律文本占位、客服邮箱占位
  tests/                   Playwright 用例 + 每模块测试服务器（*-server.mjs、*.config.ts）
  scripts/verify-assets.mjs  构建前校验 343 PNG 路径/SHA256/尺寸与字体许可
  docs/                    各模块验收记录与截图；pipeline-claude-codex.md 流水线说明
  ios/ android/            Capacitor 原生工程
```

## 2. 架构与关键模块

### 后端约定

- 每个模块导出 `registerXxx(app, transaction, authenticate)`，在 `src/app.ts` 的 `buildApp` 中注册。新增路由沿用这一模式，复用 `transaction` 与 `authenticate`，不要另建封装。
- **认证**：`Authorization: Bearer <token>`。`authenticate` 在事务内按令牌摘要查 `users` / `auth_sessions`，并对用户行加 `FOR NO KEY UPDATE`（用于串行化同一用户的钱包/额度/资料写入；不能改回 `FOR UPDATE`，否则双向并发开场白会死锁，见 `maugo/docs/b3-regression-fix-result.md`）。已注销 401，`is_suspended` 403。
- **错误**：`fail(statusCode, message)` 抛出，响应体 `{ message }`；常用 400 校验 / 401 未认证 / 403 无权或封禁 / 404 / 409 冲突或幂等键改用途 / 410 过期或已注销 / 422 内容过滤命中 / 429 限流 / 402 余额不足 / 503 外部配置缺失（SMTP、Apple）。
- **Schema 校验**：Fastify JSON schema，`removeAdditional: false`，多数 body 用 `additionalProperties: false`。
- **幂等**：收取回信与 Pass 购买要求 `Idempotency-Key` 头；同键重试返回原结果，同键换对象 409。余额不足返回 402 + `context`，客户端充值后用原键重试。
- **迁移**：`npm run migrate`（= `db:migrate`）。事务 + advisory lock + `schema_migrations`，按文件名顺序，可重复执行。新迁移用下一个编号（当前最大 `021`），SQL 本身也要可重复执行。
- 配置（`maugo/.env.example`，`UGC_FILTER_EXTRA_PATTERNS` 除外，它只在 E3 文档中说明）：`DATABASE_URL`（必填）、`HOST`/`PORT`、`SMTP_*`、`APPLE_CLIENT_ID`、`MEDIA_DIRECTORY`（默认 `var/media/`）、`APPLE_BUNDLE_ID`/`APPLE_API_KEY_ID`/`APPLE_API_ISSUER_ID`/`APPLE_API_KEY_PATH`/`APPLE_SHARED_SECRET`、`UGC_FILTER_EXTRA_PATTERNS`（E3）。生产均未配置 SMTP 与 Apple 值。

### 数据模型要点

- `users`：邮箱、scrypt 密码、`is_moderator`（只能由运营改库授予）、`is_suspended`、`deleted_at`、资料（displayName/age/city/bio/gender）、`visibility`（everyone/friends/only_me，B18）、`zodiac`（12 星座或 null，B21）、`filter_pass_expires_at`、钻石余额。
- `conversations`：`opener_id`（首发者）、`peer_id`（收件人）、`opening_message_id`（唯一，不加外键，清空历史也保留）、`unlocked_at`（非空 = 已解锁，**唯一的聊天权限账本**，只在首次成功收取回信的扣费事务中写入）。无序用户对唯一索引，一对用户只能有一次开场白。
- `messages`（kind: opening / reply / 媒体）、`reply_collections`（一次成功收取一条）、`wallet_ledger`（流水，`balanceAfter`、`paymentReference`、`collectionId`、`filterPassPurchaseId`）。
- `apple_transactions`（transactionId 全局唯一防重放）、`filter_pass_purchases`、`reports`（含 `attachment_media_id`）、`user_blocks`（单向屏蔽，任一方向生效）、`media_uploads`（purpose: chat/avatar/post/report）、`user_posts`（category Life/Portrait/Style/Outfit，visibility）、`post_attachments`、形象照（8 槽，type portrait/physique/outfit/life）、头像槽（8 槽）、点赞/访问记录（019）、`feedback`（018）、内容过滤审计（020，仅存摘要）。
- **“好友”** 没有独立表：双方会话 `unlocked_at` 非空即好友（`friendsVisible` SQL，B16/B18 共用）。Inbox 的 Friends/Following 标签只是本人关注的会话。
- 免费额度：Asia/Shanghai 00:00 为界，每日 10 次；第 11 次起 10 钻（`economy.json`）。Pass 1/7/30 天 = 30/150/480 钻；钻石包 `maugo.diamonds.100/550/1200/2600` 对应 $0.99/4.99/9.99/19.99。

### 主要接口（详细契约见 `maugo/README.md`、`maugo/B11-inbox.md`、`maugo/docs/`）

| 模块 | 路由 |
| --- | --- |
| B1/B2 认证 | `POST /auth/signup` `/auth/login` `/auth/logout` `/auth/code/send` `/auth/code/verify` `/auth/password/reset`、`POST /auth/apple`（签名校验后仍返回 503，未签发会话） |
| B3 开场白/消息 | `POST /conversations/:peerId/opening`、`POST /conversations/:id/messages`（纯文本 1–200 字） |
| B4 发现 | `GET /discovery/filters`、`GET /letters`（batchId/offset 分页）、`POST /letters/refresh`、`GET /letters/:openingMessageId` |
| B5 钱包 | `POST /conversations/:id/replies/:replyId/collect`、`GET /wallet`、`GET /wallet/ledger` |
| B6 Pass | `GET /filter-pass`、`POST /filter-pass/purchase` |
| B7/B13 审核 | `POST /reports`、`GET /reports/:id`、`PUT/DELETE /blocks/:id`、`GET /blocks`、`GET /admin/reports`、`POST /admin/reports/:id/resolve` |
| B8 媒体 | `POST /media/uploads?purpose=…`（原始二进制体）、`GET /media/uploads/:id`、`POST /conversations/:id/media` |
| B9 隐私 | `GET /users/me/export`、`DELETE /users/me`（两步确认 + 密码） |
| B11 会话 | `GET /conversations`、`GET /conversations/:id/replies/pending`、`GET /conversations/:id/messages`、`PATCH /conversations/:id` |
| B12 内购 | `GET /payments/apple/products`、`POST /payments/apple/verify`、`POST /payments/apple/notifications` |
| B14/15/18/20/21 资料 | `GET /profiles/:id`（含 `me`）、`PATCH /profiles/me`、`POST /profiles/me/avatars`、`GET /profiles/me/stats`、`GET /profiles/me/followers`、`GET /profiles/:id/image-cards`、`GET /profiles/:id/summary` |
| B16/B17 动态 | `POST/GET /posts`、`GET/PATCH/DELETE /posts/:id`、`GET/POST /users/me/image-cards`、`PATCH/DELETE /users/me/image-cards/:id` |
| B19 反馈 | `POST /feedback`（每用户每小时 5 条）、`GET /admin/feedback`、`PATCH /admin/feedback/:id` |
| 健康 | `GET /health`、`GET /ready` |

### 客户端约定

- 单页应用，无路由库：`App.vue` 按状态切换 `AuthFlow` / `HomeFlow`，其余页面由 `HomeFlow` 等组件内部状态和事件衔接。每个状态与交接包 `04-开发资料/page-states.json` 的状态 ID 对应（共 16 模块 189 状态）。
- 请求一律走 `src/lib/api.ts`。开发时 Vite 把 `/api` 代理到 `MAUGO_API_TARGET`（默认 `http://127.0.0.1:3000`）；也可用 `VITE_API_BASE_URL`。`VITE_*` 是公开变量，不放密钥。
- 会话令牌只在内存中（`App.vue` 的 `sessionToken`）；本地偏好存 `localStorage`，草稿存 `sessionStorage`。
- 图片一律用 `asset(name)` 取；头像用 `Avatar.vue` 圆形裁剪；页面转场用 `PageTransition.vue` 并尊重减少动态效果。
- 新文案要同时补 `i18n.ts` 的英、韩两套。
- 视觉依据：交接包离线原型 `03-成品UI/源文件/MauGo.html`；Figma 文件 `9ecnOjFdk2YjAJRG5TysNJ` 当前无访问权限。

## 3. 已完成清单

“完成”指已合入 main 且验收文档记录通过；部分完成的写明缺口。测试数字取自各验收文档的最近一次记录，本次简报未重跑。

### 后端 B1–B21（`maugo/`）

| 编号 | 内容 | 状态 / 测试 |
| --- | --- | --- |
| B1 | 表结构、注册、开场白、收取冒烟 | 完成；`smoke.test.ts` |
| B2 | 认证：邮箱密码、验证码、限速、会话、重置密码、Apple 校验 | 完成；`auth.test.ts`。SMTP 账号、Apple 登录绑定未配置（见 §4） |
| B3 | 首条消息原子账本 | 完成；任务 #87 修复双向并发死锁；`conversations.test.ts` |
| B4 | 发现与来信 | 完成；城市列表是 mock 固定占位（代码中有 TODO）；`discovery.test.ts` |
| B5 | 回信收取与钱包 | 完成；无独立测试文件，由 `smoke.test.ts`、`core-e2e.test.ts`、`conversations.test.ts` 等覆盖 |
| B6 | Filter Pass | 完成；`filter-pass.test.ts` |
| B7 | 举报、屏蔽、审核队列 | 完成；`moderation.test.ts` |
| B8 | 媒体上传 | 完成；`media.test.ts`。无媒体删除接口 |
| B9 | 数据导出与注销 | 完成；`privacy.test.ts` |
| B10 | 核心链路端到端 | 完成；`core-e2e.test.ts` |
| B11 | 会话列表/待收/历史/PATCH | 完成；`inbox.test.ts` |
| B12 | 苹果内购服务端 | 代码与 mock 测试完成（`payments.test.ts`）；**真实沙盒未联调**（缺 Apple 配置） |
| B13 | 举报证据图 | 完成；`report-attachments.test.ts` |
| B14 | 资料与头像槽位 | 完成；`profiles.test.ts` |
| B15 | 资料统计 `/profiles/me/stats` | 完成；`profile-stats.test.ts` |
| B16 | 动态与形象照 | 完成；`posts.test.ts` |
| B17 | 动态分类 + 已发布动态 PATCH | 完成；`posts.test.ts` |
| B18 | 全局资料可见范围 | 完成；`profile-visibility.test.ts` |
| B19 | 反馈接口 | 完成；`feedback.test.ts` |
| B20 | 他人形象照、获赞分类、粉丝名单、资料摘要 | 完成；`profile-b20.test.ts` |
| B21 | 星座字段（不支持清空） | 完成；`profile-zodiac.test.ts` |
| E3 | UGC 合规：服务端内容过滤（422）+ 举报→审核→封禁闭环 + 18+ 年龄申报留档 | 完成；`e3-compliance.test.ts`，记录 `maugo/docs/e3-age-declaration.md`。注意 E3 实际在后端，不在 client |

后端测试状态：B20、B21 合入记录各为全量 **52/52 通过**（0 失败/跳过），`npm run build`、`tsc --noEmit` 通过。两者分别基于不同基线验收，合并后的 main 全量结果待核实（`test/` 目前有 21 个文件）。

### 客户端 C1–C7、D1–D11（`client/`）

| 编号 | 模块 | 状态 / 测试 |
| --- | --- | --- |
| C1 | 脚手架、343 素材、字体、i18n、Capacitor | 完成；`client.spec.ts`，`task-28-result.md` |
| C2 | 模块 01 登录与欢迎（19 状态） | 完成；`auth.spec.ts`，`C2-module01-acceptance.md` |
| C3 | 模块 02 首页与筛选（9 状态） | 完成；`home.spec.ts` |
| C4 | 模块 03 阅读与写信（10 状态） | 完成；`letters.spec.ts`。写信需填 Recipient ID（无随机分配接口） |
| C5 | 模块 04 消息与回信（17 状态） | 完成；`inbox.spec.ts`（真实 B11） |
| C6 | 模块 06 对话与聊天（20 状态） | 完成；`chat*.spec.ts`；F03 真实录音已补（`chat-voice.spec.ts`） |
| C7 | MVP 第 17 节验收 | **结论：MVP 未整体通过**；已修 F01/F02/F03，后续 D 系列补了 F04/F05/F08/F10 的大部分界面，但 C7 清单未统一复验（待核实）。F06/F07 仍未修（见 §4） |
| D1 | 模块 05 收取额度与付费（6 状态） | 完成；`d1.spec.ts` |
| D2 | 模块 07 聊天背景与气泡（6 状态） | 已合入；`d2.spec.ts` 使用路由 mock，无独立验收文档（待核实） |
| D3 | 模块 08 举报、屏蔽与恢复（9 状态）+ 举报附图 | 已合入；`d3.spec.ts`、`report-attachment.spec.ts` |
| D4 | 模块 09 用户资料 + 10 我的资料（24 状态） | 功能 24/24 通过（真实 B14/B15/B20/B21，`d4-reverify.spec.ts`/`d4.spec.ts`）；UI 与原型差异、完整动画、Figma 未通过 |
| D5 | 模块 11 形象照 + 12 动态（18 状态） | 18/18 通过；`d5.spec.ts` |
| D6 | 模块 13 设置与偏好（11 状态） | 功能通过（第三轮 5/5：反馈接 B19、全局可见范围、推荐开关复用 `/letters`、韩文帮助）；Figma 未验 |
| D7 | 模块 14 账号、安全与退出（13 状态） | 通过；`d7.spec.ts`。App lock 为本机 PIN，实名认证未接入（展示态） |
| D8 | 模块 15 帮助、反馈与说明（14 状态） | 状态通过；法律文本与客服邮箱为 `[..._PENDING_SMITH]` 占位 |
| D9 | 模块 16 钻石与 Pass（13 状态） | 11/13 通过；`topup-confirm`、`topup-success` 未通过（StoreKit 未接） |
| D10 | 语音相关（具体范围待核实） | **未开始**；仓库无 D10 代码或文档 |
| D11 | 核心流程动画（开信/回信/收取/解锁） | 功能 4/4 + 回归 10/10 通过；Figma 动效对照 blocked |

客户端测试状态：`npm run build`（含 343 素材校验 + vue-tsc + vite build）在各验收中通过。Playwright 按模块用不同 config 运行，没有单一全量通过记录。

## 4. 待办与阻塞

| 项 | 现状 | 卡在哪里 / 需谁决定 |
| --- | --- | --- |
| D10 语音 | 未开始 | 需要域名（HTTPS 可访问的后端地址等），Smith 提供；具体需求待核实 |
| E1 / E2 / E4 | 未开始 | 需 Smith 提供材料。仓库内可确认：E2 包含正式隐私政策（`d8-result.md`），D8 还缺服务条款、EULA、客服邮箱；E1/E4 内容待核实 |
| Figma 对照 | D4/D5/D6/D11 均 blocked | 文件 `9ecnOjFdk2YjAJRG5TysNJ` 对当前连接账号无权限，需 Smith 开放 |
| D9 沙盒配置 | `/payments/apple/verify` 返回 503 `Missing Apple configuration` | Smith 在服务器注入 `APPLE_BUNDLE_ID/APPLE_API_KEY_ID/APPLE_API_ISSUER_ID/APPLE_API_KEY_PATH`，在 App Store Connect 建 4 个消耗型商品、沙盒测试员、Notifications V2 地址 |
| StoreKit 接入 | 客户端未接（无 StoreKit/IAP 插件，`ReplyTopup.vue` 只读余额并禁用购买） | 依赖 D9 沙盒配置与原生 iOS 验收环境；购买时 `appAccountToken` 必须是当前用户 UUID；加 Capacitor 内购插件属新增依赖，需先获批 |
| C7 F06 | 未修 | `AuthFlow.vue` 已对 410 显示过期提示，但缺可控验证码邮件夹具和“过期码 / 重发后旧码失效”浏览器用例 |
| C7 F07 | 未修 | 聊天草稿键为 `chat-draft-<conversationId>`（`ChatFlow.vue`），未按账号隔离；需补账号切换隔离与“退出后旧 token 无效”验收 |
| 其他已知缺口 | — | SMTP 未配置（验证码收不到信）；Apple 登录不签发会话；城市列表是占位；无媒体删除接口；D4 UI 与原型差异；C7 第 8.3 项离线操作版图片未就绪；多份验收的 GitHub Issue 评论因 404 未能发布 |

## 5. 编码规范

- **只做任务要求的事**（YAGNI）：不处理任务没提到的情况，不写“以防万一”的代码，不为假想需求留接口/配置/抽象层。
- **最小改动、复用现有代码**：先用现有函数（`transaction`、`authenticate`、`fail`、`creditWallet`、`lockPair`、`friendsVisible`/`profileVisible`/`contentVisible`/`profileAccess`、`api()`、`asset()`、`t()`）和标准库；不新建工具类/包装器/管理类；不顺手重构；只改任务点名的文件，除测试外不新建文件。
- **不加新依赖**，除非任务明确批准。
- **付款、认证、账本类必须完整验证**：鉴权、事务边界、行锁/advisory lock、幂等键、余额与流水同事务、重放与回滚都要有测试覆盖；不能“客户端声称到账”入账，金额只信服务端目录。其余代码按现有风格，不额外包 try/catch、不给每个函数加空值守卫。
- **不修改已应用的迁移**；新增迁移用下一个编号且可重复执行。
- **不伪造**：后端没有的接口不要 mock 成功、不要用本地状态冒充服务端权限；做不到就如实标注未通过/待 Smith。
- **测试要求**
  - 后端：`cd maugo && npm ci && npm run build && npm test`。`npm test` 需要真实 PostgreSQL 的 `DATABASE_URL`，账号要有 CREATE SCHEMA 权限；每个测试建随机 schema，不触碰业务表。新功能补 `test/*.test.ts`，覆盖权限、边界、并发与迁移重复执行。
  - 客户端：`cd client && npm ci && npm run build`；浏览器测试 `npx playwright test -c tests/<模块>.config.ts`（默认 `playwright.config.ts` 会用 `../maugo/node_modules/.bin/tsx tests/auth-server.mjs` 起隔离测试后端，需先装好 `maugo` 依赖和数据库）。新增状态要有 Playwright 断言。
  - 不连生产库、不删数据、不改密码和密钥；`.env`、`.p8` 私钥不提交。
- 交付记录只写任务指定的那一份文档，不另写 README 或重复记录。

## 6. 流水线（详见 `client/docs/pipeline-claude-codex.md`）

1. Muse 建 `codex-task` Issue。
2. Mac 上的 Claude runner 领取，在 worktree 分支 `claude/task-<号>` 写代码。
3. **Claude 不 push、不合 main、不切分支**；完成后由 runner 提交并推送该分支。
4. 建 `codex-review` Issue；服务器 sg-claude 上的 Codex 在 `/root/worktrees/review-<号>` 拉分支跑构建/测试，逐条核对验收标准。
5. **审核通过才合入 main** 并关闭原 Issue；不通过则开 follow-up 任务由 Claude 继续修改，再次审核。
