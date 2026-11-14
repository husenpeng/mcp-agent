//
//  PhoneHistoryTests.swift
//  TomatoRemoteUITests
//
//  Tomato Phone's conversation history: the header opens it, a row switches the
//  transcript, and a new conversation starts blank.
//

import XCTest

final class PhoneHistoryTests: XCTestCase {
    /// Launch on Tomato Phone with a known pair of sample conversations.
    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK",
            "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_PREVIEW_PAIRING", "http://127.0.0.1:9",
            "-TOMATO_PHONE_TAB",
            "-TOMATO_CLEAR_PHONE_HISTORY",
            "-TOMATO_PHONE_SAMPLE_HISTORY",
        ]
        app.launch()
        return app
    }

    /// The seeded transcript proves the history arrived before the sheet opens.
    /// - Parameter app: the launched app.
    private func waitForSeededTranscript(_ app: XCUIApplication) {
        let text = app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "三条要点")).firstMatch
        XCTAssertTrue(text.waitForExistence(timeout: 20), "the sample history did not load")
    }

    /// A row in the history replaces the transcript and the header's name.
    func testHistorySwitchesToAnOlderConversation() {
        let app = launch()
        let history = app.buttons["phone.conversations"]
        XCTAssertTrue(history.waitForExistence(timeout: 20), "the Tomato Phone header has no history control")
        waitForSeededTranscript(app)

        history.tap()
        XCTAssertTrue(app.staticTexts["会话"].waitForExistence(timeout: 5), "the history sheet did not open")
        let coffee = app.buttons["phone.conversation.row.sample-coffee"]
        XCTAssertTrue(coffee.waitForExistence(timeout: 5), "the history lists no coffee conversation")
        XCTAssertTrue(
            app.buttons["phone.conversation.row.sample-release-notes"].exists,
            "the history lists no release-notes conversation"
        )

        coffee.tap()
        let answer = app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "你常喝美式")).firstMatch
        XCTAssertTrue(answer.waitForExistence(timeout: 5), "the switched conversation did not load")
        XCTAssertEqual(history.value as? String, "咖啡店记一杯", "the header did not name the switched conversation")
    }

    /// The sheet's primary action opens a blank conversation and leaves the
    /// history behind it.
    func testNewConversationStartsBlank() {
        let app = launch()
        let history = app.buttons["phone.conversations"]
        XCTAssertTrue(history.waitForExistence(timeout: 20))
        waitForSeededTranscript(app)

        history.tap()
        let newChat = app.buttons["新会话"]
        XCTAssertTrue(newChat.waitForExistence(timeout: 5), "the history sheet has no new-conversation action")
        newChat.tap()

        XCTAssertTrue(app.staticTexts["你好，我是 Tomato"].waitForExistence(timeout: 5), "the blank conversation did not open")
        XCTAssertEqual(history.value as? String, "新会话", "the header still names the old conversation")
        XCTAssertFalse(
            app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "三条要点")).firstMatch.exists,
            "the old transcript stayed on screen"
        )
    }

    /// A row's rename action edits the stored name in place.
    func testRenameFromASwipeUpdatesTheRow() {
        let app = launch()
        let history = app.buttons["phone.conversations"]
        XCTAssertTrue(history.waitForExistence(timeout: 20))
        waitForSeededTranscript(app)
        history.tap()

        let row = app.buttons["phone.conversation.row.sample-coffee"]
        XCTAssertTrue(row.waitForExistence(timeout: 5))
        row.swipeLeft()
        let rename = app.buttons["重命名"]
        XCTAssertTrue(rename.waitForExistence(timeout: 3), "the row offers no rename action")
        rename.tap()

        let field = app.textFields["phone.conversation.rename"]
        XCTAssertTrue(field.waitForExistence(timeout: 5), "the rename sheet did not open")
        field.tap(withNumberOfTaps: 3, numberOfTouches: 1)
        field.typeText("季度复盘")
        app.buttons["保存"].tap()

        let renamed = app.buttons["phone.conversation.row.sample-coffee"]
        XCTAssertTrue(renamed.waitForExistence(timeout: 5))
        XCTAssertTrue(renamed.label.contains("季度复盘"), "the row kept its old name")
    }
}
