# D8 模块 15 验收结果

结论：14/14 页面状态的浏览器交互断言通过；**仅为状态实现通过，D8 尚未全部完成，不具备正式法律内容与客服上线条件**。正式隐私政策、服务条款、EULA 和客服邮箱待 Smith 提供。反馈目前仅保存于本机，不会发送给客服，也没有工单处理状态。

实现位于 `src/components/SettingsFlow.vue`，复用现有设置入口、页面过渡、配色、字体与鸟素材；`src/lib/support-content.ts` 集中保存 FAQ、指南、三份法律文本占位和客服邮箱常量。`AuthFlow.vue` 同步使用该文件，移除原有草拟法律文案。未增加依赖，未修改后端业务代码。

依据：交接包 `04-开发资料/page-states.json` 的 `support` 模块全部 14 个状态；界面及交互参考 `03-成品UI/源文件/MauGo.html`。法律内容按本任务约束使用显式占位，不复制原型草案。服务端存储说明根据真实后端调整，反馈始终显示本机保存与未发送。

## 逐项证据

375 × 812 浏览器视口；下列链接均为提交到 `client/docs/` 的实际截图。

| 状态 ID | 浏览器断言与交互证据 | 截图 | 结果 |
| --- | --- | --- | --- |
| help | 设置 → 帮助；自助服务入口、鸟图消息卡、FAQ 快捷入口、反馈与隐私入口可用；客服地址显示待 Smith 标记 | [帮助主页](d8-help.png) | 状态通过；邮箱待提供 |
| faq | 点击帮助中心，显示 6 条可折叠问题 | [问题列表](d8-faq.png) | 通过 |
| faq-expanded | 第一条展开显示答案，重复点击可收起；展开有淡入位移动效 | [展开答案](d8-faq-expanded.png) | 通过 |
| feedback-empty | 空反馈保存按钮禁用；类型选择、可选邮箱、图片入口可操作 | [空表单](d8-feedback-empty.png) | 通过 |
| feedback-filled | 输入状态清单指定建议后保存按钮启用 | [已填写](d8-feedback-filled.png) | 通过 |
| feedback-invalid | 无效邮箱点击保存出现明确错误，历史记录仍为 0 | [邮箱错误](d8-feedback-invalid.png) | 通过 |
| feedback-history | 真实界面保存建议，历史含原文、类型、日期与“Saved on this device / Not sent”；关闭设置再打开仍保留；保存不发反馈网络请求，不显示已处理 | [本机历史](d8-feedback-history.png) | 本机状态通过；非工单提交 |
| about | 显示品牌图、版本、社区规范、法律说明、帮助与活动空态入口 | [关于](d8-about.png) | 通过 |
| guidelines | 社区规范入口显示善待他人、隐私及反垃圾内容；返回可回到来源页面 | [社区规范](d8-guidelines.png) | 通过 |
| safety-guide | 安全入口显示账号保护、链接风险及举报拉黑指引 | [安全指南](d8-safety-guide.png) | 通过 |
| privacy-policy | 隐私页面显示 `[PRIVACY_POLICY_PENDING_SMITH]` 与不具备发布条件提示；登录隐私说明复用同一来源 | [隐私占位](d8-privacy-policy.png) | 状态通过；正式内容未通过 |
| terms-full | 同页分别显示 `[TERMS_OF_SERVICE_PENDING_SMITH]` 与 `[EULA_PENDING_SMITH]`；登录协议同源 | [条款与 EULA 占位](d8-terms-full.png) | 状态通过；正式内容未通过 |
| system-empty | 关于 → 系统消息，显示 “You are all caught up.” 并说明未接入消息流 | [系统消息空态](d8-system-empty.png) | 空状态通过 |
| interactions-empty | 关于 → 互动，显示 “Nothing here yet.” 并说明未接入互动流 | [互动空态](d8-interactions-empty.png) | 空状态通过 |

## 验证与范围

- `tests/d8.config.ts`、`tests/d8-server.mjs`、`tests/d8.spec.ts`：Playwright 启动真实 Fastify 应用，连接 PostgreSQL 并新建独立的 `maugo_client_d8_test_<时间戳>` 数据库，执行现有迁移和现有测试播种。认证通过真实 `/auth/login`，没有拦截或伪造业务 API 响应。
- 额外验证图片选取预览及移除、FAQ 再收起、历史记录重进保留、帮助中的删除入口到真实账号安全页；无浏览器运行时错误。
- 保存反馈前后从真实 `/users/me/export` 比较 profile、conversations、messages、posts、wallet、collections，均未发生反馈引起的修改。
- 客户端构建通过：343 张 PNG 素材校验、TypeScript 检查和 Vite 构建成功。测试仅新建隔离库并关闭连接，没有删除数据库或生产数据，没有修改密码和密钥。
- 测试支持 `TEST_DATABASE_URL` 或 `MAUGO_TEST_ENV` 指向已有测试连接配置；本次复用服务器现有连接配置，但所有应用表与测试数据均只创建在新隔离库中。
- 本机历史沿用现有客户端按会话 token 隔离的存储风格；不承诺换设备或重新登录后同步。系统消息和互动仅验收清单要求的空状态，尚未接入对应消息流。

## 未通过 / 待 Smith 提供

1. **正式隐私政策**：待 Smith 按开发计划 E2 提供，替换 `legalText.privacy`。当前只是显式占位。
2. **正式服务条款**：待 Smith 提供，替换 `legalText.terms`。当前只是显式占位。
3. **正式 EULA**：待 Smith 提供，替换 `legalText.eula`。当前只是显式占位。
4. **真实客服邮箱**：待 Smith 提供，替换 `supportEmail`；当前为 `[SUPPORT_EMAIL_PENDING_SMITH]`，未构造假邮箱或 mailto 链接。
5. **真实反馈提交 / 工单跟进**：现有后端无反馈接口，本任务禁止修改后端。本次仅完成本机保存、校验与历史状态，未实现服务器提交、客服接收或处理跟踪。后续需 Smith 确定实际接收渠道与接入安排。

结果已发布至 [Issue #61 评论](https://github.com/RENWEI123-Max/Muse_AI-repository/issues/61#issuecomment-6846395018)，分别列出通过与未完成清单；代码仍交由 runner 自动提交推送。
