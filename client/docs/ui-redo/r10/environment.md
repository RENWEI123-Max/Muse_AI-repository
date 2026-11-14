首次默认配置 `npx playwright test tests/d1.spec.ts --reporter=line` 在 webServer 启动阶段失败：
```
Error: listen EPERM: operation not permitted /tmp/tsx-0/33.pipe
code: 'EPERM', errno: -1, syscall: 'listen'
Error: Process from config.webServer was not able to start. Exit code: 1
```
沙箱外执行原配置随后报告 `http://127.0.0.1:3001/health is already used`。
检查确认已有 auth-server.mjs 隔离测试后端与另一个任务的 5173 preview，未终止这些进程。
新建 playwright.r10.config.ts，复用隔离后端（seed 各自独立账户），独占 5174 Vite dev，测试执行申请沙箱外权限后实际运行成功。备用启动使用 node --import tsx loader，绕开 tsx CLI IPC。
本轮未调用任何 Figma API、未读取 token、未重导图片。
