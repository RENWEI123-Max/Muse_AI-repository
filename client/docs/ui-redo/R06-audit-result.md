# R06 首页补查

基线 `75e6c60`，分支 `codex/r06-audit`。Mac mini 执行。静态沿用 R06，不修改尺寸、颜色、入口行、登录或支付逻辑。

## 动手前原型摘录

来源：`~/maugo-design/MauGo.html` 内嵌 `__ATLAS_BUNDLE__`，`app.js` 38–148、196–207、244 行；CSS 首页规则。只读本地，无 Figma API。
`~/maugo-figma/page-states.json` 缺失；仓库 `client/docs/design-reference/page-states.json` 的 home-ready / empty / response 操作数组为空，不能宣称已有完整步骤。以下根据原型事件绑定补足。

| 状态 / 起点 | 点哪里 → 去哪里 → 返回 | 原型函数 / 文案 |
|---|---|---|
| home-ready | Refresh / 帽子 → summoning → ready；鸟 → opening → reading；关闭 / Escape → returning → ready | startRound / tick / openNote / closeNote；Tap a bird. Open a little story. |
| home-empty | Edit filters → 筛选；Done → summoning → 首页；帽子仍刷新 | pool / showFilters / startRound；No letters yet. Try a wider search. |
| home-response | 回应胶囊 → 对应信件；关闭返回首页、清除提示 | responseStrip / openNote / clearHomeResponses；Replied to you / Tap to chat；权限以服务端为准 |
| 首页写信 | Send a letter → composing；填字；取消 / 关闭 / Escape → returning；成功 → sending → 新首页；失败保留草稿 | openComposer / closeComposer / publish；原型本地 posts 保存不可搬入服务端实现 |
| 首页筛选 | 顶部 Filters → 筛选；关闭 / 背景 / Escape → 首页；Done 应用后回首页 | showFilters / closeSheet；筛选权限以服务端为准 |
| 首页外观 | 顶部 Bird appearance → 外观；男鸟、款式、动效、拖尾；Done / 关闭返回首页 | showAppearance / applyMotion；本次只验首页入口，不改 R07 |
| Diamonds / Filter Pass | 保留既有入口 → 对应页面；返回首页；不执行支付 | showDiamondStore / showFilterPass；服务端钱包优先 |

滚动：原型 body / screen 隐藏溢出，sheet、reply-history 为内部滚动，回应条横向流动；应用按外壳结构：首页不滚，response-strip 横向滚，弹层内部滚。顶部/中部/底部截图表示同一固定首页的三个区域，不能伪称纵向滚动页。

效果摘录：sprite-loop .65s steps(6)；三鸟 delay 620/410/830ms、duration 1690/2070/1730ms，smooth(u)，缩放 .24+.76*smooth(clamp(u*1.45))，拖尾 .68*exp(-t/1100)；idle 正弦 hover；帽子 impulse exp(-((elapsed-280)/180)^2)；24 个 JS 粒子；opening 440ms、returning 480ms、sending 1500ms；twinkle 3.3s（delay 0/-1.1/-2s）、floor-breathe 4s、mist-breathe 5.4s；aura opacity .8s、bird filter .25s、actions opacity/transform .45s（button transform/opacity .2s）、veil .35s、note opacity .36s / transform .44s、hint opacity .7s、toast .2s；round :active scale .94、actions .96；sheet-in .3s 共用已有。原型全局 9 个 keyframes 包含其他模块，不能把全局数量当首页全部完成。

## 验收记录

**结论：整体未通过 / 待 Smith。** 完成可独立补的首页流程与展示修复；不能把 API fixture 走查通过当成真实后端或完整动效验收通过。

