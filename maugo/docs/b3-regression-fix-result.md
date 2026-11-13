# B3 全量回归修复结果（任务 #87）

完成：2026-11-13，修复 main 已存在的 B3 双向并发开场白死锁。完整后端回归、构建与类型检查全部通过。本任务未引入 task-86，也未修改 B19 实现；B19 合入和最终验收仍由后续任务处理。

## 复现与根因

`/root/worktrees/task-86/maugo/docs/b19-result.md` 已不存在。读取保留的 `/tmp/task86-baseline-b3.log`，确认原失败为 `B3 durable opening ledger and concurrent devices on real PostgreSQL`：20 个双向 opening 请求中混入 HTTP 500，违反只允许一次 201、其余 409 的断言。

当前分支首次完整回归偶然通过（44/44），单跑 B3 也通过，说明问题依赖并发时序。为现有 B3 用例在隔离 schema 内加入临时 BEFORE INSERT 触发器，插入会话前延迟 200ms，让反向请求获得认证行锁；请求结束后移除触发器及函数。没有修改或放宽任何断言，也没有删除用例。保留旧代码运行完整回归，得到 43 通过、1 失败，唯一失败即上述 B3 用例，响应包含 `Internal server error`。

PostgreSQL 测试容器日志明确报 `deadlock detected`（SQLSTATE 40P01）：

- A 请求持有 A 用户的认证 `FOR UPDATE` 锁和排序用户对 advisory lock。
- B 请求持有 B 用户的认证 `FOR UPDATE` 锁，等待同一个用户对锁。
- A 插入 conversations 时，外键校验需要 B 用户的 `FOR KEY SHARE` 锁，与 B 的认证行锁冲突，形成循环等待。

## 最小修复

`src/app.ts` 将共享认证查询的行锁改为 `FOR NO KEY UPDATE`。它仍排斥同用户的其他写事务，保留钱包、额度、幂等和资料修改的串行化，同时兼容外键所需的 KEY SHARE，解除该循环；未增加死锁重试、异常吞并或更改接口状态码。排序用户对锁、唯一索引、鉴权条件和事务边界保持原样。

`test/conversations.test.ts` 保留并发窗口，继续严格核对 20 次双向请求只有一次创建、其余冲突，以及会话/消息数量、12 次双设备并发、历史清理后账本权限、屏蔽、收取解锁和过期认证。

## 验证

使用本机专用 PostgreSQL 16 容器 `maugo-task72-test`，新建独立数据库 `maugo_b3_task87_test`；各集成测试使用随机 schema，未连接生产数据库、删除数据或修改凭据。

| 验证项 | 结果 |
| --- | --- |
| 修复前扩展并发窗口的全量 `npm test` | 43/44，通过复现 B3 唯一失败 |
| 修复后完整 `npm test` | 44/44，0 失败、0 跳过 |
| 修复后 B3 专项重复执行 | 连续 5 次通过 |
| `npm run build` | 通过 |
| `npx tsc --noEmit` | 通过 |
| 全量迁移重复执行 | 全量测试 core-e2e 中连续两次通过，迁移记录不重复 |
| `git diff --check` | 通过 |

改动仅为认证锁、B3 测试、本结果文档及 README；无新依赖、client 变更、B19 合入、部署、推送或合并。失败清单为空。以上结论针对当前 main 基线上的后端 B3 修复，不代替尚未合入的 B19 最终回归。
