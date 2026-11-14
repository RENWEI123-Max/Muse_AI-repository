# R11 聊天补查

基线 `1fb203c`；分支 `codex/r11-audit`；Mac mini。禁止合入 main、Issue、Figma API/token。开工进程检查仅本轮 codex exec；分支无新增提交。

## 动手前原型摘录

完整12态操作定义：[state-script.json](r11-audit/state-script.json)；本地原型函数/样式原文：[prototype-excerpts.md](r11-audit/prototype-excerpts.md)；本地源哈希：[references.json](r11-audit/references.json)。尺寸颜色依本地Figma JSON，流程效果文案依原型；冲突列待Smith，不自行替换业务规则。

| 状态 | 点哪里 → 去哪里 → 返回/取消 |
|---|---|
| chat-waiting | 收信箱waiting行 → 等待提示；••• → details → Back回chat；Back回收信箱 |
| chat-receipt-waiting | 待收行 → A reply has arrived.；Collect your reply → inbox收取；取消保留待收 |
| chat-open | 已解锁行 → 消息；标题/对方头像 → public-profile → Back回chat；••• → details |
| chat-draft | 输入Say something kind… → 草稿；Back再进保留草稿 |
| chat-sent | 填文字 → chat-form提交 → 消息/清空草稿；persist失败恢复原稿 |
| chat-photo | 消息列表显示媒体；drawMessages后线程滚到底部 |
| chat-attachment | Photo → 文件选择 → 待发Photo ×；×移除回chat；发送→媒体消息 |
| chat-stickers | Stickers → showEmoji(feature)；同按钮/×/Escape关闭回chat |
| chat-sticker-selected | 选表情 → 待发Sticker ×；移除/发送回chat |
| chat-recording | 按住 → beginRecording(feature)申请权限；波形、秒数；释放finishRecording → 音频附件；短录音提示 |
| chat-record-cancel | 上移65px → 取消；feature bindVoice直接finishRecording(true)；松开不发送；后台/Escape取消 |
| chat-mic-denied | 权限拒绝 → Microphone access is off. You can still use text.；仍可文字/图片 |

函数：chat、drawMessages、drawPending、bindVoice、showEmoji/closeEmoji、beginRecording/finishRecording、renderMedia、back/open、persist。chat页固定，chat-thread flex:1/min-height:0/overflow:auto；emoji-grid内滚。drawMessages默认scrollTop=scrollHeight，搜索目标居中。待发附件点击移除；没有找到消息撤回入口或服务端撤回协议，不能把清空记录当撤回。

效果清单：共用按下态沿用外壳；emoji show/hide直接hidden（无指定动画）；波形wave 600ms ease-in-out infinite alternate，26条delay=i×-40ms，7→35px；原型chat-message无专属入场动画；recording-overlay直接hidden；普通sheet-in300ms仅sheet；toast2700ms/200ms。已有实现250ms消息/panel与450ms解锁过渡是现存差异，不新增原型未定义效果。录音原型200ms更新整数Ns，最多60s；真实音频采集/权限/发送以服务端和现实现为准，不搬本地演示存储。

## 实现与边界

仅改ChatFlow.vue的界面行为、pages/chat.css的R11规则、i18n.ts的五条录音文案；新增独立API fixture走查。没有修改App.vue、token/account存取、服务端、支付、收取或消息发送/录音采集函数。

- 消息首次加载、末条ID变化、解锁过渡结束和媒体解码后滚至线程底部；保留手动向上滚动与Earlier messages。没有复制原型本地persist或已读权限演示。
- Escape关闭表情、取消当前录音；注销监听。调用现有cancelVoice，发送/采集逻辑不改。
- 选择图片后清空原生file input值，使移除后再次选择同一文件能触发change；只改输入控件行为，格式/体积限制和上传API不改。
- 补26条wave 600ms ease-in-out alternate、-40ms逐条错峰、7→35px。静止颜色/宽度/位置沿用现有token。
- 375×667删除重复的145px底部补偿，使聊天操作区跟随外壳实际高度；取消目标在短屏使用bottom:147px，避免固定top落出屏。375×812的正常态几何不变。thread增加overscroll-behavior:contain。
- 韩文增加Recording cancelled… / 60 second limit… / Recording too short… / Voice message sent. / Record again when ready.；动态服务端错误仍可能是英语，不把fixture文案当全部后端国际化通过。

