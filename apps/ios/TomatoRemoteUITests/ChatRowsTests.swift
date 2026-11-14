//
//  ChatRowsTests.swift
//  TomatoRemoteUITests
//
//  The transcript shows only what the person typed and what the Agent answered.
//  A Host log also carries user-role notices the harness wrote; those must not
//  appear as the reader's own messages.
//

import XCTest

final class ChatRowsTests: XCTestCase {
    private func host() throws -> String {
        guard let value = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !value.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        return value
    }

    /// Launch straight into the fixture conversation: the list groups rows under
    /// collapsible folders, so these tests address the Session itself.
    private func launch() throws -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = try [
            "-TOMATO_NO_LOCK", "-TOMATO_PREVIEW_PAIRING", host(),
            "-TOMATO_OPEN_URL", "tomato://session/s2",
        ]
        app.launch()
        return app
    }

    /// Launch into the short conversation that holds only the rich answer.
    private func launchRich() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_PREVIEW_PAIRING", (try? host()) ?? "http://127.0.0.1:43201",
            "-TOMATO_OPEN_URL", "tomato://session/s3",
        ]
        app.launch()
        return app
    }

    /// The answer body, matched by a fragment it always contains.
    private func answer(in app: XCUIApplication) -> XCUIElement {
        app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "simultaneousGesture")).firstMatch
    }

    /// Injected user-role notices render as context disclosures inside the turn's
    /// folded work, never as the reader's own message: desktop draws the same
    /// rows the same way. The fold opens before it can be read.
    func testSyntheticUserMessagesRenderAsContext() throws {
        let app = try launch()
        XCTAssertTrue(answer(in: app).waitForExistence(timeout: 20), "the conversation did not open")

        let any = app.descendants(matching: .any)
        let process = any["chat.row.process"].firstMatch
        XCTAssertTrue(process.waitForExistence(timeout: 10), "the turn's work is not folded")
        XCTAssertFalse(
            any["chat.row.context"].firstMatch.exists,
            "the injected notice stood outside the folded turn"
        )
        process.tap()
        XCTAssertTrue(
            any["chat.row.context"].firstMatch.waitForExistence(timeout: 10),
            "injected context has no disclosure row"
        )
        XCTAssertFalse(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "Time sampled")).firstMatch.exists,
            "a turn notice was expanded as the reader's own message"
        )
    }

    /// One turn's tool calls fold under one process control.
    func testConsecutiveToolsFoldIntoProcess() throws {
        let app = try launch()
        XCTAssertTrue(answer(in: app).waitForExistence(timeout: 20))
        let any = app.descendants(matching: .any)
        XCTAssertTrue(
            any["chat.row.process"].firstMatch.waitForExistence(timeout: 10),
            "tool calls were not folded"
        )
        XCTAssertEqual(
            any.matching(identifier: "chat.row.process").count,
            1,
            "one turn drew more than one process row"
        )
    }

    /// A conversation is a focused surface: the destination control belongs to
    /// the list behind it and must not float over the composer.
    func testFloatingControlLeavesConversationAlone() throws {
        let app = try launch()
        XCTAssertTrue(answer(in: app).waitForExistence(timeout: 20), "the conversation did not open")
        let ball = app.buttons["app.tabBall"].firstMatch
        XCTAssertFalse(ball.isHittable, "the destination control stayed over the conversation")
    }

    /// The two speakers carry different row identities, so a reader can tell
    /// them apart and so this test can assert both are present.
    func testBothSpeakersRenderDistinctRows() throws {
        let app = try launch()
        let reached = answer(in: app).waitForExistence(timeout: 20)
        XCTAssertTrue(answer(in: app).waitForExistence(timeout: 20))
        let any = app.descendants(matching: .any)
        let user = any["chat.row.user"].firstMatch
        let assistant = any["chat.row.assistant"].firstMatch
        XCTAssertTrue(user.exists, "no user row")
        XCTAssertTrue(assistant.exists, "no assistant row")
    }

    /// A Session another writer owns is retried instead of reported as broken.
    func testWriterHeldReconnects() throws {
        let app = try launch()
        XCTAssertTrue(answer(in: app).waitForExistence(timeout: 30), "the retried stream never delivered its snapshot")
        XCTAssertFalse(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "writer-held")).firstMatch.exists,
            "the Host's internal refusal was shown as an error"
        )
    }

    /// A technical answer draws its own blocks: a Mermaid diagram and a fenced
    /// code block with a copy action. The fixture conversation holds only this
    /// answer, so every block sits on the first screen.
    func testRichAnswerRendersDiagramAndCode() {
        let app = launchRich()
        XCTAssertTrue(answer(in: app).waitForExistence(timeout: 20))
        // The diagram is one accessible element labelled in the reader's language;
        // the copy action is addressed by its label because SwiftUI drops the
        // identifier inside a horizontally scrolling code block.
        XCTAssertTrue(
            diagram(in: app).waitForExistence(timeout: 15),
            "the diagram did not render"
        )
        XCTAssertTrue(app.buttons["复制代码"].exists, "the code block has no copy action")
    }

    /// The diagram opens at full size, where it can be zoomed, fitted, and have
    /// its source copied; closing returns to the transcript.
    func testDiagramOpensFullScreen() {
        let app = launchRich()
        let diagram = diagram(in: app)
        XCTAssertTrue(diagram.waitForExistence(timeout: 20), "the diagram did not render")
        diagram.tap()
        let close = app.buttons["mermaid.close"]
        XCTAssertTrue(close.waitForExistence(timeout: 10), "the full-screen reader did not open")
        XCTAssertTrue(app.buttons["mermaid.fit"].exists, "no fit control")
        XCTAssertTrue(app.buttons["mermaid.copy"].exists, "no copy control")
        close.tap()
        XCTAssertFalse(close.waitForExistence(timeout: 3), "the reader stayed open")
    }

    /// The rendered diagram.
    ///
    /// The assistant row owns the accessibility identifier of every child, so
    /// the diagram is addressed by the label it sets itself rather than by an
    /// identifier that SwiftUI would overwrite.
    /// - Parameter app: the running application.
    /// - Returns: the diagram element.
    private func diagram(in app: XCUIApplication) -> XCUIElement {
        app.otherElements["流程图"].firstMatch
    }
}
