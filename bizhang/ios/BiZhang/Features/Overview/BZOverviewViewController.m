#import "BZOverviewViewController.h"
#import "BZAPIClient.h"
#import "BZCurrencySwitch.h"
#import "BZTheme.h"
@interface BZOverviewViewController ()
@property(nonatomic) NSTimer *timer;
@property(nonatomic) BOOL loading;
@end
@implementation BZOverviewViewController
- (instancetype)init { return [super initWithStyle:UITableViewStyleInsetGrouped]; }
- (void)viewDidLoad {
  [super viewDidLoad]; self.title = @"总览"; self.view.backgroundColor = BZTheme.background;
  self.tableView.rowHeight = UITableViewAutomaticDimension; self.tableView.estimatedRowHeight = 130;
  self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc] initWithCustomView:[BZCurrencySwitch new]];
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
- (void)refresh {
  // D5 supplies /portfolio. Refresh only the existing own-backend session boundary today.
  if (self.loading) return; self.loading = YES; __weak typeof(self) weakSelf = self;
  [BZAPIClient.shared request:@"GET" path:@"/me" body:nil completion:^(NSDictionary *json, NSError *error) {
    weakSelf.loading = NO; [weakSelf.refreshControl endRefreshing]; [weakSelf.tableView reloadData];
  }];
}
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView { return 4; }
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section { return 1; }
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)path {
  UITableViewCell *cell = [[UITableViewCell alloc] initWithStyle:UITableViewCellStyleSubtitle reuseIdentifier:nil];
  cell.textLabel.text = @[@"持仓总市值",@"我的持仓",@"今日提醒",@"每日汇总 · 21:00 SGT"][path.section];
  cell.detailTextLabel.text = @[@"—\n暂无持仓数据\n记录持仓后查看总市值与盈亏",@"暂无持仓\n持仓表：币种 · 数量 · 均价 · 现价 · 市值 · 盈亏",@"暂无提醒\n添加提醒后查看状态",@"暂无汇总\n当日盈亏区间与 USD / SGD 持仓总览"][path.section];
  cell.textLabel.font = [UIFont preferredFontForTextStyle:UIFontTextStyleHeadline]; cell.textLabel.textColor = BZTheme.ink;
  cell.detailTextLabel.font = [UIFont preferredFontForTextStyle:UIFontTextStyleSubheadline]; cell.detailTextLabel.textColor = BZTheme.muted;
  cell.textLabel.numberOfLines = 0; cell.detailTextLabel.numberOfLines = 0; cell.textLabel.adjustsFontForContentSizeCategory = YES; cell.detailTextLabel.adjustsFontForContentSizeCategory = YES;
  cell.backgroundColor = BZTheme.surface; cell.selectionStyle = UITableViewCellSelectionStyleNone; return cell;
}
- (void)dealloc { [self stop]; [NSNotificationCenter.defaultCenter removeObserver:self]; }
@end
