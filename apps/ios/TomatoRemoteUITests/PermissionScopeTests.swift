//
//  PermissionScopeTests.swift
//  TomatoRemoteUITests
//
//  The conversation's permission chip names the Host's current preset, and a
//  pick submits the same `/permission` command the Web composer uses. Full
//  access still asks for an explicit confirmation on the phone.
//

import XCTest

final class PermissionScopeTests: XCTestCase {
    private func launch() throws -> XCUIApplication {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_PREVIEW_PAIRING", host,
            "-TOMATO_OPEN_URL", "tomato://session/s2",
        ]
        app.launch()
        return app
    }

    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }

    func testPermissionChipSwitchesThroughTheHost() throws {
        let app = try launch()
        let chip = app.buttons["chat.permission"]
        XCTAssertTrue(chip.waitForExistence(timeout: 20), "the permission chip never appeared")
        XCTAssertEqual(chip.value as? String, "工作区内修改", "the chip did not name the Host's preset")
        attach(app, "01-permission-chip")

        chip.tap()
        let full = app.buttons["完全权限"]
        XCTAssertTrue(full.waitForExistence(timeout: 5), "the permission menu is missing full access")
        attach(app, "02-permission-menu")
        full.tap()

        let confirm = app.buttons["启用完全权限"]
        XCTAssertTrue(confirm.waitForExistence(timeout: 5), "full access was not confirmed")
        attach(app, "03-permission-confirm")
        confirm.tap()

        // The switch travels to the Host and back through the projection; give
        // that round trip its own wait instead of reading the chip immediately.
        expectation(for: NSPredicate(format: "value == %@", "完全权限"), evaluatedWith: chip)
        waitForExpectations(timeout: 10)
        attach(app, "04-permission-changed")
    }
}
