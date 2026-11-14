# R18 头像验收记录

分支 `codex/r18-avatar`，从 R17 `07f5ec7` 创建。先成功 `git fetch origin`，确认 `origin/codex/r17-profile` 为该提交；未切换、修改或合并 main/其他分支。首次沙箱 fetch 因 `.git/FETCH_HEAD` 只读失败，经允许的本机执行成功。

唯一设计来源为 `/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`。没有调用 Figma API、使用 Figma token、重新导出或修改图片。使用现有 1x 图片，真实上传 `portrait-5.png`。

## A1–A8

| 项 | 结果 | 证据与范围 |
|---|---|---|
| A1 构建 | 通过 | [build-acceptance.log](r18/build-acceptance.log)，素材校验、vue-tsc、Vite 完整构建退出0。本轮未复现 scoped 间歇错误。 |
| A2 全量几何 | 未通过 | [geometry.json](r18/geometry.json)：新增专项所测槽位、六态面板、裁剪框/画布、按钮、网格首项均≤1px；尚未逐一断言全部文字、图标、滑块及确认弹层下方背景图库，不能声称全量通过。 |
| A3 全量样式 | 未通过 | 专项断言图库圆角16与标题字号18；颜色/字体/透明度按本地JSON提取，但尚未逐元素完成计算样式断言。共用按钮沿用R05圆角30，JSON按钮圆角24；移除确认下方原图库未复刻；滑块的浏览器渲染与JSON仍有差异。 |
| A4 Figma并排图 | 未通过／待R01/R04 | 未生成Figma并排图，差异比例未计算；没有用原型或JSON自行绘图冒充Figma对照。 |
| A5 架构 | 通过（R18范围） | [architecture.log](r18/architecture.log)、[protection.log](r18/protection.log)。页面/共用样式与本轮组件hex、rgb字面量、important、device前缀为0；旧头像规则已移除。共享弹层、按钮与滑块外观在components.css。受保护ChatFlow基线两行脚本含10个hex匹配，保持原样。 |
| A6 测试 | 未通过 | 新增六态专项1通过，见[tests-acceptance.log](r18/tests-acceptance.log)。原D4为3通过/3失败，基线相同；真实D4复验1失败/1跳过，干净数据基线同一严格定位断言失败。原用例没有全过。 |
| A7 实现截图 | 通过（JSON六态） | 六张375×812截图在[r18](r18/)，同一真实注册账号会话。`avatar-full`按29:15057为槽位已满，非大图查看，详见规格冲突。大图查看未生成截图。 |
| A8 诚实记录 | 通过 | 本文保留失败、未覆盖范围与规格冲突；没有伪造数据、截图、通过项或差异比例。 |

## 测量与差距

先提取六棵节点树，再修改模板/CSS。完整逐元素位置、尺寸、文本字体、圆角见[measurements.md](r18/measurements.md)；六份`29-*.json`保留原始fills/strokes、透明度、effects、layout/padding/spacing等数据。[colors.json](r18/colors.json)为全部实色出现次数与节点。下面旧实现是源代码对照，不冒充浏览器测量。

