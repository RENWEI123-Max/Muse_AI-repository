# R16 用户资料验收结果

本轮**未达到整体验收通过**。分支 `codex/r16-person`，基线 `96ee3bd364b3a84066aab8b3b6e7b6b93eb40ca7`（fetch 后确认等于 origin/codex/r15-auth）。没有合入 main，没有修改其他分支。

唯一设计来源为 `/root/maugo-figma/maugo-file-full.json`，指定版本 `2421258509127695554`。没有调用 Figma API、图片接口或 token；没有重导/修改图片，仍使用现有 1x 素材。

## A1–A8

| 项目 | 结果 | 证据与限制 |
|---|---|---|
| A1 构建 | **未通过（不稳定）** | 素材校验与vue-tsc通过，前序多次完整构建曾退出0；但最终复核出现间歇性Vite外部样式错误`reply.css`读取`scoped`失败（退出1），无法作为稳定构建交付。[最近构建](r16/build.log)、[完整失败日志](r16/build-intermittent-failure.log)。96ee3bd副本两次构建均通过，**未证明此构建错误是基线既有**：[首次基线](r16/baseline-build.log)、[复跑](r16/baseline-build-repeat.log)。恢复既有`[lang=ko]`写法后的最近重跑退出0，但仍保留“不稳定／未通过”，不隐藏间歇失败。其他Flow禁止修改，未改动它们绕过错误。 |
| A2 几何 | **未通过** | 六态隔离测试的已覆盖关键框 ≤1px；[测量记录](r16/isolated/)。但缺少真实会话实测；性别、卡片类型/点赞、动态元信息等设计元素的数据未提供，不能声称每个关键元素全部一致。 |
| A3 样式 | **未通过** | 隔离测试核对Fredoka、20px/550昵称、关注按钮底色/文字色/24px圆角、禁用0.5透明度；韩文与小屏见专项。未完成全元素真实会话计算样式验收，且缺少设计中的数据元素，不能标全过。 |
| A4 Figma并排图 | **未通过／待 R01/R04** | 未生成真实 Figma 对照图；六态差异比例均未计算。没有拿原型/隔离fixture渲染图冒充Figma。 |
| A5 架构 | **未通过** | R16页面及共享CSS无hex/rgb字面量、无!important、无.device前缀，公共按钮/弹层外观复用共享类；公开资料旧规则已移除/排除。全局扫描仍命中受保护的ChatFlow.vue基线脚本两行hex，按禁止修改其他Flow的要求未改。[架构检查](r16/architecture.json)、[基线同源证明](r16/baseline-architecture.txt)。 |
| A6 测试 | **未通过** | 新增六态隔离专项6/6通过；原有D4六项合计3通过3失败，三项失败均在96ee3bd副本复现。唯一实际种子登录返回401 Invalid email or password，未重试，因此真实会话资料/关注/举报/拉黑回归未完成。[专项](r16/isolated-tests.log)、[公开资料回归](r16/regression-tests.log)、[基线公开资料](r16/baseline-regression-tests.log)、[同组件编辑回归](r16/own-profile-regression.log)、[基线编辑](r16/baseline-own-profile-regression.log)、[登录证据](r16/actual-login.log)。 |
| A7 六态375×812截图 | **未通过：未生成** | 没有成功建立真实登录会话，六张实现截图均未生成。未用fixture截图补数。 |
| A8 诚实 | **通过** | 本表与最终摘要保持一致。隔离测试不冒充真实会话；没有伪造截图、Figma对照或差异比例。环境限制见[记录](r16/environment-notes.md)。 |

## 实现与边界

