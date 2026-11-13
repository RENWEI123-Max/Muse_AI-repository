# D9 模块 16 验收结果（任务 #76 / Issue #62）

2026-11-13。**部分完成：13 个状态中 11 个功能状态通过，2 个未通过；D9 尚未完成。**

仅修改 client/。复用 HomeFlow、ReplyTopup 与现有 API，不新增依赖，不修改后端。状态依据交接资料 `04-开发资料/page-states.json` 的 diamonds 分组；界面参照原型 Filter Pass 的介绍、权益、时长、余额与确认布局。保留弹层进出、方案选中、钻石浮动和确认面板动效。未进行原生设备或逐像素保真验收，因此不宣称全量视觉验收通过。

## 逐项结果

| 状态 | 结果 | 实际证据与截图 |
| --- | --- | --- |
| wallet-empty | 通过（余额功能） | 真实 GET /wallet 返回 0，显示 0 diamonds；[截图](d9-wallet-empty.png)。价格与支付缺口见下方。 |
| wallet-balance | 通过（余额功能） | 隔离库设为 1000，重新进入后 GET /wallet 回读显示 1000；[截图](d9-wallet-balance.png)。 |
| topup-confirm | **未通过** | 商品目录取自 B12 /payments/apple/products，显示 100/550/1200/2600 四档；已去掉写死美元价。尚无 StoreKit 本地化价格和交易接入，明确显示不可购买并禁用支付；[阻塞截图](d9-topup-confirm-blocked.png)。不能将此当作套餐确认完成。 |
| topup-success | **未通过** | 没有伪造充值或余额增量；B12 verify 返回 503（Apple 配置缺失）。[阻塞截图](d9-topup-success-blocked.png)。未执行真实沙盒充值、Apple 取消或成功后余额回读。 |
| pass-default | 通过 | 默认选中 7 天 / 150 钻石，未开通，显示余额与非自动续费说明；[截图](d9-pass-default.png)。 |
| pass-one-day | 通过 | 点击选择 1 天 / 30 钻石，选中状态过渡；[截图](d9-pass-one-day.png)。 |
| pass-month | 通过 | 点击选择 30 天 / 480 钻石；[截图](d9-pass-month.png)。 |
| pass-shortage | 通过 | 余额 0，确认按钮禁用，显示不足金额与充值入口；真实 POST /filter-pass/purchase 同时验证返回 402，流水为空；[截图](d9-pass-shortage.png)。 |
| pass-confirm | 通过 | 显示 7 天、150 钻石、当前余额和预计到期；点击取消后余额仍为 1000、流水为空；[截图](d9-pass-confirm.png)。 |
| pass-active | 通过 | 真实权益回读显示剩余 7 天及到期时间；[截图](d9-pass-active.png)。 |
| pass-extend | 通过 | 已开通时展示 Extend 与累加后的到期时间；续期 1 天扣 30，期限准确增加 86400000ms；[截图](d9-pass-extend.png)。 |
| pass-success | 通过 | 带 Idempotency-Key 调用真实购买接口，成功后重新 GET /wallet 和 GET /filter-pass，显示余额 850、权益与成功信息；[截图](d9-pass-success.png)。 |
| pass-sheet | 通过 | 从筛选入口打开可交互 Pass 弹层，方案直接进入支付确认；[截图](d9-pass-sheet.png)。另验证此入口成功购买、取消后性别与年龄筛选值保留。 |

补充到期验收：把隔离库用户期限设为过去，页面显示已到期，筛选中的年龄控件重新锁定；[截图](d9-pass-expired.png)。

## 验证范围与账务证据

- `npm run build` 通过，含 343 个素材校验、vue-tsc 和 Vite 构建。
- `tests/d9.config.ts` + `tests/d9.spec.ts` 浏览器用例通过。Chromium 375×812；真实 buildApp 后端与迁移，未 mock 业务 API、未替换 Apple 验签器。
- 最终运行数据库：`maugo_d9_task76_1794552310144`。只在新建隔离库中创建测试账号、设置余额与期限；测试库保留，未删除生产或测试数据。测试环境连接通过 D9_ENV_FILE / TEST_DATABASE_URL 提供。
- 余额种子 1000 是测试夹具，**不是充值成功证据**。
- 首购 7 天：流水 `-150 / balance_after=850`，一次购买记录，到期 `2026-11-20T06:45:27.699Z`。
- 续期 1 天：追加流水 `-30 / balance_after=820`，共两次购买记录，到期 `2026-11-21T06:45:27.699Z`，与首购相差 24 小时。
- 余额不足：API 返回 402，余额仍为 0、无流水。确认前取消：余额仍为 1000、无流水。关闭充值页不会购买 Pass。
- 原筛选弹层回归：到期后重买 1 天，820 → 790；随后支付确认取消，余额保持 790，Woman、23–40 年龄筛选保持。页面无未捕获 JavaScript 错误。
- 现有 home.spec / pass-confirmation.spec 的独立运行因公共 3001 端口被占用未启动；未停止其他服务，也不将这组测试计为通过。上述入口回归已包含在 D9 独立端口用例中。

## 未通过项与 Smith 待决定事项

1. **topup-confirm、topup-success 未完成**。客户端尚缺真实 StoreKit 商品查询、购买、签名交易提交到 `/payments/apple/verify` 的实现；浏览器没有原生商店。当前明确禁止付款，不接受输入伪收据，不使用 economy.json 的 usd 字段作为商店展示价。
2. 后端实际返回：`Missing Apple configuration: APPLE_BUNDLE_ID, APPLE_API_KEY_ID, APPLE_API_ISSUER_ID, APPLE_API_KEY_PATH`。需要 Smith 提供/部署 Apple 沙盒配置（安全注入，不提交密钥）、确认 App Store Connect 中四个商品及沙盒测试账号可用，并确定原生 iOS 商店验收环境。之后仍需实现并验收 StoreKit 客户端链路，不能仅配置后端就宣布完成。
3. 真实沙盒充值成功、Apple 取消不扣款、服务端验证入账及充值成功余额回读，以及原生设备动效/完整高保真验收仍未通过。Filter Pass 只花钻石，不另设 IAP 商品。

所有截图保存在 client/docs/，不依赖 test-results/。未执行 git push。
