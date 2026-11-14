# R12 对话设置 / 搜索 / 清空验收

分支 `codex/r12-chat-details`，从 `90bce6c`（`origin/codex/r11-chat`）创建。执行前已 fetch 并确认远端包含基线，见 [baseline-origin.log](r12/baseline-origin.log)。未合并 main，未修改其他分支。

唯一设计来源为本地 `maugo-file-full.json`，版本 `2421258509127695554`。没有调用 Figma API、使用 token 或重新导图；继续使用原路径的现有 1x 图片，等待 Smith 提供 3x 替换。

本轮**不判定全部验收通过**。`chat-cleared` 未执行、未截图，遵守禁止真实清空种子对话的要求。

## 测量、基线和差距

先从 8 个指定节点提取完整树，再改样式。[原始节点 JSON](r12/figma-nodes.json)、[逐元素测量](r12/measurements.txt)、[提取脚本](r12/extract-measurements.py)包含每个节点的相对 x/y、宽高、fills/strokes、字体、圆角与布局间距。隐藏首页装饰也保留在原始记录中，不把它们当作可见聊天元素。

[基线 ChatFlow](r12/baseline-ChatFlow.vue.txt)、[基线旧 CSS](r12/baseline-chat.css.txt)供逐项复核。下面的基线差距来自代码静态对照，**不是基线浏览器实测**；本轮浏览器实测另见 [browser-measurements.json](r12/browser-measurements.json)。

| 状态 / 元素 | JSON 实测目标（375×812 坐标） | 基线差距及处理 |
|---|---|---|
| details `29:10251` 页头 | 0,48 375×64；返回16,59.5 40²；标题17/24、550、字距−0.3 | 旧页头24边距、24字号返回符号；改复用 ui-header / ui-header__back；不是44尺寸的工具按钮 |
| details 头像、名字 | 152.5,136 70²、圆角35；名字y218、18/22、550；资料说明y248、11/21 | 原80²头像、36px padding、20字号；头像按钮保留真实资料入口，名字保留真实种子，未伪造性别/年龄/城市 |
| details 分组及行 | 卡24,349 327×284、圆角16、底#1B2A20；行40,349 295×56；置顶行y405高60；背景y465；气泡y521；搜索y577；第二组y653 | 原每行20px padding、无卡片；改卡片/56高行/60高开关行；搜索移至背景和气泡后；第二组静音、屏蔽、举报、清空按JSON顺序；下方内容真实滚动可达 |
| details-waiting `29:10389` | 信封131.5,136 112²、圆角32；标题y260；首卡y437.5；第二组y741.5；比已解锁低88.5 | 原使用相同80头像和相同排版；改112信封及277.5高资料区，跟随JSON的88.5位移 |
| Follow / 开关能力 | Follow 148.93,285 77.14×40；等待态y326.5；开关38×22 | 基线脚本没有关注/置顶/静音状态与处理函数。保持脚本不变，仅显示 disabled 控件，未伪造可用能力；未通过/待 Smith 决定另立逻辑任务 |
| remark `29:10524` | sheet12,518 351×270、圆角24；标题y551；标签33,599；输入33,631 309×48；保存33,719 309×48 | 原全宽底部弹层、28padding、无标签；改ui-sheet/ui-input/ui-button variants与JSON定位；显示Save，保留Save remark无障碍名称与真实保存函数 |
| search-empty `29:10678` | 输入24,136 327×48、圆角14、底#1B2920、白描边3.5%；空白结果区 | 原20margin、圆角20、底#1D2C24并显示说明；改精确输入，待输入时结果区留白 |
| search-result `29:10758` | 输入同上；卡24,224 327×80.5、底#1B2A21、圆角12；时间40,246、10/12.1、#87A77E；正文40,267.5、13/21 | 原透明底、分割线、先正文后日期；改时间在上、结果卡在下，数据和搜索函数不变。真实种子结果内容长度决定自然卡高，不强截成设计样本文案 |
| search-none `29:10845` | 空态区24,208 327×267；图131.5,248 112²；标题32,380 311×22、14/22、550、#BAC9B3；说明y414、11/21、#6F876D | 原只有段落；加现有信封1x图和英韩说明，图片不因小屏缩放 |
| clear-confirm `29:10933` | 遮罩0,0 375×812、#030805@79%、blur16；dialog24,277 327×258、圆角28；标题y314、22/28；主按钮49,418 277×48、#E1A39B、文字#42241F | 原#0009底部sheet；改共用scrim/dialog、当前grad-card-height-258及精确危险按钮色。保留原业务说明，未替换成可能误导为仅设备本地删除的设计文案，因此正文与JSON40px样本文案高度不保证相等 |
| cleared `29:11085` | 空线程0,148 375×523；输入16,684 291×44；发送315,684 44²；无已清空提示文字 | 主布局沿用R11，仅在该data-state隐藏原空线程提示；未执行清空，未测量/未截图，未通过/待 Smith |

