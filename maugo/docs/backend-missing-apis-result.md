# 后端补接口 R06–R25 执行结果

## 执行摘要

基线 `5925716`，分支 `codex/backend-missing-apis`。仅改 `maugo/`，未改客户端、既有迁移、`.env`、数据库配置或 SMTP 配置。新增标未读动作、四个点赞接口及点赞序列化字段；Follow/Pin/Mute、屏蔽、重发只补测试。

构建通过。改动前全量测试 **52 通过 / 1 失败（共 53）**；改动后全量测试 **57 通过 / 1 失败（共 58）**。唯一失败为基线已有的登录 IP 限流断言，未新增失败。五项中前四项验收通过；verify-resend 的新增重发用例通过，但既有 auth 测试仍失败，不能称为五项全部验收通过。

## 五项验收表

| 项目 | 实现位置 / 接口 | 验证与结果 | 结论 |
| --- | --- | --- | --- |
| R09 标未读 | `src/inbox.ts` / `registerInbox` / `PATCH /conversations/:id` 新增 `markUnread:boolean`；true 将当前用户该会话 `read_at` 置 NULL，false 不操作，仍返回 `rows()` 中同一行 | `test/inbox.test.ts`：1/1 通过；已读 0 → 标未读 1 → 再已读 0，SQL 确认持久化 NULL，false 保留已读时间，复用非成员 PATCH 404 | 通过 |
| R11/R12 Follow/Pin/Mute | 复用 `registerInbox` 中既有 PATCH 与 GET；无此项生产代码变更 | 同一个 `inbox.test.ts`：1/1 通过；PATCH 三字段 true、GET 同一行 true、friends 出现；PATCH false、GET false、friends 消失；对方列表不受影响 | 通过 |
| R16 点赞 | `src/posts.ts` / `registerPosts` 四个 PUT/DELETE 路由及 `likeState`、`post`、`card`；`src/profiles.ts` / `registerProfiles` 的公开照片卡 SELECT | `test/likes.test.ts`：4/4 通过（1 父测试 + 3 子测试）；动态/照片卡全流程、重复 PUT/DELETE、双用户计数 2、本人及另一浏览者序列化、stats 变化、401/400/404/403 均覆盖；既有 `posts.test.ts` 8/8、`profile-stats.test.ts` 1/1、`profile-b20.test.ts` 1/1、`profile-visibility.test.ts` 1/1 通过 | 通过 |
| R14 屏蔽持久化 | 复用 `src/moderation.ts` 既有接口与 `src/profiles.ts` 的 `profileAccess`；未改 moderation 生产代码 | `test/moderation.test.ts`：1/1 通过；保留现有落库/幂等/举报处理/解屏恢复验证，新增屏蔽后双方 GET 对方资料 403；现有 `profile-visibility.test.ts` 未找到等价 block 用例，因此新增 | 通过 |
| R15 verify-resend | 复用 `src/auth.ts` / `registerAuth` / `POST /auth/code/send` 与 `/auth/code/verify`；未改生产代码 | `test/auth.test.ts`：新增 resend 子测试 1/1 通过；将 `sent_at` 拨回 61 秒，再 send 200，旧码 401、新码 200。整个文件 1 通过 / 1 失败（子测试通过、父测试失败），唯一失败与基线一致 | 部分通过：新增用例通过，既有 auth 全通过条件未满足 |

表中共享测试只计一次，文件通过数包含 Node 测试运行器计入的父/子测试；全量总数以原始日志为准。

## 点赞契约

- `PUT /posts/:id/like` → 200 `{postId, liked:true, likesCount}`；`DELETE` 同路径 → 200 `{postId, liked:false, likesCount}`。
- `PUT /image-cards/:id/like` → 200 `{imageCardId, liked:true, likesCount}`；`DELETE` 同路径 → 200 `{imageCardId, liked:false, likesCount}`。
- 使用已有 `post_likes` / `image_card_likes`：PUT `ON CONFLICT DO NOTHING`，DELETE 未赞也成功。不需要迁移。
- 不存在 404，不可见 403；动态复用 `contentVisible`；照片卡同时要求 `visibility='everyone'` 和 `contentVisible`，本人也走同样条件。两种方法均先校验可见性。
- `post()`、`card()` 所有调用路径（创建、列表、详情、修改返回）增加整数 `likesCount` 与当前请求者的布尔 `liked`；`GET /profiles/:id/image-cards` 同样增加这两字段，不改原字段。

## 基线失败证据与验证方式

