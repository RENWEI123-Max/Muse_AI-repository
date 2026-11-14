# R04 Playwright 对照骨架

基线：`origin/codex/r01-frames` (`aa8c694`)，未合入后续 UI 重做。仅新增测试、文档和截图证据；未修改客户端、未加依赖、未调用 Figma API。

## 实测

Linux Chromium，Playwright 1.65.0，375×812，deviceScaleFactor=1。4 个状态真实运行成功：

| 状态 ID | 差异像素 | 全图像素 | 差异比例 |
| --- | ---: | ---: | ---: |
| home-ready | 13002 | 304500 | 4.269950739% |
| terms-unchecked | 21760 | 304500 | 7.146141215% |
| signin-empty | 4555 | 304500 | 1.495894910% |
| signup-empty | 4947 | 304500 | 1.624630542% |

以上仅为基线读数，不代表还原度验收结论。未配置差异通过阈值；阈值留待 Claude 在 R06 后根据实测决定。

## 用法

在仓库根目录（使用 client 已安装的 Playwright，不触发 npx 下载）：

```sh
./client/node_modules/.bin/playwright test -c client/tests/ui-redo.config.ts --list
./client/node_modules/.bin/playwright test -c client/tests/ui-redo.config.ts
UI_REDO_STATES=home-ready ./client/node_modules/.bin/playwright test -c client/tests/ui-redo.config.ts
```

等价地在 client 下运行 `npx playwright test -c tests/ui-redo.config.ts`。配置自动启动 5184 端口 Vite。状态 ID 由显式导航 recipe 映射；增加状态时扩展 states/enter，而不是直接依赖不存在的客户端状态路由。未知 ID 会报错。此轮只覆盖这 4 态，不运行 189 态。

证据：`r04-compare/<ID>-actual.png`、`<ID>-side-by-side.png`（左实现，右 Figma 原图）、`<ID>-diff.png`（有差异时）、`<ID>.json`，以及 `ratios.json` / `ratios.csv`。并排图 750×812，单图和差异图 375×812。

比较使用 Playwright 自带 getComparator('image/png')，保持其默认颜色灵敏度 0.2 和抗锯齿处理。这是像素识别参数，不是差异比例通过阈值。读取错误文本中的精确差异像素数，忽略 Playwright 四舍五入后的 ratio；自行除以 304500。完全相同返回 0。导航失败、参考图缺失、尺寸错误、比较器接口变化仍会报错；视觉差异本身不会让用例失败。

## 固定数据与限制

- 双方比较副本均遮罩顶部 y=0..43、x=0..374（16500 像素），覆盖状态栏时间、电池和信号。比例分母仍为完整 304500 像素，遮罩区域贡献为 0。原始实现截图和并排图保留状态栏，方便人工检查。
- home-ready 固定为 3 封信、钱包 120 diamonds / 3 free，复用旧 capture-client 的固定 API 数据思路。认证态为空表单。所选状态无可见动态昵称或头像照片，未将任意人像代替 Figma 人像；信件 fixture 昵称为 Little wanderer / Sea breeze / Paper moon，未验证与 Figma 隐藏信件数据一致。
- 尚未覆盖个人资料、照片、聊天、相对时间等状态。这些状态扩展前需从本地参考核对可见昵称及头像，并补明确固定数据，不能认为全局动态内容已固定。未使用真实后端。
- 等待字体及图片解码，减少动画并在截图时禁用动画；不能保证不同 Chromium、字体栅格化或平台输出相同。当前测试使用 dev server；build 另行验证成功。
- 使用 Playwright 内部比较器，兼容 bundle / 旧目录两种布局；升级 Playwright 需复核接口及错误文本。无新增 pixelmatch / PNG 依赖。Canvas 只负责 PNG 解码、统一遮罩及并排合成。
- 报表为当前一次运行所选状态，重新运行会覆盖对应证据；原目录未选中的旧单态文件不会自动删除。

## 验证

- `playwright test ... --list`：列出 4 态。
- 实际运行：4 passed，生成全部读数、并排图和差异图。
- `cd client && npm run build`：通过（343 PNG 资源校验、vue-tsc、Vite）。
