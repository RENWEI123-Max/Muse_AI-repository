# R09 收信箱补查

基线 `34ee55b`；分支 `codex/r09-audit`；Mac mini 主工作区执行。未合入 main。静态沿用既有 R09，不调用 Figma API/token。下表和主要流程摘录在实现改动前写入；toast定时隐藏及确认框220ms在后续源码复核时补充，并保留在摘录附件中。

## 动手前原型摘录

本地 MauGo.html 内嵌 features.js / CSS 是流程、效果、文案依据；本地 Figma JSON 是尺寸和颜色依据（只读，未改静态）。[原型源码摘录](r09-audit/prototype-excerpts.md)、[17态操作脚本](r09-audit/state-script.json)、[参考 SHA256](r09-audit/references.json)。原型本地演示数据/收取/权限不会迁入真实实现。

| 状态 | 点哪里 → 去哪里 → 返回 | 函数、文案 |
|---|---|---|
| inbox-empty | Home Messages → 空列表；Friends → 好友空；Home → 首页 | inbox/open/home；No conversations found. / Every connection starts with a little hello. |
| inbox-waiting | 已寄出列表行 → waiting chat；Back → 收信箱 | inbox/open('chat')/back；Your sent letter / Awaiting reply |
| inbox-pending | Collect replies → 免费直接收一封；收费 → 确认或不足页；取消回原列表 | collectOneReply/requestCollectPayment；Collect replies / free today / diamonds per reply |
| inbox-collected-one | 收一封 → 新未读行、剩余2；继续收/开会话；返回列表 | collectOneReply；One reply collected. |
| inbox-collected-all | 再收2封 → 横条消失；开会话返回列表 | collectOneReply；One reply collected. |
| inbox-unread | 未读会话 → chat（清未读）；Back → 列表 | inbox/chat/back；真实用户名称、消息预览 |
| inbox-read | 所有已读；更多 → Mark as unread；菜单 → Mark all as read | conversationOptions/showInboxMenu；Mark as read / Mark as unread |
| inbox-friends-empty | Friends → 空；Messages → 消息 | inbox；Your circle is just beginning. |
| inbox-friends | 关注关系过滤；行 → chat；Back → 好友列表 | inbox/open/back；Friends |
| inbox-drawer | Inbox menu → 右侧抽屉；×/背景/Escape → 原列表；各入口进入相应页 | showInboxMenu/closeInboxMenu；Inbox tools；搜索、系统消息、互动、新关注、帮助、隐藏、演示、通知、全读、清空 |
| inbox-search | 菜单填写 tea、Search/Enter → 匹配名称/备注；Clear search → 列表 | showInboxMenu/inbox；Search conversations / Clear search |
| inbox-search-empty | unmatched-query → 空；清搜索 → 列表 | inbox；No conversations found. |
| inbox-options | 更多或右键行 → sheet；关闭/Escape → 原列表；操作完成回列表 | conversationOptions/showSheet；Pin/Unpin、Mark as read/unread、Hide、Report or block；waiting 限制置顶和安全入口 |
| inbox-pinned | 已置顶、静音；更多 → 取消置顶；置顶排序优先 | inbox/conversationOptions；⌁、♧；静音在聊天详情 |
| inbox-hidden | 菜单 Hidden conversations → 隐藏列表；Restore → 留在隐藏页、会话回主列表；Back → 原列表 | hiddenChats/back；Restore a conversation to your Inbox. / Restore |
| inbox-hidden-empty | 恢复最后一条 → 空；Back → 原列表 | hiddenChats；No hidden conversations. |
| inbox-notifications-off | 未忽略提示条；Enable → notifications；× → 持久忽略、原列表 | inbox/open；Keep up with replies / Enable |

删除/清空：原型 clear-inbox → confirm “Clear conversations?” / “Conversations will be hidden from Inbox. Their messages are kept and can be restored from Hidden conversations.”；Cancel 返回，确认批量隐藏，消息保留。聊天详情的 Clear chat history 另有确认，属于 R11/R12 边界，不把清空列表冒充删除消息。17态源码没有独立 favorite/bookmark 收藏入口，不能把收取回信冒充独立收藏功能已验；关注关系 Friends 使用 state.following，真实服务端语义保持不变。若“收藏”另指其他业务，待 Smith 明确。

