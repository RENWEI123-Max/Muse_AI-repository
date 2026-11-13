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
- `POST /conversations/:id/replies/:replyId/collect`：携带非空 `Idempotency-Key`，返回 `{id, cost, content}`。仅会话成员可收取对方的 reply；每个用户按 Asia/Shanghai 自然日（00:00 至次日 00:00）每天前十条不同回复免费，此后每条 10 钻，余额不足返回 402。按用户锁行串行化计数、余额、收取记录及账本，全部同一事务提交。相同键和回复重试返回原结果，键用于其他回复返回 409；不同键重复收取同一回复同样不会重复扣费。免费收取不写扣费账本。

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
