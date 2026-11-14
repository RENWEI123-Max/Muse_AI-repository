# R11 执行环境与复现

- cwd `/root/Muse_AI-repository/client`，Node 22.23.4；Playwright Chromium，375×812。
- 初次沙箱内启动 `tsx tests/auth-server.mjs` 被 `/tmp/tsx-0/33.pipe` 的 listen EPERM 阻止；后续授权的沙箱外执行成功。未改数据库连接逻辑，auth-server自建专用临时数据库。
- 核心命令：`npx playwright test tests/chat.spec.ts tests/chat-media.spec.ts tests/chat-voice.spec.ts tests/r11-chat.spec.ts --workers=1`。
- R11录音使用已有Chromium假麦克风路径；按住、上滑、松手是真实指针操作。拒权用getUserMedia抛NotAllowedError。未修改Vue内部状态，没有构造静态假状态DOM。
- R11消息来自原有`/__c5/seed` / `__c6/reply`；发送草稿复用种子文本，照片使用现有头像PNG，经真实上传并重开聊天读历史。
- R11韩文检查重新登录同一账户，读取真实maugo-language=ko，验证韩文字串与GowunDodum；不是仅把英文页面标为lang=ko。小屏仅检查布局可见性，不做Figma像素对照。
- 扩展测试的D11、F07各有独立配置和端口：`tests/d11.config.ts`、`tests/f07.config.ts`；第一次混在通用配置中出现连接失败，记录在related-tests.log，之后分别重跑。
- 临时复用配置r11.local.config.ts已移除。最终核心用标准playwright.config.ts运行。
- D2基线副本只在/tmp导出，没有切换/修改任何受保护分支。
- 曾有中间构建的Vite reply.css scoped描述符异常，最终构建退出0；失败日志保留。
- A4无Figma导出图；并排图与差异比例都未生成。现有原型reference PNG未用作Figma验收。
