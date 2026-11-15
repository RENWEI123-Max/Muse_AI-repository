# R21–R24 fixes 结果（2026-11-15，Mac mini）

执行摘要：**限定修复已完成，四项验收未全过，不能称 R21–R24 整体验收通过。** 静态通过；流程未通过／待 Smith（D7完整通过，D8旧断言失败，仍有原型流程冲突）；效果未通过／待 Smith（220ms与原型300ms不同）；滑动与文案在本单三态浏览器范围通过。未合入 main。

基线 `origin/codex/r25-wrapup` / `6f1d2f8`，分支 `codex/r21-r24-fixes`，已git fetch origin。任务文件 `~/task-r21-r24-fixes.md`存在；主机Annas-Mac-mini.local，当前进程16868即tmux `r21-r24-fixes`内唯一修复批。曾将自身误判为第二轮，读取tmux后纠正，没有另起Codex。后端全程3001、动态独立测试库；前端5271/5278。未碰demo3000、sg-claude、Issue、Telegram、Figma API/token，未使用子agent。

## 五项结果

| 项 | 结果 | 实施与证据 |
| --- | --- | --- |
| 1 缓存高度 | 修复，通过限定尺寸检查 | settings.css只加height:238px；四组均327×238。812屏x24/y287与Figma对应；667屏居中y214.5。原说明/确认按钮不变；英文有20px内部滚动，补中/底图。 |
| 2 General字重 | 修复，通过限定权重检查 | 仅system-font下General标题覆写font-weight:var(--settings-general-title-weight,400)，默认回退400；四组实测400、GowunDodum。字号/字体族/字距不改。 |
| 3 退出说明 | 仅复核，通过F07文案核对 | AccountSecurity.vue英韩说明仍为清当前账号本地草稿/偏好/聊天外观、保留语言/App lock。四组真实会话打开、取消、重开、遮罩关闭及返回；整文件与基线逐字一致。真实确认退出由D7英文用例执行，截图矩阵不反复退出重登。 |
| 4 D8迁移 | harness修复，D8未通过／待Smith | 采用D7的readdir/.sql过滤/sort/逐个应用；当前001–021共21个，含017/019/021，服务成功启动。spec **0通过/1失败**：旧EULA占位断言。断言和法律文本未改。 |
| 5 D7重登PIN | 测试侧竞态修复，完整通过 | B账号退出后补欢迎页可见/AccountSecurity卸载等待，再导航重登。原断言全部保留。完整配置 **2通过/0失败**：十三态用例1项+schema用例1项，不是十三个独立测试。受控延迟对照证实原流程失败、补等待通过。 |

产品只改settings.css两条声明；测试只改D8迁移扫描、D7退出完成等待和可选截图目录。SettingsFlow.vue、AccountSecurity.vue、App.vue全文件及script与基线逐字相同。支付、会话/token、锁、退出清除、删除、反馈和法律文本均未改。[source-checks.json](r21-r24-fixes/source-checks.json)。

## 原型摘录与Figma

读取 `~/maugo-design/MauGo.html` 内嵌 __ATLAS_BUNDLE__ 的HTML/CSS/JS，未只看截图。[原型交互JS摘录](r21-r24-fixes/prototype-excerpts.txt)、[效果CSS摘录](r21-r24-fixes/prototype-effects.txt)。

- cache-confirm：general()中的#clear-cache调用confirm('Clear temporary cache?','Your letters, messages and photos will be kept.',action)。默认主按钮Confirm，Cancel关闭，确认先关闭再执行action。删除分支确为if(false)，仅显示toast。产品仍真实删除maugo-temp-*，说明含account/wallet/permissions；文案/行为冲突保留待Smith。
- general-font：bindToggles()在change时更新systemFont、persist()，并切换screen的system-font类；无专门字体淡入动画。产品沿用现有持久化/类切换，本单只改标题权重。
- signout-confirm：原型主设置#logout调用confirm('Sign out?','Your local letters and messages will be kept for this preview profile.',MauGoAuth.logout,'Sign out')，确认返回欢迎页。产品来自Account & security并使用F07清除说明，旧原型“保留”文本未替换产品说明。
- confirm()使用showPaymentDialog()，取消关闭，确认关闭后执行动作；原型sheet-in .3s ease-out，opacity0→1、translateY30px→none。产品共享ui-dialog实测220ms，差异上报。

