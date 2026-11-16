#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
@interface BZFormatter : NSObject
+ (nullable NSDecimalNumber *)decimal:(id)value;
+ (NSString *)price:(id)value currency:(NSString *)currency;
+ (NSString *)percent:(id)value;
+ (NSString *)time:(nullable NSDate *)date;
@end
NS_ASSUME_NONNULL_END
