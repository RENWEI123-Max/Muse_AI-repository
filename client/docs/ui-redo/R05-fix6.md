# R05 六项修复记录（#144 / #146 / #148）

分支：`codex/r05-shell`。2026-11-14 在 `/root/worktrees/r05-fix6` 完成；未合入 main。
设计依据仅本地 Figma JSON（版本 `2421258509127695554`）、R02-result.md 渐变表及 R05-review.md；未调用 Figma API 或使用 token。

| 项 | 改前 → 改后 | 验证 |
| --- | --- | --- |
| 1 变基 | 分叉点 `281b4bc` → `origin/main` `be44f5e5b3e6b5bb3c8e98e1c1ded96ae242e349` | fetch 后 checkout/rebase 成功，无冲突；保留 R05 改动 |
| 2 确认框 | `var(--grad-card)`（当前 main 横向）→ `var(--grad-card-diagonal-h391-5)` | token 为 `linear-gradient(140.03deg, #253229 6.17%, #17221C 93.83%)`，匹配 29:7923 / 327×391.5 |
| 3 胶囊文字 | `var(--text-primary)` → `var(--text-profile-wallet)` | token 为 `#B2DA9C`，匹配本地 JSON 29:13688；其他属性未改；图标按钮默认135°未改 |
| 4 验收文档 | 水平图标按钮、虚报 diff 检查、声称去掉插画缩放、inbox 来源不明等 → 按复核事实修正 | 同步基线、token 名单与正文；首页页头横向按钮留 R06；小屏缩放本轮已删除并验证，见 r05/fix6.md；inbox 为历史 main 基线既有失败，本轮两边均通过 |
| 5 截图入库 | `test-results/r05-nav-${active}.png` → `docs/ui-redo/r05/r05-nav-${active}.png` | 本次真实 Playwright 页面截图，代码与图片同次提交；A4 引用新路径 |
| 6 legacy EOF | 四文件末尾两个换行 → 一个换行 | 字节对比确认仅删除末尾一个换行；旧 hex 与其他内容未改 |

顺手修复实际路径 `client/src/styles.css`：`.auth-open .auth-top` → `.auth-top`，构建通过。未改计划文件、业务逻辑、三条未读 skip 或豁免决定。

Smith 2026-11-14 豁免：有未读的 `43:1945 / 43:2012 / 43:2079` 不实现、不做断言，保留三条 skip；只验三个无未读变体，因为设计稿无画框使用有未读变体。

## 本次验证

- `cd client && VITE_API_BASE_URL=/api npm run build`：退出码0，343 PNG 素材校验、vue-tsc、Vite 通过（5.76s）。
- 根目录 `git diff --check`、`git diff origin/main --check`：均退出码0。
- base.css / components.css 引用 token 与 tokens.css 定义比对：缺失0。确认 diagonal-h391-5、profile-wallet、默认135°和横向图标按钮 token 均存在；main 的 grad-card 仍为横向原值。
- 检查端口3001/5173空闲后，执行 `TEST_DATABASE_URL=<R05专用本地库> npx playwright test tests/r05-shell.spec.ts --workers=1`：退出码0，1 passed / 3 skipped（10.5s），通过用例遍历首页、消息、我的。使用独立一次性 PostgreSQL 16 容器5505；测试通过 `POST /__c5/seed` 自建账号登录；无 demo 账号，无临时测试副本。
- 三图由上述测试直接生成；`file` 确认 PNG / RGB / 375×812，人工逐张确认导航位置一致、当前页图标高亮、白色横条。Python PIL 未安装，尺寸验证采用 `file`。

| 文件（相对 client） | 页面 | 格式 / 尺寸 |
| --- | --- | --- |
| docs/ui-redo/r05/r05-nav-0.png | 首页 | PNG / 375×812 |
| docs/ui-redo/r05/r05-nav-1.png | 消息 | PNG / 375×812 |
| docs/ui-redo/r05/r05-nav-2.png | 我的 | PNG / 375×812 |

截图原样保留：“我的”页内容区显示 `Internal server error`；本次导航几何、样式、当前页和横条断言通过，不声称个人页业务或全页通过。没有替换、拼接或伪造截图。

此前整组 A6 未重跑；本轮已重跑，结果更新为分支13过/3败/3跳过、main12过/3败，见 r05/fix6.md。A4像素差异仍待R01/R04，本文不声称已完成。
