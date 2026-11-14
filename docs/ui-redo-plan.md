# MauGo 前端 UI 整体重做计划（任务 #129）

- 制定：Claude（指挥/验收）　执行：Codex　总负责：Muse　决策：Smith
- 基线：分支 `claude/task-129`（基于 main `681db03`），2026-11-14
- 本文只是计划，未改任何客户端实现代码。

## 0. 摘要

1. 当前客户端的样式是三层叠出来的：早期各模块样式 → `fidelity.css` 用 `.device` 前缀整体覆盖 → 组件内 scoped 样式。全仓 359 种颜色写法、23 种字号、40 处 `!important`，没有统一 token。这是“改一处、别处又不一致”的根因，所以重做必须先立 token 和 CSS 架构，再逐页重写样式。
2. Figma 的 189 个状态画框与 `page-states.json` 的 189 个状态 **一一对应**（已用脚本核对，0 缺失），每个任务都能给出确切的 Figma 节点号。
3. 素材问题不是简单的“都是 1x”：`asset-manifest.json` 里的 “1x” 指 Figma 素材看板按原尺寸导出，实际像素密度各不相同（见 §4.1）。帽子按 Figma 显示尺寸算已有 3.37 倍，鸟的飞行序列只有 2.02 倍，粒子层 2.0 倍，鸟的静态图在外观页大图处只有 1.33 倍。重导前要先确认 Figma 里位图原图的真实分辨率，否则 3 倍导出只是放大。
4. 共拆 **25 个实现任务**（R01–R25）。第一批 6 个：R01 Figma 参考图导出、R02 设计 token、R03 素材重导、R04 对照工具、R05 共用外壳、R06 Discover 三个状态。
5. 有 8 项需要 Smith/Muse 决定或提供（§9），其中 **Figma token** 和 **首页 Diamonds / Filter Pass 入口行去留** 会卡住第一批。

## 1. 依据与数据源

| 来源 | 位置 | 用途 |
| --- | --- | --- |
| Figma 全量节点树 | Mac `~/maugo-figma/maugo-file-full.json`（29MB，版本 `2421258509127695554`，2026-11-13 拉取） | 所有精确值的唯一依据 |
| Figma 摘要 | Mac `~/maugo-figma/FIGMA.md` | 色板/字体/圆角频次 |
| 状态目录 | `client/docs/design-reference/page-states.json` | 16 模块 / 189 状态及进入每个状态的操作 |
| 离线原型 | Mac `~/maugo-design/MauGo-手机壳交互版-离线.html` | **动效**依据（Figma 是静态稿，不含动画） |
| 原型渲染图 | `client/docs/fidelity-refactor/reference/*.png`（192 张） | 仅作观感参考，不作验收依据 |

本任务没有重新调用 Figma API（仓库和环境变量里都没有 token）。以下三件事 **必须** 调 API，放在 R01/R03 里，需要 Muse 在 runner 环境提供 `FIGMA_TOKEN`：

- 导出 189 个状态画框的 PNG 作为验收对照图（`GET /v1/images/:key?ids=…&scale=2`）。
- 取位图填充的原图（`GET /v1/files/:key/images`），确认原图分辨率。
- 按节点 3 倍导出插画。

Figma 文件里 **不属于** 189 状态的画框，本计划不纳入：`语音通话页`（119:2219，对应未开始的 D10）、`启动页`（149:13321）、`2.0`（149:13331，Quick Login 页，用了 Poppins 字体，与其余设计体系不同）、24 个 1206×2622 画框（商店宣传图）、`Development assets · PNG 1x`（素材看板）。另有 6 个同名重复画框（`home-response`、`letter-open`、`chat-photo`、`chat-stickers`、`person-followed`、`wallpaper-preview` 的 `127:*` 版本）；已比对 `home-response` 两版只有 0.01px 差异，统一以首次出现的版本（§7 列出的节点号）为准。

## 2. 差距清单

### 2.1 系统性差距（所有页面共有）

| # | 差距 | 现状（代码） | Figma |
| --- | --- | --- | --- |
| S1 | 无 token | `styles.css` 的 `:root` 只有 4 个颜色变量；全仓 359 种 hex 写法，其中 157 种基色在 Figma 里不存在 | 189 状态共 314 种基色，高频的不到 40 种 |
| S2 | 样式分层混乱 | `styles.css` + `fidelity.css`（259 行 `.device …` 覆盖）+ `home/inbox/letters/chat.css` + 9 个组件内的样式块；40 处 `!important` | — |
| S3 | 主文字色 | `--white:#f3f4f4` | 正文主色 `#E4EFD9`（780 处文本） |
| S4 | 按钮字体 | 主按钮 14px / 500 | `Fredoka 600 16/22`（154 处） |
| S5 | 图标按钮底色 | `#ffffff0d` 纯色 | 横向渐变 `#1B2121 → #131818`，44×44，圆角 22（274 处） |
| S6 | 底部导航 | 渐变半透明底 + 顶部圆角 24 + 描边（`fidelity.css`）；Inbox 页又单独覆盖成 `#0d1713` | 纯色 `#0D1812`，高 96，无圆角无描边；三个图标 42×42，x=52.25 / 166.5 / 280.75，y 距导航顶 25.5；未读点 5×5 `#B5FA70` |
| S7 | 页面底色 | 多处 `#080e0e` / `#090e0e` / `#0c1612eb` 混用 | 场景页 `#090E0E` + 径向 `#102017@40%`；普通页 `#0D1713`（145 个画框）；登录页 `#081017` + 背景图 + 遮罩 `#0C1612@92%` |
| S8 | 字号体系 | 23 种字号，含 Figma 没有的 25/26/28/30/32/48/56 等（需逐页核对后清理） | 见 §3.2 |
| S9 | 位图密度不足 | 见 §4.1 | 3 倍屏需要 ≥3× 显示尺寸 |

各模块“Figma 用到但客户端 CSS 完全没有的颜色”统计（脚本比对，含图标矢量色，仅用于判断差距大小）：

