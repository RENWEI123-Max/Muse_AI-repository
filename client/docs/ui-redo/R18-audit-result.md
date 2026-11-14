# R18 avatar audit

Base `f04abf1`; branch `codex/r18-audit`. Overall: **未通过／待 Smith**。流程、效果与韩文文案仍有下述缺口；专项脚本通过不等于模块验收全部通过。

## Prototype extraction (before implementation)

Local source: `~/maugo-design/MauGo.html`; decoded source and exact lines in
[prototype-excerpts.txt](r18-audit/prototype-excerpts.txt). Six state scripts:
[state-script.json](r18-audit/state-script.json). No Figma API/token used.

| State | Click → destination → return |
|---|---|
| avatar-gallery | Profile avatar / Edit profile Change avatar → `chooseAvatarMenu`; existing photo → `selectAvatarSlot`, persist, close, refresh profile. Close returns to originating page. |
| avatar-crop | Empty slot / Upload a photo → `chooseAvatar(position)` / `pickFile` → file picker → Crop avatar. Picker cancellation keeps gallery. Zoom 1–3, step .01; Use photo stores JPEG .85, selects it, closes and refreshes profile. |
| avatar-remove | Remove × → `confirm`, title Remove this photo?, copy You can restore removed photos from Recently removed.; Cancel/close leaves underlying gallery intact. Remove photo archives photo and reopens gallery. |
| avatar-removed | Successful removal → empty slot plus Recently removed (n). |
| avatar-restore | Recently removed → `removedAvatars`; Back → gallery. Click photo restores former empty position or first free position → gallery. Full gallery reports Remove a photo first to make space. |
| avatar-full | Eight occupied positions → Upload a photo disabled. Node 29:15057 is full slots, not enlarged photo. Enlarged photo specification remains pending Smith. |

Failure copy: Choose a photo smaller than 20 MB.; This photo could not be opened.;
This photo could not be opened or saved. Try another one. Save failure keeps crop
and re-enables the button. Local prototype persistence/demo seeding will not be
copied into production; server remains authoritative.

Scroll: shared sheet has overflow:auto and max-height:620px; confirmation dialog
has overflow:auto; gallery grid has no independent scrolling. Outer document stays fixed.

Effects inventory: shared sheet-in .3s ease-out, opacity 0 and translateY(30px)
to natural state; confirmation uses sheet-in .22s ease-out. Shared button press
rules are inherited from shell. No avatar-specific selection or zoom tween;
border/check and canvas redraw are immediate. Prototype errors use toast(text), hide after 2700ms. Existing product .25s veil fade was an extra effect (removed below).

## 四项验收

| 项目 | 结果 | 证据与边界 |
|---|---|---|
| 静态 | 本轮增量通过；原全量静态遗留未通过 | 沿用 [原六态截图及 A1–A8](R18-result.md)，未重做静态。`VITE_API_BASE_URL=/api npm run build` 退出0；[build-final.log](r18-audit/build-final.log)。保护与字面量检查见 architecture.json。旧 A2/A3/A4 缺口未因本轮消失。 |
| 流程 | 未通过／待 Smith | 六态均经真实点击、文件选择、上传、删除、恢复到达；取消、失败重试、满槽和双入口已覆盖。API 为 fixture，非真实后端验收。裁切关闭回图库而原型关闭 sheet 回来源页；20 MB 前置校验缺失，受 script 禁改限制未修。大图规格冲突待 Smith。 |
| 效果 | 未通过／待 Smith | sheet-in .3s、确认 .22s 与按钮按下态已核对；多余 .25s veil fade 已移除。错误仍为常驻 alert，原型为2700ms toast，受 script 禁改限制未修。见逐项表。 |
| 滑动与文案 | 未通过／待 Smith（滑动通过，韩文缺口） | 两高度、双语言 document 固定，长归档可实际 wheel 滚动且 Back 不重叠。六态主图四套齐备。采样面板文案无横向溢出，仍有 Avatar saved.、满槽服务端错误未翻韩文；不能记文案通过。 |

## 实现与范围

生产文件只改 `ProfileFlow.vue` 模板与 `styles/pages/profile.css`；原工程没有独立 avatar.css，R18 样式原本即位于 profile.css。

