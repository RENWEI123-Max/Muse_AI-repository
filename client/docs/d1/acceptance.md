# 任务 #47 · D1 模块 05 验收

实现位于 client/src/components/InboxFlow.vue 的收取接入和 ReplyTopup.vue；测试位于 tests/d1.spec.ts。未修改 maugo 后端、聊天及其他已通过模块的业务实现。C7 测试仅补正 HTMLImageElement 类型以恢复构建。

## 通过清单

- reply-last-free：服务端剩余 1 次时显示「1 free today」，真实免费收取余额不变。
- reply-payment：免费 10 次用完后显示 10 diamonds、余额与支付后余额，确认前不扣费。
- reply-shortage：余额不足显示反馈、差额、Get diamonds，禁止收取。
- reply-cancelled：Not now 关闭确认，待收数量和余额不变；关闭按钮与 Escape 同样取消。
- reply-paid：确认后真实 B5 收取成功，待收数减少；断网丢失响应后使用同一幂等键重试，WalletLedger 仅一条 -10，余额只减少 10。
- reply-topup：进入有套餐选择、价格和动画的钻石补充页；返回读取服务端钱包并恢复原回信，再次明确确认费用。
- npm run build 通过；npm run dev 由 Playwright 启动并实际访问通过。
- D1 浏览器全流程通过，6 张动画完成后的截图见 screenshots/。
- 使用现有 auth-server.mjs 为每轮新建 maugo_client_c2_test_* 隔离数据库，不删除数据库，不写生产业务表。
- C6 图片历史和待发图片回归通过。

## 失败 / 未完成清单

- 真实充值支付尚未接入：B5 只有受信任的 creditWallet 内部函数，没有客户端可调用的支付订单/验证接口。补充页诚实提示 Payments are not available yet，不伪造余额或客户端充值。测试的回补使用隔离数据库专用 fixture。需要 Smith 决定支付适配器及接口；真实支付重复回调本次无法端到端验收。
- 额外 C6 waiting → reply → collect → send 回归在 tests/chat.spec.ts:4 的 Back to messages 控件等待超时，未改动 C6 实现，也未宣称该回归通过。
- UI 按原型弹窗配色、尺寸、钻石素材、文案与套餐对照并保留动画；未进行逐像素自动相似度验收。

环境变量沿用 VITE_API_BASE_URL；开发代理目标 MAUGO_API_TARGET 默认 http://127.0.0.1:3000，验收指向隔离后端 3001。
