#import "BZAppDelegate.h"
#import "BZAPIClient.h"
#import "BZKeychain.h"
#import "BZLoginViewController.h"
#import "BZSessionManager.h"
#import "BZTheme.h"
#import "BZMarketViewController.h"
#import "BZOverviewViewController.h"
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
@interface BZPlaceholderViewController : UIViewController
@end
@implementation BZPlaceholderViewController
- (void)viewDidLoad {
  [super viewDidLoad];
  self.view.backgroundColor = BZTheme.background;
  UILabel *label = [UILabel new];
  label.text = @"功能正在建设中";
  label.textColor = BZTheme.muted;
  label.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:label];
  [NSLayoutConstraint activateConstraints:@[
    [label.centerXAnchor constraintEqualToAnchor:self.view.centerXAnchor],
    [label.centerYAnchor constraintEqualToAnchor:self.view.centerYAnchor]
  ]];
  if ([self.title isEqualToString:@"设置"])
    self.navigationItem.rightBarButtonItem =
        [[UIBarButtonItem alloc] initWithTitle:@"退出登录"
                                         style:UIBarButtonItemStylePlain
                                        target:self
                                        action:@selector(logout)];
}
- (void)logout {
  self.navigationItem.rightBarButtonItem.enabled = NO;
  [[BZAPIClient shared] logout:^{
  }];
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
    UIViewController *vc = i == 0 ? [BZOverviewViewController new] : i == 1 ? [BZMarketViewController new] : [BZPlaceholderViewController new];
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
