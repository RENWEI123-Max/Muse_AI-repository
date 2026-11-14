import json
from pathlib import Path
out=Path(__file__).parent
runs=json.loads((out/'walkthrough.json').read_text());run=next(r for r in runs if r['height']==812 and r['lang']=='en');checks=[]
for state,selector,index,target in [('settings-home','ui-header',0,[0,48,375,64]),('settings-home','',0,[68,67.5,239,24]),('settings-home','settings-group settings-main ui-card',0,[24,136,327,170]),('settings-home','settings-group settings-main ui-card',1,[24,326,327,114]),('settings-home','settings-group settings-main ui-card',2,[24,460,327,170]),('language-en','',1,[24,181,327,56]),('language-en','',2,[24,249,327,56]),('general','clear-cache',0,[40,316,295,56]),('cache-confirm','settings-confirm settings-cache ui-dialog',0,[24,287,327,238])]:
 step=next(s for s in run['steps'] if s.get('state')==state);e=[e for e in step['elements'] if e['selector']==selector][index];actual=list(e['box'].values());delta=[round(a-b,4) for a,b in zip(actual,target)];checks.append(dict(state=state,selector=selector,target=target,actual=actual,delta=delta,within1px=all(abs(d)<=1 for d in delta)))
(out/'geometry-checks.json').write_text(json.dumps(checks,indent=2))
comparison=json.loads((out/'comparisons.json').read_text())
rows='\n'.join('| '+x['state']+' | '+f"{100*x['differenceRatio']:.4f}%"+' | [并排](r21/compare-'+x['state']+'.png) |' for x in comparison)
shots='\n'.join('- ['+p.name+'](r21/'+p.name+')' for p in sorted(out.glob('*.png')) if not p.name.startswith('compare-'))
report='''# R21 设置结果

执行结论：**未通过／待 Smith**。这是限定为样式与模板的部分实现，不能称为 11 态完成。四项验收均未完全通过；D6 未执行成功；8 个状态有真实预览入口截图，3 个认证隐私状态缺失。

## 基线与范围

- `origin/main` 基线 `6b17f34`；分支 `codex/r21-settings`，不合入 main。
- Mac mini 本地执行；长任务在 `r21-settings` tmux 中运行。进程检查仅发现本任务一个 `codex exec --approve-for-me`。没有再启动 Codex，没有使用 Issue、Telegram 或 Figma API/token。
- 修改 `SettingsFlow.vue` 模板及新建 `styles/pages/settings.css`。为了满足“整模块替换，删旧规则”，额外仅删除 `styles.css` 和 `fidelity.css` 中旧 settings/language 覆盖规则。这两个文件没有加入新样式。
- script 内容与基线逐字一致；保留原 id、aria-label，未触碰登录、会话、支付、token 或账户存储。没有新增文案。沿用既有 3x 资源与 asset()；资产构建校验通过。

## 原型摘录

直接解析 `~/maugo-design/MauGo.html` 的 `window.__ATLAS_BUNDLE__`，读取内嵌 features.js/CSS；完整相关函数与 CSS 在 [prototype-excerpts.txt](r21/prototype-excerpts.txt)。11 节点的几何、字体、颜色等本地 Figma 摘录保存在 `r21/34-*.json`、`r21/35-*.json`。

- 主设置：3/2/3 行分组；另外有 Sign out 与 Delete account。进入子页、Back 返回。Figma 分组 `(24,136,327,170)`、`(24,326,327,114)`、`(24,460,327,170)`。Sign out 为 400 13/15.73，颜色 D9A48E（现有 text-danger token）。
- 语言：英文/韩文两选项；点击立即保存语言并重渲染。说明在 y136，选项 y181/249，高56，圆角14。
- 隐私：全局可见范围、online、visits、privacy screen、blocked people；可见范围为底部 sheet，点击 Everyone/Friends/Only me 后立即保存并关闭。
- 通知：总开关 + Replies、Home reply banners、Likes、New followers、Sound；总开关关闭时禁用子开关。
- 通用：Haptics、Personalized recommendations、Use system font、Clear temporary cache；cache 弹窗确认/取消/关闭。原型的 cache 删除分支实际为 `if(false)`，仅显示 toast；当前产品实际删除 maugo-temp-* Cache Storage，保留现有行为。
- CSS：round 缩0.94，actions button 缩0.96，tool-button 按压变 accent；sheet-in 0.3s ease-out，菜单内容内部滚动。

## 实现与冲突／缺口

已实施：48px 状态区、64px 共享 header/back、Figma 分组和语言选项几何、tokens 字体颜色圆角、共享 ui-card/ui-row/ui-switch/ui-dialog、38×22 开关、页面切换和弹层过渡、圆按钮0.94/其他按钮0.96反馈。完整旧 scoped CSS 已迁至 pages/settings.css，删除旧全局模块规则。

以下冲突不自行改变业务逻辑，交 Smith 决定：

1. 现有主设置没有 Sign out/Delete account 的行为，不能只加可点假按钮；本轮没有新增。
2. 隐私现有实现为服务器全局 profile + 逐 image card 权限；没有原型 online/visits/privacy screen/blocked controls。现有可见范围要求 Save，原型立即保存。保留现有流程、保存按钮、说明和错误信息，无法做到原型294px高 sheet。
3. 现有通知仅 incoming/replies/system 三子项，原型五子项；没有新增虚假的偏好绑定。因此通知内容、组高度与 Figma 不同。
4. 当前缓存说明包括账户、钱包、权限，比原型更长；现有确认按钮为 Clear temporary cache，原型为 Confirm；保留原文与行为，英文弹窗258px，Figma238px。通用页还有设备支持、推荐状态说明，位置不能完全一致。
5. general-font 的 Figma 标题为 Gowun Dodum 400；当前样式保留标题 token 权重500，字体族切换到既有 GowunDodum token，有样式差异。
6. 韩文原有说明与原型措辞不同，保留现有翻译；无新增字符串。
7. 本模块新增样式 hex=0、important=0、device前缀=0、未定义 token=0；仓库其它旧 CSS 仍有114个 hex 字面量，未越界清理，不能宣称全仓为0。

## 真实流程走查

[walkthrough.mjs](r21/walkthrough.mjs) 通过实际欢迎页 Explore → Profile → Settings 点击进入，**未注入 token、未拦截 API、未伪造用户/接口/数据库数据**。本机没有配置测试数据库、没有3001后端，无法真实注册、登录或获取隐私资料，因此以下均为真实预览入口验证，不等同真实账号验收。逐步实际文案、几何、滚动、反馈见 [walkthrough.json](r21/walkthrough.json)。

375×812/en、375×812/ko、375×667/en、375×667/ko 四组均执行：

1. 进入 Settings，显示三组8行；短屏在 settings-body 内滚动到中部/底部。
2. 进入 Language，点击另一个语言选项，标题、说明、勾选立即变化；切回当前语言，Back 回主设置。
3. 进入 Notifications，关闭总开关，3个现有子开关禁用且变淡；重新打开，Back。
4. 进入 General，systemFont 勾选，字体族切换；取消勾选。
5. Clear cache → Cancel，弹窗关闭；再次打开 → Confirm，弹窗关闭并显示“没有临时缓存”的本地化结果。没有测试账户/持久缓存数据，不能宣称账户数据保护或非空缓存回归通过。
6. Privacy 点击后资料请求实际 ECONNREFUSED，界面显示本地化加载失败；未展示 profile/card 假数据。Back 可返回。privacy/visibility/only-me 三个目标状态无法认证走查。
7. 实测菜单行 pointer-down transform matrix 对应0.96。其余效果覆盖见下表。

## 四项验收

| 验收 | 结果 | 证据与限制 |
| --- | --- | --- |
| 静态 | **未通过／待 Smith** | build、资产校验、vue-tsc、diff --check通过；主设置分组、header、语言选项等测量见 geometry-checks.json；缺少控件、通知结构、字体权重、缓存高度等不符合，不满足所有元素≤1px/全部计算样式完全一致。D6启动失败，未跑过测试。 |
| 流程 | **未通过／待 Smith** | 8个状态通过真实预览入口可达操作；3个认证隐私状态无法验证，且即时保存、通知分类、signout/delete等现有行为不符合原型。 |
| 效果 | **未通过／待 Smith** | 有0.94/0.96按压、开关色/位置过渡、页面淡入横移、弹窗0.3s上移淡入；实测一类菜单按压。隐私sheet无法真实验证；没有逐个元素/设备触觉/原型动画运行时对照，不能称全覆盖。 |
| 滑动与文案 | **未通过／待 Smith** | 已测四组中整页/模块根不滚，短屏仅settings-body滚动，提供中/底截图；已采样元素无横向溢出。无显式“下面还有”提示；平滑性仅程序滚动可达，未做真人触屏体验；隐私三态和全部文案截断无法验收。 |

## 效果明细

| 元素/效果 | 现状 |
| --- | --- |
| Back 圆按钮 | CSS0.94；未逐语言逐屏pointer-down采样 |
| 菜单行、语言选项、弹层按钮 | CSS0.96，菜单行真实pointer-down采样0.96 |
| 开关 | 共用38×22 ui-switch；标签按压时input缩0.96；共用开关目前没有thumb滑动transition，未完全还原原型动画 |
| 页面切换 | 原有settings-page opacity/translate过渡保留；截图等待500ms稳定 |
| 弹层 | 0.3s opacity/translateY，隐私保留Save流程，不是完整原型sheet-in |
| 工具按钮变色 | 本11态没有对应tool-button；其他模块未修改 |
| reduced-motion | 样式禁用过渡动画；未单独做浏览器模拟验收 |
| haptics | 桌面不可用时现有逻辑禁用；未验证原生触觉 |

## 测试环境与阻塞

- `npm run build` 完成：[build.log](r21/build.log)。
- `npx playwright test --config tests/d6-round3.config.ts` 含全部四个 d6*.spec.ts；原配置测试服务器在3179启动前因 `Database connection unavailable` 失败：[d6.log](r21/d6.log)。**0个测试执行，不能报通过。** 没改原测试或数据库配置，没启动3000测试后端。
- 真实预览前端5351，明确 `MAUGO_API_TARGET=http://127.0.0.1:3001`，与3000隔离；真实隐私请求连接拒绝见 preview.log。没有数据库URL、psql/PostgreSQL安装或独立3001后端，无法创建真实账号/复用真实登录会话。
- 待 Smith：提供可用独立测试数据库/真实注册环境；决定缺失原型业务能力的后续授权范围；解决上述文案/行为/字体差异后再完整验收。没有使用参考图充当实现截图。

## R01 并排比较

真实812px英文流程截图与本地R01 1x图对照，左Figma、右实现。只报告精确RGBA不同像素比例（含状态栏与字体光栅差异），**不设通过阈值**。language-ko为实际点击切换到韩文后的截图。

| 状态 | 不同像素比例 | 并排图 |
| --- | --- | --- |
'''+rows+'''

详细指标：[comparisons.json](r21/comparisons.json)。privacy三态缺失，无对应比较。这里只比较8态，不能宣称11态视觉通过。

## 截图清单

以下40张均为本轮真实浏览器PNG：8状态×双语×两高度=32；隐私加载失败诊断4；短屏主设置中/底4。另有8张并排图。缺失目标截图：privacy、privacy-visibility、privacy-only-me；加载失败图不计作这些目标态。

'''+shots+'\n'
(out.parent/'R21-result.md').write_text(report)
print('report written;',len(checks),'geometry samples;',len(list(out.glob('*.png'))),'PNGs')
