//
//  FrameMonitor.swift
//  Tomato Remote
//
//  Logs frames the app dropped while the main thread was busy.
//
//  The hang watchdog reports blocks measured in seconds; scrolling and
//  animation problems are tens of milliseconds, so this probe fills that gap
//  and names the screen that was on screen when the frame was missed.
//
//  Started only with `-TOMATO_FRAME_LOG`, so a normal release run pays nothing.
//

import QuartzCore

/// Main-thread frame pacing probe.
final class FrameMonitor: @unchecked Sendable {
    static let shared = FrameMonitor()

    /// A frame interval below this is a slow frame, not a dropped one.
    private let threshold: CFTimeInterval = 0.05
    /// At most one report per second, so the log stays readable.
    private let reportInterval: CFTimeInterval = 1

    private var link: CADisplayLink?
    private var lastTimestamp: CFTimeInterval = 0
    private var lastReport: CFTimeInterval = 0

    private init() {}

    /// Begin observing the main display. Idempotent.
    func start() {
        guard link == nil else { return }
        let proxy = DisplayLinkProxy { [weak self] link in self?.tick(link) }
        let display = CADisplayLink(target: proxy, selector: #selector(DisplayLinkProxy.tick(_:)))
        display.add(to: .main, forMode: .common)
        link = display
    }

    private func tick(_ link: CADisplayLink) {
        let now = link.timestamp
        defer { lastTimestamp = now }
        guard lastTimestamp > 0 else { return }

        let interval = now - lastTimestamp
        guard interval > threshold, now - lastReport > reportInterval else { return }
        lastReport = now

        AppLog.warning(
            .ui,
            "掉帧 \(Int((interval * 1000).rounded())) ms",
            detail: "当前：\(AppLog.shared.currentActivity)"
        )
    }
}

/// Breaks the display link's strong reference to the monitor.
private final class DisplayLinkProxy: NSObject {
    private let handler: (CADisplayLink) -> Void

    init(handler: @escaping (CADisplayLink) -> Void) {
        self.handler = handler
    }

    @objc func tick(_ link: CADisplayLink) {
        handler(link)
    }
}
