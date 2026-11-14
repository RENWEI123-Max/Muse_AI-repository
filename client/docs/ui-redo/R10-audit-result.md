# R10 回复补查

基线 ff944d7；分支 codex/r10-audit；Mac mini；不合入 main。

## 动手前原型摘录

六态操作脚本见 [state-script.json](r10-audit/state-script.json)，原型函数原文见 [prototype-excerpts.md](r10-audit/prototype-excerpts.md)，本地原型和 Figma JSON 哈希见 [references.json](r10-audit/references.json)。尺寸颜色依 Figma，流程效果文案依原型；不使用 Figma API/token。

| 状态 | 点哪里 → 去哪里 → 返回 | 函数/文案 |
|---|---|---|
| reply-last-free | 收信箱剩1次免费 → Collect replies直接收1封 → 原列表 | collectOneReply；1 free today / One reply collected. |
| reply-payment | 免费用完 → Collect replies → 付费确认；确认收1封；×/背景/Not now返回原列表 | requestCollectPayment/showPaymentDialog；Collect one reply? / Your 10 free replies for today have been used. Pay only for this one reply. / Total / Your balance / Balance after payment / Collect reply · 10 diamonds |
| reply-shortage | Collect replies → 不足确认；Get diamonds → 商店；Not now/关闭回原列表 | requestCollectPayment；Not enough diamonds / Collecting one reply costs 10 diamonds. / Still needed |
| reply-cancelled | 付费确认 → Not now → 原列表，回应仍在，不消耗 | showPaymentDialog close；Not now |
| reply-paid | 付费确认 → 确认 → 原列表新未读、待收减1；行→chat→Back回列表 | collectOneReply；One reply collected.；实际权限以服务端为准 |
| reply-topup | 不足 → Get diamonds → 商店；套餐→Purchase preview确认/取消；Back to replies→重新检查同一回应 | showDiamondStore/confirmDiamondPack；Diamonds / Diamonds for filters and extra replies. / Confirm preview / No real payment will be collected. |

Filter Pass边界：回复来源的商店 Back to replies 返回收取确认，没有从回复商店直接去Filter Pass的入口；独立商店的Explore Filter Pass→showFilterPass；filterPass/requestPassPayment按时长确认或不足→充值→回原时长。原型本地加余额/扣钻/权限演示不移植。

失败：persist失败恢复queue/quota/chats/purchases，提示Unable to save right now. Please try again.；真实实现保留API失败与服务端结算。

滚动：screen/app-view固定；inbox page-body内滚；store sheet overflow:auto；payment-dialog内滚，整页不滚。

效果清单（实现前读取）：collect按下scale(.99)，无指定时长；普通sheet-in 300ms ease-out（opacity0/translateY30→正常）；payment-dialog sheet-in 220ms ease-out；新收取行reply-arrive 450ms ease-out（opacity0/translateY-8→正常）；toast成功2700ms后隐藏，opacity/transform过渡200ms。套餐点击直接进确认，原型未定义独立套餐选中动画。钻石插画无回复专属动画要求。

## 四项验收

整体 **未通过/待 Smith**。fixture通过不能等同真实支付/权限通过。

| 项目 | 结果 | 实际证据/范围 |
|---|---|---|
| 静态 | 通过（沿用既有基准，本轮不重新宣称全量像素通过） | 正常态几何/颜色/字体/素材不改；构建退出0；改动生产文件hex字面量、!important、.device前缀均0。旧R10的充值布局/紫色径向层缺口仍在，见下文。 |
| 流程 | 未通过/待 Smith | 六态×英韩×两高度真点走查；取消、×、Escape、收取503重试、充值返回/余额恢复确认、收取后开chat返回已走。免费直接收取与套餐确认形态仍不同，真实后端/StoreKit未验，原回归启动失败。 |
| 效果 | 通过（R10摘录清单的源码及fixture范围） | 收取条按下.99，确认220ms、充值sheet300ms、新行450ms；toast沿用R09的2700ms+200ms实现和实测证据；本轮没有新增动画。原生支付sheet效果不在浏览器证据内。 |
| 滑动与文案 | 未通过/待 Smith（浏览器六态覆盖通过，原生扩展分支未全覆盖） | 两高度英韩整页不滚、充值可内滚；补确认框内滚和充值返回韩文。可见文案横向裁切0；原生动态支付错误/成功文案缺韩文映射、未真实运行，不能声称全部英韩无缺口。 |

