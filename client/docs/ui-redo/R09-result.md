# R09 收信箱验收记录

分支 `codex/r09-inbox`；基线 `aeb47c5`。唯一设计源 `/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`。未调用 Figma API、未读取凭证、未导出图片。沿用现有 1x 素材。当前为**实现提交，未通过完整验收**。

## A1–A8

| 项目 | 结果与证据 |
|---|---|
| A1 | `npm run build` 通过，素材校验 343 PNG、vue-tsc、Vite 均成功，退出码 0。 |
| A2 | 未通过：新增 `tests/r09-inbox.spec.ts`，覆盖菜单线、空插画、列表行、头像位置与尺寸；因沙箱限制，尚无浏览器实测结果。未声称所有关键元素误差 ≤1px。 |
| A3 | 未通过：新增计算样式断言；尚无浏览器实测结果。共用控件与 JSON 存在下述差异，不能声称完全相等。 |
| A4 | 未通过：本轮 17 张实现截图未生成，原因是本地测试服务受限。A4 并排图与差异比例待 R01/R04 恢复后补。 |
| A5 | 页面 CSS、components.css、base.css、InboxFlow.vue 的 hex、rgb 字面量、!important、.device 前缀均为 0；旧 src/*.css 收信箱选择器为 0。 |
| A6 | 未通过：0 个运行通过，测试服务在执行用例前失败。tsx IPC socket EPERM；绕过 IPC 后 PostgreSQL 127.0.0.1:5432 connect EPERM。不能将未运行的测试计作通过。D4 三项为前序任务记录的基线失败，本轮未能复现，不能声称本轮也恰好只有这三项失败。 |
| A7 | 未通过：新增用例路径覆盖 17 个 data-state，但未执行成功，17 张截图均待补。 |
| A8 | 保留业务能力差距及环境限制；没有生成伪造截图或差异比例。 |

运行命令：

```sh
cd client
npm run build
npx playwright test tests/inbox.spec.ts tests/client.spec.ts tests/r06-discover.spec.ts tests/r07-filter.spec.ts tests/letters.spec.ts tests/d4.spec.ts --workers=1 --reporter=line
npx playwright test tests/r09-inbox.spec.ts
```

原回归启动失败：`listen EPERM /tmp/tsx-0/29.pipe`。不改仓库配置尝试 `node --import ../maugo/node_modules/tsx/dist/loader.mjs tests/auth-server.mjs` 后：`connect EPERM 127.0.0.1:5432`。

## 改动与约束

`InboxFlow.vue` 仅模板和样式引用变化，script 与 HEAD 逐字一致。保留所有 id、data-state、aria-label 及事件处理。新文案补英文、韩文；Friends 显示标签保留 Following 的可访问标签。HomeFlow.vue、LettersFlow.vue、共用 shell 未修改。旧 inbox.css 和 InboxFlow.legacy-1.css 删除；fidelity.css / styles.css 仅移除收信箱规则。

渐变依赖：`.ui-button` → `--grad-primary`、`--grad-secondary`；`.ui-icon-button` → `--grad-icon-btn`。页面没有新建渐变名称；R02 修订后需复核这些共用依赖。

## 差距处理总表

| 元素 | 基线 | JSON / 本轮实现 | 限制 |
|---|---|---|---|
| CSS | inbox.css + scoped legacy + fidelity 覆盖叠加 | 单一 pages/inbox.css | 旧规则全部移除 |
| 菜单 | 多套 17/12/7 与 21px 覆盖，颜色不同 | 21×2、#E8F3DE | JSON 实为 21×2.1953125；按任务明确指定 2px。按钮使用共用 44×44，JSON 36×40，外观不在页面重写 |
| 页头 | 20/24px padding 多套定义 | ui-header；x0 y48 w375 h64，tabs gap20 | Friends 与 Following 业务术语通过显示/aria 分离 |
| 列表 | 52/48px 头像、多套字号与 padding | x24 y124 w327 h84，头像48，gap14，正文165，尾部58 | 时间仍显示真实日期；JSON 示例时间不可伪造 |
| 待收回信 | sticky 和多套高度 | x24 y124 w327 h56，底部20 | 属复合业务条，保留定制边框与内容布局 |
| 空态 | 继承全局 feature-empty，位置随 flex 漂移 | x131.5 y164 w112 h112；标题 y296；说明 y330 | 隐藏空态整体下移12；韩文溢出未实测 |
| 置顶 | 人造浅绿底色 | JSON 无底色，移除；首行90高 | 置顶/静音标记仍由真实数据驱动 |
| 隐藏 | 通用会话列表 | 保留真实列表和恢复选项；隐藏页头居中 | 未实现 JSON 独立恢复行结构，A2/A3 待补 |
| 搜索 | 抽屉文本输入 + 结果列表 | 复用 ui-input，清空按钮定位 | JSON 搜索按钮高23、当前共用48，不重写共用外观 |
| 抽屉 | 自定义 #17251c 容器 | ui-sheet，x91 y48 w284，底28 | JSON 为736高；共用内边框/圆角与 JSON 抽屉不同。没有添加无后端支持的 System messages / Interactions / New followers / Help / Preview / 清空操作 |
| 选项 | 全宽自定义底部 sheet | ui-sheet，水平12、底24 | JSON y462 h326 仅四项；真实业务含静音、关注、备注，保留全部操作，故高度不同 |
| 通知 | 多套提示条覆盖 | #223026、圆角12，原生 Notification 权限操作 | JSON 是 Enable/关闭按钮，无开关；不伪造通知开关状态 |
| 样例脚注 | 基线真实业务无脚注 | 未加入“Stored on this device” | 服务端数据不是本地样例，不能添加虚假说明 |
| 未读角标 | 真实行内 unreadCount；导航未读无渲染状态 | 保留行内16px数字角标 | R05 导航5×5点、x203.5/y18 未接数据，待 Smith；未伪造 |

## 17 个状态的证据路径

以下为用例预定截图路径，**文件尚未生成，不能视为截图证据**。均使用375×812；浏览器解禁后执行新增用例生成。用例未运行不代表状态已验收。

| 状态 | 节点 | 到达方式 | 待生成截图 |
|---|---|---|---|
| inbox-empty | 29:5602 | 空数据 | `screenshots/R09-inbox-empty.png` | 
| inbox-waiting | 29:5690 | waiting种子 | `screenshots/R09-inbox-waiting.png` | 
| inbox-pending | 29:5785 | pending种子 | `screenshots/R09-inbox-pending.png` | 
| inbox-collected-one | 29:5930 | 收取1条 | `screenshots/R09-inbox-collected-one.png` | 
| inbox-collected-all | 29:6089 | 收取全部 | `screenshots/R09-inbox-collected-all.png` | 
| inbox-unread | 29:6253 | 重新进入 | `screenshots/R09-inbox-unread.png` | 
| inbox-read | 29:6373 | 逐条打开后返回 | `screenshots/R09-inbox-read.png` | 
| inbox-friends-empty | 29:6490 | 切换Following | `screenshots/R09-inbox-friends-empty.png` | 
| inbox-friends | 29:6578 | 关注后切换 | `screenshots/R09-inbox-friends.png` | 
| inbox-drawer | 29:6686 | 打开菜单 | `screenshots/R09-inbox-drawer.png` | 
| inbox-search | 29:6870 | 匹配搜索 | `screenshots/R09-inbox-search.png` | 
| inbox-search-empty | 29:6968 | 不匹配搜索 | `screenshots/R09-inbox-search-empty.png` | 
| inbox-options | 29:7059 | 会话更多 | `screenshots/R09-inbox-options.png` | 
| inbox-pinned | 29:7209 | 置顶并静音 | `screenshots/R09-inbox-pinned.png` | 
| inbox-hidden | 29:7330 | 隐藏后打开隐藏列表 | `screenshots/R09-inbox-hidden.png` | 
| inbox-hidden-empty | 29:7416 | 恢复隐藏会话 | `screenshots/R09-inbox-hidden-empty.png` | 
| inbox-notifications-off | 29:7501 | 未授予通知且未忽略 | `screenshots/R09-inbox-notifications-off.png` | 

## 逐元素本地 JSON 量表

坐标均相对各状态375×812画框。列为 x/y/w/h；字体为 family/size/weight/line-height/letter-spacing。空数组代表无显式填充；原始浮点颜色保留，避免近似替代。以下只列收信箱 Section 与 Dialog 子树；共享导航、状态栏沿用 R05，背景不可见魔法场景与原型透明点击热点不属于本模块可见元素。每行“对照”是源码处理状态，非浏览器实测。


### inbox-empty · 消息 / 从未收到消息 (`29:5602`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:5630` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:5631` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5632` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5633` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5634` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5635` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5636` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5637` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5638` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5639` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5640` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5641` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5642` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5643` Container | 24.0 / 124.0 / 327.0 / 527.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5644` Container | 24.0 / 124.0 / 327.0 / 267.0 | `{"paddingLeft":8.0,"paddingRight":8.0,"paddingTop":40.0,"paddingBottom":40.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5645` Container | 32.0 / 164.0 / 311.0 / 132.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5646` Image | 131.5 / 164.0 / 112.0 / 112.0 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FIT","imageRef":"9b5df0d71afc787e877d90782e4072be284e0627"}]}` | 布局/字体见 inbox.css；待实测 |
| `29:5647` Heading 3 | 32.0 / 296.0 / 311.0 / 22.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5648` No conversations found. | 114.5 / 296.0 / 146.0 / 22.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.729411780834198,"g":0.7882353067398071,"b":0.7019608020782471,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":14.0,"fontWeight":550,"lineHeightPx":22.0,"letterSpacing":-0.30000001192092896}}` | 布局/字体见 inbox.css；待实测 |
| `29:5649` Paragraph | 32.0 / 318.0 / 311.0 / 33.0 | `{"paddingTop":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5650` Every connection starts with a little hello. | 86.5 / 330.0 / 202.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.43529412150382996,"g":0.529411792755127,"b":0.4274509847164154,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5651` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5652` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-waiting · 消息 / 已寄出，尚无回信 (`29:5690`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:5718` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:5719` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5720` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5721` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5722` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5723` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5724` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5725` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5726` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5727` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5728` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5729` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5730` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5731` Container | 24.0 / 124.0 / 327.0 / 527.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5732` Container | 24.0 / 124.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5733` Button | 24.0 / 124.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5734` Text | 24.0 / 142.0 / 48.0 / 48.0 | `{"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5735` Image (Your sent letter) | 17.76 / 135.76 / 61.44 / 61.44 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b6101e094fc7547a47b65f7612cdabbc5b339822"}]}` | 布局/字体见 inbox.css；待实测 |
| `29:5736` Text | 86.0 / 143.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5737` Bold Text | 86.0 / 143.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5738` Your sent letter | 86.0 / 143.5 / 105.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5739` Text | 86.0 / 170.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5740` Today I found a quiet little bookshop. What small  | 86.0 / 170.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5741` Text | 265.0 / 151.0 / 58.0 / 30.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5742` 19:21 | 301.0 / 151.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5743` Awaiting reply | 265.0 / 170.0 / 58.0 / 11.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":9.0,"fontWeight":400,"lineHeightPx":10.890000343322754,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5744` Button - Conversation options · Your sent letter | 331.0 / 151.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5745` ••• | 340.0 / 160.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5746` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5747` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-pending · 消息 / 收到 3 封待收回信 (`29:5785`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:5813` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:5814` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5815` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5816` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5817` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5818` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5819` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5820` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5821` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5822` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5823` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5824` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5825` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5826` Button:margin | 24.0 / 124.0 / 327.0 / 76.0 | `{"paddingBottom":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5827` Button | 24.0 / 124.0 / 327.0 / 56.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.07450980693101883,"g":0.125490203499794,"b":0.09019608050584793,"a":1.0}}],"strokes":[{"opacity":0.699999988079071,"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0}}],"cornerRadius":24.0,"itemSpacing":8.0,"paddingLeft":12.0,"paddingRight":12.0,"effects":[{"type":"DROP_SHADOW","visible":true,"color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0},"blendMode":"NORMAL","offset":{"x":0.0,"y":0.0},"radius":0.0,"spread":10.0,"showShadowBehindNode":false}]}` | 布局/字体见 inbox.css；待实测 |
| `29:5828` Text | 37.0 / 141.0 / 24.0 / 22.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5829` Icon | 37.0 / 141.0 / 22.0 / 22.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5830` h2d-svg-use-0 | 37.0 / 141.0 / 22.0 / 22.0 | `{"fills":[{"blendMode":"NORMAL","visible":false,"type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}]}` | 布局/字体见 inbox.css；待实测 |
| `29:5831` Vector | 39.75 / 145.5833 / 16.5 / 12.8333 | `{"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9137254953384399,"g":0.9647058844566345,"b":0.8745098114013672,"a":1.0}}]}` | 布局/字体见 inbox.css；待实测 |
| `29:5832` Vector | 40.6667 / 146.5 / 14.6667 / 6.4167 | `{"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9137254953384399,"g":0.9647058844566345,"b":0.8745098114013672,"a":1.0}}]}` | 布局/字体见 inbox.css；待实测 |
| `29:5833` Text | 69.0 / 136.0 / 91.0 / 32.0 | `{"itemSpacing":2.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5834` Collect replies | 69.0 / 136.0 / 91.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":14.0,"fontWeight":550,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5835` 10 free today | 69.0 / 156.0 / 53.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5568627715110779,"g":0.6549019813537598,"b":0.49803921580314636,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":9.0,"fontWeight":400,"lineHeightPx":12.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5836` Text:align | 168.0 / 139.0 / 128.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5837` Text | 228.0 / 139.0 / 68.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5838` Image:margin | 228.0 / 139.0 / 17.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5839` Image | 219.0 / 139.0 / 26.0 / 26.0 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"8859ee83df64fbfac51ad46086024ecfc66cc448"}],"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.07450980693101883,"g":0.125490203499794,"b":0.09019608050584793,"a":1.0}}],"cornerRadius":13.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5840` Image:margin | 245.0 / 139.0 / 17.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5841` Image | 236.0 / 139.0 / 26.0 / 26.0 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.07450980693101883,"g":0.125490203499794,"b":0.09019608050584793,"a":1.0}}],"cornerRadius":13.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5842` Image:margin | 262.0 / 139.0 / 17.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5843` Image | 253.0 / 139.0 / 26.0 / 26.0 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"88aa54b724abf83cfc87de45abae4968f1c16328"}],"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.07450980693101883,"g":0.125490203499794,"b":0.09019608050584793,"a":1.0}}],"cornerRadius":13.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5844` Italic Text:margin | 279.0 / 139.0 / 17.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5845` Italic Text | 270.0 / 139.0 / 26.0 / 26.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9490196108818054,"b":0.8509804010391235,"a":1.0}}],"cornerRadius":13.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5846` ••• | 279.0 / 146.0 / 8.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.09019608050584793,"g":0.1882352977991104,"b":0.125490203499794,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5847` Bold Text | 304.0 / 144.0 / 17.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":10.0,"paddingLeft":5.0,"paddingRight":5.0,"paddingTop":2.0,"paddingBottom":2.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5848` 3 | 309.5 / 146.0 / 6.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.0784313753247261,"g":0.16078431904315948,"b":0.07058823853731155,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5849` Text | 329.0 / 140.0 / 9.0 / 24.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5850` › | 329.0 / 140.0 / 9.0 / 24.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"font":{"fontFamily":"Fredoka","fontSize":25.0,"fontWeight":400,"lineHeightPx":24.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5851` Container | 24.0 / 200.0 / 327.0 / 451.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5852` Container | 24.0 / 200.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5853` Button | 24.0 / 200.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5854` Image | 24.0 / 218.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5855` Text | 86.0 / 219.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5856` Bold Text | 86.0 / 219.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5857` A cup of tea | 86.0 / 219.5 / 83.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5858` Text | 86.0 / 246.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5859` Thank you for listening. Today feels a little ligh | 86.0 / 246.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5860` Text | 265.0 / 224.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5861` 19:01 | 301.0 / 224.5 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5862` Bold Text | 307.0 / 243.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5863` 1 | 313.0 / 243.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5864` Button - Conversation options · A cup of tea | 331.0 / 227.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5865` ••• | 340.0 / 236.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5866` Container | 24.0 / 284.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5867` Button | 24.0 / 284.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5868` Image | 24.0 / 302.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b64a0a1c1c1f2a5272ce8b547c98f7234319f1dc"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5869` Text | 86.0 / 303.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5870` Bold Text | 86.0 / 303.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5871` Ocean in my headphones | 86.0 / 303.5 / 165.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5872` Text | 86.0 / 330.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5873` Some songs feel like little letters. What have you | 86.0 / 330.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5874` Text | 265.0 / 320.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5875` 18:51 | 302.0 / 320.0 / 21.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5876` Button - Conversation options · Ocean in my headphones | 331.0 / 311.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5877` ••• | 340.0 / 320.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5878` Container | 24.0 / 368.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5879` Button | 24.0 / 368.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5880` Image | 24.0 / 386.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5881` Text | 86.0 / 387.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5882` Bold Text | 86.0 / 387.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5883` Seaside moments | 86.0 / 387.5 / 118.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5884` Text | 86.0 / 414.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5885` Some songs feel like little letters. What have you | 86.0 / 414.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5886` Text | 265.0 / 404.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5887` 18:41 | 301.0 / 404.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5888` Button - Conversation options · Seaside moments | 331.0 / 395.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5889` ••• | 340.0 / 404.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5890` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5891` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-collected-one · 消息 / 收取 1 封，剩余 2 封 (`29:5930`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:5958` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:5959` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5960` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5961` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5962` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5963` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5964` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5965` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5966` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5967` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5968` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5969` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5970` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5971` Button:margin | 24.0 / 124.0 / 327.0 / 76.0 | `{"paddingBottom":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5972` Button | 24.0 / 124.0 / 327.0 / 56.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.07450980693101883,"g":0.125490203499794,"b":0.09019608050584793,"a":1.0}}],"strokes":[{"opacity":0.699999988079071,"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0}}],"cornerRadius":24.0,"itemSpacing":8.0,"paddingLeft":12.0,"paddingRight":12.0,"effects":[{"type":"DROP_SHADOW","visible":true,"color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0},"blendMode":"NORMAL","offset":{"x":0.0,"y":0.0},"radius":0.0,"spread":10.0,"showShadowBehindNode":false}]}` | 布局/字体见 inbox.css；待实测 |
| `29:5973` Text | 37.0 / 141.0 / 24.0 / 22.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5974` Icon | 37.0 / 141.0 / 22.0 / 22.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5975` h2d-svg-use-0 | 37.0 / 141.0 / 22.0 / 22.0 | `{"fills":[{"blendMode":"NORMAL","visible":false,"type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}]}` | 布局/字体见 inbox.css；待实测 |
| `29:5976` Vector | 39.75 / 145.5833 / 16.5 / 12.8333 | `{"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9137254953384399,"g":0.9647058844566345,"b":0.8745098114013672,"a":1.0}}]}` | 布局/字体见 inbox.css；待实测 |
| `29:5977` Vector | 40.6666 / 146.5 / 14.6667 / 6.4167 | `{"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9137254953384399,"g":0.9647058844566345,"b":0.8745098114013672,"a":1.0}}]}` | 布局/字体见 inbox.css；待实测 |
| `29:5978` Text | 69.0 / 136.0 / 91.0 / 32.0 | `{"itemSpacing":2.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5979` Collect replies | 69.0 / 136.0 / 91.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":14.0,"fontWeight":550,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5980` 9 free today | 69.0 / 156.0 / 49.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5568627715110779,"g":0.6549019813537598,"b":0.49803921580314636,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":9.0,"fontWeight":400,"lineHeightPx":12.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5981` Text:align | 168.0 / 139.0 / 128.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5982` Text | 245.0 / 139.0 / 51.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5983` Image:margin | 245.0 / 139.0 / 17.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5984` Image | 236.0 / 139.0 / 26.0 / 26.0 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.07450980693101883,"g":0.125490203499794,"b":0.09019608050584793,"a":1.0}}],"cornerRadius":13.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5985` Image:margin | 262.0 / 139.0 / 17.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5986` Image | 253.0 / 139.0 / 26.0 / 26.0 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"88aa54b724abf83cfc87de45abae4968f1c16328"}],"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.07450980693101883,"g":0.125490203499794,"b":0.09019608050584793,"a":1.0}}],"cornerRadius":13.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5987` Italic Text:margin | 279.0 / 139.0 / 17.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5988` Italic Text | 270.0 / 139.0 / 26.0 / 26.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9490196108818054,"b":0.8509804010391235,"a":1.0}}],"cornerRadius":13.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5989` ••• | 279.0 / 146.0 / 8.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.09019608050584793,"g":0.1882352977991104,"b":0.125490203499794,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5990` Bold Text | 304.0 / 144.0 / 17.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":10.0,"paddingLeft":5.0,"paddingRight":5.0,"paddingTop":2.0,"paddingBottom":2.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5991` 2 | 309.5 / 146.0 / 6.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.0784313753247261,"g":0.16078431904315948,"b":0.07058823853731155,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5992` Text | 329.0 / 140.0 / 9.0 / 24.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5993` › | 329.0 / 140.0 / 9.0 / 24.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"font":{"fontFamily":"Fredoka","fontSize":25.0,"fontWeight":400,"lineHeightPx":24.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:5994` Container | 24.0 / 200.0 / 327.0 / 451.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5995` Container | 24.0 / 200.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:5996` Button | 24.0 / 200.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5997` Image | 24.0 / 218.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"8859ee83df64fbfac51ad46086024ecfc66cc448"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5998` Text | 86.0 / 219.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:5999` Bold Text | 86.0 / 219.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6000` Window-side friend | 86.0 / 219.5 / 132.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6001` Text | 86.0 / 246.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6002` My little plant grew a new leaf today. Thank you f | 86.0 / 246.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6003` Text | 265.0 / 224.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6004` 19:30 | 299.0 / 224.5 / 24.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6005` Bold Text | 307.0 / 243.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6006` 1 | 313.0 / 243.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6007` Button - Conversation options · Window-side friend | 331.0 / 227.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6008` ••• | 340.0 / 236.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6009` Container | 24.0 / 284.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6010` Button | 24.0 / 284.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6011` Image | 24.0 / 302.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6012` Text | 86.0 / 303.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6013` Bold Text | 86.0 / 303.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6014` A cup of tea | 86.0 / 303.5 / 83.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6015` Text | 86.0 / 330.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6016` Thank you for listening. Today feels a little ligh | 86.0 / 330.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6017` Text | 265.0 / 308.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6018` 19:01 | 301.0 / 308.5 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6019` Bold Text | 307.0 / 327.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6020` 1 | 313.0 / 327.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6021` Button - Conversation options · A cup of tea | 331.0 / 311.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6022` ••• | 340.0 / 320.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6023` Container | 24.0 / 368.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6024` Button | 24.0 / 368.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6025` Image | 24.0 / 386.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b64a0a1c1c1f2a5272ce8b547c98f7234319f1dc"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6026` Text | 86.0 / 387.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6027` Bold Text | 86.0 / 387.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6028` Ocean in my headphones | 86.0 / 387.5 / 165.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6029` Text | 86.0 / 414.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6030` Some songs feel like little letters. What have you | 86.0 / 414.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6031` Text | 265.0 / 404.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6032` 18:51 | 302.0 / 404.0 / 21.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6033` Button - Conversation options · Ocean in my headphones | 331.0 / 395.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6034` ••• | 340.0 / 404.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6035` Container | 24.0 / 452.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6036` Button | 24.0 / 452.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6037` Image | 24.0 / 470.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6038` Text | 86.0 / 471.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6039` Bold Text | 86.0 / 471.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6040` Seaside moments | 86.0 / 471.5 / 118.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6041` Text | 86.0 / 498.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6042` Some songs feel like little letters. What have you | 86.0 / 498.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6043` Text | 265.0 / 488.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6044` 18:41 | 301.0 / 488.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6045` Button - Conversation options · Seaside moments | 331.0 / 479.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6046` ••• | 340.0 / 488.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6047` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6048` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-collected-all · 消息 / 全部收完，横条消失 (`29:6089`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:6117` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:6118` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6119` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6120` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6121` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6122` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6123` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6124` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6125` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6126` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6127` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6128` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6129` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6130` Container | 24.0 / 124.0 / 327.0 / 527.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6131` Container | 24.0 / 124.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6132` Button | 24.0 / 124.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6133` Image | 24.0 / 142.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"8859ee83df64fbfac51ad46086024ecfc66cc448"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6134` Text | 86.0 / 143.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6135` Bold Text | 86.0 / 143.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6136` Window-side friend | 86.0 / 143.5 / 132.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6137` Text | 86.0 / 170.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6138` My little plant grew a new leaf today. Thank you f | 86.0 / 170.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6139` Text | 265.0 / 148.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6140` 19:30 | 299.0 / 148.5 / 24.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6141` Bold Text | 307.0 / 167.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6142` 1 | 313.0 / 167.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6143` Button - Conversation options · Window-side friend | 331.0 / 151.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6144` ••• | 340.0 / 160.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6145` Container | 24.0 / 208.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6146` Button | 24.0 / 208.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6147` Image | 24.0 / 226.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6148` Text | 86.0 / 227.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6149` Bold Text | 86.0 / 227.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6150` Little wanderer | 86.0 / 227.5 / 104.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6151` Text | 86.0 / 254.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6152` I took the long way home and watched the sunset. | 86.0 / 254.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6153` Text | 265.0 / 232.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6154` 19:29 | 300.0 / 232.5 / 23.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6155` Bold Text | 307.0 / 251.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6156` 1 | 313.0 / 251.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6157` Button - Conversation options · Little wanderer | 331.0 / 235.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6158` ••• | 340.0 / 244.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6159` Container | 24.0 / 292.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6160` Button | 24.0 / 292.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6161` Image | 24.0 / 310.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"88aa54b724abf83cfc87de45abae4968f1c16328"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6162` Text | 86.0 / 311.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6163` Bold Text | 86.0 / 311.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6164` Waiting for rain | 86.0 / 311.5 / 106.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6165` Text | 86.0 / 338.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6166` A warm cup of tea and a favorite song. | 86.0 / 338.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6167` Text | 265.0 / 316.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6168` 19:28 | 299.0 / 316.5 / 24.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6169` Bold Text | 307.0 / 335.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6170` 1 | 313.0 / 335.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6171` Button - Conversation options · Waiting for rain | 331.0 / 319.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6172` ••• | 340.0 / 328.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6173` Container | 24.0 / 376.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6174` Button | 24.0 / 376.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6175` Image | 24.0 / 394.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6176` Text | 86.0 / 395.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6177` Bold Text | 86.0 / 395.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6178` A cup of tea | 86.0 / 395.5 / 83.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6179` Text | 86.0 / 422.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6180` Thank you for listening. Today feels a little ligh | 86.0 / 422.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6181` Text | 265.0 / 400.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6182` 19:01 | 301.0 / 400.5 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6183` Bold Text | 307.0 / 419.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6184` 1 | 313.0 / 419.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6185` Button - Conversation options · A cup of tea | 331.0 / 403.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6186` ••• | 340.0 / 412.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6187` Container | 24.0 / 460.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6188` Button | 24.0 / 460.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6189` Image | 24.0 / 478.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b64a0a1c1c1f2a5272ce8b547c98f7234319f1dc"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6190` Text | 86.0 / 479.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6191` Bold Text | 86.0 / 479.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6192` Ocean in my headphones | 86.0 / 479.5 / 165.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6193` Text | 86.0 / 506.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6194` Some songs feel like little letters. What have you | 86.0 / 506.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6195` Text | 265.0 / 496.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6196` 18:51 | 302.0 / 496.0 / 21.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6197` Button - Conversation options · Ocean in my headphones | 331.0 / 487.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6198` ••• | 340.0 / 496.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6199` Container | 24.0 / 544.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6200` Button | 24.0 / 544.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6201` Image | 24.0 / 562.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6202` Text | 86.0 / 563.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6203` Bold Text | 86.0 / 563.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6204` Seaside moments | 86.0 / 563.5 / 118.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6205` Text | 86.0 / 590.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6206` Some songs feel like little letters. What have you | 86.0 / 590.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6207` Text | 265.0 / 580.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6208` 18:41 | 301.0 / 580.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6209` Button - Conversation options · Seaside moments | 331.0 / 571.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6210` ••• | 340.0 / 580.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6211` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6212` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-unread · 消息 / 已有未读会话 (`29:6253`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:6281` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:6282` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6283` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6284` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6285` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6286` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6287` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6288` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6289` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6290` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6291` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6292` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6293` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6294` Container | 24.0 / 124.0 / 327.0 / 527.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6295` Container | 24.0 / 124.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6296` Button | 24.0 / 124.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6297` Image | 24.0 / 142.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6298` Text | 86.0 / 143.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6299` Bold Text | 86.0 / 143.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6300` A cup of tea | 86.0 / 143.5 / 83.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6301` Text | 86.0 / 170.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6302` Thank you for listening. Today feels a little ligh | 86.0 / 170.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6303` Text | 265.0 / 148.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6304` 19:01 | 301.0 / 148.5 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6305` Bold Text | 307.0 / 167.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6306` 1 | 313.0 / 167.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6307` Button - Conversation options · A cup of tea | 331.0 / 151.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6308` ••• | 340.0 / 160.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6309` Container | 24.0 / 208.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6310` Button | 24.0 / 208.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6311` Image | 24.0 / 226.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b64a0a1c1c1f2a5272ce8b547c98f7234319f1dc"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6312` Text | 86.0 / 227.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6313` Bold Text | 86.0 / 227.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6314` Ocean in my headphones | 86.0 / 227.5 / 165.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6315` Text | 86.0 / 254.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6316` Some songs feel like little letters. What have you | 86.0 / 254.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6317` Text | 265.0 / 244.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6318` 18:51 | 302.0 / 244.0 / 21.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6319` Button - Conversation options · Ocean in my headphones | 331.0 / 235.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6320` ••• | 340.0 / 244.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6321` Container | 24.0 / 292.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6322` Button | 24.0 / 292.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6323` Image | 24.0 / 310.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6324` Text | 86.0 / 311.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6325` Bold Text | 86.0 / 311.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6326` Seaside moments | 86.0 / 311.5 / 118.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6327` Text | 86.0 / 338.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6328` Some songs feel like little letters. What have you | 86.0 / 338.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6329` Text | 265.0 / 328.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6330` 18:41 | 301.0 / 328.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6331` Button - Conversation options · Seaside moments | 331.0 / 319.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6332` ••• | 340.0 / 328.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6333` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6334` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-read · 消息 / 所有消息已读 (`29:6373`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:6401` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:6402` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6403` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6404` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6405` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6406` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6407` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6408` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6409` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6410` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6411` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6412` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6413` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6414` Container | 24.0 / 124.0 / 327.0 / 527.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6415` Container | 24.0 / 124.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6416` Button | 24.0 / 124.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6417` Image | 24.0 / 142.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6418` Text | 86.0 / 143.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6419` Bold Text | 86.0 / 143.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6420` A cup of tea | 86.0 / 143.5 / 83.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6421` Text | 86.0 / 170.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6422` Thank you for listening. Today feels a little ligh | 86.0 / 170.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6423` Text | 265.0 / 160.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6424` 19:01 | 301.0 / 160.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6425` Button - Conversation options · A cup of tea | 331.0 / 151.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6426` ••• | 340.0 / 160.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6427` Container | 24.0 / 208.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6428` Button | 24.0 / 208.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6429` Image | 24.0 / 226.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b64a0a1c1c1f2a5272ce8b547c98f7234319f1dc"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6430` Text | 86.0 / 227.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6431` Bold Text | 86.0 / 227.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6432` Ocean in my headphones | 86.0 / 227.5 / 165.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6433` Text | 86.0 / 254.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6434` Some songs feel like little letters. What have you | 86.0 / 254.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6435` Text | 265.0 / 244.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6436` 18:51 | 302.0 / 244.0 / 21.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6437` Button - Conversation options · Ocean in my headphones | 331.0 / 235.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6438` ••• | 340.0 / 244.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6439` Container | 24.0 / 292.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6440` Button | 24.0 / 292.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6441` Image | 24.0 / 310.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6442` Text | 86.0 / 311.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6443` Bold Text | 86.0 / 311.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6444` Seaside moments | 86.0 / 311.5 / 118.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6445` Text | 86.0 / 338.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6446` Some songs feel like little letters. What have you | 86.0 / 338.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6447` Text | 265.0 / 328.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6448` 18:41 | 301.0 / 328.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6449` Button - Conversation options · Seaside moments | 331.0 / 319.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6450` ••• | 340.0 / 328.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6451` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6452` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-friends-empty · 好友 / 空状态 (`29:6490`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:6518` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:6519` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6520` Container | 24.0 / 57.5 / 181.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6521` Button | 24.0 / 57.5 / 84.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6522` Messages | 24.0 / 65.5 / 84.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6523` Button | 128.0 / 57.5 / 77.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6524` Friends | 128.0 / 65.5 / 77.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6525` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6526` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6527` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6528` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6529` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6530` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6531` Container | 24.0 / 124.0 / 327.0 / 527.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6532` Container | 24.0 / 124.0 / 327.0 / 267.0 | `{"paddingLeft":8.0,"paddingRight":8.0,"paddingTop":40.0,"paddingBottom":40.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6533` Container | 32.0 / 164.0 / 311.0 / 132.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6534` Image | 131.5 / 164.0 / 112.0 / 112.0 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FIT","imageRef":"9b5df0d71afc787e877d90782e4072be284e0627"}]}` | 布局/字体见 inbox.css；待实测 |
| `29:6535` Heading 3 | 32.0 / 296.0 / 311.0 / 22.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6536` Your circle is just beginning. | 105.0 / 296.0 / 165.0 / 22.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.729411780834198,"g":0.7882353067398071,"b":0.7019608020782471,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":14.0,"fontWeight":550,"lineHeightPx":22.0,"letterSpacing":-0.30000001192092896}}` | 布局/字体见 inbox.css；待实测 |
| `29:6537` Paragraph | 32.0 / 318.0 / 311.0 / 33.0 | `{"paddingTop":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6538` Every connection starts with a little hello. | 86.5 / 330.0 / 202.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.43529412150382996,"g":0.529411792755127,"b":0.4274509847164154,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6539` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6540` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-friends · 好友 / 已关注会话 (`29:6578`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:6606` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:6607` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6608` Container | 24.0 / 57.5 / 181.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6609` Button | 24.0 / 57.5 / 84.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6610` Messages | 24.0 / 65.5 / 84.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6611` Button | 128.0 / 57.5 / 77.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6612` Friends | 128.0 / 65.5 / 77.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6613` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6614` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6615` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6616` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6617` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6618` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6619` Container | 24.0 / 124.0 / 327.0 / 527.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6620` Container | 24.0 / 124.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6621` Button | 24.0 / 124.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6622` Image | 24.0 / 142.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6623` Text | 86.0 / 143.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6624` Bold Text | 86.0 / 143.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6625` A cup of tea | 86.0 / 143.5 / 83.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6626` Text | 86.0 / 170.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6627` Thank you for listening. Today feels a little ligh | 86.0 / 170.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6628` Text | 265.0 / 148.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6629` 19:01 | 301.0 / 148.5 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6630` Bold Text | 307.0 / 167.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6631` 1 | 313.0 / 167.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6632` Button - Conversation options · A cup of tea | 331.0 / 151.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6633` ••• | 340.0 / 160.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6634` Container | 24.0 / 208.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6635` Button | 24.0 / 208.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6636` Image | 24.0 / 226.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b64a0a1c1c1f2a5272ce8b547c98f7234319f1dc"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6637` Text | 86.0 / 227.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6638` Bold Text | 86.0 / 227.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6639` Ocean in my headphones | 86.0 / 227.5 / 165.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6640` Text | 86.0 / 254.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6641` Some songs feel like little letters. What have you | 86.0 / 254.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6642` Text | 265.0 / 244.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6643` 18:51 | 302.0 / 244.0 / 21.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6644` Button - Conversation options · Ocean in my headphones | 331.0 / 235.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6645` ••• | 340.0 / 244.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6646` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6647` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-drawer · 消息 / 右侧菜单 (`29:6686`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:6714` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:6715` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6716` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6717` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6718` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6719` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6720` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6721` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6722` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6723` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6724` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6725` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6726` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6727` Container | 24.0 / 124.0 / 327.0 / 527.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6728` Container | 24.0 / 124.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6729` Button | 24.0 / 124.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6730` Image | 24.0 / 142.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6731` Text | 86.0 / 143.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6732` Bold Text | 86.0 / 143.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6733` A cup of tea | 86.0 / 143.5 / 83.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6734` Text | 86.0 / 170.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6735` Thank you for listening. Today feels a little ligh | 86.0 / 170.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6736` Text | 265.0 / 148.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6737` 19:01 | 301.0 / 148.5 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6738` Bold Text | 307.0 / 167.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6739` 1 | 313.0 / 167.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6740` Button - Conversation options · A cup of tea | 331.0 / 151.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6741` ••• | 340.0 / 160.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6742` Container | 24.0 / 208.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6743` Button | 24.0 / 208.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6744` Image | 24.0 / 226.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b64a0a1c1c1f2a5272ce8b547c98f7234319f1dc"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6745` Text | 86.0 / 227.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6746` Bold Text | 86.0 / 227.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6747` Ocean in my headphones | 86.0 / 227.5 / 165.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6748` Text | 86.0 / 254.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6749` Some songs feel like little letters. What have you | 86.0 / 254.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6750` Text | 265.0 / 244.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6751` 18:51 | 302.0 / 244.0 / 21.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6752` Button - Conversation options · Ocean in my headphones | 331.0 / 235.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6753` ••• | 340.0 / 244.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6754` Container | 24.0 / 292.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6755` Button | 24.0 / 292.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6756` Image | 24.0 / 310.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6757` Text | 86.0 / 311.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6758` Bold Text | 86.0 / 311.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6759` Seaside moments | 86.0 / 311.5 / 118.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6760` Text | 86.0 / 338.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6761` Some songs feel like little letters. What have you | 86.0 / 338.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6762` Text | 265.0 / 328.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6763` 18:41 | 301.0 / 328.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6764` Button - Conversation options · Seaside moments | 331.0 / 319.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6765` ••• | 340.0 / 328.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6766` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6767` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |
| `29:6803` Dialog - Inbox tools | 91.0 / 48.0 / 284.0 / 736.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.09019608050584793,"g":0.14509804546833038,"b":0.10980392247438431,"a":1.0}}],"paddingLeft":20.0,"paddingRight":20.0,"paddingTop":20.0,"paddingBottom":20.0,"effects":[{"type":"DROP_SHADOW","visible":true,"color":{"r":0.0,"g":0.0,"b":0.0,"a":0.2669999897480011},"blendMode":"NORMAL","offset":{"x":-12.0,"y":0.0},"radius":40.0,"showShadowBehindNode":false}]}` | ui-sheet；能力/共用容器差异见总表 |
| `29:6804` Container | 111.0 / 68.0 / 244.0 / 48.0 | `{"paddingBottom":16.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6805` Heading 2 | 111.0 / 71.0 / 91.0 / 26.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6806` Inbox tools | 111.0 / 71.0 / 91.0 / 26.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":550,"lineHeightPx":26.0,"letterSpacing":-0.30000001192092896}}` | 布局/字体见 inbox.css；待实测 |
| `29:6807` Button - Close inbox menu | 323.0 / 68.0 / 32.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6808` × | 333.5 / 69.5 / 11.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.6039215922355652,"g":0.6901960968971252,"b":0.5607843399047852,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6809` Text Input - Search conversations | 111.0 / 116.0 / 244.0 / 44.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.10588235408067703,"g":0.16078431904315948,"b":0.125490203499794,"a":1.0}}],"strokes":[{"opacity":0.03500000014901161,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"cornerRadius":14.0,"paddingLeft":16.0,"paddingRight":16.0}` | 布局/字体见 inbox.css；待实测 |
| `53:2027` Placeholder | 128.0 / 128.0 / 210.0 / 20.0 | `{"fills":[{"opacity":0.46000000834465027,"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6811` Button:margin | 111.0 / 160.0 / 244.0 / 47.0 | `{"paddingTop":8.0,"paddingBottom":16.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6812` Button | 111.0 / 168.0 / 244.0 / 23.0 | `{"fills":[{"opacity":0.07000000029802322,"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0}}],"cornerRadius":12.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6813` Search | 214.5 / 172.0 / 37.0 / 15.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":14.520000457763672,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6814` Container | 111.0 / 207.0 / 244.0 / 377.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6815` Button | 111.0 / 207.0 / 244.0 / 54.0 | `{"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6816` Text | 111.0 / 223.5 / 224.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6817` System messages | 111.0 / 223.5 / 103.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6818` Text | 347.0 / 219.0 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6819` › | 347.0 / 219.0 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6820` Button | 111.0 / 261.0 / 244.0 / 54.0 | `{"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6821` Text | 111.0 / 277.5 / 224.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6822` Interactions | 111.0 / 277.5 / 69.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6823` Text | 347.0 / 273.0 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6824` › | 347.0 / 273.0 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6825` Button | 111.0 / 315.0 / 244.0 / 54.0 | `{"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6826` Text | 111.0 / 331.5 / 224.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6827` New followers | 111.0 / 331.5 / 82.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6828` Text | 347.0 / 327.0 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6829` › | 347.0 / 327.0 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6830` Button | 111.0 / 369.0 / 244.0 / 54.0 | `{"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6831` Text | 111.0 / 385.5 / 224.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6832` Help & support | 111.0 / 385.5 / 89.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6833` Text | 347.0 / 381.0 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6834` › | 347.0 / 381.0 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6835` Button | 111.0 / 423.0 / 244.0 / 54.0 | `{"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6836` Text | 111.0 / 439.5 / 224.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6837` Hidden conversations | 111.0 / 439.5 / 126.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6838` Text | 347.0 / 435.0 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6839` › | 347.0 / 435.0 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6840` Button | 111.0 / 477.0 / 244.0 / 54.0 | `{"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6841` Text | 111.0 / 493.5 / 224.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6842` Preview incoming replies | 111.0 / 493.5 / 144.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6843` Text | 347.0 / 489.0 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6844` › | 347.0 / 489.0 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6845` Button | 111.0 / 531.0 / 244.0 / 53.0 | `{"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6846` Text | 111.0 / 547.5 / 224.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6847` Preview a Home reply | 111.0 / 547.5 / 127.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6848` Text | 347.0 / 543.0 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6849` › | 347.0 / 543.0 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6850` Container | 111.0 / 584.0 / 244.0 / 180.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6851` Container:margin | 111.0 / 584.0 / 244.0 / 116.0 | `{"paddingBottom":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6852` Container | 111.0 / 584.0 / 244.0 / 96.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6853` Button | 111.0 / 584.0 / 116.0 / 96.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.13725490868091583,"g":0.21960784494876862,"b":0.16470588743686676,"a":1.0}}],"cornerRadius":16.0,"paddingLeft":8.0,"paddingRight":8.0,"paddingTop":16.0,"paddingBottom":16.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6854` Container | 119.0 / 604.0 / 100.0 / 32.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6855` ✓ | 161.3516 / 612.0 / 17.0 / 24.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7450980544090271,"g":0.8627451062202454,"b":0.6627451181411743,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":20.0,"fontWeight":400,"lineHeightPx":24.200000762939453,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6856` Text | 119.0 / 636.0 / 100.0 / 24.0 | `{"paddingTop":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6857` Mark all as read | 132.5 / 644.0 / 73.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.6235294342041016,"g":0.7137255072593689,"b":0.5607843399047852,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6858` Button | 239.0 / 584.0 / 116.0 / 96.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.13725490868091583,"g":0.21960784494876862,"b":0.16470588743686676,"a":1.0}}],"cornerRadius":16.0,"paddingLeft":8.0,"paddingRight":8.0,"paddingTop":16.0,"paddingBottom":16.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6859` Container | 247.0 / 600.0 / 100.0 / 24.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6860` ⌫ | 284.8594 / 600.0 / 24.0 / 24.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7450980544090271,"g":0.8627451062202454,"b":0.6627451181411743,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":20.0,"fontWeight":400,"lineHeightPx":24.200000762939453,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6861` Text | 247.0 / 624.0 / 100.0 / 40.0 | `{"paddingTop":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6862` Clear conversation list | 247.0 / 632.0 / 100.0 / 32.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.6235294342041016,"g":0.7137255072593689,"b":0.5607843399047852,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6863` Container | 111.0 / 700.0 / 244.0 / 64.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6864` Button | 111.0 / 716.0 / 244.0 / 48.0 | `{"fills":[{"opacity":0.03500000014901161,"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0}}],"strokes":[{"opacity":0.23000000417232513,"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0}}],"cornerRadius":24.0,"itemSpacing":10.0,"paddingLeft":12.0,"paddingRight":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6865` Notification settings | 160.0 / 729.0 / 146.0 / 22.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7921568751335144,"g":0.8941176533699036,"b":0.7098039388656616,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":16.0,"fontWeight":600,"lineHeightPx":22.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |

### inbox-search · 消息 / 搜索匹配 (`29:6870`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:6898` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:6899` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6900` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6901` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6902` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6903` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6904` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6905` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6906` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6907` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6908` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6909` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6910` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6911` Container | 24.0 / 124.0 / 327.0 / 475.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6912` Container | 24.0 / 124.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6913` Button | 24.0 / 124.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6914` Image | 24.0 / 142.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6915` Text | 86.0 / 143.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6916` Bold Text | 86.0 / 143.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6917` A cup of tea | 86.0 / 143.5 / 83.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6918` Text | 86.0 / 170.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:6919` Thank you for listening. Today feels a little ligh | 86.0 / 170.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6920` Text | 265.0 / 148.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6921` 19:01 | 301.0 / 148.5 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6922` Bold Text | 307.0 / 167.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6923` 1 | 313.0 / 167.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6924` Button - Conversation options · A cup of tea | 331.0 / 151.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6925` ••• | 340.0 / 160.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6926` Button | 24.0 / 599.0 / 327.0 / 52.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":13.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6927` Clear search | 153.0 / 623.5 / 69.0 / 15.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.6000000238418579,"g":0.6901960968971252,"b":0.5254902243614197,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":14.520000457763672,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:6928` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6929` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-search-empty · 消息 / 搜索无结果 (`29:6968`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:6996` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:6997` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6998` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:6999` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7000` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7001` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7002` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7003` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7004` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7005` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7006` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7007` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7008` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7009` Container | 24.0 / 124.0 / 327.0 / 475.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7010` Container | 24.0 / 124.0 / 327.0 / 267.0 | `{"paddingLeft":8.0,"paddingRight":8.0,"paddingTop":40.0,"paddingBottom":40.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7011` Container | 32.0 / 164.0 / 311.0 / 132.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7012` Image | 131.5 / 164.0 / 112.0 / 112.0 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FIT","imageRef":"9b5df0d71afc787e877d90782e4072be284e0627"}]}` | 布局/字体见 inbox.css；待实测 |
| `29:7013` Heading 3 | 32.0 / 296.0 / 311.0 / 22.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7014` No conversations found. | 114.5 / 296.0 / 146.0 / 22.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.729411780834198,"g":0.7882353067398071,"b":0.7019608020782471,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":14.0,"fontWeight":550,"lineHeightPx":22.0,"letterSpacing":-0.30000001192092896}}` | 布局/字体见 inbox.css；待实测 |
| `29:7015` Paragraph | 32.0 / 318.0 / 311.0 / 33.0 | `{"paddingTop":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7016` Every connection starts with a little hello. | 86.5 / 330.0 / 202.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.43529412150382996,"g":0.529411792755127,"b":0.4274509847164154,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7017` Button | 24.0 / 599.0 / 327.0 / 52.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":13.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7018` Clear search | 153.0 / 623.5 / 69.0 / 15.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.6000000238418579,"g":0.6901960968971252,"b":0.5254902243614197,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":14.520000457763672,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7019` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7020` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-options · 会话 / 更多操作 (`29:7059`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:7087` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:7088` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7089` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7090` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7091` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7092` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7093` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7094` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7095` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7096` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7097` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7098` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7099` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7100` Container | 24.0 / 124.0 / 327.0 / 527.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7101` Container | 24.0 / 124.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7102` Button | 24.0 / 124.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7103` Image | 24.0 / 142.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7104` Text | 86.0 / 143.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7105` Bold Text | 86.0 / 143.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7106` A cup of tea | 86.0 / 143.5 / 83.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7107` Text | 86.0 / 170.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7108` Thank you for listening. Today feels a little ligh | 86.0 / 170.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7109` Text | 265.0 / 148.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7110` 19:01 | 301.0 / 148.5 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7111` Bold Text | 307.0 / 167.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7112` 1 | 313.0 / 167.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7113` Button - Conversation options · A cup of tea | 331.0 / 151.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7114` ••• | 340.0 / 160.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7115` Container | 24.0 / 208.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7116` Button | 24.0 / 208.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7117` Image | 24.0 / 226.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b64a0a1c1c1f2a5272ce8b547c98f7234319f1dc"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7118` Text | 86.0 / 227.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7119` Bold Text | 86.0 / 227.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7120` Ocean in my headphones | 86.0 / 227.5 / 165.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7121` Text | 86.0 / 254.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7122` Some songs feel like little letters. What have you | 86.0 / 254.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7123` Text | 265.0 / 244.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7124` 18:51 | 302.0 / 244.0 / 21.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7125` Button - Conversation options · Ocean in my headphones | 331.0 / 235.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7126` ••• | 340.0 / 244.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7127` Container | 24.0 / 292.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7128` Button | 24.0 / 292.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7129` Image | 24.0 / 310.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7130` Text | 86.0 / 311.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7131` Bold Text | 86.0 / 311.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7132` Seaside moments | 86.0 / 311.5 / 118.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7133` Text | 86.0 / 338.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7134` Some songs feel like little letters. What have you | 86.0 / 338.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7135` Text | 265.0 / 328.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7136` 18:41 | 301.0 / 328.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7137` Button - Conversation options · Seaside moments | 331.0 / 319.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7138` ••• | 340.0 / 328.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7139` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7140` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |
| `29:7176` Dialog | 12.0 / 462.0 / 351.0 / 326.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.0941176488995552,"g":0.12941177189350128,"b":0.11764705926179886,"a":1.0}}],"strokes":[{"opacity":0.0430000014603138,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"cornerRadius":24.0,"paddingLeft":20.0,"paddingRight":20.0,"paddingTop":12.0,"paddingBottom":20.0,"effects":[{"type":"DROP_SHADOW","visible":true,"color":{"r":0.0,"g":0.0,"b":0.0,"a":0.5329999923706055},"blendMode":"NORMAL","offset":{"x":0.0,"y":-50.0},"radius":100.0,"showShadowBehindNode":false}]}` | ui-sheet；能力/共用容器差异见总表 |
| `29:7177` Container:margin | 33.0 / 475.0 / 309.0 / 4.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7178` Container | 169.5 / 475.0 / 36.0 / 4.0 | `{"fills":[{"opacity":0.15700000524520874,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7179` Container | 33.0 / 479.0 / 309.0 / 48.0 | `{"paddingTop":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7180` Heading 2 | 104.0 / 495.0 / 167.0 / 24.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7181` Conversation options | 104.0 / 495.0 / 167.0 / 24.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":18.0,"fontWeight":550,"lineHeightPx":24.0,"letterSpacing":-0.30000001192092896}}` | 布局/字体见 inbox.css；待实测 |
| `29:7182` Button - Close | 310.0 / 479.0 / 44.0 / 44.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7183` × | 326.5 / 486.5 / 11.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5568627715110779,"g":0.5882353186607361,"b":0.5882353186607361,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7184` Container | 33.0 / 527.0 / 309.0 / 240.0 | `{"paddingTop":16.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7185` Button | 33.0 / 543.0 / 309.0 / 56.0 | `{"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7186` Text | 33.0 / 560.5 / 289.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7187` Pin conversation | 33.0 / 560.5 / 96.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7188` Text | 334.0 / 556.0 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7189` › | 334.0 / 556.0 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7190` Button | 33.0 / 599.0 / 309.0 / 56.0 | `{"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7191` Text | 33.0 / 616.5 / 289.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7192` Mark as read | 33.0 / 616.5 / 77.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7193` Text | 334.0 / 612.0 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7194` › | 334.0 / 612.0 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7195` Button | 33.0 / 655.0 / 309.0 / 56.0 | `{"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7196` Text | 33.0 / 672.5 / 289.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7197` Hide conversation | 33.0 / 672.5 / 105.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7198` Text | 334.0 / 668.0 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7199` › | 334.0 / 668.0 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7200` Button | 33.0 / 711.0 / 309.0 / 56.0 | `{"itemSpacing":12.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7201` Text | 33.0 / 729.0 / 289.0 / 20.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7202` Report or block | 33.0 / 729.0 / 91.0 / 20.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":20.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7203` Text | 334.0 / 724.5 / 8.0 / 29.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7204` › | 334.0 / 724.5 / 8.0 / 29.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.48627451062202454,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":24.0,"fontWeight":400,"lineHeightPx":29.040000915527344,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |

### inbox-pinned · 会话 / 已置顶并静音 (`29:7209`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:7237` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:7238` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7239` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7240` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7241` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7242` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7243` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7244` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7245` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7246` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7247` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7248` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7249` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7250` Container | 24.0 / 124.0 / 327.0 / 527.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7251` Container | 24.0 / 124.0 / 327.0 / 90.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7252` Button | 24.0 / 124.0 / 327.0 / 90.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7253` Image | 24.0 / 145.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7254` Text | 86.0 / 146.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7255` Bold Text | 86.0 / 146.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7256` A cup of tea ⌁ | 86.0 / 146.5 / 95.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7257` Text | 86.0 / 173.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7258` Thank you for listening. Today feels a little ligh | 86.0 / 173.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7259` Text | 265.0 / 136.0 / 58.0 / 66.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7260` 19:01 | 301.0 / 136.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7261` Bold Text | 307.0 / 155.0 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7262` 1 | 313.0 / 155.0 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7263` ♧ | 308.0 / 178.0 / 15.0 / 19.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":16.0,"fontWeight":400,"lineHeightPx":19.360000610351562,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7264` Button - Conversation options · A cup of tea | 331.0 / 151.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7265` ••• | 340.0 / 160.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7266` Container | 24.0 / 214.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7267` Button | 24.0 / 214.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7268` Image | 24.0 / 232.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b64a0a1c1c1f2a5272ce8b547c98f7234319f1dc"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7269` Text | 86.0 / 233.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7270` Bold Text | 86.0 / 233.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7271` Ocean in my headphones | 86.0 / 233.5 / 165.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7272` Text | 86.0 / 260.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7273` Some songs feel like little letters. What have you | 86.0 / 260.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7274` Text | 265.0 / 250.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7275` 18:51 | 302.0 / 250.0 / 21.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7276` Button - Conversation options · Ocean in my headphones | 331.0 / 241.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7277` ••• | 340.0 / 250.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7278` Container | 24.0 / 298.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7279` Button | 24.0 / 298.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7280` Image | 24.0 / 316.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7281` Text | 86.0 / 317.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7282` Bold Text | 86.0 / 317.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7283` Seaside moments | 86.0 / 317.5 / 118.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7284` Text | 86.0 / 344.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7285` Some songs feel like little letters. What have you | 86.0 / 344.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7286` Text | 265.0 / 334.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7287` 18:41 | 301.0 / 334.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7288` Button - Conversation options · Seaside moments | 331.0 / 325.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7289` ••• | 340.0 / 334.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7290` Paragraph | 24.0 / 651.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7291` Sample conversations · Stored on this device | 88.5 / 675.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |

### inbox-hidden · 隐藏会话 / 有记录 (`29:7330`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:7358` Section | 0.0 / 48.0 / 375.0 / 764.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"paddingBottom":28.0}` | 页头48/64，内容112，导航716 |
| `29:7359` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":16.0,"paddingRight":16.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7360` Button - Back | 16.0 / 59.5 / 40.0 / 40.0 | `{"cornerRadius":20.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7361` Icon | 25.0 / 68.5 / 22.0 / 22.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7362` h2d-svg-use-0 | 25.0 / 68.5 / 22.0 / 22.0 | `{"fills":[{"blendMode":"NORMAL","visible":false,"type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}]}` | 布局/字体见 inbox.css；待实测 |
| `29:7363` Vector | 31.4165 / 73.0833 / 6.4167 / 12.8333 | `{"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8784313797950745,"g":0.9176470637321472,"b":0.8549019694328308,"a":1.0}}]}` | 布局/字体见 inbox.css；待实测 |
| `29:7364` Heading 1 | 68.0 / 67.5 / 239.0 / 24.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7365` Hidden conversations | 108.0 / 67.5 / 159.0 / 24.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":17.0,"fontWeight":550,"lineHeightPx":24.0,"letterSpacing":-0.30000001192092896}}` | 布局/字体见 inbox.css；待实测 |
| `29:7366` Text | 319.0 / 59.5 / 40.0 / 40.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7367` Container | 0.0 / 112.0 / 375.0 / 672.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":24.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7368` Paragraph | 24.0 / 136.0 / 327.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7369` Restore a conversation to your Inbox. | 24.0 / 136.0 / 215.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.6078431606292725,"g":0.6980392336845398,"b":0.5764706134796143,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":13.0,"fontWeight":400,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7370` Container | 24.0 / 157.0 / 327.0 / 104.0 | `{"itemSpacing":12.0,"paddingTop":40.0,"paddingBottom":16.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7371` Image | 24.0 / 197.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7372` Text | 84.0 / 213.5 / 190.0 / 15.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7373` A cup of tea | 84.0 / 213.5 / 66.0 / 15.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":14.520000457763672,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7374` Button | 286.0 / 203.0 / 65.0 / 36.0 | `{"fills":[{"opacity":0.03500000014901161,"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0}}],"strokes":[{"opacity":0.23000000417232513,"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0}}],"cornerRadius":24.0,"paddingLeft":12.0,"paddingRight":12.0,"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7375` Restore | 299.0 / 214.5 / 39.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7921568751335144,"g":0.8941176533699036,"b":0.7098039388656616,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":500,"lineHeightPx":13.3100004196167,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |

### inbox-hidden-empty · 隐藏会话 / 空状态 (`29:7416`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:7444` Section | 0.0 / 48.0 / 375.0 / 764.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"paddingBottom":28.0}` | 页头48/64，内容112，导航716 |
| `29:7445` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":16.0,"paddingRight":16.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7446` Button - Back | 16.0 / 59.5 / 40.0 / 40.0 | `{"cornerRadius":20.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7447` Icon | 25.0 / 68.5 / 22.0 / 22.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7448` h2d-svg-use-0 | 25.0 / 68.5 / 22.0 / 22.0 | `{"fills":[{"blendMode":"NORMAL","visible":false,"type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}]}` | 布局/字体见 inbox.css；待实测 |
| `29:7449` Vector | 31.4165 / 73.0833 / 6.4167 / 12.8333 | `{"strokes":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8784313797950745,"g":0.9176470637321472,"b":0.8549019694328308,"a":1.0}}]}` | 布局/字体见 inbox.css；待实测 |
| `29:7450` Heading 1 | 68.0 / 67.5 / 239.0 / 24.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7451` Hidden conversations | 108.0 / 67.5 / 159.0 / 24.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":17.0,"fontWeight":550,"lineHeightPx":24.0,"letterSpacing":-0.30000001192092896}}` | 布局/字体见 inbox.css；待实测 |
| `29:7452` Text | 319.0 / 59.5 / 40.0 / 40.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7453` Container | 0.0 / 112.0 / 375.0 / 672.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":24.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7454` Container | 24.0 / 136.0 / 327.0 / 267.0 | `{"paddingLeft":8.0,"paddingRight":8.0,"paddingTop":40.0,"paddingBottom":40.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7455` Container | 32.0 / 176.0 / 311.0 / 132.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7456` Image | 131.5 / 176.0 / 112.0 / 112.0 | `{"fills":[{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FIT","imageRef":"9b5df0d71afc787e877d90782e4072be284e0627"}]}` | 布局/字体见 inbox.css；待实测 |
| `29:7457` Heading 3 | 32.0 / 308.0 / 311.0 / 22.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7458` No hidden conversations. | 112.0 / 308.0 / 151.0 / 22.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.729411780834198,"g":0.7882353067398071,"b":0.7019608020782471,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":14.0,"fontWeight":550,"lineHeightPx":22.0,"letterSpacing":-0.30000001192092896}}` | 布局/字体见 inbox.css；待实测 |
| `29:7459` Paragraph | 32.0 / 330.0 / 311.0 / 33.0 | `{"paddingTop":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7460` Every connection starts with a little hello. | 86.5 / 342.0 / 202.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.43529412150382996,"g":0.529411792755127,"b":0.4274509847164154,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |

### inbox-notifications-off · 消息 / 通知提醒条 (`29:7501`)

| 节点 / 元素 | x/y/w/h | 颜色、字体、圆角、间距、阴影 | 对照 |
|---|---|---|---|
| `29:7529` Section | 0.0 / 48.0 / 375.0 / 668.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}]}` | 页头48/64，内容112，导航716 |
| `29:7530` Header | 0.0 / 48.0 / 375.0 / 64.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.05098039284348488,"g":0.09019608050584793,"b":0.07450980693101883,"a":1.0}}],"strokes":[{"opacity":0.027000000700354576,"blendMode":"NORMAL","type":"SOLID","color":{"r":1.0,"g":1.0,"b":1.0,"a":1.0}}],"itemSpacing":12.0,"paddingLeft":24.0,"paddingRight":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7531` Container | 24.0 / 57.5 / 185.0 / 44.0 | `{"itemSpacing":20.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7532` Button | 24.0 / 57.5 / 101.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7533` Messages | 24.0 / 65.5 / 101.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.929411768913269,"g":0.9647058844566345,"b":0.9058823585510254,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":23.0,"fontWeight":550,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7534` Button | 145.0 / 57.5 / 64.0 / 44.0 | `{"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7535` Friends | 145.0 / 65.5 / 64.0 / 28.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.48627451062202454,"g":0.572549045085907,"b":0.5215686559677124,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":19.0,"fontWeight":500,"lineHeightPx":28.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7536` Button - Inbox menu | 315.0 / 59.5 / 36.0 / 40.0 | `{"itemSpacing":5.0,"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7537` Italic Text | 322.5 / 71.207 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7538` Italic Text | 322.5 / 78.4023 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7539` Italic Text | 322.5 / 85.5977 / 21.0 / 2.1953 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.9098039269447327,"g":0.9529411792755127,"b":0.8705882430076599,"a":1.0}}],"cornerRadius":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7540` Bold Text | 340.0 / 66.5 / 6.0 / 6.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":3.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7541` Container | 0.0 / 112.0 / 375.0 / 604.0 | `{"paddingLeft":24.0,"paddingRight":24.0,"paddingTop":12.0,"paddingBottom":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7542` Container | 24.0 / 124.0 / 327.0 / 469.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7543` Container | 24.0 / 124.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7544` Button | 24.0 / 124.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7545` Image | 24.0 / 142.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"3fca58b2a7abdc1531a649aec4824a9695a50129"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7546` Text | 86.0 / 143.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7547` Bold Text | 86.0 / 143.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7548` A cup of tea | 86.0 / 143.5 / 83.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7549` Text | 86.0 / 170.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7550` Thank you for listening. Today feels a little ligh | 86.0 / 170.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7551` Text | 265.0 / 148.5 / 58.0 / 35.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7552` 19:01 | 301.0 / 148.5 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7553` Bold Text | 307.0 / 167.5 / 16.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"cornerRadius":8.0,"paddingLeft":4.0,"paddingRight":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7554` 1 | 313.0 / 167.5 / 4.0 / 16.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.08235294371843338,"g":0.19607843458652496,"b":0.10196078568696976,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":700,"lineHeightPx":16.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7555` Button - Conversation options · A cup of tea | 331.0 / 151.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7556` ••• | 340.0 / 160.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7557` Container | 24.0 / 208.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7558` Button | 24.0 / 208.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7559` Image | 24.0 / 226.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"b64a0a1c1c1f2a5272ce8b547c98f7234319f1dc"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7560` Text | 86.0 / 227.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7561` Bold Text | 86.0 / 227.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7562` Ocean in my headphones | 86.0 / 227.5 / 165.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7563` Text | 86.0 / 254.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7564` Some songs feel like little letters. What have you | 86.0 / 254.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7565` Text | 265.0 / 244.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7566` 18:51 | 302.0 / 244.0 / 21.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7567` Button - Conversation options · Ocean in my headphones | 331.0 / 235.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7568` ••• | 340.0 / 244.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7569` Container | 24.0 / 292.0 / 327.0 / 84.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7570` Button | 24.0 / 292.0 / 327.0 / 84.0 | `{"itemSpacing":14.0,"paddingRight":28.0,"paddingTop":12.0,"paddingBottom":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7571` Image | 24.0 / 310.0 / 48.0 / 48.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.1411764770746231,"g":0.1921568661928177,"b":0.16470588743686676,"a":1.0}},{"blendMode":"NORMAL","type":"IMAGE","scaleMode":"FILL","imageRef":"4f871563171200aca624c0a3534454b4b712fc56"}],"cornerRadius":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7572` Text | 86.0 / 311.5 / 165.0 / 45.0 | `{"itemSpacing":6.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7573` Bold Text | 86.0 / 311.5 / 165.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7574` Seaside moments | 86.0 / 311.5 / 118.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8941176533699036,"g":0.9372549057006836,"b":0.8509804010391235,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":15.0,"fontWeight":550,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7575` Text | 86.0 / 338.5 / 165.0 / 18.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7576` Some songs feel like little letters. What have you | 86.0 / 338.5 / 165.0 / 18.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5254902243614197,"g":0.5921568870544434,"b":0.5490196347236633,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":12.0,"fontWeight":400,"lineHeightPx":18.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7577` Text | 265.0 / 328.0 / 58.0 / 12.0 | `{"itemSpacing":7.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7578` 18:41 | 301.0 / 328.0 / 22.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5490196347236633,"g":0.6274510025978088,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7579` Button - Conversation options · Seaside moments | 331.0 / 319.0 / 28.0 / 32.0 | `{"paddingLeft":6.0,"paddingRight":6.0,"paddingTop":1.0,"paddingBottom":1.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7580` ••• | 340.0 / 328.5 / 10.0 / 13.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.47058823704719543,"g":0.5607843399047852,"b":0.501960813999176,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":11.0,"fontWeight":400,"lineHeightPx":13.3100004196167,"letterSpacing":1.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7581` Paragraph | 24.0 / 593.0 / 327.0 / 41.0 | `{"paddingTop":24.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7582` Sample conversations · Stored on this device | 88.5 / 617.0 / 198.0 / 17.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.4470588266849518,"g":0.5215686559677124,"b":0.4431372582912445,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":17.0,"letterSpacing":0.0}}` | 未实现：真实服务端数据不能标本地样例 |
| `29:7583` Container:margin | 24.0 / 634.0 / 327.0 / 58.0 | `{"paddingTop":12.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7584` Container | 24.0 / 646.0 / 327.0 / 46.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.13333334028720856,"g":0.1882352977991104,"b":0.14901961386203766,"a":1.0}}],"cornerRadius":12.0,"itemSpacing":8.0,"paddingLeft":10.0,"paddingRight":10.0,"paddingTop":8.0,"paddingBottom":8.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7585` Text | 34.0 / 659.5 / 15.0 / 19.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7586` ♧ | 34.0 / 659.5 / 15.0 / 19.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.7098039388656616,"g":0.9803921580314636,"b":0.43921568989753723,"a":1.0},"boundVariables":{"color":{"type":"VARIABLE_ALIAS","id":"VariableID:7:4"}}}],"font":{"fontFamily":"Fredoka","fontSize":16.0,"fontWeight":400,"lineHeightPx":19.360000610351562,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7587` Paragraph | 57.0 / 658.5 / 211.0 / 21.0 | `{}` | 布局/字体见 inbox.css；待实测 |
| `29:7588` Keep up with replies | 57.0 / 658.5 / 90.0 / 21.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.6196078658103943,"g":0.6941176652908325,"b":0.5803921818733215,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":21.0,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7589` Button | 276.0 / 659.0 / 40.0 / 20.0 | `{"paddingLeft":4.0,"paddingRight":4.0,"paddingTop":4.0,"paddingBottom":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7590` Enable | 280.0 / 663.0 / 32.0 / 12.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.8274509906768799,"g":0.9019607901573181,"b":0.7764706015586853,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":10.0,"fontWeight":400,"lineHeightPx":12.100000381469727,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |
| `29:7591` Button - Dismiss notification reminder | 324.0 / 654.0 / 17.0 / 30.0 | `{"paddingLeft":4.0,"paddingRight":4.0,"paddingTop":4.0,"paddingBottom":4.0}` | 布局/字体见 inbox.css；待实测 |
| `29:7592` × | 328.0 / 658.0 / 9.0 / 22.0 | `{"fills":[{"blendMode":"NORMAL","type":"SOLID","color":{"r":0.5058823823928833,"g":0.5803921818733215,"b":0.47843137383461,"a":1.0}}],"font":{"fontFamily":"Fredoka","fontSize":18.0,"fontWeight":400,"lineHeightPx":21.780000686645508,"letterSpacing":0.0}}` | 布局/字体见 inbox.css；待实测 |

## 待 Smith / 后续验收

- 3x 图片清晰度待 Smith 提供3x图后同路径替换。
- A4 并排图与差异比例待 R01/R04 恢复后补。
- 沙箱允许本地服务及 PostgreSQL 后重跑全部回归，生成17张截图及计算样式实测；完成 A2/A3/A7。
- 决定如何协调共用控件与旧 JSON 几何差异、隐藏恢复行、选项/抽屉业务能力差距。
- 导航未读角标数据接入待后续，不伪造未读状态。

## 提交与推送

尚无新提交 SHA。已尝试 `git add`，失败：`.git/index.lock: Read-only file system`；当前环境将 `.git` 挂载为只读，无法提交。已尝试 `git push origin codex/r09-inbox`，失败：`Could not resolve hostname github.com`。没有切分支或合并任何分支。

`npx playwright test tests/r09-inbox.spec.ts --list` 成功列出3个测试，三条流程合计包含17个状态；这是用例发现检查，不是运行通过。

工作区另有 R07/R08 截图与 base.css 的变化，不纳入本任务交付；本任务没有执行写入这些文件的命令，未将其覆盖。
