# R06 首页短屏遮挡修复结果

结论：本任务布局验收通过；真机 Safari 视觉复核待 Smith。基线 `86a584d`，分支 `codex/r06-hint-fix`，在 Mac mini 独立 worktree `/Users/anna/worktrees/r06-hint-fix` 执行；未合入 main。

## 复现与改动

- 开工检查：分支尚无基线后的提交；进程列表只有本次 Codex 及其启动 shell，没有第二轮。
- 原因：短屏帽子顶部坐标和底部提示相向挤压；744px 还未进入原 740px 媒体查询，按钮和入口行与导航重叠。
- 仅修改 `client/src/styles/pages/home.css` 首页定位规则。小于 812px 时，场景除鸟层外按 `100svh - 812px` 上移，提示、按钮及 economy 保留原短屏 bottom 176/120/98px。740px 媒体查询保留，鸟层维持原 -30px 位置。
- 插画尺寸未缩放；未改业务、登录/token、支付及 Diamonds / Filter Pass 入口内容。无 Figma API/token 请求；未开 Issue、未发 Telegram、未动主工作区。

## 方法与限制

Playwright Chromium，在本 worktree 的 Vite 5326 端口运行；使用 API fixtures 直接进入真实 Vue 首页（空态 / 三封来信 ready），不是实际服务端来信。英韩分别设置语言；系统 reduced-motion 用于稳定布局截图。PNG 为真实浏览器截屏。未执行真机 Safari / WebKit 验证，不代表其已验收。

重叠像素指 bounding box 的实际垂直交集（横向也相交时计入），不是遮挡延伸距离。任务提供的约40px描述与此定义不同：700px 基线提示整行16px均落在帽框内，帽框底部越过提示顶部40px。

## 修复前空态实测

| 视口 | 语言 | 帽 y–bottom | hint y–bottom | 帽/hint交集 | actions/nav | economy/nav |
|---|---|---|---|---|---|---|
| 375×667 | en | 405–548 | 475–491 | 16 | 0 | 0 |
| 375×667 | ko | 405–548 | 475–491 | 16 | 0 | 0 |
| 390×700 | en | 405–548 | 508–524 | 16 | 0 | 0 |
| 390×700 | ko | 405–548 | 508–524 | 16 | 0 | 0 |
| 390×744 | en | 435–578 | 608–624 | 0 | 44 | 20 |
| 390×744 | ko | 435–578 | 608–624 | 0 | 44 | 20 |
| 375×812 | en | 435–578 | 608–624 | 0 | 0 | 0 |
| 375×812 | ko | 435–578 | 608–624 | 0 | 0 | 0 |
| 390×844 | en | 451–594 | 624–640 | 0 | 0 | 0 |
| 390×844 | ko | 451–594 | 624–640 | 0 | 0 | 0 |

## 修复后全部实测

框格式为 `(x,y,width,height,bottom)`，单位 px。每行帽/hint交集=0；hint/actions/economy/nav 六对交集全部=0；nav bottom ≤ viewport。完整修复前后数据见同目录 JSON。

