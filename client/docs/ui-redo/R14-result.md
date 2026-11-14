# R14 安全、举报与屏蔽验收

分支 `codex/r14-safety`；先成功 `git fetch origin`，确认 HEAD 与 `origin/codex/r13-wallpapers` 同为 `2cdbd9d74dc3edaabd2a45ec9ee6d7fdcdc0fe3d`，再从该基线建立本分支。没有合入 main，没有提交到其他分支。

**本轮未全部通过：A1/A5/A8 通过；A2/A3/A4/A6/A7 未通过。九张要求的截图中真实存在八张，缺 report-saved。** 没有为了截图提交举报；原 D3 与举报附件五项用例包含提交操作，因此本轮只枚举、不执行，不能声称这两份测试通过。

唯一设计源是本地 `/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`；版本、SHA256 见 [source.json](r14/source.json)。没有调用 Figma API、图片接口、使用 token 或重导图片。现有 1x 素材路径和文件不变，3x 替换待 Smith。

## 先量与基线差距

[extract.py](r14/extract.py) 可重新提取九个完整节点；[figma-nodes.json](r14/figma-nodes.json) 保存完整 JSON，[figma-measurements.txt](r14/figma-measurements.txt) 保存每个元素相对画框的 x/y、尺寸、fills/strokes/effects、字体、圆角和布局间距。九个画框都包含被遮挡的首页/聊天背景节点；本任务没有重做背景里的其他模块。

先完成 JSON 提取和基线浏览器测量，再修改实现。基线浏览器使用原 `2cdbd9d` 的生产构建，命令 `R14_BASELINE=1 TEST_PREVIEW=1 npx playwright test tests/r14-safety.spec.ts --workers=1`，1 通过，见 [baseline-preview-retry.log](r14/baseline-preview-retry.log)。[baseline-summary.json](r14/baseline-summary.json) 和八份 `baseline-*-computed.json` 是真实基线测量；旧 [chat scoped CSS](r14/baseline-chat-scoped.css)、[header CSS](r14/baseline-chat.css)、[inbox CSS](r14/baseline-inbox.css) 一并留档。不是以修改后的数值冒充基线。

| 元素 / 节点 | JSON 实测目标（375×812） | 2cdbd9d 基线 / 本轮处理 |
|---|---|---|
| 安全选择弹层 29:11996 | x12 y490 351×298，r24，底色24/33/30，白边 alpha .043，阴影0 −50 100 black/.533 | 原弹层 x0 y16.172 375×260.547，没有底部容器几何；改共用 ui-sheet，按画框定位 |
| 标题/关闭/抓手 29:11998–12003 | 抓手x169.5 y503 36×4；标题容器x33 y523 309×24，550 18/24，字距−.3；关闭x310 y507 44×44 | 原普通h2/取消按钮；模板复用抓手和图标按钮，取消行为保留在关闭按钮，原id/aria不丢失 |
| 说明 29:12006 | x33 y571，12/20，130/147/130 | 原随文档流；改明确位置与token |
| 选项 29:12008/12016 | x33 y607/693，309×74，r14，底33/48/37；图标x49 y633 22×22；文字x85，14/20；副文11/18，143/165/130，gap4 | 原x0 y85.344/170.031，375×74.688，r16，图标24；改共用 ui-safety-option，去掉设计中没有的尾箭头 |
| 举报页头 29:12056–62 | y48 h64；返回x16 y59.5 40×40；标题17/24 550，字距−.3 | 删除旧 chat.css 报告页头覆盖，复用 ui-header/ui-header__back；只报告页增加共用类，其他页头分支保持 |
| 引导/标签 29:12066/12068/12076 | 引导x24 y136 13/21、155/178/147；Reason y181，Details y285，12/20、186/205/178 | 原 scoped 13px标签、不同margin/色值；按JSON改token与布局 |
| 原因下拉 29:12069 | x24 y213 327×48，r12，32/47/36，白边alpha .043，13/20 | 原x24 y212.094 327×48，r14；使用ui-input的共用外观 |
| 详情文本区 29:12077 | x24 y317 327×120，r12，padding12/16；placeholder主色alpha .46 | 原y312.094 h150，padding14/r14；改共用ui-input--safety-area，保留原textarea、maxlength、v-model |
| 加照片/保存 29:12080/12085 | x24 y477/599，327×48，r24；16/22 600；加照片accent/.035、边accent/.23 | 原加照片y484.094，保存y603.781；两者接共用ui-button变体，页面仅定位；上传/删除业务脚本不动 |
| 举报说明 29:12083 | x24 y549 327×34，10/17、114/133/113，居中 | Figma称“本地保存、不发送”；实际系统真实提交审核，保留真实说明，预留同等框高，不改成虚假本地保存文案 |
| 已填写 29:12127 | 与空表单相同输入/按钮几何；field value13/20 | 通过现有输入进入，未提交举报；表单文案是测试输入，不伪造聊天数据 |
| 保存反馈 29:12316/12317 | x28 y646.25 319×41，r16，32/41/41 alpha .93；12/18、230/236/223 | 原是details顶端普通p。样式移到safety.css并按目标区域定位，保留真实回执文字；**未提交、未截图、未做运行时验证，待Smith**。真实长文案/带附件文案可能增高，不能声称41px已验收 |
| 屏蔽确认 29:12458/12459 | scrim 3/8/5 alpha .79、blur16；弹层x24 y277 327×258，r28；标题x49 y314、550 22/28；说明y354 12/20；按钮x49 y418 277×48 | 原x0 y16.172 375×159.172；改共用ui-dialog与scrim，标题/说明/按钮按画框定位，关闭/取消不提交 |
| 已屏蔽提示 29:12530–34 | x0 y660.5 375×123.5，底27/43/33；标题y683.5 550 14/16.94，205/227/190；说明y709 11/19；详情动作y736高28 | 复用R11已有消息和权限分支，仅本态提示卡定位/字体修正；首轮偏10.5px，已修正。保留真实Tea wanderer种子内容，不复制Figma聊天示例 |
| 屏蔽列表 29:12613–18 | 行x24 y136 327×80；头像x24 y152 48×48、r24；姓名x84 y168.5 12/14.52；解除x284 y158 67×36、r24，11/13.31 500 | 原容器止于y716、头像x24 y148 42×42；改整页普通页、80px行和48px头像，沿用现有placeholder素材/真实名称 |
| 空态 29:12699/12701/12703 | 图片x131.5 y176 112×112；标题框x32 y308 311×22，550 14/22，186/201/179；说明y342 11/21，111/135/109 | 原屏蔽符号+单标题，缺说明；改现有envelope素材和已有双语说明，不新造素材 |
| 解除确认 29:12881–93 | x24 y287 327×238，r28；标题y324 22/28；说明y364；按钮x49 y408 277×48；取消框y456高52，关闭x302 y296 40×40 | 聊天和名单原先使用不同旧容器；统一共用确认框，保留两条原进入/解除路径 |

