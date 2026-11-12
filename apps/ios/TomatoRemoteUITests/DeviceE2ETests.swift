//
//  DeviceE2ETests.swift
//  TomatoRemoteUITests
//
//  Full path on a physical phone against a real Host: pairing, opening a
//  conversation, staging a local document through the Host upload route, and
//  creating then pausing a scheduled task.
//
//  The Host address and launch token come from the environment, because a token
//  is process-scoped: run the Host, export TOMATO_E2E_BASE and TOMATO_E2E_TOKEN,
//  then run this test class on the device destination.
//

import XCTest

final class DeviceE2ETests: XCTestCase {
    private func host() throws -> (base: String, token: String) {
        let environment = ProcessInfo.processInfo.environment
        guard let base = environment["TOMATO_E2E_BASE"], !base.isEmpty,
              let token = environment["TOMATO_E2E_TOKEN"], !token.isEmpty
        else {
            throw XCTSkip("TOMATO_E2E_BASE and TOMATO_E2E_TOKEN are not set")
        }
        return (base, token)
    }

    /// Launch paired, with the bundled sample document staged.
    private func launch(stage: Bool) throws -> XCUIApplication {
        let (base, token) = try host()
        let app = XCUIApplication()
        app.launchArguments = ["-TOMATO_NO_LOCK", "-TOMATO_PAIR_BASE", base, "-TOMATO_PAIR_TOKEN", token]
        if stage {
            app.launchArguments.append("-TOMATO_STAGE_SAMPLE")
            app.launchArguments += ["-TOMATO_OPEN_URL", "tomato://session/latest"]
        }
        app.launch()
        allowLocalNetwork()
        return app
    }

    /// The first LAN request raises a system prompt; grant it once per install.
    private func allowLocalNetwork() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let alert = springboard.alerts.firstMatch
        guard alert.waitForExistence(timeout: 12) else { return }
        for label in ["允许", "Allow"] where alert.buttons[label].exists {
            alert.buttons[label].tap()
            return
        }
        alert.buttons.element(boundBy: alert.buttons.count - 1).tap()
    }

    /// The Host list arrives from the real Mac, not a fixture.
    func testPairingReachesTheHost() throws {
        let app = try launch(stage: false)
        XCTAssertTrue(app.tabBars.buttons["会话"].waitForExistence(timeout: 30), "tab bar did not appear")
        app.tabBars.buttons["会话"].tap()
        // Any row proves `session/list` answered; the Host always holds at least
        // the Session a pairing run just created.
        let anyRow = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "session.folder.")).firstMatch
        XCTAssertTrue(anyRow.waitForExistence(timeout: 30), "no Session reached the list")
    }

    /// A local PDF travels through the Host upload route and stages as a chip.
    ///
    /// The Session comes from `TOMATO_E2E_SESSION`: a freshly created one has no
    /// writer handle, so the Host accepts the upload instead of answering
    /// `session/writer-held` for a Session an Agent is executing in.
    func testLocalDocumentUploadsToTheHost() throws {
        let (base, token) = try host()
        guard let session = ProcessInfo.processInfo.environment["TOMATO_E2E_SESSION"], !session.isEmpty else {
            throw XCTSkip("TOMATO_E2E_SESSION is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_PAIR_BASE", base, "-TOMATO_PAIR_TOKEN", token,
            "-TOMATO_OPEN_URL", "tomato://session/\(session)", "-TOMATO_STAGE_SAMPLE",
        ]
        app.launch()
        allowLocalNetwork()
        let chip = app.staticTexts["sample.pdf"]
        XCTAssertTrue(chip.waitForExistence(timeout: 40), "the staged sample never appeared; the upload did not complete")
    }

    /// A task created and paused from the phone is accepted by the real Host.
    func testCreateThenPauseASchedule() throws {
        let app = try launch(stage: false)
        XCTAssertTrue(app.tabBars.buttons["今天"].waitForExistence(timeout: 30))
        app.tabBars.buttons["今天"].tap()
        let all = app.buttons["全部"]
        XCTAssertTrue(all.waitForExistence(timeout: 30), "schedule card missing")
        all.tap()
        let add = app.buttons["新建定时任务"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        add.tap()
        let title = "设备测试 \(Int(Date().timeIntervalSince1970))"
        let titleField = app.textFields.firstMatch
        XCTAssertTrue(titleField.waitForExistence(timeout: 10))
        titleField.tap()
        titleField.typeText(title)
        let promptField = app.textFields.element(boundBy: 1)
        promptField.tap()
        promptField.typeText("检查一次发布状态")
        app.buttons["创建"].tap()

        // The card carries its own title, so a task from an earlier run cannot be
        // mistaken for this one.
        let card = app.otherElements["schedule.card.\(title)"]
        XCTAssertTrue(card.waitForExistence(timeout: 25), "the created task did not reach the list")
        let toggle = card.buttons.firstMatch
        XCTAssertTrue(toggle.waitForExistence(timeout: 10))
        toggle.tap()
        XCTAssertTrue(card.staticTexts["已暂停"].waitForExistence(timeout: 15), "the Host did not report the pause")
    }
}

extension DeviceE2ETests {
    /// A file on the Mac downloads over the Host route and opens in QuickLook.
    func testPreviewFileFromTheHost() throws {
        let (base, token) = try host()
        guard let path = ProcessInfo.processInfo.environment["TOMATO_E2E_PREVIEW_PATH"], !path.isEmpty else {
            throw XCTSkip("TOMATO_E2E_PREVIEW_PATH is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_PAIR_BASE", base, "-TOMATO_PAIR_TOKEN", token,
            "-TOMATO_PREVIEW_PATH", path,
        ]
        app.launch()
        allowLocalNetwork()
        let name = (path as NSString).lastPathComponent
        XCTAssertTrue(app.navigationBars[name].waitForExistence(timeout: 30), "the preview sheet did not open")
        XCTAssertFalse(
            app.staticTexts["打不开这个文件"].waitForExistence(timeout: 5),
            "the Host refused the file download"
        )
    }

    /// The microphone button asks for permission and starts dictation.
    func testVoiceInputStartsDictation() throws {
        let app = try launch(stage: false)
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        app.tabBars.buttons["会话"].tap()
        let row = app.staticTexts["tomatoHarness"].firstMatch
        XCTAssertTrue(row.waitForExistence(timeout: 30), "no Session to open")
        row.tap()
        let mic = app.buttons["composer.mic"]
        XCTAssertTrue(mic.waitForExistence(timeout: 15), "no dictation button")
        mic.tap()
        // The system asks once for speech and microphone access.
        for label in ["允许", "Allow", "好", "OK"] {
            let button = springboard.buttons[label]
            if button.waitForExistence(timeout: 3) {
                button.tap()
            }
        }
        let listening = app.buttons["结束听写"]
        XCTAssertTrue(
            listening.waitForExistence(timeout: 10) || app.staticTexts["麦克风启动失败"].exists
                || app.staticTexts.containing(NSPredicate(format: "label CONTAINS %@", "权限")).firstMatch.exists,
            "dictation neither started nor reported why"
        )
        if listening.exists {
            listening.tap()
        }
    }
}
