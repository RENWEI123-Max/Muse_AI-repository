# R15 登录与欢迎补查

基线 `8cc7341`；Mac mini `Annas-Mac-mini.local`；分支 `codex/r15-audit`，不合 main。单进程执行；上一轮只读环境已退出，本轮没有另启 Codex、Issue 或外部消息。

## 原型摘录（实现前）

来源：本地 `~/maugo-design/MauGo.html` 内嵌 `auth.js` 与 CSS，逐态操作来自仓库 page-states.json；[来源哈希](r15-audit/sources.json)、[完整 auth.js 摘录](r15-audit/prototype-auth.js.txt)、[CSS 摘录](r15-audit/prototype-auth.css.txt)、[19 态脚本](r15-audit/states.json)、[执行计划](r15-audit/plan.md)。未用 Figma API/token。本地 Figma JSON 只作静态权威，本轮不改静态测量或颜色。

| 状态 | 点哪里 → 去哪里 → 返回/取消 | 原型函数与文案 |
|---|---|---|
| welcome | email/create/Apple → consent；法律 → terms/policy；Explore → home | welcome、start、open、explore；Welcome to MauGo / Continue with email |
| terms-unchecked | 勾选前继续禁用；Not now/页头 → welcome；隐私 → policy → consent | consent；Before you continue / Agree & continue |
| terms-checked | 继续 → pendingTarget（signin/signup/apple）；隐私返回仍是 consent | consent、start；I have read and agree… |
| signin-empty | Create → signup；Forgot → forgot；页头 → welcome | form；Welcome back / Your little corner is waiting for you. |
| signin-filled | 提交成功 → home（实现有 session 确认边界）；Show password 切换可见性 | form、enter；Sign in |
| signin-invalid | 无效邮箱留当前页并报错，可修正后重试 | error；Enter a valid email address. |
| signup-empty | Sign in → signin；Privacy → policy → signup；页头 → welcome | form；Create your account / A kind space starts with a little hello. |
| signup-filled | 表单校验 → verify；原型是本地演示，实际遵循服务端 | form；Create account |
| signup-mismatch | 留 signup；错误在长表单底部，容器滚动可达 | error；Passwords do not match. |
| verify-empty | 验证 → signup 成功 home / recovery 成功 password；页头/换邮箱 → signup 或 forgot | verify、codePurpose；Verify your email / Password recovery |
| verify-error | 原型非 123456 报错留当前页；实现由服务端判码 | verify、error；原型 Enter the 6-digit preview code shown above. 不搬假码逻辑 |
| verify-resend | 重发 → 60 秒禁用，间隔 1000ms 更新；本轮不触发、不截图 | verify；Resend code (60s)；原型 Preview code refreshed. No email was sent. 不搬假回执 |
| forgot-empty | 无效邮箱留页；有效邮箱 → recovery verify；页头 → welcome；Back to sign in → signin | form；Enter your email to preview password recovery. 实现用真实语义 |
| recovery-code | 页头/换邮箱 → forgot；验证成功 → password | verify |
| new-password | 页头/Back to sign in → signin；有效重设原型回 signin，真实重设不执行 | form；Choose a new password |
| new-password-error | 密码不一致留 password；滚动查看错误 | error；Passwords do not match. |
| apple-private | 隐藏选项选中；share → apple-share；页头/Cancel → welcome | apple；Hide my email；不搬示例身份、不调用 Apple |
| apple-share | 共享选项选中；hide → apple-private；Cancel → welcome | apple；Share my email |
| auth-privacy | 页头/Back → returnMode：welcome、consent 或 signup | policy；原型两段本地预览说明；现有法律轮次真实隐私正文保留，冲突待 Smith |

滚动结构：原型 `.auth-panel` 为 height:100% / overflow:auto；欢迎特例 overflow:hidden；`.terms-scroll` height:350px / overflow:auto；长注册表单在 auth 面板滚动，错误显示在表单之后。实现对应 `.auth-flow` 和 `.terms-scroll`，不是 document 滚动。

效果摘录：auth.js `shell/render/open` 直接替换 DOM，CSS 未定义 auth 专属 animation/transition，故页切换即时（0s）；通用主按钮按下 scale(.96)、圆形返回 scale(.94)，无补间；条款复选与 Apple 选项即时切换；重发 60s/1000ms 倒计时禁止执行。共用 sheet-in .3s 不属于本登录页面，不新增 sheet 或杜撰动画。

## 验收结果

**整体未通过／待 Smith。静态沿用通过；流程、效果、滑动与文案均未通过／待 Smith。** 最终 fixture 专项 4 组通过、0 失败，不能等同四项产品验收全通过。真实 PNG 112 张（四组各 28 张），包含每组 18/19 目标态和额外流程步骤；verify-resend 四组均缺图且未执行。

