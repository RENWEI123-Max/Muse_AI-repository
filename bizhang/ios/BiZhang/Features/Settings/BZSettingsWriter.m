#import "BZSettingsWriter.h"
#import "BZCacheStore.h"
@interface BZSettingsWriter ()
@property(nonatomic) NSMutableArray<void (^)(void)> *queue;
@property(nonatomic) BOOL sending;
@end
@implementation BZSettingsWriter
+ (instancetype)shared {
  static BZSettingsWriter *writer; static dispatch_once_t once;
  dispatch_once(&once, ^{ writer = [self new]; writer.queue = [NSMutableArray new]; }); return writer;
}
+ (void)save:(NSDictionary *)body completion:(BZAPICompletion)completion {
  NSAssert(NSThread.isMainThread, @"Settings writes are owned by the UI thread");
  BZSettingsWriter *writer = self.shared; NSString *uid = BZCacheStore.cachedUserID; NSDictionary *frozen = [body copy];
  __weak BZSettingsWriter *weakWriter = writer;
  [writer.queue addObject:[^{
    BZSettingsWriter *writer = weakWriter;
    if (!uid || ![uid isEqual:BZCacheStore.cachedUserID]) {
      completion(nil, [NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorCancelled userInfo:nil]); [writer finish]; return;
    }
    [BZAPIClient.shared request:@"PATCH" path:@"/me/settings" body:frozen completion:^(NSDictionary *json, NSError *error) {
      completion(json,error); [writer finish];
    }];
  } copy]]; [writer next];
}
- (void)next { if (self.sending || !self.queue.count) return; self.sending = YES; void (^work)(void) = self.queue.firstObject; work(); }
- (void)finish { [self.queue removeObjectAtIndex:0]; self.sending = NO; [self next]; }
@end
