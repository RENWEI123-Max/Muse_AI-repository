# R20 动态 12 态验收

分支 `codex/r20-moments`，从 `e6dec38` 创建，未合入 main。开工检查 `ps aux | grep '[c]odex exec'` 无结果，`git branch -a` 无 R20 分支；`/root/task-r20-moments.md` 存在且已读取。未启动其他 Codex runner 或子代理。

设计来源仅只读 `/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`。12 棵节点树及相对坐标在 [r20](r20/) 和 [measurements.txt](r20/measurements.txt)。没有调用 Figma API、使用 Figma token，也没有把原型图当作正式导出图。

|项|结果|证据与范围|
|---|---|---|
|A1 构建|通过|`cd client && VITE_API_BASE_URL=/api npm run build` 最终退出0：[build-release.log](r20/build-release.log)。首次缺少尚未落盘的 moments.css 导致 ENOENT，见 build.log；随后 build-retry.log、build-final.log、build-release.log 均成功。|
|A2 全量几何|未通过|抽样标准视口10项及700高贴纸面板1项均≤1px，见下表及 [measurements-browser.json](r20/measurements-browser.json)。未对12态全部文字、图标、附件、菜单和背景逐元素断言；保留业务功能导致的差异见下文。|
|A3 全量计算样式|未通过|10个逐属性抽样断言全部相等，见下表；没有完成全部元素字体、边框、透明度、渐变、阴影等断言。初测贴纸背景被共享sheet覆盖，已修复并复验。|
|A4 并排与差异比例|未通过／待 R01/R04|正式 R01 导出图尚未提供；没有并排图，没有编造差异比例。|
|A5 grep规则|通过（本轮及计划样式扫描范围）|[check-architecture.sh](r20/check-architecture.sh) 为可逐字复跑脚本；[architecture.log](r20/architecture.log) 中 pages、components.css、base.css、MomentsFlow.vue 的 hex、rgb、important、device前缀均0；styles.css/fidelity.css 旧动态规则均0。原 scoped 整块删除，31个hex和9个important已清除。此项不宣称全仓所有未来模块清零（全仓收尾属R25）。|
|A6 原用例|通过|未修改 `tests/d5.spec.ts`；完整原D5 1通过：[d5-final.log](r20/d5-final.log)，覆盖卡片、动态、草稿、持久化、1000字/6附件限制、非法/超大上传、分类、三种可见性、第二账号403、真实收回信后的权限及删除404。没有跳过受限操作。另专项1通过：[measurements-final.log](r20/measurements-final.log)。|
|A7 状态可达及截图|通过|12/12目标状态真实375×812 PNG，缺0张；[screenshots.json](r20/screenshots.json) 逐张校验PNG头尺寸。额外15张原D5补充截图在 regression/。保存完成沿用原发布成功notice，原data-state仍为moments-list，不伪造新的业务状态。|
|A8 诚实记录|通过|保留失败日志、初测结果及未覆盖范围；未伪造截图、测试数或视觉一致性；3x素材待Smith，A4待R01/R04，A2/A3全量验收待Smith复核。|

## 逐元素断言

以下标准视口均375×812；目标取自JSON相应节点。每项分别比较x/y/width/height，容差≤1px；实际值与目标相同。

|元素|目标 x/y/w/h|结果|
|---|---|---|
|动态页面|0/48/375/764|通过|
|页面header|0/48/375/64|通过|
|返回按钮|16/59.5/40/40|通过|
|标题容器|68/67.5/239/24|通过|
|文字输入|24/136/327/160|通过|
|分类选择|24/452/327/48|通过|
|可见性入口|24/524/327/56|通过|
|可见性面板|12/494/351/294|通过|
|可见性标题容器|33/527/309/24|通过|
|贴纸面板|14/336/347/376|通过|
|700高贴纸面板（响应式位置，非Figma标准帧）|14/300/347/376|通过，尺寸未缩放|

计算样式逐属性断言：页面背景 rgb(13,23,19)；标题17px/550；输入14px/21px；分类背景rgb(32,47,36)、圆角12px；可见性背景rgb(24,33,30)、圆角24px；贴纸背景rgb(29,41,35)。10项全部相等；不代表全量A3通过。

