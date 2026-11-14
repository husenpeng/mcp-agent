//
//  SmoothnessWalkTests.swift
//  TomatoRemoteUITests
//
//  Drives every tab once and scrolls the two scrolling surfaces. The test only
//  proves the screens are reachable; the frame probe in the app records what
//  each transition cost, and the run's log is read from the container after it.
//

import XCTest

final class SmoothnessWalkTests: XCTestCase {
    /// Host the walk runs against; the mock Host keeps the walk deterministic.
    private var host: String {
        ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"] ?? "http://127.0.0.1:43201"
    }

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testWalkEveryTabAndScroll() {
        let app = XCUIApplication()
        app.launchArguments = ["-TOMATO_NO_LOCK", "-TOMATO_FRAME_LOG", "-TOMATO_PREVIEW_PAIRING", host]
        app.launch()

        XCTAssertTrue(app.waitForTabBall(timeout: 30), "the floating destination control did not appear")
        app.openTab(.sessions)
        XCTAssertTrue(app.navigationBars["会话"].waitForExistence(timeout: 10), "会话 tab did not open")

        // Session list: two full swipes exercise folder grouping and row layout.
        // A SwiftUI `List` is a collection view, not a scroll view.
        let list = app.collectionViews.firstMatch
        if list.exists {
            list.swipeUp()
            list.swipeDown()
        }

        // Conversation: the mock carries a tool group, a Mermaid diagram, and a
        // deliverable, which are the expensive rows.
        let firstRow = app.buttons["session.row.s1"]
        let firstRowText = app.staticTexts["修复 iOS 会话列表点击无效"]
        if firstRow.waitForExistence(timeout: 15) {
            firstRow.tap()
        } else {
            XCTAssertTrue(firstRowText.waitForExistence(timeout: 5), "session row not found; is the mock Host running?")
            firstRowText.tap()
        }
        XCTAssertTrue(
            app.navigationBars["修复 iOS 会话列表点击无效"].waitForExistence(timeout: 10),
            "conversation did not open; is the mock Host running?"
        )
        walkTranscript(app)

        // A second diagram proves the shared renderer reuses its loaded runtime
        // instead of paying the WebKit start-up again.
        let secondRow = app.buttons["session.row.s3"]
        let secondRowText = app.staticTexts["图文回答"]
        if secondRow.waitForExistence(timeout: 10) {
            secondRow.tap()
        } else if secondRowText.waitForExistence(timeout: 5) {
            secondRowText.tap()
        }
        if app.navigationBars["图文回答"].waitForExistence(timeout: 10) {
            let transcript = app.scrollViews.firstMatch
            if transcript.exists {
                transcript.swipeUp()
                transcript.swipeDown()
            }
            app.navigationBars.buttons.element(boundBy: 0).tap()
        }

        walkTab(app, tab: .home, title: "记忆")
        walkTab(app, tab: .robots, title: "智能体")
        walkTab(app, tab: .rooms, title: "群聊")

        app.openTab(.account)
        XCTAssertTrue(app.navigationBars["账号"].waitForExistence(timeout: 10), "账号 tab did not open")

        let logs = app.buttons["account.logs"]
        if logs.waitForExistence(timeout: 5) {
            logs.tap()
            XCTAssertTrue(app.navigationBars["运行日志"].waitForExistence(timeout: 10), "运行日志 did not open")
            let logList = app.scrollViews.firstMatch
            logList.swipeUp()
            logList.swipeDown()
            app.navigationBars.buttons.element(boundBy: 0).tap()
        }

        // A second pass separates first-render cost from steady-state cost.
        app.openTab(.sessions)
        for tab in [TomatoTab.home, .robots, .rooms, .account, .sessions] {
            app.openTab(tab)
        }
    }

    /// Scroll one open transcript in both directions.
    private func walkTranscript(_ app: XCUIApplication) {
        let transcript = app.scrollViews.firstMatch
        guard transcript.waitForExistence(timeout: 10) else { return }
        for _ in 0 ..< 4 {
            transcript.swipeUp()
        }
        for _ in 0 ..< 2 {
            transcript.swipeDown()
        }
        app.navigationBars.buttons.element(boundBy: 0).tap()
    }

    /// Isolate the Session list: no destination tour, no chat, only repeated swipes.
    /// The frame log then answers whether the list itself drops frames.
    func testSessionListScrollOnly() throws {
        try scrollSessionList()
    }

    /// Launch, open the Session list, and swipe it three times each way.
    private func scrollSessionList() throws {
        let app = XCUIApplication()
        app.launchArguments = ["-TOMATO_NO_LOCK", "-TOMATO_FRAME_LOG", "-TOMATO_PREVIEW_PAIRING", host]
        app.launch()
        XCTAssertTrue(app.waitForTabBall(timeout: 30), "the floating destination control did not appear")
        app.openTab(.sessions)
        XCTAssertTrue(app.navigationBars["会话"].waitForExistence(timeout: 10), "会话 tab did not open")

        let list = app.collectionViews.firstMatch
        XCTAssertTrue(list.waitForExistence(timeout: 10), "session list did not appear")
        for _ in 0 ..< 3 {
            list.swipeUp()
            list.swipeDown()
        }
        // Let the last deceleration settle before the test ends.
        sleep(2)
    }

    private func walkTab(_ app: XCUIApplication, tab: TomatoTab, title: String) {
        app.openTab(tab)
        if tab == .home {
            // The dashboard owns its compact header; it has no navigation bar.
            XCTAssertTrue(
                app.descendants(matching: .any)["home.header"].firstMatch.waitForExistence(timeout: 10),
                "\(tab.rawValue) destination did not open"
            )
        } else {
            XCTAssertTrue(
                app.navigationBars[title].waitForExistence(timeout: 10),
                "\(tab.rawValue) destination did not open"
            )
        }
    }
}
