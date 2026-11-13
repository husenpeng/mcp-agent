//
//  Engine.swift
//  Tomato Runner
//
//  The one process that can touch the screen. Every caller — the application on
//  this device, the Host session on the Mac, or the on-device task loop — reaches
//  the device through these methods, so the lease, the risk gate, and the
//  observation format are defined once.
//

import UIKit
import Vision
import XCTest

/// One engine call's result, handed across the queue boundary.
private final class OutcomeBox: @unchecked Sendable {
    private let lock = NSLock()
    private var stored: Result<PhoneJSON, PhoneFailure>?

    var done: Bool {
        lock.lock()
        defer { lock.unlock() }
        return stored != nil
    }

    var value: Result<PhoneJSON, PhoneFailure>? {
        lock.lock()
        defer { lock.unlock() }
        return stored
    }

    func finish(_ outcome: Result<PhoneJSON, PhoneFailure>) {
        lock.lock()
        stored = outcome
        lock.unlock()
    }
}

/// Device control engine: method dispatch, lease, and screen observation.
final class Engine {
    private let stateLock = NSLock()
    /// Read under `stateLock`; the health answer must not wait for the queue.
    private var leaseHolder: String?
    private var leaseSince: Date?
    private var leaseExpiresAt: Date?
    private var boundBundleId = "com.apple.springboard"
    private var linkState = "off"
    private var halted = false
    private var timeoutStreak = 0
    private var deviceId: String?
    private var deviceName: String?
    private var lastScreen: PhoneScreen?
    /// Applied by `link.set` and cleared by `link.clear`; owned by the runner entry.
    var linkUpdate: ((PhoneLinkSetRequest?) -> Void)?
    /// The on-device task loop; the entry creates it so the engine stays unaware
    /// of who drives it.
    weak var brain: Brain?
    private var trippedUntil: Date?

    /// Engine-queue state.
    var history: [PhoneAppMatch] = []
    var lastSnapshot: Snapshot?
    let risk: RiskGate
    private let version = "0.1.0"

    init() {
        risk = RiskGate(rules: RiskGate.loadRules(bundle: Bundle(for: RunnerEntry.self)))
    }

    // MARK: - Health

    /// Cheap readiness answer, safe to call while the queue is blocked.
    func health() -> PhoneHealth {
        stateLock.lock()
        let holder = leaseHolder
        let since = leaseSince
        let bundleId = boundBundleId
        let link = linkState
        stateLock.unlock()
        let lease = holder.flatMap { holder -> PhoneLeaseState? in
            guard let since else { return nil }
            return PhoneLeaseState(holder: holder, since: ISO8601DateFormatter().string(from: since))
        }
        return PhoneHealth(
            protocol: PhoneProtocol.version,
            runnerVersion: version,
            build: BuildStamp.value,
            screen: screenSnapshot(),
            locked: false,
            foreground: PhoneForeground(bundleId: bundleId, name: name(for: bundleId)),
            lease: lease,
            hostLink: link
        )
    }

    // MARK: - Dispatch

    /// Run one method with a deadline.
    ///
    /// `health` never reaches this path. A call that overruns leaves the queue
    /// occupied, so three consecutive overruns open a breaker: further UI work
    /// fails fast while health and logs keep answering.
    /// @param method - method name.
    /// @param params - request parameters.
    /// @param deadline - seconds before the caller gives up.
    /// @returns the encoded result or a failure.
    func perform(method: String, params: PhoneJSON, deadline: TimeInterval) -> Result<PhoneJSON, PhoneFailure> {
        stateLock.lock()
        let tripped = trippedUntil.map { $0 > Date() } ?? false
        stateLock.unlock()
        if tripped {
            return .failure(PhoneFailure(.timeout, "引擎熔断中：上一次界面调用没有返回", retryable: true))
        }
        // XCTest requires the main thread for application activation and
        // termination, and a read issued off it deadlocks. Everything runs on
        // the main thread, either inline or by hopping to it.
        if Thread.isMainThread {
            noteSettled()
            return run(method: method, params: params)
        }
        let box = OutcomeBox()
        DispatchQueue.main.async {
            box.finish(self.run(method: method, params: params))
        }
        let deadlineDate = Date().addingTimeInterval(deadline)
        while !box.done, Date() < deadlineDate {
            usleep(20000)
        }
        guard let outcome = box.value else {
            noteTimeout()
            return .failure(PhoneFailure(.timeout, "界面调用超过 \(Int(deadline))s 没有返回", retryable: true))
        }
        noteSettled()
        return outcome
    }

    private func noteTimeout() {
        stateLock.lock()
        timeoutStreak += 1
        if timeoutStreak >= 3 {
            trippedUntil = Date().addingTimeInterval(30)
            timeoutStreak = 0
        }
        stateLock.unlock()
    }

    private func noteSettled() {
        stateLock.lock()
        timeoutStreak = 0
        stateLock.unlock()
    }

