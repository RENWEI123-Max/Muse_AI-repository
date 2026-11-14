# R17 我的资料与列表验收记录

分支 `codex/r17-profile`，基线 `0b79469beeb6dd5d5eb7dedf792ed272abb6a58c`。已先 fetch，远端 `origin/codex/r16-person` 包含该提交；开始时同名本地分支已经位于此基线，工作区干净，因此直接使用，没有改动其他分支或 main。

唯一设计来源 `/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`。未调用 Figma API，未使用 Figma token，未重导或改动图片。使用现有 1x PNG。

## A1–A8

| 项 | 结果 | 证据与限制 |
|---|---|---|
| A1 构建 | 通过 | 最终 `npm run build` 退出 0，见 [build-release.log](r17/build-release.log)。素材校验、vue-tsc、Vite 均执行。首次失败与基线复验另述，不能将失败隐藏为全程稳定。 |
| A2 全量几何 | 未通过 | [geometry.json](r17/geometry.json) 中所测主要框通过 ≤1px 断言；但不是十二态每个元素均通过。主页原有页头和嵌入卡片区域、访客附属字段存在下述缺口，不能将部分断言通过写成整项通过。 |
| A3 全量样式 | 未通过 | 新样式使用精确 token；测试断言输入框底色、空态标题字号。仍有卡片区域、空态兼容状态文字等与 Figma 的差异，完整计算样式断言尚未覆盖全部元素。 |
| A4 Figma 并排图 | 未通过／待 R01/R04 | 未生成 Figma 并排图，未计算差异比例。没有以原型或自行渲染的 JSON 图冒充 Figma 截图。 |
| A5 架构 | 通过（R17 范围） | [architecture.log](r17/architecture.log)：pages/components/base 的 hex、rgb、`!important`、`.device ` 前缀为 0；旧 R17 选择器为 0。R18 原有图库规则独立迁移保留，未重做；受保护 ChatFlow 两行脚本 hex 保留。 |
| A6 测试 | 未通过 | 新增十二态专项 1 个顺序场景通过，见 [tests-release.log](r17/tests-release.log)。原 `d4.spec.ts` 3 通过／3 失败，基线相同；`d4-reverify.spec.ts` 1 失败／1 跳过，基线也失败但失败阶段不同，详见下文。不能声称原有测试全过。 |
| A7 实现截图 | 通过 | 十二张 375×812 实现截图均在 [r17](r17/)。全来自同一真实注册账号会话，非 mock 数据截图。 |
| A8 诚实记录 | 通过 | 本文列出未通过项、完整失败日志、实际认证方式、差距与未测范围；无虚构截图和差异比例。 |

## 测量与差距表

修改前先提取了十二棵节点树。完整逐元素位置、尺寸、字体、实色、描边、圆角、间距、内边距见 [measurements.md](r17/measurements.md)，原始数值保存在同目录十二个状态 JSON。包括隐藏首页底图、矢量与原型点击热点，不能把这些全部当作需要创建的可见 DOM。下面“原实现”取基线 CSS／模板代码，非伪称浏览器实测；最终浏览器实测独立见 geometry.json。

