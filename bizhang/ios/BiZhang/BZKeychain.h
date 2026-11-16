#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
@interface BZKeychain : NSObject
+ (nullable NSString *)token;
+ (BOOL)saveToken:(NSString *)token;
+ (BOOL)clear;
@end
NS_ASSUME_NONNULL_END