| 状态/元素 | JSON目标 x/y/w/h | 基线差距 | 本轮处理/剩余 |
|---|---|---|---|
| 资料头像槽位 | 143.5/152/88/88；图148.5/157/88/88 | R17已符合槽位几何 | 保留，新增断言；Avatar通用组件只把圆角改用token，默认48不影响其他用途 |
| gallery 29:14185 | 面板12/442.5/351/345.5，圆角24；标题y475.5 | 原全宽底部面板、padding26/22/36、圆角26 | 共用sheet变体，页面只定位和布局；面板实测一致 |
| 图库网格 | 首外框33/527.5/66.75/66.75；列距80.75，gap14；次行y608.25 | 原grid 1fr、gap12、流式margin | 固定4列、gap14。普通图64.75（计划64.8为四舍五入）；选中图因2px边框为62.75，保留JSON区别 |
| 上传空槽 | 66.75方框、圆角16、虚线；相机24，文字9/13 | 原普通实线框、字符▣、字8 | 现有muted-24相机图片与精确token；韩文保留既有翻译 |
| remove 29:14411 | 确认24/277/327/258，圆角28；标题y314/22/28，说明y354/12/20；按钮49/418/277/48 | 原底部sheet内流式标题/按钮 | 改居中共用dialog；原返回、确认、取消动作和aria保留；下方图库未复制，属于剩余差距 |
| removed 29:14651 | 面板12/378.5/351/409.5；网格y463.5；上传y655，最近移除y716 | 原面板高度随流式内容变化 | 用archive存在选择对应高度与按钮位置，真实移除后截图 |
| restore 29:14880 | 面板12/487.25/351/300.75；说明33/568.25；图框33/608.25/66.75/66.75；Back33/719/309/48 | 原宽图块、普通文字返回行 | 固定图框和恢复面板，Back用共享次按钮 |
| full 29:15057 | 与gallery同面板，8个槽位占满，上传禁用 | 旧网格尺寸/面板不符 | 真实上传8张现有文件，不注入假profile数据；验证禁用 |
| crop 29:15279 | 面板12/270/351/518；遮罩75.5/351/224/224；内部画布76.5/352/320/320；Zoom33/599；按钮33/719/309/48 | 原画布宽100%、圆形320；面板流式布局 | 224圆形窗口裁切320画布，不改draw/upload逻辑；原缩放控制保留，共用range变体；按钮实测一致 |
| 额外大图样式 | 用户备注309×309 | 六个指定JSON节点没有大图查看稿 | 保留既有photo分支，自己资料范围设置309×309，未造出新入口或改变脚本；无对应状态截图/像素验收 |

规格冲突：本地`29:15057`名称为 **avatar-full · 头像 / 槽位已满**，内容是8槽图库，并非用户清单括号中的“大图查看”。遵守唯一设计来源与不改业务逻辑，本轮按JSON验收满槽；大图状态的设计节点需要Smith确认。六张截图不能被解释为“大图查看也已验收”。

## 改动与保护

- `ProfileFlow.vue`只改头像模板结构、class和共用控件类；脚本与`07f5ec7`逐字节一致。原id、data属性、aria-label与事件处理保留，无新业务文案，复用已有英文/韩文翻译。
- 所有R18页面规则补入`styles/pages/profile.css`；删除`avatar-legacy.css`及import，删除components.css中旧头像sheet变体，重建共享变体。旧styles.css/fidelity.css无R18选择器；无`src/profile.css`。预览页`.preview-content .avatar`不是本模块，保留。
- R17资料/列表规则、R16 person.css、Home/Letters/Inbox/Chat/Auth脚本模板均未修改。首页Diamonds/Filter Pass入口保留。
- Avatar.vue脚本原样，仅将通用圆角改成`var(--radius-full)`。
- 新样式最多页面根类加一层目标选择器；无important和device前缀。保留小屏媒体查询，只改变面板位置。专项抽样验证韩文不横溢出、700px高上传按钮仍可见；不宣称韩文每字/每态已完成全面检查。

## 颜色与token

完整缺色候选及次数/节点在[colors.json](r18/colors.json)；只添加本轮用到的颜色，不用近似色代替。透明度保留JSON原始浮点值（下表hex alpha只用于索引）。

| 值/透明度 | 次数 | 示例节点 | token |
|---|---:|---|---|
| 白/.0430000014603138 | 6 |29:14340|avatar-border|
| #1a2a20 |20|29:14352|avatar-cell|
| 白/.06700000166893005 |16|29:14352|avatar-cell-border|
| #122018 |19|29:14354|avatar-remove-bg|
| #90aa95/.4000000059604645 |19|29:14354|avatar-remove-border|
| #ffa498 |19|29:14356|avatar-remove-text|
| #1a2a20/.30000001192092896 |13|29:14377|avatar-empty-bg|
| #78977b/.5329999923706055 |13|29:14377|avatar-empty-border|
| #93b18d |39|29:14380|avatar-empty-text|
| #bacdb2 |1|29:15447|avatar-copy|
| #99b086 |2|29:14875|avatar-muted|
| 白/.15700000524520874 |6|29:14342|avatar-grabber|
| #b5fa70/.46700000762939453 |1|29:15444|avatar-crop-border|
| #253229→#17221c，0→100% |1|29:14636|avatar-dialog-gradient|

