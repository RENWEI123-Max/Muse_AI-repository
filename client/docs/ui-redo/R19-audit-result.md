# R19 形象照补查

基线 `ccd66a8`（`codex/r18-audit`），分支 `codex/r19-audit`。整体结论：**未通过／待 Smith**。本轮完成指定补查与证据交付，不能把专项通过等同于模块验收通过。

开工检查 Mac 只有当前这一轮 `codex exec`，已位于 `r19-audit` tmux；没有另起 Codex，没有开 GitHub Issue。远端与本地无既有 audit 提交，从指定基线建分支。沙箱拒绝 ps 和 localhost 监听后，获准本机执行；未使用 Figma API/token，未启动真实后端。

## 四项验收

| 项目 | 结果 | 证据与边界 |
|---|---|---|
| 静态 | 未通过／待 Smith | 本轮增量构建通过；沿用 [R19-result.md](R19-result.md) 的 A1–A8 和六张 375×812 原截图。原 A2/A3 全量几何/样式、A4 Figma 并排仍未通过；本轮不重做静态。A5 的 R20 旧 CSS 阻塞已清除，详见 architecture.json。 |
| 流程 | 未通过／待 Smith | 六态通过真实点击到达；API fixture 覆盖空态、列表重试、上传/创建/修改/删除503、取消、大小边界、八张禁用和六态 Escape。上传选择后关闭时机、删除取消返回目标、文件处理与原型有差异。真实后端未验。 |
| 效果 | 未通过／待 Smith | sheet-in 0.3s、确认 0.22s、30px 关键帧、删除按钮 .96 按压与无额外 veil 过渡核对；修复确认被覆盖成0.3s的问题。原型错误为2700ms toast，产品仍为常驻 alert，脚本禁改未修。 |
| 滑动与文案 | 未通过／待 Smith | 双高度双语言整页固定，短屏预览与满卡资料容器实际 wheel 可滚，图片仍309×480；面板横向采样无溢出。韩文动态类型/可见范围、主图入口及错误/状态仍有英文；不能判文案通过。 |

## 原型摘录与六态对照

来源只读本地 `~/maugo-design/MauGo.html`，解析其内嵌 features.js、app.js 与 CSS；逐行摘录见 [prototype-excerpts.txt](r19-audit/prototype-excerpts.txt)。模块11 `page-states.json` 与原 R19 六态逐一一致，见 [state-script.json](r19-audit/state-script.json)。没有使用 atlas 的状态驱动器跳转产品状态，也没有把原型预填卡片拿来当产品数据。

| 状态 | 原型入口、动作与返回 | 本轮实现与走查 |
|---|---|---|
| card-type | Profile → Upload image card → Photo type；四类，选择即关闭 sheet 后开文件选择器；Cancel 关闭 | 空库点击上传到达；取消文件选择仍留类型面板，与原型不同；文件 MIME/10MB边界与上传503覆盖 |
| card-options | 点击上传的卡片 → Image card，四项菜单 | 所有卡片均从浏览器真实文件选择和 POST 创建；菜单真实点击到达；另有原 R19 保留的主图入口差异，未改静态 |
| card-preview | 菜单 View photo → Photo＋图片＋类型；Close 回 Profile | 图片实际解码；309×480，短屏面板滚动后可见 caption；Close/Escape关闭卡片层，Profile保留 |
| card-change-type | 菜单 Photo type → 四类；选类型、保存、关闭 | outfit PATCH503保留面板，重试成功后重新打开；未注入 Vue 状态 |
| card-visibility | 菜单 Visibility → Everyone/Friends/Only me，选后关闭保存 | 三项逐个选择并重开核对 aria-pressed；503保留面板；fixture范围内数据更新 |
| card-remove | 菜单 Remove card → 独立确认覆盖底层菜单；取消只关确认，成功删除后关闭菜单回 Profile | 取消/Close/Escape回 Profile，未保留可操作菜单，属于未通过；删除503及重试成功后空态已到达 |