## 实现与范围

只在 reply.css 追加 `.reply-flow .reply-dialog` 的 overflow:auto / overscroll-behavior:contain / 隐藏滚动条，使返回提示和失败反馈增加高度后仍能滚到取消按钮；正常态几何不变。i18n.ts只增加R10字符串 `Diamonds added. Confirm collection to continue.` 的韩文映射。未修改 ReplyTopup.vue、InboxFlow.vue、App.vue、支付请求/扣钻/幂等/IAP代码、服务端、登录token/account存取或其他模块。范围及零值见 [source-checks.json](r10-audit/source-checks.json)。

截图人工复核发现，充值返回时状态提示挤占固定391.5高确认框，取消按钮在初始可见范围之外；原框无法内滚。本次恢复原型payment-dialog的overflow:auto。按钮仍须向下滚动可达，不改变正常态已验布局。失败时同样可滚到反馈与操作。

## 效果清单核对

| 项目 | 原型时长/行为 | 当前核对/本次 |
|---|---|---|
| 收取条按下 | scale(.99)，无指定时长 | 外壳已有；四组实测matrix(.99)；未重复加过渡 |
| 收取确认 | sheet-in220ms ease-out，opacity0/translateY30→正常 | 外壳与R09已有；四组computed 0.22s |
| 充值sheet | sheet-in300ms ease-out，opacity0/translateY30→正常 | 外壳已有；四组computed 0.3s |
| 新收取行 | reply-arrive450ms ease-out，opacity0/translateY-8→正常 | R09已有r09-arrive；本轮animationstart记录0.45s |
| 成功toast | 2700ms后隐藏；opacity/transform200ms、translateY8 | InboxFlow showCollectedNotice及components.css未改；[R09实际计时](r09-audit/667-en-walkthrough.json)同一实现；本轮截图成功toast，不冒称重测精确消失计时 |
| 套餐/钻石 | 点击套餐直接开确认；未定义独立选中/插画动画 | 不编造选中动画或钻石浮动；当前选套餐+Get按钮的流程差异列待Smith |
| 动效可及性 | 共用reduced-motion规则 | 保留既有规则；本轮未单独执行reduced-motion矩阵 |

本轮效果无需新增；实际新增为动态内容内滚和一条韩文映射。

## 缺口、冲突与边界

1. **免费收取未通过/待Smith**：原型免费直接collectOneReply；当前prepare先打开0钻确认。改动涉及收取业务/支付路径，本轮不改。真实额度以服务端为准。
2. **套餐确认未通过/待Smith**：原型套餐点击→Purchase preview→Confirm preview/Not now；当前选择套餐→Get diamonds→原生StoreKit。浏览器只提示iOS可用且不扣款；不迁入假余额/本地支付，不用假美元价格。原生取消、pending、verify失败/重试代码虽存在，Mac浏览器未实测。
3. **文案未通过/待Smith**：已补充值返回韩文；ReplyTopup.submit/buy中的动态Added…diamonds、Payment received but not yet confirmed…、Purchase failed…等没有完整韩文映射，原生分支未覆盖。未更改支付函数。截图中的Unavailable是web无StoreKit价格的明确不可用态，不伪造USD价格。测试用户Tea friend/消息原文属于用户内容。
4. **原静态缺口复核**：现有reply.css仍为充值余额单段strong、套餐background var(--bg-tile)，没有紫色径向层；真实购买确认按钮/说明/返回依旧使内容需滚动，与原稿内部布局仍不同。原R10 A2/A3缺口未消失，A4仍无正式Figma PNG；这次按禁止静态改动保留，不照抄旧通过数，不把沿用静态理解为这些残余已解决。
5. **R08/R09/R10边界**：R10从收信箱Collect replies进入，只有待收队列清空才去掉条；取消/失败保留条和选择。收取后行进入ChatFlow、Back回收信箱已真点，权限使用API返回/服务端状态。R08 waiting/replied Continue chatting仅刷新、首页回应条关闭规则仍属R08/R06，本轮不补App路由，不改变收藏/聊天许可。独立收藏业务不等于收取回应。
6. **Filter Pass边界**：回复来源充值的返回是收取确认，不应擅加Explore Filter Pass；独立商店/Filter Pass时长购买由R07/相关模块负责，本轮只读源码，未走查或修改，不能报完整Filter Pass通过。
7. **真实后端/原回归阻塞**：Mac无测试数据库，原R10回归启动失败 `Test database connection unavailable`，退出1，0条实际执行。tsx依赖已不再是阻塞；不为凑通过修改原测试或数据库配置。浏览器成功/503/余额恢复都由API fixture提供，不能作为真实扣费、权限、充值验收。

