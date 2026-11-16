#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
@interface BZMarketSnapshot : NSObject
@property(nonatomic, readonly) NSDictionary *JSON;
@property(nonatomic, readonly) NSArray<NSDictionary *> *quotes;
@property(nonatomic, readonly) NSDate *serverTime;
- (nullable instancetype)initWithJSON:(NSDictionary *)json error:(NSError *_Nullable *_Nullable)error;
- (NSTimeInterval)ageForQuote:(NSDictionary *)quote uptime:(NSTimeInterval)uptime;
- (NSString *)statusForQuote:(NSDictionary *)quote uptime:(NSTimeInterval)uptime;
+ (nullable NSDate *)date:(id)value;
@end
NS_ASSUME_NONNULL_END
