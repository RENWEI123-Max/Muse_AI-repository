# R24 wallet & Filter Pass — 部分实现，验收未通过

分支 `codex/r24-wallet`，基线 `origin/codex/r22-icon-fix` / `de9aa3a`。未合入 main。唯一执行轮次为 Mac mini 的 tmux `r24-wallet`（启动命令含 `--approve-for-me`）；任务文件已核实存在，开工 fetch 后未发现其他 R24 进程或已有 R24 分支。保留另一进程的 r21/preview.log，未提交。

## 四项验收（执行摘要以此表为准）

| 验收 | 结果 | 证据与限制 |
| --- | --- | --- |
| 静态 | **未通过／待 Smith** | 构建通过，diff --check 干净；钱包外框实测 x12/y104/351×684 与 Figma 相同。未达到全部关键元素 ≤1px、全部计算样式相等。Pass 益处图标缺失、套餐/弹层布局及字体仍有差异；保留现有付款说明和额外按钮导致高度不同。 |
| 流程 | **未通过／待 Smith** | 7 个目标态在两高度双语下真实可达，另走查充值入口及返回。6 态缺真实条件，未截图。StoreKit 0/6，Pass confirmation 1/2；D9 原配置端口不符合本单 3001 限制，未运行。 |
| 效果 | **未通过／待 Smith** | 共享 sheet-in、切换过渡已存在；补方案/操作按钮 .96 和关闭按钮 .94。未逐按钮实测按压、未逐帧核对；真实充值成功反馈未验证。 |
| 滑动与文案 | **未通过／待 Smith** | 36 份真实步骤记录均 documentScroll=false，内部滚动截图覆盖中/底；补英韩显示文案。未完成全部节点裁切检测，未实测触屏顺滑，无“下面还有”专门提示；不能声称双语完整无截断。 |

## 原型摘录与 Figma 核对

直接解析 `~/maugo-design/MauGo.html` 的 `window.__ATLAS_BUNDLE__` 内 scripts[].code 与 CSS，摘录见 [prototype-extract.txt](r24/prototype-extract.txt)。只读本地 `~/maugo-figma/maugo-file-full.json`，未调用 Figma API/token。

13 个节点均存在且同名：[figma-extract.json](r24/figma-extract.json) 包含完整子树。钱包 39:3382/39:3563，充值 41:1914/41:2115，Pass 41:2298/41:2400/41:2502/41:2604/41:2742/41:2879/41:2983/41:3122/41:3228。

- 钱包为 x12/y104/351×684 的 sheet；标题 x33/y129/309×40；内容 x33/y185/309×610；余额 y319/h48；2×2 套餐 x33/193.5、y387/557，148.5×158、gap12。原型点击套餐打开确认，可取消、点击遮罩或关闭，焦点恢复。
- 原型钱包文案 `Diamonds for filters and extra replies.`；四套餐 Starter pack/+10%/+20%/+30%；点击 `Confirm preview` 在本地增加测试余额，保存失败回滚，成功 toast。底部 `Explore Filter Pass` / `Back to Filter Pass`。
- Pass 页 header y48/h64，内容 x24/y136/w327；图标64×64；益处卡 y295/157.5×123.5；方案 y474.5/101×111，gap12；余额 y645.5；购买 y692/327×48。选择 1/7/30 天，默认7；文案 `One pass unlocks both filters. No automatic renewal.`。
- 筛选入口 Pass sheet 使用纵向三个方案（每个309×78），更改选择后单独 Unlock。余额不足原型先展示专门短缺弹层，可充值或取消；余额足够显示 Total、Your balance、Balance after payment，确认后扣本地余额，延长 passUntil，再 toast。
- 原型 sheet-in .3s ease-out；圆按钮 .94、操作按钮 .96；遮罩关闭、取消和焦点恢复都在 JS 明确实现。

### 冲突：保留业务，未擅自选择替代流程

原型为本地模拟加钻/购买，当前为 StoreKit 服务端验证与真实后端扣钻。保留当前全部支付、余额、Pass 请求及会话逻辑，不实现原型假充值。现有筛选入口点击方案直接进入确认，原型先选再 Unlock；现有不足页仍含 disabled 确认按钮与计划摘要，原型为独立短缺文案。现有取消回筛选、成功独立页，也不同于原型恢复原页后 toast。以上需 Smith 确认后续业务任务，不能靠样式完成流程验收。

## 实现与边界

`ReplyTopup.vue` 增加独立内部滚动容器；`HomeFlow.vue` 仅修改本模块模板，增加样式类、方案数量/单位/价格层次、余额排布；新增 wallet.css。两文件 script setup 与基线逐字相同，id 保留，原 data-state/aria-label 表达式保留：[source-checks.json](r24/source-checks.json)。App.vue、token/localStorage 会话处理、后端调用均未改。

旧专属样式从 reply.css、HomeFlow.legacy-1/2.css、home.css 移除；fidelity 的通用旧规则排除 wallet-pass，避免再次覆盖；这些是整模块迁移所需的配套范围。tokens.css 新增钱包 tokens，i18n.ts 补五条韩文。wallet.css 无 hex、!important、.device 前缀，新增颜色/渐变/阴影/圆角/字体使用 var。仓库其他模块仍有历史 hex，未冒称全仓 grep 为零。素材通过现有 manifest 解析，diamond 与 filter icon 均为 scale=3；未使用 R01 图片充当页面。

## 挂载条件与真实走查

