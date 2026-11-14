//
//  WorkScopeTests.swift
//  TomatoRemoteUITests
//
//  The conversation's work-scope chip names the folder the Host projects, and
//  the sheet changes that folder through the Host.
//

import XCTest

final class WorkScopeTests: XCTestCase {
    private func launch() -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS",
            "-TOMATO_PREVIEW_PAIRING", "http://127.0.0.1:4402",
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

    /// The chip reads the Host's folder, and applying another path updates it.
    func testWorkScopeChangesThroughTheHost() {
        let app = launch()
        let chip = app.buttons["chat.workScope"]
        XCTAssertTrue(chip.waitForExistence(timeout: 20), "the work-scope chip never appeared")
        XCTAssertEqual(chip.value as? String, "tomato", "the chip did not name the Host's folder")
        attach(app, "01-scope-chip")

        chip.tap()
        let sheet = app.descendants(matching: .any)["scope.sheet"].firstMatch
        XCTAssertTrue(sheet.waitForExistence(timeout: 5), "the scope sheet did not open")
        attach(app, "02-scope-sheet")

        // A folder the Host already knows: one tap picks it, Apply submits it.
        let website = app.buttons["scope.folder./Users/underdog/work/website"]
        XCTAssertTrue(website.waitForExistence(timeout: 5), "the known folder is missing")
        website.tap()
        app.buttons["应用"].tap()
        XCTAssertTrue(sheet.waitForNonExistence(timeout: 10), "the scope sheet stayed open after applying")
        XCTAssertEqual(chip.value as? String, "website", "the chip did not adopt the Host's directory")
        attach(app, "03-scope-changed")

        // A typed path takes the same route through the Host.
        chip.tap()
        XCTAssertTrue(sheet.waitForExistence(timeout: 5))
        let field = app.textFields["scope.input"]
        XCTAssertTrue(field.waitForExistence(timeout: 5), "the path field is missing")
        field.tap()
        field.typeText("/Users/underdog/work/tomato/apps/ios")
        app.buttons["应用"].tap()
        XCTAssertTrue(sheet.waitForNonExistence(timeout: 10), "the typed path kept the sheet open")
        XCTAssertEqual(chip.value as? String, "ios", "the chip did not adopt the typed directory")
        attach(app, "04-scope-typed")
    }
}
