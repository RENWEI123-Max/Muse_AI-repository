# R13 背景与气泡补查结果

基线 `codex/r12-audit` / `9d48e3814ec8bdc8c9e6b136628d4e983bca3aaa`；分支 `codex/r13-audit`。在 Mac mini `/Users/anna/Muse_AI-repository` 执行。未合入 main，未开 Issue、未发 Telegram、未调用 Figma API 或 token。壁纸保留现有 1x 原图。

## 执行摘要与四项验收

**整体未通过/待 Smith。** 本轮仅删除 R13 原型没有的页面入场/横移效果；静态布局、颜色、图片、业务保存与登录会话逻辑不动。

| 项目 | 结果 | 本轮证据与限制 |
|---|---|---|
| 静态 | **未通过/待 Smith** | 本轮静态保留、构建、grep 检查通过；完整视觉仍有八处缺失渐变及应用按钮渐变待 R02。没有重做静态或伪造渐变。沿用 [R13 原静态证据](R13-result.md)，没有新增 Figma 导出/差异比例 |
| 流程 | **未通过/待 Smith** | API fixture 四组均走通预览返回/取消、壁纸应用、默认、色板即时选择及 Done、自定义四颜色、返回聊天、重开、重置、会话隔离。503 图片失败能返回，但没有专门错误提示/重试；服务端偏好保存、失败回滚及重登录无真实后端可验证，不能声称通过 |
| 效果 | **未通过/待 Smith** | 已移除无原型依据的 `.22s` 入场、`.18s` 横移；最终计算值 animation=none、transition=0s，与原型背景/气泡页相符。共用按下态保留。八处渐变、按钮渐变及壁纸聊天的部分透明/模糊视觉效果仍待处理 |
| 滑动与文案 | **通过（本轮范围）** | 375×667、375×812 × EN/KO，共 72 个截图采样 document 高=viewport、scrollY=0、宽375；列表/色板/预览/气泡内容按需在 `.d2-body` 滚动，聊天复用 `.c6-thread`。可见文案 scrollWidth 检查无溢出，并检查代表截图；未宣称其他尺寸/平台通过 |

- `VITE_API_BASE_URL=/api npm run build`：退出 0，[build.log](r13-audit/build.log)。只改生产文件 `client/src/styles/pages/appearance.css`；整文件 hex 字面量 0、`!important` 0、`.device` 前缀 0。
- 最终 `npx playwright test --config tests/r13-audit.config.ts`：**4 passed (57.2s)，退出 0**，[browser-final.log](r13-audit/browser-final.log)。这是 fixture 走查，不是完整产品验收或原回归通过。
- **原数据库回归未执行**：Mac 无测试数据库/真实后端。`Test database connection unavailable` 是此前 R09–R12 的已知环境记录，本轮未把历史错误冒充新运行结果；详见 [未执行说明](r13-audit/regression-not-run.md)。未改原测试或数据库配置。
- 72 张本轮 PNG（每组18张；六态主图24张，附加步骤48张）；另保留 baseline/ 的17张修补前截图。[全部索引](r13-audit/evidence-index.md)、[PNG尺寸/SHA256清单](r13-audit/screenshots.json)。

## 原型摘录（实现改动前）

先读本地 `~/maugo-design/MauGo.html` 内嵌 features.js/CSS，再对照本地 Figma JSON、仓库 appearance 六态清单与 R12 结果。尺寸/颜色仍以 Figma 为准，流程/效果/文案以原型为准，不自行解决冲突。[原文函数与CSS](r13-audit/prototype-excerpts.md)、[六态脚本](r13-audit/state-script.json)、[参考文件哈希](r13-audit/references.json)。本地六态清单的 actions 实际为空，部分状态通过 params/seed 指定；本轮将它们转换成下述真实入口点击步骤，没有用 seed 或 DOM 注入伪造状态。

| 状态 | 点哪里 → 去哪里 → 返回/取消 |
|---|---|
| wallpapers | 登录/首页 → 收信箱 unlocked 会话 → 聊天 ••• → `#chat-background` → 壁纸列表；选图→预览；`#wallpaper-default` 清壁纸回默认并回聊天；Back→详情 |
| wallpaper-preview | 列表点 moon-road（另测 aurora-sky）→预览；Back→列表，不写选图；`#apply-wallpaper`→应用并回聊天。原型找不到 wallpaper id 时 back；当前只可从合法固定列表进入，未增加假非法状态 |
| wallpaper-applied | 从预览真实点击应用→原会话聊天；•••→详情→背景可看选中标记。原型 `returnToChat(c)` 截断本次外观路径，聊天返回收信箱；实现也返回收信箱 |
| wallpaper-colors | 列表 `#color-tab`→七项色板；选择即时保存、移除 wallpaperId、更新选中；`#background-done`→聊天；Back→详情，已选颜色保留（不是取消回滚）。原型 tab 使用 replace，不额外增加返回层级 |
| chat-bubbles | 详情 `#chat-bubbles`→默认预览+四项原生 color input；返回→详情→聊天 |
| chat-bubbles-custom | 真填 myBubble/myText/theirBubble/theirText→即时预览并保存；返回聊天看到左右气泡颜色，再重开保留；`#reset-bubbles` 只删除四项颜色并留在本页，背景不重置 |

