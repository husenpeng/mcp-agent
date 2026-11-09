//
//  PairingKeyboardTests.swift
//  TomatoRemoteUITests
//
//  The pairing screen must let the user put the keyboard away without hunting
//  for a button, because the whole screen is one long paste.
//

import XCTest

final class PairingKeyboardTests: XCTestCase {
    /// Dragging down anywhere on the pairing screen closes the keyboard.
    func testSwipeDownDismissesKeyboard() {
        let app = XCUIApplication()
        app.launch()

        let linkField = app.textFields["pairing.link"]
        XCTAssertTrue(linkField.waitForExistence(timeout: 20), "pairing screen did not appear")
        linkField.tap()
        XCTAssertTrue(app.keyboards.element.waitForExistence(timeout: 10), "keyboard did not open")

        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.45))
            .press(forDuration: 0.05,
                   thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.9)))

        let gone = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"),
            object: app.keyboards.element
        )
        XCTAssertEqual(XCTWaiter().wait(for: [gone], timeout: 5), .completed, "keyboard stayed open")
    }

    /// A pasted link with a token fills the token field, which is what keeps the
    /// connect action enabled.
    func testPastedTokenFillsTheTokenField() {
        UIPasteboard.general.string = "http://example.invalid/?token=abcdef123"
        let app = XCUIApplication()
        app.launch()

        let linkField = app.textFields["pairing.link"]
        XCTAssertTrue(linkField.waitForExistence(timeout: 20))
        linkField.tap()
        linkField.typeText("http://example.invalid/?token=abcdef123")

        let tokenField = app.textFields["pairing.token"]
        XCTAssertTrue(tokenField.waitForExistence(timeout: 5))
        XCTAssertEqual(tokenField.value as? String, "abcdef123")
    }
}
