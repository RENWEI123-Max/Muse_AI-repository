# R25 收尾结果 · 四项均未通过／待 Smith

分支 `codex/r25-wrapup`，基线 `origin/codex/r24-wallet` / `27c74f5`。未合入main。执行于Mac mini `Annas-Mac-mini.local` 的唯一tmux `r25-wrapup`；任务文件已核实，fetch后分支仍在基线，没有另启Codex。原有r21/preview.log保留且不提交。

**执行摘要：静态、流程、效果、滑动与文案四项均未通过／待 Smith。** 已完成可审查的清理、D7迁移与D9测试维护，并记录回归和189态缺口；不能称UI收尾总验收通过。54配置最终11通过、43未通过、0未执行（默认配置拆15批；跨配置重复不等同唯一测试）。保留初轮及补跑共87条命令，最终68个批次（成功14，失败54）；按每批最后有效执行，报告已收集测试通过311、失败542、跳过/未执行16。作废preview初轮不计入最终数；跨配置重复仍计入执行次数，不代表唯一测试数。初轮启动失败和中断的未收集数保留在审计行，不并入最终统计；最终批次均已产出报告。

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
7. **189总验收**：[R25-total-acceptance.md](R25-total-acceptance.md)完整列189态；179态有历史实现图及重新生成的并排图，10态缺图。逐像素严格RGBA差异，无蒙版/阈值，不以差异大小代替验收。已验证0、未验证138、待Smith51。历史图重测不冒充R25真实逐态走查。

## 全量回归执行表

摘要采用每批最后有效执行；下表保留初轮和补跑的完整审计轨迹，不能直接将全部行相加作最终数。通过/失败/未执行列为各命令报告的测试执行数；配置之间有重复。`未知`表示未获得完整报告，不能加成0。原始JSON和日志含具体测试名及失败栈。为满足diff --check，展示日志仅去除行尾空格/制表符及文末空行；全部原始日志字节保留在[raw-logs.zip](r25/raw-logs.zip)，哈希见[log-normalization.json](r25/log-normalization.json)。[汇总JSON](r25/regression.json)、[执行流水](r25/regression-runner.log)。

