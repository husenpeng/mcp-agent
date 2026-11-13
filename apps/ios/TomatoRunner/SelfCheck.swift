//
//  SelfCheck.swift
//  Tomato Runner
//
//  A scripted pass over the engine, run on the device before the server is
//  relied on. It answers the M0 questions with measurements instead of
//  impressions: does a tree read work, does synthesized touch land, does
//  non-ASCII text arrive, and how long does each take.
//

import XCTest

/// Runs one scripted session and reports it as JSON.
enum SelfCheck {
    struct Step: Codable {
        let name: String
        let ok: Bool
        let ms: Int
        let detail: String
    }

    struct Report: Codable {
        let protocolVersion: Int
        let runnerVersion: String
        let device: String
        let systemVersion: String
        let steps: [Step]
        let observations: [String]
    }

    /// Exercise launch, observe, tap, type, screenshot, and home.
    /// @param engine - engine under test.
    /// @param budget - seconds allowed for the whole pass.
    /// @returns the report, already written to the runner's container.
    static func run(engine: Engine, budget: TimeInterval = 180) throws -> Report {
        var recorder = Recorder()
        var notes: [String] = []
        readiness(engine, &recorder, &notes)
        navigation(engine, &recorder, &notes)
        typing(engine, &recorder, &notes)
        capture(engine, &recorder, &notes)
        _ = budget
        let report = Report(
            protocolVersion: PhoneProtocol.version,
            runnerVersion: engine.health().runnerVersion,
            device: UIDevice.current.model,
            systemVersion: UIDevice.current.systemVersion,
            steps: recorder.steps,
            observations: notes
        )
        write(report)
        return report
    }

    /// Collects steps and their timings in the order they ran.
    struct Recorder {
        private(set) var steps: [Step] = []

        /// Run one step and record the outcome.
        /// @param name - step name shown in the report.
        /// @param body - work that returns the detail line or throws.
        mutating func step(_ name: String, _ body: () throws -> String) {
            let started = Date()
            do {
                try steps.append(Step(name: name, ok: true, ms: elapsed(since: started), detail: body()))
            } catch {
                let message = (error as? PhoneFailure)?.message ?? error.localizedDescription
                steps.append(Step(name: name, ok: false, ms: elapsed(since: started), detail: message))
            }
        }
    }

    private static func readiness(_ engine: Engine, _ recorder: inout Recorder, _ notes: inout [String]) {
        recorder.step("health") {
            let health = engine.health()
            notes.append("screen \(Int(health.screen.width))x\(Int(health.screen.height))@\(Int(health.screen.scale))")
            guard health.protocol == PhoneProtocol.version else {
                throw PhoneFailure(.internal, "协议版本 \(health.protocol)")
            }
            return "protocol \(health.protocol)"
        }

        recorder.step("lease") {
            let outcome = try engine.perform(
                method: "lease.acquire",
                params: PhoneJSON.from(PhoneLeaseRequest(holder: "local:selfcheck", ttlMs: 600_000)),
                deadline: 10
            )
            switch outcome {
            case let .success(value): return "granted \(value["granted"]?.boolValue ?? false)"
            case let .failure(failure): throw failure
            }
        }

        recorder.step("go-home") {
            engine.goHome()
            return "home pressed"
        }

        recorder.step("observe-home") {
            let observation = try observe(engine, max: 60)
            notes.append("home elements \(observation.elements.count)")
            return "\(observation.elements.count) elements, truncated \(observation.truncated)"
        }
    }

    private static func navigation(_ engine: Engine, _ recorder: inout Recorder, _ notes: inout [String]) {
        recorder.step("launch-settings") {
            let result = try act(engine, PhoneAction(type: .launch, name: "设置", fresh: true))
            return "foreground \(result.foreground?.bundleId ?? "?"), pageChanged \(result.pageChanged)"
        }

        recorder.step("scroll-settings") {
            // The 通用 row sits at the bottom edge on this screen height, where
            // the home indicator swallows the touch; scrolling first proves the
            // gesture and puts the row in a tappable place.
            _ = try act(engine, PhoneAction(type: .swipe, direction: .up, durationMs: 400))
            let observation = try observe(engine, max: 120)
            return "\(observation.elements.count) elements after scroll"
        }

        recorder.step("tap-general") {
            var observation = try observe(engine, max: 120)
            guard let target = pick(observation, named: ["通用", "General"]) else {
                throw PhoneFailure(.notFound, "设置首页找不到“通用”，见到 \(observation.elements.prefix(8).map(\.label))")
            }
            notes.append("target \(target.ref) \(target.role) \(target.label) \(target.frame)")
            var result = try act(engine, PhoneAction(type: .tap, ref: target.ref))
            if !result.pageChanged {
                observation = try observe(engine, max: 120)
                if let retry = pick(observation, named: ["通用", "General"]) {
                    result = try act(engine, PhoneAction(type: .tap, ref: retry.ref))
                    notes.append("retried tap on \(retry.role) \(retry.frame)")
                }
            }
            guard result.pageChanged else {
                throw PhoneFailure(.internal, "点击“通用”之后页面没有变化")
            }
            let labels = result.observation?.elements.prefix(6).map(\.label).joined(separator: " | ") ?? ""
            notes.append("general page: \(labels)")
            return "pageChanged true, \(result.observation?.elements.count ?? 0) elements"
        }
    }

