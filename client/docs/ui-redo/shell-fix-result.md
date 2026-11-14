# shell-fix 结果（2026-11-14，Mac mini）

## 执行摘要

- 分支：`codex/shell-fix`；基线：`04326fa`；实现提交：`c97aaee307429b67654b9f7746a52c8a1df93452`。未合入 main。
- **推送未完成**：自动审批拒绝 `git push -u origin codex/shell-fix`，原因是无法验证具体 GitHub 远端 `RENWEI123-Max/Muse_AI-repository` 的用户/组织归属，认为有源码外发风险；已请求用户明确批准该目的地，未绕过拒绝。
- **总体：部分完成，验收未全通过／待 Smith。** 构建退出 0；生产预览浏览器检查 8/8 通过；12 张真实 PNG。测试通过数不代表全部验收通过。
- 四项：静态 **未通过**；流程 **部分通过／待 Smith**；效果 **未通过／待 Smith**；滑动与文案 **部分通过／待 Smith**。
- 9 关键帧：新增 1（sheet-in），原有 1（sprite-loop），缺 7；sprite-loop 的实现与原型坐标写法不同，未验证等价。
- 6 按下态：共用规则新增 6；5 项映射现有控件，1 项 floating compose 仅有声明、无现有控件接入。仅圆钮做了真实按压实测，不能将 6 项均记作运行验收通过。
- 12 过渡声明：本次映射 5 项（actions button、toast、toggle track、两处 toggle thumb）；另 6 项未补，1 项为原型展示静态禁用规则，未移植其 `!important`。toast 与非 appearance 开关缺真实业务运行态验证。
- 滚动清单：13 项均完成源码对应核对；appearance、auth、terms 有浏览器检查，其余 10 项运行态待验。terms 原有短文未溢出，另外使用测试 DOM 加长内容验证内部滚动，截图不含加长内容。

## 范围和环境

主机 `Annas-Mac-mini.local`，仓库 `/Users/anna/Muse_AI-repository`。`~/task-shell-fix.md`、原型及 Figma JSON 均存在。
防重复检查发现的 PID 45207 是当前会话自身（工具 shell 的父进程），未发现第二个 shell-fix exec；本分支开工时无基线之后的提交。

只使用本地原型 `~/maugo-design/MauGo.html` 的 `__ATLAS_BUNDLE__.css` 与本地 Figma JSON。Figma `35:3533`、`34:1917` 均为 375×812，`43:1912` 导航高度 96。未调用 Figma API/token，未开 Issue、未发 Telegram。

代码仅涉及共用 CSS、样式入口、App 外壳 class、两处共用 stylesheet 引用：

- base.css：用 `.app-shell` 约束最大 375×812、矮屏随视口缩小，根文档不滚，内容区保留内部滚动，补 `min-height:0` 与 overscroll 边界。
- 原基线在 `max-height:740px` 有兜底，因此 667 已能缩小，但 760 仍被 min-height:812 撑开。新增 760 回归检查，避免仅测 667/812 漏检。
- appearance：保留 678px 内容坐标，缩短外层可视范围；通过滚动高度占位和固定 Done 内容坐标避免短屏按钮与开关重叠。375×812 原尺寸不变。
- 卡片/动态弹层改用 bottom:24px 与视口上限；信纸外壳在短屏上移。这些模块仅源码审查，真实运行态待验。
- main.ts 最后加载共用 base/components，避免旧全局按钮 scale 和转场覆盖；App.vue 仅增加 `app-shell` class。
- `reply.css` 原在 InboxFlow / ReplyTopup 以不同 style index 引用，最终构建曾报 Vue `block.scoped` 未定义；改为 main.ts 单次导入后最终构建退出 0。这两个组件仅删除 style 引用，未改脚本或模板。
- tokens.css 仅补录原型 hold 按压颜色 `rgb(49 67 50)`；未改支付、服务端规则、token 存取或 localStorage 登录逻辑。

## 四项验收

| 项目 | 结果 | 实测与边界 |
|---|---|---|
| 静态 | **未通过** | 最终 `cd client && VITE_API_BASE_URL=/api npm run build` 退出 0；343 PNG/字体校验、vue-tsc、Vite 均通过。全量 src hex=401、!important=0、.device=27，未达到全量零要求；基线为 401/0/29。base/components 为 0/0/0；含 tokens 的共用三文件为 247/0/0。未超范围清理旧模块颜色与选择器。 |
| 流程 | **部分通过／待 Smith** | 667/760/812 根文档高度等于视口；首页操作与导航在屏内；appearance 内部可滚且 Done 可达；auth/terms 容器检查通过。未改模块跳转逻辑，未跑登录后全模块流程；13 容器未全部实测。 |
| 效果 | **未通过／待 Smith** | sheet .3s、圆钮 .94、switch .2s、reduced-motion 实测通过。9/6/12 详见下表，缺少模块效果、接入与运行验证。 |
| 滑动与文案 | **部分通过／待 Smith** | 667/812 各英韩首页真实 PNG，首页两个主按钮与提示的 scrollWidth 检查通过；appearance 上下滚动截图齐全。无法证明全模块英韩无占位/无截断。游客 appearance 中继承的登录提示与标题重叠；667 首页提示与帽子画面相叠，需 Smith 确认后续处理。 |

