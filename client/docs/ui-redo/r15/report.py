from pathlib import Path
import json,struct
out=Path(__file__).parent
states=json.loads((out.parents[2]/'tests/module01.json').read_text())
base={x['state']:x['elements'] for x in json.loads((out/'baseline-computed.json').read_text())}
targets=json.loads((out/'assertion-targets.json').read_text())
frames=dict(zip([s['id'] for s in states],json.loads((out/'figma-nodes.json').read_text()).keys()))
manifest=[];rows=[];gaps=[]
for state in states:
 id=state['id'];p=out/(id+'.png');entry={'state':id,'exists':p.exists()}
 if p.exists():entry['dimensions']=list(struct.unpack('>II',p.read_bytes()[16:24]));assert entry['dimensions']==[375,812]
 manifest.append(entry);rows.append(f"| {id} | {frames[id]} | "+(f'[PNG](r15/{id}.png)' if p.exists() else '**不存在；未发码，待 Smith**')+' |')
 def fmt(b):return ', '.join(f'{k}={v:.2f}' for k,v in b.items())
 for sel,t in targets[id].items():
  b=base.get(id,{}).get(sel,{}).get('box')
  gaps.append(f"| {id} / `{sel}` / {t['node']} | {fmt(t['box'])} | {fmt(b) if b else '未实测/该态未触发'} |")
