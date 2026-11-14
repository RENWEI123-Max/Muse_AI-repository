# R20 客户端修复结果

基线 `origin/codex/r20-audit` / `06d02b3`；分支 `codex/r20-fixes`。在 Mac mini 的 tmux `r20-fixes` 中执行。开工核实 PID 69173 为本次 `codex exec --approve-for-me`，不是另一轮任务；未重复启动。未开 Issue、未发 Telegram、未调用 Figma API、未使用 Figma token。

**结论：客户端修复已实施，最终验证结果见下；批任务仍有未完成子项（3x 鸟素材及末尾边界清单）。这是 fixture 专项结果，不是 R06–R20 全模块验收通过。** 后端、API 实现、数据库、共享 tokens.css、App.vue 会话/token 处理和 api.ts 未改。

## 逐项结论

共校验 **219张真实PNG**（含明确标注的3张失败基线），PNG签名/全部chunk CRC/尺寸/SHA256均已检查。

截图路径以下均相对 [r20-fixes](r20-fixes/)。`H-L` 表示 `667-en`、`667-ko`、`812-en`、`812-ko` 四套；完整文件名、尺寸与 SHA256 见 [截图索引](r20-fixes/evidence-index.md)、[screenshots.json](r20-fixes/screenshots.json)。历史失败截图 `guest-red.png` 不是最终证据。

