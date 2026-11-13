# D11 核心流程动画验收（任务 #80 / Issue #65）

结论：四类流程的客户端过渡已补齐，原型可读取参数及真实业务流程验收通过；**Figma 四类动效一致性验收 blocked，不能标为全部完成**。

仅修改开信、回信、消息收取和聊天解锁相关的 4 个 Vue 组件、3 份现有样式及相关测试；未改后端、充值、依赖或密钥。

| 项目 | 已实现与验收 | 证据（本目录 d11/） |
| --- | --- | --- |
| 开信 | 从点击的鸟/回信入口飞出信封；面板淡入、展开及退出。信封 440ms cubic-out；面板透明度 360ms、变换 440ms cubic-bezier(.2,.8,.2,1)，入场延迟 140ms；父级等待子级完成，避免中断。 | opening-flight.png、letter-open.png、opening-motion.json、opening-reply.webm |
| 回信 | 写信面板 300ms ease-out；回信发送成功后气泡、编辑区和等待区交接，沿用现有 250ms 透明度 / 300ms 位移动效；面板前后边界一致。真实发送失败保留草稿，延迟期间关闭入口可用，重试成功。 | reply-writing.png、reply-failed.png、reply-sending.png、reply-sent.png、compose-enter.png、opening-reply.webm |
| 收取 | 支付弹窗 220ms ease-out；成功行 450ms ease-out 自上方 8px 淡入，收取条逐渐收起，回执不挡操作。免费、付费、取消、余额不足和响应丢失重试均走真实接口。 | paid-confirmation.png、collection-shortage.png、collection-retry.png、collection-paid.png、collection-all.png、collection-unlock.webm |
| 对话解锁 | 收取时保留当前聊天实例、线程与草稿，等待卡和输入区在固定区域交接；复用原型收取的 450ms ease-out。验证当前对话对应的回信被收取；覆盖进入聊天之后才到达的回信。线程节点及边界前后保持一致，解锁后输入可用。 | conversation-unlocked.png、arrival-unlocked.png、collection-unlock.webm、arrival-unlock.webm |

原型依据：交接包 `03-成品UI/源文件/MauGo.html` 内嵌 CSS、app.js、features.js 的 `.note-panel`、opening 分支、`.composer-panel`、`.payment-dialog`、`collectOneReply` 和 `.reply-collected`。原型没有独立的回信发送/解锁关键帧轨道：回信保留现有客户端动效，解锁复用收取节奏；这两项不声称已通过独立 Figma 轨道对照。各场景实际浏览器动画参数保存在 `*-transitions.json`。

构建与类型检查通过：素材校验 343 项、vue-tsc、Vite 生产构建。D11 Chromium 专项 **4/4** 通过，覆盖上表四类流程；相关旧流程回归 **10/10** 通过（C6 聊天 2 项、D1 收取 1 项、C5 消息 6 项、C4 信件 1 项；C4 在等待新增退出动画后单独复验通过）。原有测试的隔离服务器端口已被占用，因此在临时目录使用备用端口运行同一批测试，未停止已有服务、未改后端。未用 mock 业务响应冒充后端；延迟和断网仅在浏览器网络层注入。

真实后端由现有 buildApp 启动，使用全新隔离 PostgreSQL 库 `maugo_d11_task80_1794554565216`，001–017 全部迁移已执行，库保留未删除。`database.json` 记录库名和迁移；`paid-evidence.json` 证明 10 次免费额度耗尽后，响应丢失再以同一幂等键重试，仅增加一条 -10 钻石账本，余额 100→90、收取数 11；`free-evidence.json` 证明免费收取后余额仍 100、扣款账本为空。之后收完另外两封，余额为 70。

16 张截图和 4 段 375×812 Chromium 录屏已落在 `client/docs/d11/`；另验证减少动态效果模式。6 倍 CPU 降速与请求额外延迟 1000ms 下，收取可恢复、解锁后可输入，没有增加依赖动画完成的业务等待。此项为浏览器模拟性能验收，不代表实体低端手机测量或所有网络条件的帧率保证。

**未通过项 / blocked**：Figma 文件 `9ecnOjFdk2YjAJRG5TysNJ` 的 create_session 和 get_metadata 均返回无编辑访问权限。开信、回信发送、收取扣钻与解锁四类动画的 Figma 布局、关键帧、时长、缓动及逐帧视觉一致性均未验；截图和浏览器功能通过不能替代该项。需要 Smith 协调文件所有者向当前连接账号开放权限，或提供对应动效导出后复验。

回贴：[Issue #65 评论](https://github.com/RENWEI123-Max/Muse_AI-repository/issues/65#issuecomment-6846903241)。代码交由 runner 自动提交推送。
