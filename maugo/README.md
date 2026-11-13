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

opening 接口在事务中获取排序用户对的 advisory lock 后查重，首次返回 201，重复及反向 opening 返回 409，不重新发送或解锁。`POST /conversations/:id/messages` 接收 content；事务锁定会话，未解锁时仅收件人有效回复可写入；回信不解锁，首次成功收取在扣费事务内设置 unlocked_at，首发者返回 403。空白、超过 200 字、非成员或被屏蔽的回复不会解锁。普通消息沿用 reply 类型以兼容 B1 收藏。

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
| 03 letter-waiting | 已回应，等待发信人收取；聊天权限由收取事务解锁 |
| 03 letter-replied | 发信人已有后续回信，canChat=true；不在发现接口泄漏付费回信内容 |
| 03 letter-typed / letter-safety / letter-report | 编辑草稿、菜单和举报原因是客户端状态，基于详情展示；举报提交不属于本任务接口 |
| 03 compose-empty / compose-draft / compose-invalid | 客户端编辑状态；发送复用 B3 opening 接口的校验 |
| 03 compose-sent | B3 opening 返回持久化 conversationId / openingMessageId；重复发送沿用同一账本 |

`replied` 依据收件人回复或持久化 unlocked_at，收取后清理历史回复仍保持已回应/解锁状态；
`letter-replied` 依据尚存的发信人后续回复，发现接口不会创建新会话或重建已删除开场白。
迁移 `005_discovery.sql` 可重复执行；发现批次与已看记录持久化，不依赖进程内缓存。
测试在隔离 PostgreSQL schema 中覆盖筛选锁定和到期、边界分页、并发刷新不重复、
双向屏蔽、资料隔离、回应提示与 B3 状态，且重复执行新迁移。


## B5 回信收取与钱包

迁移 `006_reply_wallet.sql` 可重复执行，保留旧收取及扣费记录。`reply_collections` 中一条记录代表一次成功解锁，`collection_count=1`、`unlocked_at` 标记解锁；重试不增加次数。Conversation 的 `unlocked_at` 是聊天权限账本，首次收取回信时与收取记录、扣费在同一事务内写入，后续收取不重复修改解锁时间，`openingMessageId` 始终沿用原账本。

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

### B7 举报、屏蔽与审核

所有接口使用 Bearer 会话认证。数据持久化在 PostgreSQL `reports`、`user_blocks`，应用新增迁移 `008_moderation.sql`；迁移可重复执行。不涉及 client/。

- `POST /reports`：提交 `{reportedUserId, messageId?, category, reason}`，category 为 spam/harassment/sexual/violence/hate/other，reason 为 1–2000 字符。可举报账号；举报消息时必须是本人参与会话内被举报人发送的消息。返回举报 id 和 pending 状态。
- `GET /reports/:id`：仅举报人查询自己的举报，返回状态及处理结果、处理人、处理时间。状态为 pending（待处理）、processed（已处理）、rejected（已驳回）。
- `PUT /blocks/:id`、`DELETE /blocks/:id`：幂等屏蔽、解除屏蔽；只能修改自己的屏蔽关系。`GET /blocks` 返回自己的屏蔽列表和时间。
- `GET /admin/reports?status=pending&limit=20&offset=0`：审核队列，status 可省略或使用上述三种状态，按举报时间及 id 倒序。
- `POST /admin/reports/:id/resolve`：`{decision:"approve"|"reject", action:"none"|"suspend", result:"处理说明"}`，action 默认为 none。通过映射为 processed，驳回映射为 rejected；驳回不可处罚账号，已处理不可覆盖（409）。处理结果与审核人、时间一同事务提交；suspend 会冻结被举报账号的服务端访问和他人向该账号的发送。

审核接口仅允许数据库 `users.is_moderator=true` 的审核账号；默认所有用户为 false，客户端和注册接口不能设置该权限。由运营通过受控数据库管理授予审核员，不提供公开提权接口。

屏蔽任一方向都会阻断双方开场白、回信、已解锁聊天以及回信收取；发送与屏蔽使用相同用户对事务锁，在提交屏蔽后不能绕过检查。解除屏蔽不会删除会话和消息，也不会重置 B3 权限账本：未收到回信仍须等待，已解锁会话继续允许聊天，对方仍保留屏蔽时仍拒绝发送。

### B8 媒体上传

