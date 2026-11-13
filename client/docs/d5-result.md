# 任务 #75：D5 接 B17 补缺复验

结论：**18/18 状态通过，原有 16 项回归通过，两项缺口已补齐。** 分类由服务端筛选，作者已发布动态的分类与可见范围可修改并立即回读；非作者不显示选项。失败清单：无。

## 实现范围

仅修改 `client/src/components/MomentsFlow.vue`、现有 D5 测试、本文与 `client/docs/d5/` 截图和证据；未修改 maugo/、依赖、锁文件或其他业务模块。

- 分类使用 B17 的 Life / Portrait / Style / Outfit，发布携带 category，草稿保留分类；列表和详情显示服务端 category。筛选直接发送 GET /posts?category=，All 使用 B17 的不过滤语义，分页沿用当前分类。
- 作者菜单可改可见范围或分类；每次 PATCH /posts/:id 后立即 GET /posts/:id，再重新 GET 当前分类列表，显示服务器返回值。非作者不显示菜单，服务端拒绝越权修改。
- 对照交接包模块 11 / 12 和手机壳离线原型：分类空态使用原型 female-4 鸟素材、主提示和副文案；分类按钮颜色、列表与空态淡入位移、菜单打开关闭及子菜单切换均有实际过渡。浏览器 transitionrun 证据跨重新登录保留。未声称完成在线 Figma 核验。

## 验证环境

构建通过（343 资源校验、Vue/TypeScript 和 Vite）；开发服务由 Playwright 实际启动。现有 `tests/d5.config.ts`、`tests/d5-server.mjs`、`tests/d5.spec.ts` 在真实 B17 后端上执行完整串行 Chromium 验收，用真实注册的作者与另一账号，不模拟业务接口或权限。

后端源码从本次仓库复制到 `/tmp/task75-backend`，仅复用现有依赖，未改后端；D5_BACKEND_ROOT 指向该目录，D5_ENV_FILE 指向已有后端连接配置。每次测试创建全新隔离库，执行全部迁移（含 016 分类与当前后续迁移），媒体目录单独放在 /tmp；未读写生产业务表，未删除已有数据库，未修改密码或密钥。最终库名与耗时见下方最终记录及 [verification.json](d5/verification.json)。

复现入口：客户端 `npm run test:e2e -- --config tests/d5.config.ts`；需要已有 PostgreSQL 连接及后端现有依赖。测试仅从连接创建新库后切换到隔离库。

## 18 状态逐项验收

以下截图均由本次真实浏览器验收生成，存放在 client/docs/d5/，随代码交付。

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
| 12 | moments-category-empty | 通过 | 四类筛选调用真实 GET /posts?category=；Portrait 返回改类后的动态，Life / Style / Outfit 返回空列表，显示原型鸟形素材及双行提示。[空态](d5/moments-category-empty.png)、[分类列表](d5/category-portrait.png) |
| 12 | moment-empty | 通过 | 空白编辑器、空内容禁发。[截图](d5/moment-empty.png) |
| 12 | moment-draft | 通过 | 输入文本、实时计数；1000 字启用发布，1001 字禁发；保留后重新登录可恢复。[截图](d5/moment-draft.png) |
| 12 | moment-photo | 通过 | 图片真实上传、预览、关联动态并下载显示；附件可移除。[截图](d5/moment-photo.png) |
| 12 | moment-stickers | 通过 | 使用交接包贴纸素材，选择后作为 PNG 真上传并随动态发布。[截图](d5/moment-stickers.png) |
| 12 | moment-visibility | 通过 | 发布前可选择 Everyone / Friends / Only me，真实请求带 visibility；访问控制由服务端执行。[截图](d5/moment-visibility.png) |
| 12 | moment-leave | 通过 | 保留／丢弃／继续编辑弹层；实测保留后跨重新登录恢复文本草稿。[截图](d5/moment-leave.png) |
| 12 | moment-options | 通过 | 作者可分别修改分类与可见范围；PATCH 后立即 GET 详情及列表确认，详情与列表显示 Portrait / Only me；非作者无菜单且 PATCH 403。[菜单](d5/moment-options.png)、[分类](d5/post-category.png)、[范围](d5/post-visibility.png)、[回读详情](d5/moment-updated.png)、[非作者](d5/non-author-detail.png) |
| 12 | moment-delete | 通过 | 详情真实 GET 后可取消／确认删除，成功后列表刷新、详情返回 404；重新登录列表无旧内容。[截图](d5/moment-delete.png) |
| 12 | moment-saved | 通过 | 成功提示在真实 POST 201 后展示，并回到重新读取的列表。[截图](d5/moment-saved.png) |

## 附加证据与验证边界

- [真实请求及断言](d5/verification.json) 记录分类查询参数、PATCH → GET 请求顺序、最终隔离库、18/18 结果、服务端权限响应及过渡事件，不含令牌和数据库凭证。
- 作者在详情修改 Life → Portrait、Only me → Everyone → Friends → Only me；另一账号分别获得 200 / 403 / 403，越权 PATCH 返回 403，原私密附件仍受服务端保护。分类修改后，列表切换到 Portrait 有该动态，其他三类为空。
- 非作者 UI 检查：在第二浏览器使用第二账号真实令牌，将现有 My moments 的 userId 查询改为作者 ID，继续请求真实后端（没有伪造响应），公开列表与详情均不显示选项。[详情截图](d5/non-author-detail.png)。当前 D5 页面入口仍是 My moments。
- 回归包含草稿跨登录恢复、1000/1001 字边界、六附件发布与第七项禁止、直接提交七附件 400、非法媒体 400 与超大图片 413、真实删除及详情 404、主形象照与类型修改、图片解码、两账号动态及照片媒体权限、真实回复领取解锁 Friends；无评论气泡。
- [六附件](d5/limits-six-attachments.png)、[动态权限拒绝](d5/visibility-post-denied.png)、[照片权限拒绝](d5/visibility-card-denied.png)。原有 16 状态截图已重新生成。

## 失败清单

无。两项 D5 缺口及原有 16 项本次均通过；没有将在线 Figma 核验纳入此次结论。

## 最终记录

最终隔离库：`maugo_d5_task75_1794551613753`；完整 Chromium 串行测试 1/1 通过，覆盖 18/18 状态，执行 52.6 秒、含开发服务启动总计约 1 分钟。构建通过。通过清单与失败清单已发布至 [Issue #60 评论](https://github.com/RENWEI123-Max/Muse_AI-repository/issues/60#issuecomment-6846058246)。未自行提交或推送。
