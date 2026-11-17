#import <UIKit/UIKit.h>
NS_ASSUME_NONNULL_BEGIN
@interface BZTheme : NSObject
+ (UIFont *)cappedFontForTextStyle:(UIFontTextStyle)style maxPointSize:(CGFloat)maximum;
+ (UIColor *)background;
+ (UIColor *)surface;
+ (UIColor *)ink;
+ (UIColor *)muted;
+ (UIColor *)teal;
+ (UIColor *)line;
+ (UIColor *)up;
+ (UIColor *)down;
+ (UIColor *)amber;
@end
NS_ASSUME_NONNULL_END
