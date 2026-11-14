# R22 账号安全结果

执行结论：**未通过／待 Smith，部分实现**。四项验收均未通过。构建和源代码约束检查通过；D7、F07 均在服务器启动阶段因缺少数据库配置而终止，**各 0 个测试执行**。13 个目标状态没有真实账号流程截图；只有 4 张入口受阻诊断截图，不能计作目标状态完成。

## 基线与执行环境

- Mac mini `Annas-Mac-mini.local`，仓库 `~/Muse_AI-repository`；分支 `codex/r22-security`，从 fetch 后的 `origin/codex/r21-settings`（`1fa68c9`）建立。不合入 main。
- 开工前 ps、分支、tmux 检查：唯一 R22 Codex 是本轮进程，已运行于 `r22-security`，命令含 `--approve-for-me`；没有启动第二轮。`~/task-r22-security.md` 存在，没有重建任务文件。
- 读过 R21-result.md 全部七项冲突；没有更改 R21 的缺失设置能力、退出/删除入口、通知分类、隐私保存、缓存行为或翻译。
- 没有 Figma API/token、Issue、Telegram、服务器操作，也没有启动3000测试后端。真实走查前端5352，API目标明确为本机3001；没有可用测试数据库、真实测试账号或登录会话。

## 原型摘录

直接解析 `~/maugo-design/MauGo.html` 的 `window.__ATLAS_BUNDLE__`，读取 `features.js` 和 CSS。可复核的原文见 [prototype-excerpts.txt](r22/prototype-excerpts.txt)。13 个本地 Figma 节点完整摘录见 `r22/39-*.json`，没有联网取图。

- security：6行，Preview account、Password recovery、App lock、Identity verification、Export my data、Delete account。分组 x24/y136/w327/h336，行高56。下方说明 y496；header x0/y48/h64，返回按钮 x16/y59.5/40×40，标题 x68/y67.5/239×24，Fredoka 500 17/24。
- account-info：邮箱、登录方式、账号类型；另一组包含密码找回、切换账号、退出、删除。原型切换账号打开欢迎页；退出经确认后调用原型 logout。
- verification：180px鸟图置于 y136/h184 的容器；标题 y332，说明 y380，服务行 y446/h58，返回 y540/h48。服务未接入，不采集照片或生物信息。
- pin-create：inset sheet x12/y505/w351/h283；标题 App lock；创建4位PIN；输入 x33/y622/w309/h48，Set PIN y686/h48，设备会话说明 y750。格式错误 `Enter a 4-digit PIN.`；关闭锁要求当前PIN，错误为 `Incorrect PIN.`。原型错误通过 toast；成功哈希加盐保存并关闭弹层。
- pin-locked/pin-wrong：页面隐藏且已有锁时出现 Welcome back 弹窗，不允许关闭；正确PIN解锁，错误PIN显示反馈。PIN输入居中、字距12px。
- signout-confirm：原型从主设置弹出，标题 Sign out?；原文声称本地信件和消息保留，确认退出回欢迎页（signed-out）。**这与本单 F07 已定口径冲突，不能照抄“保留”提示。**
- delete-disabled/typed/ready：输入必须严格等于 `DELETE` 且勾选不可撤销说明才启用按钮。原型注销只清当前本地预览资料；导出→输入→勾选→最终确认，Keep my account返回。Figma y136介绍、y330摘要、y500导出、y572标签、y604输入、y676勾选、y712删除、y772保留按钮。
- delete-final：原型确认直接清本地资料，没有服务器挑战token和密码输入。
- 效果：round 按压缩0.94，actions按钮0.96，tool-button按压变色；sheet-in为0.3s ease-out；输入和菜单使用内部滚动。PIN错误原型是toast，不是当前组件的行内错误。

## 实现说明与未解决差异

仅修改 `AccountSecurity.vue` 和新建 `styles/pages/account.css`，外加交付文档及证据。删除组件全部旧 scoped CSS，使用 scoped src 加载新页面样式；没有遗留全局账号模块规则需要删除。