本地 `~/maugo-figma/maugo-file-full.json`（相对375×812页面）：

| 节点 | Figma | 本轮实测/处理 |
| --- | --- | --- |
| 35:2349 / 35:2397 payment-dialog | x24/y287/327×238 | 812英韩框完全对应位置和尺寸；文案/按钮保留。 |
| 35:2300 / 35:2331 General | Gowun Dodum 400，17/24，字距−0.3；文字框x160.5/y69.5/54×24 | 权重400、字体族不变。现标题容器x68/y67.5/239×24；未改位置，不能声称全部元素≤1px。 |
| 39:2942 / 39:3077 payment-dialog | x24/y277/327×258 | 仅复核；F07长说明使现英/韩302/282px，未改。 |

## 真实流程走查

[walkthrough.mjs](r21-r24-fixes/walkthrough.mjs) 用真实/auth/signup注册，正常consent→邮箱密码→Sign in→Meet your letters登录一次，后续复用会话。未注入token、mock API、改余额、种子截图账号或伪造Cache数据。矩阵账号与D7既有fixtures分开。[完整状态/文案/尺寸](r21-r24-fixes/walkthrough.json)、[日志](r21-r24-fixes/walkthrough.log)。

下列步骤在375×812/en、375×812/ko、375×667/en、375×667/ko均实际完成：

1. Profile→Settings→Language，点English/한국어，再返回设置并进General。
2. 取消再勾选系统字体，开关选中、GowunDodum生效，标题计算权重400，保存general-font图；切回非系统字体后进缓存确认，使英文缓存图与默认字体参考条件相同。
3. 点Clear temporary cache/임시 캐시 지우기，确认框出现，238px；保存顶部。英文框内滚动20px并补中/底，再回顶部。
4. 点取消，框关闭；再打开并点主确认按钮，回通用页，然后返回设置。未预置待删缓存，不声称测试了有缓存文件时的删除结果。
5. Account & security→Sign out，出现F07说明并截图；Cancel/취소关闭，再打开，点遮罩关闭，点账号返回回设置。双语矩阵复用同一个会话。

四组General/账号正文：812下clientHeight=scrollHeight=700，667下均555；宽375且scrollWidth=clientWidth。根document不滚。英文缓存clientHeight236/scrollHeight256，韩文236/236；只有英文框内部滚动。三态无占位词，英韩说明完整可达，无横向溢出；实际可滚动框有顶部/中部/底部图。未做真人触屏顺滑/触觉验证。

## D7根因与证据

- [原样基线日志](r21-r24-fixes/d7-baseline.log)：1通过/1失败；确在第三次登录后等待#unlock-pin超时，不是schema问题。
- A退出已有欢迎页/卸载等待；B退出仅click便开始export与page.goto。click不等待异步/auth/logout及signedOut完成。过早导航携旧B会话挂载AccountSecurity，A登录只更新仍挂载组件的token，onMounted不会为A重跑锁读取，因此首页无A的PIN。锁键未丢失，不是账号被封/429或选择器变更。
- [诊断日志](r21-r24-fixes/d7-diagnosis.log)显示锁键保留；诊断增加时延后PIN出现，2/2通过。这只用于调查，未把1秒睡眠留作修复。
- [受控延迟对照](r21-r24-fixes/d7-controlled-race.log)、[失败DOM](r21-r24-fixes/d7-controlled-error.md)：仅测试路由延迟第二次真实退出响应500ms。原流程打印pinExpected:true且previousSessionStillPresent:true，稳定复现unlock超时；补等待版本同位置previousSessionStillPresent:false，完整用例通过。对照共1通过/1预期复现失败，不与正式回归混淆。
- 修复只在B确认退出后加欢迎页可见及.account-security数量0的等待，再继续导出/重登；所有原PIN/退出失效/账号隔离/删除断言保留。D7_SCREENSHOT_DIR只隔离截图输出，防覆盖历史证据。
- [正式完整日志](r21-r24-fixes/d7.log)：**2 passed (17.9s)**。完整十三态、后台锁定、错PIN、实际退出失效、账号隔离、取消/错误密码不删除、最终真实删除，以及全迁移profile/letters 200均通过。