浏览器命令：`cd client && npx playwright test -c tests/shell-fix.config.ts`，生产 preview，8 passed，退出 0。测试是外壳验证，不是后端业务验收。最终截图通过未登录的真实 Explore 入口进入首页，无 mock API、无伪造登录 token；首页无来信鸟是游客状态，不代表登录后三封来信状态。

构建与浏览器未并发作为最终验收；中间失败记录不算通过。证据：[build.log](shell-fix/build.log)、[browser-tests.log](shell-fix/browser-tests.log)、[source-audit.json](shell-fix/source-audit.json)。

## 9 关键帧

| 原型 | 时长/用途 | 本次与缺口 |
|---|---|---|
| sheet-in | sheet/composer .3s ease-out；payment .22s ease-out | **新增 1**，共用 sheet/dialog 映射；appearance .3s 实测；其他弹层仅静态映射待实测 |
| reply-arrive | .45s ease-out | 缺，未移植收取业务状态动画 |
| responses-flow | 24s linear infinite | 缺，现有 response-strip 手动横滚不等价 |
| sprite-loop | .65s steps(6) infinite | 原有；客户端终点 120% 而原型 -300px，未记作严格等价通过 |
| wave | .6s ease-in-out infinite alternate | 缺；未修改录音业务结构 |
| twinkle | 3.3s ease-in-out infinite | 缺 |
| floor-breathe | 4s ease-in-out infinite | 缺 |
| mist-breathe | 5.4s ease-in-out infinite | 缺 |
| preview-frames | .65s steps(6,end) infinite | 缺；现有预览复用 sprite-loop，不能按名称/实现当作补齐 |

首页场景 JS：保留现有 `lib/home-trails.ts` 与 vHomeTrails，未改；本轮未核完与原型场景 JS 的逐帧等价。页面无转场：已停用共用 page/tab/push/d11-chat 过渡，未宣称所有旧模块动画均已移除。

## 6 按下态

| 原型选择器与值 | 共用映射 | 验证 |
|---|---|---|
| .round:active → transform scale(.94) | .round / .ui-icon-button | 圆钮实测 matrix(.94…) 通过 |
| .actions button:active → scale(.96) | .actions button / .home-actions button / .ui-button | 已补，静态核对 |
| .tool-button:active → color lime | .tool-button / .ui-icon-button--chat-tool | 已补，静态核对；图标资产颜色是否可见变化待验 |
| .hold-button:active → background #314332 | .hold-button / .ui-button--chat-hold | 已补 rgb token，静态核对 |
| .collect-replies:active → scale(.99) | .collect-replies | 已补，静态核对 |
| .profile-floating-compose:active → scale(.96) | .profile-floating-compose | **仅声明；现有模板无同名入口，待 Smith** |

基线的两个 active 是全局按钮及 reduced-motion 覆盖，并非上面六个目标规则已接入。已禁用旧全局 scale，避免与 transform 双重缩放。

## 12 过渡声明

本地 CSS 计数是 12 条 transition 声明：11 条交互过渡 + 1 条展示禁用。不是 12 条独立有效交互过渡。原始提取见 [prototype-inventory.json](shell-fix/prototype-inventory.json)。

| # | 原型选择器 | 原型值 | 本次状态 |
|---|---|---|---|
| 1 | .aura | opacity .8s | 未补 |
| 2 | .bird-art | filter .25s | 未补 |
| 3 | .actions | opacity .45s, transform .45s | 未补；现有首页动作常显 |
| 4 | .actions button | transform .2s, opacity .2s | **新增**，home-actions button |
| 5 | .veil | opacity .35s | 未补；未用旧 .25s 冒充 |
| 6 | .note-panel | opacity .36s, transform .44s cubic-bezier(.2,.8,.2,1) | 未补；现有信纸模块不同生命周期 |
| 7 | .toast | opacity .2s, transform .2s | **新增**，toast/ui-toast/reply-receipt；收取运行态待验 |
| 8 | .scene-hint | opacity .7s | 未补 |
| 9 | .preference-row checkbox | background .2s | **新增映射** ui-switch；appearance 计算样式实测 |
| 10 | .preference-row checkbox:before | transform .2s | **新增映射** ui-switch::after；偏好页运行态待验 |
| 11 | appearance .switch-row input:before | transform .2s | **新增映射** ui-switch::after，appearance 使用同一原语 |
| 12 | .screen:not(.force-motion) * 等 | transition:none!important | 原型 atlas 静态展示禁用规则，**未照搬**；客户端仅用户 reduced-motion 时禁用，待 Smith 确认计数口径 |

