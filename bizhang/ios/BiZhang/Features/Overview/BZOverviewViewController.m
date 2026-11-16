#import "BZOverviewViewController.h"
#import "BZAPIClient.h"
#import "BZSettingsWriter.h"
#import "BZCurrencySwitch.h"
#import "BZTheme.h"
#import "BZLedgerSupport.h"
#import "BZFormatter.h"
#import "BZMarketSnapshot.h"
#import "BZCacheStore.h"
#import "BZSessionManager.h"
#import "BZAlertSupport.h"
@interface BZOverviewViewController ()
@property(nonatomic) NSTimer *timer;
@property(nonatomic) BOOL loading;
@property(nonatomic) NSDictionary *portfolio;
@property(nonatomic) BZCurrencySwitch *currencySwitch;
@property(nonatomic) BOOL offline;
@property(nonatomic) NSString *failure;
@property(nonatomic) NSTimeInterval receivedAt;
@property(nonatomic) NSUInteger generation;
@property(nonatomic) BZMarketSnapshot *quotesSnapshot;
@property(nonatomic) BOOL quotesOffline;
@property(nonatomic) NSDictionary *alertsJSON;
@property(nonatomic) NSDictionary *eventsJSON;
@property(nonatomic) NSDictionary *summaryJSON;
@property(nonatomic) NSString *serverCurrency;
@property(nonatomic) BOOL currencySaving;
@end
@implementation BZOverviewViewController
- (instancetype)init { return [super initWithStyle:UITableViewStyleInsetGrouped]; }
- (void)viewDidLoad {
  [super viewDidLoad]; self.title = @"总览"; self.view.backgroundColor = BZTheme.background;
  self.tableView.rowHeight = UITableViewAutomaticDimension; self.tableView.estimatedRowHeight = 130;
  self.currencySwitch = [BZCurrencySwitch new];
  NSString *uid = BZCacheStore.cachedUserID;
  if (uid) {
    NSData *data = [NSData dataWithContentsOfURL:[[BZSessionManager.cacheRoot URLByAppendingPathComponent:uid] URLByAppendingPathComponent:@"me.json"]];
    NSDictionary *me = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
    if ([me[@"user"][@"display_currency"] isEqual:@"SGD"]) self.currencySwitch.selectedSegmentIndex = 1;
    BZCacheStore *store = [[BZCacheStore alloc] initWithUserID:uid]; self.quotesSnapshot = [[BZMarketSnapshot alloc] initWithJSON:store.marketEnvelope[@"json"] error:nil];
  }
  self.quotesOffline = YES; self.serverCurrency = self.currencySwitch.currency;
  [self.currencySwitch addTarget:self action:@selector(currencyChanged) forControlEvents:UIControlEventValueChanged];
  self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithCustomView:self.currencySwitch];
  NSDictionary *cache = [BZLedgerSupport cached:@"portfolio"]; if ([BZLedgerSupport validPortfolio:cache]) { self.portfolio = cache; self.offline = YES; }
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(refresh) name:@"BZLedgerDidChange" object:nil];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(refresh) name:BZAlertsDidChange object:nil];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(settingsChanged:) name:BZSettingsDidChange object:nil];
  self.refreshControl = [UIRefreshControl new]; [self.refreshControl addTarget:self action:@selector(refresh) forControlEvents:UIControlEventValueChanged];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(stop) name:UIApplicationDidEnterBackgroundNotification object:nil];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(resume) name:UIApplicationDidBecomeActiveNotification object:nil];
}
- (void)viewDidAppear:(BOOL)animated { [super viewDidAppear:animated]; [self resume]; }
- (void)viewWillDisappear:(BOOL)animated { [super viewWillDisappear:animated]; [self stop]; }
- (void)resume {
  if (!self.view.window || UIApplication.sharedApplication.applicationState == UIApplicationStateBackground) return;
  [self stop]; [self refresh]; __weak typeof(self) weakSelf = self;
  self.timer = [NSTimer scheduledTimerWithTimeInterval:60 repeats:YES block:^(NSTimer *t) { [weakSelf refresh]; }];
}
- (void)stop { [self.timer invalidate]; self.timer = nil; }
- (void)settingsChanged:(NSNotification *)notification {
  NSDictionary *user = notification.object;
  if (![BZAlertSupport validUser:@{@"user":user ?: NSNull.null}]) return;
  self.serverCurrency = user[@"display_currency"]; self.currencySwitch.selectedSegmentIndex = [self.serverCurrency isEqual:@"SGD"] ? 1 : 0; [self refresh];
}
- (void)currencyChanged {
  if (self.currencySaving) return; NSString *currency = self.currencySwitch.currency; self.currencySwitch.selectedSegmentIndex = [self.serverCurrency isEqual:@"SGD"] ? 1 : 0; self.currencySaving = YES; self.currencySwitch.enabled = NO; self.generation++;
  [BZSettingsWriter save:@{@"display_currency":currency} completion:^(NSDictionary *json, NSError *error) {
    self.currencySaving = NO;
    if (!error && [BZAlertSupport validUser:json]) { [BZSessionManager cacheUser:json[@"user"]]; [NSNotificationCenter.defaultCenter postNotificationName:BZSettingsDidChange object:json[@"user"]]; }
    else {
      UIAlertController *a = [UIAlertController alertControllerWithTitle:@"显示币种保存尚未确认" message:error ? [BZLedgerSupport errorText:error] : @"设置响应格式错误" preferredStyle:UIAlertControllerStyleAlert]; [a addAction:[UIAlertAction actionWithTitle:@"刷新" style:UIAlertActionStyleDefault handler:nil]]; [self presentViewController:a animated:YES completion:nil]; [self refresh];
    }
  }];
}
- (void)refresh {
  self.generation++; NSUInteger generation = self.generation; self.loading = YES; __weak typeof(self) weakSelf = self;
  if (!self.currencySaving) [BZAPIClient.shared request:@"GET" path:@"/me" body:nil completion:^(NSDictionary *json, NSError *error) {
    typeof(self) self = weakSelf; if (!self || generation != self.generation || self.currencySaving) return;
    BOOL valid = !error && [BZAlertSupport validUser:json]; self.currencySwitch.enabled = valid;
    if (valid) { self.serverCurrency = json[@"user"][@"display_currency"]; self.currencySwitch.selectedSegmentIndex = [self.serverCurrency isEqual:@"SGD"] ? 1 : 0; [BZSessionManager cacheUser:json[@"user"]]; [self.tableView reloadData]; }
  }];
  for (NSString *path in @[@"/alerts",@"/alerts/events?limit=100",@"/summary/daily/latest"]) [BZAPIClient.shared request:@"GET" path:path body:nil completion:^(NSDictionary *json, NSError *error) {
    typeof(self) self = weakSelf; if (!self || generation != self.generation) return;
    if ([path isEqual:@"/alerts"]) self.alertsJSON = !error && [BZAlertSupport validAlerts:json] ? json : nil;
    else if ([path hasPrefix:@"/alerts/events"]) self.eventsJSON = !error && [BZAlertSupport validEvents:json] ? json : nil;
    else self.summaryJSON = error ? nil : json;
    [self.tableView reloadData];
  }];
  [BZAPIClient.shared request:@"GET" path:@"/market/quotes" body:nil completion:^(NSDictionary *json, NSError *error) {
    typeof(self) self = weakSelf; if (!self || generation != self.generation) return;
    BZMarketSnapshot *snapshot = error ? nil : [[BZMarketSnapshot alloc] initWithJSON:json error:nil];
    self.quotesOffline = !snapshot; if (snapshot) self.quotesSnapshot = snapshot; [self.tableView reloadData];
  }];
  [BZAPIClient.shared request:@"GET" path:@"/portfolio" body:nil completion:^(NSDictionary *json, NSError *error) {
    typeof(self) self = weakSelf; if (!self || generation != self.generation) return;
    self.loading = NO; [self.refreshControl endRefreshing];
    if (!error && [BZLedgerSupport validPortfolio:json]) { self.portfolio = json; self.offline = NO; self.failure = nil; self.receivedAt = NSProcessInfo.processInfo.systemUptime; [BZLedgerSupport cache:json name:@"portfolio"]; }
    else { self.offline = YES; self.failure = error ? [BZLedgerSupport errorText:error] : @"持仓数据格式错误，请下拉重试"; }
    [self.tableView reloadData];
  }];
}
- (NSDictionary *)quoteForAsset:(NSString *)asset { for (NSDictionary *q in self.quotesSnapshot.quotes) if ([q[@"symbol"] isEqual:asset]) return q; return nil; }
- (BOOL)expired {
  if (self.offline || !self.receivedAt || NSProcessInfo.processInfo.systemUptime - self.receivedAt > 120) return YES;
  if ([self.portfolio[@"positions"] count] && (self.quotesOffline || !self.quotesSnapshot)) return YES;
  for (NSDictionary *p in self.portfolio[@"positions"]) { NSDictionary *q = [self quoteForAsset:p[@"asset"]]; if (!q || ![[self.quotesSnapshot statusForQuote:q uptime:NSProcessInfo.processInfo.systemUptime] isEqual:@"ok"]) return YES; }
  return NO;
}
- (NSString *)pair:(id)pair { return [pair isKindOfClass:NSDictionary.class] ? [BZLedgerSupport money:pair[[self.currencySwitch.currency isEqual:@"SGD"] ? @"sgd" : @"usd"] currency:self.currencySwitch.currency] : @"—"; }
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView { return 4; }
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section { return section == 1 ? MAX(1, [self.portfolio[@"positions"] count]) : 1; }
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)path {
  UITableViewCell *cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:nil];
  NSString *state = ![self.portfolio[@"data_complete"] boolValue] ? @"数据不完整 · 部分行情或汇率异常" : [self expired] ? @"已过期 · 基于缓存或过期价格" : @"持仓数据完整";
  if (self.offline) state = [@"离线 / " stringByAppendingString:state];
  BOOL complete = [self.portfolio[@"data_complete"] boolValue];
  BOOL fxStale = [self.portfolio[@"fx"][@"stale"] boolValue];
  if (path.section == 0) {
    cell.textLabel.text = [NSString stringWithFormat:@"持仓总市值  %@",complete ? [self pair:self.portfolio[@"total_value"]] : @"—"];
    cell.detailTextLabel.text = self.portfolio ? [NSString stringWithFormat:@"未实现 %@ · 累计已实现 %@\n%@%@\n更新 %@%@",complete ? [self pair:self.portfolio[@"total_unrealized"]] : @"—",[self pair:self.portfolio[@"total_realized"]],state,fxStale ? @" · 汇率过期" : @"",[BZLedgerSupport timestamp:self.portfolio[@"server_time"]],self.failure ? [@"\n" stringByAppendingString:self.failure] : @""] : self.failure ?: @"正在加载持仓…";
  } else if (path.section == 1 && [self.portfolio[@"positions"] count]) {
    NSDictionary *p = self.portfolio[@"positions"][path.row];
    NSDictionary *quote = [self quoteForAsset:p[@"asset"]];
    NSString *status = @{@"ok":@"正常",@"stale":@"已过期",@"paused_divergence":@"价差异常",@"unverified":@"未校验"}[p[@"price_status"]] ?: p[@"price_status"];
    cell.textLabel.text = [NSString stringWithFormat:@"%@   %@",p[@"asset"],[BZLedgerSupport quantity:p[@"quantity"]]];
    cell.detailTextLabel.text = [NSString stringWithFormat:@"均价 %@ · 余成本 %@（USD）\n市值 %@ · 未实现 %@\n累计已实现 %@（USD）\n价格%@%@%@",[BZFormatter price:p[@"avg_cost_usd"] currency:@"USD"],[BZLedgerSupport money:p[@"remaining_cost_usd"] currency:@"USD"],[self pair:p[@"market_value"]],[self pair:p[@"unrealized"]],[BZLedgerSupport money:p[@"realized_usd"] currency:@"USD"],status,[self expired] || ![p[@"price_status"] isEqual:@"ok"] ? @" · 基于过期或异常价格" : @"",fxStale && [self.currencySwitch.currency isEqual:@"SGD"] ? @" · 汇率过期" : @""];
    NSString *current = [BZFormatter price:quote[[self.currencySwitch.currency isEqual:@"SGD"] ? @"price_sgd" : @"usd_price"] currency:self.currencySwitch.currency];
    NSString *quoteState = !quote ? @"待刷新" : self.quotesOffline ? @"已过期" : [self.quotesSnapshot statusForQuote:quote uptime:NSProcessInfo.processInfo.systemUptime];
    cell.detailTextLabel.text = [cell.detailTextLabel.text stringByAppendingFormat:@"\n现价 %@ · %@",current,quoteState];
  } else {
    cell.textLabel.text = @[@"持仓总市值",@"我的持仓",@"今日提醒",@"每日汇总 · 21:00 SGT"][path.section];
    cell.detailTextLabel.text = path.section == 1 ? (self.portfolio ? @"暂无持仓 · 在记账页记录买入或期初持仓" : @"暂无持仓数据，请下拉刷新") : path.section == 2 ? [BZAlertSupport todayText:self.alertsJSON events:self.eventsJSON] : [BZAlertSupport summaryText:self.summaryJSON currency:self.currencySwitch.currency];
  }
  cell.textLabel.font = [UIFont preferredFontForTextStyle:UIFontTextStyleHeadline]; cell.textLabel.textColor = BZTheme.ink;
  cell.detailTextLabel.font = [UIFont preferredFontForTextStyle:UIFontTextStyleSubheadline]; cell.detailTextLabel.textColor = BZTheme.muted;
  cell.textLabel.numberOfLines = 0; cell.detailTextLabel.numberOfLines = 0; cell.textLabel.adjustsFontForContentSizeCategory = YES; cell.detailTextLabel.adjustsFontForContentSizeCategory = YES;
  cell.backgroundColor = BZTheme.surface; cell.selectionStyle = path.section == 2 ? UITableViewCellSelectionStyleDefault : UITableViewCellSelectionStyleNone; if (path.section == 2) cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator; return cell;
}
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)path { [tableView deselectRowAtIndexPath:path animated:YES]; if (path.section == 2) self.tabBarController.selectedIndex = 3; }
- (void)dealloc { [self stop]; [NSNotificationCenter.defaultCenter removeObserver:self]; }
@end
