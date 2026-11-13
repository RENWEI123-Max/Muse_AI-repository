# MauGo 后端

技术栈：Node.js 22+、TypeScript、PostgreSQL 16，HTTP 框架选择 **Fastify**，通过 pg 连接池访问数据库。

## 本地运行

1. 执行 `npm ci` 安装锁定版本依赖。
2. 复制 `.env.example` 为 `.env`，配置数据库连接。
3. 执行 `docker compose up -d postgres`，等待数据库健康检查通过。
4. 执行 `npm run db:migrate` 应用迁移。
5. 执行 `npm run dev`，默认监听 3000 端口。

Compose 凭据仅用于本地开发。生产环境应注入独立凭据，不提交 .env。

## 构建与验证

- `npm run build`：严格 TypeScript 编译，输出 dist。
- `npm test`：验证健康检查、数据库就绪/失败响应和配置校验。
- `npm start`：启动编译后的服务。
- `GET /health`：存活检查，不依赖数据库。
- `GET /ready`：执行 SELECT 1，数据库可用返回 200，否则返回 503。

健康检查单元测试使用数据库替身；业务冒烟测试使用真实 PostgreSQL。

## 结构与配置

src/app.ts 创建应用；src/server.ts 管理监听、连接池及优雅退出；src/config.ts 校验配置；src/migrate.ts 执行 server/migrations 下的 SQL。迁移使用事务、advisory lock 和 schema_migrations 记录，按文件名顺序执行，支持重复运行。不要修改已应用迁移，新增递增编号文件。编译后的迁移同样需要server/migrations。

HOST 默认 0.0.0.0，PORT 默认 3000，DATABASE_URL 必填。收到 SIGINT/SIGTERM 时关闭 HTTP 服务和数据库连接池。

## Issue #1：业务接口

迁移现放在 `server/migrations/`，运行 `npm run migrate`（原 `db:migrate` 仍可用）。新增 users、conversations、messages、reply_collections、wallet_ledger 五张表。

- `POST /auth/signup`：JSON `{ "email": "a@example.com", "password": "Password1!", "privacyVersion": "1", "termsVersion": "1" }`，返回 201 和 `{id, token}`；邮箱重复返回 409。密码使用随机盐 scrypt，数据库仅存令牌摘要。B2 认证扩展见下文。
- 业务请求携带 `Authorization: Bearer <token>`。`POST /conversations/:peerId/opening`，JSON `{ "content": "你好" }`，纯文本 1–200 个 Unicode 字符，返回 201；同一对用户只能建立一次会话，重复返回 409。不解析 HTML 或 Markdown，客户端展示时应作为纯文本。
- `POST /conversations/:id/replies/:replyId/collect`：携带非空 `Idempotency-Key`。B5 的确认、取消、重试与钱包契约见下文；免费收取不写扣费流水。

B1 提供上述三个业务接口；B 回复通过数据库测试夹具写入，不提供回复发送、充值、支付或客户端功能。注册余额为零，B2 已增加登录和会话管理。

`npm test` 需要配置真实 PostgreSQL `DATABASE_URL`，除原四项检查，还自动创建唯一 `smoke_*` schema 测试 A/B 注册、重复开场白、每天十次免费、跨天额度重置、第十一次扣费、余额不足、越权及并发幂等；测试数据保留在独立 schema，不触碰现有业务表。测试账号需有 CREATE SCHEMA 权限。运行 `npm run build` 校验 TypeScript，`npm run dev` 后 `/health` 返回 200。

## B2：认证接口

注册和密码登录均需传入 `email`、`password`、`privacyVersion`、`termsVersion`。邮箱统一转小写，密码长度 8–128 且须包含字母以及数字或符号；注册可传 `confirmPassword`，传入时必须一致。协议版本不可为空，成功注册/登录时写入 users 的版本与同意时间。注册返回 201，重复邮箱 409；密码错误返回 401。登录返回 `{id, token}`。

新会话存于 auth_sessions，仅保存 SHA-256 摘要，有效期 30 天；注册、登录均签发独立会话。业务接口兼容 B1 旧令牌。`POST /auth/logout` 携带 Bearer token 撤销当前会话，重复撤销成功；缺少 Bearer 返回 401。

`POST /auth/code/send` 接收 `{email}`，随机六位验证码（不使用 123456），仅保存摘要，10 分钟有效；成功返回 `{sent:true,retryAfter:60,expiresIn:600}`。重发等待返回 429、Retry-After 和 retryAfter 秒数。登录按 IP 与邮箱分别限制每小时 10 次，发码分别限制每小时 5 次请求（包含倒计时内重试和发送失败），验证每小时 30 次；数据库保存计数，跨进程共享。发码、验证码消费均通过数据库锁串行处理。