| 配置/批次 | 通过 | 失败 | 跳过/未执行 | 执行结果与首个原因 | 日志 |
| --- | --- | --- | --- | --- | --- |
| default-auth.spec.ts | 9 | 2 | 0 | Error: expect(locator).toBeVisible() failed; Locator: getByText('You are signed in.', { exact: true }); Expected: visible; Timeout: 5000ms | [日志](r25/default-auth.spec.ts.log) |
| default-c7-acceptance.spec.ts | 1 | 1 | 0 | Error: ENOENT: no such file or directory, scandir '/root/MauGo-handover/extracted/MauGo完整项目交接-2026-10-27/03-成品UI/离线预览';  | [日志](r25/default-c7-acceptance.spec.ts.log) |
| default-chat-media.spec.ts | 1 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/default-chat-media.spec.ts.log) |
| default-chat-voice.spec.ts | 3 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/default-chat-voice.spec.ts.log) |
| default-chat.spec.ts | 2 | 3 | 0 | TimeoutError: locator.click: Timeout 12000ms exceeded.; - waiting for locator('#confirm-reply-payment') | [日志](r25/default-chat.spec.ts.log) |
| default-client.spec.ts | 2 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/default-client.spec.ts.log) |
| default-d1.spec.ts | 0 | 1 | 0 | Error: expect(locator).toContainText(expected) failed; Locator: getByRole('dialog'); Timeout: 5000ms; - waiting for getByRole('dialog') | [日志](r25/default-d1.spec.ts.log) |
| default-d2.spec.ts | 0 | 2 | 0 | Error: expect(locator).toHaveCSS(expected) failed; Locator:  locator('.d2-body'); Expected: "d2-open"; Received: "none"; Timeout:  5000ms; - waiting for locator('.d2-body') | [日志](r25/default-d2.spec.ts.log) |
| default-d3.spec.ts | 0 | 2 | 0 | Error: expect(locator).toHaveCSS(expected) failed; Locator: locator('.d3-report'); Timeout: 5000ms; - waiting for locator('.d3-report') | [日志](r25/default-d3.spec.ts.log) |
| default-f01.spec.ts | 0 | 1 | 0 | TypeError: Cannot read properties of undefined (reading 'trim');  | [日志](r25/default-f01.spec.ts.log) |
| default-home.spec.ts | 0 | 1 | 0 | TimeoutError: locator.click: Timeout 10000ms exceeded.; - waiting for getByRole('button', { name: 'Refresh', exact: true }) | [日志](r25/default-home.spec.ts.log) |
| default-inbox.spec.ts | 6 | 4 | 0 | Error: expect(locator).toContainText(expected) failed; Locator: getByRole('dialog'); Timeout: 5000ms; - waiting for getByRole('dialog') | [日志](r25/default-inbox.spec.ts.log) |
| default-ko-help.spec.ts | 0 | 1 | 0 | Error: locator.click: Test timeout of 30000ms exceeded.; - waiting for locator('#auth-form button.primary') | [日志](r25/default-ko-help.spec.ts.log) |
| default-letters.spec.ts | 0 | 1 | 0 | Error: expect(locator).toHaveAttribute(expected) failed; Locator: locator('.letters-panel'); Expected: "letter-open"; Timeout: 5000ms; - waiting for locator('.letters-panel') | [日志](r25/default-letters.spec.ts.log) |
| default-pass-confirmation.spec.ts | 1 | 1 | 0 | Error: expect(received).toBe(expected) // Object.is equality; Expected: 1; Received: 2 | [日志](r25/default-pass-confirmation.spec.ts.log) |
| tests_baseline-r18-regression.config.ts | 0 | 6 | 0 | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5174/?auth=consent;  | [日志](r25/tests_baseline-r18-regression.config.ts.log) |
| tests_baseline-r18-reverify.config.ts | 0 | 1 | 1 | Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3001;  | [日志](r25/tests_baseline-r18-reverify.config.ts.log) |
| tests_d11.config.ts | 0 | 4 | 0 | Error: Timeout 5000ms exceeded while waiting on the predicate;  | [日志](r25/tests_d11.config.ts.log) |
| tests_d4-reverify.config.ts | 0 | 1 | 1 | TimeoutError: locator.click: Timeout 15000ms exceeded.; - waiting for locator('#auth-form button.primary') | [日志](r25/tests_d4-reverify.config.ts.log) |
| tests_d4.config.ts | 2 | 4 | 0 | Error: expect(locator).toHaveCSS(expected) failed; Locator: locator('.d4-body'); Timeout: 5000ms; - waiting for locator('.d4-body') | [日志](r25/tests_d4.config.ts.log) |
| tests_d5.config.ts | 0 | 1 | 0 | Error: locator.click: Test timeout of 180000ms exceeded.;  | [日志](r25/tests_d5.config.ts.log) |
| tests_d6-followup.config.ts | 0 | 1 | 0 | Error: page.waitForResponse: Test timeout of 120000ms exceeded.; - waiting for locator('#auth-form button.primary') | [日志](r25/tests_d6-followup.config.ts.log) |
| tests_d6-recommendation.config.ts | 0 | 1 | 0 | TimeoutError: locator.click: Timeout 10000ms exceeded.; - waiting for locator('#auth-form button.primary') | [日志](r25/tests_d6-recommendation.config.ts.log) |
| tests_d6-round3.config.ts | 0 | 4 | 1 | 480秒上限；未跑完；详见日志 | [日志](r25/tests_d6-round3.config.ts.log) |
| tests_d7.config.ts | 0 | 0 | 未收集/未启动 | Error: http://127.0.0.1:3001/health is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.;  | [日志](r25/tests_d7.config.ts.log) |
| tests_d8.config.ts | 0 | 0 | 未收集/未启动 | Error: http://127.0.0.1:3001/health is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.;  | [日志](r25/tests_d8.config.ts.log) |
| tests_d9-storekit.config.ts | 6 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_d9-storekit.config.ts.log) |
| tests_d9.config.ts | 1 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_d9.config.ts.log) |
| tests_f01-ui.config.ts | 0 | 2 | 0 | Error: expect(locator).toContainText(expected) failed; Locator: getByRole('status'); Timeout: 5000ms; - waiting for getByRole('status') | [日志](r25/tests_f01-ui.config.ts.log) |
| tests_f06.config.ts | 0 | 0 | 未收集/未启动 | Error: http://127.0.0.1:3001/health is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.;  | [日志](r25/tests_f06.config.ts.log) |
| tests_f07.config.ts | 0 | 0 | 未收集/未启动 | Error: http://127.0.0.1:3001/health is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.;  | [日志](r25/tests_f07.config.ts.log) |
| tests_legal-copy.config.ts | 0 | 4 | 0 | 作废初轮（preview API构建）；Error: expect(locator).toBeVisible() failed; Locator: locator('#accept-terms'); Expected: visible; Timeout: 5000ms; - waiting for locator('#accept-terms') | [日志](r25/tests_legal-copy.config.ts.log) |
| tests_r06-audit.config.ts | 0 | 4 | 0 | 作废初轮（preview API构建）；Error: expect(locator).toBeVisible() failed; Locator: locator('.letter-error'); Expected: visible; Timeout: 5000ms; - waiting for locator('.letter-error') | [日志](r25/tests_r06-audit.config.ts.log) |
| tests_r08-audit.config.ts | 0 | 4 | 0 | 作废初轮（preview API构建）；Error: expect(locator).toHaveAttribute(expected) failed; Locator: locator('.letters-panel'); Expected: "compose-sent"; Timeout: 5000ms; - waiting for locator('.letters-panel') | [日志](r25/tests_r08-audit.config.ts.log) |
| tests_r09-audit.config.ts | 0 | 4 | 0 | 作废初轮（preview API构建）；Error: expect(locator).toHaveCSS(expected) failed; Locator: locator('.reply-dialog'); Expected: "0.22s"; Timeout: 5000ms; - waiting for locator('.reply-dialog') | [日志](r25/tests_r09-audit.config.ts.log) |
| tests_r10-audit.config.ts | 0 | 4 | 0 | 作废初轮（preview API构建）；Error: expect(locator).toBeVisible() failed; Locator: locator('#confirm-reply-payment'); Expected: visible; Timeout: 5000ms; - waiting for locator('#confirm-reply-payment') | [日志](r25/tests_r10-audit.config.ts.log) |
| tests_r11-audit.config.ts | 0 | 4 | 0 | 作废初轮（preview API构建）；TimeoutError: locator.click: Timeout 10000ms exceeded.; - waiting for locator('#reply-payment-cancel') | [日志](r25/tests_r11-audit.config.ts.log) |
| tests_r12-audit.config.ts | 4 | 0 | 0 | 作废初轮（preview API构建）；报告通过（不代表真实条件总验收） | [日志](r25/tests_r12-audit.config.ts.log) |
| tests_r13-audit.config.ts | 0 | 4 | 0 | 作废初轮（preview API构建）；TimeoutError: locator.click: Timeout 8000ms exceeded.; - waiting for locator('.flow-content > .ui-button') | [日志](r25/tests_r13-audit.config.ts.log) |
| tests_r14-audit.config.ts | 0 | 4 | 0 | 作废初轮（preview API构建）；TimeoutError: locator.click: Timeout 8000ms exceeded.; - waiting for locator('.flow-content > .ui-button') | [日志](r25/tests_r14-audit.config.ts.log) |
| tests_r15-audit.config.ts | 0 | 4 | 0 | 作废初轮（preview API构建）；Error: expect(locator).toHaveAttribute(expected) failed; Locator:  locator('.auth-flow'); Expected: "verify"; Received: "signup"; Timeout:  5000ms; - waiting for locator('.auth-flow') | [日志](r25/tests_r15-audit.config.ts.log) |
| tests_r15.config.ts | 10 | 88 | 112 | 作废初轮（preview API构建）；480秒上限；未跑完；[WebServer] 6:05:35 AM [vite] http proxy error: /auth/code/send;  | [日志](r25/tests_r15.config.ts.log) |
| tests_r16-audit.config.ts | 0 | 4 | 0 | Error: expect(locator).toBeVisible() failed; Locator: locator('.person-page').getByRole('alert'); Expected: visible; Timeout: 5000ms; - waiting for locator('.person-page').getByRole('alert') | [日志](r25/tests_r16-audit.config.ts.log) |
| tests_r16-regression.config.ts | 0 | 6 | 0 | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5296/?auth=consent;  | [日志](r25/tests_r16-regression.config.ts.log) |
| tests_r16.config.ts | 0 | 6 | 0 | Error: apiRequestContext.get: connect ECONNREFUSED 127.0.0.1:5296;  | [日志](r25/tests_r16.config.ts.log) |
| tests_r17-audit.config.ts | 0 | 4 | 0 | Error: expect(locator).toHaveText(expected) failed; Locator: locator('.profile-page').first().getByRole('alert'); Expected: "Enter a name and an age between 18 and 100."; Timeout: 5000ms; - waiting for locator('.profile-page').first().getByRole('alert') | [日志](r25/tests_r17-audit.config.ts.log) |
| tests_r17-regression.config.ts | 0 | 6 | 0 | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5173/?auth=consent;  | [日志](r25/tests_r17-regression.config.ts.log) |
| tests_r17-reverify.config.ts | 0 | 1 | 1 | Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3001;  | [日志](r25/tests_r17-reverify.config.ts.log) |
| tests_r17.config.ts | 0 | 1 | 0 | Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3001;  | [日志](r25/tests_r17.config.ts.log) |
| tests_r18-audit.config.ts | 0 | 4 | 0 | Error: expect(locator).toHaveText(expected) failed; Locator: locator('.profile-page').first().getByRole('alert'); Expected: "This photo could not be opened."; Timeout: 5000ms; - waiting for locator('.profile-page').first().getByRole('alert') | [日志](r25/tests_r18-audit.config.ts.log) |
| tests_r18-regression.config.ts | 0 | 6 | 0 | Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:5173/?auth=consent;  | [日志](r25/tests_r18-regression.config.ts.log) |
| tests_r18-reverify.config.ts | 0 | 1 | 1 | Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3001;  | [日志](r25/tests_r18-reverify.config.ts.log) |
| tests_r18.config.ts | 0 | 1 | 0 | Error: ENOENT: no such file or directory, open '/tmp/r18-account.json';  | [日志](r25/tests_r18.config.ts.log) |
| tests_r19-audit.config.ts | 0 | 4 | 0 | Error: expect(locator).toContainText(expected) failed; Locator: locator('.profile-page').first().locator('.d5').getByRole('alert').first(); Timeout: 5000ms; - waiting for locator('.profile-page').first().locator('.d5').getByRole('alert').first() | [日志](r25/tests_r19-audit.config.ts.log) |
| tests_r19-regression.config.ts | 0 | 1 | 0 | Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3001;  | [日志](r25/tests_r19-regression.config.ts.log) |
| tests_r19.config.ts | 0 | 1 | 0 | Error: ENOENT: no such file or directory, open '/tmp/r19-account.json';  | [日志](r25/tests_r19.config.ts.log) |
| tests_r20-audit.config.ts | 0 | 4 | 0 | Error: expect(locator).toContainText(expected) failed; Locator: locator('.profile-page').first().locator('.d5').locator('.d5-page').getByRole('alert'); Timeout: 5000ms; - waiting for locator('.profile-page').first().locator('.d5').locator('.d5-page').getByRole('alert') | [日志](r25/tests_r20-audit.config.ts.log) |
| tests_r20-fixes.config.ts | 24 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_r20-fixes.config.ts.log) |
| tests_r20-regression.config.ts | 0 | 1 | 0 | Error: apiRequestContext.post: connect ECONNREFUSED 127.0.0.1:3001;  | [日志](r25/tests_r20-regression.config.ts.log) |
| tests_r20.config.ts | 0 | 1 | 0 | Error: ENOENT: no such file or directory, open '/tmp/r20-account.json';  | [日志](r25/tests_r20.config.ts.log) |
| tests_shell-fix.config.ts | 8 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_shell-fix.config.ts.log) |
| tests_ui-polish.config.ts | 3 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_ui-polish.config.ts.log) |
| tests_ui-redo.config.ts | 4 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_ui-redo.config.ts.log) |
| playwright.r10.config.ts | 10 | 18 | 182 | 480秒上限；未跑完；详见日志 | [日志](r25/playwright.r10.config.ts.log) |
| playwright.r13.config.ts | 8 | 20 | 182 | 480秒上限；未跑完；详见日志 | [日志](r25/playwright.r13.config.ts.log) |
| docs_fidelity-refactor_existing-ui.config.ts | 0 | 0 | 未收集/未启动 | Error: http://127.0.0.1:5174 is already used, make sure that nothing is running on the port/url or set reuseExistingServer:true in config.webServer.;  | [日志](r25/docs_fidelity-refactor_existing-ui.config.ts.log) |
| docs_fidelity-refactor_fix-119.config.ts | 0 | 1 | 0 | Error: locator.click: Test timeout of 60000ms exceeded.; - waiting for locator('.profile-nav button').first() | [日志](r25/docs_fidelity-refactor_fix-119.config.ts.log) |
| docs_fidelity-refactor_playwright.config.ts | 7 | 5 | 0 | Error: expect(locator).toHaveCSS(expected) failed; Locator:  locator('#new-profile-moment'); Expected: "rgb(25, 54, 43)"; Received: "rgb(10, 20, 6)"; Timeout:  5000ms; - waiting for locator('#new-profile-moment') | [日志](r25/docs_fidelity-refactor_playwright.config.ts.log) |
| tests_d7.config.ts-completion | 1 | 1 | 0 | Error: locator.fill: Test timeout of 120000ms exceeded.; - waiting for locator('#unlock-pin') | [日志](r25/tests_d7.config.ts-completion.log) |
| tests_d8.config.ts-completion | 0 | 1 | 0 | Error: expect(locator).toContainText(expected) failed; Locator: locator('.terms-document').first(); Timeout: 5000ms; - waiting for locator('.terms-document').first() | [日志](r25/tests_d8.config.ts-completion.log) |
| tests_f06.config.ts-completion | 1 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_f06.config.ts-completion.log) |
| tests_f07.config.ts-completion | 2 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_f07.config.ts-completion.log) |
| tests_d6-round3.config.ts-completion | 0 | 5 | 0 | Error: locator.click: Test timeout of 120000ms exceeded.; - waiting for locator('#auth-form button.primary') | [日志](r25/tests_d6-round3.config.ts-completion.log) |
| tests_legal-copy.config.ts-completion | 0 | 4 | 0 | Error: expect(locator).toBeVisible() failed; Locator: locator('#accept-terms'); Expected: visible; Timeout: 5000ms; - waiting for locator('#accept-terms') | [日志](r25/tests_legal-copy.config.ts-completion.log) |
| tests_r06-audit.config.ts-completion | 0 | 4 | 0 | Error: expect(locator).toBeVisible() failed; Locator: locator('.letter-error'); Expected: visible; Timeout: 5000ms; - waiting for locator('.letter-error') | [日志](r25/tests_r06-audit.config.ts-completion.log) |
| tests_r08-audit.config.ts-completion | 0 | 4 | 0 | Error: expect(locator).toHaveAttribute(expected) failed; Locator: locator('.letters-panel'); Expected: "compose-sent"; Timeout: 5000ms; - waiting for locator('.letters-panel') | [日志](r25/tests_r08-audit.config.ts-completion.log) |
| tests_r09-audit.config.ts-completion | 0 | 4 | 0 | Error: expect(locator).toHaveCSS(expected) failed; Locator: locator('.reply-dialog'); Expected: "0.22s"; Timeout: 5000ms; - waiting for locator('.reply-dialog') | [日志](r25/tests_r09-audit.config.ts-completion.log) |
| tests_r10-audit.config.ts-completion | 0 | 4 | 0 | Error: expect(locator).toBeVisible() failed; Locator: locator('#confirm-reply-payment'); Expected: visible; Timeout: 5000ms; - waiting for locator('#confirm-reply-payment') | [日志](r25/tests_r10-audit.config.ts-completion.log) |
| tests_r11-audit.config.ts-completion | 0 | 4 | 0 | TimeoutError: locator.click: Timeout 10000ms exceeded.; - waiting for locator('#reply-payment-cancel') | [日志](r25/tests_r11-audit.config.ts-completion.log) |
| tests_r12-audit.config.ts-completion | 4 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_r12-audit.config.ts-completion.log) |
| tests_r13-audit.config.ts-completion | 4 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_r13-audit.config.ts-completion.log) |
| tests_r14-audit.config.ts-completion | 0 | 4 | 0 | TimeoutError: locator.click: Timeout 8000ms exceeded.; - waiting for locator('.safety-dialog-cancel') | [日志](r25/tests_r14-audit.config.ts-completion.log) |
| tests_r15-audit.config.ts-completion | 4 | 0 | 0 | 报告通过（不代表真实条件总验收） | [日志](r25/tests_r15-audit.config.ts-completion.log) |
| tests_r15.config.ts-completion | 61 | 145 | 4 | [WebServer] 6:56:05 AM [vite] http proxy error: /auth/code/verify;  | [日志](r25/tests_r15.config.ts-completion.log) |
| playwright.r10.config.ts-completion | 90 | 116 | 4 | Error: ENOENT: no such file or directory, scandir '/root/MauGo-handover/extracted/MauGo完整项目交接-2026-10-27/03-成品UI/离线预览';  | [日志](r25/playwright.r10.config.ts-completion.log) |
| playwright.r13.config.ts-completion | 61 | 145 | 4 | [WebServer] 8:04:22 AM [vite] http proxy error: /auth/code/verify;  | [日志](r25/playwright.r13.config.ts-completion.log) |
| docs_fidelity-refactor_existing-ui.config.ts-completion | 3 | 2 | 0 | Error: expect(locator).toContainText(expected) failed; Locator: getByRole('status'); Timeout: 5000ms; - waiting for getByRole('status') | [日志](r25/docs_fidelity-refactor_existing-ui.config.ts-completion.log) |

