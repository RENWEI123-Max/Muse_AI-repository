# R05 共用外壳与组件验收记录

分支：`codex/r05-shell`；基线：`281b4bc`。实现提交：`ecc0338`（本文随后独立提交，以便记录该提交号）。

唯一设计来源：本地 `/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`。未调用 Figma API，未读取或使用 API token。共享画框 `30:2`：MauGo / Shared components。

## 范围与迁移方式

`main.ts` 顺序为 tokens → base → components → styles → fidelity。三处导航均采用 nav / button.main-nav__item / img，同一元素类型；当前页由 aria-current=page 表示。所有旧 id、data-state、aria-label 保留，script setup 未改。Profile 原本没有文本节点，补用已有 tr(Home/Messages/Profile)；设计没有可见文字，统一字号/行高为 0，读屏仍保留原标签或按钮文本。

共享组件使用 ui-* opt-in 类，为后续页面迁移提供基础；本次接入外壳与导航，旧页面按钮、弹层等留待各页任务迁移。旧导航规则已移除。四个 *.legacy-*.css 保存从三个 Vue 提出的原有 scoped 块，通过 `<style scoped src>` 加载，内容原样保留，不当作已迁移样式；避免为零 hex 检查给非 R05 页面批量新增 token。小屏媒体查询保留，移除其插画 scale(.85)，仅保留位移。

## 差距表

| 元素 | 本地 JSON | 旧代码 | 本次 |
| --- | --- | --- | --- |
| 状态栏 | 高 57.827999114990234（R02 token 为另一实例 57.828125） | fidelity 60 | 使用 --status-height，差 0.000126 |
| 横条 | 144×5，x=115.5，y=799，白色 | 外壳 144×5 但旧白色 F3F4F4；页面还重复定义 132×4 | base 统一外壳白条，旧页面条隐藏；形状使用现有本地 home-indicator-dark.svg 的 alpha mask，无新增猜测圆角 |
| 导航底 | 375×96，纯色 0D1812，无圆角/描边 | 首页半透明渐变、圆角24、1px 顶边；Inbox/Profile 0D1713 | 纯色 --bg-nav |
| 导航图标 | 三个42×42；x=52.25/166.5/280.75，局部 y=25.5 | padding-top16，最小项宽64；旧底层图标42×34 | 项与图标42×42，精确网格 |
| 导航文字 | 无 TEXT 节点 | Home/Inbox 文字节点；Profile 无 | 保留可访问名称，统一隐藏可见文字 |
| 主/次按钮 | 150/165×48，圆角30，内边距12，gap10，600 16/22 | 旧主按钮14/500，Refresh宽48等页面覆盖 | ui-button 定义；页面应用由 R06 处理 |
| 图标按钮 | 44×44，圆角22；内图25×25，水平渐变 | 旧页面底白色透明层 | ui-icon-button 定义 |
| 页头 | 64高；返回40×40，x16/y59.5，圆角20，透明底 | Profile 标题19、返回宽32；各页不同 | ui-header 定义，未改各页 |
| 卡片/行 | 卡片327宽，圆角16；1px描边1%；左右16+边框；行293×56，图22 | 页面各自定义 | ui-card / ui-row |
| 弹层 | x12/y260，351×528；圆角24，描边4.3%；拖条36×4，x169.5/y273 | 旧样式层叠，阴影近似53% | ui-sheet使用精确 token，后续页面接入 |

## 六变体与首页实例实测

坐标相对各导航组件自身；三个有未读变体业务端均无现有导航角标渲染状态，明确标为未通过/待后续（待 Smith 确认数据接入范围），测试 skip，不注入 DOM 伪造。

