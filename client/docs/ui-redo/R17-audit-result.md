# R17 我的资料补查

基线 cc31826，分支 codex/r17-audit。Mac mini 唯一一轮 codex exec --approve-for-me；进程62995为本轮，未另启动、开Issue、发Telegram、调用Figma API/token或合main。

## 原型摘录（实现前）

本地 MauGo.html 的 features.js、app.js、CSS 和 page-states.json 已读取。[原文摘录](r17-audit/prototype-excerpts.txt)、[十二态操作脚本](r17-audit/state-script.json)、[来源校验](r17-audit/references.json)。尺寸颜色沿用既有静态，不重绘；流程效果文案按原型，冲突待Smith。

| 状态 | 点哪里 → 去哪里 → 返回/取消 |
|---|---|
| profile-empty | 底部Profile → profile；昵称→editProfile；头像→chooseAvatarMenu/R18；形象照→R19；动态→R20；导航Home/Messages回对应模块 |
| profile-content | 同主页，服务数据含形象照；点卡片→菜单/R19，关闭回主页 |
| profile-edit | 昵称→editProfile；Change avatar→R18，关闭回编辑；Save changes→校验→persist/back回主页；Back取消编辑回主页 |
| profile-invalid | edit-age填17→save-profile→toast，保留编辑；改合法值重试；Back回主页 |
| profile-likes | likes→showPaymentDialog，Moments/Image cards汇总；Got it/关闭/遮罩/Escape→原主页；焦点回入口，底层inert |
| following-empty | following→connections(kind:Following)，空态；Followers切标签；Back回主页 |
| following-list | following服务记录→connections；点人→publicProfile/R16；Back应回原列表，再Back回主页 |
| followers-empty | followers→connections(kind:Followers)，空态；Following切标签；Back回主页 |
| visitors-empty | profile-visitors→visitors；Who visited me/I visited切标签；Back回主页 |
| visitors-outgoing | I visited→服务访问记录；点人→publicProfile/R16；Back回访客列表，再Back回主页 |
| my-letters-empty | profile-letters→activity(kind:My letters)，Nothing here yet.；Back回主页 |
| my-letters | 同上含信件，点activity-card→home/openNote打开原信件；返回按信件路由。本轮禁止改业务逻辑，差距另列 |

函数：profile、editProfile、page、back、connections、visitors、activity、empty、showPaymentDialog、toast；R18/R19/R20只查R17入口与取消返回，不重做邻接模块。

文案：My little corner、Nickname、Age、City、Zodiac (optional)、About me、Change avatar、Save changes、Enter a name and an age between 18 and 100.、Likes、Moments、Image cards、Got it、Following/Followers、Your circle is just beginning.、Visitors、Who visited me、I visited、Recent visits、No visits yet.、My letters、Nothing here yet.、A letter I sent、Every connection starts with a little hello.。原型空城市写Somewhere、本地访客脚注和演示数据不移植：以服务端为准，脚注待Smith。

滚动：page-body overflow:auto、overscroll-behavior:contain；实现对应profile-page .d4-body。共用sheet/dialog为指定滚动容器，整页不滚。

效果：资料页/子页/标签无独立动画；点赞payment-dialog使用sheet-in .22s ease-out（translateY30px/opacity0到原位），关闭无离场动画；共用sheet .3s；toast visible 2700ms；round按下scale(.94)、首页actions .96/.2s，资料模块仅floating-compose按下.96（属R20边界）。不新增原型不存在的独立按下态。

## 验收与最终记录

整体 **未通过/待 Smith**。已补限定范围内的 Escape、效果与滚动保护；fixture 走查不能代替真实后端验收。

