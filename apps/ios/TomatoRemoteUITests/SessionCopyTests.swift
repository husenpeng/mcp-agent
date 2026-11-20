//
//  SessionCopyTests.swift
//  TomatoRemoteUITests
//
//  The conversation list exposes its latest message through a copy action.
//

import XCTest

final class SessionCopyTests: XCTestCase {
    func testSessionListCopiesItsPreview() throws {
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

        let row = app.buttons["session.row.s1"]
        XCTAssertTrue(row.waitForExistence(timeout: 20), "the session list is empty")
        row.press(forDuration: 1.0)
        let copy = app.buttons["复制消息"]
        XCTAssertTrue(copy.waitForExistence(timeout: 5), "the copy action is missing")
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "session-list-copy"
        shot.lifetime = .keepAlways
        add(shot)
        copy.tap()
    }
}