| 视口 | 语言/状态 | hat | hint | actions | economy | nav |
|---|---|---|---|---|---|---|
| 375×667 | en/empty | (99,290,178,143,433) | (20,475,335,16,491) | (24.1094,499,327,48,547) | (24,549,327,20,569) | (0,571,375,96,667) |
| 375×667 | en/ready | (99,290,178,143,433) | (20,475,335,16,491) | (24.1094,499,327,48,547) | (24,549,327,20,569) | (0,571,375,96,667) |
| 375×667 | ko/empty | (99,290,178,143,433) | (20,475,335,16,491) | (24.1094,499,327,48,547) | (24,549,327,20,569) | (0,571,375,96,667) |
| 375×667 | ko/ready | (99,290,178,143,433) | (20,475,335,16,491) | (24.1094,499,327,48,547) | (24,549,327,20,569) | (0,571,375,96,667) |
| 390×700 | en/empty | (106.5,323,178,143,466) | (27.5,508,335,16,524) | (31.6094,532,327,48,580) | (31.5,582,327,20,602) | (7.5,604,375,96,700) |
| 390×700 | en/ready | (106.5,323,178,143,466) | (27.5,508,335,16,524) | (31.6094,532,327,48,580) | (31.5,582,327,20,602) | (7.5,604,375,96,700) |
| 390×700 | ko/empty | (106.5,323,178,143,466) | (27.5,508,335,16,524) | (31.6094,532,327,48,580) | (31.5,582,327,20,602) | (7.5,604,375,96,700) |
| 390×700 | ko/ready | (106.5,323,178,143,466) | (27.5,508,335,16,524) | (31.6094,532,327,48,580) | (31.5,582,327,20,602) | (7.5,604,375,96,700) |
| 390×744 | en/empty | (106.5,367,178,143,510) | (27.5,552,335,16,568) | (31.6094,576,327,48,624) | (31.5,626,327,20,646) | (7.5,648,375,96,744) |
| 390×744 | en/ready | (106.5,367,178,143,510) | (27.5,552,335,16,568) | (31.6094,576,327,48,624) | (31.5,626,327,20,646) | (7.5,648,375,96,744) |
| 390×744 | ko/empty | (106.5,367,178,143,510) | (27.5,552,335,16,568) | (31.6094,576,327,48,624) | (31.5,626,327,20,646) | (7.5,648,375,96,744) |
| 390×744 | ko/ready | (106.5,367,178,143,510) | (27.5,552,335,16,568) | (31.6094,576,327,48,624) | (31.5,626,327,20,646) | (7.5,648,375,96,744) |
| 375×812 | en/empty | (99,435,178,143,578) | (20,608,335,16,624) | (24.1094,644,327,48,692) | (24,695,327,20,715) | (0,716,375,96,812) |
| 375×812 | en/ready | (99,435,178,143,578) | (20,608,335,16,624) | (24.1094,644,327,48,692) | (24,695,327,20,715) | (0,716,375,96,812) |
| 375×812 | ko/empty | (99,435,178,143,578) | (20,608,335,16,624) | (24.1094,644,327,48,692) | (24,695,327,20,715) | (0,716,375,96,812) |
| 375×812 | ko/ready | (99,435,178,143,578) | (20,608,335,16,624) | (24.1094,644,327,48,692) | (24,695,327,20,715) | (0,716,375,96,812) |
| 390×844 | en/empty | (106.5,451,178,143,594) | (27.5,624,335,16,640) | (31.6094,660,327,48,708) | (31.5,711,327,20,731) | (7.5,732,375,96,828) |
| 390×844 | en/ready | (106.5,451,178,143,594) | (27.5,624,335,16,640) | (31.6094,660,327,48,708) | (31.5,711,327,20,731) | (7.5,732,375,96,828) |
| 390×844 | ko/empty | (106.5,451,178,143,594) | (27.5,624,335,16,640) | (31.6094,660,327,48,708) | (31.5,711,327,20,731) | (7.5,732,375,96,828) |
| 390×844 | ko/ready | (106.5,451,178,143,594) | (27.5,624,335,16,640) | (31.6094,660,327,48,708) | (31.5,711,327,20,731) | (7.5,732,375,96,828) |

短屏 667/700/744 的帽底至提示顶间隙均为42px；812/844 均为30px。帽框所有尺寸仍为178×143px。20组修复后截图/测量全部通过上述几何检查。

## 构建及静态检查

- `cd client && VITE_API_BASE_URL=/api npm run build`：退出0；资产校验、vue-tsc、Vite通过，完整日志 `r06-hint-fix/build.log`。
- 改动实现文件 home.css：hex字面量=0、`!important`=0、`.device`前缀=0，详见 `source-checks.json`。
- `git diff --check` 通过。

## 截图清单与前后对比

