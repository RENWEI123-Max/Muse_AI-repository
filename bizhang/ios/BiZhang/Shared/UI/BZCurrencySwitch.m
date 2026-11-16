#import "BZCurrencySwitch.h"
@implementation BZCurrencySwitch
- (instancetype)init { if ((self = [super initWithItems:@[@"USD",@"SGD"]])) { self.selectedSegmentIndex = 0; self.accessibilityLabel = @"计价币种"; } return self; }
- (NSString *)currency { return self.selectedSegmentIndex == 1 ? @"SGD" : @"USD"; }
@end
