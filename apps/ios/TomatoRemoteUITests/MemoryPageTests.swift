//
//  MemoryPageTests.swift
//  TomatoRemoteUITests
//
//  The memory page shows the Host's records and the phone's own proposals. The
//  device that tests it needs a Host answering `memories/list`; without one the
//  suite skips, because a pairing token is process-scoped.
//

import XCTest

final class MemoryPageTests: XCTestCase {
    private func host() throws -> String {
        guard let value = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !value.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set; no Host to read memories from")
        }
        return value
    }

    /// Launch paired against the test Host and route straight to the page.
    private func launch() throws -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = try [
            "-TOMATO_NO_LOCK",
            "-TOMATO_PREVIEW_PAIRING", host(),
            "-TOMATO_OPEN_URL", "tomato://memory",
        ]
        app.launch()
        return app
    }

    /// The deep link lands on the page, and the page states the one store.
    func testDeepLinkOpensMemoryPage() throws {
        let app = try launch()
        XCTAssertTrue(app.navigationBars["记忆"].waitForExistence(timeout: 20), "memory page did not open")
        XCTAssertTrue(app.staticTexts["待确认"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["生效中"].exists)
    }

    /// A candidate the Host holds is confirmable from the phone.
    func testCandidateOffersConfirmation() throws {
        let app = try launch()
        XCTAssertTrue(app.staticTexts["待确认"].waitForExistence(timeout: 20))
        XCTAssertTrue(
            app.buttons["确认"].waitForExistence(timeout: 10),
            "a candidate without a confirm action cannot be promoted"
        )
        XCTAssertTrue(app.buttons["删除"].exists)
    }
}
