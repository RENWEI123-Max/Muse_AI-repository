#import "BZMarketSnapshot.h"
#import "BZFormatter.h"
@implementation BZMarketSnapshot {
  NSTimeInterval _receivedUptime;
}
+ (NSDate *)date:(id)value {
  if (![value isKindOfClass:NSString.class]) return nil;
  NSISO8601DateFormatter *f = [NSISO8601DateFormatter new];
  f.formatOptions = NSISO8601DateFormatWithInternetDateTime | NSISO8601DateFormatWithFractionalSeconds;
  NSDate *date = [f dateFromString:value];
  if (!date) { f.formatOptions = NSISO8601DateFormatWithInternetDateTime; date = [f dateFromString:value]; }
  return date;
}
- (instancetype)initWithJSON:(NSDictionary *)json error:(NSError **)error {
  self = [super init]; if (!self) return nil;
  NSArray *symbols = @[@"BTC",@"ETH",@"SOL",@"USDT",@"USDC",@"BNB",@"XRP",@"DOGE",@"ADA",@"LINK"];
  BOOL valid = [json isKindOfClass:NSDictionary.class] && [self.class date:json[@"server_time"]] && [json[@"quotes"] isKindOfClass:NSArray.class] && [json[@"quotes"] count] == 10 && [json[@"fx"] isKindOfClass:NSDictionary.class];
  if (valid) valid = json[@"fx"][@"stale"] && CFGetTypeID((__bridge CFTypeRef)json[@"fx"][@"stale"]) == CFBooleanGetTypeID();
  if (valid) for (NSUInteger i = 0; i < 10; i++) {
    NSDictionary *q = json[@"quotes"][i];
    if (![q isKindOfClass:NSDictionary.class]) { valid = NO; break; }
    NSString *source = q[@"raw_source"];
    valid = [q[@"symbol"] isEqual:symbols[i]] && [q[@"name"] isKindOfClass:NSString.class] && [q[@"display_order"] isKindOfClass:NSString.class] &&
      [@[@"ok",@"stale",@"paused_divergence",@"unverified"] containsObject:q[@"status"]] &&
      ([@[@"USDT",@"USDC"] containsObject:symbols[i]] ? [source isEqual:@"kraken"] : [source isEqual:@"binance"]);
    for (NSString *key in @[@"usd_price",@"price_sgd",@"change_24h_pct"]) {
      id value = q[key];
      if (!value || (value != NSNull.null && ![BZFormatter decimal:value])) valid = NO;
    }
    if (q[@"usd_price"] != NSNull.null && ![self.class date:q[@"raw_source_ts"]]) valid = NO;
    if ([source isEqual:@"binance"] && q[@"usd_price"] != NSNull.null && (![self.class date:q[@"ref_ts"]] || ![q[@"ref_source"] isEqual:@"kraken"])) valid = NO;
    if (!valid) break;
  }
  if (!valid) {
    if (error) *error = [NSError errorWithDomain:@"BZMarket" code:1 userInfo:@{NSLocalizedDescriptionKey:@"行情响应格式无效"}];
    return nil;
  }
  _JSON = [json copy]; _quotes = [json[@"quotes"] copy]; _serverTime = [self.class date:json[@"server_time"]];
  _receivedUptime = NSProcessInfo.processInfo.systemUptime;
  return self;
}
- (NSTimeInterval)ageForQuote:(NSDictionary *)quote uptime:(NSTimeInterval)uptime {
  NSDate *date = [self.class date:quote[@"raw_source_ts"]];
  if (!date || [date compare:_serverTime] == NSOrderedDescending) return INFINITY;
  return MAX(0, [_serverTime timeIntervalSinceDate:date]) + MAX(0, uptime - _receivedUptime);
}
- (NSString *)statusForQuote:(NSDictionary *)quote uptime:(NSTimeInterval)uptime {
  if ([self ageForQuote:quote uptime:uptime] > 120) return @"stale";
  return quote[@"status"];
}
@end
