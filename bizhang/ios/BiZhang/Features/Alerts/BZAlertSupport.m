#import "BZAlertSupport.h"
#import "BZLedgerSupport.h"
#import "BZFormatter.h"
NSNotificationName const BZAlertsDidChange = @"BZAlertsDidChange";
NSNotificationName const BZSettingsDidChange = @"BZSettingsDidChange";
@implementation BZAlertSupport
+ (NSArray<NSString *> *)assets { return @[@"BTC",@"ETH",@"SOL",@"USDT",@"USDC",@"BNB",@"XRP",@"DOGE",@"ADA",@"LINK"]; }
+ (BOOL)boolean:(id)v { return v && CFGetTypeID((__bridge CFTypeRef)v) == CFBooleanGetTypeID(); }
+ (BOOL)identifier:(id)v { return [v isKindOfClass:NSString.class] && [v rangeOfString:@"^[1-9][0-9]*$" options:NSRegularExpressionSearch].location != NSNotFound; }
+ (BOOL)asset:(id)v { return [@[@"BTC",@"ETH",@"SOL",@"USDT",@"USDC",@"BNB",@"XRP",@"DOGE",@"ADA",@"LINK"] containsObject:v ?: NSNull.null]; }
+ (BOOL)direction:(id)v { return [@[@"above",@"below"] containsObject:v ?: NSNull.null]; }
+ (BOOL)validThreshold:(NSString *)text { return [BZLedgerSupport validInput:text positive:NO scale:18]; }
+ (BOOL)validSavedRule:(id)r {
  return [r isKindOfClass:NSDictionary.class] && [self identifier:r[@"id"]] && [self identifier:r[@"version"]] && [self asset:r[@"asset"]] && [self direction:r[@"direction"]] && [self validThreshold:r[@"threshold_usd"]] && [@[@"active",@"disabled"] containsObject:r[@"state"] ?: NSNull.null] && ([r[@"state"] isEqual:@"active"] ? r[@"disabled_reason"] == NSNull.null : [@[@"triggered",@"manual"] containsObject:r[@"disabled_reason"] ?: NSNull.null]) && (r[@"last_triggered_at"] == NSNull.null || [BZLedgerSupport date:r[@"last_triggered_at"]]);
}
+ (BOOL)validAlerts:(NSDictionary *)json {
  if (![json isKindOfClass:NSDictionary.class] || ![json[@"alerts"] isKindOfClass:NSArray.class] || ![BZLedgerSupport date:json[@"server_time"]]) return NO;
  NSMutableSet *ids = [NSMutableSet new];
  for (id r in json[@"alerts"]) {
    if (![r isKindOfClass:NSDictionary.class] || ![self identifier:r[@"id"]] || [ids containsObject:r[@"id"]] || ![self identifier:r[@"version"]] || ![self asset:r[@"asset"]] || ![self direction:r[@"direction"]] || ![self validThreshold:r[@"threshold_usd"]] || ![@[@"active",@"disabled"] containsObject:r[@"state"] ?: NSNull.null] || ![@[@"ok",@"stale",@"unverified",@"paused_divergence"] containsObject:r[@"price_status"] ?: NSNull.null] || ![self boolean:r[@"alerts_paused"]]) return NO;
    if (r[@"current_price_usd"] != NSNull.null && ![self validThreshold:r[@"current_price_usd"]]) return NO;
    if ([r[@"state"] isEqual:@"active"] ? r[@"disabled_reason"] != NSNull.null : ![@[@"triggered",@"manual"] containsObject:r[@"disabled_reason"] ?: NSNull.null]) return NO;
    if (r[@"last_triggered_at"] != NSNull.null && ![BZLedgerSupport date:r[@"last_triggered_at"]]) return NO;
    [ids addObject:r[@"id"]];
  } return YES;
}
+ (BOOL)validEvents:(NSDictionary *)json {
  if (![json isKindOfClass:NSDictionary.class] || ![json[@"events"] isKindOfClass:NSArray.class] || ![BZLedgerSupport date:json[@"server_time"]]) return NO;
  NSMutableSet *ids = [NSMutableSet new];
  for (id e in json[@"events"]) {
    if (![e isKindOfClass:NSDictionary.class] || ![self identifier:e[@"id"]] || [ids containsObject:e[@"id"]] || ![self identifier:e[@"rule_id"]] || ![self asset:e[@"asset"]] || ![self direction:e[@"direction"]] || ![self validThreshold:e[@"threshold_usd"]] || ![self validThreshold:e[@"price_usd"]] || ![BZLedgerSupport date:e[@"triggered_at"]] || ![@[@"on_create",@"on_restart",@"reached"] containsObject:e[@"trigger_kind"] ?: NSNull.null] || ![@[@"pending",@"sending",@"sent",@"failed"] containsObject:e[@"delivery_status"] ?: NSNull.null] || !(e[@"last_error"] == NSNull.null || [e[@"last_error"] isKindOfClass:NSString.class])) return NO;
    [ids addObject:e[@"id"]];
  } return YES;
}
+ (BOOL)validBinding:(NSDictionary *)json {
  if (![json isKindOfClass:NSDictionary.class] || ![self boolean:json[@"bound"]] || ![@[@"bound",@"pending",@"revoked"] containsObject:json[@"status"] ?: NSNull.null]) return NO;
  if ([json[@"bound"] boolValue]) return [json[@"status"] isEqual:@"bound"] && [json[@"chat_id_last4"] isKindOfClass:NSString.class] && [json[@"chat_id_last4"] rangeOfString:@"^[0-9]{4}$" options:NSRegularExpressionSearch].location != NSNotFound;
  return ![json[@"status"] isEqual:@"bound"] && json[@"chat_id_last4"] == NSNull.null;
}
+ (BOOL)validUser:(NSDictionary *)json {
  if (![json isKindOfClass:NSDictionary.class] || ![json[@"user"] isKindOfClass:NSDictionary.class]) return NO;
  NSDictionary *u = json[@"user"];
  return [self identifier:u[@"id"]] && [u[@"username"] isKindOfClass:NSString.class] && [@[@"USD",@"SGD"] containsObject:u[@"display_currency"] ?: NSNull.null] && [self boolean:u[@"daily_summary_enabled"]];
}
+ (NSString *)stateText:(NSDictionary *)r {
  if ([r[@"state"] isEqual:@"disabled"]) return [r[@"disabled_reason"] isEqual:@"triggered"] ? @"已触发停用" : @"已停用";
  return [r[@"alerts_paused"] boolValue] ? @"价格暂停" : @"生效中";
}
+ (NSString *)ruleText:(NSDictionary *)r { return [NSString stringWithFormat:@"%@ %@ · USD\n当前价 %@ · %@",[r[@"direction"] isEqual:@"above"] ? @"突破" : @"跌破",[BZFormatter price:r[@"threshold_usd"] currency:@"USD"],[BZFormatter price:r[@"current_price_usd"] currency:@"USD"],[self stateText:r]]; }
+ (NSString *)eventText:(NSDictionary *)e {
  NSString *delivery = @{@"pending":@"待投递",@"sending":@"投递中",@"sent":@"已投递",@"failed":@"投递失败"}[e[@"delivery_status"]] ?: @"投递状态未知";
  return [NSString stringWithFormat:@"%@\n%@ %@ · 触发价 %@（USD）\n%@%@",[BZLedgerSupport timestamp:e[@"triggered_at"]],[e[@"direction"] isEqual:@"above"] ? @"突破" : @"跌破",[BZFormatter price:e[@"threshold_usd"] currency:@"USD"],[BZFormatter price:e[@"price_usd"] currency:@"USD"],delivery,[e[@"last_error"] isKindOfClass:NSString.class] ? [@" · " stringByAppendingString:e[@"last_error"]] : @""];
}
+ (NSString *)bindingText:(NSDictionary *)binding {
  if (![self validBinding:binding]) return @"绑定状态暂不可用";
  return [binding[@"bound"] boolValue] ? [NSString stringWithFormat:@"已绑定（···%@）",binding[@"chat_id_last4"]] : @"未绑定";
}
+ (BOOL)restartNeedsConfirmation:(NSDictionary *)r {
  // Advisory only. The server decides whether/when to trigger after PATCH.
  NSDecimalNumber *p = [BZFormatter decimal:r[@"current_price_usd"]], *t = [BZFormatter decimal:r[@"threshold_usd"]]; if (!p || !t) return NO;
  NSComparisonResult c = [p compare:t]; return [r[@"direction"] isEqual:@"above"] ? c != NSOrderedAscending : c != NSOrderedDescending;
}
+ (NSString *)todayText:(NSDictionary *)alerts events:(NSDictionary *)events {
  if (![self validAlerts:alerts] || ![self validEvents:events]) return @"提醒服务暂不可用";
  NSCalendar *cal = [NSCalendar calendarWithIdentifier:NSCalendarIdentifierGregorian]; cal.timeZone = [NSTimeZone timeZoneWithName:@"Asia/Singapore"];
  NSDate *now = [BZLedgerSupport date:events[@"server_time"]]; NSUInteger count = 0, active = 0;
  for (NSDictionary *e in events[@"events"]) if ([cal isDate:[BZLedgerSupport date:e[@"triggered_at"]] inSameDayAsDate:now]) count++;
  for (NSDictionary *r in alerts[@"alerts"]) if ([r[@"state"] isEqual:@"active"] && ![r[@"alerts_paused"] boolValue]) active++;
  BOOL capped = [events[@"events"] count] == 100 && [cal isDate:[BZLedgerSupport date:[events[@"events"] lastObject][@"triggered_at"]] inSameDayAsDate:now];
  return [NSString stringWithFormat:@"今日触发 %@%lu 条 · 生效中 %lu 条%@",capped ? @"至少 " : @"",(unsigned long)count,(unsigned long)active,capped ? @"\n历史仅返回最近 100 条" : @""];
}
+ (NSString *)summaryText:(NSDictionary *)json currency:(NSString *)currency {
  if (![json isKindOfClass:NSDictionary.class]) return @"汇总服务暂不可用";
  id s = json[@"summary"];
  if (s == NSNull.null) return @"暂无汇总 · 每天 21:00 SGT 生成";
  if (![s isKindOfClass:NSDictionary.class]) return @"汇总服务暂不可用";
  if ([s[@"status"] isEqual:@"skipped_stale"]) return @"今日汇总暂缓：行情数据异常";
  if ([s[@"status"] isEqual:@"deferred"]) return @"今日汇总等待行情恢复";
  if (![s[@"status"] isEqual:@"sent"] || ![s[@"summary_date"] isKindOfClass:NSString.class] || [s[@"summary_date"] rangeOfString:@"^[0-9]{4}-[0-9]{2}-[0-9]{2}$" options:NSRegularExpressionSearch].location == NSNotFound) return @"汇总服务暂不可用";
  if (s[@"day_pnl_usd"] == NSNull.null) return [NSString stringWithFormat:@"%@ · 首日，无对比",s[@"summary_date"]];
  id payload = s[@"payload"]; id sgd = s[@"day_pnl_sgd"] ?: ([payload isKindOfClass:NSDictionary.class] ? payload[@"day_pnl_sgd"] : nil);
  id pair = @{@"usd":s[@"day_pnl_usd"] ?: NSNull.null,@"sgd":sgd ?: NSNull.null}; if (![pair isKindOfClass:NSDictionary.class] || ![BZFormatter decimal:pair[@"usd"]] || !(pair[@"sgd"] == NSNull.null || [BZFormatter decimal:pair[@"sgd"]])) return @"汇总服务暂不可用";
  return [NSString stringWithFormat:@"%@ · 当日盈亏 %@%@",s[@"summary_date"],[BZLedgerSupport money:pair[[currency isEqual:@"SGD"] ? @"sgd" : @"usd"] currency:currency],[s[@"fx_stale"] isEqual:@YES] ? @" · 汇率过期" : @""];
}
@end
