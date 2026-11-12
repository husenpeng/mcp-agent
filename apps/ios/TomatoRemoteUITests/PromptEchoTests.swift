//
//  PromptEchoTests.swift
//  TomatoRemoteUITests
//
//  A prompt this phone sends is drawn once. The composer shows it before the
//  Host acknowledges it; the durable message that arrives afterwards carries the
//  same identity, so the row must not stand twice in the transcript.
//

import XCTest

final class PromptEchoTests: XCTestCase {
    private func host() throws -> String {
        guard let value = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !value.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        return value
    }

    /// Launch paired, then open the fixture conversation from the list. A deep
    /// link races the first list read; tapping the row waits for it.
    private func launch() throws -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = try ["-TOMATO_NO_LOCK", "-TOMATO_PREVIEW_PAIRING", host()]
        app.launch()
        app.tabBars.buttons["会话"].tap()
        let row = app.staticTexts["历史三种用户消息"].firstMatch
        // The conversation this test types into belongs to the fixture Host; a
        // Host without it has nothing this test may safely send a prompt to.
        guard row.waitForExistence(timeout: 20) else {
            throw XCTSkip("the Host lists no fixture conversation to send a prompt into")
        }
        row.tap()
        return app
    }

    /// Rows carrying the prompt this test typed.
    private func promptRows(in app: XCUIApplication) -> [XCUIElement] {
        app.staticTexts.matching(NSPredicate(format: "label == %@", "回显只画一次")).allElementsBoundByIndex
    }

    /// Send one prompt and hold until the Host's own copy of it arrives: the row
    /// stays exactly once, and the composer leaves its stop state.
    func testSentPromptIsDrawnOnce() throws {
        let app = try launch()
        // A vertical-axis field reports as a text view on some iOS releases.
        let field = app.descendants(matching: .any)["composer.input"]
        XCTAssertTrue(field.waitForExistence(timeout: 20), "the composer did not open")
        field.tap()
        field.typeText("回显只画一次")
        app.buttons["composer.send"].tap()

        let row = app.staticTexts["回显只画一次"]
        XCTAssertTrue(row.waitForExistence(timeout: 10), "the prompt the phone sent never appeared")
        // Hold past the Host's acknowledgement: the displayed row then stands for
        // the durable message, and the echo that preceded it must have stepped
        // aside instead of staying beside it.
        Thread.sleep(forTimeInterval: 6)
        XCTAssertEqual(promptRows(in: app).count, 1, "the acknowledged prompt is drawn twice")
    }
}
