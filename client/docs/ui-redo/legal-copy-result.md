# legal-copy 执行结果

执行环境：Annas-Mac-mini.local，2026-11-14。任务文件 `/Users/anna/task-legal-copy.md` 已确认；唯一 codex exec 为本轮（PID 46972，其日志包含本轮输出），未启动重复 run。
分支：`codex/legal-copy`，基线 `f43359b`。不合入 main。最终提交 SHA 与推送状态见执行汇报及 Git 历史。

## 四项验收

| 项目 | 结果 | 实际证据与边界 |
| --- | --- | --- |
| 静态 | 未通过（构建通过，文件级 hex 门槛未通过） | `cd client && VITE_API_BASE_URL=/api npm run build` 退出 0；资产检查 343 PNG 通过；三个改动源文件 hex 字面量 39、`!important` 0、`.device` 前缀 0。39 个全部为 SettingsFlow.vue 基线已有样式，本次新增 0；按限定只接文案，未扩展样式重构。`git diff --check` 通过。 |
| 流程 | 通过（浏览器 UI 范围） | 欢迎页点击协议链接，登录协议框英韩各 11 节；设置 → 关于 → 条款英韩各 11 节；协议返回、隐私返回、设置逐级返回及关闭均通过。设置使用真实页面的游客预览入口；未验证真实账号或后端。 |
| 效果 | 部分通过／待 Smith | 真实鼠标滚轮使协议框内部滚动，外层 auth-flow 的 scrollTop 不变；框高 350px、overflow-y auto。此路径无 sheet 弹层，sheet-in 不适用。真实手机触摸顺滑度、帧率未验证，待 Smith。 |
| 滑动与文案 | 通过（Chromium） | 375×667、375×812 × 英韩共 4 组 Playwright 测试通过；每组核对两处 11 个完整标题及段落、版本行，无 `_PENDING_SMITH`；滚到 scrollHeight-clientHeight、末段可见，无横向溢出，document 高度等于 viewport。24 张真实 PNG。 |

## 11 节接线核对

`support-content.ts` 保存现有 i18n.ts 的英文原文键，由现有 `tr()` 读取韩文；未改动 i18n.ts。逐条标题和正文与现有键完全一致，登录与设置复用同一数组。

| 节 | 标题 | 登录 EN/KO | 设置 EN/KO |
| --- | --- | --- | --- |
| 1 | 1. About this agreement | 通过 | 通过 |
| 2 | 2. Your account | 通过 | 通过 |
| 3 | 3. Permission to use MauGo | 通过 | 通过 |
| 4 | 4. Content and respectful conduct | 通过 | 通过 |
| 5 | 5. Your content and conversation rules | 通过 | 通过 |
| 6 | 6. Reporting, blocking and enforcement | 通过 | 通过 |
| 7 | 7. Diamonds and paid features | 通过 | 通过 |
| 8 | 8. Privacy and permissions | 通过 | 通过 |
| 9 | 9. Availability and your rights | 通过 | 通过 |
| 10 | 10. Apple distribution | 通过 | 通过 |
| 11 | 11. Updates and contact | 通过 | 通过 |

版本行保留：`Version 1.0 · 13 October 2026 · Review draft`，韩文使用已有译文“검토용 초안”。演示措辞与 `maugo.support@example.com` 原样保留。隐私页两处显示英韩“待正式文本／非正式隐私政策／不可发布”提示，不展示原型四段本地存储说明。

## 参考及范围

仅使用本地原型与 Figma JSON；未用 Figma API/token。Figma 节点 `35:2487`、`35:2581` 协议框均为 327×350，与原型 350 高一致；沿用基线尺寸、颜色和内容区滚动，未发现本次接线所需的冲突取舍。
运行代码只改 support-content.ts、AuthFlow.vue、SettingsFlow.vue；不改 App.vue、token 存取、支付、服务端规则。额外新增可复现的浏览器验收脚本。

复现：先构建，再 `cd client && npx playwright test -c tests/legal-copy.config.ts`。最终运行 4 passed；截图来自构建后的真实 Chromium 页面，无 DOM 内容替换、无拼接假图。

## 缺口／阻塞项

- 文件级 hex 0 门槛未达到：SettingsFlow.vue 基线已有 39 个，需后续明确样式治理范围。
- 实际手机触摸顺滑度待 Smith；本次只确认浏览器滚轮、内部滚动及到底。
- Mac mini 缺少 maugo/node_modules，后端测试 runner 无法启动；游客预览下 /profiles/me 请求报 ECONNREFUSED，条款页面为本地内容，仍可正常打开验收。未宣称真实账号验收通过。
- E2 上架前仍需 Smith 提供正式隐私政策、修订演示措辞与真实客服邮箱；当前为 Review draft，不可据此宣称已可上架。

## 截图清单（24/24，真实 PNG）

每种高度、每种语言均覆盖登录协议框与设置条款页的顶部／中部／底部；无缺失。

- [auth-bottom-375x667-en.png](legal-copy/auth-bottom-375x667-en.png)
- [auth-bottom-375x667-ko.png](legal-copy/auth-bottom-375x667-ko.png)
- [auth-bottom-375x812-en.png](legal-copy/auth-bottom-375x812-en.png)
- [auth-bottom-375x812-ko.png](legal-copy/auth-bottom-375x812-ko.png)
- [auth-middle-375x667-en.png](legal-copy/auth-middle-375x667-en.png)
- [auth-middle-375x667-ko.png](legal-copy/auth-middle-375x667-ko.png)
- [auth-middle-375x812-en.png](legal-copy/auth-middle-375x812-en.png)
- [auth-middle-375x812-ko.png](legal-copy/auth-middle-375x812-ko.png)
- [auth-top-375x667-en.png](legal-copy/auth-top-375x667-en.png)
- [auth-top-375x667-ko.png](legal-copy/auth-top-375x667-ko.png)
- [auth-top-375x812-en.png](legal-copy/auth-top-375x812-en.png)
- [auth-top-375x812-ko.png](legal-copy/auth-top-375x812-ko.png)
- [settings-bottom-375x667-en.png](legal-copy/settings-bottom-375x667-en.png)
- [settings-bottom-375x667-ko.png](legal-copy/settings-bottom-375x667-ko.png)
- [settings-bottom-375x812-en.png](legal-copy/settings-bottom-375x812-en.png)
- [settings-bottom-375x812-ko.png](legal-copy/settings-bottom-375x812-ko.png)
- [settings-middle-375x667-en.png](legal-copy/settings-middle-375x667-en.png)
- [settings-middle-375x667-ko.png](legal-copy/settings-middle-375x667-ko.png)
- [settings-middle-375x812-en.png](legal-copy/settings-middle-375x812-en.png)
- [settings-middle-375x812-ko.png](legal-copy/settings-middle-375x812-ko.png)
- [settings-top-375x667-en.png](legal-copy/settings-top-375x667-en.png)
- [settings-top-375x667-ko.png](legal-copy/settings-top-375x667-ko.png)
- [settings-top-375x812-en.png](legal-copy/settings-top-375x812-en.png)
- [settings-top-375x812-ko.png](legal-copy/settings-top-375x812-ko.png)
