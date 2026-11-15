# R25 · 189 状态总验收（未通过）

基线 `27c74f5`，分支 `codex/r25-wrapup`。这是189态逐项索引和历史实现图重测，不是189态已验收声明。**已验证0，未验证138，待 Smith51**。179态有明确对应的历史实现图及重新生成的并排图，10态缺图／差异比例未测量。缺图没有用参考图、mock状态或相邻状态补齐。

## 图像与方法

R01来源：[page-states.json](../design-reference/page-states.json)、[参考图](../design-reference/figma/)。16模块、189个唯一状态逐项列在下表。R04工具：[ui-redo.spec.ts](../../tests/ui-redo.spec.ts)目前**只支持4个明确导航状态**，且其导航使用API fixtures；不能擅自把它扩展成189个真实状态。R25完整运行结果另见回归表，不把其fixture图当真实账号走查。

沿用R04“实现图与R01并排、逐态报告比例、不设置通过阈值”的方式。新脚本[compare-total.mjs](r25/compare-total.mjs)读取基线Git内的历史实现PNG（避免并行回归临时输出污染），严格检查375×812，左R01、右历史实现。逐像素RGBA任一通道不同即计数，分母304500；**无蒙版、无容差、无缩放、无通过阈值**。这与R04的顶部44px蒙版及Playwright感知比较器口径不同，数字不可横向混算。原始来源与误差见[JSON](r25/total-comparison.json)、[生成输入](r25/total-input.json)。并排PNG是明确标注来源的历史图衍生物，不是R25新拍的真实截图。

历史证据可能来自旧版、fixture回归或预览；不会因有图、低比例或某个测试通过而改成“已验证”。R25的375×667英韩真实走查单列在[R25-result.md](R25-result.md)，不拿667图缩放冒充812态。

## 逐态总表

