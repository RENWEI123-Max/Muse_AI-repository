#import "BZAppDelegate.h"
#import "BZAPIClient.h"
#import "BZKeychain.h"
#import "BZLoginViewController.h"
#import "BZSessionManager.h"
#import "BZTheme.h"
#import "BZMarketViewController.h"
#import "BZOverviewViewController.h"
#import "BZLedgerViewController.h"
#import "BZAlertsViewController.h"
#import "BZSettingsViewController.h"
@implementation BZAppDelegate
- (BOOL)application:(UIApplication *)application
    didFinishLaunchingWithOptions:(NSDictionary *)options {
  return YES;
}
- (UISceneConfiguration *)application:(UIApplication *)application
    configurationForConnectingSceneSession:(UISceneSession *)session
                                   options:(UISceneConnectionOptions *)options {
  UISceneConfiguration *c =
      [[UISceneConfiguration alloc] initWithName:@"Default"
                                     sessionRole:session.role];
  c.delegateClass = BZSceneDelegate.class;
  return c;
}
@end
@implementation BZSceneDelegate
- (void)scene:(UIScene *)scene
    willConnectToSession:(UISceneSession *)session
                 options:(UISceneConnectionOptions *)options {
  self.window = [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];
  self.window.tintColor = BZTheme.teal;
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(showRoot)
                                               name:BZSessionDidChange
                                             object:nil];
  [self showRoot];
  [self.window makeKeyAndVisible];
}
- (void)showRoot {
  BOOL authenticated = [BZKeychain token] != nil;
  if (authenticated &&
      [self.window.rootViewController isKindOfClass:UITabBarController.class])
    return;
  if (!authenticated && [self.window.rootViewController
                            isKindOfClass:UINavigationController.class])
    return;
  if (!authenticated) {
    self.window.rootViewController = [[UINavigationController alloc]
        initWithRootViewController:[BZLoginViewController new]];
    return;
  }
  UITabBarController *tabs = [UITabBarController new];
  NSMutableArray *controllers = [NSMutableArray new];
  NSArray *titles = @[ @"总览", @"行情", @"记账", @"提醒", @"设置" ];
  NSArray *icons = @[
    @"square.grid.2x2", @"chart.line.uptrend.xyaxis", @"book", @"bell",
    @"gearshape"
  ];
  for (NSUInteger i = 0; i < titles.count; i++) {
    UIViewController *vc = i == 0 ? [BZOverviewViewController new] : i == 1 ? [BZMarketViewController new] : i == 2 ? [BZLedgerViewController new] : i == 3 ? [BZAlertsViewController new] : [BZSettingsViewController new];
    vc.title = titles[i];
    UINavigationController *nav =
        [[UINavigationController alloc] initWithRootViewController:vc];
    nav.tabBarItem =
        [[UITabBarItem alloc] initWithTitle:titles[i]
                                      image:[UIImage systemImageNamed:icons[i]]
                                        tag:i];
    [controllers addObject:nav];
  }
  tabs.viewControllers = controllers;
  self.window.rootViewController = tabs;
  [[BZAPIClient shared]
         request:@"GET"
            path:@"/me"
            body:nil
      completion:^(NSDictionary *json, NSError *error) {
        if (json && [json[@"user"] isKindOfClass:NSDictionary.class])
          [BZSessionManager cacheUser:json[@"user"]];
      }];
}
- (void)dealloc {
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}
@end
