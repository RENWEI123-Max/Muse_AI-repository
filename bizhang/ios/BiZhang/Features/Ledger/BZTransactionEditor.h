#import <UIKit/UIKit.h>
NS_ASSUME_NONNULL_BEGIN
@interface BZTransactionEditor : UIViewController
- (instancetype)initWithTransaction:(nullable NSDictionary *)transaction completion:(void (^)(void))completion;
@end
NS_ASSUME_NONNULL_END
