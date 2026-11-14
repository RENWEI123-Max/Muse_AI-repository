# R23 帮助反馈：部分实现，验收未通过

执行日期：2026-11-15，Mac mini `Annas-Mac-mini.local`。分支 `codex/r23-support`，基线 `origin/codex/r22-security` / `bd9fea6`。不合入 main。

## 执行摘要与四项验收

**四项 0/4 通过，R23 不可标完成验收。** 14 个目标中 13 个可在真实预览入口到达，反馈历史不存在。完成样式/模板交付、原型摘录、52 次状态记录、真实 PNG、R01 并排及比例；有效反馈提交及历史未验证。

| 验收 | 结果 | 证据和缺口 |
| --- | --- | --- |
| 静态 | **未通过／待 Smith** | build（资产检查、vue-tsc、Vite）通过，diff --check 干净；局部几何对齐但未达到所有关键元素 ≤1px、计算样式完全相等。缺附件/历史/分享控件，关于菜单和反馈布局明显不同；条款输入节点冲突。全仓仍有 7 个既有 CSS 文件包含 hex，本模块为 0，未越界清理其他模块。 |
| 流程 | **未通过／待 Smith** | 两高度双语真实点击各走通 13 态；历史未实现、附件和分享缺失、有效提交未验证；原型本机保存与现有服务端提交不一致。 |
| 效果 | **未通过／待 Smith** | 实测帮助返回 0.94、自助入口及底部按钮 0.96、FAQ 展开有动画；其他页面所有可点项未逐个按压实测，分享 sheet-in 不存在；原型 FAQ 无显式展开关键帧，新增淡入与原型不完全一致。 |
| 滑动与文案 | **未通过／待 Smith** | 四组均无整页滚动或容器横向溢出；内部滚动中/底 PNG 已覆盖。真实条款滚轮有效，未做人机触屏顺滑性验证，无专门“下面还有”提示。客服邮箱占位和法律评审草稿仍存在；不能称无占位或完整验收通过。 |

## 原型摘录（直接读离线 HTML 内嵌 CSS/JS）

来源：`~/maugo-design/MauGo.html` 的 `window.__ATLAS_BUNDLE__`，逐项解析 `scripts[].code`，不是按截图猜。详见 [原型摘录](r23/prototype-extract.txt)、[本地 Figma 摘录](r23/figma-extract.json)。未调用 Figma API/token。

- help：自助四入口 Help centre / Guidelines / Safety guide / Delete account；female-4 鸟、问候气泡和四条 FAQ 链接；底部反馈、隐私。FAQ 为原生 details/summary，点击展开/收起。
- feedback：四类切换；空内容禁用保存；1000 字限制；可选邮箱正则校验，失败 toast；选照片、预览、移除；保存到 state.feedback，persist 成功后重绘并提示“Feedback saved on this device.”，下方展示历史日期和文本。
- about：wordmark、Version 2.0 · Web preview、Share、规范、条款、隐私、帮助。分享用 navigator.share 或 clipboard，失败可显示含链接的 sheet。
- guidelines/safety：三级标题及正文。隐私原型是浏览器存储说明；条款为 MauGoLegal.html。活动空态正文 “Every connection starts with a little hello.”。
- 原型圆按钮 0.94、操作按钮 0.96，弹层 sheet-in 0.3s ease-out；帮助按钮变色/原生 details，原型没有专门 FAQ 展开关键帧。

Figma 数值：375×812；页面 header y48/h64，返回 x16/y59.5/40×40，标题 y67.5/h24、Fredoka 550 17/24；正文 x24/y136/w327。自助卡 x24/y136/327×111、圆角16、内边距16；气泡 x68/y271/w283、圆角14；FAQ summary y152、每行54，13/21；政策标题16/19、正文13/23；反馈 textarea x24/y259/327×168、email y483/h48；原型照片 y571/h72、提交 y700/h48。

### 冲突与保留事项

1. 请求的 `terms-full 25:19082` 在本地 JSON 不存在；实际同名节点为 `29:19082`，原始发现存 [terms-node-found.json](r23/terms-node-found.json)。未将其默认为已批准替代节点，条款静态验收待 Smith。
2. 原型/Figma 本地保存反馈与现有 `/feedback` 后端提交冲突。保留现有提交调用、2000字限制和服务端结果；未增加伪历史、附件空按钮或假记录。
3. 隐私现行“待正式文本”与原型四段本地存储说明冲突。现行法律内容完全保留；条款 11 节草稿、6 节演示措辞、真实邮箱仍待 Smith。
4. 关于页现有 Version 0.1.0、6 个链接，无 Share；不添加业务分享流程。空态现有“未连接 feed”保留语义并补韩文，与原型文案不同。

## 实现说明与边界

新增 `styles/pages/support.css`，删除 settings.css 内全部旧 support/FAQ/反馈/关于/政策/空态规则。沿用共享 ui-header/ui-row 和 settings 页面过渡；模板仅增加支持页样式类、移除帮助页额外说明以回归原型布局，补英语/韩语显示。所有新增颜色、圆角、字体、阴影用 tokens；无 !important、无 .device 前缀、无短屏插画缩放。

