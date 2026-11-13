# 任务 #69：D5 对接 B16 复验结果

结论：**16/18 状态通过，2 项未完全通过，D5 不能标为全部完成。** 真实发布、列表、详情、删除、形象照管理、发布时可见范围与第二账号服务端权限均通过；原型业务分类和已发布动态可见范围修改仍缺后端契约。Issue 评论未发布：当前身份访问任务 Issue 返回 HTTP 404。

## 实现与验证范围

- 业务改动仅在 `client/src/components/MomentsFlow.vue` 和 `ProfileFlow.vue` 的 D5 入口；没有修改 `maugo/`、其他模块业务、依赖或锁文件。
- 形象照直接上传原始图片至 `/media/uploads?purpose=post`，再使用 `/users/me/image-cards` 发布、列表、更新类型、主照片、可见范围及删除。上传图片、贴纸、视频、音频使用真实媒体接口；已发布媒体通过带鉴权的请求加载。
- 动态使用 `/posts` 发布、按真实用户 ID 分页查询，`/posts/:id` 查询详情及删除。无本机模拟发布、模拟列表或模拟权限；本机只保存用户主动保留的未发布草稿，按服务端用户 ID 隔离。无评论气泡或模拟点赞按钮。
- 对照交接包 `04-开发资料/page-states.json` 模块 11、12，以及 `03-成品UI/离线预览/MauGo-手机壳交互版-离线.html` 的布局、颜色、间距和交互：三列照片卡、类型选择、暗色底部弹层、媒体预览、编辑页及删除确认。弹层、页面和列表存在实际过渡；浏览器 `transitionrun` 记录见证据 JSON。业务分类与动态菜单差异单列失败，不算还原通过。
- `npm run build` 通过：343 资源检查、Vue/TypeScript 检查及 Vite 构建。`npm run dev` 由 Playwright 启动并实际提供页面，浏览器完整测试通过（1 个串行端到端用例，32.7 秒；总计 40.6 秒）。测试脚本成功不等于原型 18/18 验收通过。

## 隔离与复现

最终测试数据库：`maugo_d5_task69_1794549883062`。测试每次创建新库并运行全部迁移（含 015），媒体目录也在独立 `/tmp/maugo_d5_task69_…-media` 下；只连接原数据库执行创建测试库，没有读写生产业务表、删除已有数据库、修改既有密码或密钥。测试数据保留，删除流程只针对本次创建的测试内容。

测试入口：`tests/d5.config.ts`、`tests/d5-server.mjs`、`tests/d5.spec.ts`。正常在客户端运行 `npm run test:e2e -- --config tests/d5.config.ts`；后端须已安装现有依赖，并提供测试 PostgreSQL 连接（`TEST_DATABASE_URL` 优先，其次 `DATABASE_URL`）。测试进程只从该连接创建新库，随即切换到新库执行迁移及业务请求。验收环境后端依赖只读，因此使用 `/tmp/task69-backend` 内与当前 worktree 完全相同的后端源码副本；通过 `D5_BACKEND_ROOT` 指定副本，`D5_ENV_FILE` 指定已有连接配置位置，不输出凭证。`diff` 确认源码副本无差异。未安装新依赖。

## 18 状态逐项验收

所有截图均为本次 Chromium 实测生成，存放在本目录的 `d5/` 中；失败项截图只证明现状，不作为通过证据。