| 状态／节点 | Figma 关键目标（x/y/w/h） | 原实现与差距 | 本轮处理／剩余 |
|---|---|---|---|
| profile-empty `29:13655` | 头像按钮 143.5/152/88/88；图片 148.5/157/88/88；昵称按钮 24/254/327/22；meta y284，bio y317；统计栏 24/357/327/67 | 头像图边框与偏移不同；昵称行高24；meta 11/18，bio 顶距16；统计栏旧流式间距 | 对齐这些框及文字；数据使用真实 Reader，未伪造 Passing breeze／24／Shanghai 或性别；主页保留既有返回与标题，未补不可用钱包数据入口，因此整页仍不同 |
| profile-content `29:13813` | 与空主页相同；形象照标题 y456，卡片 x24/y488/101×144、间距12 | 卡片由既有 MomentsFlow 提供，上传按钮／辅助文案与 Figma 不同 | 调整父级上间距32；真实上传现有 portrait-5.png 生成内容截图；没有修改 MomentsFlow，卡片全量一致性待其所属任务 |
| profile-edit `29:13977` | label y136/240/344/448/552；input x24、w327，y168/272/376/480，h48；textarea y584/h120；Change avatar y744/h48；Save y808/h48 | 旧 label margin16、input 顶距8／padding14、textarea h100；按钮不使用共用类 | 表单行与框按测量值重排，按钮使用 ui-button，输入框使用 ui-input；保存按钮按稿位于首屏下方，通过滚动可用 |
| profile-invalid `29:14080` | 表单同上；提示 28/646.5/319/40.5，字 12/18，圆角16 | 旧错误是页头下普通红字，挤动布局 | 提示不挤动表单，使用原有 role=alert 和原始业务错误文案 |
| profile-likes `29:15456` | dialog 24/259/327/294，圆角28；标题 y296，22/28；两行文字 y352/428，13/20；按钮 49/488/277/48 | 原为底部普通 sheet，额外总数行 | 使用共用 ui-dialog、ui-button；保留原总数 DOM 但隐藏，post/card 数据仍来自 stats。框通过实测；不声称内文全部计算样式已断言 |
| following-empty `29:15641` | tabs 24/136/327/48；按钮28/140/155.5/40；插画131.5/248/112/112；标题32/380/311/22；说明 y414 | 原只有文字，没有标签栏与插画 | 新增双标签栏与现有 female-4 插画，112×112；保留原“No following yet.”状态文字用于原有语义／测试，但它是 Figma 外的可见差异 |
| following-list `29:15731` | 首行24/208/327/85，次行 y293；头像24/224/52/52；昵称88/240.5，16/550 | 原只有普通文字行及箭头，无头像 | 增加真实已有头像或现有占位图；共用列表行，行框通过测量；API 没有可用头像时不伪造样例照片 |
| followers-empty `29:15827` | 与 following-empty 相同；激活 Followers | 原无标签栏、无插画 | 同上，状态独立截图；仍保留“No followers yet.”兼容状态文案 |
| visitors-empty `29:15917` | 标签栏同上；插画131.5/248/112/112；标题 y380；说明 y414；脚注24/499/327/34 | 原仅两个下划线标签和普通空文案 | 标签／插画布局已改；未添加 Figma 的“本设备保存”脚注，因为当前逻辑实际读取服务器访问记录，该文案与真实行为冲突；需 Smith 决定文案 |
| visitors-outgoing `29:16009` | 最近访问计数 y208；行24/229/327/72；头像24/249/40/40；昵称76/250；资料 y272；时间312/253/39/32 | Connection 仅提供姓名等，load 丢弃 visitedAt，未保留访问次数／性别／城市 | 行与40px头像已布局；没有改变脚本去恢复字段，也未伪造访问时间、次数或资料，因此 A2/A3 不通过 |
| my-letters-empty `29:16105` | 插画131.5/176/112/112；标题32/308/311/22；说明 y342 | 原仅“ No letters yet.”普通文字 | 新增插画、Figma 英文标题及韩文；保留原状态文案，额外文案仍是差异 |
| my-letters `29:16190` | 外容器24/136/327/103.5；内部信件卡24/136/327/87.5；label41/159，10px；正文41/184.5，14/22 | 原普通 d4-moment 背景、padding16、无标签 | 增加信件标签与卡片，底距16；断言内部卡片87.5高度，实际容差≤1px；内容为通过真实 API 寄出的测试信件 |

空态插画始终 112×112；700px 高小屏检查只改位置，不缩放插画。韩文切换后检查标签容器不横溢出；这只是抽样检查，不宣称所有韩文文案均已逐个验证。

## 改动清单与保护范围

- `ProfileFlow.vue` 仅模板和样式入口调整；`<script setup>` 与基线逐字节相同。所有原 id、aria-label、data 属性保留。
- 新建 `styles/pages/profile.css`；R16 的 `person.css` 只移除旧模块 import，其他字节保持原样。
- 删除 `ProfileFlow.legacy-1.css` 中 R17 旧模块，图库、裁切等未重做的 R18 规则迁到 `pages/avatar-legacy.css`，旧外观值 token 化。共享弹层中的原头像控件样式保留在 components.css 的专用变体。
- 删除 fidelity.css 的旧 R17 页头、hero、统计栏及入口覆盖；属于 MomentsFlow 的旧规则保留，不越界清理 R19。
- 共用输入框、标签栏、列表行、图标按钮／头像弹层变体集中于 components.css；新增文案补英文／韩文。
- `HomeFlow.vue`、LettersFlow、InboxFlow、ChatFlow、AuthFlow 均与基线相同，首页 Diamonds／Filter Pass 入口行未触碰。
- 测试 runner 补齐漏掉的018–021迁移；d4-reverify 仅增加可选 API 根地址／共享账号入口，原断言未修改。新增专项及复验配置。

## 缺失色与 token

[colors.json](r17/colors.json) 记录十二棵节点树实色 fills/strokes（含透明度、底图与热点）共71个值，其中24个未在基线找到等值 token。不是所有缺色都需要绘制：本轮实际用到的缺色仅下表4个，其余保留测量记录而不添加无用 token。已有等值 token 均直接复用，不用近似色代替。

| 值 | 次数 | 示例节点 | 新 token |
|---|---|---|---|
| `#263228` | 3 | `29:13885` | `--profile-paint-27` |
| `#203024` | 1 | `29:16229` | `--profile-paint-64` |
| `#8DAE7E` | 1 | `29:16231` | `--profile-paint-66` |
| `#D3E5C9` | 1 | `29:16233` | `--profile-paint-67` |

