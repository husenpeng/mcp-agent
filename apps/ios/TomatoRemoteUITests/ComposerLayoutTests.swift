//
//  ComposerLayoutTests.swift
//  TomatoRemoteUITests
//
//  The dock stays a dock: a long draft grows only to four lines before it
//  scrolls inside the field, and sending retracts the keyboard and the field so
//  the conversation gets its screen back.
//

import XCTest

final class ComposerLayoutTests: XCTestCase {
    private func launch() throws -> XCUIApplication {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_PREVIEW_PAIRING", host,
            "-TOMATO_OPEN_URL", "tomato://session/s2",
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

    /// A long draft stops at the four-line cap, and sending collapses the dock
    /// back to one line with the keyboard put away.
    func testLongDraftIsCappedAndSendRetractsTheDock() throws {
        let app = try launch()
        let field = app.descendants(matching: .any)["composer.input"]
        XCTAssertTrue(field.waitForExistence(timeout: 20), "the composer did not open")

        field.tap()
        let keyboard = app.keyboards.firstMatch
        let keyboardWasUp = keyboard.waitForExistence(timeout: 5)
        let singleLine = field.frame.height

        field.typeText(String(repeating: "这是一段用来测量输入框高度的长文本。", count: 6))
        Thread.sleep(forTimeInterval: 0.6)
        let grown = field.frame.height
        XCTAssertLessThanOrEqual(
            grown,
            singleLine * 4 + 12,
            "the field grew past its four-line cap: \(grown) vs \(singleLine) single"
        )
        attach(app, "长草稿")

        app.buttons["composer.send"].tap()
        Thread.sleep(forTimeInterval: 0.3)
        XCTAssertLessThanOrEqual(
            field.frame.height,
            singleLine + 4,
            "the field kept its draft height after sending"
        )
        if keyboardWasUp {
            XCTAssertTrue(keyboard.waitForNonExistence(timeout: 5), "the keyboard stayed up after sending")
        }
        attach(app, "发送后")
    }
}
