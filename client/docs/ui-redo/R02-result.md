# R02 设计 token 验收

来源：`/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`。仅本地读取，没有调用 Figma API 或使用 token。

JSON SHA-256：`aad8e4348a7ebfaf67ed7e4dc2c37b9cf215b90a68991ff7872d208f0836ca63`。

按计划 §7 的状态节点选取 189 个画框（剔除共享组件节点，补入三个首页状态）；遍历全部后代，排除名称以 `→` 开头的原型热区，以及 375×57.828 状态栏和 144×20 底部横条容器及其后代。隐藏的设计节点仍计入，节点自身 opacity 不并入 paint alpha，避免把层级透明度误当颜色。

计数口径：颜色为匹配的可见 fill/stroke paint 数，文字色只计 TEXT fills；渐变为对应 stops 与 handles 的 fill 数；字体为 Fredoka、字重/字号/行高/字距完全匹配的文本节点数；间距为 itemSpacing 和四侧 padding 属性出现次数；圆角为 cornerRadius 节点数；效果为 visible effect 数；尺寸为 bounding box / 相对画框坐标匹配节点数。尺寸统计不等于语义控件数。

RGB 由 JSON 通道乘 255 还原 hex；alpha 约到 3 位、字距约掉 float32 尾数，角度与色标位置约到 2 位小数；尺寸保留 JSON 精确值。自动行高按任务规定写无单位 1.21，其余行高为 px。字体 token 是 `font` 简写（含字重、字号、行高、字体），必须与同名前缀的 `-letter-spacing` 一起使用。变体后缀仅展开 §3 一格里的多值；没有新增页面样式。

## 每个 token 的值、出现次数和节点证据