| 节点 | 名称 | 几何 | 直接子元素相对坐标 |
| --- | --- | --- | --- |
| 43:1912 | Tab bar / Active=home, Unread=false | 375.0×96.0 | home: 52.25, 25.5, 42.0, 42.0; inbox: 166.5, 25.5, 42.0, 42.0; profile: 280.75, 25.5, 42.0, 42.0 |
| 43:1945 | Tab bar / Active=home, Unread=true | 375.0×96.0 | home: 52.25, 25.5, 42.0, 42.0; inbox: 166.5, 25.5, 42.0, 42.0; profile: 280.75, 25.5, 42.0, 42.0; Unread: 203.5, 18.0, 5.0, 5.0 |
| 43:1979 | Tab bar / Active=inbox, Unread=false | 375.0×96.0 | home: 52.25, 25.5, 42.0, 42.0; inbox: 166.5, 25.5, 42.0, 42.0; profile: 280.75, 25.5, 42.0, 42.0 |
| 43:2012 | Tab bar / Active=inbox, Unread=true | 375.0×96.0 | home: 52.25, 25.5, 42.0, 42.0; inbox: 166.5, 25.5, 42.0, 42.0; profile: 280.75, 25.5, 42.0, 42.0; Unread: 203.5, 18.0, 5.0, 5.0 |
| 43:2046 | Tab bar / Active=profile, Unread=false | 375.0×96.0 | home: 52.25, 25.5, 42.0, 42.0; inbox: 166.5, 25.5, 42.0, 42.0; profile: 280.75, 25.5, 42.0, 42.0 |
| 43:2079 | Tab bar / Active=profile, Unread=true | 375.0×96.0 | home: 52.25, 25.5, 42.0, 42.0; inbox: 166.5, 25.5, 42.0, 42.0; profile: 280.75, 25.5, 42.0, 42.0; Unread: 203.5, 18.0, 5.0, 5.0 |
| 43:3334 | Main navigation | 375.0×96.0 | home: 52.25, 25.5, 42.0, 42.0; inbox: 166.5, 25.5, 42.0, 42.0; profile: 280.75, 25.5, 42.0, 42.0 |
| 43:3367 | Main navigation | 375.0×96.0 | home: 52.25, 25.5, 42.0, 42.0; inbox: 166.5, 25.5, 42.0, 42.0; profile: 280.75, 25.5, 42.0, 42.0 |
| 43:3400 | Main navigation | 375.0×96.0 | home: 52.25, 25.5, 42.0, 42.0; inbox: 166.5, 25.5, 42.0, 42.0; profile: 280.75, 25.5, 42.0, 42.0 |

上述六变体全部同底色 --bg-nav、无描边/圆角、无文字；未读点为5×5、--accent。首页三个实例均位于画框 y=716。

## 未列出值与补充节点证据

以下原始值直接取 JSON；画框内 x/y/w/h（保留小数），不使用计划四舍五入值。确认框、输入、开关、空状态及胶囊在指定主节点没有完整样本，补读同一 JSON 下 R02 已引用的节点及其邻近控件，未调用接口。

| 节点 | 元素 | x / y / w / h | radius | 自动布局 padding L/T/R/B; gap |
| --- | --- | --- | --- | --- |
| 35:3568 | refresh | 24.112998962402344 / 644.0 / 150.0 / 48.0 | 30.0 | 12.0 / — / 12.0 / —; 10.0 |
| 35:3574 | compose | 186.11300659179688 / 644.0 / 165.0 / 48.0 | 30.0 | 12.0 / — / 12.0 / —; 10.0 |
| 35:3621 | magic | 251.0 / 60.0 / 44.0 / 44.0 | 22.0 | — / — / — / —; — |
| 35:3622 | Icon / vector | 260.5 / 69.5 / 25.0 / 25.0 | — | — / — / — / —; — |
| 35:3626 | settings | 307.0 / 60.0 / 44.0 / 44.0 | 22.0 | — / — / — / —; — |
| 34:2029 | header | 0.0 / 48.0 / 375.0 / 64.0 | — | — / — / — / —; — |
| 34:2030 | page-back | 16.0 / 59.5 / 40.0 / 40.0 | 20.0 | — / — / — / —; — |
| 34:1922 | div | 24.0 / 136.0 / 327.0 / 170.0 | 16.0 | — / — / — / —; — |
| 34:1923 | account-security | 41.0 / 137.0 / 293.0 / 56.0 | — | — / — / — / —; — |
| 36:2012 | sheet | 12.0 / 260.0 / 351.0 / 528.0 | 24.0 | — / — / — / —; — |
| 36:2013 | div | 169.5 / 273.0 / 36.0 / 4.0 | 4.0 | — / — / — / —; — |
| 36:2014 | div | 33.0 / 285.0 / 309.0 / 40.0 | — | — / — / — / —; — |
| 36:2019 | sheet-content | 33.0 / 341.0 / 309.0 / 426.0 | — | — / — / — / —; — |
| 36:2063 | city | 33.0 / 611.0 / 309.0 / 48.0 | 12.0 | 16.0 / — / 16.0 / —; 12.0 |
| 36:2068 | save-filters | 33.0 / 719.0 / 309.0 / 48.0 | 24.0 | 12.0 / — / 12.0 / —; 10.0 |
| 29:7923 | Dialog | 24.0 / 210.25 / 327.0 / 391.5 | 28.0 | 24.0 / 28.0 / 24.0 / 16.0; — |
| 35:2678 | auth-email | 24.0 / 261.0 / 327.0 / 48.0 | 12.0 | 16.0 / — / 16.0 / —; — |
| 36:2584 | motion-switch | 303.0 / 626.0 / 38.0 / 22.0 | 11.0 | — / — / — / —; — |
| 53:2014 | Off | 306.0 / 629.0 / 16.0 / 16.0 | — | — / — / — / —; — |
| 35:1930 | online-status | 297.0 / 210.5 / 38.0 / 22.0 | 11.0 | — / — / — / —; — |
| 53:2102 | On | 316.0 / 213.5 / 16.0 / 16.0 | — | — / — / — / —; — |
| 29:13686 | Button - My diamonds | 24.0 / 65.5 / 49.0 / 28.0 | 14.0 | 10.0 / — / 10.0 / —; 5.0 |
| 29:13688 | 0 | 57.0 / 73.5 / 6.0 / 12.0 | — | — / — / — / —; — |
| 29:5650 | Every connection starts with a little hello. | 86.5 / 330.0 / 202.0 / 21.0 | — | — / — / — / —; — |
| 36:2083 | Vector | 115.5 / 799.0 / 144.0 / 5.0 | — | — / — / — / —; — |

