//
//  AppLog.swift
//  Tomato Remote
//
//  One diagnostic log for the whole app: unified logging for Console.app, a
//  bounded ring buffer for the in-app reader, and a file that survives a crash.
//
//  The log is written from every thread. Messages never carry a credential,
//  a prompt body, or a cookie; a Host address and an endpoint name are enough
//  to place a failure, and the export leaves the device only when its owner
//  shares it.
//

import Foundation
import os
import UIKit

/// Severity of one diagnostic record, ordered from chatty to fatal.
enum AppLogLevel: String, CaseIterable, Codable, Sendable, Comparable {
    case debug
    case info
    case notice
    case warning
    case error
    case fault

    /// Label the log reader shows.
    var label: String {
        switch self {
        case .debug: "调试"
        case .info: "信息"
        case .notice: "提示"
        case .warning: "警告"
        case .error: "错误"
        case .fault: "故障"
        }
    }

    /// One-character tag the file line uses.
    var tag: String {
        switch self {
        case .debug: "D"
        case .info: "I"
        case .notice: "N"
        case .warning: "W"
        case .error: "E"
        case .fault: "F"
        }
    }

    private var rank: Int {
        switch self {
        case .debug: 0
        case .info: 1
        case .notice: 2
        case .warning: 3
        case .error: 4
        case .fault: 5
        }
    }

    static func < (lhs: AppLogLevel, rhs: AppLogLevel) -> Bool {
        lhs.rank < rhs.rank
    }

    /// Level that keeps the same severity in Console.app.
    var osLogType: OSLogType {
        switch self {
        case .debug: .debug
        case .info: .info
        case .notice: .default
        case .warning: .default
        case .error: .error
        case .fault: .fault
        }
    }
}

/// Subsystem a record belongs to, so the reader can narrow a problem down.
enum AppLogCategory: String, CaseIterable, Codable, Sendable {
    case app
    case ui
    case network
    case stream
    case session
    case chat
    case model
    case diagnostics
    case crash

    var label: String {
        switch self {
        case .app: "启动"
        case .ui: "界面"
        case .network: "网络"
        case .stream: "事件流"
        case .session: "会话"
        case .chat: "对话"
        case .model: "模型"
        case .diagnostics: "诊断"
        case .crash: "崩溃"
        }
    }
}

/// One record the reader and the exported file show.
struct AppLogEntry: Identifiable, Equatable, Sendable {
    let id: UInt64
    let date: Date
    let level: AppLogLevel
    let category: AppLogCategory
    let message: String
    let detail: String?

    /// `yyyy-MM-dd HH:mm:ss.SSS`, formatted when a reader or the file needs it.
    ///
    /// Formatting during `record` cost a first-use ICU initialization on the
    /// caller's thread — at launch, the main thread. The file is written on the
    /// log queue and rows format as they appear, so both pay it off the launch.
    var timestamp: String {
        LogClock.text(for: date)
    }

    /// One line for the file and the exported report.
    var line: String {
        var text = "\(timestamp) \(level.tag) \(category.rawValue) \(message)"
        if let detail, !detail.isEmpty {
            text += " | \(detail)"
        }
        return text
    }

    /// Clock part shown in the reader's row.
    var clock: String {
        String(timestamp.suffix(12))
    }
}

/// Shared timestamp formatter for log records.
///
/// `DateFormatter` is not thread-safe, and the log is written from every thread
/// while the reader formats on the main actor, so both go through one lock.
private enum LogClock {
    private static let lock = NSLock()
    private static let formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"
        return formatter
    }()

    /// Format one moment for a log record.
    /// - Parameter date: moment the record was made.
    /// - Returns: `yyyy-MM-dd HH:mm:ss.SSS` in the device time zone.
    static func text(for date: Date) -> String {
        lock.lock()
        defer { lock.unlock() }
        return formatter.string(from: date)
    }
}

/// Process-wide log sink.
///
/// `record` may be called from any thread and never blocks on the UI. The
/// published `entries` array is replaced only on the main actor, at most a few
/// times per second, so a burst of network frames does not re-diff the reader.
final class AppLog: ObservableObject, @unchecked Sendable {
    static let shared = AppLog()