[race-before.spec.ts](r21-r24-fixes/race-before.spec.ts)/[race-after.spec.ts](r21-r24-fixes/race-after.spec.ts)为docs下诊断证据，不属于默认D7/D8测试集；延迟未伪造响应正文，未改产品逻辑。

## 效果逐项核对

[运行时effects.json](r21-r24-fixes/effects.json)、[采集脚本](r21-r24-fixes/effects.mjs)。

| 项 | 已有实测 | 缺口 |
| --- | --- | --- |
| 缓存入口按压 | scale约0.960086，transform .16s | 未逐帧验收感知一致性。 |
| 缓存弹层 | opacity0→1/translateY30px→none，220ms | 原型300ms；本地另有Vue .3s过渡声明，但本次只捕获共享动画，不能称完整时序一致。 |
| 系统字体切换 | 实际类/选中状态/字体400生效；开关background .2s | 原型同样直接切字体，无独立字体淡入；不添加动画。设备触觉未验收。 |
| 退出入口/Cancel按压 | scale .96，transform .15s | 完整逐帧/触屏体验未验收。 |
| 退出弹层 | 同样opacity/translateY30px，220ms | 与原型300ms不同；确认退出实际执行在D7，双语矩阵验证取消/遮罩/返回。 |

效果**未通过／待Smith**。effects.json末尾Escape计数是事件后立即采样，可能仍处leave transition，不作为关闭后状态或缺陷结论。没有为本单修改业务或补动画。

## 四项验收

| 验收 | 结果 | 证据与限制 |
| --- | --- | --- |
| 静态 | **通过（本单限定）** | npm run build含资产/vue-tsc/Vite通过；diff --check干净；238px/400四组实测；D8扫描21个且启动成功；3个Vue文件全文及script逐字一致；src CSS除tokens.css外hex=0；settings.css无!important/.device前缀，颜色/渐变/阴影/圆角/字体均var引用（字重400为var回退）。不声称全Figma元素一致。 |
| 流程 | **未通过／待Smith** | 三态12组可达/操作/返回；D7完整2/2；D8已跑0/1，旧EULA断言待定；缓存真实删除vs原型假分支、退出入口/F07说明仍有授权保留冲突。 |
| 效果 | **未通过／待Smith** | 按压及220ms入场存在，但与原型300ms不同；未完整逐帧/真人触屏核对。 |
| 滑动与文案 | **通过（本单三态浏览器范围）** | 双高度英韩根不滚、无水平溢出/目标占位文案；英文缓存内滚20px且中/底图齐，其他正文容纳；既有双语F07/缓存说明完整可达。不扩展为R21/R22全模块通过；触屏顺滑未验证。 |

## R01并排与截图

沿用R21逐像素RGBA不等方法，无蒙版/通过阈值；左R01右本轮812英文实图。[general-font并排](r21-r24-fixes/compare-general-font.png) **3.3908%**；[cache-confirm并排](r21-r24-fixes/compare-cache-confirm.png) **63.2680%**（原64.9376%）。文案/背景/按钮等保留差异仍在，改善不能替代验收。[comparisons.json](r21-r24-fixes/comparisons.json)。

12张目标PNG与4张英文缓存中/底图均为本轮真实浏览器图：

- [812-en-general-font.png](r21-r24-fixes/812-en-general-font.png)
- [812-en-cache-confirm.png](r21-r24-fixes/812-en-cache-confirm.png)
- [812-en-signout-confirm.png](r21-r24-fixes/812-en-signout-confirm.png)
- [812-en-cache-confirm-middle.png](r21-r24-fixes/812-en-cache-confirm-middle.png)
- [812-en-cache-confirm-bottom.png](r21-r24-fixes/812-en-cache-confirm-bottom.png)
- [812-ko-general-font.png](r21-r24-fixes/812-ko-general-font.png)
- [812-ko-cache-confirm.png](r21-r24-fixes/812-ko-cache-confirm.png)
- [812-ko-signout-confirm.png](r21-r24-fixes/812-ko-signout-confirm.png)
- [667-en-general-font.png](r21-r24-fixes/667-en-general-font.png)
- [667-en-cache-confirm.png](r21-r24-fixes/667-en-cache-confirm.png)
- [667-en-signout-confirm.png](r21-r24-fixes/667-en-signout-confirm.png)
- [667-en-cache-confirm-middle.png](r21-r24-fixes/667-en-cache-confirm-middle.png)
- [667-en-cache-confirm-bottom.png](r21-r24-fixes/667-en-cache-confirm-bottom.png)
- [667-ko-general-font.png](r21-r24-fixes/667-ko-general-font.png)
- [667-ko-cache-confirm.png](r21-r24-fixes/667-ko-cache-confirm.png)
- [667-ko-signout-confirm.png](r21-r24-fixes/667-ko-signout-confirm.png)

