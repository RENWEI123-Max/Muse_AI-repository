#import <Foundation/Foundation.h>
NS_ASSUME_NONNULL_BEGIN
extern NSNotificationName const BZAlertsDidChange;
extern NSNotificationName const BZSettingsDidChange;
@interface BZAlertSupport : NSObject
+ (NSArray<NSString *> *)assets;
+ (NSString *)stateText:(NSDictionary *)rule;
+ (NSString *)ruleText:(NSDictionary *)rule;
+ (BOOL)validSavedRule:(id)rule;
+ (BOOL)validAlerts:(id)json;
+ (BOOL)validEvents:(id)json;
+ (BOOL)validBinding:(id)json;
+ (BOOL)validUser:(id)json;
+ (BOOL)validThreshold:(id)text;
+ (NSString *)eventText:(NSDictionary *)event;
+ (NSString *)bindingText:(nullable NSDictionary *)binding;
+ (BOOL)restartNeedsConfirmation:(NSDictionary *)rule;
+ (NSString *)todayText:(nullable NSDictionary *)alerts events:(nullable NSDictionary *)events;
+ (NSString *)summaryText:(nullable NSDictionary *)json currency:(NSString *)currency;
@end
NS_ASSUME_NONNULL_END
