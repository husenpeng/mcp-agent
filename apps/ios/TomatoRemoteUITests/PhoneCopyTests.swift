//
//  PhoneCopyTests.swift
//  TomatoRemoteUITests
//
//  Tomato Phone's message bubbles and history rows expose copy actions.
//

import XCTest

final class PhoneCopyTests: XCTestCase {
    func testPhoneMessageCopies() throws {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS", "-TOMATO_PHONE_TAB",
            "-TOMATO_PREVIEW_PAIRING", host,
        ]
        app.launch()

        app.buttons["phone.conversations"].tap()
        let seeded = app.buttons["phone.conversation.row.test-copy"]
        XCTAssertTrue(seeded.waitForExistence(timeout: 10), "the seeded conversation is missing")
        seeded.tap()
        sleep(1)

        let message = app.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier BEGINSWITH 'phone.message.user.'"))
            .firstMatch
        guard message.waitForExistence(timeout: 10) else {
            throw XCTSkip("the device has no stored phone messages")
        }
        message.press(forDuration: 1.0)
        let copy = app.buttons["复制"]
        XCTAssertTrue(copy.waitForExistence(timeout: 5), "the message copy action is missing")
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "phone-message-copy"
        shot.lifetime = .keepAlways
        add(shot)
        copy.tap()

        app.buttons["phone.conversations"].tap()
        let row = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'phone.conversation.row.'")).firstMatch
        if row.waitForExistence(timeout: 5) {
            row.press(forDuration: 1.0)
            XCTAssertTrue(app.buttons["复制消息"].waitForExistence(timeout: 5), "the history copy action is missing")
            app.buttons["复制消息"].tap()
        }
        app.buttons["关闭"].tap()
    }
}