| token | CSS 精确值 | 出现次数 | 节点及用途 |
| --- | --- | ---: | --- |
| `--bg-page` | `#0D1713` | 419 | 节点用途：39:2308 /compose-sent · 写信 / 发送后等待；39:2311 /compose-sent · 写信 / 发送后等待/app-view；39:2373 /compose-sent · 写信 / 发送后等待/app-view/header |
| `--bg-scene` | `#090E0E` | 33 | 节点用途：35:3533 /home-ready · 首页 / 三封来信；35:3647 /home-empty · 首页 / 无符合条件的信件；35:3757 /home-response · 首页 / 回应到达 |
| `--bg-auth` | `#081017` | 20 | 节点用途：35:2414 /welcome · 欢迎 / 未登录；35:2470 /terms-unchecked · 协议 / 未勾选；35:2564 /terms-checked · 协议 / 已勾选 |
| `--bg-nav` | `#0D1812` | 61 | 节点用途：43:3334 /home-ready · 首页 / 三封来信/Main navigation；43:3367 /home-empty · 首页 / 无符合条件的信件/Main navigation；43:3400 /home-response · 首页 / 回应到达/Main navigation |
| `--bg-card` | `#1B2A20` | 46 | 节点用途：29:10301 /chat-details · 对话设置 / 已解锁/Section/Container/Container:margin/Container；29:10328 /chat-details · 对话设置 / 已解锁/Section/Container/Container:margin/Container；29:10436 /chat-details-waiting · 对话设置 / 未回复锁定/Section/Container/Container:margin/Container |
| `--bg-sheet` | `#18211E` | 37 | 节点用途：36:2012 /filters-free · 筛选 / 未开通 Pass/sheet；36:2184 /filters-active · 筛选 / Pass 生效/sheet；36:2352 /filters-selected · 筛选 / 已选择条件/sheet |
| `--bg-input` | `#202F24` | 58 | 节点用途：35:2678 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-email；35:2681 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-password；35:2733 /signin-filled · 邮箱登录 / 已填写/auth-overlay/auth-panel/div/auth-form/label/auth-email |
| `--bg-tile` | `#222D25` | 38 | 节点用途：29:8596 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 100 diamonds for 0.99 USD；29:8605 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 550 diamonds for 4.99 USD；29:8614 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 1200 diamonds for 9.99 USD |
| `--bg-chip` | `#23362A` | 30 | 节点用途：29:13686 /profile-empty · 个人页 / 尚未上传照片/Section/Header/Container/Button - My diamonds；29:13689 /profile-empty · 个人页 / 尚未上传照片/Section/Header/Container/Button；29:13844 /profile-content · 个人页 / 已有形象照/Section/Header/Container/Button - My diamonds |
| `--bg-media-btn` | `#24312A` | 55 | 节点用途：29:5854 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button/Image；29:5868 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button/Image；29:5880 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button/Image |
| `--switch-off-track` | `#35483B` | 26 | 节点用途：36:2584 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/label/motion-switch；36:2587 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/label/trail-switch；36:2767 /bird-male · 信使外观 / 男鸟/sheet/sheet-content/label/motion-switch |
| `--switch-off-thumb` | `#AFBEB3` | 26 | 节点用途：53:2014 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/label/motion-switch/Off；53:2015 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/label/trail-switch/Off；53:2016 /bird-male · 信使外观 / 男鸟/sheet/sheet-content/label/motion-switch/Off |
| `--text-primary` | `#E4EFD9` | 779 | 节点用途：35:2416 /welcome · 欢迎 / 未登录/announcement/Tap a bird to open a letter.；35:2428 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/h1/Welcome to MauGo；35:2472 /terms-unchecked · 协议 / 未勾选/announcement/Tap a bird to open a letter. |
| `--text-on-accent` | `#0A1406` | 98 | 节点用途：35:2434 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/email-signin/Continue with email；35:2541 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/div/terms-continue/Agree & continue；35:2635 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/div/terms-continue/Agree & continue |
| `--text-label` | `#BACDB2` | 61 | 节点用途：35:2677 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/Email address；35:2680 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/Password；35:2732 /signin-filled · 邮箱登录 / 已填写/auth-overlay/auth-panel/div/auth-form/label/Email address |
| `--text-hint` | `#849284` | 15 | 节点用途：35:3564 /home-ready · 首页 / 三封来信/scene-hint/Tap a bird. Open a little story.；35:3672 /home-empty · 首页 / 无符合条件的信件/scene-hint/No letters yet. Try a wider search.；35:3788 /home-response · 首页 / 回应到达/scene-hint/Tap a bird. Open a little story. |
| `--text-note` | `#728571` | 60 | 节点用途：39:2372 /compose-sent · 写信 / 发送后等待/app-view/div/p/Sample conversations · Stored on this device；29:5652 /inbox-empty · 消息 / 从未收到消息/Section/Container/Paragraph/Sample conversations · Stored on this device；29:5747 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Container/Paragraph/Sample conversations · Stored on this device |
| `--text-time` | `#8CA094` | 60 | 节点用途：39:2325 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/button/span/small/19:32；39:2327 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/button/span/small/Awaiting reply；39:2340 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/button/span/small/19:02 |
| `--text-chevron` | `#7C927C` | 156 | 节点用途：29:6819 /inbox-drawer · 消息 / 右侧菜单/Container/Dialog - Inbox tools/Container/Button/Text/›；29:6824 /inbox-drawer · 消息 / 右侧菜单/Container/Dialog - Inbox tools/Container/Button/Text/›；29:6829 /inbox-drawer · 消息 / 右侧菜单/Container/Dialog - Inbox tools/Container/Button/Text/› |
| `--text-danger` | `#D9A48E` | 2 | 节点用途：34:2026 /settings-home · 设置 / 主页面/app-view/div/logout/Sign out；39:3051 /signout-confirm · 退出登录 / 确认/app-view/div/logout/Sign out |
| `--text-danger-delete` | `#CF9E8E` | 2 | 节点用途：34:2028 /settings-home · 设置 / 主页面/app-view/div/delete-account-settings/Delete account；39:3053 /signout-confirm · 退出登录 / 确认/app-view/div/delete-account-settings/Delete account |
| `--text-diamond` | `#E6D0EF` | 44 | 节点用途：56:1957 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 100 diamonds for 0.99 USD/Pack heading/Diamond amount/100；56:1965 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 550 diamonds for 4.99 USD/Pack heading/Diamond amount/550；56:1973 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 1200 diamonds for 9.99 USD/Pack heading/Diamond amount/1,200 |
| `--accent` | `#B5FA70` | 514 | 节点用途：35:2631 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/div/label/accept-terms；35:3041 /verify-empty · 验证码 / 待输入/auth-overlay/auth-panel/div/div/✉ |
| `--sparkle` | `#E5FFB3` | 411 | 节点用途：35:3548 /home-ready · 首页 / 三封来信/scene/div/✦；35:3550 /home-ready · 首页 / 三封来信/scene/div/✦；35:3552 /home-ready · 首页 / 三封来信/scene/div/✦ |
| `--icon-muted` | `#849288` | 691 | 节点用途：I43:3334;43:1929 /home-ready · 首页 / 三封来信/Main navigation/inbox/h2d-svg-use-0/Group/Group/Vector；I43:3334;43:1931 /home-ready · 首页 / 三封来信/Main navigation/inbox/h2d-svg-use-0/Group/Group/Group/Vector；I43:3334;43:1932 /home-ready · 首页 / 三封来信/Main navigation/inbox/h2d-svg-use-0/Group/Group/Group/Vector |
| `--icon-ink` | `#080D0A` | 283 | 节点用途：I43:3334;43:1918 /home-ready · 首页 / 三封来信/Main navigation/home/h2d-svg-use-0/Group/Group/Vector；I43:3334;43:1919 /home-ready · 首页 / 三封来信/Main navigation/home/h2d-svg-use-0/Group/Group/Vector；I43:3334;43:1922 /home-ready · 首页 / 三封来信/Main navigation/home/h2d-svg-use-0/Group/Group/Group/Vector |
| `--bg-auth-overlay` | `rgb(12 22 18 / 0.92)` | 18 | 节点用途：35:2473 /terms-unchecked · 协议 / 未勾选/auth-overlay；35:2567 /terms-checked · 协议 / 已勾选/auth-overlay；35:2661 /signin-empty · 邮箱登录 / 空表单/auth-overlay |
| `--scrim` | `rgb(0 0 0 / 0.467)` | 21 | 节点用途：29:7175 /inbox-options · 会话 / 更多操作/Text；29:8571 /reply-topup · 回信 / 进入钻石补充/Text；29:10658 /chat-remark · 对话设置 / 备注名/Text |
| `--scrim-dialog` | `rgb(3 8 5 / 0.79)` | 19 | 节点用途：29:7922 /reply-payment · 回信 / 10 次用完，付费确认/Container；29:8098 /reply-shortage · 回信 / 钻石不足/Container；29:11069 /chat-clear-confirm · 聊天记录 / 清空确认/Container |
| `--grabber` | `rgb(255 255 255 / 0.157)` | 37 | 节点用途：36:2013 /filters-free · 筛选 / 未开通 Pass/sheet/div；36:2185 /filters-active · 筛选 / Pass 生效/sheet/div；36:2353 /filters-selected · 筛选 / 已选择条件/sheet/div |
| `--hairline-card` | `rgb(255 255 255 / 0.01)` | 6 | 节点用途：34:1922 /settings-home · 设置 / 主页面/app-view/div/div；34:1958 /settings-home · 设置 / 主页面/app-view/div/div；34:1986 /settings-home · 设置 / 主页面/app-view/div/div |
| `--hairline` | `rgb(255 255 255 / 0.027)` | 206 | 节点用途：29:5631 /inbox-empty · 消息 / 从未收到消息/Section/Header；29:5719 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Header；29:5814 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Header |
| `--hairline-strong` | `rgb(255 255 255 / 0.043)` | 130 | 节点用途：35:2678 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-email；35:2681 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-password；35:2733 /signin-filled · 邮箱登录 / 已填写/auth-overlay/auth-panel/div/auth-form/label/auth-email |
| `--stroke-accent` | `1px solid #B5FA70` | 26 | 节点用途：35:3407 /apple-private · Apple / 隐藏邮箱/auth-overlay/auth-panel/div/div/apple-hide；35:3462 /apple-share · Apple / 共享邮箱/auth-overlay/auth-panel/div/div/apple-share；36:2535 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/appearance-genders/Choose female bird |
| `--stroke-accent-subtle` | `1px solid rgb(181 250 112 / 0.23)` | 23 | 节点用途：29:6864 /inbox-drawer · 消息 / 右侧菜单/Container/Dialog - Inbox tools/Container/Container/Button；29:7374 /inbox-hidden · 隐藏会话 / 有记录/Section/Container/Container/Button；29:10298 /chat-details · 对话设置 / 已解锁/Section/Container/Container/Container/Button |
| `--text-conversation-preview` | `#86978C` | 58 | 节点用途：39:2322 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/button/span/span/Today I found a quiet little bookshop.；39:2337 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/button/span/span/Thank you for listening. Today feels a little lighter.；39:2352 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/button/span/span/Some songs feel like little letters. What have you been listening to? |
| `--text-conversation-options` | `#788F80` | 58 | 节点用途：39:2329 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/Conversation options · Your sent letter/•••；39:2344 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/Conversation options · A cup of tea/•••；39:2357 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/Conversation options · Ocean in my headphones/••• |
| `--text-profile-stat` | `#F1F4ED` | 45 | 节点用途：29:13719 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/0；29:13722 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/0；29:13725 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/0 |
| `--text-profile-stat-label` | `#93AA8A` | 45 | 节点用途：29:13720 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/Following；29:13723 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/Followers；29:13726 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/Likes |
| `--text-diamond-pack-description` | `#B6C6A5` | 44 | 节点用途：56:1959 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 100 diamonds for 0.99 USD/A little boost；56:1967 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 550 diamonds for 4.99 USD/Most popular；56:1975 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 1200 diamonds for 9.99 USD/More possibilities |
| `--text-legal-heading` | `#C1DBB0` | 43 | 节点用途：35:2492 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/Terms of Use and EULA/article/h2/1. About this agreement；35:2496 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/Terms of Use and EULA/article/h2/2. Your account；35:2500 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/Terms of Use and EULA/article/h2/3. Permission to use MauGo |
| `--text-auth-navigation` | `#B8CCB0` | 40 | 节点用途：35:2421 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/auth-back/‹；35:2425 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/auth-language/한국어；35:2477 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/auth-back/‹ |
| `--text-profile-count` | `#91A48A` | 40 | 节点用途：29:13763 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Button/Small/0；29:13927 /profile-content · 个人页 / 已有形象照/Section/Container/Container/Button/Small/1；29:14293 /avatar-gallery · 头像 / 已上传与空槽位/Section/Container/Container/Button/Small/0 |
| `--text-chat-tool` | `#9EB994` | 36 | 节点用途：29:8911 /chat-open · 对话 / 已回复，可继续交流/Section/Container/Form/Container/Button/Hold to talk；29:9033 /chat-draft · 对话 / 正在编辑/Section/Container/Form/Container/Button/Hold to talk；29:9161 /chat-sent · 对话 / 消息已发送/Section/Container/Form/Container/Button/Hold to talk |
| `--text-legal-body` | `#AFC2A5` | 33 | 节点用途：35:2494 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/Terms of Use and EULA/article/p/MauGo provides a space to share letters, messages and moments. These Terms of Use and End User License Agreement govern your use of MauGo. You must be at least 18 and legally able to accept these terms. If you do not agree, do not register, sign in or use account features.；35:2498 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/Terms of Use and EULA/article/p/Use accurate information, keep your sign-in details secure and do not impersonate others or share access without permission. You are responsible for activity you authorize. Email and Apple are supported sign-in methods in the intended app; this preview only demonstrates their screens.；35:2502 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/Terms of Use and EULA/article/p/MauGo grants a personal, limited, non-exclusive and non-transferable license to use the app under these terms and applicable store rules. Do not resell, unlawfully copy, bypass security, disrupt the service or reverse engineer it except where law permits. MauGo retains rights in its app and brand. |
| `--text-sheet-close` | `#8E9696` | 37 | 节点用途：36:2018 /filters-free · 筛选 / 未开通 Pass/sheet/div/close-sheet/×；36:2190 /filters-active · 筛选 / Pass 生效/sheet/div/close-sheet/×；36:2358 /filters-selected · 筛选 / 已选择条件/sheet/div/close-sheet/× |
| `--text-profile-wallet` | `#B2DA9C` | 30 | 节点用途：29:13688 /profile-empty · 个人页 / 尚未上传照片/Section/Header/Container/Button - My diamonds/0；29:13690 /profile-empty · 个人页 / 尚未上传照片/Section/Header/Container/Button/Filter Pass；29:13846 /profile-content · 个人页 / 已有形象照/Section/Header/Container/Button - My diamonds/0 |
| `--text-profile-bio` | `#8BA381` | 30 | 节点用途：29:13713 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Paragraph/24 · Libra · Shanghai；29:13715 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Paragraph/Collecting little stories along the way.；29:13871 /profile-content · 个人页 / 已有形象照/Section/Container/Container/Paragraph/24 · Libra · Shanghai |
| `--text-profile-visitors` | `#A8B89A` | 30 | 节点用途：29:13733 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Button/Visitors；29:13735 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Button/Text/›；29:13891 /profile-content · 个人页 / 已有形象照/Section/Container/Container/Button/Visitors |
| `--text-profile-visibility` | `#859D80` | 30 | 节点用途：29:13741 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Section/Container/Button/Everyone；29:13747 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Section/Container/Button/›；29:13899 /profile-content · 个人页 / 已有形象照/Section/Container/Section/Container/Button/Everyone |
| `--text-profile-menu` | `#9FB593` | 30 | 节点用途：29:13761 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Button/Text/My letters；29:13768 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Button/Text/My bird appearance；29:13925 /profile-content · 个人页 / 已有形象照/Section/Container/Container/Button/Text/My letters |
| `--grad-primary` | `linear-gradient(to right, #BDFF81 0%, #B0FB61 100%)` | 62 | 渐变 handle=[{"x": 0.0, "y": 0.5}, {"x": 1.0, "y": 0.5}, {"x": 0.0, "y": 1.0}]；35:2433 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/email-signin；35:2540 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/div/terms-continue；35:2634 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/div/terms-continue |
| `--grad-primary-diagonal-w327` | `linear-gradient(162.53deg, #BDFF81 8.49%, #B0FB61 91.51%)` | 16 | 节点尺寸 327×48；归一化角度 115°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 6.534001562030767e-09, "y": 0.2668461526004954}, {"x": 1.0000000222642116, "y": 0.7331538245457078}, {"x": -0.4663076654112108, "y": 1.2668461683307055}]；29:11369 /wallpaper-preview · 背景 / 大图预览/Section/Container/Container/Button；29:11608 /wallpaper-colors · 背景 / 纯色选择/Section/Container/Container/Button；29:12085 /report-empty · 举报 / 原因表单/Section/Container/Container/Button |
| `--grad-primary-diagonal-w277` | `linear-gradient(159.61deg, #BDFF81 8.49%, #B0FB61 91.51%)` | 7 | 节点尺寸 277×48；归一化角度 115°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 6.534001562030767e-09, "y": 0.2668461526004954}, {"x": 1.0000000222642116, "y": 0.7331538245457078}, {"x": -0.4663076654112108, "y": 1.2668461683307055}]；29:7947 /reply-payment · 回信 / 10 次用完，付费确认/Container/Dialog/Container/Button:margin/Button；29:8118 /reply-shortage · 回信 / 钻石不足/Container/Dialog/Container/Button:margin/Button；29:12466 /block-confirm · 屏蔽 / 二次确认/Container/Dialog/Container/Button:margin/Button |
| `--grad-primary-diagonal-w143-5` | `linear-gradient(144.35deg, #BDFF81 8.49%, #B0FB61 91.51%)` | 6 | 节点尺寸 143.5×48；归一化角度 115°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 6.534001562030767e-09, "y": 0.2668461526004954}, {"x": 1.0000000222642116, "y": 0.7331538245457078}, {"x": -0.4663076654112108, "y": 1.2668461683307055}]；29:12981 /person-profile · 用户资料 / 内容完整/Section/Container/Container/Button；29:13088 /person-waiting · 用户资料 / 尚未回复/Section/Container/Container/Button；29:13212 /person-followed · 用户资料 / 已关注/Section/Container/Container/Button |
| `--grad-primary-diagonal-w309` | `linear-gradient(161.58deg, #BDFF81 8.49%, #B0FB61 91.51%)` | 6 | 节点尺寸 309×48；归一化角度 115°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 6.534001562030767e-09, "y": 0.2668461526004954}, {"x": 1.0000000222642116, "y": 0.7331538245457078}, {"x": -0.4663076654112108, "y": 1.2668461683307055}]；29:10672 /chat-remark · 对话设置 / 备注名/Dialog/Container/Container/Button；29:14405 /avatar-gallery · 头像 / 已上传与空槽位/Dialog/Container/Container/Button；29:14631 /avatar-remove · 头像 / 移除确认/Dialog/Container/Container/Button |
| `--grad-primary-diagonal-w165` | `linear-gradient(148.04deg, #BDFF81 8.49%, #B0FB61 91.51%)` | 1 | 节点尺寸 165×48；归一化角度 115°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 6.534001562030767e-09, "y": 0.2668461526004954}, {"x": 1.0000000222642116, "y": 0.7331538245457078}, {"x": -0.4663076654112108, "y": 1.2668461683307055}]；29:12262 /report-saved · 举报 / 保存结果/Container/Button |
| `--grad-icon-btn` | `linear-gradient(135deg, #1B2121 0%, #131818 100%)` | 228 | 节点尺寸 44×44；归一化角度 135°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 0.0, "y": 0.0}, {"x": 1.0, "y": 1.0}, {"x": -1.0, "y": 1.0}]；29:5620 /inbox-empty · 消息 / 从未收到消息/Header/Container/Button - Bird appearance；29:5625 /inbox-empty · 消息 / 从未收到消息/Header/Container/Button - Find your letters；29:5708 /inbox-waiting · 消息 / 已寄出，尚无回信/Header/Container/Button - Bird appearance |
| `--grad-icon-btn-horizontal` | `linear-gradient(to right, #1B2121 0%, #131818 100%)` | 46 | 渐变 handle=[{"x": 0.0, "y": 0.5}, {"x": 1.0, "y": 0.5}, {"x": 0.0, "y": 1.0}]；35:3621 /home-ready · 首页 / 三封来信/header/div/magic；35:3626 /home-ready · 首页 / 三封来信/header/div/settings；35:3731 /home-empty · 首页 / 无符合条件的信件/header/div/magic |
| `--grad-secondary` | `linear-gradient(to right, #1C2223 0%, #171D1E 100%)` | 17 | 渐变 handle=[{"x": 0.0, "y": 0.5}, {"x": 1.0, "y": 0.5}, {"x": 0.0, "y": 1.0}]；35:3568 /home-ready · 首页 / 三封来信/actions/refresh；35:3678 /home-empty · 首页 / 无符合条件的信件/actions/refresh；35:3806 /home-response · 首页 / 回应到达/actions/refresh |
| `--grad-secondary-diagonal` | `linear-gradient(151deg, #1C2223 7.74%, #171D1E 92.26%)` | 1 | 节点尺寸 150×48；归一化角度 120°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 1.1566712143640245e-08, "y": 0.21132485739622453}, {"x": 1.0000000205408277, "y": 0.7886751214046419}, {"x": -0.5773502524417053, "y": 1.2113248663703402}]；29:12256 /report-saved · 举报 / 保存结果/Container/Button |
| `--grad-card` | `linear-gradient(to right, #253229 0%, #17321C 100%)` | 9 | 渐变 handle=[{"x": 0.0, "y": 0.5}, {"x": 1.0, "y": 0.5}, {"x": 0.0, "y": 1.0}]；35:2397 /cache-confirm · 缓存 / 清理确认/payment-overlay/payment-dialog；39:2849 /pin-locked · 应用锁 / 输入 PIN/payment-overlay/payment-dialog；39:2929 /pin-wrong · 应用锁 / PIN 错误/payment-overlay/payment-dialog |
| `--grad-card-diagonal-h238` | `linear-gradient(153deg, #253229 6.17%, #17321C 93.83%)` | 3 | 节点尺寸 327×238；归一化角度 145°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 0.1498962351829276, "y": -1.5345269499533742e-10}, {"x": 0.8501037648170722, "y": 1.0000000001534528}, {"x": -0.8501037651239778, "y": 0.7002075294806919}]；29:12881 /unblock-confirm · 解除屏蔽 / 确认/Container/Dialog；11:1130 /card-remove · 已上传照片 / 移除确认/Container/Dialog；29:17743 /moment-delete · 动态 / 删除确认/Container/Dialog |
| `--grad-card-diagonal-h258` | `linear-gradient(151.08deg, #253229 6.17%, #17321C 93.83%)` | 3 | 节点尺寸 327×258；归一化角度 145°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 0.1498962351829276, "y": -1.5345269499533742e-10}, {"x": 0.8501037648170722, "y": 1.0000000001534528}, {"x": -0.8501037651239778, "y": 0.7002075294806919}]；29:11070 /chat-clear-confirm · 聊天记录 / 清空确认/Container/Dialog；29:12459 /block-confirm · 屏蔽 / 二次确认/Container/Dialog；29:14636 /avatar-remove · 头像 / 移除确认/Container/Dialog |
| `--grad-card-diagonal-h294` | `linear-gradient(147.81deg, #253229 6.17%, #17321C 93.83%)` | 1 | 节点尺寸 327×294；归一化角度 145°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 0.1498962351829276, "y": -1.5345269499533742e-10}, {"x": 0.8501037648170722, "y": 1.0000000001534528}, {"x": -0.8501037651239778, "y": 0.7002075294806919}]；29:15619 /profile-likes · 个人页 / 获赞汇总/Container/Dialog |
| `--grad-card-diagonal-h322` | `linear-gradient(145.41deg, #253229 6.17%, #17321C 93.83%)` | 1 | 节点尺寸 327×322；归一化角度 145°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 0.1498962351829276, "y": -1.5345269499533742e-10}, {"x": 0.8501037648170722, "y": 1.0000000001534528}, {"x": -0.8501037651239778, "y": 0.7002075294806919}]；29:17466 /moment-leave · 发布动态 / 离开前保留草稿/Container/Dialog |
| `--grad-card-diagonal-h341` | `linear-gradient(143.86deg, #253229 6.17%, #17321C 93.83%)` | 1 | 节点尺寸 327×341；归一化角度 145°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 0.1498962351829276, "y": -1.5345269499533742e-10}, {"x": 0.8501037648170722, "y": 1.0000000001534528}, {"x": -0.8501037651239778, "y": 0.7002075294806919}]；29:8099 /reply-shortage · 回信 / 钻石不足/Container/Dialog |
| `--grad-card-diagonal-h391-5` | `linear-gradient(140.03deg, #253229 6.17%, #17321C 93.83%)` | 1 | 节点尺寸 327×391.5；归一化角度 145°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；渐变 handle=[{"x": 0.1498962351829276, "y": -1.5345269499533742e-10}, {"x": 0.8501037648170722, "y": 1.0000000001534528}, {"x": -0.8501037651239778, "y": 0.7002075294806919}]；29:7923 /reply-payment · 回信 / 10 次用完，付费确认/Container/Dialog |
| `--bg-scene-glow` | `radial-gradient(ellipse closest-side at 50% 50%, rgb(16 32 23 / 0.4) 0%, rgb(0 0 0 / 0) 100%)` | 23 | 渐变 handle=[{"x": 0.5, "y": 0.5}, {"x": 1.0, "y": 0.5}, {"x": 0.5, "y": 1.0}]；35:3533 /home-ready · 首页 / 三封来信；35:3647 /home-empty · 首页 / 无符合条件的信件；35:3757 /home-response · 首页 / 回应到达 |
| `--font-button` | `600 16px/22px "Fredoka"` | 154 | 文字：Continue with email、Continue with Apple、Agree & continue、Sign in；35:2434 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/email-signin/Continue with email；35:2438 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/apple-signin/Continue with Apple；35:2541 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/div/terms-continue/Agree & continue |
| `--font-button-letter-spacing` | `0px` | 154 | 文字：Continue with email、Continue with Apple、Agree & continue、Sign in；35:2434 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/email-signin/Continue with email；35:2438 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/apple-signin/Continue with Apple；35:2541 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/div/terms-continue/Agree & continue |
| `--font-h1` | `500 24px/32px "Fredoka"` | 18 | 文字：Before you continue、Welcome back；35:2484 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/h1/Before you continue；35:2578 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/h1/Before you continue；35:2672 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/h1/Welcome back |
| `--font-h1-letter-spacing` | `-0.3px` | 18 | 文字：Before you continue、Welcome back；35:2484 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/h1/Before you continue；35:2578 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/h1/Before you continue；35:2672 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/h1/Welcome back |
| `--font-title-page` | `550 17px/24px "Fredoka"` | 58 | 文字：Hidden conversations、Your sent letter、Chat details；29:7365 /inbox-hidden · 隐藏会话 / 有记录/Section/Header/Heading 1/Hidden conversations；29:7451 /inbox-hidden-empty · 隐藏会话 / 空状态/Section/Header/Heading 1/Hidden conversations；29:8678 /chat-waiting · 对话 / 等待对方回复/Section/Header/Heading 1/Your sent letter |
| `--font-title-page-letter-spacing` | `-0.3px` | 58 | 文字：Hidden conversations、Your sent letter、Chat details；29:7365 /inbox-hidden · 隐藏会话 / 有记录/Section/Header/Heading 1/Hidden conversations；29:7451 /inbox-hidden-empty · 隐藏会话 / 空状态/Section/Header/Heading 1/Hidden conversations；29:8678 /chat-waiting · 对话 / 等待对方回复/Section/Header/Heading 1/Your sent letter |
| `--font-title-page-medium` | `500 17px/24px "Fredoka"` | 31 | 文字：Inbox、Settings、Language、언어、Privacy；39:2375 /compose-sent · 写信 / 发送后等待/app-view/header/h1/Inbox；34:2035 /settings-home · 设置 / 主页面/app-view/header/h1/Settings；34:2075 /language-en · 语言 / English/app-view/header/h1/Language |
| `--font-title-page-medium-letter-spacing` | `-0.3px` | 31 | 文字：Inbox、Settings、Language、언어、Privacy；39:2375 /compose-sent · 写信 / 发送后等待/app-view/header/h1/Inbox；34:2035 /settings-home · 设置 / 主页面/app-view/header/h1/Settings；34:2075 /language-en · 语言 / English/app-view/header/h1/Language |
| `--font-title-sheet` | `550 18px/1.21 "Fredoka"` | 60 | 文字：Passing breeze、0；29:13709 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Button - Edit profile/Bold Text/Passing breeze；29:13719 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/0；29:13722 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/0 |
| `--font-title-sheet-letter-spacing` | `0px` | 60 | 文字：Passing breeze、0；29:13709 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Button - Edit profile/Bold Text/Passing breeze；29:13719 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/0；29:13722 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/0 |
| `--font-title-sheet-fixed` | `550 18px/24px "Fredoka"` | 21 | 文字：Conversation options、Diamonds、Remark name、Report or block、Photo；29:7181 /inbox-options · 会话 / 更多操作/Dialog/Container/Heading 2/Conversation options；29:8577 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Heading 2/Diamonds；29:10664 /chat-remark · 对话设置 / 备注名/Dialog/Container/Heading 2/Remark name |
| `--font-title-sheet-fixed-letter-spacing` | `-0.3px` | 21 | 文字：Conversation options、Diamonds、Remark name、Report or block、Photo；29:7181 /inbox-options · 会话 / 更多操作/Dialog/Container/Heading 2/Conversation options；29:8577 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Heading 2/Diamonds；29:10664 /chat-remark · 对话设置 / 备注名/Dialog/Container/Heading 2/Remark name |
| `--font-title-card` | `550 15px/21px "Fredoka"` | 54 | 文字：Your sent letter 、A cup of tea 、Ocean in my headphones 、Seaside moments 、Window-side friend ；29:5738 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Container/Container/Container/Button/Text/Bold Text/Your sent letter；29:5857 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button/Text/Bold Text/A cup of tea；29:5871 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button/Text/Bold Text/Ocean in my headphones |
| `--font-title-card-letter-spacing` | `0px` | 54 | 文字：Your sent letter 、A cup of tea 、Ocean in my headphones 、Seaside moments 、Window-side friend ；29:5738 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Container/Container/Container/Button/Text/Bold Text/Your sent letter；29:5857 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button/Text/Bold Text/A cup of tea；29:5871 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button/Text/Bold Text/Ocean in my headphones |
| `--font-body` | `400 13px/20px "Fredoka"` | 283 | 文字：you@example.com、Enter your password、reader@example.com、invalid、Choose a nickname；53:1956 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-email/Placeholder；53:1957 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-password/Placeholder；53:1958 /signin-filled · 邮箱登录 / 已填写/auth-overlay/auth-panel/div/auth-form/label/auth-email/Field value |
| `--font-body-letter-spacing` | `0px` | 283 | 文字：you@example.com、Enter your password、reader@example.com、invalid、Choose a nickname；53:1956 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-email/Placeholder；53:1957 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-password/Placeholder；53:1958 /signin-filled · 邮箱登录 / 已填写/auth-overlay/auth-panel/div/auth-form/label/auth-email/Field value |
| `--font-body-sm` | `400 12px/20px "Fredoka"` | 121 | 文字：I have read and agree to the Terms of Use and EULA.、Email address、Password；35:2539 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/div/label/span/I have read and agree to the Terms of Use and EULA.；35:2633 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/div/label/span/I have read and agree to the Terms of Use and EULA.；35:2677 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/Email address |
| `--font-body-sm-letter-spacing` | `0px` | 121 | 文字：I have read and agree to the Terms of Use and EULA.、Email address、Password；35:2539 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/div/label/span/I have read and agree to the Terms of Use and EULA.；35:2633 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/div/label/span/I have read and agree to the Terms of Use and EULA.；35:2677 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/Email address |
| `--font-body-sm-18` | `400 12px/18px "Fredoka"` | 80 | 文字：Thank you for sharing your little story.、Today I found a quiet little bookshop.、Thank you for listening. Today feels a little lighter.、Some songs feel like little letters. What have you been listening to?；36:3352 /letter-waiting · 来信详情 / 已回应，等待回信/note-panel/conversation/reply-history/div/span/Thank you for sharing your little story.；36:3484 /letter-replied · 来信详情 / 已收到回复/note-panel/conversation/reply-history/div/span/Thank you for sharing your little story.；39:2322 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/button/span/span/Today I found a quiet little bookshop. |
| `--font-body-sm-18-letter-spacing` | `0px` | 80 | 文字：Thank you for sharing your little story.、Today I found a quiet little bookshop.、Thank you for listening. Today feels a little lighter.、Some songs feel like little letters. What have you been listening to?；36:3352 /letter-waiting · 来信详情 / 已回应，等待回信/note-panel/conversation/reply-history/div/span/Thank you for sharing your little story.；36:3484 /letter-replied · 来信详情 / 已收到回复/note-panel/conversation/reply-history/div/span/Thank you for sharing your little story.；39:2322 /compose-sent · 写信 / 发送后等待/app-view/div/chat-list/div/button/span/span/Today I found a quiet little bookshop. |
| `--font-body-sm-21` | `400 12px/21px "Fredoka"` | 79 | 文字：Read everyday stories. Share your own.、Read the terms before registering or signing in.、MauGo provides a space to share letters, messages and moments. These T、Use accurate information, keep your sign-in details secure and do not 、MauGo grants a personal, limited, non-exclusive and non-transferable l；35:2432 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p/Read everyday stories. Share your own.；35:2486 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/p/Read the terms before registering or signing in.；35:2494 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/Terms of Use and EULA/article/p/MauGo provides a space to share letters, messages and moments. These Terms of Use and End User License Agreement govern your use of MauGo. You must be at least 18 and legally able to accept these terms. If you do not agree, do not register, sign in or use account features. |
| `--font-body-sm-21-letter-spacing` | `0px` | 79 | 文字：Read everyday stories. Share your own.、Read the terms before registering or signing in.、MauGo provides a space to share letters, messages and moments. These T、Use accurate information, keep your sign-in details secure and do not 、MauGo grants a personal, limited, non-exclusive and non-transferable l；35:2432 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p/Read everyday stories. Share your own.；35:2486 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/p/Read the terms before registering or signing in.；35:2494 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/Terms of Use and EULA/article/p/MauGo provides a space to share letters, messages and moments. These Terms of Use and End User License Agreement govern your use of MauGo. You must be at least 18 and legally able to accept these terms. If you do not agree, do not register, sign in or use account features. |
| `--font-caption` | `400 11px/1.21 "Fredoka"` | 179 | 文字：한국어、Show password；35:2425 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/auth-language/한국어；35:2481 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/auth-language/한국어；35:2575 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/auth-language/한국어 |
| `--font-caption-letter-spacing` | `0px` | 179 | 文字：한국어、Show password；35:2425 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/auth-language/한국어；35:2481 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/auth-language/한국어；35:2575 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/auth-language/한국어 |
| `--font-caption-20` | `400 11px/20px "Fredoka"` | 42 | 文字：Choose a day pass to unlock age and city filters.、Filter Pass active until Oct 20、My letters、My bird appearance；36:2066 /filters-free · 筛选 / 未开通 Pass/sheet/sheet-content/filter-pass-status/Choose a day pass to unlock age and city filters.；36:2236 /filters-active · 筛选 / Pass 生效/sheet/sheet-content/filter-pass-status/Filter Pass active until Oct 20；36:2404 /filters-selected · 筛选 / 已选择条件/sheet/sheet-content/filter-pass-status/Filter Pass active until Oct 20 |
| `--font-caption-20-letter-spacing` | `0px` | 42 | 文字：Choose a day pass to unlock age and city filters.、Filter Pass active until Oct 20、My letters、My bird appearance；36:2066 /filters-free · 筛选 / 未开通 Pass/sheet/sheet-content/filter-pass-status/Choose a day pass to unlock age and city filters.；36:2236 /filters-active · 筛选 / Pass 生效/sheet/sheet-content/filter-pass-status/Filter Pass active until Oct 20；36:2404 /filters-selected · 筛选 / 已选择条件/sheet/sheet-content/filter-pass-status/Filter Pass active until Oct 20 |
| `--font-caption-21` | `400 11px/21px "Fredoka"` | 42 | 文字：Every connection starts with a little hello.、Woman · 24 · Seoul；29:5650 /inbox-empty · 消息 / 从未收到消息/Section/Container/Container/Container/Paragraph/Every connection starts with a little hello.；29:6538 /inbox-friends-empty · 好友 / 空状态/Section/Container/Container/Container/Paragraph/Every connection starts with a little hello.；29:7016 /inbox-search-empty · 消息 / 搜索无结果/Section/Container/Container/Container/Paragraph/Every connection starts with a little hello. |
| `--font-caption-21-letter-spacing` | `0px` | 42 | 文字：Every connection starts with a little hello.、Woman · 24 · Seoul；29:5650 /inbox-empty · 消息 / 从未收到消息/Section/Container/Container/Container/Paragraph/Every connection starts with a little hello.；29:6538 /inbox-friends-empty · 好友 / 空状态/Section/Container/Container/Container/Paragraph/Every connection starts with a little hello.；29:7016 /inbox-search-empty · 消息 / 搜索无结果/Section/Container/Container/Container/Paragraph/Every connection starts with a little hello. |
| `--font-caption-18` | `400 11px/18px "Fredoka"` | 28 | 文字：Tell us about inappropriate content、Stop contact from this person；36:3642 /letter-safety · 来信详情 / 举报或屏蔽/sheet/sheet-content/div/safety-report/small/Tell us about inappropriate content；36:3649 /letter-safety · 来信详情 / 举报或屏蔽/sheet/sheet-content/div/safety-block/small/Stop contact from this person；29:12015 /safety-choice · 安全操作 / 举报或屏蔽/Dialog/Container/Container/Button/Small/Tell us about inappropriate content |
| `--font-caption-18-letter-spacing` | `0px` | 28 | 文字：Tell us about inappropriate content、Stop contact from this person；36:3642 /letter-safety · 来信详情 / 举报或屏蔽/sheet/sheet-content/div/safety-report/small/Tell us about inappropriate content；36:3649 /letter-safety · 来信详情 / 举报或屏蔽/sheet/sheet-content/div/safety-block/small/Stop contact from this person；29:12015 /safety-choice · 安全操作 / 举报或屏蔽/Dialog/Container/Container/Button/Small/Tell us about inappropriate content |
| `--font-hint` | `400 11px/16px "Fredoka"` | 15 | 文字：Tap a bird. Open a little story.、No letters yet. Try a wider search.；35:3564 /home-ready · 首页 / 三封来信/scene-hint/Tap a bird. Open a little story.；35:3672 /home-empty · 首页 / 无符合条件的信件/scene-hint/No letters yet. Try a wider search.；35:3788 /home-response · 首页 / 回应到达/scene-hint/Tap a bird. Open a little story. |
| `--font-hint-letter-spacing` | `0.4px` | 15 | 文字：Tap a bird. Open a little story.、No letters yet. Try a wider search.；35:3564 /home-ready · 首页 / 三封来信/scene-hint/Tap a bird. Open a little story.；35:3672 /home-empty · 首页 / 无符合条件的信件/scene-hint/No letters yet. Try a wider search.；35:3788 /home-response · 首页 / 回应到达/scene-hint/Tap a bird. Open a little story. |
| `--font-micro` | `400 10px/1.21 "Fredoka"` | 181 | 文字： · 、Flight preview、Replay；35:2447 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p/span/·；36:2579 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/div/span/Flight preview；36:2581 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/div/preview-flight/Replay |
| `--font-micro-letter-spacing` | `0px` | 181 | 文字： · 、Flight preview、Replay；35:2447 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p/span/·；36:2579 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/div/span/Flight preview；36:2581 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/div/preview-flight/Replay |
| `--font-micro-17` | `400 10px/17px "Fredoka"` | 73 | 文字：At least 8 characters, with a letter and a number.；35:2861 /signup-empty · 注册 / 空表单/auth-overlay/auth-panel/div/auth-form/p/At least 8 characters, with a letter and a number.；35:2927 /signup-filled · 注册 / 已填写/auth-overlay/auth-panel/div/auth-form/p/At least 8 characters, with a letter and a number.；35:2993 /signup-mismatch · 注册 / 密码不一致/auth-overlay/auth-panel/div/auth-form/p/At least 8 characters, with a letter and a number. |
| `--font-micro-17-letter-spacing` | `0px` | 73 | 文字：At least 8 characters, with a letter and a number.；35:2861 /signup-empty · 注册 / 空表单/auth-overlay/auth-panel/div/auth-form/p/At least 8 characters, with a letter and a number.；35:2927 /signup-filled · 注册 / 已填写/auth-overlay/auth-panel/div/auth-form/p/At least 8 characters, with a letter and a number.；35:2993 /signup-mismatch · 注册 / 密码不一致/auth-overlay/auth-panel/div/auth-form/p/At least 8 characters, with a letter and a number. |
| `--font-micro-13` | `400 10px/13px "Fredoka"` | 40 | 文字：Starter pack、A little boost、+10% bonus、Most popular、+20% bonus；56:1958 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 100 diamonds for 0.99 USD/Pack heading/Starter pack；56:1959 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 100 diamonds for 0.99 USD/A little boost；56:1966 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 550 diamonds for 4.99 USD/Pack heading/+10% bonus |
| `--font-micro-13-letter-spacing` | `0px` | 40 | 文字：Starter pack、A little boost、+10% bonus、Most popular、+20% bonus；56:1958 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 100 diamonds for 0.99 USD/Pack heading/Starter pack；56:1959 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 100 diamonds for 0.99 USD/A little boost；56:1966 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 550 diamonds for 4.99 USD/Pack heading/+10% bonus |
| `--font-micro-16` | `400 10px/16px "Fredoka"` | 31 | 文字：0、 / 200、76、28；39:2034 /compose-empty · 写信 / 空白/composer-panel/div/letter-count/0；39:2035 /compose-empty · 写信 / 空白/composer-panel/div// 200；39:2157 /compose-draft · 写信 / 已填写/composer-panel/div/letter-count/76 |
| `--font-micro-16-letter-spacing` | `0px` | 31 | 文字：0、 / 200、76、28；39:2034 /compose-empty · 写信 / 空白/composer-panel/div/letter-count/0；39:2035 /compose-empty · 写信 / 空白/composer-panel/div// 200；39:2157 /compose-draft · 写信 / 已填写/composer-panel/div/letter-count/76 |
| `--font-tiny` | `400 9px/1.21 "Fredoka"` | 300 | 文字：✦、Tap to chat；35:3552 /home-ready · 首页 / 三封来信/scene/div/✦；35:3660 /home-empty · 首页 / 无符合条件的信件/scene/div/✦；35:3776 /home-response · 首页 / 回应到达/scene/div/✦ |
| `--font-tiny-letter-spacing` | `0px` | 300 | 文字：✦、Tap to chat；35:3552 /home-ready · 首页 / 三封来信/scene/div/✦；35:3660 /home-empty · 首页 / 无符合条件的信件/scene/div/✦；35:3776 /home-response · 首页 / 回应到达/scene/div/✦ |
| `--font-tiny-16` | `400 9px/16px "Fredoka"` | 22 | 文字：Interactive preview. No real account, email or password change.；35:2453 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p/Interactive preview. No real account, email or password change.；35:2547 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/p/Interactive preview. No real account, email or password change.；35:2641 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/p/Interactive preview. No real account, email or password change. |
| `--font-tiny-16-letter-spacing` | `0px` | 22 | 文字：Interactive preview. No real account, email or password change.；35:2453 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p/Interactive preview. No real account, email or password change.；35:2547 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/p/Interactive preview. No real account, email or password change.；35:2641 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/p/Interactive preview. No real account, email or password change. |
| `--font-symbol-star` | `400 19px/1.21 "Fredoka"` | 274 | 文字：✦；35:3548 /home-ready · 首页 / 三封来信/scene/div/✦；35:3550 /home-ready · 首页 / 三封来信/scene/div/✦；35:3656 /home-empty · 首页 / 无符合条件的信件/scene/div/✦ |
| `--font-symbol-star-letter-spacing` | `0px` | 274 | 文字：✦；35:3548 /home-ready · 首页 / 三封来信/scene/div/✦；35:3550 /home-ready · 首页 / 三封来信/scene/div/✦；35:3656 /home-empty · 首页 / 无符合条件的信件/scene/div/✦ |
| `--font-symbol-chevron` | `400 24px/1.21 "Fredoka"` | 233 | 文字：‹；35:2421 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/auth-back/‹；35:2477 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/auth-back/‹；35:2571 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/auth-back/‹ |
| `--font-symbol-chevron-letter-spacing` | `0px` | 233 | 文字：‹；35:2421 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/auth-back/‹；35:2477 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/auth-back/‹；35:2571 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/auth-back/‹ |
| `--space-2` | `2px` | 70 | 自动布局 itemSpacing / padding；36:3086 /letter-open · 来信详情 / 未回应/note-panel/reply-form/reply；36:3219 /letter-typed · 来信详情 / 编辑回应/note-panel/reply-form/reply |
| `--space-3` | `3px` | 26 | 自动布局 itemSpacing / padding；29:9934 /chat-recording · 对话 / 录音中（演示）/Dialog - Voice recording/Container；29:10090 /chat-record-cancel · 对话 / 上滑取消录音/Dialog - Voice recording/Container；56:2114 /pass-default · Filter Pass / 未开通/app-view/div/div/button/Duration |
| `--space-4` | `4px` | 713 | 自动布局 itemSpacing / padding；36:2042 /filters-free · 筛选 / 未开通 Pass/sheet/sheet-content/div/span/age-pass；36:2059 /filters-free · 筛选 / 未开通 Pass/sheet/sheet-content/div/span/city-pass；36:2214 /filters-active · 筛选 / Pass 生效/sheet/sheet-content/div/span/age-pass |
| `--space-5` | `5px` | 102 | 自动布局 itemSpacing / padding；29:5637 /inbox-empty · 消息 / 从未收到消息/Section/Header/Button - Inbox menu；29:5725 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Header/Button - Inbox menu；29:5820 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Header/Button - Inbox menu |
| `--space-6` | `6px` | 1305 | 自动布局 itemSpacing / padding；29:5620 /inbox-empty · 消息 / 从未收到消息/Header/Container/Button - Bird appearance；29:5625 /inbox-empty · 消息 / 从未收到消息/Header/Container/Button - Find your letters |
| `--space-7` | `7px` | 80 | 自动布局 itemSpacing / padding；36:2576 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/div；36:2759 /bird-male · 信使外观 / 男鸟/sheet/sheet-content/div |
| `--space-8` | `8px` | 853 | 自动布局 itemSpacing / padding；36:2024 /filters-free · 筛选 / 未开通 Pass/sheet/sheet-content/filter-genders/Filter Man；36:2029 /filters-free · 筛选 / 未开通 Pass/sheet/sheet-content/filter-genders/Filter Woman；36:2034 /filters-free · 筛选 / 未开通 Pass/sheet/sheet-content/filter-genders/Filter Everyone |
| `--space-10` | `10px` | 330 | 自动布局 itemSpacing / padding；35:2433 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/email-signin；35:2435 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/apple-signin；35:2540 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/div/terms-continue |
| `--space-12` | `12px` | 1539 | 自动布局 itemSpacing / padding；35:2433 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/email-signin；35:2435 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/apple-signin |
| `--space-14` | `14px` | 118 | 自动布局 itemSpacing / padding；29:5733 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Container/Container/Container/Button；29:5853 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button；29:5867 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button |
| `--space-16` | `16px` | 860 | 自动布局 itemSpacing / padding；35:2678 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-email；35:2681 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-password |
| `--space-20` | `20px` | 199 | 自动布局 itemSpacing / padding；29:5632 /inbox-empty · 消息 / 从未收到消息/Section/Header/Container；29:5720 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Header/Container；29:5815 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Header/Container |
| `--space-24` | `24px` | 749 | 自动布局 itemSpacing / padding；29:5631 /inbox-empty · 消息 / 从未收到消息/Section/Header；29:5642 /inbox-empty · 消息 / 从未收到消息/Section/Container |
| `--space-28` | `28px` | 141 | 自动布局 itemSpacing / padding；29:5733 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Container/Container/Container/Button；29:5853 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button；29:5867 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button |
| `--space-32` | `32px` | 43 | 自动布局 itemSpacing / padding；29:13736 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Section；29:13758 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container；29:13894 /profile-content · 个人页 / 已有形象照/Section/Container/Section |
| `--space-40` | `40px` | 40 | 自动布局 itemSpacing / padding；29:5644 /inbox-empty · 消息 / 从未收到消息/Section/Container/Container/Container；29:6532 /inbox-friends-empty · 好友 / 空状态/Section/Container/Container/Container |
| `--radius-12` | `12px` | 340 | 35:2678 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-email；35:2681 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-password；35:2733 /signin-filled · 邮箱登录 / 已填写/auth-overlay/auth-panel/div/auth-form/label/auth-email |
| `--radius-22` | `22px` | 310 | 35:3621 /home-ready · 首页 / 三封来信/header/div/magic；35:3626 /home-ready · 首页 / 三封来信/header/div/settings；35:3731 /home-empty · 首页 / 无符合条件的信件/header/div/magic |
| `--radius-24` | `24px` | 248 | 35:2433 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/email-signin；35:2435 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/apple-signin；35:2540 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/div/terms-continue |
| `--radius-16` | `16px` | 201 | 35:2487 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/Terms of Use and EULA；35:2581 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/Terms of Use and EULA；39:2423 /compose-sent · 写信 / 发送后等待/toast |
| `--radius-20` | `20px` | 168 | 29:7360 /inbox-hidden · 隐藏会话 / 有记录/Section/Header/Button - Back；29:7446 /inbox-hidden-empty · 隐藏会话 / 空状态/Section/Header/Button - Back；29:8673 /chat-waiting · 对话 / 等待对方回复/Section/Header/Button - Back |
| `--radius-14` | `14px` | 115 | 35:3407 /apple-private · Apple / 隐藏邮箱/auth-overlay/auth-panel/div/div/apple-hide；35:3412 /apple-private · Apple / 隐藏邮箱/auth-overlay/auth-panel/div/div/apple-share；35:3459 /apple-share · Apple / 共享邮箱/auth-overlay/auth-panel/div/div/apple-hide |
| `--radius-4` | `4px` | 110 | 36:2013 /filters-free · 筛选 / 未开通 Pass/sheet/div；36:2185 /filters-active · 筛选 / Pass 生效/sheet/div；36:2353 /filters-selected · 筛选 / 已选择条件/sheet/div |
| `--radius-11` | `11px` | 77 | 35:3794 /home-response · 首页 / 回应到达/response-strip/response-track/A cup of tea replied/img；35:3800 /home-response · 首页 / 回应到达/response-strip/response-track/A cup of tea replied/img；36:2584 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/label/motion-switch |
| `--radius-3` | `3px` | 74 | 39:2385 /compose-sent · 写信 / 发送后等待/app-view/header/inbox-menu/b；29:5641 /inbox-empty · 消息 / 从未收到消息/Section/Header/Button - Inbox menu/Bold Text；29:5729 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Header/Button - Inbox menu/Bold Text |
| `--radius-18` | `18px` | 42 | 35:3793 /home-response · 首页 / 回应到达/response-strip/response-track/A cup of tea replied；35:3799 /home-response · 首页 / 回应到达/response-strip/response-track/A cup of tea replied；56:1960 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 100 diamonds for 0.99 USD/Price |
| `--radius-8` | `8px` | 36 | 36:2042 /filters-free · 筛选 / 未开通 Pass/sheet/sheet-content/div/span/age-pass；36:2059 /filters-free · 筛选 / 未开通 Pass/sheet/sheet-content/div/span/city-pass；36:2214 /filters-active · 筛选 / Pass 生效/sheet/sheet-content/div/span/age-pass |
| `--radius-30` | `30px` | 32 | 35:3568 /home-ready · 首页 / 三封来信/actions/refresh；35:3574 /home-ready · 首页 / 三封来信/actions/compose；35:3678 /home-empty · 首页 / 无符合条件的信件/actions/refresh |
| `--radius-13` | `13px` | 30 | 29:5839 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Button:margin/Button/Text:align/Text/Image:margin/Image；29:5841 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Button:margin/Button/Text:align/Text/Image:margin/Image；29:5843 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Button:margin/Button/Text:align/Text/Image:margin/Image |
| `--radius-44` | `44px` | 30 | 29:13700 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button - Change avatar；29:13701 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button - Change avatar/Image (Your avatar)；29:13858 /profile-content · 个人页 / 已有形象照/Section/Container/Container/Container/Button - Change avatar |
| `--radius-26` | `26px` | 29 | 35:3536 /home-ready · 首页 / 三封来信/scene/div；35:3650 /home-empty · 首页 / 无符合条件的信件/scene/div；35:3760 /home-response · 首页 / 回应到达/scene/div |
| `--radius-10` | `10px` | 26 | 29:5847 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Button:margin/Button/Bold Text；29:5990 /inbox-collected-one · 消息 / 收取 1 封，剩余 2 封/Section/Container/Button:margin/Button/Bold Text；29:7696 /reply-last-free · 回信 / 剩余 1 次免费/Section/Container/Button:margin/Button/Bold Text |
| `--radius-28` | `28px` | 25 | 36:3054 /letter-open · 来信详情 / 未回应/note-panel；36:3187 /letter-typed · 来信详情 / 编辑回应/note-panel；36:3321 /letter-waiting · 来信详情 / 已回应，等待回信/note-panel |
| `--radius-10-5` | `10.5px` | 23 | 35:3538 /home-ready · 首页 / 三封来信/scene/div；35:3652 /home-empty · 首页 / 无符合条件的信件/scene/div；35:3762 /home-response · 首页 / 回应到达/scene/div |
| `--shadow-sheet` | `0px -50px 100px 0px rgb(0 0 0 / 0.533)` | 21 | 29:7176 /inbox-options · 会话 / 更多操作/Dialog；29:8572 /reply-topup · 回信 / 进入钻石补充/Dialog；29:10659 /chat-remark · 对话设置 / 备注名/Dialog |
| `--shadow-dialog` | `0px 28px 80px 0px rgb(0 0 0 / 0.6)` | 10 | 29:7923 /reply-payment · 回信 / 10 次用完，付费确认/Container/Dialog；29:8099 /reply-shortage · 回信 / 钻石不足/Container/Dialog；29:11070 /chat-clear-confirm · 聊天记录 / 清空确认/Container/Dialog |
| `--shadow-glow` | `0px 0px 20px 0px rgb(181 250 112 / 0.043)` | 39 | 29:7947 /reply-payment · 回信 / 10 次用完，付费确认/Container/Dialog/Container/Button:margin/Button；29:8118 /reply-shortage · 回信 / 钻石不足/Container/Dialog/Container/Button:margin/Button；29:10672 /chat-remark · 对话设置 / 备注名/Dialog/Container/Container/Button |
| `--shadow-sm` | `0px 2px 4px 0px rgb(0 0 0 / 0.2)` | 19 | 29:14354 /avatar-gallery · 头像 / 已上传与空槽位/Dialog/Container/Container:margin/Container/Container/Button - Remove photo 1；29:14361 /avatar-gallery · 头像 / 已上传与空槽位/Dialog/Container/Container:margin/Container/Container/Button - Remove photo 2；29:14367 /avatar-gallery · 头像 / 已上传与空槽位/Dialog/Container/Container:margin/Container/Container/Button - Remove photo 3 |
| `--shadow-md` | `0px 3px 12px 0px rgb(0 0 0 / 0.094)` | 15 | 29:13771 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Button - New moment；29:13935 /profile-content · 个人页 / 已有形象照/Section/Container/Button - New moment；29:14301 /avatar-gallery · 头像 / 已上传与空槽位/Section/Container/Button - New moment |
| `--ring-page` | `0px 0px 0px 10px #0D1713` | 8 | 29:5827 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Button:margin/Button；29:5972 /inbox-collected-one · 消息 / 收取 1 封，剩余 2 封/Section/Container/Button:margin/Button；29:7676 /reply-last-free · 回信 / 剩余 1 次免费/Section/Container/Button:margin/Button |
| `--blur-trail` | `6px` | 411 | 35:3556 /home-ready · 首页 / 三封来信/scene/Icon / vector/trails/Vector；35:3558 /home-ready · 首页 / 三封来信/scene/Icon / vector/trails/Vector；35:3560 /home-ready · 首页 / 三封来信/scene/Icon / vector/trails/Vector |
| `--blur-backdrop` | `16px` | 10 | 29:7922 /reply-payment · 回信 / 10 次用完，付费确认/Container；29:8098 /reply-shortage · 回信 / 钻石不足/Container；29:11069 /chat-clear-confirm · 聊天记录 / 清空确认/Container |
| `--page-margin` | `24px` | 2372 | 35:2427 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/h1；35:2429 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p；35:2431 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p |
| `--header-back-x` | `16px` | 158 | 29:7360 /inbox-hidden · 隐藏会话 / 有记录/Section/Header/Button - Back；29:7446 /inbox-hidden-empty · 隐藏会话 / 空状态/Section/Header/Button - Back；29:8673 /chat-waiting · 对话 / 等待对方回复/Section/Header/Button - Back |
| `--auth-header-button-x` | `20px` | 87 | 35:2420 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/auth-back；35:2476 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/auth-back；35:2570 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div/auth-back |
| `--content-width` | `327px` | 1497 | 35:2427 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/h1；35:2429 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p；35:2431 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p |
| `--control-height` | `48px` | 401 | 35:2433 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/email-signin；35:2435 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/apple-signin；35:2540 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/div/terms-continue |
| `--icon-button-size` | `44px` | 880 | 35:3617 /home-ready · 首页 / 三封来信/header；35:3618 /home-ready · 首页 / 三封来信/header/h1；35:3620 /home-ready · 首页 / 三封来信/header/div |
| `--header-height` | `64px` | 224 | 35:2419 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div；35:2475 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div；35:2569 /terms-checked · 协议 / 已勾选/auth-overlay/auth-panel/div |
| `--list-row-height` | `56px` | 176 | 35:3041 /verify-empty · 验证码 / 待输入/auth-overlay/auth-panel/div/div/✉；35:3092 /verify-error · 验证码 / 输入错误/auth-overlay/auth-panel/div/div/✉；35:3146 /verify-resend · 验证码 / 重发倒计时/auth-overlay/auth-panel/div/div/✉ |
| `--nav-height` | `96px` | 75 | 43:3334 /home-ready · 首页 / 三封来信/Main navigation；43:3367 /home-empty · 首页 / 无符合条件的信件/Main navigation；43:3400 /home-response · 首页 / 回应到达/Main navigation |
| `--chip-height` | `28px` | 242 | 35:2450 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/explore-preview；35:3791 /home-response · 首页 / 回应到达/response-strip；35:3792 /home-response · 首页 / 回应到达/response-strip/response-track |
| `--chip-height-large` | `36px` | 113 | 36:3350 /letter-waiting · 来信详情 / 已回应，等待回信/note-panel/conversation/reply-history/div；36:3482 /letter-replied · 来信详情 / 已收到回复/note-panel/conversation/reply-history/div；29:7374 /inbox-hidden · 隐藏会话 / 有记录/Section/Container/Container/Button |
| `--status-height` | `57.828125px` | 114 | 29:5686 /inbox-empty · 消息 / 从未收到消息/Image；29:5781 /inbox-waiting · 消息 / 已寄出，尚无回信/Image；29:5926 /inbox-pending · 消息 / 收到 3 封待收回信/Image |
| `--content-top` | `48px` | 352 | 35:2417 /welcome · 欢迎 / 未登录/auth-overlay；35:2418 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel；35:2419 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div |
| `--content-height` | `764px` | 128 | 35:2417 /welcome · 欢迎 / 未登录/auth-overlay；35:2473 /terms-unchecked · 协议 / 未勾选/auth-overlay；35:2567 /terms-checked · 协议 / 已勾选/auth-overlay |