| 模块 | 状态数 | Figma 基色数 | 客户端缺失 | 缺失色占使用次数 |
| --- | --- | --- | --- | --- |
| 01 登录与欢迎 | 19 | 37 | 6 | 13% |
| 02 首页与筛选 | 9 | 47 | 30 | 45% |
| 03 阅读与写信 | 10 | 54 | 28 | 41% |
| 04 消息与回信 | 17 | 48 | 10 | 17% |
| 05 收取额度与付费 | 6 | 52 | 14 | 16% |
| 06 对话与聊天工具 | 20 | 67 | 36 | 46% |
| 07 聊天背景与气泡 | 6 | 40 | 10 | 23% |
| 08 举报、屏蔽与恢复 | 9 | 62 | 26 | 27% |
| 09 用户资料 | 6 | 26 | 18 | 57% |
| 10 我的资料与头像 | 18 | 72 | 34 | 42% |
| 11 形象照 | 6 | 51 | 25 | 38% |
| 12 动态 | 12 | 46 | 24 | 50% |
| 13 设置与偏好 | 11 | 26 | 7 | 16% |
| 14 账号、安全与退出 | 13 | 50 | 20 | 20% |
| 15 帮助、反馈与说明 | 14 | 39 | 24 | 44% |
| 16 钻石与 Filter Pass | 13 | 61 | 36 | 41% |

> 说明：本任务只对 Discover 做了逐元素对照（§2.2）。其余 15 个模块只做了上表的量化比对和抽样（设置主页、登录页、筛选弹层），**没有逐状态逐元素列差距**；每个模块任务的第一步就是按节点号量出本模块的逐元素清单（§6 步骤 1），由 Claude 验收时复核。

### 2.2 Discover（home-ready `35:3533`）逐项差距

坐标均为 375×812 画框内的 x/y/宽/高。“现状”取自 `home.css` + `fidelity.css` 当前生效值及 `docs/fidelity-refactor/fix-119/after/home.png`。

| # | 元素 | Figma | 现状 | 
| --- | --- | --- | --- |
| H1 | 画框底 | `#090E0E` 上叠径向渐变 `#102017@40% → 透明`（圆心 50%/50%，半径到边） | `#090e0e` 纯色，无径向层 |
| H2 | 大光晕 | 69,354 240×271，径向 `#98FA48@12% → #68A734@4%(50%) → 透明` | 64,369 248×242，单层 `#80da35@11%` |
| H3 | 帽底光 | 75,536 234×52 圆角 26，径向 `#ADF959@44% → #75B140@18%(50%) → 透明` | **没有** |
| H4 | 帽口亮斑 | 147,454 85×21 圆角 10.5，`#D3FF80`，不透明度 40% | **没有** |
| H5 | 雾 | 70,319 242×244，不透明度 40% | 75,390 225×210，不透明度 22% |
| H6 | 粒子层 | 整屏位图 `10-effects/home-particles`（0,0 375×812） | **未使用**该素材 |
| H7 | 鸟 1/2/3 | 51.8,296.8 92.4²；142.6,182.6 118.8²；231.5,296.5 95.04²；各显示雪碧图第 1 帧 | 40,294 92²；145,183 100²；222,294 92²；另叠加 `hover-bird` 位移 12px + 旋转 3° |
| H8 | 星光 | 三个 `✦`，色 `#E5FFB3`：96,409（19px）、246,379（19px）、241,441（9px） | 一串文本 `✦ · ✧ · ✦`，色 `#d5ffad`，带字距 |
| H9 | 轨迹线 | 静止态三条轨迹 **不透明度 0**（线 `#D6FF9C` 0.85px + 光 `#AAFF68` 5px 模糊 6） | 常显，`#b5fa70` 0.7px，不透明度 65% |
| H10 | 帽子 | 99,435 178×143 | 位置尺寸一致；多了 `drop-shadow(0 8px 7px #0006)`（来自原型，Figma 节点无阴影）和 4s 摇摆 |
| H11 | 提示语 | 20,608 335×16，`Fredoka 400 11/16`，字距 0.4，`#849284`，整体不透明度 80% | 字号行高颜色一致，缺字距 0.4 和 80% 不透明度 |
| H12 | Refresh | 24,644 **150×48**，圆角 **30**，横向渐变 `#1C2223 → #171D1E`，内边距 0 12，图标 24 与文字间距 10，文字 `Fredoka 600 16/22 #E4EFD9`，图标描边 `#E4EFD9` 1.75 | 宽度按 46% 弹性，圆角 24，底 `#ffffff12`，字 14px `#f3f4f4`，间距 8；**图标和文字换行成上下两行**（截图可见） |
| H13 | Send a letter | 186,644 **165×48**，圆角 30，横向渐变 `#BDFF81 → #B0FB61`，文字 `Fredoka 600 16/22 #0A1406`，间距 10 | 圆角 24，字 14px/500，渐变角度 110° |
| H14 | 两按钮间距 | 12 | 12 ✔ |
| H15 | Diamonds / Filter Pass 行 | **Figma 没有这一行** | 在按钮下方多出一行 9px 文字入口 |
| H16 | 页头 | 字标 24,63.2 144×37.59；两个图标按钮 251,60 与 307,60，各 44×44 圆角 22，横向渐变 `#1B2121 → #131818`，图标 25×25 | 位置尺寸一致；按钮底色是 `#ffffff0d` |
| H17 | 底部导航 | 见 S6 | 见 S6 |
| H18 | 状态栏/底部横条 | 状态栏区高 57.83；横条 144×5 位于 y=799 | 状态栏图高 60；横条 bottom 8（y=799）✔ |
| H19 | home-empty `35:3647` | 无鸟；提示语 “No letters yet. Try a wider search.”；y=156 处有筛选摘要 `Fredoka 400 10/12.1` 字距 0.3 `#A9B5A5`；Refresh 文案更长（文字区 77 宽） | 文案是 “No letters match just yet. Try another little wish.”；无筛选摘要 |
| H20 | home-response `35:3757` | 回应条 24,120，每个胶囊 157.7×28，圆角 18，底 `#202827@50%`，间距 9 | 胶囊底 `#b5fa7018`，圆角 20，内边距 10，两行文字 |

Smith 指出的四点对应：插画发虚 → §4；绿光太弱 → H2–H6；Refresh 不一致 → H12；鸟的姿态 → H7（详见 §9 第 4 项）。

## 3. 设计 token（Figma 精确值）

统计范围：189 个状态画框，不含状态栏、底部横条和原型热区。下列值都是直接从节点读出的；“用途”一列写了 **已核对** 的才是确认过节点的，其余标 “待 R02 核对”。R02 要用脚本从 JSON 生成完整表，不允许手抄估值。

