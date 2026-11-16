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
@end
