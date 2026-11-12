//
//  AgentSettingsTests.swift
//  TomatoRemoteUITests
//
//  Tomato Phone model settings must survive closing the sheet, and every text
//  field must let the keyboard go.
//

import XCTest

final class AgentSettingsTests: XCTestCase {
    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK",
            "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_PREVIEW_PAIRING", "http://127.0.0.1:9",
            "-TOMATO_PHONE_TAB",
        ]
        app.launch()
        return app
    }

    private func replace(_ field: XCUIElement, with text: String) {
        field.tap(withNumberOfTaps: 3, numberOfTouches: 1)
        field.typeText(text)
    }

    /// Edit the endpoint and model, save, close, reopen, and read them back.
    func testSettingsPersistAfterReopen() {
        let app = launch()
        let settings = app.buttons["模型设置"]
        XCTAssertTrue(settings.waitForExistence(timeout: 20), "Tomato Phone settings button missing")
        settings.tap()

        let base = app.textFields["Base URL"]
        XCTAssertTrue(base.waitForExistence(timeout: 5), "settings sheet did not open")
        replace(base, with: "https://settings-probe.example/v1")
        replace(app.textFields["模型 ID"], with: "settings-probe-model")
        app.secureTextFields["API Key"].tap()
        app.secureTextFields["API Key"].typeText("settings-probe-key")

        let save = app.buttons["保存"]
        if !save.isHittable {
            app.swipeUp()
        }
        save.tap()
        XCTAssertTrue(app.staticTexts["已保存：settings-probe-model"].waitForExistence(timeout: 5), "save did not confirm")

        app.buttons["完成"].tap()
        XCTAssertTrue(app.buttons["模型设置"].waitForExistence(timeout: 5))
        app.buttons["模型设置"].tap()

        let reopened = app.textFields["Base URL"]
        XCTAssertTrue(reopened.waitForExistence(timeout: 5))
        XCTAssertEqual(reopened.value as? String, "https://settings-probe.example/v1", "base URL was not persisted")
        XCTAssertEqual(app.textFields["模型 ID"].value as? String, "settings-probe-model", "model was not persisted")
    }

    /// Closing the sheet with its own control must save the edit as well.
    func testClosePersistsEdit() {
        let app = launch()
        app.buttons["模型设置"].tap()
        let base = app.textFields["Base URL"]
        XCTAssertTrue(base.waitForExistence(timeout: 5))
        replace(base, with: "https://swipe-probe.example/v1")
        if app.buttons["收起键盘"].exists {
            app.buttons["收起键盘"].tap()
        }
        let sheet = app.navigationBars["Tomato Phone 模型"]
        app.buttons["关闭"].tap()
        XCTAssertTrue(app.buttons["模型设置"].waitForExistence(timeout: 5), "sheet did not dismiss")
        XCTAssertTrue(sheet.waitForNonExistence(timeout: 5), "sheet was still on screen when it was reopened")

        app.buttons["模型设置"].tap()
        let reopened = app.textFields["Base URL"]
        XCTAssertTrue(reopened.waitForExistence(timeout: 5))
        XCTAssertEqual(reopened.value as? String, "https://swipe-probe.example/v1", "swipe dismiss lost the edit")
    }
}

// MARK: - Composer inputs

extension AgentSettingsTests {
    /// Tomato Phone's composer offers the model and reasoning choices plus the
    /// photo library, camera, and document inputs.
    func testComposerOffersModelReasoningAndAttachments() {
        let app = launch()
        let any = app.descendants(matching: .any)

        let model = any["phone.composer.model"].firstMatch
        XCTAssertTrue(model.waitForExistence(timeout: 20), "model chip missing from the phone composer")
        XCTAssertTrue(any["phone.composer.effort"].firstMatch.exists, "reasoning chip missing")
        XCTAssertTrue(app.buttons["phone.composer.photo"].exists, "photo picker missing")
        XCTAssertTrue(app.buttons["phone.composer.camera"].exists, "camera missing")
        XCTAssertTrue(app.buttons["phone.composer.document"].exists, "document picker missing")

        model.tap()
        XCTAssertTrue(app.staticTexts["选择模型"].waitForExistence(timeout: 5), "model sheet did not open")
        app.buttons["关闭"].tap()
        XCTAssertTrue(model.waitForExistence(timeout: 5), "model sheet did not close")

        any["phone.composer.effort"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["推理等级"].waitForExistence(timeout: 5), "reasoning sheet did not open")
        XCTAssertTrue(app.buttons["phone.reasoning.auto"].exists, "automatic level missing")
        XCTAssertTrue(app.buttons["phone.reasoning.high"].exists, "high level missing")
        app.buttons["关闭"].tap()
    }

    /// The composer's chevron and the keyboard toolbar both put the keyboard
    /// away, which is the control the phone composer was missing.
    func testKeyboardCollapsesFromComposer() {
        let app = launch()
        let field = app.descendants(matching: .any)["phone.composer.input"].firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 20), "phone composer field missing")
        field.tap()
        field.typeText("测试")
        XCTAssertTrue(app.keyboards.element.waitForExistence(timeout: 10), "keyboard did not open")

        let collapse = app.buttons["phone.composer.collapse"]
        XCTAssertTrue(collapse.waitForExistence(timeout: 5), "collapse control missing while typing")
        collapse.tap()
        let gone = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"),
            object: app.keyboards.element
        )
        XCTAssertEqual(XCTWaiter().wait(for: [gone], timeout: 5), .completed, "keyboard stayed open")

        // The keyboard's own toolbar item is the second way out.
        field.tap()
        XCTAssertTrue(app.keyboards.element.waitForExistence(timeout: 10), "keyboard did not reopen")
        let toolbarDismiss = app.buttons["phone.keyboard.dismiss"]
        XCTAssertTrue(toolbarDismiss.waitForExistence(timeout: 5), "keyboard toolbar item missing")
        toolbarDismiss.tap()
        let goneAgain = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"),
            object: app.keyboards.element
        )
        XCTAssertEqual(XCTWaiter().wait(for: [goneAgain], timeout: 5), .completed, "keyboard toolbar did not close it")
    }
}

// MARK: - Feishu sign-in

extension AgentSettingsTests {
    /// The phone drives the Host's Feishu flow in its own web view and adopts
    /// the session cookie when the callback page settles.
    ///
    /// Runs only with `TOMATO_UITEST_FEISHU_HOST`, a Host that exposes the
    /// three auth routes; the default suite skips it.
    func testFeishuLoginCompletes() throws {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_FEISHU_HOST"],
              !host.isEmpty
        else {
            throw XCTSkip("TOMATO_UITEST_FEISHU_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK",
            "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_CLEAR_ACCOUNT",
            "-TOMATO_PREVIEW_PAIRING", host,
            "-TOMATO_OPEN_URL", "tomato://account",
        ]
        app.launch()

        let login = app.buttons["account.login"]
        XCTAssertTrue(login.waitForExistence(timeout: 20), "Feishu login action missing")
        login.tap()
        XCTAssertTrue(app.navigationBars["飞书登录"].waitForExistence(timeout: 8), "login sheet did not open")
        XCTAssertTrue(app.staticTexts["飞书测试"].waitForExistence(timeout: 20), "account did not show the signed-in user")
    }
}
