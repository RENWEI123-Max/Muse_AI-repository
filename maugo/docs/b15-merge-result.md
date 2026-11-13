# B15 合入验收结果（任务 #91）

完成 B15 改动迁入当前工作分支及全部验收。当前 worktree 为 `/root/worktrees/task-91`，分支 `codex/task-91`，基于 main `e72da61`。来源为 `/root/tg-hub/task-90` 的未提交 B15 实现及其 `maugo/docs/b15-result.md`，基线相同，迁入无冲突。仅修改 MauGo 的 B15 代码、迁移、测试及本验收文档，未改 client、其他业务模块或依赖。

## 改动与口径

- `src/profiles.ts`：新增 `GET /profiles/me/stats`，从数据库实时返回 `followingCount`、`followersCount`、`likesCount`、`visits`、`letters`；空态为 0 和空数组。复用现有关注状态和 opening 信件，获赞合计本人动态与形象照的点赞。
- 成功读取他人资料时记录最近一次访问；本人访问、私密资料拒绝和不存在资料不产生访问记录。访问记录只包含当前用户参与的访问，信件只包含当前用户发送的 opening，不含他人信件或回信。
- `server/migrations/019_profile_stats.sql`：新增动态点赞、形象照点赞和资料访问表及索引，可重复执行。
- `test/profile-stats.test.ts`：真实 HTTP 与 PostgreSQL 专项；另补充指定他人 ID 的统计路径返回 404。既有资料可见性测试补载 019 迁移。

## 验证结果

2026-11-13，在专用容器 `maugo-task91-test` 的独立 PostgreSQL 16 数据库 `maugo_b15_task91_test` 验证，端口仅绑定本机 5491。未使用已有应用数据库，未删除已有数据或修改密码、密钥。B15 随机 schema 留在该测试库中供复查。

- 全量回归：50/50 通过，失败、取消、跳过均为 0；日志 `/tmp/task91-tests.log`。
- TypeScript 构建与 `tsc --noEmit` 均通过；`git diff --check` 通过。
- B15 使用监听随机本机端口的 Fastify 与原生 fetch，真实 HTTP 空态返回三个 0 和两个空数组；有数据返回关注 1、粉丝 1、获赞 3、访问 2 条、本人信件 1 条。取消关注和撤销点赞后实时返回粉丝 0、获赞 2。
- 第三方访问及他人信件不泄露；伪造 `userId` 仍仅返回登录者自己的数据；请求他人统计路径返回 404；匿名和无效凭据返回 401，封禁返回 403，读取私密资料返回 403。重复访问不增加记录数，019 迁移重复执行通过。

## 提交与发布交接

按本任务最终指令，未自行提交、切分支、合并 main 或推送。代码及验收结果已就绪，由 runner 自动提交、合并并推送；本报告不声称远端 main 已更新。
