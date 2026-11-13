# 任务 #116 · #115 重构还原度审查（Claude）

审查对象：分支 `codex/refactor-fidelity` @ `aa2c487`（基线 `049e010`），只审分支 diff。日期 2026-11-13，画布 375 × 812，DPR 1。
本审查不改业务代码、不合入、不推 main。

## 结论：REQUEST_CHANGES

主要页面整体还原度相比重构前有明显提升，欢迎、登录、协议、收信箱、聊天、钱包、设置都已接近原型。但下列问题必须改后才能合入：

1. **资料页 4 张以上形象照时控件压住卡片**（新引入的回归）。`fidelity.css` 用固定 `top:186px/190px` 绝对定位 `#new-profile-moment`（浮动 +）和 `#profile-moments`（My moments ›）。只要形象照第二行出现，+ 按钮就盖在第二行卡片上（5 张时与“上传”卡重叠），My moments 入口被卡片挡住。见 [probe 图左](claude-review/probe-cards5-short667.png)。应改为随卡片网格流式排布（或定位到网格下方），不能写死 top。
2. **短屏（375 × 667）写信页按钮与底部导航重叠**（新引入的回归）。`.opening-form footer` 用 `bottom:-66px` 放到面板外，667 高度下 Cancel / Let it fly 与底部导航图标叠在一起，且首页帽子盖住“Tap a bird…”提示。见 [probe 图中/右](claude-review/probe-cards5-short667.png)。`@media(max-height:740px)` 分支需要实际验证并修正。
3. **外观弹层（项 15）REPORT 标“已修”与事实不符**。原型：Male/Female 为带选中描边与 ✓ 的卡片、颜色格选中带 ✓、飞行预览有底框和 Replay、两个开关是拨动开关、Done 完整可见。重构后：性别无卡片和选中态、颜色格无 ✓、开关仍为原生复选框、Done 在 812 高度下被裁掉一半需滚动。见 [appearance](claude-review/appearance.png)。应改为“部分修复”并补齐开关样式与 Done 可见。
4. **欢迎页左上角新增的 `‹` 是不可点的装饰**（`App.vue` 中 `aria-hidden` 的 `span.welcome-back`）。原型中它是可聚焦的返回按钮；客户端欢迎页是根页面，加一个点了没反应的返回箭头属于错误的交互反馈。删掉，或做成有实际行为的按钮。

建议修（不阻塞）：

- `fidelity.css` 存在同一选择器的多次覆盖（`.d5>.compose-link` 的 top 先后为 200/176/186px，`#profile-moments` 为 202/176/190px，`::before` 先加后撤，`#refresh` 两处），属于逐次补丁叠加，建议合并为一处，避免后续维护再次错位。第 1 项修复时一并清理。
- 写信页禁用态的 “Let it fly” 为暗绿色 + 字符 `➤`，原型为灰底灰字 + SVG 发送图标；“Change bird” 胶囊缺失。
- 设置页首组卡片紧贴页眉（缺约 24px 顶距），右侧箭头偏粗偏大。
- 资料页 “Profile visibility›” 右侧贴边且缺空格；“No photos uploaded yet.” 与 “My moments ›”、+ 按钮挤在一起。
- 首页底部导航缺消息未读小圆点；钱包/Pass 次要入口紧贴导航上沿（REPORT 已注明保留）。
- 阅读信件缺原型面板下方的 “Not interested” 按钮（REPORT 未列出）。

## REPORT.md 结论核实

| REPORT 声明 | 核实结果 |
|---|---|
| `npm run build` 通过（资源校验 + vue-tsc + vite） | **属实**。本次在本 worktree 重跑通过。 |
| 生产预览视觉/状态验证 12/12 通过 | **属实，但含义有限**。本次重跑 `docs/fidelity-refactor/playwright.config.ts` 得 12/12 通过（截图输出到临时目录，未覆盖仓库中的 after 图）。这 12 个用例是固定响应下的截图采集，全文件仅 16 处 `expect`，主要确认元素出现，不比对原型，不能当作视觉验收通过。 |
| `ui-polish.spec.ts` + `f01-ui.spec.ts` 5/5 | **属实**。本次重跑这两个固定响应用例通过（另需注意：它们会覆盖仓库中 `docs/ui-polish/`、`docs/c7-evidence/` 截图，本次已还原）。 |
| 60 项可对照、133 个原型状态未对照 | **属实**。`coverage.json` 共 193 条：`captured-for-review` 60，`not-verified` 133；`reference/manifest.json` 189 个原型状态。133 个状态仍未验证。 |
| 数据库回归未执行 | **属实，仍未验证**。本机同样没有 PostgreSQL/Docker，依赖真实后端的 Playwright 配置（auth/d4-reverify/d5/d6-followup/d7/d8/d9/d11/f06/f07 等）全部无法运行。**不能认定“无回归”。** |
| （补充）纯 mock 用例 | 本次额外跑了不依赖数据库的 `d2.spec.ts`、`d4.spec.ts`：分支上 5 个失败，在基线 `049e010` 上同样是这 5 个失败、报错一致，属于已有问题，不是本分支引入。 |
| 项 15 外观预览“已修” | **不属实**，见结论第 3 项。 |
| 其余“已修”项 | 在逐屏对照中基本成立，例外见下表。 |