## 实现范围和约束

`ChatFlow.vue` 只修改这8态相关模板、class、可见文案与样式绑定；原有 id、data-state、aria-label 表达保留。`<script setup>` 逐字未改，见 [script-integrity.log](r12/script-integrity.log) 和 [architecture.log](r12/architecture.log)。新增静态文案有英文/韩文，搜索、备注与清空函数未动。

所有新页面布局写进现有 `styles/pages/chat.css` 的 R12 段，R11 段逐字不变；删除旧 `src/chat.css` 中 person/row/search/results/veil 整块规则。保留的旧页头规则明确排除 chat-details-flow，仅服务未重做的外观/举报。styles.css、fidelity.css、scoped 中没有 R12 旧选择器需要删除。

为遵守共用控件只在 components.css 定义及缺少颜色必须补token两条要求，另外仅在 `components.css` 追加 R12 专用控件 variants、在 `tokens.css` 追加 JSON 精确值；没有修改其他 Flow、首页入口、现有共用控件默认外观、图片、R11主界面或业务脚本。

新选择器为页面根类加一个元素；等待态用根类的 `:has()` 条件。小屏媒体查询只移动确认框。举报 scoped 的20个颜色字面量属于范围外；不可改脚本的10个颜色常量为 `#aef879`、`#153011`、`#28362e`、`#e1e9dd` 各2次，`#07100b26` 2次，均原样保留。

## A1–A8

| 项目 | 结果 | 证据与边界 |
|---|---|---|
| A1 构建 | 通过 | 素材343张校验、vue-tsc、Vite通过，退出0；[build-final-source.log](r12/build-final-source.log) |
| A2 几何 | 未通过 | 专项测试断言头像、备注行、搜索框、备注弹层/输入/保存、无结果标题、确认框/按钮≤1px；未覆盖8态全部关键元素，已清空态未测，资料/结果/说明文案与样本不同；[断言源码留档](r12/r12-assertions.spec.ts.txt)、[实测](r12/browser-measurements.json) |
| A3 样式 | 未通过 | 专项断言备注行字号/行高/文字色、搜索底色/圆角、sheet圆角、确认遮罩及按钮色；未对所有元素全部属性逐项断言，当前共用渐变token尚待R02修订，真实说明文案不同 |
| A4 并排对照 | 未通过 / 待 R01/R04 | 7张真实实现状态图；无Figma导出并排图、无像素差异比例，不把原型图当设计导出 |
| A5 规则 | 未通过（严格全组件扫描） | pages/components/base的hex/rgb/important/device前缀均0，旧R12选择器0，R11页CSS逐字不变；但ChatFlow范围外举报scoped仍20个hex。脚本10个业务颜色常量原样保留并已列清单；[architecture.log](r12/architecture.log) |
| A6 回归 | 未通过 | client、媒体、语音、R11、D3/举报、F07和安全C6路径通过；D2两项、D11一项失败；原C6破坏性清空路径未执行，使用单独安全版本替代，不能声称原有用例全部通过。具体日志见下文 |
| A7 状态覆盖 | 未通过 / 待 Smith | 7/8状态有真实375×812截图；chat-cleared按要求未执行清空，无截图；韩文/小屏另有真实截图 |
| A8 如实 | 通过 | 原始JSON、基线、断言、计算样式、失败尝试和最终结果全部留档；未清空、未伪造第8态/参考图/差异比例 |

结论：**A1/A8通过，A2/A3/A4/A5/A6/A7未通过，不是全项验收通过。**

## 状态截图

以下均为真实页面进入路径生成的实现截图。没有 Figma 导出并排图，没有像素差异比例；A4 待 R01/R04。每张尺寸与SHA256见 [screenshots.json](r12/screenshots.json)。

