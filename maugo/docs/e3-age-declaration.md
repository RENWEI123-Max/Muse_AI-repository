# E3：18+ 年龄申报与 UGC 验收留档

日期：2026-11-13；范围：仅 MauGo 后端 E3，分支 codex/task-94。

## 年龄申报值

| 项目 | 申报值 | 依据 |
| --- | --- | --- |
| Dating and Relationships | Yes | 交友、开场白、信件与回信功能 |
| Shared Location | No | 当前不共享实时位置；资料中的城市是用户自报字段，不是实时定位共享。若日后加距离/附近展示必须重评。 |
| 目标年龄 | 18+ | 沿用 B2 已有年龄逻辑，未修改 App Store Connect |

核查结果：`src/profiles.ts` 的资料更新接口拒绝小于 18、大于 100 及非整数年龄；`client/src/components/ProfileFlow.vue` 只读核查发现编辑校验及输入范围为 18–100。`005_discovery.sql` 的非空年龄值约束为 18–120，`src/discovery.ts` 的筛选下限为 18，均不会接受小于 18 的年龄值。真实 HTTP 验证资料年龄 17 返回 400、18 返回 200。

现有边界如实记录：年龄为自报值，数据库允许年龄为空，注册接口没有强制出生日期/年龄门禁，也未接入年龄真实性认证。本任务按 B2 已实现逻辑核查，不将范围校验描述为身份证明或完整注册年龄验证。不修改客户端及商店控制台。

## 通过清单

- [x] 开场白及信件使用 `/conversations/:peerId/opening`，回信/聊天文字使用 `/conversations/:id/messages`，动态文字使用 `/posts`，均由服务端统一检查。
- [x] 英文、韩文辱骂；电话、微信、Telegram、外链与邮箱；广告引流命中均明确返回 422 和命中类型，没有静默丢弃。测试覆盖全角和零宽字符规范化、正常中韩文放行、英文单词误命中回归。
- [x] 规则集中在 `src/moderation.ts`，通过环境变量 `UGC_FILTER_EXTRA_PATTERNS` 按 `abuse`、`contact`、`advertising` 增补正则数组；例如 `{"advertising":["custom campaign"]}`。配置在应用启动时加载。当前采用规则命中直接拒绝方案，不把被拒内容送入人工队列；人工举报沿用 B7 队列。规则匹配不等于覆盖所有自然语言变体。
- [x] 新增迁移 `020_content_filter.sql`：审计表仅含记录 ID、命中类型数组、内容 SHA-256 摘要和时间；不存原文、密码、令牌或完整请求。命中审计独立提交，拒绝提交不会回滚命中记录。数据库断言确认 54 条命中均持久化且没有发布内容。
- [x] 复用真实举报和管理员审核接口：pending → processed，处理动作为 suspend；数据库账号标志真实更新。信件列表/详情、收件箱正文/摘要、待收取回信和动态列表隐藏被封禁作者内容，账号提交及其回信收取返回 403。没有删除历史内容和用户数据。
- [x] 新测试 `test/e3-compliance.test.ts` 启动真实 HTTP 监听，使用 fetch 调用真实 Fastify 路由与 PostgreSQL，无接口 mock。用户、会话和举报均为专用隔离测试数据；管理员角色通过隔离库建数，不增加提权接口。用于演示的正常开场白由人工举报并判定，仅证明处理链路，不声称该正常文字应触发自动过滤。
- [x] 新建专用容器 `maugo-task94-test`（PostgreSQL 16），数据库 `maugo_e3_94`，仅监听本机 5494；各测试另建随机 schema。未使用线上库、未改已有账号密码和密钥，未清空或删除数据，保留测试库便于复核。
- [x] `npm run build` 通过；`tsc --noEmit` 通过；全套 `npm test` 共 51 项通过、0 失败、0 跳过。数据库集成测试均连接上述新库；既有纯单元测试保留原样。旧 discovery 测试只补充审核迁移依赖，未改变其断言。
- [x] 未修改 client、未新增依赖、未操作 D10/E1/E2/E4、未自行提交/推送/合并或切换分支。上线需通过现有迁移命令应用 020 迁移。

## 失败清单

