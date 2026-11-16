#import <XCTest/XCTest.h>
#import "BZAlertSupport.h"
#import "BZAPIClient.h"
#import "BZLedgerSupport.h"
#import "BZFormatter.h"
#import "BZKeychain.h"
#import "BZSessionManager.h"
#import <UIKit/UIKit.h>
#import "BZAlertsViewController.h"
#import "BZAlertEditor.h"
#import "BZSettingsViewController.h"
#import "BZOverviewViewController.h"
@interface BZAlertEditor (D8Tests)
- (void)save;
- (NSDictionary *)formBody;
@end
@interface BZAlertsViewController (D8Tests)
- (void)toggle:(UIButton *)button;
- (void)bindingAction;
@end
static void (^BZD8Handler)(NSURLProtocol *);
@interface BZD8Protocol : NSURLProtocol
@end
@implementation BZD8Protocol
+ (BOOL)canInitWithRequest:(NSURLRequest *)request { return YES; }
+ (NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request { return request; }
- (void)startLoading { if (BZD8Handler) BZD8Handler(self); }
- (void)stopLoading {}
@end
static void BZD8Respond(NSURLProtocol *p, NSInteger code, NSDictionary *json) {
  [p.client URLProtocol:p didReceiveResponse:[[NSHTTPURLResponse alloc] initWithURL:p.request.URL statusCode:code HTTPVersion:@"HTTP/1.1" headerFields:nil] cacheStoragePolicy:NSURLCacheStorageNotAllowed];
  [p.client URLProtocol:p didLoadData:[NSJSONSerialization dataWithJSONObject:json options:0 error:nil]]; [p.client URLProtocolDidFinishLoading:p];
}
@interface BZD8Tests : XCTestCase
@property(nonatomic) NSURLSession *originalSession;
@property(nonatomic) UIViewController *originalRoot;
@property(nonatomic) UIWindow *window;
@end
@implementation BZD8Tests
- (void)tearDown {
  if (self.originalSession) { [BZAPIClient.shared.session invalidateAndCancel]; [BZAPIClient.shared setValue:self.originalSession forKey:@"session"]; self.originalSession = nil; }
  BZD8Handler = nil;
  if (self.originalRoot) self.window.rootViewController = self.originalRoot;
  [BZSessionManager clearSession]; [super tearDown];
}
- (void)mock:(void (^)(NSURLProtocol *))handler {
  self.originalSession = BZAPIClient.shared.session;
  NSURLSessionConfiguration *c = NSURLSessionConfiguration.ephemeralSessionConfiguration; c.protocolClasses = @[BZD8Protocol.class];
  [BZAPIClient.shared setValue:[NSURLSession sessionWithConfiguration:c] forKey:@"session"]; BZD8Handler = [handler copy];
}
- (void)wait:(BOOL (^)(void))condition {
  XCTestExpectation *e = [[XCTNSPredicateExpectation alloc] initWithPredicate:[NSPredicate predicateWithBlock:^BOOL(id obj, NSDictionary *bindings) { return condition(); }] object:nil]; [self waitForExpectations:@[e] timeout:15];
}
- (void)show:(UIViewController *)vc {
  self.window = ((UIWindowScene *)UIApplication.sharedApplication.connectedScenes.anyObject).windows.firstObject; self.originalRoot = self.window.rootViewController; self.window.rootViewController = [[UINavigationController alloc] initWithRootViewController:vc]; [self.window makeKeyAndVisible]; [vc loadViewIfNeeded];
}
- (NSString *)cellText:(UITableViewCell *)cell {
  NSMutableArray *texts = [NSMutableArray new]; NSMutableArray *views = [NSMutableArray arrayWithObject:cell.contentView];
  while (views.count) { UIView *v = views.lastObject; [views removeLastObject]; if ([v isKindOfClass:UILabel.class] && ((UILabel *)v).text) [texts addObject:((UILabel *)v).text]; [views addObjectsFromArray:v.subviews]; }
  return [texts componentsJoinedByString:@"\n"];
}
- (NSDictionary *)rule { return @{@"id":@"1",@"version":@"2",@"asset":@"BTC",@"direction":@"above",@"threshold_usd":@"100",@"current_price_usd":@"101",@"state":@"disabled",@"disabled_reason":@"triggered",@"price_status":@"ok",@"alerts_paused":@NO,@"last_triggered_at":@"2026-11-16T17:00:00Z"}; }
- (NSDictionary *)event { return @{@"id":@"9",@"rule_id":@"1",@"asset":@"BTC",@"direction":@"above",@"threshold_usd":@"100",@"price_usd":@"101",@"triggered_at":@"2026-11-16T17:00:00Z",@"trigger_kind":@"on_create",@"delivery_status":@"failed",@"last_error":@"TELEGRAM_NOT_BOUND"}; }
- (void)testStrictAlertsAndEventsRejectMalformedPricesBooleansAndEnums {
  NSMutableDictionary *r = [self.rule mutableCopy]; NSDictionary *(^wrap)(id) = ^NSDictionary *(id row) { return @{@"alerts":@[row],@"server_time":@"2026-11-17T00:00:00Z"}; };
  XCTAssertTrue(([BZAlertSupport validAlerts:wrap(r)]));
  for (NSString *key in @[@"id",@"version",@"asset",@"direction",@"threshold_usd",@"current_price_usd",@"state",@"disabled_reason",@"price_status",@"alerts_paused"]) { NSMutableDictionary *bad = [r mutableCopy]; bad[key] = @42; XCTAssertFalse(([BZAlertSupport validAlerts:wrap(bad)]),@"%@",key); }
  r[@"current_price_usd"] = NSNull.null; r[@"price_status"] = @"stale"; r[@"alerts_paused"] = @YES; XCTAssertTrue(([BZAlertSupport validAlerts:wrap(r)]));
  XCTAssertFalse(([BZAlertSupport validAlerts:@{@"alerts":@[NSNull.null]}]));
  XCTAssertFalse(([BZAlertSupport validAlerts:@{@"alerts":@[self.rule,self.rule],@"server_time":@"2026-11-17T00:00:00Z"}]));
  NSMutableDictionary *e = [self.event mutableCopy]; NSMutableDictionary *events = [@{@"events":@[e],@"server_time":@"2026-11-17T00:00:00Z"} mutableCopy]; XCTAssertTrue(([BZAlertSupport validEvents:events]));
  for (NSString *key in @[@"id",@"rule_id",@"asset",@"direction",@"threshold_usd",@"price_usd",@"triggered_at",@"trigger_kind",@"delivery_status",@"last_error"]) { NSMutableDictionary *bad = [e mutableCopy]; bad[key] = @42; events[@"events"] = @[bad]; XCTAssertFalse(([BZAlertSupport validEvents:events]),@"%@",key); }
  XCTAssertTrue(([[BZAlertSupport eventText:e] containsString:@"2026-11-17 01:00 SGT"]));
  XCTAssertTrue(([[BZAlertSupport eventText:e] containsString:@"TELEGRAM_NOT_BOUND"]));
  XCTAssertTrue(([[BZAlertSupport eventText:e] containsString:@"$101.00"]));
}
- (void)testRuleStatesAndRestartBoundaryUseReturnedUSDOnly {
  NSMutableDictionary *r = [self.rule mutableCopy]; XCTAssertEqualObjects(([BZAlertSupport stateText:r]),@"已触发停用"); XCTAssertTrue(([BZAlertSupport restartNeedsConfirmation:r]));
  r[@"current_price_usd"] = @"100"; XCTAssertTrue(([BZAlertSupport restartNeedsConfirmation:r])); r[@"current_price_usd"] = @"99.99"; XCTAssertFalse(([BZAlertSupport restartNeedsConfirmation:r])); r[@"direction"] = @"below"; XCTAssertTrue(([BZAlertSupport restartNeedsConfirmation:r])); r[@"current_price_usd"] = NSNull.null; XCTAssertFalse(([BZAlertSupport restartNeedsConfirmation:r]));
  r[@"disabled_reason"] = @"manual"; XCTAssertEqualObjects(([BZAlertSupport stateText:r]),@"已停用"); r[@"state"] = @"active"; r[@"disabled_reason"] = NSNull.null; XCTAssertEqualObjects(([BZAlertSupport stateText:r]),@"生效中"); r[@"alerts_paused"] = @YES; XCTAssertEqualObjects(([BZAlertSupport stateText:r]),@"价格暂停");
}
- (void)testBindingThreeStatesAndStrictUserSettings {
  XCTAssertEqualObjects(([BZAlertSupport bindingText:nil]),@"绑定状态暂不可用");
  XCTAssertEqualObjects(([BZAlertSupport bindingText:@{@"bound":@NO,@"status":@"revoked",@"chat_id_last4":NSNull.null}]),@"未绑定");
  XCTAssertEqualObjects(([BZAlertSupport bindingText:@{@"bound":@YES,@"status":@"bound",@"chat_id_last4":@"1234"}]),@"已绑定（···1234）");
  XCTAssertFalse(([BZAlertSupport validBinding:@{@"bound":@1,@"chat_id_last4":@"1234"}]));
  XCTAssertFalse(([BZAlertSupport validBinding:@{@"bound":@YES,@"status":@"bound",@"chat_id_last4":@"123456"}]));
  XCTAssertTrue(([BZAlertSupport validUser:@{@"user":@{@"id":@"1",@"username":@"fixture",@"display_currency":@"SGD",@"daily_summary_enabled":@YES}}]));
  XCTAssertFalse(([BZAlertSupport validUser:@{@"user":@{@"id":@"1",@"username":@"fixture",@"display_currency":@"EUR",@"daily_summary_enabled":@YES}}]));
}
- (void)testSummaryThreeFixturesAndUnavailableNeverInventsSGD {
  XCTAssertEqualObjects(([BZAlertSupport summaryText:@{@"summary":NSNull.null} currency:@"USD"]),@"暂无汇总 · 每天 21:00 SGT 生成");
  NSDictionary *sent = @{@"summary":@{@"status":@"sent",@"summary_date":@"2026-11-16",@"day_pnl_usd":@"10",@"day_pnl_sgd":@"13.25",@"fx_stale":@NO}};
  XCTAssertEqualObjects(([BZAlertSupport summaryText:sent currency:@"SGD"]),@"2026-11-16 · 当日盈亏 S$13.25");
  XCTAssertEqualObjects(([BZAlertSupport summaryText:sent currency:@"USD"]),@"2026-11-16 · 当日盈亏 $10.00");
  XCTAssertEqualObjects(([BZAlertSupport summaryText:@{@"summary":@{@"status":@"skipped_stale",@"summary_date":@"2026-11-16"}} currency:@"USD"]),@"今日汇总暂缓：行情数据异常");
  for (id value in @[NSNull.null,@{},@{@"summary":@{@"status":@"sent",@"day_pnl_usd":@10}},@{@"summary":@{@"status":@"invented"}}]) XCTAssertEqualObjects(([BZAlertSupport summaryText:value == NSNull.null ? nil : value currency:@"USD"]),@"汇总服务暂不可用");
  XCTAssertEqualObjects(([BZAlertSupport summaryText:@{@"summary":@{@"status":@"sent",@"summary_date":@"2026-11-16",@"day_pnl_usd":@"10",@"day_pnl_sgd":NSNull.null,@"fx_stale":@YES}} currency:@"SGD"]),@"2026-11-16 · 当日盈亏 — · 汇率过期");
}
- (void)testThresholdValidationMatchesD6 {
  for (NSString *v in @[@"0",@"0.01",@"99999999999999999999.123456789012345678"]) XCTAssertTrue(([BZAlertSupport validThreshold:v]));
  for (id v in @[@"",@"-1",@"1,000",@"1e3",@"01",@"1.1234567890123456789",@42,NSNull.null]) XCTAssertFalse(([BZAlertSupport validThreshold:v]));
}

- (void)testEditorFreezesAmbiguousRequestAndRejectsMalformedSuccess {
  __block NSUInteger writes = 0; __block NSString *key; __block NSData *body; __block BOOL completed = NO;
  [self mock:^(NSURLProtocol *p) {
    writes++; XCTAssertEqualObjects(p.request.HTTPMethod,@"POST");
    NSString *k = [p.request valueForHTTPHeaderField:@"Idempotency-Key"];
    NSInputStream *stream = p.request.HTTPBodyStream; [stream open]; NSMutableData *bytes = [NSMutableData new]; uint8_t buf[1024]; NSInteger n; while ((n = [stream read:buf maxLength:sizeof(buf)]) > 0) [bytes appendBytes:buf length:n]; [stream close];
    NSData *payload = p.request.HTTPBody ?: bytes;
    if (writes == 1) { key = k; body = payload; [p.client URLProtocol:p didFailWithError:[NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorTimedOut userInfo:nil]]; }
    else { XCTAssertEqualObjects(k,key); XCTAssertEqualObjects(payload,body); BZD8Respond(p,200,@{}); }
  }];
  BZAlertEditor *vc = [[BZAlertEditor alloc] initWithRule:nil completion:^(NSString *message) { completed = YES; }]; [vc loadViewIfNeeded];
  ((UITextField *)[vc valueForKey:@"threshold"]).text = @"100"; [vc save]; [self wait:^BOOL { return ![[vc valueForKey:@"saving"] boolValue]; }];
  XCTAssertFalse(((UITextField *)[vc valueForKey:@"threshold"]).enabled); XCTAssertNotNil([vc valueForKey:@"pendingBody"]); XCTAssertEqualObjects(vc.navigationItem.rightBarButtonItem.title,@"重试保存");
  [vc save]; [self wait:^BOOL { return writes == 2 && ![[vc valueForKey:@"saving"] boolValue]; }]; XCTAssertFalse(completed); XCTAssertNotNil([vc valueForKey:@"pendingBody"]); XCTAssertFalse(((UITextField *)[vc valueForKey:@"threshold"]).enabled);
}
- (void)testEditor412StopsSaveAndPreservesServerMessage {
  [self mock:^(NSURLProtocol *p) { XCTAssertEqualObjects(p.request.HTTPMethod,@"PATCH"); XCTAssertEqualObjects([p.request valueForHTTPHeaderField:@"If-Match"],@"2"); BZD8Respond(p,412,@{@"error":@{@"code":@"VERSION_CONFLICT",@"message":@"原始错误文案",@"detail":@{@"rule_id":@"1"}}}); }];
  BZAlertEditor *vc = [[BZAlertEditor alloc] initWithRule:self.rule completion:^(NSString *message) {}]; [vc loadViewIfNeeded]; [vc save]; [self wait:^BOOL { return ![[vc valueForKey:@"saving"] boolValue]; }];
  XCTAssertFalse(vc.navigationItem.rightBarButtonItem.enabled); XCTAssertEqualObjects(vc.navigationItem.leftBarButtonItem.title,@"关闭并刷新"); XCTAssertTrue([((UILabel *)[vc valueForKey:@"errorLabel"]).text containsString:@"原始错误文案"]); XCTAssertFalse(((UITextField *)[vc valueForKey:@"threshold"]).enabled);
}
- (void)testRealCellsRenderRulesHistoryAndSummaryFixtures {
  BZAlertsViewController *vc = [BZAlertsViewController new]; [vc loadViewIfNeeded]; [vc setValue:@[self.rule] forKey:@"rules"]; [vc setValue:@[self.event] forKey:@"events"];
  UITableViewCell *r = [vc tableView:vc.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:1]];
  XCTAssertEqualObjects(r.textLabel.text,@"BTC"); XCTAssertTrue([r.detailTextLabel.text containsString:@"已触发停用"]); XCTAssertTrue([r.detailTextLabel.text containsString:@"突破 $100.00"]);
  UITableViewCell *e = [vc tableView:vc.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:2]]; XCTAssertTrue([e.detailTextLabel.text containsString:@"TELEGRAM_NOT_BOUND"]);
  BZOverviewViewController *overview = [BZOverviewViewController new]; [overview loadViewIfNeeded];
  NSArray *fixtures = @[@{@"summary":NSNull.null},@{@"summary":@{@"status":@"sent",@"summary_date":@"2026-11-16",@"day_pnl_usd":@"10",@"day_pnl_sgd":@"13.25",@"fx_stale":@NO}},@{@"summary":@{@"status":@"skipped_stale"}}];
  NSArray *expected = @[@"暂无汇总 · 每天 21:00 SGT 生成",@"2026-11-16 · 当日盈亏 $10.00",@"今日汇总暂缓：行情数据异常"];
  for (NSUInteger i=0;i<fixtures.count;i++) { [overview setValue:fixtures[i] forKey:@"summaryJSON"]; UITableViewCell *c = [overview tableView:overview.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:3]]; XCTAssertEqualObjects(c.detailTextLabel.text,expected[i]); }
  [overview setValue:nil forKey:@"summaryJSON"]; UITableViewCell *unavailable = [overview tableView:overview.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:3]]; XCTAssertEqualObjects(unavailable.detailTextLabel.text,@"汇总服务暂不可用");
}
- (void)testUnconfiguredBindingCardNeverPretendsToOpenTelegram {
  NSDictionary *binding = @{@"bound":@NO,@"status":@"pending",@"chat_id_last4":NSNull.null};
  [self mock:^(NSURLProtocol *p) {
    if ([p.request.HTTPMethod isEqual:@"POST"]) { XCTAssertNil([p.request valueForHTTPHeaderField:@"Content-Type"]); BZD8Respond(p,200,@{@"bot_configured":@NO,@"token":@"fixture-temporary-token",@"bind_url":@"fixture-temporary-token",@"expires_at":@"2026-11-17T01:00:00Z"}); }
    else if ([p.request.URL.path hasSuffix:@"/binding"]) BZD8Respond(p,200,binding);
    else BZD8Respond(p,200,@{});
  }];
  BZAlertsViewController *vc = [BZAlertsViewController new]; [vc loadViewIfNeeded]; [vc setValue:binding forKey:@"binding"]; [vc bindingAction]; [self wait:^BOOL { return ![[vc valueForKey:@"bindingBusy"] boolValue]; }];
  NSString *text = [self cellText:[vc tableView:vc.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]]]; XCTAssertTrue([text containsString:@"未绑定"]); XCTAssertTrue([text containsString:@"机器人尚未配置，请使用以下凭据在机器人中发送 /start"]); XCTAssertTrue([text containsString:@"fixture-temporary-token"]);
}
- (void)testTodayCountsSGTAndPausedRulesAreNotActive {
  NSMutableDictionary *active = [self.rule mutableCopy]; active[@"id"] = @"2"; active[@"state"] = @"active"; active[@"disabled_reason"] = NSNull.null;
  NSMutableDictionary *paused = [active mutableCopy]; paused[@"id"] = @"3"; paused[@"alerts_paused"] = @YES; paused[@"price_status"] = @"stale";
  NSDictionary *alerts = @{@"alerts":@[self.rule,active,paused],@"server_time":@"2026-11-17T00:00:00Z"};
  NSMutableDictionary *yesterday = [self.event mutableCopy]; yesterday[@"id"] = @"8"; yesterday[@"triggered_at"] = @"2026-11-16T15:59:59Z";
  NSDictionary *events = @{@"events":@[self.event,yesterday],@"server_time":@"2026-11-17T00:00:00Z"}; XCTAssertEqualObjects([BZAlertSupport todayText:alerts events:events],@"今日触发 1 条 · 生效中 1 条");
}