原型确认 Close/Escape只取消确认；产品 `back()` 清空整个 card sheet。模板拦截 Escape修复了继续冒泡误关 Profile，但没有改脚本返回模型来伪装原型一致。原型自动聚焦 Close并在关闭后恢复来源焦点；产品无同等显式焦点管理，本轮只验证手动聚焦 Close 后的键盘关闭，不能声称全键盘流程通过。

## 实现与保护

生产仅两处增量：

- `MomentsFlow.vue` 卡片遮罩增加 `@keydown.esc.stop="back"`，调用原有 back，避免 Escape 冒泡到 Profile/Home。
- `components.css` 增加 `.app-shell .ui-dialog.ui-dialog--cards{animation-duration:.22s}`，解决同时带 sheet/dialog 类时 sheet 规则更高优先级覆盖确认时长。只影响卡片确认，正常静态布局不变，reduced-motion 高优先级规则仍保留。

没有新增或重写业务逻辑，没有修改 `<script setup>`、支付、服务端、数据库或图片尺寸。`ProfileFlow.vue` 整文件与 ccd66a8 相同，R16 `person && $event.stopPropagation()`、R17 `@keydown.esc.capture` 和 R18 `['likes','gallery','archive','remove','crop']` 精确保留。所有生产差异和 script SHA256、A5扫描见 [architecture.json](r19-audit/architecture.json)。

## 效果逐项

| 原型项 | 当前结果与依据 |
|---|---|
| sheet-in .3s ease-out，opacity 0 / translateY(30px) → opacity 1 / none | 六态中的普通sheet计算样式核对，共享 keyframes源码一致；入场可捕获动画时同时记录浏览器 keyframes |
| payment-dialog .22s ease-out，同一关键帧 | 修复前专项实测 .3s并失败；补组件限定规则后重新验证；删除确认无新增独立效果 |
| primary按压scale(.96)，round关闭按压scale(.94) | 删除按钮真实鼠标按下采样为matrix(.96,0,0,.96,0,0)；关闭共用规则源码核对，未称全部按钮实测 |
| 选择类型/可见范围立即操作，无特定tween | fixture请求、面板关闭及重开选中状态实测；未添加原型没有的选择动画 |
| veil 与离场 | 原型关闭同步隐藏；产品共享规则取消旧d5-sheet opacity过渡，计算transition为0s；未另添淡出 |
| 错误toast 2700ms | 未通过。原型文案 This photo could not be opened or saved. Try another one. / Choose a photo smaller than 20 MB.，当前为接口/校验常驻 alert，未改脚本 |
| reduced motion | 共享reduce规则源码保留；未单独浏览器验收，不据此声称无障碍全通过 |

## 滑动、文案、规格待确认

