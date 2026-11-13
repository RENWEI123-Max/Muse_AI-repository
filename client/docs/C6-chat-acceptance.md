# C6 · 模块 06 对话与聊天工具验收

客户端 20 个状态实现，逐项浏览器断言及截图通过；C5 六项回归通过。生产构建通过，开发服务器由 Playwright 启动并完成浏览器访问。没有修改 maugo/，没有访问生产业务数据，没有执行 git push。

## 验证范围

使用 C5 测试框架创建全新 PostgreSQL 数据库，沿用真实后端认证、发送消息、钱包、回信收取和 B8 媒体上传/媒体消息实现。仅缺失的列表、历史、待收、PATCH 路由使用客户端 tests/ 中的数据库契约适配器。测试媒体单独存放于 /tmp 下的新数据库同名目录；不删除已有数据库或业务数据。

浏览器完成等待 → 对方回信 → 收取 → 文字发送；未解锁时没有输入区和媒体入口，真实 B8 上传返回 403；清空后保持解锁，并能再次发送。备注持久化、搜索不标记已读、取消录音、麦克风不可用提示、图片预览、真实上传发送、带鉴权的图片历史读取、表情上传发送均有测试。录音仅演示手势，不请求麦克风权限。

## 20 状态逐项结果

下列“通过”指客户端浏览器与隔离数据库契约验证，不代表缺失的 B11 生产接口已交付。

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
- `tests/inbox-contract.mjs`：测试库内按用户隔离的 cleared_at；历史返回 mine/senderId/mediaId；清空只改变历史可见范围，不修改 conversations.unlocked_at。
- 截图输出 `test-results/c6-chat-*.png`；`docs/c6-chat-open.png` 保留一张动画完成后的聊天图。

## 接口兼容与尚缺的正式验收

环境地址沿用 `VITE_API_BASE_URL` 与 `MAUGO_API_TARGET`，默认 http://127.0.0.1:3000。所有业务请求带 Bearer token。

历史、未读、搜索使用 `GET /conversations/:id/messages`，分页与 markRead/search 参数沿用 C5。备注通过 `PATCH /conversations/:id` 的 remark，清空发送 clearHistory:true；不会在客户端重置权限。文字发送走 `POST /conversations/:id/messages`，遵循现有后端 200 字限制。

上传先尝试任务要求的 `POST /media/upload`，仅遇到 404 时兼容已交付 B8 的 `/media/uploads`，使用原始文件字节及 purpose=chat/conversationId/filename 查询参数。媒体优先通过 messages 的 mediaIds 提交；现有文字接口返回 400 时，改用 B8 `/conversations/:id/media`。文字与附件同时存在时，旧 B8 兼容路径分两条消息发送。表情使用原型 PNG 作为图片上传；历史图片使用带鉴权请求转为本地 blob URL。

最终检查时 B11 的 GET /conversations、GET /conversations/:id/messages、PATCH /conversations/:id 与待收队列仍未注册，故正式后端全链路联调尚缺，不能宣称已通过。需要 Smith 协调 B11 交付上述接口并确认 clearHistory 与 markRead/search 契约，交付后重跑同一客户端流程。当前图片与表情已使用真实 B8 接口验证，列表/历史/PATCH 仍明确属于隔离测试契约。
