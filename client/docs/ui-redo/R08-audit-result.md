# R08 读写信补查

基线 `86a584d`；分支 `codex/r08-audit`；Mac mini 本地执行。静态沿用 R08；不调用 Figma API/token，不合入 main。

## 动手前原型摘录

依据本地 `~/maugo-design/MauGo.html` 内嵌 bundle 的 `app.js`、`letter-rules.js`、`features.js`、CSS，以及仓库 page-states。操作原文见 [状态脚本](r08-audit/state-script.json)。以下在实现改动前记录。

| 状态 | 点哪里 → 去哪里 → 返回 | 原型函数/文案 |
|---|---|---|
| letter-open | 首页鸟/回应条 → 信纸；关闭/Escape → 首页 returning | openNote / closeNote；A letter for you；Dear little wanderer 来自信件数据 |
| letter-typed | #reply 填 That small moment made me smile.；发送 → waiting；关闭 → 首页 | updateReply / reply-form submit；One opening message. More begins when they reply. |
| letter-waiting | 已发开场白 → View waiting message → 收信箱会话；会话返回收信箱 | updateReply / openLetterThread；Your hello is on its way. Chat opens when they reply. |
| letter-replied | 对方真实回应 → Continue chatting → 会话；返回收信箱 | canChat / openLetterThread；You both replied. Keep the conversation going. |
| letter-safety | #report-note → Report or block；关闭/Escape → 原信 | showSafetyMenu / showSheet；Report、Block |
| letter-report | #safety-report → 原因列表；选原因 → 隐藏信件回首页 toast；关闭 → 原信 | reportLetter；Choose a reason. This letter will be hidden from your home.；Recorded. This letter is now hidden. |
| compose-empty | 首页 #compose → 空白表单；关闭/Cancel/Escape → 保存草稿、returning 首页 | openComposer / closeComposer / persistDraft；Share a little story；Let it fly |
| compose-draft | #letter-text 填 bookshop 示例 → draft；换鸟 → 外观设置后回表单；取消保存 | updateDraft / updateSender；One opening message. Chat starts when they reply. |
| compose-invalid | 填 A first line.\nA second line. → 禁止发送；修改后恢复 | validateOpening；Keep your first hello to one message on one line.；200 字上限 |
| compose-sent | publish → 本地保存成功 → sending 1500ms → 首页 toast；atlas driver 1200ms 后打开 inbox | publish / startRound；Your letter is saved. Let kindness find its way. |

失败：原型本地 save 失败停留写信页，toast “Unable to save right now. Please copy your words first.”；真实实现必须保留服务端错误与可重试草稿，不能搬入本地 posts/introductions 假业务。

滚动：原型 `.conversation` 为信件正文/历史滚动容器；`#letter-text` 为 textarea 内部滚动；sheet 内容滚动；screen 固定，整页不滚。当前实现对应 `.letter-conversation`、`.compose-text`、`.letter-safety`。

效果：opening 440ms（信封向纸张、鸟淡出，ease-out cubic）；纸张 opacity 360ms / transform 440ms，延迟140ms；returning 480ms（鸟从纸张返回、淡入并恢复焦点）；composing 入场300ms；sending 1500ms（smooth 曲线，x=149+sin(qπ)*47，y=435-540q，rotation=-12+20q，scale=.7+.3sin(qπ)，最后15%淡出、6帧鸟图14fps）；共用按钮按下态与 sheet-in 沿用外壳。没有依据把动画时长当作网络请求耗时。

compose-sent 冲突：Figma `39:2308` 为收信箱列表 + toast；原型实际 publish 完成回首页 toast，atlas driver 再切 inbox；当前 R08 为确认信纸 + Back to home。按任务要求保持形态，待 Smith 定。动态收件人 UUID、200字及聊天权限以服务端为准。举报是否隐藏、waiting/replied 导航涉及其他模块/业务，必须单列差异。

## 验收结果

最终命令与截图实测见文末。整体结论：**未通过/待 Smith**；可在本模块内补的缺口已补，跨模块边界及 compose-sent 未擅自取舍。

| 验收项 | 结果 | 范围与证据 |
|---|---|---|
| 静态 | 通过（沿用既有静态基准） | 812 正常态尺寸/颜色不改；只改瞬时反馈和667滚动空间分配。构建退出0，生产改动文件 hex / !important / .device 前缀均0；没有重新宣称 compose-sent 已匹配 Figma。 |
| 流程 | 未通过/待 Smith | fixture 十态和取消/失败/重试/草稿/换鸟/Escape 真点真填走通；waiting/replied 只刷新、举报成功留信纸、写信入口替代 Not interested、回应条关闭规则及发送后去向仍不同。真实服务端收发/权限未验。 |
| 效果 | 未通过/待 Smith | 已补服务端成功后1500ms独立寄出阶段、路径/旋转/缩放/末段淡出/14fps六帧图；保留共用按下态及入场过渡。开信鸟群淡出及 returning 480ms完整首页阶段未补，不能以已有440ms纸张过渡冒充。 |
| 滑动与文案 | 通过（本轮fixture覆盖） | 375×667 / 375×812，英韩各一套十态截图；固定整页、正文/textarea内部滚动；R08失败/冲突/换鸟韩文已补，API fixture 的用户内容不翻译。 |

