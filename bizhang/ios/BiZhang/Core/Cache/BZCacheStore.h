#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
@interface BZCacheStore : NSObject
- (nullable instancetype)initWithUserID:(NSString *)userID;
- (nullable NSDictionary *)marketEnvelope;
- (BOOL)saveMarketJSON:(NSDictionary *)json;
+ (nullable NSString *)cachedUserID;
@end
NS_ASSUME_NONNULL_END
