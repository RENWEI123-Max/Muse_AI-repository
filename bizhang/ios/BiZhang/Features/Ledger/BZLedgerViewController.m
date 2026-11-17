#import "BZLedgerViewController.h"
#import "BZTransactionEditor.h"
#import "BZLedgerSupport.h"
#import "BZAPIClient.h"
#import "BZFormatter.h"
#import "BZTheme.h"
@interface BZLedgerViewController ()
@property(nonatomic) NSArray<NSDictionary *> *rows;
@property(nonatomic) BOOL loading;
@property(nonatomic) BOOL online;
@property(nonatomic) BOOL hasMore;
@property(nonatomic) UILabel *status;
@property(nonatomic) NSUInteger generation;
#if DEBUG
@property(nonatomic) NSArray *sampleKeys;
#endif
@end
@implementation BZLedgerViewController
- (instancetype)init { return [super initWithStyle:UITableViewStyleInsetGrouped]; }
- (void)viewDidLoad {
  [super viewDidLoad]; self.title = @"记账"; self.view.backgroundColor = BZTheme.background; self.rows = @[];
  self.tableView.rowHeight = UITableViewAutomaticDimension; self.tableView.estimatedRowHeight = 145;
  self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"记一笔" style:UIBarButtonItemStylePlain target:self action:@selector(add)]; self.navigationItem.rightBarButtonItem.enabled = NO;
#if DEBUG
  NSURL *base = [NSURL URLWithString:[NSBundle.mainBundle objectForInfoDictionaryKey:@"BZ_API_BASE_URL"]];
  if ([@[@"localhost",@"127.0.0.1"] containsObject:base.host]) self.navigationItem.leftBarButtonItem = [[UIBarButtonItem alloc] initWithTitle:@"验收样例" style:UIBarButtonItemStylePlain target:self action:@selector(confirmSample)];
