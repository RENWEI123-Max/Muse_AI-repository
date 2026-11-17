#import "BZSettingsViewController.h"
#import "BZAPIClient.h"
#import "BZSettingsWriter.h"
#import "BZAlertSupport.h"
#import "BZLedgerSupport.h"
#import "BZSessionManager.h"
#import "BZTheme.h"
#import "BZCurrencySwitch.h"
@interface BZSettingsViewController ()
@property(nonatomic) NSDictionary *user;
@property(nonatomic) NSDictionary *binding;
@property(nonatomic) NSString *failure;
@property(nonatomic) NSString *bindingFailure;
@property(nonatomic) BZCurrencySwitch *currencySwitch;
@property(nonatomic) UISwitch *summarySwitch;
@property(nonatomic) BOOL saving;
@property(nonatomic) NSUInteger generation;
@end
@implementation BZSettingsViewController
- (instancetype)init { return [super initWithStyle:UITableViewStyleInsetGrouped]; }
- (void)viewDidLoad {
  [super viewDidLoad]; self.title = @"设置"; self.view.backgroundColor = BZTheme.background; self.tableView.rowHeight = UITableViewAutomaticDimension; self.tableView.estimatedRowHeight = 70;
  self.currencySwitch = [BZCurrencySwitch new]; self.currencySwitch.enabled = NO; [self.currencySwitch addTarget:self action:@selector(currencyChanged) forControlEvents:UIControlEventValueChanged];
  self.summarySwitch = [UISwitch new]; self.summarySwitch.enabled = NO; self.summarySwitch.accessibilityLabel = @"每日汇总"; [self.summarySwitch addTarget:self action:@selector(summaryChanged) forControlEvents:UIControlEventValueChanged];
  self.refreshControl = [UIRefreshControl new]; [self.refreshControl addTarget:self action:@selector(refresh) forControlEvents:UIControlEventValueChanged];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(refresh) name:UIApplicationDidBecomeActiveNotification object:nil];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(settingsChanged:) name:BZSettingsDidChange object:nil];
}
- (void)viewWillAppear:(BOOL)animated { [super viewWillAppear:animated]; [self refresh]; }
- (void)applyUser:(NSDictionary *)user {
  self.user = user; self.currencySwitch.selectedSegmentIndex = [user[@"display_currency"] isEqual:@"SGD"] ? 1 : 0; self.summarySwitch.on = [user[@"daily_summary_enabled"] boolValue]; self.currencySwitch.enabled = user && !self.saving; self.summarySwitch.enabled = user && !self.saving;
  [self.tableView reloadData];
}
- (void)settingsChanged:(NSNotification *)n { if ([BZAlertSupport validUser:@{@"user":n.object ?: NSNull.null}]) { self.generation++; [self applyUser:n.object]; } }
- (void)refresh {
  if (self.saving) { [self.refreshControl endRefreshing]; return; } NSUInteger generation = ++self.generation;
  [BZAPIClient.shared request:@"GET" path:@"/me" body:nil completion:^(NSDictionary *json, NSError *error) {
    if (generation != self.generation) return; [self.refreshControl endRefreshing];
    BOOL valid = !error && [BZAlertSupport validUser:json]; self.failure = valid ? nil : error ? [BZLedgerSupport errorText:error] : @"账号数据格式错误，请刷新";
    [self applyUser:valid ? json[@"user"] : nil]; if (valid) [BZSessionManager cacheUser:self.user];
  }];
  [BZAPIClient.shared request:@"GET" path:@"/telegram/binding" body:nil completion:^(NSDictionary *json, NSError *error) {
    if (generation != self.generation) return; BOOL valid = !error && [BZAlertSupport validBinding:json]; self.binding = valid ? json : nil; self.bindingFailure = valid ? nil : error ? [BZLedgerSupport errorText:error] : @"绑定数据格式错误"; [self.tableView reloadData];
  }];
}
- (void)currencyChanged { NSString *currency = self.currencySwitch.currency; [self applyUser:self.user]; [self save:@{@"display_currency":currency}]; }
- (void)summaryChanged { BOOL enabled = self.summarySwitch.on; [self applyUser:self.user]; [self save:@{@"daily_summary_enabled":@(enabled)}]; }
- (void)save:(NSDictionary *)body {
  if (self.saving || !self.user) return; self.saving = YES; self.generation++; self.failure = @"正在保存…"; [self applyUser:self.user];
  [BZSettingsWriter save:body completion:^(NSDictionary *json, NSError *error) {
    self.saving = NO;
    if (!error && [BZAlertSupport validUser:json]) { self.failure = nil; [self applyUser:json[@"user"]]; [BZSessionManager cacheUser:self.user]; [NSNotificationCenter.defaultCenter postNotificationName:BZSettingsDidChange object:self.user]; }
    else {
      NSString *message = error ? [BZLedgerSupport errorText:error] : @"设置响应格式错误"; self.failure = message; self.currencySwitch.enabled = NO; self.summarySwitch.enabled = NO; [self.tableView reloadData];
      UIAlertController *a = [UIAlertController alertControllerWithTitle:@"保存尚未确认" message:[message stringByAppendingString:@"\n将重新读取服务端设置，请核对后再操作。"] preferredStyle:UIAlertControllerStyleAlert]; [a addAction:[UIAlertAction actionWithTitle:@"刷新" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action) { [self refresh]; }]]; [self presentViewController:a animated:YES completion:nil];
    }
  }];
}
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView { return 3; }
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section { return section == 0 ? 2 : section == 1 ? 2 : 1; }
- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section { return @[@"账号",@"显示与推送",@"Telegram"][section]; }
- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section {
  if (section == 0) return self.failure;
  if (section != 2) return nil;
  NSString *version = [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"] ?: @"—"; NSString *build = [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleVersion"] ?: @"—";
  return [NSString stringWithFormat:@"币账 %@（%@）\n\n行情数据：Binance、Kraken；校验：CoinGecko（Data provided by CoinGecko）；汇率：Coinbase\n仅供记录，不构成投资建议",version,build];
}
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)path {
  UITableViewCell *c = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:nil]; c.backgroundColor = BZTheme.surface; c.textLabel.textColor = BZTheme.ink; c.detailTextLabel.textColor = BZTheme.muted; c.textLabel.font = [BZTheme cappedFontForTextStyle:UIFontTextStyleBody maxPointSize:20]; c.detailTextLabel.font = [BZTheme cappedFontForTextStyle:UIFontTextStyleSubheadline maxPointSize:18]; c.textLabel.numberOfLines = 0; c.detailTextLabel.numberOfLines = 0; c.textLabel.adjustsFontForContentSizeCategory = YES; c.detailTextLabel.adjustsFontForContentSizeCategory = YES; c.selectionStyle = UITableViewCellSelectionStyleNone;
  if (path.section == 0 && path.row == 0) { c.textLabel.text = @"用户名"; c.detailTextLabel.text = self.user[@"username"] ?: @"账号信息暂不可用，请下拉刷新"; }
  else if (path.section == 0) { c.textLabel.text = @"退出登录"; c.textLabel.textColor = UIColor.systemRedColor; c.selectionStyle = UITableViewCellSelectionStyleDefault; }
  else if (path.section == 1 && path.row == 0) { c.textLabel.text = @"显示币种"; c.accessoryView = self.currencySwitch; }
  else if (path.section == 1) { c.textLabel.text = @"每日汇总"; c.detailTextLabel.text = @"每天 21:00 SGT 推送持仓汇总"; c.accessoryView = self.summarySwitch; }
  else { c.textLabel.text = [BZAlertSupport bindingText:self.binding]; c.detailTextLabel.text = self.bindingFailure ?: @"前往提醒页管理绑定"; c.accessoryType = UITableViewCellAccessoryDisclosureIndicator; c.selectionStyle = UITableViewCellSelectionStyleDefault; }
  return c;
}
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)path { [tableView deselectRowAtIndexPath:path animated:YES]; if (path.section == 2) self.tabBarController.selectedIndex = 3; else if (path.section == 0 && path.row == 1) [BZAPIClient.shared logout:^{}]; }
- (void)dealloc { [NSNotificationCenter.defaultCenter removeObserver:self]; }
@end
