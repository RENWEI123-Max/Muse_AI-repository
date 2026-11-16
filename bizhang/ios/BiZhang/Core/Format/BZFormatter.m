#import "BZFormatter.h"
@implementation BZFormatter
+ (NSDecimalNumber *)decimal:(id)value {
  if (![value isKindOfClass:NSString.class]) return nil;
  NSRegularExpression *pattern = [NSRegularExpression regularExpressionWithPattern:@"^-?[0-9]+(\\.[0-9]{1,18})?$" options:0 error:nil];
  if ([pattern numberOfMatchesInString:value options:0 range:NSMakeRange(0, [value length])] != 1) return nil;
  NSDecimalNumber *n = [NSDecimalNumber decimalNumberWithString:value locale:@{@"NSLocaleDecimalSeparator":@"."}];
  return [n isEqualToNumber:NSDecimalNumber.notANumber] ? nil : n;
}
+ (NSString *)price:(id)value currency:(NSString *)currency {
  NSDecimalNumber *n = [self decimal:value];
  if (!n) return @"—";
  NSNumberFormatter *f = [NSNumberFormatter new];
  f.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
  f.numberStyle = NSNumberFormatterDecimalStyle; f.usesGroupingSeparator = YES; f.groupingSize = 3; f.groupingSeparator = @",";
  f.roundingMode = NSNumberFormatterRoundHalfUp;
  NSUInteger scale = [n compare:NSDecimalNumber.one] == NSOrderedAscending ? 4 : 2;
  f.minimumFractionDigits = scale; f.maximumFractionDigits = scale;
  return [NSString stringWithFormat:@"%@%@", [currency isEqualToString:@"SGD"] ? @"S$" : @"$", [f stringFromNumber:n]];
}
+ (NSString *)percent:(id)value {
  NSDecimalNumber *n = [self decimal:value];
  if (!n) return @"—";
  NSNumberFormatter *f = [NSNumberFormatter new];
  f.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
  f.minimumFractionDigits = 1; f.maximumFractionDigits = 1;
  f.roundingMode = NSNumberFormatterRoundHalfUp;
  return [NSString stringWithFormat:@"%@%@%%", [n compare:NSDecimalNumber.zero] == NSOrderedAscending ? @"" : @"+", [f stringFromNumber:n]];
}
+ (NSString *)time:(NSDate *)date {
  if (!date) return @"时间未知";
  NSDateFormatter *f = [NSDateFormatter new];
  f.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
  f.timeZone = [NSTimeZone timeZoneWithName:@"Asia/Singapore"];
  f.dateFormat = @"HH:mm";
  return [[f stringFromDate:date] stringByAppendingString:@" SGT"];
}
@end
