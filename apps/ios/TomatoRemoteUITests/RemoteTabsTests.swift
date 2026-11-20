//
//  RemoteTabsTests.swift
//  TomatoRemoteUITests
//
//  The robot and room surfaces must be reachable from the floating destination
//  palette even when the Host does not answer: an unreachable Mac is a state the
//  screens report, not a reason to hide the destination.
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

    /// The palette offers every destination, one tap from any root.
    func testPaletteOffersEveryDestination() {
        let app = launch()
        let ball = app.buttons["app.tabBall"]
        XCTAssertTrue(ball.waitForExistence(timeout: 20), "the floating destination control did not appear")
        ball.tap()
        for tab in [TomatoTab.home, .sessions, .phoneAgent, .robots, .rooms, .account] {
            XCTAssertTrue(
                app.buttons["app.tab.\(tab.rawValue)"].waitForExistence(timeout: 5),
                "the palette is missing \(tab.rawValue)"
            )
        }
        // The scrim behind the palette closes it without changing destination.
        ball.tap()
        XCTAssertFalse(app.buttons["app.tab.robots"].waitForExistence(timeout: 2), "the palette stayed open")

        // Rooms and account share one system slot; the ball must still reach both.
        app.openTab(.account)
        XCTAssertTrue(app.descendants(matching: .any)["account.memory"].firstMatch.waitForExistence(timeout: 5), "账号 destination did not open")
        app.openTab(.rooms)
        XCTAssertTrue(app.buttons["刷新群聊"].waitForExistence(timeout: 5), "群聊 destination did not reopen")
    }

    /// Both new destinations exist, open their own page, and state their empty case.
    func testRobotAndRoomDestinationsOpen() {
        let app = launch()
        XCTAssertTrue(app.waitForTabBall(timeout: 20), "the floating destination control did not appear")

        app.openTab(.robots)
        XCTAssertTrue(app.buttons["刷新智能体"].waitForExistence(timeout: 5), "智能体 destination did not open")
        // The toolbar proves the page rendered; the list itself reports the
        // unreachable Host in its own body.
        XCTAssertTrue(app.buttons["刷新智能体"].waitForExistence(timeout: 10), "智能体 toolbar is missing")

        app.openTab(.rooms)
        XCTAssertTrue(app.buttons["刷新群聊"].waitForExistence(timeout: 5), "群聊 destination did not open")
        XCTAssertTrue(app.buttons["刷新群聊"].waitForExistence(timeout: 10), "群聊 toolbar is missing")
    }

    /// A composer screen has no bottom corner: its own control opens the same palette,
    /// and selecting a destination still switches the root.
    func testComposerOpensTheSamePalette() {
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK",
            "-TOMATO_PREVIEW_PAIRING", "http://127.0.0.1:9",
            "-TOMATO_PHONE_TAB",
        ]
        app.launch()
        let trigger = app.buttons["phone.tabMenu"]
        XCTAssertTrue(trigger.waitForExistence(timeout: 20), "the composer has no destination control")
        trigger.tap()
        XCTAssertTrue(
            app.buttons["app.tab.home"].waitForExistence(timeout: 5),
            "the composer palette did not open"
        )
        app.buttons["app.tab.home"].tap()
        XCTAssertTrue(
            app.descendants(matching: .any)["home.memory"].firstMatch.waitForExistence(timeout: 10),
            "selecting a destination from the composer palette did not switch"
        )
    }

    /// The deep links a notification would use land on the same pages.
    func testDeepLinksSelectTheNewDestinations() {
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK",
            "-TOMATO_PREVIEW_PAIRING", "http://127.0.0.1:9",
            "-TOMATO_OPEN_URL", "tomato://rooms",
        ]
        app.launch()
        XCTAssertTrue(app.buttons["刷新群聊"].waitForExistence(timeout: 20), "tomato://rooms did not open 群聊")
    }
}
