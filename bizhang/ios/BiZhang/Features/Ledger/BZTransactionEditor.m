#import "BZTransactionEditor.h"
#import "BZAPIClient.h"
#import "BZLedgerSupport.h"
#import "BZTheme.h"
@interface BZTransactionEditor ()
@property(nonatomic) NSDictionary *transaction;
@property(nonatomic, copy) void (^completion)(void);
@property(nonatomic) UISegmentedControl *side;
@property(nonatomic) UIButton *asset;
@property(nonatomic) UITextField *quantity;
@property(nonatomic) UITextField *price;
@property(nonatomic) UITextField *fee;
@property(nonatomic) UITextField *note;
@property(nonatomic) UILabel *priceLabel;
@property(nonatomic) UILabel *errorLabel;
@property(nonatomic) UIDatePicker *date;
@property(nonatomic) NSString *symbol;
@property(nonatomic) NSString *idempotencyKey;
@property(nonatomic) NSDictionary *pendingBody;
@property(nonatomic) BOOL saving;
@property(nonatomic) BOOL wasOpening;
@end
@implementation BZTransactionEditor
- (instancetype)initWithTransaction:(NSDictionary *)transaction completion:(void (^)(void))completion {
  if ((self = [super init])) { _transaction = transaction; _completion = [completion copy]; _idempotencyKey = NSUUID.UUID.UUIDString; _symbol = transaction[@"asset"] ?: @"BTC"; } return self;
}
- (UITextField *)field:(NSString *)name value:(NSString *)value numeric:(BOOL)numeric stack:(UIStackView *)stack {
  UILabel *label = [UILabel new]; label.text = name; label.font = [UIFont preferredFontForTextStyle:UIFontTextStyleSubheadline]; label.textColor = BZTheme.muted; [stack addArrangedSubview:label];
  UITextField *field = [UITextField new]; field.borderStyle = UITextBorderStyleRoundedRect; field.text = value; field.accessibilityLabel = name; field.font = [UIFont preferredFontForTextStyle:UIFontTextStyleBody]; field.adjustsFontForContentSizeCategory = YES;
  field.keyboardType = numeric ? UIKeyboardTypeDecimalPad : UIKeyboardTypeDefault; field.autocorrectionType = UITextAutocorrectionTypeNo;
  [field.heightAnchor constraintGreaterThanOrEqualToConstant:44].active = YES; [stack addArrangedSubview:field]; return field;
}
- (NSString *)editable:(id)value {
  if (![value isKindOfClass:NSString.class]) return @"";
  NSMutableString *s = [value mutableCopy]; if ([s containsString:@"."]) { while ([s hasSuffix:@"0"]) [s deleteCharactersInRange:NSMakeRange(s.length-1,1)]; if ([s hasSuffix:@"."]) [s deleteCharactersInRange:NSMakeRange(s.length-1,1)]; } return s;
}
- (void)viewDidLoad {
  [super viewDidLoad]; self.title = self.transaction ? @"编辑交易" : @"记一笔"; self.view.backgroundColor = BZTheme.background;
  self.navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"取消" style:UIBarButtonItemStylePlain target:self action:@selector(cancel)];
  self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"保存" style:UIBarButtonItemStyleDone target:self action:@selector(save)];
  UIScrollView *scroll = [UIScrollView new]; scroll.translatesAutoresizingMaskIntoConstraints = NO; scroll.keyboardDismissMode = UIScrollViewKeyboardDismissModeOnDrag; [self.view addSubview:scroll];
  UIStackView *stack = [UIStackView new]; stack.axis = UILayoutConstraintAxisVertical; stack.spacing = 10; stack.translatesAutoresizingMaskIntoConstraints = NO; [scroll addSubview:stack];
  [NSLayoutConstraint activateConstraints:@[[scroll.topAnchor constraintEqualToAnchor:self.view.safeAreaLayoutGuide.topAnchor],[scroll.leadingAnchor constraintEqualToAnchor:self.view.leadingAnchor],[scroll.trailingAnchor constraintEqualToAnchor:self.view.trailingAnchor],[scroll.bottomAnchor constraintEqualToAnchor:self.view.keyboardLayoutGuide.topAnchor],[stack.topAnchor constraintEqualToAnchor:scroll.contentLayoutGuide.topAnchor constant:20],[stack.bottomAnchor constraintEqualToAnchor:scroll.contentLayoutGuide.bottomAnchor constant:-24],[stack.leadingAnchor constraintEqualToAnchor:scroll.contentLayoutGuide.leadingAnchor constant:20],[stack.trailingAnchor constraintEqualToAnchor:scroll.contentLayoutGuide.trailingAnchor constant:-20],[stack.widthAnchor constraintEqualToAnchor:scroll.frameLayoutGuide.widthAnchor constant:-40]]];
  self.side = [[UISegmentedControl alloc] initWithItems:@[@"买入",@"卖出",@"期初"]]; self.side.selectedSegmentIndex = [@[@"buy",@"sell",@"opening"] indexOfObject:self.transaction[@"side"] ?: @"buy"]; self.side.accessibilityLabel = @"方向"; [self.side addTarget:self action:@selector(sideChanged) forControlEvents:UIControlEventValueChanged]; [stack addArrangedSubview:self.side];
  self.asset = [UIButton buttonWithType:UIButtonTypeSystem]; [self.asset setTitle:[@"币种 · " stringByAppendingString:self.symbol] forState:UIControlStateNormal]; self.asset.accessibilityLabel = @"币种";
  NSMutableArray *actions = [NSMutableArray new]; __weak typeof(self) weakSelf = self;
  for (NSString *symbol in @[@"BTC",@"ETH",@"SOL",@"USDT",@"USDC",@"BNB",@"XRP",@"DOGE",@"ADA",@"LINK"]) [actions addObject:[UIAction actionWithTitle:symbol image:nil identifier:nil handler:^(UIAction *a) { weakSelf.symbol = symbol; [weakSelf.asset setTitle:[@"币种 · " stringByAppendingString:symbol] forState:UIControlStateNormal]; }]];
  self.asset.menu = [UIMenu menuWithChildren:actions]; self.asset.showsMenuAsPrimaryAction = YES; [self.asset.heightAnchor constraintGreaterThanOrEqualToConstant:44].active = YES; [stack addArrangedSubview:self.asset];
  self.quantity = [self field:@"数量（最多 8 位小数）" value:[self editable:self.transaction[@"quantity"]] numeric:YES stack:stack];
  self.priceLabel = [UILabel new]; self.priceLabel.font = [UIFont preferredFontForTextStyle:UIFontTextStyleSubheadline]; self.priceLabel.textColor = BZTheme.muted; [stack addArrangedSubview:self.priceLabel];
  self.price = [UITextField new]; self.price.font = [UIFont preferredFontForTextStyle:UIFontTextStyleBody]; self.price.adjustsFontForContentSizeCategory = YES; self.price.borderStyle = UITextBorderStyleRoundedRect; self.price.keyboardType = UIKeyboardTypeDecimalPad; self.price.text = [self editable:self.transaction[[self.transaction[@"side"] isEqual:@"opening"] ? @"opening_cost_usd" : @"price_usd"]]; [self.price.heightAnchor constraintGreaterThanOrEqualToConstant:44].active = YES; [stack addArrangedSubview:self.price];
  self.fee = [self field:@"手续费（USD，最多 8 位小数）" value:self.transaction ? [self editable:self.transaction[@"fee_amount"]] : @"0" numeric:YES stack:stack];
  UILabel *dateLabel = [UILabel new]; dateLabel.text = @"成交时间 · 新加坡时间 SGT"; dateLabel.font = [UIFont preferredFontForTextStyle:UIFontTextStyleSubheadline]; dateLabel.textColor = BZTheme.muted; [stack addArrangedSubview:dateLabel];
  self.date = [UIDatePicker new]; self.date.datePickerMode = UIDatePickerModeDateAndTime; self.date.preferredDatePickerStyle = UIDatePickerStyleCompact; self.date.timeZone = [NSTimeZone timeZoneWithName:@"Asia/Singapore"]; self.date.locale = [NSLocale localeWithLocaleIdentifier:@"zh_CN"]; self.date.date = [BZLedgerSupport date:self.transaction[@"traded_at"]] ?: NSDate.date; self.date.accessibilityLabel = @"成交时间 SGT"; [stack addArrangedSubview:self.date];
  self.note = [self field:@"备注（选填，最多 200 字）" value:self.transaction[@"note"] numeric:NO stack:stack];
  self.errorLabel = [UILabel new]; self.errorLabel.numberOfLines = 0; self.errorLabel.font = [UIFont preferredFontForTextStyle:UIFontTextStyleSubheadline]; self.errorLabel.textColor = UIColor.systemRedColor; self.errorLabel.accessibilityIdentifier = @"ledger.error"; [stack addArrangedSubview:self.errorLabel];
  self.wasOpening = self.side.selectedSegmentIndex == 2; [self sideChanged];
}
- (void)sideChanged { BOOL opening = self.side.selectedSegmentIndex == 2; if (opening != self.wasOpening) self.price.text = @""; self.wasOpening = opening; self.priceLabel.text = opening ? @"期初总成本（USD，必须填写）" : @"成交价（USD，最多 8 位小数）"; self.price.accessibilityLabel = self.priceLabel.text; self.fee.enabled = !opening && !self.pendingBody; }
- (NSDictionary *)formBody {
  BOOL opening = self.side.selectedSegmentIndex == 2;
  if (![BZLedgerSupport validInput:self.quantity.text positive:YES scale:8] || ![BZLedgerSupport validInput:self.price.text positive:NO scale:opening ? 18 : 8] || (!opening && ![BZLedgerSupport validInput:self.fee.text positive:NO scale:8])) { self.errorLabel.text = @"请填写有效数值：数量大于 0，价格、成本和手续费不小于 0；不支持逗号或科学计数法。"; return nil; }
  __block NSUInteger length = 0; [self.note.text enumerateSubstringsInRange:NSMakeRange(0,self.note.text.length) options:NSStringEnumerationByComposedCharacterSequences usingBlock:^(NSString *s, NSRange r, NSRange enclosing, BOOL *stop) { length++; }];
  if (length > 200) { self.errorLabel.text = @"备注最多 200 字"; return nil; }
  NSCalendar *calendar = [NSCalendar calendarWithIdentifier:NSCalendarIdentifierGregorian]; NSDate *minute = [calendar dateBySettingUnit:NSCalendarUnitSecond value:0 ofDate:self.date.date options:0];
  NSMutableDictionary *body = [@{@"asset":self.symbol,@"side":@[@"buy",@"sell",@"opening"][self.side.selectedSegmentIndex],@"quantity":self.quantity.text,@"traded_at":[NSISO8601DateFormatter.new stringFromDate:minute],@"fee_amount":opening ? @"0" : self.fee.text,@"fee_currency":@"USD",@"note":self.note.text ?: @""} mutableCopy];
  body[opening ? @"opening_cost_usd" : @"price_usd"] = self.price.text; return body;
}
- (void)setFormEnabled:(BOOL)enabled { for (UIControl *c in @[self.side,self.asset,self.quantity,self.price,self.fee,self.date,self.note]) c.enabled = enabled; if (enabled) [self sideChanged]; }
- (void)save {
  if (self.saving) return; [self.view endEditing:YES];
  NSDictionary *body = self.pendingBody ?: [self formBody]; if (!body) return;
  self.pendingBody = body; self.saving = YES; self.modalInPresentation = YES; self.navigationController.modalInPresentation = YES; [self setFormEnabled:NO]; self.navigationItem.rightBarButtonItem.enabled = NO; self.navigationItem.leftBarButtonItem.enabled = NO; self.errorLabel.text = @"正在保存…";
  NSDictionary *headers = self.transaction ? @{@"If-Match":self.transaction[@"version"]} : @{@"Idempotency-Key":self.idempotencyKey};
  NSString *path = self.transaction ? [@"/transactions/" stringByAppendingString:self.transaction[@"id"]] : @"/transactions";
  __weak typeof(self) weakSelf = self;
  [BZAPIClient.shared request:self.transaction ? @"PUT" : @"POST" path:path body:body headers:headers completion:^(NSDictionary *json, NSError *error) {
    typeof(self) self = weakSelf; if (!self) return; self.saving = NO; self.modalInPresentation = NO; self.navigationController.modalInPresentation = NO; self.navigationItem.leftBarButtonItem.enabled = YES; self.navigationItem.rightBarButtonItem.enabled = YES;
    if (!error) { self.completion(); [self dismissViewControllerAnimated:YES completion:nil]; return; }
    self.errorLabel.text = [BZLedgerSupport errorText:error];
    if (error.code == 412 || error.code == 404) { self.navigationItem.rightBarButtonItem.enabled = NO; self.navigationItem.leftBarButtonItem.title = @"关闭并刷新"; self.completion(); self.errorLabel.text = [self.errorLabel.text stringByAppendingString:@"\n请关闭并重新打开最新记录。若上次保存已成功，列表将显示结果。"]; }
    else if ([error.domain isEqual:@"BZAPI"] && error.code >= 400 && error.code < 500) { self.pendingBody = nil; [self setFormEnabled:YES]; }
    else { self.navigationItem.rightBarButtonItem.title = @"重试保存"; self.errorLabel.text = [self.errorLabel.text stringByAppendingString:@"\n结果尚未确认，重试会复用原请求；关闭后请先刷新列表核对。"]; }
  }];
}
- (void)cancel { if (!self.saving) [self dismissViewControllerAnimated:YES completion:nil]; }
@end
