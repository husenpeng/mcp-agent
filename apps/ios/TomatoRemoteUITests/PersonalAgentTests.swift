//
//  PersonalAgentTests.swift
//  TomatoRemoteUITests
//
//  The personal-agent surfaces: the home page, pending questions and approvals,
//  and the composer's new inputs. Tests that need a Host read `TOMATO_UITEST_HOST`
//  and skip without one.
//

import XCTest

final class PersonalAgentTests: XCTestCase {
    private func host() throws -> String {
        guard let value = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !value.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        return value
    }

    private func launch() throws -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = try ["-TOMATO_NO_LOCK", "-TOMATO_PREVIEW_PAIRING", host()]
        app.launch()
        return app
    }

    /// The home tab opens first and reports what the Host worked on today.
    func testHomeShowsRecapAndOpenTasks() throws {
        let app = try launch()
        XCTAssertTrue(app.navigationBars["今天"].waitForExistence(timeout: 20), "home did not open")
        XCTAssertTrue(app.staticTexts["今日回顾"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["未完成"].exists)
        XCTAssertTrue(app.staticTexts["定时任务"].exists)
    }

    /// A pending approval reaches the screen and can be allowed from there.
    func testPendingApprovalCanBeAllowed() throws {
        let app = try launch()
        // The badge on 今天 counts what waits; the card inside it opens the sheet.
        let banner = app.buttons["interactions.banner"]
        XCTAssertTrue(banner.waitForExistence(timeout: 25), "no pending card; the event stream carried nothing")
        banner.tap()
        let allow = app.buttons["允许本次"]
        XCTAssertTrue(allow.waitForExistence(timeout: 8), "pending sheet did not open")
        allow.tap()
        // The card leaves the list once its answer is accepted.
        XCTAssertFalse(allow.waitForExistence(timeout: 4), "the card stayed after answering")
    }

    /// The composer offers dictation and a document, next to the photo picker.
    func testComposerOffersVoiceAndDocument() throws {
        let app = try launch()
        app.tabBars.buttons["会话"].tap()
        let row = app.staticTexts["整理本周发布说明"].firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 20), "session row did not appear")
        row.tap()
        XCTAssertTrue(app.buttons["composer.mic"].waitForExistence(timeout: 10), "no dictation button")
        XCTAssertTrue(app.buttons["附加文档"].exists, "no document button")
        XCTAssertTrue(app.buttons["附加照片"].exists)
    }
}

extension PersonalAgentTests {
    /// A file the Agent presented is listed with the conversation and opens the
    /// preview sheet when tapped.
    func testDeliveredFileIsListedAndOpens() throws {
        let app = try launch()
        app.tabBars.buttons["会话"].tap()
        let row = app.staticTexts["整理本周发布说明"].firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 20))
        row.tap()
        XCTAssertTrue(app.staticTexts["产出文件"].waitForExistence(timeout: 10), "no deliverables card")
        let file = app.buttons["chat.file.report.pdf"]
        XCTAssertTrue(file.waitForExistence(timeout: 5))
        file.tap()
        // The sheet is titled with the file's name even while the Host route is
        // unavailable; the failure is stated inside it.
        XCTAssertTrue(app.navigationBars["report.pdf"].waitForExistence(timeout: 10), "preview sheet did not open")
    }
}
