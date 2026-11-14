//
//  RunningSessionsTests.swift
//  TomatoRemoteUITests
//
//  The Session list's in-progress shortcut opens a page of its own, and a row
//  there pushes the conversation. The run needs a Host with a Session executing
//  a turn right now, which no fixture can promise from the outside; it skips
//  when the Host reports none.
//

import XCTest

final class RunningSessionsTests: XCTestCase {
    private func launch() throws -> XCUIApplication {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_PREVIEW_PAIRING", host,
            "-TOMATO_OPEN_URL", "tomato://sessions",
        ]
        app.launch()
        return app
    }

    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }

    /// The shortcut opens the running page, and the page's row opens its
    /// conversation on the list's stack.
    func testShortcutOpensTheRunningPage() throws {
        let app = try launch()
        let entry = app.buttons["session.running.entry"]
        guard entry.waitForExistence(timeout: 20) else {
            throw XCTSkip("the test Host has no running Session")
        }
        attach(app, "会话页的进行中入口")
        entry.tap()

        XCTAssertTrue(
            app.navigationBars["进行中"].waitForExistence(timeout: 10),
            "tapping the shortcut did not open the in-progress page"
        )
        XCTAssertTrue(
            app.staticTexts["正在运行"].waitForExistence(timeout: 5),
            "the in-progress page did not name its running section"
        )

        let row = app.buttons.matching(
            NSPredicate(format: "identifier BEGINSWITH %@", "session.running.row.")
        ).firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 5), "the in-progress page listed no running row")
        XCTAssertTrue(row.label.hasPrefix("进行中"), "the running row did not report its state: \(row.label)")
        attach(app, "进行中页面")

        row.tap()
        XCTAssertTrue(
            app.navigationBars["进行中"].waitForNonExistence(timeout: 10),
            "tapping a running row did not push its conversation"
        )
    }
}