`POST /auth/code/verify` 接收 `{email,code}`；成功 `{verified:true}`，错误或已使用 401，过期 410，同一验证码错误尝试达到 5 次后 429。验证成功只表示邮箱校验通过，不签发会话或自动修改账号；验证码不能重复消费。

SMTP 使用 `.env.example` 中五项环境变量。465 端口使用 TLS，其余使用 nodemailer 的 STARTTLS 协商。配置缺失、无效或发送失败均返回明确 503，验证码仅在服务端日志中供开发测试，响应不含验证码；失败仍保留验证码及重发等待。本服务器尚无 SMTP 账号，需要 Smith 配置 SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM 后才能实际收信。

Apple 入口接收 `{identityToken}`，取消可传 `{cancelled:true}` 并返回 `{cancelled:true}`。使用 jose 与 Apple 公开 JWKS 校验 RS256 签名、issuer、APPLE_CLIENT_ID audience、过期时间、sub/iat。参考 [Apple 官方校验说明](https://developer.apple.com/documentation/signinwithapple/verifying-a-user)。当前 APPLE_CLIENT_ID 未配置时返回 503；无效 token 返回 401。即使签名校验成功，当前仍返回 503，明确不签发会话：账号绑定、服务端 nonce 关联与授权码交换尚未实现。需要 Smith 提供实际 Bundle ID/Services ID、确定账号绑定规则；若接通授权码交换，还需 Apple Team ID、Key ID 和 Sign in with Apple 私钥，私钥不应提交仓库。identityToken 签名校验本身使用 Apple 公钥，不需要伪造私钥。

新增 `003_auth.sql`，迁移不删除原数据、不改数据库凭据，可重复运行。`test/auth.test.ts` 使用独立 PostgreSQL schema 验证全部新接口、输入错误、会话撤销/过期、验证码错误/过期/一次性消费、SMTP 失败、倒计时、IP/邮箱配额、Apple 取消及未配置返回；保留测试数据。B1 冒烟测试随协议字段和新迁移同步调整。

### 重置密码

无需登录，先调用现有 `POST /auth/code/send`（`email`），再调用 `POST /auth/password/reset`，传入 `email`、六位 `code`、`newPassword`。请直接提交验证码到重置接口；`/auth/code/verify` 会消费验证码。新密码沿用注册规则：8–128 位，包含字母及数字或符号。成功返回 `200 {"reset":true}`，验证码只可使用一次，全部现有会话及旧版 token 立即失效。

空表单或弱密码返回 400，错误或已使用验证码返回 401，过期验证码返回 410，验码次数超限返回 429。验证码有效期为 10 分钟，发码沿用原有邮箱/IP 限速；SMTP 未配置或发送失败返回 503，不返回或记录明文验证码。无需新增迁移。

### B3 首条消息原子账本

`004_conversation_ledger.sql` 扩展 conversations：保留 opener_id（首发者）、peer_id（收件人），新增非空且唯一的 opening_message_id 和可空的 unlocked_at；后者非空即已解锁。原有 conversations_pair 使用 `UNIQUE (LEAST(opener_id,peer_id), GREATEST(opener_id,peer_id))` 表达式索引确保无序用户对唯一，消息表仍有 one_opening 部分唯一索引。opening_message_id 是历史消息的持久逻辑引用，刻意不加外键，允许删除消息历史而保留原 ID、首发者与权限；清空历史时不得删除 conversations。旧会话从已有首条及收件人回复回填，历史已不存在时分配账本占位 ID，不补造历史消息。

opening 接口在事务中获取排序用户对的 advisory lock 后查重，首次返回 201，重试及反向 opening 返回 200 和同一会话、openingMessageId（兼容 messageId）、首发者与解锁状态，不重新发送或解锁。`POST /conversations/:id/messages` 接收 content；事务锁定会话，未解锁时仅收件人有效回复可写入并设置 unlocked_at，首发者返回 403。空白、超过 200 字、非成员或被屏蔽的回复不会解锁。普通消息沿用 reply 类型以兼容 B1 收藏。

仓库此前没有屏蔽逻辑或用户状态字段，因此新增 user_blocks(blocker_id,blocked_id) 联合主键作为定向屏蔽来源，发送前检查收件人是否屏蔽发件人；本任务不新增屏蔽管理接口。认证复用 B2 会话过期判断及现存旧 token 兼容行为。

验证：全量 npm test 七项通过、TypeScript 构建通过、db:migrate 连续两次通过；新测试也直接重复执行该迁移。conversations.test.ts 使用隔离 PostgreSQL schema 和 Promise.all，覆盖 20 次双向并发、12 次同用户两设备并发，并核对会话与消息数量及唯一 ID；覆盖清空历史前后权限和首条 ID 保留、无效回复不解锁、有效收件人回复后双方发送、非成员、已有及新会话被屏蔽、缺失/无效/过期 token、自发 400。未测：真实移动设备网络重试、屏蔽管理前端、线上负载压测；没有跳过自动测试。client/ 未修改。

## B4：发现与来信（模块 02 / 03）

以下接口均使用 B2 Bearer token（兼容已有 token），只返回当前收件人的开场白，
不公开其他收件人的信件或账户邮箱。来信标识始终是 B3 `openingMessageId`。

- `GET /discovery/filters`：返回 `filters-free` / `filters-active`、Pass 到期时间、
  `lockedFields`、性别枚举、18–120 岁边界和城市选项。性别免费；城市、最低和最高年龄需要 Pass。
- `GET /letters`：可选 `gender`、`city`、`minAge`、`maxAge`、`limit`（默认 3，最大 50）。
  年龄上下界均包含。首次请求预留至多 `limit` 封未展示过的来信，返回 `batchId`。
- `GET /letters?batchId=…&offset=…&limit=…`：读取该批次；`offset` 默认为 0，
  使用返回的 `nextOffset` 翻页；`hasMore=false` 时 `nextOffset=null`。
  批次绑定用户与筛选，不能中途换筛选。不带批次时只允许 offset=0。
  批次大小由首次 limit 决定，可用较小 limit 分页；重复读取同一批次不会换信。
- `POST /letters/refresh`：JSON 对象接受同样的筛选与 limit（通常传 `{}`），
  不接受 batchId；创建另一批。多次刷新和多设备并发都不会再次分配已展示信件。
  无批次的 GET 同样创建新批次，客户端重绘时应携带原 batchId。
- `GET /letters/:openingMessageId`：内容、发信人公开资料、conversationId、
  replied / unlocked / unlockedAt、canReply / canChat 和详情状态。
  回应仍使用 B3 `POST /conversations/:conversationId/messages`。

城市选项为 **mock-fixed-list 占位数据**，不是实时城市目录；代码中保留 TODO。
新用户的城市、年龄、性别默认空，不伪造资料；筛选时未知资料不匹配对应条件。
发现接口按数据库 `filter_pass_expires_at` 实时校验权限；购买与续购由下述 B6 接口提供。

未开通或已到期时，任何年龄/城市筛选（包括读取历史高级筛选批次）均返回 HTTP 200、
`locked=true`、`code=FILTER_PASS_REQUIRED`、锁定提示及空 items，绝不退回未筛选结果。
无匹配或发现池耗尽返回 HTTP 200、`home-empty`，不重置已看记录。批次中后来被屏蔽或
删除内容的信件不再返回；双方任意一方屏蔽均生效，详情返回 404。无权限的批次也是 404。

### page-states.json 状态对应

| 模块 / 状态 | 接口约定 |
| --- | --- |
| 02 home-ready / home-empty | 有来信 / 无匹配或耗尽（默认每批三封） |
| 02 home-response | 对方在已回应会话中再次回信；responses 给出 openingMessageId 供跳转。首页读取后记为已展示，下次进入不再提示 |
| 02 filters-free / filters-active / filters-selected | 筛选元数据和列表 filterState；未开通高级筛选返回锁定提示 |
| 02 bird-female / bird-male / bird-motion-off | 信使外观与动画是客户端本地展示状态，不改变发现接口 |
| 03 letter-open | 尚未回应，canReply=true |
| 03 letter-waiting | 已回应且 B3 解锁账本已生效，等待发信人下一条回信 |
| 03 letter-replied | 发信人已有后续回信，canChat=true；不在发现接口泄漏付费回信内容 |
| 03 letter-typed / letter-safety / letter-report | 编辑草稿、菜单和举报原因是客户端状态，基于详情展示；举报提交不属于本任务接口 |
| 03 compose-empty / compose-draft / compose-invalid | 客户端编辑状态；发送复用 B3 opening 接口的校验 |
| 03 compose-sent | B3 opening 返回持久化 conversationId / openingMessageId；重复发送沿用同一账本 |

`replied` 依据持久化 unlocked_at，因此清理历史回复后仍保持已回应/解锁状态；
`letter-replied` 依据尚存的发信人后续回复，发现接口不会创建新会话或重建已删除开场白。
迁移 `005_discovery.sql` 可重复执行；发现批次与已看记录持久化，不依赖进程内缓存。
测试在隔离 PostgreSQL schema 中覆盖筛选锁定和到期、边界分页、并发刷新不重复、
双向屏蔽、资料隔离、回应提示与 B3 状态，且重复执行新迁移。


## B5 回信收取与钱包

迁移 `006_reply_wallet.sql` 可重复执行，保留旧收取及扣费记录。`reply_collections` 中一条记录代表一次成功解锁，`collection_count=1`、`unlocked_at` 标记解锁；重试不增加次数。Conversation 的 `unlocked_at` 仍是 B3 的已回复/聊天权限账本，与逐封回信的付费解锁分开，`openingMessageId` 始终沿用原账本。

所有接口要求 Bearer 登录。收取接口要求 `Idempotency-Key`（1–128 字符），正文可省略或为 `{}`：

- 前 10 次不同回信免费，成功返回 `state: collected`、`id`、`cost`、`content`、`unlocked`、`unlockedAt`、`collectionCount`、`openingMessageId`。
- 第 11 次起首次请求返回 HTTP 200、`state: confirmation-required`、`code: PAID_CONFIRMATION_REQUIRED`、`cost: 10`，不返回内容、不产生解锁或流水。用户确认后在原 URL、原键提交 `{ "confirmPaid": true }`。
- 确认后余额不足返回 HTTP 402、`code: INSUFFICIENT_DIAMONDS`、`diamonds`、`cost` 和 `context: { conversationId, replyId, idempotencyKey }`。客户端保留该上下文，充值完成后以原 URL、原键及确认正文重试；失败不会消耗幂等键或免费次数。
- 取消可直接关闭确认界面，或发送 `{ "cancel": true }`，返回 `state: cancelled`，不改变余额、解锁或流水；取消不会撤销先前已完成的收取。
- 同一用户的成功键绑定回信，换回信返回 409，包括重复收取时使用的备用键。不同键并发收取同一回信也仅解锁/扣费一次。仅允许收取会话中对方发出的 reply，未回复的会话及任一方向屏蔽关系均拒绝。

免费额度以 Asia/Shanghai 00:00 为界，每日 10 次，成功记录按创建时间计数。认证取得用户行锁后再确定日期，计数、解锁记录、扣费及流水在同一 PostgreSQL 事务内完成。

`GET /wallet` 返回 `diamonds`、`freeRemaining`、`dailyFreeLimit`、`paidCost`、`timeZone`。`GET /wallet/ledger?limit=20&offset=0` 返回本用户的流水 `items`（limit 1–100），包括 `id`、`collectionId`、`amount`、`balanceAfter`、`paymentReference`、`createdAt`。旧流水的 `balanceAfter` 为 null，不伪造历史余额。

`src/wallet.ts` 导出可信服务函数 `creditWallet(pool, userId, amount, paymentReference)`，供支付适配器核验签名、订单归属及服务端商品金额后调用；未开放客户端自行指定金额的充值接口。支付全局唯一编号保证重复回调只入账一次，编号绑定用户与金额，篡改重放返回 409，余额更新及正数流水在同一事务提交。本任务不接入实际支付供应商。

测试使用真实 PostgreSQL，覆盖第 10/11 次边界、付费确认与取消、余额不足原操作重试、同键/异键并发、重复支付回调、事务中途故障回滚、双向屏蔽、钱包归属、上海午夜边界及迁移重复执行。


### B6 Filter Pass

- `GET /filter-pass`（Bearer）：返回 `active`、`expiresAt`、`remainingDays`、`plans`、`features`。剩余天数按 24 小时向上取整，到期后为 0；过期时间保留用于展示。
- `POST /filter-pass/purchase`（Bearer + `Idempotency-Key`）：请求 `{ "days": 7, "filters": { "city": "Seoul", "minAge": 20, "maxAge": 30 } }`，可选 `cancel: true`。档位由 `src/economy.json` 定义：1/7/30 天分别为 30/150/480 钻，解锁 age、city。
- 成功返回 `state: purchased`、`purchase`（购买 ID、用户、档位、钻石、起止时间）、当前权益状态与 `context`。起点为购买时间和当前到期时间的较晚者，每天增加 24 小时；立即获得筛选权限，过期自动锁定。
- 取消返回 `state: cancelled`，不写购买或流水；余额不足返回 HTTP 402、`INSUFFICIENT_DIAMONDS`。两者均返回包含 days、filters、idempotencyKey 的 `context`，调用方应保留该上下文，充值完成后用原键和档位重试。取消本身不会消耗幂等键；成功后再取消/回调仅返回原购买结果，不撤销购买。
- 同一用户同一键的提交和重试/重复回调只扣一次，同键改档位返回 409。新的真实续购必须使用新键。该接口直接消费已有钻石，不接受客户端支付金额或到账声明；充值继续使用 B5 的可信支付适配器 `creditWallet`。
- 认证持有的用户行锁串行化购买、续购和其他钱包操作；购买记录、权益到期时间、余额扣除与 `wallet_ledger` 在同一事务提交，任何失败全部回滚。`GET /wallet/ledger` 通过 `filterPassPurchaseId` 关联购买。
- `007_filter_pass.sql` 可重复执行；集成测试覆盖三档、未开通/过期锁定、有效期累加、并发提交、取消、余额回补重试及流水故障回滚。