| 四项验收 | 结果 | 实测与限制 |
|---|---|---|
| 静态 | 通过（沿用已认可静态） | `VITE_API_BASE_URL=/api npm run build` exit 0，343 PNG 校验、vue-tsc、Vite 通过；四个实现文件 hex=0、!important=0、.device 前缀=0；diff-check 通过。保留尺寸/颜色/入口行；没有重做 Figma 截图差异率。原 R06-result 的历史 A4 等限制仍见原报告。 |
| 流程 | 未通过 / 待 Smith | 四组 Playwright API fixture 走查通过：回应、点鸟、刷新、筛选 Done/取消、外观、填字、发送失败/草稿恢复、Diamonds 返回、Filter Pass 返回、刷新失败重试、帽子进入空态、Edit filters。回应条关闭与原型不同；真实服务端、发送成功、收取/聊天权限未验。 |
| 效果 | 未通过 / 待 Smith | 已补路径飞出/悬停、三种环境动效及过渡；sprite 与三种环境动效时长有浏览器读数。24 JS 粒子、帽子 impulse、完整 opening/returning/sending 阶段未达到原型，详见效果表。 |
| 滑动与文案 | 部分通过 / 待 Smith | 375×667、375×812 英韩四组 document 高度=viewport、scrollY=0、home.scrollTop=0；回应条实际滚轮横滚成功；667 外观容器滚动成功。首页常用文案 scrollWidth≤clientWidth，12 张区域截图齐全；667 提示与帽子重叠、跨模块错误韩文化和全状态文案未验，不能报整项通过。 |

## 实现范围

- `HomeFlow.vue`：空态 Edit filters 改为打开筛选，名称与实际操作一致；挂载纯展示鸟动效指令。
- `home-birds.ts`：沿原型三条路径、delay/duration、smooth、入场缩放及 idle 正弦悬停；最终位置仍是原有 Figma 鸟按钮框，不替换数据、不构造来信。支持关动效、系统减弱动效、sheet 暂停、后台暂停、卸载取消 RAF。
- `home-trails.ts`：刷新请求结束后重置拖尾时钟，与新鸟展示时钟一致，避免请求耗时吃掉飞行段。
- `pages/home.css`：补 twinkle / floor-breathe / mist-breathe、原型首页过渡；提示语 pointer-events:none，避免 667 下覆盖帽子点击。无位置/颜色/尺寸修改。
- `.economy-actions` 模板与基线逐字一致；App.vue、LettersFlow.vue、ReplyTopup.vue 与基线无差异。没有修改 token、账户、服务端、支付或聊天权限。

## 效果清单核对

| 原型效果 | 当前实现与核对 | 结果 |
|---|---|---|
| sprite-loop 6 帧 .65s steps(6) | 原有，保留；实测名称 sprite-loop、.65s；关闭/减弱动效 frame1 | 已有 / 通过 |
| 三鸟飞出 620/410/830ms + 1690/2070/1730ms | 新指令复用三条 SVG path、smooth(u)、入场透明度/缩放与方向角；浏览器 transform 非 none，录屏可复核；未做逐帧像素一致性量化 | 已补，精确视觉待 Smith |
| idle hover 正弦运动 | 原型 1.4/1.85/1.45 频率、3/4/3 幅度与渐入系数 | 已补 |
| 拖尾 reveal + exp(-t/1100) | 原有 home-trails 保留；请求结束与鸟同步重启；sheet/后台暂停，关动效隐藏 | 已有 + 补同步 |
| twinkle 3.3s、delay 0/-1.1/-2s | 新增原型 keyframes；实测 duration/delay 见 JSON | 已补 / 通过 |
| floor-breathe 4s | 新增原型 .65→1、scale .94→1.05；实测4s | 已补 / 通过 |
| mist-breathe 5.4s | 新增原型 .30→.46、scale(.97,.98)→(1.03,1.06)、Y 3→-3；实测5.4s | 已补 / 通过 |
| aura .8s、bird filter .25s、actions .45s、hint .7s | 新增 CSS transition 声明；现有状态切换未覆盖每个原型触发，不能仅凭声明判全部效果完成 | 部分完成 |
| round/actions 按下 .94/.96、button .2s | 沿用外壳共用按下反馈；未专门补原型逐项按下截图/时长断言 | 待核对 |
| sheet-in .3s | 沿用共用 sheet；实际筛选/外观真点击；不改 R07 | 已有，精确时长未独立验 |
| 24 JS 粒子 renderParticles | 仍为 Figma 粒子 PNG；没有原型粒子循环 | 未补 / 待 Smith |
| 帽子 exp(-((elapsed-280)/180)^2) impulse / mouth light | 仍为请求 busy 时 .25s alternate；与原型不同 | 未补 / 待 Smith |
| opening 440ms、veil .35s、note .36/.44s | 跨 R08 现有 letter-overlay / flying letter；打开真点通过，未校准整个原型阶段 | 未通过 / 待 Smith |
| returning 480ms + focus restore | 现有离场440ms，首页鸟没有原型 returning 阶段 | 未通过 / 待 Smith |
| sending 1500ms | R08 sent 页面，未实现原型寄出→召回首页阶段；不搬本地 posts 演示逻辑 | 未通过 / 待 Smith |
| toast .2s、response 流动 | 不新增假通知；回应条为可横滚容器，未实现原型连续滚动 | 未通过 / 待 Smith |