### 3.1 颜色

| token | 值 | 用途（已核对的节点） |
| --- | --- | --- |
| `--bg-page` | `#0D1713` | 普通页面底（145 个画框）、页头底 |
| `--bg-scene` | `#090E0E` | 首页/读信/写信场景底（24 个画框） |
| `--bg-scene-glow` | 径向 `#102017@40% → #000@0` | 场景底叠加层 |
| `--bg-auth` | `#081017` | 登录系列底（20 个画框），上叠背景图 |
| `--bg-auth-overlay` | `#0C1612@92%` | 登录表单遮罩 |
| `--bg-nav` | `#0D1812` | 底部导航 |
| `--bg-card` | `#1B2A20` | 设置分组卡片等容器（描边 `#FFFFFF@1%`，圆角 16） |
| `--bg-sheet` | `#18211E` | 底部弹层（筛选、外观） |
| `--bg-input` | `#202F24` | 输入框、下拉（327×48） |
| `--bg-tile` | `#222D25` | 钻石包、选项方块 |
| `--bg-chip` | `#23362A` | 28 高的小胶囊按钮 |
| `--bg-media-btn` | `#24312A` | 48×48 图片按钮 |
| `--switch-off-track` / `--switch-off-thumb` | `#35483B` / `#AFBEB3` | 开关关闭态（38×22，圆点 16） |
| `--scrim` | `#000000@46.7%` | 弹层遮罩 |
| `--scrim-dialog` | `#030805@79%` | 确认对话框遮罩 |
| `--grabber` | `#FFFFFF@15.7%` | 弹层顶部拖拽条 36×4 |
| `--text-primary` | `#E4EFD9` | 主文字（780 处） |
| `--text-on-accent` | `#0A1406` | 主按钮上的文字（98 处） |
| `--text-label` | `#BACDB2` | 表单标签 |
| `--text-hint` | `#849284` | 首页提示语 |
| `--text-note` | `#728571` | 说明段落 |
| `--text-time` | `#8CA094` | 列表右侧小字（12 高） |
| `--text-chevron` | `#7C927C` | 列表右箭头 `›` |
| `--text-danger` | `#D9A48E`（Sign out）、`#CF9E8E`（Delete account） | 危险操作文字 |
| `--text-diamond` | `#E6D0EF` | 钻石价格/数量 |
| `--accent` | `#B5FA70` | 强调色、未读点、选中描边 |
| `--sparkle` | `#E5FFB3` | `✦` 星光 |
| `--icon-muted` | `#849288` | 未选中导航图标描边等 |
| `--icon-ink` | `#080D0A` | 图标内深色描边 |
| `--grad-primary` | 横向 `#BDFF81 → #B0FB61` | 主按钮（98 处） |
| `--grad-icon-btn` | 横向 `#1B2121 → #131818` | 44×44 图标按钮（274 处） |
| `--grad-secondary` | 横向 `#1C2223 → #171D1E` | 次按钮（Refresh，18 处） |
| `--grad-card` | `#253229 → #17221C` | 待 R02 核对用途（19 处） |
| `--hairline` | `#FFFFFF@2.7%`（206 处）、`#FFFFFF@4.3%`（130 处） | 1px 描边，待 R02 核对两者的使用场合 |
| `--stroke-accent` | `#B5FA70` 1px；`#B5FA70@23%` 1px | 选中/强调描边 |

其余文字色（`#86978C`、`#788F80`、`#F1F4ED`、`#93AA8A`、`#B6C6A5`、`#C1DBB0`、`#B8CCB0`、`#91A48A`、`#9EB994`、`#AFC2A5` 等，每种 30–60 处）用途未逐一核对，R02 生成时按节点归类命名；归不了类的不合并、不取近似，原值保留并在 token 文件里注明所在节点。

### 3.2 字体

全部状态只用 `Fredoka`（仅设置的语言页有 8 处 `Gowun Dodum`，用户资料有 6 处 `Arial`——后者疑为导入遗留，见 §9）。字重出现 400 / 500 / 550 / 600 / 700。

| token | 字重 字号/行高 字距 | 次数 | 已核对用途 |
| --- | --- | --- | --- |
| `--font-button` | 600 16/22 | 154 | 主/次按钮文字 |
| `--font-h1` | 500 24/32 −0.3 | 18 | 登录页标题 |
| `--font-title-page` | 550 17/24 −0.3（另有 500 17/24 −0.3） | 58 / 31 | 待 R02 核对（疑为页头标题） |
| `--font-title-sheet` | 550 18/21.78、550 18/24 −0.3 | 60 / 21 | 待 R02 核对 |
| `--font-title-card` | 550 15/21 | 54 | 待 R02 核对 |
| `--font-body` | 400 13/20 | 284 | 列表行文字（设置行 20 高） |
| `--font-body-sm` | 400 12/20、12/18、12/21 | 121 / 80 / 79 | 说明文字（登录副标题为 12/21） |
| `--font-caption` | 400 11/13.31、11/20、11/21、11/18 | 179 / 42 / 42 / 28 | 待 R02 核对 |
| `--font-hint` | 400 11/16 字距 0.4 | 15 | 首页提示语 |
| `--font-micro` | 400 10/12.1、10/17、10/13、10/16 | 181 / 73 / 40 / 31 | 待 R02 核对 |
| `--font-tiny` | 400 9/10.89、9/16 | 300 / 22 | 9/16 为登录页底注；9/10.89 大量来自 `✦` 小星，待核对 |
| 符号字 | 400 19/22.99、400 24/29.04 | 274 / 233 | `✦`（19）与 `‹ ›`（24）等字符图形，不是正文字号 |

规则：字号、行高、字距三者一起成组使用，不单独取字号。行高为 `x.xx` 的（如 13.31、12.1、21.78）是 Figma 的自动行高（字号 × 1.21），CSS 里写 `line-height:1.21`。

### 3.3 间距、尺寸、圆角、阴影