    private func run(method: String, params: PhoneJSON) -> Result<PhoneJSON, PhoneFailure> {
        do {
            switch method {
            case "observe":
                let request = try decode(params, PhoneObserveRequest.self)
                let snapshot = try observe(request: request)
                guard let value = try? PhoneJSON.from(snapshot.observation) else {
                    return .failure(PhoneFailure(.internal, "观测结果无法编码"))
                }
                return .success(value)
            case "screenshot":
                let request = try decode(params, PhoneScreenshotRequest.self)
                return try .success(screenshot(request: request))
            case "act":
                let request = try decode(params, PhoneActRequest.self)
                return try .success(act(request: request))
            case "apps.resolve":
                let request = try decode(params, PhoneResolveRequest.self)
                let matches = Apps.resolve(query: request.query, history: history)
                return try .success(PhoneJSON.from(PhoneAppResolveResult(matches: matches)))
            case "lease.acquire":
                let request = try decode(params, PhoneLeaseRequest.self)
                let grant = acquireLease(holder: request.holder, ttlMs: request.ttlMs)
                return try .success(PhoneJSON.from(grant))
            case "lease.release":
                let request = try decode(params, PhoneLeaseReleaseRequest.self)
                releaseLease(holder: request.holder)
                return .success(.object([:]))
            case "link.set":
                let request = try decode(params, PhoneLinkSetRequest.self)
                return linkSet(request)
            case "link.clear":
                stateLock.lock()
                linkState = "off"
                stateLock.unlock()
                linkUpdate?(nil)
                return .success(.object([:]))
            case "task.start":
                guard let brain else { return .failure(PhoneFailure(.internal, "任务循环没有挂载")) }
                return .success(try brain.start(params))
            case "task.status":
                guard let brain else { return .failure(PhoneFailure(.internal, "任务循环没有挂载")) }
                return .success(try brain.status(params))
            case "task.stop":
                guard let brain else { return .failure(PhoneFailure(.internal, "任务循环没有挂载")) }
                return .success(try brain.stop(params))
            case "log.recent":
                return try .success(PhoneJSON.from(Log.shared.recent()))
            default:
                return .failure(PhoneFailure(.badRequest, "未知方法 \(method)"))
            }
        } catch let failure as PhoneFailure {
            return .failure(failure)
        } catch {
            return .failure(PhoneFailure(.badRequest, "参数无法解析：\(error.localizedDescription)"))
        }
    }

    private func decode<T: Decodable>(_ params: PhoneJSON, _ type: T.Type) throws -> T {
        do {
            return try params.decode(type)
        } catch {
            throw PhoneFailure(.badRequest, "参数不符合 \(type) 的要求")
        }
    }

    // MARK: - Lease

    private func acquireLease(holder: String, ttlMs: Int?) -> PhoneLeaseGrant {
        stateLock.lock()
        defer { stateLock.unlock() }
        let ttl = Double(ttlMs ?? 300_000) / 1000
        let expiresAt = Date().addingTimeInterval(ttl)
        if let current = leaseHolder, let currentExpiry = leaseExpiresAt, currentExpiry > Date(), current != holder {
            return PhoneLeaseGrant(granted: false, holder: current)
        }
        leaseHolder = holder
        leaseSince = Date()
        leaseExpiresAt = expiresAt
        return PhoneLeaseGrant(granted: true, holder: holder)
    }

    private func releaseLease(holder: String) {
        stateLock.lock()
        if leaseHolder == holder {
            leaseHolder = nil
            leaseSince = nil
            leaseExpiresAt = nil
        }
        stateLock.unlock()
    }

    func requireLease(holder: String?) throws {
        stateLock.lock()
        let current = leaseHolder
        let expiry = leaseExpiresAt
        stateLock.unlock()
        guard let current else {
            throw PhoneFailure(.leaseHeld, "还没有人取得设备占用权，请先 lease.acquire")
        }
        if let expiry, expiry <= Date() {
            throw PhoneFailure(.leaseHeld, "设备占用权已过期，请重新 lease.acquire")
        }
        if let holder, holder != current {
            throw PhoneFailure(.leaseHeld, "设备正被 \(current) 占用", details: .object(["holder": .string(current)]))
        }
    }

    // MARK: - Observation

    func observe(request: PhoneObserveRequest) throws -> Snapshot {
        let limit = max(1, min(200, request.maxElements ?? 80))
        var snapshot = SnapshotReader.read(app: currentApplication(), maxElements: limit)
        if snapshot.observation.elements.isEmpty {
            let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
            let fallback = SnapshotReader.read(app: springboard, maxElements: limit)
            if !fallback.observation.elements.isEmpty {
                setBoundApplication("com.apple.springboard")
                snapshot = fallback
            }
        }
        var observation = snapshot.observation
        stateLock.lock()
        let foregroundBundle = boundBundleId
        stateLock.unlock()
        observation.foreground = PhoneForeground(bundleId: foregroundBundle, name: name(for: foregroundBundle))
        let wantsOcr = request.includeOcr == "always" || (request.includeOcr ?? "auto") == "auto" && observation.elements.count < 5
        if wantsOcr, let ocr = readOCR() {
            observation.ocr = ocr
        }
        let merged = Snapshot(observation: observation, targets: snapshot.targets)
        lastSnapshot = merged
        stateLock.lock()
        lastScreen = observation.screen
        stateLock.unlock()
        Log.shared.append("observe: \(observation.elements.count) elements, ocr \(observation.ocr?.count ?? 0)")
        return merged
    }

