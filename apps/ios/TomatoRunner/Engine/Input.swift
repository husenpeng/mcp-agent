//
//  Input.swift
//  Tomato Runner
//
//  Synthesized input.
//
//  Every gesture is one `XCSynthesizedEventRecord`, so no call waits for the
//  application to go idle: a tap costs one round trip to testmanagerd instead
//  of a quiescence wait on both sides. Text goes through the text-input event
//  path rather than the on-screen keyboard, which also removes the ASCII limit
//  the keyboard imposes.
//

import UIKit
import XCTest

/// Gesture synthesis and text entry.
enum Input {
    /// Tap once at a point.
    /// @param point - screen coordinate in points.
    static func tap(at point: CGPoint) throws {
        let record = XCSynthesizedEventRecord(name: "Tomato Tap")
        let path = XCPointerEventPath(forTouchAt: point, offset: 0)
        path.pressDown(atOffset: 0)
        path.liftUp(atOffset: 0.05)
        record.add(path)
        try record.synthesize()
    }

    /// Double tap within the system's recognition window.
    /// @param point - screen coordinate in points.
    static func doubleTap(at point: CGPoint) throws {
        let record = XCSynthesizedEventRecord(name: "Tomato Double Tap")
        let path = XCPointerEventPath(forTouchAt: point, offset: 0)
        path.pressDown(atOffset: 0)
        path.liftUp(atOffset: 0.05)
        path.pressDown(atOffset: 0.12)
        path.liftUp(atOffset: 0.17)
        record.add(path)
        try record.synthesize()
    }

    /// Press and hold at a point.
    /// @param point - screen coordinate in points.
    /// @param durationMs - hold length in milliseconds.
    static func longPress(at point: CGPoint, durationMs: Int) throws {
        let seconds = Double(max(200, min(5000, durationMs))) / 1000
        let record = XCSynthesizedEventRecord(name: "Tomato Long Press")
        let path = XCPointerEventPath(forTouchAt: point, offset: 0)
        path.pressDown(atOffset: 0)
        path.liftUp(atOffset: seconds)
        record.add(path)
        try record.synthesize()
    }

    /// Drag between two points in one gesture.
    ///
    /// A resting hold at the end leaves stationary samples, so iOS reads zero
    /// lift-off velocity and the content stops where the drag stopped instead
    /// of coasting.
    /// @param from - start point.
    /// @param to - end point.
    /// @param durationMs - gesture length in milliseconds.
    static func swipe(from: CGPoint, to: CGPoint, durationMs: Int) throws {
        let duration = Double(max(100, min(3000, durationMs))) / 1000
        let hold = 0.15
        let record = XCSynthesizedEventRecord(name: "Tomato Swipe")
        let path = XCPointerEventPath(forTouchAt: from, offset: 0)
        path.pressDown(atOffset: 0)
        path.move(to: to, atOffset: duration)
        var offset = duration + 0.04
        var jitter = 0.3
        while offset < duration + hold - 0.01 {
            path.move(to: CGPoint(x: to.x, y: to.y + jitter), atOffset: offset)
            jitter = -jitter
            offset += 0.04
        }
        path.liftUp(atOffset: duration + hold)
        record.add(path)
        try record.synthesize()
    }

    /// Enter text into the focused field.
    ///
    /// The text-input event path carries any Unicode string; it does not depend
    /// on a keyboard layout being installed.
    /// @param text - text to enter.
    /// @param submit - whether to send a Return after the text.
    static func type(text: String, submit: Bool) throws {
        guard !text.isEmpty else {
            if submit {
                try pressReturn()
            }
            return
        }
        let record = XCSynthesizedEventRecord(name: "Tomato Type")
        let path = XCPointerEventPath(forTextInput: ())
        path.typeText(text, atOffset: 0, typingSpeed: 60, shouldRedact: false)
        record.add(path)
        try record.synthesize()
        if submit {
            try pressReturn()
        }
    }

    /// Send Return to the focused field.
    static func pressReturn() throws {
        let record = XCSynthesizedEventRecord(name: "Tomato Return")
        let path = XCPointerEventPath(forTextInput: ())
        path.typeText("\n", atOffset: 0, typingSpeed: 0, shouldRedact: false)
        record.add(path)
        try record.synthesize()
    }
}

extension CGRect {
    /// Center point, the coordinate every synthesized gesture uses.
    var center: CGPoint {
        CGPoint(x: midX, y: midY)
    }
}