读取函数：`background`、`wallpaperPreview`、`bubbles`、`returnToChat`、`page`、`open`、`back`，以及演示 `persist` 的调用点；没有把原型本地假数据逻辑搬进产品。四项默认值与文案沿原有实现，未改业务默认值。

原型文案包括 Chat background / Wallpapers / Colors / Default / Preview wallpaper / Use this wallpaper / Done / Chat bubbles / My bubble / My text / Their bubble / Their text / Reset to default，以及 `A little hello for you.`、`Lovely to meet you!`、`Tap a wallpaper to preview it. Saved for this conversation.`；对应韩文使用现有翻译。无新增占位文案。

滚动：原型 `.page-body` 为固定高度内 `overflow:auto; overscroll-behavior:contain`，聊天线程另行滚动；实现的共享外壳已具备 `.d2-body` containment，因此没有重复改外壳。短屏预览应用按钮和色板 Done 通过滚动可达；气泡短屏也可滚到底，高屏内容不足时不强造滚动。

## 效果清单核对

| 效果/原型时长 | 当前结果 | 本轮处理/证据 |
|---|---|---|
| 背景/预览/色板/气泡页面切换，无专有入场动画（0s） | **通过** | 原实现多余 `d2-open .22s ease-out` 和 d2-page `.18s` opacity/translate；本轮删除这6条中的动画声明/5条规则。失败断言先证实 d2-open，最终四组 `motion.animation=none, transition=0s` |
| 返回按钮 `.round:active scale(.94)`，无 transition 时长 | 保留/源码核对 | 共用 `.ui-icon-button` 规则已覆盖；本轮未重复添加，未做独立按住态截图 |
| 主操作 `.actions button:active scale(.96)`，无 transition 时长 | 保留/源码核对 | 共用 `.ui-button` 覆盖应用、Done、重置；列表 tile / swatch 原型没有单独按压动画，不额外添加 |
| 选中色板/勾选即时变化，0s | **通过（已测 Ocean/Stars）** | aria-pressed、wallpaperId 移除、回聊天 theme-ocean/theme-stars 断言；其他五项展示已覆盖，未逐项点击验收 |
| 四项气泡 input / draw 即时更新、重置，0s | **通过** | 真填四项，检查本地保存、预览计算色、聊天左右实际背景色、重开与重置 |
| 预览图/气泡无专有缩放淡入，0s | **通过** | 仅保留图片/气泡既有静态；没有新增预览动效 |
| 壁纸聊天 header/composer backdrop blur（10px/12px）、半透明 notice/时间阴影 | **未通过/待 Smith** | R13应用态复用R11；当前仍缺原型的部分视觉覆层；属于既有静态效果，按静态不动约束保留，不冒称补齐 |
| 八处渐变 + 应用按钮渐变/应用按钮下方原型渐变托底 | **未通过/待 Smith / R02** | 见下表；不以别的现有渐变代替 |
| 共用 sheet-in | 不适用 | R13六态没有 sheet；沿用外壳已有实现，不虚列本轮新增 |

## 八处渐变复核

本地 Figma 最新读取结果保存在 [gradient-nodes.json](r13-audit/gradient-nodes.json)，含原 fills、stops、handles。实际浏览器 `gradients` 字段保存在每组 walkthrough JSON。以下八处当前 `background-image` 均为 none，不能把纯色底当作渐变通过；本轮补齐 **0/8**。

| 节点 | 应有绘制 | 实际/结果 |
|---|---|---|
| 29:11242 默认 | radial | 仅 `--bg-page`，未通过/待 Smith |
| 29:11244 列表标签 | linear 蒙层 | 无蒙层，未通过/待 Smith |
| 29:11366 预览 caption | linear 蒙层 | 无蒙层，未通过/待 Smith |
| 29:11583 Forest | linear + radial | `--appearance-forest-start` 纯色，未通过/待 Smith |
| 29:11587 Clouds | solid + 两层 radial | `--appearance-clouds` 纯色，未通过/待 Smith |
| 29:11591 Lavender | solid + radial | `--appearance-lavender` 纯色，未通过/待 Smith |
| 29:11595 Sunset | linear | `--appearance-sunset-start` 纯色，未通过/待 Smith |
| 29:11603 Stars | linear + 三层 radial | `--appearance-stars-start` 纯色，未通过/待 Smith |

