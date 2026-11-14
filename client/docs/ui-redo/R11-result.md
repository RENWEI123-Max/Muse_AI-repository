# R11 对话主界面验收

分支 `codex/r11-chat`，基线 `df4526b`（`origin/codex/r10-reply`）；执行前已 `git fetch origin` 并确认远端包含该基线。没有合并 main，没有修改其他分支。

唯一设计来源：`/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`。没有调用 Figma API，没有使用 token，没有重新导图。现有 PNG 文件均未修改。

## 测量及差距

12 个节点的完整逐元素坐标、尺寸、fills/strokes、字体、圆角及自动布局数值见 [measurements.txt](r11/measurements.txt)，对应原始节点见 [figma-nodes.json](r11/figma-nodes.json)，提取程序见 [extract-measurements.py](r11/extract-measurements.py)。坐标均减去所属状态画框原点；包含不可见节点的原始值，不能把 opacity=0 的首页装饰当作聊天元素。

先测量后改动；基线聊天样式留档 [baseline-chat.css.txt](r11/baseline-chat.css.txt)，删除的 fidelity 覆盖见 [removed-overrides.txt](r11/removed-overrides.txt)。[color-audit.md](r11/color-audit.md) 是这 12 个节点（含隐藏节点和图标）45 种 solid 基色与基线 tokens 的逐色比较，其中 36 种没有同样的 hex 表达；这不是整个 20 状态聊天模块的 46% 使用次数统计，也未把 rgb 等价表达计为已有 hex。

| 元素 / 状态 | JSON 测量目标 | 基线差距与本轮处理 |
|---|---|---|
| 全部 12 态页头 | y48，高64；返回16,59.5 40²；标题17/24、550 | 基线 header padding24，按钮无固定几何；主界面使用共用 header/back |
| 全部 12 态提示行 | y112，高36；文字10/12，`#799776` | 原文不同、`#829878`；换设计英文并补韩文 |
| chat-waiting `29:8643` | 底区0,677.5 375×106.5；标题14/19.5；正文11/19 | 原卡片16边距、圆角16、呼吸动画；改全宽平底区 |
| chat-receipt-waiting `29:8737` | 标题y683.5；正文y709；收取文字y744 | 原卡片按钮流式堆放；按标题/正文/操作间距排布，保留真实收取入口 |
| chat-open `29:8830` | 线程0,148 375×523，内边距24/20；右气泡181,172 174×45；左气泡60,260 275×65；头像20,264 30² | 原线程24/16、头像32、气泡圆角18；改线程24/20、头像30，气泡左右16/16/4/16与16/16/16/4；消息内容和时间继续来自真实种子，因此气泡自然宽高不全等同设计样本 |
| chat-draft `29:8952` | 输入16,684 291×44，圆角24，底`#233328`；发送315,684 44² | 原输入底`#223528`、发送42高；共用输入/图标按钮新增专用 variant |
| chat-sent `29:9074` | 同输入区；气泡13/21，时间9/11、上间距8 | 原气泡13/20、时间9/14；改13/21、9/11及8px行间隔，发送逻辑未动 |
| chat-photo `29:9202` | 图片气泡按节点树内媒体几何/圆角 | 原max-height220、无固定图像样式；主界面图片200×210、圆角12；按29:9264修正媒体尺寸，未完成该态全部媒体节点的逐项实测断言 |
| chat-attachment `29:9333` | 条0,611 375×60；卡16,619 93×44；缩略22,623 36²、圆角7 | 原缩略高76；条和缩略尺寸已改，已补卡片底、Photo/Sticker移除文字与7px缩略圆角，未逐元素断言 |
| chat-stickers `29:9459` | 面板14,336 347×376；内容x31；网格313宽；5列10行，8间距，52高，列宽约56.2；可视区304高；格底白@1.6% | 原4列表情、无面板；共用5列表情网格，现有50张图片，滚动可见约5行；素材顺序仍待按语义逐一匹配 |
| chat-sticker-selected `29:9689` | 已选附件条同照片态；Sticker文字 | 原选择后面板遮住发送/移除按钮；模板隐藏已选态面板，选择/发送函数不变；已补附件卡文字与底，未逐元素断言 |
| chat-recording `29:9815` | 遮罩0,105 375×707，`#060C09@96%`；波形122.5,405 130×45；取消目标105.71,618.5 163.58×46.5 | 原居中小卡；换全屏覆盖层、26条波形、取消区与底部提示；实际时长保留voiceTime，未硬编码Figma的8s |
| chat-record-cancel `29:9971` | 同遮罩；取消态波形/取消目标及底钮有专属颜色 | 上滑真实进入取消态；录音逻辑不变；已补JSON专属取消颜色与底部弧形区；完整提示几何尚未逐项断言 |
| chat-mic-denied `29:10127` | 状态条28,646.25 319×41，底`#202929@93%`；文案12/18 | 原长错误占流式布局；改定位短提示，原详细错误保留为读屏文本；权限申请函数不变 |

