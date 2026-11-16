# 币账 D4 交付报告

日期：2026-11-16。基线 main `b50843f`，分支 `codex/bizhang-d4`。仅修改 monorepo `bizhang/`；本报告为任务指定的家目录交付件。

## 已实现

- 原生 Objective-C / UIKit 纯代码行情页 `Features/Market/BZMarketViewController`，十币顺序 BTC、ETH、SOL、USDT、USDC、BNB、XRP、DOGE、ADA、LINK。显示币名、价格、24h 变化、ok / stale / paused_divergence / unverified，以及主源和输入时间。原型色块、导航来源时间行、USD/SGD `BZCurrencySwitch`、`BZStatusBanner` 三态。
- 严格解析后端 `/market/quotes` 实际字段 `usd_price`、`price_sgd`、`raw_source_ts`、`ref_ts`，金额必须为十进制字符串，以 NSDecimalNumber 格式化；SGD 直接读后端，不乘汇率。拒绝 CoinGecko 作为报价来源、拒绝异常 FX JSON。
- 价格年龄为响应 server_time 减主源时间，加本地 systemUptime 流逝，超过 120 秒强制过期。手机系统时间只用于缓存抓取时间的展示，不判断价格是否新鲜。
- `BZCacheStore` 按 `Library/Caches/BZ/<user_id>/market-quotes.json` 保存最后成功原始 JSON、fetched_at、server_time；目录 Complete 保护、原子写 + NSDataWritingFileProtectionComplete。沿用 D2 用户身份与登出/401 清目录逻辑。启动先渲染缓存再异步刷新，进程恢复的缓存保守标过期，避免跨重启用墙上时钟计算年龄。
- 行情前台可见时 30 秒轮询、每秒更新年龄；总览 60 秒刷新、支持下拉；后台或离开页面停止定时器。仅访问既有后端 API。当前没有离线写按钮，不新增写入队列。
- 总览四张空状态卡：总市值、持仓表结构、今日提醒、每日汇总。无假金额、无成本/盈亏运算。D5 前仅刷新既有 `/me` 边界，未调用不存在的 `/portfolio`。
- 后端仅改 tick() Binance 年龄门 180→120 秒，补 121 秒拒绝/120 秒接受单测。未部署到 sg-claude。

## 验收结果与证据

证据根目录：`~/Muse_AI-repository/bizhang/evidence/d4/`。完整构建与测试日志位于该目录，摘要 `acceptance-summary.txt`。

| 项目 | 结果 | 证据 |
|---|---|---|
| iPhone 17 构建 | 通过，iOS Simulator 27.2 | build.log；后续各 XCTest 亦重新构建 |
| BiZhangTests | 8 个、0 失败，1 个截图专用测试在普通套件跳过；登录/撤销、精度/解析/缓存等通过 | xctest.log、xctest-final.log；xcresult 路径在日志末尾 |
| 真实十币顺序、USD/SGD | 通过；测试逐行断言 SGD UI 使用 snapshot.price_sgd 的格式化值 | live.log、live-quotes.json、live-usd.png、live-sgd.png、live-bottom.png |
| 总览四卡空状态 | 通过，无金额/盈亏假数据 | live-overview.png |
| 前后台轮询 | 首次进入行情 timer=30、总览 timer=60；后台均停、前台只恢复当前可见页 | live.log 的 testD4Evidence 断言 |
| 离线杀进程重启 | 通过：先有网缓存，停本次 13100 隧道，再由 XCTest 重启 App 进程并打开行情；显示“离线 / 显示 19:46 SGT 的缓存数据 · 已过期” | offline.log、offline-usd.png、offline-sgd.png、offline-quotes.json |
| Binance 断源 | 通过：11:44:11 UTC 加专用 hosts 标记；11:46:25 响应八个 Binance 币 stale，USDT/USDC ok；未替换校验价。恢复前实库 BTC 年龄 172 秒、source=binance | stale.log、stale-usd.png、stale-quotes.json、outage-timeline.txt |
| Binance 恢复 | 通过：11:46:59 UTC 移除标记，11:48:02 响应十币全部 ok，无部署/重启服务 | recovered.log、recovered-usd.png、recovered-quotes.json |
| 后端单测 | npm test 9/9，通过；年龄门回归有 RED→GREEN 证据 | server-red.log、server-final.log |
| 审查补漏 | 独立审查发现首次页面挂载前启动轮询、FX null 可能崩溃，均已修复；FX 回归先失败再恢复校验通过 | docs/D4-review.md、fx-validation-red.log、xctest-final.log |

真实 SGD 示例以 live-quotes.json 为准，BTC 显示 S$83,067.44，与服务端 price_sgd 舍入一致。缓存快照只用于展示，没有基于缓存算市值、盈亏或触发提醒。

## 账号与环境清理

所有登录均使用本次随机生成的 `d4_...` 临时用户，password.js scrypt 生成 hash，经 sg-claude 本地管理 socket 只写 bizhang 库。密码与会话 token 不写日志、不入 Git。未使用 Smith 账号，未读取禁止的 new-account.json、任何既有密钥/Token 或 .env。

每次脚本均在 finally 删除该账号及其会话；最终清理核查见 cleanup.txt。本次 hosts 标记已移除，主源恢复；保留指定 13100 开发隧道。未碰 MauGo 代码/配置/数据库，未发 Telegram，未申请 Apple Developer。

## 下一步缺口

- D5 接真实 `/portfolio` 后显示服务端持仓、市值与盈亏；提醒/汇总待各自后续任务。当前总览不宣称存在真实持仓数据。
- 模拟器不提供真机文件数据保护属性；已验证读写与清理，Complete 写入标志保留，真机加密行为在真机阶段验证。
- 后端 120 秒年龄门需要调度方部署；本次没有部署结果。
- 独立审查中离线横幅与新鲜行状态文案矛盾、总览暴露实现阶段文案已同时修正，无遗留 Critical/Important。

## Git 交付

提交与推送结果待本轮最终命令记录补充；不合 main。