## §3 逐条核对

§3.1 所有命名色均在上表逐项对应；同格多值分别展开为 `text-danger` / `text-danger-delete`、`hairline` / `hairline-strong`、`stroke-accent` / `stroke-accent-subtle`，选中描边保留 1px。卡片注记的 1% 白描边为 `hairline-card`。额外文字色限于该段明确列出的十种及“等，每种 30–60 处”所覆盖的文字色，按节点用途命名；不确定语义者以 node-原hex 命名并附原节点，不合并颜色。

| §3.2 条目 | token（均附同名 -letter-spacing） | 计划次数 → JSON 次数 |
| --- | --- | --- |
| button | `--font-button` | [154] → [154] |
| h1 | `--font-h1` | [18] → [18] |
| title-page | `--font-title-page`, `--font-title-page-medium` | [58, 31] → [58, 31] |
| title-sheet | `--font-title-sheet`, `--font-title-sheet-fixed` | [60, 21] → [60, 21] |
| title-card | `--font-title-card` | [54] → [54] |
| body | `--font-body` | [284] → [283] |
| body-sm | `--font-body-sm`, `--font-body-sm-18`, `--font-body-sm-21` | [121, 80, 79] → [121, 80, 79] |
| caption | `--font-caption`, `--font-caption-20`, `--font-caption-21`, `--font-caption-18` | [179, 42, 42, 28] → [179, 42, 42, 28] |
| hint | `--font-hint` | [15] → [15] |
| micro | `--font-micro`, `--font-micro-17`, `--font-micro-13`, `--font-micro-16` | [181, 73, 40, 31] → [181, 73, 40, 31] |
| tiny | `--font-tiny`, `--font-tiny-16` | [300, 22] → [300, 22] |
| 符号字 | `--font-symbol-star`, `--font-symbol-chevron` | [274, 233] → [274, 233] |

