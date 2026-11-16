#import "BZAPIClient.h"
#import "BZKeychain.h"
#import "BZSessionManager.h"
@implementation BZAPIClient
+ (instancetype)shared {
  static BZAPIClient *c;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    c = [self new];
  });
  return c;
}
- (instancetype)init {
  if ((self = [super init])) {
    NSURLSessionConfiguration *c =
        [NSURLSessionConfiguration defaultSessionConfiguration];
    c.timeoutIntervalForRequest = 15;
    c.timeoutIntervalForResource = 30;
    c.URLCache = nil;
    c.HTTPCookieStorage = nil;
    c.HTTPShouldSetCookies = NO;
    c.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
    _session = [NSURLSession sessionWithConfiguration:c];
  }
  return self;
}
- (void)request:(NSString *)method
           path:(NSString *)path
           body:(NSDictionary *)body
     completion:(BZAPICompletion)completion {
  [self request:method path:path body:body attempt:0 completion:completion];
}
- (void)request:(NSString *)method
           path:(NSString *)path
           body:(NSDictionary *)body
        attempt:(NSUInteger)attempt
     completion:(BZAPICompletion)completion {
  NSString *base =
      [[NSBundle mainBundle] objectForInfoDictionaryKey:@"BZ_API_BASE_URL"];
  NSURL *url = [NSURL URLWithString:[base stringByAppendingString:path]];
  if (!url.host) {
    completion(nil,
               [NSError errorWithDomain:@"BZAPI"
                                   code:0
                               userInfo:@{
                                 NSLocalizedDescriptionKey : @"API 地址尚未配置"
                               }]);
    return;
  }
  NSMutableURLRequest *r = [NSMutableURLRequest requestWithURL:url];
  r.HTTPMethod = method;
  if (body)
    [r setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
  NSString *token = [BZKeychain token];
  if (token)
    [r setValue:[@"Bearer " stringByAppendingString:token]
        forHTTPHeaderField:@"Authorization"];
  if ([method isEqualToString:@"POST"])
    [r setValue:NSUUID.UUID.UUIDString forHTTPHeaderField:@"Idempotency-Key"];
  if (body)
    r.HTTPBody = [NSJSONSerialization dataWithJSONObject:body
                                                 options:0
                                                   error:nil];
  [[_session
      dataTaskWithRequest:r
        completionHandler:^(NSData *data, NSURLResponse *response,
                            NSError *error) {
          NSInteger status = [(NSHTTPURLResponse *)response statusCode];
          if ([method isEqualToString:@"GET"] && attempt < 2 &&
              (error || status >= 500)) {
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW,
                                         (attempt == 0 ? 1 : 3) * NSEC_PER_SEC),
                           dispatch_get_main_queue(), ^{
                             [self request:method
                                       path:path
                                       body:body
                                    attempt:attempt + 1
                                 completion:completion];
                           });
            return;
          }
          NSDictionary *json =
              data ? [NSJSONSerialization JSONObjectWithData:data
                                                     options:0
                                                       error:nil]
                   : nil;
          if (![json isKindOfClass:NSDictionary.class])
            json = nil;
          dispatch_async(dispatch_get_main_queue(), ^{
            if (token && ![token isEqualToString:[BZKeychain token]]) {
              completion(nil, [NSError errorWithDomain:NSURLErrorDomain
                                                  code:NSURLErrorCancelled
                                              userInfo:nil]);
              return;
            }
            if (status == 401)
              [BZSessionManager clearSession];
            NSError *result = error;
            if (!result && (status < 200 || status >= 300 || !json)) {
              NSString *message =
                  [json[@"error"] isKindOfClass:NSDictionary.class]
                      ? json[@"error"][@"message"]
                      : nil;
              result = [NSError errorWithDomain:@"BZAPI"
                                           code:status
                                       userInfo:@{
                                         NSLocalizedDescriptionKey : [message
                                             isKindOfClass:NSString.class]
                                             ? message
                                             : @"网络请求失败，请稍后重试"
                                       }];
            }
            completion(result ? nil : json, result);
          });
        }] resume];
}
- (void)logout:(void (^)(void))completion {
  [self request:@"POST"
            path:@"/auth/logout"
            body:nil
      completion:^(NSDictionary *json, NSError *error) {
        [BZSessionManager clearSession];
        completion();
      }];
}
@end
