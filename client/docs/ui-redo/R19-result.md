# R19 形象照六态验收

分支 `codex/r19-cards`，从远端已确认的 R18 `23d4c9600f2ffffc973f1e26d40e952d66896b81` 建出。先 fetch（沙箱因 FETCH_HEAD 只读失败，本机获准执行成功），未修改、合并 main 或其他分支。开始时没有 run-r*.py；本轮未启动 runner，也没有并行代理。

唯一设计来源 `/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`。没有调用 Figma API、使用 token、导出图片或修改图片文件。真实上传既有 1x `05-avatars/portrait-5.png`；没有伪造业务数据。

## A1–A8

|项|结果|证据与范围|
|---|---|---|
|A1 构建|通过|完整构建日志见下方最终检查；初次 TS 分支收窄问题已修正。曾复现 reply.css scoped 间歇错误，完整失败保留于 [build-acceptance.log](r19/build-acceptance.log)，独立基线 [baseline-build.log](r19/baseline-build.log) 退出0；当前后续完整构建退出0。没有修改其他 Flow 绕过。|
|A2 全量几何|未通过|[geometry.json](r19/geometry.json) 和专项最终日志：六态面板、类型选项抽样、菜单四行、309×480预览、三项可见范围、删除/取消按钮均≤1px；尚未逐一断言每个文字、图标和背景资料元素，不能声称全量达标。|
|A3 全量样式|未通过|专项已断言面板背景、24圆角、标题18px、选中边框；未完成所有元素计算样式断言。“设为主图”入口因保留业务功能位于菜单上方，JSON没有这行，属于已知视觉差异。|
|A4 并排对照|未通过／待R01/R04|未生成 Figma 并排图，差异比例未计算。没有用 JSON 自绘图或原型渲染冒充 Figma 图。|
|A5 架构全量扫描|未通过|[architecture.log](r19/architecture.log)：cards.css、components.css、base.css 中 hex/rgb、important、device前缀均0；旧文件卡片选择器0。受保护的同组件 R20 动态旧CSS仍有31个hex、9个important，故整个已重做组件扫描不为0。遵守本轮不改动态12态，未迁移或重写它们；不能将全量扫描称为通过。ChatFlow基线脚本hex同样原样保留。|
|A6 测试|通过|最终专项1通过，完整 d5.spec.ts 1通过，见下方最终日志；D5只调整会话/证据准备，所有原业务断言保留，包含动态、权限、持久化、删除与限制。|
|A7 实现截图|通过|六张375×812截图在 [r19](r19/)，下方逐张链接。真实后端、同一注册会话、既有1x图片。|
|A8 诚实记录|通过|本文保留未通过项、初期失败、尺寸冲突与验证范围；无伪造图、差异比例或通过结论。|

## 先量后改：差距表

六棵完整节点树保存在 `r19/11-{7,187,385,562,748,933}.json`，含 fills、strokes、effects、字体、圆角、自动布局和间距；[measurements.txt](r19/measurements.txt) 是全部元素相对375×812画框坐标及字体清单。以下基线差距来自源代码，不冒充实测。

|状态/元素|JSON目标 x/y/w/h|旧实现差距|改动/剩余|
|---|---|---|---|
|card-type 11:7|sheet12/418/351/370，圆角24；标题y451；关闭310/435/44/44|全宽底部sheet，圆角26，流式padding26/24/36，标题16|独立共用sheet变体；grabber169.5/431/36/4|
|类型四行|33/499/309/52，后续y551/603/655；字体14，背景203125，白边透明度.03|原全宽流式列表，宽度随旧sheet；旧边色不同|固定四行；选择事件及原data-card-type不变|
|取消|33/719/309/48；圆角14|原普通row|共用ui-button变体，只在页面定位|
|card-options 11:187|sheet12/462/351/326；标题y495；行33/543/309/56，后续599/655/711|旧标题16、五行流式row，宽/位置/颜色不符|四个Figma菜单行固定；原Set as main photo动作额外保留在菜单上方，未删除逻辑或入口|
|card-preview 11:385|sheet12/179.5/351/608.5；图片33/260.5/309/480；caption y740.5|旧图width100%、max-height65vh、圆角16，无Photo标题|固定309×480、contain、无圆角；现有真实图片不替换；补英文/韩文Photo标题|
|card-change-type 11:562|与type同几何，四类选择|旧流式sheet|共用同布局，原patch逻辑不动|
|card-visibility 11:748|sheet12/494/351/294；三选项33/575/309/56，y643/711；gap12，圆角14|旧普通分隔row，无选中卡边框|共用选择row变体，保留真实visibility判断和patch，选中accent边框；没有杜撰开关|
|card-remove 11:933|底层菜单12/462/351/326；遮罩030805/.79、模糊16直径；确认24/287/327/238，圆角28|旧底部sheet，无底层菜单；标题16|底层用当前卡片type/visibility展示不可交互菜单；确认居中、标题22/28；仍由原remove删除|
|确认按钮|49/408/277/48，圆角24；取消交互热区49/464/277/44|旧全宽primary流式，取消普通row|共用ui-button删除变体和44高文字按钮；取消按JSON交互热区，原可见容器为y456/52|

