#import "BZLedgerSupport.h"
#import "BZFormatter.h"
#import "BZCacheStore.h"
#import "BZSessionManager.h"
@implementation BZLedgerSupport
+ (BOOL)validInput:(NSString *)text positive:(BOOL)positive scale:(NSUInteger)scale {
  if (![text isKindOfClass:NSString.class]) return NO;
  NSString *pattern = [NSString stringWithFormat:@"^(0|[1-9][0-9]{0,19})(\\.[0-9]{1,%lu})?$", (unsigned long)scale];
  if ([text rangeOfString:pattern options:NSRegularExpressionSearch].location == NSNotFound) return NO;
  NSDecimalNumber *n = [BZFormatter decimal:text];
  return n && (!positive || [n compare:NSDecimalNumber.zero] == NSOrderedDescending);
}
+ (NSString *)number:(id)value minimum:(NSUInteger)minimum maximum:(NSUInteger)maximum {
  NSDecimalNumber *n = [BZFormatter decimal:value]; if (!n) return @"—";
  NSNumberFormatter *f = [NSNumberFormatter new]; f.locale = [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
  f.numberStyle = NSNumberFormatterDecimalStyle; f.usesGroupingSeparator = YES;
  f.minimumFractionDigits = minimum; f.maximumFractionDigits = maximum; f.roundingMode = NSNumberFormatterRoundHalfUp;
  return [f stringFromNumber:n];
}
+ (NSString *)quantity:(id)value { return [self number:value minimum:0 maximum:8]; }
+ (NSString *)money:(id)value currency:(NSString *)currency {
  if (![BZFormatter decimal:value]) return @"—";
  return [NSString stringWithFormat:@"%@%@", [currency isEqual:@"SGD"] ? @"S$" : @"$", [self number:value minimum:2 maximum:2]];
}
+ (NSString *)errorText:(NSError *)error {
  NSDictionary *raw = error.userInfo[@"api_error"];
  NSMutableString *text = [NSMutableString stringWithFormat:@"HTTP %ld · %@\n%@", (long)error.code, raw[@"code"] ?: @"NETWORK_ERROR", error.localizedDescription];
  if ([raw[@"detail"] isKindOfClass:NSDictionary.class] && [raw[@"detail"] count]) {
    NSData *data = [NSJSONSerialization dataWithJSONObject:raw[@"detail"] options:NSJSONWritingSortedKeys error:nil];
    [text appendFormat:@"\n%@", [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding]];
  }
  if (error.code == 412) [text appendString:@"\n已被修改，请刷新。请关闭表单，获取最新版本后重试。"];
  return text;
}
+ (NSDate *)date:(id)value {
  if (![value isKindOfClass:NSString.class]) return nil;
  NSISO8601DateFormatter *f = [NSISO8601DateFormatter new]; f.formatOptions = NSISO8601DateFormatWithInternetDateTime | NSISO8601DateFormatWithFractionalSeconds;
  NSDate *d = [f dateFromString:value]; if (!d) { f.formatOptions = NSISO8601DateFormatWithInternetDateTime; d = [f dateFromString:value]; } return d;
}
+ (NSString *)timestamp:(id)value {
  NSDate *d = [self date:value]; if (!d) return @"时间未知";
  NSDateFormatter *f = [NSDateFormatter new]; f.locale = [NSLocale localeWithLocaleIdentifier:@"zh_CN"]; f.timeZone = [NSTimeZone timeZoneWithName:@"Asia/Singapore"]; f.dateFormat = @"yyyy-MM-dd HH:mm 'SGT'"; return [f stringFromDate:d];
}
+ (BOOL)identifier:(id)value { return [value isKindOfClass:NSString.class] && [value rangeOfString:@"^[1-9][0-9]*$" options:NSRegularExpressionSearch].location != NSNotFound; }
+ (BOOL)validTransactions:(NSDictionary *)json {
  if (![json[@"transactions"] isKindOfClass:NSArray.class] || ![self date:json[@"server_time"]]) return NO;
  NSMutableSet *ids = [NSMutableSet new];
  for (id row in json[@"transactions"]) {
    if (![row isKindOfClass:NSDictionary.class] || ![self identifier:row[@"id"]] || [ids containsObject:row[@"id"]] || ![self identifier:row[@"version"]] || ![@[@"buy",@"sell",@"opening"] containsObject:row[@"side"]] || ![@[@"BTC",@"ETH",@"SOL",@"USDT",@"USDC",@"BNB",@"XRP",@"DOGE",@"ADA",@"LINK"] containsObject:row[@"asset"]] || ![self date:row[@"traded_at"]] || ![row[@"note"] isKindOfClass:NSString.class]) return NO;
    [ids addObject:row[@"id"]];
    for (NSString *key in @[@"quantity",@"fee_amount",@"avg_cost_before_usd",@"realized_usd",@"qty_after"]) if (![BZFormatter decimal:row[key]]) return NO;
    if (![BZFormatter decimal:row[[row[@"side"] isEqual:@"opening"] ? @"opening_cost_usd" : @"price_usd"]]) return NO;
  } return YES;
}
+ (BOOL)pair:(id)value nullable:(BOOL)nullable {
  if (value == NSNull.null) return nullable;
  return [value isKindOfClass:NSDictionary.class] && [BZFormatter decimal:value[@"usd"]] && (value[@"sgd"] == NSNull.null || [BZFormatter decimal:value[@"sgd"]]);
}
+ (BOOL)validPortfolio:(NSDictionary *)json {
  if (![json[@"positions"] isKindOfClass:NSArray.class] || CFGetTypeID((__bridge CFTypeRef)(json[@"data_complete"] ?: NSNull.null)) != CFBooleanGetTypeID() || ![self date:json[@"server_time"]] || ![json[@"fx"] isKindOfClass:NSDictionary.class] || CFGetTypeID((__bridge CFTypeRef)(json[@"fx"][@"stale"] ?: NSNull.null)) != CFBooleanGetTypeID()) return NO;
  for (NSString *key in @[@"total_value",@"total_unrealized",@"total_realized"]) if (![self pair:json[key] nullable:YES]) return NO;
  for (id p in json[@"positions"]) {
    if (![p isKindOfClass:NSDictionary.class] || ![p[@"asset"] isKindOfClass:NSString.class] || ![p[@"price_status"] isKindOfClass:NSString.class]) return NO;
    for (NSString *key in @[@"quantity",@"remaining_cost_usd",@"avg_cost_usd",@"realized_usd"]) if (![BZFormatter decimal:p[key]]) return NO;
    if (![self pair:p[@"market_value"] nullable:YES] || ![self pair:p[@"unrealized"] nullable:YES]) return NO;
  } return YES;
}
+ (NSURL *)cacheURL:(NSString *)name {
  NSString *uid = BZCacheStore.cachedUserID; if (!uid || ![@[@"ledger",@"portfolio"] containsObject:name]) return nil;
  return [[BZSessionManager.cacheRoot URLByAppendingPathComponent:uid] URLByAppendingPathComponent:[name stringByAppendingString:@".json"]];
}
+ (NSDictionary *)cached:(NSString *)name {
  NSURL *url = [self cacheURL:name]; NSData *data = url ? [NSData dataWithContentsOfURL:url] : nil;
  id json = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
  return [json isKindOfClass:NSDictionary.class] ? json : nil;
}
+ (void)cache:(NSDictionary *)json name:(NSString *)name {
  NSURL *url = [self cacheURL:name]; if (!url) return;
  NSData *data = [NSJSONSerialization dataWithJSONObject:json options:0 error:nil];
  [data writeToURL:url options:NSDataWritingAtomic | NSDataWritingFileProtectionComplete error:nil];
}
@end