## 实现与效果核对

只修改 LettersFlow、letters.css、R08 使用的五条 i18n 文案及本模块走查/证据。App.vue、登录与会话存取、支付、请求路径/载荷/服务端权限判断均未改；没有迁入原型本地保存假业务。

- 成功请求后才进入 `data-phase=sending`，busy 防重发，1500ms结束仍显示既有 compose-sent；409不演动画，继续原冲突状态。选中鸟对应 flight sheet；reduced-motion缩至1ms；卸载取消帧。该阶段只在R08层，未伪造首页 startRound。
- 恢复对话框 Tab 首尾循环与关闭焦点返回；保留草稿sessionStorage，不改token/account存取。
- 小屏只收紧正文/textarea高度和下方操作区位置；812几何声明保留。sheet内部允许滚动、overscroll隔离，整页固定。
- 发送错误放入表单现有验证反馈区，避免压住说明；安全菜单切换/关闭清理旧错误，避免“屏蔽失败”遗留到举报页。

| 效果 | 原型依据 | 现状/本次 | 结论 |
|---|---|---|---|
| 开信信封 | opening 440ms，ease-out | 既有 d11-flying-letter 440ms 保留（HomeFlow创建） | 部分存在，未验完整鸟群阶段 |
| 纸张展开 | opacity360ms / transform440ms，延迟140ms | 既有 letter-overlay CSS 保留；父层 enter580ms | 存在（源码核对）；走查 JSON 的 settled duration=0s 不是动画时长测量 |
| 收回鸟群 | returning480ms，恢复首页焦点 | R08补焦点返回；HomeFlow仍是leave440ms纸张退场，无鸟群returning | 未通过/待 Smith |
| 写信入场 | sheet-in300ms ease-out | 既有compose overlay300ms | 存在，未改 |
| 寄出 | sending1500ms，smooth路径、14fps六帧、最后15%淡出 | 本次R08成功后独立rAF阶段；计时见最终实测 | R08阶段补齐；完成后导航仍待Smith |
| 按下态 | 共用按下反馈 | ui-button/ui-icon-button沿用；R08特有report/send/change/write/safety按下scale(.96) | 已补 |
| sheet/回复/字数 | 共用sheet-in；原型动态刷新内容 | 现有sheet/回复opacity250ms、transform300ms；字数120ms，沿用不作新原型时长承诺 | 存在，精确一致性未全验 |
| 等待/成功装饰 | 原型等待文案、sending结束toast | 现有waiting-glow1800ms、messenger-hover2500ms保留（无原型等价时长） | 差异记录，未称全通过 |

## 未通过/待 Smith 与边界

1. `compose-sent`：本地 Figma `39:2308`确认为375×812的收信箱列表（chat-list）+ toast。结构摘录见 [节点](r08-audit/figma-compose-sent.json)。原型publish在1500ms后回首页toast，atlas另有1200ms后打开inbox的步骤。当前确认信纸保留，等Smith决定最终去向与形态。
2. `letter-waiting/replied` 的 `#continue-chat` 当前只调用refresh；原型进入会话，返回收信箱。涉及R09/R11及聊天权限，以服务端为准，本轮不改。
3. 原型举报成功隐藏信件并回首页；当前只提交服务端举报、关闭sheet、展示接收提示，未擅自修改来信列表规则。原型Not interested丢弃/刷新；当前相应入口写信，未更改业务行为。
4. 关闭首页来信只移除已点开的回应条，原型clearHomeResponses清全部；父层为R06边界。完整opening鸟群淡出、returning480ms和寄出后的首页重新出鸟未补，需跨模块安排。
5. 真实收件人仍要求UUID；无收件人选择、无独立标题/性别/时间字段；均为既有服务端/Figma差异。本轮无真实后端收发、收取或聊天权限验收；所有成功/失败响应均明确为浏览器API fixture。
6. 原型失败提示针对本地save，当前针对网络发送/举报/屏蔽；保留真实重试与草稿语义，补韩文而不替换服务端规则。用户输入长UUID在原生输入框内水平移动，不作为系统文案翻译截断。

## 走查方法与记录

`tests/r08-audit.spec.ts` 使用登录表单进入首页（未直接写登录token），再点击回应条开信；按仓库状态脚本fill/click，不直接注入组件状态。waiting由回复POST成功得到，replied由fixture读取状态更新得到；不是直接跳状态截图。

