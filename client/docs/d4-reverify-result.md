# D4（模块 09 + 10）真实接口复验

结论：**未达到 24/24 完整验收**。24 个状态中，22 项核心交互功能通过、2 项部分通过；离线原型存在布局差异，不能据此宣称 UI 全量通过。Figma 对照单列 blocked。没有修改后端、推送代码或发送 Issue 评论。

## 基线与验证环境

- 当前 main：`6b69b0f`（2026-11-13），真实 B14/B15 路由来自该版本 `maugo/src/profiles.ts`。
- Fastify 使用原仓库 `buildApp`；每次验收创建全新 `maugo_d4_<时间戳>` PostgreSQL 数据库，按顺序执行 main 的全部迁移；上传文件写入独立 `/tmp/maugo_d4_<时间戳>-media`，保留数据库与文件，不清理已有数据。
- Chromium，375×812；浏览器没有拦截或 mock API。测试专用端点只准备隔离库用户、会话及获赞记录，不替换业务路由。
- `tests/d4-reverify.config.ts`、`tests/d4-reverify-server.mjs`、`tests/d4-reverify.spec.ts` 提供可复跑验收。仓库外运行时通过 `D4_BACKEND_ROOT` 指向后端，通过 `D4_PROTOTYPE_FILE` 指向交接包的离线 `MauGo.html`；默认后端为同仓库 `maugo/`。
- 构建、独立 vue-tsc 类型检查通过。真实接口浏览器测试和离线原型取证测试通过，**测试通过不等同于 24 项产品验收通过**。

## 接入结果

- 资料展示：GET `/profiles/me` 和 `/profiles/:id`，公开资料使用 `peerId`，不误用 conversation ID；公开动态读取真实 `/posts`。
- 资料编辑：PATCH `/profiles/me` 写入昵称、年龄、城市、简介，使用服务端返回值回显；17 岁触发校验。刷新后重新登录，资料仍在。
- 头像：先通过 `/media/uploads?purpose=avatar` 上传裁切后的 JPEG，再 POST `/profiles/me/avatars` 执行 add/select/remove/restore。8 槽、确认移除、归档恢复均走真实后端。鉴权读取图片生成 blob URL，卸载时释放；刷新重新登录后图片实际解码成功。
- B15：关注、粉丝、获赞总数及访问记录、寄出信件读取 `/profiles/me/stats`；验证过三个计数均为 1 的非零场景。关注名单复用真实 conversations；不再从消息拼接“我的信件”，不再将本地访问记录作为证据。
- 删除本地 profile/visits 数据读写及默认头像照片 mock，不发送后端不支持的 zodiac 字段；移除、恢复、选择失败保留错误提示，保存期间禁用保存按钮。

## 逐项清单

“功能通过”仅指本列所述真实接口交互；UI 总体仍未通过，见下一节。截图均在 `d4-reverify/`，与状态同名。