- 自己头像图库、裁切、移除确认、最近移除的 Escape 在 capture 阶段调用原 back 并阻止事件传到 HomeFlow；不再误关整个资料页。原 R17 likes 与 R16 person Escape 条件保留。
- avatar-panel 从 overflow:visible 改为 auto，限制视口内高度并 contain overscroll；外层 document 不滚。
- 归档达到5张时，将原绝对定位的网格和 Back 改为正常流内相对定位；Back 在网格之后，长内容通过面板滚动到达。原六态的一张归档截图布局不变；没有注入样例归档。
- 仅头像 veil 禁用多余淡入淡出，保留共享 sheet-in 和按钮效果。未改颜色、字体、尺寸 token、支付、服务端或其他模块脚本。
- `<script setup>` 与 f04abf1 逐字节一致，见 architecture.json；没有回退 R16/R17 修复，没有创造自己资料大图入口。

## 效果逐项核对

| 原型效果 | 核对结果 | 实际证据/限制 |
|---|---|---|
| sheet-in .3s ease-out：opacity 0、translateY(30px) → 正常 | 通过 | 图库、裁切、恢复面板计算 animationName/duration；共享 keyframes 保留。 |
| confirmation sheet-in .22s ease-out | 通过 | remove 与 remove-failure 记录 .22s；共用 ui-dialog。 |
| 主按钮按压 scale(.96)，关闭按钮沿用共用按压 | 主按钮通过；关闭按钮源码核对 | 浏览器按住 Upload a photo 的 transform 为 matrix(.96,0,0,.96,0,0)；共用 icon button scale(.94)，未另加头像 tween。 |
| 选择框/勾选即时变化；缩放即时 canvas 重绘 | 通过（fixture范围） | 选择后关闭，重新打开选中；range=1.5 且 canvas 数据变化；无头像专用延迟动画。 |
| 额外 veil .25s fade | 已移除 | 入场时读取 transitionDuration=0s，非只读取动画结束后的值。 |
| 原型 toast 2700ms | 未通过／待 Smith | 产品为 d4-error 常驻 role=alert；错误位于 dialog 之外且短屏可能覆盖其他内容。没有改 script 伪装成 toast。 |
| reduced motion | 源码保留；本轮未单独浏览器验收 | 共用 reduce 规则保留，本轮截图使用默认 motion。 |

## 流程与文案缺口

1. **规格待 Smith**：29:15057 本地 JSON 名为 avatar-full · 头像 / 槽位已满，实际8槽图库；本轮只验满槽，不凭空补309×309大图，不生成假大图截图。
2. **取消目标差异**：原型 crop sheet 的关闭结束 sheet，回原入口；产品 back 将 crop 转回 gallery。图库及 Edit profile 来源保留，未改 script 自行取舍。
3. **文件/存储失败差异**：原型选择文件前拒绝 >20 MB，产品 upload 没有该判断；保存错误显示接口文案，非原型 This photo could not be opened or saved. Try another one.。本轮测试损坏图片解码失败、503上传/选择/删除/恢复及409满槽恢复；未实际上传20 MB文件，大小校验结论来自源码。
4. **服务端优先**：实际后端为首个空槽分配 add/restore，满槽错误为 All 8 avatar slots are occupied；与原型 formerSlot/Remove a photo first to make space. 不同。fixture已按服务端错误和分配规则，不将演示数据逻辑搬进产品。没有数据库可验证真实持久化、权限、并发或重进。
5. **韩文不完整**：Avatar saved. 与 All 8 avatar slots are occupied 未翻译，底层 profile 的 Libra 属既有相邻模块。503 fixture 固定返回 Please try again.（本地字典无该键），仅测错误恢复，不作为真实服务端错误文案通过证据。正常六态标题/按钮/说明为韩文、面板采样没有横向截断；不能据此说整页无英文或所有文案通过。
6. **静态遗留保留**：原 R18 的全量几何、全量样式、Figma并排图和删除确认下方图库等差距照旧。本轮不补静态，也未调用 Figma API/token。
7. **真实后端未执行**：按任务不重复启动已知缺数据库回归，不改配置凑通过。见 [regression-not-run.md](r18-audit/regression-not-run.md)。fixture通过不代表原 A6 或真实 API 通过。