| 项目 | 结果 | 证据与限制 |
|---|---|---|
| 静态 | **通过（本轮增量检查，沿用现有静态）** | 基线及最终构建退出0，见 build-baseline.log / build-final.log。未改尺寸、颜色、既有静态截图；两生产文件 hex / !important / .device 前缀均0。未新增Figma并排图或像素差异统计；原R17的A2/A3/A4缺口不据此改判。 |
| 流程 | **未通过/待 Smith** | 四组 fixture 点击覆盖十二态、编辑取消/17岁校验/503保留/重试成功、点赞四种关闭、双标签、列表进入R16再返回、头像R18/卡片R19/动态R20入口返回、加载503后重进恢复。我的信件点击仍不打开原信件；点赞未移动焦点/未使底层inert；真实后端未验。 |
| 效果 | **未通过/待 Smith** | 已取消资料页额外 .3s 入场和点赞 .25s 离场；共用点赞 sheet-in .22s 保留。原型2700ms toast与产品持续错误/保存提示不同，尚未补；不改受保护脚本。R17没有独立按钮反馈要求，原始likes按钮按下none，保留共用壳反馈，不强行添加。 |
| 滑动与文案 | **未通过/待 Smith** | 四组截图采样 document=375×视口高度、scrollY=0，编辑容器真实wheel可滚，body/dialog containment。韩文保存提示仍为Profile saved.、星座选项仍英文；R19嵌入区域标题/上传/空态和R20入口也含英文。375×667错误提示覆盖保存按钮区域；不为修静态重排。不能声称英韩全量无占位/无截断通过。 |

## 本轮实现与边界

生产仅改 `ProfileFlow.vue` 模板与 `styles/pages/profile.css`：

- 仅在 `!person && sheet==='likes'` 时使用Escape捕获，停止冒泡后调用既有back，防止关闭整个我的资料。原R16 `@keydown.esc="person && $event.stopPropagation();back()"` 完整保留。
- `.profile-page` overflow:hidden；body与点赞dialog指定滚动containment；body animation:none；只有包含profile-likes的veil取消离场transition，R18的sheet过渡不改。
- `<script setup>` 与cc31826逐字一致，SHA256与grep见 [source-checks.json](r17-audit/source-checks.json)。其余生产模块无diff；不改业务、支付、API、数据库或头像/卡片/动态实现。

## 效果逐项核对

| 原型名称与时长 | 本轮实际 | 结果 |
|---|---|---|
| profile/edit/connections/visitors/activity无独立入场 | 原有d4-open .3s已用R17作用域取消；计算none/0s | 已补，通过 |
| 点赞payment-dialog sheet-in .22s ease-out，translateY30px/opacity0到原位 | 继承components.css共用关键帧；四组实测sheet-in / 0.22s | 已有，通过 |
| 点赞关闭无独立离场 | 原有veil .25s取消，关闭/遮罩/Escape/Got it后回同一主页 | 已补，fixture通过 |
| 通用sheet-in .3s（头像等） | 保留共用壳与R18过渡，本轮只验证R17入口/关闭返回 | 已有，邻接内部效果不作R17通过声明 |
| toast visible 2700ms后消失 | 错误保留至保存或返回；Profile saved.提示持续存在 | 未通过/待Smith；需改脚本，本轮不改 |
| round按下.94；首页actions .96/.2s | 非R17独立规则；R17原生likes按钮实测none/0s | 无独立项可补；共用壳规则未改 |
| floating-compose按下.96，无独立时长 | 产品为R20入口，静态位置和交互归R20 | 边界待Smith，不修改R20 |

## 缺口与待 Smith

1. `activity-card` 原型打开home/openNote；当前仅article，API只保留content，既无信件ID也无点击路由。四组点击后均仍在My letters。需业务/数据契约决策，本轮禁止修改。
2. 访客时间/次数/性别/年龄/城市、Recent visits计数仍缺。当前load丢弃visitedAt、summary只保留id/displayName；无头像时显示已有占位图。未伪造产品字段或用样例照片补空。
3. 访客“本设备保存”脚注仍未添加：实际为服务器访问记录，原型本地语义冲突，待Smith。
4. 点赞原型showPaymentDialog有焦点转移/恢复和底层inert；当前实测focusInside=false、underlayInert=false。Escape退出主页问题已修，完整模态键盘管理仍缺。
5. 原型编辑Zodiac (optional)为自由输入；产品固定select且空选项禁用，无法清空已有星座。原型空城市替换Somewhere，产品服务端保存空值；不移植demo逻辑，待Smith。
6. 文案差异：Visited me/Who visited me、Zodiac/Zodiac (optional)、额外空态兼容说明；Profile saved.未翻韩文，星座选项未翻韩文；嵌入R19英文文案与R20入口另归邻接模块。静态保持，未顺手改其他模块。
7. 错误不是2700ms toast，短屏错误框与保存按钮重叠；原有页头/钱包/Filter Pass/性别、形象照区域静态差距仍按原R17记录保留，不能因本轮静态增量检查通过就宣称A2/A3/A4已解决。
8. API fixture验证不代表真实后端、真实访问、真实信件及真实关注头像通过；真实后端/数据库回归未执行，见 [环境说明](r17-audit/regression-not-run.md)。