`POST /media/uploads?purpose=chat|avatar|post&filename=photo.png[&conversationId=UUID]`
使用 Bearer 登录令牌，Content-Type 为媒体的真实 MIME，请求体为文件原始二进制（不是 JSON/base64 或 multipart）。
返回 201：`id, url, uploaderId, purpose, kind, mimeType, size, createdAt`。上传前验证用户及用途权限，收到文件后再次验证，防止上传期间被屏蔽或封禁。

- chat 必须指定本人参与且已成功收取回信解锁的会话，双方在解锁前均不能上传媒体；屏蔽、封禁后拒绝。
- avatar 仅接受图片；post 接受图片、语音、视频。非 chat 不允许携带 conversationId。
- 图片白名单 JPEG/PNG/WebP；语音 MP3/OGG Opus/WAV；视频 MP4/WebM。服务端识别文件内容，要求 MIME、后缀与识别结果一致；拒绝 SVG、HTML、路径分隔符、多重后缀等。
- 图片和语音必须小于 10 MiB，视频必须小于 30 MiB（31,457,280 字节，等于上限也拒绝）。框架请求体限制同时拒绝超大请求，包括无 Content-Length 的请求。
- 文件使用随机 UUID 名称写入 `MEDIA_DIRECTORY` 指定的服务器目录，默认 `var/media/`（相对服务进程工作目录），目录需持久化并可写。数据库 `media_uploads` 记录上传者、用途、会话、类型、字节数、原始名称和时间；数据库事务失败会删除本次文件。备份时应同时备份数据库与该目录。
- `GET /media/uploads/:id` 为鉴权下载路径；聊天参与者读取仍需会话解锁且无屏蔽/封禁，avatar/post 当前仅上传者可读取，后续公开动态发布接口需单独授权，禁止直接公开挂载存储目录。
- `POST /conversations/:id/media`，JSON `{ "mediaId": "UUID" }`，发送本人为该会话上传的媒体，再次执行解锁与屏蔽校验；不能发送其他用户、其他会话或 avatar/post 上传的文件。响应包含消息 id、conversationId、mediaId。

迁移 `009_media.sql` 可重复执行。集成测试覆盖授权、解锁、屏蔽、封禁、内容类型/后缀、路径穿越、视频大小边界、真实落盘与读取、媒体发送归属及迁移幂等性。


### B9 数据导出与注销

- `GET /users/me/export`：Bearer 鉴权，下载 `maugo-export.json`。一致性快照包含资料、双方会话消息、本人动态、媒体元数据、钱包流水、收取记录与 Filter Pass 购买记录。所有字段均使用白名单，不导出密码、哈希或任何认证凭据，响应禁止缓存。媒体文件本体不嵌入 JSON。
- `DELETE /users/me` 第一步发送 `{"confirm":true}`，返回 202 和十分钟有效的 `deletionToken`，账号此时保持正常。第二步再次 DELETE，发送 `{"confirm":true,"deletionToken":"第一步返回值","password":"当前密码"}` 完成身份复核。确认凭据绑定当前登录会话；每账号每小时最多五次密码验证，重新确认不会重置次数。
- 成功注销撤销所有会话与历史 token，清空身份资料和本人动态、钱包等私有记录，释放原邮箱。会话保留匿名占位与对方消息，本人消息替换为“[已注销]”，对方看到 `account-deleted`、`sender.deleted=true`，不能继续发消息。邮箱重新注册生成全新用户 ID。
- 上传媒体元数据随注销事务清除；物理文件删除使用持久化队列，提交后立即处理，启动和每分钟重试。文件删除失败不会恢复已注销账号；队列清空后表示磁盘清理完成。匿名占位及对方仍持有的消息/收取引用保留引用完整性。
- 新迁移 `010_account_privacy.sql` 可重复执行。B8 尚无动态发布模块，B9 增加 `user_posts` 作为动态内容存储并覆盖其导出和清理，未改动客户端或增加动态发布接口。
- `test/privacy.test.ts` 覆盖导出隔离及敏感字段、两阶段确认、身份复核与限流、媒体删除失败重试、旧会话与历史 token 失效、对方注销状态及同邮箱新注册。


## B10 核心链路端到端测试