所有构建和测试由本机执行者通过允许联网/访问数据库的直接命令运行，长命令放在既有 tmux `backend-missing-apis` 会话的新窗口中；未依赖沙箱内数据库结果。本次执行器本身位于目标 Mac 的仓库，无需另开 SSH。启动进程核对确认唯一匹配的 `codex exec --approve-for-me ... < /dev/null` 是本次执行器，没有另起重复任务；目标分支起始无超出基线的提交，远端起始无同名分支。

| 轮次 | 命令（在 maugo/） | 退出码 | 通过 / 失败 | 原始证据 |
| --- | --- | --- | --- | --- |
| 修改前基线 | `npm test` | 1 | 52 / 1 | [baseline](backend-missing-apis-baseline.txt) |
| 缺失能力 RED | `npx tsx --test test/inbox.test.ts test/likes.test.ts test/moderation.test.ts test/auth.test.ts` | 1 | 预期失败：markUnread 400、点赞路由 404；另有同一基线 auth 失败 | 执行时原始日志 `/tmp/backend-missing-apis-red.log` |
| 实现后定向 | 同上 | 1 | 7 / 1 | 执行时原始日志 `/tmp/backend-missing-apis-focused.log` |
| 最终构建 | `npm run build` | 0 | tsc 通过 | [build](backend-missing-apis-build.txt) |
| 最终全量 | `npm test` | 1 | 57 / 1 | [final](backend-missing-apis-final.txt) |

唯一失败：`B2 authentication routes with real PostgreSQL`。

```text
基线 auth.test.ts:96:118：401 !== 429（actual 401 / expected 429）
最终 auth.test.ts:106:118：401 !== 429（actual 401 / expected 429）
```

存档日志仅规范化行尾空格及首尾空行，未改测试内容或错误堆栈。两处是同一条旧断言；仅因前面插入了 10 行新测试而移动。基线和最终日志均保留完整堆栈。原因已定位：`src/auth.ts` 的 `/auth/login` 调用 `limit(req.ip,address,'login',1000)`，旧测试循环 11 次并期望第 11 次 429。它与本次标未读、点赞改动无关；任务明确本项不改生产代码，故未擅自更改阈值或放宽旧断言。

该父测试在失败点之后的断言不会继续执行：登录邮箱限流、code-send 两维度每小时限流、Apple 断言、未配置 SMTP 的 503 在本轮均未运行，不能据文件中已有代码宣称它们已通过。发送 200、60 秒重发 429、验证失效/过期、SMTP 注入失败 503 在失败点之前已执行；新增重发子测试也已通过。

## 边界、未实现与存疑点

1. `markUnread` 字段名由本任务指定，采用既有 `clearHistory` 动作布尔风格；没有新增其他产品规则。
2. 未读数仅统计已收取且满足既有可见性/清历史条件的回复。没有任何已收取回复时，标未读后仍为 0，这是原有语义；不是强制显示未读标记。
3. Follow/Pin/Mute 后端已存在；R12 详情页 disabled 属客户端门控，本任务未修客户端。waiting 会话服务端仍允许这三项偏好，不自行加门禁；是否限制仍待另行产品决定。
4. 允许给自己的可见内容点赞。自己的 only_me 动态在 `contentVisible` 下可见，所以允许；自己的非 everyone 照片卡仍不满足额外条件，因此 403。文档没有额外禁止自赞规则。
5. 真实邮件投递依赖 Smith 上架前配置 `SMTP_HOST/PORT/USER/PASS/FROM`，本任务未配置或验证真实邮件投递，未写入 SMTP 密码。源码核对发现任务描述与现有返回体有差异：未配置 SMTP 实际抛出 503，由错误处理器返回 `{message:"SMTP configuration unavailable or delivery failed"}`，并非 `{sent:false}`；`sent:true` 只在成功发送时返回。这不影响重发接口已存在的结论。按“不改已有接口契约/本项不改生产代码”保留现状；本轮对应旧断言被上述基线失败提前阻断。
6. 独立代码审查无 Critical/Important 问题；Minor 延后项：生产验证码允许随机碰撞，约 1/999999 的概率重发得到相同数字，新增测试按任务要求断言新旧不同，存在同等概率的偶发失败。未为此修改 auth 生产代码或引入随机生成控制；跨重发是否强制数字不同仍无既有保证。

## 交付核对

- 仅 `maugo/` 后端、测试及文档；无 `client/` 变更，无迁移修改，无环境配置修改。
- `git diff --check` 通过；独立审查已完成，Minor 如上记录。
- 依任务要求提交并推送 `origin codex/backend-missing-apis`，以 `git ls-remote` 对照本地 HEAD 核实，最终 SHA 与干净工作树检查在交付汇报中给出。
- 未开 GitHub Issue，未发 Telegram。