§3.3 间距逐值覆盖：2 / 3 / 4 / 5 / 6 / 7 / 8 / 10 / 12 / 14 / 16 / 20 / 24 / 28 / 32 / 40。圆角逐值覆盖：12 / 22 / 24 / 16 / 20 / 14 / 4 / 11 / 3 / 18 / 8 / 30 / 13 / 44 / 26 / 10 / 28 / 10.5。页面边距 24、返回 x=16、登录按钮 x=20、内容宽327；控件48、图标44、页头64、列表56、导航96、胶囊28/36、状态栏57.83、内容起点48及高764均由上表尺寸 token 覆盖。没有把所有节点的任意间距/尺寸/效果升级为 token。

## 待 R02 核对用途结论

| 原待核对项 | 核对后用途及节点 |
| --- | --- |
| `--grad-card-diagonal-h391-5` | 确认对话框：付费、余额不足、清空记录、屏蔽等；斜向版本，按原节点高宽保留方向变体；29:7923 /reply-payment · 回信 / 10 次用完，付费确认/Container/Dialog |
| `--grad-card` | 缓存清理、PIN、退出、注销、套餐与 Pass 确认等；9 个水平版本；35:2397 /cache-confirm · 缓存 / 清理确认/payment-overlay/payment-dialog；39:2849 /pin-locked · 应用锁 / 输入 PIN/payment-overlay/payment-dialog |
| `--hairline` | 页头分隔描边、容器细边框；29:5631 /inbox-empty · 消息 / 从未收到消息/Section/Header；29:5719 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Header |
| `--hairline-strong` | 登录输入框描边，也见其他输入/选项容器；35:2678 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-email；35:2681 /signin-empty · 邮箱登录 / 空表单/auth-overlay/auth-panel/div/auth-form/label/auth-password |
| `--font-title-page` | 页头主标题：Hidden conversations 等；29:7365 /inbox-hidden · 隐藏会话 / 有记录/Section/Header/Heading 1/Hidden conversations；29:7451 /inbox-hidden-empty · 隐藏会话 / 空状态/Section/Header/Heading 1/Hidden conversations |
| `--font-title-page-medium` | 另一批页头主标题：Inbox、Settings 等；39:2375 /compose-sent · 写信 / 发送后等待/app-view/header/h1/Inbox；34:2035 /settings-home · 设置 / 主页面/app-view/header/h1/Settings |
| `--font-title-sheet` | 实际是个人资料昵称、统计数字等，不应一概理解为弹层标题；29:13709 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Button - Edit profile/Bold Text/Passing breeze；29:13719 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Container/Container/Button/0 |
| `--font-title-sheet-fixed` | 底部弹层标题：Conversation options、Diamonds 等；29:7181 /inbox-options · 会话 / 更多操作/Dialog/Container/Heading 2/Conversation options；29:8577 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Heading 2/Diamonds |
| `--font-title-card` | 会话列表标题 / 联系人名称；29:5738 /inbox-waiting · 消息 / 已寄出，尚无回信/Section/Container/Container/Container/Button/Text/Bold Text/Your sent letter；29:5857 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Container/Container/Button/Text/Bold Text/A cup of tea |
| `--font-caption` | 语言切换、按钮短标签等自动行高小字；35:2425 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/auth-language/한국어；35:2481 /terms-unchecked · 协议 / 未勾选/auth-overlay/auth-panel/div/auth-language/한국어 |
| `--font-caption-20` | Filter Pass 状态说明与个人菜单；36:2066 /filters-free · 筛选 / 未开通 Pass/sheet/sheet-content/filter-pass-status/Choose a day pass to unlock age and city filters.；36:2236 /filters-active · 筛选 / Pass 生效/sheet/sheet-content/filter-pass-status/Filter Pass active until Oct 20 |
| `--font-caption-21` | 空状态说明、辅助段落；29:5650 /inbox-empty · 消息 / 从未收到消息/Section/Container/Container/Container/Paragraph/Every connection starts with a little hello.；29:6538 /inbox-friends-empty · 好友 / 空状态/Section/Container/Container/Container/Paragraph/Every connection starts with a little hello. |
| `--font-caption-18` | 举报/屏蔽选项副说明；36:3642 /letter-safety · 来信详情 / 举报或屏蔽/sheet/sheet-content/div/safety-report/small/Tell us about inappropriate content；36:3649 /letter-safety · 来信详情 / 举报或屏蔽/sheet/sheet-content/div/safety-block/small/Stop contact from this person |
| `--font-micro` | 分隔点、Flight preview、辅助标签等；35:2447 /welcome · 欢迎 / 未登录/auth-overlay/auth-panel/div/p/span/·；36:2579 /bird-female · 信使外观 / 女鸟/sheet/sheet-content/div/span/Flight preview |
| `--font-micro-17` | 密码要求和说明文字；35:2861 /signup-empty · 注册 / 空表单/auth-overlay/auth-panel/div/auth-form/p/At least 8 characters, with a letter and a number.；35:2927 /signup-filled · 注册 / 已填写/auth-overlay/auth-panel/div/auth-form/p/At least 8 characters, with a letter and a number. |
| `--font-micro-13` | 钻石包标题/描述；56:1958 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 100 diamonds for 0.99 USD/Pack heading/Starter pack；56:1959 /reply-topup · 回信 / 进入钻石补充/Dialog/Container/Container:margin/Container/Button - 100 diamonds for 0.99 USD/A little boost |
| `--font-micro-16` | 写信字数计数等；39:2034 /compose-empty · 写信 / 空白/composer-panel/div/letter-count/0；39:2035 /compose-empty · 写信 / 空白/composer-panel/div// 200 |
| `--font-tiny` | 9px 自动行高不只星光；字符分布见下；35:3552 /home-ready · 首页 / 三封来信/scene/div/✦；35:3660 /home-empty · 首页 / 无符合条件的信件/scene/div/✦ |
| `--shadow-sheet` | 底部弹层容器；29:7176 /inbox-options · 会话 / 更多操作/Dialog；29:8572 /reply-topup · 回信 / 进入钻石补充/Dialog |
| `--shadow-dialog` | 付费/余额不足/清空/屏蔽等确认对话框；29:7923 /reply-payment · 回信 / 10 次用完，付费确认/Container/Dialog；29:8099 /reply-shortage · 回信 / 钻石不足/Container/Dialog |
| `--shadow-glow` | 强调操作按钮的绿色光晕；29:7947 /reply-payment · 回信 / 10 次用完，付费确认/Container/Dialog/Container/Button:margin/Button；29:8118 /reply-shortage · 回信 / 钻石不足/Container/Dialog/Container/Button:margin/Button |
| `--shadow-sm` | 头像 Remove photo 小按钮；29:14354 /avatar-gallery · 头像 / 已上传与空槽位/Dialog/Container/Container:margin/Container/Container/Button - Remove photo 1；29:14361 /avatar-gallery · 头像 / 已上传与空槽位/Dialog/Container/Container:margin/Container/Container/Button - Remove photo 2 |
| `--shadow-md` | 个人资料 New moment 按钮；29:13771 /profile-empty · 个人页 / 尚未上传照片/Section/Container/Button - New moment；29:13935 /profile-content · 个人页 / 已有形象照/Section/Container/Button - New moment |
| `--ring-page` | 收取回信入口按钮周围的页面底色隔离环；29:5827 /inbox-pending · 消息 / 收到 3 封待收回信/Section/Container/Button:margin/Button；29:5972 /inbox-collected-one · 消息 / 收取 1 封，剩余 2 封/Section/Container/Button:margin/Button |
| `--blur-trail` | 鸟轨迹 Vector 光效；35:3556 /home-ready · 首页 / 三封来信/scene/Icon / vector/trails/Vector；35:3558 /home-ready · 首页 / 三封来信/scene/Icon / vector/trails/Vector |
| `--blur-backdrop` | 付费及其他确认框外层遮罩的背景模糊；29:7922 /reply-payment · 回信 / 10 次用完，付费确认/Container；29:8098 /reply-shortage · 回信 / 钻石不足/Container |

