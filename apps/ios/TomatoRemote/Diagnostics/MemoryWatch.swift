//
//  MemoryWatch.swift
//  Tomato Remote
//
//  Samples the process footprint while the app is on screen.
//
//  A jetsam kill leaves no crash report, and one memory warning at the end says
//  only that the limit was near. A trend that reports only when the footprint
//  actually grew keeps the log short while still showing a climb.
//

import Foundation

/// Periodic resident-memory sampler.
final class MemoryWatch: @unchecked Sendable {
    static let shared = MemoryWatch()

    /// A growth smaller than this is noise from caches and rendering.
    private static let growthFraction: UInt64 = 5

    private let lock = NSLock()
    private var timer: DispatchSourceTimer?
    private var lastReported: UInt64 = 0
    private var started = false

    private init() {}

    /// Begin sampling. Idempotent.
    func start() {
        lock.lock()
        guard !started else {
            lock.unlock()
            return
        }
        started = true
        lock.unlock()

        let source = DispatchSource.makeTimerSource(queue: DispatchQueue(label: "ai.tomato.remote.memory", qos: .utility))
        source.schedule(deadline: .now() + 30, repeating: 30)
        source.setEventHandler { [weak self] in self?.sample() }
        source.resume()
        timer = source
    }

    private func sample() {
        guard AppDiagnostics.isForeground else { return }
        let bytes = MemoryFootprint.bytes()
        guard bytes > 0 else { return }

        lock.lock()
        let previous = lastReported
        let grew = previous == 0 || bytes > previous + previous / Self.growthFraction
        if grew {
            lastReported = bytes
        }
        lock.unlock()

        guard grew else { return }
        AppLog.info(.diagnostics, "内存占用 \(MemoryFootprint.text())")
    }
}
