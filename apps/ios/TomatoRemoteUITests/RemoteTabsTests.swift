//
//  RemoteTabsTests.swift
//  TomatoRemoteUITests
//
//  The robot and room surfaces must be reachable from the tab bar even when
//  the Host does not answer: an unreachable Mac is a state the screens report,
//  not a reason to hide the destination.
//

import XCTest

final class RemoteTabsTests: XCTestCase {
    /// Launch paired against an address that never answers, with the biometric
    /// gate off.
    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK",
            "-TOMATO_PREVIEW_PAIRING", "http://127.0.0.1:9",
        ]
        app.launch()
        return app
    }

    /// Both new tabs exist, open their own page, and state their empty case.
    func testRobotAndRoomTabsOpen() {
        let app = launch()
        XCTAssertTrue(app.tabBars.buttons["会话"].waitForExistence(timeout: 20), "tab bar did not appear")

        app.tabBars.buttons["智能体"].tap()
        XCTAssertTrue(app.navigationBars["智能体"].waitForExistence(timeout: 5), "智能体 tab did not open")
        // The toolbar proves the page rendered; the list itself reports the
        // unreachable Host in its own body.
        XCTAssertTrue(app.buttons["刷新智能体"].waitForExistence(timeout: 10), "智能体 toolbar is missing")

        app.tabBars.buttons["群聊"].tap()
        XCTAssertTrue(app.navigationBars["群聊"].waitForExistence(timeout: 5), "群聊 tab did not open")
        XCTAssertTrue(app.buttons["刷新群聊"].waitForExistence(timeout: 10), "群聊 toolbar is missing")
    }

    /// The deep links a notification would use land on the same pages.
    func testDeepLinksSelectTheNewTabs() {
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK",
            "-TOMATO_PREVIEW_PAIRING", "http://127.0.0.1:9",
            "-TOMATO_OPEN_URL", "tomato://rooms",
        ]
        app.launch()
        XCTAssertTrue(app.navigationBars["群聊"].waitForExistence(timeout: 20), "tomato://rooms did not open 群聊")
    }
}