失败：原型 persist 失败回滚收取前 chats/queue/quota/purchases，toast “Unable to save right now. Please try again.”；真实实现继续以 API 成败为准，不伪造本地钱包或聊天许可。

滚动：screen/app-view固定；inbox 的 .page-body 内滚（当前 .inbox-body）；收取条 sticky top:0，收取后的行 scrollIntoView nearest/smooth；drawer 和 sheet 应可内滚；整页不滚。

效果摘录：普通 sheet-in **300ms ease-out**（opacity0、translateY30 → 正常），收取确认 payment-dialog 为 **220ms ease-out**，抽屉即时打开（无 animation 声明）；收取新行 reply-arrive **450ms ease-out**（opacity0、translateY-8 → 正常）；收取条按下 scale(.99)，原型未指定该按下态时长；toast opacity/transform **200ms**。原型没有独立抽屉横滑、分组淡入、列表排序过渡、计数跳动的时长定义，不凭 Vue Transition 名称声称存在原型效果。

## 四项验收结果

整体：**未通过/待 Smith**。本轮补查已完成，不能把 fixture 全绿或沿用静态当作流程完整通过。

| 验收项 | 结果 | 证据与范围 |
|---|---|---|
| 静态 | 通过（沿用 R09 静态基准） | 正常态尺寸、颜色、字体和素材不改；原 inbox.css 全文保留，仅追加动态规则。最终构建退出0；生产改动文件 hex / !important / .device 前缀均0。未声称本轮重做像素静态验收。 |
| 流程 | 未通过/待 Smith | 四组 fixture 各17态真点真填通过；已补失败留在选项重试、右键入口、对话框背景隔离。标未读、清空列表、通知设置、隐藏恢复形态、R08入口等仍有下述差异；真实后端/权限及原回归未通过。 |
| 效果 | 通过（摘录清单的 R09 源码与 fixture 实测） | 按下 .99、普通sheet300ms、确认220ms、收取行450ms、toast2700ms后200ms淡出、抽屉即时打开均逐条核对。未扩展到其他模块、真实收取性能或原生端。 |
| 滑动与文案 | 通过（本轮 fixture 覆盖） | 375×667 / 375×812、英韩各17态；document高度等于viewport、scrollY=0；长列表可内滚、收取条sticky、新行滚入。667抽屉可内滚；所测可见按钮/标题/说明无横向裁切，韩文tab字体断言通过，既有系统文案有韩文映射。用户内容保留原文。 |

## 实现和效果逐条核对

仅修改生产文件 InboxFlow.vue、inbox.css。App.vue、token/account/localStorage会话逻辑、API助手、服务端、支付请求/费用/幂等键/权限、其他模块均未改。比较见 [范围核对](r09-audit/scope-review.json)。本轮没有新增系统文案或改 i18n；全部字面量 tr 键已有韩文映射。

- Mark as read 的 `open()` 返回成功标志；只有成功才关闭选项，503仍保留sheet和可重试动作。没有改变读消息请求或服务端已读规则。
- 行右键与更多按钮打开同一选项；抽屉/选项/收取确认打开期间，页头和底部导航 inert，保留原有Escape/Tab/focus恢复。
- sticky只影响收信箱滚动状态；成功刷新列表后再滚入新行、触发既有450ms动画。收取条无CSS动画，关闭Vue多余leave帧，避免按旧高度滚动后被页头遮住；不改列表分页或服务端排序。
- toast独立显示状态，成功后2700ms开始退出、200ms淡出；重复收取重置timer，卸载清timer；保留replyState及支付状态不变。
- 抽屉取消误继承的sheet-in；收取确认在InboxFlow内恢复220ms，均为动画规则，不改静态几何或支付逻辑。现有reduced-motion共用规则保留，本轮未单独跑reduced-motion矩阵。