| 清单 | 改动与结论 | 真实点击验证 / 截图 |
|---|---|---|
| 1. R18/R19/R20 toast | 新增 `UiToast.vue`，复用已有 toast 色彩/字体与显示样式，2700ms 隐藏并发出 expired；ProfileFlow/MomentsFlow 撤掉常驻错误/notice 呈现。保留原英文文案；列表 Retry 独立保留，不随 toast 消失而丢失。HomeFlow 成功寄信也复用；到期清空成功消息，连续相同提示仍能出现。 | 头像 `avatar/H-L-avatar-size-toast.png`、`avatar-saved-toast.png`；卡片 `H-L-size-toast.png`、`deleted-toast.png`；动态 `moments/H-L-published-toast.png`、`deleted-toast.png`；连续寄信 `navigation/H-L-compose-second-toast.png`。断言出现与到期消失，并检查 toast 左右边界在375内。 |
| 2. R18 裁切关闭 | ProfileFlow.back 的 crop 直接关闭 sheet；archive/remove 仍回图库。保留打开前的 profile/edit 来源视图，关闭后恢复来源按钮焦点。 | 从主页头像与编辑资料 Change avatar 分别真实选文件进入裁切再关闭：`avatar/H-L-crop-close-source.png`、`crop-close-edit.png`；图库/crop Escape 同时回归。 |
| 3. R19 取消与焦点 | MomentsFlow：文件选择取消关闭类型面板；删除 Cancel/关闭/Escape 只退出确认，回卡片菜单；关闭菜单回卡片或上传按钮。渲染后恢复焦点，避免恢复到已移除 DOM。 | `H-L-upload-cancel.png`、`remove-cancel.png`；断言来源按钮 focus，删除取消后的菜单和 Remove card focus；options/preview/remove Escape 真实键盘操作。 |
| 4. R19/R20 旧错误 | sheet/screen 切换同步清空 error/notice，焦点另在 DOM 更新后处理。失败动作继续可重试。 | 卡片503→关闭→重开→无旧toast；动态发布503→离开丢弃→重开→无旧toast。`H-L-patch-failure.png`、`moments/H-L-publish-error.png`。 |
| 5. 20MB / 图片处理 | 新增 `lib/photo.ts`：`size > 20*1024*1024` 在解码/上传前拒绝；通过后解码、最长边1600、不放大小图、JPEG .88，释放对象URL。卡片直接上传处理后JPEG；头像先预处理再进入既有320×320裁切，最终裁切仍按头像原型 JPEG .85。 | 两入口真实选20MB+1文件，无上传请求；卡片另从浏览器文件选择器输入3200×2000测试图，检查上传JPEG签名和解码结果1600×1000。卡片截图为明确的纯色测试输入，不伪装用户照片；头像使用仓库 portrait-5。`H-L-size-toast.png`、`avatar/H-L-avatar-size-toast.png`；字节记录在 walkthrough JSON。 |
| 6. avatar-full | **已决定：不做大图查看。** 更新 `R18-audit-result.md` 待定项；29:15057 是8槽已满。 | 只改文档，不补代码，不新增所谓大图截图。 |
| 7. R19 大图尺寸 | `docs/ui-redo-plan.md`：327×480 笔误改309×480；cards.css 几何未改。 | 本地 Figma 11:555 与既有R19审计确认309×480；本项为文档纠错，不制造截图。 |
| 8. compose-sent | LettersFlow 成功完成1500ms飞行动画后发出 sent；HomeFlow 切收信箱并显示2700ms toast，不再进入成功确认面板。 | `navigation/H-L-compose-sent-inbox.png`；同一会话第二封不同收件人 `compose-second-toast.png`，断言列表可见、sent-scene不存在、两次toast均出现并消失。fixture 不证明真实发信权限或投递。 |
| 9. 默认鸟 / 3x | HomeFlow 默认 variant=4（Soft lilac），已有用户持久化选择不覆盖；不增180×180图片节点。**3x素材子项未完成**：本机仓库及交接源文件均只找到240×240静态鸟，未找到独立3x导出，保留现有最大素材，不插值伪造。 | `navigation/H-L-purple-default.png` 真实打开外观并断言紫款选中；240×240来源核查见末尾。不能将默认款修复写成3x素材已完成。 |
| 10. 免费收取 | InboxFlow.prepare 在服务端钱包免费额度内直接调用原 collect；保留幂等键、confirmPaid=false、服务端 confirmation-required/402 分支；402重新获取钱包并打开余额不足面板。不会弹0钻确认。 | `navigation/H-L-free-direct.png`：点击收取后fixture免费次数变0，确认框不存在。另模拟钱包读到免费后收取返回402，确认打开不足面板且可取消；`free-quota-race-shortage.png`。付费/余额不足路径仍显示确认；不代表真实扣款验收。 |
| 11. 英韩漏译 | i18n.ts 补头像保存/满槽、卡片类型/主图/可见范围/校验、动态标题/placeholder/分类/范围/删除/成功错误/Retry/aria等；MomentsFlow 动态值和属性接tr。另补星座选项/资料元数据与原生支付动态句式。分类恢复正常流，移除负margin造成的遮挡，保持容器内滚动；资料页公开范围按钮不再占整行宽，避免韩文形象照标题被挤换行。 | 四套头像/卡片/动态图与JSON文案采样；`moments/H-L-compose-translated.png`、`visibility-translated.png`、`delete-translated.png`，短屏按钮通过容器滚动到达。未把用户昵称/原信件文本翻译；未知服务端错误/真实原生支付仍属末尾未验范围。 |
| 12. R13 八处渐变 | appearance.css 依据本地 Figma fills/stops/handles补 default、列表标签、预览caption、Forest、Clouds、Lavender、Sunset、Stars。斜向线性渐变按R02逆转置方向及stop投影计算，不改tokens.css；多层radial保留中心、半径、透明度。 | `navigation/H-L-wallpaper-retry.png`、`gradient-forest/clouds/lavender/sunset/stars.png`、`gradients.png`；真实进入壁纸/预览/色板，逐个点击5种色板，并断言对应background-image含gradient。方向计算记录 [gradient-directions.json](r20-fixes/gradient-directions.json)。不是Figma逐像素验收。 |
| 13. R17 | ProfileFlow 保留stats原有id/conversationId，点击/键盘打开 `/letters/:id`；点赞移焦关闭按钮、Tab循环、底层header/body/nav inert、关闭恢复来源焦点。`R17-audit-result.md` 写明不加虚假的“本设备保存”脚注。 | `navigation/H-L-my-original-letter.png`，随后真实Escape仍留My letters；`avatar/H-L-likes-focus.png`，断言inert/focus与Escape后仍在资料页。接口是既有接口，没有新后端契约。 |

