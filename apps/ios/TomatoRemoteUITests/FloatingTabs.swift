//
//  FloatingTabs.swift
//  TomatoRemoteUITests
//
//  Shared way for a test to change destination.
//
//  The app no longer has a tab bar: every root shows a floating ball that opens
//  a palette. Tests must open that palette and pick an item, and they should all
//  do it the same way so a change to the control is changed in one place.
//

import XCTest

/// A destination the floating palette can open.
enum TomatoTab: String {
    case home
    case sessions
    case phoneAgent
    case robots
    case rooms
    case account
}

extension XCUIApplication {
    /// Wait for the destination control on the current root screen.
    /// - Parameter timeout: how long the root may take to paint.
    /// - Returns: whether the ball appeared.
    @discardableResult
    func waitForTabBall(timeout: TimeInterval = 20) -> Bool {
        buttons["app.tabBall"].waitForExistence(timeout: timeout)
    }

    /// Open the destination palette and pick one.
    /// - Parameters:
    ///   - tab: destination to open.
    ///   - file: test file reported on failure.
    ///   - line: test line reported on failure.
    func openTab(_ tab: TomatoTab, file: StaticString = #filePath, line: UInt = #line) {
        let ball = buttons["app.tabBall"]
        XCTAssertTrue(
            ball.waitForExistence(timeout: 20),
            "the floating destination control did not appear",
            file: file,
            line: line
        )
        ball.tap()
        let item = buttons["app.tab.\(tab.rawValue)"]
        XCTAssertTrue(
            item.waitForExistence(timeout: 5),
            "the destination palette did not offer \(tab.rawValue)",
            file: file,
            line: line
        )
        item.tap()
    }
}
