#import "BZStatusBanner.h"
#import "BZTheme.h"
@implementation BZStatusBanner
- (instancetype)init { if ((self = [super init])) { self.numberOfLines = 0; self.font = [UIFont preferredFontForTextStyle:UIFontTextStyleFootnote]; self.adjustsFontForContentSizeCategory = YES; self.layer.cornerRadius = 12; self.clipsToBounds = YES; self.accessibilityIdentifier = @"market-status"; } return self; }
- (void)showState:(NSString *)state detail:(NSString *)detail {
  self.text = [NSString stringWithFormat:@"  %@\n  %@  ",state,detail];
  BOOL normal = [state isEqual:@"行情正常"];
  self.textColor = normal ? BZTheme.teal : BZTheme.amber;
  self.backgroundColor = [self.textColor colorWithAlphaComponent:0.09];
}
@end
