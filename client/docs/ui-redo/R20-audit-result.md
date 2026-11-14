# R20 动态补查

基线 `f3a9ccd`（`codex/r19-audit`），分支 `codex/r20-audit`。整体结论：**未通过／待 Smith**。本轮交付补查证据，专项脚本通过不等于模块验收通过。

开工仅当前这一轮 `codex exec --approve-for-me`，已在 `r20-audit` tmux；没有另起 runner、没有开 Issue。无已有 audit 提交。从指定基线建分支；本机获准执行 localhost/浏览器及 git 操作。未调用 Figma API、未使用 token，未启动真实后端。

## 四项验收

| 项目 | 结果 | 证据与边界 |
|---|---|---|
| 静态 | 未通过／待 Smith | 本轮增量构建与 A5 复核；沿用 [R20-result.md](R20-result.md) 的 A1–A8 和原12态＋15回归截图。原 A2/A3 未完成全量；A4 本轮没有重做。R01/R04 已可用，但不将其数字写成 R20 结论。 |
| 流程 | 未通过／待 Smith | 十二态用 API fixture、真实输入上传发布与点击到达。列表/上传/发布/更新/删除失败、草稿保留/放弃、附件/字数边界与关闭覆盖；Category 菜单入口被裁切、删除取消不保留菜单、自动草稿持久化等差异仍在。真实后端未验。 |
| 效果 | 未通过／待 Smith | 对照原型关键帧、按压与过渡；本轮证据与修复见下文。原型 2700ms toast 与产品常驻 notice/alert 不同，脚本禁改未修，不能判全效果通过。 |
| 滑动与文案 | 未通过／待 Smith | 两高度、两语言检查 document 固定及指定容器滚动；仍有英文标题、placeholder、分类/可见范围、错误/状态和 aria-label 漏译。静态限制内未移动被裁切的 Category 菜单入口。 |

## 原型摘录、实现、流程走查

来源为只读 `~/maugo-design/MauGo.html` 的 `__ATLAS_BUNDLE__` 内嵌 features.js、app.js 与 CSS。摘录：[prototype-excerpts.txt](r20-audit/prototype-excerpts.txt)。只读原型代码，没有使用 atlas driver 给产品跳状态或预填内容。模块12完整状态目录见 [state-script.json](r20-audit/state-script.json)，与原 R20 十二项逐一一致。

| 状态 | 原型动作 | 实现与本轮真实走查 |
|---|---|---|
| moments-empty | Profile → View all moments，无内容 | fixture 初始 posts=0，真实登录后从 Profile 点击进入 |
| moments-list | Save 后列表；可 Like、菜单 | 本轮 UI 发布实际 POST 创建，日期与内容来自测试输入；未造点赞，当前缺 Like 待 Smith |
| moments-category-empty | 选无内容的 Outfit | 已发布 Life 后点击 Outfit 到达，再点 All 返回 |
| moment-empty | New moment，空输入 | 真实点击；发布禁用，与原型点击后 toast 提示不同 |
| moment-draft | 输入文字；输入即本地保存 | 真实 fill；产品仅 Keep draft 时保存，不等于原型自动持久化 |
| moment-photo | 选择照片/视频/录音，媒体可移除 | 浏览器文件选择上传既有 portrait-5.png；返回实际字节并解码，删除第六附件；独立 Video/Hold 缺失沿用原 R20 |
| moment-stickers | 打开独立 emoji picker，选一张 | 实际点击打开/关闭、选贴纸经过产品 fetch/upload/hydrate，非假附件 |
| moment-visibility | 三种范围即选即关闭 | friends/only_me/everyone逐个点击并重开查 aria-pressed；并覆盖已发布 PATCH503与重试 |
| moment-leave | Back → Keep/Discard/Continue，关闭仍编辑 | 真实点击三分支、重开恢复与发布后清空；Profile直接新建的返回目标仍固定为列表，与原型 history 不同 |
| moment-options | 已发布更多 → Visibility/Delete | 列表 data-more 实际点击；额外 Category 入口保留但裁切，禁止移动静态，未强制点击伪称可达 |
| moment-delete | 菜单上方独立确认；取消回菜单 | 真实取消保留 post，但产品清空 sheet回列表；503后确认保留、重试删除至空态 |
| moment-saved | Save → 列表＋Moment saved on this device. toast | 产品保留后端 Publish 及 Moment published. notice；data-state仍moments-list，本轮仅以主图名标记，不伪造业务状态 |