`test/core-e2e.test.ts` 随 `npm test` 执行，在独立 `b10_*` PostgreSQL schema 内通过真实 API 注册用户，不使用假用户文件。邮件发送适配器捕获真实随机验证码，其他业务均连接真实数据库。分步子测试覆盖认证异常、并发开场白唯一约束与 409、发现列表/详情/筛选/Refresh、锁定消息和媒体、回信后仍锁定、收取后双方聊天、十次免费与第十一次扣费、并发及幂等键、上海自然日边界、Filter Pass 购买及到期。注入账本写入失败证明收取记录、余额、累计次数和会话解锁整体回滚，随后并发重试仅扣费及解锁一次。迁移入口在同一隔离 schema 连续运行两次，并断言迁移记录及应用时间不变。测试保留隔离数据，不删除业务数据。

## B11 会话列表与历史

新增会话列表、待收回信与额度、历史/搜索/已读、个人会话偏好 PATCH，详见 [B11 接口说明](B11-inbox.md)。需应用新增的 `011_inbox.sql` 迁移。清空历史仅改变当前用户可见范围，不重置首条消息权限或解锁状态。C5 测试环境已移除临时会话路由，改用真实后端与独立测试数据库；测试见 `test/inbox.test.ts` 和客户端 `tests/inbox.spec.ts`。

## B12 苹果内购服务端

`src/economy.json` 的 `bundles` 是服务端商品目录，与交接包一致；不另设商品映射。
`GET /payments/apple/products` 返回 `{ products: [{ id, diamonds, usd, label }] }`，四档为
maugo.diamonds.100（100 钻/$0.99）、maugo.diamonds.550（550 钻/$4.99）、
maugo.diamonds.1200（1200 钻/$9.99）、maugo.diamonds.2600（2600 钻/$19.99）。
价格是目录展示价；实际 StoreKit 本地化价格由后续客户端接入读取。Filter Pass 仍用钻石购买。

`POST /payments/apple/verify` 要求现有 Bearer 登录，正文 `{ "signedTransaction": "StoreKit 2 JWS" }`。
服务端验证 Apple G3 根证书指纹、证书链、有效期、签名用途和 ES256 签名，再以签名内的
Sandbox/Production 环境调用 App Store Server API 的 Get Transaction Info，并验证返回的交易 JWS。
只接受配置的 bundleId、目录内 productId、有效 transactionId 和未撤销交易。
客户端购买时必须把当前 MauGo 用户 UUID 作为 StoreKit `appAccountToken`，服务端核对归属，
防止另一登录用户认领交易；不能省略或用设备 ID 代替。
成功返回 `{ balance, credited, transactionId }`，credited 为本次商品的钻石数量。
交易记录、`creditWallet` 余额更新、WalletLedger 在同一数据库事务内提交。
transactionId 为全局唯一键，同一用户并发或重复提交返回首次的 balance/credited，
即使之后消费导致当前余额变化也保持原结果；其他用户不能认领。
验证错误返回 4xx；缺配置/密钥不可读或 Apple API 不可用返回 503，不会无验证入账。

`POST /payments/apple/notifications` 接受 App Store Server Notifications V2 的 `{ "signedPayload": "JWS" }`，
无需用户 Bearer，但必须验签并匹配 bundleId；REFUND 内嵌的 signedTransactionInfo 也需验签。
REFUND 按 transactionId 找原入账，原额反向记流水，余额充足才扣款；例如余额 20 时退款 550，
只记流水 -550、balanceAfter=20，保留现有余额，不产生负余额。
重复退款不会再次扣款；先到的退款会保存交易标记，阻止之后充值。其余类型写服务端结构化日志，返回 received。
需启用服务端日志才能查看这些信息。迁移 `012_apple_payments.sql` 可重复执行，
apple_transactions 保留已处理交易身份以防重放（包括用户注销清空钱包后）。

配置由服务器环境注入，`.env.example` 中所有 Apple 支付值默认留空：

- `APPLE_BUNDLE_ID`：App Store Connect 中该 iOS 应用的 Bundle ID，必须与交易完全一致；不是上述商品 ID。
- `APPLE_API_KEY_ID`：可访问 App Store Server API 的 In-App Purchase Key 的 Key ID。
- `APPLE_API_ISSUER_ID`：该密钥所属 App Store Connect 团队的 Issuer ID。
- `APPLE_API_KEY_PATH`：服务器上私有 `.p8` 文件的绝对路径，必须放在仓库外，仅服务进程可读。
- `APPLE_SHARED_SECRET`：可选的 legacy verifyReceipt 共享密钥；本任务 StoreKit 2 流程不使用它，也不降级为免验证。