- **页面边距**：24（内容区 327 宽）；页头返回按钮 x=16；登录页顶栏按钮 x=20。
- **自动布局间距出现值**：12（416）、8（195）、10（169）、6（163）、16（69）、5（66）、14（54）、7（54）、4（48）、20（37）、3（26）。
- **内边距出现值**：6、12、1、16、24、4、8、20、10、28、14、2、32、40。
- token 取 `--space-2/3/4/5/6/7/8/10/12/14/16/20/24/28/32/40`，名字即数值，不做 4 的倍数归一（Figma 里 5、7、10、14 都是真实值）。
- **控件高度**：按钮/输入 48（232 处）；图标按钮 44；页头 64（y=48 起）；列表行 56；底部导航 96；胶囊 28 / 36；状态栏区 57.83；内容区从 y=48 起高 764。
- **圆角**：12（340）、22（310）、24（248）、16（201）、20（168）、14（115）、4（110）、11（77）、3（74）、18（42）、8（36）、30（32）、13、44、26、10、28、10.5。已核对：主按钮在登录页为 24、在首页操作区为 30；图标按钮 22；卡片 16；回应胶囊 18。
- **阴影/模糊**（共 21 种，高频如下）：

| token | 值 | 次数 | 用途 |
| --- | --- | --- | --- |
| `--shadow-sheet` | `0 -50px 100px #000000@53%` | 21 | 底部弹层 |
| `--shadow-dialog` | `0 28px 80px #000000@60%` | 10 | 待 R02 核对（疑为确认框） |
| `--shadow-glow` | `0 0 20px #B5FA70@4.3%` | 39 | 待 R02 核对 |
| `--shadow-sm` | `0 2px 4px #000000@20%` | 19 | 待 R02 核对 |
| `--shadow-md` | `0 3px 12px #000000@9.4%` | 15 | 待 R02 核对 |
| `--ring-page` | `0 0 0 10px #0D1713` | 8 | 待 R02 核对 |
| `--blur-trail` | 图层模糊 6 | 72 | 鸟的轨迹光 |
| `--blur-backdrop` | 背景模糊 16 | 10 | 待 R02 核对 |

## 4. 素材策略

### 4.1 现状：真实像素密度（文件像素 ÷ Figma 里的最大显示尺寸）

| 素材 | 文件像素 | Figma 最大显示 | 密度 | 结论 |
| --- | --- | --- | --- | --- |
| 图标 08/09/11/12 共 114 个 | 3× | — | 3.0 | 已达标（`681db03`） |
| `01/hat` | 600×480 | 178×143 | 3.37 | 像素够；若仍发虚说明原图本身软，见下 |
| `01/maugo-wordmark` | 720×188 | 190×49.6（about 页） | 3.79 | 达标 |
| `01/mist` | 640×640 | 242×244 | 2.64 | 不足 |
| `10/home-particles` | 750×1624 | 375×812 | 2.0 | 不足 |
| `03` 飞行雪碧图 18 张 | 1440×240 | 712.8×118.8 | 2.02 | 不足（需 ≥2139×357） |
| `07` 飞行单帧 108 张 | 240×240 | 118.8 | 2.02 | 不足（先确认客户端是否还在用，不用则不导） |
| `02` 鸟静态 18 张 | 240×240 | 180×180（外观页大图） | 1.33 | 不足 |
| `01/auth-background` | 852×1845 | 375×812 | 2.27 | 不足 |
| `04` 聊天背景 8 张 | 750–1000 宽 | 375×812 | 2.0–2.67 | 不足 |
| `05` 头像样例 17 张 | 320×320 | 309–320 | ≈1.0 | 不足（仅样例图，优先级低） |
| `06` 表情 50 张 | 512 | 44（选择器） | >10 | 达标（聊天气泡内显示尺寸待 R03 量） |
| `01/envelope`、`diamond`、`glow`、`envelope-avatar*` | 98×71 / 240×202 / 640² / 1254² | 待 R03 量 | — | 待 R03 量 |

两个关键事实：

- 状态画框里的位图用的 `imageRef` 与素材看板里的 **不是同一批**（例如首页帽子是 `4d2c7e4b…`，看板里的 `hat` 是 `2830f46e…`）。看板素材可能是二次导出品。
- JSON 里没有位图原图的分辨率。所以“3 倍导出”能不能真的变清楚，取决于原图够不够大——这一点 **现在不知道**，必须在 R03 第一步查清。

### 4.2 规则

1. **达标线**：每张位图的文件像素 ≥ 3 × 它在 Figma 状态画框里的最大显示尺寸（宽高都要）。
2. **导出源**：优先导出状态画框里实际使用的节点（如帽子导 `35:3562`），不是看板里的副本；用 `GET /v1/images/:key?ids=<节点>&scale=3&format=png`。
3. **先查原图**：导出前用 `GET /v1/files/:key/images` 取每个 `imageRef` 的原图，记录原图宽高。原图 < 3× 显示尺寸的，3 倍导出只是插值放大——**不算达标**，列入“需设计师补高清源图”清单交 Smith，不自行放大或用 AI 放大。
4. **路径和名字不变**：仍是 `client/src/assets/<分类>/<名字>.png`，共 343 张，`asset(name)` 调用处不改。只更新 `asset-manifest.json` 里对应条目的 `w`/`h`/`sha256`/`scale`（沿用 `681db03` 的做法），`scripts/verify-assets.mjs` 继续通过。
5. **不加 srcset、不换格式**：所有屏幕共用一张 3 倍图，由 CSS 显式给出显示宽高（pt）。凡是靠图片固有尺寸撑开布局的地方，重导后会变大，必须在对应页面任务里补上宽高。
6. **雪碧图**：18 张飞行序列保持 6 帧横排、帧为正方形，重导后单帧 ≥357px；CSS 用 `background-size:600% 100%`，不写死像素位移。
7. **体积**：R03 报告重导前后 `src/assets` 总大小和 `vite build` 产物大小。若聊天背景 8 张使总包增加超过 15MB，停下来报给 Muse 决定，不自行压缩或换格式。
8. **图标**：114 个已是 3 倍，不重做；页面任务里若发现某图标与 Figma 矢量不一致，按节点单独重导。

## 5. CSS 架构

### 5.1 目标结构

```
client/src/styles/
  tokens.css        只有 :root 自定义属性（§3 全部 token），没有任何选择器规则
  base.css          字体声明、reset、.device 外壳、状态栏、底部横条、减少动态效果的全局处理
  components.css    跨页共用：主/次按钮、图标按钮、页头、底部导航、底部弹层、确认框、分组卡片与列表行、输入框、开关、胶囊、空状态
  pages/
    auth.css home.css letters.css inbox.css reply.css chat.css appearance.css safety.css
    person.css profile.css cards.css moments.css settings.css account.css support.css wallet.css
```