- `ProfileFlow.vue` 调整公开资料模板、固定底部关注/聊天操作、资料头像、卡片、动态、照片和安全弹层；保留所有原id与aria-label。原来没有R16 data-state，没有删其他data-state。
- `<script setup>` 与基线逐字一致。关注/取关、举报、拉黑、会话与鉴权逻辑不改。HomeFlow / LettersFlow / InboxFlow / ChatFlow / AuthFlow 的文件diff为0；首页Diamonds / Filter Pass行完全未动。
- 新建 `styles/pages/person.css`，唯一scoped style入口。它导入只适用于 `.d4-profile:not(.person-page)` 的旧R17/R18样式，保留“我的资料”和头像编辑；旧公开资料 `d4-public-actions` / `d4-cards` 规则已删除，fidelity中公共资料的泛用覆盖明确排除person-page。旧文件中仍存在**仅作用于R17/R18**的profile-hero等选择器，不将其误称为整个ProfileFlow已全部重做。
- 共享控件新增opt-in变体在components.css：40×40页头图标、92×92头像、关注/聊天按钮、139×184卡片、327×260动态图片、安全选项。页面只定位控件，控件外观在共享文件维护。
- 照片/安全复用ui-sheet与ui-scrim，底部24px，351px宽；图标按钮复用ui-icon-button。新增显示文案Photo、Report or block及安全说明，复用i18n中已存在的英韩译文，不新增未翻译字符串。
- 媒体查询仅调位置，不缩放图片。韩文仍优先GowunDodum。

## 先量：逐元素证据与差距

[完整逐元素JSON](r16/figma-measurements.json)保留六个画框的所有子节点及相对375×812画框的x/y/width/height、fills/strokes/effects、cornerRadius、文字字体与行高、布局间距/内边距。它在实施前由本地JSON提取。可在仓库根运行 `python3 client/docs/ui-redo/r16/measure.py` 重提；`python3 client/docs/ui-redo/r16/audit.py` 重跑架构审计。隐藏主页底图及透明热点也保留在证据中，**没有当作公开资料可见元素实现**。

下表“原实现”是96ee3bd源CSS/模板对照值，**不是基线浏览器boundingBox实测**；实施后的浏览器数值是隔离D4固定数据，不冒充真实种子会话。昵称、年龄、城市、bio、图片及动态始终来自现有业务数据；多行bio按内容流式增高，不截断/删除真实内容来强凑样例坐标。

| 元素 / 节点 | Figma x,y,w,h / 样式 | 原实现差距 | 本轮 |
|---|---|---|---|
| 页头 29:12928 | 0,48,375,64；无标题 | 原header有Profile标题与下边框 | 去公开资料标题及边框；图标40×40 |
| 返回 / 更多 29:12929 / 12933 | 16,60,40,40 / 319,60,40,40 | fidelity强制32×40 | 共享变体按JSON定位；•••为20px |
| 头像 29:12938 | 141.5,134,92,92，r46 | 88×88、2px描边、流式居中 | 92×92、无描边 |
| 昵称 29:12940/12942 | 24,242,327,28；Fredoka550 20/28，字距−.3 | h2 17px/500 | 名称框对齐；性别见下节限制 |
| 资料行 29:12945/12946 | 行框24,270,327,27；文字y279，12/18，#899D91 | 11/18及旧近似色 | 使用原值token；真实age/zodiac/city保留 |
| 主页卡片 29:12947/12948 | 容器24,327,327,190；每张139×184，gap12，r15 | 136×180、r14、min-height140 | 框与图片对齐；类型/点赞元信息未实现，避免伪造 |
| 等待卡片 29:13060/13069 | 无资料行时卡片y309 | 旧模板空p及固定padding没有对齐 | 无资料行时尾间距39，y309；不按状态隐去现有资料 |
| 动态标题 29:12961/13077 | y543 / 等待y525；14px/550、17px行高 | 原h2 17/500 | 按JSON；空态文字y600 / 582 |
| 动态正文/图 29:12967/12969 | 正文y605.5 14/23；图24,642.5,327,260，r18 | 卡片padding16、底色#233729、图片自动高度 | 内容流式；关键框断言覆盖；不伪造Sample moment标签/点赞 |
| 无内容 29:13254/13313 | 一张139×184资料卡，文字y600、11/21、#55734D | 原空文案padding70 | 按JSON；**JSON没有空状态插画**，没有猜测新增 |
| 等待说明 29:13082/13315 | y621 / 639，10/21，#7F9284 | 原12px说明在操作区 | 放回内容流，保留解锁条件 |
| 操作区 29:12978 | 0,712,375,74，左右24、顶18、gap12 | 原margin-top60，随内容滚动 | 移至内容区外固定定位、底部渐变 |
| 关注/已关注 29:12979/13210 | 24,730,171.5,48，r24；#26312B / #CAE4B5；无描边 | 原d4-row全宽、下划线 | ui-button变体；两态底色相同，仅文案不同，等待opacity.5 |
| Chat 29:12981 | 207.5,730,143.5,48，r24、既有主渐变 | 原全宽primary、margin-top16 | ui-button共享变体 |
| 照片弹层 29:13484 | 12,350.5,351,437.5，r24、阴影/边框复用 | 原全宽r26、blur5、88%max-height | ui-sheet布局对齐；Photo标题；关闭按钮置于标题上层 |
| 大图 29:13493 | 33,431.5,309,309 | 原width100%、max-height65vh | 固定309×309、contain；不伪造缺失的Portrait类型caption |
| 安全弹层 29:13621 | 12,490,351,298；标题y523 | 原全宽、标题Keep your little corner safe | 复用标准sheet；Report or block及说明 |
| 举报 / 屏蔽 29:13633/13641 | 33,607,309,74 / 33,693,309,74；r14；#213025 | 原两条纯文字d4-row | 复用ui-safety-option，原flag1x图标和两行英韩说明 |

