# B11 会话接口

实现位置：`src/inbox.ts`；新增迁移 `server/migrations/011_inbox.sql`；真实 PostgreSQL 边界测试 `test/inbox.test.ts`。部署前沿用迁移流程应用新增迁移。

所有接口要求 Bearer token；会话详情仅双方可访问，其他用户返回 404。

- `GET /conversations?tab=messages|friends&hidden=false|true&limit=20&offset=0`：返回 `{items,hasMore}`；置顶优先，再按可见消息时间和 ID 排序。Friends 只筛选当前用户关注的会话，不代表相互授权。两个标签独立分页。
- `GET /conversations/:id/replies/pending?limit=20&offset=0`：返回 `{items,hasMore,used,freeRemaining,nextCost,diamonds}`，队列仅包含对方未收取回信的 ID 和时间，不返回正文。免费额度按上海自然日全用户会话合计，与钱包一致；最终收费仍由 collect 事务裁决。
- `GET /conversations/:id/messages?search=文本&markRead=false&limit=20&offset=0`：返回 `{items,hasMore,unlocked}`，消息含 id、kind、content、senderId、mine、mediaId、createdAt。按时间与 ID 升序；搜索为不区分大小写的字面子串。只有自己的消息、首条信及已收取的对方回信可见。`markRead=true` 标记该会话已读；默认搜索不改已读。
- `PATCH /conversations/:id`：支持 remark、pinned、muted、hidden、following、background、bubble 和 clearHistory。返回更新后的会话。字符串有长度限制，布尔值严格校验。hidden=false 恢复会话；背景和气泡保存客户端样式标识。偏好只影响当前用户。
- `POST /conversations/:id/messages`：复用现有文字发送接口。等待收取有效回复时发起人不能继续发送；未解锁媒体上传和发送由现有 B8 权限检查拒绝。请求未知字段不会被静默移除为普通文字，防止绕过媒体限制。

清空历史只写当前用户可见时间边界，不删除消息、首条消息权限记录、已收取记录、余额账本或会话解锁状态；不影响对方历史，也不免除未收回信费用。屏蔽后双方均不能发送或收取。只有原收件人发出的有效回信被成功收取才能更新会话解锁记录。

客户端测试的 `inbox-contract.mjs` 现在仅注册测试数据夹具；会话列表、队列、历史和 PATCH 全部由真实后端提供。`auth-server.mjs` 在新建的专用测试数据库应用 011 迁移，不修改生产业务表。现有 C5 与 C6 浏览器用例可直接回归。

C5 聚合待收回信时遍历队列全部分页。C6 媒体发送直接调用已有的 `/media/uploads` 与 `/conversations/:id/media`，文字继续调用 `/conversations/:id/messages`，避免旧上传地址探测造成代理写入错误。
