#import "BZKeychain.h"
#import <Security/Security.h>
@implementation BZKeychain
+ (NSMutableDictionary *)query {
  return [@{
    (__bridge id)kSecClass : (__bridge id)kSecClassGenericPassword,
    (__bridge id)kSecAttrService : [[[NSBundle mainBundle] bundleIdentifier]
        stringByAppendingString:@".auth"],
    (__bridge id)kSecAttrAccount : @"access_token"
  } mutableCopy];
}
+ (NSString *)token {
  NSMutableDictionary *q = [self query];
  q[(__bridge id)kSecReturnData] = @YES;
  q[(__bridge id)kSecMatchLimit] = (__bridge id)kSecMatchLimitOne;
  CFTypeRef data = NULL;
  OSStatus s = SecItemCopyMatching((__bridge CFDictionaryRef)q, &data);
  if (s != errSecSuccess)
    return nil;
  return [[NSString alloc] initWithData:CFBridgingRelease(data)
                               encoding:NSUTF8StringEncoding];
}
+ (BOOL)saveToken:(NSString *)token {
  NSMutableDictionary *q = [self query];
  NSDictionary *a = @{
    (__bridge id)kSecValueData : [token dataUsingEncoding:NSUTF8StringEncoding],
    (__bridge id)kSecAttrAccessible :
        (__bridge id)kSecAttrAccessibleWhenUnlockedThisDeviceOnly
  };
  OSStatus s =
      SecItemUpdate((__bridge CFDictionaryRef)q, (__bridge CFDictionaryRef)a);
  if (s == errSecItemNotFound) {
    [q addEntriesFromDictionary:a];
    s = SecItemAdd((__bridge CFDictionaryRef)q, NULL);
  }
  return s == errSecSuccess;
}
+ (BOOL)clear {
  OSStatus s = SecItemDelete((__bridge CFDictionaryRef)[self query]);
  return s == errSecSuccess || s == errSecItemNotFound;
}
@end
