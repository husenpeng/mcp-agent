//
//  ModelSwitchTests.swift
//  TomatoRemoteUITests
//
//  The model and reasoning chips are two separate choices: each opens its own
//  sheet, and a selection there reaches the Host and comes back on the chip.
//  The Host advertises which models carry reasoning levels, so the run picks a
//  model the deployment actually routes.
//

import XCTest

final class ModelSwitchTests: XCTestCase {
    /// Models the run switches between; both must advertise reasoning levels on
    /// the test Host, because the second half of the test needs them.
    private static let modelsWithLevels = ["DeepSeek-V4.1-Flash-1017", "DeepSeek-V4-Pro"]
    private static let provider = "claude-sonnet-5-5"
    /// Levels the run switches between, so a re-run still changes something.
    private static let levels = ["high", "max"]

    private func host() throws -> String {
        guard let value = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !value.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        return value
    }

    private func session() throws -> String {
        guard let value = ProcessInfo.processInfo.environment["TOMATO_UITEST_SESSION"], !value.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_SESSION is not set")
        }
        return value
    }

    private func launch() throws -> XCUIApplication {
        let base = try host()
        let id = try session()
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_PREVIEW_PAIRING", base,
            "-TOMATO_OPEN_URL", "tomato://session/\(id)",
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

    /// The wording the app shows for one Host level id.
    /// @param level - adapter-owned effort id.
    /// @returns the chip's expected value.
    private func chineseLabel(for level: String) -> String {
        level == "max" ? "最大" : "高"
    }

    func testModelAndReasoningSwitchSeparately() throws {
        let app = try launch()
        let any = app.descendants(matching: .any)

        let modelChip = any["composer.model"].firstMatch
        XCTAssertTrue(modelChip.waitForExistence(timeout: 30), "the composer model chip never appeared")
        let effortChip = any["composer.effort"].firstMatch
        XCTAssertTrue(effortChip.waitForExistence(timeout: 10), "the reasoning chip never appeared")
        attach(app, "01-composer-chips")

        // The model sheet lists models and nothing else.
        let before = modelChip.value as? String
        let targetModel = Self.modelsWithLevels.first { $0 != before } ?? Self.modelsWithLevels[0]
        modelChip.tap()
        XCTAssertTrue(app.staticTexts["选择模型"].waitForExistence(timeout: 10), "the model sheet did not open")
        XCTAssertFalse(any["reasoning.row.high"].firstMatch.exists, "the model sheet carried reasoning rows")
        attach(app, "02-model-sheet")

        // Scroll to a model that advertises reasoning levels and pick it.
        let target = any["model.row.\(Self.provider).\(targetModel)"].firstMatch
        var swipes = 0
        while !(target.exists && target.isHittable), swipes < 12 {
            app.swipeUp()
            swipes += 1
        }
        XCTAssertTrue(target.exists, "the target model never scrolled into view")
        target.tap()
        XCTAssertTrue(app.staticTexts["选择模型"].waitForNonExistence(timeout: 10), "the model sheet stayed open")
        XCTAssertEqual(modelChip.value as? String, targetModel, "the chip did not adopt the switched model")
        attach(app, "03-model-switched")

        // Reasoning has its own sheet, and it lists no models.
        effortChip.tap()
        XCTAssertTrue(
            app.staticTexts["推理等级"].waitForExistence(timeout: 10),
            "the reasoning sheet did not open"
        )
        XCTAssertFalse(
            any["model.row.\(Self.provider).\(targetModel)"].firstMatch.exists,
            "the reasoning sheet carried model rows"
        )
        attach(app, "04-reasoning-sheet")

        let beforeLevel = effortChip.value as? String
        let targetLevel = Self.levels.first { chineseLabel(for: $0) != beforeLevel } ?? Self.levels[0]
        let level = any["reasoning.row.\(targetLevel)"].firstMatch
        XCTAssertTrue(level.waitForExistence(timeout: 10), "the model's advertised level is missing")
        level.tap()
        XCTAssertTrue(app.staticTexts["推理等级"].waitForNonExistence(timeout: 10), "the reasoning sheet stayed open")
        XCTAssertEqual(
            effortChip.value as? String,
            chineseLabel(for: targetLevel),
            "the chip did not adopt the switched level"
        )
        attach(app, "05-reasoning-switched")
    }
}