| 效果/行为 | 原型 | 现状/本次 | 核对 |
|---|---|---|---|
| Collect replies 按下 | scale(.99)，未指定过渡时长 | 外壳既有；实测matrix(.99) | 存在，未重复实现 |
| 选项sheet | sheet-in300ms ease-out，opacity0/translateY30px起始 | 外壳既有；animationstart记录0.3s | 存在 |
| 收取确认 | sheet-in220ms ease-out | 原实际300ms，修正InboxFlow内duration为.22s；实测断言及事件记录 | 已补 |
| 新收取行 | reply-arrive450ms ease-out，opacity0/translateY-8px → 正常 | 既有r09-arrive450ms；本次修正刷新后触发与滚入时机 | 存在/触发已补 |
| 成功toast | 2700ms可见计时；opacity/transform200ms；translateY8px | 原持续显示，本次补定时关闭与Vue起止态；transitionend=0.2s | 已补 |
| 抽屉打开 | 即时，无独立animation | 原误继承300ms，现animation-name=none | 已补 |
| 收取条/列表/分组 | render即时刷新；条sticky；新行nearest/smooth | 条移除不延后占位；内滚；原型未定义其他列表/分组/徽标时长 | 无缺少的原型动画；不凭Transition名称编造动画 |

## 流程差异、阻塞项与跨模块边界

1. **标未读：未通过/待 Smith。** 原型可切换Mark as unread；当前API只支持GET messages markRead、PATCH允许字段无未读标记。没有把本地unread=1逻辑搬入服务端客户端。
2. **清空/删除：未通过/待 Smith。** 原型Clear conversation list需确认后批量隐藏、保留消息；当前收信箱无该入口。新增菜单/确认状态及批处理超出“静态不动/业务逻辑不动”的本轮范围。ChatFlow详情已有Clear messages属R11/R12，本轮未以此冒充清空列表，也未添加不存在的DELETE会话API。
3. **隐藏和分组/搜索边界：未通过/待 Smith。** 现有隐藏页用会话选项Restore conversation，原型为直接Restore行；本轮不改已验静态。源码中hidden仍沿用当前tab，Friends入口会保留following筛选；17态走查从Messages进入，Friends→Hidden组合未验通过。切tab清搜索，而原型searchText保留；真实实现搜索消息内容及名称/备注，原型只匹配名称/备注。本轮保持既有服务端查询能力/筛选语义，不冒称完全一致。
4. **通知和菜单：未通过/待 Smith。** Enable/Notification settings当前调用浏览器Notification.requestPermission，原型进入notifications页；系统消息、互动、新关注、帮助和演示入口未接入。没有新增假活动数据或本地演示回复。原生推送与权限未验。
5. **会话选项和权限：未通过/待 Smith。** 原型选项可Report or block，当前需进入ChatFlow详情；waiting置顶/安全入口的本地演示限制没有迁入客户端，服务端仍为权威。关注、备注、静音沿用现有服务端操作；本轮实际走了关注、备注、置顶、静音和隐藏/恢复，但没有将这些等同于独立收藏业务。未读取消/失败不伪造成成功。
6. **R08/R09边界：未通过/待 Smith。** R09行点击进入ChatFlow、Back回原收信箱已真点验证；waiting会话无composer断言通过。R08 waiting/replied Continue chatting仍只刷新，R09无法从缺少的入口事件自行建立路由；举报后隐藏来信、首页回应条关闭规则仍归R08/R06。本轮未动LettersFlow/HomeFlow/App.vue或聊天许可。
7. **真实后端/原回归：未通过/待 Smith。** Mac本轮全部成功/失败为浏览器API fixture；无真实收取、余额扣费、会话权限、通知或收藏验收。收取503、真实费用竞态/幂等扣费等由原测试覆盖，但本轮原测试启动失败，不能算已通过。分页测试确实加载25行，收取滚入对象位于刷新返回的前20行；未证明分页外收取对象的显示/排序。

## 走查方法与运行结果

[测试源码](../../tests/r09-audit.spec.ts)，[配置](../../tests/r09-audit.config.ts)。登录表单 → 首页按钮 → #open-inbox；只写语言偏好，不用脚本写登录token/account，不直接写Vue状态或跳data-state。

每组依次：待收3 → 取消确认 → 收1 → 收余下2 → 退出重进未读 → 菜单全读 → fixture新未读场景 → 单条标读503/重试 → 逐条开chat返回 → Friends空 → 更多/Escape/右键 → pin503/重试 → 静音 → 关注/Friends → 备注 → 抽屉/Escape/焦点 → 搜索匹配/空/清空 → 隐藏/恢复/返回 → fixture waiting场景开会话返回 → fixture空场景 → 未忽略通知提示/忽略 → 列表503/Retry → 长列表分页25行/滚轮/sticky → 收取行滚入 → 抽屉内滚/关闭 → toast计时与整页滚动断言。

