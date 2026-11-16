#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
extern NSNotificationName const BZSessionDidChange;
@interface BZSessionManager : NSObject
+ (BOOL)clearSession;
+ (NSURL *)cacheRoot;
+ (BOOL)cacheUser:(NSDictionary *)user;
@end
NS_ASSUME_NONNULL_END
