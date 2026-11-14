# 原回归未执行

按任务仅用 API fixture，不启动真实后端；Mac 无测试数据库，沿用 R06–R19 的处理。未执行 `tests/r20-regression.config.ts` / 原 `d5.spec.ts` / 服务端数据库回归，未修改原测试或数据库配置。

原 R20 的 A6 是原轮次结果，本轮没有重跑或将其改判为当前通过。真实权限、媒体存储、持久化、重新登录、并发和点赞/评论未验。

fixture 初始 posts 为 0；所有条目由真实浏览器输入、文件选择和 Publish 点击产生的 POST 请求创建，媒体响应返回实际上传字节。没有预填动态、点赞、评论，没有直接设置 Vue 内部状态，没有使用原型 atlas driver。503 是测试输入，不是真实后端验收。

使用本地 MauGo.html 的只读嵌入源摘录，未调用 Figma API 或使用任何 Figma token。
