//
//  AppDiagnostics.swift
//  Tomato Remote
//
//  Process-level instrumentation the UI cannot provide: crash capture, a
//  main-thread hang watchdog, memory warnings, and the system's own MetricKit
//  diagnostics.
//
//  A phone app that freezes and is killed by the watchdog leaves no crash
//  report, so the two signals here are deliberately independent: the watchdog
//  notices a blocked main thread while the app still runs, and MetricKit
//  reports a hang the system had to end.
//

import UIKit

/// Installs the diagnostics and answers application-level notifications.
enum AppDiagnostics {
    private static let lock = NSLock()
    private static var started = false
    private static var foreground = true
    private static var observers: [NSObjectProtocol] = []

    /// Whether the app is on screen; a suspended process is not hung.
    static var isForeground: Bool {
        lock.lock()
        defer { lock.unlock() }
        return foreground
    }

    /// Install every sensor once, from the app's entry point.
    static func start() {
        lock.lock()
        guard !started else {
            lock.unlock()
            return
        }
        started = true
        lock.unlock()

        // Read the synchronous breadcrumb before this run overwrites it. The
        // asynchronous log cannot survive a watchdog kill.
        let previousActivity = LastActivity.begin()
        CrashGuard.install()
        HangWatchdog.shared.start()
        MetricKitMonitor.shared.start()
        MemoryWatch.shared.start()
        observeApplication()
        DispatchQueue.main.async {
            if let previousActivity {
                AppLog.notice(.diagnostics, "上次最后操作", detail: previousActivity)
            }
            if let crash = CrashGuard.previousRecord() {
                AppLog.shared.notePreviousCrash(crash)
            }
            AppLog.info(.app, "诊断已启动")
            AppLog.mark("启动")
            // A display can attach only after the scene exists, so the frame
            // probe starts one run-loop turn later.
            if ProcessInfo.processInfo.arguments.contains("-TOMATO_FRAME_LOG") {
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    FrameMonitor.shared.start()
                }
            }
        }
    }

    /// Record one lifecycle transition, so a hang report has a time anchor.
    /// - Parameter phase: scene phase the system reported.
    static func scene(_ phase: String) {
        lock.lock()
        foreground = phase == "active"
        lock.unlock()
        // A suspended process makes no beats. Re-anchoring here keeps a return
        // from the background from being reported as one long main-thread stall.
        HangWatchdog.shared.resetClock()
        AppLog.info(.app, "场景切换 \(phase)", detail: "占用 \(MemoryFootprint.text())")
    }

    private static func observeApplication() {
        let center = NotificationCenter.default
        observers.append(center.addObserver(
            forName: UIApplication.didReceiveMemoryWarningNotification,
            object: nil,
            queue: .main
        ) { _ in
            AppLog.warning(.diagnostics, "系统内存警告", detail: "占用 \(MemoryFootprint.text())")
            // The shared diagram cache outlives every conversation it served;
            // releasing it is the one large allocation the warning can recover.
            Task { @MainActor in
                MermaidRenderer.shared.releaseSnapshots()
            }
        })
        observers.append(center.addObserver(
            forName: UIApplication.willTerminateNotification,
            object: nil,
            queue: .main
        ) { _ in
            AppLog.info(.app, "进程即将终止")
        })
        observers.append(center.addObserver(
            forName: ProcessInfo.thermalStateDidChangeNotification,
            object: nil,
            queue: .main
        ) { _ in
            AppLog.notice(.diagnostics, "热状态变为 \(thermalLabel())")
        })
    }

    /// Localized name of the current thermal pressure.
    private static func thermalLabel() -> String {
        switch ProcessInfo.processInfo.thermalState {
        case .nominal: "正常"
        case .fair: "偏高"
        case .serious: "严重"
        case .critical: "危险"
        @unknown default: "未知"
        }
    }
}
