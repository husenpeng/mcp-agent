//
//  InteractionProbeTests.swift
//  TomatoRemoteUITests
//
//  Temporary probe: drives the four reported interaction surfaces against the
//  QA fixture Host and writes PNGs into the runner's Documents.
//

import XCTest

final class InteractionProbeTests: XCTestCase {
    private var host: String {
        ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"] ?? "http://127.0.0.1:43202"
    }

    private func launch(_ open: String) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS", "-TOMATO_PREVIEW_PAIRING", host, "-TOMATO_OPEN_URL", open]
        app.launch()
        return app
    }

    private func shot(_ name: String) {
        let document = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        try? XCUIScreen.main.screenshot().pngRepresentation.write(to: document.appendingPathComponent("\(name).png"))
        print("PROBE shot \(name)")
    }

    private func frame(of app: XCUIApplication, _ label: String) -> CGRect {
        let element = app.staticTexts[label].firstMatch
        guard element.exists else { return .zero }
        return element.frame
    }

    /// A long Session must open on its newest turn, not in the middle of an
    /// older answer, and reading back must page older messages in without
    /// throwing the reader back to the bottom.
    func testProbeLongConversation() {
        let app = launch("tomato://session/long")
        XCTAssertTrue(app.navigationBars["六十轮长对话"].waitForExistence(timeout: 20))
        Thread.sleep(forTimeInterval: 4)
        shot("long-open")

        let newest = "第 60 轮：帮我看一下第 60 个问题"
        let scroll = app.scrollViews.firstMatch
        print("PROBE scroll frame=\(scroll.frame)")
        print("PROBE newest=\(frame(of: app, newest))")
        print("PROBE answer60=\(frame(of: app, "第 60 轮回答"))")
        print("PROBE answer59=\(frame(of: app, "第 59 轮回答"))")
        print("PROBE first=\(frame(of: app, "第 1 轮：帮我看一下第 1 个问题"))")

        // Reading back: drag down to reveal older turns.
        for index in 0 ..< 12 {
            scroll.swipeDown()
            Thread.sleep(forTimeInterval: 0.4)
            let first = app.staticTexts["第 1 轮：帮我看一下第 1 个问题"].firstMatch
            let earlier = app.buttons["chat.loadEarlier"].firstMatch
            print("PROBE back \(index): first=\(first.exists) earlier=\(earlier.exists) newest=\(frame(of: app, newest))")
            if first.exists || earlier.exists {
                break
            }
        }
        shot("long-back")
        print("PROBE after back: newest=\(frame(of: app, newest)) first=\(frame(of: app, "第 1 轮：帮我看一下第 1 个问题"))")

        // Coming back down must restore the newest turn.
        let jump = app.buttons["回到最新"].firstMatch
        if jump.exists {
            jump.tap()
        } else {
            for _ in 0 ..< 14 {
                scroll.swipeUp()
            }
        }
        Thread.sleep(forTimeInterval: 1)
        shot("long-bottom")
        print("PROBE bottom newest=\(frame(of: app, newest))")
    }

    /// Typing in a settled historical Session: the keyboard must not cover the
    /// field, the draft must survive, and sending must draw the prompt once.
    func testProbeHistoryTyping() {
        let app = launch("tomato://session/idle")
        XCTAssertTrue(app.navigationBars["历史会话输入"].waitForExistence(timeout: 20))
        Thread.sleep(forTimeInterval: 2)
        shot("idle-open")

        let field = app.descendants(matching: .any)["composer.input"]
        XCTAssertTrue(field.waitForExistence(timeout: 10), "composer missing")
        field.tap()
        Thread.sleep(forTimeInterval: 0.8)
        let keyboard = app.keyboards.firstMatch
        print("PROBE keyboard exists=\(keyboard.exists) frame=\(keyboard.exists ? keyboard.frame : .zero)")
        print("PROBE field frame=\(field.frame) hittable=\(field.isHittable)")
        shot("idle-keyboard")

        field.typeText("历史中文输入测试")
        Thread.sleep(forTimeInterval: 0.5)
        print("PROBE value=\(String(describing: field.value))")
        shot("idle-typed")

        app.buttons["composer.send"].tap()
        Thread.sleep(forTimeInterval: 2)
        shot("idle-sent")
        let sent = app.staticTexts["历史中文输入测试"].firstMatch
        print("PROBE sent exists=\(sent.exists) frame=\(sent.exists ? sent.frame : .zero)")
        print("PROBE reply=\(frame(of: app, "收到：**历史中文输入测试**"))")
    }

    /// The answer body: headings, lists, quote, table, code, diagram.
    func testProbeRichBody() {
        let app = launch("tomato://session/rich")
        XCTAssertTrue(app.navigationBars["正文渲染样例"].waitForExistence(timeout: 20))
        Thread.sleep(forTimeInterval: 8)
        shot("rich-open")
        let scroll = app.scrollViews.firstMatch
        for index in 0 ..< 6 {
            scroll.swipeUp()
            Thread.sleep(forTimeInterval: 0.5)
            shot("rich-page-\(index)")
        }
        print("PROBE table header=\(frame(of: app, "项目"))")
        print("PROBE code=\(frame(of: app, "let round"))")
        print(
            "PROBE long line exists=\(app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "a very long command")).firstMatch.exists)"
        )

        // The diagram's full-screen reader.
        let diagram = app.otherElements["流程图"].firstMatch
        if diagram.waitForExistence(timeout: 5) {
            diagram.tap()
            Thread.sleep(forTimeInterval: 2)
            shot("rich-diagram-full")
            print("PROBE full screen close exists=\(app.buttons["mermaid.close"].firstMatch.exists)")
            app.buttons["mermaid.close"].firstMatch.tap()
        } else {
            print("PROBE diagram not visible")
        }
    }

    /// Session list: the last rows stay reachable and a row tapped after a
    /// scroll opens its own conversation.
    func testProbeSessionList() {
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK",
            "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_PREVIEW_PAIRING",
            host,
            "-TOMATO_OPEN_URL",
            "tomato://sessions",
        ]
        app.launch()
        XCTAssertTrue(app.buttons["新建会话"].waitForExistence(timeout: 20))
        let list = app.collectionViews.firstMatch
        shot("qa-list-open")
        for index in 0 ..< 3 {
            list.swipeUp()
            Thread.sleep(forTimeInterval: 0.5)
            shot("qa-list-up-\(index)")
        }
        let older = app.staticTexts["较早的会话"].firstMatch
        print("PROBE older exists=\(older.exists) hittable=\(older.exists ? older.isHittable : false)")
        if older.exists {
            older.tap()
            print("PROBE opened older=\(app.navigationBars["较早的会话"].waitForExistence(timeout: 10))")
            shot("qa-list-opened")
        }
    }
}