几何断言、样式断言和进入路径在 [r14-safety.spec.ts](../../tests/r14-safety.spec.ts)；[assertion-targets.json](r14/assertion-targets.json) 保存断言涉及控件的对应节点 fills/style/radius，完整原值以完整JSON为准。八份 `*-computed.json` 是实现实际计算值，可和基线逐项复查；未把包裹文本的容器宽度当作Figma单段文字墨迹宽度完全相等的证明。

## 实现与边界

- 新建 `src/styles/pages/safety.css`，九态安全专属样式集中于此；按钮/输入/弹层/选项外观变体只定义于 `components.css`，没有在页面重绘共用按钮。
- `ChatFlow.vue` 删除整个举报scoped块；`src/chat.css` 删除旧报告页头规则，`appearance.css` 只删除对此空模块的import，R13规则不改；`inbox.css` 只移出屏蔽列表/空态/动画专属规则。
- ChatFlow/InboxFlow的 `<script setup>` 与基线逐字相等。原id、data-state、aria-label全部保留；新增关闭按钮复用原取消/关闭动作。新增空态说明使用已有英文/韩文翻译，没有修改业务模块或翻译脚本。
- HomeFlow完全未改，首页Diamonds / Filter Pass入口保留。没有修R11/R12/R13遗留问题，也没有替换资产。
- 韩文使用GowunDodum；375×700只调整弹层位置/滚动，不缩放图片。韩文/小屏截图只作溢出检查，不作英文Figma像素验收。

## A1–A8

| 项 | 结果 | 证据与限制 |
|---|---|---|
| A1 构建 | 通过 | `VITE_API_BASE_URL=/api npm run build` 退出0，343 PNG校验、vue-tsc、vite通过；[build-release.log](r14/build-release.log)。测试预览显式指向既有/api代理 |
| A2 几何 | 未通过/待Smith | 八个可安全进入状态的关键框有≤1px boundingBox断言并通过；report-saved未进入，未覆盖九态所有关键元素；聊天内容保留真实种子，与Figma示例不同 |
| A3 样式 | 未通过/待Smith及R02 | 部分颜色、圆角、字重、字号、行高有getComputedStyle断言并通过；没有对九态每个元素每个属性完成完全相等断言。共用渐变仍待R02修订；原生select箭头/textarea拖动角与Figma绘制存在差异；真实举报说明/保存回执与设计的本地预览文案不同 |
| A4 截图对照 | 未通过/待R01/R04 | 缺正式Figma导出并排图；未使用旧离线原型图冒充Figma，不计算虚构差异比例；实现图八张见下表 |
| A5 架构 | 通过（本任务范围） | [architecture-audit.txt](r14/architecture-audit.txt)：pages/components/base颜色字面量0、important0、device前缀0；旧文件安全规则0；页面选择器最多两级、以安全根类开头；脚本逐字一致、既有标识无丢失，HomeFlow不变 |
| A6 回归 | 未通过/待Smith | 本轮安全专项3项及既有client2项共5通过（最终轮），见下方日志；原d3.spec.ts两项、report-attachment.spec.ts三项均含举报提交，遵守“只到表单和取消”而未执行，只做--list，不能标为通过 |
| A7 九态覆盖 | 未通过/待Smith | 八态由既有真实进入路径进入并生成375×812 PNG；report-saved需要真实举报成功，按要求未提交，因此缺第九张；未注入Vue状态、伪造响应或编辑截图 |
| A8 如实 | 通过 | 上述缺口、失败/中断尝试、缺图及原测试未执行均明确记录；没有伪造通过数、成功回执、Figma图或差异比例 |

