# R13 聊天背景与气泡验收

分支 `codex/r13-wallpapers`，基线 `efe9456c8cd479dabfc08286a6d576e1fef6e538`（fetch 后确认为 origin/codex/r12-chat-details）。仅使用本地 `/root/maugo-figma/maugo-file-full.json`，指定版本 `2421258509127695554`；没有调用 Figma API、图片接口或使用 Figma token，没有重导/替换图片。

**本轮不是全项验收通过。** A1/A5/A7/A8 通过；A2/A3/A4/A6 未通过。缺失渐变仍是明确的视觉欠项，不应将本分支视为完成的 Figma 还原。

## 量取与差距

六个完整节点及逐元素坐标、尺寸、fills/strokes（含原始 alpha）、字体、圆角、自动布局 gap/padding 均保存于 [figma-nodes.json](r13/figma-nodes.json) 和 [figma-measurements.txt](r13/figma-measurements.txt)。包含画框背后被遮挡的首页节点；这些节点未重复实现在 ChatFlow。实际展示范围为各状态 Section。源文件 SHA256 另见 [source.json](r13/source.json)。

差距先按 JSON 与 efe9456 代码读取，再用独立基线浏览器采样补证；基线实测见 [baseline-computed.json](r13/baseline-computed.json)，稳定等待 800ms，避免旧过渡动画混入坐标。

| 元素 | JSON 目标 | 基线差距 / 本轮处理 |
|---|---|---|
| 六态外壳/标题 | Section y48，Header y48 h64；返回 x16 y59.5 40×40；标题 x68 y67.5 239×24，Fredoka 550 17/24，字距−0.3 | 外观旧 header 自定义 flex/字重600；改为 R05 ui-header/ui-header__back + ui-icon-button，共用外观；R11 标题/返回文本分支保留 |
| 列表 tabs 29:11235–39 | x24 y136 327×48；内按钮155.5×40，gap8，padding4，圆角14/10；13/16 | 基线327×52，使后续内容下移4px；明确40px按钮高度/16px行高，共用 ui-appearance-tabs |
| 壁纸 29:11242–78 | 外框101×175.0625，图片99×173.0625；x24/137/250，y208/395.0625/582.125，gap12，圆角14 | 基线图片尺寸本来正确，首排y212；保持尺寸并纠正起点。现有八张1x原图路径不变 |
| 默认项/选中 | 边2，accent；勾选 top8/right8；月亮400 32/38.720001，accent alpha .333 | 旧月亮粗体/全字重继承；改为测量字体/alpha；选中交互、既有标记保留；默认径向渐变暂缺，未通过 |
| 标签/说明 | 标签9/14、padding20 6 10，说明10/17，margin-top24 | 字体/尺寸按量值保留；标签渐变蒙层缺 token，当前未实现，不宣称样式相同 |
| 预览 29:11359–67 | x24 y136 327×488，图x25 y137 325×486；边alpha .094，圆角20 | 保留外框/原图；基线左气泡最大86%导致宽251.969，目标293；本轮移除该限制 |
| 预览左右气泡 | 左x41 y161 293×44，右x197 y225 137×44；padding12 16，12/20；圆角14/14/14/4及14/14/4/14 | 固定测量布局；左背景29 44 36/.93，文字229 236 222；右accent，文字24 49 14；均用token |
| 预览标题/按钮 | caption x25 y547.5 325×76、13/16；应用按钮x24 y640 327×48，圆角24，16/22 600 | 取消旧sticky带来的位置影响；采用共享 ui-button 的外观变体；用当前 grad-primary-height-48，渐变仍待R02修订 |
| 应用态 29:11411 | 复用R11 Header/notice/thread/composer；背景cover center | 不修改R11消息排版；应用/退出/会话隔离路径保留；截图采用既有D2固定消息，不伪造Figma示例内容；消息文字/顺序不同，不能声称全部气泡几何已逐一对齐 |
| 色板 29:11578–11603 | x24/195.5，y208/404/600/796，155.5×180，gap16，圆角16，padding16+border1，12/14.520000 | 基线首排y212、行高20；修正起点与字体；7个原有选项保留；Night/Ocean纯色按JSON，其他渐变未完整绘制 |
| 气泡框 29:11688/11792 | x24 y136 327×144，padding20，gap16，圆角16，底12 26 18 | 基线框尺寸正确，保留并token化 |
| 默认/自定义左右气泡 | 左x44 y156 287×44；右x202 y216 129×44；padding12，圆角12，12/20 | 基线左宽243.9375，改287；右129保持；四项颜色继续来自原有appearance变量，不更改业务默认值 |
| 颜色面板/输入 | 面板x24 y304 327×243，底27 42 32，圆角16，横padding16；行61/61/61/60，分隔white/.027；输入x295 y320/381/442/503 40×28、圆角8 | 保持原生input及id/input事件；明确行高和原值边线。原生色块内部绘制受浏览器影响，未宣称逐像素相同 |
| 重置 29:11712/11816 | x24 y583 327×48，圆角24，accent/.035、边accent/.23，文字202 228 181，600 16/22 | 基线y587、字体12/20；改共享ui-button变体和正确间距；逻辑不动 |
| 韩文/小屏 | GowunDodum优先；只调位置/滚动，不缩图 | 专项发现ID字体覆盖，已修正；375×700图片仍99×173.0625，韩文标签未覆盖色块 |

