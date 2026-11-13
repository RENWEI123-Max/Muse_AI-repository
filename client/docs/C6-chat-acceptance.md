# C6 · 模块 06 对话与聊天工具验收

客户端 20 个状态实现，逐项浏览器断言及截图通过；C5 六项回归通过。生产构建通过，开发服务器由 Playwright 启动并完成浏览器访问。没有修改 maugo/，没有访问生产业务数据，没有执行 git push。

## 验证范围

使用 C5 测试框架创建全新 PostgreSQL 数据库，沿用真实后端认证、发送消息、钱包、回信收取和 B8 媒体上传/媒体消息实现。B11 后续已补齐列表、历史、待收、PATCH；这些路由全部使用真实后端，tests/inbox-contract.mjs 只保留测试夹具。测试媒体单独存放于 /tmp 下的新数据库同名目录；不删除已有数据库或业务数据。

浏览器完成等待 → 对方回信 → 收取 → 文字发送；未解锁时没有输入区和媒体入口，真实 B8 上传返回 403；清空后保持解锁，并能再次发送。备注持久化、搜索不标记已读、取消录音、麦克风不可用提示、图片预览、真实上传发送、带鉴权的图片历史读取、表情上传发送均有测试。录音仅演示手势，不请求麦克风权限。

## 20 状态逐项结果

B11 交付后已用隔离测试数据库的真实后端回归等待→收取→聊天、清空历史保留权限、真实图片与表情上传。

|序号|状态|结果|
|---|---|---|
|1|`chat-waiting` · 对话 / 等待对方回复|通过|
|2|`chat-receipt-waiting` · 对话 / 回信已到，尚未收取|通过|
|3|`chat-open` · 对话 / 已回复，可继续交流|通过|
|4|`chat-draft` · 对话 / 正在编辑|通过|
|5|`chat-sent` · 对话 / 消息已发送|通过|
|6|`chat-photo` · 对话 / 图片消息|通过|
|7|`chat-attachment` · 对话 / 待发送图片|通过|
|8|`chat-stickers` · 对话 / 表情选择|通过|
|9|`chat-sticker-selected` · 对话 / 表情待发送|通过|
|10|`chat-recording` · 对话 / 录音中（演示）|通过|
|11|`chat-record-cancel` · 对话 / 上滑取消录音|通过|
|12|`chat-mic-denied` · 对话 / 麦克风不可用|通过|
|13|`chat-details` · 对话设置 / 已解锁|通过|
|14|`chat-details-waiting` · 对话设置 / 未回复锁定|通过|
|15|`chat-remark` · 对话设置 / 备注名|通过|
|16|`chat-search-empty` · 聊天搜索 / 待输入|通过|
|17|`chat-search-result` · 聊天搜索 / 有结果|通过|
|18|`chat-search-none` · 聊天搜索 / 无结果|通过|
|19|`chat-clear-confirm` · 聊天记录 / 清空确认|通过|
|20|`chat-cleared` · 聊天记录 / 清空后|通过|

## 文件与证据

- `src/components/ChatFlow.vue`：会话状态、发送、图片/表情、录音手势、历史、备注、搜索、清空。
- `src/chat.css`：原型暗绿配色、气泡、头像、等待卡片、工具栏、附件、设置与确认层；等待呼吸、消息进出、工具展开、录音波形、清空过渡，并支持减少动画偏好。
- `src/components/InboxFlow.vue`：从 C5 进入聊天及新到回信队列刷新；加载中禁用列表入口。
- `tests/module06.json`：交接清单原文；`tests/chat.spec.ts`：20 状态截图及主流程；`tests/chat-media.spec.ts`：B8 真实媒体链路。
- `tests/inbox-contract.mjs`：仅测试数据夹具。真实 B11 conversation_preferences 按用户隔离 cleared_at；历史返回 mine/senderId/mediaId；清空不修改 conversations.unlocked_at。
- 截图输出 `test-results/c6-chat-*.png`；`docs/c6-chat-open.png` 保留一张动画完成后的聊天图。

## B11 真实后端接口

环境地址沿用 `VITE_API_BASE_URL` 与 `MAUGO_API_TARGET`，默认 http://127.0.0.1:3000。所有业务请求带 Bearer token。

历史、未读、搜索使用 `GET /conversations/:id/messages`，分页与 markRead/search 参数沿用 C5。备注通过 `PATCH /conversations/:id` 的 remark，清空发送 clearHistory:true；不会在客户端重置权限。文字发送走 `POST /conversations/:id/messages`，遵循现有后端 200 字限制。

上传直接使用已交付 B8 的 `POST /media/uploads`，提交原始文件字节及 purpose=chat/conversationId/filename 查询参数；媒体发送直接使用 `/conversations/:id/media`。文字与附件同时存在时分两条消息发送。表情使用原型 PNG 作为图片上传；历史图片使用带鉴权请求转为本地 blob URL。移除旧上传地址探测及 messages.mediaIds 试探回退，避免代理在拒绝旧路由时出现连接错误。

B11 已实现真实列表、队列、历史与 PATCH，C6 同一组浏览器用例已对真实后端回归通过；测试使用独立数据库和媒体目录，不表示已部署生产环境。接口说明见 `../../maugo/B11-inbox.md`。
