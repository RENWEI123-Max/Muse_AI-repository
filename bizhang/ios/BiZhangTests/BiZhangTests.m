#import "BZAPIClient.h"
#import "BZKeychain.h"
#import "BZLoginViewController.h"
#import "BZSessionManager.h"
#import <XCTest/XCTest.h>
#import "BZMarketSnapshot.h"
#import "BZFormatter.h"
#import "BZCacheStore.h"
#import "BZMarketViewController.h"
#import "BZOverviewViewController.h"
#import "BZLedgerSupport.h"
#import "BZLedgerViewController.h"
#import "BZTransactionEditor.h"
@interface BZTransactionEditor (D6Test)
- (NSDictionary *)formBody;
@end
static void (^BZD6Handler)(NSURLProtocol *);
@interface BZD6Protocol : NSURLProtocol
@end
@implementation BZD6Protocol
+ (BOOL)canInitWithRequest:(NSURLRequest *)request { return YES; }
+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request { return request; }
- (void)startLoading { if (BZD6Handler) BZD6Handler(self); }
- (void)stopLoading {}
@end
@interface BiZhangTests : XCTestCase
@end
@implementation BiZhangTests
- (void)tearDown {
  if (![NSProcessInfo.processInfo.environment[@"BZ_TEST_PHASE"]
          isEqualToString:@"persist"])
    [BZSessionManager clearSession];
  [super tearDown];
}
- (void)testKeychainAndCacheCleanup {
  XCTAssertTrue([BZKeychain saveToken:@"unit-test-token"]);
  XCTAssertEqualObjects([BZKeychain token], @"unit-test-token");
  XCTAssertTrue(
      ([BZSessionManager cacheUser:@{@"id" : @"1", @"username" : @"fixture"}]));
  XCTAssertTrue([[NSFileManager defaultManager]
      fileExistsAtPath:[BZSessionManager cacheRoot].path]);
  XCTAssertTrue([BZSessionManager clearSession]);
  XCTAssertTrue([BZKeychain token] == nil);
  XCTAssertFalse([[NSFileManager defaultManager]
      fileExistsAtPath:[BZSessionManager cacheRoot].path]);
}
- (void)testNetworkConfiguration {
  NSURLSessionConfiguration *c = BZAPIClient.shared.session.configuration;
  XCTAssertEqual(c.timeoutIntervalForRequest, 15);
  XCTAssertEqual(c.timeoutIntervalForResource, 30);
  XCTAssertNil(c.URLCache);
  XCTAssertFalse(c.HTTPShouldSetCookies);
  NSDictionary *ats = [[NSBundle mainBundle]
      objectForInfoDictionaryKey:@"NSAppTransportSecurity"];
  XCTAssertEqualObjects(ats[@"NSAllowsLocalNetworking"], @YES);
  XCTAssertNil(ats[@"NSAllowsArbitraryLoads"]);
}
- (void)testTunnelLoginRevocationAndUnauthorizedCleanup {
  NSString *password =
      NSProcessInfo.processInfo.environment[@"BZ_TEST_PASSWORD"];
  if (!password.length) { XCTSkip(@"Live auth requires temporary test credentials"); return; }
  XCTestExpectation *done =
      [self expectationWithDescription:@"tunnel auth lifecycle"];
  [BZAPIClient.shared
         request:@"POST"
            path:@"/auth/login"
            body:@{@"username" : NSProcessInfo.processInfo.environment[@"BZ_TEST_USERNAME"], @"password" : password}
      completion:^(NSDictionary *json, NSError *error) {
        XCTAssertNil(error);
        NSString *token = json[@"token"];
        XCTAssertEqual(token.length, 64);
        if (!token) {
          [done fulfill];
          return;
        }
        XCTAssertTrue([BZKeychain saveToken:token]);
        XCTAssertTrue([BZSessionManager cacheUser:json[@"user"]]);
        [BZAPIClient.shared
               request:@"GET"
                  path:@"/me"
                  body:nil
            completion:^(NSDictionary *me, NSError *e) {
              XCTAssertNil(e);
              XCTAssertEqualObjects(me[@"user"][@"username"], NSProcessInfo.processInfo.environment[@"BZ_TEST_USERNAME"]);
              [BZAPIClient.shared logout:^{
                XCTAssertTrue([BZKeychain token] == nil);
                XCTAssertFalse([[NSFileManager defaultManager]
                    fileExistsAtPath:[BZSessionManager cacheRoot].path]);
                [BZKeychain saveToken:token];
                [BZSessionManager cacheUser:@{@"id" : @"1"}];
                [BZAPIClient.shared
                       request:@"GET"
                          path:@"/me"
                          body:nil
                    completion:^(NSDictionary *revoked, NSError *failure) {
                      XCTAssertEqual(failure.code, 401);
                      XCTAssertTrue([BZKeychain token] == nil);
                      XCTAssertFalse([[NSFileManager defaultManager]
                          fileExistsAtPath:[BZSessionManager cacheRoot].path]);
                      [done fulfill];
                    }];
              }];
            }];
      }];
  [self waitForExpectations:@[ done ] timeout:45];
}
- (void)testProcessPersistence {
  NSString *phase = NSProcessInfo.processInfo.environment[@"BZ_TEST_PHASE"];
  if (!phase.length)
    return;
  XCTestExpectation *done =
      [self expectationWithDescription:@"process persistence"];
  if ([phase isEqualToString:@"persist"]) {
    [BZSessionManager clearSession];
    BZLoginViewController *login = [BZLoginViewController new];
    [login loadViewIfNeeded];
    UITextField *username = [login valueForKey:@"username"];
    UITextField *password = [login valueForKey:@"password"];
    UIButton *submit = [login valueForKey:@"loginButton"];
    username.text = NSProcessInfo.processInfo.environment[@"BZ_TEST_USERNAME"];
    password.text = NSProcessInfo.processInfo.environment[@"BZ_TEST_PASSWORD"];
    __block id observer = nil;
    observer = [[NSNotificationCenter defaultCenter]
        addObserverForName:BZSessionDidChange
                    object:nil
                     queue:NSOperationQueue.mainQueue
                usingBlock:^(NSNotification *note) {
                  if ([BZKeychain token]) {
                    XCTAssertEqual([BZKeychain token].length, 64);
                    XCTAssertTrue([[NSFileManager defaultManager]
                        fileExistsAtPath:[BZSessionManager cacheRoot].path]);
                    [[NSNotificationCenter defaultCenter]
                        removeObserver:observer];
                    [done fulfill];
                  }
                }];
    [submit sendActionsForControlEvents:UIControlEventTouchUpInside];
  } else {
    XCTAssertEqual([BZKeychain token].length, 64);
    XCTAssertTrue([[NSFileManager defaultManager]
        fileExistsAtPath:[BZSessionManager cacheRoot].path]);
    [BZAPIClient.shared
           request:@"GET"
              path:@"/me"
              body:nil
        completion:^(NSDictionary *json, NSError *error) {
          XCTAssertNil(error);
          XCTAssertEqualObjects(json[@"user"][@"username"], NSProcessInfo.processInfo.environment[@"BZ_TEST_USERNAME"]);
          [BZAPIClient.shared logout:^{
            XCTAssertTrue([BZKeychain token] == nil);
            XCTAssertFalse([[NSFileManager defaultManager]
                fileExistsAtPath:[BZSessionManager cacheRoot].path]);
            [done fulfill];
          }];
        }];
  }
  [self waitForExpectations:@[ done ] timeout:45];
}