## 改动范围

- `ChatFlow.vue`：主界面布局 class、共用 primitives、表情面板和录音覆盖层模板；原 `id`、`data-state`、`aria-label` 表达保留；脚本逐字一致，见 [script-integrity.log](r11/script-integrity.log)。
- `styles/pages/chat.css`：新主界面样式；`components.css`：共用表情面板/网格及聊天输入、发送、工具、按住录音按钮 variants；`tokens.css`：来自 JSON 的精确聊天色/字体/圆角。
- `chat.css`：删除已替换的 R11 规则，保留设置/搜索/确认弹层/外观规则；`fidelity.css`：删除18条聊天覆盖。其他 Flow 文件、首页入口和图片未修改。
- `lib/i18n.ts`：新静态英文对应韩文；`tests/r11-chat.spec.ts`：真实进入12态、部分几何/计算样式断言、截图。新增测试沿用既有种子，照片经真实上传并重开读取历史；录音使用 Chromium 假麦克风，拒权通过 getUserMedia 拒绝桩，不修改应用状态或伪造截图。

## A1–A8

| 项目 | 结果 | 证据与边界 |
|---|---|---|
| A1 构建 | 通过 | `npm run build` 退出0，素材校验343张、vue-tsc、Vite均完成；[build.log](r11/build.log)。一次中间构建出现reply.css的Vite scoped描述符错误，留存[build-attempt-2.log](r11/build-attempt-2.log)，最终重跑通过；未修改R10代码。 |
| A2 几何 | 未通过 | 新用例的输入框/发送钮/录音按钮/附件条/表情面板与表情格断言≤1px；[browser-measurements.json](r11/browser-measurements.json)、[final-tests.log](r11/final-tests.log)。未覆盖12态每个关键元素；真实种子内容与设计样本不同，不能声称全部气泡自然宽高相等。 |
| A3 样式 | 未通过 | 输入底色/圆角、表情格底色与尺寸有计算样式断言，真实韩文与小屏截图已生成；未逐元素验证全部字体、颜色、圆角、间距，表情顺序和录音时间格式仍有差距。 |
| A4 并排对照 | 未通过 / 待 R01/R04 | **并排图未生成，差异比例未生成**；没有把原型渲染图冒充Figma。 |
| A5 架构 | 未通过 | [architecture.log](r11/architecture.log)：pages、components、base的hex/important/device前缀均0，旧文件R11主选择器0；新主样式已压平到页面根类加元素类。但ChatFlow未重做的R12/举报scoped样式仍有20个hex、不可改script有10个hex，非R11旧规则仍有!important，因此不满足严格全组件扫描。 |
| A6 测试 | 未通过 | 核心原有6项+新增R11的1项通过；扩展回归D3/举报附件5项通过，F07 2项通过，D11 3项通过/1项失败，D2 2项失败。D2在df4526b副本上同样2项失败；D11失败等待基线模板已无的`.inbox-veil`。见下方日志，不把基线/旧用例失败隐去。 |
| A7 实现截图 | 通过 | 12/12态375×812 PNG均在[r11/](r11/)，另有真实韩文375×812和小屏375×700；[screenshots.json](r11/screenshots.json)记录尺寸与SHA256。 |
| A8 诚实记录 | 通过 | 完整差距表、原始JSON、失败尝试、最终测试、构建及脚本/架构证据均保存；没有伪造状态截图、Figma图片或差异比例；本报告不判定整模块验收通过。 |

