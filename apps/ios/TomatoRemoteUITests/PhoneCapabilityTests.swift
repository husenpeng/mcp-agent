//
//  PhoneCapabilityTests.swift
//  TomatoRemoteUITests
//
//  The capability market offers the shipped catalog, and a skill installs with
//  one tap without any URL entry.
//

import XCTest

final class PhoneCapabilityTests: XCTestCase {
    func testShippedSkillInstallsFromTheMarket() throws {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS", "-TOMATO_PHONE_TAB",
            "-TOMATO_PREVIEW_PAIRING", host,
        ]
        app.launch()

        let market = app.buttons["phone.segment.1"]
        XCTAssertTrue(market.waitForExistence(timeout: 20), "the market segment is missing")
        market.tap()
        let skillTab = app.buttons["market.kind.skill"]
        XCTAssertTrue(skillTab.waitForExistence(timeout: 10), "the skill market tab is missing")
        skillTab.tap()

        let install = app.buttons["market.install.skill.code-review"]
        if install.waitForExistence(timeout: 5) {
            install.tap()
        }
        let gone = expectation(for: NSPredicate(format: "exists == false"), evaluatedWith: install)
        wait(for: [gone], timeout: 8)
        let installedShot = XCTAttachment(screenshot: app.screenshot())
        installedShot.name = "phone-capability-skill-installed"
        installedShot.lifetime = .keepAlways
        add(installedShot)
        let installed = app.descendants(matching: .any)["market.installed.skill.code-review"]
        XCTAssertTrue(installed.exists || app.staticTexts["已安装"].exists, "the shipped skill did not install")

        let mcpTab = app.buttons["market.kind.mcp"]
        mcpTab.tap()
        XCTAssertTrue(app.otherElements["market.recommend.mcp.deepwiki"].waitForExistence(timeout: 5)
            || app.buttons["market.recommend.mcp.deepwiki"].waitForExistence(timeout: 1)
            || app.staticTexts["DeepWiki 仓库文档"].exists)

        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "phone-capability-catalog"
        shot.lifetime = .keepAlways
        add(shot)
    }
}
