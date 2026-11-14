# 原回归未执行

本轮按任务使用 API fixture，不连接真实后端。Mac 无测试数据库；沿用 R06–R18 处理，不重复启动已知缺库的原 D5/服务端回归，不改测试或数据库配置凑通过。

`tests/r19-regression.config.ts` / 原 `d5.spec.ts` 未执行；真实权限、持久化、并发、重新登录、媒体存储及 likes 未验。本轮没有将原 R19 的 A6 重跑或改判。本轮 Playwright 只证明内存 fixture 范围内的请求和界面行为。

fixture 初始卡片为 0；条目仅从浏览器文件选择上传仓库 `portrait-5.png` 后由 POST 请求产生。媒体 GET 返回实际上传字节；503、空态、八张边界均明确为测试输入，无真实用户、点赞、动态数据或业务状态注入。没有调用 Figma API 或使用 token。