- (void)testDecimalFormatting {
  XCTAssertNil([BZFormatter decimal:@1.25]);
  XCTAssertNil([BZFormatter decimal:@"1e3"]);
  XCTAssertNil([BZFormatter decimal:@"nan"]);
  XCTAssertEqualObjects([BZFormatter price:@"0.99915" currency:@"USD"], @"$0.9992");
  XCTAssertEqualObjects([BZFormatter price:@"12345.125" currency:@"SGD"], @"S$12,345.13");
  XCTAssertEqualObjects([BZFormatter percent:@"-1.25"], @"-1.3%");
}
- (NSDictionary *)snapshotFixture {
  NSMutableArray *quotes = [NSMutableArray new];
  NSArray *symbols = @[@"BTC",@"ETH",@"SOL",@"USDT",@"USDC",@"BNB",@"XRP",@"DOGE",@"ADA",@"LINK"];
  for (NSUInteger i=0;i<10;i++) [quotes addObject:@{@"symbol":symbols[i],@"name":symbols[i],@"display_order":[@(i) stringValue],@"raw_source":(i==3 || i==4)?@"kraken":@"binance",@"raw_source_ts":@"2026-11-16T00:00:00.000Z",@"ref_ts":@"2026-11-16T00:00:00.000Z",@"ref_source":@"kraken",@"usd_price":@"100.123456789123456789",@"price_sgd":@"128.999999999999999999",@"change_24h_pct":NSNull.null,@"status":@"ok"}];
  return @{@"quotes":quotes,@"fx":@{@"stale":@NO},@"server_time":@"2026-11-16T00:02:00.000Z"};
}
- (void)testSnapshotAgeValidationAndProtectedCache {
  NSDictionary *json = [self snapshotFixture];
  BZMarketSnapshot *snapshot = [[BZMarketSnapshot alloc] initWithJSON:json error:nil];
  XCTAssertNotNil(snapshot);
  NSDictionary *q = snapshot.quotes.firstObject;
  XCTAssertEqualObjects(q[@"price_sgd"], @"128.999999999999999999");
  XCTAssertEqualObjects([snapshot statusForQuote:q uptime:0], @"ok");
  XCTAssertEqualObjects([snapshot statusForQuote:q uptime:NSProcessInfo.processInfo.systemUptime+1], @"stale");
  NSMutableDictionary *bad = [json mutableCopy]; bad[@"server_time"] = @"invalid";
  XCTAssertNil([[BZMarketSnapshot alloc] initWithJSON:bad error:nil]);
  bad = [json mutableCopy]; bad[@"fx"] = @{@"stale":NSNull.null};
  XCTAssertNil([[BZMarketSnapshot alloc] initWithJSON:bad error:nil]);
  NSMutableArray *rows = [json[@"quotes"] mutableCopy]; NSMutableDictionary *row = [rows[0] mutableCopy];
  row[@"usd_price"] = @100; rows[0] = row; bad = [json mutableCopy]; bad[@"quotes"] = rows;
  XCTAssertNil([[BZMarketSnapshot alloc] initWithJSON:bad error:nil]);
  row[@"usd_price"] = @"100"; row[@"raw_source"] = @"coingecko";
  XCTAssertNil([[BZMarketSnapshot alloc] initWithJSON:bad error:nil]);
  XCTAssertTrue([BZSessionManager cacheUser:@{@"id":@"999999999"}]);
  BZCacheStore *cache = [[BZCacheStore alloc] initWithUserID:@"999999999"];
  XCTAssertTrue([cache saveMarketJSON:json]);
  XCTAssertEqualObjects(cache.marketEnvelope[@"json"],json);
  XCTAssertNotNil(cache.marketEnvelope[@"fetched_at"]);
  NSURL *path = [[BZSessionManager.cacheRoot URLByAppendingPathComponent:@"999999999"] URLByAppendingPathComponent:@"market-quotes.json"];
#if !TARGET_OS_SIMULATOR
  XCTAssertEqualObjects([NSFileManager.defaultManager attributesOfItemAtPath:path.path error:nil][NSFileProtectionKey],NSFileProtectionComplete);
#else
  XCTAssertTrue([NSFileManager.defaultManager fileExistsAtPath:path.path]); // Simulator has no iOS data protection class.
#endif
  XCTAssertNil([[BZCacheStore alloc] initWithUserID:@"../escape"]);
}
- (void)testD4LiveMarket {
  if (!NSProcessInfo.processInfo.environment[@"BZ_TEST_PASSWORD"]) { XCTSkip(@"Live market requires temporary test credentials"); return; }
  XCTestExpectation *done = [self expectationWithDescription:@"D4 live market"];
  [BZAPIClient.shared request:@"POST" path:@"/auth/login" body:@{@"username":NSProcessInfo.processInfo.environment[@"BZ_TEST_USERNAME"],@"password":NSProcessInfo.processInfo.environment[@"BZ_TEST_PASSWORD"]} completion:^(NSDictionary *login,NSError *error) {
    XCTAssertNil(error); if (error) { [done fulfill]; return; }
    [BZKeychain saveToken:login[@"token"]]; [BZSessionManager cacheUser:login[@"user"]];
    [NSNotificationCenter.defaultCenter postNotificationName:BZSessionDidChange object:nil];
    [BZAPIClient.shared request:@"GET" path:@"/market/quotes" body:nil completion:^(NSDictionary *json,NSError *failure) {
      XCTAssertNil(failure);
      BZMarketSnapshot *snapshot = [[BZMarketSnapshot alloc] initWithJSON:json error:nil];
      XCTAssertEqual(snapshot.quotes.count,10);
      BZCacheStore *cache = [[BZCacheStore alloc] initWithUserID:login[@"user"][@"id"]];
      XCTAssertTrue([cache saveMarketJSON:json]);
      for (NSDictionary *q in snapshot.quotes) {
        XCTAssertNotNil([BZFormatter decimal:q[@"price_sgd"]]);
        XCTAssertEqualObjects([BZFormatter price:q[@"price_sgd"] currency:@"SGD"], [BZFormatter price:cache.marketEnvelope[@"json"][@"quotes"][[snapshot.quotes indexOfObject:q]][@"price_sgd"] currency:@"SGD"]);
      }
      UIWindow *window = ((UIWindowScene *)UIApplication.sharedApplication.connectedScenes.anyObject).windows.firstObject;
      UITabBarController *tabs = (UITabBarController *)window.rootViewController;
      XCTAssertTrue([tabs isKindOfClass:UITabBarController.class]);
      if (![tabs isKindOfClass:UITabBarController.class]) { [done fulfill]; return; }
      tabs.selectedIndex = 1;
      BZMarketViewController *market = (BZMarketViewController *)((UINavigationController *)tabs.selectedViewController).topViewController;
      [market loadViewIfNeeded];
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 3*NSEC_PER_SEC),dispatch_get_main_queue(),^{
        XCTAssertEqual([market.tableView numberOfRowsInSection:0],10);
        UISegmentedControl *currency = [market valueForKey:@"currencySwitch"];
        currency.selectedSegmentIndex = 1; [currency sendActionsForControlEvents:UIControlEventValueChanged];
        for (NSUInteger i=0;i<10;i++) {
          UITableViewCell *cell = [market tableView:market.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:i inSection:0]];
          NSDictionary *q = ((BZMarketSnapshot *)[market valueForKey:@"snapshot"]).quotes[i];
          XCTAssertTrue([cell.textLabel.text containsString:[BZFormatter price:q[@"price_sgd"] currency:@"SGD"]]);
        }
        [done fulfill];
      });
    }];
  }];
  [self waitForExpectations:@[done] timeout:40];
}