| # | 模块 | 状态 | R01 | 历史实现 / 并排图 | RGBA差异 | 验收状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | entry | `welcome` · 欢迎 / 未登录 | [参考](../design-reference/figma/welcome.png) | [历史实现](r15-audit/812-en-welcome.png) / [并排](r25/total/welcome-side-by-side.png) | 53.5974% | 未验证 |
| 2 | entry | `terms-unchecked` · 协议 / 未勾选 | [参考](../design-reference/figma/terms-unchecked.png) | [历史实现](r15-audit/812-en-terms-unchecked.png) / [并排](r25/total/terms-unchecked-side-by-side.png) | 24.8516% | 未验证 |
| 3 | entry | `terms-checked` · 协议 / 已勾选 | [参考](../design-reference/figma/terms-checked.png) | [历史实现](r15-audit/812-en-terms-checked.png) / [并排](r25/total/terms-checked-side-by-side.png) | 25.2568% | 未验证 |
| 4 | entry | `signin-empty` · 邮箱登录 / 空表单 | [参考](../design-reference/figma/signin-empty.png) | [历史实现](r15-audit/812-en-signin-empty.png) / [并排](r25/total/signin-empty-side-by-side.png) | 25.8657% | 未验证 |
| 5 | entry | `signin-filled` · 邮箱登录 / 已填写 | [参考](../design-reference/figma/signin-filled.png) | [历史实现](r15-audit/812-en-signin-filled.png) / [并排](r25/total/signin-filled-side-by-side.png) | 25.7688% | 未验证 |
| 6 | entry | `signin-invalid` · 邮箱登录 / 邮箱错误 | [参考](../design-reference/figma/signin-invalid.png) | [历史实现](r15-audit/812-en-signin-invalid.png) / [并排](r25/total/signin-invalid-side-by-side.png) | 26.1514% | 未验证 |
| 7 | entry | `signup-empty` · 注册 / 空表单 | [参考](../design-reference/figma/signup-empty.png) | [历史实现](r15-audit/812-en-signup-empty.png) / [并排](r25/total/signup-empty-side-by-side.png) | 24.2181% | 未验证 |
| 8 | entry | `signup-filled` · 注册 / 已填写 | [参考](../design-reference/figma/signup-filled.png) | [历史实现](r15-audit/812-en-signup-filled.png) / [并排](r25/total/signup-filled-side-by-side.png) | 23.7750% | 未验证 |
| 9 | entry | `signup-mismatch` · 注册 / 密码不一致 | [参考](../design-reference/figma/signup-mismatch.png) | [历史实现](r15-audit/812-en-signup-mismatch.png) / [并排](r25/total/signup-mismatch-side-by-side.png) | 23.7741% | 未验证 |
| 10 | entry | `verify-empty` · 验证码 / 待输入 | [参考](../design-reference/figma/verify-empty.png) | [历史实现](r15-audit/812-en-verify-empty.png) / [并排](r25/total/verify-empty-side-by-side.png) | 38.0979% | 未验证 |
| 11 | entry | `verify-error` · 验证码 / 输入错误 | [参考](../design-reference/figma/verify-error.png) | [历史实现](r15-audit/812-en-verify-error.png) / [并排](r25/total/verify-error-side-by-side.png) | 59.0187% | 未验证 |
| 12 | entry | `verify-resend` · 验证码 / 重发倒计时 | [参考](../design-reference/figma/verify-resend.png) | 缺失；不补图 | 未测量 | 未验证 |
| 13 | entry | `forgot-empty` · 找回密码 / 邮箱 | [参考](../design-reference/figma/forgot-empty.png) | [历史实现](r15-audit/812-en-forgot-empty.png) / [并排](r25/total/forgot-empty-side-by-side.png) | 27.4450% | 未验证 |
| 14 | entry | `recovery-code` · 找回密码 / 验证码 | [参考](../design-reference/figma/recovery-code.png) | [历史实现](r15-audit/812-en-recovery-code.png) / [并排](r25/total/recovery-code-side-by-side.png) | 38.1800% | 未验证 |
| 15 | entry | `new-password` · 重设密码 / 待填写 | [参考](../design-reference/figma/new-password.png) | [历史实现](r15-audit/812-en-new-password.png) / [并排](r25/total/new-password-side-by-side.png) | 26.5688% | 未验证 |
| 16 | entry | `new-password-error` · 重设密码 / 密码不一致 | [参考](../design-reference/figma/new-password-error.png) | [历史实现](r15-audit/812-en-new-password-error.png) / [并排](r25/total/new-password-error-side-by-side.png) | 26.5951% | 未验证 |
| 17 | entry | `apple-private` · Apple / 隐藏邮箱 | [参考](../design-reference/figma/apple-private.png) | [历史实现](r15-audit/812-en-apple-private.png) / [并排](r25/total/apple-private-side-by-side.png) | 32.5806% | 未验证 |
| 18 | entry | `apple-share` · Apple / 共享邮箱 | [参考](../design-reference/figma/apple-share.png) | [历史实现](r15-audit/812-en-apple-share.png) / [并排](r25/total/apple-share-side-by-side.png) | 32.5767% | 未验证 |
| 19 | entry | `auth-privacy` · 登录前 / 隐私说明 | [参考](../design-reference/figma/auth-privacy.png) | [历史实现](r15-audit/812-en-auth-privacy.png) / [并排](r25/total/auth-privacy-side-by-side.png) | 29.9209% | 未验证 |
| 20 | home | `home-ready` · 首页 / 三封来信 | [参考](../design-reference/figma/home-ready.png) | [历史实现](r06-audit/812-en-03-ready-motion.png) / [并排](r25/total/home-ready-side-by-side.png) | 70.1396% | 未验证 |
| 21 | home | `home-empty` · 首页 / 无符合条件的信件 | [参考](../design-reference/figma/home-empty.png) | [历史实现](r06-audit/812-en-10-empty.png) / [并排](r25/total/home-empty-side-by-side.png) | 70.0864% | 未验证 |
| 22 | home | `home-response` · 首页 / 回应到达 | [参考](../design-reference/figma/home-response.png) | [历史实现](r06-audit/812-en-01-response.png) / [并排](r25/total/home-response-side-by-side.png) | 69.9941% | 未验证 |
| 23 | home | `filters-free` · 筛选 / 未开通 Pass | [参考](../design-reference/figma/filters-free.png) | [历史实现](screenshots/R07-filters-free.png) / [并排](r25/total/filters-free-side-by-side.png) | 48.9399% | 未验证 |
| 24 | home | `filters-active` · 筛选 / Pass 生效 | [参考](../design-reference/figma/filters-active.png) | [历史实现](screenshots/R07-filters-active.png) / [并排](r25/total/filters-active-side-by-side.png) | 48.7028% | 未验证 |
| 25 | home | `filters-selected` · 筛选 / 已选择条件 | [参考](../design-reference/figma/filters-selected.png) | [历史实现](screenshots/R07-filters-selected.png) / [并排](r25/total/filters-selected-side-by-side.png) | 48.7087% | 未验证 |
| 26 | home | `bird-female` · 信使外观 / 女鸟 | [参考](../design-reference/figma/bird-female.png) | [历史实现](screenshots/R07-bird-female.png) / [并排](r25/total/bird-female-side-by-side.png) | 47.9931% | 未验证 |
| 27 | home | `bird-male` · 信使外观 / 男鸟 | [参考](../design-reference/figma/bird-male.png) | [历史实现](screenshots/R07-bird-male.png) / [并排](r25/total/bird-male-side-by-side.png) | 47.9859% | 未验证 |
| 28 | home | `bird-motion-off` · 信使外观 / 关闭动画 | [参考](../design-reference/figma/bird-motion-off.png) | [历史实现](screenshots/R07-bird-motion-off.png) / [并排](r25/total/bird-motion-off-side-by-side.png) | 47.8138% | 未验证 |
| 29 | letters | `letter-open` · 来信详情 / 未回应 | [参考](../design-reference/figma/letter-open.png) | [历史实现](r08-audit/812-en-letter-open.png) / [并排](r25/total/letter-open-side-by-side.png) | 59.0407% | 未验证 |
| 30 | letters | `letter-typed` · 来信详情 / 编辑回应 | [参考](../design-reference/figma/letter-typed.png) | [历史实现](r08-audit/812-en-letter-typed.png) / [并排](r25/total/letter-typed-side-by-side.png) | 59.5107% | 未验证 |
| 31 | letters | `letter-waiting` · 来信详情 / 已回应，等待回信 | [参考](../design-reference/figma/letter-waiting.png) | [历史实现](r08-audit/812-en-letter-waiting.png) / [并排](r25/total/letter-waiting-side-by-side.png) | 60.4700% | 未验证 |
| 32 | letters | `letter-replied` · 来信详情 / 已收到回复 | [参考](../design-reference/figma/letter-replied.png) | [历史实现](r08-audit/812-en-letter-replied.png) / [并排](r25/total/letter-replied-side-by-side.png) | 60.5199% | 未验证 |
| 33 | letters | `letter-safety` · 来信详情 / 举报或屏蔽 | [参考](../design-reference/figma/letter-safety.png) | [历史实现](r08-audit/812-en-letter-safety.png) / [并排](r25/total/letter-safety-side-by-side.png) | 49.2161% | 未验证 |
| 34 | letters | `letter-report` · 来信详情 / 举报原因 | [参考](../design-reference/figma/letter-report.png) | [历史实现](r08-audit/812-en-letter-report.png) / [并排](r25/total/letter-report-side-by-side.png) | 45.8315% | 未验证 |
| 35 | letters | `compose-empty` · 写信 / 空白 | [参考](../design-reference/figma/compose-empty.png) | [历史实现](r08-audit/812-en-compose-empty.png) / [并排](r25/total/compose-empty-side-by-side.png) | 59.9714% | 未验证 |
| 36 | letters | `compose-draft` · 写信 / 已填写 | [参考](../design-reference/figma/compose-draft.png) | [历史实现](r08-audit/812-en-compose-draft.png) / [并排](r25/total/compose-draft-side-by-side.png) | 62.4798% | 未验证 |
| 37 | letters | `compose-invalid` · 写信 / 多行校验 | [参考](../design-reference/figma/compose-invalid.png) | [历史实现](r08-audit/812-en-compose-invalid.png) / [并排](r25/total/compose-invalid-side-by-side.png) | 59.8998% | 未验证 |
| 38 | letters | `compose-sent` · 写信 / 发送后等待 | [参考](../design-reference/figma/compose-sent.png) | [历史实现](r08-audit/812-en-compose-sent.png) / [并排](r25/total/compose-sent-side-by-side.png) | 98.4936% | 未验证 |
| 39 | inbox | `inbox-empty` · 消息 / 从未收到消息 | [参考](../design-reference/figma/inbox-empty.png) | [历史实现](r09-audit/812-en-inbox-empty.png) / [并排](r25/total/inbox-empty-side-by-side.png) | 5.7915% | 未验证 |
| 40 | inbox | `inbox-waiting` · 消息 / 已寄出，尚无回信 | [参考](../design-reference/figma/inbox-waiting.png) | [历史实现](r09-audit/812-en-inbox-waiting.png) / [并排](r25/total/inbox-waiting-side-by-side.png) | 3.4207% | 未验证 |
| 41 | inbox | `inbox-pending` · 消息 / 收到 3 封待收回信 | [参考](../design-reference/figma/inbox-pending.png) | [历史实现](r09-audit/812-en-inbox-pending.png) / [并排](r25/total/inbox-pending-side-by-side.png) | 7.2548% | 未验证 |
| 42 | inbox | `inbox-collected-one` · 消息 / 收取 1 封，剩余 2 封 | [参考](../design-reference/figma/inbox-collected-one.png) | [历史实现](r09-audit/812-en-inbox-collected-one.png) / [并排](r25/total/inbox-collected-one-side-by-side.png) | 8.8864% | 未验证 |
| 43 | inbox | `inbox-collected-all` · 消息 / 全部收完，横条消失 | [参考](../design-reference/figma/inbox-collected-all.png) | [历史实现](r09-audit/812-en-inbox-collected-all.png) / [并排](r25/total/inbox-collected-all-side-by-side.png) | 10.0401% | 未验证 |
| 44 | inbox | `inbox-unread` · 消息 / 已有未读会话 | [参考](../design-reference/figma/inbox-unread.png) | [历史实现](r09-audit/812-en-inbox-unread.png) / [并排](r25/total/inbox-unread-side-by-side.png) | 6.2368% | 未验证 |
| 45 | inbox | `inbox-read` · 消息 / 所有消息已读 | [参考](../design-reference/figma/inbox-read.png) | [历史实现](r09-audit/812-en-inbox-read.png) / [并排](r25/total/inbox-read-side-by-side.png) | 6.0164% | 未验证 |
| 46 | inbox | `inbox-friends-empty` · 好友 / 空状态 | [参考](../design-reference/figma/inbox-friends-empty.png) | [历史实现](r09-audit/812-en-inbox-friends-empty.png) / [并排](r25/total/inbox-friends-empty-side-by-side.png) | 5.8640% | 未验证 |
| 47 | inbox | `inbox-friends` · 好友 / 已关注会话 | [参考](../design-reference/figma/inbox-friends.png) | [历史实现](r09-audit/812-en-inbox-friends.png) / [并排](r25/total/inbox-friends-side-by-side.png) | 4.7264% | 未验证 |
| 48 | inbox | `inbox-drawer` · 消息 / 右侧菜单 | [参考](../design-reference/figma/inbox-drawer.png) | [历史实现](r09-audit/812-en-inbox-drawer.png) / [并排](r25/total/inbox-drawer-side-by-side.png) | 97.2778% | 未验证 |
| 49 | inbox | `inbox-search` · 消息 / 搜索匹配 | [参考](../design-reference/figma/inbox-search.png) | [历史实现](r09-audit/812-en-inbox-search.png) / [并排](r25/total/inbox-search-side-by-side.png) | 8.6867% | 未验证 |
| 50 | inbox | `inbox-search-empty` · 消息 / 搜索无结果 | [参考](../design-reference/figma/inbox-search-empty.png) | [历史实现](r09-audit/812-en-inbox-search-empty.png) / [并排](r25/total/inbox-search-empty-side-by-side.png) | 10.8082% | 未验证 |
| 51 | inbox | `inbox-options` · 会话 / 更多操作 | [参考](../design-reference/figma/inbox-options.png) | [历史实现](r09-audit/812-en-inbox-options.png) / [并排](r25/total/inbox-options-side-by-side.png) | 47.1793% | 未验证 |
| 52 | inbox | `inbox-pinned` · 会话 / 已置顶并静音 | [参考](../design-reference/figma/inbox-pinned.png) | [历史实现](r09-audit/812-en-inbox-pinned.png) / [并排](r25/total/inbox-pinned-side-by-side.png) | 6.1655% | 未验证 |
| 53 | inbox | `inbox-hidden` · 隐藏会话 / 有记录 | [参考](../design-reference/figma/inbox-hidden.png) | [历史实现](r09-audit/812-en-inbox-hidden.png) / [并排](r25/total/inbox-hidden-side-by-side.png) | 15.2450% | 未验证 |
| 54 | inbox | `inbox-hidden-empty` · 隐藏会话 / 空状态 | [参考](../design-reference/figma/inbox-hidden-empty.png) | [历史实现](r09-audit/812-en-inbox-hidden-empty.png) / [并排](r25/total/inbox-hidden-empty-side-by-side.png) | 16.1882% | 未验证 |
| 55 | inbox | `inbox-notifications-off` · 消息 / 通知提醒条 | [参考](../design-reference/figma/inbox-notifications-off.png) | [历史实现](r09-audit/812-en-inbox-notifications-off.png) / [并排](r25/total/inbox-notifications-off-side-by-side.png) | 9.2158% | 未验证 |
| 56 | reply-cost | `reply-last-free` · 回信 / 剩余 1 次免费 | [参考](../design-reference/figma/reply-last-free.png) | [历史实现](r10-audit/812-en-reply-last-free.png) / [并排](r25/total/reply-last-free-side-by-side.png) | 6.9593% | 未验证 |
| 57 | reply-cost | `reply-payment` · 回信 / 10 次用完，付费确认 | [参考](../design-reference/figma/reply-payment.png) | [历史实现](r10-audit/812-en-reply-payment.png) / [并排](r25/total/reply-payment-side-by-side.png) | 81.2437% | 未验证 |
| 58 | reply-cost | `reply-shortage` · 回信 / 钻石不足 | [参考](../design-reference/figma/reply-shortage.png) | [历史实现](r10-audit/812-en-reply-shortage.png) / [并排](r25/total/reply-shortage-side-by-side.png) | 79.0433% | 未验证 |
| 59 | reply-cost | `reply-cancelled` · 回信 / 取消付费，仍待收取 | [参考](../design-reference/figma/reply-cancelled.png) | [历史实现](r10-audit/812-en-reply-cancelled.png) / [并排](r25/total/reply-cancelled-side-by-side.png) | 10.9120% | 未验证 |
| 60 | reply-cost | `reply-paid` · 回信 / 付费收取完成 | [参考](../design-reference/figma/reply-paid.png) | [历史实现](r10-audit/812-en-reply-paid.png) / [并排](r25/total/reply-paid-side-by-side.png) | 8.6069% | 未验证 |
| 61 | reply-cost | `reply-topup` · 回信 / 进入钻石补充 | [参考](../design-reference/figma/reply-topup.png) | [历史实现](r10-audit/812-en-reply-topup.png) / [并排](r25/total/reply-topup-side-by-side.png) | 53.6959% | 未验证 |
| 62 | chat | `chat-waiting` · 对话 / 等待对方回复 | [参考](../design-reference/figma/chat-waiting.png) | [历史实现](r11-audit/812-en-chat-waiting.png) / [并排](r25/total/chat-waiting-side-by-side.png) | 27.3934% | 未验证 |
| 63 | chat | `chat-receipt-waiting` · 对话 / 回信已到，尚未收取 | [参考](../design-reference/figma/chat-receipt-waiting.png) | [历史实现](r11-audit/812-en-chat-receipt-waiting.png) / [并排](r25/total/chat-receipt-waiting-side-by-side.png) | 27.7833% | 未验证 |
| 64 | chat | `chat-open` · 对话 / 已回复，可继续交流 | [参考](../design-reference/figma/chat-open.png) | [历史实现](r11-audit/812-en-chat-open.png) / [并排](r25/total/chat-open-side-by-side.png) | 29.8732% | 未验证 |
| 65 | chat | `chat-draft` · 对话 / 正在编辑 | [参考](../design-reference/figma/chat-draft.png) | [历史实现](r11-audit/812-en-chat-draft.png) / [并排](r25/total/chat-draft-side-by-side.png) | 23.7888% | 未验证 |
| 66 | chat | `chat-sent` · 对话 / 消息已发送 | [参考](../design-reference/figma/chat-sent.png) | [历史实现](r11-audit/812-en-chat-sent.png) / [并排](r25/total/chat-sent-side-by-side.png) | 24.3704% | 未验证 |
| 67 | chat | `chat-photo` · 对话 / 图片消息 | [参考](../design-reference/figma/chat-photo.png) | [历史实现](r11-audit/812-en-chat-photo.png) / [并排](r25/total/chat-photo-side-by-side.png) | 39.9780% | 未验证 |
| 68 | chat | `chat-attachment` · 对话 / 待发送图片 | [参考](../design-reference/figma/chat-attachment.png) | [历史实现](r11-audit/812-en-chat-attachment.png) / [并排](r25/total/chat-attachment-side-by-side.png) | 23.7612% | 未验证 |
| 69 | chat | `chat-stickers` · 对话 / 表情选择 | [参考](../design-reference/figma/chat-stickers.png) | [历史实现](r11-audit/812-en-chat-stickers.png) / [并排](r25/total/chat-stickers-side-by-side.png) | 45.9599% | 未验证 |
| 70 | chat | `chat-sticker-selected` · 对话 / 表情待发送 | [参考](../design-reference/figma/chat-sticker-selected.png) | [历史实现](r11-audit/812-en-chat-sticker-selected.png) / [并排](r25/total/chat-sticker-selected-side-by-side.png) | 39.3603% | 未验证 |
| 71 | chat | `chat-recording` · 对话 / 录音中（演示） | [参考](../design-reference/figma/chat-recording.png) | [历史实现](r11-audit/812-en-chat-recording.png) / [并排](r25/total/chat-recording-side-by-side.png) | 35.2660% | 未验证 |
| 72 | chat | `chat-record-cancel` · 对话 / 上滑取消录音 | [参考](../design-reference/figma/chat-record-cancel.png) | [历史实现](r11-audit/812-en-chat-record-cancel.png) / [并排](r25/total/chat-record-cancel-side-by-side.png) | 35.2263% | 未验证 |
| 73 | chat | `chat-mic-denied` · 对话 / 麦克风不可用 | [参考](../design-reference/figma/chat-mic-denied.png) | [历史实现](r11-audit/812-en-chat-mic-denied.png) / [并排](r25/total/chat-mic-denied-side-by-side.png) | 41.8585% | 未验证 |
| 74 | chat | `chat-details` · 对话设置 / 已解锁 | [参考](../design-reference/figma/chat-details.png) | [历史实现](r12-audit/812-en-chat-details.png) / [并排](r25/total/chat-details-side-by-side.png) | 5.6190% | 未验证 |
| 75 | chat | `chat-details-waiting` · 对话设置 / 未回复锁定 | [参考](../design-reference/figma/chat-details-waiting.png) | [历史实现](r12-audit/812-en-chat-details-waiting.png) / [并排](r25/total/chat-details-waiting-side-by-side.png) | 12.7130% | 未验证 |
| 76 | chat | `chat-remark` · 对话设置 / 备注名 | [参考](../design-reference/figma/chat-remark.png) | [历史实现](r12-audit/812-en-chat-remark.png) / [并排](r25/total/chat-remark-side-by-side.png) | 47.9494% | 未验证 |
| 77 | chat | `chat-search-empty` · 聊天搜索 / 待输入 | [参考](../design-reference/figma/chat-search-empty.png) | [历史实现](r12-audit/812-en-chat-search-empty.png) / [并排](r25/total/chat-search-empty-side-by-side.png) | 1.4900% | 未验证 |
| 78 | chat | `chat-search-result` · 聊天搜索 / 有结果 | [参考](../design-reference/figma/chat-search-result.png) | [历史实现](r12-audit/812-en-chat-search-result.png) / [并排](r25/total/chat-search-result-side-by-side.png) | 45.2696% | 未验证 |
| 79 | chat | `chat-search-none` · 聊天搜索 / 无结果 | [参考](../design-reference/figma/chat-search-none.png) | [历史实现](r12-audit/812-en-chat-search-none.png) / [并排](r25/total/chat-search-none-side-by-side.png) | 5.4522% | 未验证 |
| 80 | chat | `chat-clear-confirm` · 聊天记录 / 清空确认 | [参考](../design-reference/figma/chat-clear-confirm.png) | [历史实现](r12-audit/812-en-chat-clear-confirm.png) / [并排](r25/total/chat-clear-confirm-side-by-side.png) | 66.8036% | 未验证 |
| 81 | chat | `chat-cleared` · 聊天记录 / 清空后 | [参考](../design-reference/figma/chat-cleared.png) | 缺失；不补图 | 未测量 | 未验证 |
| 82 | appearance | `wallpapers` · 背景 / 壁纸列表 | [参考](../design-reference/figma/wallpapers.png) | [历史实现](r13-audit/812-en-wallpapers.png) / [并排](r25/total/wallpapers-side-by-side.png) | 45.4985% | 未验证 |
| 83 | appearance | `wallpaper-preview` · 背景 / 大图预览 | [参考](../design-reference/figma/wallpaper-preview.png) | [历史实现](r13-audit/812-en-wallpaper-preview.png) / [并排](r25/total/wallpaper-preview-side-by-side.png) | 58.3406% | 未验证 |
| 84 | appearance | `wallpaper-applied` · 对话 / 应用壁纸 | [参考](../design-reference/figma/wallpaper-applied.png) | [历史实现](r13-audit/812-en-wallpaper-applied.png) / [并排](r25/total/wallpaper-applied-side-by-side.png) | 92.3146% | 未验证 |
| 85 | appearance | `wallpaper-colors` · 背景 / 纯色选择 | [参考](../design-reference/figma/wallpaper-colors.png) | [历史实现](r13-audit/812-en-wallpaper-colors.png) / [并排](r25/total/wallpaper-colors-side-by-side.png) | 36.2742% | 未验证 |
| 86 | appearance | `chat-bubbles` · 气泡 / 默认设置 | [参考](../design-reference/figma/chat-bubbles.png) | [历史实现](r13-audit/812-en-chat-bubbles.png) / [并排](r25/total/chat-bubbles-side-by-side.png) | 3.3928% | 未验证 |
| 87 | appearance | `chat-bubbles-custom` · 气泡 / 自定义颜色 | [参考](../design-reference/figma/chat-bubbles-custom.png) | [历史实现](r13-audit/812-en-chat-bubbles-custom.png) / [并排](r25/total/chat-bubbles-custom-side-by-side.png) | 3.3846% | 未验证 |
| 88 | safety | `safety-choice` · 安全操作 / 举报或屏蔽 | [参考](../design-reference/figma/safety-choice.png) | [历史实现](r14-audit/812-en-safety-choice.png) / [并排](r25/total/safety-choice-side-by-side.png) | 32.1468% | 未验证 |
| 89 | safety | `report-empty` · 举报 / 原因表单 | [参考](../design-reference/figma/report-empty.png) | [历史实现](r14-audit/812-en-report-empty.png) / [并排](r25/total/report-empty-side-by-side.png) | 13.0085% | 未验证 |
| 90 | safety | `report-filled` · 举报 / 已填写内容 | [参考](../design-reference/figma/report-filled.png) | [历史实现](r14-audit/812-en-report-filled.png) / [并排](r25/total/report-filled-side-by-side.png) | 13.9153% | 未验证 |
| 91 | safety | `report-saved` · 举报 / 保存结果 | [参考](../design-reference/figma/report-saved.png) | 缺失；不补图 | 未测量 | 未验证 |
| 92 | safety | `block-confirm` · 屏蔽 / 二次确认 | [参考](../design-reference/figma/block-confirm.png) | [历史实现](r14-audit/812-en-block-confirm.png) / [并排](r25/total/block-confirm-side-by-side.png) | 69.3783% | 未验证 |
| 93 | safety | `chat-blocked` · 对话 / 已屏蔽 | [参考](../design-reference/figma/chat-blocked.png) | [历史实现](r14-audit/812-en-chat-blocked.png) / [并排](r25/total/chat-blocked-side-by-side.png) | 27.2167% | 未验证 |
| 94 | safety | `blocked-list` · 屏蔽名单 / 有记录 | [参考](../design-reference/figma/blocked-list.png) | [历史实现](r14-audit/812-en-blocked-list.png) / [并排](r25/total/blocked-list-side-by-side.png) | 1.7343% | 未验证 |
| 95 | safety | `blocked-empty` · 屏蔽名单 / 空状态 | [参考](../design-reference/figma/blocked-empty.png) | [历史实现](r14-audit/812-en-blocked-empty.png) / [并排](r25/total/blocked-empty-side-by-side.png) | 4.3468% | 未验证 |
| 96 | safety | `unblock-confirm` · 解除屏蔽 / 确认 | [参考](../design-reference/figma/unblock-confirm.png) | [历史实现](r14-audit/812-en-unblock-confirm.png) / [并排](r25/total/unblock-confirm-side-by-side.png) | 67.7186% | 未验证 |
| 97 | public-profile | `person-profile` · 用户资料 / 内容完整 | [参考](../design-reference/figma/person-profile.png) | [历史实现](r16-audit/812-en-person-profile.png) / [并排](r25/total/person-profile-side-by-side.png) | 35.1241% | 未验证 |
| 98 | public-profile | `person-waiting` · 用户资料 / 尚未回复 | [参考](../design-reference/figma/person-waiting.png) | [历史实现](r16-audit/812-en-person-waiting.png) / [并排](r25/total/person-waiting-side-by-side.png) | 19.2266% | 未验证 |
| 99 | public-profile | `person-followed` · 用户资料 / 已关注 | [参考](../design-reference/figma/person-followed.png) | [历史实现](r16-audit/812-en-person-followed.png) / [并排](r25/total/person-followed-side-by-side.png) | 35.2062% | 未验证 |
| 100 | public-profile | `person-no-content` · 用户资料 / 无动态 | [参考](../design-reference/figma/person-no-content.png) | [历史实现](r16-audit/812-en-person-no-content.png) / [并排](r25/total/person-no-content-side-by-side.png) | 18.1192% | 未验证 |
| 101 | public-profile | `person-photo` · 用户资料 / 头像大图 | [参考](../design-reference/figma/person-photo.png) | [历史实现](r16-audit/812-en-person-photo.png) / [并排](r25/total/person-photo-side-by-side.png) | 58.3672% | 未验证 |
| 102 | public-profile | `person-safety` · 用户资料 / 举报或屏蔽 | [参考](../design-reference/figma/person-safety.png) | [历史实现](r16-audit/812-en-person-safety.png) / [并排](r25/total/person-safety-side-by-side.png) | 44.0470% | 未验证 |
| 103 | profile | `profile-empty` · 个人页 / 尚未上传照片 | [参考](../design-reference/figma/profile-empty.png) | [历史实现](r17-audit/812-en-profile-empty.png) / [并排](r25/total/profile-empty-side-by-side.png) | 10.1291% | 未验证 |
| 104 | profile | `profile-content` · 个人页 / 已有形象照 | [参考](../design-reference/figma/profile-content.png) | [历史实现](r17-audit/812-en-profile-content.png) / [并排](r25/total/profile-content-side-by-side.png) | 15.8617% | 未验证 |
| 105 | profile | `profile-edit` · 编辑资料 / 当前信息 | [参考](../design-reference/figma/profile-edit.png) | [历史实现](r17-audit/812-en-profile-edit.png) / [并排](r25/total/profile-edit-side-by-side.png) | 8.8785% | 未验证 |
| 106 | profile | `profile-invalid` · 编辑资料 / 年龄校验 | [参考](../design-reference/figma/profile-invalid.png) | [历史实现](r17-audit/812-en-profile-invalid.png) / [并排](r25/total/profile-invalid-side-by-side.png) | 60.7760% | 未验证 |
| 107 | profile | `avatar-gallery` · 头像 / 已上传与空槽位 | [参考](../design-reference/figma/avatar-gallery.png) | [历史实现](r18-audit/812-en-avatar-gallery.png) / [并排](r25/total/avatar-gallery-side-by-side.png) | 44.4447% | 未验证 |
| 108 | profile | `avatar-remove` · 头像 / 移除确认 | [参考](../design-reference/figma/avatar-remove.png) | [历史实现](r18-audit/812-en-avatar-remove.png) / [并排](r25/total/avatar-remove-side-by-side.png) | 96.6092% | 未验证 |
| 109 | profile | `avatar-removed` · 头像 / 移除后的槽位 | [参考](../design-reference/figma/avatar-removed.png) | [历史实现](r18-audit/812-en-avatar-removed.png) / [并排](r25/total/avatar-removed-side-by-side.png) | 43.6923% | 未验证 |
| 110 | profile | `avatar-restore` · 头像 / 最近移除 | [参考](../design-reference/figma/avatar-restore.png) | [历史实现](r18-audit/812-en-avatar-restore.png) / [并排](r25/total/avatar-restore-side-by-side.png) | 34.1921% | 未验证 |
| 111 | profile | `avatar-full` · 头像 / 槽位已满 | [参考](../design-reference/figma/avatar-full.png) | [历史实现](r18-audit/812-en-avatar-full.png) / [并排](r25/total/avatar-full-side-by-side.png) | 48.5997% | 未验证 |
| 112 | profile | `avatar-crop` · 头像 / 上传裁切 | [参考](../design-reference/figma/avatar-crop.png) | [历史实现](r18-audit/812-en-avatar-crop.png) / [并排](r25/total/avatar-crop-side-by-side.png) | 53.4312% | 未验证 |
| 113 | profile | `profile-likes` · 个人页 / 获赞汇总 | [参考](../design-reference/figma/profile-likes.png) | [历史实现](r17-audit/812-en-profile-likes.png) / [并排](r25/total/profile-likes-side-by-side.png) | 93.8640% | 未验证 |
| 114 | profile | `following-empty` · 关注列表 / 空状态 | [参考](../design-reference/figma/following-empty.png) | [历史实现](r17-audit/812-en-following-empty.png) / [并排](r25/total/following-empty-side-by-side.png) | 3.5924% | 未验证 |
| 115 | profile | `following-list` · 关注列表 / 有记录 | [参考](../design-reference/figma/following-list.png) | [历史实现](r17-audit/812-en-following-list.png) / [并排](r25/total/following-list-side-by-side.png) | 3.4089% | 未验证 |
| 116 | profile | `followers-empty` · 粉丝列表 / 空状态 | [参考](../design-reference/figma/followers-empty.png) | [历史实现](r17-audit/812-en-followers-empty.png) / [并排](r25/total/followers-empty-side-by-side.png) | 3.5957% | 未验证 |
| 117 | profile | `visitors-empty` · 访客 / 尚无访问 | [参考](../design-reference/figma/visitors-empty.png) | [历史实现](r17-audit/812-en-visitors-empty.png) / [并排](r25/total/visitors-empty-side-by-side.png) | 3.8627% | 未验证 |
| 118 | profile | `visitors-outgoing` · 访客 / 我访问过的人 | [参考](../design-reference/figma/visitors-outgoing.png) | [历史实现](r17-audit/812-en-visitors-outgoing.png) / [并排](r25/total/visitors-outgoing-side-by-side.png) | 2.7396% | 未验证 |
| 119 | profile | `my-letters-empty` · 我的信件 / 空状态 | [参考](../design-reference/figma/my-letters-empty.png) | [历史实现](r17-audit/812-en-my-letters-empty.png) / [并排](r25/total/my-letters-empty-side-by-side.png) | 3.1228% | 未验证 |
| 120 | profile | `my-letters` · 我的信件 / 已寄出 | [参考](../design-reference/figma/my-letters.png) | [历史实现](r17-audit/812-en-my-letters.png) / [并排](r25/total/my-letters-side-by-side.png) | 1.9944% | 未验证 |
| 121 | image-cards | `card-type` · 上传形象照 / 选择照片类型 | [参考](../design-reference/figma/card-type.png) | [历史实现](r19-audit/812-en-card-type.png) / [并排](r25/total/card-type-side-by-side.png) | 27.7796% | 未验证 |
| 122 | image-cards | `card-options` · 已上传照片 / 操作菜单 | [参考](../design-reference/figma/card-options.png) | [历史实现](r19-audit/812-en-card-options.png) / [并排](r25/total/card-options-side-by-side.png) | 27.6611% | 未验证 |
| 123 | image-cards | `card-preview` · 已上传照片 / 大图查看 | [参考](../design-reference/figma/card-preview.png) | [历史实现](r19-audit/812-en-card-preview.png) / [并排](r25/total/card-preview-side-by-side.png) | 68.6292% | 未验证 |
| 124 | image-cards | `card-change-type` · 已上传照片 / 更换类型 | [参考](../design-reference/figma/card-change-type.png) | [历史实现](r19-audit/812-en-card-change-type.png) / [并排](r25/total/card-change-type-side-by-side.png) | 27.9412% | 未验证 |
| 125 | image-cards | `card-visibility` · 已上传照片 / 可见范围 | [参考](../design-reference/figma/card-visibility.png) | [历史实现](r19-audit/812-en-card-visibility.png) / [并排](r25/total/card-visibility-side-by-side.png) | 28.0578% | 未验证 |
| 126 | image-cards | `card-remove` · 已上传照片 / 移除确认 | [参考](../design-reference/figma/card-remove.png) | [历史实现](r19-audit/812-en-card-remove.png) / [并排](r25/total/card-remove-side-by-side.png) | 93.0322% | 未验证 |
| 127 | moments | `moments-empty` · 动态 / 空状态 | [参考](../design-reference/figma/moments-empty.png) | [历史实现](r20-audit/812-en-moments-empty.png) / [并排](r25/total/moments-empty-side-by-side.png) | 3.4828% | 未验证 |
| 128 | moments | `moments-list` · 动态 / 已发布 | [参考](../design-reference/figma/moments-list.png) | [历史实现](r20-audit/812-en-moments-list.png) / [并排](r25/total/moments-list-side-by-side.png) | 57.0105% | 未验证 |
| 129 | moments | `moments-category-empty` · 动态 / 分类无内容 | [参考](../design-reference/figma/moments-category-empty.png) | [历史实现](r20-audit/812-en-moments-category-empty.png) / [并排](r25/total/moments-category-empty-side-by-side.png) | 7.6424% | 未验证 |
| 130 | moments | `moment-empty` · 发布动态 / 空白 | [参考](../design-reference/figma/moment-empty.png) | [历史实现](r20-audit/812-en-moment-empty.png) / [并排](r25/total/moment-empty-side-by-side.png) | 17.1412% | 未验证 |
| 131 | moments | `moment-draft` · 发布动态 / 文字草稿 | [参考](../design-reference/figma/moment-draft.png) | [历史实现](r20-audit/812-en-moment-draft.png) / [并排](r25/total/moment-draft-side-by-side.png) | 17.4184% | 未验证 |
| 132 | moments | `moment-photo` · 发布动态 / 图片附件 | [参考](../design-reference/figma/moment-photo.png) | [历史实现](r20-audit/812-en-moment-photo.png) / [并排](r25/total/moment-photo-side-by-side.png) | 16.8808% | 未验证 |
| 133 | moments | `moment-stickers` · 发布动态 / 表情选择 | [参考](../design-reference/figma/moment-stickers.png) | [历史实现](r20-audit/812-en-moment-stickers.png) / [并排](r25/total/moment-stickers-side-by-side.png) | 47.5038% | 未验证 |
| 134 | moments | `moment-visibility` · 发布动态 / 可见范围 | [参考](../design-reference/figma/moment-visibility.png) | [历史实现](r20-audit/812-en-moment-visibility.png) / [并排](r25/total/moment-visibility-side-by-side.png) | 25.3658% | 未验证 |
| 135 | moments | `moment-leave` · 发布动态 / 离开前保留草稿 | [参考](../design-reference/figma/moment-leave.png) | [历史实现](r20-audit/812-en-moment-leave.png) / [并排](r25/total/moment-leave-side-by-side.png) | 99.9990% | 未验证 |
| 136 | moments | `moment-options` · 动态 / 操作菜单 | [参考](../design-reference/figma/moment-options.png) | [历史实现](r20-audit/812-en-moment-options.png) / [并排](r25/total/moment-options-side-by-side.png) | 47.9928% | 未验证 |
| 137 | moments | `moment-delete` · 动态 / 删除确认 | [参考](../design-reference/figma/moment-delete.png) | [历史实现](r20-audit/812-en-moment-delete.png) / [并排](r25/total/moment-delete-side-by-side.png) | 99.7140% | 未验证 |
| 138 | moments | `moment-saved` · 动态 / 保存完成 | [参考](../design-reference/figma/moment-saved.png) | [历史实现](r20-audit/812-en-moment-saved.png) / [并排](r25/total/moment-saved-side-by-side.png) | 61.9987% | 未验证 |
| 139 | settings | `settings-home` · 设置 / 主页面 | [参考](../design-reference/figma/settings-home.png) | [历史实现](r21/812-en-settings-home.png) / [并排](r25/total/settings-home-side-by-side.png) | 4.2844% | 待 Smith |
| 140 | settings | `language-en` · 语言 / English | [参考](../design-reference/figma/language-en.png) | [历史实现](r21/812-en-language-en.png) / [并排](r25/total/language-en-side-by-side.png) | 1.8913% | 待 Smith |
| 141 | settings | `language-ko` · 语言 / 한국어 | [参考](../design-reference/figma/language-ko.png) | [历史实现](r21/812-ko-language-ko.png) / [并排](r25/total/language-ko-side-by-side.png) | 1.6581% | 待 Smith |
| 142 | settings | `privacy` · 隐私 / 默认设置 | [参考](../design-reference/figma/privacy.png) | [历史实现](r22-reverify/privacy.png) / [并排](r25/total/privacy-side-by-side.png) | 34.2621% | 待 Smith |
| 143 | settings | `privacy-visibility` · 隐私 / 可见范围选择 | [参考](../design-reference/figma/privacy-visibility.png) | [历史实现](r22-reverify/privacy-visibility.png) / [并排](r25/total/privacy-visibility-side-by-side.png) | 91.4509% | 待 Smith |
| 144 | settings | `privacy-only-me` · 隐私 / 仅自己可见 | [参考](../design-reference/figma/privacy-only-me.png) | [历史实现](r22-reverify/privacy-only-me.png) / [并排](r25/total/privacy-only-me-side-by-side.png) | 34.2621% | 待 Smith |
| 145 | settings | `notifications-on` · 通知 / 已开启 | [参考](../design-reference/figma/notifications-on.png) | [历史实现](r21/812-en-notifications-on.png) / [并排](r25/total/notifications-on-side-by-side.png) | 15.5278% | 待 Smith |
| 146 | settings | `notifications-off` · 通知 / 总开关关闭 | [参考](../design-reference/figma/notifications-off.png) | [历史实现](r21/812-en-notifications-off.png) / [并排](r25/total/notifications-off-side-by-side.png) | 16.1133% | 待 Smith |
| 147 | settings | `general` · 通用 / 默认设置 | [参考](../design-reference/figma/general.png) | [历史实现](r21/812-en-general.png) / [并排](r25/total/general-side-by-side.png) | 3.5760% | 待 Smith |
| 148 | settings | `general-font` · 通用 / 系统字体 | [参考](../design-reference/figma/general-font.png) | [历史实现](r21/812-en-general-font.png) / [并排](r25/total/general-font-side-by-side.png) | 3.3908% | 待 Smith |
| 149 | settings | `cache-confirm` · 缓存 / 清理确认 | [参考](../design-reference/figma/cache-confirm.png) | [历史实现](r21/812-en-cache-confirm.png) / [并排](r25/total/cache-confirm-side-by-side.png) | 64.9376% | 待 Smith |
| 150 | account | `security` · 账号与安全 / 主页面 | [参考](../design-reference/figma/security.png) | [历史实现](r22-reverify/d7-security.png) / [并排](r25/total/security-side-by-side.png) | 9.6355% | 待 Smith |
| 151 | account | `account-info` · 账号 / 当前邮箱 | [参考](../design-reference/figma/account-info.png) | [历史实现](r22-reverify/d7-account-info.png) / [并排](r25/total/account-info-side-by-side.png) | 27.4013% | 待 Smith |
| 152 | account | `verification` · 身份验证 / 服务未接入 | [参考](../design-reference/figma/verification.png) | [历史实现](r22-reverify/d7-verification.png) / [并排](r25/total/verification-side-by-side.png) | 12.7025% | 待 Smith |
| 153 | account | `pin-create` · 应用锁 / 创建 PIN | [参考](../design-reference/figma/pin-create.png) | [历史实现](r22-reverify/d7-pin-create.png) / [并排](r25/total/pin-create-side-by-side.png) | 98.4923% | 待 Smith |
| 154 | account | `pin-invalid` · 应用锁 / PIN 格式错误 | [参考](../design-reference/figma/pin-invalid.png) | [历史实现](r22-reverify/d7-pin-invalid.png) / [并排](r25/total/pin-invalid-side-by-side.png) | 98.4923% | 待 Smith |
| 155 | account | `pin-locked` · 应用锁 / 输入 PIN | [参考](../design-reference/figma/pin-locked.png) | [历史实现](r22-reverify/d7-pin-locked.png) / [并排](r25/total/pin-locked-side-by-side.png) | 95.4644% | 待 Smith |
| 156 | account | `pin-wrong` · 应用锁 / PIN 错误 | [参考](../design-reference/figma/pin-wrong.png) | [历史实现](r22-reverify/d7-pin-wrong.png) / [并排](r25/total/pin-wrong-side-by-side.png) | 61.7698% | 待 Smith |
| 157 | account | `signout-confirm` · 退出登录 / 确认 | [参考](../design-reference/figma/signout-confirm.png) | [历史实现](r22-reverify/d7-signout-confirm.png) / [并排](r25/total/signout-confirm-side-by-side.png) | 94.9097% | 待 Smith |
| 158 | account | `signed-out` · 退出登录 / 返回欢迎 | [参考](../design-reference/figma/signed-out.png) | [历史实现](r22-reverify/d7-signed-out.png) / [并排](r25/total/signed-out-side-by-side.png) | 52.0154% | 待 Smith |
| 159 | account | `delete-disabled` · 注销 / 初始保护状态 | [参考](../design-reference/figma/delete-disabled.png) | [历史实现](r22-reverify/d7-delete-disabled.png) / [并排](r25/total/delete-disabled-side-by-side.png) | 32.8752% | 待 Smith |
| 160 | account | `delete-typed` · 注销 / 已输入 DELETE | [参考](../design-reference/figma/delete-typed.png) | [历史实现](r22-reverify/d7-delete-typed.png) / [并排](r25/total/delete-typed-side-by-side.png) | 33.0499% | 待 Smith |
| 161 | account | `delete-ready` · 注销 / 已确认数据范围 | [参考](../design-reference/figma/delete-ready.png) | [历史实现](r22-reverify/d7-delete-ready.png) / [并排](r25/total/delete-ready-side-by-side.png) | 32.8263% | 待 Smith |
| 162 | account | `delete-final` · 注销 / 最终确认 | [参考](../design-reference/figma/delete-final.png) | [历史实现](r22-reverify/d7-delete-final.png) / [并排](r25/total/delete-final-side-by-side.png) | 78.7435% | 待 Smith |
| 163 | support | `help` · 帮助与支持 / 主页面 | [参考](../design-reference/figma/help.png) | [历史实现](r23/812-en-help.png) / [并排](r25/total/help-side-by-side.png) | 5.5071% | 待 Smith |
| 164 | support | `faq` · 帮助中心 / 问题列表 | [参考](../design-reference/figma/faq.png) | [历史实现](r23/812-en-faq.png) / [并排](r25/total/faq-side-by-side.png) | 3.5097% | 待 Smith |
| 165 | support | `faq-expanded` · 帮助中心 / 展开答案 | [参考](../design-reference/figma/faq-expanded.png) | [历史实现](r23/812-en-faq-expanded.png) / [并排](r25/total/faq-expanded-side-by-side.png) | 4.5297% | 待 Smith |
| 166 | support | `feedback-empty` · 反馈 / 空表单 | [参考](../design-reference/figma/feedback-empty.png) | [历史实现](r23/812-en-feedback-empty.png) / [并排](r25/total/feedback-empty-side-by-side.png) | 27.8059% | 待 Smith |
| 167 | support | `feedback-filled` · 反馈 / 已填写 | [参考](../design-reference/figma/feedback-filled.png) | [历史实现](r23/812-en-feedback-filled.png) / [并排](r25/total/feedback-filled-side-by-side.png) | 28.7878% | 待 Smith |
| 168 | support | `feedback-invalid` · 反馈 / 联系邮箱错误 | [参考](../design-reference/figma/feedback-invalid.png) | [历史实现](r23/812-en-feedback-invalid.png) / [并排](r25/total/feedback-invalid-side-by-side.png) | 30.6755% | 待 Smith |
| 169 | support | `feedback-history` · 反馈 / 已保存记录 | [参考](../design-reference/figma/feedback-history.png) | 缺失；不补图 | 未测量 | 待 Smith |
| 170 | support | `about` · 关于 MauGo | [参考](../design-reference/figma/about.png) | [历史实现](r23/812-en-about.png) / [并排](r25/total/about-side-by-side.png) | 34.6450% | 待 Smith |
| 171 | support | `guidelines` · 社区规范 | [参考](../design-reference/figma/guidelines.png) | [历史实现](r23/812-en-guidelines.png) / [并排](r25/total/guidelines-side-by-side.png) | 4.2342% | 待 Smith |
| 172 | support | `safety-guide` · 安全指南 | [参考](../design-reference/figma/safety-guide.png) | [历史实现](r23/812-en-safety-guide.png) / [并排](r25/total/safety-guide-side-by-side.png) | 3.7570% | 待 Smith |
| 173 | support | `privacy-policy` · 隐私说明 | [参考](../design-reference/figma/privacy-policy.png) | [历史实现](r23/812-en-privacy-policy.png) / [并排](r25/total/privacy-policy-side-by-side.png) | 7.3491% | 待 Smith |
| 174 | support | `terms-full` · 服务条款与 EULA | [参考](../design-reference/figma/terms-full.png) | [历史实现](r23/812-en-terms-full.png) / [并排](r25/total/terms-full-side-by-side.png) | 18.1455% | 待 Smith |
| 175 | support | `system-empty` · 系统消息 / 空状态 | [参考](../design-reference/figma/system-empty.png) | [历史实现](r23/812-en-system-empty.png) / [并排](r25/total/system-empty-side-by-side.png) | 4.4670% | 待 Smith |
| 176 | support | `interactions-empty` · 互动 / 空状态 | [参考](../design-reference/figma/interactions-empty.png) | [历史实现](r23/812-en-interactions-empty.png) / [并排](r25/total/interactions-empty-side-by-side.png) | 4.2614% | 待 Smith |
| 177 | diamonds | `wallet-empty` · 钻石 / 零余额 | [参考](../design-reference/figma/wallet-empty.png) | [历史实现](r24/812-en-wallet-empty.png) / [并排](r25/total/wallet-empty-side-by-side.png) | 45.4460% | 待 Smith |
| 178 | diamonds | `wallet-balance` · 钻石 / 有余额 | [参考](../design-reference/figma/wallet-balance.png) | 缺失；不补图 | 未测量 | 待 Smith |
| 179 | diamonds | `topup-confirm` · 钻石 / 套餐确认 | [参考](../design-reference/figma/topup-confirm.png) | [历史实现](r24/812-en-topup-confirm.png) / [并排](r25/total/topup-confirm-side-by-side.png) | 93.9025% | 待 Smith |
| 180 | diamonds | `topup-success` · 钻石 / 模拟充值完成 | [参考](../design-reference/figma/topup-success.png) | 缺失；不补图 | 未测量 | 待 Smith |
| 181 | diamonds | `pass-default` · Filter Pass / 未开通 | [参考](../design-reference/figma/pass-default.png) | [历史实现](r24/812-en-pass-default.png) / [并排](r25/total/pass-default-side-by-side.png) | 52.3780% | 待 Smith |
| 182 | diamonds | `pass-one-day` · Filter Pass / 1 天方案 | [参考](../design-reference/figma/pass-one-day.png) | [历史实现](r24/812-en-pass-one-day.png) / [并排](r25/total/pass-one-day-side-by-side.png) | 52.3790% | 待 Smith |
| 183 | diamonds | `pass-month` · Filter Pass / 30 天方案 | [参考](../design-reference/figma/pass-month.png) | [历史实现](r24/812-en-pass-month.png) / [并排](r25/total/pass-month-side-by-side.png) | 52.3770% | 待 Smith |
| 184 | diamonds | `pass-shortage` · Filter Pass / 余额不足 | [参考](../design-reference/figma/pass-shortage.png) | [历史实现](r24/812-en-pass-shortage.png) / [并排](r25/total/pass-shortage-side-by-side.png) | 91.6253% | 待 Smith |
| 185 | diamonds | `pass-confirm` · Filter Pass / 支付确认 | [参考](../design-reference/figma/pass-confirm.png) | 缺失；不补图 | 未测量 | 待 Smith |
| 186 | diamonds | `pass-active` · Filter Pass / 已开通 | [参考](../design-reference/figma/pass-active.png) | 缺失；不补图 | 未测量 | 待 Smith |
| 187 | diamonds | `pass-extend` · Filter Pass / 延长期限确认 | [参考](../design-reference/figma/pass-extend.png) | 缺失；不补图 | 未测量 | 待 Smith |
| 188 | diamonds | `pass-success` · Filter Pass / 购买完成 | [参考](../design-reference/figma/pass-success.png) | 缺失；不补图 | 未测量 | 待 Smith |
| 189 | diamonds | `pass-sheet` · 筛选入口 / Pass 弹层 | [参考](../design-reference/figma/pass-sheet.png) | [历史实现](r24/812-en-pass-sheet.png) / [并排](r25/total/pass-sheet-side-by-side.png) | 65.3924% | 待 Smith |