另有 `--avatar-legacy-*` 为搬迁未重做 R18 规则时保存的原 CSS 值，不冒充 Figma 新测量；字体组与圆形蒙版也集中在 tokens.css。

## 登录、测试库与完整失败记录

1. 沙箱首次启动后端报 `connect EPERM 127.0.0.1:5432`，见 [backend.log](r17/backend.log)；Chromium 报 sandbox socket `Operation not permitted`，见 [tests.log](r17/tests.log)。均通过批准的本机执行绕过，没有将未启动的测试算通过。
2. 启动 `auth-server.mjs` 于3001，使用其真实 `/__c5/seed` 注册账号（Reader，密码 SamplePass2026）。账号已存在后才测试。仅有一次真实登录请求，因 Vite 默认代理到3000返回401，见 [tests-escalated.log](r17/tests-escalated.log)。这是代理错误，不是反复重试密码；没有再次调用登录。
3. 改代理到3001后，以注册返回的 token 检查 `/profiles/me`，实际为500。原 runner 只迁移到017，遗漏019资料统计和021星座字段，补齐018–021后接口恢复。没有改业务后端逻辑。注册 token 保留原样，所有后续真实浏览器操作／刷新复用该一个账号会话。不是12次登录，也不是声称登录成功。凭据与 token 只放 `/tmp/r17-account.json`，不提交。
4. 为重复验收，只清空本轮专用 `maugo_client_c2_test_*` 数据库中的生成内容，保留用户与认证会话，未清理生产库。对端用户仅通过测试 fixture 注册，用于真实关注／访问／信件数据。
5. 新增专项命令：`R17_SHARED_ACCOUNT=/tmp/r17-account.json npx playwright test -c tests/r17.config.ts`。无此变量时新注册一个隔离测试账号，直接复用注册会话，不执行登录循环。测试顺序覆盖十二态并拍图、boundingBox／CSS、韩文标签横向溢出与700px小屏。
6. 原 D4 命令：`npx playwright test -c tests/r17-regression.config.ts`，其登录均由原测试 mock 拦截，无真实登录。本分支 [d4.log](r17/d4.log) 与基线 [baseline-d4.log](r17/baseline-d4.log) 均3通过／3失败：编辑保存未 mock 新 profile 契约；open 状态 fixture 缺 permissions；full-content fixture 只给 conversation.cards/moments，当前实现读取 profile/posts API。
7. 真实复验命令：`D4_SHARED_ACCOUNT=/tmp/r17-account.json D4_API_ROOT=http://127.0.0.1:3001 npx playwright test -c tests/r17-reverify.config.ts`。本分支 [d4-reverify.log](r17/d4-reverify.log) 在头像持久化 `#edit-avatar img` 匹配两张图片而失败，原断言没有降低；离线原型对照因无文件跳过。基线使用相同共享会话适配、同一测试库复跑 [baseline-d4-reverify.log](r17/baseline-d4-reverify.log)，180秒超时，页面停在资料主页、截图仅到 visitors-empty，未复现到同一个头像断言；因此不把具体 strict locator 错误断言为“经基线复跑确认”。原测试集未全过，后续步骤也未验证。

## 构建间歇错误

[build.log](r17/build.log) 首次退出1：`[vite:vue] Cannot read properties of undefined (reading 'scoped')`，文件为 `reply.css?vue&type=style&index=1&src=true&lang.css`，完整堆栈保留。随后在 `git archive 0b79469` 的独立 `/tmp/r17-baseline` 副本运行两次完整构建，均退出0：[baseline-build.log](r17/baseline-build.log)、[baseline-build-2.log](r17/baseline-build-2.log)。不能据此证明首次错误是基线既有。本分支后续完整构建通过，最终日志另存；没有改其他 Flow 绕过错误。间歇错误归因仍待调查。

## 截图与未通过项

十二张实现截图：[profile-empty](r17/profile-empty.png)、[profile-content](r17/profile-content.png)、[profile-edit](r17/profile-edit.png)、[profile-invalid](r17/profile-invalid.png)、[profile-likes](r17/profile-likes.png)、[following-empty](r17/following-empty.png)、[following-list](r17/following-list.png)、[followers-empty](r17/followers-empty.png)、[visitors-empty](r17/visitors-empty.png)、[visitors-outgoing](r17/visitors-outgoing.png)、[my-letters-empty](r17/my-letters-empty.png)、[my-letters](r17/my-letters.png)。均为375×812。

未通过：A2、A3（完整几何／样式与数据和旧卡片区差距）、A4（待R01/R04）、A6（原有两套测试未全过）。需要 Smith 决定数据字段、主页入口和访客脚注文案的后续处理，及所属模块完成卡片区重做。当前任务不能标为十二态全部验收通过。