合计新增映射 5/12，6 项交互未补，1 项展示禁用未搬。默认 easing 为 ease（原型未指定时）。

## 13 滚动规则核对

13 是原型 CSS overflow:auto/scroll 的规则数，并非 13 个互不重叠 DOM 元素；public-profile 规则与 page-body 有交集。

| # | 原型容器 | 客户端对应及本轮状态 |
|---|---|---|
| 1 | .reply-history | .letter-conversation 内回复；保留 auto、contain；运行态待验 |
| 2 | .sheet | ui-sheet / home-sheet / r07-sheet / moments sheet；appearance 短屏实测能滚，Done 可达；其他待验 |
| 3 | .conversation | inbox-body（头112、底96边界），保留 auto；运行态待验 |
| 4 | .compose-attachments | 附件容器实现不同；未运行，待 Smith |
| 5 | .payment-dialog | ui-dialog / ui-sheet--reply / pass-payment-dialog；视口上限和 auto；未执行支付，运行态待验 |
| 6 | .emoji-grid | ui-sticker-grid；现有 304px / auto，运行态待验 |
| 7 | .page-body | page-body / d4-body / d2-body / settings-body 等；补 min-height:0 与内部 auto；登录页以外运行态待验 |
| 8 | .chat-thread | c6-thread 现有 flex:1 / min-height:0 / auto；补 contain；运行态待验 |
| 9 | .moment-categories | categories；现有实现需运行态核对，待 Smith |
| 10 | .auth-panel | auth-flow / auth-content；真实欢迎页 Explore 可达；auth-flow overflow 容器核对通过 |
| 11 | .terms-scroll | 保留 350px / auto；英韩两高度检查，测试 DOM 加长后 scrollTop>0；原有短文不必强制溢出 |
| 12 | .feedback-types | SettingsFlow 反馈类型实现不同；运行态待验 |
| 13 | public-profile-reference > .page-body | person-page d4-body；补 min-height:0 / auto，运行态待验 |

根 html/body/#app 不滚，壳高为 min(812px,100svh)，固定 375px 上限宽度；没有将整页设为可滚来掩盖问题。原型没有短屏 Figma 画板，短屏处理是本次外壳适配，并非声称原型已有 667 画板。

## 截图清单与真实性

以下均为生产 preview 中 Chromium 实际渲染的 PNG，DPR=1，未合成/改图。截图前等待字体与 img.decode；有限动画在截图 API 中结束，避免截到 sheet opacity=0。首页测试固定 bird motion=false；不代表动态效果验收。

| 尺寸 | 英文 | 韩文 |
|---|---|---|
| 375×667 首页（游客） | [home en](shell-fix/home-375x667-en.png) | [home ko](shell-fix/home-375x667-ko.png) |
| 375×812 首页（游客） | [home en](shell-fix/home-375x812-en.png) | [home ko](shell-fix/home-375x812-ko.png) |
| 375×667 appearance 顶部 | [top en](shell-fix/appearance-top-375x667-en.png) | [top ko](shell-fix/appearance-top-375x667-ko.png) |
| 375×812 appearance 顶部 | [top en](shell-fix/appearance-top-375x812-en.png) | [top ko](shell-fix/appearance-top-375x812-ko.png) |
| 375×667 appearance 滚至 Done | [bottom en](shell-fix/appearance-375x667-en.png) | [bottom ko](shell-fix/appearance-375x667-ko.png) |
| 375×812 appearance Done 可见 | [bottom en](shell-fix/appearance-375x812-en.png) | [bottom ko](shell-fix/appearance-375x812-ko.png) |

每张 PNG 的 IHDR 尺寸、SHA256 见 [screenshots.json](shell-fix/screenshots.json)。没有登录后三封来信、钱包/支付、聊天/收取、反馈/动态完整状态的截图；不能用游客截图代替这些验收。

## 缺口／待 Smith

1. 全量 src 的 401 个 hex 和 27 个 .device 仍在（全部 hex 为基线保留；token 本来含247个），全量零要求未过。跨模块清理超出本轮共用修复范围。
2. 7 个关键帧、6 条交互过渡尚未补；浮动写信入口未接入；现有 sprite-loop 等价性与 JS 场景动画未核完。需要后续模块效果任务。
3. 13 容器中其余10项缺真实运行态证明，登录后英韩全模块文案也未验。不能把源码 auto 当成触摸滚动已通过；也未做真机 Safari/触屏验证。
4. 真实游客截图可见 appearance 内继承登录提示与标题重叠，以及667首页提示落在帽子画面范围；未隐藏错误提示、未改模块状态逻辑来美化截图。全量“无截断/遮挡”不通过。
5. 未进行服务端、支付、登录会话功能回归；相关脚本保持原样。构建错误的 style 引用调整已通过生产构建与游客外壳测试，但两个模块的全部运行态仍待验。
