# 币账 · D2

原生 Objective-C/UIKit + Fastify/pg。仅 D2 骨架与登录；行情 D3、记账 D5、Telegram D7。

## 后端

```sh
cd bizhang/server
npm ci
npm test
# PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD 由运维注入，不读取 .env。
npm run migrate
# 通过 stdin 输入新密码；不在参数、历史或日志里传密码。
npm run seed
npm start
```

`migrate`/`seed` 需使用币账数据库的迁移权限连接；运行角色不能执行 DDL 或新增用户。sg-claude 首次初始化由 `scripts/provision-remote.mjs` 经 Docker 本地管理 socket 完成：它只创建 bizhang，且遇到既存库/角色立即停止。此脚本生成的运行配置是币账独立新凭据，位于 `/srv/bizhang/private/runtime.json`（0600），不入仓库。

当前运行入口：`cd /srv/bizhang/server && node scripts/run-remote.mjs`。D2 采用独立 nohup 进程，不增加 systemd、Docker、反代或防火墙配置。重启时先根据 `ss -lntp 'sport = :3100'` 确认只操作币账 PID，禁止终止其他服务。后端绑定地址在代码中固定为 `127.0.0.1`，禁用 3000/8080/8081/8082。

数据库 owner：`bizhang_owner`（NOLOGIN）；应用：`bizhang_app`（无超级用户/建库/建角色权限，仅 auth 所需表/列/序列权限）。14 张表 = 架构 12 张 + IP 限流 + 迁移版本。

所有计划中的 API 先鉴权；D2 只实现 `POST /auth/login`、`POST /auth/logout`、`GET /me` 与受保护 `/healthz`。其余持有效 token 返回 501。登录是唯一公开例外，无注册接口。错误遵循 `error.code/message`，ID 由 pg 保持十进制字符串。日志不记录请求、Authorization 或返回体。

## iOS

打开 `ios/BiZhang.xcodeproj`，选 BiZhang / iPhone 模拟器 / Debug。

```sh
ssh -o ExitOnForwardFailure=yes -N -L 127.0.0.1:13100:127.0.0.1:3100 sg-claude
xcodebuild -project bizhang/ios/BiZhang.xcodeproj -scheme BiZhang \
  -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 17' build
```

Debug.xcconfig 注入 `http://127.0.0.1:13100/api/v1`；Info-Debug.plist 只允许本地网络，无全局 ATS 例外。Release 地址留空，D9 获得 HTTPS 域名再配置。App iOS 15+；当前 Xcode 的 XCTest framework 最低系统为 17，只有测试 bundle 设为 17。本地 ad-hoc 签名用于模拟器 Keychain entitlement，不需要开发者账号；D9 再处理真机签名与正式前缀。

`BiZhangTests` 包含 Keychain/缓存、NSURLSession/ATS、真实隧道登录/吊销测试。通过 `TEST_RUNNER_BZ_TEST_PASSWORD` 环境变量传入新建币账验收密码，禁止打印。两次独立 XCTest 运行设置 `TEST_RUNNER_BZ_TEST_PHASE=persist` / `restore`，仅执行 `testProcessPersistence`，可验证登录页提交、跨进程 Keychain 保持及退出清理。两阶段之间不卸载 App。完整集成测试需要隧道与已初始化 Smith；普通 `npm test` 不需要数据库。

证据和结果见 [D2-report.md](D2-report.md)。不会调用 Telegram，不含第三方 iOS 依赖。

### D4 行情与总览

新增原生 `Features/Market`、`Features/Overview`，模型与格式化位于 `Models` / `Core/Format`，离线缓存位于 `Core/Cache`。行情使用后端 `usd_price`、`price_sgd`；不做换汇或成本/盈亏计算。行情可见时每 30 秒刷新、年龄每秒更新；总览可见时每 60 秒刷新现有 `/me` 边界，D5 接 `/portfolio`。进后台或离开页面停定时器。

`python3 bizhang/ios/d4-acceptance.py` 会经 sg-claude 使用 password.js 生成随机临时用户，运行 iPhone 17 单测并保留临时登录用于截图。交互输入 `live` / `offline` / `stale` / `recovered` 执行截图断言；`done` 删除该用户及全部会话；`suite` 可运行最终全套。先按 D2 命令运行 13100 隧道，离线场景只断本次隧道。脚本不读取既有账号文件或任何运行凭据；不部署。故障注入需由操作者临时屏蔽 Binance，等至少 121 秒并恢复。截图与行情原始 JSON（不含 token）输出到 `bizhang/evidence/d4/`；完整 xcodebuild 日志在本机同目录。

重启时缓存一律保守显示已过期，再异步刷新；不会依赖可被用户调整的系统时间认定缓存新鲜。抓取墙上时间只用于显示 HH:mm SGT。模拟器无法验证真机数据保护加密属性，写入仍使用 Complete 文件保护。