## 六态测量覆盖

### person-profile / 29:12899

| 关键元素 | 隔离实测 x / y / width / height |
|---|---|
| `.person-header` | 0 / 48 / 375 / 64 |
| `#page-back` | 16 / 60 / 40 / 40 |
| `#public-more` | 319 / 60 / 40 / 40 |
| `#public-avatar` | 141.5 / 134 / 92 / 92 |
| `.person-name` | 24 / 242 / 327 / 28 |
| `.person-cards` | 24 / 327 / 327 / 190 |
| `.person-moments-title` | 24 / 543 / 327 / 17 |
| `#public-follow` | 24 / 730 / 171.5 / 48 |
| `#public-chat` | 207.5 / 730 / 143.5 / 48 |
| `.person-moment-text` | 24 / 605.5 / 327 / 23 |
| `.ui-person-moment-photo` | 24 / 642.5 / 327 / 260 |

真实会话截图：**未生成**。Figma并排图：**未生成**。像素差异比例：**未计算／待R01/R04**。

### person-waiting / 29:13023

| 关键元素 | 隔离实测 x / y / width / height |
|---|---|
| `.person-header` | 0 / 48 / 375 / 64 |
| `#page-back` | 16 / 60 / 40 / 40 |
| `#public-more` | 319 / 60 / 40 / 40 |
| `#public-avatar` | 141.5 / 134 / 92 / 92 |
| `.person-name` | 24 / 242 / 327 / 28 |
| `.person-cards` | 24 / 309 / 327 / 190 |
| `.person-moments-title` | 24 / 525 / 327 / 17 |
| `#public-follow` | 24 / 730 / 171.5 / 48 |
| `#public-chat` | 207.5 / 730 / 143.5 / 48 |
| `.person-empty` | 24 / 582 / 327 / 21 |
| `.person-unlock` | 24 / 621 / 327 / 21 |

真实会话截图：**未生成**。Figma并排图：**未生成**。像素差异比例：**未计算／待R01/R04**。

### person-followed / 29:13130

| 关键元素 | 隔离实测 x / y / width / height |
|---|---|
| `.person-header` | 0 / 48 / 375 / 64 |
| `#page-back` | 16 / 60 / 40 / 40 |
| `#public-more` | 319 / 60 / 40 / 40 |
| `#public-avatar` | 141.5 / 134 / 92 / 92 |
| `.person-name` | 24 / 242 / 327 / 28 |
| `.person-cards` | 24 / 327 / 327 / 190 |
| `.person-moments-title` | 24 / 543 / 327 / 17 |
| `#public-follow` | 24 / 730 / 171.5 / 48 |
| `#public-chat` | 207.5 / 730 / 143.5 / 48 |
| `.person-moment-text` | 24 / 605.5 / 327 / 23 |
| `.ui-person-moment-photo` | 24 / 642.5 / 327 / 260 |

真实会话截图：**未生成**。Figma并排图：**未生成**。像素差异比例：**未计算／待R01/R04**。