D7另留15张d7-*.png（含十三态外检查状态）；race-*.png为受控诊断；d7-relogin-diagnostic.png为诊断时延后的解锁证据。均不混作上述目标矩阵。三态双高度双语目标图无缺失；未补造R24六态。

## 原样保留待Smith清单

以下逐字摘录原结果，保留历史语境；历史“未验证”/CSS缺口不代表本轮状态。R21第4项高度子项及第5项字重本轮已修，其他内容不改，原结果文件均未修改。本轮实际结论以上表为准。

### R21

1. 现有主设置没有 Sign out/Delete account 的行为，不能只加可点假按钮；本轮没有新增。
2. 隐私现有实现为服务器全局 profile + 逐 image card 权限；没有原型 online/visits/privacy screen/blocked controls。现有可见范围要求 Save，原型立即保存。保留现有流程、保存按钮、说明和错误信息，无法做到原型294px高 sheet。
3. 现有通知仅 incoming/replies/system 三子项，原型五子项；没有新增虚假的偏好绑定。因此通知内容、组高度与 Figma 不同。
4. 当前缓存说明包括账户、钱包、权限，比原型更长；现有确认按钮为 Clear temporary cache，原型为 Confirm；保留原文与行为，英文弹窗258px，Figma238px。通用页还有设备支持、推荐状态说明，位置不能完全一致。
5. general-font 的 Figma 标题为 Gowun Dodum 400；当前样式保留标题 token 权重500，字体族切换到既有 GowunDodum token，有样式差异。
6. 韩文原有说明与原型措辞不同，保留现有翻译；无新增字符串。

### R22

1. security缺Password recovery，而有额外Lock now和Sign out；账号页没有密码找回，Switch account仍打开退出确认，不能在样式任务中改路由/会话。分组结构与Figma不同。
2. Figma/原型是预览账号和本地注销，产品是服务器账号、真实导出及删除。保留真实说明，不能把服务端删除说成仅清浏览器；因此文案、行高与Figma不完全相同。
3. signout-confirm原型背景是主设置，当前弹层来自账号安全；R21主设置缺退出/删除行为仍未解决。signed-out由现有App.vue退出流程显示，本轮不修改。
4. F07清除规则优先于旧原型“保留”提示；此明确口径冲突在此上报。真实清除隔离性未验证，不能称F07通过。
5. delete-final现有接口要求挑战token和密码，原型没有；保留密码字段和提交，弹窗高度无法等同原型。
6. PIN格式/错误目前为行内alert，原型为toast；PIN sheet仍有Cancel，缺原型右上关闭按钮；锁定弹窗设备说明也不同。现有业务不动，不能称效果一致。
7. 不是所有颜色、字体和摘要背景已与Figma完全相等：例如删除摘要目前使用现有card token，危险按钮沿用现有危险色token；插画容器180×184而原型img180×180，未获得真实渲染测量。不可宣称≤1px。

### R23

1. 请求的 `terms-full 25:19082` 在本地 JSON 不存在；实际同名节点为 `29:19082`，原始发现存 [terms-node-found.json](r23/terms-node-found.json)。未将其默认为已批准替代节点，条款静态验收待 Smith。
2. 原型/Figma 本地保存反馈与现有 `/feedback` 后端提交冲突。保留现有提交调用、2000字限制和服务端结果；未增加伪历史、附件空按钮或假记录。
3. 隐私现行“待正式文本”与原型四段本地存储说明冲突。现行法律内容完全保留；条款 11 节草稿、6 节演示措辞、真实邮箱仍待 Smith。
4. 关于页现有 Version 0.1.0、6 个链接，无 Share；不添加业务分享流程。空态现有“未连接 feed”保留语义并补韩文，与原型文案不同。

### R24