fixture 全部从0开始，帖子只由真实 UI POST 创建；无真实用户/点赞/评论、无直接设置 Vue refs。上传相同仓库图片多次是明确边界输入；不能据此声称真实内容/后端通过。未知 mutation 会抛错。浏览器请求、正文、错误、滚动、文案和动画见四份 `*-walkthrough.json`。

## 已知差异与待 Smith

- 原 A2/A3 全量静态与 A4 并排仍未验；本轮遵守静态不动，不补全量静态、不借用 R04 结论。原3x素材待 Smith。
- 自动草稿持久化、真实后端存储/权限/并发、重新登录恢复、真实动态/点赞/评论未验；原型本地保存语义不能替代产品后端发布。
- 原型 maxlength=1000，产品允许输入1001但禁发布；本轮保留业务实现，并验证1000时发布按钮启用、1001禁发布、仅空格禁发布（未实际提交1000字帖子）。
- 六附件禁用、移除第六张重启用、10MB边界、非法MIME、上传/发布/更新/删除503均是 fixture 范围。视频/音频解码和真实录音未做运行验收。
- 菜单 Category 入口绝对定位于 sheet 上方，被基线共享 overflow 裁切；真实 click 被 overlay 拦截。本轮不 force click、不移动静态，截图/坐标/hit=false 保留。
- 删除取消/Close/Escape清空整个菜单，未保留原型可操作下层菜单；没有新增底层假菜单。进入/退出自动聚焦、焦点恢复、Tab循环与 inert 缺失，不能称完整键盘通过。
- 韩文仍有 A little moment/My moments、What is on your mind?、Who can see this?、Everyone/Friends/Only me、All/Portrait/Style/Outfit/Life、Visibility/Category、删除标题和说明、Retry、Please try again./Moment published./Deleted.，aria-label仍为英文。不是用户内容，属于漏译；遵守静态不动留待 Smith。
- 原型 toast2700ms，产品 notice/alert常驻；保存notice在667高固定top646.5且可能在底边被裁，本轮不改静态、不隐藏真实错误或状态。
- 基线共享规则使 dialog 底部对齐，原 R20 居中图与当前几何存在差异；本轮没有为截图移动它。完整布局/对比需后续单独静态验收。

## 证据与验证

原 D5/数据库回归未执行，见 [regression-not-run.md](r20-audit/regression-not-run.md)。没有改原用例或数据库配置。失败日志保留：sandbox localhost EPERM；首轮 Retry 被页面遮挡；press采样器移到backdrop意外关闭（后改为在panel内释放）；Category真实点击被裁切拦截。未改业务脚本、未用force click绕过不可达入口。

## 本轮实现与效果逐项

生产变更仅 `MomentsFlow.vue` 模板两处与 `pages/moments.css` 动画限定：

1. Moments 页列表错误内增加 Retry，调用已有 `act(()=>loadPosts())`；仅 `screen===moments` 时呈现，不在上传/发布失败时误导用户重试列表。
2. `.moments-overlay` 增加 `@keydown.esc.stop="back"`，复用已有 back，修复 Escape 冒泡关闭 Profile。
3. Moments overlay与sheet取消旧嵌套过渡/位移，确认动画限定 `.22s`，贴纸取消共享sheet误加的 `.3s`。均只改变动画/过渡，不改变正常静态坐标尺寸。

R19 cards overlay 的 `@keydown.esc.stop="back"` 原文保留；ProfileFlow整文件与f3a9ccd相同，R16 person、R17 likes及R18各头像层 Escape 原行完整保留。脚本SHA与当前A5扫描：[architecture.json](r20-audit/architecture.json)，复跑：[check-source.py](r20-audit/check-source.py)。pages、components、base、MomentsFlow的hex/rgb/important/device均0，旧styles/fidelity动态选择器0。