    /// Records the reader keeps. A long session's tail matters more than its
    /// first minute, so the oldest entries fall off first.
    static let capacity = 3000
    /// Characters kept from one detail, so a stack or JSON body cannot crowd
    /// out the rest of the log.
    static let detailLimit = 2000

    /// Entries this run produced, oldest first. Main-actor only.
    @Published private(set) var entries: [AppLogEntry] = []
    /// Increases whenever `entries` changed.
    @Published private(set) var revision = 0
    /// Crash the previous run left behind, reported once on launch.
    @Published private(set) var lastCrash: CrashRecord?
    /// One line describing the build and the paired Host. Main-actor only.
    @Published private(set) var environment = ""
    /// Paired Host root, or a sentence saying none is paired. Main-actor only.
    @Published private(set) var host = "未配对"

    private let lock = NSLock()
    private var buffer: [AppLogEntry] = []
    private var nextId: UInt64 = 1
    private var publishScheduled = false
    /// Screen on top; see `screen(_:)`.
    private var name = "启动"
    /// Step inside that screen; see `mark(_:)`.
    private var operation = ""

    private static let loggers: [AppLogCategory: Logger] = Dictionary(
        uniqueKeysWithValues: AppLogCategory.allCases.map {
            ($0, Logger(subsystem: "ai.tomato.remote", category: $0.rawValue))
        }
    )

    private init() {}

    // MARK: Writing

    /// Append one record. Safe from any thread.
    /// - Parameters:
    ///   - level: severity shown and filtered by.
    ///   - category: subsystem the record belongs to.
    ///   - message: short, already-redacted sentence.
    ///   - detail: optional context, truncated to `detailLimit`.
    func record(_ level: AppLogLevel, _ category: AppLogCategory, _ message: String, detail: String? = nil) {
        let now = Date()
        let trimmedDetail = detail.map { text in
            text.count > Self.detailLimit ? String(text.prefix(Self.detailLimit)) + "…" : text
        }
        let entry: AppLogEntry
        lock.lock()
        entry = AppLogEntry(
            id: nextId,
            date: now,
            level: level,
            category: category,
            message: message,
            detail: trimmedDetail
        )
        nextId += 1
        buffer.append(entry)
        if buffer.count > Self.capacity {
            buffer.removeFirst(buffer.count - Self.capacity)
        }
        lock.unlock()

        var console = message
        if let trimmedDetail, !trimmedDetail.isEmpty {
            console += " | " + trimmedDetail
        }
        Self.loggers[category]?.log(level: level.osLogType, "\(console, privacy: .public)")
        LogFileWriter.append(entry)
        schedulePublish()
    }

    /// Say what the main thread is doing, for the hang watchdog's report.
    /// - Parameter activity: short description of the current step.
    func mark(_ activity: String) {
        lock.lock()
        operation = activity
        let screen = name
        lock.unlock()
        // The run log is asynchronous and a watchdog kill loses its tail; this
        // one line is written before the step begins so the next launch can
        // name the screen that hung.
        LastActivity.record("\(screen) · \(activity)")
    }

    /// Say which screen is on top. A background refresh from another screen no
    /// longer overwrites the screen a hitch belongs to.
    /// - Parameter name: short screen label, such as `会话` or `对话 s1`.
    func screen(_ name: String) {
        lock.lock()
        self.name = name
        operation = ""
        lock.unlock()
        LastActivity.record(name)
    }

    /// Screen and step the main thread last reported.
    var currentActivity: String {
        lock.lock()
        defer { lock.unlock() }
        guard !operation.isEmpty else { return name }
        return name + " · " + operation
    }

    /// Publish the buffer to the reader at a readable rate; the reader's own
    /// hitches must not feed back into another publish every quarter second.
    private func schedulePublish() {
        lock.lock()
        if publishScheduled {
            lock.unlock()
            return
        }
        publishScheduled = true
        lock.unlock()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { [weak self] in
            guard let self else { return }
            lock.lock()
            let snapshot = buffer
            publishScheduled = false
            lock.unlock()
            entries = snapshot
            revision += 1
        }
    }

    // MARK: Main-actor state