- (void)testSettingsUsesServerResponseAndNotifiesOverview {
  __block NSDictionary *user = @{@"id":@"1",@"username":@"fixture",@"display_currency":@"USD",@"daily_summary_enabled":@YES}; __block NSUInteger writes = 0;
  [self mock:^(NSURLProtocol *p) {
    if ([p.request.HTTPMethod isEqual:@"PATCH"]) { writes++; XCTAssertEqualObjects(p.request.URL.path,@"/api/v1/me/settings"); user = @{@"id":@"1",@"username":@"fixture",@"display_currency":@"SGD",@"daily_summary_enabled":@YES}; }
    if ([p.request.URL.path hasSuffix:@"/binding"]) BZD8Respond(p,200,@{@"bound":@NO,@"status":@"revoked",@"chat_id_last4":NSNull.null}); else BZD8Respond(p,200,@{@"user":user});
  }];
  BZSettingsViewController *vc = [BZSettingsViewController new]; [vc loadViewIfNeeded]; [vc refresh]; [self wait:^BOOL { return [vc valueForKey:@"user"] != nil; }];
  UISegmentedControl *currency = [vc valueForKey:@"currencySwitch"]; XCTAssertEqual(currency.selectedSegmentIndex,0);
  XCTestExpectation *notice = [self expectationForNotification:BZSettingsDidChange object:nil handler:^BOOL(NSNotification *n) { return [n.object[@"display_currency"] isEqual:@"SGD"]; }];
  currency.selectedSegmentIndex = 1; [currency sendActionsForControlEvents:UIControlEventValueChanged]; XCTAssertEqual(currency.selectedSegmentIndex,0); XCTAssertFalse(currency.enabled);
  [self waitForExpectations:@[notice] timeout:5]; XCTAssertEqual(writes,1); XCTAssertEqual(currency.selectedSegmentIndex,1); XCTAssertTrue(currency.enabled);
  UISwitch *summary = [vc valueForKey:@"summarySwitch"]; summary.on = NO; [summary sendActionsForControlEvents:UIControlEventValueChanged]; [self wait:^BOOL { return writes == 2 && ![[vc valueForKey:@"saving"] boolValue]; }]; XCTAssertTrue(summary.on); // Server response wins even if it differs from intent.
}
- (void)testToggleConfirmationAndBodylessDeleteHeaders {
  __block NSUInteger writes = 0; __block NSString *method;
  NSDictionary *rule = self.rule;
  [self mock:^(NSURLProtocol *p) {
    if (![p.request.HTTPMethod isEqual:@"GET"]) { writes++; method = p.request.HTTPMethod; if ([method isEqual:@"DELETE"]) { XCTAssertNil(p.request.HTTPBody); XCTAssertNil([p.request valueForHTTPHeaderField:@"Content-Type"]); } else XCTAssertEqualObjects([p.request valueForHTTPHeaderField:@"If-Match"],@"2"); BZD8Respond(p,200,@{@"ok":@YES,@"alert":rule}); }
    else if ([p.request.URL.path hasSuffix:@"/alerts"]) BZD8Respond(p,200,@{@"alerts":@[rule],@"server_time":@"2026-11-17T00:00:00Z"});
    else if ([p.request.URL.path hasSuffix:@"/events"]) BZD8Respond(p,200,@{@"events":@[],@"server_time":@"2026-11-17T00:00:00Z"});
    else BZD8Respond(p,200,@{@"bound":@NO,@"status":@"revoked",@"chat_id_last4":NSNull.null});
  }];
  BZAlertsViewController *vc = [BZAlertsViewController new]; [self show:vc]; [self wait:^BOOL { return [[vc valueForKey:@"rules"] count] == 1; }]; UIButton *button = [UIButton new]; button.tag = 0; [vc toggle:button];
  [self wait:^BOOL { return [vc.presentedViewController isKindOfClass:UIAlertController.class]; }]; XCTAssertEqual(writes,0); UIAlertController *confirm = (id)vc.presentedViewController; XCTAssertEqualObjects(confirm.message,@"当前价已越线，重启后会立即再推送一次"); [confirm dismissViewControllerAnimated:NO completion:nil];
  NSMutableDictionary *active = [rule mutableCopy]; active[@"state"] = @"active"; active[@"disabled_reason"] = NSNull.null; [vc setValue:@[active] forKey:@"rules"]; [vc toggle:button]; [self wait:^BOOL { return writes == 1 && ![[vc valueForKey:@"writing"] boolValue]; }]; XCTAssertNil(vc.presentedViewController); XCTAssertEqualObjects(method,@"PATCH");
  [vc tableView:vc.tableView commitEditingStyle:UITableViewCellEditingStyleDelete forRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:1]]; [self wait:^BOOL { return [vc.presentedViewController isKindOfClass:UIAlertController.class]; }]; XCTAssertEqual(writes,1);
  UIAlertController *del = (id)vc.presentedViewController; UIAlertAction *action = del.actions.lastObject; void (^handler)(UIAlertAction *) = [action valueForKey:@"handler"]; [del dismissViewControllerAnimated:NO completion:nil]; handler(action); [self wait:^BOOL { return writes == 2 && ![[vc valueForKey:@"writing"] boolValue]; }]; XCTAssertEqualObjects(method,@"DELETE");
}
- (NSDictionary *)request:(NSString *)method path:(NSString *)path body:(NSDictionary *)body headers:(NSDictionary *)headers error:(NSError **)failure {
  XCTestExpectation *e = [self expectationWithDescription:path]; __block NSDictionary *result; __block NSError *saved;
  [BZAPIClient.shared request:method path:path body:body headers:headers ?: @{} completion:^(NSDictionary *json, NSError *error) { result = json; saved = error; [e fulfill]; }]; [self waitForExpectations:@[e] timeout:40]; if (failure) *failure = saved; return result;
}
- (void)press:(UIBarButtonItem *)button { XCTAssertTrue(button.enabled); [UIApplication.sharedApplication sendAction:button.action to:button.target from:button forEvent:nil]; }
- (void)acceptAlert:(UIAlertController *)alert {
  UIAlertAction *action = alert.actions.lastObject; void (^handler)(UIAlertAction *) = [action valueForKey:@"handler"]; [alert dismissViewControllerAnimated:NO completion:nil]; if (handler) handler(action);
}
- (void)capture:(NSString *)name redactBinding:(BOOL)redact {
  UIWindow *window = ((UIWindowScene *)UIApplication.sharedApplication.connectedScenes.anyObject).windows.firstObject;
  NSMutableArray *hidden = [NSMutableArray new]; NSMutableArray *views = [NSMutableArray arrayWithObject:window];
  while (views.count) { UIView *v = views.lastObject; [views removeLastObject]; if (redact && [v.accessibilityIdentifier isEqual:@"telegram.temporary-token"]) { [hidden addObject:v]; v.hidden = YES; } [views addObjectsFromArray:v.subviews]; }
  [window layoutIfNeeded]; UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithBounds:window.bounds]; UIImage *image = [renderer imageWithActions:^(UIGraphicsImageRendererContext *c) { [window drawViewHierarchyInRect:window.bounds afterScreenUpdates:YES]; }];
  NSURL *docs = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject; [UIImagePNGRepresentation(image) writeToURL:[docs URLByAppendingPathComponent:[name stringByAppendingString:@".png"]] atomically:YES];
  for (UIView *v in hidden) v.hidden = NO;
}
- (void)evidence:(NSDictionary *)json name:(NSString *)name {
  NSURL *docs = [NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject; [[NSJSONSerialization dataWithJSONObject:json options:NSJSONWritingPrettyPrinted error:nil] writeToURL:[docs URLByAppendingPathComponent:[name stringByAppendingString:@".json"]] atomically:YES];
}
- (void)testD8LiveTemporaryAccountUIAndServerPersistence {
#if DEBUG
  NSDictionary *env = NSProcessInfo.processInfo.environment;
  if (!env[@"BZ_D8_LIVE"]) { XCTSkip(@"Dedicated d8_ loopback DEBUG phase only"); return; }
  NSURL *base = [NSURL URLWithString:[NSBundle.mainBundle objectForInfoDictionaryKey:@"BZ_API_BASE_URL"]]; NSString *name = env[@"BZ_TEST_USERNAME"];
  BOOL allowed = [@[@"127.0.0.1",@"localhost",@"::1"] containsObject:base.host] && [name hasPrefix:@"d8_"];
  XCTAssertTrue(allowed); if (!allowed) return;
  NSError *error; NSDictionary *login = [self request:@"POST" path:@"/auth/login" body:@{@"username":name,@"password":env[@"BZ_TEST_PASSWORD"]} headers:nil error:&error]; XCTAssertNil(error); if (error) return;
  [BZKeychain saveToken:login[@"token"]]; [BZSessionManager cacheUser:login[@"user"]];
  NSDictionary *me = [self request:@"GET" path:@"/me" body:nil headers:nil error:&error]; XCTAssertNil(error); XCTAssertEqualObjects(me[@"user"][@"username"],name); if (![me[@"user"][@"username"] isEqual:name]) return;
  [NSNotificationCenter.defaultCenter postNotificationName:BZSessionDidChange object:nil];
  UIWindow *window = ((UIWindowScene *)UIApplication.sharedApplication.connectedScenes.anyObject).windows.firstObject; UITabBarController *tabs = (UITabBarController *)window.rootViewController; XCTAssertTrue([tabs isKindOfClass:UITabBarController.class]); if (![tabs isKindOfClass:UITabBarController.class]) return;
  if ([env[@"BZ_D8_PHASE"] isEqual:@"persist"]) {
    XCTAssertEqualObjects(me[@"user"][@"display_currency"],@"SGD"); tabs.selectedIndex = 4; BZSettingsViewController *settings = (id)((UINavigationController *)tabs.selectedViewController).topViewController; [settings refresh]; [self wait:^BOOL { return [[settings valueForKey:@"user"][@"display_currency"] isEqual:@"SGD"]; }]; [self capture:@"d8-settings-after-relaunch" redactBinding:NO]; [self evidence:@{@"display_currency":me[@"user"][@"display_currency"],@"relaunch":@YES} name:@"d8-persistence"]; return;
  }
  tabs.selectedIndex = 3; BZAlertsViewController *alerts = (id)((UINavigationController *)tabs.selectedViewController).topViewController; [alerts refresh]; [self wait:^BOOL { return [alerts valueForKey:@"rules"] != nil && [alerts valueForKey:@"binding"] != nil; }];
  XCTAssertEqual([[alerts valueForKey:@"rules"] count],0); XCTAssertFalse([[alerts valueForKey:@"binding"][@"bound"] boolValue]);
  [self press:alerts.navigationItem.rightBarButtonItem]; [self wait:^BOOL { return [alerts.presentedViewController isKindOfClass:UINavigationController.class]; }]; BZAlertEditor *editor = (id)((UINavigationController *)alerts.presentedViewController).topViewController; [editor loadViewIfNeeded]; ((UITextField *)[editor valueForKey:@"threshold"]).text = @"1"; [self press:editor.navigationItem.rightBarButtonItem];
  [self wait:^BOOL { return [alerts.presentedViewController isKindOfClass:UIAlertController.class]; }]; UIAlertController *immediate = (id)alerts.presentedViewController; XCTAssertEqualObjects(immediate.message,@"当前价已越线：已立即推送一条 Telegram，该提醒已停用"); [self capture:@"d8-immediate-trigger" redactBinding:NO]; [self acceptAlert:immediate];
  [self wait:^BOOL { return [[alerts valueForKey:@"rules"] count] == 1; }]; XCTAssertEqualObjects([alerts valueForKey:@"rules"][0][@"state"],@"disabled"); XCTAssertEqualObjects([alerts valueForKey:@"rules"][0][@"disabled_reason"],@"triggered");
  [self press:alerts.navigationItem.rightBarButtonItem]; [self wait:^BOOL { return [alerts.presentedViewController isKindOfClass:UINavigationController.class]; }]; editor = (id)((UINavigationController *)alerts.presentedViewController).topViewController; [editor loadViewIfNeeded]; ((UITextField *)[editor valueForKey:@"threshold"]).text = @"999999999999"; [self press:editor.navigationItem.rightBarButtonItem]; [self wait:^BOOL { return !alerts.presentedViewController && [[alerts valueForKey:@"rules"] count] == 2; }];
  XCTAssertEqualObjects([alerts valueForKey:@"rules"][1][@"state"],@"active");
  UIButton *toggle = [UIButton new]; toggle.tag = 1; [alerts toggle:toggle]; [self wait:^BOOL { return [[alerts valueForKey:@"rules"][1][@"disabled_reason"] isEqual:@"manual"]; }]; [self capture:@"d8-manually-disabled" redactBinding:NO];
  [alerts toggle:toggle]; [self wait:^BOOL { return [[alerts valueForKey:@"rules"][1][@"state"] isEqual:@"active"]; }]; [self capture:@"d8-alert-list" redactBinding:NO];
  // Restart an already-crossed rule requires explicit confirmation before PATCH.
  toggle.tag = 0; [alerts toggle:toggle]; [self wait:^BOOL { return [alerts.presentedViewController isKindOfClass:UIAlertController.class]; }]; UIAlertController *restart = (id)alerts.presentedViewController; XCTAssertEqualObjects(restart.message,@"当前价已越线，重启后会立即再推送一次"); [self capture:@"d8-restart-confirm" redactBinding:NO]; [restart dismissViewControllerAnimated:NO completion:nil];
  [alerts bindingAction]; [self wait:^BOOL { return ![[alerts valueForKey:@"bindingBusy"] boolValue] && [alerts valueForKey:@"bindInfo"] != nil; }]; XCTAssertFalse([[alerts valueForKey:@"bindInfo"][@"bot_configured"] boolValue]); [alerts.tableView setContentOffset:CGPointMake(0,-alerts.tableView.adjustedContentInset.top) animated:NO]; [self capture:@"d8-binding-unconfigured-redacted" redactBinding:YES];
  // Persist only public fields: never write a temporary session/binding credential.
  NSDictionary *rules = [self request:@"GET" path:@"/alerts" body:nil headers:nil error:&error]; XCTAssertNil(error); NSDictionary *events = [self request:@"GET" path:@"/alerts/events?limit=100" body:nil headers:nil error:&error]; XCTAssertNil(error); XCTAssertTrue([BZAlertSupport validAlerts:rules]); XCTAssertTrue([BZAlertSupport validEvents:events]); [self evidence:rules name:@"d8-live-alerts"]; [self evidence:events name:@"d8-live-events"];
  tabs.selectedIndex = 4; BZSettingsViewController *settings = (id)((UINavigationController *)tabs.selectedViewController).topViewController; [settings refresh]; [self wait:^BOOL { return [settings valueForKey:@"user"] != nil; }];
  [self capture:@"d8-settings-before-save" redactBinding:NO];
  UISegmentedControl *currency = [settings valueForKey:@"currencySwitch"]; currency.selectedSegmentIndex = 1; [currency sendActionsForControlEvents:UIControlEventValueChanged]; [self wait:^BOOL { return ![[settings valueForKey:@"saving"] boolValue]; }];
  BOOL saved = [[settings valueForKey:@"user"][@"display_currency"] isEqual:@"SGD"];
  if (settings.presentedViewController) { [self capture:@"d8-settings-save-unavailable" redactBinding:NO]; [self acceptAlert:(id)settings.presentedViewController]; [self wait:^BOOL { return settings.presentedViewController == nil && [settings valueForKey:@"failure"] == nil; }]; }
  [self capture:@"d8-settings" redactBinding:NO];
  NSDictionary *latest = [self request:@"GET" path:@"/summary/daily/latest" body:nil headers:nil error:&error]; NSString *summaryText = [BZAlertSupport summaryText:latest currency:@"SGD"];
  NSMutableDictionary *dependencies = [@{@"settings_saved_sgd":@(saved),@"summary_text":summaryText} mutableCopy]; if (error) dependencies[@"summary_error"] = [BZLedgerSupport errorText:error]; if (latest) dependencies[@"summary_response"] = latest;
  if ([settings valueForKey:@"failure"]) dependencies[@"settings_error"] = [settings valueForKey:@"failure"]; [self evidence:dependencies name:@"d8-dependencies"];
  tabs.selectedIndex = 0; BZOverviewViewController *overview = (id)((UINavigationController *)tabs.selectedViewController).topViewController; [overview performSelector:@selector(refresh)]; [self wait:^BOOL { return ![[overview valueForKey:@"loading"] boolValue] && [overview valueForKey:@"eventsJSON"] != nil; }]; [self capture:@"d8-overview-cards" redactBinding:NO];
  UITableViewCell *summaryCell = [overview tableView:overview.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:3]]; XCTAssertEqualObjects(summaryCell.detailTextLabel.text,summaryText);
  // Acceptance assertions remain strict; D8a unavailable is a recorded dependency failure.
  XCTAssertTrue(saved,@"D8a settings endpoint has not accepted SGD"); XCTAssertNil(error,@"D8a summary endpoint unavailable"); if (!error) XCTAssertEqualObjects(summaryText,@"暂无汇总 · 每天 21:00 SGT 生成");
#else
  XCTSkip(@"Live acceptance is compiled only in DEBUG");
#endif
}