原型为本地模拟加钻/购买，当前为 StoreKit 服务端验证与真实后端扣钻。保留当前全部支付、余额、Pass 请求及会话逻辑，不实现原型假充值。现有筛选入口点击方案直接进入确认，原型先选再 Unlock；现有不足页仍含 disabled 确认按钮与计划摘要，原型为独立短缺文案。现有取消回筛选、成功独立页，也不同于原型恢复原页后 toast。以上需 Smith 确认后续业务任务，不能靠样式完成流程验收。

原结果六态及支付失败原文：

| wallet-balance / topup-success | **未验证／待 Smith**：新账号余额0，浏览器无 StoreKit；没有造余额或伪装充值成功。 |

| pass-confirm / pass-active / pass-extend / pass-success | **未验证／待 Smith**：需要已有真实余额/Pass或扣钻成功；截图走查未执行充值或扣钻。既有回归有独立测试购买，但不挪用为本轮13态真实截图。 |

- [pass-confirmation.log](r24/pass-confirmation.log)：**1 passed / 1 failed**。取消路径、实际独立库购买及累计续期通过；失败重试测试期望同一幂等键，实际 Set(keys).size=2，期望1。未改支付逻辑，也未为凑通过改测试。

待 Smith：实际 StoreKit 链、真实余额和已有Pass账号的6态、支付幂等键失败、D9端口与旧选择器维护、原型流程冲突、全元素≤1px/计算样式核对、逐按钮效果及真人触屏和双语裁切检查。当前仅部分可审查实现，不是13态完成验收。

F02幂等键、StoreKit/余额/Pass六态仍待Smith；未改支付。D8应断言哪些已批准条款、R23反馈历史/附件/分享/法律等范围也继续待Smith，本单不作业务决定。

## 完整测试日志

client目录串行执行：

```sh
D7_SCREENSHOT_DIR=docs/ui-redo/r21-r24-fixes npx playwright test -c tests/d7.config.ts
npx playwright test -c tests/d8.config.ts
npm run build
git diff --check
```

实际配置名为tests/d7.config.ts与tests/d8.config.ts，对应任务中的tests_d7/tests_d8。独立库名由harness时间戳生成，无数据库配置改动。[build.log](r21-r24-fixes/build.log)。测试结束服务已停止。归档文本仅去行尾空白，完整测试内容保留；正文日志去ANSI显示控制符。整理期间系统启动器突然要求Xcode许可，改用已有Command Line Tools实际二进制继续，不接受/更改系统许可。

### D7正式完整日志

```text
[WebServer] (node:17648) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:17649) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:17672) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 2 tests using 1 worker

(node:17674) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 tests/d7.spec.ts:6:1 › D7 thirteen states, real logout/deletion and account isolation (16.2s)
D7 migrated schema /profiles/me 200
D7 migrated schema /letters 200
  ✓  2 tests/d7.spec.ts:34:1 › D7 full migration schema serves profile and letters without 500 (49ms)

  2 passed (17.9s)
```

### D8完整日志（未通过／待Smith）

