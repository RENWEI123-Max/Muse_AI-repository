#import "BZMarketViewController.h"
#import "BZAPIClient.h"
#import "BZKeychain.h"
#import "BZCacheStore.h"
#import "BZMarketSnapshot.h"
#import "BZFormatter.h"
#import "BZCurrencySwitch.h"
#import "BZStatusBanner.h"
#import "BZTheme.h"
@interface BZMarketViewController ()
@property(nonatomic) BZMarketSnapshot *snapshot;
@property(nonatomic) BZCacheStore *cache;
@property(nonatomic) BZCurrencySwitch *currencySwitch;
@property(nonatomic) BZStatusBanner *banner;
@property(nonatomic) UILabel *sourceLabel;
@property(nonatomic) NSTimer *pollTimer;
@property(nonatomic) NSTimer *ageTimer;
@property(nonatomic) NSDate *cachedAt;
@property(nonatomic) BOOL offline;
@property(nonatomic) BOOL cached;
@property(nonatomic) BOOL loading;
@property(nonatomic) NSString *sessionToken;
@end
@implementation BZMarketViewController
- (instancetype)init { return [super initWithStyle:UITableViewStyleInsetGrouped]; }
- (void)viewDidLoad {
  [super viewDidLoad]; self.title = @"行情"; self.view.backgroundColor = BZTheme.background;
  self.tableView.separatorColor = BZTheme.line; self.tableView.rowHeight = UITableViewAutomaticDimension; self.tableView.estimatedRowHeight = 114;
  self.currencySwitch = [BZCurrencySwitch new];
  [self.currencySwitch addTarget:self action:@selector(render) forControlEvents:UIControlEventValueChanged];
  self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithCustomView:self.currencySwitch];
  UIStackView *title = [UIStackView new]; title.axis = UILayoutConstraintAxisVertical;
  UILabel *heading = [UILabel new]; heading.text = @"行情 · 10 币"; heading.font = [UIFont boldSystemFontOfSize:17]; heading.textColor = BZTheme.ink;
  self.sourceLabel = [UILabel new]; self.sourceLabel.font = [UIFont systemFontOfSize:10]; self.sourceLabel.textColor = BZTheme.muted;
  [title addArrangedSubview:heading]; [title addArrangedSubview:self.sourceLabel]; self.navigationItem.titleView = title;
  self.banner = [BZStatusBanner new];
  self.refreshControl = [UIRefreshControl new]; [self.refreshControl addTarget:self action:@selector(refresh) forControlEvents:UIControlEventValueChanged];
  self.sessionToken = BZKeychain.token;
  self.cache = [[BZCacheStore alloc] initWithUserID:BZCacheStore.cachedUserID];
  NSDictionary *envelope = self.cache.marketEnvelope;
  if ([envelope[@"json"] isKindOfClass:NSDictionary.class]) self.snapshot = [[BZMarketSnapshot alloc] initWithJSON:envelope[@"json"] error:nil];
  self.cachedAt = [BZMarketSnapshot date:envelope[@"fetched_at"]];
  self.cached = self.snapshot != nil; self.offline = YES; [self render];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(stopTimers) name:UIApplicationDidEnterBackgroundNotification object:nil];
  [NSNotificationCenter.defaultCenter addObserver:self selector:@selector(resume) name:UIApplicationDidBecomeActiveNotification object:nil];
}
- (void)viewDidAppear:(BOOL)animated { [super viewDidAppear:animated]; [self resume]; }
- (void)viewWillDisappear:(BOOL)animated { [super viewWillDisappear:animated]; [self stopTimers]; }
- (void)resume {
  if (!self.view.window || UIApplication.sharedApplication.applicationState == UIApplicationStateBackground) return;
  [self stopTimers]; [self refresh];
  __weak typeof(self) weakSelf = self;
  self.pollTimer = [NSTimer scheduledTimerWithTimeInterval:30 repeats:YES block:^(NSTimer *t) { [weakSelf refresh]; }];
  self.ageTimer = [NSTimer scheduledTimerWithTimeInterval:1 repeats:YES block:^(NSTimer *t) { [weakSelf render]; }];
}
- (void)stopTimers { [self.pollTimer invalidate]; self.pollTimer = nil; [self.ageTimer invalidate]; self.ageTimer = nil; }
- (void)refresh {
  if (self.loading || ![self.sessionToken isEqual:BZKeychain.token]) return;
  self.loading = YES;
  __weak typeof(self) weakSelf = self;
  [BZAPIClient.shared request:@"GET" path:@"/market/quotes" body:nil completion:^(NSDictionary *json, NSError *error) {
    typeof(self) self = weakSelf; if (!self) return;
    self.loading = NO; [self.refreshControl endRefreshing];
    if (![self.sessionToken isEqual:BZKeychain.token]) return;
    BZMarketSnapshot *snapshot = json ? [[BZMarketSnapshot alloc] initWithJSON:json error:nil] : nil;
    self.offline = !snapshot;
    if (snapshot) {
      self.snapshot = snapshot; self.cached = NO; self.cachedAt = NSDate.date;
      if (!self.cache) self.cache = [[BZCacheStore alloc] initWithUserID:BZCacheStore.cachedUserID];
      [self.cache saveMarketJSON:json];
    }
    [self render];
  }];
}
- (NSString *)status:(NSDictionary *)q { return self.cached ? @"stale" : [self.snapshot statusForQuote:q uptime:NSProcessInfo.processInfo.systemUptime]; }
- (void)render {
  BOOL normal = self.snapshot != nil;
  for (NSDictionary *q in self.snapshot.quotes) if (![[self status:q] isEqual:@"ok"]) normal = NO;
  NSString *detail = self.offline ? (self.snapshot ? [NSString stringWithFormat:@"显示 %@ 的缓存数据%@",[BZFormatter time:self.cachedAt], normal ? @"" : @" · 已过期"] : @"暂无缓存，等待连接后刷新") : normal ? @"主源参考行情 · 仅供记录" : @"已过期或校验受限 · 提醒暂停";
  [self.banner showState:self.offline ? @"离线" : normal ? @"行情正常" : @"行情已过期 / 校验受限" detail:detail];
  CGFloat width = MAX(200, self.tableView.bounds.size.width - 40);
  CGSize size = [self.banner sizeThatFits:CGSizeMake(width, CGFLOAT_MAX)];
  self.banner.frame = CGRectMake(0,0,self.tableView.bounds.size.width,MAX(68,size.height+20)); self.tableView.tableHeaderView = self.banner;
  NSDictionary *first = self.snapshot.quotes.firstObject;
  NSTimeInterval age = first ? [self.snapshot ageForQuote:first uptime:NSProcessInfo.processInfo.systemUptime] : INFINITY;
  self.sourceLabel.text = isfinite(age) && !self.cached ? [NSString stringWithFormat:@"Binance / Kraken · %.0f 秒前",floor(age)] : @"Binance / Kraken · 已过期";
  [self.tableView reloadData];
}
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section { return self.snapshot.quotes.count; }
- (NSString *)tableView:(UITableView *)tableView titleForFooterInSection:(NSInteger)section { return @"分钟级参考行情。USDT / USDC 按 Kraken 参考价估值。校验源仅在服务端校验，不替代主源价格。仅供记录，不构成投资建议。"; }
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
  UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"quote"];
  if (!cell) cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:@"quote"];
  NSDictionary *q = self.snapshot.quotes[indexPath.row];
  NSString *currency = self.currencySwitch.currency;
  NSString *price = [BZFormatter price:q[[currency isEqual:@"USD"] ? @"usd_price" : @"price_sgd"] currency:currency];
  NSString *status = [self status:q];
  NSDictionary *labels = @{@"ok":@"正常 · ok",@"stale":@"已过期 · stale",@"paused_divergence":@"价差异常 · paused_divergence",@"unverified":@"未验证 · unverified"};
  cell.textLabel.text = [NSString stringWithFormat:@"%@  %@    %@",q[@"symbol"],q[@"name"],price];
  cell.textLabel.font = [UIFont preferredFontForTextStyle:UIFontTextStyleHeadline]; cell.textLabel.textColor = BZTheme.ink; cell.textLabel.numberOfLines = 0;
  NSString *source = [q[@"raw_source"] isEqual:@"binance"] ? @"Binance" : @"Kraken";
  NSString *ref = [q[@"raw_source"] isEqual:@"binance"] ? [NSString stringWithFormat:@"\nUSDT/USD · Kraken · %@",[BZFormatter time:[BZMarketSnapshot date:q[@"ref_ts"]]]] : @"";
  BOOL fxStale = [currency isEqual:@"SGD"] && [self.snapshot.JSON[@"fx"][@"stale"] boolValue];
  cell.detailTextLabel.text = [NSString stringWithFormat:@"24h %@   %@%@\n%@ · %@%@",[BZFormatter percent:q[@"change_24h_pct"]],labels[status],fxStale ? @" · 汇率过期" : @"",source,[BZFormatter time:[BZMarketSnapshot date:q[@"raw_source_ts"]]],ref];
  cell.detailTextLabel.numberOfLines = 0; cell.detailTextLabel.font = [UIFont preferredFontForTextStyle:UIFontTextStyleCaption1]; cell.detailTextLabel.textColor = [status isEqual:@"ok"] ? BZTheme.muted : BZTheme.amber;
  cell.textLabel.adjustsFontForContentSizeCategory = YES; cell.detailTextLabel.adjustsFontForContentSizeCategory = YES;
  cell.backgroundColor = BZTheme.surface; cell.selectionStyle = UITableViewCellSelectionStyleNone;
  NSArray *colors = @[@0xe8862e,@0x627eea,@0x7a5af8,@0x26a17b,@0x2775ca,@0xc99400,@0x4b5563,@0xb8a038,@0x2f5fd0,@0x2a5ada];
  unsigned c = [colors[indexPath.row] unsignedIntValue];
  cell.imageView.image = [UIImage systemImageNamed:@"circle.fill"];
  cell.imageView.tintColor = [UIColor colorWithRed:((c>>16)&255)/255.0 green:((c>>8)&255)/255.0 blue:(c&255)/255.0 alpha:1];
  cell.accessibilityIdentifier = q[@"symbol"];
  return cell;
}
- (void)dealloc { [self stopTimers]; [NSNotificationCenter.defaultCenter removeObserver:self]; }
@end