基线实际几何（x,y,width,height）：

| 状态/选择器 | efe9456 实测 |
|---|---|
| wallpapers / `.page-tabs` | 24.000, 136.000, 327.000, 52.000 |
| wallpapers / `[data-wallpaper="moon-road"]` | 137.000, 212.000, 101.000, 175.062 |
| wallpapers / `[data-wallpaper="moon-road"] img` | 138.000, 213.000, 99.000, 173.062 |
| wallpaper-preview / `.wallpaper-preview` | 24.000, 136.000, 327.000, 488.000 |
| wallpaper-preview / `#apply-wallpaper` | 24.000, 640.000, 327.000, 48.000 |
| wallpaper-preview / `.preview-conversation span` | 41.000, 161.000, 251.969, 44.000 |
| wallpaper-colors / `[data-theme="night"]` | 24.000, 212.000, 155.500, 180.000 |
| chat-bubbles / `.bubble-preview` | 24.000, 136.000, 327.000, 144.000 |
| chat-bubbles / `#their-bubble` | 44.000, 156.000, 243.938, 44.000 |
| chat-bubbles / `#my-bubble` | 202.000, 216.000, 129.000, 44.000 |
| chat-bubbles / `#color-myBubble` | 295.000, 320.000, 40.000, 28.000 |
| chat-bubbles / `#reset-bubbles` | 24.000, 587.000, 327.000, 48.000 |

## 改动清单与边界

- ChatFlow 模板仅接入共用控件类、外观页图像/气泡类与外部样式；script setup 与 efe9456 逐字相等。id、data-state、aria-label、click/input处理器保留；没有新增文案，不需要新增翻译。
- 新建 pages/appearance.css，集中六态布局、主题和自定义气泡覆盖。pages/chat.css 仅移出三条本属外观的规则，不改R11/R12排版。
- components.css 增加外观控件/按钮变体，按钮外观只在共用文件定义；tokens.css 只补JSON量得的缺失纯色/字体/圆角，没有新增渐变 token 名。
- 旧chat.css仅保留举报页原有header规则，通过appearance.css导入；fidelity.css和legacy文件中本来没有本模块待删选择器。举报scoped样式20个既有颜色字面量未动。
- HomeFlow、LettersFlow、InboxFlow、其他Flow、素材、manifest、业务逻辑均未改。
- 原工作目录遭外部进程切到main后，本轮误落在main的未提交ChatFlow编辑已立即撤回；后续在 `/tmp/maugo-r13` 独立工作树完成，分支仍为codex/r13-wallpapers。没有提交/合入main或其他分支。

## A1–A8

| 项 | 结果 | 证据/限制 |
|---|---|---|
| A1 构建 | 通过 | 最终 `npm run build` 退出0，素材343 PNG校验、vue-tsc、vite全部完成；见 [build-release.log](r13/build-release.log)。此前失败尝试均保留，不能将失败日志算通过 |
| A2 几何 | 未通过 | R13用例对tabs/缩略图/预览/按钮/色板/气泡/四项输入等关键框有≤1px断言并通过，但未对六态所有关键元素逐一覆盖；应用态仍使用原有固定消息，未按Figma文字伪造消息，因此不能宣称全部气泡几何相同 |
| A3 样式 | 未通过/待Smith及R02 | 量得的纯色、字体、圆角/间距已落token并有部分计算样式断言；缺失的壁纸蒙层、默认径向与主题渐变尚未实现完整；共用主按钮渐变使用当前token，方向仍待R02。原生color input内部亦未逐像素验证 |
| A4 对照图 | 未通过/待R01/R04 | 没有可用正式Figma导出并排图；未生成差异比例，没有用原型或实现图冒充Figma |
| A5 架构 | 通过（R13范围） | [architecture-audit.txt](r13/architecture-audit.txt)：pages/components/base的hex/rgb、important、device前缀均0，旧文件本模块选择器0；新页面选择器最多两级；共用控件外观只在components；script/事件/标识保持；韩文/小屏检查通过。范围外举报20个既有字面量保留 |
| A6 测试 | 未通过（D2基线既有失败） | [final-tests.log](r13/final-tests.log)：R13最终专项2通过（最后截图复跑见[final-r13-decoded.log](r13/final-r13-decoded.log)，不重复计数）；client2+R11 1+R12 2=5通过；原始D2 0通过2失败，已在efe9456原始D2复现相同两处重登录断言失败；未修改外观偏好逻辑 |
| A7 截图 | 通过 | 六个状态均真实进入并生成375×812实现截图，见下表及screenshots.json；另有韩文/小屏证据 |
| A8 诚实 | 通过 | 未通过项、缺失渐变、工具失败与基线失败均记录；无Figma伪图、无伪造差异比例；摘要与本表一致 |

