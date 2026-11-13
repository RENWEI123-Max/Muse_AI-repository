# C2 模块01验收

代码在 client/src/components/AuthFlow.vue、src/lib/api.ts、src/styles.css；沿用 C1 素材、字体和转场。协议正文来自原型 legal.js（版本1.0），默认未勾选。昵称保留在当前表单，不向无昵称字段的认证接口伪造提交。密码与会话仅在内存中，退出调用后端撤销会话。

## 逐状态结果

| ID | 状态 | 结果 |
|---|---|---|
| welcome | 欢迎 / 未登录 | 通过；浏览器交互与截图验证 |
| terms-unchecked | 协议 / 未勾选 | 通过；浏览器交互与截图验证 |
| terms-checked | 协议 / 已勾选 | 通过；浏览器交互与截图验证 |
| signin-empty | 邮箱登录 / 空表单 | 通过；浏览器交互与截图验证 |
| signin-filled | 邮箱登录 / 已填写 | 通过；浏览器交互与截图验证 |
| signin-invalid | 邮箱登录 / 邮箱错误 | 通过；浏览器交互与截图验证 |
| signup-empty | 注册 / 空表单 | 通过；浏览器交互与截图验证 |
| signup-filled | 注册 / 已填写 | 通过；浏览器交互与截图验证 |
| signup-mismatch | 注册 / 密码不一致 | 通过；浏览器交互与截图验证 |
| verify-empty | 验证码 / 待输入 | 通过；浏览器交互与截图验证 |
| verify-error | 验证码 / 输入错误 | 通过；浏览器交互与截图验证 |
| verify-resend | 验证码 / 重发倒计时 | 通过；成功发码响应由浏览器测试模拟，60秒倒计时；真实SMTP 503另测通过 |
| forgot-empty | 找回密码 / 邮箱 | 通过；浏览器交互与截图验证 |
| recovery-code | 找回密码 / 验证码 | 通过；浏览器交互与截图验证 |
| new-password | 重设密码 / 待填写 | 页面通过；后端无更新密码接口，提交如实提示不可用 |
| new-password-error | 重设密码 / 密码不一致 | 通过；密码不一致提示 |
| apple-private | Apple / 隐藏邮箱 | 通过；默认隐藏邮箱，真实接口无令牌报错，不伪造会话 |
| apple-share | Apple / 共享邮箱 | 通过；切换共享邮箱，仅显示授权意向，不伪造邮箱 |
| auth-privacy | 登录前 / 隐私说明 | 通过；按实际接口说明数据使用，未保留原型的假离线说明 |

## 验证与边界

- 生产构建、343素材校验通过。开发服务器由 Playwright 启动并用于浏览器验收。
- 浏览器真实注册→SMTP 503提示→错误验证码→退出→登录→退出通过；Apple真实接口返回identityToken required，页面显示失败，无成功会话。
- 19状态逐项执行 page-states.json 的动作，截图在 test-results/module01/。成功发送及倒计时使用明确的测试拦截响应；不代表SMTP已配置。其他集成测试不拦截认证接口。
- 测试服务只读取后端源码，新建 maugo_client_c2_test_时间戳 专用数据库并执行已有迁移，不改后端文件或已有业务数据库，不删除数据库。测试服务由 Playwright 自动管理；需要本机PostgreSQL及创建测试数据库权限，可通过 TEST_DATABASE_URL 提供连接。
- 邮件发码失败不会提示成功；收到429则遵循服务端retryAfter。成功发送按60秒倒计时，离开验证码页后仍按真实截止时间计算。
- 找回密码经发码/验码进入新密码页；后端没有重设密码API，提交明确提示不可用。Apple隐藏/共享邮箱是授权意向UI，原生授权、客户端ID和账号绑定未接通，未伪造令牌、邮箱或成功状态。
- 开发默认代理到 http://127.0.0.1:3000，可用 MAUGO_API_TARGET 覆盖；生产/原生默认直连该地址，可用 VITE_API_BASE_URL 覆盖（直连需服务端允许跨域）。未实现跨模块主页，仅提供真实登录会话确认和退出。
- 审阅入口 /?auth=signin、signup、consent、verify、recovery、forgot、password、apple、privacy；可用email参数预填邮箱。直接打开表单仍须协议同意后才会提交注册/登录。

## 尚待配置

SMTP账号、Apple原生授权及服务端完整绑定、重设密码API仍由后端/产品负责人提供；页面不宣称这些服务已可用。