- 接入既有 ui-header/back、ui-card、ui-row、ui-input、ui-button、ui-sheet/grabber、ui-dialog。header按本地Figma x/y，正文24px边距、56px菜单行、180px鸟图容器；鸟图及返回图标沿用资产manifest中的3x资源。
- 根容器禁止滚动，正文内部 overflow:auto；弹层有最大高度与内部滚动。短屏媒体查询只改底部位置/留白，不缩小鸟图。
- 按压圆形返回0.94、其它按钮0.96；页面淡入/横移保留，弹层opacity/translateY改为0.3s ease-out；无障碍减少动画分支取消过渡。输入错误边框反馈。
- 在组件增加只供显示的英韩词典和文本格式化，不改变请求或状态判断；账号邮箱保持原始用户内容。旧id、动态id、aria-label全部保留，无既有data-state可移除。
- 退出说明改为清除当前账号本地草稿、偏好和聊天外观，保留语言与App lock（英韩双补），遵循本单F07。没有修改退出清除函数。
- 从 `const props` 至原 script 末尾的业务代码与 `1fa68c9` **逐字一致**：PIN哈希/保存、visibility监听、API、导出、logout、删除挑战与密码二次提交全部未改。App.vue、token、账户存储、支付、后端调用未改。

以下仍需 Smith，未擅自增加业务能力或假控件：

1. security缺Password recovery，而有额外Lock now和Sign out；账号页没有密码找回，Switch account仍打开退出确认，不能在样式任务中改路由/会话。分组结构与Figma不同。
2. Figma/原型是预览账号和本地注销，产品是服务器账号、真实导出及删除。保留真实说明，不能把服务端删除说成仅清浏览器；因此文案、行高与Figma不完全相同。
3. signout-confirm原型背景是主设置，当前弹层来自账号安全；R21主设置缺退出/删除行为仍未解决。signed-out由现有App.vue退出流程显示，本轮不修改。
4. F07清除规则优先于旧原型“保留”提示；此明确口径冲突在此上报。真实清除隔离性未验证，不能称F07通过。
5. delete-final现有接口要求挑战token和密码，原型没有；保留密码字段和提交，弹窗高度无法等同原型。
6. PIN格式/错误目前为行内alert，原型为toast；PIN sheet仍有Cancel，缺原型右上关闭按钮；锁定弹窗设备说明也不同。现有业务不动，不能称效果一致。
7. 不是所有颜色、字体和摘要背景已与Figma完全相等：例如删除摘要目前使用现有card token，危险按钮沿用现有危险色token；插画容器180×184而原型img180×180，未获得真实渲染测量。不可宣称≤1px。
8. 新模块CSS hex=0、important=0、device前缀=0、未定义token=0；全仓其它CSS仍有114个hex字面量，沿用R21已知缺口，未越界重写其它模块。

## 真实流程走查

脚本：[walkthrough.mjs](r22/walkthrough.mjs)，逐步实际文本：[walkthrough.json](r22/walkthrough.json)。没有fixture、API拦截、假账号、token注入或组件状态强制赋值。

375×812/en、375×812/ko、375×667/en、375×667/ko分别执行：

1. 欢迎页点击 Explore preview；进入首页。
2. 点击 Profile → Settings；设置分组正常展示。
3. 韩文组点击Language → 한국어 → Back；设置显示韩文。
4. 点击 Account & security/계정 및 보안；实际仍停留设置页，`.account-security` 数量为0。
5. 保存当前375px宽浏览器PNG作为入口阻塞证据。停止依赖真实账号的操作；不在其他服务器执行PIN、验证、退出、删除。

根因：`App.vue`只有 `v-if="sessionToken"` 时挂载AccountSecurity；预览入口没有真实会话。无独立数据库，不能真实注册并单次登录复用会话。该挂载条件属于禁止修改的会话逻辑，因此保留。

| 目标状态 | 本轮实际走查与截图 |
| --- | --- |
| security | 入口受阻，未到达，缺图 |
| account-info | 未执行，依赖真实会话，缺图 |
| verification | 未执行，依赖真实会话，缺图 |
| pin-create | 未执行，依赖真实账号profile，缺图 |
| pin-invalid | 未执行，缺图 |
| pin-locked | 未执行，缺图 |
| pin-wrong | 未执行，缺图 |
| signout-confirm | 未执行，缺图 |
| signed-out | 未执行真实退出，欢迎页不能冒充退出完成态，缺图 |
| delete-disabled | 未执行，缺图 |
| delete-typed | 未执行，缺图 |
| delete-ready | 未执行，缺图 |
| delete-final | 未执行真实挑战/密码确认，缺图 |

