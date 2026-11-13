# D6 补缺第二轮结果

任务 #79，对应 GitHub Issue #64。整体状态：**blocked**，不满足全部四项完成条件。

## 逐项结论

1. **通过：全局资料可见范围接线。** 设置 → 隐私设置与本人资料页均可进入全局选择，读取 GET /profiles/me，保存调用 PATCH /profiles/me；everyone、friends、only_me 使用后端返回值。保留原有图片卡片独立可见范围。Chromium 验收三档切换、两个入口回读；真实 GET /profiles/:id 验证 everyone 非好友可访问，friends 与 only_me 非好友返回 403，本人三档均返回 200。好友正向访问未纳入本轮浏览器测试。
2. **部分通过，blocked：账号、安全与反馈。** 复用已落地 D7 入口，浏览器确认账号邮箱来自真实后端，安全页可达，真实退出成功且原会话令牌返回 401。本轮未执行账号删除，未改密码和密钥。App lock 仍为现有本机 PIN；实名认证仍显示未接入。反馈仍为现有本地保存，未接真实服务。当前 maugo/src/app.ts 注册的路由及后端源码没有反馈接口或契约，不能据此编造提交地址或宣称反馈已发送。需 Smith 提供已落地反馈服务的接口与验收范围，并明确是否要求服务器端安全设置/实名认证服务。
3. **blocked：推荐服务。** 后端现有 discovery 的 /letters 是来信发现服务；没有独立推荐列表或推荐偏好接口，设置页推荐开关仍禁用。未把来信接口冒充推荐服务，也未新增 mock 或猜测接口。需 Smith 明确推荐服务的实际接口、返回结构和推荐入口，或确认本任务所指推荐就是现有来信发现。
4. **blocked：Figma 高保真及动画验收。** 对文件 9ecnOjFdk2YjAJRG5TysNJ 调用 create_session 和 get_metadata 均返回无编辑访问权限。未读取到设计节点或动画参考，因此设置主页、语言、通知、隐私与可见范围、通用偏好、账号与安全、反馈、帮助及关于页面的布局/字体/间距/颜色/状态，以及页面切换、弹窗、开关、展开收起等动效的设计一致性均未验。浏览器交互通过与截图不代表设计对照通过。需文件所有者向当前 Figma 连接账号开放该文件权限。

## 验证与产物

- 客户端构建、vue-tsc 类型检查、343 张资源完整性检查通过。
- tests/d6-followup.config.ts / d6-followup-server.mjs / d6-followup.spec.ts：Chromium 1 项真实集成测试通过，无路由 mock。服务启动时创建独立的 maugo_d6_followup_时间戳 PostgreSQL 数据库并执行全部迁移；测试数据通过现有测试 fixture 创建，业务请求走 buildApp 真实实现。数据库保留，不删除业务数据。
- 本次仅改 SettingsFlow.vue、ProfileFlow.vue，新增本任务测试、本文档与 docs/d6-followup/ 下 7 张截图；无新依赖。
- 截图：profile-visibility.png、visibility-everyone.png、visibility-friends.png、visibility-only_me.png、settings.png、account.png、security.png。
- 无 git push；未关闭 Issue #54 或 #64，不能将部分通过标记为全部完成。

## 任务 #81：main 合入复核

- 已将 task-79 的两个组件、三份测试文件、本文档与七张截图复制到主仓库 main（基线 d0279d5），无合入冲突。组件改动与 task-79 一致，仅涉及全局资料可见范围；未新增 mock、推测接口或依赖。其余三项维持上述 blocked 结论。
- main 客户端构建、vue-tsc 类型检查、343 张资源检查通过；新增 Chromium 真实后端集成测试 1 项通过，新建隔离 PostgreSQL 数据库，三档全局可见范围及两个入口通过。
- 相关回归通过：D5 真实后端集成测试 1 项、D6 设置持久化与独立卡片可见范围测试 1 项。D6 默认测试端口已占用，使用 /tmp 临时配置及端口 3181/5281 验证，未修改仓库已有测试或配置；回归生成的既有截图与记录已恢复。
- **验收仍为 blocked：回归未全部通过。** D6 韩文业务页测试在帮助页期望“답장 10개”，实际显示英文帮助内容；使用未包含本次两个组件改动的 main 基线复测，同一断言失败。该问题属于任务明确排除的帮助/翻译范围，未扩大修改；需 Smith 决定另立修复任务或接受此已有失败作为本次验收例外。
- 未自行提交或推送，代码留在主仓库 main 工作区，交由 runner 提交推送；不能宣称已推送或全部验收通过。