## 渐变 token 与待办

当前沿用的渐变 token：`--grad-primary-height-48`（外观应用/完成）、`--grad-primary` / `--grad-icon-btn`（共用按钮及应用态沿用R11控件；页头返回经ui-header__back覆为透明）。没有自行新增或改名渐变 token。

JSON已量取但当前tokens.css没有对应名字的绘制：29:11242默认径向、29:11244标签蒙层、29:11366预览caption蒙层、29:11583 Forest、29:11587 Clouds、29:11591 Lavender、29:11595 Sunset、29:11603 Stars。完整原始handles/stops在figma-nodes.json。已异步提出是否允许为已测缺失渐变新增临时token的澄清；截至本报告没有获得答复，未把默认选项当成授权。当前这些项目只有JSON测得的纯色层或首色标底色，**这不是完整Figma效果，也不是验收通过**。没有使用近似的其他渐变token替代。后续需Smith确认命名或R02提供对应token后补全。

3x图待Smith，现有04背景1x文件未修改；后续沿原路径替换。

## 测试与环境记录

- 初次auth服务：`Test database connection unavailable`，见appearance-tests.log；独立工作树补齐原有本地测试环境后使用既有隔离测试DB配置，未输出环境中的凭据。
- 沙箱Vite启动退出1，appearance-tests-retry.log；在授权的沙箱外启动本地测试服务/浏览器后执行。
- Vite/vue共享外部样式处理间歇报错：`Cannot read properties of undefined (reading 'scoped')`，指向已有reply.css；build.log/build-final系列及r13-final-tests-3.log均保留。基线构建该次通过，不能断言已证明该错误是基线既有。最终生产构建与preview专项结果单列，未修改范围外Flow或工具依赖。
- appearance-tests-escalated.log：R13首轮1通过，D2两项失败；r13-final-tests.log：新增韩文检查1通过1失败（字体覆盖），修复后r13-final-tests-2.log两项通过。新增计算证据时曾有TypeScript标注错误，见build-final-2.log/build-release-typecheck.log，已补显式DOM类型修正。失败/重复轮次不叠加通过数。
- baseline-d2.log：在独立efe9456快照原始tests/d2.spec.ts复跑，2失败，分别是重登录后的背景none与theme-night缺失，和本轮原始D2失败位置一致。没有删断言、修改业务偏好、伪称D2通过。
- regression.log：client两项、R11十二态专项、R12七态/取消路径和韩文小屏，共5通过。回归产生的r11/r12截图已还原，未作为R13改动提交。
- preview首轮未设置生产API基地址，登录未命中既有`**/api/**`桩而超时，见preview-api-mismatch.log（中断，不能计为通过）。按现有api.ts配置入口使用 `VITE_API_BASE_URL=/api npm run build` 生成测试构建；不改业务逻辑/原始D2。
- 人工检查发现初次生产截图的状态栏/返回图标尚未绘制；补`document.fonts.ready`和真实图片`decode()`等待后重新进入/截图，图像恢复，见最终[final-r13-decoded.log](r13/final-r13-decoded.log)（2通过）和各状态`*-images.json`。没有编辑截图或补绘界面。最终R13固定数据桩同时匹配现有开发/生产默认API地址，原D2未改。
- 最终验收命令：`npx playwright test tests/r13-wallpapers.spec.ts tests/d2.spec.ts --config=playwright.r13.config.ts`，结果 **2通过、2失败**，见 [final-tests.log](r13/final-tests.log)。
- R13最终测试使用独立配置playwright.r13.config.ts，沿用原D2的固定API数据，不需要数据库；最终以生产preview进入真实页面截图，未用DOM快照伪造状态。基线测量/基线D2另用dev，代码均为efe9456。

## 实现截图

以下全部是实现截图，**不是Figma参考图**，没有差异比例。

| 状态 | 375×812 实现图 |
|---|---|
| wallpapers | [PNG](r13/wallpapers.png) |
| wallpaper-preview | [PNG](r13/wallpaper-preview.png) |
| wallpaper-applied | [PNG](r13/wallpaper-applied.png) |
| wallpaper-colors | [PNG](r13/wallpaper-colors.png) |
| chat-bubbles | [PNG](r13/chat-bubbles.png) |
| chat-bubbles-custom | [PNG](r13/chat-bubbles-custom.png) |

附加：[韩文壁纸](r13/wallpapers-ko.png)、[375×700壁纸](r13/wallpapers-small.png)、[韩文小屏气泡](r13/chat-bubbles-ko-small.png)。最终六态的计算样式/几何另存各`*-computed.json`，仅作实现证据。
