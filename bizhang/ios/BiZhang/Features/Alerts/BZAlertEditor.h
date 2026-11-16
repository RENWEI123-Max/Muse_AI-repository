#import <UIKit/UIKit.h>
NS_ASSUME_NONNULL_BEGIN
@interface BZAlertEditor : UIViewController
- (instancetype)initWithRule:(nullable NSDictionary *)rule completion:(void (^)(NSString *_Nullable message))completion;
@end
NS_ASSUME_NONNULL_END
