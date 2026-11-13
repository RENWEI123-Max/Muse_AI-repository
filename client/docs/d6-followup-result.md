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


## 任务 #93：#66 当前 main 基线复验

2026-11-13，基线 `81ff353`（当前 main 的 worktree，分支 codex/task-93）。本轮只做回归；未改业务逻辑、依赖或密钥，未提交、推送、合并或切分支。

### 通过清单

- D6 全套 5/5：设置持久化、韩文业务页、全局资料可见范围、真实反馈及推荐回归均通过。
- D6/D8 帮助相关专项 1/1：期望韩文、实际韩文，帮助页包含“답장 10개”；六条 FAQ 标题与展开内容均为韩文，包含“매일 답장 10개를 무료로 받을 수 있어요.”；切回英文帮助与 FAQ 通过。复用 ko-help.spec.ts，不运行 D8 旧版“反馈仅本机保存”断言，该断言已被真实 B19 反馈流程替代。
- everyone/friends/only_me 保存及真实后端回读通过；本人均 200，陌生人依次 200/403/403，通过真实 opening → reply → collect 建立的好友依次 200/200/403。本人资料与设置隐私两个入口回读通过，真实退出后会话返回 401。
- 客户端 build（含 343 张资源检查、vue-tsc、Vite）、独立 vue-tsc --noEmit、后端 tsc build 均退出 0。
- 真实当前源码后端，无接口 mock；PostgreSQL 5486 新建并保留隔离库 `maugo_d6_followup_1794560216886`（D6）与 `maugo_d6_followup_1794560277108`（韩文专项），均执行全部迁移。夹具只创建测试账号与数据，业务请求走真实路由。

### 失败清单

- 本次 #66 验收范围回归失败：无，#66 原有韩文帮助阻塞已消除，验收通过。
- Issue 操作限制：GitHub `/issues/93` 返回 HTTP 404，无法在不存在或不可访问的本 Issue 发表评论；结果回贴 #66。需 Smith/runner 提供本任务真实 Issue 编号后补贴，不影响 #66 回归结论。
- 首次本地构建因依赖软链接只读失败，复制现有依赖至 worktree 后复跑通过；韩文专项默认端口被占用，改用独立 3193/5293 复跑通过。仅将现有韩文测试的后端地址改为支持 D6_API_ROOT，默认行为保持不变，无新依赖。

### 真实测试输出

`d6.log`

```text
[WebServer] (node:483817) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

[WebServer] (node:483859) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)


Running 5 tests using 1 worker

(node:483919) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)

[1/5] tests/d6-feedback.spec.ts:2:1 › B19 feedback is sent, visible to moderation, and rate limit preserves input
[2/5] tests/d6-followup.spec.ts:2:1 › real global visibility and account logout
[3/5] tests/d6-recommendation.spec.ts:2:1 › recommendations use saved B4 filters and survive logout
[4/5] tests/d6.spec.ts:15:1 › D6 local settings persistence, states and cache confirmation preserve real account and ledgers
[5/5] tests/d6.spec.ts:73:1 › D6 Korean business screens keep user content intact
  5 passed (1.4m)
```

`ko.log`

```text
[WebServer] (node:484802) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

[WebServer] (node:484838) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)


Running 1 test using 1 worker

(node:484882) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)

[1/1] tests/ko-help.spec.ts:3:1 › Korean help and FAQ translate and switch back to English
  1 passed (17.9s)
```

`backend-build.log`

```text
> maugo-backend@0.1.0 build
> tsc
```

客户端构建末尾（完整临时输出 `/tmp/task93/client-build.log`）：

```text
dist/assets/GowunDodum-I-ggDY9m.ttf                            7,229.09 kB
dist/assets/index-B_nLSWgA.css                                    85.75 kB │ gzip:  17.06 kB
dist/assets/index-5V30zq_e.js                                    401.77 kB │ gzip: 121.13 kB
✓ built in 5.78s
```

独立类型检查输出为空，退出码 0。

Issue #66 已发布[复验评论](https://github.com/RENWEI123-Max/Muse_AI-repository/issues/66#issuecomment-6848543473)，并关闭为 completed；Issue #93 返回 404，未能回贴。
