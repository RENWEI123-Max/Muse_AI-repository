#import "BZTheme.h"
@implementation BZTheme
+ (UIColor *)light:(unsigned)light dark:(unsigned)dark {
  return [UIColor colorWithDynamicProvider:^UIColor *(UITraitCollection *t) {
    unsigned h =
        t.userInterfaceStyle == UIUserInterfaceStyleDark ? dark : light;
    return [UIColor colorWithRed:((h >> 16) & 255) / 255.0
                           green:((h >> 8) & 255) / 255.0
                            blue:(h & 255) / 255.0
                           alpha:1];
  }];
}
+ (UIColor *)background {
  return [self light:0xf4f6f5 dark:0x0d1311];
}
+ (UIColor *)surface {
  return [self light:0xffffff dark:0x161e1b];
}
+ (UIColor *)ink {
  return [self light:0x14201c dark:0xe8efec];
}
+ (UIColor *)muted {
  return [self light:0x5c6b66 dark:0x9db0a8];
}
+ (UIColor *)teal {
  return [self light:0x0b6e5d dark:0x3ec9ae];
}
+ (UIColor *)line {
  return [self light:0xdde5e1 dark:0x2a3732];
}
+ (UIColor *)up {
  return [self light:0x0b7a43 dark:0x4ade80];
}
+ (UIColor *)down {
  return [self light:0xc0392b dark:0xf87171];
}
+ (UIColor *)amber {
  return [self light:0xb45309 dark:0xf0b35e];
}
@end
