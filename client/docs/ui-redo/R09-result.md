# R09 收信箱结果（按现有产物修订）

原实现分支 `codex/r09-inbox`，最终提交 `1101db3`。本文件原先停留在沙箱受限阶段，曾错误地将所有截图/测试描述为未生成或未运行；现按仓库实际产物更正。2026-11-14 补查基线 `34ee55b`，补查分支 `codex/r09-audit`。最新流程、效果、滑动结论以 [R09-audit-result.md](R09-audit-result.md) 为准。

## 既有静态与测试产物

按本次任务前提，R09 静态已验，本轮沿用，不修改正常态尺寸、配色、字体或既有图标/素材。17 个状态既有真实 PNG 位于 `screenshots/R09-inbox-*.png`；量表位于 `r09/inbox-*.json`，不再把这些路径标为“预定/未生成”。本轮未重新声称所有关键元素误差≤1px。

原始 [verified-inbox.log](r09/verified-inbox.log) 实际为 **9 passed / 1 failed**；失败项为 `R09 Korean labels and short viewport keep artwork size`，记录的预期是 GowunDodum，实得 Fredoka。这是历史运行结果，不能冒充本轮通过数。原 A6 另有 d3 超时及独立重跑登录卡住的历史问题（任务已指出）；本轮不会改原测试以凑通过数。

| 既有状态 | PNG | 量表 |
|---|---|---|
| inbox-empty | [截图](screenshots/R09-inbox-empty.png) | [量表](r09/inbox-empty.json) |
| inbox-waiting | [截图](screenshots/R09-inbox-waiting.png) | [量表](r09/inbox-waiting.json) |
| inbox-pending | [截图](screenshots/R09-inbox-pending.png) | [量表](r09/inbox-pending.json) |
| inbox-collected-one | [截图](screenshots/R09-inbox-collected-one.png) | [量表](r09/inbox-collected-one.json) |
| inbox-collected-all | [截图](screenshots/R09-inbox-collected-all.png) | [量表](r09/inbox-collected-all.json) |
| inbox-unread | [截图](screenshots/R09-inbox-unread.png) | [量表](r09/inbox-unread.json) |
| inbox-read | [截图](screenshots/R09-inbox-read.png) | [量表](r09/inbox-read.json) |
| inbox-friends-empty | [截图](screenshots/R09-inbox-friends-empty.png) | [量表](r09/inbox-friends-empty.json) |
| inbox-friends | [截图](screenshots/R09-inbox-friends.png) | [量表](r09/inbox-friends.json) |
| inbox-drawer | [截图](screenshots/R09-inbox-drawer.png) | [量表](r09/inbox-drawer.json) |
| inbox-search | [截图](screenshots/R09-inbox-search.png) | [量表](r09/inbox-search.json) |
| inbox-search-empty | [截图](screenshots/R09-inbox-search-empty.png) | [量表](r09/inbox-search-empty.json) |
| inbox-options | [截图](screenshots/R09-inbox-options.png) | [量表](r09/inbox-options.json) |
| inbox-pinned | [截图](screenshots/R09-inbox-pinned.png) | [量表](r09/inbox-pinned.json) |
| inbox-hidden | [截图](screenshots/R09-inbox-hidden.png) | [量表](r09/inbox-hidden.json) |
| inbox-hidden-empty | [截图](screenshots/R09-inbox-hidden-empty.png) | [量表](r09/inbox-hidden-empty.json) |
| inbox-notifications-off | [截图](screenshots/R09-inbox-notifications-off.png) | [量表](r09/inbox-notifications-off.json) |

## 已知流程差异和本轮边界

原型是本地演示，真实实现使用服务端会话、收取、钱包和权限。不能加入无后端支持的演示回复、本地钱包或“Stored on this device”标签。Friends 过滤真实 following；行内未读来自服务端；收取请求沿用幂等键及真实费用确认。

原型选项有 Mark as unread、Report or block；现有收信箱选项为读、置顶、静音、关注、备注、隐藏，安全在聊天详情，隐藏页恢复通过选项。原型右侧菜单含活动/帮助/清空/通知设置，当前只暴露部分入口。R08 Continue chatting 仍未接入收信箱会话；这些差异及本轮浏览器、构建、回归的实际结果详见补查文档，不以历史静态结论覆盖流程失败。

本轮只补 R09 的失败保留、收取后视觉反馈和内滚行为；未修改 App.vue、登录/会话 token/account、支付请求/权限或其他模块。整体通过与否看补查四项表；不能把真实 PNG 存在等同于全部验收通过。
