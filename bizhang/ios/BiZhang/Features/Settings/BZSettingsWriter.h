#import "BZAPIClient.h"
NS_ASSUME_NONNULL_BEGIN
// Serialize settings PATCHes across tabs so full user snapshots cannot race.
@interface BZSettingsWriter : NSObject
+ (void)save:(NSDictionary *)body completion:(BZAPICompletion)completion;
@end
NS_ASSUME_NONNULL_END