## 效果清单核对

| 项目 | 原型 | 实现/本轮结果 |
|---|---|---|
| 按下态 | 共用控制按下态，hold按钮active背景；无聊天统一时长要求 | 沿用外壳按下态；本轮未改颜色，未重做全控制按压实测，待Smith |
| 表情面板 | showEmoji/closeEmoji直接hidden，无指定动画 | 现存c6-panel opacity/translateY28，250ms ease；保留差异，静态不动，待Smith |
| 消息 | drawMessages后滚到底，无独立入场动画 | 补滚动；已有c6-message 250ms translateY16/scale(.95)，不冒称原型定义了该效果，待Smith |
| 录音覆盖层 | hidden开关，无指定过渡 | 已有c6-panel250ms；未擅自删动画，待Smith |
| 波形 | wave600ms ease-in-out infinite alternate，26条，delay=i×-40ms，7→35px | 本轮补；浏览器computed记录r11-wave/0.6s |
| 取消手势 | feature bindVoice上移65px直接finishRecording(true)；reply/compose则切cancel-mode | 当前R11上移65px显示取消态，释放取消；12态定义本身要求可见cancel状态；此原型内部差异上报，未改采集业务 |
| 解锁 | chat重绘，无专属450ms动画 | 已有d11-unlock450ms ease-out；本轮仅在结束后校正滚动，保留差异待Smith |
| 录音计时 | 200ms更新整数Ns，最多60s | 实现voiceTime为m:ss / 1:00；仍不一致，未改采集/上限业务，待Smith |
| toast | 2700ms隐藏/200ms过渡 | 现R11错误/voiceNotice持续status，并非原型toast；本轮未新增自动清除定时器，待Smith |

## 缺口、冲突与跨模块责任

1. 原型标题/对方头像可进入public-profile；R11标题h1与消息头像仍无点击入口。详情里的View profile为R12已有入口，不等同R11双入口已实现。为不重排已验静态，本轮未新增按钮，待Smith确认入口与可及性方案。
2. 表情仍是按文件名排列的50张资源，与原型语义顺序不同；本轮未静态重排。录音时长仍为m:ss / 1:00，原型为Ns。两项重新核对源码与截图后仍有差异。
3. 未发现本地原型聊天消息撤回入口；实现亦无单条撤回，服务端撤回能力未核实。Clear messages清空历史属R12，不能作撤回通过证据。
4. R08 waiting/replied Continue chatting到会话的上游路由缺口仍属R08/App；本轮只从收信箱真点进入R11，不宣称R08入口已修。R09/R10收取完成后R11解锁；从R11发起收取的确认/取消保留当前chat，原型Collect your reply先去inbox，形态不同。未动业务/支付或App路由。
5. •••进入R12详情、Back回原聊天已走；举报/屏蔽入口在R12详情，非R11消息工具。R12 follow/pin/mute仍disabled、等待态多个设置仍可点等旧规则仍存在，未修R12。原R11报告说的scoped旧样式在当前基线已移除；当前ChatFlow仅剩外观脚本10个hex，不能照抄旧20个scoped hex结论。
6. D2/D11历史失败本轮不判定已解决或重新复现：未运行数据库回归。Mac无测试数据库/真实后端，按任务要求不尝试修配置，也不重新启动已知会报Test database connection unavailable的数据库套件；标未执行，不能写本轮实际失败/通过数。
7. 服务端权限、发送存储、已读回执、真实设备麦克风、原生键盘、真实网络与读写信入口链路均未验。API fixture只验证界面协议和流程形态，服务器规则优先，不移植本地演示业务。

## 四项验收

整体 **未通过/待 Smith**。浏览器fixture通过与真实后端验收分开。