| 模块 | 状态 ID | 结果 | 实际验证及截图 |
| --- | --- | --- | --- |
| 11 | card-type | 通过 | 四种类型选择后打开真实文件选择器，原图上传并发布。[截图](d5/card-type.png) |
| 11 | card-options | 通过 | 真实列表中的照片打开菜单，服务端返回首张为主照片。[截图](d5/card-options.png) |
| 11 | card-preview | 通过 | 鉴权下载后的大图真实解码，naturalWidth 大于 0。[截图](d5/card-preview.png) |
| 11 | card-change-type | 通过 | portrait 改 outfit，经 PATCH、GET 及重新登录均保留。[截图](d5/card-change-type.png) |
| 11 | card-visibility | 通过 | 选择 Only me 服务端保存；第二账号下载 403，公开时 200，Friends 解锁前 403、领取回复后 200。[截图](d5/card-visibility.png) |
| 11 | card-remove | 通过 | 确认弹层可取消，确认后真实 DELETE，重新查询不再显示。[截图](d5/card-remove.png) |
| 12 | moments-empty | 通过 | 新测试账号真实列表为空，显示空态。[截图](d5/moments-empty.png) |
| 12 | moments-list | 通过 | 真实 POST 后重新 GET 列表，显示内容、两附件和服务端可见范围。[截图](d5/moments-list.png) |
| 12 | moments-category-empty | **未通过** | 原型要求 Outfit 等业务分类。B16 无 category 字段；当前仅按真实附件类型筛选，可展示 Video 无内容，但不能当作原型 Outfit 分类通过。[现状截图](d5/moments-category-empty.png) |
| 12 | moment-empty | 通过 | 空白编辑器、空内容禁发。[截图](d5/moment-empty.png) |
| 12 | moment-draft | 通过 | 输入文本、实时计数；1000 字启用发布，1001 字禁发；保留后重新登录可恢复。[截图](d5/moment-draft.png) |
| 12 | moment-photo | 通过 | 图片真实上传、预览、关联动态并下载显示；附件可移除。[截图](d5/moment-photo.png) |
| 12 | moment-stickers | 通过 | 使用交接包贴纸素材，选择后作为 PNG 真上传并随动态发布。[截图](d5/moment-stickers.png) |
| 12 | moment-visibility | 通过 | 发布前可选择 Everyone / Friends / Only me，真实请求带 visibility；访问控制由服务端执行。[截图](d5/moment-visibility.png) |
| 12 | moment-leave | 通过 | 保留／丢弃／继续编辑弹层；实测保留后跨重新登录恢复文本草稿。[截图](d5/moment-leave.png) |
| 12 | moment-options | **未完全通过** | 真实动态菜单、删除入口与范围显示已实现；原型的已发布动态范围修改缺少 B16 更新接口，客户端明确禁用该项。[现状截图](d5/moment-options.png) |
| 12 | moment-delete | 通过 | 详情真实 GET 后可取消／确认删除，成功后列表刷新、详情返回 404；重新登录列表无旧内容。[截图](d5/moment-delete.png) |
| 12 | moment-saved | 通过 | 成功提示在真实 POST 201 后展示，并回到重新读取的列表。[截图](d5/moment-saved.png) |

## 额外通过证据

- [真实请求与断言记录](d5/verification.json)：包含最终隔离库名、接口状态码、第二账号实际响应、过渡事件及验收差异，不含账号令牌或数据库凭证。
- [动态详情截图](d5/moment-detail.png)：由真实 `/posts/:id` 返回内容及附件。
- [第二账号动态拒绝截图](d5/visibility-post-denied.png)、[第二账号照片拒绝截图](d5/visibility-card-denied.png)：在第二浏览器登录，再携带其真实令牌直接访问接口，返回 403。第二账号列表不包含私密动态；私密动态附件也返回 403；尝试删除他人动态返回 403。
- Everyone 陌生账号可访问；创建真实未解锁会话后访问变为 403；真实回复并领取后 Friends 动态及形象照媒体可访问，Only me 动态仍 403。这些变化由服务端返回，客户端没有关系判断代码。
- [六附件真实发布截图](d5/limits-six-attachments.png)：第六项后禁用继续添加，POST 后真实列表返回 6 个附件；直接请求 7 附件和 1001 字均被后端 400 拒绝。

## 失败清单与 Smith 决策项

1. `moments-category-empty`：请 Smith 决定安排后端补充业务分类字段及读写契约，还是明确批准以附件类型筛选调整原型验收。本任务禁止改后端，未写本机分类伪装持久化。
2. `moment-options` 的已发布可见范围修改：请 Smith 决定补充动态更新接口，还是明确将范围选择限定为发布前。未采用删除重发冒充原地修改。
3. Issue #69 评论投递：GitHub 返回 404，需 Smith 为执行身份提供该私有仓库 Issue 的访问及评论权限；未声称已经发布评论。待发布内容见下文。

## 待发布 Issue #69 评论

D5 已完成真实 B16 客户端主流程接入，严格原型验收 **16/18**，不能关闭为全部完成。

通过：card-type、card-options、card-preview、card-change-type、card-visibility、card-remove、moments-empty、moments-list、moment-empty、moment-draft、moment-photo、moment-stickers、moment-visibility、moment-leave、moment-delete、moment-saved。逐项证据及截图见 `client/docs/d5-result.md`、`client/docs/d5/`。

失败：moments-category-empty 缺业务分类契约；moment-options 缺已发布动态范围更新接口。需 Smith 决定补后端或调整验收范围。

生产构建、开发服务、隔离 PostgreSQL 上的 Chromium 发布→列表→详情→删除→双账号可见范围验证通过；文字及附件上限、草稿跨登录恢复、真实媒体访问与动画过渡均有测试证据。未改后端、未动生产业务数据、未推送或合并。
