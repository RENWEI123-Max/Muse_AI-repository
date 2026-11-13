# #88 推荐开关合入结果

2026-11-13：已将 task-83 的 #68 客户端差异应用到当前 main（基于 8b10e8f），无冲突，保留 main 后续修复。仅修改 HomeFlow.vue、SettingsFlow.vue、i18n.ts，并加入推荐验收测试及配置；没有后端改动、新接口或新依赖。

推荐复用现有来信发现 `/letters`。开启时使用已保存的性别、城市和年龄筛选，关闭时使用默认筛选；`/letters/refresh` 同步遵循开关。沿用本地设置持久化，城市及年龄仍受现有 Filter Pass 权限限制。

验证已通过：

- 客户端构建（包含资源校验及类型检查）、独立 vue-tsc 类型检查通过。
- Chromium 浏览器验收 1/1 通过，使用真实后端、独立新建 PostgreSQL 测试库，保留测试数据，未使用业务库表。
- 开启时 GET `/letters` 携带 gender=female、city=Seoul、minAge=22、maxAge=40；关闭后不携带筛选参数。
- 关闭时刷新请求体为 `{}`，重新开启时恢复全部已保存筛选；真实退出重登、页面重载后状态及筛选均保留。

验收入口：`tests/d6-recommendation.config.ts`、`tests/d6-recommendation.spec.ts`，复用现有隔离测试库启动器。截图作为测试输出保存，不新增验收说明文件。

交付状态：代码和测试已放入实际 main 工作目录，等待 runner 自动提交及推送。遵照任务最后的指令，本次未自行提交或推送；远端结果需以 runner 执行结果为准。
