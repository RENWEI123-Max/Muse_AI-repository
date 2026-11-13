# B21 合入验收结果（Issue #84，来源 Issue #82）

已将 `/root/tg-hub/task-97/maugo/` 的 B21 相关改动整合到基于 main `2ca5a89` 的当前工作分支 `codex/task-98`。仅修改 MauGo 资料接口、星座迁移、相关测试及本结果文档；未修改 client/，未增加依赖。当前基线未包含 B20，整合无冲突，未覆盖 task-96 工作区。

## 接口契约

`021_profile_zodiac.sql` 为 users 增加可空 zodiac，数据库 CHECK 与 PATCH 校验均限定 Aries、Taurus、Gemini、Cancer、Leo、Virgo、Libra、Scorpio、Sagittarius、Capricorn、Aquarius、Pisces。未设置时 GET 返回 null；本人和有权限的他人均可读取。PATCH 省略 zodiac 或传 null 均不修改已有值，不支持清空；若需支持清空，须由 Smith 明确调整契约。

## 通过清单

2026-11-13 在 PostgreSQL 16 测试容器 `maugo-task97-test` 中新建专用数据库 `maugo_b21_merge_98`，测试使用独立随机 schema，未连接生产库。

| 验收项 | 结果 |
| --- | --- |
| 全量后端回归 | 52/52 通过，0 失败、0 跳过、0 取消 |
| TypeScript 构建及独立无输出类型检查 | 均通过 |
| 完整迁移入口连续执行两次 | 通过，第二次不重复应用迁移；全量回归另核对迁移记录保持不变 |
| B21 SQL 迁移重复执行、旧用户默认空值 | 通过 |
| 真实 HTTP 设置全部 12 星座 | PATCH 响应、本人 GET、他人 GET 与数据库实际值一致 |
| 非法值拒绝 | 小写、非星座、空字符串、前后空白、数字、布尔、数组及对象均返回 400，原星座与 bio 不变；数据库非法值被 CHECK 拒绝 |
| null 与省略契约 | 未设置时保持 null；已有值保持不变 |
| 既有功能 | 资料、头像、可见性、统计及其余后端回归全部通过 |
| 差异检查 | 通过，无空白错误 |

## 失败清单与交付状态

最终验收无失败项。首次受限环境运行因 tsx 本地 IPC 权限限制未启动，获执行权限后完整重跑通过。

代码及验收已完成，待 runner 提交、合入 main 并推送；遵循本任务的最终执行约束，本代理未切换分支、未自行提交、合并或推送，未向 GitHub 发表评论。不将待 runner 执行的操作报告为已完成。
