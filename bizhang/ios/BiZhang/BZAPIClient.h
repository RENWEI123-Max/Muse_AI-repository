#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
typedef void (^BZAPICompletion)(NSDictionary *_Nullable json,
                                NSError *_Nullable error);
@interface BZAPIClient : NSObject
@property(nonatomic, readonly) NSURLSession *session;
+ (instancetype)shared;
- (void)request:(NSString *)method
           path:(NSString *)path
           body:(nullable NSDictionary *)body
     completion:(BZAPICompletion)completion;
- (void)logout:(void (^)(void))completion;
@end
NS_ASSUME_NONNULL_END
