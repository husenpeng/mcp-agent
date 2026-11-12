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
/// for the disk and two threads never interleave a line.
final class LogFileWriter: @unchecked Sendable {
    static let shared = LogFileWriter()

    let directory: URL
    private(set) var currentURL: URL
    private(set) var previousURL: URL

    /// Bytes allowed before the run rotates its own file.
    private let limit: UInt64 = 2 * 1024 * 1024

    private let queue = DispatchQueue(label: "ai.tomato.remote.log.file", qos: .utility)
    private var handle: FileHandle?
    private var bytes: UInt64 = 0

    private init() {
        directory = DiagnosticsStorage.directory
        currentURL = directory.appendingPathComponent("tomato-remote.log")
        previousURL = directory.appendingPathComponent("tomato-remote.previous.log")
        // A new run starts a new file; the tail from the run that just ended is
        // exactly what a crash report needs. The move happens on the writer
        // queue so the app's first frame never waits for the disk.
        queue.async { [weak self] in
            self?.archivePreviousRun()
        }
    }

    /// Move the run that just ended into the previous-run slot.
    private func archivePreviousRun() {
        try? FileManager.default.removeItem(at: previousURL)
        if FileManager.default.fileExists(atPath: currentURL.path) {
            try? FileManager.default.moveItem(at: currentURL, to: previousURL)
        }
    }

    /// Append one already-formatted line.
    /// @param line: text without the trailing newline.
    func append(_ line: String) {
        guard let data = (line + "\n").data(using: .utf8) else { return }
        queue.async { [weak self] in
            guard let self else { return }
            if self.handle == nil {
                open()
            }
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
    }

    /// Tail of the previous run.
    /// @param limit: maximum lines returned, oldest first.
    /// @returns the lines, or an empty string when the previous run wrote none.
    func tailText(limit: Int) -> String {
        queue.sync {
            guard let data = try? Data(contentsOf: previousURL), !data.isEmpty else { return "" }
            let text = String(data: data, encoding: .utf8) ?? ""
            let lines = text.split(separator: "\n", omittingEmptySubsequences: true)
            return lines.suffix(max(1, limit)).joined(separator: "\n")
        }
    }

    /// Remove this run's file and start a fresh one.
    func clearCurrent() {
        queue.async { [weak self] in
            guard let self else { return }
            try? handle?.close()
            handle = nil
            bytes = 0
            try? FileManager.default.removeItem(at: currentURL)
            open()
        }
    }

    // MARK: Queue-only helpers

    private func open() {
        if !FileManager.default.fileExists(atPath: currentURL.path) {
            FileManager.default.createFile(atPath: currentURL.path, contents: nil)
        }
        handle = try? FileHandle(forWritingTo: currentURL)
        bytes = (try? handle?.seekToEnd()) ?? 0
    }

    private func rotate() {
        try? handle?.close()
        handle = nil
        try? FileManager.default.removeItem(at: previousURL)
        try? FileManager.default.moveItem(at: currentURL, to: previousURL)
        bytes = 0
        open()
    }
}
