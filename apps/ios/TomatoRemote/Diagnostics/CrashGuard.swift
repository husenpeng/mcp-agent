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
//  The signal path allocates nothing, takes no lock, and writes plain bytes with
//  `write(2)`. An earlier version encoded JSON and took an `NSLock` inside the
//  handler; either step can deadlock on corrupted heap state, which turns one
//  crash into a hang the system ends without a report. A signal record therefore
//  names the signal and the time; its stack comes from MetricKit.
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
    /// recurse. Only the exception path takes the lock; the signal path must not.
    private static var recording = false

    private static var recordURL: URL {
        DiagnosticsStorage.directory.appendingPathComponent("crash.txt")
    }

    /// The record an older build wrote as JSON; read once, then removed.
    private static var legacyRecordURL: URL {
        DiagnosticsStorage.directory.appendingPathComponent("crash.json")
    }

    /// File descriptor the signal handler writes to. Opened before any crash so
    /// the handler never touches the filesystem API.
    private static var descriptor: Int32 = -1
    /// What the previous run wrote; read before the descriptor truncates the
    /// file and handed to the caller once the app is on screen.
    private static var previous: CrashRecord?
    /// Scratch bytes for one signal record. Allocated at install so the handler
    /// only writes into existing memory.
    private static let scratch = UnsafeMutablePointer<UInt8>.allocate(capacity: 96)
    private static let prefix = Array("tomato-crash 2\nsignal ".utf8)
    private static let timePrefix = Array("\ntime ".utf8)

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

        _ = recordURL
        // The previous record is read before the handler's file is opened: the
        // open truncates it, and a truncation before the read loses the report
        // that is the whole point of this guard.
        previous = readPrevious()
        openDescriptor()
        // Force the lazy statics the handler touches; their first read would
        // otherwise allocate inside a crashed process.
        _ = prefix.count
        _ = timePrefix.count
        scratch[0] = 0

        NSSetUncaughtExceptionHandler { exception in
            CrashGuard.record(
                kind: "异常 \(exception.name.rawValue)",
                message: exception.reason ?? "未命名异常",
                stack: exception.callStackSymbols
            )
        }
        let handler: @convention(c) (Int32) -> Void = { number in
            CrashGuard.writeSignal(number)
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
        defer { previous = nil }
        return previous
    }

    /// Read and remove the record the run before this one left.
    /// - Returns: the record, or nil when the last run ended normally.
    private static func readPrevious() -> CrashRecord? {
        if let data = try? Data(contentsOf: legacyRecordURL),
           let record = try? JSONDecoder().decode(CrashRecord.self, from: data)
        {
            try? FileManager.default.removeItem(at: legacyRecordURL)
            return record
        }
        guard let data = try? Data(contentsOf: recordURL), !data.isEmpty else { return nil }
        try? FileManager.default.removeItem(at: recordURL)
        return parse(data)
    }

    /// Write one exception record. Called from the uncaught exception handler,
    /// where Foundation is available; the signal path does not come here.
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

        var lines = ["tomato-crash 2"]
        lines.append("date \(Int(Date().timeIntervalSince1970 * 1000))")
        lines.append("kind \(oneLine(kind))")
        lines.append("message \(oneLine(message))")
        for frame in stack.prefix(40) {
            lines.append("frame \(oneLine(frame))")
        }
        let text = lines.joined(separator: "\n") + "\n"
        guard let data = text.data(using: .utf8) else { return }
        write(data)
    }

    /// Write a signal record with only async-signal-safe calls.
    /// - Parameter number: signal the process received.
    fileprivate static func writeSignal(_ number: Int32) {
        guard descriptor >= 0 else { return }
        _ = ftruncate(descriptor, 0)
        _ = lseek(descriptor, 0, SEEK_SET)

        var used = 0
        for index in 0 ..< prefix.count {
            scratch[used] = prefix[index]
            used += 1
        }
        used = append(number, at: used)
        for index in 0 ..< timePrefix.count {
            scratch[used] = timePrefix[index]
            used += 1
        }
        used = append(Int32(clamping: time(nil)), at: used)
        scratch[used] = UInt8(ascii: "\n")
        used += 1
        _ = Darwin.write(descriptor, scratch, used)
    }

    /// Put one non-negative number's decimal digits into the scratch buffer.
    ///
    /// The digits are counted first and then written backwards, so the helper
    /// needs no local array: allocating inside a signal handler is unsafe.
    /// - Parameters:
    ///   - value: number to write.
    ///   - start: first free byte.
    /// - Returns: the next free byte.
    private static func append(_ value: Int32, at start: Int) -> Int {
        var remaining = value
        var count = 0
        repeat {
            remaining /= 10
            count += 1
        } while remaining > 0
        var index = start + count
        remaining = value
        repeat {
            index -= 1
            scratch[index] = UInt8(ascii: "0") + UInt8(remaining % 10)
            remaining /= 10
        } while remaining > 0
        return start + count
    }

    /// Open the record file once, so a signal handler only calls `write`.
    private static func openDescriptor() {
        let path = recordURL.path
        descriptor = path.withCString { pointer in
            Darwin.open(pointer, O_WRONLY | O_CREAT | O_TRUNC, 0o600)
        }
    }

    /// Replace newlines so one field keeps its line in the record.
    /// - Parameter text: a kind, message, or frame.
    /// - Returns: one line.
    private static func oneLine(_ text: String) -> String {
        text.split(whereSeparator: \.isNewline).joined(separator: " ")
    }

    /// Write bytes through the pre-opened descriptor, or the file API when it
    /// was never opened.
    /// - Parameter data: record bytes.
    private static func write(_ data: Data) {
        if descriptor >= 0 {
            _ = ftruncate(descriptor, 0)
            _ = lseek(descriptor, 0, SEEK_SET)
            data.withUnsafeBytes { buffer in
                _ = Darwin.write(descriptor, buffer.baseAddress, buffer.count)
            }
            return
        }
        try? data.write(to: recordURL, options: .atomic)
    }

    // MARK: Reading

    /// Read one text record.
    /// - Parameter data: bytes the previous run wrote.
    /// - Returns: the decoded record, or nil when the file is not one of ours.
    private static func parse(_ data: Data) -> CrashRecord? {
        guard let text = String(data: data, encoding: .utf8) else { return nil }
        let lines = text.split(separator: "\n", omittingEmptySubsequences: true)
        guard lines.first == "tomato-crash 2" else { return nil }
        var moment = Date()
        var kind = "未知结束"
        var message = ""
        var stack: [String] = []
        for line in lines.dropFirst() {
            let field = line.split(separator: " ", maxSplits: 1)
            guard field.count == 2 else { continue }
            switch field[0] {
            case "date":
                if let milliseconds = Double(field[1]) {
                    moment = Date(timeIntervalSince1970: milliseconds / 1000)
                }
            case "time":
                if let seconds = Double(field[1]) {
                    moment = Date(timeIntervalSince1970: seconds)
                }
            case "signal":
                guard let number = Int32(field[1]) else { continue }
                kind = "信号 \(crashSignalName(number))"
                message = "进程收到 \(crashSignalName(number))"
            case "kind":
                kind = String(field[1])
            case "message":
                message = String(field[1])
            case "frame":
                stack.append(String(field[1]))
            default:
                continue
            }
        }
        guard !message.isEmpty else { return nil }
        return CrashRecord(date: moment, kind: kind, message: message, stack: stack)
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