#endif
  self.refreshControl = [UIRefreshControl new]; [self.refreshControl addTarget:self action:@selector(refresh) forControlEvents:UIControlEventValueChanged];
  self.status = [UILabel new]; self.status.numberOfLines = 0; self.status.textAlignment = NSTextAlignmentCenter; self.status.font = [BZTheme cappedFontForTextStyle:UIFontTextStyleFootnote maxPointSize:15]; self.status.textColor = BZTheme.muted; self.status.frame = CGRectMake(0,0,320,80); self.tableView.tableHeaderView = self.status;
  NSDictionary *cached = [BZLedgerSupport cached:@"ledger"]; if ([BZLedgerSupport validTransactions:cached]) { self.rows = cached[@"transactions"]; self.status.text = @"离线缓存 · 下拉刷新后可记账"; }
}
- (void)refresh { self.generation++; self.loading = NO; [self fetchMore:NO]; }
- (void)fetchMore:(BOOL)more {
  if (self.loading || (more && !self.hasMore)) return; self.loading = YES;
  NSUInteger generation = self.generation; NSString *path = @"/transactions?limit=50";
  if (more && self.rows.count) path = [path stringByAppendingFormat:@"&before_id=%@",self.rows.lastObject[@"id"]];
  __weak typeof(self) weakSelf = self;
  [BZAPIClient.shared request:@"GET" path:path body:nil completion:^(NSDictionary *json, NSError *error) {
    typeof(self) self = weakSelf; if (!self || generation != self.generation) return;
    self.loading = NO; [self.refreshControl endRefreshing]; self.online = !error && [BZLedgerSupport validTransactions:json]; self.navigationItem.rightBarButtonItem.enabled = self.online;
    if (!self.online) { self.status.text = error ? [[BZLedgerSupport errorText:error] stringByAppendingString:@"\n离线 · 写入不可用，下拉重试"] : @"INVALID_RESPONSE · 无效交易数据，下拉重试"; }
    else {
      NSArray *page = json[@"transactions"]; self.hasMore = page.count == 50;
      if (more) { NSMutableArray *all = [self.rows mutableCopy]; NSMutableSet *ids = [NSMutableSet new]; for (NSDictionary *row in all) [ids addObject:row[@"id"]]; for (NSDictionary *row in page) if (![ids containsObject:row[@"id"]]) [all addObject:row]; self.rows = all; }
      else { self.rows = page; [BZLedgerSupport cache:json name:@"ledger"]; }
      self.status.text = self.rows.count ? @"最新记录在前 · 点按编辑 · 左滑删除\n金额及手续费均为 USD" : @"暂无交易 · 点右上角记一笔";
    }
    [self.tableView reloadData];
  }];
}
- (void)viewWillAppear:(BOOL)animated { [super viewWillAppear:animated]; [self refresh]; }
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section { return self.rows.count + (self.hasMore ? 1 : 0); }
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)path {
  UITableViewCell *cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:nil]; cell.backgroundColor = BZTheme.surface;
  cell.textLabel.font = [BZTheme cappedFontForTextStyle:UIFontTextStyleHeadline maxPointSize:22]; cell.textLabel.textColor = BZTheme.ink; cell.textLabel.numberOfLines = 0; cell.detailTextLabel.numberOfLines = 0; cell.detailTextLabel.font = [BZTheme cappedFontForTextStyle:UIFontTextStyleSubheadline maxPointSize:18]; cell.detailTextLabel.textColor = BZTheme.muted; cell.textLabel.adjustsFontForContentSizeCategory = YES; cell.detailTextLabel.adjustsFontForContentSizeCategory = YES;
  if (path.row == self.rows.count) { cell.textLabel.text = self.loading ? @"正在加载…" : @"加载更多"; return cell; }
  NSDictionary *t = self.rows[path.row]; BOOL opening = [t[@"side"] isEqual:@"opening"];
  NSString *side = @{@"buy":@"买入",@"sell":@"卖出",@"opening":@"期初"}[t[@"side"]];
  cell.textLabel.text = [NSString stringWithFormat:@"%@ · %@   %@",t[@"asset"],side,[BZLedgerSupport quantity:t[@"quantity"]]];
  cell.detailTextLabel.text = [NSString stringWithFormat:@"%@ %@ · 手续费 %@\n%@\n卖前均价 %@ · 本笔已实现 %@\n之后持仓 %@",opening ? @"期初成本" : @"成交价",opening ? [BZLedgerSupport money:t[@"opening_cost_usd"] currency:@"USD"] : [BZFormatter price:t[@"price_usd"] currency:@"USD"],[BZLedgerSupport money:t[@"fee_amount"] currency:@"USD"],[BZLedgerSupport timestamp:t[@"traded_at"]],[BZFormatter price:t[@"avg_cost_before_usd"] currency:@"USD"],[BZLedgerSupport money:t[@"realized_usd"] currency:@"USD"],[BZLedgerSupport quantity:t[@"qty_after"]]];
  cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator; return cell;
}
- (void)add { if (self.online) [self edit:nil]; }
- (void)edit:(NSDictionary *)transaction {
  __weak typeof(self) weakSelf = self; BZTransactionEditor *editor = [[BZTransactionEditor alloc] initWithTransaction:transaction completion:^{ [weakSelf refresh]; [NSNotificationCenter.defaultCenter postNotificationName:@"BZLedgerDidChange" object:nil]; }];
  UINavigationController *nav = [[UINavigationController alloc] initWithRootViewController:editor]; nav.modalPresentationStyle = UIModalPresentationPageSheet; nav.sheetPresentationController.detents = @[UISheetPresentationControllerDetent.largeDetent]; [self presentViewController:nav animated:YES completion:nil];
}
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)path { [tableView deselectRowAtIndexPath:path animated:YES]; if (path.row == self.rows.count) [self fetchMore:YES]; else if (self.online) [self edit:self.rows[path.row]]; }
- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)path { return self.online && path.row < self.rows.count; }
- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)style forRowAtIndexPath:(NSIndexPath *)path { if (style == UITableViewCellEditingStyleDelete) [self confirmDelete:self.rows[path.row]]; }
- (void)confirmDelete:(NSDictionary *)transaction {
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"删除这笔交易？" message:@"服务端将重放该币全部交易；若造成历史负持仓，会拒绝删除。" preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:[UIAlertAction actionWithTitle:@"取消" style:UIAlertActionStyleCancel handler:nil]];
  __weak typeof(self) weakSelf = self;
  [alert addAction:[UIAlertAction actionWithTitle:@"删除" style:UIAlertActionStyleDestructive handler:^(UIAlertAction *a) { [weakSelf deleteTransaction:transaction]; }]]; [self presentViewController:alert animated:YES completion:nil];
}
- (void)deleteTransaction:(NSDictionary *)transaction {
  if (!self.online) return; self.online = NO; self.navigationItem.rightBarButtonItem.enabled = NO;
  __weak typeof(self) weakSelf = self;
  [BZAPIClient.shared request:@"DELETE" path:[@"/transactions/" stringByAppendingString:transaction[@"id"]] body:nil headers:@{@"If-Match":transaction[@"version"]} completion:^(NSDictionary *json, NSError *error) {
    typeof(self) self = weakSelf; if (!self) return;
    if (error) { UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"删除未完成" message:[[BZLedgerSupport errorText:error] stringByAppendingString:@"\n正在刷新，请核对最新记录后再操作。"] preferredStyle:UIAlertControllerStyleAlert]; [alert addAction:[UIAlertAction actionWithTitle:@"知道了" style:UIAlertActionStyleDefault handler:nil]]; [self presentViewController:alert animated:YES completion:nil]; }
    [self refresh]; [NSNotificationCenter.defaultCenter postNotificationName:@"BZLedgerDidChange" object:nil];
  }];
}
#if DEBUG
- (void)confirmSample {
  if (!self.online || self.rows.count) { self.status.text = @"样例仅支持在线的空账本 d6_ 临时账号"; return; }
  UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"载入验收样例" message:@"仅限开发隧道与 d6_ 临时账号；将新增 1@100、1@120、卖 0.5@130，手续费各 1 USD。使用实时行情，不修改价格。" preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:[UIAlertAction actionWithTitle:@"取消" style:UIAlertActionStyleCancel handler:nil]];
  [alert addAction:[UIAlertAction actionWithTitle:@"载入" style:UIAlertActionStyleDefault handler:^(UIAlertAction *a) {
    [BZAPIClient.shared request:@"GET" path:@"/me" body:nil completion:^(NSDictionary *json, NSError *error) {
      NSString *name = json[@"user"][@"username"];
      if (error || ![name isKindOfClass:NSString.class] || ![name hasPrefix:@"d6_"]) { self.status.text = @"样例仅限 d6_ 临时账号"; return; }
      if (!self.sampleKeys) self.sampleKeys = @[NSUUID.UUID.UUIDString,NSUUID.UUID.UUIDString,NSUUID.UUID.UUIDString];
      self.online = NO; self.navigationItem.rightBarButtonItem.enabled = NO; self.navigationItem.leftBarButtonItem.enabled = NO; [self loadSample:0];
    }];
  }]]; [self presentViewController:alert animated:YES completion:nil];
}
- (void)loadSample:(NSUInteger)index {
  NSArray *prices = @[@"100",@"120",@"130"];
  NSDictionary *body = @{@"asset":@"BTC",@"side":index == 2 ? @"sell" : @"buy",@"quantity":index == 2 ? @"0.5" : @"1",@"price_usd":prices[index],@"fee_amount":@"1",@"fee_currency":@"USD",@"traded_at":[NSString stringWithFormat:@"2026-01-01T00:0%lu:00Z",(unsigned long)index],@"note":@"D6 验收样例"};
  [BZAPIClient.shared request:@"POST" path:@"/transactions" body:body headers:@{@"Idempotency-Key":self.sampleKeys[index]} completion:^(NSDictionary *json, NSError *error) {
    if (error || index == 2) { self.navigationItem.leftBarButtonItem.enabled = YES; [self refresh]; [NSNotificationCenter.defaultCenter postNotificationName:@"BZLedgerDidChange" object:nil]; if (error) { UIAlertController *alert = [UIAlertController alertControllerWithTitle:@"样例载入中断" message:[[BZLedgerSupport errorText:error] stringByAppendingString:@"\n请核对已写入记录；不会自动重试。"] preferredStyle:UIAlertControllerStyleAlert]; [alert addAction:[UIAlertAction actionWithTitle:@"知道了" style:UIAlertActionStyleDefault handler:nil]]; [self presentViewController:alert animated:YES completion:nil]; } }
    else [self loadSample:index+1];
  }];
}
#endif
@end