`main.ts` 按 `tokens → base → components` 顺序引入；每个 `pages/*.css` 由对应组件的 `<style src>` 引入（沿用现在 `HomeFlow.vue` 引 `home.css` 的方式）。

### 5.2 规则（每个任务都按此验收）

1. **颜色、渐变、阴影、圆角、字体组只能写 `var(--…)`**。`tokens.css` 以外的样式文件和 `.vue` 文件里不得出现 hex / rgb 字面量（检查：对 `src/styles/pages`、`components.css`、`base.css` 和已重做组件 grep `#[0-9a-fA-F]{3,8}`，结果为 0）。
2. **不用 `!important`，不用 `.device ` 前缀抬优先级**。选择器最多两级，以页面根类开头（如 `.home-flow .refresh`）。
3. **共用的东西只写一次**：按钮、页头、导航、弹层只在 `components.css` 定义，页面文件不得重写它们的外观，只能定位。
4. **位置按 Figma 画框坐标**：375×812 内的绝对定位元素（首页场景）直接用 Figma 的 x/y；流式内容用 Figma 的自动布局间距和内边距。
5. **迁移方式——整模块替换，不叠加**：某模块重做时，新样式写进 `styles/pages/<模块>.css`，同时 **删除** 该模块在旧文件（`styles.css`、`fidelity.css`、`home.css`/`inbox.css`/`letters.css`/`chat.css`、组件 scoped 块）里的全部旧规则。任务结束时该模块不得再有任何规则留在旧文件里。旧文件随模块推进逐步变空，R25 删除空文件。
6. **不动逻辑**：`<script setup>` 只在模板结构变化必须联动时才改；保留现有 `id`、`data-state`、`aria-label`（Playwright 用例依赖它们）；新文案同时补英、韩。
7. **韩文**：`[lang=ko]` 仍用 `GowunDodum` 优先。Figma 只有英文稿，韩文只验“不溢出、不换行错位”，不做像素对照。
8. **小屏**：现有 `@media(max-height:740px)` 的整体缩放（`scale(.85)`）是为可用性加的，Figma 没有对应稿。保留这一条媒体查询，但只允许调位置，不允许缩放插画；小屏不做 Figma 对照。

## 6. 通用执行步骤与验收标准

每个页面任务（R06–R24）都按同一流程，下文任务表不再重复。

**执行步骤**

1. **量**：用任务给出的节点号，从 `maugo-file-full.json` 读出本任务每个状态的逐元素数值（位置、尺寸、填充、描边、圆角、阴影、字体组、间距），与当前代码对照，列成差距表，写进本任务的验收文档。
2. **写**：按 §5 写样式；需要的 token 若 `tokens.css` 里没有，按 Figma 原值补进去（不得用近似的已有 token 顶替）。
3. **清**：删除该模块在旧文件里的旧规则。
4. **测**：补/改 Playwright 用例，跑通；截图。
5. **记**：只写一份验收文档 `client/docs/ui-redo/<任务号>-result.md`。

**验收标准（全部满足才算通过）**

| 编号 | 标准 | 怎么查 |
| --- | --- | --- |
| A1 构建 | `cd client && npm run build` 通过（含素材校验、`vue-tsc`、`vite build`） | 命令退出码 0 |
| A2 几何 | 任务列出的每个关键元素，实测位置和尺寸与 Figma 差 ≤1px | Playwright 用例里对 `boundingBox()` 断言 |
| A3 样式 | 这些元素的计算样式（颜色、背景、圆角、字号、字重、行高、字距、阴影）与 Figma **完全相等** | Playwright 用例里对 `getComputedStyle` 断言 |
| A4 截图对照 | 每个状态一张 375×812 的实现截图，与 R01 的 Figma 导出图并排放进验收文档；并用 R04 的工具给出像素差异比例 | 人工看并排图；差异比例须 ≤ R04 校准后写定的阈值 |
| A5 规则 | §5.2 的第 1、2、5 条 grep 检查为 0 | grep |
| A6 回归 | 本模块原有 Playwright 用例全部通过；`client.spec.ts` 通过 | 对应 config 跑一遍，贴通过数 |
| A7 状态覆盖 | 本任务的每个状态 ID 都能在页面上通过 `data-state` 或既有进入路径到达并截图 | 用例 |
| A8 如实 | 做不到或 Figma 与后端能力冲突的，标“未通过/待 Smith”，不伪造 | 验收文档 |

Claude 验收时独立复核：重新从 JSON 读数抽查 A2/A3 至少 5 个元素，逐张看 A4 并排图，重跑 A1/A5/A6。

## 7. 任务拆分

依赖关系：`R01 →（R02, R03, R04）→ R05 → R06 → R07…R24 → R25`。R02、R03、R04 互不依赖，可并行。R07–R24 都只依赖 R05（及所列的个别前置），各写各的 `pages/*.css`，但因为都要从共用旧文件里删规则，**建议按下表顺序串行**，每个任务基于上一个合入后的 main。

### 第一批：基础 + Discover

