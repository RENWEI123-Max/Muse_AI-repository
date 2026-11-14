原数据库/真实后端回归未执行。Mac mini 无测试数据库与真实后端；既有 R09–R17 启动失败为 `Test database connection unavailable`，本轮按任务指示不重复启动，不改测试或数据库配置，不真实注册/登录。

本轮专项使用 Playwright API fixture：认证、空初始 profile、服务失败均为明确夹具；头像和归档条目仅从浏览器实际上传仓库 portrait-5.png，经产品 canvas JPEG 编码及 add/select/remove/restore 请求产生。没有注入 Vue 状态或预填八个头像槽位。媒体响应为实际上传字节，但其存储和持久化仍是内存 fixture，不代表真实后端通过。
