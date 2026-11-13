# MauGo 客户端还原度重构

日期：2026-11-13。目标画布：375 × 812，DPR 1。

本轮已完成主要流程的表现层修正与截图交付，**尚不能认定为全部验收通过**：客户端没有逐屏复核全部 189 状态；真实数据库测试无法启动；仍有本文列明的视觉与交互差异。请结合截图进行 Claude 还原度审查，不以构建或固定响应测试通过代替视觉验收。

## 审查入口

- [三列截图审查页](gallery.html)：原型 / 重构前 / 重构后，可搜索、过滤，也可查看未验证状态。
- [逐状态覆盖清单](coverage.json)：189 个原型状态及客户端补充状态，明确记录有无客户端截图。
- [指定手机壳原型截图](shell-reference/)：[采集结果](shell-reference/manifest.json)。
- [全状态原型截图](reference/)：[189 状态采集结果](reference/manifest.json)。
- [重构前截图](before/)、[重构后截图](after/)。两边各 62 张 PNG，使用同一固定响应脚本。
- [D11 重构前录屏](before/motion.webm)、[重构后录屏](after/motion.webm)、[浏览器实际动效事件](after/motion.json)。

截图审查页包含 60 项可对照条目，其中 56 项对应原型命名状态，4 项是客户端补充或近似映射。另有重复入口截图用于主要流程顺序阅读。其余 133 个原型状态仅归档参考图，尚未完成客户端逐状态截图验证，不能标记为已修或已通过。

## 依据与方法

已阅读交接包 README、完整项目需求 HTML、思维导图 JSON、开发使用说明、定价配置、交付检查结果及仓库页面状态清单。MauGo 是默认英文、支持韩文的信件式交友应用：最多 200 个字符的单行纯文字开场信；对方回应并完成收取后开放后续聊天；每日免费收取额度用尽后按封确认钻石费用；Filter Pass 解锁年龄与城市筛选。关注、购买或刷新不能绕过聊天许可。

直接用 Playwright/Chromium 打开 `~/maugo-design/MauGo-手机壳交互版-离线.html`，操作首页、筛选、外观、阅读、写信、收信箱、聊天、资料、设置与欢迎/登录，并截图 `#screen`。没有直接读取该 40 MB 文件原文，也没有使用 Figma。

同时在浏览器中打开交接包的全状态离线原型，逐个展开 189 个命名状态，截取 375 × 812 的 iframe。它适合去除手机壳并复现空态、锁定、错误和弹窗。三列审查页以这些方形画布截图为基准；`shell-reference` 单独保留指定手机壳版本的实际渲染，避免混淆来源。手机壳版初始蓝鸟与状态平铺版默认紫鸟来自各自样例偏好，不应据此硬编码用户的信使颜色。

重构前来自当前 HEAD 的临时副本 `/tmp/maugo-fidelity-baseline`，独立构建并预览；重构后来自本 worktree 的生产构建预览。前后均使用 `capture-client.spec.ts` 的固定 API 响应，不需要生产账号。聊天正文、名字、时间、余额、头像及队列与原型样例不完全相同，因此没有声称像素相等，也没有用整图差异百分比作验收结论。支付成功样例不映射成客户端真实支付成功。

## 差距与修复情况

每项的原型与前后图均可点击放大；同一项的其他状态见三列审查页。