## 走查、截图与验证

见 [截图索引](r17-audit/evidence-index.md)、[PNG尺寸和SHA256](r17-audit/screenshots.json)、[最终走查日志](r17-audit/walkthrough-final.log)。`client/tests/r17-audit.spec.ts` 为可复跑脚本，配置独立preview端口5337，不启动后端。

路径：fixture登录→会话确认→首页底栏Profile→昵称编辑/取消/17岁/503/保存→点赞四种关闭→关注/粉丝/访客/信件空态与标签→R18编辑头像/主页头像取消→R19上传选择取消→R20列表返回→离开重进读取内容fixture→关注列表/R16返回→访客外出/R16返回→信件点击缺口→编辑真实wheel→加载503→重进恢复。状态来自UI点击，未通过直接修改Vue状态或原型route注入截图。

所有请求均由API fixture拦截，账号、连接、信件、访问记录均明确为审计夹具。仅卡片使用仓库portrait-3.png作为fixture媒体；关注与访客无头像时仍是产品占位图，不冒充真实头像。原R17十二张截图仍在r17/，本轮未覆盖。

首轮四组均在点赞Escape后整页关闭而失败，证据见 [首轮日志](r17-audit/walkthrough-baseline.log)、[错误上下文](r17-audit/baseline-escape-failure.md)。修复后的第二轮到加载失败步骤因测试选择器匹配两个alert而失败，见 [选择器失败日志](r17-audit/walkthrough-selector-failure.log)，只把断言限定到R17错误框，没有掩盖服务失败。沙箱监听曾报EPERM，经执行权限升级后运行；不记为产品通过。

四组逐步操作/API/文案/滚动记录： [667 EN](r17-audit/667-en-walkthrough.json)、[667 KO](r17-audit/667-ko-walkthrough.json)、[812 EN](r17-audit/812-en-walkthrough.json)、[812 KO](r17-audit/812-ko-walkthrough.json)。`*-checks.json`含动画、模态焦点、底层inert、信件点击缺口、wheel、按下态、文案横向溢出和浏览器异常。空文字图标的scrollWidth差值不当作文案截断；长数据/长列表和所有平台未验，不扩大结论。

人工查看代表图：667 KO invalid（错误覆盖保存）、667 KO content（R19英文及内容区需滚动）、812 KO likes（保存提示英文、弹窗韩文）、812 EN my-letters（真实信件卡片渲染）。其他状态以实际PNG/采样记录为证，不声明每张像素审查通过。


最终专项：`npx playwright test -c tests/r17-audit.config.ts` **4 passed (55.5s)，退出0**。这是显式记录缺口的审计脚本通过，不是上述四项全部通过。

证据校验：**92张PNG**（每组23张：十二态主图12＋附加11）；十二态 × 两高度 × 两语言共48张主图无缺失。PNG签名/尺寸/SHA256已校验；92次document采样均不滚且宽375，图片均解码；所采非空文案无横向溢出，但不等同文案翻译、重叠和纵向遮挡通过。编辑wheel：667下scrollTop245，812下100，content800，分别clientHeight555/700。[完整校验](r17-audit/evidence-verification.json)。

最终生产文件仅ProfileFlow.vue模板及profile.css，另增审计测试/报告/证据。保留原R17真实账号截图，不伪造本轮后端成功、头像数据、Figma截图或测试通过数。未合入main。
