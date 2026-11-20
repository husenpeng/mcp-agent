//
//  HangWatchdog.swift
//  Tomato Remote
//
//  Notices when the main thread stops answering.
//
//  iOS kills an app whose main thread blocks for roughly twenty seconds and
//  writes a watchdog report the app never sees. A background timer that pings
//  the main actor every fifth of a second can observe the stall while it is
//  happening, and the last activity the app reported narrows it to a screen or
//  a stream.
//

import Foundation

/// Main-thread responsiveness probe.
///
/// The probe runs off the main thread and only reads two timestamps under a
/// lock, so it still works while the main thread is blocked.
final class HangWatchdog: @unchecked Sendable {
    static let shared = HangWatchdog()

    /// A stall shorter than this is a slow frame, not a hang.
    private static let threshold: TimeInterval = 2.0
    /// At most one fault report per stall window.
    private static let reportInterval: TimeInterval = 10

    private let lock = NSLock()
    private var lastBeat = CFAbsoluteTimeGetCurrent()
    private var stallStart: CFAbsoluteTime?
    private var lastReport: CFAbsoluteTime = 0
    private var timer: DispatchSourceTimer?
    private var beatTask: Task<Void, Never>?
    private var started = false

    private init() {}

    /// Begin probing. Idempotent.
    func start() {
        lock.lock()
        guard !started else {
            lock.unlock()
            return
        }
        started = true
        lock.unlock()

        beatTask = Task { @MainActor in
            while !Task.isCancelled {
                HangWatchdog.shared.beat()
                try? await Task.sleep(nanoseconds: 200_000_000)
            }
        }

        let source = DispatchSource.makeTimerSource(queue: DispatchQueue(label: "ai.tomato.remote.hang", qos: .utility))
        source.schedule(deadline: .now() + 1, repeating: 0.5)
        source.setEventHandler { [weak self] in self?.check() }
        source.resume()
        timer = source
    }

    /// Anchor the beat clock again after a lifecycle transition.
    ///
    /// The beat task stops while the process is suspended, so the first probe
    /// after the app returns would otherwise report the whole suspension as a
    /// stall and blame whatever step was marked before it.
    func resetClock() {
        let now = CFAbsoluteTimeGetCurrent()
        lock.lock()
        lastBeat = now
        stallStart = nil
        lastReport = 0
        lock.unlock()
    }

    /// Mark the main thread alive. Called on the main actor.
    func beat() {
        let now = CFAbsoluteTimeGetCurrent()
        lock.lock()
        lastBeat = now
        let start = stallStart
        stallStart = nil
        lock.unlock()
        if let start {
            let seconds = max(0, now - start)
            AppLog.warning(
                .diagnostics,
                "主线程恢复，阻塞约 \(Self.seconds(seconds)) 秒",
                detail: "最后操作：\(AppLog.shared.currentActivity)"
            )
        }
    }

    private func check() {
        guard AppDiagnostics.isForeground else { return }
        let now = CFAbsoluteTimeGetCurrent()
        lock.lock()
        let stalled = now - lastBeat
        // The main thread answered since the last probe: whatever the beat task
        // did not close is closed by the next beat, and no report is due.
        guard stalled > Self.threshold else {
            lock.unlock()
            return
        }
        // Every duration below counts from the beat that started the stall, so
        // a fault and the recovery that closes it cannot name two lengths for
        // the same window.
        if let start = stallStart {
            guard now - lastReport >= Self.reportInterval else {
                lock.unlock()
                return
            }
            lastReport = now
            lock.unlock()
            AppLog.fault(
                .diagnostics,
                "主线程仍无响应约 \(Self.seconds(now - start)) 秒",
                detail: "最后操作：\(AppLog.shared.currentActivity)"
            )
            return
        }
        stallStart = lastBeat
        lastReport = now
        lock.unlock()
        AppLog.fault(
            .diagnostics,
            "主线程无响应约 \(Self.seconds(stalled)) 秒",
            detail: "最后操作：\(AppLog.shared.currentActivity)"
        )
    }

    private static func seconds(_ value: TimeInterval) -> String {
        String(format: "%.1f", value)
    }
}