Smith 需在 App Store Connect 为正确 Bundle ID 提供 Key ID、Issuer ID 和 `.p8` 文件，
并建立以上四个完全一致的消耗型商品 ID，配置价格、销售地区及可测试状态；配置生产与沙盒的
Notifications V2 HTTPS 地址为服务器 `/payments/apple/notifications`。私钥及共享密钥不得提交仓库。
证书校验依据 [Apple PKI](https://www.apple.com/certificateauthority/)，交易查询依据
[Get Transaction Info](https://developer.apple.com/documentation/appstoreserverapi/get-transaction-info)。

沙盒联调前提：Smith 提供沙盒测试员和有效密钥，应用签名/Bundle ID 与 App Store Connect 一致、
四个商品在沙盒可获取，服务器能访问 Apple API，通知地址可从公网访问，客户端完成下一任务的
StoreKit/Capacitor 接入并带上 appAccountToken。本任务没有客户端变更，没有在 App Store Connect
创建商品，也未进行需要这些凭证和测试员的真实沙盒端到端测试。
`test/payments.test.ts` 使用签名校验及 API mock 与真实 PostgreSQL，覆盖入账、并发幂等、
归属、bundle/product 错误、篡改 JWS、凭证缺失、退款验签/重放/不足额及事务失败回滚。

## B13 举报证据图（任务 #61 验收）

应用 `013_report_attachments.sql`（支持重复执行）。B8 上传用途新增 `report`：
`POST /media/uploads?purpose=report&filename=proof.png`，沿用 Bearer 鉴权、真实文件识别、
JPEG/PNG/WebP 白名单及严格小于 10 MiB 的图片限制；非图片、超大文件和未认证请求拒绝。
`POST /reports` 新增可选 `attachmentMediaId`，仅接受举报人本人上传的 report 用途图片，
不存在返回 404、他人媒体返回 403、用途错误或非图片返回 400，失败不创建举报。每条举报最多一张图，
不传附件的旧请求保持兼容。创建、详情、审核队列和处理响应增加 `attachmentMediaId` 及
`attachment: {id, url}`（无附件均为 null），url 是需 Bearer 鉴权的 `/media/uploads/:id`。
举报人可下载自己的媒体；审核员仅可下载已被举报引用的 report 媒体；其他用户拒绝访问。

证据媒体通过 reports.attachment_media_id 外键保留，无附件删除接口，处理或驳回举报不清除证据。
账号注销时仍被举报引用的证据元数据和文件保留供审核，其他媒体沿用 B9 清理。
当前无举报删除 API；受控管理操作删除举报记录时不级联删除媒体或文件，
未被引用的媒体在上传者后续账号注销时沿用 B9 清理；若上传者已经注销，则保留，
本任务不增加自动清理任务。最后一条引用删除后审核员失去该媒体下载权限。

`test/report-attachments.test.ts` 覆盖上传用途与类型/大小/认证拒绝、有效附件创建和查询、
审核队列与真实文件读取权限、冒用/不存在/错误用途/非图片拒绝且无举报入库、无附件兼容、
审核处理和账号注销后证据保留、举报删除不级联及新迁移重复执行。
验收结果：隔离 PostgreSQL schema 中完整测试 25 项全部通过，TypeScript 构建通过，
迁移入口重复运行与新迁移 SQL 重复执行通过；client/ 无变更。

## B14 资料与头像槽位（任务 #64 验收）

- `GET /profiles/:id`（含 `me`）须 Bearer 鉴权，返回 `id/displayName/age/city/bio/avatar/avatars/following/permissions`。不存在 404，双向屏蔽或封禁 403，注销 410。`permissions` 区分新建开场白、已解锁聊天与关注权限，读取资料不会解锁会话。关注状态读取 B11 的本人会话偏好。
- `PATCH /profiles/me` 支持部分更新 `displayName/age/city/bio`；昵称去空白后非空且最长 24 字、年龄 18–100 整数、城市最多 40 字、简介最多 200 字。17 岁及空昵称返回 400，文案为 `Enter a name and an age between 18 and 100.`；校验失败不写库。
- 先通过 B8 `POST /media/uploads?purpose=avatar&filename=photo.png` 上传原始图片，再向 `POST /profiles/me/avatars` 提交 `{action,mediaId}`；`action` 为 `add/select/remove/restore`，移除必须另带 `confirm:true`。仅关联本人上传且用途为 avatar 的图片，冒用返回 403。最多 8 个活动槽位，满槽上传和新增/恢复均返回 409；重复新增活动头像、重复移除及重复恢复不会重复占槽。新增与恢复选择首个空槽，移除主头像后按槽位顺序选剩余首张，没有剩余时主头像为空。
- 本人资料额外返回 `recentlyRemoved`，按最近移除排序；他人看不到归档列表、邮箱、余额及认证字段。公开头像字节仅允许读取活动槽位图片，并复用双向屏蔽和账号状态检查；归档文件只保留本人恢复用途。圆形遮罩由客户端处理。
- 资料写入、槽位归档/恢复和主头像引用更新均使用数据库事务，本人行锁串行分配槽位，数据库唯一索引防止活动槽位冲突；注销清除简介，媒体删除级联清除槽位记录。

验收结论：隔离 PostgreSQL 验收数据库完整测试 26 项全部通过，TypeScript 构建通过；完整迁移运行器连续执行两次通过，014 迁移 SQL 重复执行通过。新增用例覆盖 404、17 岁/空昵称/超长简介等校验、未鉴权、媒体归属、8 槽上限、并发抢槽、移除确认与恢复、主头像切换、双向屏蔽、归档图片访问和会话解锁权限。`client/` 未修改，未使用生产数据，未添加依赖或密钥。

## B16 动态与形象照（任务 #65）

应用可重复执行的 `015_posts_image_cards.sql`。全部接口要求 Bearer 登录；修改与鉴权使用现有事务及用户行锁。

- `POST /posts`：`{content, mediaIds?: UUID[], visibility?: "everyone"|"friends"|"only_me"}`，返回 201。文字最多 1000 个 Unicode 字符，附件最多 6 个且不重复；允许纯文字或纯附件，不允许两者都空。默认 everyone。附件必须是本人通过 B8 上传的 post 媒体，再次核验图片 JPEG/PNG/WebP、音频 OGG/WAV/MP3、视频 MP4/WebM 类型及严格小于 10/10/30 MiB 的大小。返回 `id,userId,content,visibility,createdAt,attachments`，附件含 `id,url,kind,mimeType,size`，保持提交顺序。
- `GET /posts?limit=20&offset=0&userId=UUID`：userId 可省略，limit 1–100；先在数据库过滤权限，再按 createdAt、id 倒序分页，返回 `{items,limit,offset}`。`GET /posts/:id` 返回相同动态结构，无权限 403、不存在 404。`DELETE /posts/:id` 仅作者可操作，他人 403，成功返回 `{deleted:true}`。
- `GET /users/me/image-cards`：返回 `{items}`，按 position 升序。每项含 `id,userId,mediaId,url,type,isPrimary,position,visibility,createdAt`。
- `POST /users/me/image-cards`：`{mediaId,type,visibility?}`，关联本人 post 用途图片；type 为 portrait/physique/outfit/life（交接包 Portrait/Physique/Outfit/Life），visibility 默认 everyone，返回 201 和形象照记录。采用 8 槽，position 为 0–7，自动填入最小空槽；重复图片或满槽返回 409。首张自动成为主形象照。
- `PATCH /users/me/image-cards/:id`：可修改 type、visibility 或提交 `isPrimary:true`，一次事务取消旧主图并设新主图；不接受直接取消主图。`DELETE /users/me/image-cards/:id` 删除本人记录，主图删除后以剩余最小槽位自动补主图；全部删除后列表为空。操作他人记录返回 404。用户行锁与唯一索引保证并发关联不超槽、主图最多一张。

可见性由服务端同时用于动态列表、详情和 `/media/uploads/:id` 下载。everyone 允许已登录陌生人，但双方已有未解锁会话时仍拒绝；friends 使用现有 conversations.unlocked_at 收取回信解锁账本，未解锁或无此关系不可读；only_me 仅作者可读。任一方向屏蔽、作者注销或封禁均阻断他人访问。本人形象照管理列表不受自己的 visibility 影响；他人下载照片必须存在其可见的形象照或动态引用，未发布的 post 上传不能被他人下载。不存在独立好友表，本任务没有新增好友关系接口。

迁移为既有动态补 visibility=only_me，避免将原本仅用于导出的存储内容自动公开；新发布按请求或默认 everyone。附件关联存储于 post_attachments，动态删除级联清理关联；形象照删除只清理其记录。两者都保留 B8 上传元数据与文件，便于本人复用；删除最后一条可见引用后，他人立即失去下载权限，其他独立可见引用继续有效。物理媒体沿用 B9 本人注销清理及 B13 举报证据保留策略；媒体删除同时级联清理动态附件关联和形象照。

验收：专用本机 PostgreSQL 容器、独立数据库及随机 schema 中完整 npm test 共 30 项通过，npm run build 通过；新增测试覆盖千字/六附件边界、非法类型/超大/他人媒体、仅作者删除、分页、自己可见/好友/未解锁/双向屏蔽/封禁、真实媒体读取、八槽并发满槽、设主/删除/补槽/清空与附件引用清理。新迁移 SQL 重复执行及全量迁移入口连续执行两次通过。client/ 无变更；未访问生产数据库，未修改密钥，未推送、合并或切分支。

任务 #68 合并验收：基于与远端 main 一致的 `b2e74dc` 解决 B14/B16 路由注册、媒体权限及本 README 的冲突，同时保留 B14 资料与头像槽位。B16 迁移顺延为 `015_posts_image_cards.sql`，避免与 main 的 `014_profiles.sql` 编号重复，测试及文档引用同步更新。专用 PostgreSQL 16 容器的独立数据库中，完整迁移连续两次通过，完整 npm test 共 40 项全部通过（无失败、无跳过），npm run build 通过；动态/形象照路由、迁移及测试文件均已核对存在。仅修改 maugo/，未接触生产数据、client/ 或密钥。当前结果位于 codex/task-68，按任务指示由 runner 提交、合入 main 并推送；合入后 main 自查仍需 runner 执行。验收结论仅发布到 Issue #53。

## B17 动态业务分类与已发布动态更新（任务 #72 / Issue #56）

`016_posts_category.sql` 为 `user_posts.category` 增加非空字段，默认 `Life`，数据库 CHECK 限定 `Life / Portrait / Style / Outfit`。创建动态可选 `category`，省略时为 `Life`；创建、列表、详情及更新响应均带 `category`。列表接受 `category` 分类过滤，`All` 或省略时不过滤，可与 `userId`、分页组合使用。

`PATCH /posts/:id` 接受 `visibility` 和/或 `category`，至少一项；可见范围沿用 `everyone / friends / only_me`。仅作者能更新，返回含附件的完整动态；未登录 401、他人修改 403、不存在 404、非法枚举或空更新 400。现有服务端动态列表、详情与媒体权限规则继续执行。

2026-11-13 验收：专用本机 PostgreSQL 16 容器 `maugo-task72-test`、隔离数据库 `maugo_b17_test`，各集成测试使用随机 schema；未连接生产数据库。最终完整后端测试 **43/43 通过，0 失败、0 跳过**，TypeScript 构建通过，全量迁移入口连续两次执行通过。

| 验收项 | 逐项证据（`test/posts.test.ts`） | 结果 |
| --- | --- | --- |
| 016 迁移与旧数据 | B17 migration 用例模拟已有 015 动态后执行 016 两次，旧行回填 Life，数据库拒绝非法分类（23514） | 通过 |
| 创建默认及四分类、详情和列表返回 | B17 create/list/detail 用例逐一创建四分类并核对详情与列表字段，省略分类返回 Life | 通过 |
| 分类过滤及 All | 同一用例断言分类过滤结果全部匹配分类及作者，All 与省略参数的完整响应一致且含四分类 | 通过 |
| 作者更新及返回内容 | B17 author updates 用例分别只改分类、只改可见范围、同时修改两者，核对未指定字段保留及附件响应 | 通过 |
| 鉴权和错误状态 | 同一用例断言未登录 401、他人修改分类/范围均 403、不存在 404；创建/过滤/更新非法值及空更新均 400 | 通过 |
| 更新后服务端权限 | 同一用例将公开动态改为 only_me 后，陌生人详情/媒体 403、分类列表不包含该动态，作者仍可读；改 friends 后已解锁好友可读详情/媒体，陌生人仍 403；恢复 everyone 后陌生人详情与分类列表恢复可见 | 通过 |
| 既有 B16 权限回归 | 原有 publishing 用例继续覆盖待解锁会话、好友账本、双向屏蔽与封禁；原有附件、形象照、删除测试全部通过 | 通过 |

失败清单：本次 B17 后端验收无失败项。仍未通过/未复验：D5 `moments-category-empty`、`moment-options` 的客户端接入与界面复验；本任务仅补后端契约，未修改 `client/`，不据此将 D5 16/18 改记为 18/18。未添加依赖，未部署到生产，未推送代码。
