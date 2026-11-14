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
        app.openTab(.sessions)
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

    /// Typing into the composer must not blank the conversation behind it.
    func testTypingKeepsTranscriptVisible() throws {
        let app = XCUIApplication()
        app.launchArguments = try ["-TOMATO_NO_LOCK", "-TOMATO_PREVIEW_PAIRING", host()]
        app.launch()
        app.openTab(.sessions)
        let row = app.staticTexts["修 CI 的 flaky 测试"].firstMatch
        guard row.waitForExistence(timeout: 20) else {
            throw XCTSkip("the Host lists no long transcript to type into")
        }
        row.tap()

        let answer = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "第 22 轮回答")).firstMatch
        XCTAssertTrue(answer.waitForExistence(timeout: 10), "long transcript did not load")

        let field = app.descendants(matching: .any)["composer.input"]
        XCTAssertTrue(field.waitForExistence(timeout: 10), "the composer did not open")
        field.tap()
        field.typeText("测试输入过程中是否白屏")

        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "typing"
        shot.lifetime = .keepAlways
        add(shot)
        XCTAssertTrue(answer.isHittable, "the transcript went blank while typing")
    }

    /// Typing after scrolling up must keep the rows the reader left on screen.
    func testTypingAfterScrollingKeepsTranscriptVisible() throws {
        let app = XCUIApplication()
        app.launchArguments = try ["-TOMATO_NO_LOCK", "-TOMATO_PREVIEW_PAIRING", host()]
        app.launch()
        app.openTab(.sessions)
        let row = app.staticTexts["修 CI 的 flaky 测试"].firstMatch
        guard row.waitForExistence(timeout: 20) else {
            throw XCTSkip("the Host lists no long transcript to type into")
        }
        row.tap()

        let answer = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "第 22 轮回答")).firstMatch
        XCTAssertTrue(answer.waitForExistence(timeout: 10))

        app.swipeDown()
        app.swipeDown()

        let field = app.descendants(matching: .any)["composer.input"]
        XCTAssertTrue(field.waitForExistence(timeout: 10))
        field.tap()
        field.typeText("往上翻之后再输入")

        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "typing-after-scroll"
        shot.lifetime = .keepAlways
        add(shot)
        let visible = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "轮回答")).allElementsBoundByIndex
            .filter(\.isHittable)
        XCTAssertFalse(visible.isEmpty, "the transcript went blank after typing while scrolled up")
    }
}