| 状态 | 真实截图 |
|---|---|
| chat-details | [PNG](r12/chat-details.png) |
| chat-details-waiting | [PNG](r12/chat-details-waiting.png) |
| chat-remark | [PNG](r12/chat-remark.png) |
| chat-search-empty | [PNG](r12/chat-search-empty.png) |
| chat-search-result | [PNG](r12/chat-search-result.png) |
| chat-search-none | [PNG](r12/chat-search-none.png) |
| chat-clear-confirm | [PNG](r12/chat-clear-confirm.png) |
| chat-cleared | **不存在**；未执行破坏性操作，未通过/待 Smith |

## 渐变 token 跟进

本轮直接/经共用variants涉及当前 token：`--grad-primary`、`--grad-primary-height-48`、`--grad-icon-btn`、`--grad-card`、`--grad-card-height-258`。没有发明新的渐变 token。确认框最终使用 height-258，备注保存最终使用 primary-height-48；R02 修订合入时需要跟进改名并复核角度/色标，当前不宣称渐变与JSON完全一致。

## 测试证据及失败项

- 初次沙箱内运行无法启动tsx管道，EPERM，见 [r12-tests.log](r12/r12-tests.log)。经沙箱外启动本地隔离测试服务；随后一次服务残留导致端口占用，见 [regression.log](r12/regression.log)、[final-tests.log](r12/final-tests.log)；清理本轮遗留服务后串行重跑。这些启动失败未计入通过数。
- 第一次7态专项 [r12-tests-2.log](r12/r12-tests-2.log) 在7张截图后被中断，无最终通过结论，不计通过。
- 核心回归命令：`npx playwright test tests/r12-chat-details.spec.ts tests/r12-safe-chat.spec.ts tests/chat-media.spec.ts tests/chat-voice.spec.ts tests/r11-chat.spec.ts tests/client.spec.ts tests/d3.spec.ts tests/report-attachment.spec.ts --workers=1`，见 [final-tests-2.log](r12/final-tests-2.log)：**15通过、1失败**。失败是新增R12用例在备注关闭按钮点击时被标题遮挡，见 [失败页面记录](r12/remark-close-failure.md)；已修复关闭按钮层级。该次中的原有媒体1、client2、D3两项、举报附件3、语音3、R11一项均通过。
- 修复后命令：`npx playwright test tests/r12-chat-details.spec.ts tests/r12-safe-chat.spec.ts tests/d2.spec.ts --workers=1`，见 [final-r12-tests.log](r12/final-r12-tests.log)。**4通过、2失败**：R12七态/取消路径、真实韩文/小屏、安全C6两项全部通过；D2两项失败。本次替代前次对应结果，不能把重复重跑累加。
- D2失败两项：`D2 six states, preview cancel, apply, per-conversation persistence and bubble reset`；`D2 removed wallpaper references fall back to default without losing bubble settings`。均在重登录后外观偏好被既有账户切换逻辑清除的断言失败。R11已记录同类基线失败；本轮未重新在基线运行D2，不冒称完成基线复跑，未修改外观逻辑。
- F07：`npx playwright test --config=tests/f07.config.ts --output=/tmp/r12-f07-results`，**2通过**，见 [f07-tests.log](r12/f07-tests.log)。
- D11：`npx playwright test --config=tests/d11.config.ts`，**3通过、1失败**，见 [d11-tests.log](r12/d11-tests.log)。失败 `collection-unlock: real paid collection, cancellation, shortage, lost response retry and in-place unlock under CPU throttle`，等待当前R10页面不存在的旧 `.inbox-veil` 超时；未修改范围外代码/用例。

原始 `tests/chat.spec.ts` 保持未改。其第一个用例会点击 Clear history 并发送真实清空请求，因此本轮没有运行该破坏性路径；单独的 `r12-safe-chat.spec.ts` 保留原流程、把清空后发送步骤替换为取消确认框。原用例第二项的既有媒体fixture照旧保留于安全副本；R12文档的7张状态截图只来自真实种子/既有进入路径的专项用例，不来自该fixture。

实际韩文验证见 [设置](r12/chat-details-ko.png)、[备注](r12/chat-remark-ko.png)、[375×700备注](r12/chat-remark-small.png)；GowunDodum优先的计算样式有断言，小屏弹层底部不超过视口有断言。`chat-remark-ko-content.png` 仅是英文界面输入韩文的额外截图，不能把它冒充韩文界面验收。