| 项 | 原差距与本轮处理 | 状态 | 原型 | 重构前 | 重构后 |
|---|---|---|---|---|---|
| 01 欢迎页安全区 | 原来缺状态栏，顶栏从画布顶部开始；统一 48px 状态区、白色底部指示条 | 已修 | [图](reference/welcome.png) | [图](before/01-welcome.png) | [图](after/01-welcome.png) |
| 02 欢迎页品牌 | Logo 偏左；改为居中 94px，小号语言入口保留右侧 | 已修 | [图](reference/welcome.png) | [图](before/01-welcome.png) | [图](after/01-welcome.png) |
| 03 欢迎页标题与文案 | 标题位置偏高、正文挤占插画；按原型标题/副标题/短正文排列，复用原背景 | 已修 | [图](reference/welcome.png) | [图](before/01-welcome.png) | [图](after/01-welcome.png) |
| 04 Apple 入口 | 缺 Apple 图形；补充矢量图标，统一 48px 按钮与 12px 图文间距 | 已修 | [图](reference/welcome.png) | [图](before/01-welcome.png) | [图](after/01-welcome.png) |
| 05 登录表单 | 标题、返回和输入组位置不一致；统一顶栏、居中说明、48px 输入、12px 标签间距 | 已修 | [图](reference/signin-empty.png) | [图](before/signin-empty.png) | [图](after/signin-empty.png) |
| 06 协议与异常 | 当前法律文本和真实校验消息与演示有差异；保留内容，仅统一字体和页面边距 | 部分修复 | [图](reference/terms-unchecked.png) | [图](before/terms-unchecked.png) | [图](after/terms-unchecked.png) |
| 07 首页顶栏 | 原 Logo 和控件尺寸/位置不一致；Logo 144px，44px 圆按钮，顶部 60px，左右 24px | 已修 | [图](reference/home-ready.png) | [图](before/04-home.png) | [图](after/04-home.png) |
| 08 首页帽子 | 230px 帽子挤占画面；改为 178 × 143，定位 x99/y435，降低光雾强度 | 已修 | [图](reference/home-ready.png) | [图](before/04-home.png) | [图](after/04-home.png) |
| 09 信使大小与标签 | 原鸟过大且有原型没有的姓名标签；缩小并按中心/两侧排布，隐藏视觉标签，保留可访问名称 | 已修 | [图](reference/home-ready.png) | [图](before/04-home.png) | [图](after/04-home.png) |
| 10 光轨与粒子 | 原来只有大号文字星星；补充 SVG 曲线与柔光、降低星点强度 | 部分修复：光轨未复制原型的逐帧物理路径 | [图](reference/home-ready.png) | [图](before/04-home.png) | [图](after/04-home.png) |
| 11 首页操作 | 原来三按钮且 Refresh 只有图标；改为 Refresh / Send a letter 两主操作，48px 高，12px 间距 | 已修 | [图](reference/home-ready.png) | [图](before/04-home.png) | [图](after/04-home.png) |
| 12 首页额外入口 | 钱包/Pass 仍在首页，原型放在资料页；暂保留原入口并降为小号次要入口，避免删除现有功能路径 | 未完全修复 | [图](reference/home-ready.png) | [图](before/04-home.png) | [图](after/04-home.png) |
| 13 筛选弹层 | 原来贴底贴边、标题靠左；改为左右 12px、底部 24px、24px 圆角、居中标题与拖拽提示条 | 已修 | [图](reference/filters-free.png) | [图](before/05-filters.png) | [图](after/05-filters.png) |
| 14 筛选控件 | 原来卡片式性别和大面积锁定遮罩；改为 44px 圆形选择、细滑条、48px 城市选择与小 Pass 标签 | 部分修复：保留真实数据来源说明及额外解锁入口 | [图](reference/filters-free.png) | [图](before/05-filters.png) | [图](after/05-filters.png) |
| 15 外观预览 | 飞行预览和开关占据过多高度；预览 64px、开关行 44px，复用现有鸟和六帧资源 | 已修 | [图](reference/bird-female.png) | [图](before/bird-female.png) | [图](after/bird-female.png) |
| 16 信件面板 | 位置和高度偏离；改为 x12/y144、560px 高、24px 圆角；阅读时隐藏后方帽子和按钮 | 已修 | [图](reference/letter-open.png) | [图](before/06-letter-open.png) | [图](after/06-letter-open.png) |
| 17 信件内容 | 原字号/行距偏大；正文 14px/1.55、气泡 12px 内边距，统一元信息排版 | 部分修复：作者头像仍用现有占位鸟；不把样例人物假装成真实作者 | [图](reference/letter-open.png) | [图](before/06-letter-open.png) | [图](after/06-letter-open.png) |
| 18 写信布局 | 面板和操作按钮混在一起；改为 496px 面板、下方独立 Cancel/Let it fly，隐藏空草稿的重复视觉错误提示 | 部分修复：保留 Recipient ID 与真实校验提示，不能删除现有收件人选择机制 | [图](reference/compose-empty.png) | [图](before/07-compose.png) | [图](after/07-compose.png) |
| 19 底部导航 | 原来加了标签、图形大小不一；首页/收信箱统一 96px 导航区、42px 资源框，隐藏视觉标签 | 已修 | [图](reference/inbox-unread.png) | [图](before/09-inbox.png) | [图](after/09-inbox.png) |
| 20 消息标题 | 原有自增下划线偏离原型；去掉下划线，选中 23px，未选中 19px，20px 间距 | 已修；Following 文案保留现有真实含义 | [图](reference/inbox-unread.png) | [图](before/09-inbox.png) | [图](after/09-inbox.png) |
| 21 聊天背景与消息 | 原默认背景过黑；统一深绿聊天画布、13px 正文、9px 时间、32px 头像，保持自定义气泡变量 | 已修 | [图](reference/chat-open.png) | [图](before/10-chat.png) | [图](after/10-chat.png) |
| 22 聊天输入区 | 原工具行松散、录音仅在右侧；改为 44px 输入/发送，第二行录音胶囊占剩余空间 | 已修 | [图](reference/chat-open.png) | [图](before/10-chat.png) | [图](after/10-chat.png) |
| 23 锁定与解锁 | 锁定、回信到达、收取和可输入状态分别截图；保留原权限判断、组件和转场 | 展示验证通过，真实后端验证受阻 | [图](reference/chat-receipt-waiting.png) | [图](before/chat-receipt-waiting.png) | [图](after/chat-receipt-waiting.png) |
| 24 我的资料 | 原统计、正文和间距过大；统一 88px 头像、18px 名称/数字、9–11px 次级文案；访客改为小胶囊 | 已修 | [图](reference/profile-empty.png) | [图](before/11-profile.png) | [图](after/11-profile.png) |
| 25 形象卡与资料导航 | 原可见范围独占一行；移入标题旁，卡片 144px 高，发布改为浮动加号，补上资料页底部导航 | 已修；顶部仍保留当前返回和页面标题 | [图](reference/profile-empty.png) | [图](before/11-profile.png) | [图](after/11-profile.png) |
| 26 钱包容器 | 原为整页灰背景；改为原型的悬浮圆角面板、顶部提示条、小钻石与余额条 | 已修 | [图](reference/wallet-balance.png) | [图](before/08-wallet.png) | [图](after/08-wallet.png) |
| 27 套餐样式 | 原图标与数字竖排、字号过大；改为图文同行、紫色金额、价格胶囊与 12px 网格间距 | 已修 | [图](reference/wallet-balance.png) | [图](before/08-wallet.png) | [图](after/08-wallet.png) |
| 28 支付交互 | 原型点击套餐进入演示确认，客户端选套餐后显式 Get；保留现有确认和未接入提示，不制造支付成功 | 未完全修复，涉及现有业务流 | [图](reference/topup-confirm.png) | [图](before/topup-confirm.png) | [图](after/topup-confirm.png) |
| 29 设置排版 | 原字号、边距和图标偏大；统一 17px 标题、56px 行、20px 组间距、13px 正文、小号右侧状态 | 已修；退出/注销仍在现有安全页 | [图](reference/settings-home.png) | [图](before/12-settings.png) | [图](after/12-settings.png) |
| 30 字体、资源与韩文 | 复用已存在 Fredoka/GowunDodum 和原型 PNG；补充新增文案的韩文，不新增光栅素材 | 已修；仅截图验证了语言切换页，未穷举韩文所有页面 | [图](reference/language-ko.png) | [图](before/language-ko.png) | [图](after/language-ko.png) |

