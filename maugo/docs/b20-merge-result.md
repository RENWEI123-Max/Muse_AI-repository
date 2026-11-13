# B20 合入验收结果（Issue #83）

完成：2026-11-13，task-96 的 B20 改动已合入基于 main `2ca5a89` 的当前工作树 `/root/worktrees/task-99`，验收全部通过。提交、合并 main 和推送由 runner 执行；本文不宣称这些操作已完成。

## 合入范围

来源为 `/root/tg-hub/task-96/maugo/`，与当前 main 基线一致，无冲突。仅移入 `src/profiles.ts`、`test/profile-b20.test.ts` 和 `test/profile-stats.test.ts`，并新增本文。未修改 client、其他模块或依赖。

- `GET /profiles/:id/image-cards`：读取他人公开形象照，复用资料可见范围、内容可见范围及双向拉黑校验。
- `GET /profiles/me/stats`：新增动态获赞 `postLikesCount`、形象照获赞 `imageCardLikesCount`，保留两者合计 `likesCount` 及现有字段。
- `GET /profiles/me/followers`：按当前登录用户返回粉丝基本资料，支持 limit/offset 分页，过滤不可见账号及双向拉黑关系。
- `GET /profiles/:id/summary`：返回资料基本字段及统计，不新增或更新访问记录，不返回私有访问历史和信件。

迁移复用 main 已有的 `019_profile_stats.sql`（点赞、形象照点赞、访问记录及索引）；来源工作区没有额外迁移，无需重复建表。全量迁移已在新库执行，回归包含 019 重复执行验证。

## 通过清单

| 验收项 | 结果 |
| --- | --- |
| 全量后端回归 | 52/52 通过，0 失败、0 跳过、0 取消 |
| 构建 | npm run build 通过 |
| 类型检查 | tsc --noEmit 通过 |
| 隔离 PostgreSQL | 在现有 PostgreSQL 16 测试容器 maugo-task86-test 内新建 maugo_b20_task99_test，每项测试使用独立随机 schema；未删除数据、修改密码或密钥 |
| 构建产物真实 HTTP | 单独加载 dist 构建产物启动本机服务，B20 专项 1/1 通过 |
| 他人公开形象照 | 真实数据返回公开形象照，friends/only_me 形象照不泄露，空集合正确 |
| 获赞分类 | 真实动态获赞 2、形象照获赞 1、总计 3；删除点赞后统计同步变化 |
| 分页粉丝名单 | 两名真实粉丝分两页返回且无重复，越界与空列表正确，非法分页参数被拒绝 |
| 资料摘要 | 返回真实基本资料、粉丝及获赞统计；首次读取无访问记录，已有记录时再次读取保持记录及时间不变 |
| 权限隔离 | 匿名 401；非好友读取 friends 资料、读取 only_me 资料及被拉黑访问均 403；伪造粉丝 owner 参数被拒绝，统计及信件仍按登录用户隔离 |
| 改动检查 | git diff --check 通过，改动仅在 maugo 的 B20 接口、测试及本文 |

全量回归日志：`/tmp/task99-tests.log`。构建产物真实 HTTP 专项日志：`/tmp/task99-http.log`，临时验证脚本：`/tmp/task99-b20-http.ts`。

## 失败清单及交付状态

验收失败项：无。代码、测试和本文已就绪，等待 runner 提交、合并 main 并推送；未自行提交、切换分支、合并、推送或发送 GitHub 评论。