## 375×667 英韩逐模块记录

截图来自本轮实际页面；底部截图用实际容器scrollTop到末端证明可达。按压通过鼠标按住后读取计算样式，移出后抬起避免触发操作；不替代真人触屏、完整动画逐帧或逐字形裁切检查。状态不等于原型完成验收。

| 模块 | 英文态 / 韩文态 | 根页面滚动 | 内部滚动实测 | 溢出/缺口 |
| --- | --- | --- | --- | --- |
| entry | [en welcome](r25/667-en-welcome.png) / [ko welcome](r25/667-ko-welcome.png) | en:False; ko:False | en:无溢出滚动容器/未测; ko:无溢出滚动容器/未测 | en:未做节点裁切/横向检测; ko:未做节点裁切/横向检测 |
| home | [en home-empty](r25/667-en-home-empty.png) / [ko home-empty](r25/667-ko-home-empty.png) | en:False; ko:False | en:无溢出滚动容器/未测; ko:无溢出滚动容器/未测 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| letters | [en compose-empty](r25/667-en-compose-empty.png) / [ko compose-empty](r25/667-ko-compose-empty.png) | en:False; ko:False | en:无溢出滚动容器/未测; ko:无溢出滚动容器/未测 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| inbox | [en inbox-messages](r25/667-en-inbox-messages.png) / [ko inbox-messages](r25/667-ko-inbox-messages.png) | en:False; ko:False | en:无溢出滚动容器/未测; ko:无溢出滚动容器/未测 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| reply-cost | en 未验证 / ko 未验证 | 未测 | 未测 | en:fresh ordinary accounts have no paid reply requirement; no wallet seeds or diamond deductions executed; ko:fresh ordinary accounts have no paid reply requirement; no wallet seeds or diamond deductions executed |
| chat | [en chat-waiting](r25/667-en-chat-waiting.png) / [ko chat-waiting](r25/667-ko-chat-waiting.png) | en:False; ko:False | en:无溢出滚动容器/未测; ko:无溢出滚动容器/未测 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| appearance | [en wallpapers](r25/667-en-wallpapers.png) / [ko wallpapers](r25/667-ko-wallpapers.png) | en:False; ko:False | en:171/171; ko:171/171 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| safety | [en blocked-list-empty](r25/667-en-blocked-list-empty.png) / [ko blocked-list-empty](r25/667-ko-blocked-list-empty.png) | en:False; ko:False | en:无溢出滚动容器/未测; ko:无溢出滚动容器/未测 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| public-profile | [en person-waiting](r25/667-en-person-waiting.png) / [ko person-waiting](r25/667-ko-person-waiting.png) | en:False; ko:False | en:103/103; ko:103/103 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| profile | [en profile-content](r25/667-en-profile-content.png) / [ko profile-content](r25/667-ko-profile-content.png) | en:False; ko:False | en:258/258; ko:258/258 | en:横向候选1; ko:横向候选1 |
| image-cards | [en card-type](r25/667-en-card-type.png) / [ko card-type](r25/667-ko-card-type.png) | en:False; ko:False | en:无溢出滚动容器/未测; ko:无溢出滚动容器/未测 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| moments | [en moments-empty](r25/667-en-moments-empty.png) / [ko moments-empty](r25/667-ko-moments-empty.png) | en:False; ko:False | en:无溢出滚动容器/未测; ko:无溢出滚动容器/未测 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| settings | [en settings-home](r25/667-en-settings-home.png) / [ko settings-home](r25/667-ko-settings-home.png) | en:False; ko:False | en:23/23; ko:23/23 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| account | [en security](r25/667-en-security.png) / [ko security](r25/667-ko-security.png) | en:False; ko:False | en:无溢出滚动容器/未测; ko:无溢出滚动容器/未测 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| support | [en help](r25/667-en-help.png) / [ko help](r25/667-ko-help.png) | en:False; ko:False | en:33/33; ko:44/44 | 候选检查未发现横向问题；逐字形/触屏未完成 |
| diamonds | [en wallet-empty](r25/667-en-wallet-empty.png) / [ko wallet-empty](r25/667-ko-wallet-empty.png) | en:False; ko:False | en:233/233; ko:217/217 | 候选检查未发现横向问题；逐字形/触屏未完成 |