以下每项均有 before/after，两语言、空态及ready，合计40张真实PNG。尺寸和两状态覆盖超出最低要求。

| 视口 | 语言/状态 | 修复前 | 修复后 |
|---|---|---|---|
| 375×667 | en/empty | [before](r06-hint-fix/before-375x667-en-empty.png) | [after](r06-hint-fix/after-375x667-en-empty.png) |
| 375×667 | en/ready | [before](r06-hint-fix/before-375x667-en-ready.png) | [after](r06-hint-fix/after-375x667-en-ready.png) |
| 375×667 | ko/empty | [before](r06-hint-fix/before-375x667-ko-empty.png) | [after](r06-hint-fix/after-375x667-ko-empty.png) |
| 375×667 | ko/ready | [before](r06-hint-fix/before-375x667-ko-ready.png) | [after](r06-hint-fix/after-375x667-ko-ready.png) |
| 390×700 | en/empty | [before](r06-hint-fix/before-390x700-en-empty.png) | [after](r06-hint-fix/after-390x700-en-empty.png) |
| 390×700 | en/ready | [before](r06-hint-fix/before-390x700-en-ready.png) | [after](r06-hint-fix/after-390x700-en-ready.png) |
| 390×700 | ko/empty | [before](r06-hint-fix/before-390x700-ko-empty.png) | [after](r06-hint-fix/after-390x700-ko-empty.png) |
| 390×700 | ko/ready | [before](r06-hint-fix/before-390x700-ko-ready.png) | [after](r06-hint-fix/after-390x700-ko-ready.png) |
| 390×744 | en/empty | [before](r06-hint-fix/before-390x744-en-empty.png) | [after](r06-hint-fix/after-390x744-en-empty.png) |
| 390×744 | en/ready | [before](r06-hint-fix/before-390x744-en-ready.png) | [after](r06-hint-fix/after-390x744-en-ready.png) |
| 390×744 | ko/empty | [before](r06-hint-fix/before-390x744-ko-empty.png) | [after](r06-hint-fix/after-390x744-ko-empty.png) |
| 390×744 | ko/ready | [before](r06-hint-fix/before-390x744-ko-ready.png) | [after](r06-hint-fix/after-390x744-ko-ready.png) |
| 375×812 | en/empty | [before](r06-hint-fix/before-375x812-en-empty.png) | [after](r06-hint-fix/after-375x812-en-empty.png) |
| 375×812 | en/ready | [before](r06-hint-fix/before-375x812-en-ready.png) | [after](r06-hint-fix/after-375x812-en-ready.png) |
| 375×812 | ko/empty | [before](r06-hint-fix/before-375x812-ko-empty.png) | [after](r06-hint-fix/after-375x812-ko-empty.png) |
| 375×812 | ko/ready | [before](r06-hint-fix/before-375x812-ko-ready.png) | [after](r06-hint-fix/after-375x812-ko-ready.png) |
| 390×844 | en/empty | [before](r06-hint-fix/before-390x844-en-empty.png) | [after](r06-hint-fix/after-390x844-en-empty.png) |
| 390×844 | en/ready | [before](r06-hint-fix/before-390x844-en-ready.png) | [after](r06-hint-fix/after-390x844-en-ready.png) |
| 390×844 | ko/empty | [before](r06-hint-fix/before-390x844-ko-empty.png) | [after](r06-hint-fix/after-390x844-ko-empty.png) |
| 390×844 | ko/ready | [before](r06-hint-fix/before-390x844-ko-ready.png) | [after](r06-hint-fix/after-390x844-ko-ready.png) |

复跑：先在client启动 `npm run dev -- --port 5326 --strictPort`，再运行 `node docs/ui-redo/r06-hint-fix/capture.mjs after`。before数据来自修改前基线，不应在修复代码上覆盖。

## 阻塞项

无布局、构建阻塞。真机 Safari 视觉确认待 Smith；未将 Chromium 结果冒充真机结果。推送状态由最终执行汇报确认。