## 流程走查与证据

[测试源码](../../tests/r10-audit.spec.ts)、[配置](../../tests/r10-audit.config.ts)。不直接跳状态，不注入Vue状态；通过登录表单获取fixture会话，只写语言偏好，不写token/account localStorage。输入真实测试邮件/密码→首页→收信箱，按state-script动作真点。

每组顺序：剩1免费→现有0钻确认（差异留图）→收取→付费确认→Not now→×→Escape→收取503留框→重试→paid→开chat/Back→fixture余额不足→Get diamonds→充值页→滚轮→选第二套餐→Get→web不可购买提示→Escape回不足→再次充值→fixture外部余额恢复→自动回原选择确认→内滚→取消。fixture余额变化明确为测试场景，不执行实际支付或模拟原生扣款。记录包含API请求路径/方法/请求体、每步document尺寸、可见文案裁切、滚动、动画和页面错误。

构建 `VITE_API_BASE_URL=/api npm run build` 退出0；最终专用fixture命令 `npx playwright test --config tests/r10-audit.config.ts --reporter=line`：4通过、0失败、0跳过。原回归命令 `npx playwright test tests/r10-reply.spec.ts --config playwright.r10.config.ts --reporter=line`：退出1，启动失败，0条执行。没有宣称全套回归已通过。

[最终构建](r10-audit/build.log)、[最终走查日志](r10-audit/playwright.log)、[原回归失败](r10-audit/original-regression.log)、[首次沙箱端口失败](r10-audit/baseline-playwright.log)、[早期脚本Escape竞态失败](r10-audit/baseline-browser.log)、[修复脚本后基线4通过](r10-audit/walkthrough-baseline.log)。早期脚本在prepare异步完成前按Escape，后续等待对话框可见及aria-busy=false后操作；未为使测试通过修改支付逻辑。

最终PNG和测量清单在下节；截图均Playwright真实PNG，没有合成或Figma图替代。


## 最终截图与测量清单

每组14步、14张PNG，合计56张；每组均覆盖六态及失败/返回。完整尺寸及裁切核验见 [evidence-checks.json](r10-audit/evidence-checks.json)。横向裁切指标不等于所有原生文案已本地化；确认框增加反馈后按钮需内滚，已单独实测。

| 高度/语言 | document高度/scrollY | 充值 top/client/content | 返回确认框 top/client/content | 记录 |
|---|---|---|---|---|
| 667/en | 667/0 | 233/569/802 | 66/390/456 | [JSON](r10-audit/667-en-walkthrough.json) |
| 667/ko | 667/0 | 217/569/786 | 46/390/436 | [JSON](r10-audit/667-ko-walkthrough.json) |
| 812/en | 812/0 | 120/682/802 | 66/390/456 | [JSON](r10-audit/812-en-walkthrough.json) |
| 812/ko | 812/0 | 104/682/786 | 46/390/436 | [JSON](r10-audit/812-ko-walkthrough.json) |

