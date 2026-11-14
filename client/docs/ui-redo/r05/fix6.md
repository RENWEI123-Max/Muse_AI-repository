# R05 六项修复复审补充（2026-11-14）

本轮起点实际为 `749429f6aa1098b46d83e6c23bb2304c2c25fa06`，并非任务描述的4570d5b；远端已含首次修复。执行 `git fetch origin`、`git checkout -B codex/r05-shell origin/codex/r05-shell`、`git rebase origin/main`，结果 up to date。原分叉点281b4bc，变基目标及本轮修复前后 main 均为 `be44f5e5b3e6b5bb3c8e98e1c1ded96ae242e349`。保留已有R05提交，不合入main；R05-review.md未改，仍REQUEST_CHANGES，三条未读skip及豁免不变。

| 项目 | 结果 | 改动及证据 |
| --- | --- | --- |
| 1 变基main | 通过 | 已有749429f基于be44f5e；本次fetch及rebase确认最新，无冲突，保留豁免 |
| 2 dialog渐变 | 通过 | components.css `.ui-dialog`为`--grad-card-diagonal-h391-5`，选择器无横向token |
| 3 chip文字色 | 通过 | components.css `.ui-chip`为`--text-profile-wallet`，选择器无`--text-primary` |
| 4 文档与小屏 | 通过 | 默认图标按钮135°；diff实测通过；删除scale(.72)，小屏按高度差平移；inbox注明历史main既有失败、本轮两边通过。更新R05-result.md及此前修复记录 |
| 5 三图入库 | 通过 | r05-nav-0/1/2.png已在749429f提交，本轮导航用例重新生成并提交；均375×812，非忽略文件 |
| 6 legacy末尾 | 通过 | 四个legacy文件只有一个末尾换行；与4570d5b逐字节比较，唯一差异为删除多余末尾换行，规则内容不变 |

## 验证实测

- 变基确认后、修复完成后各执行 `cd client && npm run build`，退出码均0，343PNG、vue-tsc及Vite通过。最终构建日志摘要见fix6-build.log。
- `git diff --check`和`git diff origin/main --check`均退出码0。base.css/components.css中hex、!important、`.device `前缀分别均0；grep确认上述两个选择器token正确，scale(.72)不存在。
- 小屏独立检查375×667和375×740：1 passed、退出码0；两尺寸transform缩放因子均[1,1]、无横向溢出，按钮分别y499/572高48，导航y571/644高96；截图人工查看插画不压按钮。仅删除scale初版在667高度有重叠，已改成`translateY(calc(-30px - max(0px, 740px - 100svh)))`，复跑通过。证据fix6-small-667/740.png、fix6-small.log及fix6-small.spec.ts.txt（验证脚本存档）。
- 整组原断言：`r05-shell.spec.ts home.spec.ts inbox.spec.ts d4.spec.ts client.spec.ts --workers=1`，R05 **13过/3败/3跳过**（2.8m，退出码1）。main源码独立副本同组原有用例 **12过/3败**（3.1m，退出码1）；main没有R05新增导航测试和三个skip。三项D4失败与main同用例同断言，无新增失败；inbox本次两边通过。
- **未通过：精确复现#144历史12过/4败/3跳过**。实测比历史少一项inbox失败，不能伪造为12/4/3，也不声称整组全绿。回归无新增失败通过；复审是否接受本次数量差异待审查决定。

| 共同失败 | 共同断言 |
| --- | --- |
| D4 editing, avatar gallery, remove, restore, crop, persistence and full slots | #edit-profile预期包含Book wanderer，元素未出现 |
| D4 public profile and chat gate open | #public-follow预期enabled，实际disabled |
| D4 public full content, photo previews, own image cards and outgoing visits | .profile-hero预期25 · Seoul，实际空字符串 |

运行方式：默认3001被既有服务占用，未停止或复用。使用/tmp独立源码副本、相同依赖与断言，仅替换端口：分支3105/5185，main3106/5186，小屏3107/5187。隔离的一次性PostgreSQL16容器r05-fix6-validation，监听127.0.0.1:5505，测试自建临时库，不用生产数据。初次工作区运行因临时文件被外部清理中断，废弃该结果后重新完整运行；正式日志为fix6-branch-regression.log和fix6-main-regression.log（入库时仅清除行尾空格，保留原始结果）。整组812高度不受最后的<=740小屏平移调整影响；小屏最终代码另行复跑通过。

提交及推送限定codex/r05-shell，使用force-with-lease；不合入main、不创建Issue，不改R06–R16或未读变体。