SettingsFlow `<script setup>` 与基线逐字相同；id 保留。App.vue、登录/会话/localStorage token、支付、反馈后端调用和 support-content.ts 法律正文未改。资源 manifest 的 female-4、envelope、wordmark 均 scale=3（目录名 png-1x 为历史名）。[源码检查](r23/source-checks.json)、[构建日志](r23/build.log)。

## 挂载条件和真实流程

已先读 R22-result.md。R23 与 AccountSecurity 不同：SettingsFlow 可经 Welcome → Explore preview → Profile → Settings 进入，token 为空时静态模板照常渲染，不需要改变挂载条件。此次全程无 token 注入、无 API mock、无数据库假数据。

本机 3001 `/health` 两次连接失败（curl exit 7），未启动/重启后端，未安装数据库或改配置。不碰 3000 测试服务；无有效反馈提交、无真实账号注册或登录。客户端无反馈历史渲染分支，数据库可用也不能据此声称历史可达。

以下步骤在 375×812/en、375×812/ko、375×667/en、375×667/ko 四组各执行一次，详见含实际页面全文、位置和计算样式的 [walkthrough.json](r23/walkthrough.json)。

| 状态 | 操作与实际结果 |
| --- | --- |
| help | 预览→个人页→设置→帮助；自助卡、气泡、四条 FAQ、底部反馈/隐私出现。 |
| faq | 点击 Help centre；六个 summary 显示。 |
| faq-expanded | 点击首个 summary；首条答案可见。 |
| guidelines | 返回帮助→Guidelines；三节正文显示→返回帮助。 |
| safety-guide | 点击 Safety guide；三节正文显示→返回帮助。 |
| privacy-policy | 点击 Privacy；待正式文本提示显示→返回帮助。 |
| feedback-empty | 点击 Feedback；空输入、提交 disabled。 |
| feedback-filled | 输入 I would like to save letters into collections.；提交 enabled。 |
| feedback-invalid | 邮箱输入 invalid→提交；出现有效邮箱错误，无有效服务器提交。 |
| feedback-history | **未实现／未验证**；没有历史页面分支和真实记录，缺截图。 |
| about | 返回设置→About；wordmark、版本和现有菜单显示。 |
| terms-full | About→Terms；11节草稿可内部滚动；中部/底部截图覆盖正文。 |
| system-empty | 返回 About→System；空态出现→返回 About。 |
| interactions-empty | About→Interactions；空态出现→返回 About→返回设置。 |

### 效果逐项

[effects.json](r23/effects.json) 实测：返回 matrix(0.94)；帮助四自助按钮、底部反馈/隐私、首条气泡 FAQ 链接 matrix(0.96)。其余三条气泡链接、反馈四类别/提交、关于六行及 FAQ 其余 summary 仅有 CSS/模板证据，没有逐元素按压实测。FAQ 首条确实 open 且 support-answer-in 动画；settings-page 现有 .18s opacity/translateX；未逐帧核对切换。分享 sheet-in、照片选择、删除账户弹层均未验证（分享/照片缺失，删除转入 R22 会话门控组件）；没有本模块工具按钮的变色实测。

### 滚动与文案

四组 documentScroll=false、settings-body contentWidth≤width。812 下仅 terms-full 溢出正文；667 下 help、三种 feedback、about、terms-full 内部滚动，其余内容可完整容纳。[scroll-check.json](r23/scroll-check.json) 四组条款真实鼠标滚轮 +380 后 scrollTop=380，根页面不动、header 固定。中部/底部补图用 scrollTop 明确定位，不能作为真实触屏顺滑性证明。使用细滚动条，无文字/箭头“下面还有”提示；非触屏验证，顺滑性待 Smith。

补全反馈类别、输入提示、规范、安全、空态和关于标题韩文，最终四组横向溢出为0；没有逐字人工审校或全节点裁切检测，不能将“未发现横向溢出”等同于所有文字无截断。客服邮箱仍 [SUPPORT_EMAIL_PENDING_SMITH]，隐私/条款保留草稿。

## R01 并排与差异

13个可达态均为 812 英文最终实际截图对 R01 1x 并排（左实际、右参考）；逐像素 RGBA 不等计数，无蒙版、无阈值，不作通过判定。[comparison.json](r23/comparison.json)。feedback-history 缺实际截图，未生成比较。

| 状态 | 差异比例 |
| --- | --- |
| help | 5.51% |
| faq | 3.51% |
| faq-expanded | 4.53% |
| feedback-empty | 27.81% |
| feedback-filled | 28.79% |
| feedback-invalid | 30.68% |
| about | 34.64% |
| guidelines | 4.23% |
| safety-guide | 3.76% |
| privacy-policy | 7.35% |
| terms-full | 18.15% |
| system-empty | 4.47% |
| interactions-empty | 4.26% |

## 截图清单与交付缺口

详见 [全部真实 PNG 清单](r23/screenshots.md)。每个可达状态四组各一张；有滚动的状态另附 middle/bottom；13张 side-by-side。feedback-history 唯一目标态截图缺失，未用参考图替代。截图只证明本机前端预览状态，不证明服务器反馈或历史成功。

待 Smith：确认条款节点；正式法律文本、6节措辞、真实邮箱；附件/历史/分享及原型业务差异的后续范围；3001 独立测试环境就绪后真实账号单次登录复用会话验证反馈提交；真人触屏顺滑与全按钮效果。当前为可审查部分实现，不是 14 态验收完成。
