# R21–R24 fixes 执行计划

依据：~/task-r21-r24-fixes.md；基线 origin/codex/r25-wrapup 6f1d2f8；仅当前分支串行执行，不派生第二个 run。

- [x] 防重复、任务文件、Mac/tmux、远端基线核对。
- [x] 读取离线原型三态与本地 Figma 节点；实测修改前 258px/500。
- [x] settings.css 只调整缓存高度与系统字体 General 标题权重；Vue script 保持逐字一致。
- [x] d8-server 复制 d7 排序扫描迁移做法，保持 spec 不动。
- [x] D7 原样复现，依据 DOM/网络/本地锁证据区分测试与产品根因，仅修测试侧。
- [x] 真实注册、一次登录复用会话，三态两高度英韩走查、PNG/尺寸/滑动/动画记录与 R01 并排。
- [x] 串行运行 D7/D8，构建、diff/CSS/script 检查，结果文档保留待 Smith 原清单，提交并推送，不合 main。
