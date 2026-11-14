# Shell fix implementation plan

**Goal:** 修复共用外壳、按下态、sheet、toast、switch，保留模块与服务端行为。
**Spec:** /Users/anna/task-shell-fix.md
**Architecture:** base.css 约束视口与滚动边界；components.css 统一效果；main.ts 最后加载共用样式，App.vue 只加外壳 class。
**Constraints:** 基线 04326fa；仅 codex/shell-fix；不改业务、支付、token；本地参考；不合并 main。

- [x] 浏览器复现 667/760/812 外壳高度、欢迎页按钮可达性；提取原型 9/6/12 和滚动清单。
- [x] 修改共用样式与加载结构；检查 press 数值、sheet .3s / dialog .22s、toast .2s、toggle .2s。
- [x] 构建、浏览器测量、两高度英韩截图、源码范围审查；如实记录未覆盖的模块效果、滚动与文案。
- [x] 写结果，提交并推送，不合入 main。

Review focus: 740–811 高度旧 min-height；667 首页场景遮挡操作；弹层内超长内容；英韩文案；reduced-motion。

执行结果以 ../shell-fix-result.md 为准；完成实施与核实不等于验收全通过。