| 验收 | 结论 | 证据与边界 |
|---|---|---|
| 静态 | **通过（沿用，不重新验像素）** | 原 R15 静态作为给定基线；未改尺寸、颜色、字体、图片。生产构建退出 0；四个变更源码文件 hex/important/device 前缀全部 0。[构建](r15-audit/build.log)、[源码核对](r15-audit/source-checks.json)。不表示旧 R15 A2/A3/A4 全元素像素缺口已经解决。 |
| 流程 | **未通过／待 Smith** | 四组实际点击验证来源返回、失败与本地校验、Apple 选项/取消、登录 fixture→session→R06。真实登录/注册/邮件/验证持久化、Apple 授权和真实重设未执行；verify-resend 禁止；以下原型冲突尚在。 |
| 效果 | **未通过／待 Smith** | 所采集 auth 内容/按钮均 animation none、transition 0s；实际按住主按钮 .96、返回 .94；选择/复选即时。重发时序、Escape/focus trap/恢复焦点、原生触感/软键盘与 reduced-motion 未完整验证。 |
| 滑动与文案 | **未通过／待 Smith** | 四组各 27 个 auth 截图的 document 均宽375、高=视口、scrollY0；条款实轮滚动1000px；注册到底337px（667）/192px（812），错误在视口；可见文字宽度探针0溢出。英韩各18目标态都有图，但隐私仍为 pending Smith 占位说明，韩文后端错误未覆盖翻译，不能称“无占位/全无截断”。 |

## 实现及效果核对

生产只改 `AuthFlow.vue` 的导航和 `auth.css` 的欢迎滚动策略：

- 隐私/条款返回记录 UI 来源，不再以 accepted 决定跳向。
- 验证页头返回 signup/forgot；新密码页头返回 signin。
- Apple Cancel 直接回欢迎，不再调用 Apple API；真正 Apple 方法保持原样且本轮不调用。
- `go` 后 nextTick 将 auth-flow 滚动复位；欢迎 overflow:hidden，表单和条款的原容器滚动保持。

`App.vue`、token/account localStorage、API 模块、所有业务认证函数（validEmail/request/sendCode/submit/verify/apple/logout）、翻译/法律正文、共用外壳/样式/token、HomeFlow 与基线逐字一致。[自动比较](r15-audit/source-checks.json)。未修改其他模块、支付或数据库配置。

| 效果 | 原型名称与时长 | 实际与结论 |
|---|---|---|
| auth 页面切换 | shell/render/open 即时，无专属 keyframes，0s | 四组采集 none/0s；沿用外壳关闭旧 page 过渡；未新造动画 |
| 主按钮按下 | 共用 transform scale(.96)，无补间 | 四组实际 pointer down 实测 matrix(.96)，0s；已存在，未重复补 |
| 返回按下 | 共用 round scale(.94)，无补间 | 四组 pointer down 实测 matrix(.94)，0s；已存在 |
| 协议勾选/禁用 | 即时 checked/disabled；0s | 四组真勾选，未勾选继续禁用，勾选可继续；未改控件静态 |
| 显示密码 | change 切换 input type，0s | 四组真勾选/取消，断言 type=text 后还原 |
| Apple 选择 | draw/aria-pressed 即时，0s | 两选项真点，share 断言为 true；无授权请求 |
| auth 滚动 | 原型 auth-panel/terms-scroll overflow:auto；欢迎 hidden | 欢迎锁定，条款/注册实滚；切页复位是本轮补齐 |
| 重发倒计时 | 60s 禁用；setInterval 1000ms | **未执行／待 Smith**。当前实现为250ms轮询 deadline，不据此声称时长完整一致；禁止修改认证业务计时或截图 |
| sheet-in | 共用 .3s ease-out | auth 页没有 sheet；不新增或把其他模块效果算作登录专属 |
| Escape、焦点、reduced motion | 原型 Escape 回欢迎、Tab trap、open 焦点/隐藏恢复；全局 reduced-motion | 专项未测且组件无原型完整键盘约束；**待 Smith** |

## 流程走查与 API fixture 边界

[最终截图走查日志](r15-audit/final-capture.log)：**4 passed，0 failed**，无重试累加。[测试脚本](../../tests/r15-audit.spec.ts)、[独立预览配置](../../tests/r15-audit.config.ts)、[全证据索引](r15-audit/evidence-index.md)、[PNG 签名/尺寸/哈希](r15-audit/screenshots.json)、[滚动及效果汇总](r15-audit/summary.json)。

四组都是从 `/` 欢迎开始点按钮、填字段、提交/取消；未通过 auth 查询参数跳目标态、未注入 Vue 状态、未测试侧写 token。仅语言 localStorage 用于选择 EN/KO。登录成功 fixture 走现有 signedIn 流程，真实导航到 R06 首页 `#open-inbox` 可见；不代表真实服务器登录成功。

请求全由 Playwright `**/api/**` 本地拦截。login 返回401错误/测试成功回执；signup 返回测试账户；code/send 返回 `{sent:false,retryAfter:0}`，**没有邮件成功回执、倒计时或重发点击**。forgot 的传输与恢复验证仅在 fixture 内走到新密码页面，最终仅提交密码不一致校验，未提交有效重设。code/verify 的401/verified fixture 仅验证页面形态，不移植原型固定假码。Apple/logout/reset/password 请求有中止保护，所有最终记录 forbidden=[]、page errors=[]。没有 Mac 后端、真实邮件/Apple/改密/真实登录请求。