## 走查方法与限制

运行：`cd client && npx playwright test -c tests/r06-audit.config.ts`。本地 Vite 5317、Chromium，录屏和 trace 开启。每组从协议勾选、邮箱/密码填写、登录按钮、Meet your letters 开始；不直接赋首页 data-state，不注入 token/account localStorage。登录响应是测试 fixture，仅代表 UI 走通，不代表真实认证。

Mac 的 `maugo/node_modules` 缺失，现有 auth-server.mjs 无法直接运行；本轮没有安装后端依赖或连接生产数据库。所有 `/api` 请求均在 Playwright 层拦截；来信、回应、钱包、Pass、失败响应为明确 fixture。空态由实际点击帽子后收到空 items 到达；不会将假钱包或假来信逻辑写进产品。

点击顺序及真实截图：
1. 进入回应首页（01-response）；横向滚轮实际滚动，点回应打开信件（02-letter），关闭后剩两条——记录现有业务差异。
2. 点 Refresh，等 busy 消失、路径飞出完成（03-ready-motion）；读 sprite 和环境动画 computed-style。
3. 系统减弱动效后拍固定首页 top / middle / bottom；实际滚轮检查外层不滚；点首页鸟打开信件（03b-bird-letter），关闭返回。
4. Filters → Woman → Done；再开 Filters → Escape 取消；Appearance → Male → 关闭 Flight & hover；667 内部滚至底部（04-appearance），Done 返回。
5. Send a letter → 先填 Recipient ID，再填正文（05-compose-filled）→ 发送收到 fixture 503（06-compose-failure）→ Cancel；再次打开并填写相同收件人验证草稿恢复，再关闭。
6. Diamonds（07-wallet）→ 页内 Back to Home 返回；Filter Pass（08-pass）→ Close 返回；不点击购买按钮。
7. Refresh 503（09-refresh-failure）→ Retry 成功；帽子获取空 items（10-empty）→ Edit filters 打开筛选，确认未发刷新请求 → Escape 返回。

常态动画后使用 reduced-motion 拍固定区域，避免把随机动画帧当静态布局变化。录屏同时保留开启与关闭动效的阶段。截图是浏览器真实 PNG，区域图直接裁取同一固定页面，不假称 top/middle/bottom 是滚动位置。

首轮测试中的旧 session 选择器、填写顺序（收件人切换会恢复对应草稿）、过渡中截图、以及韩文动态 Filter aria-label 的英文匹配曾导致中断/失败，已修正测试；`pre-final-playwright.log` 保留其中一次完整结果（2通过2失败），不是最终结果。未删除或掩饰产品差异以凑通过数。

## 待 Smith / 未完成