| 任务 | 内容 | 输入 | 输出 | 专项验收（通用标准之外） |
| --- | --- | --- | --- | --- |
| **R01** Figma 参考图与节点索引 | 导出 189 个状态画框 PNG；生成状态→节点索引 | `FIGMA_TOKEN`；文件 key `9ecnOjFdk2YjAJRG5TysNJ`；§7 各任务的节点号；`page-states.json` | `client/docs/design-reference/figma/<状态ID>.png`（scale=1 与 scale=2 各一套，1x 为 375×812）；`client/docs/design-reference/figma-nodes.json`（`{状态ID: 节点号}`，189 条）；记录导出时的 Figma 文件版本号 | 189 张齐全且尺寸正确；索引与本文节点号一致；若版本号已不是 `2421258509127695554`，同时更新 `~/maugo-figma` 数据并在结果里列出变化的画框 |
| **R02** 设计 token | 用脚本从 JSON 统计 189 状态，生成 token；补全 §3 里标“待 R02 核对”的用途 | `maugo-file-full.json`；§3 | `client/src/styles/tokens.css`；`main.ts` 引入；`styles.css` 里旧的 4 个颜色变量改为引用新 token（保证旧页面不变样） | 每个 token 在验收文档里附“值、出现次数、至少一个节点号”；§3 表里的值逐条对上；本任务后各页面截图与任务前无差异（token 只是引入，尚未使用） |
| **R03** 位图素材重导 | 按 §4.2 执行：查原图分辨率 → 量每张图最大显示尺寸 → 3 倍导出 → 更新 manifest | `FIGMA_TOKEN`；§4.1 表；`asset-manifest.json` | 更新后的 PNG 与 manifest；验收文档里一张完整表：343 张每张的“最大显示尺寸 / 原图像素 / 新文件像素 / 密度 / 是否达标”；“需设计师补源图”清单 | `npm run build`（含 `verify-assets`）通过；§4.1 标“不足”的每一项要么密度 ≥3、要么进补图清单；第一批必须完成的范围：`01` 全部、`02`、`03`、`10`。`04`/`05`/`07` 可在同一任务完成，体积超限按 §4.2 第 7 条上报 |
| **R04** 对照工具 | 一个 Playwright 配置 + 用例骨架：按状态 ID 进入页面、截 375×812 图、与 `design-reference/figma/<ID>.png` 比较并输出差异比例；生成并排图 | R01 产物；现有 `client/docs/fidelity-refactor/capture-client.spec.ts`（已有固定数据桩，可复用其思路） | `client/tests/ui-redo.config.ts`、`client/tests/ui-redo.spec.ts`；用 Playwright 自带的截图比较，**不加依赖** | 对当前未重做的 `home-ready` 跑出一个差异比例作为基线并记录；动态内容（昵称、头像照片）用与 Figma 稿相同的固定数据；状态栏时间等不可控区域用遮罩。**阈值在 R06 完成后由 Claude 根据实测写定**，此前 A4 只报数不卡关 |
| **R05** 共用外壳与组件 | `base.css` + `components.css`：外壳、状态栏区（57.83）、底部横条（144×5，y=799）、底部导航（S6）、主按钮、次按钮、44 图标按钮、页头（64 高，返回钮 40×40 圆角 20 于 x=16）、底部弹层容器（底 `#18211E`、阴影 `0 -50 100 #000@53%`、拖拽条 36×4）、遮罩两种 | R02；共享组件画框 `30:2`（导航 6 个变体 `43:1912/1945/1979/2012/2046/2079`）；`35:3533`（按钮、图标按钮）；`34:1917`（页头、卡片、列表行）；`36:1914`（弹层） | `client/src/styles/base.css`、`components.css`；`HomeFlow`/`InboxFlow`/`ProfileFlow` 的导航改用同一套类 | 导航在首页/消息/我的三处的计算样式完全相同；6 个变体（当前页 × 有无未读）都有断言；弹层圆角等本文未列出的值按节点读取并写进验收文档 |
| **R06** Discover | `home-ready` `35:3533`、`home-empty` `35:3647`、`home-response` `35:3757`；逐条消除 §2.2 的 H1–H20 | R02、R03、R05；§2.2；原型的动效关键帧（`twinkle`、`floor-breathe`、`mist-breathe`、`sprite-loop`） | `client/src/styles/pages/home.css`；`HomeFlow.vue` 模板相应调整；旧 `home.css` 及 `fidelity.css` 中首页场景/按钮/导航相关规则删除 | H1–H20 每条一个断言或并排图证据；Refresh 实测 150×48、圆角 30、图标与文字同一行；关闭动态效果时三只鸟显示第 1 帧且位置尺寸与 H7 一致；H15 和鸟的动效按 §9 的决定执行，决定未到之前按“建议默认”做并在结果里标明 |

### 后续批次