- (void)testSummaryLatestPayloadSGDAndFirstDay {
  NSDictionary *sent = @{@"summary":@{@"status":@"sent",@"summary_date":@"2026-11-16",@"day_pnl_usd":@"10",@"payload":@{@"day_pnl_sgd":@"13.25"},@"fx_stale":@NO}};
  XCTAssertEqualObjects([BZAlertSupport summaryText:sent currency:@"SGD"],@"2026-11-16 · 当日盈亏 S$13.25");
  NSDictionary *first = @{@"summary":@{@"status":@"sent",@"summary_date":@"2026-11-16",@"day_pnl_usd":NSNull.null,@"payload":@{@"day_pnl_sgd":NSNull.null},@"fx_stale":@NO}};
  XCTAssertEqualObjects([BZAlertSupport summaryText:first currency:@"SGD"],@"2026-11-16 · 首日，无对比");
}
- (void)testBindingReadFailurePreservesRawErrorInCard {
  BZAlertsViewController *vc = [BZAlertsViewController new]; [vc loadViewIfNeeded]; [vc setValue:@"HTTP 503 · 原始绑定错误" forKey:@"bindingError"];
  NSString *text = [self cellText:[vc tableView:vc.tableView cellForRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:0]]]; XCTAssertTrue([text containsString:@"HTTP 503 · 原始绑定错误"]); XCTAssertFalse([text containsString:@"机器人尚未配置"]);
}
- (void)testMalformedToggleSuccessKeepsFrozenMutation {
  [self mock:^(NSURLProtocol *p) { BZD8Respond(p,200,@{}); }]; BZAlertsViewController *vc = [BZAlertsViewController new]; [self show:vc];
  NSMutableDictionary *r = [self.rule mutableCopy]; r[@"state"] = @"active"; r[@"disabled_reason"] = NSNull.null; [vc setValue:@[r] forKey:@"rules"]; UIButton *button = [UIButton new]; [vc toggle:button];
  [self wait:^BOOL { return ![[vc valueForKey:@"writing"] boolValue]; }]; XCTAssertNotNil([vc valueForKey:@"pendingMutation"]); XCTAssertFalse(vc.navigationItem.rightBarButtonItem.enabled);
}
- (void)testCrossTabSettingsWritesSerializeAndFinalServerValueWins {
  NSMutableArray<NSURLProtocol *> *writes = [NSMutableArray new]; __block BOOL firstReplied = NO;
  XCTestExpectation *early = [self expectationWithDescription:@"second settings write must wait"]; early.inverted = YES;
  [self mock:^(NSURLProtocol *p) { if ([p.request.HTTPMethod isEqual:@"PATCH"]) dispatch_async(dispatch_get_main_queue(),^{ [writes addObject:p]; if (writes.count > 1 && !firstReplied) [early fulfill]; }); else BZD8Respond(p,200,@{}); }];
  NSDictionary *user = @{@"id":@"1",@"username":@"fixture",@"display_currency":@"USD",@"daily_summary_enabled":@YES}; [BZSessionManager cacheUser:user];
  BZSettingsViewController *settings = [BZSettingsViewController new]; [settings loadViewIfNeeded]; [settings setValue:user forKey:@"user"]; UISwitch *daily = [settings valueForKey:@"summarySwitch"]; daily.on = NO; [daily sendActionsForControlEvents:UIControlEventValueChanged];
  [self wait:^BOOL { return writes.count == 1; }];
  BZOverviewViewController *overview = [BZOverviewViewController new]; [overview loadViewIfNeeded]; UISegmentedControl *currency = [overview valueForKey:@"currencySwitch"]; currency.selectedSegmentIndex = 1; [currency sendActionsForControlEvents:UIControlEventValueChanged];
  [self waitForExpectations:@[early] timeout:0.25]; XCTAssertEqual(writes.count,1); firstReplied = YES;
  BZD8Respond(writes[0],200,@{@"user":@{@"id":@"1",@"username":@"fixture",@"display_currency":@"USD",@"daily_summary_enabled":@NO}});
  [self wait:^BOOL { return writes.count == 2; }]; BZD8Respond(writes[1],200,@{@"user":@{@"id":@"1",@"username":@"fixture",@"display_currency":@"SGD",@"daily_summary_enabled":@NO}});
  [self wait:^BOOL { return ![[overview valueForKey:@"currencySaving"] boolValue]; }]; XCTAssertEqualObjects([settings valueForKey:@"user"][@"display_currency"],@"SGD"); XCTAssertEqual(currency.selectedSegmentIndex,1);
}

- (void)testDelayedAnonymous401CannotClearNewSession {
  [BZSessionManager clearSession]; __block NSURLProtocol *pending;
  [self mock:^(NSURLProtocol *p) { dispatch_async(dispatch_get_main_queue(),^{ pending = p; }); }];
  XCTestExpectation *done = [self expectationWithDescription:@"old anonymous response cancelled"];
  [BZAPIClient.shared request:@"GET" path:@"/me" body:nil completion:^(NSDictionary *json, NSError *error) { XCTAssertEqualObjects(error.domain,NSURLErrorDomain); XCTAssertEqual(error.code,NSURLErrorCancelled); [done fulfill]; }];
  [self wait:^BOOL { return pending != nil; }]; [BZKeychain saveToken:@"fixture-new-session"]; BZD8Respond(pending,401,@{@"error":@{@"code":@"UNAUTHORIZED",@"message":@"请重新登录"}});
  [self waitForExpectations:@[done] timeout:5]; XCTAssertEqualObjects([BZKeychain token],@"fixture-new-session");
}
@end