韩文页面、滚动容器、分类、可见性入口4项均 `scrollWidth <= clientWidth`。仅抽样检查不溢出，未声称12态韩文全面人工验收。新增固定展示文本补英韩副本，保留既有英文标题、placeholder、动态数据和aria-label，避免改动原测试及既有语言业务。

## 实现和已知缺口

- 新建 pages/moments.css；删除 MomentsFlow 全部旧 scoped CSS、fidelity.css 中旧动态/入口覆盖。颜色/字体/圆角引用token，新增6个准确色值及4个字体token，节点来源写于tokens.css。共享sheet/dialog沿用components.css；贴纸复用R11的ui-sticker-grid/ui-sticker-option。为保留原D5对`sheet`动画类名的验证，共享面板样式增加data-panel选择器别名，未复制第二套共享定义。
- [protection.json](r20/protection.json) 确认 script 与e6dec38逐字节相同、原id/aria-label保留、原D5及App.vue不变。未修改支付、登录、会话、token存取；保留原data-state计算和事件。
- Figma的Save moment/“本机保存”与现有真实后端发布语义不同，保留Publish moment及真实notice，不把发布改成本机保存。Figma有Like和独立Video/Hold入口，当前业务没有对应动作，本轮未加假交互。现有Media仍支持原视频/音频上传。
- Figma菜单没有现有Category编辑动作；为保留原功能，将该动作保留在菜单上方，属于视觉差异。现有detail页及View moment入口保留；原D5的options/delete截图从detail到达，底层不是Figma的列表，删除确认尚未叠加设计稿的不可交互菜单底层。
- 附件数量、图片、日期、文字均来自真实测试操作，非Figma样例内容；不能宣称列表、附件、保存状态与设计完全一致。未完成全量阴影/渐变/小图标和文字定位对照，A2/A3仍未通过。
- `@media(max-height:740px)` 只调整面板位置，不缩放插画或贴纸。1x既有资源真实上传；3x资源待Smith。

## 测试环境和失败记录

独立数据库 `maugo_d5_task75_1794645664402`，后端3069，前端5169。沿用原d5-server真实signup注册Author/Viewer并复用注册token，未调用/auth/login、未遇到401/429，也未连续重试登录。账号仅在 `/tmp/r20-account.json`，不提交。后台启动首次缺少env配置失败见backend.log，指定仓库已有env后成功见backend-retry.log，未输出配置内容。

开发服务器遇到已在R19记录过的reply.css `Cannot read properties of undefined (reading 'scoped')`，见dev.log。首轮原D5等待页面、未产图后停止（d5.log）；改用成功构建的生产预览（preview.log），API仍代理真实隔离后端。首次生产原D5因隐藏韩文标题进入textContent，在原第37行精确文本断言失败（d5-preview.log）；恢复原标题后，使用真实API仅删除本轮账号的测试动态/卡片，复用同一账号会话重跑通过（d5-final.log）。未改测试断言或业务逻辑。

专项初次失败见measurements.log、measurements-browser-initial.json：贴纸背景被共享sheet覆盖；700高坐标读取发生在入场动画中。修正共享选择器排除贴纸，并在读取前等动画结束，原目标值和断言不变，复验通过。背景修复后更新moment-stickers真实截图；其他11张目标PNG来自通过的原D5。

构建成功后才运行最终专项。原D5通过后仅修复贴纸背景和测量等待，未重复全套业务测试。原D5本轮所有业务断言均执行，无因限流或权限跳过的项目。

## 截图清单

以下12张目标图真实存在，均375×812；缺0张。

- [moments-empty](r20/moments-empty.png)
- [moments-list](r20/moments-list.png)
- [moments-category-empty](r20/moments-category-empty.png)
- [moment-empty](r20/moment-empty.png)
- [moment-draft](r20/moment-draft.png)
- [moment-photo](r20/moment-photo.png)
- [moment-stickers](r20/moment-stickers.png)
- [moment-visibility](r20/moment-visibility.png)
- [moment-leave](r20/moment-leave.png)
- [moment-options](r20/moment-options.png)
- [moment-delete](r20/moment-delete.png)
- [moment-saved](r20/moment-saved.png)

这是实现截图，不是Figma导出图。补充15张（卡片、detail、权限拒绝、更新、分类、六附件等）在 [regression](r20/regression/)；总真实PNG27张。无R01并排图，差异比例未计算。