## 四项验收

| 验收 | 结果 | 证据与限制 |
| --- | --- | --- |
| 静态 | **未通过／待 Smith** | build/资产校验/vue-tsc和diff --check通过；源代码约束通过；13态无实际几何/计算样式测量，已有控件、文案和颜色差异，不满足≤1px/完全相等。 |
| 流程 | **未通过／待 Smith** | 四组真实入口均受会话条件阻塞；13态未走通。密码找回、切换账号、服务器删除等与原型不同；D7/F07各0执行。 |
| 效果 | **未通过／待 Smith** | CSS定义0.94/0.96按压、页面过渡、0.3s弹层、PIN错误边框；未实测本组件所有可点元素、弹层或PIN反馈。行内错误与原型toast不同，不能称完整sheet-in一致。 |
| 滑动与文案 | **未通过／待 Smith** | 有根容器overflow:hidden和内部滚动样式，未在真实13态验证两高度/双语。无显式“下面还有”提示；平滑性、内容截断、韩文溢出及中/底位置截图均未验收。 |

## 效果逐项核对

| 项目 | 已实现/缺失/验证情况 |
| --- | --- |
| 返回圆按钮 | CSS0.94；真实组件按压未执行 |
| 菜单Account/App lock/Lock now/verification/export/delete | CSS0.96；逐元素未实测 |
| 退出、账号页Switch/Sign out/Delete、verification返回 | CSS0.96；未实测 |
| PIN Set/Turn off/Unlock、Cancel | CSS0.96；未实测；无关闭图标，不同于原型 |
| 删除export/request/keep、最终confirm/Cancel | CSS0.96；未实测；后端挑战未执行 |
| PIN输入 | 居中/12px字距/错误边框已有；toast缺失，错误动画未验证 |
| 弹层sheet-in | opacity+translateY40px、0.3s ease-out；运行时和原型逐帧对照缺失 |
| 页面切换 | opacity/横移 .18s保留；未实测 |
| 工具按钮变色 | 本模块没有tool-button；没有新增虚假工具按钮 |
| 触觉/顺滑体验 | 未做真人触屏验证 |

## 测试与R01比较

- [build.log](r22/build.log)：最终构建通过，包括asset verifier和vue-tsc。
- [source-checks.json](r22/source-checks.json)：业务代码逐字不变、id/aria保留、样式约束。
- [d7.log](r22/d7.log)：`Test database connection unavailable`，0执行。首次启动被沙盒tsx IPC权限阻止，改用同一node loader完成一次数据库预检后停止，没有连续数据库重试。
- [f07.log](r22/f07.log)：`Database connection unavailable`，0执行。
- 测试spec和数据库配置均未改。临时启动适配副本仅将health/API端口指向3001，D7用node loader绕过沙盒IPC；副本已删除，原文保存在 [D7启动记录](r22/test-launch-d7.txt)、[F07启动记录](r22/test-launch-f07.txt)。原D7脚本监听端口仍为3171，但本次在数据库检查即退出，未启动后端，不能称3001测试服务成功启动；恢复测试时需正确支持3001，不能直接复用这份health适配。
- 13态均缺真实截图，**R01并排图与像素差异比例全部缺失／未执行**。未设阈值，没有把参考图、历史d7截图或入口诊断图当作本轮实现截图。

## 截图清单与阻塞

以下4张是真实浏览器截图，仅为入口受阻证据：

- [812英文入口](r22/812-en-security-entry-blocked.png)
- [812韩文入口](r22/812-ko-security-entry-blocked.png)
- [667英文入口](r22/667-en-security-entry-blocked.png)
- [667韩文入口](r22/667-ko-security-entry-blocked.png)

13个目标态截图、可滚动正文中/底截图、每态R01并排图及比例均缺失。需要可用的Mac本机独立测试数据库与真实注册账号环境，再按单次登录复用会话验证；原型业务差异需Smith决定后续范围。当前交付是可审查的样式/模板部分实现，不能标R22完成或验收通过。