测试证据按最终适用配置分别记录，不重复累加失败尝试：

- 核心：`npx playwright test tests/chat.spec.ts tests/chat-media.spec.ts tests/chat-voice.spec.ts tests/r11-chat.spec.ts --workers=1`，[final-tests.log](r11/final-tests.log)。
- D3/举报附件：首次扩展执行[related-tests.log](r11/related-tests.log)中5项通过；同次D11/F07误用通用配置，连接3180/3172失败，后用各自专用配置重跑。
- F07：`--config=tests/f07.config.ts`，[f07-tests.log](r11/f07-tests.log)，2通过。
- D11：`--config=tests/d11.config.ts`，[d11-tests.log](r11/d11-tests.log)，3通过1失败；失败在聊天收取进入R10付费确认后调用`settled('.inbox-veil')`，当前及基线均无该旧class；[d11-baseline-selector.log](r11/d11-baseline-selector.log)仅是基线静态核对，不冒称在基线跑过D11。
- D2：[related-tests.log](r11/related-tests.log)中2失败；在`/tmp/r11-baseline`从df4526b导出副本、使用同一依赖、独立5175端口再次运行，仍2失败，[baseline-d2-tests.log](r11/baseline-d2-tests.log)。失败是重复登录后外观偏好被既有账户切换逻辑清除；本轮按要求未改该逻辑。

结论：**A1/A7/A8通过，A2/A3/A4/A5/A6未通过；不是全项验收通过。**

## 渐变 token

本轮共用按钮基础规则涉及当前已有 `--grad-primary`、`--grad-icon-btn`；聊天发送/录音 variants 的最终底色为 JSON 的 solid。未发明渐变 token，未引用待改名的 `--grad-*-height-*`。R02 修订合入时复核这两个共用基础 token。

## 已知限制

A4 参考图导出与并排差异比例未生成，待 R01/R04；仓库旧 reference 图是原型图，没有用作 Figma 对照。保留1x素材，等待 Smith 按原路径提供3x图。

严格的全模块 A2/A3 仍未完成：自动化当前仅验证部分关键元素；真实种子消息与设计样本文字不同；表情语义顺序、录音实际时长格式、底部提示文字位置仍需复核。不会把局部断言通过写成全部关键元素通过。

严格 A5 也尚未满足：新主样式和共用样式无 hex/`!important`/`.device ` 前缀，但 `ChatFlow.vue` 未重做的 R12/举报 scoped 样式仍有 hex，旧 `chat.css` 的非 R11 设置/外观规则仍有 hex 与 `!important`；不可改的 script 中也有外观默认颜色字面量。没有为了 grep 清零去改其他模块规则或业务脚本。旧文件的主界面选择器扫描为0，保留R07主题背景及R12设置规则。

环境记录：首次原有测试启动因 `/tmp/tsx-0/33.pipe` 的 `listen EPERM` 失败，见 [existing-tests.log](r11/existing-tests.log)。后续经沙箱外执行成功启动隔离数据库/服务。首次回归中的两项表情遮挡失败已定位；热更新期间的60秒录音失败不作为最终结果。重跑日志保留。临时复用服务时也曾端口冲突、等待不存在输入框，均保留日志，不将失败尝试算作通过。
