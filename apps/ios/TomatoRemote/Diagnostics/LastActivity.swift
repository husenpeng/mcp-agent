//
//  LastActivity.swift
//  Tomato Remote
//
//  The screen and step the main thread last reported, written synchronously so a
//  watchdog kill leaves a clue where the asynchronous run log cannot.
//

import Foundation

/// One-line record of the app's last screen or step.
enum LastActivity {
    private static let fileName = "last-activity.txt"
    private static let previousName = "last-activity.previous.txt"

    /// Write one line now, replacing the previous one.
    /// - Parameters:
    ///   - label: short screen and step, such as `会话 · 刷新列表`.
    ///   - folder: directory that holds the record; tests use a disposable one.
    static func record(_ label: String, in folder: URL = DiagnosticsStorage.directory) {
        let stamp = ISO8601DateFormatter().string(from: .now)
        let line = "\(stamp)\t\(label)\n"
        try? Data(line.utf8).write(to: folder.appendingPathComponent(fileName), options: .atomic)
    }

    /// Archive the record the previous run left and return it.
    /// - Parameter folder: directory that holds the record.
    /// - Returns: the previous line, or nil when the previous run left none.
    static func begin(in folder: URL = DiagnosticsStorage.directory) -> String? {
        let current = folder.appendingPathComponent(fileName)
        guard let data = try? Data(contentsOf: current), !data.isEmpty,
              let line = String(data: data, encoding: .utf8)
        else { return nil }
        try? data.write(to: folder.appendingPathComponent(previousName), options: .atomic)
        return line.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// The line the current run has written last.
    /// - Parameter folder: directory that holds the record.
    /// - Returns: the current line, or nil before the first record.
    static func current(in folder: URL = DiagnosticsStorage.directory) -> String? {
        guard let data = try? Data(contentsOf: folder.appendingPathComponent(fileName)),
              let line = String(data: data, encoding: .utf8)
        else { return nil }
        return line.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