## 走查与失败诊断

从同意条款 → fixture登录 → 会话确认 → 首页 Profile 开始；通过头像入口/编辑资料 Change avatar 开图库。取消选择文件、损坏文件、空槽上传、裁切缩放与取消、上传503恢复、选择503恢复、移除取消/关闭/Escape/确认/503恢复、归档返回/Escape/恢复503、8槽禁用上传、满槽恢复409、背景点击关闭、各头像层Escape；最后反复真实上传/移除产生10张归档，检查 Back 与网格无重叠并 wheel 滚动。

所有头像初始为空，照片只来自仓库 portrait-5.png 的浏览器文件选择、canvas JPEG 编码、API上传字节；服务端存储由内存fixture模拟，不伪装真实账户或真实上传服务。满槽通过8次产品上传操作获得，没有直接设 Vue 状态或注入满槽 profile。重复同一照片是明确的测试输入，非8名真实用户照片。

- 前轮空 [walkthrough-baseline.log](r18-audit/walkthrough-baseline.log) 无可推断错误，保留原状。重新复现发现 localhost listener 被沙箱拒绝 EPERM：[walkthrough-diagnosis.log](r18-audit/walkthrough-diagnosis.log)。申请本机执行后才可启动 preview；未修改测试断言掩盖启动失败。
- 修复前四组均因 avatar-panel overflow:visible 失败：[walkthrough-baseline-local.log](r18-audit/walkthrough-baseline-local.log)。增强断言再复现 .25s veil、archive wheel top=0 与 Escape 关闭整页：[walkthrough-red.log](r18-audit/walkthrough-red.log)。
- 首次修复后，人工看长归档真实PNG发现 Back 覆盖照片。几何断言确认失败：[archive-layout-red.log](r18-audit/archive-layout-red.log)。随后只为长归档补正常流布局；不将“可滚动”冒充“无重叠”。
- 新增按压采样第一次释放鼠标到背景，触发正确的背景关闭行为而使后续关闭定位超时：[press-harness-failure.log](r18-audit/press-harness-failure.log)。改成在原按钮释放并取消文件选择器，未修改生产行为或降低断言。
- 最终专项结果、PNG数量与完整性见下文及 evidence-verification.json；最终日志 [walkthrough-final.log](r18-audit/walkthrough-final.log)。

截图索引、PNG尺寸/SHA256、各组逐步API记录位于 [r18-audit](r18-audit/)。每组有六态主图、空库、失败态、长归档滚动前后与Escape；不是直接跳状态截图。人工抽查667 KO恢复、667 EN上传失败与长归档；未宣称逐像素对照Figma通过。

未合入 main。分支推送以实际 git push 与远端 SHA 校验为准。


## 最终验证结果

`npx playwright test -c tests/r18-audit.config.ts`：**4 passed (1.4m)，退出0**。构建退出0，`git diff --check` 通过。专项验证成功仅限上述fixture流程及修复，不代表四项验收全部通过。

**64张真实PNG**，每组16张；六态×两高度×两语言共24张主图齐全。PNG签名、所有chunk CRC、尺寸及SHA256已检查，见 [screenshots.json](r18-audit/screenshots.json)。60次面板截图采样 document 宽375、高与视口一致、scrollY=0，图片全部解码。长归档四组真实wheel均scrollTop=161，documentY=0；Back位于网格之后。文案采样无横向溢出，但未将 clipping 记录当成完整翻译、重叠或纵向截断验收。

[完整验证](r18-audit/evidence-verification.json)、[截图索引](r18-audit/evidence-index.md)、[667 EN](r18-audit/667-en-walkthrough.json)、[667 KO](r18-audit/667-ko-walkthrough.json)、[812 EN](r18-audit/812-en-walkthrough.json)、[812 KO](r18-audit/812-ko-walkthrough.json)。人工复看修复后长归档PNG，照片与Back不再重叠。代码复核未发现阻塞问题；script保持不变，原数据库回归未执行。
