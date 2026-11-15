import json,re
from pathlib import Path
out=Path(__file__).resolve().parent
rows=json.loads((out/'regression.json').read_text())
walk=json.loads((out/'walkthrough.json').read_text()) if (out/'walkthrough.json').exists() else []
latest={}
for r in rows:latest[r.get('completes',r['suite'])]=r
finalRows=list(latest.values())
passed=sum(r.get('stats',{}).get('expected',0) for r in finalRows);failed=sum(r.get('stats',{}).get('unexpected',0) for r in finalRows);skipped=sum(r.get('stats',{}).get('skipped',0) for r in finalRows)
suitesPass=sum(r['exit']==0 for r in finalRows);suitesFail=len(finalRows)-suitesPass
text=f'''# R25 收尾结果 · 四项均未通过／待 Smith

分支 `codex/r25-wrapup`，基线 `origin/codex/r24-wallet` / `27c74f5`。未合入main。执行于Mac mini `Annas-Mac-mini.local` 的唯一tmux `r25-wrapup`；任务文件已核实，fetch后分支仍在基线，没有另启Codex。原有r21/preview.log保留且不提交。

**执行摘要：静态、流程、效果、滑动与文案四项均未通过／待 Smith。** 已完成可审查的清理、D7迁移与D9测试维护，并记录回归和189态缺口；不能称UI收尾总验收通过。54配置最终11通过、43未通过、0未执行（默认配置拆15批；跨配置重复不等同唯一测试）。保留初轮及补跑共{len(rows)}条命令，最终{len(finalRows)}个批次（成功{suitesPass}，失败{suitesFail}）；按每批最后有效执行，报告已收集测试通过{passed}、失败{failed}、跳过/未执行{skipped}。作废preview初轮不计入最终数；跨配置重复仍计入执行次数，不代表唯一测试数。初轮启动失败和中断的未收集数保留在审计行，不并入最终统计；最终批次均已产出报告。

## 四项验收（摘要以此表为准）

| 验收 | 结果 | 实际证据与边界 |
| --- | --- | --- |
| 静态 | **未通过／待 Smith** | 构建与diff --check通过；运行时CSS优先级声明已为0；无引用旧CSS逐个删除；仍加载CSS的hex等值迁入tokens。全仓历史材料仍含优先级字面量，聊天外观JS默认色和SVG仍有hex；不能声称全仓清零。空文件处理和具体清单见下。 |
| 流程 | **未通过／待 Smith** | 全部发现的Playwright配置逐项尝试，原始命令/返回码/报告列于下；存在断言失败、外置服务器/临时账号依赖、跳过或时间上限。F02支付幂等键问题未修；真实StoreKit和R24六态仍待Smith。 |
| 效果 | **未通过／待 Smith** | 样式迁移反向还原与基线完全相等，未改动画规则；本轮代表态记录可用按钮按压计算样式和动画信息。未完成R06–R24每个动画逐帧/每个按钮效果验收，旧动画名断言失败保留，不能断言全部无回归。 |
| 滑动与文案 | **未通过／待 Smith** | 375×667英韩实际PNG、根滚动与内部滚动数据见逐模块表。横向溢出是候选检测，未完整验证每个字形裁切/触屏顺滑；缺少真实条件的态明确未验证。 |

## 收尾清单

1. **空文件/死文件**：逐个搜索运行时引用后，删除四个不再导入的HomeFlow.legacy-1/2.css、InboxFlow.legacy-1.css、ProfileFlow.legacy-1.css；活动页面CSS仍由组件加载。删除r21/comparison.log、r21/walkthrough.log、r23/walkthrough.log三个无引用空占位。先在R18-audit-result.md移除空日志链接、说明删除原因，再删除r18-audit/walkthrough-baseline.log；最终空文件扫描见静态清单。没有删除r21/preview.log。不是“全仓所有动态资产均已证明无死文件”的声明。依据：[删除清单](r25/deleted-files.json)。
2. **优先级清零**：运行时代码原本已无强制优先级声明，未为了grep改历史原型摘录或检验脚本含义。全仓严格字面量清零**未达到**。所有仍加载CSS的颜色等值迁入tokens；源码反向还原检查通过。JS聊天color input依赖hex值，SVG外链素材不能直接继承页面tokens；不越界更改其绑定或业务代码。依据：[静态盘点](r25/static-inventory.json)、[源检查](r25/source-checks.json)、[色值迁移](r25/color-migration.json)。
3. **D7迁移**：使用与D9同类的文件排序扫描，应用001–021全部21迁移，包含017/019/021，防后续清单漏项。新增真实注册账号schema smoke，直接检查/profiles/me和/letters为200；原完整D7仍保留并运行。最初完整流程0/1，在重登后等#unlock-pin超时；初轮D6总时限残留服务曾使D7/D8/F06/F07启动受阻，已核实并清理本轮PID，保留原日志并补跑（见manual-orphan-cleanup.json）；后续最终计数见D7行，不把schema通过说成完整D7通过。不改锁/登录/会话逻辑。[初次日志](r25/d7.log)。
4. **D9维护**：3176是d9-server.listen、配置health/proxy、spec root一致的专用设计端口，启动前确认空闲；保留3176。StoreKit的旧diamond-pack/d1-topup定位改为reply-pack/reply-topup/余额专用类，点击当前确认弹层后才触发native桥；所有付款顺序、余额、finish时序断言保留。D9主测试钱包选择器同样更新。维护验证StoreKit **6/6通过**；这是既有模拟native/API链，不是真实StoreKit截图验收。主D9结果见下。[维护日志](r25/d9-storekit-maintenance.log)。
5. **全量回归**：默认配置按未配置spec分批执行；其文件正则也会命中同名后缀测试，完整实际清单在JSON。其他配置逐项执行；历史不自带webServer、依赖/tmp旧账号文件或外部前端的配置按实际错误记录。没有改断言、跳过失败断言、修F02或支付逻辑。测试后端端口统一3001，D9例外3176；没有改本机数据库.env、最初preview构建遗漏API覆盖、默认指向3000，不能声称未尝试连接demo；已用VITE_API_BASE_URL=/api重建并重跑受影响配置，最终测试代理明确3001。[端口配置改动](r25/port-migration.json)、[回归调度器](r25/regression.py)。初轮调度设480秒保护，触发者保留原记录，并由completion行取消套件总时限重新跑至结束（不改各测试原有时限/断言）。最终判断用各套件最后一行，初轮与补全执行数均保留、不得混称唯一测试数。
6. **英韩与667走查**：在全部回归释放3001后，新建独立数据库应用全量迁移；通过正常注册、单次UI登录并复用应用保存会话，正常opening接口建立真实等待会话。没有API拦截、fixture端点、DB余额UPDATE或token注入。没有执行充值、扣钻或Pass购买。逐态实际PNG/文案/容器/按压见下及[walkthrough.json](r25/walkthrough.json)。
7. **189总验收**：[R25-total-acceptance.md](R25-total-acceptance.md)完整列189态；153态有历史实现图及重新生成的并排图，36态缺图。逐像素严格RGBA差异，无蒙版/阈值，不以差异大小代替验收。已验证0、未验证138、待Smith51。历史图重测不冒充R25真实逐态走查。

## 全量回归执行表

摘要采用每批最后有效执行；下表保留初轮和补跑的完整审计轨迹，不能直接将全部行相加作最终数。通过/失败/未执行列为各命令报告的测试执行数；配置之间有重复。`未知`表示未获得完整报告，不能加成0。原始JSON和日志含具体测试名及失败栈。为满足diff --check，展示日志仅去除行尾空格/制表符及文末空行；全部原始日志字节保留在[raw-logs.zip](r25/raw-logs.zip)，哈希见[log-normalization.json](r25/log-normalization.json)。[汇总JSON](r25/regression.json)、[执行流水](r25/regression-runner.log)。

| 配置/批次 | 通过 | 失败 | 跳过/未执行 | 执行结果与首个原因 | 日志 |
| --- | --- | --- | --- | --- | --- |
'''
for r in rows:
 s=r.get('stats');counts=[str(s.get(k,0)) for k in ['expected','unexpected','skipped']] if s else ['未知']*3
 log=out/r['log'];lines=re.sub(r'\x1b\[[0-9;]*m','',log.read_text(errors='replace')).splitlines()
 errorIndex=next((i for i,x in enumerate(lines) if 'Error:' in x or 'error:' in x),None)
 reason=lines[errorIndex].strip() if errorIndex is not None else '详见日志'
 if errorIndex is not None:
  hints=[x.strip() for x in lines[errorIndex+1:errorIndex+14] if x.strip().startswith(('Locator:','Expected:','Received:','Timeout:','- waiting for locator','- waiting for getByRole'))]
  reason+='; '+'; '.join(hints[:5])
 if s and not sum(s.get(k,0) for k in ['expected','unexpected','skipped']) and r['exit']!=0:counts=['0','0','未收集/未启动']
 if r.get('timeout'):reason='480秒上限；未跑完；'+reason
 elif r['exit']==0:reason='报告通过（不代表真实条件总验收）'
 if r.get('supersededReason'):reason='作废初轮（preview API构建）；'+reason
 reason=reason.replace('|','/').replace('`',"'")[:420]
 text+='| '+r['suite']+' | '+' | '.join(counts)+' | '+reason+f' | [日志](r25/{r["log"]}) |\n'
