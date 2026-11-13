#ifndef TomatoRunner_XCTestPrivate_h
#define TomatoRunner_XCTestPrivate_h

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <XCTest/XCTest.h>

/// Event synthesis is not in XCTest's public headers but is present in the
/// framework the runner links against. Only the two shapes this runner sends
/// are declared: a touch path and a text-input path.
///
/// These are the declarations WebDriverAgent and iCTRL rely on. Changing them
/// is a device-verified change: the private surface moves between Xcode
/// releases.
NS_ASSUME_NONNULL_BEGIN

@class XCPointerEventPath;

@interface XCSynthesizedEventRecord : NSObject
- (instancetype)initWithName:(NSString *)name;
- (void)addPointerEventPath:(XCPointerEventPath *)eventPath;
- (BOOL)synthesizeWithError:(NSError * _Nullable * _Nullable)error;
@end

@interface XCPointerEventPath : NSObject
- (instancetype)initForTouchAtPoint:(CGPoint)point offset:(NSTimeInterval)offset;
- (instancetype)initForTextInput;
- (void)pressDownAtOffset:(NSTimeInterval)offset;
- (void)liftUpAtOffset:(NSTimeInterval)offset;
- (void)moveToPoint:(CGPoint)point atOffset:(NSTimeInterval)offset;
- (void)typeText:(NSString *)text
        atOffset:(NSTimeInterval)offset
     typingSpeed:(NSUInteger)typingSpeed
    shouldRedact:(BOOL)shouldRedact;
@end

NS_ASSUME_NONNULL_END

#endif