逐组流程：welcome→协议未勾选→条款轮滚→勾选→privacy→返回consent→signin空/已填/无效邮箱/fixture401→signup空/填满/显示密码/不一致→滚动到底错误→privacy→返回signup→fixture注册进入verify→错误码→返回signup→signin→forgot邮箱校验→fixture recovery→返回forgot→fixture验证进入password→密码不一致→返回signin→welcome→Apple条款→隐藏/共享→Cancel→welcome隐私返回→terms返回→注册入口Not now→fixture登录session→Meet your letters→R06。

每组 18 个目标态加 9 个 auth 补充步骤和 1 张 R06 边界，共28 PNG；verify-error/new-password-error 为真实滚动查看错误图，signup-mismatch 另附 scrolled 图。没有 verify-resend 图。标准截图可显示长表单的上方；不把视口外内容说成未截断已全验。

## 剩余缺口与冲突

1. **隐私正文占位仍存在**：EN 为 Official privacy policy pending Smith (E2)…Not ready for release；KO 同样说明待正式正文。按既定法律轮次保留，不复制原型“纯本地预览”冒充真实隐私政策。欢迎法律按钮现有 Terms of Service / Privacy Policy 与原型 Terms of Use & EULA / Privacy information 不同。待 Smith 定稿。
2. 条款现有内容含 preview、local storage、no authentication emails 等原型说明；与服务端账户/邮件语义冲突。本轮不动法律共享文案。示例验证码/Apple 示例邮箱也不搬入产品。
3. 原型各表单有 Explore preview，现实现表单没有该按钮；terms 原型还有底部 Back，现只保留页头返回。补这些会新增静态内容，故本轮不擅改，待 Smith。
4. 原型隐私返回 consent 时 render 重新创建未勾选 checkbox；实现保留已勾选状态（尚未点击继续仍保留）。本轮修返回目的地，未改变协议接受业务状态；此细节待 Smith。
5. 原型 signin 直接 enter→home；产品有 session→Meet your letters→R06。保留真实账户业务确认；已验证这一实际边界，待 Smith 确认形态差异。原生 Apple、密码有效重设、真实验证码成功与注册持久化不在此次安全执行范围。
6. fixture 登录401使用 `Invalid email or password.`，现有翻译表无此键，韩文界面显示英文；不能声称全韩文。没有改服务端错误透传业务。文字宽度探针未发现水平溢出，不证明所有原生键盘、垂直裁切和任意服务端长错误均合格。
7. 375×667 欢迎内容 scrollHeight572 / clientHeight555，差17px为末尾 padding 范围；可见主操作/法律/Explore 均在图内，wheel 后 top0。短屏 Apple Cancel 初始位于底部以下，但现有 auth-flow 可滚且实际成功点到；未通过移动静态位置解决。
8. verify-resend 严格未执行／待 Smith，不能凑19/19；其时序和截图由 Smith 在 app 验证。真实找回邮件/改密/Apple未执行。原回归（含 auth-server 与测试数据库）**未执行**，按已知 Mac 无测试数据库的限制未重复启动或修改配置；不是“本轮运行通过”或“本轮再次失败”。

## 验证与历史记录

构建 `cd client && VITE_API_BASE_URL=/api npm run build` 退出0（343资产检查、vue-tsc、vite）；[基线构建](r15-audit/baseline-build.log)、[最终构建](r15-audit/build.log)。`git diff --check` 退出0；[可重算证据脚本](r15-audit/verify-evidence.py) 检查112 PNG签名/尺寸、四组完成记录、源文件约束和业务方法逐字一致。[验证输出](r15-audit/evidence-verification.log)。

初次浏览器沙箱不允许端口监听，随后经授权在本机运行。首个基线脚本 Back 定位歧义（[日志](r15-audit/baseline-walkthrough.log)），修正定位后明确复现隐私返回错误（[红测](r15-audit/baseline-navigation.log)）。实现后首轮因欢迎法律入口名称与 KO 字典定位不完整失败（[日志](r15-audit/walkthrough.log)）；校正测试定位后4组通过（[日志](r15-audit/final-walkthrough.log)），随后人工发现错态截图，加入实际目标标题等待，再完整重采，以 final-capture.log 的4组为唯一最终计数，不累计历史通过数。

分支已本地提交，SHA 由完成汇报给出，避免报告自引用提交哈希。不合 main、不创建 Issue、不发 Telegram。

**推送未完成：自动审批拒绝。** 已直接使用指定 `~/.ssh/id_ed25519_github`，执行对现有 origin `git@github.com:RENWEI123-Max/Muse_AI-repository.git` 的 `codex/r15-audit` 分支推送。审批系统拒绝理由：未从可信用户内容确认该具体 GitHub 目的地的归属及向其披露完整代码、日志、112张截图的授权。拒绝明确禁止绕过；因此未换通道、未重启 Codex 或借其他进程代推。待用户明确批准该具体目的地与完整产物外发后再继续。此为交付阻塞，不改变上述四项验收结论。
