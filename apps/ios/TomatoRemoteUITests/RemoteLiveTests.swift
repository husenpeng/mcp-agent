//
//  RemoteLiveTests.swift
//  TomatoRemoteUITests
//
//  End-to-end checks against a Host that answers the robot and room
//  namespaces. The test needs a Host whose `/api` answers without a cookie and
//  whose revision carries the Tomato Rbot bundle; it runs against the address
//  in `TOMATO_UITEST_HOST` and skips without one, like the Session test.
//

import XCTest

final class RemoteLiveTests: XCTestCase {
    private var host: String {
        get throws {
            guard let value = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !value.isEmpty else {
                throw XCTSkip("TOMATO_UITEST_HOST is not set; no Host to read robots and rooms from")
            }
            return value
        }
    }

    /// Launch paired against the test Host, optionally through a deep link.
    private func launch(_ link: String? = nil) throws -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = try ["-TOMATO_NO_LOCK", "-TOMATO_PREVIEW_PAIRING", host]
        if let link {
            app.launchArguments += ["-TOMATO_OPEN_URL", link]
        }
        app.launch()
        return app
    }

    /// A robot-run Session stays out of 会话 and appears under 智能体 instead.
    func testRobotRunSessionsStayOutOfTheSessionList() throws {
        let app = try launch()
        app.tabBars.buttons["会话"].tap()
        XCTAssertTrue(app.staticTexts["普通会话"].waitForExistence(timeout: 20), "ordinary Session did not list")
        XCTAssertFalse(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "周报助手运行")).firstMatch.exists,
            "robot-run Session leaked into 会话"
        )

        app.tabBars.buttons["智能体"].tap()
        XCTAssertTrue(app.buttons["robot.row.robot-weekly"].waitForExistence(timeout: 10), "robot roster did not arrive")
        app.buttons["robot.row.robot-weekly"].tap()
        XCTAssertTrue(app.staticTexts["历史对话"].waitForExistence(timeout: 10), "conversation history is missing")
        XCTAssertTrue(app.buttons["打开完整对话"].waitForExistence(timeout: 10), "run transcript link is missing")
        app.buttons["打开完整对话"].tap()
        XCTAssertTrue(app.navigationBars["对话记录"].waitForExistence(timeout: 10), "run transcript did not open")
    }

    /// The room feed renders members, A2A cards, and a pending approval.
    func testRoomFeedRendersApproval() throws {
        let app = try launch("tomato://rooms")
        XCTAssertTrue(app.buttons["room.row.room-launch"].waitForExistence(timeout: 20), "room list did not arrive")
        app.buttons["room.row.room-launch"].tap()

        let opening = app.staticTexts.matching(
            NSPredicate(format: "label CONTAINS %@", "把新品发布拆成三步")
        ).firstMatch
        XCTAssertTrue(opening.waitForExistence(timeout: 10), "room feed did not render the human message")
        XCTAssertTrue(app.staticTexts["策划"].exists, "member name is missing from the feed")
        XCTAssertTrue(app.buttons["批准"].exists, "pending approval has no decision")
        XCTAssertTrue(app.buttons["room.mention.writer"].exists, "mention chip is missing")

        // One post proves the write half of the feed, not only its read half.
        let composer = app.descendants(matching: .any).matching(identifier: "room.composer").firstMatch
        XCTAssertTrue(composer.waitForExistence(timeout: 5), "room composer is missing")
        app.buttons["room.mention.writer"].tap()
        composer.tap()
        composer.typeText("收到，先看文案")
        app.buttons["发送"].tap()
        XCTAssertTrue(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "收到，先看文案")).firstMatch
                .waitForExistence(timeout: 10),
            "posted message did not appear in the feed"
        )
    }

    /// Starting a run reaches the Host and the refreshed registry shows it.
    func testStartingARunAppearsInTheRoster() throws {
        let app = try launch("tomato://robots")
        XCTAssertTrue(app.buttons["robot.row.robot-brief"].waitForExistence(timeout: 20), "idle robot did not list")
        app.buttons["robot.row.robot-brief"].tap()
        XCTAssertTrue(app.buttons["运行一次"].waitForExistence(timeout: 10), "run control is missing")
        app.buttons["运行一次"].tap()

        let field = app.descendants(matching: .any).matching(identifier: "robot.message").firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 5), "run instruction sheet did not open")
        field.tap()
        field.typeText("跑一下这次")
        app.buttons["启动"].tap()
        XCTAssertTrue(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "跑一下这次")).firstMatch
                .waitForExistence(timeout: 10),
            "the started run did not reach the robot page"
        )
    }
}