9/10.89 字符统计（JSON）：`[('✦', 137), ('›', 30), ('Following', 15), ('Followers', 15), ('Likes', 15), ('Visitors', 15), ('Everyone', 15), ('View all moments', 15), ('06:32 PM', 13), ('07:02 PM', 12), ('♡ 1', 7), ('Tap to chat', 2), ('Awaiting reply', 2), ('07:32 PM', 2), ('07:22 PM', 1), ('Help centre', 1), ('Guidelines', 1), ('Safety guide', 1), ('Delete account', 1)]`。

## 计划与 JSON 的差异

- `shadow-sheet`：计划 53%，JSON `0.5329999923706055`（约53.3%），token 写为 0.533；其余 alpha 同样约到 3 位，去除 float32 存储尾数。
- `grad-primary`：98 次拆为水平 62 次和斜向 36 次；斜向按宽 143.5 / 165 / 277 / 309 / 327、高 48 分成 6 / 1 / 7 / 6 / 16 次，归一化角度 115°，实际 CSS 角度为 144.35°–162.53°。
- `grad-secondary`：18 次拆为水平 17 次和 150×48 斜向 1 次；归一化角度 120°，实际 CSS 角度 151°。
- `grad-icon-btn`：计划写横向 274 次，JSON 实为 44×44 的 135° 斜向 228 次和水平 46 次；多数斜向用无后缀名，水平用 `-horizontal`。
- `grad-card`：19 次拆为水平 9 次和斜向 10 次；水平是单个精确值中最多的，使用无后缀名，斜向按 327×238 / 258 / 294 / 322 / 341 / 391.5 保留六个 `-diagonal-h*` 变体。
- 换算规则：所有非横向线性渐变按节点 w×h 换算。等色线为 `((h2−h0).x·w, (h2−h0).y·h)`，取垂线并朝向 `((h1−h0).x·w, (h1−h0).y·h)`，单位方向 `(nx, ny)` 的 CSS 角度为 `atan2(nx, −ny)`；渐变线长为 `|nx|·w + |ny|·h`，将 h0/h1 相对元素中心的位置投影得到首尾色标。不同宽高不能直接复用斜向 token，必须从 handles 重算；分组键包含宽高。
- 字体 body：计划284，完整匹配 Fredoka 400 13/20 字距0统计为283；不把其他字距或字体的节点混为同一组。
- blur-trail：计划72，189状态内 visible LAYER_BLUR 6px 统计为411，包含各状态保留的场景轨迹；不缩小范围迎合计划次数。
- 场景底等计划次数有的按画框、有的按文字；本报告统一给出明确口径的次数，不把总 paint 数当作画框数。§3.1 text-primary 计划780，JSON TEXT fills 精确计数为779。
- 状态栏区计划显示57.83，JSON 首个证据值为 `57.828125px`，token 保留原始浮点值。

