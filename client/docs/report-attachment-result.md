# 任务 #62：D3 举报附图验收

日期：2026-11-13。对应 Issue #48；后端契约为 B13（Issue #46）。

## 实现

- `src/components/ChatFlow.vue`：report-empty / report-filled 增加原型描边附图按钮、页内预览和移除按钮；沿用 D3 入场与现有面板过渡，按钮提供按压反馈。
- 选图立即通过 B8 `POST /media/uploads?purpose=report` 上传；仅支持 PNG/JPEG/WebP、严格小于 10 MiB，与现有聊天图片上传一致。
- 上传错误单独明确提示，举报仍可无图提交。上传中也明确提示直接提交将不带图。
- `POST /reports` 仅在图片已上传时携带 `attachmentMediaId`；移除后清空媒体 ID，并忽略尚未完成的旧上传结果。提交失败保留表单；成功后清理附件草稿，report-saved 明确注明照片已随举报提交。
- `tests/auth-server.mjs` 补齐隔离库的 012、013 迁移；复用真实 `maugo/src/app.js`，未修改后端业务代码。

## 验收环境与覆盖

使用生产构建预览、Playwright Chromium（375 × 812），通过 HTTP 访问真实 B13 后端；现有测试启动器每次创建独立的 `maugo_client_c2_test_<时间戳>` 数据库，迁移、测试用户、举报和媒体均在隔离环境，媒体目录为 `/tmp/` 下的测试专用目录。未使用模拟成功响应，未修改生产表或生产数据，未更改或提交密钥。

| 检查 | 结果 |
| --- | --- |
| 生产构建（资源校验、Vue/TypeScript、Vite） | 通过 |
| 有效附图举报创建，GET /reports/:id 返回相同附件 ID 与 URL | 通过，POST 201 / GET 200 |
| 冒用另一用户已上传媒体创建举报 | 拒绝，403 |
| 无附图举报、移除附图后举报 | 通过；请求均不含 attachmentMediaId，创建及查询的 attachment 为 null |
| 非图片及达到 10 MiB 的图片 | 客户端拒绝；真实后端对伪 PNG 返回 415、text/plain 返回 400、超限图片返回 413 |
| 真实上传失败后无图提交 | 明确错误提示，仍可创建举报 |
| 上传中移除，旧上传随后完成 | 不恢复附件，后续举报不含附件 |
| D3 九个状态、屏蔽与恢复、举报失败可继续编辑 | 原有两项回归通过 |

自动化入口：`tests/report-attachment.spec.ts`（3 项）与 `tests/d3.spec.ts`（2 项），共 5 项通过。改动全部位于 `client/`，未执行 git push、合并或切换分支。

## 截图

- [举报空态](report-attachment-empty.png)
- [附图预览](report-attachment-preview.png)
- [移除附图](report-attachment-removed.png)
- [上传失败](report-attachment-failed.png)
- [举报提交成功](report-attachment-saved.png)
