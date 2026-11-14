# R16 用户资料补查

基线 `codex/r15-audit` / `3c91161`，分支 `codex/r16-audit`。Mac mini 本地执行；开工进程检查只有本轮。未另启 Codex，未开 Issue、调用 Figma API/token、发消息或合 main。

## 原型摘录（实现前写入）

已先读本地 MauGo.html 内嵌 features.js 用户资料实现、CSS、六态操作脚本与本地 Figma JSON。尺寸颜色沿用已验 R16；流程、效果、文案以原型为准，有冲突上报。[原文](r16-audit/prototype-excerpts.txt)、[六态步骤](r16-audit/state-script.json)、[来源 SHA256](r16-audit/references.json)、[本地 Figma 节点](r16-audit/local-figma.json)。

| 状态 | 点哪里 → 去哪里 → 返回/取消 |
|---|---|
| person-profile | 收信箱 → open 会话 → 资料入口 → publicProfile；头像/卡片/动态照片 → showPhoto；关闭/遮罩/Escape → 同一资料，页头 Back → 来源；Chat → enterChat → 当前聊天 |
| person-waiting | waiting 会话 → 资料；关注禁用，Following unlocks after they reply.；Chat → 等待聊天；Back → 来源 |
| person-followed | following 服务数据 → 资料；Follow 切换关注/取关，原型 persist 失败回滚；返回再进读取服务端状态 |
| person-no-content | reader/person-empty → 一张卡、No moments yet.；卡片可看大图；关注由会话权限决定；Back → 来源 |
| person-photo | 资料 #public-avatar → Photo / Portrait，大图无点赞；卡片→类型与 Like；动态照片→Life，无照片点赞；关闭/遮罩/Escape → 资料，保留滚动 |
| person-safety | #public-more → showSafetyMenu；Report → report；Block → confirm → Cancel 关闭；关闭/遮罩/Escape → 资料；提交安全操作按服务端规则，本轮不搬本地 demo |

原型函数：`publicProfile`, `page`, `back`, `showPhoto`, `toggleLike`, `enterChat`, `openLetterProfile`, `showSafetyMenu`, `confirm`。原型找不到 person 时 back；sourceNote 无会话时 Chat/Back 返回原信件。产品 R16 通过现有收信箱/聊天边界进入；不为 demo 建假会话。

原型文案：Profile（标题隐藏）、Moments、No moments yet.、Following unlocks after they reply.、Sample profile、Sample moment、Photo、Portrait/Life、Like、＋ Follow / ✓ Following、Chat；安全说明包含本地预览语义，不能照搬为真实后端语义。

滚动容器：`.page-body` overflow:auto / overscroll-behavior:contain；资料横向 `.public-profile-cards` overflow-x:auto；操作区绝对定位固定；照片/安全为共用 sheet。实现对应 `.person-page .d4-body`、`.person-cards`、`.person-sheet`。

效果摘录：原型 .round 按下 scale(.94)，首页 .actions button 按下 scale(.96) / transition transform .2s、opacity .2s；R16 没有独立 button 按下规则；共用 sheet-in .3s ease-out（从 translateY(30px)、opacity0 到原位）；资料本身、关注文本切换、照片切换、点赞没有独立入场动画或计时。共用壳已实现按下态/sheet-in；本轮先核对计算值，不新增无原型依据动效。

## 验收

整体 **未通过/待 Smith**。本轮修复完成，fixture 走查通过，不等同真实后端验收。

| 项目 | 结果 | 实际证据与边界 |
|---|---|---|
| 静态 | **通过（本轮增量检查，沿用既有静态）** | 两次构建退出0，未复现 reply.css/scoped 间歇错误；person.css 与 ProfileFlow.vue 的 hex / !important / .device 前缀均0；未重做已验尺寸颜色。性别符号六处方案保留，仍待 Smith；未新增 Figma 并排图或像素差异统计。 |
| 流程 | **未通过/待 Smith** | 四组真实点击走查通过：六态、关注/取关/503不切换、照片/卡片/动态、返回/关闭/遮罩/Escape、安全入口及取消、聊天与等待门禁、资料503后返回重进恢复。原型卡片类型/点赞、动态点赞缺失；sourceNote/信件来源与真实服务端回归未执行。安全页返回落详情，原型路由历史会回资料，跨 R14 边界待 Smith，不改其他模块。 |
| 效果 | **未通过/待 Smith** | 共用 sheet-in .3s、30px/opacity 与原型相符，资料 animation=none / transition=0s；共用按钮按下可用。原型 R16 无独立按下规则，壳为 ui-button 添加 .96 / icon .94 的反馈，本轮保留共用壳并报告差异；点赞切换因功能缺失无法验证。 |
| 滑动与文案 | **通过（本轮样本范围）** | 375×667/812 × EN/KO，72个截图采样 document 等于视口，scrollY=0、宽375；d4-body 纵向及 cards 横向真实 wheel 可滚，sheet/body containment 生效；可见文案无横向溢出，图片均解码。代表 PNG 人工查看，韩文按钮/安全说明/空态无占位或截断；不声称任意长姓名、其他平台或所有资料数据通过。 |

## 实现与保护边界

