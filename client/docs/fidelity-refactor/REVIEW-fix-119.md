# #119 · #116 还原度修复记录

工作基线：`codex/refactor-fidelity @ aa2c487`，未 rebase、合入 main 或 push。只改 Vue 展示组件、样式和界面状态；网络请求、后端和业务校验不变。

原 worktree 未包含审查文件；从本机 `claude-task-116` 找到并阅读原文，本次补入 [原审查](REVIEW-claude-116.md) 和原对照图，保留其 REQUEST_CHANGES 历史结论。

## 四项必须改

[三列视觉对照](fix-119/index.html)提供重新渲染的手机壳原型、aa2c487 修复前、最终修复后。客户端 Chromium 375×812、DPR 1，另有 375×667 矮屏证据。

| 项 | 修复与验证 | 图 |
|---|---|---|
| 1 资料控件覆盖 | 已修。My moments 和 + 移入网格后的 flex 行，不再使用固定 top。四张照片加上传卡形成两行，边界断言确认操作行在网格下方；点击 My moments 可进入列表。删除相关重复 top、伪元素及 refresh 覆盖。 | [前](fix-119/before/profile-four.png) / [后](fix-119/after/profile-four.png) |
| 2 矮屏重叠 | 已修。812 高保留 Figma 面板外操作行（面板底部以下 16px）；740 以下 footer 改正常文档流，面板底部留出导航空间。帽子与鸟群整体缩放上移，提示不再被覆盖。667 下断言 footer 底边不超过导航顶边。 | [写信前](fix-119/before/compose-short.png) / [后](fix-119/after/compose-short.png)，[首页前](fix-119/before/home-short.png) / [后](fix-119/after/home-short.png) |
| 3 外观弹层 | 已修上述审查缺项。男女卡片与颜色格带描边及圆形 ✓；飞行预览加底框、Replay 重启六帧预览；两个开关保留原 checkbox 绑定和键盘操作，显示为拨动开关；Done 完整可见，812 高面板无滚动。测试实际切换性别、颜色与动画并点击 Replay。REPORT 项15已纠正历史不实标记。 | [前](fix-119/before/appearance.png) / [后](fix-119/after/appearance.png) / [切换后](fix-119/after/appearance-selected-off.png) |
| 4 根欢迎页假返回 | 已修。删除 aria-hidden 装饰箭头及无用 CSS。 | [前](fix-119/before/welcome.png) / [后](fix-119/after/welcome.png) |

## Figma 取值

先阅读本机 `~/maugo-figma/FIGMA.md`，再递归查询完整树中的对应画框。没有提交或修改 Figma 数据文件。

- `bird-female`：画框 375×812；sheet (12,110) 351×678、圆角24、底色 #18211e；内容宽309。男女卡64高、圆角12、图56×52；颜色格95×74、圆角12、图64×48、横向间隔12、纵向14；开关38×22、圆角11、滑块16；Done 309×48、圆角24。面板总高度按上述值约束，避免原先65px颜色图片撑高。
- `compose-empty`：面板 (12,144) 351×496；按钮行 (21,657) 333×48，按钮间隔12。保留业务必需 Recipient ID。667 高没有独立 Figma 画框，响应式变体以不重叠、正文可滚动和操作可达为验收条件。
- `profile-empty`：New moment 44×44，卡片144高、网格间距12；多行照片状态采用网格后正常流，不再套用单行坐标。
- `welcome`：Figma 有返回按钮，但根页面无返回目标，按本任务允许的方案删除；其余布局保持。
- `settings-home`：页眉底 y112，首组 y136，补24px顶距；右侧使用现有16px细箭头资源。

## 非阻塞建议

- 已修：重复定位清理、写信禁用灰底灰字与 SVG 发送图标、设置首组顶距与细箭头、资料可见性箭头间距、空照片提示与操作行分离。
- 已修 Change bird 胶囊：复用现有外观选择器，返回后保留正文及收件人，发送校验和 API 不变；通过 Done 与 Escape 返回均测试草稿保留。
- 尚未修消息未读圆点：首页现有数据仅含来信和回应，没有消息未读计数；不能把来信数量冒充聊天未读。新增会话请求、聚合或跨组件状态属于本任务禁止的业务逻辑修改，需独立任务提供既有真实未读状态后接入。
- 尚未修 Not interested：当前阅读组件没有忽略/不感兴趣的业务操作或接口。仅关闭弹窗会保留同一封信，不能冒充原型的“不感兴趣”行为；本次不新增业务操作或伪按钮。
- 钱包/Pass 次要入口继续保留真实入口，矮屏截图可见且可达；未新增没有真实数据的导航标记。

## 验证

详细命令与结果见本目录 `fix-119/` 中日志。固定响应测试能证明界面行为和几何边界，不能代替真实数据库回归或全部226画框验收。

- `npm run build`：资源校验、vue-tsc、Vite 通过。
- `fix-119.config.ts`：四项前后截图；最终运行含边界与实际点击断言。
- `existing-ui.config.ts`：5/5 通过。测试产生的非本任务截图会还原。
- 原生产预览12个用例：12/12 通过，见 `fix-119/catalogue.log`。
- 实际尝试 `tests/d5.config.ts`：服务启动即报 `Database connection unavailable`，不能宣称真实数据库测试无回归。

本次四项必须改已修，非阻塞建议仍有两项因业务逻辑范围限制未实现，详见上文。未宣称全部页面完全还原。
