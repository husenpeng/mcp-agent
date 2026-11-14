//
//  LogStorage.swift
//  Tomato Remote
//
//  Where diagnostics live on disk, and how much memory the process holds.
//
//  The current run writes `logs/tomato-remote.log`; the run before it keeps the
//  tail in `logs/tomato-remote.previous.log`. Both sit in Application Support,
//  so nothing is backed up as a document and the export is the only way they
//  leave the phone.
//

import Darwin
import Foundation

/// Application Support folder for everything the app keeps about itself.
enum DiagnosticsStorage {
    /// Folder holding the log and the crash record.
    static var directory: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        let folder = base.appendingPathComponent("TomatoRemote/logs", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder
    }
}

/// Physical memory this process currently holds.
enum MemoryFootprint {
    /// Resident footprint in bytes, or zero when the kernel call fails.
    /// @returns `phys_footprint`, the number the system uses for jetsam limits.
    static func bytes() -> UInt64 {
        var info = task_vm_info_data_t()
        var count = mach_msg_type_number_t(MemoryLayout<task_vm_info_data_t>.size / MemoryLayout<natural_t>.size)
        let result = withUnsafeMutablePointer(to: &info) { pointer in
            pointer.withMemoryRebound(to: integer_t.self, capacity: Int(count)) { rebound in
                task_info(mach_task_self_, task_flavor_t(TASK_VM_INFO), rebound, &count)
            }
        }
        return result == KERN_SUCCESS ? info.phys_footprint : 0
    }

    /// Footprint as a short human string.
    /// @returns e.g. `128 MB`.
    static func text() -> String {
        ByteCountFormatter.string(fromByteCount: Int64(bytes()), countStyle: .memory)
    }
}

/// Append-only log file with a size cap and one previous generation.
///
/// Writes are serialized on a utility queue, so a network callback never waits
/// for the disk and two threads never interleave a line. Every stored value is
/// static and first touched inside the queue: a singleton initialized on the
/// first log call made launch create the directory and open the file on the
/// main thread.
enum LogFileWriter {
    private static let queue = DispatchQueue(label: "ai.tomato.remote.log.file", qos: .utility)
    /// Bytes allowed before the run rotates its own file.
    private static let limit: UInt64 = 2 * 1024 * 1024

    // Queue-only state.
    private static var handle: FileHandle?
    private static var bytes: UInt64 = 0
    private static var prepared = false

    /// Append one record. The line, including its timestamp, is formatted on
    /// the writer queue rather than on the caller's thread.
    /// @param entry: record to write.
    static func append(_ entry: AppLogEntry) {
        queue.async {
            prepareIfNeeded()
            guard let data = (entry.line + "\n").data(using: .utf8) else { return }
            write(data)
        }
    }

    /// Tail of the previous run.
    /// @param limit: maximum lines returned, oldest first.
    /// @returns the lines, or an empty string when the previous run wrote none.
    static func tailText(limit: Int) -> String {
        queue.sync {
            let (_, previous) = urls()
            guard let data = try? Data(contentsOf: previous), !data.isEmpty else { return "" }
            let text = String(data: data, encoding: .utf8) ?? ""
            let lines = text.split(separator: "\n", omittingEmptySubsequences: true)
            return lines.suffix(max(1, limit)).joined(separator: "\n")
        }
    }

    /// Remove this run's file and start a fresh one.
    static func clearCurrent() {
        queue.async {
            prepareIfNeeded()
            try? handle?.close()
            handle = nil
            bytes = 0
            let (current, _) = urls()
            try? FileManager.default.removeItem(at: current)
            open()
        }
    }

    // MARK: Queue-only helpers

    /// Paths for this run and the previous one, created on first use.
    /// - Returns: the current and previous log files.
    private static func urls() -> (current: URL, previous: URL) {
        let directory = DiagnosticsStorage.directory
        return (
            directory.appendingPathComponent("tomato-remote.log"),
            directory.appendingPathComponent("tomato-remote.previous.log")
        )
    }

    /// Archive the run that just ended, then open this run's file. Runs once.
    private static func prepareIfNeeded() {
        guard !prepared else {
            if handle == nil {
                open()
            }
            return
        }
        prepared = true
        let (current, previous) = urls()
        try? FileManager.default.removeItem(at: previous)
        if FileManager.default.fileExists(atPath: current.path) {
            try? FileManager.default.moveItem(at: current, to: previous)
        }
        open()
    }

    private static func write(_ data: Data) {
        guard let handle else { return }
        do {
            _ = try handle.seekToEnd()
            try handle.write(contentsOf: data)
            bytes += UInt64(data.count)
        } catch {
            self.handle = nil
            return
        }
        if bytes > limit {
            rotate()
        }
    }

    private static func open() {
        let (current, _) = urls()
        if !FileManager.default.fileExists(atPath: current.path) {
            FileManager.default.createFile(atPath: current.path, contents: nil)
        }
        handle = try? FileHandle(forWritingTo: current)
        bytes = (try? handle?.seekToEnd()) ?? 0
    }

    private static func rotate() {
        let (current, previous) = urls()
        try? handle?.close()
        handle = nil
        try? FileManager.default.removeItem(at: previous)
        try? FileManager.default.moveItem(at: current, to: previous)
        bytes = 0
        open()
    }
}