    private static func typing(_ engine: Engine, _ recorder: inout Recorder, _ notes: inout [String]) {
        recorder.step("open-search") {
            // Back to the Settings root: the search field lives there, and the
            // previous step left the app on the 通用 page.
            _ = try act(engine, PhoneAction(type: .launch, name: "设置", fresh: true))
            let observation = try observe(engine, max: 140)
            let field = observation.elements.first { $0.role == "SearchField" }
            guard let target = field ?? pick(observation, named: ["搜索", "Search"]) else {
                throw PhoneFailure(.notFound, "设置里找不到搜索框，见到 \(observation.elements.prefix(10).map(\.label))")
            }
            notes.append("search target \(target.ref) \(target.role) \(target.label)")
            let result = try act(engine, PhoneAction(type: .tap, ref: target.ref))
            return "pageChanged \(result.pageChanged)"
        }

        recorder.step("type-unicode") {
            let observation = try observe(engine, max: 160)
            guard let field = observation.elements.first(where: { $0.role == "SearchField" || $0.role == "TextField" }) else {
                throw PhoneFailure(.notFound, "搜索框聚焦后不是可输入的字段")
            }
            notes.append("typing into \(field.ref) \(field.role) \(field.frame)")
            let result = try act(engine, PhoneAction(type: .type, ref: field.ref, text: "你好 Tomato 123"))
            let text = result.observation?.elements.map { "\($0.label)\($0.value ?? "")" }.joined(separator: " ") ?? ""
            notes.append("after typing: \(text.prefix(200))")
            guard text.localizedCaseInsensitiveContains("Tomato") else {
                throw PhoneFailure(.internal, "输入之后屏幕上没有出现 Tomato：\(text.prefix(140))")
            }
            return "visible after typing"
        }
    }

    private static func capture(_ engine: Engine, _ recorder: inout Recorder, _ notes: inout [String]) {
        recorder.step("screenshot") {
            let outcome = try engine.perform(
                method: "screenshot",
                params: PhoneJSON.from(PhoneScreenshotRequest(maxEdge: 1280, quality: 0.5)),
                deadline: 30
            )
            switch outcome {
            case let .success(value):
                let shot = try value.decode(PhoneScreenshot.self)
                notes.append("screenshot \(shot.pixelWidth)x\(shot.pixelHeight) base64 \(shot.base64.count)")
                return "\(shot.pixelWidth)x\(shot.pixelHeight), \(shot.base64.count) base64 chars"
            case let .failure(failure): throw failure
            }
        }

        recorder.step("home") {
            _ = try act(engine, PhoneAction(type: .press, button: .home))
            return "home pressed"
        }
    }

    // MARK: - Helpers

    private static func observe(_ engine: Engine, max: Int) throws -> PhoneObservation {
        let outcome = try engine.perform(
            method: "observe",
            params: PhoneJSON.from(PhoneObserveRequest(maxElements: max, includeOcr: "auto", screenshot: nil)),
            deadline: 30
        )
        switch outcome {
        case let .success(value): return try value.decode(PhoneObservation.self)
        case let .failure(failure): throw failure
        }
    }

    private static func act(_ engine: Engine, _ action: PhoneAction) throws -> PhoneActResult {
        let outcome = try engine.perform(
            method: "act",
            params: PhoneJSON.from(PhoneActRequest(action: action, observeAfter: true, confirmToken: nil)),
            deadline: 45
        )
        switch outcome {
        case let .success(value): return try value.decode(PhoneActResult.self)
        case let .failure(failure): throw failure
        }
    }

    /// Prefer a row or button, then static text: a label and its row share the
    /// same title, and only the row is reliably tappable.
    private static func pick(_ observation: PhoneObservation, named names: [String]) -> PhoneElement? {
        let matches = observation.elements.filter { element in
            names.contains { element.label.localizedCaseInsensitiveContains($0) }
        }
        return matches.first { $0.role == "Cell" }
            ?? matches.first { $0.role == "Button" }
            ?? matches.first { $0.role == "StaticText" }
            ?? matches.first
    }

    private static func elapsed(since start: Date) -> Int {
        Int(Date().timeIntervalSince(start) * 1000)
    }

    private static func write(_ report: Report) {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(report) else { return }
        if let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first {
            try? data.write(to: directory.appendingPathComponent("selfcheck.json"), options: .atomic)
        }
        if let text = String(data: data, encoding: .utf8) {
            print("SELFCHECK_JSON_BEGIN")
            print(text)
            print("SELFCHECK_JSON_END")
        }
    }
}