text+='''
## 375×667 英韩逐模块记录

截图来自本轮实际页面；底部截图用实际容器scrollTop到末端证明可达。按压通过鼠标按住后读取计算样式，移出后抬起避免触发操作；不替代真人触屏、完整动画逐帧或逐字形裁切检查。状态不等于原型完成验收。

| 模块 | 英文态 / 韩文态 | 根页面滚动 | 内部滚动实测 | 溢出/缺口 |
| --- | --- | --- | --- | --- |
'''
modules=['entry','home','letters','inbox','reply-cost','chat','appearance','safety','public-profile','profile','image-cards','moments','settings','account','support','diamonds']
for mod in modules:
 rs=[x for x in walk if x['module']==mod];links=[];roots=[];scroll=[];issues=[]
 for lang in ['en','ko']:
  r=next((x for x in rs if x['lang']==lang),None)
  if not r:links.append(lang+' 未执行');issues.append('走查未完成');continue
  if r.get('file'):
   links.append(f'[{lang} {r["state"]}](r25/{r["file"]})');roots.append(lang+':'+str(r.get('documentScroll','未测')))
   proof=r.get('scrollProof',[]);scroll.append(lang+(':'+','.join(str(x['after'])+'/'+str(x['max']) for x in proof) if proof else ':无溢出滚动容器/未测'))
   if r.get('horizontalOverflowCandidates'):issues.append(lang+':横向候选'+str(len(r['horizontalOverflowCandidates'])))
   if 'horizontalOverflowCandidates' not in r:issues.append(lang+':未做节点裁切/横向检测')
   if r.get('verticalClipCandidates'):issues.append(lang+':垂直裁切候选'+str(len(r['verticalClipCandidates'])))
   if r.get('viewportOverflowCandidates'):issues.append(lang+':视窗外候选'+str(len(r['viewportOverflowCandidates'])))
  else:links.append(lang+' 未验证');issues.append(lang+':'+r.get('reason',r.get('error','待Smith'))[:140].replace('|','/').replace('\n',' '))
 text+=f'| {mod} | '+ ' / '.join(links)+' | '+'; '.join(roots or ['未测'])+' | '+'; '.join(scroll or ['未测'])+' | '+'; '.join(issues or ['候选检查未发现横向问题；逐字形/触屏未完成'])+' |\n'
