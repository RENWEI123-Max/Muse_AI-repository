# R10 收取额度与付费验收

分支 `codex/r10-reply`；基线 `1101db3`（与 codex/r09-inbox 相同）。唯一设计来源 `/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`。未访问 Figma API、未用 token、未导出或替换图片。使用现有 1x 素材，3x 待 Smith 按原路径替换。

## 量与差距

逐元素坐标、尺寸、圆角、字体测量：[r10/measurements.md](r10/measurements.md)。六棵节点树完整保存在 [r10/figma-nodes.json](r10/figma-nodes.json)，包含各元素 fills、strokes、effects、字体、自动布局间距及内边距。以下坐标均为 375×812 内坐标；现状列为本任务修改前的代码值，不冒充浏览器实测。

| 状态 / 节点 | 元素 | Figma x,y,w,h / 样式 | 修改前差距 | 本轮处理 / 残余 |
|---|---|---|---|---|
| last-free 29:7634 | 收取条 29:7676 | 24,124,327,56；r24 | R09 已用精确规则 | 原规则迁入 reply.css，保持布局 |
| last-free | 提示 29:7684 | 69,156,48,12；Fredoka 400 9/12；颜色见节点 | R09 已提供真实剩余额度 | 保留真实 free 值；不增加 Figma 没有的免费弹层 |
| payment 29:7779 | 遮罩 29:7922 | 全屏，030805 @79%，blur16 | 混用 inset 底部层与中心层，blur8、important | 使用 ui-scrim--dialog |
| payment | 容器 29:7923 | 24,210.25,327,391.5；r28；渐变/阴影见 JSON | relative、auto 宽高、叠加 important | ui-sheet + ui-dialog + 共用 reply 变体 |
| payment | 标题 29:7925–26 | 49,247.25,277,28；550 22/28，字距−.3 | 仅字号22，其余继承 | 精确字体、位置 |
| payment | 说明 29:7928 | 49,287.25,277,40；400 12/20，A1B29F | 多出88×80钻石图和浮动动画 | 删除额外图，精确说明区域 |
| payment | 价格面板 29:7930 | 49,351.25,277,109.5；r16，0E1815@40%，白描边3% | 多层 margin/padding，背景与行高不同 | 三行 flex，gap16，padding16+border1 |
| payment | 三行 29:7931/36/41 | 66,368.25/398.75/429.25,243,14.5 | 行 padding10，无精确行高 | label 400 11/13.31；value 550 12/14.5，保留真实价格/余额 |
| payment | 主按钮 29:7947 | 49,484.75,277,48；r24 | 宽100%，叠加渐变和圆角 | 共用 ui-button--reply，页面仅定位 |
| payment | 取消 29:7949 | 49,532.75,277,52；文字 y555.25 | text-button 高44 | 共用 ui-button--text |
| payment | 关闭 29:7951 | 302,219.25,40,40 | 位置受 header/important 影响 | 共用40px无底关闭按钮，页面只定位 |
| shortage 29:7955 | 容器 29:8099 | 24,235.5,327,341；r28 | 同付费共用 auto 高弹层 | 共用341高变体与现有渐变 token |
| shortage | 标题 / 说明 | 49,272.5,277,28 / 49,312.5,277,20 | 多出钻石图、安全说明 | 按节点精简，无新增文案 |
| shortage | 余额面板 29:8106 | 49,356.5,277,79；两行 y373.5/404 | 多出 Total 行 | 两行，仅保留真实余额及不足值 |
| shortage | 充值 / 取消 | 49,459.5,277,48 / 49,507.5,277,52 | 多出禁用收取按钮 | 隐藏禁用按钮但保留 id/事件，充值事件不变 |
| cancelled 29:8126 | 收信箱 / 收取条 | 回到收信箱，条仍在24,124 | 收取状态逻辑已存在 | 保留现有状态与数量，无虚构取消弹层 |
| paid 29:8271 | 状态 29:8424–25 | 28,646.5,319,40.5；r16；202929@93%；400 12/18 E6ECDF | 20,bottom95,right20；绿色背景；动态扣款文案 | 精确位置、颜色、圆角；英韩 One reply collected. |
| topup 29:8430 | 容器 29:8572 | 12,104,351,684；r24 | .device 覆盖与组件内样式叠加 | ui-sheet 容器；独立 root；保留滚动 |
| topup | 标题 / grabber | 标题148.5,137,78,24；条169.5,117,36,4 | header/段落 margin 未对齐 | 共享 grabber、550 18/24标题 |
| topup | 插画 29:8583 | 147.5,185,80,70 | 组件与 fidelity 中尺寸/动画冲突 | 现有 diamond 文件，80×70，无动画/缩放 |
| topup | 说明 29:8585 | y271 高20；400 12/20，829382 | 99A795 | 精确颜色与几何 |
| topup | 余额 29:8587 | 33,319,309,48；r12；253025 | 段落及 bold 动态余额 | 保留真实余额文案和值，区域对齐；内部布局未逐项完全复刻 |
| topup | 四包 29:8596/8605/8614/8623 | 33/193.5,387/557,148.5,158；gap12；r16 |136高；首项选中位移；字重550 | 158高、精确金额/bonus/说明/价格区域；保留真实商店价格；紫色径向填充未补齐 |
| topup | 提示与返回 29:8633/35 | y727 / y767.5 | 实际 StoreKit 确认按钮+真实交易说明，与预览稿不同 | 保留原购买确认、安全说明、返回事件；内容需滚动，未达到原稿 y 值 |