**尺寸冲突**：计划备注写大图327×480，但 `11:555 Image (Life)` 实际为 **309×480，x33/y260.5**，父Figure也是309宽。本轮按JSON实现，未用327替代。六节点的状态含义与计划名称一致，没有虚构状态。

## 改动与保护

- 新建 `styles/pages/cards.css`，卡片六态及卡片网格规则集中其中；删除 MomentsFlow scoped 中旧card-grid/image-card/upload-card/type-options/preview规则以及 fidelity.css 对应覆盖。[protection.log](r19/protection.log)确认整个script与基线逐字节相同，所有受保护Flow文件逐字节相同。
- shared sheet、dialog、按钮、icon-button、row变体只在components.css；cards.css只定位控件。页面无important、device前缀或颜色字面量；选择器最多根类+目标两级。
- 现有id、data-state、data属性、aria-label、事件动作保留。动态模板和逻辑保留；共用旧按钮/标题reset排除新卡片类，避免覆盖共享控件；原hint字号/颜色保留。
- 新固定文案有英文/韩文双份；ko使用GowunDodum优先。专项抽样检查韩文面板无横溢出、700高取消按钮可见；不声称完成六态全部韩文排版人工验收。
- 保留max-height:740px媒体查询，只调位置，不缩放图片。

## 颜色与token

先提取全部实色出现次数/节点：[colors.json](r19/colors.json)。本轮用值及六态出现次数/至少一个节点：[token-additions.md](r19/token-additions.md)。缺色与等值复用清单：[token-reuse.md](r19/token-reuse.md)。没有用近似token替换：已存在等值色使用别名；新色按JSON原值及透明度补入tokens.css。footer渐变在六态中出现5次，示例11:286；其余次数见清单。字体使用Fredoka，标题18/24；韩文覆盖GowunDodum。

## 账号、环境及失败记录

测试前启动真实隔离后端3069（完整D5原测试硬编码此端口，故本轮不用3001），数据库 `maugo_d5_task75_1794644412030`。先通过真实`/__d5/seed`注册Author及权限测试必需的Viewer，成功验证Author的`/profiles/me`后才运行专项。会话文件`/tmp/r19-account.json`不提交。最终六态及D5复用这对账号的注册token，Author是同一会话；Viewer只用于原D5权限断言。实际/auth/login请求为0，无401/429重试；没有重复实现token持久化。

原d5 helper本来多次真实登录，现改为重用真实注册token恢复会话，并支持D5_SHARED_FIXTURE；所有业务断言保留。原测试verification输出硬编码的stateScreenshots/prototypePassed/prototypeGaps不代表Figma验收，本轮从输出代码与本轮生成的JSON中移除这三个误导字段，改为明确的implementation screenshots标识；没有修改接口回执或断言结果。首次原D5运行独立注册fixture也通过（d5.log），随后同账号复跑因首次fixture的公开动态残留在全局/posts列表造成第59行失败（d5-acceptance.log）。清理**本轮新建隔离库**的user_posts/image_cards，保留users与sessions，然后依序跑专项及D5，避免测试污染；未接触生产库。最终证据路径使用D5_EVIDENCE，旧docs/d5文件已恢复基线。

沙箱后端连接报`connect EPERM 127.0.0.1:5432`（backend.log），Vite监听报`listen EPERM 127.0.0.1:5169`（dev.log）；获准本机执行后成功（backend-local.log、dev-local.log）。没有绕过业务接口。

初次构建TS2367来自模板拆分后的类型收窄，保留build.log；修复模板条件后通过vue-tsc。reply.css scoped错误完整保留build-acceptance.log；基线独立副本`/tmp/r19-baseline`用git archive提取23d4c96，构建通过，并未在基线稳定复现。后续当前分支完整构建成功，不能将初次失败隐藏或断言为已确认的基线故障。

专项初期失败tests.log（标题旧reset和关闭按钮被标题挡住）、tests-final.log（取消最小高度52而非44）；均修复后重跑。最终日志及几何证据见下面；失败日志仍保留。

## 截图与最终检查

[类型](r19/card-type.png)、[选项](r19/card-options.png)、[预览](r19/card-preview.png)、[更换类型](r19/card-change-type.png)、[可见范围](r19/card-visibility.png)、[移除](r19/card-remove.png)。均375×812实现截图，不是Figma对照图。

最终构建：[build-final-acceptance.log](r19/build-final-acceptance.log)；六态专项：[tests-complete.log](r19/tests-complete.log)，1通过；完整D5：[d5-release.log](r19/d5-release.log)，1通过。命令分别为 `npm run build`、`npx playwright test -c tests/r19.config.ts`、`D5_SHARED_FIXTURE=/tmp/r19-account.json D5_EVIDENCE=docs/ui-redo/r19/d5 npx playwright test -c tests/r19-regression.config.ts`。未通过项为A2、A3、A4、A5。后续3x图片待Smith提供，原路径未改。