1. 回应提示：原型关闭信件清整条；实现只清已打开项。以服务端未读/收取规则为准，未改变业务。需要确认首页提示的展示清除规则。
2. 原型自由写故事，与真实接口要求 Recipient ID、单条200字、等待对方回复不同。保留服务端规则；发送成功与1500ms寄出阶段未验，不能迁入本地 posts 保存逻辑。
3. 原型 JS 粒子与 Figma 粒子图、帽子 impulse 与现有 busy 摆动、完整开信/收回动效均未补齐。此轮不能作为全动效通过样板；后续需在首页与 R08 边界明确后继续。
4. 667 提示文本与帽子相交；截图可见。只修命中区域，不自行改变已验静态坐标，位置处理待 Smith。
5. 钱包顶部返回按钮在状态栏附近，本轮使用页面内 Back to Home；顶部按钮触达未通过本轮走查，支付模块未改。
6. 韩文首页常用提示/按钮/入口无宽度截断；R08 发送失败文案仍回落英文等跨模块翻译不在本轮修复范围，全状态文案验收仍待完成。
7. 本地外部 page-states 文件缺失，仓库副本首页动作为空；真实后端、通知到达、发送成功、收取与聊天权限均未验。

## 截图与证据清单

以下清单由最终产物生成；最终命令结果、数量和录屏路径见清单末尾。


最终构建 exit 0；最终 Playwright exit 0，**4通过 / 0失败 / 0跳过**（API fixture），最终日志 [playwright.log](r06-audit/playwright.log)。真实 PNG **56 张**；录屏4份、trace4份。

- 375×667 en：[步骤和读数](r06-audit/667-en-walkthrough.json)，document=667、scrollY=0、home.scrollTop=0；外观容器 {'top': 103, 'height': 569, 'content': 672}。
- 375×667 ko：[步骤和读数](r06-audit/667-ko-walkthrough.json)，document=667、scrollY=0、home.scrollTop=0；外观容器 {'top': 103, 'height': 569, 'content': 672}。
- 375×812 en：[步骤和读数](r06-audit/812-en-walkthrough.json)，document=812、scrollY=0、home.scrollTop=0；外观容器 {'top': 0, 'height': 676, 'content': 676}。
- 375×812 ko：[步骤和读数](r06-audit/812-ko-walkthrough.json)，document=812、scrollY=0、home.scrollTop=0；外观容器 {'top': 0, 'height': 676, 'content': 676}。