### person-no-content / 29:13254

| 关键元素 | 隔离实测 x / y / width / height |
|---|---|
| `.person-header` | 0 / 48 / 375 / 64 |
| `#page-back` | 16 / 60 / 40 / 40 |
| `#public-more` | 319 / 60 / 40 / 40 |
| `#public-avatar` | 141.5 / 134 / 92 / 92 |
| `.person-name` | 24 / 242 / 327 / 28 |
| `.person-cards` | 24 / 327 / 327 / 190 |
| `.person-moments-title` | 24 / 543 / 327 / 17 |
| `#public-follow` | 24 / 730 / 171.5 / 48 |
| `#public-chat` | 207.5 / 730 / 143.5 / 48 |
| `.person-empty` | 24 / 600 / 327 / 21 |
| `.person-unlock` | 24 / 639 / 327 / 21 |

真实会话截图：**未生成**。Figma并排图：**未生成**。像素差异比例：**未计算／待R01/R04**。

### person-photo / 29:13363

| 关键元素 | 隔离实测 x / y / width / height |
|---|---|
| `.person-header` | 0 / 48 / 375 / 64 |
| `#page-back` | 16 / 60 / 40 / 40 |
| `#public-more` | 319 / 60 / 40 / 40 |
| `#public-avatar` | 141.5 / 134 / 92 / 92 |
| `.person-name` | 24 / 242 / 327 / 28 |
| `.person-cards` | 24 / 327 / 327 / 190 |
| `.person-moments-title` | 24 / 543 / 327 / 17 |
| `#public-follow` | 24 / 730 / 171.5 / 48 |
| `#public-chat` | 207.5 / 730 / 143.5 / 48 |
| `.person-moment-text` | 24 / 605.5 / 327 / 23 |
| `.ui-person-moment-photo` | 24 / 642.5 / 327 / 260 |
| `.person-sheet` | 12 / 350.5 / 351 / 437.5 |
| `.person-photo` | 33 / 431.5 / 309 / 309 |

真实会话截图：**未生成**。Figma并排图：**未生成**。像素差异比例：**未计算／待R01/R04**。

### person-safety / 29:13500

| 关键元素 | 隔离实测 x / y / width / height |
|---|---|
| `.person-header` | 0 / 48 / 375 / 64 |
| `#page-back` | 16 / 60 / 40 / 40 |
| `#public-more` | 319 / 60 / 40 / 40 |
| `#public-avatar` | 141.5 / 134 / 92 / 92 |
| `.person-name` | 24 / 242 / 327 / 28 |
| `.person-cards` | 24 / 327 / 327 / 190 |
| `.person-moments-title` | 24 / 543 / 327 / 17 |
| `#public-follow` | 24 / 730 / 171.5 / 48 |
| `#public-chat` | 207.5 / 730 / 143.5 / 48 |
| `.person-moment-text` | 24 / 605.5 / 327 / 23 |
| `.ui-person-moment-photo` | 24 / 642.5 / 327 / 260 |
| `.person-sheet` | 12 / 490 / 351 / 298 |
| `#safety-report` | 33 / 607 / 309 / 74 |
| `#safety-block` | 33 / 693 / 309 / 74 |

真实会话截图：**未生成**。Figma并排图：**未生成**。像素差异比例：**未计算／待R01/R04**。

## Arial 导入遗留：待 Smith 确认

以下六处由JSON逐项提取，均为昵称后的性别符号，19px/400、28px行高、−.3px字距；按决定准备为Fredoka（`--person-font-gender`），未推测节点。

| 状态 | 节点 | JSON文字/字体 | 本轮处理 |
|---|---|---|---|
| person-profile | 29:12944 | ♀ / Arial | Fredoka；待Smith确认 |
| person-waiting | 29:13068 | ♂ / Arial | Fredoka；待Smith确认 |
| person-followed | 29:13175 | ♀ / Arial | Fredoka；待Smith确认 |
| person-no-content | 29:13299 | ♂ / Arial | Fredoka；待Smith确认 |
| person-photo | 29:13408 | ♀ / Arial | Fredoka；待Smith确认 |
| person-safety | 29:13545 | ♀ / Arial | Fredoka；待Smith确认 |

