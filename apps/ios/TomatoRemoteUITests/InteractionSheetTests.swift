//
//  InteractionSheetTests.swift
//  TomatoRemoteUITests
//
//  A pending approval must open a card and the card's 完成 must close the
//  sheet. The test needs a Host that forwards a `$events` waterfall and reads
//  `TOMATO_UITEST_HOST`, like the other live tests.
//

import XCTest

final class InteractionSheetTests: XCTestCase {
    private var host: String {
        get throws {
            guard let value = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !value.isEmpty else {
                throw XCTSkip("TOMATO_UITEST_HOST is not set; no Host to forward a waterfall from")
            }
            return value
        }
    }

    private func launch() throws -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = try ["-TOMATO_NO_LOCK", "-TOMATO_PREVIEW_PAIRING", host]
        app.launch()
        return app
    }

    /// The forwarded approval appears on 今天 and its sheet can be closed.
    func testApprovalSheetCloses() throws {
        let app = try launch()
        let pending = app.staticTexts["Agent 在等你"]
        XCTAssertTrue(pending.waitForExistence(timeout: 25), "pending approval did not reach the phone")
        pending.tap()

        // The sheet draws its own header instead of a navigation bar, and the
        // title carries the pending count.
        let header = app.staticTexts
            .matching(NSPredicate(format: "label BEGINSWITH %@", "待处理"))
            .firstMatch
        XCTAssertTrue(header.waitForExistence(timeout: 5), "approval sheet did not open")
        XCTAssertTrue(app.staticTexts["请求执行 bash"].exists, "approval card did not name the tool")

        app.buttons["关闭"].tap()
        let gone = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"),
            object: header
        )
        XCTAssertEqual(XCTWaiter().wait(for: [gone], timeout: 5), .completed, "关闭 did not close the sheet")
    }
}
