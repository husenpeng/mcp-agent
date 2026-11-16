//
//  PhoneCacheableModelsTests.swift
//  TomatoRemoteUITests
//
//  The model picker exposes only verified cacheable models and no protocol
//  control; selecting a model keeps its measured protocol.
//

import XCTest

final class PhoneCacheableModelsTests: XCTestCase {
    func testAnthropicOnlyModelSelectsItsProtocol() throws {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS", "-TOMATO_PHONE_TAB",
            "-TOMATO_PREVIEW_PAIRING", host,
        ]
        app.launch()

        app.buttons["phone.modelSettings"].tap()
        XCTAssertTrue(app.buttons["phone.model.current"].waitForExistence(timeout: 10))
        app.buttons["phone.model.current"].tap()
        let entry = app.buttons["phone.model.pick.DeepSeek-V4.1-Flash"]
        XCTAssertTrue(entry.waitForExistence(timeout: 5))
        entry.tap()
        XCTAssertTrue(app.staticTexts["缓存协议, Anthropic Messages"].waitForExistence(timeout: 5))
        app.buttons["完成"].tap()
    }

    func testPickerListsOnlyCacheableModels() throws {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS", "-TOMATO_PHONE_TAB",
            "-TOMATO_PREVIEW_PAIRING", host,
        ]
        app.launch()

        app.buttons["phone.modelSettings"].tap()
        XCTAssertTrue(app.buttons["phone.model.current"].waitForExistence(timeout: 10))
        XCTAssertFalse(app.buttons["phone.model.protocol"].exists, "the protocol picker should be gone")

        app.buttons["phone.model.current"].tap()
        XCTAssertTrue(app.buttons["phone.model.pick.DeepSeek-V4-Pro"].waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["phone.model.pick.DeepSeek-V4-Flash"].exists, "an unverified model leaked into the picker")
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "phone-cacheable-models"
        shot.lifetime = .keepAlways
        add(shot)
        app.buttons["phone.model.pick.DeepSeek-V4-Pro"].tap()
        app.buttons["完成"].tap()
        sleep(1)

        app.buttons["phone.modelSettings"].tap()
        XCTAssertTrue(app.buttons["phone.model.current"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["phone.model.current"].label.contains("DeepSeek-V4-Pro"))
        app.buttons["完成"].tap()
    }
}