text+='\n## 各模块代表态效果记录\n\n| 模块 | 实测按压 | 动画事件 | 结论 |\n| --- | --- | --- | --- |\n'
for mod in modules:
 rs=[r for r in walk if r['module']==mod and r.get('file')]
 press=[];motion=set()
 for r in rs:
  v=r.get('press')
  if v and not v.get('error'):press.append(r['lang']+' '+r['state']+': scale='+str(v.get('scale'))+', transform='+str(v.get('transform')))
  for e in r.get('motionEvents',[]):
   if e.get('type') in ['animationstart','animationend']:motion.add(str(e.get('name')))
 result='反馈存在；未逐帧或逐按钮对比，效果总项未通过' if press else '未完成代表态按压验证／待Smith'
 text+='| '+mod+' | '+'; '.join(press or ['未测'])+' | '+', '.join(sorted(motion)[:12] or ['无已记录动画事件/未测'])+' | '+result+' |\n'

text+='''
人工抽查了英文首页、韩文钱包、韩文个人资料PNG。profile-content两组横向候选是头像按钮（93/88px）内相机徽章外伸，候选没有文本；不能据此声称文字截断，也不能代替全部字形审核。38个状态截图记录、54张实际PNG（含内部滚动末端）、0个脚本错误；所有记录整页不滚，走查API无500。

## 原型依据、效果与阻塞

原型摘录/冲突复核与189态来源汇总在[总验收文档](R25-total-acceptance.md)，原型截图不充当实现。R21七项、R22八项、R23 feedback-history、R24六态与流程冲突均保留待Smith；本轮不新增业务能力。

- F02幂等重试失败：后端/产品决定，本轮不改充值、扣钻、Pass、StoreKit或其调用。
- D7重登后的PIN状态等待失败：账号锁/会话维护任务，不在本轮改业务或删断言。
- D8专用实测停于旧EULA占位断言（期望[EULA_PENDING_SMITH]，当前为已有分节的review draft）；未改法律内容或断言。另发现D8 harness迁移清单仍只到015，属后续维护项，不能把它说成本轮实测500。
- 全量回归仍有旧选择器、动画名称、外置服务/临时账号文件依赖。按日志做专门维护批，不用低差异率或局部通过代替流程验收。
- 真StoreKit、真实余额/已有Pass账号六态以及逐态效果、触屏和文字裁切仍待Smith。
- 样式清理没有覆盖全部JS/SVG和历史证据的字面量。全仓严格静态标准未满足；所有四项均维持未通过。

[构建日志](r25/build.log)、[真实走查服务](r25/server.mjs)、[走查请求状态](r25/requests.json)。只提交本轮文件和明确清理，不提交或删除r21/preview.log，不合main。
'''
measurements=json.loads((out/'total-comparison.json').read_text())
measured=sum('percent' in r for r in measurements)
text=text.replace('153态',str(measured)+'态').replace('36态',str(189-measured)+'态')
(out.parent/'R25-result.md').write_text(text)
print('report generated',len(rows),passed,failed,skipped)
