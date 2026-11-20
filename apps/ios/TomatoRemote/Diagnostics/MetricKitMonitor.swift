//
//  MetricKitMonitor.swift
//  Tomato Remote
//
//  The system's own diagnostics: crash, hang, CPU-exception, disk-write, and
//  launch reports.
//
//  MetricKit delivers a payload on a later launch, usually a day after the
//  event. It is the only source that can explain a `SIGKILL` from the watchdog,
//  because a killed process runs no handler of its own.
//

import Foundation
import MetricKit

/// Receives MetricKit payloads and keeps their JSON next to the app's log.
final class MetricKitMonitor: NSObject, MXMetricManagerSubscriber {
    static let shared = MetricKitMonitor()

    private var started = false
    private let lock = NSLock()

    /// Subscribe once. Idempotent.
    func start() {
        lock.lock()
        guard !started else {
            lock.unlock()
            return
        }
        started = true
        lock.unlock()
        // Subscription crosses to the system daemon; keeping it off the main
        // thread leaves the first frame free.
        DispatchQueue.global(qos: .utility).async { [self] in
            MXMetricManager.shared.add(self)
            AppLog.info(.diagnostics, "MetricKit 订阅完成")
        }
    }

    /// One diagnostic payload covers the runs since the last delivery.
    /// @param payloads: system reports to persist and summarize.
    func didReceive(_ payloads: [MXDiagnosticPayload]) {
        let folder = DiagnosticsStorage.directory.appendingPathComponent("metrickit", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        for payload in payloads {
            let name = "metrickit-\(Int(Date().timeIntervalSince1970))-\(UUID().uuidString.prefix(8)).json"
            let url = folder.appendingPathComponent(name)
            try? payload.jsonRepresentation().write(to: url)

            let crashes = payload.crashDiagnostics?.count ?? 0
            let hangs = payload.hangDiagnostics?.count ?? 0
            let cpu = payload.cpuExceptionDiagnostics?.count ?? 0
            let disk = payload.diskWriteExceptionDiagnostics?.count ?? 0
            let launches = payload.appLaunchDiagnostics?.count ?? 0
            AppLog.warning(
                .diagnostics,
                "MetricKit 诊断：崩溃 \(crashes) · 卡顿 \(hangs) · CPU \(cpu) · 磁盘 \(disk) · 启动 \(launches)",
                detail: "明细已保存 \(name)"
            )
            if hangs > 0 {
                AppLog.warning(
                    .diagnostics,
                    "系统记录到 \(hangs) 次卡顿",
                    detail: "崩溃报告之外的最后手段；明细在 \(name)"
                )
            }
            // The live watchdog can time a stall but not say what the main
            // thread was doing in it. The system's own report carries the stack.
            for hang in payload.hangDiagnostics ?? [] {
                let seconds = String(format: "%.1f", hang.hangDuration.converted(to: .seconds).value)
                AppLog.fault(
                    .diagnostics,
                    "系统卡顿 \(seconds) 秒",
                    detail: Self.frames(of: hang.callStackTree) ?? "系统报告未带调用栈"
                )
            }
            // A run the system had to kill leaves no in-process record: the app
            // was gone before CrashGuard could write one. The stack the system
            // captured is the only account of what it was doing.
            for crash in payload.crashDiagnostics ?? [] {
                let reason = crash.terminationReason.map { " · \($0)" } ?? ""
                AppLog.fault(
                    .crash,
                    "系统记录到崩溃 signal \(crash.signal) · exception \(crash.exceptionType)\(reason)",
                    detail: Self.frames(of: crash.callStackTree) ?? "系统报告未带调用栈"
                )
            }
        }
    }

    /// Frames the system blamed for one hang or crash, outermost first.
    /// - Parameters:
    ///   - tree: the diagnostic's call stack tree.
    ///   - limit: how many of the outermost frames to keep.
    /// - Returns: the frames joined for one log line, or nil when the tree carries
    ///   nothing readable.
    static func frames(of tree: MXCallStackTree, limit: Int = 8) -> String? {
        guard
            let object = try? JSONSerialization.jsonObject(with: tree.jsonRepresentation()),
            let root = object as? [String: Any],
            let stacks = root["callStacks"] as? [[String: Any]]
        else { return nil }
        let threads = stacks.flatMap { $0["threads"] as? [[String: Any]] ?? [] }
        // `threadAttributed` marks the thread the system holds responsible; the
        // first thread is the fallback when the field is absent.
        let blamed = threads.first { $0["threadAttributed"] as? Bool == true } ?? threads.first
        guard let frames = blamed?["frames"] as? [[String: Any]], !frames.isEmpty else { return nil }
        let names = frames.prefix(limit).compactMap { frame -> String? in
            if let symbol = frame["symbol"] as? String, !symbol.isEmpty {
                return symbol
            }
            return frame["binaryName"] as? String
        }
        return names.isEmpty ? nil : names.joined(separator: " ← ")
    }
}