(out/'screenshots.json').write_text(json.dumps(manifest,indent=2))
doc='''# R15 登录与欢迎验收

分支 `codex/r15-auth`。先成功 `git fetch origin`，确认 `origin/codex/r14-safety` 和现存 R15 分支均为 `b0814ebb81b7844c74ad3a1f77990e5c17190501`，再切到 R15；没有向其他分支提交或合入 main。

**本轮未全部通过：A1/A5/A8 通过，A2/A3/A4/A6/A7 未通过。19 张目标截图中真实存在 18 张；缺 verify-resend。最终安全UI专项及 client 回归（排除受限的demo登录）共 5 通过、0 失败；最近一次含demo登录的五项轮次为4通过1失败，真实后端返回Rate limit exceeded。不代表 auth.spec.ts 和 f06.spec.ts 全过。**

唯一设计源为本地 `/root/maugo-figma/maugo-file-full.json`，版本 `2421258509127695554`；[来源及 SHA256](r15/source.json)。未调用 Figma API、未使用 token、未请求图片接口、未重导或修改现有 1x 图片。3x 替换待 Smith，路径保持。

## 先量与基线

[extract.py](r15/extract.py) 提取全部十九画框：[完整节点 JSON](r15/figma-nodes.json)、[逐元素测量](r15/figma-measurements.txt)，包括相对画框 x/y/宽高、填充/描边/阴影、圆角、字体/行高/字距、自动布局间距和内边距。并非只量下表中的关键框。

基线在修改样式前完成生产构建，再以未修改的基线 dist 测量；见 [baseline-build.log](r15/baseline-build.log)、[baseline-tests-retry.log](r15/baseline-tests-retry.log)、[baseline-computed.json](r15/baseline-computed.json)。基线命令 `R15_BASELINE=1 npx playwright test -c tests/r15.config.ts r15-auth.spec.ts -g 'safe auth' --workers=1`，1通过。最初默认配置因3001端口占用未启动，见 [baseline-tests.log](r15/baseline-tests.log)，随后使用独立5295预览端口，不停止既有服务。

基线采集器给各表单路由带了固定 `email=reader@example.com`，因此基线名称中的 empty 只能用于布局比较，不能证明空值内容；本轮最终截图已修正为只有 verify/recovery 带 email，signin/signup/forgot 空态确实为空。基线 verify-error 为本地三位码格式校验；本轮最终 verify-error 为固定非种子邮箱的真实六位错误码服务端校验，两者错误文案不同，不把基线图当作同内容像素参考。基线旧CSS在 [baseline-styles.css](r15/baseline-styles.css)、[baseline-fidelity.css](r15/baseline-fidelity.css) 留档。

| 元素 | JSON 目标与实测基线 | 本轮处理 |
|---|---|---|
| 字标 | 94×24.54；基线94×24.53125已达1px容差 | 显式固定宽高，不把已正确几何声称为修复 |
| 主标题 | x24 y136，327×32；条款y128；500 24/32、字距−.3、228/239/217；欢迎500 26/32 | 基线多数550且243/244/244；改为JSON字体、颜色；条款原y136改128 |
| 输入框 | x24，327×48，r12，32/47/36；文字13/20 | 基线几何、底色、圆角已正确；原文字14px、验证码25px/字距12；统一13/20、零字距 |
| 条款区域/复选框 | 容器x24 y213 327×350；框x24 y583 18×18；继续y619 | 原y229/599/635、框20×20；本轮全部到目标 |
| 登录错误 | x24 y677 327×46，r12；背景99/57/45 alpha .2，字233/179/159，12/20 | 原y620；改几何和准确token，原校验保留 |
| 注册 | 输入y261/361/461/561；主按钮y705；隐私链接y815.5；错误y910 | 仍保留滚动；补已有隐私入口，错误位置对齐；额外保存滚动到底部的错误图 |
| 验证/找回 | code x24 y451 327×48；主按钮y589；错误y765 | 保留真实邮件图标和地址；验证码不再25px大字距；不发送邮件、不改密 |
| 新密码错误 | x24 y681 327×46 | 原y626；按目标调整错误间距，提交只触发现有密码不一致校验 |
| Apple邮箱选项 | x24 y394/462，327×56、r14，底34/48/38；选中accent描边与文字 | 原y400/470、h58；现在目标几何成立，只切换现有选项，不调用Apple |
| 隐私 | 标题y136，说明y184/271，Back x24 y353 327×48 | 保留真实隐私占位与说明，不复制Figma“纯本地预览”虚假描述；补Back按钮复用现有back行为；文字段落不完全一致 |

以下逐态关键框差距来自JSON与真实基线；完整颜色、字体、半径与间距见逐元素测量，不能将关键框表当作全元素验收通过。

| 状态 / 元素 / 节点 | JSON x/y/w/h | b0814eb 浏览器基线 |
|---|---|---|
'''+ '\n'.join(gaps)+'''

## 实现、断言与边界

- 十九态页面规则集中于 `src/styles/pages/auth.css`；从 styles.css/fidelity.css 删除原认证规则。AuthFlow没有scoped块。共用按钮、图标按钮、输入框、复选框和Apple选项外观变体仅在 components.css，页面只定位这些控件。
- App.vue/AuthFlow.vue 的 `<script setup>` 与基线逐字一致；所有原id/data-state/aria-label保留。只改认证模板与class，补注册隐私入口和隐私页Back，均复用现有处理函数，没有新增文案。HomeFlow及R06–R14模板/样式未改。旧 language-options 留作 SettingsFlow 的既有样式，Auth改用独立auth-options，不破坏设置页。
- [r15-auth.spec.ts](../../tests/r15-auth.spec.ts) 保留实际进入步骤、boundingBox断言和getComputedStyle断言；[assertion-targets.json](r15/assertion-targets.json) 保存对应Figma节点与原值；[implementation-computed.json](r15/implementation-computed.json) 保存十八态计算样式和关键框。关键框断言按绝对差≤1px，字体/颜色/圆角断言按完全相等，不拿容器宽度冒充文字墨迹宽度。
- 真实数据：已填写登录/注册邮箱采用 `mina@maugo.demo`，不提交注册；验证/找回界面使用既有固定 `reader@example.com`。错误验证码只对这个非种子邮箱提交000000做真实校验，不发码、不重置密码、不注入Vue状态、不伪造响应。新密码只做本地不一致校验。Sign in with Apple只展示选项，不调用真实Apple或取消API。
- verify-resend必须点击发码才会产生倒计时。按约束不触发，也不用mock回执伪造该态，缺图并记待Smith。Apple两个UI态可正常进入截图；原生授权和真实邮箱获取未通过/待Smith，HTTP demo不可验证。
- 韩文优先GowunDodum；有375×812及375×700真实图。小屏媒体查询只调位置与滚动，不缩放图片；不作Figma像素比较。
- 直接使用的渐变token：`--grad-primary-height-48`、`--auth-orbit`（本地JSON 35:3040缺失的径向渐变，按原值补到tokens.css）；ui-button/ui-icon-button基类还引用 `--grad-primary` / `--grad-icon-btn`，认证变体覆盖。没有创造近似渐变或改原渐变名。缺失颜色与字体按JSON原值补token；已有完全相同token直接复用。
- 本任务所改两个组件的脚本没有需保留的业务颜色字面量。范围外原业务脚本颜色未改，不以清grep为由修改逻辑。

## A1–A8

| 项 | 结果 | 证据与限制 |
|---|---|---|
| A1 构建 | 通过 | `cd client && VITE_API_BASE_URL=/api npm run build`，退出0；343素材、vue-tsc、vite通过；[build.log](r15/build.log) |
| A2 几何 | 未通过/待Smith | 十八态所采集关键框（字标、标题、首输入、条款、Apple选项、错误框）≤1px断言通过；没有完成十九态所有关键元素断言，verify-resend未进入；真实法律/隐私文案及验证缺省说明与原型不同 |
| A3 样式 | 未通过/待Smith | 标题颜色/500字重/字号/32行高/−.3字距，输入颜色/r12/13px断言通过；全部计算属性已存档，但未穷尽十九态每元素每属性完全相等。真实文案、缺省placeholder/验证说明与Figma仍有差异 |
| A4 截图对照 | 未通过/待R01/R04 | 实现图18张；没有正式Figma导出并排图，不拿仓库离线原型图冒充，不编差异比例 |
| A5 架构 | 通过（本任务范围） | [audit.py](r15/audit.py)、[architecture-audit.txt](r15/architecture-audit.txt)：pages/components/base颜色字面量、important、device前缀均0；认证旧规则0；页面选择器最多两级且以页面根开头；脚本逐字一致、原标识保留、HomeFlow不变 |
| A6 回归 | 未通过/待Smith | 最终R15安全专项3项、client.spec.ts原回归2项，共5通过0失败（排除demo登录）；最近demo登录因真实限流失败，之前登录/原跳转曾通过；auth.spec.ts三项及f06.spec.ts一项含受限操作而未执行，不能标全过；具体见下 |
| A7 十九态覆盖 | 未通过/待Smith | 18/19经既有路径真实进入并生成375×812 PNG；verify-resend缺失。注册错误在画框下方，另附真实滚动错误图；不冒充额外目标态 |
| A8 如实 | 通过 | 缺图、受限用例、基线采集限制、历史失败、UI与真实后端文案差异均列明，无伪造截图、数据、回执或通过数 |

## 测试记录

最终安全UI命令 `npx playwright test -c tests/r15.config.ts r15-auth.spec.ts client.spec.ts --grep-invert 'seed demo login' --workers=1`，最终日志 [final-verified.log](r15/final-verified.log)，**5通过0失败**。包括十八态专项、韩文/小屏专项、验证/找回/Apple页头返回及隐私Back取消路径、welcome/语言/preview回归、343素材加载回归。取消路径断言认证API调用为0。

最近包含真实demo登录的轮次为 **4通过1失败**：`R15 seed demo login keeps existing navigation` 等待登录完成失败，页面真实alert为`Rate limit exceeded`，见 [final-demo-rate-limit.log](r15/final-demo-rate-limit.log) 与 [页面证据](r15/demo-rate-limit-context.md)。没有清除限流、换身份绕过或篡改数据库。此前 [release-tests.log](r15/release-tests.log)、[release-tests-retry.log](r15/release-tests-retry.log)、[final-tests.log](r15/final-tests.log) 中真实 `mina@maugo.demo` / `Test2026!` 登录及原有跳转均曾通过；最新失败不能据此忽略。没有修改任何种子密码。最终安全UI轮次显式排除此登录测试，不把5通过说成完整六项全通过。

未执行原认证测试（只枚举，文件未改）：

1. auth.spec.ts / `19 prototype states`：包含发码成功mock及重发点击；本轮不使用模拟成功回执证明目标态。[枚举](r15/auth-tests-list.log)
2. auth.spec.ts / `real database signup, SMTP failure, wrong code, logout and login`：实际注册后自动发码，违反本轮只做UI及不发码约束。
3. auth.spec.ts / `empty validation and honest Apple error`：调用真实/auth/apple，违反只做Apple UI约束。
4. f06.spec.ts / `F06 wrong code, expired code and resend invalidates old code`：发送与重发验证码，违反本轮不发码约束。[枚举](r15/f06-tests-list.log)

上述四项是未执行，不是运行失败，也不是通过；本轮不能声称auth.spec.ts/f06.spec.ts全过。没有用替代专项冒充它们。其他模块整套客户端测试含发信、举报、支付等操作，未扩展执行；本轮客户端回归范围为现有client.spec.ts两项。

历史轮次：[release-tests.log](r15/release-tests.log) 为4通过1失败，初版断言错误地把验证码也期望14px，实际旧代码25px；对照JSON发现所有表单输入均13px后修正实现与断言；[release-tests-retry.log](r15/release-tests-retry.log) 为5通过；[final-tests.log](r15/final-tests.log) 为扩展关键框断言后5通过。后续补隐私Back后，增强输入字距断言时误把Chromium对零字距的序列化normal写成0px，见 [final-style-serialization.log](r15/final-style-serialization.log)，4通过1失败；按计算样式序列化修正断言，未改实现或放宽几何阈值。最后完整五项轮次触发真实demo登录限流，未继续登录重试；补取消路径后运行排除demo登录的最终安全UI轮次，以final-verified.log的5通过作为这个受限范围的计数，不累加历史轮次。

## 十九态截图

[存在性与尺寸清单](r15/screenshots.json)，可由 [report.py](r15/report.py) 重算；以下实现图全部来自真实浏览器，不是Figma图。

| 状态 | Figma画框节点 | 375×812实现图 |
|---|---|---|
'''+ '\n'.join(rows)+'''

补充：[注册错误滚动图](r15/signup-mismatch-scrolled.png)、[韩文注册](r15/signup-ko.png)、[韩文375×700](r15/signup-ko-small.png)。原型注册错误框y910本来就在812画框之外，标准图保留画框位置；补图证明真实错误信息可以滚动到达。
'''
(out.parent/'R15-result.md').write_text(doc)