- [667-en-01-response.png](r06-audit/667-en-01-response.png)
- [667-en-02-letter.png](r06-audit/667-en-02-letter.png)
- [667-en-03-ready-motion.png](r06-audit/667-en-03-ready-motion.png)
- [667-en-03b-bird-letter.png](r06-audit/667-en-03b-bird-letter.png)
- [667-en-04-appearance.png](r06-audit/667-en-04-appearance.png)
- [667-en-05-compose-filled.png](r06-audit/667-en-05-compose-filled.png)
- [667-en-06-compose-failure.png](r06-audit/667-en-06-compose-failure.png)
- [667-en-07-wallet.png](r06-audit/667-en-07-wallet.png)
- [667-en-08-pass.png](r06-audit/667-en-08-pass.png)
- [667-en-09-refresh-failure.png](r06-audit/667-en-09-refresh-failure.png)
- [667-en-10-empty.png](r06-audit/667-en-10-empty.png)
- [667-en-home-bottom.png](r06-audit/667-en-home-bottom.png)
- [667-en-home-middle.png](r06-audit/667-en-home-middle.png)
- [667-en-home-top.png](r06-audit/667-en-home-top.png)
- [667-ko-01-response.png](r06-audit/667-ko-01-response.png)
- [667-ko-02-letter.png](r06-audit/667-ko-02-letter.png)
- [667-ko-03-ready-motion.png](r06-audit/667-ko-03-ready-motion.png)
- [667-ko-03b-bird-letter.png](r06-audit/667-ko-03b-bird-letter.png)
- [667-ko-04-appearance.png](r06-audit/667-ko-04-appearance.png)
- [667-ko-05-compose-filled.png](r06-audit/667-ko-05-compose-filled.png)
- [667-ko-06-compose-failure.png](r06-audit/667-ko-06-compose-failure.png)
- [667-ko-07-wallet.png](r06-audit/667-ko-07-wallet.png)
- [667-ko-08-pass.png](r06-audit/667-ko-08-pass.png)
- [667-ko-09-refresh-failure.png](r06-audit/667-ko-09-refresh-failure.png)
- [667-ko-10-empty.png](r06-audit/667-ko-10-empty.png)
- [667-ko-home-bottom.png](r06-audit/667-ko-home-bottom.png)
- [667-ko-home-middle.png](r06-audit/667-ko-home-middle.png)
- [667-ko-home-top.png](r06-audit/667-ko-home-top.png)
- [812-en-01-response.png](r06-audit/812-en-01-response.png)
- [812-en-02-letter.png](r06-audit/812-en-02-letter.png)
- [812-en-03-ready-motion.png](r06-audit/812-en-03-ready-motion.png)
- [812-en-03b-bird-letter.png](r06-audit/812-en-03b-bird-letter.png)
- [812-en-04-appearance.png](r06-audit/812-en-04-appearance.png)
- [812-en-05-compose-filled.png](r06-audit/812-en-05-compose-filled.png)
- [812-en-06-compose-failure.png](r06-audit/812-en-06-compose-failure.png)
- [812-en-07-wallet.png](r06-audit/812-en-07-wallet.png)
- [812-en-08-pass.png](r06-audit/812-en-08-pass.png)
- [812-en-09-refresh-failure.png](r06-audit/812-en-09-refresh-failure.png)
- [812-en-10-empty.png](r06-audit/812-en-10-empty.png)
- [812-en-home-bottom.png](r06-audit/812-en-home-bottom.png)
- [812-en-home-middle.png](r06-audit/812-en-home-middle.png)
- [812-en-home-top.png](r06-audit/812-en-home-top.png)
- [812-ko-01-response.png](r06-audit/812-ko-01-response.png)
- [812-ko-02-letter.png](r06-audit/812-ko-02-letter.png)
- [812-ko-03-ready-motion.png](r06-audit/812-ko-03-ready-motion.png)
- [812-ko-03b-bird-letter.png](r06-audit/812-ko-03b-bird-letter.png)
- [812-ko-04-appearance.png](r06-audit/812-ko-04-appearance.png)
- [812-ko-05-compose-filled.png](r06-audit/812-ko-05-compose-filled.png)
- [812-ko-06-compose-failure.png](r06-audit/812-ko-06-compose-failure.png)
- [812-ko-07-wallet.png](r06-audit/812-ko-07-wallet.png)
- [812-ko-08-pass.png](r06-audit/812-ko-08-pass.png)
- [812-ko-09-refresh-failure.png](r06-audit/812-ko-09-refresh-failure.png)
- [812-ko-10-empty.png](r06-audit/812-ko-10-empty.png)
- [812-ko-home-bottom.png](r06-audit/812-ko-home-bottom.png)
- [812-ko-home-middle.png](r06-audit/812-ko-home-middle.png)
- [812-ko-home-top.png](r06-audit/812-ko-home-top.png)

- [667-en-trace.zip](r06-audit/recordings/667-en-trace.zip)
- [667-en-video.webm](r06-audit/recordings/667-en-video.webm)
- [667-ko-trace.zip](r06-audit/recordings/667-ko-trace.zip)
- [667-ko-video.webm](r06-audit/recordings/667-ko-video.webm)
- [812-en-trace.zip](r06-audit/recordings/812-en-trace.zip)
- [812-en-video.webm](r06-audit/recordings/812-en-video.webm)
- [812-ko-trace.zip](r06-audit/recordings/812-ko-trace.zip)
- [812-ko-video.webm](r06-audit/recordings/812-ko-video.webm)

辅助：[构建日志](r06-audit/build.log)、[源码零值检查](r06-audit/source-checks.json)、[本地参考与节点尺寸](r06-audit/references.json)、[文件 SHA256 清单](r06-audit/artifact-manifest.json)、[首轮失败记录](r06-audit/pre-final-playwright.log)。

分支仅提交并推送，不合入 main。