额外走查：屏蔽确认取消、屏蔽503、举报503与重试、发送503与重试、取消后恢复草稿、换鸟返回、Escape逐层关闭、屏蔽成功回首页。使用长用户内容验证正文容器、用超长无效草稿验证textarea内部滚轮；fixture超长文本不代表线上服务端会接受它。

首轮首页飞鸟被帽子遮挡，改用回应条入口，未强制点击；[首轮日志](r08-audit/initial-playwright.log)。中间复跑812韩文在安全菜单点击时元素detach，发生于开发热更新期间，不能据此断言唯一原因；[中间日志](r08-audit/pre-final-playwright.log)。最终稳定版本重新完整执行，最终结论只依据下方最终日志。


## 最终实测与产物清单

最终构建退出 **0**；最终 Playwright 退出 **0**，**4通过 / 0失败 / 0跳过**，均为API fixture。日志：[构建](r08-audit/build.log)、[流程](r08-audit/playwright.log)、[零值检查](r08-audit/source-checks.json)。静态沿用 [R08原结果](R08-result.md) 与 [既有截图](r08/letter-open.png)，不宣称重做静态验收。

| 高度/语言 | 整页高度 / scrollY | 正文容器 top / height / content | textarea top / height / content | sending实测 | 记录 / 录屏 |
|---|---|---|---|---|---|
| 667 / en | 667 / 0 | 700 / 252 / 1245 | 1588 / 228 / 1830 | 1517.8ms | [JSON](r08-audit/667-en-walkthrough.json) / [录屏](r08-audit/recordings/667-en.webm) |
| 667 / ko | 667 / 0 | 700 / 252 / 1223 | 1589 / 228 / 1830 | 1518.7ms | [JSON](r08-audit/667-ko-walkthrough.json) / [录屏](r08-audit/recordings/667-ko.webm) |
| 812 / en | 812 / 0 | 700 / 345 / 1245 | 1495 / 321 / 1830 | 1515.7ms | [JSON](r08-audit/812-en-walkthrough.json) / [录屏](r08-audit/recordings/812-en.webm) |
| 812 / ko | 812 / 0 | 700 / 345 / 1223 | 1496 / 321 / 1830 | 1515.9ms | [JSON](r08-audit/812-ko-walkthrough.json) / [录屏](r08-audit/recordings/812-ko.webm) |

各态document高度均等于viewport，scrollY均0；正文/textarea滚轮scrollTop>0；安全/举报sheet下边界≤viewport，sheet可见文案水平方向无溢出断言通过。panel可见按钮/文字横向溢出记录为0。此结论只覆盖所测系统文案与fixture数据，不外推任意线上用户内容。已人工复核667英韩举报页、韩文发送失败、屏蔽失败及812英文举报页PNG。

真实PNG **72张**、录屏 **4份**；四组均覆盖全部十态。以下均是Playwright实际采集，未合成或补假图。

### 667 en

- [667-en-block-confirmation.png](r08-audit/667-en-block-confirmation.png)
- [667-en-block-failure.png](r08-audit/667-en-block-failure.png)
- [667-en-blocked-home.png](r08-audit/667-en-blocked-home.png)
- [667-en-compose-draft.png](r08-audit/667-en-compose-draft.png)
- [667-en-compose-empty.png](r08-audit/667-en-compose-empty.png)
- [667-en-compose-failure.png](r08-audit/667-en-compose-failure.png)
- [667-en-compose-invalid.png](r08-audit/667-en-compose-invalid.png)
- [667-en-compose-sent.png](r08-audit/667-en-compose-sent.png)
- [667-en-compose-text-scroll.png](r08-audit/667-en-compose-text-scroll.png)
- [667-en-draft-restored.png](r08-audit/667-en-draft-restored.png)
- [667-en-letter-open.png](r08-audit/667-en-letter-open.png)
- [667-en-letter-replied.png](r08-audit/667-en-letter-replied.png)
- [667-en-letter-report.png](r08-audit/667-en-letter-report.png)
- [667-en-letter-safety.png](r08-audit/667-en-letter-safety.png)
- [667-en-letter-typed.png](r08-audit/667-en-letter-typed.png)
- [667-en-letter-waiting.png](r08-audit/667-en-letter-waiting.png)
- [667-en-report-failure.png](r08-audit/667-en-report-failure.png)
- [667-en-sending.png](r08-audit/667-en-sending.png)
### 667 ko