## 动效与反馈

最终个人页加号对比度另经一次定向检查通过。

本轮保留 D11 的四个关键转场及其状态条件，没有以视觉重构重写发送/收取逻辑。`after/motion.json` 记录真实浏览器的 `animationstart` 和 `transitionrun`：

1. 打开信件：信封飞行动画 440ms；面板 opacity 360ms、transform 440ms，入场延迟 140ms。
2. 写信/发送：写信面板 300ms 入场，发送后的等待状态保持已有动画；有发送后截图和录屏。
3. 收取回信：支付弹层 220ms、回信进入/收取反馈 450ms、条目收缩 300ms。
4. 解锁聊天：等待区/输入区交替的 opacity/transform 450ms；固定响应测试确认收取后输入框可编辑。

按压 scale .96、滑动抽屉、弹层过渡、列表进入和 reduced-motion 分支沿用已有实现。光轨是 SVG 近似表现，不声称复刻了原型的完整鸟飞行物理轨迹；没有执行真实触屏设备、麦克风或支付验证。设置、资料等所有子页的动效尚未逐一与原型录屏对齐。

## 验证

- `npm run build`：通过，包含资源校验、`vue-tsc --noEmit` 和 Vite 构建。[日志](build.log)
- 现有 `ui-polish.spec.ts` 与 `f01-ui.spec.ts`：5/5 通过。覆盖主流程、资料/设置、导航/弹层录屏，以及回信/Pass 的取消补款和返回确认。[日志](existing-ui.log)
- 本轮生产预览视觉/状态验证：12/12 通过。覆盖欢迎、表单、空态、加载失败、举报菜单、外观、收信箱、等待/解锁、资料、英韩切换、通知/缓存确认、钱包、Pass 不足及聊天背景。[日志](capture-after.log)
- HEAD 临时基线同脚本：12/12 通过。[日志](capture-before.log)
- `npx playwright test --reporter=line`：**未执行到测试用例**，启动真实后端测试服务时缺少 `TEST_DATABASE_URL` / `DATABASE_URL`；当前机器未发现 PostgreSQL/Docker。[阻塞日志](database-tests-blocked.log)
- 因此不能给出“所有现有测试无回归”的结论，也不能把固定响应截图当作真实业务、并发、权限或扣费验证。未改后端来绕过数据库要求。

