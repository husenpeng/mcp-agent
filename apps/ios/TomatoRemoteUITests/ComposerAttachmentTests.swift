//
//  ComposerAttachmentTests.swift
//  TomatoRemoteUITests
//
//  An attachment staged for the next prompt opens from its own chip, before the
//  prompt is sent: documents in QuickLook, photos full screen.
//

import XCTest

final class ComposerAttachmentTests: XCTestCase {
    private func launch(extraArguments: [String] = []) throws -> XCUIApplication {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_PREVIEW_PAIRING", host,
            "-TOMATO_DELAY_OPEN", "2",
            "-TOMATO_OPEN_URL", "tomato://session/s2",
        ] + extraArguments
        app.launch()
        return app
    }

    /// The staged document names itself and opens a local preview, then closes.
    func testStagedDocumentOpensFromItsChip() throws {
        let app = try launch(extraArguments: ["-TOMATO_STAGE_SAMPLE"])
        let chip = app.descendants(matching: .any)["composer.document.preview"].firstMatch
        XCTAssertTrue(chip.waitForExistence(timeout: 30), "the staged document chip never appeared")

        chip.tap()
        let done = app.buttons["完成"].firstMatch
        XCTAssertTrue(done.waitForExistence(timeout: 15), "the staged document did not open")
        XCTAssertTrue(
            app.navigationBars["sample.pdf"].waitForExistence(timeout: 10),
            "the preview is not titled with the file"
        )

        done.tap()
        XCTAssertTrue(done.waitForNonExistence(timeout: 10), "the preview stayed open")
    }

    /// The staged photo's thumbnail opens the picture full screen, then closes.
    func testStagedPhotoOpensFullScreen() throws {
        let app = try launch(extraArguments: ["-TOMATO_STAGE_SAMPLE_PHOTO"])
        let chip = app.descendants(matching: .any)["composer.photo.preview"].firstMatch
        XCTAssertTrue(chip.waitForExistence(timeout: 30), "the staged photo chip never appeared")

        chip.tap()
        let preview = app.descendants(matching: .any)["image.preview"].firstMatch
        XCTAssertTrue(preview.waitForExistence(timeout: 10), "the staged photo did not open")

        app.buttons["image.preview.close"].tap()
        XCTAssertTrue(preview.waitForNonExistence(timeout: 10), "the full-screen photo stayed open")
    }
}