## 保留的原型与业务冲突

原型依据直接复核各轮本地摘录：[R21](r21/prototype-excerpts.txt)、[R22](r22/prototype-excerpts.txt)、[R23](r23/prototype-extract.txt)、[R24](r24/prototype-extract.txt)。未调用Figma API/token。其余模块原型与效果依据见R06–R20各轮result和audit-result；本轮无新模块样式。

- R21七项：[原始完整记录](R21-result.md)。主设置缺退出/注销；隐私能力和Save流程不同；通知分类不同；缓存仅删草稿、无容量/图片管理；general-font标题字重；韩文措辞；旧CSS颜色字面量。R25只清理CSS色值，其他项保留待定。
- R22八项：[原始完整记录](R22-result.md)。账号入口/切换不同；真实服务端账号与预览注销不同；退出弹层来源不同；F07清理规则与旧提示冲突；注销挑战token/密码字段；PIN行内alert与toast不同；元素色彩/字号/插画尺寸仍待逐项测量；旧CSS色值。R25不改这些业务与会话。D7当前仍有重新登录PIN等待失败，不能用schema smoke通过代替全流程通过。R25专用F07回归已2/2通过，但这不消除原型文案冲突，也不外推为R22全部13态通过。
- R23：[完整记录](R23-result.md)。feedback-history没有当前实现或历史接口，范围待Smith；不伪造历史列表。原型本地反馈与当前服务器提交/2000字限制不同，附件与Share缺失；terms-full节点25:19082与实际29:19082冲突、隐私/法律草稿和客服邮箱仍待Smith，不借收尾轮改内容或业务。
- R24：[完整记录](R24-result.md)。wallet-balance、topup-success、pass-confirm、pass-active、pass-extend、pass-success六态需要真实余额／Pass／StoreKit条件，待Smith在app内验证。原型本地模拟加钻不能替换当前StoreKit验证；方案即确认、短缺页摘要/disabled按钮、取消恢复页和成功独立页均与原型不同。F02幂等键重试失败只记录。

D9测试使用独立数据库和既有测试状态端点时，其购买回归结果也不能作为这六态的真实截图验收。真实充值、真实扣钻未在走查执行。

缺图态维持未验证或待Smith；需逐态真实导航、原型核对、效果和英韩小屏审核后，才能更新验收状态。
