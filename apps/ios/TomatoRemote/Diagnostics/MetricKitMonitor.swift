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
        }
    }
}
