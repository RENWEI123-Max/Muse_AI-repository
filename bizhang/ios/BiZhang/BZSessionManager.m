#import "BZSessionManager.h"
#import "BZKeychain.h"
NSNotificationName const BZSessionDidChange = @"BZSessionDidChange";
@implementation BZSessionManager
+ (NSURL *)cacheRoot {
  return [[[NSFileManager defaultManager] URLsForDirectory:NSCachesDirectory
                                                 inDomains:NSUserDomainMask]
              .firstObject URLByAppendingPathComponent:@"BZ"
                                           isDirectory:YES];
}
+ (BOOL)cacheUser:(NSDictionary *)user {
  if (![user[@"id"] isKindOfClass:NSString.class])
    return NO;
  NSString *uid = user[@"id"];
  if ([uid rangeOfCharacterFromSet:NSCharacterSet.decimalDigitCharacterSet
                                       .invertedSet]
              .location != NSNotFound ||
      uid.length == 0)
    return NO;
  NSURL *dir = [[self cacheRoot] URLByAppendingPathComponent:uid
                                                 isDirectory:YES];
  NSError *e = nil;
  [[NSFileManager defaultManager]
             createDirectoryAtURL:dir
      withIntermediateDirectories:YES
                       attributes:@{
                         NSFileProtectionKey : NSFileProtectionComplete
                       }
                            error:&e];
  NSData *data = [NSJSONSerialization dataWithJSONObject:@{
    @"user" : user,
    @"fetched_at" : @([[NSDate date] timeIntervalSince1970])
  }
                                                 options:0
                                                   error:&e];
  return data && [data writeToURL:[dir URLByAppendingPathComponent:@"me.json"]
                          options:NSDataWritingAtomic |
                                  NSDataWritingFileProtectionComplete
                            error:&e];
}
+ (BOOL)clearSession {
  BOOL keychain = [BZKeychain clear];
  NSError *e = nil;
  NSURL *root = [self cacheRoot];
  BOOL cache = ![[NSFileManager defaultManager] fileExistsAtPath:root.path] ||
               [[NSFileManager defaultManager] removeItemAtURL:root error:&e];
  [[NSURLCache sharedURLCache] removeAllCachedResponses];
  [[NSNotificationCenter defaultCenter] postNotificationName:BZSessionDidChange
                                                      object:nil];
  return keychain && cache;
}
@end