HomeFlow 可从预览挂载，但 openPass 必须成功调用 `/filter-pass`、`/discovery/filters` 与 `/wallet`；钱包也需要有效 token 加载真实产品及余额。本次新建独立库，应用真实全量迁移，后端严格 3001、前端5354，未碰3000。记录见 [server.mjs](r24/server.mjs)、[server.log](r24/server.log)。通过真实 `/auth/signup` 注册，UI 单次登录，后续复用应用正常保存会话；切换语言只改 maugo-language，未注入 token。无 API mock、无余额/Pass 种子端点、无数据库 UPDATE。

在 375×812/en、375×812/ko、375×667/en、375×667/ko 四组各执行下列步骤。逐步实际文案、外框、滚动及溢出候选见 [walkthrough.json](r24/walkthrough.json)。

| 状态/操作 | 实际结果 |
| --- | --- |
| wallet-empty：Home → Diamonds | 实际余额0；四套餐来自服务器，浏览器价格 Unavailable/구매 불가；可内部滚动到底部购买说明与返回。 |
| topup-confirm：点击首套餐 | 确认弹层显示100钻、Unavailable、App Store验证说明；取消返回钱包；关闭返回Home。未点击真实购买。 |
| pass-default：Home → Filter Pass | 默认7天/150钻，余额0。 |
| pass-one-day：点击1天 | aria-pressed 更新，购买按钮显示30钻。 |
| pass-month：点击30天 | aria-pressed 更新，购买按钮显示480钻。 |
| pass-shortage：点击 Unlock | 显示30天/480钻摘要，确认 disabled、Get diamonds 可用；与原型独立不足弹层不一致。 |
| shortage-topup → 返回 | 打开真实钱包，返回后仍为30天确认，提示未购买、选择保留；取消回筛选，关闭回Home。 |
| pass-sheet：Filters → Pass 徽章 | Pass 弹层出现；关闭回筛选，再关闭回Home。未点击会扣钻的确认。 |
| wallet-balance / topup-success | **未验证／待 Smith**：新账号余额0，浏览器无 StoreKit；没有造余额或伪装充值成功。 |
| pass-confirm / pass-active / pass-extend / pass-success | **未验证／待 Smith**：需要已有真实余额/Pass或扣钻成功；截图走查未执行充值或扣钻。既有回归有独立测试购买，但不挪用为本轮13态真实截图。 |

走查曾发现钱包关闭按钮被标题拦截，已加按钮层级修复，最终四组均用真实点击关闭成功。内部滚动中/底用 scrollTop 定位截图，证明内容可达；未做真人触屏顺滑测试。没有专门“下面还有”提示；使用细滚动条。horizontalOverflow 为诊断候选，含隐藏标题与绝对定位关闭按钮，不能等同于逐字裁切验证。短屏仅调整容器位置/高度，没有缩放插画。

## 回归测试与缺口

- [build.log](r24/build.log)：最终 npm run build 通过。
- [pass-confirmation.log](r24/pass-confirmation.log)：**1 passed / 1 failed**。取消路径、实际独立库购买及累计续期通过；失败重试测试期望同一幂等键，实际 Set(keys).size=2，期望1。未改支付逻辑，也未为凑通过改测试。
- [d9-storekit.log](r24/d9-storekit.log)：**0 passed / 6 failed**。既有测试以 mock native bridge/API 执行，引用 `.diamond-pack`/`.d1-topup` 旧选择器，当前组件不含这些类；不代表真实 StoreKit 沙盒验证，也未改测试选择器。
- `d9.spec.ts`：**未运行／待 Smith**。其 server 为全量扫描迁移（无 d7 的旧清单问题），但固定后端3176、spec内硬编码3176，配置前端5276。本单明确测试后端3001，不擅自修改既有测试或越过端口约束；无法声称通过。
- 回归生成的 c7 图片已恢复基线，不作为 R24 真实截图交付。未连续重试失败的回归，未调整数据库配置。

## 效果核对

共享 ui-sheet 的 sheet-in .3s，ui-dialog/payment 的 .22s（与原型 .3s 不完全相等）；Pass confirmation 保留 pass-confirm-in .25s；sheet 转场保留现有过渡。方案选中有背景/边框过渡；补充操作/方案按钮 transform(.96)，关闭按钮(.94)，钱包 ui-button/圆按钮沿用共享反馈。仅源码核对，未完成所有可点项逐个按压和动画逐帧实测。充值成功 toast 未验证；当前成功页也不同于原型 toast。效果项未通过。

## R01 并排与截图

真实PNG清单：[screenshots.md](r24/screenshots.md)。7 个可达目标态各有375×812真实图，四组另有内部滚动中/底截图；另记录 shortage-topup、topup-return。缺失6态不补假图。

[R01对照数据](r24/comparison.json)、`*-side-by-side.png`：左实际、右R01，逐像素RGBA不等比例，无蒙版，无阈值，不作为通过判定。实际 API 文案、后端状态及字体均会影响差异；不得以较低差异比例代替验收。

待 Smith：实际 StoreKit 链、真实余额和已有Pass账号的6态、支付幂等键失败、D9端口与旧选择器维护、原型流程冲突、全元素≤1px/计算样式核对、逐按钮效果及真人触屏和双语裁切检查。当前仅部分可审查实现，不是13态完成验收。

| 状态 | RGBA差异比例 |
| --- | --- |
| wallet-empty | 45.45% |
| topup-confirm | 93.90% |
| pass-default | 52.38% |
| pass-one-day | 52.38% |
| pass-month | 52.38% |
| pass-shortage | 91.63% |
| pass-sheet | 65.39% |