`avatar-surface`复用等值`bg-sheet`；`avatar-track`复用`r07-range-track`。新增头像字体token使用Fredoka，韩文保留GowunDodum优先。移除无引用的avatar-legacy token。

## 账号、测试与失败证据

测试前成功启动真实测试后端3001，创建独立数据库`maugo_client_c2_test_1794643449845`，通过`/__c5/seed {mode:empty}`真实注册Reader，密码SamplePass2026。注册返回会话存于`/tmp/r18-account.json`（不提交），先验证`/profiles/me`成功再跑截图。全程真实登录请求0次，全部测试复用这一注册会话；符合允许“注册账号并复用同一会话”的方式，没有反复登录。原D4的登录为mock，不请求真实登录接口。没有401/429重试。

首次后端命令报`ERR_MODULE_NOT_FOUND: tsx`，见[backend.log](r18/backend.log)；改用`../maugo/node_modules/tsx/dist/loader.mjs`成功。Vite首次沙箱监听报`listen EPERM 127.0.0.1:5173`，见[dev.log](r18/dev.log)；允许的本机执行启动成功，见[dev-local.log](r18/dev-local.log)。未绕过业务接口或修改其他Flow。

新增专项早期因file input匹配3个元素、重复setInputFiles同一文件不触发change、尚在入场动画时测量槽位失败。日志保留为tests.log、tests-final.log、tests-release.log；改成真实filechooser与等待动画结束后，最终[tests-acceptance.log](r18/tests-acceptance.log)通过。清理只涉及本轮隔离测试库本账号的profile_avatars/image_cards测试数据，认证会话未更换。

原`d4.spec.ts`见[d4.log](r18/d4.log)，基线见[baseline-d4.log](r18/baseline-d4.log)，均3通过/3失败，同样失败于保存后Book wanderer、public-follow应可用、公开资料25 · Seoul。mock契约与现有profile API不匹配，未降低断言。

原真实`d4-reverify.spec.ts`见[d4-reverify.log](r18/d4-reverify.log)，1失败/1跳过。失败于第16行`#edit-avatar img`匹配头像和相机两张图。基线初次因同账号残留两张image-card提前严格定位失败，保留[baseline-d4-reverify.log](r18/baseline-d4-reverify.log)；清除本轮测试卡片后[baseline-d4-reverify-clean.log](r18/baseline-d4-reverify-clean.log)在同一第16行失败，确认基线既有。没有改变原测试或R17头像槽位结构去掩盖失败。

基线使用`git archive 07f5ec7`独立副本`/tmp/r18-baseline`、Vite5174与同一测试后端；没有切换其他分支。新增配置提供5173/5174两套回归目标。运行专项：`npx playwright test -c tests/r18.config.ts`；原测试用r18-regression/r18-reverify配置，真实复验需`D4_SHARED_ACCOUNT=/tmp/r18-account.json D4_API_ROOT=http://127.0.0.1:3001`。

## 截图与剩余项

[gallery](r18/avatar-gallery.png)、[remove](r18/avatar-remove.png)、[removed](r18/avatar-removed.png)、[restore](r18/avatar-restore.png)、[full槽位已满](r18/avatar-full.png)、[crop](r18/avatar-crop.png)。均375×812，真实后端、同会话，照片为现有1x文件。

未通过：A2、A3（全量几何/计算样式与上述差距）、A4（待R01/R04）、A6（原测试基线失败）。另待Smith提供大图查看正确节点及后续3x素材，文件路径未改。本任务不能标为全部验收通过。
