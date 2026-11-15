import json
from pathlib import Path
out=Path(__file__).resolve().parent
rows=json.loads((out/'total-comparison.json').read_text())
text='''# R25 · 189 状态总验收（未通过）

基线 `27c74f5`，分支 `codex/r25-wrapup`。这是189态逐项索引和历史实现图重测，不是189态已验收声明。**已验证0，未验证138，待 Smith51**。153态有明确对应的历史实现图及重新生成的并排图，36态缺图／差异比例未测量。缺图没有用参考图、mock状态或相邻状态补齐。

## 图像与方法

R01来源：[page-states.json](../design-reference/page-states.json)、[参考图](../design-reference/figma/)。16模块、189个唯一状态逐项列在下表。R04工具：[ui-redo.spec.ts](../../tests/ui-redo.spec.ts)目前**只支持4个明确导航状态**，且其导航使用API fixtures；不能擅自把它扩展成189个真实状态。R25完整运行结果另见回归表，不把其fixture图当真实账号走查。

沿用R04“实现图与R01并排、逐态报告比例、不设置通过阈值”的方式。新脚本[compare-total.mjs](r25/compare-total.mjs)读取基线Git内的历史实现PNG（避免并行回归临时输出污染），严格检查375×812，左R01、右历史实现。逐像素RGBA任一通道不同即计数，分母304500；**无蒙版、无容差、无缩放、无通过阈值**。这与R04的顶部44px蒙版及Playwright感知比较器口径不同，数字不可横向混算。原始来源与误差见[JSON](r25/total-comparison.json)、[生成输入](r25/total-input.json)。并排PNG是明确标注来源的历史图衍生物，不是R25新拍的真实截图。

历史证据可能来自旧版、fixture回归或预览；不会因有图、低比例或某个测试通过而改成“已验证”。R25的375×667英韩真实走查单列在[R25-result.md](R25-result.md)，不拿667图缩放冒充812态。

## 逐态总表

| # | 模块 | 状态 | R01 | 历史实现 / 并排图 | RGBA差异 | 验收状态 |
| --- | --- | --- | --- | --- | --- | --- |
'''
for i,r in enumerate(rows,1):
 sid=r['id'];ref=f'[参考](../design-reference/figma/{sid}.png)'
 if r.get('composite'):
  actual=r['actual'].removeprefix('client/docs/ui-redo/');actual=actual if not actual.startswith('client/') else '../../'+actual.removeprefix('client/')
  image=f'[历史实现]({actual}) / [并排]({r["composite"]})'
 else:image='缺失；不补图'+('；'+r['error'].split('\n')[0] if r.get('error') else '')
 ratio=f'{r["percent"]:.4f}%' if 'percent' in r else '未测量'
 text+=f'| {i} | {r["module"]} | `{sid}` · {r["title"].replace("|","/")} | {ref} | {image} | {ratio} | {r["status"]} |\n'
text+='''
## 保留的原型与业务冲突

原型依据直接复核各轮本地摘录：[R21](r21/prototype-excerpts.txt)、[R22](r22/prototype-excerpts.txt)、[R23](r23/prototype-extract.txt)、[R24](r24/prototype-extract.txt)。未调用Figma API/token。其余模块原型与效果依据见R06–R20各轮result和audit-result；本轮无新模块样式。

- R21七项：[原始完整记录](R21-result.md)。主设置缺退出/注销；隐私能力和Save流程不同；通知分类不同；缓存仅删草稿、无容量/图片管理；general-font标题字重；韩文措辞；旧CSS颜色字面量。R25只清理CSS色值，其他项保留待定。
- R22八项：[原始完整记录](R22-result.md)。账号入口/切换不同；真实服务端账号与预览注销不同；退出弹层来源不同；F07清理规则与旧提示冲突；注销挑战token/密码字段；PIN行内alert与toast不同；元素色彩/字号/插画尺寸仍待逐项测量；旧CSS色值。R25不改这些业务与会话。D7当前仍有重新登录PIN等待失败，不能用schema smoke通过代替全流程通过。R25专用F07回归已2/2通过，但这不消除原型文案冲突，也不外推为R22全部13态通过。
- R23：[完整记录](R23-result.md)。feedback-history没有当前实现或历史接口，范围待Smith；不伪造历史列表。原型本地反馈与当前服务器提交/2000字限制不同，附件与Share缺失；terms-full节点25:19082与实际29:19082冲突、隐私/法律草稿和客服邮箱仍待Smith，不借收尾轮改内容或业务。
- R24：[完整记录](R24-result.md)。wallet-balance、topup-success、pass-confirm、pass-active、pass-extend、pass-success六态需要真实余额／Pass／StoreKit条件，待Smith在app内验证。原型本地模拟加钻不能替换当前StoreKit验证；方案即确认、短缺页摘要/disabled按钮、取消恢复页和成功独立页均与原型不同。F02幂等键重试失败只记录。

D9测试使用独立数据库和既有测试状态端点时，其购买回归结果也不能作为这六态的真实截图验收。真实充值、真实扣钻未在走查执行。

缺图态维持未验证或待Smith；需逐态真实导航、原型核对、效果和英韩小屏审核后，才能更新验收状态。
'''
measurements=json.loads((out/'total-comparison.json').read_text())
measured=sum('percent' in r for r in measurements)
text=text.replace('153态',str(measured)+'态').replace('36态',str(189-measured)+'态')
(out.parent/'R25-total-acceptance.md').write_text(text)
print(len(rows),'rows written')
