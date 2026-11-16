# 币账 D2 交付报告

日期：2026-11-16（SGT）。分支：`codex/bizhang-d2`。代码：`~/Muse_AI-repository/bizhang/`。已按架构 §7 的 D2 行完成；行情采集不是本日范围。

## 交付

- `server/`：Node + Fastify + pg，锁文件；事务迁移与版本记录；架构 §3 的 12 张表全部落地，金额/数量/价格/汇率均为 `NUMERIC(38,18)`，十币种子顺序和 Kraken/Binance/CoinGecko 映射与架构一致。另增 IP 限流与迁移版本表，共 14 表。
- sg-claude 的 `maugo-postgres-1` 内新建独立 `bizhang` 库、`bizhang_owner`（NOLOGIN）及 `bizhang_app`（LOGIN，无超级用户/建库/建角色权限）。撤销本库 PUBLIC 权限，运行角色仅获认证需要的表/列/序列权限，无 schema CREATE 或交易写权限。只走服务器回环 `127.0.0.1:5432`。非模板库数量由 D1 的 228 变为 229；未修改其他库。
- 登录仅 `{username,password}`；scrypt + 随机盐；不存在账号也执行 dummy scrypt。Smith 由初始化 seed 创建，无注册接口。32 字节随机 token，数据库只存 SHA-256，30 天有效，退出即吊销当前会话。
- IP 10 次/分钟采用数据库持久窗口；账号并发失败计数由 advisory lock + 行锁串行化，5 次失败锁 15 分钟，成功重置。返回 429 时带 Retry-After；不信任客户端 X-Forwarded-For。
- `/api/v1` 下统一鉴权和结构化错误；除公开限流登录外，21 个计划路由（含 healthz）全部要求 Bearer。后续业务接口持有效 token 返回 501，避免把占位接口描述为已实现。
- `ios/`：BiZhang App + BiZhangTests，Objective-C、ARC、UIKit、纯代码 Auto Layout、Scene 生命周期、iPhone 竖屏、iOS 15+、中文界面、零第三方库。五个 tab 均包 UINavigationController，设置页提供退出。BZTheme 使用原型浅/深色板。
- BZAPIClient：NSURLSession 请求 15s / 资源 30s，无 Cookie/URLCache；Bearer；GET 网络错误/5xx 最多重试 2 次（1s/3s）；401 清 Keychain/缓存并回登录；丢弃旧会话响应，避免退出后的请求回写缓存。空 POST 不发送 JSON Content-Type，已验证服务端实际收到退出请求。
- BZKeychain：独立 service/account，WhenUnlockedThisDeviceOnly；只保存 token。缓存位于 `Library/Caches/BZ/<user_id>/me.json`，使用文件保护，退出或 401 删除整个 BZ 目录。
- Debug.xcconfig 注入地址至 Info-Debug.plist；唯一 ATS 例外为 NSAllowsLocalNetworking=YES，无全局 ATS 放宽。Release plist 无 ATS 例外，地址留待 D9 配置。

## 验收结果

| 必验项 | 结果与证据 |
|---|---|
| 无 token / 伪造 token 调所有受保护接口均 401 | 通过。21 路由 × 2 = 42 次真实 HTTP，经 SSH 隧道访问已部署进程。`evidence/http-boundary.txt`；唯一例外为架构明确公开的 POST /auth/login |
| 后端仅监听 127.0.0.1 | 通过。`evidence/server-final.txt` 中 ss -lntp 输出见下；未开公网端口/反代/HTTPS |
| 模拟器经隧道登录成功 | 通过。iPhone 17（3F5C0C26-5630-4912-A62D-CAAAF725068F，iOS 27.2）；persist 阶段实例化原生登录页，填写字段并发送按钮 action，真实登录并写 Keychain/缓存 |
| 杀进程重开仍保持登录 | 通过。persist 后显式 simctl terminate，再 launch；重开截图为五 tab；独立 restore 测试进程读取保留会话，真实 GET /me 返回 Smith。`evidence/relaunched.png`、`evidence/xctest-summary.txt` |
| 退出后 Keychain 与缓存清空 | 通过。restore 调真实 logout，断言 Keychain 为空、BZ 缓存目录不存在；再次启动显示登录页。另验证旧 token 401，401 也清理 Keychain/缓存。`evidence/logged-out.png`、`evidence/cache-cleanup.txt` |
| 构建 | 通过。Debug build 与最终 XCTest 所需 App/Test 构建均成功；完整日志在本机 evidence/build.log、evidence/xctest-*.log（不入 Git） |
| 后端单测 | 通过。Mac 与 sg-claude 均 2/2；覆盖 scrypt 和全部路由缺失/伪造/格式错误 token。`evidence/backend-unit.txt`、`evidence/server-final.txt` |
| PostgreSQL 实库验收 | 通过。70 项断言：路由、32 字节 token/仅 hash/30 天、过期/吊销、IP 第 11 次 429、伪造 XFF 不绕过、5 次并发失败锁 15 分钟、锁到期、成功重置、12 表/10 币/最小权限。结束后删除本次验收会话、复原 Smith 失败计数。`evidence/backend-live.txt` |
| BiZhangTests | 通过。完整套件 4 项 0 失败（持久化方法在全套运行中不执行分阶段逻辑）；随后 persist / restore 两次独立进程各 1 项 0 失败，实际验证持久化。`evidence/xctest-summary.txt` |

