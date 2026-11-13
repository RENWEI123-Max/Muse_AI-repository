# C3 模块 02 验收

实现目录：`client/src/components/HomeFlow.vue`、`client/src/home.css`；登录衔接在 `App.vue` 和 `AuthFlow.vue`。状态来源为交接包 `page-states.json` 的 home 模块，视觉素材和英文文案参考 `MauGo.html`。

| 状态 | 结论 | 验收内容 |
| --- | --- | --- |
| home-ready：首页 / 三封来信 | 通过 | B4 列表返回三封，鸟可点击打开 B4 详情，魔术帽可换组。 |
| home-empty：首页 / 无符合条件的信件 | 通过 | Refresh 耗尽测试来信后显示无匹配提示，仍可调整筛选或重试。 |
| home-response：首页 / 回应到达 | 通过 | B4 responses 显示回应入口；点击进入对应信件，关闭后回应消失；服务端已读机制避免重复展示。 |
| filters-free：筛选 / 未开通 Pass | 通过 | 年龄、城市禁用；锁定覆盖层及购买入口可打开 B6 方案。 |
| filters-active：筛选 / Pass 生效 | 通过 | B6 购买成功后解锁年龄、城市并显示剩余天数；到期自动清除高级条件、重锁并重新拉取来信。 |
| filters-selected：筛选 / 已选择条件 | 通过 | 性别与城市条件通过 B4 查询发送；重新打开弹层保留选择。 |
| bird-female：信使外观 / 女鸟 | 通过 | 9 个女鸟外观逐一切换，预览和首页即时更新。 |
| bird-male：信使外观 / 男鸟 | 通过 | 9 个男鸟外观逐一切换，使用对应飞行序列素材。 |
| bird-motion-off：信使外观 / 关闭动画 | 通过 | 关闭 Flight & hover 后使用静态素材，停止鸟悬浮与魔术帽动效；选择保存在本机。 |

无缺失状态。18 个外观依原型顺序为 Sky blue、Sunshine、Sage green、Soft lilac、Fresh mint、Sunset peach、Blueberry blush、Pastel rainbow、Aurora，各含男女款。Magic trails 可独立开关；支持系统减少动态效果设置。首页含魔术帽呼吸、六帧飞行、悬浮、光晕、换组入场和锁定提示动画。

接口沿用 `VITE_API_BASE_URL`；开发代理沿用 `MAUGO_API_TARGET`，默认后端为 `http://127.0.0.1:3000`。城市选项完全来自 `/discovery/filters` 的 B4 占位数据源。列表、详情、Refresh 和 Pass 状态/购买均请求真实 B4/B6 接口，界面不伪造来信或 Pass。会话凭据仅保留内存。

验证结论：生产构建、TypeScript、343 素材校验通过；开发服务器可启动；原有 5 项测试通过；新增 C3 浏览器测试通过。测试由 `tests/auth-server.mjs` 新建独立 PostgreSQL 测试数据库并加载迁移，仅在该测试进程中注册夹具路由；未修改后端代码、生产表、密码或密钥，未删除数据库。测试文件为 `tests/home.spec.ts`，截图输出于 `test-results/c3-*.png`。无 git push。
