//
//  SessionFolderTests.swift
//  TomatoRemoteUITests
//
//  A folder header is the list's first level: one tap closes its conversations
//  and a second tap opens them again. The run needs the fixture Host's folders;
//  it skips when the Host lists none.
//

import XCTest

final class SessionFolderTests: XCTestCase {
    private func launch() throws -> XCUIApplication {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_PREVIEW_PAIRING", host,
            "-TOMATO_OPEN_URL", "tomato://sessions",
            // Start from every folder open, whatever an earlier run left.
            "-sessions.collapsedFolders", "[]",
        ]
        app.launch()
        return app
    }

    /// Closing and reopening one folder keeps the rows it owns.
    func testFolderCollapsesAndReopens() throws {
        let app = try launch()
        let header = app.buttons["session.folder./Users/underdog/work/tomato"]
        guard header.waitForExistence(timeout: 20) else {
            throw XCTSkip("the fixture Host lists no folder to collapse")
        }
        let row = app.buttons["session.row.s1"]
        XCTAssertTrue(row.waitForExistence(timeout: 10), "the folder's first row was not drawn")

        header.tap()
        XCTAssertTrue(
            row.waitForNonExistence(timeout: 5),
            "the folder stayed open after its header was tapped"
        )

        header.tap()
        XCTAssertTrue(
            row.waitForExistence(timeout: 5),
            "the folder did not reopen after a second tap"
        )
    }
}