| 任务 | 模块 / 状态（节点号） | 主要改动文件 | 前置 | 专项说明 |
| --- | --- | --- | --- | --- |
| **R07** 筛选与信使外观（6） | `filters-free` 36:1914、`filters-active` 36:2086、`filters-selected` 36:2256、`bird-female` 36:2424、`bird-male` 36:2607、`bird-motion-off` 36:2790 | `HomeFlow.vue`、`pages/home.css` | R06 | 弹层 351 宽（左右各 12）；性别圆钮、滑杆（用 `12-control-states` 素材）、开关 38×22；外观页鸟大图 180×180 须用 R03 后的素材 |
| **R08** 阅读与写信（10） | `letter-open` 36:2976、`letter-typed` 36:3109、`letter-waiting` 36:3243、`letter-replied` 36:3375、`letter-safety` 36:3507、`letter-report` 36:3666、`compose-empty` 39:1939、`compose-draft` 39:2062、`compose-invalid` 39:2185、`compose-sent` 39:2308 | `LettersFlow.vue`、`pages/letters.css` | R06 | D11 的开信/寄信动画时序不变，只改静止态的几何与样式；`d11.spec.ts` 须全过 |
| **R09** 消息与回信（17） | `inbox-empty` 29:5602、`inbox-waiting` 29:5690、`inbox-pending` 29:5785、`inbox-collected-one` 29:5930、`inbox-collected-all` 29:6089、`inbox-unread` 29:6253、`inbox-read` 29:6373、`inbox-friends-empty` 29:6490、`inbox-friends` 29:6578、`inbox-drawer` 29:6686、`inbox-search` 29:6870、`inbox-search-empty` 29:6968、`inbox-options` 29:7059、`inbox-pinned` 29:7209、`inbox-hidden` 29:7330、`inbox-hidden-empty` 29:7416、`inbox-notifications-off` 29:7501 | `InboxFlow.vue`、`pages/inbox.css` | R05 | 菜单按钮三横线 21×2 `#E8F3DE`；`inbox.spec.ts`（真实 B11）须全过 |
| **R10** 收取额度与付费（6） | `reply-last-free` 29:7634、`reply-payment` 29:7779、`reply-shortage` 29:7955、`reply-cancelled` 29:8126、`reply-paid` 29:8271、`reply-topup` 29:8430 | `InboxFlow.vue`、`ReplyTopup.vue`、`pages/reply.css` | R09 | 只改样式；幂等键、402 重试等逻辑一行不动；`d1.spec.ts` 须全过 |
| **R11** 对话主界面（12） | `chat-waiting` 29:8643、`chat-receipt-waiting` 29:8737、`chat-open` 29:8830、`chat-draft` 29:8952、`chat-sent` 29:9074、`chat-photo` 29:9202、`chat-attachment` 29:9333、`chat-stickers` 29:9459、`chat-sticker-selected` 29:9689、`chat-recording` 29:9815、`chat-record-cancel` 29:9971、`chat-mic-denied` 29:10127 | `ChatFlow.vue`、`pages/chat.css` | R05 | 本模块缺失色最多之一（46%）；表情格 56×52、底 `#FFFFFF@1.6%` |
| **R12** 对话设置/搜索/清空（8） | `chat-details` 29:10251、`chat-details-waiting` 29:10389、`chat-remark` 29:10524、`chat-search-empty` 29:10678、`chat-search-result` 29:10758、`chat-search-none` 29:10845、`chat-clear-confirm` 29:10933、`chat-cleared` 29:11085 | `ChatFlow.vue`、`pages/chat.css` | R11 | 确认框遮罩 `#030805@79%` |
| **R13** 聊天背景与气泡（6） | `wallpapers` 29:11197、`wallpaper-preview` 29:11321、`wallpaper-applied` 29:11411、`wallpaper-colors` 29:11533、`chat-bubbles` 29:11650、`chat-bubbles-custom` 29:11754 | `ChatFlow.vue`、`pages/appearance.css` | R11、R03（`04` 背景图） | 缩略图 99×173.1；`d2.spec.ts` 须全过 |
| **R14** 举报、屏蔽与恢复（9） | `safety-choice` 29:11861、`report-empty` 29:12027、`report-filled` 29:12127、`report-saved` 29:12227、`block-confirm` 29:12322、`chat-blocked` 29:12474、`blocked-list` 29:12575、`blocked-empty` 29:12659、`unblock-confirm` 29:12744 | `ChatFlow.vue`、`LettersFlow.vue`、`pages/safety.css` | R08、R11 | `d3.spec.ts`、`report-attachment.spec.ts` 须全过 |
| **R15** 登录与欢迎（19） | `welcome` 35:2414、`terms-unchecked` 35:2470、`terms-checked` 35:2564、`signin-empty` 35:2658、`signin-filled` 35:2713、`signin-invalid` 35:2769、`signup-empty` 35:2827、`signup-filled` 35:2891、`signup-mismatch` 35:2957、`verify-empty` 35:3025、`verify-error` 35:3076、`verify-resend` 35:3130、`forgot-empty` 35:3183、`recovery-code` 35:3228、`new-password` 35:3279、`new-password-error` 35:3332、`apple-private` 35:3387、`apple-share` 35:3439、`auth-privacy` 35:3491 | `AuthFlow.vue`、`App.vue`、`pages/auth.css` | R05、R03（`auth-background`） | 差距最小的模块（13%），所以排在核心链路之后；字标 94×24.54；输入框 327×48；认证逻辑不动，`auth.spec.ts`、`f06.spec.ts` 须全过 |
| **R16** 用户资料（6） | `person-profile` 29:12899、`person-waiting` 29:13023、`person-followed` 29:13130、`person-no-content` 29:13254、`person-photo` 29:13363、`person-safety` 29:13500 | `ProfileFlow.vue`、`pages/person.css` | R05 | 缺失色占比最高（57%）；6 处 `Arial` 文本按 §9 第 6 项处理 |
| **R17** 我的资料与列表（12） | `profile-empty` 29:13655、`profile-content` 29:13813、`profile-edit` 29:13977、`profile-invalid` 29:14080、`profile-likes` 29:15456、`following-empty` 29:15641、`following-list` 29:15731、`followers-empty` 29:15827、`visitors-empty` 29:15917、`visitors-outgoing` 29:16009、`my-letters-empty` 29:16105、`my-letters` 29:16190 | `ProfileFlow.vue`、`pages/profile.css` | R05 | 空状态插画 112×112；`d4.spec.ts`、`d4-reverify.spec.ts` 须全过 |
| **R18** 头像（6） | `avatar-gallery` 29:14185、`avatar-remove` 29:14411、`avatar-removed` 29:14651、`avatar-restore` 29:14880、`avatar-full` 29:15057、`avatar-crop` 29:15279 | `ProfileFlow.vue`、`Avatar.vue`、`pages/profile.css` | R17 | 槽位 88×88、缩略 64.8×64.8、大图 309×309 |
| **R19** 形象照（6） | `card-type` 11:7、`card-options` 11:187、`card-preview` 11:385、`card-change-type` 11:562、`card-visibility` 11:748、`card-remove` 11:933 | `MomentsFlow.vue`、`pages/cards.css` | R17 | 大图 327×480；`d5.spec.ts` 须全过 |
| **R20** 动态（12） | `moments-empty` 29:16277、`moments-list` 29:16376、`moments-category-empty` 29:16484、`moment-empty` 29:16583、`moment-draft` 29:16708、`moment-photo` 29:16833、`moment-stickers` 29:16963、`moment-visibility` 29:17196、`moment-leave` 29:17342、`moment-options` 29:17484、`moment-delete` 29:17614、`moment-saved` 29:17758 | `MomentsFlow.vue`、`pages/moments.css` | R19 | 表情选择器与 R11 共用 `components.css` 里的同一套 |
| **R21** 设置与偏好（11） | `settings-home` 34:1917、`language-en` 34:2053、`language-ko` 34:2093、`privacy` 35:1914、`privacy-visibility` 35:1972、`privacy-only-me` 35:2047、`notifications-on` 35:2105、`notifications-off` 35:2161、`general` 35:2217、`general-font` 35:2300、`cache-confirm` 35:2349 | `SettingsFlow.vue`、`pages/settings.css` | R05 | 分组卡片 327 宽、圆角 16、底 `#1B2A20`、描边 `#FFFFFF@1%`；行 293×56，图标 22，箭头 16×24；Sign out `400 13/15.73 #D9A48E`；`d6*.spec.ts` 须全过 |
| **R22** 账号、安全与退出（13） | `security` 39:2444、`account-info` 39:2510、`verification` 39:2578、`pin-create` 39:2620、`pin-invalid` 39:2701、`pin-locked` 39:2784、`pin-wrong` 39:2862、`signout-confirm` 39:2942、`signed-out` 39:3091、`delete-disabled` 39:3147、`delete-typed` 39:3201、`delete-ready` 39:3256、`delete-final` 39:3311 | `AccountSecurity.vue`、`pages/account.css` | R21 | 注销、退出逻辑不动；`d7.spec.ts`、`f07.spec.ts` 须全过 |
| **R23** 帮助、反馈与说明（14） | `help` 29:17869、`faq` 29:18013、`faq-expanded` 29:18140、`feedback-empty` 29:18267、`feedback-filled` 29:18371、`feedback-invalid` 29:18475、`feedback-history` 29:18582、`about` 29:18692、`guidelines` 29:18805、`safety-guide` 29:18896、`privacy-policy` 29:18987、`terms-full` 29:19082、`system-empty` 29:19207、`interactions-empty` 29:19292 | `SettingsFlow.vue`、`pages/support.css` | R21 | 法律文本仍是 `[..._PENDING_SMITH]` 占位，只对照版式不对照文字；`d8.spec.ts`、`ko-help.spec.ts` 须全过 |
| **R24** 钻石与 Filter Pass（13） | `wallet-empty` 39:3382、`wallet-balance` 39:3563、`topup-confirm` 41:1914、`topup-success` 41:2115、`pass-default` 41:2298、`pass-one-day` 41:2400、`pass-month` 41:2502、`pass-shortage` 41:2604、`pass-confirm` 41:2742、`pass-active` 41:2879、`pass-extend` 41:2983、`pass-success` 41:3122、`pass-sheet` 41:3228 | `ReplyTopup.vue`、`HomeFlow.vue`、`pages/wallet.css` | R07、R10 | 钻石包 148×158、底 `#222D25`、价格色 `#E6D0EF`；**支付相关逻辑一行不动**（StoreKit、`appAccountToken`、幂等键）；`d9.spec.ts`、`d9-storekit.spec.ts`、`pass-confirmation.spec.ts` 须全过；`topup-confirm`/`topup-success` 若仍因沙盒未配置无法到达，如实标注 |
| **R25** 收尾 | 删除已空的 `fidelity.css`、`home.css`、`inbox.css`、`letters.css`、`chat.css` 和 `styles.css` 里的页面规则；全仓 `!important` 清零；跑全部 Playwright 配置；韩文与小屏（高度 667）逐模块走查 | R06–R24 全部合入 | 一份总验收文档：189 状态并排图总表、每个 config 的通过数、全仓 grep 结果 | `src` 下除 `styles/tokens.css` 外无 hex 字面量；无 `!important`；旧样式文件不存在；189/189 状态有并排图 |

