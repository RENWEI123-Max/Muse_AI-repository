# C5 模块 04 客户端交付记录

## 交付结论与未完成项

客户端 17 个状态已实现，6 个 C5 浏览器用例通过；C3、C4 回归用例均通过，生产构建与开发服务器通过。完整真实后端联调尚未通过：当前 `maugo/src/app.ts` 注册了开场信、发送消息、钱包和收取接口，但没有会话列表 GET、待收队列 GET、消息历史 GET、会话 PATCH 路由。未修改 maugo/，未访问生产数据，未推送 Git。

**需要 Smith 决定由谁补齐上述四类后端接口，并确认下述字段/查询契约。** 不应把测试服务的接口适配器当成已交付的后端能力。客户端遇到接口 404 显示不可用提示及重试，不使用样例数据填充。

交接目录实际存在的原型是 `03-成品UI/源文件/MauGo.html`，未发现任务描述中的 `04-成品UI/源文件/MauGo.html`。本次使用前者及 `04-开发资料/page-states.json` 的 inbox 模块，对照其颜色、字号、行高、间距、头像、收信横条、抽屉与空态；原型的 Friends 标签根据任务要求改为 Following（关注）。演示播种按钮、其他模块的活动/帮助入口和个人页未作为本模块能力冒充交付，底部提供已实现的首页与消息导航。

## 17 状态逐项结果

下表“通过”指客户端在隔离测试数据库与明确标记的测试接口契约下通过；所有依赖缺失路由的真实后端验收仍待补齐。

| 序号 | 状态 | 客户端结果 | 验证内容 |
| --- | --- | --- | --- |
| 1 | `inbox-empty` | 通过（测试契约） | 空列表与寄信引导 |
| 2 | `inbox-waiting` | 通过（测试契约） | 已寄出会话、等待回信标识，无待收横条 |
| 3 | `inbox-pending` | 通过（测试契约） | 真实待收队列聚合，数量 3 |
| 4 | `inbox-collected-one` | 通过（测试契约） | 收取成功后数量变为 2，并有过渡动画 |
| 5 | `inbox-collected-all` | 通过（测试契约） | 三次收取后横条退场，无残留按钮 |
| 6 | `inbox-unread` | 通过（测试契约） | 重新进入仍显示服务端未读数 |
| 7 | `inbox-read` | 通过（测试契约） | 读取历史后消除未读标识 |
| 8 | `inbox-friends-empty` | 通过（测试契约） | 关注分页独立请求与空态 |
| 9 | `inbox-friends` | 通过（测试契约） | 关注会话出现在 Following 分页 |
| 10 | `inbox-drawer` | 通过（测试契约） | 右侧抽屉、搜索、隐藏会话、全部已读、通知入口 |
| 11 | `inbox-search` | 通过（测试契约） | 备注匹配与历史内容匹配；搜索不标记已读 |
| 12 | `inbox-search-empty` | 通过（测试契约） | 无结果空态、清除搜索恢复列表 |
| 13 | `inbox-options` | 通过（测试契约） | 备注、关注、置顶、静音、已读、隐藏操作 |
| 14 | `inbox-pinned` | 通过（测试契约） | 置顶排序与静音标识持久化，图标有进出动画 |
| 15 | `inbox-hidden` | 通过（测试契约） | 隐藏后从普通分页移除，在隐藏列表可恢复 |
| 16 | `inbox-hidden-empty` | 通过（测试契约） | 恢复后隐藏列表为空 |
| 17 | `inbox-notifications-off` | 通过（测试契约） | 提醒条展示、关闭后会话内保持关闭、请求通知权限 |

## 文件

- `src/components/InboxFlow.vue`：状态、API 请求、收取确认、幂等重试、分页、历史、搜索、关注、备注、置顶、静音、隐藏/恢复、通知和键盘交互。
- `src/inbox.css`：原型样式、收信横条、列表排序、置顶/静音图标、抽屉/底部弹层动效；兼容减少动画偏好。
- `src/components/HomeFlow.vue`：Messages 入口，处理父页面 Escape 事件不误关消息模块。
- `tests/module04.json`：交接文件 inbox 模块 17 个状态的原始定义。
- `tests/inbox.spec.ts`：6 个浏览器用例与 17 状态截图，运行时输出至 `test-results/c5-*.png`。
- `tests/inbox-contract.mjs`、`tests/auth-server.mjs`：仅测试进程注册缺失路由；适配器数据来自新建测试 PostgreSQL 数据库，会话偏好在该库的 `test_inbox_preferences` 表中。钱包和 collect 使用 maugo 原有真实事务实现。

## 客户端 API 契约（等待后端确认）

沿用环境变量 `VITE_API_BASE_URL`。开发时 `/api` 由 Vite 代理到 `MAUGO_API_TARGET`，默认 `http://127.0.0.1:3000`；构建产物未配置环境变量时也使用该默认地址。所有请求带当前登录 Bearer token。

- 会话列表：`GET /conversations?tab=messages|friends&hidden=false|true&limit=20&offset=0`，返回 `{items,hasMore}`。`friends` 仅是关注列表筛选参数，不作为双方授权或解锁条件。
- 会话字段：`id, displayName, avatar?, remark?, pinned, muted, hidden, following, unreadCount, status, lastMessage?, updatedAt?`；`status` 为 `waiting` 或 `open`；PATCH 返回更新后的同结构会话。
- 队列：`GET /conversations/:id/replies/pending` 返回 `{items:[{id}]}`。客户端聚合普通消息所有分页会话的队列，不只统计当前 20 行。
- 历史与搜索：`GET /conversations/:id/messages?limit=20&offset=0&markRead=true|false&search=...` 返回 `{items,hasMore}`，消息字段 `id,content,kind,createdAt`。打开会话用 `markRead=true`，搜索用 `false`，不把搜索结果误算成已读。历史支持继续加载。
- 偏好：`PATCH /conversations/:id` 发送 `remark/pinned/muted/hidden/following` 的局部字段。关注不会解锁任何聊天权限。
- 钱包：`GET /wallet` 使用现有 `diamonds/freeRemaining/paidCost`。
- 收取：`POST /conversations/:id/replies/:replyId/collect` 发送 `confirmPaid` 与 `Idempotency-Key`，同一回信失败后重试保持同一 key。先显示 0 或 10 钻、当前余额和收取后余额；点 Not now 只关闭确认层，不请求扣费。免费额度被其他会话耗尽时，后端 `confirmation-required` 使弹层改为 10 钻，必须重新点击确认，余额不足禁用确认。前端不自行扣余额或提前解锁。

## 验证边界

浏览器流程覆盖列表→待收 3→收取 1 剩 2→全部收完→未读→读取历史→已读；同时覆盖关注分页、搜索历史不改变未读、备注、置顶/静音、隐藏/恢复、通知条、分页、接口错误恢复及模态框焦点。付费验证包含取消余额不变、免费变付费后重新确认、余额不足、服务端成功但网络断开后的同 key 重试：余额只扣 10 钻、队列只减少一条。C3/C4 回归通过。

测试进程创建独立数据库，不清空或删除已有数据库，不变更生产密码和密钥。生产接口缺失意味着端到端正式验收仍缺真实列表/队列/历史/PATCH 联调，不能声称完整任务已经上线可用。
