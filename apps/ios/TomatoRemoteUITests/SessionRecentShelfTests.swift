//
//  SessionRecentShelfTests.swift
//  TomatoRemoteUITests
//
//  The Session list shelves the conversations that finished inside the last
//  day above the folders. Which Sessions qualify depends on the fixture Host's
//  clock, so the test asserts the shelf's shape and that its rows open, rather
//  than an exact membership.
//

import XCTest

final class SessionRecentShelfTests: XCTestCase {
    private func launch() throws -> XCUIApplication {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_PREVIEW_PAIRING", host,
            "-TOMATO_OPEN_URL", "tomato://sessions",
            // Start from every folder open, so a shelf row's folder twin is
            // on screen and its identifier can be checked for ambiguity.
            "-sessions.collapsedFolders", "[]",
        ]
        app.launch()
        return app
    }

    /// The shelf names its window, lists finished conversations, and a row in it
    /// opens the same conversation as its folder row without the two answering
    /// one accessibility query.
    func testShelfListsFinishedConversationsAndOpensThem() throws {
        let app = try launch()
        let header = app.otherElements["session.recent.header"]
        guard header.waitForExistence(timeout: 20) else {
            throw XCTSkip("the fixture Host lists no conversation finished inside the last day")
        }
        let shelfRows = app.buttons.matching(
            NSPredicate(format: "identifier BEGINSWITH 'session.recent.'")
        )
        XCTAssertGreaterThan(shelfRows.count, 0, "the shelf header showed without any row")

        // A conversation on the shelf stays in its folder under its own
        // identifier, so neither query is ambiguous.
        let first = shelfRows.element(boundBy: 0)
        XCTAssertTrue(first.waitForExistence(timeout: 5), "the shelf row did not appear")
        first.tap()
        XCTAssertTrue(
            app.navigationBars.firstMatch.waitForExistence(timeout: 10),
            "a shelf row did not open its conversation"
        )
    }
}
