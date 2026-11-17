#import "BZAlertsViewController.h"
#import "BZAlertSupport.h"
#import "BZAlertEditor.h"
#import "BZAPIClient.h"
#import "BZLedgerSupport.h"
#import "BZTheme.h"
@interface BZAlertsViewController ()
@property(nonatomic) NSArray *rules;
@property(nonatomic) NSArray *events;
@property(nonatomic) NSDictionary *binding;
@property(nonatomic) NSDictionary *bindInfo;
@property(nonatomic) NSString *rulesError;
@property(nonatomic) NSString *eventsError;
@property(nonatomic) NSString *bindingError;
@property(nonatomic) BOOL bindingBusy;
@property(nonatomic) NSDictionary *pendingMutation;
@property(nonatomic) BOOL writing;
@property(nonatomic) NSUInteger generation;
@end
@implementation BZAlertsViewController
- (instancetype)init { return [super initWithStyle:UITableViewStyleInsetGrouped]; }
- (void)viewDidLoad {
  [super viewDidLoad]; self.title = @"提醒"; self.view.backgroundColor = BZTheme.background; self.tableView.rowHeight = UITableViewAutomaticDimension; self.tableView.estimatedRowHeight = 120;
  self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"新建" style:UIBarButtonItemStylePlain target:self action:@selector(create)];
  self.refreshControl = [UIRefreshControl new]; [self.refreshControl addTarget:self action:@selector(refresh) forControlEvents:UIControlEventValueChanged];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(refresh) name:UIApplicationDidBecomeActiveNotification object:nil];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(refresh) name:BZAlertsDidChange object:nil];
}
- (void)viewWillAppear:(BOOL)animated { [super viewWillAppear:animated]; [self refresh]; }
- (void)refresh {
  NSUInteger generation = ++self.generation;
  for (NSString *path in @[@"/alerts",@"/alerts/events?limit=100",@"/telegram/binding"]) {
    [BZAPIClient.shared request:@"GET" path:path body:nil completion:^(NSDictionary *json, NSError *error) {
      if (generation != self.generation) return;
      NSString *failure = error ? [BZLedgerSupport errorText:error] : @"数据格式错误，请下拉刷新";
      if ([path isEqual:@"/alerts"]) { BOOL valid = !error && [BZAlertSupport validAlerts:json]; self.rules = valid ? json[@"alerts"] : nil; self.rulesError = valid ? nil : failure; }
      else if ([path hasPrefix:@"/alerts/events"]) { BOOL valid = !error && [BZAlertSupport validEvents:json]; self.events = valid ? json[@"events"] : nil; self.eventsError = valid ? nil : failure; }
      else { BOOL valid = !error && [BZAlertSupport validBinding:json]; self.binding = valid ? json : nil; self.bindingError = valid ? nil : failure; if ([json[@"bound"] isEqual:@YES]) self.bindInfo = nil; }
      [self.refreshControl endRefreshing]; [self.tableView reloadData];
    }];
  }
}
- (void)message:(NSString *)message {
  UIAlertController *a = [UIAlertController alertControllerWithTitle:@"提醒" message:message preferredStyle:UIAlertControllerStyleAlert]; [a addAction:[UIAlertAction actionWithTitle:@"知道了" style:UIAlertActionStyleDefault handler:nil]]; [self presentViewController:a animated:YES completion:nil];
}
- (void)confirm:(NSString *)message action:(NSString *)title destructive:(BOOL)destructive completion:(void (^)(void))completion {
  UIAlertController *a = [UIAlertController alertControllerWithTitle:title message:message preferredStyle:UIAlertControllerStyleAlert]; [a addAction:[UIAlertAction actionWithTitle:@"取消" style:UIAlertActionStyleCancel handler:nil]]; [a addAction:[UIAlertAction actionWithTitle:title style:destructive ? UIAlertActionStyleDestructive : UIAlertActionStyleDefault handler:^(UIAlertAction *action) { completion(); }]]; [self presentViewController:a animated:YES completion:nil];
}
- (void)create { if (!self.pendingMutation) [self edit:nil]; }
- (void)edit:(NSDictionary *)rule {
  BZAlertEditor *editor = [[BZAlertEditor alloc] initWithRule:rule completion:^(NSString *message) { [self refresh]; if (message) [self message:message]; }];
  UINavigationController *nav = [[UINavigationController alloc] initWithRootViewController:editor]; nav.sheetPresentationController.detents = @[UISheetPresentationControllerDetent.largeDetent]; [self presentViewController:nav animated:YES completion:nil];
}
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView { return 3; }
- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section { return @[@"Telegram",@"价格提醒",@"触发历史 · SGT"][section]; }
- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section { return section == 2 && self.events.count == 100 ? @"显示最近 100 条触发记录" : nil; }
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section { return section == 0 ? 1 : MAX(1,section == 1 ? self.rules.count : self.events.count); }
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)path {
  UITableViewCell *cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:nil]; cell.backgroundColor = BZTheme.surface; cell.textLabel.textColor = BZTheme.ink; cell.detailTextLabel.textColor = BZTheme.muted; cell.textLabel.numberOfLines = 0; cell.detailTextLabel.numberOfLines = 0; cell.selectionStyle = UITableViewCellSelectionStyleNone; cell.textLabel.font = [BZTheme cappedFontForTextStyle:UIFontTextStyleHeadline maxPointSize:22]; cell.detailTextLabel.font = [BZTheme cappedFontForTextStyle:UIFontTextStyleSubheadline maxPointSize:18]; cell.textLabel.adjustsFontForContentSizeCategory = YES; cell.detailTextLabel.adjustsFontForContentSizeCategory = YES;
  if (path.section == 0) {
    UIStackView *stack = [UIStackView new]; stack.axis = UILayoutConstraintAxisVertical; stack.spacing = 12; stack.translatesAutoresizingMaskIntoConstraints = NO; [cell.contentView addSubview:stack]; UILayoutGuide *margin = cell.contentView.layoutMarginsGuide;
    [NSLayoutConstraint activateConstraints:@[[stack.topAnchor constraintEqualToAnchor:margin.topAnchor constant:6],[stack.bottomAnchor constraintEqualToAnchor:margin.bottomAnchor constant:-6],[stack.leadingAnchor constraintEqualToAnchor:margin.leadingAnchor],[stack.trailingAnchor constraintEqualToAnchor:margin.trailingAnchor]]];
    UILabel *status = [UILabel new]; status.text = [BZAlertSupport bindingText:self.binding]; status.font = [BZTheme cappedFontForTextStyle:UIFontTextStyleHeadline maxPointSize:22]; status.textColor = BZTheme.ink; status.numberOfLines = 0; [stack addArrangedSubview:status];
    UILabel *detail = [UILabel new]; detail.numberOfLines = 0; detail.font = [BZTheme cappedFontForTextStyle:UIFontTextStyleSubheadline maxPointSize:18]; detail.textColor = BZTheme.muted;
    detail.text = self.bindingError ?: (self.bindInfo ? ([self.bindInfo[@"bot_configured"] boolValue] ? @"请在 Telegram 中发送 /start 完成绑定，返回后自动刷新。" : @"机器人尚未配置，请使用以下凭据在机器人中发送 /start") : @"价格提醒与每日汇总通过 Telegram 投递。"); [stack addArrangedSubview:detail];
    if (self.bindInfo && ![self.bindInfo[@"bot_configured"] boolValue]) {
      UILabel *token = [UILabel new]; token.text = self.bindInfo[@"token"]; token.numberOfLines = 0; token.font = [UIFont monospacedSystemFontOfSize:14 weight:UIFontWeightRegular]; token.textColor = BZTheme.ink; token.accessibilityIdentifier = @"telegram.temporary-token"; [stack addArrangedSubview:token];
      UIButton *copy = [UIButton buttonWithType:UIButtonTypeSystem]; [copy setTitle:@"复制凭据" forState:UIControlStateNormal]; [copy addTarget:self action:@selector(copyToken) forControlEvents:UIControlEventTouchUpInside]; [copy.heightAnchor constraintGreaterThanOrEqualToConstant:44].active = YES; [stack addArrangedSubview:copy];
      UILabel *expiry = [UILabel new]; expiry.numberOfLines = 0; expiry.font = [BZTheme cappedFontForTextStyle:UIFontTextStyleCaption1 maxPointSize:15]; expiry.textColor = BZTheme.muted; expiry.text = [@"凭据单次有效 · 过期时间 " stringByAppendingString:[BZLedgerSupport timestamp:self.bindInfo[@"expires_at"]]]; [stack addArrangedSubview:expiry];
    }
    UIButton *button = [UIButton buttonWithType:UIButtonTypeSystem]; [button setTitle:[self.binding[@"bound"] boolValue] ? @"解除绑定" : self.binding ? @"绑定 Telegram" : @"刷新绑定状态" forState:UIControlStateNormal]; button.enabled = !self.bindingBusy; [button addTarget:self action:@selector(bindingAction) forControlEvents:UIControlEventTouchUpInside]; [button.heightAnchor constraintGreaterThanOrEqualToConstant:44].active = YES; [stack addArrangedSubview:button];
  } else if (path.section == 1 && self.rules.count) {
    NSDictionary *r = self.rules[path.row]; cell.textLabel.text = r[@"asset"]; cell.detailTextLabel.text = [BZAlertSupport ruleText:r]; cell.selectionStyle = UITableViewCellSelectionStyleDefault;
    UIButton *button = [UIButton buttonWithType:UIButtonTypeSystem]; button.tag = path.row; [button setTitle:[r[@"state"] isEqual:@"active"] ? @"停用" : @"重新开启" forState:UIControlStateNormal]; button.enabled = !self.pendingMutation; [button addTarget:self action:@selector(toggle:) forControlEvents:UIControlEventTouchUpInside]; button.frame = CGRectMake(0,0,90,44); cell.accessoryView = button;
  } else if (path.section == 2 && self.events.count) {
    NSDictionary *event = self.events[path.row]; cell.textLabel.text = event[@"asset"]; cell.detailTextLabel.text = [BZAlertSupport eventText:event];
  } else { cell.textLabel.text = path.section == 1 ? @"暂无提醒" : @"暂无触发历史"; cell.detailTextLabel.text = path.section == 1 ? self.rulesError ?: @"新建价格提醒，到价后触发一次并停用。" : self.eventsError ?: @"尚无触发记录。"; if ((path.section == 1 && self.rulesError) || (path.section == 2 && self.eventsError)) cell.textLabel.text = @"服务暂不可用"; }
  return cell;
}
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)path { [tableView deselectRowAtIndexPath:path animated:YES]; if (path.section == 1 && self.rules.count && !self.pendingMutation) [self edit:self.rules[path.row]]; }
- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)path { return path.section == 1 && self.rules.count && !self.pendingMutation; }
- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)style forRowAtIndexPath:(NSIndexPath *)path {
  if (style != UITableViewCellEditingStyleDelete || self.pendingMutation || path.row >= self.rules.count) return;
  NSDictionary *rule = self.rules[path.row]; [self confirm:@"删除后不会再触发，已有历史仍保留。" action:@"删除提醒" destructive:YES completion:^{ [self beginMutation:@"DELETE" rule:rule body:nil]; }];
}
- (void)toggle:(UIButton *)button {
  if (self.pendingMutation || button.tag >= self.rules.count) return; NSDictionary *rule = self.rules[button.tag]; BOOL enabled = ![rule[@"state"] isEqual:@"active"];
  void (^patch)(void) = ^{ [self beginMutation:@"PATCH" rule:rule body:@{@"enabled":@(enabled)}]; };
  if (enabled && [BZAlertSupport restartNeedsConfirmation:rule]) [self confirm:@"当前价已越线，重启后会立即再推送一次" action:@"重新开启" destructive:NO completion:patch]; else patch();
}
- (void)beginMutation:(NSString *)method rule:(NSDictionary *)rule body:(NSDictionary *)body {
  if (self.pendingMutation) return;
  self.pendingMutation = @{@"method":method,@"path":[@"/alerts/" stringByAppendingString:rule[@"id"]],@"body":body ?: NSNull.null,@"headers":[method isEqual:@"PATCH"] ? @{@"If-Match":rule[@"version"]} : @{}}; [self retryMutation];
}
- (void)retryMutation {
  if (self.writing || !self.pendingMutation) return; self.writing = YES; self.navigationItem.rightBarButtonItem.enabled = NO; [self.tableView reloadData]; NSDictionary *m = self.pendingMutation;
  [BZAPIClient.shared request:m[@"method"] path:m[@"path"] body:m[@"body"] == NSNull.null ? nil : m[@"body"] headers:m[@"headers"] completion:^(NSDictionary *json, NSError *error) {
    self.writing = NO;
    BOOL valid = [m[@"method"] isEqual:@"DELETE"] ? CFGetTypeID((__bridge CFTypeRef)(json[@"ok"] ?: NSNull.null)) == CFBooleanGetTypeID() && [json[@"ok"] boolValue] : [BZAlertSupport validSavedRule:json[@"alert"]] && [[@"/alerts/" stringByAppendingString:json[@"alert"][@"id"]] isEqual:m[@"path"]];
    if (!error && !valid) error = [NSError errorWithDomain:@"BZResponse" code:0 userInfo:@{NSLocalizedDescriptionKey:@"保存响应格式错误"}];
    if (!error) { self.pendingMutation = nil; self.navigationItem.rightBarButtonItem.enabled = YES; [NSNotificationCenter.defaultCenter postNotificationName:BZAlertsDidChange object:nil]; return; }
    NSString *message = [BZLedgerSupport errorText:error];
    if ([error.domain isEqual:@"BZAPI"] && error.code >= 400 && error.code < 500) {
      self.pendingMutation = nil; self.navigationItem.rightBarButtonItem.enabled = YES; [self refresh];
      if (error.code == 412 || error.code == 404) message = [message stringByAppendingString:@"\n已停用本次保存，请刷新后重新操作。若上次已成功，列表将显示结果。"]; [self message:message];
    } else {
      UIAlertController *a = [UIAlertController alertControllerWithTitle:@"结果尚未确认" message:[message stringByAppendingString:@"\n重试复用原请求；关闭后先刷新核对。"] preferredStyle:UIAlertControllerStyleAlert];
      [a addAction:[UIAlertAction actionWithTitle:@"重试" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) { [self retryMutation]; }]];
      [a addAction:[UIAlertAction actionWithTitle:@"关闭并刷新" style:UIAlertActionStyleCancel handler:^(UIAlertAction *action) { self.pendingMutation = nil; self.navigationItem.rightBarButtonItem.enabled = YES; [self refresh]; }]]; [self presentViewController:a animated:YES completion:nil];
    }
  }];
}
- (void)bindingAction {
  if (self.bindingBusy) return; if (!self.binding) { [self refresh]; return; }
  if ([self.binding[@"bound"] boolValue]) [self confirm:@"解除后将停止向该 Telegram 投递消息。" action:@"解除绑定" destructive:YES completion:^{ [self bindingRequest:@"DELETE" path:@"/telegram/binding"]; }];
  else [self bindingRequest:@"POST" path:@"/telegram/bind-token"];
}
- (void)bindingRequest:(NSString *)method path:(NSString *)path {
  self.bindingBusy = YES; [self.tableView reloadData];
  [BZAPIClient.shared request:method path:path body:nil completion:^(NSDictionary *json, NSError *error) {
    self.bindingBusy = NO;
    if (error) { [self message:[BZLedgerSupport errorText:error]]; [self refresh]; return; }
    if ([method isEqual:@"DELETE"]) { self.bindInfo = nil; [self refresh]; return; }
    BOOL configured = [json[@"bot_configured"] isEqual:@YES]; NSURL *url = [json[@"bind_url"] isKindOfClass:NSString.class] ? [NSURL URLWithString:json[@"bind_url"]] : nil;
    if (CFGetTypeID((__bridge CFTypeRef)(json[@"bot_configured"] ?: NSNull.null)) != CFBooleanGetTypeID() || ![json[@"token"] isKindOfClass:NSString.class] || ![json[@"token"] length] || ![BZLedgerSupport date:json[@"expires_at"]] || (configured && (![[url.scheme lowercaseString] isEqual:@"https"] || ![[url.host lowercaseString] isEqual:@"t.me"]))) { [self message:@"绑定响应格式错误，请重试"]; return; }
    self.bindInfo = json; [self.tableView reloadData];
    if (configured) [UIApplication.sharedApplication openURL:url options:@{} completionHandler:^(BOOL success) { if (!success) [self message:@"无法打开 Telegram，请稍后重试"]; }];
  }];
}
- (void)copyToken { NSString *token = self.bindInfo[@"token"]; if (token) { [UIPasteboard.generalPasteboard setItems:@[@{@"public.utf8-plain-text":token}] options:@{UIPasteboardOptionLocalOnly:@YES,UIPasteboardOptionExpirationDate:[BZLedgerSupport date:self.bindInfo[@"expires_at"]] ?: [NSDate dateWithTimeIntervalSinceNow:600]}]; [self message:@"已复制凭据"]; } }
- (void)dealloc { [NSNotificationCenter.defaultCenter removeObserver:self]; }
@end