```text
[WebServer] (node:17942) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:17943) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer] (node:17970) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 1 test using 1 worker

(node:17972) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✘  1 tests/d8.spec.ts:4:1 › D8: fourteen support states with real backend and isolated database (5.3s)


  1) tests/d8.spec.ts:4:1 › D8: fourteen support states with real backend and isolated database ────

    Error: expect(locator).toContainText(expected) failed

    Locator: locator('.terms-document').first()
    Expected substring: "[EULA_PENDING_SMITH]"
    Received string:    "Version 1.0 · 13 October 2026 · Review draft1. About this agreementMauGo provides a space to share letters, messages and moments. These Terms of Use and End User License Agreement govern your use of MauGo. You must be at least 18 and legally able to accept these terms. If you do not agree, do not register, sign in or use account features.2. Your accountUse accurate information, keep your sign-in details secure and do not impersonate others or share access without permission. You are responsible for activity you authorize. Email and Apple are supported sign-in methods in the intended app; this preview only demonstrates their screens.3. Permission to use MauGoMauGo grants a personal, limited, non-exclusive and non-transferable license to use the app under these terms and applicable store rules. Do not resell, unlawfully copy, bypass security, disrupt the service or reverse engineer it except where law permits. MauGo retains rights in its app and brand.4. Content and respectful conductMauGo has zero tolerance for objectionable content or abusive users. Do not post or send harassment, bullying, threats, hate speech, sexual exploitation, illegal sexual content, scams, spam, impersonation, or content that infringes rights. Do not publish private information without permission. These rules apply to letters, chats, profiles, images, recordings, stickers and moments.5. Your content and conversation rulesYou retain ownership of your content and must have permission to share it. You grant MauGo only the rights needed to store, display, transmit and moderate it for the service. One opening text message is permitted per new connection; further chat and attachments unlock after the recipient replies. Do not bypass this limit or repeatedly contact someone who declines or blocks you.6. Reporting, blocking and enforcementUse Report and Block in letter or conversation controls to flag unwanted content and stop contact. In the released service, MauGo may review reports, remove content and restrict or terminate abusive accounts, with notice and review where required by law. This preview saves reports locally; it has no connected moderation team and cannot deliver reports. It is not an emergency service.7. Diamonds and paid featuresIn the intended app, diamonds are purchased in USD through the applicable store and used for features at the displayed price. Diamonds are not money, cannot be cashed out or transferred, and have no value outside MauGo. Filter Pass duration and diamond cost are shown before confirmation; extra days extend expiry and there is no automatic renewal. Store rules and mandatory consumer rights govern refunds. This preview uses test balances and makes no real charge.8. Privacy and permissionsRead Privacy information to understand the current data use. This preview stores account personas, messages and preferences in browser storage and selected media in IndexedDB. It does not send authentication emails or store passwords. File access follows your selection; microphone permission is requested for recording. Clearing local browser data may remove content. Hosting providers may process access logs.9. Availability and your rightsMauGo may change or discontinue features, subject to applicable law and purchased entitlements. You may stop using it and use account settings to export or delete local data. The preview is provided for evaluation without a promise of uninterrupted availability. Nothing in these terms excludes non-excludable warranties, liability or consumer rights under the laws that apply to you.10. Apple distributionFor an app distributed by Apple, this agreement is between you and MauGo. Apple is not responsible for app support, app-related claims or intellectual-property disputes; MauGo is responsible as required by law. If the app fails an applicable warranty, Apple may refund its purchase price under its rules. Apple and its subsidiaries may enforce this agreement as third-party beneficiaries. Use Apple devices you own or control and follow store usage rules, including permitted family access. Comply with applicable export and sanctions restrictions.11. Updates and contactMaterial changes will be shown before requesting renewed agreement. Contact MauGo at maugo.support@example.com. This is a reserved example address for the design preview, not an active support inbox; replace it with the actual MauGo support address before release. Version 1.0 · 13 October 2026. This document is a review draft for the prototype and does not create a real service contract."
    Timeout: 5000ms

    Call log:
      - Expect "toContainText" locator('.terms-document').first() with timeout 5000ms
      - waiting for locator('.terms-document').first()
        14 × locator resolved to <article tabindex="0" class="terms-scroll terms-document">…</article>
           - unexpected value "Version 1.0 · 13 October 2026 · Review draft1. About this agreementMauGo provides a space to share letters, messages and moments. These Terms of Use and End User License Agreement govern your use of MauGo. You must be at least 18 and legally able to accept these terms. If you do not agree, do not register, sign in or use account features.2. Your accountUse accurate information, keep your sign-in details secure and do not impersonate others or share access without permission. You are responsible for activity you authorize. Email and Apple are supported sign-in methods in the intended app; this preview only demonstrates their screens.3. Permission to use MauGoMauGo grants a personal, limited, non-exclusive and non-transferable license to use the app under these terms and applicable store rules. Do not resell, unlawfully copy, bypass security, disrupt the service or reverse engineer it except where law permits. MauGo retains rights in its app and brand.4. Content and respectful conductMauGo has zero tolerance for objectionable content or abusive users. Do not post or send harassment, bullying, threats, hate speech, sexual exploitation, illegal sexual content, scams, spam, impersonation, or content that infringes rights. Do not publish private information without permission. These rules apply to letters, chats, profiles, images, recordings, stickers and moments.5. Your content and conversation rulesYou retain ownership of your content and must have permission to share it. You grant MauGo only the rights needed to store, display, transmit and moderate it for the service. One opening text message is permitted per new connection; further chat and attachments unlock after the recipient replies. Do not bypass this limit or repeatedly contact someone who declines or blocks you.6. Reporting, blocking and enforcementUse Report and Block in letter or conversation controls to flag unwanted content and stop contact. In the released service, MauGo may review reports, remove content and restrict or terminate abusive accounts, with notice and review where required by law. This preview saves reports locally; it has no connected moderation team and cannot deliver reports. It is not an emergency service.7. Diamonds and paid featuresIn the intended app, diamonds are purchased in USD through the applicable store and used for features at the displayed price. Diamonds are not money, cannot be cashed out or transferred, and have no value outside MauGo. Filter Pass duration and diamond cost are shown before confirmation; extra days extend expiry and there is no automatic renewal. Store rules and mandatory consumer rights govern refunds. This preview uses test balances and makes no real charge.8. Privacy and permissionsRead Privacy information to understand the current data use. This preview stores account personas, messages and preferences in browser storage and selected media in IndexedDB. It does not send authentication emails or store passwords. File access follows your selection; microphone permission is requested for recording. Clearing local browser data may remove content. Hosting providers may process access logs.9. Availability and your rightsMauGo may change or discontinue features, subject to applicable law and purchased entitlements. You may stop using it and use account settings to export or delete local data. The preview is provided for evaluation without a promise of uninterrupted availability. Nothing in these terms excludes non-excludable warranties, liability or consumer rights under the laws that apply to you.10. Apple distributionFor an app distributed by Apple, this agreement is between you and MauGo. Apple is not responsible for app support, app-related claims or intellectual-property disputes; MauGo is responsible as required by law. If the app fails an applicable warranty, Apple may refund its purchase price under its rules. Apple and its subsidiaries may enforce this agreement as third-party beneficiaries. Use Apple devices you own or control and follow store usage rules, including permitted family access. Comply with applicable export and sanctions restrictions.11. Updates and contactMaterial changes will be shown before requesting renewed agreement. Contact MauGo at maugo.support@example.com. This is a reserved example address for the design preview, not an active support inbox; replace it with the actual MauGo support address before release. Version 1.0 · 13 October 2026. This document is a review draft for the prototype and does not create a real service contract."


       6 |  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
       7 |  const seeded=await request.post('http://127.0.0.1:3001/__c5/seed',{data:{mode:'read'}});expect(seeded.ok()).toBeTruthy();const u=await seeded.json();const snapshot=async()=>(await request.get('http://127.0.0.1:3001/users/me/export',{headers:{Authorization:`Bearer ${u.token}`}})).json()
    >  8 |  await page.goto('/?auth=consent');await expect(page.locator('.terms-document').first()).toContainText('[EULA_PENDING_SMITH]');await page.locator('#accept-terms').check();await page.locator('#terms-continue').click();await page.locator('#auth-email').fill(u.email);await page.locator('#auth-password').fill(u.password);const signed=page.waitForResponse(r=>r.url().endsWith('/auth/login')&&r.request().method()==='POST');await page.getByRole('button',{name:'Sign in',exact:true}).click();expect((await signed).ok()).toBeTruthy();await page.getByRole('button',{name:'Meet your letters'}).click();await page.locator('#open-profile').click();await page.locator('#open-settings').click()
         |                                                                                          ^
       9 |  const before=await snapshot();const body=page.locator('.settings-body'),back=()=>page.locator('#settings-back').click()
      10 |  await page.locator('#help-settings').click();await expect(page.locator('#help-centre')).toBeVisible();await expect(body).toContainText('[SUPPORT_EMAIL_PENDING_SMITH]');await shot(page,'help')
      11 |  await page.locator('#help-centre').click();await expect(body.locator('details')).toHaveCount(6);await shot(page,'faq');await body.locator('summary').first().click();await expect(body.locator('details').first()).toHaveAttribute('open','');await expect(body.locator('details p').first()).toBeVisible();await shot(page,'faq-expanded');await body.locator('summary').first().click();await expect(body.locator('details').first()).not.toHaveAttribute('open','');await back()
        at /Users/anna/Muse_AI-repository/client/tests/d8.spec.ts:8:90

    Error Context: test-results/d8-D8-fourteen-support-sta-d7afe-ckend-and-isolated-database/error-context.md

  1 failed
    tests/d8.spec.ts:4:1 › D8: fourteen support states with real backend and isolated database ─────
```
