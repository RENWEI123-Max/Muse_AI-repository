#import "BZAlertEditor.h"
#import "BZAlertSupport.h"
#import "BZAPIClient.h"
#import "BZLedgerSupport.h"
#import "BZTheme.h"
@interface BZAlertEditor () <UIPickerViewDelegate, UIPickerViewDataSource>
@property(nonatomic) NSDictionary *rule;
@property(nonatomic, copy) void (^completion)(NSString *);
@property(nonatomic) UIPickerView *asset;
@property(nonatomic) UISegmentedControl *direction;
@property(nonatomic) UITextField *threshold;
@property(nonatomic) UILabel *errorLabel;
@property(nonatomic) NSString *idempotencyKey;
@property(nonatomic) NSDictionary *pendingBody;
@property(nonatomic) BOOL saving;
@end
@implementation BZAlertEditor
- (instancetype)initWithRule:(NSDictionary *)rule completion:(void (^)(NSString *))completion {
  if ((self = [super init])) { _rule = rule; _completion = [completion copy]; _idempotencyKey = NSUUID.UUID.UUIDString; } return self;
}
- (void)viewDidLoad {
  [super viewDidLoad]; self.title = self.rule ? @"编辑提醒" : @"新建提醒"; self.view.backgroundColor = BZTheme.background;
  self.navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"取消" style:UIBarButtonItemStylePlain target:self action:@selector(cancel)];
  self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"保存" style:UIBarButtonItemStyleDone target:self action:@selector(save)];
  UIScrollView *scroll = [UIScrollView new]; scroll.translatesAutoresizingMaskIntoConstraints = NO; scroll.keyboardDismissMode = UIScrollViewKeyboardDismissModeOnDrag; [self.view addSubview:scroll];
  UIStackView *stack = [UIStackView new]; stack.axis = UILayoutConstraintAxisVertical; stack.spacing = 16; stack.translatesAutoresizingMaskIntoConstraints = NO; [scroll addSubview:stack];
  [NSLayoutConstraint activateConstraints:@[[scroll.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor],[scroll.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],[scroll.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],[scroll.bottomAnchor constraintEqualToAnchor:self.view.keyboardLayoutGuide.topAnchor],[stack.topAnchor constraintEqualToAnchor:scroll.contentLayoutGuide.topAnchor constant:20],[stack.bottomAnchor constraintEqualToAnchor:scroll.contentLayoutGuide.bottomAnchor constant:-24],[stack.leadingAnchor constraintEqualToAnchor:scroll.contentLayoutGuide.leadingAnchor constant:20],[stack.trailingAnchor constraintEqualToAnchor:scroll.contentLayoutGuide.trailingAnchor constant:-20],[stack.widthAnchor constraintEqualToAnchor:scroll.frameLayoutGuide.widthAnchor constant:-40]]];
  UILabel *label = [UILabel new]; label.text = self.rule ? @"币种（编辑时不可更改）" : @"币种"; label.textColor = BZTheme.muted; [stack addArrangedSubview:label];
  self.asset = [UIPickerView new]; self.asset.dataSource = self; self.asset.delegate = self; self.asset.accessibilityLabel = @"币种"; [self.asset.heightAnchor constraintEqualToConstant:130].active = YES; [stack addArrangedSubview:self.asset];
  NSUInteger index = [[BZAlertSupport assets] indexOfObject:self.rule[@"asset"] ?: @"BTC"]; [self.asset selectRow:index == NSNotFound ? 0 : index inComponent:0 animated:NO]; self.asset.userInteractionEnabled = !self.rule;
  self.direction = [[UISegmentedControl alloc] initWithItems:@[@"突破",@"跌破"]]; self.direction.selectedSegmentIndex = [self.rule[@"direction"] isEqual:@"below"] ? 1 : 0; self.direction.accessibilityLabel = @"提醒方向"; [stack addArrangedSubview:self.direction];
  UILabel *price = [UILabel new]; price.text = @"阈值（USD，最多 18 位小数）"; price.textColor = BZTheme.muted; [stack addArrangedSubview:price];
  self.threshold = [UITextField new]; self.threshold.borderStyle = UITextBorderStyleRoundedRect; self.threshold.keyboardType = UIKeyboardTypeDecimalPad; self.threshold.text = self.rule[@"threshold_usd"]; self.threshold.accessibilityLabel = @"提醒阈值 USD"; self.threshold.font = [UIFont preferredFontForTextStyle:UIFontTextStyleBody]; self.threshold.adjustsFontForContentSizeCategory = YES; [self.threshold.heightAnchor constraintGreaterThanOrEqualToConstant:44].active = YES; [stack addArrangedSubview:self.threshold];
  UILabel *hint = [UILabel new]; hint.numberOfLines = 0; hint.text = self.rule ? @"修改方向或阈值并保存后，提醒会按新条件重新生效。" : @"达到阈值即触发一次并停用；若当前价已越线，将由服务端立即触发。"; hint.textColor = BZTheme.muted; hint.font = [UIFont preferredFontForTextStyle:UIFontTextStyleSubheadline]; [stack addArrangedSubview:hint];
  self.errorLabel = [UILabel new]; self.errorLabel.numberOfLines = 0; self.errorLabel.textColor = UIColor.systemRedColor; self.errorLabel.accessibilityIdentifier = @"alerts.error"; [stack addArrangedSubview:self.errorLabel];
}
- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView { return 1; }
- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent:(NSInteger)component { return BZAlertSupport.assets.count; }
- (NSString *)pickerView:(UIPickerView *)pickerView titleForRow:(NSInteger)row forComponent:(NSInteger)component { return BZAlertSupport.assets[row]; }
- (NSDictionary *)formBody {
  if (![BZAlertSupport validThreshold:self.threshold.text]) { self.errorLabel.text = @"请填写不小于 0 的有效 USD 阈值，最多 18 位小数；不支持逗号或科学计数法。"; return nil; }
  NSMutableDictionary *b = [@{@"direction":self.direction.selectedSegmentIndex == 1 ? @"below" : @"above",@"threshold_usd":self.threshold.text} mutableCopy];
  if (!self.rule) b[@"asset"] = BZAlertSupport.assets[[self.asset selectedRowInComponent:0]]; return b;
}
- (void)setFormEnabled:(BOOL)enabled { self.asset.userInteractionEnabled = enabled && !self.rule; self.direction.enabled = enabled; self.threshold.enabled = enabled; }
- (void)save {
  if (self.saving) return; [self.view endEditing:YES]; NSDictionary *body = self.pendingBody ?: [self formBody]; if (!body) return;
  self.pendingBody = [body copy]; self.saving = YES; self.navigationController.modalInPresentation = YES; [self setFormEnabled:NO]; self.navigationItem.rightBarButtonItem.enabled = NO; self.navigationItem.leftBarButtonItem.enabled = NO; self.errorLabel.text = @"正在保存…";
  NSDictionary *headers = self.rule ? @{@"If-Match":self.rule[@"version"]} : @{@"Idempotency-Key":self.idempotencyKey};
  [BZAPIClient.shared request:self.rule ? @"PATCH" : @"POST" path:self.rule ? [@"/alerts/" stringByAppendingString:self.rule[@"id"]] : @"/alerts" body:body headers:headers completion:^(NSDictionary *json, NSError *error) {
    self.saving = NO; self.navigationController.modalInPresentation = NO; self.navigationItem.leftBarButtonItem.enabled = YES; self.navigationItem.rightBarButtonItem.enabled = YES;
    BOOL responseValid = [BZAlertSupport validSavedRule:json[@"alert"]] && (!self.rule || [json[@"alert"][@"id"] isEqual:self.rule[@"id"]]) && (self.rule || CFGetTypeID((__bridge CFTypeRef)(json[@"triggered_immediately"] ?: NSNull.null)) == CFBooleanGetTypeID());
    if (!error && responseValid) {
      NSString *message = self.rule ? @"已按新条件重新生效" : [json[@"triggered_immediately"] boolValue] ? @"当前价已越线：已立即推送一条 Telegram，该提醒已停用" : nil;
      [NSNotificationCenter.defaultCenter postNotificationName:BZAlertsDidChange object:nil]; [self dismissViewControllerAnimated:YES completion:^{ self.completion(message); }]; return;
    }
    self.errorLabel.text = error ? [BZLedgerSupport errorText:error] : @"保存响应格式错误";
    if ([error.domain isEqual:@"BZAPI"] && (error.code == 412 || error.code == 404)) { self.navigationItem.rightBarButtonItem.enabled = NO; self.navigationItem.leftBarButtonItem.title = @"关闭并刷新"; self.errorLabel.text = [self.errorLabel.text stringByAppendingString:@"\n请关闭并刷新列表，重新打开最新规则。若上次保存已成功，列表将显示结果。"]; }
    else if ([error.domain isEqual:@"BZAPI"] && error.code >= 400 && error.code < 500) { self.pendingBody = nil; self.idempotencyKey = NSUUID.UUID.UUIDString; [self setFormEnabled:YES]; self.navigationItem.rightBarButtonItem.title = @"保存"; }
    else { self.navigationItem.rightBarButtonItem.title = @"重试保存"; self.errorLabel.text = [self.errorLabel.text stringByAppendingString:@"\n结果尚未确认，重试会复用原请求；关闭后请先刷新列表核对。"]; }
  }];
}
- (void)cancel { if (!self.saving) { [self dismissViewControllerAnimated:YES completion:^{ self.completion(nil); }]; } }
@end