| # | 状态 | 功能结论 | 证据或缺口 |
|---|---|---|---|
| 1 | person-profile 内容完整 | 部分通过 | 昵称、年龄、城市、头像走 B14；B14 不返回公开形象照，main 只有本人形象照 GET，缺少他人形象照读取；完整内容组合没有通过证据 |
| 2 | person-waiting 尚未回复 | 通过 | `person-waiting.png`；真实待回复会话禁用关注 |
| 3 | person-followed 已关注 | 通过 | `person-followed.png`；真实关注关系与权限回显 |
| 4 | person-no-content 无动态 | 通过 | `person-no-content.png`；真实 posts 空列表 |
| 5 | person-photo 头像大图 | 通过 | `person-photo.png`；另一真实用户上传的头像通过鉴权读取并解码 |
| 6 | person-safety 举报或屏蔽菜单 | 通过 | `person-safety.png`；入口可打开；不将菜单截图当作举报/屏蔽全链路验收 |
| 7 | profile-empty 尚未上传照片 | 通过 | `profile-empty.png`；新用户真实空头像、空形象照 |
| 8 | profile-content 已有形象照 | 通过 | `profile-content.png`；真实 post 媒体上传及本人 image-cards 创建后，重新进入个人页读取形象照并实际解码 |
| 9 | profile-edit 当前信息 | 通过 | `profile-edit.png`；四个受支持字段真实 PATCH 及刷新持久化；星座字段无接口，移除编辑入口，原型差异另记 |
| 10 | profile-invalid 年龄校验 | 通过 | `profile-invalid.png`；17 岁不保存，26 岁成功 |
| 11 | avatar-gallery 已上传与空槽 | 通过 | `avatar-gallery.png`；服务端返回的头像与位置，7 个空槽 |
| 12 | avatar-remove 移除确认 | 通过 | `avatar-remove.png`；confirm=true 的真实 remove |
| 13 | avatar-removed 移除后槽位 | 通过 | `avatar-removed.png`；服务端移除后 8 个空槽 |
| 14 | avatar-restore 最近移除 | 通过 | `avatar-restore.png`；真实 recentlyRemoved，restore 后回到活跃槽位 |
| 15 | avatar-full 槽位已满 | 通过 | `avatar-full.png`；实际上传 8 张，禁止第 9 张 |
| 16 | avatar-crop 上传裁切 | 通过 | `avatar-crop.png`；缩放裁切 JPEG 上传，刷新后 320px 图片仍可读取 |
| 17 | profile-likes 获赞汇总 | 部分通过 | `profile-likes.png`；总数来自 B15，并验证非零总数；B15 没有原型要求的动态/形象照分类数，不再硬编码两个 0 |
| 18 | following-empty 关注空态 | 通过 | `following-empty.png`；真实空关系 |
| 19 | following-list 关注有记录 | 通过 | `following-list.png`；真实关注与会话名单，可打开真实公开资料 |
| 20 | followers-empty 粉丝空态 | 通过 | `followers-empty.png`；真实 0 粉丝；另验证非零计数。B15 没有粉丝名单，非零时提示不可用，不显示假空态 |
| 21 | visitors-empty 访客空态 | 通过 | `visitors-empty.png`；真实空访问记录 |
| 22 | visitors-outgoing 我访问过的人 | 通过 | `visitors-outgoing.png`；成功 GET 公开资料后真实 B15 记录回显 |
| 23 | my-letters-empty 信件空态 | 通过 | `my-letters-empty.png`；B15 空 letters |
| 24 | my-letters 已寄出 | 通过 | `my-letters.png`；真实 opening 信件内容，来自 B15 |

## 离线原型、动画及未通过项

仅对照交接包 `03-成品UI/源文件/MauGo.html` 和 `01-项目需求/页面状态清单.csv` 中模块 09/10 的 24 项。`prototype-*.png` 是离线原型证据，不能混作真实接口验收截图。

- 动画：页面保留 `d4-open` 0.3s，弹层保留 opacity/transform 0.25s 的进入与退出；浏览器验证实际 animation-name。静态截图关闭动画以取最终帧。**未完成 24 个状态逐项动画时序和交互打断对照，因此“过渡动画完整”仍未通过全量验收。**
- UI 未通过：原型个人页顶栏是钻石/Filter Pass，现有实现是返回/标题；访问入口、形象照网格/上传卡布局、浮动发布按钮、鸟外观入口、底部导航等与原型不同。头像相机图标仍是字符替代。资料编辑原型有星座，但 B14 没有该字段。现有样式不能标成与原型一致。
- 未完成其余状态逐页像素级对照；22 项功能通过不能折算成 22 项完整视觉验收通过。
- 公开形象照缺少接口；本人形象照已有 `/users/me/image-cards`，真实内容组合已通过，不将本人接口误记成缺失。
- 获赞分类明细、粉丝名单接口缺失。访问记录只有用户 ID，当前通过 B14 补齐资料；B14 的 GET 会记录访问，读取访客资料可能产生新的出访记录，这是现有接口语义限制。
- **Figma 对照：blocked**，本次未连接 Figma、未读取设计节点，未声称已对照。

## 交给 Smith 的决定

需决定是否安排后端提供公开形象照、获赞分类明细、粉丝名单及不附带访问记账的资料摘要，以及是否补齐星座字段；同时安排 D4 的原型布局还原与剩余组合状态、全量动画复验。在这些缺口补齐前，本项保持未完成，不能标记 24/24。
