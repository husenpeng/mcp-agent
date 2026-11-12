//
//  CrashGuard.swift
//  Tomato Remote
//
//  What the app leaves behind when it dies without saying goodbye.
//
//  A watchdog kill is a `SIGKILL` no handler can see, so this guard covers the
//  other half: an uncaught Objective-C exception, or a signal such as `SIGSEGV`
//  or `SIGABRT`. The record is written before the process ends and reported on
//  the next launch; the hang watchdog and MetricKit cover the watchdog case.
//

import Darwin
import Foundation

/// One abnormal end of a previous run.
struct CrashRecord: Codable, Equatable, Sendable {
    /// Moment the handler ran.
    let date: Date
    /// How the process ended, e.g. `信号 SIGSEGV (11)`.
    let kind: String
    /// Exception reason or signal sentence.
    let message: String
    /// Symbolicated-looking frames the handler could read.
    let stack: [String]

    /// One-line description for the reader.
    var summary: String {
        "\(kind)：\(message)"
    }
}

/// Catches the failures a process can still observe, and recovers them next time.
enum CrashGuard {
    private static let lock = NSLock()
    private static var installed = false
    /// Set while a handler writes, so a crash inside the crash handler does not
    /// recurse.
    private static var recording = false

    private static var recordURL: URL {
        DiagnosticsStorage.directory.appendingPathComponent("crash.json")
    }

    /// Install the exception and signal handlers, then report the previous run.
    ///
    /// Idempotent: only the first call takes effect.
    static func install() {
        lock.lock()
        guard !installed else {
            lock.unlock()
            return
        }
        installed = true
        lock.unlock()

        NSSetUncaughtExceptionHandler { exception in
            CrashGuard.record(
                kind: "异常 \(exception.name.rawValue)",
                message: exception.reason ?? "未命名异常",
                stack: exception.callStackSymbols
            )
        }
        let handler: @convention(c) (Int32) -> Void = { number in
            CrashGuard.record(
                kind: "信号 \(crashSignalName(number))",
                message: "进程收到 \(crashSignalName(number))",
                stack: Thread.callStackSymbols
            )
            Darwin.signal(number, SIG_DFL)
            Darwin.raise(number)
        }
        for number in [SIGABRT, SIGSEGV, SIGBUS, SIGILL, SIGFPE, SIGTRAP] {
            _ = Darwin.signal(number, handler)
        }
    }

    /// Read and remove the record the previous run left.
    /// @returns the record, or nil when the last run ended normally.
    static func previousRecord() -> CrashRecord? {
        guard let data = try? Data(contentsOf: recordURL),
              let record = try? JSONDecoder().decode(CrashRecord.self, from: data)
        else { return nil }
        try? FileManager.default.removeItem(at: recordURL)
        return record
    }

    /// Write one record to disk. Called from an exception handler or a signal
    /// handler, where allocation is tolerated but recursion is not.
    /// - Parameters:
    ///   - kind: what ended the process.
    ///   - message: one sentence with the reason.
    ///   - stack: frames to keep, most recent first.
    fileprivate static func record(kind: String, message: String, stack: [String]) {
        lock.lock()
        guard !recording else {
            lock.unlock()
            return
        }
        recording = true
        lock.unlock()

        let record = CrashRecord(
            date: Date(),
            kind: kind,
            message: message,
            stack: Array(stack.prefix(40))
        )
        if let data = try? JSONEncoder().encode(record) {
            try? data.write(to: recordURL, options: .atomic)
        }
    }

    #if DEBUG
        /// End the process with `SIGSEGV` on purpose, so a test can prove the
        /// next launch reports the record. Never reachable from a release build.
        static func selfTest() {
            raise(SIGSEGV)
        }
    #endif
}

/// Name of one termination signal.
/// - Parameter number: signal number the runtime delivered.
/// - Returns: e.g. `SIGSEGV (11)`.
private func crashSignalName(_ number: Int32) -> String {
    switch number {
    case SIGABRT: "SIGABRT (6)"
    case SIGSEGV: "SIGSEGV (11)"
    case SIGBUS: "SIGBUS (10)"
    case SIGILL: "SIGILL (4)"
    case SIGFPE: "SIGFPE (8)"
    case SIGTRAP: "SIGTRAP (5)"
    default: "signal \(number)"
    }
}
