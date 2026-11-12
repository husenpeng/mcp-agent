//
//  Probe.swift
//  Tomato Runner
//
//  Isolates whether synthesized touch reaches an application: launch Settings,
//  tap the first tappable label by its dump frame, and read the screen again.
//

import XCTest

/// Touch-synthesis probe.
enum Probe {
    static func run() -> [String: String] {
        var report: [String: String] = [:]
        let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
        settings.launch()
        report["afterLaunch"] = snapshotSummary(settings)
        guard let target = firstButton(in: settings) else {
            report["target"] = "none"
            return report
        }
        report["target"] = "\(target.role) \(target.label) \(target.frame)"
        let started = Date()
        do {
            try Input.tap(at: target.frame.center)
            report["tap"] = "ok \(Int(Date().timeIntervalSince(started) * 1000))ms"
        } catch {
            report["tap"] = "threw \(error.localizedDescription)"
        }
        Thread.sleep(forTimeInterval: 1.0)
        report["afterTap"] = snapshotSummary(settings)
        return report
    }

    private static func snapshotSummary(_ app: XCUIApplication) -> String {
        let snapshot = SnapshotReader.read(app: app, maxElements: 200)
        let labels = snapshot.observation.elements.prefix(6).map { "\($0.role):\($0.label)" }.joined(separator: " | ")
        return "\(snapshot.observation.elements.count) elements :: \(labels)"
    }

    private static func firstButton(in app: XCUIApplication) -> SnapshotTarget? {
        let snapshot = SnapshotReader.read(app: app, maxElements: 200)
        return snapshot.observation.elements
            .first { $0.role == "Cell" || $0.role == "Button" }
            .flatMap { snapshot.targets[$0.ref] }
    }
}
