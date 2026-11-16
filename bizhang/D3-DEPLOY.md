D3 部署交接（尚未执行）

只同步本分支 bizhang/server 至 /srv/bizhang/server；不读取或输出任何凭据。
使用 D2 既有管理执行方式、币账 owner 角色运行 npm run migrate（新增 002）；不可使用运行角色迁移。
在服务器执行 npm ci && npm test。仅重启独立币账进程 node scripts/run-remote.mjs，保持 127.0.0.1:3100。
检查 ss -lntp 与认证边界脚本；通过既有隧道、调度方持有的会话请求 /api/v1/market/quotes。
确认十币价格、两个输入时间与来源、USD/SGD 和 alerts_paused；验证实际公开源可达及 Kraken 返回键。

故障注入：在专用验收进程注入 Market 构造参数 fetcher、now、sleep（不加生产 HTTP 故障开关）。fetcher 按域名抛错来断源，保留其他源正常刷新；虚拟时钟分别推进 121s（Binance）、181s（Kraken）、1801s（CoinGecko）、7201s（全部 FX）。比较 quotes 返回状态及数据库 price_cache。价差用备源 100、主源 102.1，接着两个不同周期的 100/100 有效样本。实库与真实 HTTP 故障验收结果请反馈后补报告。

当前限制：本机状态测试通过不等于部署验收通过；需补采集/重试/DB 端到端测试。退避按请求完成后计时，CG 重试后下一周期会顺延；需进一步对齐固定周期预算。6000 次按架构“停止重试、保留定时调用”实现，因此不是总调用硬封顶，需 Muse 确认。