- (void)captureWindow:(UIWindow *)window name:(NSString *)name {
  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithBounds:window.bounds];
  UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) { [window drawViewHierarchyInRect:window.bounds afterScreenUpdates:YES]; }];
  NSURL *dir = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
  [UIImagePNGRepresentation(image) writeToURL:[dir URLByAppendingPathComponent:[name stringByAppendingString:@".png"]] atomically:YES];
}
- (void)testD4Evidence {
  NSString *mode = NSProcessInfo.processInfo.environment[@"BZ_D4_MODE"];
  if (!mode) { XCTSkip(@"Evidence phase only"); return; }
  UIWindow *window = ((UIWindowScene *)UIApplication.sharedApplication.connectedScenes.anyObject).windows.firstObject;
  UITabBarController *tabs = (UITabBarController *)window.rootViewController;
  XCTAssertTrue([tabs isKindOfClass:UITabBarController.class]);
  if (![tabs isKindOfClass:UITabBarController.class]) return;
  tabs.selectedIndex = 1;
  BZMarketViewController *market = (BZMarketViewController *)((UINavigationController *)tabs.selectedViewController).topViewController;
  [market loadViewIfNeeded];
  XCTestExpectation *done = [self expectationWithDescription:@"evidence render"];
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW,6*NSEC_PER_SEC),dispatch_get_main_queue(),^{
    BZMarketSnapshot *snapshot = [market valueForKey:@"snapshot"];
    XCTAssertEqual(snapshot.quotes.count,10);
    if (!snapshot) { [done fulfill]; return; }
    XCTAssertEqualWithAccuracy([[market valueForKey:@"pollTimer"] timeInterval],30,0.01);
    UILabel *banner = [market valueForKey:@"banner"];
    if ([mode isEqual:@"offline"]) { XCTAssertTrue([banner.text containsString:@"离线"]); XCTAssertTrue([banner.text containsString:@"已过期"]); }
    if ([mode isEqual:@"stale"]) { XCTAssertEqualObjects(snapshot.quotes.firstObject[@"status"],@"stale"); XCTAssertTrue([banner.text containsString:@"过期"]); }
    if ([mode isEqual:@"live"] || [mode isEqual:@"recovered"]) XCTAssertEqualObjects(snapshot.quotes.firstObject[@"status"],@"ok");
    [self captureWindow:window name:[mode stringByAppendingString:@"-usd"]];
    UISegmentedControl *currency = [market valueForKey:@"currencySwitch"]; currency.selectedSegmentIndex = 1; [currency sendActionsForControlEvents:UIControlEventValueChanged];
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW,600*NSEC_PER_MSEC),dispatch_get_main_queue(),^{
    [self captureWindow:window name:[mode stringByAppendingString:@"-sgd"]];
    NSURL *dir = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
    [[NSJSONSerialization dataWithJSONObject:snapshot.JSON options:NSJSONWritingPrettyPrinted error:nil] writeToURL:[dir URLByAppendingPathComponent:[mode stringByAppendingString:@"-quotes.json"]] atomically:YES];
    [market.tableView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:9 inSection:0] atScrollPosition:UITableViewScrollPositionBottom animated:NO];
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW,600*NSEC_PER_MSEC),dispatch_get_main_queue(),^{
    [self captureWindow:window name:[mode stringByAppendingString:@"-bottom"]];
    tabs.selectedIndex = 0;
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW,600*NSEC_PER_MSEC),dispatch_get_main_queue(),^{
    [self captureWindow:window name:[mode stringByAppendingString:@"-overview"]];
    UIViewController *overview = ((UINavigationController *)tabs.selectedViewController).topViewController;
    XCTAssertEqualWithAccuracy([[overview valueForKey:@"timer"] timeInterval],60,0.01);
    [NSNotificationCenter.defaultCenter postNotificationName:UIApplicationDidEnterBackgroundNotification object:nil];
    XCTAssertNil([market valueForKey:@"pollTimer"]); XCTAssertNil([overview valueForKey:@"timer"]);
    [NSNotificationCenter.defaultCenter postNotificationName:UIApplicationDidBecomeActiveNotification object:nil];
    XCTAssertEqualWithAccuracy([[overview valueForKey:@"timer"] timeInterval],60,0.01);
    XCTAssertNil([market valueForKey:@"pollTimer"]);
    [done fulfill];
    });
    });
    });
  });
  [self waitForExpectations:@[done] timeout:15];
}
- (void)testD6DecimalInputAndFixedValues {
  XCTAssertTrue([BZLedgerSupport validInput:@"0.00000001" positive:YES scale:8]);
  for (NSString *bad in @[@"0", @"1e3", @"-1", @"1.000000001", @"01", @"", @"1,2"]) XCTAssertFalse([BZLedgerSupport validInput:bad positive:YES scale:8]);
  XCTAssertTrue([BZLedgerSupport validInput:@"0" positive:NO scale:18]);
  XCTAssertEqualObjects([BZLedgerSupport quantity:@"1.500000000000000000"], @"1.5");
  XCTAssertEqualObjects([BZLedgerSupport money:@"101" currency:@"USD"], @"$101.00");
  XCTAssertEqualObjects([BZLedgerSupport money:@"222" currency:@"USD"], @"$222.00");
  XCTAssertEqualObjects([BZFormatter price:@"111" currency:@"USD"], @"$111.00");
  XCTAssertEqualObjects([BZLedgerSupport money:@"8.5" currency:@"USD"], @"$8.50");
  XCTAssertEqualObjects([BZLedgerSupport money:@"166.5" currency:@"USD"], @"$166.50");
  XCTAssertEqualObjects([BZLedgerSupport money:@"210" currency:@"USD"], @"$210.00");
  XCTAssertEqualObjects([BZLedgerSupport money:@"43.5" currency:@"USD"], @"$43.50");
  XCTAssertEqualObjects([BZLedgerSupport money:@"56.55" currency:@"SGD"], @"S$56.55");
  XCTAssertEqualObjects([BZLedgerSupport money:@"-0.005" currency:@"USD"], @"$-0.01");
  XCTAssertEqualObjects([BZLedgerSupport money:NSNull.null currency:@"USD"], @"—");
}
- (void)testD6MalformedPayloadAndErrorDetail {
  XCTAssertFalse([BZLedgerSupport validTransactions:@{@"transactions":@[@{}]}]);
  XCTAssertFalse(([BZLedgerSupport validPortfolio:@{@"positions":@[],@"data_complete":@"yes"}]));
  NSError *e = [NSError errorWithDomain:@"BZAPI" code:409 userInfo:@{NSLocalizedDescriptionKey:@"历史负持仓",@"api_error":@{@"code":@"NEGATIVE_HISTORY",@"detail":@{@"transaction_id":@"123"}}}];
  NSString *message = [BZLedgerSupport errorText:e];
  XCTAssertTrue([message containsString:@"409"]); XCTAssertTrue([message containsString:@"NEGATIVE_HISTORY"]); XCTAssertTrue([message containsString:@"123"]);
}
- (NSDictionary *)d6Fixture:(NSString *)name {
  NSURL *url = [[NSBundle bundleForClass:self.class] URLForResource:name withExtension:@"json"];
  XCTAssertNotNil(url); return [NSJSONSerialization JSONObjectWithData:[NSData dataWithContentsOfURL:url] options:0 error:nil];
}
- (NSDictionary *)d6PortfolioFixture { return [self d6Fixture:@"portfolio"]; }
- (BZMarketSnapshot *)d6QuoteFixture {
  NSMutableDictionary *json = [[self snapshotFixture] mutableCopy]; NSMutableArray *quotes = [json[@"quotes"] mutableCopy];
  NSMutableDictionary *btc = [quotes[0] mutableCopy]; btc[@"usd_price"] = @"140"; btc[@"price_sgd"] = @"182"; quotes[0] = btc; json[@"quotes"] = quotes; json[@"server_time"] = btc[@"raw_source_ts"];
  return [[BZMarketSnapshot alloc] initWithJSON:json error:nil];
}
- (void)testD6TransactionJSONFixtureRendering {
  NSDictionary *json = [self d6Fixture:@"transactions"]; XCTAssertTrue([BZLedgerSupport validTransactions:json]);
  BZLedgerViewController *ledger = [BZLedgerViewController new]; [ledger loadViewIfNeeded]; [ledger setValue:json[@"transactions"] forKey:@"rows"];
  UITableViewCell *cell = [ledger tableView:ledger.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]];
  for (NSString *value in @[@"$111.00",@"$8.50",@"1.5",@"08:02"]) XCTAssertTrue([cell.detailTextLabel.text containsString:value]);
  [ledger.tableView reloadData]; XCTAssertEqual([ledger.tableView numberOfRowsInSection:0],3);
}
- (void)testD6PortfolioCardFixtureAndUnavailableStates {
  NSDictionary *json = [self d6PortfolioFixture]; XCTAssertTrue([BZLedgerSupport validPortfolio:json]);
  BZOverviewViewController *vc = [BZOverviewViewController new]; [vc loadViewIfNeeded]; [vc setValue:json forKey:@"portfolio"]; [vc setValue:[self d6QuoteFixture] forKey:@"quotesSnapshot"]; [vc setValue:@NO forKey:@"quotesOffline"]; [vc setValue:@NO forKey:@"offline"]; [vc setValue:@(NSProcessInfo.processInfo.systemUptime) forKey:@"receivedAt"];
  UITableViewCell *p = [vc tableView:vc.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:1]];
  XCTAssertTrue([p.textLabel.text containsString:@"1.5"]);
  for (NSString *number in @[@"$111.00",@"$166.50",@"$210.00",@"$43.50",@"$8.50"]) XCTAssertTrue([p.detailTextLabel.text containsString:number],@"%@",number);
  UISegmentedControl *currency = [vc valueForKey:@"currencySwitch"]; currency.selectedSegmentIndex = 1;
  p = [vc tableView:vc.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:1]];
  XCTAssertTrue([p.detailTextLabel.text containsString:@"S$56.55"]);
  NSMutableDictionary *partial = [json mutableCopy]; partial[@"total_value"] = NSNull.null; partial[@"data_complete"] = @NO; partial[@"fx"] = @{@"stale":@YES}; [vc setValue:partial forKey:@"portfolio"]; [vc setValue:@YES forKey:@"offline"];
  p = [vc tableView:vc.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]];
  XCTAssertTrue([p.textLabel.text containsString:@"—"]); XCTAssertTrue([p.detailTextLabel.text containsString:@"过期"]); XCTAssertTrue([p.detailTextLabel.text containsString:@"汇率过期"]);
  partial[@"fx"] = @{@"stale":NSNull.null}; XCTAssertFalse([BZLedgerSupport validPortfolio:partial]);
}
- (void)d6Wait:(BOOL (^)(void))condition {
  NSPredicate *predicate = [NSPredicate predicateWithBlock:^BOOL(id object, NSDictionary *bindings) { return condition(); }];
  XCTestExpectation *e = [[XCTNSPredicateExpectation alloc] initWithPredicate:predicate object:nil]; [self waitForExpectations:@[e] timeout:25];
}
- (void)d6Press:(UIBarButtonItem *)button { XCTAssertTrue(button.enabled); [UIApplication.sharedApplication sendAction:button.action to:button.target from:button forEvent:nil]; }
- (NSDictionary *)d6Request:(NSString *)method path:(NSString *)path body:(NSDictionary *)body headers:(NSDictionary *)headers {
  XCTestExpectation *done = [self expectationWithDescription:path]; __block NSDictionary *result;
  [BZAPIClient.shared request:method path:path body:body headers:headers ?: @{} completion:^(NSDictionary *json, NSError *error) { XCTAssertNil(error,@"%@",[BZLedgerSupport errorText:error]); result = json; [done fulfill]; }];
  [self waitForExpectations:@[done] timeout:35]; return result;
}
- (void)testD6WriteHeadersAndErrorPayload {
  NSURLSessionConfiguration *config = NSURLSessionConfiguration.ephemeralSessionConfiguration; config.protocolClasses = @[BZD6Protocol.class];
  BZAPIClient *client = [BZAPIClient new]; [client setValue:[NSURLSession sessionWithConfiguration:config] forKey:@"session"];
  __block NSInteger requests = 0;
  BZD6Handler = ^(NSURLProtocol *protocol) {
    requests++; NSURLRequest *r = protocol.request;
    XCTAssertEqualObjects([r valueForHTTPHeaderField:@"If-Match"],@"7");
    NSDictionary *payload = @{@"error":@{@"code":@"VERSION_CONFLICT",@"message":@"conflict",@"detail":@{@"transaction_id":@"42"}}};
    [protocol.client URLProtocol:protocol didReceiveResponse:[[NSHTTPURLResponse alloc] initWithURL:r.URL statusCode:412 HTTPVersion:@"HTTP/1.1" headerFields:nil] cacheStoragePolicy:NSURLCacheStorageNotAllowed];
    [protocol.client URLProtocol:protocol didLoadData:[NSJSONSerialization dataWithJSONObject:payload options:0 error:nil]]; [protocol.client URLProtocolDidFinishLoading:protocol];
  };
  XCTestExpectation *done = [self expectationWithDescription:@"version header"];
  [client request:@"PUT" path:@"/transactions/42" body:@{} headers:@{@"If-Match":@"7"} completion:^(NSDictionary *json,NSError *error) { XCTAssertNil(json); XCTAssertEqual(error.code,412); XCTAssertEqualObjects(error.userInfo[@"api_error"][@"code"],@"VERSION_CONFLICT"); [done fulfill]; }];
  [self waitForExpectations:@[done] timeout:5]; XCTAssertEqual(requests,1); [client.session invalidateAndCancel]; BZD6Handler = nil;
}
- (void)testD6EditorOpeningAndAmbiguousPostRetry {
  BZTransactionEditor *editor = [[BZTransactionEditor alloc] initWithTransaction:nil completion:^{}]; [editor loadViewIfNeeded];
  UITextField *q = [editor valueForKey:@"quantity"], *p = [editor valueForKey:@"price"], *fee = [editor valueForKey:@"fee"];
  q.text = @"1"; p.text = @"0"; fee.text = @"0";
  UISegmentedControl *side = [editor valueForKey:@"side"]; side.selectedSegmentIndex = 2; [side sendActionsForControlEvents:UIControlEventValueChanged];
  p.text = @"0"; NSDictionary *body = [editor formBody]; XCTAssertEqualObjects(body[@"opening_cost_usd"],@"0"); XCTAssertNil(body[@"price_usd"]); XCTAssertFalse(fee.enabled); XCTAssertTrue([body[@"traded_at"] hasSuffix:@":00Z"]);
  side.selectedSegmentIndex = 0; [side sendActionsForControlEvents:UIControlEventValueChanged]; p.text = @"100";
  NSURLSession *original = BZAPIClient.shared.session; NSURLSessionConfiguration *config = NSURLSessionConfiguration.ephemeralSessionConfiguration; config.protocolClasses = @[BZD6Protocol.class]; NSURLSession *mock = [NSURLSession sessionWithConfiguration:config]; [BZAPIClient.shared setValue:mock forKey:@"session"];
  __block NSString *key; __block NSData *firstBody; __block NSInteger requests = 0;
  BZD6Handler = ^(NSURLProtocol *protocol) {
    if (![protocol.request.URL.path hasSuffix:@"/transactions"]) {
      [protocol.client URLProtocol:protocol didReceiveResponse:[[NSHTTPURLResponse alloc] initWithURL:protocol.request.URL statusCode:200 HTTPVersion:@"HTTP/1.1" headerFields:nil] cacheStoragePolicy:NSURLCacheStorageNotAllowed];
      [protocol.client URLProtocol:protocol didLoadData:[NSJSONSerialization dataWithJSONObject:@{} options:0 error:nil]]; [protocol.client URLProtocolDidFinishLoading:protocol]; return;
    }
    requests++; NSString *current = [protocol.request valueForHTTPHeaderField:@"Idempotency-Key"];
    if (requests == 1) { key = current; firstBody = protocol.request.HTTPBody; } else { XCTAssertEqualObjects(current,key); XCTAssertEqualObjects(protocol.request.HTTPBody,firstBody); }
    [protocol.client URLProtocol:protocol didFailWithError:[NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorTimedOut userInfo:nil]];
  };
  @try {
    [self d6Press:editor.navigationItem.rightBarButtonItem]; [self d6Wait:^BOOL { return ![[editor valueForKey:@"saving"] boolValue]; }];
    XCTAssertFalse(q.enabled); XCTAssertTrue([[editor valueForKey:@"errorLabel"] text] != nil);
    [self d6Press:editor.navigationItem.rightBarButtonItem]; [self d6Wait:^BOOL { return requests == 2 && ![[editor valueForKey:@"saving"] boolValue]; }]; XCTAssertEqual(requests,2);
  } @finally { [BZAPIClient.shared setValue:original forKey:@"session"]; [mock invalidateAndCancel]; BZD6Handler = nil; }
}
- (void)testD6LiveLedgerAndPortfolio {
  if (!NSProcessInfo.processInfo.environment[@"BZ_D6_LIVE"]) { XCTSkip(@"D6 dedicated temporary account phase only"); return; }
  NSString *name = NSProcessInfo.processInfo.environment[@"BZ_TEST_USERNAME"]; XCTAssertTrue([name hasPrefix:@"d6_"]);
  NSDictionary *login = [self d6Request:@"POST" path:@"/auth/login" body:@{@"username":name,@"password":NSProcessInfo.processInfo.environment[@"BZ_TEST_PASSWORD"]} headers:nil];
  [BZKeychain saveToken:login[@"token"]]; [BZSessionManager cacheUser:login[@"user"]]; [NSNotificationCenter.defaultCenter postNotificationName:BZSessionDidChange object:nil];
  UIWindow *window = ((UIWindowScene *)UIApplication.sharedApplication.connectedScenes.anyObject).windows.firstObject;
  UITabBarController *tabs = (UITabBarController *)window.rootViewController; XCTAssertTrue([tabs isKindOfClass:UITabBarController.class]); if (![tabs isKindOfClass:UITabBarController.class]) return;
  NSArray *inputs = @[@{@"side":@"buy",@"quantity":@"1",@"price_usd":@"100"},@{@"side":@"buy",@"quantity":@"1",@"price_usd":@"120"},@{@"side":@"sell",@"quantity":@"0.5",@"price_usd":@"130"}];
  for (NSUInteger i=0;i<3;i++) {
    NSMutableDictionary *body = [inputs[i] mutableCopy]; [body addEntriesFromDictionary:@{@"asset":@"BTC",@"fee_amount":@"1",@"fee_currency":@"USD",@"traded_at":[NSString stringWithFormat:@"2026-01-01T00:0%lu:00Z",(unsigned long)i],@"note":@"D6 fixed sample"}];
    [self d6Request:@"POST" path:@"/transactions" body:body headers:@{@"Idempotency-Key":NSUUID.UUID.UUIDString}];
    NSDictionary *portfolio = [self d6Request:@"GET" path:@"/portfolio" body:nil headers:nil]; NSDictionary *position = [portfolio[@"positions"] firstObject];
    XCTAssertEqualObjects([BZLedgerSupport money:position[@"remaining_cost_usd"] currency:@"USD"],(@[@"$101.00",@"$222.00",@"$166.50"][i]));
    if (i==1) XCTAssertEqualObjects([BZFormatter price:position[@"avg_cost_usd"] currency:@"USD"],@"$111.00");
  }
  tabs.selectedIndex = 2; BZLedgerViewController *ledger = (BZLedgerViewController *)((UINavigationController *)tabs.selectedViewController).topViewController; [ledger loadViewIfNeeded]; [ledger refresh];
  [self d6Wait:^BOOL { return [[ledger valueForKey:@"rows"] count] == 3 && ![[ledger valueForKey:@"loading"] boolValue]; }];
  NSArray *rows = [ledger valueForKey:@"rows"]; XCTAssertEqualObjects(rows[0][@"side"],@"sell"); XCTAssertEqualObjects([BZLedgerSupport money:rows[0][@"realized_usd"] currency:@"USD"],@"$8.50");
  [self captureWindow:window name:@"d6-ledger-fixed"];
  NSURL *ledgerDocs = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
  NSDictionary *ledgerEvidence = @{@"transactions":rows,@"server_time":@"2026-11-16T00:00:00Z"};
  // Strip database/user metadata: only public display and version fields are evidence.
  NSMutableArray *publicRows = [NSMutableArray new]; for (NSDictionary *row in rows) { NSMutableDictionary *display = [NSMutableDictionary new]; for (NSString *key in @[@"id",@"version",@"asset",@"side",@"quantity",@"price_usd",@"fee_amount",@"traded_at",@"avg_cost_before_usd",@"realized_usd",@"qty_after"]) display[key] = row[key]; [publicRows addObject:display]; }
  ledgerEvidence = @{@"transactions":publicRows};
  [[NSJSONSerialization dataWithJSONObject:ledgerEvidence options:NSJSONWritingPrettyPrinted error:nil] writeToURL:[ledgerDocs URLByAppendingPathComponent:@"d6-live-transactions.json"] atomically:YES];
  tabs.selectedIndex = 0; BZOverviewViewController *overview = (BZOverviewViewController *)((UINavigationController *)tabs.selectedViewController).topViewController;
  [self d6Wait:^BOOL { return [[overview valueForKey:@"portfolio"][@"positions"] count] == 1 && ![[overview valueForKey:@"loading"] boolValue] && [overview valueForKey:@"quotesSnapshot"] != nil; }];
  NSDictionary *portfolio = [overview valueForKey:@"portfolio"]; NSDictionary *position = [portfolio[@"positions"] firstObject]; XCTAssertEqualObjects([BZLedgerSupport money:position[@"remaining_cost_usd"] currency:@"USD"],@"$166.50");
  NSDecimalNumber *v = [BZFormatter decimal:position[@"market_value"][@"usd"]], *u = [BZFormatter decimal:position[@"unrealized"][@"usd"]]; XCTAssertNotNil(v); XCTAssertEqualObjects([v decimalNumberBySubtracting:[NSDecimalNumber decimalNumberWithString:@"166.5"]],u);
  NSURL *docs = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject; [[NSJSONSerialization dataWithJSONObject:portfolio options:NSJSONWritingPrettyPrinted error:nil] writeToURL:[docs URLByAppendingPathComponent:@"d6-live-portfolio.json"] atomically:YES];
  [self captureWindow:window name:@"d6-overview-live"];
  // Render the exact server-shaped price fixture through the production card; no production prices are modified.
  [overview setValue:[self d6PortfolioFixture] forKey:@"portfolio"]; [overview setValue:[self d6QuoteFixture] forKey:@"quotesSnapshot"]; [overview setValue:@NO forKey:@"quotesOffline"]; [overview.tableView reloadData]; [self captureWindow:window name:@"d6-overview-fixture-usd"];
  UISegmentedControl *currency = [overview valueForKey:@"currencySwitch"]; currency.selectedSegmentIndex = 1; [currency sendActionsForControlEvents:UIControlEventValueChanged]; [self captureWindow:window name:@"d6-overview-fixture-sgd"]; currency.selectedSegmentIndex = 0;
  tabs.selectedIndex = 2; [self d6Press:ledger.navigationItem.rightBarButtonItem];
  [self d6Wait:^BOOL { return ledger.presentedViewController != nil; }];
  BZTransactionEditor *editor = (BZTransactionEditor *)((UINavigationController *)ledger.presentedViewController).topViewController; [editor loadViewIfNeeded];
  ((UITextField *)[editor valueForKey:@"quantity"]).text = @"0.1"; ((UITextField *)[editor valueForKey:@"price"]).text = @"150"; ((UITextField *)[editor valueForKey:@"fee"]).text = @"1";
  [self captureWindow:window name:@"d6-new-form"]; [self d6Press:editor.navigationItem.rightBarButtonItem];
  [self d6Wait:^BOOL { return !ledger.presentedViewController && [[ledger valueForKey:@"rows"] count] == 4; }]; [self captureWindow:window name:@"d6-after-create"];
  [ledger tableView:ledger.tableView didSelectRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]];
  [self d6Wait:^BOOL { return ledger.presentedViewController != nil; }]; editor = (BZTransactionEditor *)((UINavigationController *)ledger.presentedViewController).topViewController; [editor loadViewIfNeeded]; ((UITextField *)[editor valueForKey:@"price"]).text = @"151"; [self captureWindow:window name:@"d6-edit-form"]; [self d6Press:editor.navigationItem.rightBarButtonItem];
  [self d6Wait:^BOOL { return !ledger.presentedViewController && [[ledger valueForKey:@"rows"] count] == 4 && [[[ledger valueForKey:@"rows"] firstObject][@"version"] isEqual:@"2"]; }];
  XCTAssertEqualObjects([BZFormatter price:[[ledger valueForKey:@"rows"] firstObject][@"price_usd"] currency:@"USD"],@"$151.00"); [self captureWindow:window name:@"d6-after-edit"];
  [ledger tableView:ledger.tableView commitEditingStyle:UITableViewCellEditingStyleDelete forRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]];
  [self d6Wait:^BOOL { return [ledger.presentedViewController isKindOfClass:UIAlertController.class]; }];
  UIAlertController *alert = (UIAlertController *)ledger.presentedViewController; [self captureWindow:window name:@"d6-delete-confirm"]; UIAlertAction *deleteAction = alert.actions.lastObject;
  void (^handler)(UIAlertAction *) = [deleteAction valueForKey:@"handler"]; XCTAssertNotNil(handler); [alert dismissViewControllerAnimated:NO completion:nil]; handler(deleteAction);
  [self d6Wait:^BOOL { return [[ledger valueForKey:@"rows"] count] == 3 && ![[ledger valueForKey:@"loading"] boolValue]; }]; [self captureWindow:window name:@"d6-after-delete"];
  NSDictionary *final = [self d6Request:@"GET" path:@"/portfolio" body:nil headers:nil]; XCTAssertEqualObjects([BZLedgerSupport money:[final[@"positions"] firstObject][@"remaining_cost_usd"] currency:@"USD"],@"$166.50");
  [BZSessionManager clearSession];
}
- (void)testD6RejectsNullNoteAndIncompleteTotals {
  NSMutableDictionary *row = [@{@"id":@"1",@"version":@"1",@"asset":@"BTC",@"side":@"buy",@"quantity":@"1",@"price_usd":@"100",@"fee_amount":@"0",@"avg_cost_before_usd":@"0",@"realized_usd":@"0",@"qty_after":@"1",@"traded_at":@"2026-01-01T00:00:00Z",@"note":NSNull.null} mutableCopy];
  NSDictionary *json = @{@"transactions":@[row],@"server_time":@"2026-01-01T00:00:00Z"};
  XCTAssertFalse([BZLedgerSupport validTransactions:json]); row[@"note"] = @""; XCTAssertTrue([BZLedgerSupport validTransactions:json]);
  BZOverviewViewController *overview = [BZOverviewViewController new]; [overview loadViewIfNeeded]; NSMutableDictionary *portfolio = [[self d6PortfolioFixture] mutableCopy]; portfolio[@"data_complete"] = @NO; [overview setValue:portfolio forKey:@"portfolio"]; [overview setValue:@NO forKey:@"offline"]; [overview setValue:@(NSProcessInfo.processInfo.systemUptime) forKey:@"receivedAt"];
  UITableViewCell *cell = [overview tableView:overview.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]]; XCTAssertTrue([cell.textLabel.text containsString:@"—"]); XCTAssertFalse([cell.detailTextLabel.text containsString:@"$43.50"]);
  BZTransactionEditor *editor = [[BZTransactionEditor alloc] initWithTransaction:nil completion:^{}]; [editor loadViewIfNeeded]; XCTAssertEqualObjects(((UITextField *)[editor valueForKey:@"fee"]).text,@"0");
}
- (void)testD6SourceAgeAndLatestRefreshWins {
  BZOverviewViewController *overview = [BZOverviewViewController new]; [overview loadViewIfNeeded]; [overview setValue:[self d6PortfolioFixture] forKey:@"portfolio"]; [overview setValue:@NO forKey:@"offline"]; [overview setValue:@NO forKey:@"quotesOffline"]; [overview setValue:@(NSProcessInfo.processInfo.systemUptime) forKey:@"receivedAt"];
  NSMutableDictionary *agedJSON = [[self d6QuoteFixture].JSON mutableCopy]; agedJSON[@"server_time"] = @"2026-11-16T00:01:59Z";
  BZMarketSnapshot *snapshot = [[BZMarketSnapshot alloc] initWithJSON:agedJSON error:nil]; [snapshot setValue:@(NSProcessInfo.processInfo.systemUptime-2) forKey:@"receivedUptime"]; [overview setValue:snapshot forKey:@"quotesSnapshot"];
  XCTAssertEqualObjects([snapshot statusForQuote:snapshot.quotes.firstObject uptime:NSProcessInfo.processInfo.systemUptime],@"stale");
  UITableViewCell *cell = [overview tableView:overview.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]]; XCTAssertTrue([cell.detailTextLabel.text containsString:@"已过期"]);
  NSURLSession *original = BZAPIClient.shared.session; NSURLSessionConfiguration *config = NSURLSessionConfiguration.ephemeralSessionConfiguration; config.protocolClasses = @[BZD6Protocol.class]; NSURLSession *mock = [NSURLSession sessionWithConfiguration:config]; [BZAPIClient.shared setValue:mock forKey:@"session"];
  NSMutableArray *pending = [NSMutableArray new];
  BZD6Handler = ^(NSURLProtocol *protocol) {
    if ([protocol.request.URL.path hasSuffix:@"/portfolio"] || [protocol.request.URL.path hasSuffix:@"/market/quotes"]) dispatch_async(dispatch_get_main_queue(),^{ [pending addObject:protocol]; });
    else {
      [protocol.client URLProtocol:protocol didReceiveResponse:[[NSHTTPURLResponse alloc] initWithURL:protocol.request.URL statusCode:200 HTTPVersion:@"HTTP/1.1" headerFields:nil] cacheStoragePolicy:NSURLCacheStorageNotAllowed];
      [protocol.client URLProtocol:protocol didLoadData:[NSJSONSerialization dataWithJSONObject:@{} options:0 error:nil]]; [protocol.client URLProtocolDidFinishLoading:protocol];
    }
  };
  @try {
    [overview performSelector:@selector(refresh)]; [self d6Wait:^BOOL { return pending.count == 2; }];
    [overview performSelector:@selector(refresh)]; [self d6Wait:^BOOL { return pending.count == 4; }];
    NSArray *responses = @[@2,@3,@0,@1];
    for (NSNumber *index in responses) {
      NSURLProtocol *protocol = pending[index.unsignedIntegerValue]; BOOL portfolio = [protocol.request.URL.path hasSuffix:@"/portfolio"];
      NSMutableDictionary *json = [(portfolio ? [self d6PortfolioFixture] : [self d6QuoteFixture].JSON) mutableCopy];
      if (portfolio) json[@"total_realized"] = @{@"usd":index.integerValue >= 2 ? @"9" : @"8",@"sgd":@"11"};
      [protocol.client URLProtocol:protocol didReceiveResponse:[[NSHTTPURLResponse alloc] initWithURL:protocol.request.URL statusCode:200 HTTPVersion:@"HTTP/1.1" headerFields:nil] cacheStoragePolicy:NSURLCacheStorageNotAllowed]; [protocol.client URLProtocol:protocol didLoadData:[NSJSONSerialization dataWithJSONObject:json options:0 error:nil]]; [protocol.client URLProtocolDidFinishLoading:protocol];
    }
    [self d6Wait:^BOOL { return [[[overview valueForKey:@"portfolio"][@"total_realized"] objectForKey:@"usd"] isEqual:@"9"]; }];
    XCTAssertEqualObjects([overview valueForKey:@"portfolio"][@"total_realized"][@"usd"],@"9");
  } @finally { [BZAPIClient.shared setValue:original forKey:@"session"]; [mock invalidateAndCancel]; BZD6Handler = nil; }
}
@end
