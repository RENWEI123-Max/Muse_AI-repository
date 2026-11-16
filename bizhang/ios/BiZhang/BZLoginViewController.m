#import "BZLoginViewController.h"
#import "BZAPIClient.h"
#import "BZKeychain.h"
#import "BZSessionManager.h"
#import "BZTheme.h"
@interface BZLoginViewController ()
@property(nonatomic, strong) UITextField *username;
@property(nonatomic, strong) UITextField *password;
@property(nonatomic, strong) UIButton *loginButton;
@property(nonatomic, strong) UILabel *message;
@end
@implementation BZLoginViewController
- (void)viewDidLoad {
  [super viewDidLoad];
  self.title = @"币账";
  self.view.backgroundColor = BZTheme.background;
  UILabel *brand = [UILabel new];
  brand.text = @"币账";
  brand.font = [UIFont boldSystemFontOfSize:34];
  brand.textColor = BZTheme.teal;
  UILabel *intro = [UILabel new];
  intro.text = @"记录持仓，心中有账";
  intro.textColor = BZTheme.muted;
  self.username = [UITextField new];
  self.username.placeholder = @"用户名";
  self.username.textContentType = UITextContentTypeUsername;
  self.username.autocapitalizationType = UITextAutocapitalizationTypeNone;
  self.username.autocorrectionType = UITextAutocorrectionTypeNo;
  self.username.accessibilityIdentifier = @"login.username";
  self.password = [UITextField new];
  self.password.placeholder = @"密码";
  self.password.secureTextEntry = YES;
  self.password.textContentType = UITextContentTypePassword;
  self.password.accessibilityIdentifier = @"login.password";
  for (UITextField *field in @[ self.username, self.password ]) {
    field.borderStyle = UITextBorderStyleRoundedRect;
    [field.heightAnchor constraintEqualToConstant:48].active = YES;
  }
  self.loginButton = [UIButton buttonWithType:UIButtonTypeSystem];
  [self.loginButton setTitle:@"登录" forState:UIControlStateNormal];
  self.loginButton.backgroundColor = BZTheme.teal;
  [self.loginButton setTitleColor:BZTheme.surface
                         forState:UIControlStateNormal];
  self.loginButton.layer.cornerRadius = 10;
  self.loginButton.accessibilityIdentifier = @"login.submit";
  [self.loginButton.heightAnchor constraintEqualToConstant:48].active = YES;
  [self.loginButton addTarget:self
                       action:@selector(login)
             forControlEvents:UIControlEventTouchUpInside];
  self.message = [UILabel new];
  self.message.numberOfLines = 0;
  self.message.textColor = BZTheme.down;
  self.message.accessibilityIdentifier = @"login.message";
  UILabel *notice = [UILabel new];
  notice.text = @"仅供记录，不构成投资建议";
  notice.textColor = BZTheme.muted;
  notice.font = [UIFont systemFontOfSize:12];
  UIStackView *stack = [[UIStackView alloc] initWithArrangedSubviews:@[
    brand, intro, self.username, self.password, self.loginButton, self.message,
    notice
  ]];
  stack.axis = UILayoutConstraintAxisVertical;
  stack.spacing = 18;
  stack.translatesAutoresizingMaskIntoConstraints = NO;
  [self.view addSubview:stack];
  [NSLayoutConstraint activateConstraints:@[
    [stack.leadingAnchor
        constraintEqualToAnchor:self.view.safeAreaLayoutGuide.leadingAnchor
                       constant:28],
    [stack.trailingAnchor
        constraintEqualToAnchor:self.view.safeAreaLayoutGuide.trailingAnchor
                       constant:-28],
    [stack.centerYAnchor constraintEqualToAnchor:self.view.centerYAnchor
                                        constant:-35]
  ]];
}
- (void)login {
  if (!self.username.text.length || !self.password.text.length) {
    self.message.text = @"请输入用户名和密码";
    return;
  }
  [self.view endEditing:YES];
  self.loginButton.enabled = NO;
  self.message.text = @"正在登录…";
  [[BZAPIClient shared]
         request:@"POST"
            path:@"/auth/login"
            body:@{
              @"username" : self.username.text,
              @"password" : self.password.text
            }
      completion:^(NSDictionary *json, NSError *error) {
        self.loginButton.enabled = YES;
        if (error) {
          self.message.text = error.localizedDescription;
          return;
        }
        NSString *token = json[@"token"];
        NSDictionary *user = json[@"user"];
        if (![token isKindOfClass:NSString.class] || token.length != 64 ||
            ![user isKindOfClass:NSDictionary.class]) {
          self.message.text = @"登录响应格式错误";
          return;
        }
        if (![BZKeychain saveToken:token]) {
          self.message.text = @"无法安全保存会话，请重试";
          return;
        }
        self.password.text = @"";
        [BZSessionManager cacheUser:user];
        [[NSNotificationCenter defaultCenter]
            postNotificationName:BZSessionDidChange
                          object:nil];
      }];
}
@end