## 修改边界与后续审查

代码修改限于 `client/src`：新建集中样式 `fidelity.css`，调整 App/Home/Profile/Moments/ReplyTopup 的展示模板与图标，增加少量韩文文案。资料页底部消息入口仅连接现有 Inbox 页面；未改变数据请求、接口字段、验证规则、收费规则、聊天许可或后端文件。新增文档、截图和复现工具均在本目录。

尚待：补齐其余 133 个状态的客户端对照；真实数据库回归（含 D11 原始服务端测试）；解决表中部分修复项并重新审查；韩文全流程、短屏、真实触屏/录音与全部转场的逐屏验证。本轮没有声称 375×812 全部页面已经与原型完全一致。

未推送、未创建 GitHub Issue/评论，未提交到远端。

## 复现

在 `client/` 中执行：

```sh
npm ci
npm run build
npx playwright test -c docs/fidelity-refactor/playwright.config.ts
npx playwright test -c docs/fidelity-refactor/existing-ui.config.ts
node docs/fidelity-refactor/capture-reference.mjs
node docs/fidelity-refactor/capture-shell.mjs
node docs/fidelity-refactor/generate-gallery.mjs
```

需要本机 Playwright Chromium，原型路径与本次交接路径一致。Chromium 在受限 macOS 沙箱内因 MachPort 权限无法启动，本次仅为浏览器渲染与本地测试使用了工具的沙箱外执行。脚本不调用真实支付，也不向外部协作服务发送消息。

重构前图片由 HEAD 临时副本运行同一脚本、设置 `UI_SHOT=before` 生成；不要直接在修改后的源码上执行该变量并覆盖本次真实基线。固定响应中的 7 天 Pass 使用交接配置的 150 钻；这只是测试数据，没有更改客户端从 API 获取的实际方案。
