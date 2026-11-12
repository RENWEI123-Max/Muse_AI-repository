# MauGo client · C1

Vue 3 + Vite + TypeScript，独立于相邻的 `maugo/` 后端。需要 Node.js 22.12+、npm。

```sh
npm install
cp .env.example .env
npm run dev
# 浏览器访问 http://127.0.0.1:5173
npm run build
npm run preview
```

远程服务器预览可用 SSH 端口转发；需要对外监听时使用 `npm run dev -- --host 0.0.0.0`。欢迎页为 375×812 手机画布，小屏宽度自适应；使用 4px 间距体系、原型颜色变量、背景图及英文文案。登录、注册、Apple 和法律按钮仅打开明确的 C1 占位页，首页预览不执行真实认证。

## 后端

`src/lib/api.ts` 统一读取 `VITE_API_BASE_URL`，默认 `http://127.0.0.1:3000`。修改 `.env` 后重启开发服务或重新构建。`VITE_*` 是公开的构建时变量，不得放密码或密钥。跨域调用需在后端配置对应前端 origin；当前欢迎页不依赖后端在线。真机不能使用服务器的 loopback 地址，应配置真机可访问的 HTTPS 后端地址；Android 模拟器访问宿主机时可用 `http://10.0.2.2:3000`（HTTP 仅用于本地开发，原生网络安全策略需按开发环境单独配置）。

## 交接素材与字体

来源：`/root/MauGo-handover/extracted/MauGo完整项目交接-2026-10-27/`，原型为 `03-成品UI/源文件/MauGo.html`。原始 343 条清单保存在 `src/assets/asset-manifest.json`，清单 `png-1x/` 对应本地 `src/assets/`，分类目录原样保留。`src/lib/assets.ts` 通过 Vite 静态 glob 引入全部 PNG，并提供 `asset(name)`，避免路径拼接造成生产环境 404。构建禁用素材内联，以便逐一验收文件响应。

Fredoka、GowunDodum 从交接包本地加载，不依赖 Google Fonts；`src/assets/fonts/` 保留两份 OFL 许可。附带 SVG 和 Apple SOURCE.txt 也保留来源说明。所有头像使用 `Avatar.vue` 圆形裁剪。`src/lib/i18n.ts` 默认英文，韩文入口预留并覆盖欢迎文案，其余按英文回退。`PageTransition.vue` 提供页面动画插槽，支持减少动态效果设置；复杂动画留待后续任务。

## 验收

```sh
npm run verify:assets
npx playwright install --with-deps chromium
npm run test:e2e
TEST_PREVIEW=1 npm run test:e2e # 对同一生产构建执行浏览器验收
```

构建前校验 343 个 PNG 的路径、SHA256 和像素尺寸，以及两套字体与 OFL 许可。Playwright 启动真实开发服务，验证欢迎页、375×812 尺寸、语言切换、预览页和圆形头像，并通过 `/?assets=1` 解码全部 343 张图片、检查失败请求与 HTTP 错误。截图保存在忽略的 `test-results/` 目录。

## Capacitor

占位包名 `com.maugo.app`，应用名 MauGo，webDir 为 `dist`；正式包名发布前另定。iOS 与 Android 原生工程分别在 `ios/`、`android/`，已生成并同步 Web 构建，无远程 server.url。

```sh
npm run cap:sync
npm run cap:android
npm run cap:ios
```

Android 编译需 Android Studio、对应 SDK 与 JDK；iOS 编译签名需 macOS 和 Xcode。Linux 上可生成并同步双端工程，不能完成 iOS 编译签名。本任务未发布应用、未配置正式证书。