| 原型项 | 走查与当前边界 |
|---|---|
| 普通sheet .3s ease-out | 可见范围/操作菜单计算样式与入场捕获关键帧核对；opacity0/translateY30px至opacity1/none |
| 独立确认 .22s ease-out | 修复前离开/删除实际.3s，修复后.22s；不把原R19的确认修复回退 |
| 贴纸面板无指定入场tween | 原型仅同步hidden切换，修复共享sheet误加的.3s；当前none/0s |
| 主按钮 .96、关闭 .94 | 实际mouse down采样 Keep/Delete矩阵.96，关闭矩阵.94；在panel内部移出按钮再释放，避免误点backdrop |
| sheet切换与离场 | 取消Moments旧14px/80px嵌套transform和.25s过渡；当前panel和veil transition0s，未新增原型没有的退出效果 |
| toast2700ms | 未通过，产品仍notice/alert常驻；本轮脚本一行不动 |
| 页面/列表项效果 | 既有d5-page/d5-item仍有.25s过渡源码；未逐帧对照原型，不能声称整个页面效果全通过 |
| reduced motion | 浏览器emulate reduce后真实打开可见范围，animation none、transition0s；不据此声称所有无障碍路径通过 |

读本地原型与已提交参考，没有重做Figma静态或调用API。Impeccable context因引擎未安装/缓存不可写未运行；仓库无PRODUCT.md/DESIGN.md，本轮以任务、原型、page-states、原R20结果及现有实现为上下文，不补造设计文档。只读复核见 [review.md](r20-audit/review.md)；三个Minor证据缺口已加断言或收窄表述，无Critical/Important生产问题。


## 最终验证结果

`VITE_API_BASE_URL=/api npm run build`退出0，见 [build-final.log](r20-audit/build-final.log)。最终 `npx playwright test -c tests/r20-audit.config.ts` **4 passed (2.1m)，退出0**，见 [walkthrough-final.log](r20-audit/walkthrough-final.log)。`git diff --check`退出0。原D5/数据库测试仍未运行，不能把本专项4/4写成模块全通过。

**100张真实PNG**：375×667共50张、375×812共50张；每高度每语言25张。十二态×两高度×两语言共48张主图，其余52张为错误/边界/滚动等补充。逐张PNG签名、IHDR尺寸、chunk CRC、IDAT解压、SHA256与walkthrough一一映射通过，见 [screenshots.json](r20-audit/screenshots.json)、[evidence-verification.json](r20-audit/evidence-verification.json)、[图片索引](r20-audit/evidence-index.md)、[checks.log](r20-audit/checks.log)。验证器 [verify-evidence.py](r20-audit/verify-evidence.py)只读既有PNG/日志，不能生成图片或产品数据。

四组document均宽375、高等于viewport、scrollY=0；满六附件compose实际wheel scrollTop分别255/255/110/110，长内容列表235/193/90/48（顺序667EN/667KO/812EN/812KO）。高韩文原测试内容刚好放下，旧断言scrollTop>0失败保留在walkthrough-scroll-input.log；改成通过UI输入足量文本形成真实溢出，再验证滚动，不改产品/数据库/旧回归。贴纸grid当前内容完全放下，top=0/content=client=304，未伪称其发生滚动。

100次可见图片complete/naturalWidth检查通过，未吞掉解码失败来判通过。七类overlay Escape（options/post-visibility/delete/stickers/compose-visibility/compose-category/leave）均保留Profile和Moments页；没有声称自动焦点与Tab循环通过。边界检查包括仅空格禁发布、1000字按钮启用、1001字禁用、六附件禁用、移除后Media/Stickers重新启用。

横向copy采样clipped=[]，不能代表无纵向裁切或全翻译；Category入口hit=false、常驻notice、基线sheet底对齐和韩文漏译仍如上未通过。人工抽看667EN离开确认、667KO图片编辑、812EN删除确认及812KO发布完成，未隐藏真实媒体或错误。

最终整体与四项验收均为**未通过／待 Smith**。没有合入main，没有创建PR/Issue。提交/推送在本报告完成后执行，最终状态以实际git输出及远端SHA为准。

Codex用量（提交前快照，非最终计费；不含审批guardian与后续收尾）：root input 6,703,270，cached 6,600,448，output 27,027，total 6,730,297；reviewer total 216,148；合计 6,946,445 tokens。详见 [codex-usage.json](r20-audit/codex-usage.json)。
