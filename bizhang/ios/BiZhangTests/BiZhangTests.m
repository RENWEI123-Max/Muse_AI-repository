#import "BZAPIClient.h"
#import "BZKeychain.h"
#import "BZLoginViewController.h"
#import "BZSessionManager.h"
#import <XCTest/XCTest.h>
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
      ([BZSessionManager cacheUser:@{@"id" : @"1", @"username" : @"Smith"}]));
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
  XCTAssertGreaterThan(password.length, 0);
  if (!password.length)
    return;
  XCTestExpectation *done =
      [self expectationWithDescription:@"tunnel auth lifecycle"];
  [BZAPIClient.shared
         request:@"POST"
            path:@"/auth/login"
            body:@{@"username" : @"Smith", @"password" : password}
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
              XCTAssertEqualObjects(me[@"user"][@"username"], @"Smith");
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
    username.text = @"Smith";
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
          XCTAssertEqualObjects(json[@"user"][@"username"], @"Smith");
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
@end