## 14. R06–R16 其他客户端小项

| 轮次 | 实施 / 边界 | 截图与验证 |
|---|---|---|
| R11 | 聊天标题与消息头像进入public-profile，并支持键盘；保留本批指定的250ms panel/message、450ms unlock现有数值，没有擅改录音/发送/权限逻辑。 | `navigation/H-L-safety-cancel-profile.png`及导航路径；另 `avatar-profile-entry.png` 为真实点击消息头像进入资料；person Escape真实回聊天。旧审计所记“原型直接重绘而无此两种动画”的冲突不借本批数值保留改判全效果通过。 |
| R12 | 搜索503结束Searching状态，Retry重跑当前query；点击结果通过已有分页消息接口找到原消息，居中并静态高亮；加载/分页503保留错误，Retry恢复同一目标；图片解码不再把定位滚回底部，发送新消息退出历史定位。备注24字符、trim，重开清理旧错误。 | `navigation/H-L-search-failure.png`、`history-load-failure.png`、`search-result-destination.png`、`search-then-send.png`；fixture目标m25在第二页，真实搜索→点击→分页503→Retry→目标→发送新消息。另真实点击覆盖备注503→取消→重开清错→重试保存并检查trim；`remark-failure.png`、`remark-retry.png`。 |
| R09 | 菜单增加清空列表确认，批量调用已有PATCH hidden=true，保留消息；通知/Enable进入现有SettingsFlow notifications，System/Interactions/Help进入既有页面，不填假活动。 | `navigation/H-L-clear-list-confirm.png`、`clear-list-hidden.png`、`notification-route.png`，另真实点击System/Interactions/Help并返回：`inbox-system/interactions/help-entry.png`。系统/互动页原本没有feed接口，仍显示未连接说明，不冒充真实通知已接通。 |
| R10 | 点击套餐直接弹确认，列真实App Store价格或Unavailable，Confirm调用原StoreKit流程；取消返回套餐。补原生取消/pending/到账/失败/待验证动态韩文；不用原型本地余额或假USD价格。 | `navigation/H-L-purchase-confirm.png`、`native-web-unavailable.png`。浏览器明确无原生购买能力，不伪造成功扣费。原生文案映射源码核对，不宣称StoreKit走查。 |
| R13 | 壁纸PNG503提示错误、Retry重新请求、失败时禁用Use this wallpaper，加载成功才恢复。 | `navigation/H-L-wallpaper-failure.png`、`wallpaper-retry.png`；真实拦截图片503后解除并点击Retry。 |
| R14 | 列表Unblock直接调用既有DELETE，不弹确认；详情确认保留。举报标题/理由/Details/Add photo等保持原型口径；**决定保留实际送交moderation的说明**，不复制“仅保存在本设备/无moderation”的虚假语义。 | `navigation/H-L-unblock-direct.png`；只验证fixture请求与列表变化，不代表真实持久化；举报仅入口与取消，不提交真实举报。 |
| R15 | 注册的验证码验证成功后直接进入首页，去掉中间session确认；验证码API、发送触发、token/account处理均未变。verify保留真实“Email verification for”口径，不加入原型演示123456/No email sent假说明。 | `auth/H-L-verify.png`、`verified-home.png`；fixture明确send返回sent:false，未发送邮件；随后verify的测试回执仅验证成功路由。verify-resend与真实邮件另列未做。 |
| R16 | 从public-profile进入举报/屏蔽时记录来源，取消/Back回public-profile；普通chat details来源维持原返回路径。 | `navigation/H-L-safety-cancel-profile.png`；public-more→Report→Back→原public-profile，同时Block→Cancel回同一资料页；随后person Escape回聊天。`safety-block-cancel-profile.png`。未更改屏蔽持久化逻辑。 |
| R06 | 外观/筛选打开时撤掉外层重复登录提示，保留面板内唯一提示，top66；标题在sheet内24–64，首行控件从88开始，使提示处于两者之间。 | `guest/H-L-appearance.png`和checks.json；真实访客Explore preview→外观，断言面板提示不与标题重叠、外层重复提示不再渲染。修复前 `guest-red.png` 与guest-red.log保留。 |