fixture切换数据发生在正常退出/重新进入之间，对应仓库状态脚本的不同seed；收到的名称/消息是测试用户内容，韩文截图中不翻译。截图为Playwright真实PNG，未合成。四组走查JSON含逐步时间、17态记录、可见文案裁切指标、请求路径/方法、滚动和animation/transition事件。

最终命令：

```sh
cd client
VITE_API_BASE_URL=/api npm run build
npx playwright test --config tests/r09-audit.config.ts
npx playwright test tests/r09-inbox.spec.ts tests/inbox.spec.ts tests/client.spec.ts tests/r06-discover.spec.ts tests/r07-filter.spec.ts tests/letters.spec.ts tests/d3.spec.ts tests/d4.spec.ts --workers=1 --reporter=line
npm run test:e2e -- --workers=1 --reporter=line
```

最终构建 **退出0**；专用fixture **退出0，4通过/0失败/0跳过**。原回归与默认全套 **均退出1、启动失败、0条实际执行**：`../maugo/node_modules/.bin/tsx: No such file or directory`。没有改原测试、安装/假造后端或把未执行计作通过；因此本轮不能复现/消除历史韩文flaky、d3超时、独立重跑卡登录。

证据：[最终构建](r09-audit/build.log)、[最终fixture](r09-audit/playwright.log)、[原回归](r09-audit/original-regression.log)、[默认全套](r09-audit/full-suite.log)、[零值检查](r09-audit/source-checks.json)、[覆盖/PNG尺寸/裁切/计时汇总](r09-audit/evidence-checks.json)。旧 [R09-result](R09-result.md) 已按实际17张既有图/量表及历史9通过1失败记录修订，不再停留“全未生成/全未运行”的过期章节。

相关中间走查失败日志保留：标读失败后sheet消失 [基线](r09-audit/baseline-playwright.log)；sticky被共享CSS覆盖 [首次修复后](r09-audit/after-first-fixes.log)；收取后旧占位导致滚到y44 [几何诊断](r09-audit/scroll-diagnostics.log)；toast不消失与背景非inert [反馈基线](r09-audit/feedback-baseline.log)；右键缺入口 [基线](r09-audit/context-menu-baseline.log)；抽屉多余动画 [基线](r09-audit/drawer-effect-baseline.log) 与 [specificity冲突](r09-audit/drawer-specificity-failure.log)；确认框实际300ms [基线](r09-audit/dialog-effect-baseline.log)。早期并发原回归曾清理默认test-results而丢失一次临时trace，原日志保留；最终证据用96张逐步PNG和四份JSON，不依赖那份trace。中途新增测试的TypeScript名称遮蔽/HTMLElement联合类型报错已修正，[中间构建日志](r09-audit/pre-final-build.log)不是最终结果。

## 最终滑动、文案和效果测量

| 高度/语言 | document height / scrollY | inbox top / client / content | drawer top / client / content | toast进入→开始退出 | 记录 |
|---|---|---|---|---|---|
| 667 / en | 667 / 0 | 852 / 459 / 1748 | 11 / 493 / 504 | 2697.3ms | [JSON](r09-audit/667-en-walkthrough.json) |
| 667 / ko | 667 / 0 | 852 / 459 / 1748 | 11 / 493 / 504 | 2706.1ms | [JSON](r09-audit/667-ko-walkthrough.json) |
| 812 / en | 812 / 0 | 852 / 604 / 1748 | 0 / 638 / 638 | 2706.8ms | [JSON](r09-audit/812-en-walkthrough.json) |
| 812 / ko | 812 / 0 | 852 / 604 / 1748 | 0 / 638 / 638 | 2706.9ms | [JSON](r09-audit/812-ko-walkthrough.json) |