- [667-ko-block-confirmation.png](r08-audit/667-ko-block-confirmation.png)
- [667-ko-block-failure.png](r08-audit/667-ko-block-failure.png)
- [667-ko-blocked-home.png](r08-audit/667-ko-blocked-home.png)
- [667-ko-compose-draft.png](r08-audit/667-ko-compose-draft.png)
- [667-ko-compose-empty.png](r08-audit/667-ko-compose-empty.png)
- [667-ko-compose-failure.png](r08-audit/667-ko-compose-failure.png)
- [667-ko-compose-invalid.png](r08-audit/667-ko-compose-invalid.png)
- [667-ko-compose-sent.png](r08-audit/667-ko-compose-sent.png)
- [667-ko-compose-text-scroll.png](r08-audit/667-ko-compose-text-scroll.png)
- [667-ko-draft-restored.png](r08-audit/667-ko-draft-restored.png)
- [667-ko-letter-open.png](r08-audit/667-ko-letter-open.png)
- [667-ko-letter-replied.png](r08-audit/667-ko-letter-replied.png)
- [667-ko-letter-report.png](r08-audit/667-ko-letter-report.png)
- [667-ko-letter-safety.png](r08-audit/667-ko-letter-safety.png)
- [667-ko-letter-typed.png](r08-audit/667-ko-letter-typed.png)
- [667-ko-letter-waiting.png](r08-audit/667-ko-letter-waiting.png)
- [667-ko-report-failure.png](r08-audit/667-ko-report-failure.png)
- [667-ko-sending.png](r08-audit/667-ko-sending.png)
### 812 en

- [812-en-block-confirmation.png](r08-audit/812-en-block-confirmation.png)
- [812-en-block-failure.png](r08-audit/812-en-block-failure.png)
- [812-en-blocked-home.png](r08-audit/812-en-blocked-home.png)
- [812-en-compose-draft.png](r08-audit/812-en-compose-draft.png)
- [812-en-compose-empty.png](r08-audit/812-en-compose-empty.png)
- [812-en-compose-failure.png](r08-audit/812-en-compose-failure.png)
- [812-en-compose-invalid.png](r08-audit/812-en-compose-invalid.png)
- [812-en-compose-sent.png](r08-audit/812-en-compose-sent.png)
- [812-en-compose-text-scroll.png](r08-audit/812-en-compose-text-scroll.png)
- [812-en-draft-restored.png](r08-audit/812-en-draft-restored.png)
- [812-en-letter-open.png](r08-audit/812-en-letter-open.png)
- [812-en-letter-replied.png](r08-audit/812-en-letter-replied.png)
- [812-en-letter-report.png](r08-audit/812-en-letter-report.png)
- [812-en-letter-safety.png](r08-audit/812-en-letter-safety.png)
- [812-en-letter-typed.png](r08-audit/812-en-letter-typed.png)
- [812-en-letter-waiting.png](r08-audit/812-en-letter-waiting.png)
- [812-en-report-failure.png](r08-audit/812-en-report-failure.png)
- [812-en-sending.png](r08-audit/812-en-sending.png)
### 812 ko

- [812-ko-block-confirmation.png](r08-audit/812-ko-block-confirmation.png)
- [812-ko-block-failure.png](r08-audit/812-ko-block-failure.png)
- [812-ko-blocked-home.png](r08-audit/812-ko-blocked-home.png)
- [812-ko-compose-draft.png](r08-audit/812-ko-compose-draft.png)
- [812-ko-compose-empty.png](r08-audit/812-ko-compose-empty.png)
- [812-ko-compose-failure.png](r08-audit/812-ko-compose-failure.png)
- [812-ko-compose-invalid.png](r08-audit/812-ko-compose-invalid.png)
- [812-ko-compose-sent.png](r08-audit/812-ko-compose-sent.png)
- [812-ko-compose-text-scroll.png](r08-audit/812-ko-compose-text-scroll.png)
- [812-ko-draft-restored.png](r08-audit/812-ko-draft-restored.png)
- [812-ko-letter-open.png](r08-audit/812-ko-letter-open.png)
- [812-ko-letter-replied.png](r08-audit/812-ko-letter-replied.png)
- [812-ko-letter-report.png](r08-audit/812-ko-letter-report.png)
- [812-ko-letter-safety.png](r08-audit/812-ko-letter-safety.png)
- [812-ko-letter-typed.png](r08-audit/812-ko-letter-typed.png)
- [812-ko-letter-waiting.png](r08-audit/812-ko-letter-waiting.png)
- [812-ko-report-failure.png](r08-audit/812-ko-report-failure.png)
- [812-ko-sending.png](r08-audit/812-ko-sending.png)

本地依据：[原型源码摘录](r08-audit/prototype-excerpts.md)、[操作脚本](r08-audit/state-script.json)、[Figma发送后节点](r08-audit/figma-compose-sent.json)、[参考文件SHA256](r08-audit/references.json)。[产物SHA256清单](r08-audit/artifact-manifest.json)。

仅提交推送 `codex/r08-audit`；未合入main。最终提交SHA以执行汇报及git log为准。
