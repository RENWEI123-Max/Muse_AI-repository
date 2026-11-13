# D7 · 模块 14 验收（任务 #71）

实现：`src/components/AccountSecurity.vue`；入口通过现有 SettingsFlow → ProfileFlow → HomeFlow → App 事件连接。未改后端业务代码、未加依赖。依据交接包 `04-开发资料/page-states.json` 的 account 模块及手机壳离线原型实现分组菜单、鸟图、PIN 底部弹层、注销保护表单、最终确认弹窗；页面滑动淡入、弹层位移和遮罩渐变均可交互。

| 状态 | 通过证据 | 截图 |
|---|---|---|
| security | 设置进入账号安全页，账号、PIN、验证、导出、注销和退出按钮可操作 | [主页面](d7-security.png) |
| account-info | 从真实鉴权接口读取当前邮箱，展示登录方式和账号类型 | [当前邮箱](d7-account-info.png) |
| verification | 明确展示 Not connected；不采集照片或生物信息，返回按钮有效 | [身份验证未接入](d7-verification.png) |
| pin-create | App lock 打开创建 4 位 PIN 的底部弹层 | [创建 PIN](d7-pin-create.png) |
| pin-invalid | 输入 12 后提交显示 Enter a 4-digit PIN，不开启锁 | [格式错误](d7-pin-invalid.png) |
| pin-locked | 设置 1234 后主动锁定；后台事件同样锁定，底层内容 inert，Escape 无法绕过 | [锁定](d7-pin-locked.png) |
| pin-wrong | 0000 显示 Incorrect PIN，1234 可解锁；关闭 PIN 同样校验旧 PIN | [PIN 错误](d7-pin-wrong.png) |
| signout-confirm | 确认弹窗可取消，取消后保留当前登录 | [退出确认](d7-signout-confirm.png) |
| signed-out | 确认退出调用真实 logout，返回欢迎页，当前登录令牌访问导出返回 401 | [退出欢迎](d7-signed-out.png) |
| delete-disabled | 初始注销按钮禁用 | [初始保护](d7-delete-disabled.png) |
| delete-typed | 仅输入 DELETE，未确认数据范围仍禁用 | [已输入 DELETE](d7-delete-typed.png) |
| delete-ready | 输入 DELETE 且勾选不可撤销确认后启用 | [可发起注销](d7-delete-ready.png) |
| delete-final | 发起真实服务端 challenge 后显示最终确认，必须填写当前密码；错误密码不注销，取消不注销 | [最终确认](d7-delete-final.png) |

额外通过：正确密码完成真实测试账号注销后返回欢迎页（[截图](d7-deleted-welcome.png)），原账号凭证失效；第二账号邮箱及 PIN 状态独立（[截图](d7-account-isolation.png)），跨账号读取第一账号会话被拒绝；注销第一账号后第二账号 profile、conversations、messages、posts、wallet、collections 保持一致，第二账号仍可正常登录。PIN 按真实用户 ID 保存随机盐及 SHA-256 摘要，不存明文，重新登录同账号仍需 PIN；退出卸载账号页面，不沿用前一账号内存状态。

验证：`npm run build` 通过，资产校验、TypeScript 和 Vite 构建通过。`npm run dev` 由 Playwright 启动并实际服务浏览器。`tests/d7.config.ts`、`tests/d7-server.mjs`、`tests/d7.spec.ts` 使用完整现有迁移创建独立 PostgreSQL 测试库、真实后端路由及 Chromium，逐项断言上述 13 状态、退出、注销和隔离，浏览器脚本错误为零。截图保存在本目录，随代码提交。

测试连接通过既有数据库配置注入，只在新建的 `maugo_client_d7_test_*` 测试库内生成和注销测试账号；未操作既有业务数据，未改密码或密钥。测试库保留，不执行删库。

失败清单：无。身份验证服务未接入是交接清单要求的明确展示状态，不声称已实现外部身份认证。

交付阻塞：Issue 评论未写入。对仓库 `RENWEI123-Max/Muse_AI-repository` 的 Issue #71 读取和评论 POST 均返回 GitHub HTTP 404 / Not Found；现有凭证无法访问目标。需要 Smith 确认 Issue 目标并提供具有该仓库 Issue 评论权限的凭证，或由 runner 将本文件内容同步到评论。客户端实现及上述测试已通过，不将评论写入计为完成。
