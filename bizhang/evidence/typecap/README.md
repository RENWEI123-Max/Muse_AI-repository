# Dynamic Type Cap 验收

基线 710b92c。iPhone 17 / iOS 27.2，默认字号 Large，最大字号 accessibility-extra-extra-extra-large。

代码仅修改 bizhang/ios；本目录为新建交付证据，无历史 evidence 或 server 改动。

截图由 BZD8Tests/testTypeCapEvidence 创建五页真实控制器，使用固定空持仓（$0.00）及离线服务响应，关闭动画。序号 0–4 对应总览、行情、记账、提醒、设置。基线截图使用 710b92c 生产源码和相同截图测试。

默认字号：前四页逐像素相同。设置页内容区逐像素相同；1391 个差异像素仅位于 y=2371–2590 的系统玻璃标签栏绘制区域（整图 1206×2622），字体及内容布局一致。详见 default-pixel-comparison.txt。

最大无障碍字号：after-accessibility-overview.png 中金额单行、元信息正常，四张卡片完整位于标签栏上方。完成后已恢复模拟器 Large 字号。

统一上限 Headline 22 / Body 20 / Subheadline 18 / Footnote 15 / Caption1 15 pt。基于 Large 字体调用 UIFontMetrics，保留自动动态字体属性；固定字号不变。

测试：36 项，4 项按原有条件跳过，0 失败；包含全部非 live 单测和新增字体回归测试。明确排除 D8 live；跳过项为 D4 截图专用阶段、D4 live、D6 live、live auth（未提供临时服务凭据）。截图测试额外在最大字号运行通过。

Release：generic/platform=iOS，iphoneos SDK，CODE_SIGNING_ALLOWED=NO，BUILD SUCCEEDED。

复现命令：

```sh
TEST_RUNNER_BZ_TYPECAP_EVIDENCE=1 xcodebuild -project bizhang/ios/BiZhang.xcodeproj -scheme BiZhang -destination 'platform=iOS Simulator,id=3F5C0C26-5630-4912-A62D-CAAAF725068F' -derivedDataPath /private/tmp/bizhang-typecap test -skip-testing:BiZhangTests/BZD8Tests/testD8LiveTemporaryAccountUIAndServerPersistence
xcodebuild -project bizhang/ios/BiZhang.xcodeproj -scheme BiZhang -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' -derivedDataPath /private/tmp/bizhang-typecap-release CODE_SIGNING_ALLOWED=NO build
```