## 原型、脚本与范围说明

原型只读解包自 `~/maugo-design/MauGo.html` 的内嵌scripts。[摘录](r20-fixes/prototype-excerpts.txt)含toast2700ms、卡片20MB/1600/.88、头像20MB/320裁切/.85。Figma沿用本机 `~/maugo-figma` 与R13保存的原fills JSON，未请求网络导出。

`<script setup>` 仅以下必需改动：

- UiToast：提示定时器、到期事件、卸载清理；photo.ts：文件校验/解码/缩放/编码/URL清理。
- ProfileFlow：crop返回；上传前预处理；保留原信件ID与打开；sheet提示清理、焦点和likes Tab约束。原person与自己资料capture Escape保留；资料元数据星座接入已有tr。
- MomentsFlow：卡片独立图片处理与取消；sheet/screen清理与来源焦点；原错误/成功文字改由toast呈现；业务请求和动态附件10MB/视频30MB规则不改。
- HomeFlow/LettersFlow：默认紫款、成功寄出事件与列表toast；保留原1500ms飞行、draft/idempotency/session sent保护；LettersFlow Escape移到capture并阻止继续传播，避免我的信件关闭时误关资料页，注册/卸载参数匹配。
- InboxFlow：免费直收与原服务端确认分支；直接解除；批量隐藏菜单与既有设置页入口；扩充已有模态焦点/Escape条件。
- ChatFlow：资料入口、搜索重试/分页定位/高亮和发送后退出定位、壁纸错误重试、public安全来源返回、备注清理。发送/语音仅增加退出历史定位，不改变请求/录音数据。
- ReplyTopup：套餐确认与焦点，原StoreKit/verify/finish/账本处理不改；SettingsFlow：可选initial入口和Back；AuthFlow：仅verified成功后的目的地，不改登录或验证码业务。

没有复制原型的演示媒体、假关注、假账本或本地权限。所有fixture数据均由测试路由提供；登录、打开页面、选文件、发布、收取、重试、取消均经过真实DOM控件；无force click，无Vue状态注入。

## 最终验证

最终构建：`cd client && VITE_API_BASE_URL=/api npm run build`，退出0，资产校验343、vue-tsc、Vite通过。[build-final.log](r20-fixes/build-final.log)。

- JS：`index-DnFjgs5N.js`，SHA256 `436940e09d1aedb510e46c64d8e7fe26b9a9bf4651414aaf7985a50a77ec7079`。
- CSS：`index-CWpGRCWd.css`，SHA256 `2bb5e7fa4ae878587c4be055aec5310ba602b85aadb21d82216a423367f120cc`。
- 最终Playwright：`npx playwright test -c tests/r20-fixes.config.ts`，**24 passed (4.8m)，退出0**；375×667/812 × EN/KO，六类专项。
- [architecture.json](r20-fixes/architecture.json)：tokens.css、App.vue、api.ts与基线逐字相同；无后端改动。受影响页面CSS及新增toast的hex/!important/.device均0；不是把ChatFlow原有脚本颜色字面量说成全仓为0。
- R16 person、R17 likes、R18 gallery/crop/remove/archive Escape、R19 cards esc.stop、R20 moments-overlay esc.stop与列表Retry均有源码保护检查；浏览器回归范围以测试与最终日志为准。
- `git diff --check` 通过；新增文本/文档也扫描尾随空格，修掉计划文档原有一处尾随空格。