## 旧变量映射与外观验收

仅 `--lime:#b5fa70` 改为 `--lime: var(--accent)`，新值 #B5FA70 完全相等。`--ink:#080e0e`、`--white:#f3f4f4`、`--muted:#777c81` 保持原值：新 token 中没有完全相等颜色，#080D0A / #E4EFD9 / #F1F4ED / #788F80 均不等价。差距留给后续页面重做任务。

`main.ts` 的第一个 CSS import 为 tokens.css；styles.css 仅替换上述 lime 字串，其他字节保持不变。旧 `--space-2` 到 `--space-6` 定义继续在后加载的 styles.css 覆盖新 token，保持现有计算样式；页面未迁移到新 token。新文件仅 :root 自定义属性，无普通 CSS 属性、组件选择器或其他规则。按任务指定，构建通过即视为满足截图无差异，不新增截图用例。

## 构建

计数纠错：基线实际为 13 个线性渐变（2+2+2+7），不是验收文档所写的 14 个。按 §3.4 的 17 项表完整展开后，总数算法为 169＋（17−13）＝169＋4＝173 个 token；验收文档中的总数 172 是算术错误，以 173 为准。其余 token 未删除。四组次数为 98 / 18 / 274 / 19。两个指定节点 29:7947 / 29:7923 分别重算为 159.61deg / 140.03deg。生成脚本重跑后 tokens.css 字节一致。