弹层的拖条 CSS top=12px（加容器1px边框为相对13）；padding 24px 20px 20px，内部标题行 x33/y285、宽309。sheet-content 从 y341 开始，具体表单排布留给筛选页。JSON 此 sheet effects=[]，通用 ui-sheet 按任务要求使用 R02 的 --shadow-sheet（来源其他弹层，alpha 0.5329999923706055），并非声称该节点带此 effect。确认框采用29:7923的327宽、圆角28、精确渐变 --grad-card 和描边；不把 sheet 的24圆角套到确认框。

补充精确 token：--shell-indicator=#FFFFFF（36:2083）；--dialog-border=rgb(213 234 197 / 0.10000000149011612)（29:7923）；--text-empty=rgb(111 135 109 / 1)（29:5650）；--switch-on-thumb=#16321B（53:2102）。--font-family-ko 是现有字体栈别名；--font-nav 是无可见文字的隐藏字体组，并非声称 Figma 有0px文字。其余169个R02属性未修改。

## R05 依赖的 token 名

`--accent`、`--bg-card`、`--bg-chip`、`--bg-input`、`--bg-nav`、`--bg-page`、`--bg-sheet`、`--blur-backdrop`、`--dialog-border`、`--font-body`、`--font-body-letter-spacing`、`--font-button`、`--font-button-letter-spacing`、`--font-caption-21`、`--font-caption-21-letter-spacing`、`--font-family-ko`、`--font-micro`、`--font-micro-letter-spacing`、`--font-nav`、`--font-title-page-medium`、`--font-title-page-medium-letter-spacing`、`--grabber`、`--grad-card`、`--grad-icon-btn`、`--grad-primary`、`--grad-secondary`、`--hairline-card`、`--hairline-strong`、`--icon-muted`、`--nav-height`、`--radius-11`、`--radius-12`、`--radius-14`、`--radius-16`、`--radius-20`、`--radius-22`、`--radius-24`、`--radius-28`、`--radius-30`、`--radius-4`、`--radius-8`、`--scrim`、`--scrim-dialog`、`--shadow-dialog`、`--shadow-sheet`、`--shell-indicator`、`--status-height`、`--switch-off-thumb`、`--switch-off-track`、`--switch-on-thumb`、`--text-empty`、`--text-on-accent`、`--text-primary`

## 验收证据

- A1：`cd client && npm run build` 退出码0。素材校验343 PNG / SHA256 / 尺寸 / 字体许可证通过，vue-tsc 通过，Vite 6.41s。
- A2/A3：`tests/r05-shell.spec.ts` 从真实登录进入首页→消息→我的，逐页检查 navigation boundingBox、三项及三图的 boundingBox（容差≤1px），完整对比背景、尺寸、字体族/字号/字重/行高/字距/颜色、内边距、gap、对齐、边框/圆角等 computed style。等待入场动画完成后取值，不修改业务状态或 DOM。另断言外壳375×812、状态栏高、横条144×5 / bottom8 / 白色。无未读三变体通过；有未读三变体 skip，**未通过/待后续**。
- A5：指定两份CSS和三个Vue的 hex=0、rgb=0、!important=0；旧 styles/fidelity/home/inbox 中旧导航选择器=0；新CSS的 `.device ` 提权前缀=0；引用token无缺失；script setup及迁出的旧scoped块内容与281b4bc一致；`git diff --check`通过。
- A6：最终整组 **12通过 / 4失败 / 3跳过**（2.4m，退出码1），不能标记全部验收通过。个人资料原有数据桩问题见下；不修改业务逻辑或放宽其断言来掩盖失败。
- A4：保存三页实现截图（`test-results/r05-nav-0.png`、`r05-nav-1.png`、`r05-nav-2.png`），computed style 作为 Playwright JSON附件 `navigation-computed-styles`。最终单独复跑导航：1通过 / 3跳过（9.1s）。本任务未运行R04差异率或导出任何Figma图片，不声称全页像素验收通过。