## 走查日志与审查

[最终走查日志](r20-fixes/walkthrough-final.log)，测试源 `client/tests/r20-fixes*.spec.ts` 和 `r20-fixes.config.ts`。24组 = 六类专项 × 两高度 × 英韩；不是24个模块验收。

早期失败保留：cards-red复现取消未关闭；cards-first因构建未设/api而fixture未拦截登录（Failed to fetch），修正构建环境；cards-second暴露渲染前焦点恢复；walkthrough-first头像脚本误写choose函数名，修脚本；smoke中点赞焦点断言曾错误期待主按钮，原型showPaymentDialog实际聚焦关闭按钮，按原型纠正；搜索Retry被输入框覆盖则修生产布局；walkthrough-second为20通过/4失败，四个失败来自访客测试匹配两个home-error的strict locator错误，随后单组实测又发现0.296875px实际重叠，留guest-red截图并修内外提示位置。walkthrough-third为22通过/2失败，短屏外层重复提示仍重叠，改为sheet打开时只保留内层提示；walkthrough-fourth为23通过/1失败，诊断测试误用了同一outputDir清掉主测试trace文件，导致结束时报ENOENT。人工复看另发现套餐确认的z-index被覆盖为40，虽然inert底层不拦点击，画面仍被遮挡；修至专用选择器80，并新增层级/视口断言。诊断的purchase-debug.png/json/log保留为失败证据，不算最终确认截图。后续定向新增原信件Escape断言在旧bundle真实复现退出整个Profile（route-escape-red.log），随后修capture与安全取消来源；为韩文标题增加单行断言，旧bundle失败记录在heading-red.log，修正相邻公开范围按钮的整行宽度；随后补免费直收402竞态的不足面板恢复。失败不累计为通过，不隐藏错误截图。

独立只读代码审查发现并修复：连续相同成功文案不再显示toast；历史分页503后无法恢复原目标；历史定位后发送新消息仍滚回旧目标。新增实际点击回归；复核未发现剩余Critical/Important，独立审查没有跑构建/浏览器，最终测试以本次日志为准。

## 提交与推送

目标 `origin/codex/r20-fixes`；交付时执行 `git push origin HEAD:codex/r20-fixes` 并以 `git ls-remote` 核对本地HEAD，实际提交与推送结果在交付消息报告。不合入main。

## 未做清单

1. **R07独立3x鸟素材未完成**：仓库 `client/src/assets/02-bird-static/female-4.png` 与 `~/maugo-handover/03-成品UI/源文件/assets/02-bird-static/female-4.png` 均240×240；本机design/figma目录未发现3x导出。不伪造180×180节点或插值文件。
2. 按任务排除后端：R09标未读；R11/R12 Follow/Pin/Mute能力；R16卡片类型/点赞、动态点赞；R14屏蔽/解除真实持久化；R15 verify-resend触发。本批没有新接口、数据库或后端修改。
3. 需要Smith在app验证：StoreKit真实产品价格/原生购买取消与pending/验签重试/到账；真实验证码/邮件、Apple、恢复密码；真实权限/扣费/屏蔽解除持久化、跨设备恢复。Mac浏览器fixture不能替代。
4. 原R06首页粒子/帽子impulse/完整开信收回动效、回应提示清整条的服务端语义；R08自由故事与真实200字Recipient ID约束；R12 waiting来源权限区分；通知/互动feed未连接；原各轮全量静态几何、Figma并排图/3x壁纸、R13额外应用按钮/托底渐变等较大遗留未纳入本批小修。没有据专项通过改判旧模块全量验收。
5. 任意未知服务端错误韩文及所有原生支付动态文案未做app走查。R19纯色测试图与R18仓库肖像是测试输入，不代表真实用户上传或数据库存储验证。