## 改动范围

InboxFlow.vue 只调整收取部分模板并追加 reply.css 引用；保留 inbox.css 供 R09。ReplyTopup.vue 只改模板和 style src。新增 reply.css，收取条规则从 inbox.css 整块迁移，删除旧 payment-summary/inbox-payment-line 规则；删除 ReplyTopup 内全部旧 style 与 fidelity.css 中全部 d1 覆盖。home.css/legacy 文件无本模块规则，无需更改。

在 components.css 增加确认框、主按钮、文字按钮、关闭按钮共用变体，页面不重写按钮外观；tokens.css 补 JSON 原值和字体组，i18n.ts 补新增英韩文案。HomeFlow.vue、LettersFlow.vue 和其他 Flow 模板、脚本未改。两份 script setup 与基线逐字相同，所有原有 id/data-state/aria-label 保留，见 script-integrity.log。

未接入未读/角标新数据，沿用真实现有数据；R09/R05 待 Smith 项未宣称完成。

## A1–A8

| 项目 | 结果 | 证据 / 实际范围 |
|---|---|---|
| A1 构建 | 通过 | `cd client && npm run build`，退出0；[build.log](r10/build.log)，含343 PNG校验、vue-tsc、Vite |
| A2 几何 | 未通过 | 六态关键区域 boundingBox 断言已执行；完整子元素尚未覆盖，充值余额内部及确认/说明/返回与稿仍不同。见 tests/r10-reply.spec.ts 和 [final-tests.log](r10/final-tests.log) |
| A3 样式 | 未通过 | 已断言支付标题字号/字重/颜色、说明色、容器圆角和价格行字号；充值包紫色径向层未实现，真实价格/余额排版还有差距，不能称完整一致 |
| A4 对照图 | 未通过 / 待 R01/R04 | 无正式 Figma PNG；未生成并排图，差异比例未计算；未以原型图替代 |
| A5 架构 | 通过 | [architecture.log](r10/architecture.log)：hex/rgb/important/device 前缀、旧收取选择器均0；页面选择器最多两级，按钮/容器共用；小屏只改位置；[script-integrity.log](r10/script-integrity.log)证实两份脚本逐字不变及属性保留 |
| A6 测试 | 通过 | 最终 D1 + R10 英文六态 + 韩文/小屏，3项通过；此前 inbox.spec.ts 6项、r09-inbox.spec.ts 4项共10项通过。初次 R10 失败已修复，历史 [tests.log](r10/tests.log)保留；最终结果见 [final-tests.log](r10/final-tests.log) |
| A7 截图 | 通过 | r10/reply-last-free.png、reply-payment.png、reply-shortage.png、reply-cancelled.png、reply-paid.png、reply-topup.png，均375×812、实际运行截图 |
| A8 诚实 | 通过 | A2/A3/A4 明确未通过，测量、失败记录、实现截图、实际通过范围均列明；未伪造 Figma 参考、截图或比例 |

## 渐变 token 依赖

直接/通过共用类使用：`--grad-primary`（充值确认）、`--grad-primary-height-48`（收取确认）、`--grad-icon-btn`（图标按钮）、`--grad-card`（391.5高确认框）、`--grad-card-height-341`（不足态）。本轮未改这些 token 的定义，也未引入新渐变 token 名。R02 后续改名/删除时须同步 components.css 的这些引用；图标渐变方向跟随 R02 修订。四个充值包的紫色径向层尚未实现，不能把 A3 判为通过。

## 限制和后续

A2/A3 对已加入断言的关键区域有证据，但不等于所有关键子元素全量验收：充值余额内部、真实商店价/确认按钮/说明/返回位置尚有差距，包的径向填充待补。没有修改 StoreKit 逻辑去模拟 Figma 的 purchase preview，也没有伪造美元价格。A4 需要 R01/R04 正式 Figma 参考 PNG，本轮没有参考图、并排图或差异比例。1x 素材待 Smith 后续替换3x。环境启动失败和实际绕行记录见 r10/environment.md；历次失败日志保留，不当作通过证据。