最终监听证据：

```text
State  Recv-Q Send-Q Local Address:Port Peer Address:PortProcess
LISTEN 0      511        127.0.0.1:3100      0.0.0.0:*    users:(("node",pid=2957577,fd=22))
```

连接与端口：服务器后端 `127.0.0.1:3100`，Mac 隧道 `127.0.0.1:13100`，iOS Debug base URL `http://127.0.0.1:13100/api/v1`。部署前与重启前均确认 3100 空闲；未使用 3000/8080/8081/8082。

```sh
ssh -o ExitOnForwardFailure=yes -N \
  -L 127.0.0.1:13100:127.0.0.1:3100 sg-claude
```

## 运维与复现

服务器目录 `/srv/bizhang/server`。本日仅独立 nohup 进程，未增加或修改现有服务管理配置。运行入口 `node scripts/run-remote.mjs`；不要对其他 Node 进程执行批量 kill。最终源文件已同步，独立币账进程已重启并再次通过真实 HTTP 鉴权检查。

迁移由 Docker 本地管理 socket `SET ROLE bizhang_owner` 执行，运行配置仅含新生成币账凭据，位于 `/srv/bizhang/private/runtime.json`（0600、父目录 0700），不入 Git。Smith 初始密码为本次新生成验收凭据，只留在 Mac `/private/tmp/bizhang-d2-new-account.json`（0600）供 Muse 安全接管；报告不列值。未读取已有服务密钥、Bot token、.env 或进程环境。

常规后端测试：`npm ci && npm test`（在 server 下）。真实 HTTP 边界：隧道运行时 `node bizhang/server/scripts/http-boundary.mjs`。iOS 可重复验收入口 `bizhang/ios/run-acceptance.py`，新建币账账号密码由 stdin 输入，脚本不打印；测试环境传入进程，三阶段依次执行。详细命令见 README。

本地结果包：`/private/tmp/bizhang-all-6.xcresult`、`/private/tmp/bizhang-persist-6.xcresult`、`/private/tmp/bizhang-restore-6.xcresult`。首次测试发现的签名、测试架构及空 POST 问题已修复；旧失败结果包已清理。模拟器 Keychain 使用本地 ad-hoc 签名与专用 entitlement；未申请或使用 Apple Developer 账号。App 最低系统保持 iOS 15；当前 Xcode XCTest 框架最低 iOS 17，因此仅测试 bundle 设为 17。

## 下一步缺口

- D3：4 源采集、时间戳/过期、双源状态机、退避和 CoinGecko 月度计数；今天没有虚构行情数据。
- D4–D8：真实业务页、完整离线缓存、记账/成本、提醒、Telegram 和汇总；今天无 Bot 申请、token 或消息调用。
- D9：正式 HTTPS 域名/反代、Release URL/ATS 构建防线、真机签名与正式 Keychain 前缀；Release URL 当前为空，不能用于分发。
- D10：备份恢复与故障回归。当前独立 nohup 不提供开机自启；正式服务管理在后续运维阶段处理。
- Smith 当前为开发验收账号，真实使用前由 Muse 安全接管并更换初始化凭据；当前无开放注册或密码重置接口。

本次只新增 bizhang 目录与独立服务器目录/数据库，未修改 MauGo 代码、配置、用户、会话或其他数据库。仓库原有 client 两处未跟踪文件保持原状，不随本次提交。