## 逐屏核实

对照方式：用 Playwright/Chromium 直接打开 `~/maugo-design/MauGo-手机壳交互版-离线.html` 截取 `#screen`（本次独立重拍），配合分支内 `reference/` 的状态平铺原型图，与重构前 `before/`、本次重跑得到的重构后截图并排比较。对照图在 [claude-review/](claude-review/)（左原型 / 中重构前或手机壳原型 / 右重构后）。示例数据（姓名、头像、文案）不同不计为差距。

| 屏 | 布局/间距 | 颜色/字体/图标 | 交互反馈 | 判定 | 图 |
|---|---|---|---|---|---|
| 欢迎 | 与原型一致：居中 Logo、标题/副标题/短文、按钮位置 | 一致，Apple 图标已补 | 左上 `‹` 为不可点装饰 | 已修，须改第 4 项 | [welcome](claude-review/welcome.png) |
| 登录 | 一致 | 一致 | 缺 “Explore preview”（原型演示入口，可接受） | 已修 | [signin](claude-review/signin.png) |
| 协议 | 一致；法律正文为待 Smith 占位 | 一致 | — | 部分修复（与 REPORT 一致） | [terms](claude-review/terms.png) |
| 首页 | 顶栏、帽子、三鸟中心/两侧、Refresh/Send 双按钮与原型 home-ready 吻合 | 一致；光轨为 SVG 近似 | 钱包/Pass 次要入口仍在、缺未读点 | 基本已修；短屏见第 2 项 | [home](claude-review/home.png) |
| 筛选 | 浮动面板、拖拽条、居中标题、圆形性别选择一致 | 滑条样式略不同 | 多出数据来源说明与 Unlock 链接（REPORT 已注） | 部分修复（与 REPORT 一致） | [filters](claude-review/filters.png) |
| 外观 | 性别无卡片、Done 被裁 | 开关为原生复选框，选中无 ✓ | 选中反馈弱于原型 | **未达原型**，须改第 3 项 | [appearance](claude-review/appearance.png) |
| 阅读信件 | 面板位置/尺寸/圆角一致 | 一致；作者头像为占位鸟 | 缺 “Not interested” | 部分修复 | [letter](claude-review/letter.png) |
| 写信 | 面板 + 下方独立按钮一致；多 Recipient ID（业务必需） | 禁用态颜色与图标不一致 | 短屏与导航重叠 | 部分修复，须改第 2 项 | [compose](claude-review/compose.png) |
| 收信箱 | 一致 | 一致 | Following 文案保留真实含义 | 已修 | [inbox](claude-review/inbox.png) |
| 聊天 | 一致：深绿画布、两行输入区、录音胶囊 | 一致 | 空输入时发送按钮变暗（合理） | 已修 | [chat](claude-review/chat.png) |
| 我的资料 | 头像/统计/形象卡/浮动 + / 底部导航与原型接近；顶栏仍是返回+标题（原型为钻石/Pass 胶囊） | 基本一致 | 4 张以上形象照时控件重叠 | 部分修复，须改第 1 项 | [profile](claude-review/profile.png)、[probe](claude-review/probe-cards5-short667.png) |
| 设置 | 分组/行高一致，首组缺顶距；退出/注销不在此页 | 箭头偏粗 | — | 基本已修 | [settings](claude-review/settings.png) |
| 钱包 | 悬浮面板、提示条、余额条、2×2 套餐、价格胶囊一致 | 一致 | 显式 Get 按钮，不伪造支付成功（正确） | 已修 | [wallet](claude-review/wallet.png) |

动画与过渡：分支未改 D11 的四个转场逻辑，`after/motion.json` 记录的时长与 D11 一致；`prefers-reduced-motion` 下关闭帽子浮动。设置/资料子页转场未与原型录屏逐一对齐（REPORT 已注明），本次未额外核实。

## 合入前提醒（不在本任务范围）

基线 `049e010` 落后 main：main 上 #95 StoreKit 改了 `ReplyTopup.vue`（+68 行）和 `i18n.ts`，与本分支的钱包模板/样式改动会冲突，rebase 后需重新截图核对钱包与充值确认页。
