#import "BZCacheStore.h"
#import "BZSessionManager.h"
@implementation BZCacheStore { NSURL *_directory; }
- (instancetype)initWithUserID:(NSString *)userID {
  if (!userID.length || [userID rangeOfCharacterFromSet:NSCharacterSet.decimalDigitCharacterSet.invertedSet].location != NSNotFound) return nil;
  if ((self = [super init])) _directory = [[BZSessionManager cacheRoot] URLByAppendingPathComponent:userID isDirectory:YES];
  return self;
}
+ (NSString *)cachedUserID {
  NSArray<NSURL *> *dirs = [NSFileManager.defaultManager contentsOfDirectoryAtURL:BZSessionManager.cacheRoot includingPropertiesForKeys:nil options:0 error:nil];
  // D2 has one authenticated user cache; reject ambiguity rather than crossing users.
  if (dirs.count != 1) return nil;
  NSString *uid = dirs.firstObject.lastPathComponent;
  BZCacheStore *store = [[self alloc] initWithUserID:uid];
  NSData *data = store ? [NSData dataWithContentsOfURL:[dirs.firstObject URLByAppendingPathComponent:@"me.json"]] : nil;
  NSDictionary *json = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
  return [json isKindOfClass:NSDictionary.class] && [json[@"user"] isKindOfClass:NSDictionary.class] && [json[@"user"][@"id"] isEqual:uid] ? uid : nil;
}
- (NSDictionary *)marketEnvelope {
  NSData *data = [NSData dataWithContentsOfURL:[_directory URLByAppendingPathComponent:@"market-quotes.json"]];
  id json = data ? [NSJSONSerialization JSONObjectWithData:data options:0 error:nil] : nil;
  return [json isKindOfClass:NSDictionary.class] ? json : nil;
}
- (BOOL)saveMarketJSON:(NSDictionary *)json {
  NSError *error = nil;
  if (![NSFileManager.defaultManager createDirectoryAtURL:_directory withIntermediateDirectories:YES attributes:@{NSFileProtectionKey:NSFileProtectionComplete} error:&error]) return NO;
  NSDictionary *envelope = @{@"json":json,@"server_time":json[@"server_time"],@"fetched_at":[NSISO8601DateFormatter.new stringFromDate:NSDate.date]};
  NSData *data = [NSJSONSerialization dataWithJSONObject:envelope options:0 error:&error];
  return data && [data writeToURL:[_directory URLByAppendingPathComponent:@"market-quotes.json"] options:NSDataWritingAtomic | NSDataWritingFileProtectionComplete error:&error];
}
@end