分支与 origin/main 的构建 CSS 对比：仅多一个含 173 条声明的 :root 块，以及 --lime 的指定替换，其他字节完全相同。

`cd client && npm run build`：退出码0；包含素材校验、vue-tsc --noEmit、vite build。最终 173 个属性生成后重跑确认；素材校验 PASS（343 PNG、SHA256、尺寸、字体和许可证），Vite 完成。静态检查另确认：173 行 token 证据与 CSS 一致、仅 :root 自定义属性、styles.css 与 HEAD 仅指定 lime 字串替换、import 顺序正确；现有源码引用交集仅 accent 与被旧定义覆盖的 space-2/3/4/5/6。git diff --check 通过。

## 可复现生成脚本

以下代码保存到 /tmp 后在仓库根目录运行（只写 tokens.css 和 /tmp 统计结果）；脚本内的值仅用作 §3 查询键，输出值从命中节点读取。验收表使用 /tmp/r02-rows.json 逐行生成。

```python
import json,re,collections
j=json.load(open('/root/maugo-figma/maugo-file-full.json')); plan=open('docs/ui-redo-plan.md').read(); sec=plan.split('### 第一批：')[1].split('## 8.')[0]; ids=set(re.findall(r'(?<!\d)\d+:\d+',sec));ids|={'35:3533','35:3647','35:3757'};ids-={'30:2','43:1912','43:1945','43:1979','43:2012','43:2046','43:2079'}
frames=[n for n in j['document']['children'][0]['children'] if n['id'] in ids];print('frames',len(frames))
nodes=[]
def walk(n,path):
 if n['name'].startswith('→'):return
 b=n.get('absoluteBoundingBox',{}); w=b.get('width',0); h=b.get('height',0)
 if (abs(w-375)<.01 and abs(h-57.828)<.01) or (abs(w-144)<.01 and abs(h-20)<.01):return
 nodes.append((n,path+'/'+n['name']))
 for c in n.get('children',[]):walk(c,path+'/'+n['name'])
for f in frames:walk(f,'')
def hx(c):return '#'+''.join(f'{round(c[k]*255):02X}' for k in ('r','g','b'))
import math,hashlib,pathlib
assert len(frames)==189 and j['version']=='2421258509127695554'
def num(v):return str(int(v)) if v==int(v) else repr(v)
def color(c,a=1):
 h=hx(c); a*=c.get('a',1)
 return h if a==1 else 'rgb('+ ' '.join(str(round(c[k]*255)) for k in ('r','g','b'))+' / '+num(round(a,3))+')'
rows=[]
def add(name,value,hits,use):
 assert hits,(name,value)
 assert name not in [r[0] for r in rows],name
 rows.append((name,value,len(hits),hits,use))
def sample(hits):return '；'.join(dict.fromkeys(n['id']+' '+p for n,p,*_ in hits[:3]))
paints=[];effects=[]
for n,p in nodes:
 for prop in ['fills','strokes']:
  for v in n.get(prop,[]):
   if v.get('visible',True):paints.append((n,p,prop,v))
 for v in n.get('effects',[]):
  if v.get('visible',True):effects.append((n,p,v))
# Selectors below are lookup keys from plan §3, never output values.
base={'bg-page':'0D1713','bg-scene':'090E0E','bg-auth':'081017','bg-nav':'0D1812','bg-card':'1B2A20','bg-sheet':'18211E','bg-input':'202F24','bg-tile':'222D25','bg-chip':'23362A','bg-media-btn':'24312A','switch-off-track':'35483B','switch-off-thumb':'AFBEB3','text-primary':'E4EFD9','text-on-accent':'0A1406','text-label':'BACDB2','text-hint':'849284','text-note':'728571','text-time':'8CA094','text-chevron':'7C927C','text-danger':'D9A48E','text-danger-delete':'CF9E8E','text-diamond':'E6D0EF','accent':'B5FA70','sparkle':'E5FFB3','icon-muted':'849288','icon-ink':'080D0A'}
def solid(name,h,alpha=1,prop=None,text=False):
 hits=[(n,p,v) for n,p,pr,v in paints if v['type']=='SOLID' and hx(v['color'])=='#'+h and abs(v.get('opacity',1)*v['color'].get('a',1)-alpha)<1e-6 and (prop is None or pr==prop) and (not text or n['type']=='TEXT') and (not name.startswith('stroke-accent') or n.get('strokeWeight')==1)]
 v=hits[0][2];add(name,color(v['color'],v.get('opacity',1)),hits,'节点用途：'+sample(hits))
for name,h in base.items():solid(name,h,text=name.startswith('text-'),prop='fills' if name.startswith('text-') else None)
for name,h,a,pr in [('bg-auth-overlay','0C1612',.92,'fills'),('scrim','000000',.467,'fills'),('scrim-dialog','030805',.79,'fills'),('grabber','FFFFFF',.157,'fills'),('hairline-card','FFFFFF',.01,'strokes'),('hairline','FFFFFF',.027,'strokes'),('hairline-strong','FFFFFF',.043,'strokes'),('stroke-accent','B5FA70',1,'strokes'),('stroke-accent-subtle','B5FA70',.23,'strokes')]:
 solid(name,h,a,pr)
 if name.startswith('stroke-accent'): # plan defines a complete 1px stroke
  r=rows[-1]; assert all(abs(n.get('strokeWeight',1)-1)<1e-6 for n,p,v in r[3]);rows[-1]=(r[0],'1px solid '+r[1],*r[2:])
extra={'86978C':'conversation-preview','788F80':'conversation-options','F1F4ED':'profile-stat','93AA8A':'profile-stat-label','B6C6A5':'diamond-pack-description','C1DBB0':'legal-heading','B8CCB0':'auth-navigation','91A48A':'profile-count','9EB994':'chat-tool','AFC2A5':'legal-body'}
extra.update({'8E9696':'sheet-close','B2DA9C':'profile-wallet','8BA381':'profile-bio','A8B89A':'profile-visitors','859D80':'profile-visibility','9FB593':'profile-menu'})
# §3.1 “等”：retain other text colors used 30–60 times, separately by original color.
cnt=collections.Counter(hx(v['color'])[1:] for n,p,pr,v in paints if pr=='fills' and n['type']=='TEXT' and v['type']=='SOLID')
for h,c in cnt.items():
 if 30<=c<=60 and h not in base.values() and h not in extra:extra[h]='node-'+h.lower()
for h,name in extra.items():solid('text-'+name,h,text=True,prop='fills')
for name,ends in {'grad-primary':('BDFF81','B0FB61'),'grad-icon-btn':('1B2121','131818'),'grad-secondary':('1C2223','171D1E'),'grad-card':('253229','17321C'),'bg-scene-glow':('102017','000000')}.items():
 hits=[(n,p,v) for n,p,pr,v in paints if tuple(hx(s['color'])[1:] for s in v.get('gradientStops',[]))==ends]
 # Non-horizontal linear variants include both node dimensions in their grouping key.
 def horizontal(v):
  h=v['gradientHandlePositions']
  return v['type']=='GRADIENT_LINEAR' and h[1]['x']-h[0]['x']==1 and h[1]['y']-h[0]['y']==0
 groups=collections.defaultdict(list)
 for n,p,v in hits:
  box=n['absoluteBoundingBox']
  size=(box['width'],box['height']) if v['type']=='GRADIENT_LINEAR' and not horizontal(v) else None
  groups[(json.dumps(v['gradientHandlePositions']),size)].append((n,p,v))
 ordered=sorted(groups.values(),key=lambda g:(-len(g),g[0][0]['absoluteBoundingBox']['width'],g[0][0]['absoluteBoundingBox']['height']))
 diagonals=[g for g in ordered if g[0][2]['type']=='GRADIENT_LINEAR' and not horizontal(g[0][2])]
 for i,group in enumerate(ordered):
  n,p,v=group[0];h=v['gradientHandlePositions'];dx=h[1]['x']-h[0]['x'];dy=h[1]['y']-h[0]['y']
  positions=[s['position'] for s in v['gradientStops']];suffix='';use=''
  if v['type']=='GRADIENT_RADIAL':prefix='radial-gradient(ellipse closest-side at 50% 50%, '
  else:
   w=n['absoluteBoundingBox']['width'];height=n['absoluteBoundingBox']['height']
   normalized=math.degrees(math.atan2(dx,-dy))%360
   if horizontal(v):
    prefix='linear-gradient(to right, '
    if i:suffix='-horizontal'
   else:
    # Perpendicular to the physical equal-color line, facing h1 from h0.
    nx=(h[2]['y']-h[0]['y'])*height;ny=-(h[2]['x']-h[0]['x'])*w
    if nx*dx*w+ny*dy*height<0:nx=-nx;ny=-ny
    length=math.hypot(nx,ny);nx/=length;ny/=length
    span=abs(nx)*w+abs(ny)*height
    start=.5+((h[0]['x']-.5)*w*nx+(h[0]['y']-.5)*height*ny)/span
    end=.5+((h[1]['x']-.5)*w*nx+(h[1]['y']-.5)*height*ny)/span
    positions=[start+(end-start)*t for t in positions]
    angle=math.degrees(math.atan2(nx,-ny))%360
    prefix='linear-gradient('+num(round(angle,2))+'deg, '
    if i:
     suffix='-diagonal'
     if len(diagonals)>1:
      widths={g[0][0]['absoluteBoundingBox']['width'] for g in diagonals}
      suffix+=('-w'+num(w) if len(widths)>1 else '-h'+num(height)).replace('.','-')
    use='节点尺寸 '+num(w)+'×'+num(height)+'；归一化角度 '+num(round(normalized,2))+'°；换成别的宽高时不能直接复用，要用同一换算规则从 handles 重算；'
  value=prefix+', '.join(color(s['color'])+' '+num(round(positions[k]*100,2))+'%' for k,s in enumerate(v['gradientStops']))+')'
  add(name+suffix,value,group,use+'渐变 handle='+json.dumps(h)+'；'+sample(group))

fontspec={'font-button':(600,16,22),'font-h1':(500,24,32),'font-title-page':(550,17,24),'font-title-page-medium':(500,17,24),'font-title-sheet':(550,18,21.78),'font-title-sheet-fixed':(550,18,24),'font-title-card':(550,15,21),'font-body':(400,13,20),'font-body-sm':(400,12,20),'font-body-sm-18':(400,12,18),'font-body-sm-21':(400,12,21),'font-caption':(400,11,13.31),'font-caption-20':(400,11,20),'font-caption-21':(400,11,21),'font-caption-18':(400,11,18),'font-hint':(400,11,16),'font-micro':(400,10,12.1),'font-micro-17':(400,10,17),'font-micro-13':(400,10,13),'font-micro-16':(400,10,16),'font-tiny':(400,9,10.89),'font-tiny-16':(400,9,16),'font-symbol-star':(400,19,22.99),'font-symbol-chevron':(400,24,29.04)}
for name,key in fontspec.items():
 hits=[(n,p,n['style']) for n,p in nodes if n['type']=='TEXT' and (n['style']['fontWeight'],n['style']['fontSize'],round(n['style']['lineHeightPx'],2))==key]
 groups=collections.defaultdict(list)
 for n,p,s in hits:
  expected=.4 if name=='font-hint' else -.3 if name in ['font-h1','font-title-page','font-title-page-medium','font-title-sheet-fixed'] else 0
  if s['fontFamily']=='Fredoka' and abs(s['letterSpacing']-expected)<1e-6:groups[(s['fontFamily'],s['letterSpacing'])].append((n,p,s))
 for i,((family,spacing),group) in enumerate(groups.items()):
  suffix='' if i==0 else '-tracking-'+num(round(spacing,6)).replace('.','-') if spacing else '-'+family.lower().replace(' ','-')
  stem=name+suffix;s=group[0][2]; use='文字：'+ '、'.join(dict.fromkeys(n.get('characters','')[:70].replace('\n',' ') for n,p,s in group[:5]))+'；'+sample(group)
  lh='1.21' if round(s['lineHeightPx'],2)==round(s['fontSize']*1.21,2) else num(s['lineHeightPx'])+'px'
  add(stem,num(s['fontWeight'])+' '+num(s['fontSize'])+'px/'+lh+' "'+family+'"',group,use)
  add(stem+'-letter-spacing',num(round(s['letterSpacing'],3))+'px',group,use)
# All listed spaces/radii; count property occurrences (not unique nodes).
for v in [2,3,4,5,6,7,8,10,12,14,16,20,24,28,32,40]:
 hits=[(n,p,k) for n,p in nodes for k in ['itemSpacing','paddingLeft','paddingRight','paddingTop','paddingBottom'] if n.get(k)==v]
 add('space-'+str(v),num(hits[0][0][hits[0][2]])+'px',hits,'自动布局 itemSpacing / padding；'+sample(hits))
for v in [12,22,24,16,20,14,4,11,3,18,8,30,13,44,26,10,28,10.5]:
 hits=[(n,p) for n,p in nodes if n.get('cornerRadius')==v]
 add('radius-'+str(v).replace('.','-'),num(hits[0][0]['cornerRadius'])+'px',hits,sample(hits))
for name,typ,radius,alpha in [('shadow-sheet','DROP_SHADOW',100,.533),('shadow-dialog','DROP_SHADOW',80,.6),('shadow-glow','DROP_SHADOW',20,.043),('shadow-sm','DROP_SHADOW',4,.2),('shadow-md','DROP_SHADOW',12,.094),('ring-page','DROP_SHADOW',0,1),('blur-trail','LAYER_BLUR',6,None),('blur-backdrop','BACKGROUND_BLUR',16,None)]:
 hits=[(n,p,v) for n,p,v in effects if v['type']==typ and v['radius']==radius and (alpha is None or abs(v['color']['a']-alpha)<1e-6)]
 v=hits[0][2];value=num(v['radius'])+'px'
 if typ=='DROP_SHADOW':value=' '.join(num(x)+'px' for x in [v['offset']['x'],v['offset']['y'],v['radius'],v.get('spread',0)])+' '+color(v['color'])
 add(name,value,hits,sample(hits))
# Dimensions explicitly listed in §3.3; values extracted from bounding boxes / relative positions.
node_frame={}
def index_frame(n,f):
 node_frame[n['id']]=f
 for c in n.get('children',[]):index_frame(c,f)
for f in frames:index_frame(f,f)
for name,axis,target in [('page-margin','x',24),('header-back-x','x',16),('auth-header-button-x','x',20),('content-width','width',327),('control-height','height',48),('icon-button-size','height',44),('header-height','height',64),('list-row-height','height',56),('nav-height','height',96),('chip-height','height',28),('chip-height-large','height',36),('status-height','height',57.83),('content-top','y',48),('content-height','height',764)]:
 hits=[]
 source=nodes if name!='status-height' else [(c,'/'+f['name']+'/'+c['name']) for f in frames for c in f.get('children',[])]
 for n,p in source:
  b=n.get('absoluteBoundingBox',{});f=node_frame.get(n['id'])
  if not f or axis not in b:continue
  val=b[axis]-(f['absoluteBoundingBox'][axis] if axis in ['x','y'] else 0)
  if abs(val-target)<.002:hits.append((n,p,val))
 add(name,num(hits[0][2])+'px',hits,sample(hits))
# Emit solely :root custom properties, with provenance for every value.
css=['/* Generated from maugo-file-full.json, version '+j['version']+'. See R02-result.md. */',':root {']
for name,value,count,hits,use in rows:
 css+=['  /* '+str(count)+' occurrences; '+use.replace('*/','* /')+' */','  --'+name+': '+value+';']
css+=['}',''];pathlib.Path('client/src/styles').mkdir(exist_ok=True);pathlib.Path('client/src/styles/tokens.css').write_text('\n'.join(css))
pathlib.Path('/tmp/r02-rows.json').write_text(json.dumps([(a,b,c,[(n['id'],p) for n,p,*_ in d],e) for a,b,c,d,e in rows],ensure_ascii=False))
print('generated',len(rows),'tokens')

```
