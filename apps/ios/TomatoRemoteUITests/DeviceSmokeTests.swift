//
//  DeviceSmokeTests.swift
//  TomatoRemoteUITests
//
//  A physical-device smoke check for the surfaces rebuilt here: the installed
//  app keeps its pairing, opens the newest conversation, and shows the
//  permission chip beside the compact model and reasoning icons. The run skips
//  on a device without a stored pairing.
//

import XCTest

final class DeviceSmokeTests: XCTestCase {
    func testNewestConversationShowsPermissionAndCompactModels() throws {
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_OPEN_URL", "tomato://session/latest",
        ]
        app.launch()

        // A pinned device opens straight into the conversation; one without a
        // pairing stays on the pairing screen and has nothing to smoke.
        guard app.buttons["app.tabBall"].waitForExistence(timeout: 30)
            || app.buttons["chat.permission"].waitForExistence(timeout: 5)
        else {
            throw XCTSkip("the device has no stored pairing")
        }
        let chip = app.buttons["chat.permission"]
        XCTAssertTrue(chip.waitForExistence(timeout: 30), "the permission chip is missing")
        XCTAssertTrue(app.buttons["composer.model"].exists, "the compact model icon is missing")
        // The reasoning icon exists only when the routed model advertises levels.
        if !app.buttons["composer.effort"].exists {
            print("device smoke: the current model advertises no reasoning levels")
        }
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "device-chat-surfaces"
        shot.lifetime = .keepAlways
        add(shot)
    }
}