补充：底部横条的 JSON 只提供 vector 外接框，不含路径/圆角；现有本地SVG保留其形状，mask定位−7px来自父图高20、父图y792与vector y799之差，不另估圆角。个人资料原有120px导航滚动留白作为定位规则迁到components，避免底部内容被固定导航挡住。

最终整组分项：

| 文件 | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| client.spec.ts | 2 | 0 | 0 |
| home.spec.ts | 1 | 0 | 0 |
| inbox.spec.ts | 5 | 1 | 0 |
| d4.spec.ts | 3 | 3 | 0 |
| r05-shell.spec.ts | 1（遍历3页） | 0 | 3（未读） |

导航实测：容器 x0/y716/375×96、背景 rgb(13,24,18)、无背景图、顶边0；三图 x52.25/166.5/280.75、y741.5、42×42；按钮文字0px/400/0行高、颜色rgb(132,146,136)。三页逐项computed style相等，字体族也纳入对比。测试截图前等待几何稳定。

消息最终整组的失败点：`inbox-hidden-empty` 预期未达成，实际仍为 `inbox-hidden`；相同原用例在之前两轮分别通过（完整 inbox 文件6/6通过），最终整组仍按失败记录，不宣称其来源已确定。单独复跑该原用例 **1/1通过（28.7s）**，但保留最终整组的失败数。

### 回归失败与基线对照

对**未改动的281b4bc源码副本**（复用现有依赖和素材，独立Vite根目录）单独执行原 `d4.spec.ts`：**3通过 / 3失败**。以下三项失败在基线与R05中一致：

1. `D4 editing, avatar gallery, remove, restore, crop, persistence and full slots`：保存后没有返回资料页，页面报 `p.avatars is not iterable`；测试的广泛API数据桩未给出现有Profile API所需结构。
2. `D4 public profile and chat gate open`：预期 public-follow enabled，实际 disabled；已有资料/会话数据桩与现有逻辑不一致。
3. `D4 public full content, photo previews, own image cards and outgoing visits`：预期 `25 · Seoul`，实际资料区为空。

因此A6“全部通过”仍为**未通过/待 Smith**。本任务不改这些数据协议或业务逻辑。初跑还发现导航迁移丢失滚动留白，已恢复并单独复跑该用例通过；导航初跑在入场动画中采样，已改为等待稳定几何后断言，通过后再跑整组。

### 复跑

默认端口空闲时：

```sh
cd client
npm run build
npx playwright test tests/r05-shell.spec.ts tests/home.spec.ts tests/inbox.spec.ts tests/d4.spec.ts tests/client.spec.ts --workers=1
```

本机3001被其他服务占用，默认命令在启动阶段拒绝复用该服务。验收使用临时 `.r05-run` 测试副本和 `r05-run.config.ts`，仅替换端口（3001→3105，5173→5185），保持原测试断言与后端实现；测试仍创建独立临时PostgreSQL库。临时目录/配置运行后清理，不提交。可在client目录执行以下准备脚本后，将上面的测试命令改为 `npx playwright test --config r05-run.config.ts r05-shell.spec.ts home.spec.ts inbox.spec.ts d4.spec.ts client.spec.ts --workers=1`：

```python
from pathlib import Path
Path('.r05-run').mkdir(exist_ok=True)
for p in Path('tests').iterdir():
    if p.is_file():
        Path('.r05-run', p.name).write_text(p.read_text().replace('3001', '3105'))
s = Path('playwright.config.ts').read_text()
s = s.replace("'./tests'", "'./.r05-run'")
s = s.replace('tests/auth-server.mjs', '.r05-run/auth-server.mjs')
s = s.replace('3001', '3105').replace('5173', '5185')
Path('r05-run.config.ts').write_text(s)
```

首次沙箱内运行被本地IPC权限限制（tsx管道EPERM）；以获批的本地测试执行权限运行成功启动。未连接生产数据库，未停止既有3001服务。