- 功能、构建、类型检查及测试：无。
- Issue 评论未发布。卡住了：对 `RENWEI123-Max/Muse_AI-repository` 的 Issue #94 执行读取和评论提交均得到 GitHub API `404 Not Found`，现有凭据无法确认或写入该 Issue。需要 Smith 确认正确 Issue 地址并赋予该仓库的 Issue 写权限，或由 runner 代发本文件的通过/失败清单；不能声称评论已成功。没有暴露访问令牌。

## 真实 HTTP 演示与队列日志

以下为最终全套测试输出中的请求/响应节选；省略授权头，不含测试令牌或密码。包括处理前可见状态、过滤拒绝、年龄边界、举报与管理员队列、处理结果、处理后隐藏与账号限制。完整日志在本次服务器 `/tmp/maugo-e3-suite.log`；此处保留可随代码交付的关键证据。

```jsonl
{"method":"POST","url":"/conversations/5856eda7-5af4-4190-ae18-f346168d1b92/opening","payload":{"content":"Hello, 안녕하세요. Nice to meet you!"},"status":201,"response":{"id":"15e57cf2-d191-4a8c-9a52-af524064ba4f","messageId":"b6350145-68a4-4e17-a732-0d593e70c054","openingMessageId":"b6350145-68a4-4e17-a732-0d593e70c054","openerId":"d0878801-d267-4072-8115-d321d0d0afb5","peerId":"5856eda7-5af4-4190-ae18-f346168d1b92","unlocked":false,"unlockedAt":null}}
{"method":"POST","url":"/posts","payload":{"content":"You are an idiot"},"status":422,"response":{"message":"Content rejected by server moderation","types":["abuse"]}}
{"method":"POST","url":"/posts","payload":{"content":"씨발"},"status":422,"response":{"message":"Content rejected by server moderation","types":["abuse"]}}
{"method":"POST","url":"/posts","payload":{"content":"call +82 10-1234-5678"},"status":422,"response":{"message":"Content rejected by server moderation","types":["contact"]}}
{"method":"POST","url":"/posts","payload":{"content":"WeChat: friend_123"},"status":422,"response":{"message":"Content rejected by server moderation","types":["contact"]}}
{"method":"POST","url":"/posts","payload":{"content":"텔레그램 친구"},"status":422,"response":{"message":"Content rejected by server moderation","types":["contact"]}}
{"method":"POST","url":"/posts","payload":{"content":"example.xyz"},"status":422,"response":{"message":"Content rejected by server moderation","types":["contact"]}}
{"method":"POST","url":"/posts","payload":{"content":"할인 코드 구매 문의"},"status":422,"response":{"message":"Content rejected by server moderation","types":["advertising"]}}
{"method":"POST","url":"/posts","payload":{"content":"custom campaign"},"status":422,"response":{"message":"Content rejected by server moderation","types":["advertising"]}}
{"method":"GET","url":"/letters/b6350145-68a4-4e17-a732-0d593e70c054","status":200,"response":{"openingMessageId":"b6350145-68a4-4e17-a732-0d593e70c054","conversationId":"15e57cf2-d191-4a8c-9a52-af524064ba4f","content":"Hello, 안녕하세요. Nice to meet you!","createdAt":"2026-11-13T09:00:12.252Z","sender":{"id":"d0878801-d267-4072-8115-d321d0d0afb5","displayName":"Reader","deleted":false,"avatar":null,"city":null,"age":null,"gender":null},"replied":true,"unlocked":false,"unlockedAt":null,"state":"letter-waiting","canReply":false,"canChat":false}}
{"method":"GET","url":"/conversations/15e57cf2-d191-4a8c-9a52-af524064ba4f/messages","status":200,"response":{"items":[{"id":"b6350145-68a4-4e17-a732-0d593e70c054","kind":"opening","content":"Hello, 안녕하세요. Nice to meet you!","senderId":"d0878801-d267-4072-8115-d321d0d0afb5","mine":false,"mediaId":null,"createdAt":"2026-11-13T09:00:12.252Z"},{"id":"52582385-12e9-4a31-9c72-56e4f819646e","kind":"reply","content":"반가워요, have a lovely day","senderId":"5856eda7-5af4-4190-ae18-f346168d1b92","mine":true,"mediaId":null,"createdAt":"2026-11-13T09:00:13.074Z"}],"hasMore":false,"unlocked":false}}
{"method":"PATCH","url":"/profiles/me","payload":{"age":17},"status":400,"response":{"message":"Enter a name and an age between 18 and 100."}}
{"method":"PATCH","url":"/profiles/me","payload":{"age":18},"status":200,"response":{"id":"d0878801-d267-4072-8115-d321d0d0afb5","displayName":"Reader","age":18,"city":null,"bio":"","visibility":"everyone","avatar":null,"avatars":[],"following":false,"permissions":{"canOpen":false,"canChat":false,"canFollow":false,"conversationId":null},"recentlyRemoved":[]}}
{"method":"GET","url":"/conversations/a8a14ee9-e2af-4980-bbc6-a5781b0d71c8/replies/pending","status":200,"response":{"items":[{"id":"88f35ffb-9144-4fba-aad2-d791aeaabf2a","createdAt":"2026-11-13T09:00:13.147Z"}],"hasMore":false,"freeRemaining":10,"used":0,"nextCost":0,"diamonds":0}}
{"method":"POST","url":"/reports","payload":{"reportedUserId":"d0878801-d267-4072-8115-d321d0d0afb5","messageId":"b6350145-68a4-4e17-a732-0d593e70c054","category":"harassment","reason":"Manual review of opening"},"status":201,"response":{"id":"51fe8bfe-3ac6-41a4-bf90-2e3cad27815e","reporterId":"5856eda7-5af4-4190-ae18-f346168d1b92","reportedUserId":"d0878801-d267-4072-8115-d321d0d0afb5","messageId":"b6350145-68a4-4e17-a732-0d593e70c054","attachmentMediaId":null,"attachment":null,"category":"harassment","reason":"Manual review of opening","status":"pending","createdAt":"2026-11-13T09:00:13.186Z","action":null,"result":null,"handledBy":null,"handledAt":null}}
{"method":"GET","url":"/admin/reports?status=pending","status":403,"response":{"message":"Moderator required"}}
{"method":"GET","url":"/admin/reports?status=pending","status":200,"response":{"items":[{"id":"51fe8bfe-3ac6-41a4-bf90-2e3cad27815e","reporterId":"5856eda7-5af4-4190-ae18-f346168d1b92","reportedUserId":"d0878801-d267-4072-8115-d321d0d0afb5","messageId":"b6350145-68a4-4e17-a732-0d593e70c054","attachmentMediaId":null,"attachment":null,"category":"harassment","reason":"Manual review of opening","status":"pending","createdAt":"2026-11-13T09:00:13.186Z","action":null,"result":null,"handledBy":null,"handledAt":null}]}}
{"method":"POST","url":"/admin/reports/51fe8bfe-3ac6-41a4-bf90-2e3cad27815e/resolve","payload":{"decision":"approve","action":"suspend","result":"Confirmed violation; account suspended"},"status":200,"response":{"id":"51fe8bfe-3ac6-41a4-bf90-2e3cad27815e","reporterId":"5856eda7-5af4-4190-ae18-f346168d1b92","reportedUserId":"d0878801-d267-4072-8115-d321d0d0afb5","messageId":"b6350145-68a4-4e17-a732-0d593e70c054","attachmentMediaId":null,"attachment":null,"category":"harassment","reason":"Manual review of opening","status":"processed","createdAt":"2026-11-13T09:00:13.186Z","action":"suspend","result":"Confirmed violation; account suspended","handledBy":"3ffce2fd-a545-448b-97a3-6edd5d973371","handledAt":"2026-11-13T09:00:13.231Z"}}
{"method":"GET","url":"/admin/reports?status=pending","status":200,"response":{"items":[]}}
{"method":"GET","url":"/admin/reports?status=processed","status":200,"response":{"items":[{"id":"51fe8bfe-3ac6-41a4-bf90-2e3cad27815e","reporterId":"5856eda7-5af4-4190-ae18-f346168d1b92","reportedUserId":"d0878801-d267-4072-8115-d321d0d0afb5","messageId":"b6350145-68a4-4e17-a732-0d593e70c054","attachmentMediaId":null,"attachment":null,"category":"harassment","reason":"Manual review of opening","status":"processed","createdAt":"2026-11-13T09:00:13.186Z","action":"suspend","result":"Confirmed violation; account suspended","handledBy":"3ffce2fd-a545-448b-97a3-6edd5d973371","handledAt":"2026-11-13T09:00:13.231Z"}]}}
{"method":"GET","url":"/reports/51fe8bfe-3ac6-41a4-bf90-2e3cad27815e","status":200,"response":{"id":"51fe8bfe-3ac6-41a4-bf90-2e3cad27815e","reporterId":"5856eda7-5af4-4190-ae18-f346168d1b92","reportedUserId":"d0878801-d267-4072-8115-d321d0d0afb5","messageId":"b6350145-68a4-4e17-a732-0d593e70c054","attachmentMediaId":null,"attachment":null,"category":"harassment","reason":"Manual review of opening","status":"processed","createdAt":"2026-11-13T09:00:13.186Z","action":"suspend","result":"Confirmed violation; account suspended","handledBy":"3ffce2fd-a545-448b-97a3-6edd5d973371","handledAt":"2026-11-13T09:00:13.231Z"}}
{"method":"GET","url":"/letters/b6350145-68a4-4e17-a732-0d593e70c054","status":404,"response":{"message":"Letter not found"}}
{"method":"GET","url":"/letters","status":200,"response":{"state":"home-empty","filterState":"filters-free","locked":false,"batchId":"403309b8-fa89-4bde-9017-a0a4206bfb31","items":[],"hasMore":false,"nextOffset":null,"responses":[]}}
{"method":"GET","url":"/conversations/15e57cf2-d191-4a8c-9a52-af524064ba4f/messages","status":200,"response":{"items":[{"id":"52582385-12e9-4a31-9c72-56e4f819646e","kind":"reply","content":"반가워요, have a lovely day","senderId":"5856eda7-5af4-4190-ae18-f346168d1b92","mine":true,"mediaId":null,"createdAt":"2026-11-13T09:00:13.074Z"}],"hasMore":false,"unlocked":false}}
{"method":"GET","url":"/conversations","status":200,"response":{"items":[{"id":"15e57cf2-d191-4a8c-9a52-af524064ba4f","displayName":"Reader","avatar":null,"peerId":"d0878801-d267-4072-8115-d321d0d0afb5","openingMessageId":"b6350145-68a4-4e17-a732-0d593e70c054","remark":"","pinned":false,"muted":false,"hidden":false,"following":false,"background":"","bubble":"","unlocked":false,"status":"waiting","unreadCount":0,"lastMessage":"반가워요, have a lovely day","updatedAt":"2026-11-13T09:00:13.074Z"}],"hasMore":false}}
{"method":"GET","url":"/posts","status":200,"response":{"items":[],"limit":20,"offset":0}}
{"method":"GET","url":"/conversations/a8a14ee9-e2af-4980-bbc6-a5781b0d71c8/replies/pending","status":200,"response":{"items":[],"hasMore":false,"freeRemaining":10,"used":0,"nextCost":0,"diamonds":0}}
{"method":"POST","url":"/conversations/a8a14ee9-e2af-4980-bbc6-a5781b0d71c8/replies/88f35ffb-9144-4fba-aad2-d791aeaabf2a/collect","payload":{},"status":403,"response":{"message":"Account suspended"}}
{"method":"POST","url":"/posts","payload":{"content":"Another normal day"},"status":403,"response":{"message":"Account suspended"}}
{"method":"POST","url":"/conversations/15e57cf2-d191-4a8c-9a52-af524064ba4f/messages","payload":{"content":"Hello again"},"status":403,"response":{"message":"Account suspended"}}
{"database":"maugo_e3_94","schema":"e3_ffebd437818a40ab8e88a61bb9ca1531","auditCount":54,"reportStatus":"processed","accountSuspended":true}
```

## 验证输出

构建和类型检查进程退出码均为 0；构建输出：

```text
> maugo-backend@0.1.0 build
> tsc
```

最终全套真实执行结果：

```text
  type: 'test'
  ...
1..22
# tests 51
# suites 0
# pass 51
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 30414.39934
```