- 生产仅改 `person.css` 与 `ProfileFlow.vue` 模板。前者限定 `.person-page`：页面 overflow:hidden，body/sheet overscroll containment、卡片横向手势 containment、动态正文 pre-wrap（保留原型作者换行）。尺寸、颜色、头像、性别符号方案不改。
- 首轮四组在照片 Escape 后都跳回收信箱，原因是事件继续冒泡至 ChatFlow/InboxFlow。模板仅在 person 存在时 stopPropagation，再调用既有 back；R17/R18 行为不变。修复后照片 Escape 回资料并保留 body.scrollTop，安全 Escape 只关闭弹层。[首轮失败](r16-audit/walkthrough-retry.log)、[失败上下文](r16-audit/baseline-escape-failure.md)。
- `ProfileFlow.vue <script setup>` 与 3c91161 **逐字一致**；[源码检查](r16-audit/source-checks.json)含 SHA256。关注、取关、举报、屏蔽、会话、鉴权、登录/token、支付逻辑不改；其他模块生产文件无diff。
- 未把原型本地 persist、示例动态、点赞、假性别或会话创建搬入产品；fixture 数据仅在审计测试中，媒体使用仓库 portrait PNG，不冒充原型照片或真实用户。

## 效果逐项核对

| 原型清单 | 实际核对 | 结果 |
|---|---|---|
| 公共 round :active .94，首页 actions .96/.2s；R16没有独立按下规则 | 资料 Follow 按下 matrix(.96)，transition 0s；继承共用 ui-button 与 icon 反馈，未新加独立规则 | 共用反馈存在；R16超出原型的反馈待 Smith |
| 公共 sheet-in .3s ease-out，translateY(30px)/opacity0 → none/1 | 四组 photo/card/moment/safety 的计算动画名 sheet-in、时长0.3s；关键帧继承共用 components.css | 通过；已有，无需重复补 |
| 资料页/关注文案切换无独立动画、无计时 | 资料 none/0s，关注成功切换，503保持原值且报错 | 通过（fixture） |
| 原型卡片/动态 Like 切换无计时 | 产品尚无对应控件 | 未通过/待 Smith，未移植 demo |
| 关闭 sheet 无独立离场动画 | 关闭、遮罩、Escape 实测后 dialog 消失，Vue transition继承none | 通过 |

## 构建、检查和走查

- `VITE_API_BASE_URL=/api npm --prefix client run build` 两次退出0：[首次](r16-audit/build.log)、[最终](r16-audit/build-final.log)，最终 bundle `index-BABOw4rJ.js`。如实保留旧轮次间歇构建历史，本轮未复现；没有修改其他 Flow 绕过错误。
- `npx playwright test -c tests/r16-audit.config.ts`：最终 **4 passed (45.5s)，退出0**，[最终日志](r16-audit/walkthrough-capture.log)。第一次本地 preview 因 sandbox listen EPERM 未启动，升级本地运行权限后执行；失败原日志保留。修复 Escape 后首次完整走查也为4组通过，最终重跑补了失败后重新进入的恢复断言并重拍干净照片态。
- 真实后端/原数据库回归 **未执行**，没有把 fixture 当真实会话：[环境说明](r16-audit/regression-not-run.md)。没有改测试库或种子账号。举报/屏蔽只打开、填写、取消，不提交；所有 API 被拦截，不依赖真实登录。
- 原六态中前四态 actions=[]，依靠 seed/params 定义数据；本轮转成收信箱真实点击入口，没有 DOM 注入或直接跳六态。API fixture-only 登录 → 会话确认 → 首页 → 收信箱 → open/waiting/empty 行 → 详情 → 资料。
- 每组18张：六态主图＋unfollowed、follow-failure、card-photo、cards-scrolled、moments-scrolled、moment-photo、report-boundary、block-boundary、chat-boundary、waiting-chat、profile-failure、profile-recovered。四组共72张真实PNG，其中六态主图24张，附加步骤48张；各高度36张，各高度各语言18张。
- [截图索引](r16-audit/evidence-index.md)、[PNG尺寸及SHA256](r16-audit/screenshots.json)、[证据校验](r16-audit/evidence-verification.log)。四组操作/API/滚动/动画/文案/解码记录：[667 EN](r16-audit/667-en-walkthrough.json)、[667 KO](r16-audit/667-ko-walkthrough.json)、[812 EN](r16-audit/812-en-walkthrough.json)、[812 KO](r16-audit/812-ko-walkthrough.json)。对应 `*-checks.json` 含按下态、滚动与零浏览器异常记录。
- 纵向 body.scrollTop：667为378，812为233（内容高905）；横向卡片 left265 / scrollWidth592 / clientWidth327，两语言相同。关闭动态大图后保持滚动值；外层页不滚。

## 待 Smith / 未执行

1. 卡片类型/点赞、动态点赞与原型不完整；不越界添加数据/业务逻辑或改已验静态。
2. 报告/屏蔽入口来自R16，取消/返回后落R14聊天详情，原型路由历史会回资料。真实 report/block/unblock、关注持久化/鉴权及真实会话资料回归未执行。
3. 信件 sourceNote 来源、缺失 person 的原型自动返回路径未执行；当前资料503显示错误，可返回再进入恢复，无专门重试按钮。
4. 六处性别符号 Fredoka/原JSON Arial 差异依旧待 Smith，本轮不改。没有声称重新完成旧A1–A8全量验收；旧A7零截图缺口已按本轮授权用API fixture补出真实PNG。
5. 共用壳给R16按钮的额外按下态保留，待 Smith 确认是否需要R16精确覆盖；本轮不改共用模块。

## 交付

分支 `codex/r16-audit` 已直接推送到 origin（无自动审批拦截）；不合 main。