每组17态、24张PNG，合计 **96张真实PNG**，尺寸逐张验证375×对应高度。所测可见copy裁切计数0；667抽屉内容504高、容器493高，滚轮scrollTop11；812内容未超出容器，scrollTop0，未伪造滚动。普通sheet/收取确认/收取行动画事件分别0.3s/0.22s/0.45s；toast transitionend均0.2s。toast进入时刻由DOM observer采集，2700ms定时器在成功响应后先启动，帧调度使DOM进入→退出测值有数毫秒差异。已人工查看667英文选项、667韩文抽屉及收取后行可见截图。

## 截图与逐步走查清单

以下每一链接均为实际PNG；各组均覆盖17态，另含取消/失败/等待会话及长列表步骤。

| 状态/步骤 | 667 en | 667 ko | 812 en | 812 ko |
|---|---|---|---|---|
| inbox-empty | [PNG](r09-audit/667-en-inbox-empty.png) | [PNG](r09-audit/667-ko-inbox-empty.png) | [PNG](r09-audit/812-en-inbox-empty.png) | [PNG](r09-audit/812-ko-inbox-empty.png) |
| inbox-waiting | [PNG](r09-audit/667-en-inbox-waiting.png) | [PNG](r09-audit/667-ko-inbox-waiting.png) | [PNG](r09-audit/812-en-inbox-waiting.png) | [PNG](r09-audit/812-ko-inbox-waiting.png) |
| inbox-pending | [PNG](r09-audit/667-en-inbox-pending.png) | [PNG](r09-audit/667-ko-inbox-pending.png) | [PNG](r09-audit/812-en-inbox-pending.png) | [PNG](r09-audit/812-ko-inbox-pending.png) |
| inbox-collected-one | [PNG](r09-audit/667-en-inbox-collected-one.png) | [PNG](r09-audit/667-ko-inbox-collected-one.png) | [PNG](r09-audit/812-en-inbox-collected-one.png) | [PNG](r09-audit/812-ko-inbox-collected-one.png) |
| inbox-collected-all | [PNG](r09-audit/667-en-inbox-collected-all.png) | [PNG](r09-audit/667-ko-inbox-collected-all.png) | [PNG](r09-audit/812-en-inbox-collected-all.png) | [PNG](r09-audit/812-ko-inbox-collected-all.png) |
| inbox-unread | [PNG](r09-audit/667-en-inbox-unread.png) | [PNG](r09-audit/667-ko-inbox-unread.png) | [PNG](r09-audit/812-en-inbox-unread.png) | [PNG](r09-audit/812-ko-inbox-unread.png) |
| inbox-read | [PNG](r09-audit/667-en-inbox-read.png) | [PNG](r09-audit/667-ko-inbox-read.png) | [PNG](r09-audit/812-en-inbox-read.png) | [PNG](r09-audit/812-ko-inbox-read.png) |
| inbox-friends-empty | [PNG](r09-audit/667-en-inbox-friends-empty.png) | [PNG](r09-audit/667-ko-inbox-friends-empty.png) | [PNG](r09-audit/812-en-inbox-friends-empty.png) | [PNG](r09-audit/812-ko-inbox-friends-empty.png) |
| inbox-friends | [PNG](r09-audit/667-en-inbox-friends.png) | [PNG](r09-audit/667-ko-inbox-friends.png) | [PNG](r09-audit/812-en-inbox-friends.png) | [PNG](r09-audit/812-ko-inbox-friends.png) |
| inbox-drawer | [PNG](r09-audit/667-en-inbox-drawer.png) | [PNG](r09-audit/667-ko-inbox-drawer.png) | [PNG](r09-audit/812-en-inbox-drawer.png) | [PNG](r09-audit/812-ko-inbox-drawer.png) |
| inbox-search | [PNG](r09-audit/667-en-inbox-search.png) | [PNG](r09-audit/667-ko-inbox-search.png) | [PNG](r09-audit/812-en-inbox-search.png) | [PNG](r09-audit/812-ko-inbox-search.png) |
| inbox-search-empty | [PNG](r09-audit/667-en-inbox-search-empty.png) | [PNG](r09-audit/667-ko-inbox-search-empty.png) | [PNG](r09-audit/812-en-inbox-search-empty.png) | [PNG](r09-audit/812-ko-inbox-search-empty.png) |
| inbox-options | [PNG](r09-audit/667-en-inbox-options.png) | [PNG](r09-audit/667-ko-inbox-options.png) | [PNG](r09-audit/812-en-inbox-options.png) | [PNG](r09-audit/812-ko-inbox-options.png) |
| inbox-pinned | [PNG](r09-audit/667-en-inbox-pinned.png) | [PNG](r09-audit/667-ko-inbox-pinned.png) | [PNG](r09-audit/812-en-inbox-pinned.png) | [PNG](r09-audit/812-ko-inbox-pinned.png) |
| inbox-hidden | [PNG](r09-audit/667-en-inbox-hidden.png) | [PNG](r09-audit/667-ko-inbox-hidden.png) | [PNG](r09-audit/812-en-inbox-hidden.png) | [PNG](r09-audit/812-ko-inbox-hidden.png) |
| inbox-hidden-empty | [PNG](r09-audit/667-en-inbox-hidden-empty.png) | [PNG](r09-audit/667-ko-inbox-hidden-empty.png) | [PNG](r09-audit/812-en-inbox-hidden-empty.png) | [PNG](r09-audit/812-ko-inbox-hidden-empty.png) |
| inbox-notifications-off | [PNG](r09-audit/667-en-inbox-notifications-off.png) | [PNG](r09-audit/667-ko-inbox-notifications-off.png) | [PNG](r09-audit/812-en-inbox-notifications-off.png) | [PNG](r09-audit/812-ko-inbox-notifications-off.png) |
| collect-cancelled | [PNG](r09-audit/667-en-collect-cancelled.png) | [PNG](r09-audit/667-ko-collect-cancelled.png) | [PNG](r09-audit/812-en-collect-cancelled.png) | [PNG](r09-audit/812-ko-collect-cancelled.png) |
| collected-row-visible | [PNG](r09-audit/667-en-collected-row-visible.png) | [PNG](r09-audit/667-ko-collected-row-visible.png) | [PNG](r09-audit/812-en-collected-row-visible.png) | [PNG](r09-audit/812-ko-collected-row-visible.png) |
| list-failure | [PNG](r09-audit/667-en-list-failure.png) | [PNG](r09-audit/667-ko-list-failure.png) | [PNG](r09-audit/812-en-list-failure.png) | [PNG](r09-audit/812-ko-list-failure.png) |
| list-scroll-sticky | [PNG](r09-audit/667-en-list-scroll-sticky.png) | [PNG](r09-audit/667-ko-list-scroll-sticky.png) | [PNG](r09-audit/812-en-list-scroll-sticky.png) | [PNG](r09-audit/812-ko-list-scroll-sticky.png) |
| mark-read-failure | [PNG](r09-audit/667-en-mark-read-failure.png) | [PNG](r09-audit/667-ko-mark-read-failure.png) | [PNG](r09-audit/812-en-mark-read-failure.png) | [PNG](r09-audit/812-ko-mark-read-failure.png) |
| pin-failure | [PNG](r09-audit/667-en-pin-failure.png) | [PNG](r09-audit/667-ko-pin-failure.png) | [PNG](r09-audit/812-en-pin-failure.png) | [PNG](r09-audit/812-ko-pin-failure.png) |
| waiting-chat | [PNG](r09-audit/667-en-waiting-chat.png) | [PNG](r09-audit/667-ko-waiting-chat.png) | [PNG](r09-audit/812-en-waiting-chat.png) | [PNG](r09-audit/812-ko-waiting-chat.png) |

## 交付范围与复核

- [x] 先读本地原型实现，保存17态脚本、原型摘录与引用SHA256。
- [x] 先重现，再补R09可定位的流程反馈、效果与滑动问题；静态、业务及跨模块差异单列。
- [x] 完成四组真实点击走查、构建、原回归尝试、零值/范围检查与96张PNG核验；不伪造通过数。
- [x] 修订R09原结果并提交本分支；仅推送 `codex/r09-audit`，不合入main。最终提交SHA以执行汇报/git log为准。

[产物SHA256清单](r09-audit/artifact-manifest.json)。仅在当前主工作区工作；未操作R06-hint-fix独立worktree，未开GitHub Issue、未发Telegram、未用Figma API/token。按任务单要求仅单个R09 Codex执行；本轮做了范围/diff自查，未声称有独立代理审查。