    /// The application a read or a gesture targets.
    ///
    /// Application-state queries stall for tens of seconds when the target is
    /// not in front, so this never asks for state. The bound application is
    /// used as-is; a dump that comes back empty is retried against SpringBoard,
    /// which is the one application the runner can always read.
    func currentApplication() -> XCUIApplication {
        stateLock.lock()
        let bundleId = boundBundleId
        stateLock.unlock()
        return XCUIApplication(bundleIdentifier: bundleId)
    }

    func setBoundApplication(_ bundleId: String) {
        stateLock.lock()
        boundBundleId = bundleId
        stateLock.unlock()
    }

    func bundleIdentifier(of app: XCUIApplication) -> String {
        stateLock.lock()
        defer { stateLock.unlock() }
        return boundBundleId
    }

    /// Bring SpringBoard to the front so a read starts from a known screen.
    func goHome() {
        XCUIDevice.shared.press(.home)
        setBoundApplication("com.apple.springboard")
    }

    private func linkSet(_ request: PhoneLinkSetRequest) -> Result<PhoneJSON, PhoneFailure> {
        guard URL(string: request.hostBase) != nil else {
            return .failure(PhoneFailure(.badRequest, "hostBase 不是合法 URL"))
        }
        guard !request.credential.isEmpty else {
            return .failure(PhoneFailure(.badRequest, "credential 为空"))
        }
        stateLock.lock()
        linkState = "connecting"
        deviceId = request.deviceId
        deviceName = request.deviceName
        stateLock.unlock()
        linkUpdate?(request)
        return .success(.object([:]))
    }

    /// Publish the Host link state that `health` reports.
    /// @param state - off, connecting, reconnecting, or attached.
    func setLinkState(_ state: String) {
        stateLock.lock()
        linkState = state
        stateLock.unlock()
    }

    private func screenSnapshot() -> PhoneScreen {
        stateLock.lock()
        let known = lastScreen
        stateLock.unlock()
        return known ?? PhoneScreen(width: 393, height: 852, scale: 3)
    }

    private func name(for bundleId: String) -> String? {
        Apps.known.first { $0.bundleId == bundleId }?.name
    }

    // MARK: - Capture

    private func screenshot(request: PhoneScreenshotRequest) throws -> PhoneJSON {
        let image = XCUIScreen.main.screenshot().image
        let maxEdge = CGFloat(max(320, min(2048, request.maxEdge ?? 1280)))
        let quality = CGFloat(max(0.2, min(0.9, request.quality ?? 0.5)))
        let scaled = Engine.resize(image, maxEdge: maxEdge)
        guard let data = scaled.jpegData(compressionQuality: quality) else {
            throw PhoneFailure(.internal, "截图编码失败")
        }
        let snapshot: Snapshot = if let existing = lastSnapshot {
            existing
        } else {
            try observe(request: PhoneObserveRequest(maxElements: nil, includeOcr: nil, screenshot: nil))
        }
        let value = PhoneScreenshot(
            mime: "image/jpeg",
            base64: data.base64EncodedString(),
            pixelWidth: Int(scaled.size.width * scaled.scale),
            pixelHeight: Int(scaled.size.height * scaled.scale),
            observationId: snapshot.observation.observationId
        )
        return try PhoneJSON.from(value)
    }

    private func readOCR() -> [PhoneOCRItem]? {
        let image = XCUIScreen.main.screenshot().image
        guard let cgImage = image.cgImage else { return nil }
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["zh-Hans", "en-US"]
        request.usesLanguageCorrection = true
        let handler = VNImageRequestHandler(cgImage: cgImage)
        guard (try? handler.perform([request])) != nil else { return nil }
        let scale = image.scale
        let height = CGFloat(cgImage.height) / scale
        let observations = request.results ?? []
        return observations.enumerated().compactMap { index, observation in
            guard let candidate = observation.topCandidates(1).first else { return nil }
            let box = observation.boundingBox
            let frame = [
                Double(box.minX * CGFloat(cgImage.width) / scale),
                Double((1 - box.maxY) * height),
                Double(box.width * CGFloat(cgImage.width) / scale),
                Double(box.height * height),
            ]
            return PhoneOCRItem(ref: "t\(index)", text: candidate.string, frame: frame)
        }
    }

    private static func resize(_ image: UIImage, maxEdge: CGFloat) -> UIImage {
        let longest = max(image.size.width, image.size.height)
        guard longest > maxEdge else { return image }
        let ratio = maxEdge / longest
        let target = CGSize(width: image.size.width * ratio, height: image.size.height * ratio)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = image.scale
        let renderer = UIGraphicsImageRenderer(size: target, format: format)
        return renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: target)) }
    }
}

/// Build stamp written by the runner at compile time, so two builds of the same
/// version remain distinguishable in a diagnosis.
enum BuildStamp {
    static let value = "dev"
}