    /// Record the build and the paired Host once the app knows both.
    /// - Parameter host: paired Host root, or a sentence saying none is paired.
    @MainActor
    func recordEnvironment(host label: String) {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "?"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "?"
        let device = UIDevice.current
        environment = "v\(version) (\(build)) · iOS \(device.systemVersion) · \(device.model)"
        host = label
        record(.info, .app, "环境", detail: "\(environment) · Host \(label)")
    }

    /// Attach the crash the previous run left, once per launch.
    /// - Parameter crash: what the crash guard recovered.
    @MainActor
    func notePreviousCrash(_ crash: CrashRecord) {
        lastCrash = crash
        record(.fault, .crash, "上次运行异常结束", detail: crash.summary)
    }

    // MARK: Reading and export

    /// Drop this run's records from memory and from the current log file.
    @MainActor
    func clear() {
        lock.lock()
        buffer.removeAll(keepingCapacity: true)
        lock.unlock()
        entries = []
        revision += 1
        LogFileWriter.clearCurrent()
    }

    /// Human-readable report of this run, the previous run's tail, and the last
    /// crash.
    /// - Returns: file URL in the temporary directory, or nil when it cannot be
    ///   written.
    @MainActor
    func exportFile() -> URL? {
        let text = exportText()
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyyMMdd-HHmmss"
        let name = "TomatoRemote-logs-\(formatter.string(from: Date())).txt"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(name)
        do {
            try text.write(to: url, atomically: true, encoding: .utf8)
            return url
        } catch {
            record(.error, .diagnostics, "导出日志失败", detail: error.localizedDescription)
            return nil
        }
    }

    /// The same report `exportFile` writes, for the pasteboard.
    @MainActor
    func exportText() -> String {
        var parts: [String] = []
        parts.append("Tomato Remote 运行日志")
        parts.append("导出时间：\(LogClock.text(for: Date()))")
        parts.append("环境：\(environment.isEmpty ? "尚未记录" : environment)")
        parts.append("内存：\(MemoryFootprint.text())")
        if let lastCrash {
            parts.append("上次崩溃：\(LogClock.text(for: lastCrash.date)) · \(lastCrash.summary)")
            parts.append(lastCrash.stack.prefix(20).joined(separator: "\n"))
        }
        parts.append("— 本次运行 —")
        parts.append(entries.map(\.line).joined(separator: "\n"))
        let previous = LogFileWriter.tailText(limit: 400)
        if !previous.isEmpty {
            parts.append("— 上次运行（尾部 400 行）—")
            parts.append(previous)
        }
        return parts.joined(separator: "\n\n")
    }

    /// Previous run's tail, for the reader's "上次运行" tab.
    /// - Parameter limit: lines kept.
    /// - Returns: raw lines, oldest first.
    func previousRunText(limit: Int = 400) -> String {
        LogFileWriter.tailText(limit: limit)
    }
}

// MARK: - Convenience

extension AppLog {
    static func debug(_ category: AppLogCategory, _ message: String, detail: String? = nil) {
        shared.record(.debug, category, message, detail: detail)
    }

    static func info(_ category: AppLogCategory, _ message: String, detail: String? = nil) {
        shared.record(.info, category, message, detail: detail)
    }

    static func notice(_ category: AppLogCategory, _ message: String, detail: String? = nil) {
        shared.record(.notice, category, message, detail: detail)
    }

    static func warning(_ category: AppLogCategory, _ message: String, detail: String? = nil) {
        shared.record(.warning, category, message, detail: detail)
    }

    static func error(_ category: AppLogCategory, _ message: String, detail: String? = nil) {
        shared.record(.error, category, message, detail: detail)
    }

    static func fault(_ category: AppLogCategory, _ message: String, detail: String? = nil) {
        shared.record(.fault, category, message, detail: detail)
    }

    /// Describe what the main thread is working on.
    /// - Parameter activity: short, stable phrase such as "会话列表 · 刷新".
    static func mark(_ activity: String) {
        shared.mark(activity)
    }

    /// Record the screen on top.
    /// - Parameter name: short screen label, such as "会话" or "对话 s1".
    static func screen(_ name: String) {
        shared.screen(name)
    }
}
