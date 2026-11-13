# D4 第二轮真实接口复验（Issue #85）

卡住了：接口功能已补齐，24 个状态的功能复验通过；完整 UI 与 D11 级全量动画验收尚未通过，不能宣称整体 24/24 验收完成。Figma 对比独立阻塞，等待 Smith 开放链接分享。

## 基线与改动

2026-11-13，真实后端使用 `/root/Muse_AI-repository` 当前 main `cedc4c6`（已包含 B14/B15/B20/B21），未修改后端业务实现。工作区无可用 Git 元数据，客户端改动保留在 `client/`，提交、合入和推送交由 runner；本次未自行提交、推送或发布 Issue 评论。

仅修改 `src/components/ProfileFlow.vue`、既有真实接口测试及本文件，未新增依赖。

- 他人资料读取 `/profiles/:id`；公开形象照读取 `/profiles/:id/image-cards`，鉴权获取图片并支持大图预览。
- 获赞总数与动态、形象照分类分别显示 B20 的 `likesCount`、`postLikesCount`、`imageCardLikesCount`，不再显示接口不可用提示。
- 粉丝名单读取 `/profiles/me/followers`，每页 100 条，沿用现有会话信息打开资料。
- 访客名单补资料改读 `/profiles/:id/summary`，不再因渲染名单调用会记录访问的公开详情接口。实际打开公开资料仍按后端语义记录访问。
- 星座使用 B21 枚举选择、PATCH 保存、本人及他人资料展示；未选择时不发送字段，不引入后端未提供的清空语义。
- 保留页面和弹层过渡；补充减少动态效果模式，关闭页面动画和弹层过渡。

## 验证与通过清单

Issue #87 补发合入复验（2026-11-13）：指定的 4 个文件已从 `/root/tg-hub/client` 复制到 `/root/worktrees/task-102/client`，基线为 `cedc4c6`。本 worktree 的生产构建（含 343 项素材校验）及独立 vue-tsc 类型检查通过；使用本 worktree `maugo/` 的真实后端、全部 SQL 迁移和新建隔离数据库，Chromium 集成测试通过（1 passed），覆盖下表 24 个状态、5 项真实接口对接及 #80 原 22 项功能回归，无退化。截图保存在本 worktree 的 `client/test-results/d4-round2/`，不纳入交付文件。未重跑离线原型对照；UI 差异、完整 D11 动画验收和 Figma 对比仍保留为范围外未通过或阻塞项。提交、合入 main 与推送由 runner 完成，本次未自行执行，也未发布 GitHub 评论。

任务 #101 合入前复验（2026-11-13）：生产构建、独立 vue-tsc 类型检查均通过；以 `/root/Muse_AI-repository/maugo` 为真实后端运行既有功能测试，通过（1 个集成测试，覆盖下表 24 状态、5 项接口补齐及 #80 原 22 项功能回归）。本次仅运行真实业务测试，未重跑离线原型对照。代码与测试保留在 `/root/tg-hub/client/`；该交付目录无 Git 元数据，按本任务最后指令未自行提交或推送，新建分支、提交、合入 main 与推送交由 runner，尚无合并或远端推送完成证据。

生产构建（含 343 项素材校验、vue-tsc 类型检查）通过。Chromium 375×812 的真实业务测试通过：原 22 项已通过功能无退化，原 2 项部分通过的功能缺口补齐。浏览器未 mock 业务响应；使用原 `buildApp`、全部 main SQL 迁移及全新隔离 PostgreSQL 数据库，既有数据库、文件未删除。测试准备端点仅创建用户、会话和获赞记录。

| # | 状态 | 本轮功能结论 |
|---|---|---|
| 1 | person-profile | 通过：真实头像、公开形象照实际解码及大图预览、动态、星座组合展示 |
| 2 | person-waiting | 通过：待回复时关注禁用 |
| 3 | person-followed | 通过：真实关注关系及可操作状态 |
| 4 | person-no-content | 通过：真实空动态 |
| 5 | person-photo | 通过：真实头像大图解码 |
| 6 | person-safety | 通过：举报/屏蔽菜单入口；不扩大为完整举报/屏蔽链路结论 |
| 7 | profile-empty | 通过：真实空照片 |
| 8 | profile-content | 通过：本人形象照上传后重新读取和解码 |
| 9 | profile-edit | 通过：昵称、年龄、城市、简介及星座保存，刷新重新登录后回显 |
| 10 | profile-invalid | 通过：17 岁不保存，26 岁成功 |
| 11 | avatar-gallery | 通过：真实头像及空槽 |
| 12 | avatar-remove | 通过：确认后真实移除 |
| 13 | avatar-removed | 通过：移除后空槽 |
| 14 | avatar-restore | 通过：真实归档及恢复 |
| 15 | avatar-full | 通过：8 槽满后禁止新增 |
| 16 | avatar-crop | 通过：裁切上传，刷新后头像实际宽度 320 |
| 17 | profile-likes | 通过：动态赞 1、形象照赞 1、总赞 2，分类展示与真实统计一致 |
| 18 | following-empty | 通过：关注空态 |
| 19 | following-list | 通过：真实关注名单并打开资料 |
| 20 | followers-empty | 通过：粉丝空态；另验证非零粉丝名单及打开真实资料 |
| 21 | visitors-empty | 通过：访客空态 |
| 22 | visitors-outgoing | 通过：真实访问名单；重新进入本人页前后 visits（含时间戳）完全一致，摘要补资料不记访问 |
| 23 | my-letters-empty | 通过：真实信件空态 |
| 24 | my-letters | 通过：真实寄出 opening 信件 |

可复跑测试：`tests/d4-reverify.config.ts`、`tests/d4-reverify.spec.ts`、`tests/d4-reverify-server.mjs`；通过 `D4_BACKEND_ROOT` 指向上述后端，`D4_PROTOTYPE_FILE` 指向交接包 MauGo.html。本轮截图写入测试产物 `test-results/d4-round2/`，不覆盖上一轮证据，不新增验收文档。

## UI、动画失败清单及 Figma 阻塞

- 浏览器通过页面实际 `d4-open` 动画及 300ms 时长、弹层连续打开/关闭后无残留、减少动态效果下页面无动画且弹层可开关；弹层沿用 250ms opacity/transform 进入和退出。
- 离线原型仅作辅助对照，不是 Figma 验收。个人页顶栏、形象照上传卡与网格、底部导航及相机字符图标仍有上一轮记录的布局/素材差异，本轮未将其标成视觉通过。
- 未完成 D11 级全部 24 状态逐帧时序、低性能与延迟场景的动画验收，不能将功能测试或静态截图折算为该项通过。
- Figma：blocked，等待 Smith 向当前连接账号开放设计链接；本轮未读取 Figma 节点，不声称视觉或动画与 Figma 一致。此阻塞不影响上述接口功能结论。

供 runner 回贴：接口代码及功能复验已完成，构建与类型检查通过；UI 差异及完整动画验收未通过，Figma 单独阻塞。需要 Smith 开放设计分享以继续设计对照；后端接口不再是本轮阻塞原因。
