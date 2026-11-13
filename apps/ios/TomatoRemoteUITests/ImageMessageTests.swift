//
//  ImageMessageTests.swift
//  TomatoRemoteUITests
//
//  A prompt that carried a photo shows the picture in the person's own message,
//  not a placeholder line of text, and the picture opens full screen.
//
//  The bytes live on the Host, so the run pairs for real: unlike the fixture
//  tests, a preview cookie cannot read a conversation that already has history.
//  Set TOMATO_E2E_BASE, TOMATO_E2E_TOKEN, and TOMATO_UITEST_IMAGE_SESSION to a
//  Session whose log holds at least one image prompt.
//

import XCTest

final class ImageMessageTests: XCTestCase {
    private func host() throws -> (base: String, token: String) {
        let environment = ProcessInfo.processInfo.environment
        guard let base = environment["TOMATO_E2E_BASE"], !base.isEmpty,
              let token = environment["TOMATO_E2E_TOKEN"], !token.isEmpty
        else {
            throw XCTSkip("TOMATO_E2E_BASE and TOMATO_E2E_TOKEN are not set")
        }
        return (base, token)
    }

    /// A conversation that holds at least one photo prompt.
    private func session() throws -> String {
        guard let value = ProcessInfo.processInfo.environment["TOMATO_UITEST_IMAGE_SESSION"], !value.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_IMAGE_SESSION is not set")
        }
        return value
    }

    private func launch() throws -> XCUIApplication {
        let (base, token) = try host()
        let id = try session()
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_PAIR_BASE", base, "-TOMATO_PAIR_TOKEN", token,
            // Pairing and the first list read both have to land before the link
            // can resolve the Session it names.
            "-TOMATO_DELAY_OPEN", "5",
            "-TOMATO_OPEN_URL", "tomato://session/\(id)",
        ]
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

    private func attach(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }

    func testPhotoPromptShowsPictureAndOpensFullScreen() throws {
        let app = try launch()
        let any = app.descendants(matching: .any)

        // The named Session ends with its photo prompt, so the row is on the
        // opening screen; a system scroll gesture would move the app between
        // scenes instead of the transcript.
        let field = any["composer.input"].firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 40), "the conversation did not open")
        let photo = any["chat.row.user.image"].firstMatch
        XCTAssertTrue(photo.waitForExistence(timeout: 30), "the photo prompt never drew a picture")
        attach(app, "01-photo-in-message")

        // A photo is never worded as a placeholder line inside the message.
        XCTAssertFalse(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "［图片］")).firstMatch.exists,
            "the transcript still words the photo as a placeholder"
        )

        // The words of the same message stay in their own bubble beside the photo.
        let row = any["chat.row.user"].firstMatch
        XCTAssertTrue(row.exists, "the photo prompt has no user row")
        XCTAssertTrue(
            row.staticTexts.firstMatch.waitForExistence(timeout: 10),
            "the message's own words are missing next to its photo"
        )

        photo.tap()
        XCTAssertTrue(any["image.preview"].waitForExistence(timeout: 10), "the photo did not open full screen")
        attach(app, "02-photo-full-screen")
        app.buttons["image.preview.close"].tap()
        XCTAssertTrue(any["image.preview"].waitForNonExistence(timeout: 10), "the full-screen photo stayed open")
    }
}