现有`ServerProfile`及`maugo/src/profiles.ts`返回值没有gender。模板只在上游真实提供female/male字段时显示对应符号，不按姓名、头像或Figma样例猜性别。因此当前真实数据缺失时不显示符号，是A2/A3未通过的一项原因；没有为此改脚本/接口。

## 缺失色清单与 token

完整审计：[colors.json](r16/colors.json)。统计口径为六棵节点树中实色fills/strokes（含透明热点与隐藏底图），33个不同值，当前基线缺18个；这是本轮精确口径，不把计划中的57%硬套为统计结果。主渐变/弹层阴影复用既有精确token，新增操作区渐变单列在tokens.css（29:12978，6次）。没有用近似token替换缺色。以下18项均已补入tokens.css注释，标注原值、次数、节点。

| 值 | 次数 | 示例节点 | 新token |
|---|---|---|---|
| `#171C1C` | 12 | 29:12925 | `--person-paint-6` |
| `#E0EADA` | 12 | 29:12932 | `--person-paint-8` |
| `#213126` | 6 | 29:12938 | `--person-paint-9` |
| `#DD8ABB` | 4 | 29:12944 | `--person-paint-10` |
| `#899D91` | 5 | 29:12946 | `--person-paint-11` |
| `#1E2A23` | 14 | 29:12948 | `--person-paint-12` |
| `rgb(6 17 11 / 0.667)` | 10 | 29:12950 | `--person-paint-13` |
| `#819387` | 4 | 29:12965 | `--person-paint-14` |
| `#A9B8AE` | 8 | 29:12973 | `--person-paint-15` |
| `#7F9284` | 8 | 29:12977 | `--person-paint-16` |
| `#26312B` | 6 | 29:12979 | `--person-paint-17` |
| `rgb(0 0 0 / 0.001)` | 22 | 46:3145 | `--person-paint-20` |
| `#7BD3F2` | 2 | 29:13068 | `--person-paint-21` |
| `#55734D` | 2 | 29:13080 | `--person-paint-22` |
| `#A7B5AA` | 1 | 29:13495 | `--person-paint-28` |
| `#213025` | 2 | 29:13633 | `--person-paint-30` |
| `#8FA582` | 2 | 29:13640 | `--person-paint-31` |
| `#C89C8F` | 1 | 29:13643 | `--person-paint-32` |

## 测试与剩余工作

专项命令：`npx playwright test -c tests/r16.config.ts`。6个状态分别验证页头、头像、名称、卡片容器、动态标题、两按钮，补充空文案/解锁说明、动态文字/图片、照片弹层、举报/屏蔽框的boundingBox；读取并断言计算样式。使用375×812；韩文实际切换locale并检查按钮/说明不溢出；小屏700px仅验按钮位置，不做像素对照。

原有公开资料五项：`npx playwright test -c tests/r16-regression.config.ts --grep 'public profile and chat gate|cannot bypass block|public full content|following empty'`。结果3通过2失败；独立96ee3bd副本同样3通过2失败。open失败于资料API fixture没有permissions，follow仍disabled；full-content失败于旧fixture只给conversation.cards/moments，现有逻辑从profile/posts API读数据，因此找不到`25 · Seoul`。waiting、block gate、empty分别通过。

同组件原有编辑/头像项额外单跑，当前及基线均失败在保存Book wanderer后的`#edit-profile`断言；旧mock没有实现新的服务器profile保存契约。合计六项原有测试为3通过3失败。没有修改旧测试降低断言，没有用基线失败冒称全部通过。未跑需要多次真实登录的d4-reverify及其他整站账号测试，避免违反登录约束；真实端到端资料/关注/安全流程仍待验证。

待完成：解决并稳定复验Vue外部样式构建错误；恢复可用的种子会话后跑真实六态测试与截图（仍遵守只登录一次）；Smith确认性别符号六节点，并决定数据缺口后续任务；R01/R04恢复后补六态Figma并排图及差异比例；ChatFlow既有hex由所属模块另行处理。当前六态实现截图均未生成，不提供虚构路径。