| 项目 | 结果 | 实际证据/范围 |
|---|---|---|
| 静态 | 未通过/待 Smith（严格全改动文件grep未清零） | 沿用R11既有静态基准，本轮不重新声称全量像素通过；375×812正常态布局/颜色不动。指定构建退出0；pages/chat.css、i18n.ts全文件hex/!important/.device前缀均0；ChatFlow.vue全文件仍10个基线外观脚本hex，其他两项0；新增行三项均0。未为清零改R13外观逻辑。详见source-checks.json、build.log。 |
| 流程 | 未通过/待 Smith | 12态×英韩×两高度真实点击、填字、选文件、录音手势；草稿返回、文本503重试、收取取消/成功解锁、附件移除同图重选、表情关闭/发送、录音取消/Escape、语音上传503重试、拒权后文字可发、详情/返回已走。标题/头像profile入口、收取去向、录音附件形态仍与原型不同；真实权限/存储/已读未验。 |
| 效果 | 未通过/待 Smith | 波形600ms与错峰已补，消息滚底已补；原有250ms panel/message、450ms解锁、持续status与原型hidden/toast仍不同，按下态未逐控件全测。未将“动画存在”写成“所有时长一致”。 |
| 滑动与文案 | 未通过/待 Smith（12态浏览器滑动覆盖通过） | 两高度英韩整页scrollY0/document高度等于viewport，thread和表情grid可内滚；正常态可见文本横向溢出扫描0。五条录音韩文已补。语音错误中的服务端Please try again.仍英语；错误notice与语音预览标题有叠放，扫描0不等于无视觉遮挡；长用户昵称/全部真实后端错误/原生键盘未验。 |

## 流程走查与截图清单

[Playwright源码](../../tests/r11-audit.spec.ts)、[配置](../../tests/r11-audit.config.ts)；命令 `cd client && npx playwright test --config tests/r11-audit.config.ts`。浏览器通过UI协议登录fixture：协议勾选→输入邮件/密码→Meet your letters→Messages→会话行；只设置语言偏好，不直接写token/account，不注入Vue状态，不直接设置data-state。API fixture供会话/额度/待收状态、成功/503响应；浏览器使用Chromium真实录音API加fake-device音源，拒权分支明确用getUserMedia拒绝桩，不代表Mac真麦克风授权。

每组按同一顺序：waiting→•••详情→返回→轮询待收→收取确认取消回原chat→确认收取解锁→线程滚顶→draft→Back再入保留→发送503/重试→照片待发/移除/同图重选/发送→Back再入显示photo→表情面板内滚/Escape→选表情/移除/×→选表情发送→录音/上滑取消→再次录音Escape→录音释放预览→上传503保留/重试发送→拒权→文字仍可发送→•••详情→Back原chat→Back收信箱。

每组 `${height}-${lang}-walkthrough.json` 按步记录截图名、实际状态、document高度/scrollY、可见文本溢出；`${height}-${lang}-checks.json` 记录API路径、thread/grid滚动、波形computed、pageerror。截图是实际Chromium渲染PNG，语言en/ko、高度667/812，宽375；[screenshots.json](r11-audit/screenshots.json)记录全部尺寸/SHA256，[evidence-index.md](r11-audit/evidence-index.md)逐图链接。12态覆盖为每组chat-waiting、chat-receipt-waiting、chat-open、chat-draft、chat-sent、chat-photo、chat-attachment、chat-stickers、chat-sticker-selected、chat-recording、chat-record-cancel、chat-mic-denied；另有send-failure、sticker-scroll、voice-preview、voice-upload-failure、voice-sent、details-boundary。

早期日志保留：sandbox启动EPERM；attempt-1测试误判收取取消后去inbox；attempt-2暴露解锁后未滚底；attempt-3暴露同图重选；attempt-4在450ms解锁过渡结束前滚顶产生竞态（截图等待改650ms）；attempt-5-hmr在补韩文热更新时打断一组。最终日志使用冻结源码，不把失败尝试累计为通过。browser-single.log是中途单组验证，不能当最终四组结果。

原数据库回归本轮**未执行**；未修改测试数据库配置、原回归或后端代码。D2/D11不报本轮复现结论。无真实后端、麦克风设备、支付/读回执验收证据；待Smith。

最终冻结源码运行：**4/4组通过**，Playwright退出0，见[browser.log](r11-audit/browser.log)；指定构建退出0，见[build.log](r11-audit/build.log)。共72张真实PNG，其中12态×英韩×两高度为48张，另24张扩展步骤。四组各18步document高度/scrollY断言通过，横向溢出记录0，thread滚顶/滚底、grid scrollTop288实测通过。语音错误notice叠放与后端英文错误属于人工复核缺口，不被这些自动断言覆盖；因此四项验收均仍为**未通过/待 Smith**。

本地Figma12个参考画框的尺寸/填充摘录见[local-figma-frames.json](r11-audit/local-figma-frames.json)，只读本地JSON，无API/token。没有新生成Figma对照PNG或差异比例；截图均为应用实现。