Night / Ocean 在参考中为纯色，不能算进缺失渐变。应用按钮仍用 `--grad-primary-height-48`，该 token 的 R02 方向修订未解决，本轮未更改；它是额外既有缺口，不混入上述八处的计数。原型 wallpaper-apply 的渐变托底同样未补。现有 token 无这八处对应的专用绘制；新增/近似替代会越过本轮不改 token 架构及静态的约束，故如实待 Smith/R02。

## 边界与未通过项

1. **R12 → R13**：通过真实详情页进入两个 R13 入口并返回原详情。R12报告中 waiting 状态入口未禁用的问题仍在，未跨模块修复；本轮走查仅使用 unlocked 会话，waiting 不算通过。
2. **R13 → R11**：真实应用壁纸/色板和自定义气泡回到原会话；返回收信箱、重开和第二 unlocked 会话不继承外观已验证。聊天消息为 API fixture 原样渲染，不伪造 Figma 示例消息。
3. **偏好保存**：当前 ChatFlow 原有 `maugo-chat-appearance-<conversation id>` 本地存储不发服务端偏好请求；本轮保持逐字不动。fixture 只能证明当前浏览器即时保存和会话隔离，无法证明真实后端保存/保存失败回滚、账号重登录恢复。需要 Smith 明确后续业务范围，不能将演示 persist 当作服务端方案。
4. **图片失败**：拦截真实 wallpaper PNG 请求返回503后，naturalWidth=0、没有 role=alert；预览仍有应用按钮。返回列表正常；缺少错误反馈/重试/禁用应用，未通过/待 Smith。本轮不改已验静态或偏好业务流来掩盖它。
5. **渐变/3x**：八处渐变和按钮/托底待 R02/Smith；3x壁纸待 Smith，保留原1x图片，不重导。
6. **覆盖限制**：七项色板仅 Ocean/Stars 真点过；壁纸正常预览 Moonlit road/Aurora sky，Forest glow 用于失败；其他素材展示可见但不算逐项应用验收。未跑真实手机原生颜色选择器/真实后端/原数据库回归。

## 证据、执行异常与范围复核

- [四组逐步截图与JSON](r13-audit/evidence-index.md)：入口均从 consent/login/home/inbox/details 真点；自定义由 color input 真填，不直接改 Vue 状态或注入页面。API fixture 和演示颜色只在测试中定义，图片503通过网络路由制造。无报告/清空/拉黑请求。
- [source-checks.json](r13-audit/source-checks.json)：ChatFlow.vue、App.vue、tokens.css 对基线逐字相等，壁纸资源未改，JS bundle SHA256 与R12相同；只减少 appearance.css 动画规则，构建CSS哈希单列。
- [修补前与当前实现比较](r13-audit/baseline-static-comparison.json)：这是实现之间的采样比较，不是 Figma diff。17张中12张像素完全相同；首屏1像素差异；另4张处于旧入场阶段、对比有明显差异，不用于证明静态一致。静态保留以生产diff仅删除动画及沿用原静态记录为依据。
- 初次 process 检查误将本轮父进程58524当作另一轮，随后核对父链纠正，开工前确认只有本轮R13 exec、无已有R13分支/提交。未另起R13 run。
- 沙箱阻止 Vite 监听端口，见 [baseline-browser.log](r13-audit/baseline-browser.log)；授权本地端口/浏览器后基线走查通过，见 [baseline-browser-retry.log](r13-audit/baseline-browser-retry.log)。
- 首次新增动画断言的轮次因滚轮碰到切换过程先失败（[motion-red.log](r13-audit/motion-red.log)），增加容器稳定等待后真正看到 d2-open ≠ none 的失败（[motion-red-retry.log](r13-audit/motion-red-retry.log)），然后才删除产品动画。
- 首次生产四组在附加图片失败探针处失败：已缓存图片未触发拦截（[browser.log](r13-audit/browser.log)）；一次重载仍带auth参数回登录页而超时（[image-probe-retry.log](r13-audit/image-probe-retry.log)）。改为从正常首页重进、真实拦截503后最终四组通过。失败/重复轮次不累计通过数，最终截图均由最终轮重新生成。
- Impeccable上下文引擎未安装且缓存目录不可写，未安装依赖；仓库无 PRODUCT.md / DESIGN.md，采用既有R13实现、静态记录和本地原型/Figma作为上下文。
- 分支仅提交本轮CSS、测试、报告和证据；提交与推送以最终 `git log` / 远端SHA核验为准，不合入main。
