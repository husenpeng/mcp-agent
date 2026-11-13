//
//  Log.swift
//  Tomato Runner
//
//  Bounded diagnostics for a process that has no UI. Nothing here records
//  typed text: entries carry labels and lengths, never values.
//

import Foundation

/// In-memory ring buffer shared by the engine and the loopback server.
final class Log: @unchecked Sendable {
    static let shared = Log(capacity: 1000)

    private let capacity: Int
    private let lock = NSLock()
    private var lines: [String] = []
    private let formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    init(capacity: Int) {
        self.capacity = capacity
    }

    /// Append one line, dropping the oldest entry past capacity.
    /// @param message - text without a timestamp.
    func append(_ message: String) {
        let line = "\(formatter.string(from: Date())) \(message)"
        lock.lock()
        lines.append(line)
        if lines.count > capacity {
            lines.removeFirst(lines.count - capacity)
        }
        lock.unlock()
    }

    /// Current entries, oldest first.
    func recent() -> [String] {
        lock.lock()
        defer { lock.unlock() }
        return lines
    }
}