任务数：**25**（基础 5 + 页面 19 + 收尾 1），覆盖 189/189 状态（3+6+10+17+6+12+8+6+9+19+6+12+6+6+12+11+13+14+13）。

## 8. 第一批为什么是 R01–R06

1. **Discover 是 Smith 刚点名的页面**，也是用户登录后看到的第一屏，四个问题（发虚、绿光弱、Refresh、鸟）都在这一页。
2. **这四个问题恰好分属三类根因**：素材密度（R03）、缺 token 导致颜色/渐变靠近似（R02）、共用控件各页各写（R05）。只改 Discover 一页而不立这三样，后面 18 个页面任务会各自再发明一遍，重蹈 `fidelity.css` 的覆辙。
3. **R01 和 R04 是所有后续验收的前提**。没有 Figma 导出图就没有“截图对照”，现在仓库里的参考图是原型渲染的，不是 Figma。
4. **Discover 用到的共用件最多**（页头图标按钮、主/次按钮、底部导航、场景底、弹层），R06 做完等于把 R05 的组件在真实页面上验证了一遍，同时校准出像素差异阈值，供后面 18 个任务直接使用。
5. 第一批完成的可见结果：首页三个状态与 Figma 对齐、鸟和帽子在 3 倍屏清晰、全局有了唯一的 token 来源。之后每个模块任务都是“照同一套流程换一个模块”，可以稳定地一个个交给 Codex。

## 9. 需要 Smith / Muse 决定或提供

| # | 事项 | 影响 | 建议默认 |
| --- | --- | --- | --- |
| 1 | **Figma token**：runner 环境提供 `FIGMA_TOKEN`（只读即可） | 卡 R01、R03，进而卡全部验收 | Muse 提供；不进仓库 |
| 2 | **首页 Diamonds / Filter Pass 入口行**（H15）：Figma 首页没有这一行 | 卡 R06 | 按 Figma 去掉。前提是钻石入口在“我的”页（Figma `profile-empty` / `profile-content` 有 `My diamonds` 胶囊）、Pass 入口在筛选弹层仍可达；R06 里先确认这两个入口可用再删 |
| 3 | **位图原图不够大时怎么办**（R03 查出后才知道有哪些） | 决定“发虚”能否彻底解决 | 请设计师（TING）补 ≥3 倍的源图；补到之前先用现有最大尺寸，结果里标“未达标” |
| 4 | **鸟的动效以什么为准**：Figma 是静态稿，只能确定静止姿态（雪碧图第 1 帧）和位置尺寸。Smith 说“动画与设计稿姿态不一致”具体指哪一点，仓库和 Figma 里都查不到 | 影响 R06 | 静止态严格按 H7；动效按离线原型的 `sprite-loop` 原地循环 6 帧，去掉客户端自己加的上下浮动 12px + 旋转 3°。如果 Smith 指的是别的，请给一句话或一段录屏 |
| 5 | **Figma 里的鸟是紫色款，客户端默认是蓝色款**（`imageRef` 无法直接对应到 18 个款式名） | 影响对照截图和默认款 | R01 导出后由 Claude 确认是哪一款；对照截图时把偏好设为同款。是否改默认款请 Smith 定，未定则不改 |
| 6 | **帽子阴影**：客户端有 `drop-shadow(0 8px 7px #0006)`（来自原型），Figma 帽子节点没有阴影 | R06 | 以 Figma 为准，去掉 |
| 7 | **用户资料页 6 处 `Arial` 文本** | R16 | 视为导入遗留，按 Fredoka 实现；R16 量的时候列出具体节点请 Smith 确认 |
| 8 | **不在 189 状态内的画框**（`2.0` Quick Login、`启动页`、`语音通话页`）是否纳入 | 范围 | 本轮不做；`语音通话页` 归 D10 |

另外说明两点：

- 本任务要求“评论本 Issue 汇报摘要”：当前 Mac 上没有 `gh` 命令，评论未能发出，摘要见任务结果，请 runner 或 Muse 代为贴到 Issue。
- 本文所有数值来自 2026-11-13 拉取的 Figma 数据。设计稿若在此之后改过，以 R01 重新导出时的版本为准，并由 R01 列出变化。