| 状态/步骤 | 667 en | 667 ko | 812 en | 812 ko |
|---|---|---|---|---|
| reply-last-free | [PNG](r10-audit/667-en-reply-last-free.png) | [PNG](r10-audit/667-ko-reply-last-free.png) | [PNG](r10-audit/812-en-reply-last-free.png) | [PNG](r10-audit/812-ko-reply-last-free.png) |
| free-confirmation-difference | [PNG](r10-audit/667-en-free-confirmation-difference.png) | [PNG](r10-audit/667-ko-free-confirmation-difference.png) | [PNG](r10-audit/812-en-free-confirmation-difference.png) | [PNG](r10-audit/812-ko-free-confirmation-difference.png) |
| reply-payment | [PNG](r10-audit/667-en-reply-payment.png) | [PNG](r10-audit/667-ko-reply-payment.png) | [PNG](r10-audit/812-en-reply-payment.png) | [PNG](r10-audit/812-ko-reply-payment.png) |
| reply-cancelled | [PNG](r10-audit/667-en-reply-cancelled.png) | [PNG](r10-audit/667-ko-reply-cancelled.png) | [PNG](r10-audit/812-en-reply-cancelled.png) | [PNG](r10-audit/812-ko-reply-cancelled.png) |
| collect-failure | [PNG](r10-audit/667-en-collect-failure.png) | [PNG](r10-audit/667-ko-collect-failure.png) | [PNG](r10-audit/812-en-collect-failure.png) | [PNG](r10-audit/812-ko-collect-failure.png) |
| reply-paid | [PNG](r10-audit/667-en-reply-paid.png) | [PNG](r10-audit/667-ko-reply-paid.png) | [PNG](r10-audit/812-en-reply-paid.png) | [PNG](r10-audit/812-ko-reply-paid.png) |
| collected-chat | [PNG](r10-audit/667-en-collected-chat.png) | [PNG](r10-audit/667-ko-collected-chat.png) | [PNG](r10-audit/812-en-collected-chat.png) | [PNG](r10-audit/812-ko-collected-chat.png) |
| reply-shortage | [PNG](r10-audit/667-en-reply-shortage.png) | [PNG](r10-audit/667-ko-reply-shortage.png) | [PNG](r10-audit/812-en-reply-shortage.png) | [PNG](r10-audit/812-ko-reply-shortage.png) |
| reply-topup | [PNG](r10-audit/667-en-reply-topup.png) | [PNG](r10-audit/667-ko-reply-topup.png) | [PNG](r10-audit/812-en-reply-topup.png) | [PNG](r10-audit/812-ko-reply-topup.png) |
| topup-scroll | [PNG](r10-audit/667-en-topup-scroll.png) | [PNG](r10-audit/667-ko-topup-scroll.png) | [PNG](r10-audit/812-en-topup-scroll.png) | [PNG](r10-audit/812-ko-topup-scroll.png) |
| web-purchase-unavailable | [PNG](r10-audit/667-en-web-purchase-unavailable.png) | [PNG](r10-audit/667-ko-web-purchase-unavailable.png) | [PNG](r10-audit/812-en-web-purchase-unavailable.png) | [PNG](r10-audit/812-ko-web-purchase-unavailable.png) |
| topup-return | [PNG](r10-audit/667-en-topup-return.png) | [PNG](r10-audit/667-ko-topup-return.png) | [PNG](r10-audit/812-en-topup-return.png) | [PNG](r10-audit/812-ko-topup-return.png) |
| funded-return | [PNG](r10-audit/667-en-funded-return.png) | [PNG](r10-audit/667-ko-funded-return.png) | [PNG](r10-audit/812-en-funded-return.png) | [PNG](r10-audit/812-ko-funded-return.png) |
| funded-return-scroll | [PNG](r10-audit/667-en-funded-return-scroll.png) | [PNG](r10-audit/667-ko-funded-return-scroll.png) | [PNG](r10-audit/812-en-funded-return-scroll.png) | [PNG](r10-audit/812-ko-funded-return-scroll.png) |

仅单个r10-audit Codex执行；未开Issue、未发Telegram、未访问Figma API/token，未合main。支付脚本逐字未动。产物哈希见 [artifact-manifest.json](r10-audit/artifact-manifest.json)。分支提交SHA以最终git日志/执行汇报为准。
