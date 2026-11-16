#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
@interface BZLedgerSupport : NSObject
+ (BOOL)validInput:(NSString *)text positive:(BOOL)positive scale:(NSUInteger)scale;
+ (NSString *)quantity:(id)value;
+ (NSString *)money:(id)value currency:(NSString *)currency;
+ (NSString *)errorText:(NSError *)error;
+ (nullable NSDate *)date:(id)value;
+ (NSString *)timestamp:(id)value;
+ (BOOL)validTransactions:(NSDictionary *)json;
+ (BOOL)validPortfolio:(NSDictionary *)json;
+ (nullable NSDictionary *)cached:(NSString *)name;
+ (void)cache:(NSDictionary *)json name:(NSString *)name;
@end
NS_ASSUME_NONNULL_END