## 各模块代表态效果记录

| 模块 | 实测按压 | 动画事件 | 结论 |
| --- | --- | --- | --- |
| entry | 未测 | 无已记录动画事件/未测 | 未完成代表态按压验证／待Smith |
| home | en home-empty: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); en filters-free: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko home-empty: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko filters-free: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle, sheet-in | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| letters | en compose-empty: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko compose-empty: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| inbox | en inbox-messages: scale=none, transform=none; ko inbox-messages: scale=none, transform=none | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| reply-cost | 未测 | 无已记录动画事件/未测 | 未完成代表态按压验证／待Smith |
| chat | en chat-waiting: scale=none, transform=none; en chat-details-waiting: scale=none, transform=none; ko chat-waiting: scale=none, transform=none; ko chat-details-waiting: scale=none, transform=none | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| appearance | en wallpapers: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko wallpapers: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| safety | en blocked-list-empty: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko blocked-list-empty: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| public-profile | en person-waiting: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko person-waiting: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| profile | en profile-content: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); en avatar-gallery: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko profile-content: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko avatar-gallery: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle, sheet-in | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| image-cards | en card-type: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko card-type: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle, sheet-in | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| moments | en moments-empty: scale=none, transform=none; ko moments-empty: scale=none, transform=none | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| settings | en settings-home: scale=1, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko settings-home: scale=1, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| account | en security: scale=1, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko security: scale=1, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| support | en help: scale=1, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko help: scale=1, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |
| diamonds | en wallet-empty: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); en pass-default: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko wallet-empty: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0); ko pass-default: scale=none, transform=matrix(0.94, 0, 0, 0.94, 0, 0) | home-floor-breathe, home-hat-refresh, home-mist-breathe, home-twinkle, sheet-in | 反馈存在；未逐帧或逐按钮对比，效果总项未通过 |

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