1. **尺寸冲突保留**：计划备注327×480，本地 JSON `11:555 Image (Life)`为309×480。本轮只读取节点和浏览器测量，见 [figma-current.json](r19-audit/figma-current.json)；没有改尺寸、补327图或生成假大图。请 Smith 确认规格。
2. **文件行为**：原型接受image/*、20MB上限，先解码并缩到最长1600px、转JPEG .88；产品支持PNG/JPEG/WebP且>=10MB拒绝，直接上传原文件。本轮实际验证非图片与10MB拒绝；20MB、压缩、损坏图片解码差异来自源码，未声称运行这些路径。脚本禁改待Smith。
3. **保存失败与权限**：503仅是fixture。未验真实存储、权限、持久化、重进、并发、真实卡片/点赞/动态。原型visibility继承Profile设置，服务端默认everyone；本轮fixture按服务端，不照搬原型本地演示持久化。八张上限来自现有产品/服务端，原型未定义这个上限。
4. **韩文缺口**：卡片类型/预览caption、菜单type/visibility值、Main photo/Set as main photo、Image card published./Deleted./Retry/校验错误等仍有英文。静态已有双语标题/按钮不等于全页翻译通过；本轮遵守静态不动，保留待办。
5. **取消与焦点**：上传文件取消留类型面板、移除取消关闭整个菜单、关闭后焦点恢复缺失。均如上不宣称原型流程通过。
6. **错误残留**：现有关闭/重开卡片动作不会清空 error；一次可见范围503后关闭，再打开删除确认，旧 Please try again. 仍显示。这是实际连续走查截图内容，没有为主图清空状态或隐藏错误；脚本禁改保留待Smith。
7. **静态现状**：共享base规则将所有cards-panel底对齐，812高删除确认实测y550，而原R19/JSON居中y287；该差异已在指定基线存在，生产CSS未改其位置。本轮静态不动，不能将原截图当作当前几何全通过。
8. **静态遗留**：A2/A3/A4继续未通过；A4等R01/R04素材。主图额外入口是原R19差异，在当前共享overflow约束下位于面板上方且可能被裁切，未为修静态移动它。

## 证据与运行边界

专项 `tests/r19-audit.config.ts` / `tests/r19-audit.spec.ts`，单worker、无重试。四组从同意条款 → fixture登录 → 会话确认 → Profile开始；卡片初始0，上传仓库既有portrait-5.png后，经产品upload/POST生成；八张通过八次UI上传产生。同图重复是明确测试输入，不冒充八个真实用户内容。

每组记录API方法/路径/请求体、界面指标、解码结果、动画、滚动、copy采样和六态Escape，见 `r19-audit/*-walkthrough.json`。未直接设置Vue内部sheet、cards、likes或动态数据。fixture媒体返回实际上传字节，不代表真实媒体服务通过。

保留失败：`walkthrough-baseline.log`为沙箱EPERM；`walkthrough-baseline-local.log`为测试自己reload保留`?auth=consent`导致回到协议页，改成goto('/')后解决，未改产品；`walkthrough-red.log`为四组Escape误关Profile；`confirmation-duration-red.log`为Escape修复后发现确认动画.3s，未改断言凑通过。完整构建与专项最终日志、PNG逐张尺寸/CRC/SHA256和清单见本目录。

原D5与数据库回归未执行，见 [regression-not-run.md](r19-audit/regression-not-run.md)。没有修改原测试或数据库配置。未合入main；推送以git push与远端SHA实测为准。

## 最终验证结果

`VITE_API_BASE_URL=/api npm run build` **退出0**；`npx playwright test -c tests/r19-audit.config.ts` **4 passed (1.8m)，退出0**；`git diff --check`通过。最终日志：[build-final.log](r19-audit/build-final.log)、[walkthrough-final.log](r19-audit/walkthrough-final.log)。

**76张真实PNG**，每组19张；六态、两高度、两语言共24张主图。全部PNG签名、chunk CRC、IDAT解压、375×667或375×812尺寸、SHA256检查通过；每张截图均对应一条真实走查记录。详见 [screenshots.json](r19-audit/screenshots.json)、[evidence-verification.json](r19-audit/evidence-verification.json)、[图片索引](r19-audit/evidence-index.md)、[checks.log](r19-audit/checks.log)。校验器 [verify-evidence.py](r19-audit/verify-evidence.py) 仅读取既有PNG/日志，不能生成图片或业务数据。

四组满卡资料、短屏预览实际wheel scrollTop均大于0，documentY=0；图片309×480。76次document采样均宽375、高等于视口、scrollY=0；面板横向copy采样clipped为空，证据校验明确断言，但未据此声称完整翻译、纵向排版或全静态通过。各组具体scrollTop见evidence-verification.json。

人工抽看667 EN预览/上传失败、667 KO可见范围、812 EN删除确认。所有正常及失败态截图保留实际连续会话的旧error，未做清空/隐藏处理。

按requesting-code-review技能安排只读复核：无Critical/Important；Minor为专项只记录clipped而未断言。当前补充证据校验对四组clipped=[]显式断言并通过。复核未判断全静态、真实后端、完整键盘、浏览器reduced-motion；这些边界在本文列出。最终PNG完整性与最终4/4由本轮执行者独立验证。

Codex usage (root session snapshot before commit, not final billing, excludes reviewer and subsequent finish): input 4,393,824; cached input 4,298,752; output 25,853; total 4,419,677 tokens. See [codex-usage.json](r19-audit/codex-usage.json).