脚本中保留的业务颜色常量见 [retained-script-colors.txt](r14/retained-script-colors.txt)：原气泡默认色、appearanceStyle/背景蒙层等均属R11/R13原业务脚本，未为清理grep而改逻辑。举报旧scoped颜色字面量已清除。

本任务直接/经共用控件使用的现有渐变token：`--grad-primary-height-48`（保存/确认）、`--grad-card-height-258`（屏蔽框）、`--grad-card-height-238`（解除框）；共用基类还引用 `--grad-primary`、`--grad-icon-btn`、`--grad-card`，相应安全变体或返回控件再覆盖。没有自行新增/改名渐变token；后续R02修复合入时应复核这些名称和方向。

## 测试记录

- 最终命令：`TEST_PREVIEW=1 npx playwright test tests/r14-safety.spec.ts tests/client.spec.ts --workers=1`，见 [release-tests.log](r14/release-tests.log)。最终 **5通过，0失败**（R14专项3项 + client原用例2项），不包含未执行的五项原举报测试。
- 原始提交测试只枚举：[original-tests-list.log](r14/original-tests-list.log)。未执行的五项逐条是：D3 nine states: real report → block → list → unblock and send；D3 unblocking waiting conversation recalculates permissions; failed report remains editable；B13 image report persists; foreign media rejected; remove and plain reports omit attachment；invalid and oversized images rejected; upload failure permits plain report；removing an in-flight photo ignores its eventual upload result。两份原测试文件未改，不以安全替代专项冒充原测试全通过。
- 本轮真实使用auth-server既有隔离测试数据库与`/__c5/seed`，不伪造聊天名称/消息，不向`/reports`提交；专项安装举报请求拦截且检查提交次数0。可逆屏蔽/解除屏蔽在隔离种子上实际执行。
- 初始沙箱测试服务因tsx IPC socket EPERM未启动，见 [baseline-test.log](r14/baseline-test.log)。授权沙箱外开发服务器遇到已有Vue共享样式`reply.css` scoped错误，见 [baseline-test-escalated.log](r14/baseline-test-escalated.log)，该轮中断；首次preview因旧服务占端口失败，见 [baseline-preview.log](r14/baseline-preview.log)。清理失败会话后基线preview通过，未修改范围外工具/业务处理这些错误。
- 首轮R14卡片位置差10.5px导致专项失败，见 [safety-tests.log](r14/safety-tests.log)；修正后 [safety-tests-retry.log](r14/safety-tests-retry.log) 1通过。增加韩文用例时用了英文登录定位，见 [final-tests.log](r14/final-tests.log)，发现后中断；改为语言无关定位，[final-verified.log](r14/final-verified.log) 2通过。这些历史轮次不叠加到最终通过数。

## 实现截图

以下为真实浏览器实现图，非Figma参考图；文件存在性见 [screenshots.json](r14/screenshots.json)。

| 状态 / 节点 | 375×812截图 |
|---|---|
| safety-choice / 29:11861 | [PNG](r14/safety-choice.png) |
| report-empty / 29:12027 | [PNG](r14/report-empty.png) |
| report-filled / 29:12127 | [PNG](r14/report-filled.png) |
| report-saved / 29:12227 | **不存在；未提交举报，待Smith** |
| block-confirm / 29:12322 | [PNG](r14/block-confirm.png) |
| chat-blocked / 29:12474 | [PNG](r14/chat-blocked.png) |
| blocked-list / 29:12575 | [PNG](r14/blocked-list.png) |
| blocked-empty / 29:12659 | [PNG](r14/blocked-empty.png) |
| unblock-confirm / 29:12744 | [PNG](r14/unblock-confirm.png) |

附加：[韩文安全选择](r14/safety-choice-ko.png)、[韩文375×700安全选择](r14/safety-choice-ko-small.png)、[韩文375×700举报表单](r14/report-empty-ko-small.png)。
