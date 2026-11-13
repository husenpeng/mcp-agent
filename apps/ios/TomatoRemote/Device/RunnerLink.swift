//
//  RunnerLink.swift
//  Tomato Remote
//
//  Client for the runner on this device: `POST /pair` once, then `POST /rpc`.
//
//  The runner listens on 127.0.0.1 only, so this link never leaves the phone.
//  Every call carries the credential issued at pairing; the runner refuses
//  anything else.
//

import Foundation

/// Failures this link reports to the device card.
enum RunnerLinkError: LocalizedError {
    case transport(String)
    case notPaired
    case remote(PhoneFailure)
    case malformed(String)

    var errorDescription: String? {
        switch self {
        case let .transport(message): message
        case .notPaired: "还没有配对 Tomato Runner"
        case let .remote(failure): failure.message
        case let .malformed(message): message
        }
    }

    /// Stable failure code for the caller's own branches.
    var failure: PhoneFailure? {
        if case let .remote(failure) = self {
            return failure
        }
        return nil
    }
}

/// One device-local runner connection.
struct RunnerLink: Sendable {
    /// Loopback root; the runner owns this port on the device.
    let base: URL
    /// Bearer issued by `POST /pair`.
    let credential: String?

    static let loopback = URL(string: "http://127.0.0.1:\(PhoneProtocol.defaultPort)")!

    private static let session: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        configuration.waitsForConnectivity = false
        return URLSession(configuration: configuration)
    }()

    init(base: URL = RunnerLink.loopback, credential: String? = nil) {
        self.base = base
        self.credential = credential
    }

    // MARK: - Pairing

    /// Ask the runner for a credential; the device owner approves on a
    /// notification within 60 seconds.
    /// @returns the credential the runner issued.
    static func pair(base: URL = RunnerLink.loopback) async throws -> String {
        var request = URLRequest(url: base.appendingPathComponent("pair"))
        request.httpMethod = "POST"
        request.timeoutInterval = 70
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data("{}".utf8)
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw RunnerLinkError.transport("无法连接本机 runner：\(error.localizedDescription)")
        }
        _ = response
        if let envelope = try? JSONDecoder().decode(PhoneRPCResponse.self, from: data), let failure = envelope.error {
            throw RunnerLinkError.remote(failure)
        }
        struct PairReply: Decodable { let credential: String }
        guard let reply = try? JSONDecoder().decode(PairReply.self, from: data) else {
            throw RunnerLinkError.malformed("runner 的配对回应无法解析")
        }
        return reply.credential
    }

    // MARK: - Calls

    /// Read readiness without the credential.
    func health() async throws -> PhoneHealth {
        var request = URLRequest(url: base.appendingPathComponent("health"))
        request.timeoutInterval = 3
        let (data, _) = try await Self.session.data(for: request)
        guard let health = try? JSONDecoder().decode(PhoneHealth.self, from: data) else {
            throw RunnerLinkError.malformed("runner 的健康信息无法解析")
        }
        return health
    }

    /// Claim exclusive control for this caller.
    /// @param holder - identity shown to other callers.
    /// @param ttlMs - lease lifetime; the app refreshes on each run.
    func acquireLease(holder: String, ttlMs: Int = 600_000) async throws -> PhoneLeaseGrant {
        try await call("lease.acquire", PhoneLeaseRequest(holder: holder, ttlMs: ttlMs), as: PhoneLeaseGrant.self)
    }

    /// Release control so the Mac session or a person can take the device.
    /// @param holder - the identity that acquired it.
    func releaseLease(holder: String) async throws {
        _ = try await callRaw("lease.release", PhoneLeaseReleaseRequest(holder: holder))
    }

    /// Read the current screen.
    /// @param maxElements - most elements to return.
    /// @param includeOcr - "auto", "always", or "never".
    func observe(maxElements: Int = 80, includeOcr: String = "auto") async throws -> PhoneObservation {
        try await call(
            "observe",
            PhoneObserveRequest(maxElements: maxElements, includeOcr: includeOcr, screenshot: nil),
            as: PhoneObservation.self
        )
    }

    /// Perform one action and read the screen afterwards.
    /// @param action - gesture, text entry, launch, or wait.
    /// @param observeAfter - whether the answer carries a fresh observation.
    func act(_ action: PhoneAction, observeAfter: Bool = true) async throws -> PhoneActResult {
        try await call("act", PhoneActRequest(action: action, observeAfter: observeAfter, confirmToken: nil), as: PhoneActResult.self)
    }

    /// Capture the screen as a JPEG.
    func screenshot(maxEdge: Int = 1280, quality: Double = 0.5) async throws -> PhoneScreenshot {
        try await call("screenshot", PhoneScreenshotRequest(maxEdge: maxEdge, quality: quality), as: PhoneScreenshot.self)
    }

    /// Hand the paired Host to the runner so the Mac session can drive this phone.
    /// @param request - Host base, credential, and this device's identity.
    func setLink(_ request: PhoneLinkSetRequest) async throws {
        _ = try await callRaw("link.set", request)
    }

    /// Stop the runner's outbound Host connection.
    func clearLink() async throws {
        _ = try await callRaw("link.clear", PhoneEmptyRequest())
    }

    /// Recent runner log lines, for the diagnosis sheet.
    func recentLog() async throws -> [String] {
        try await call("log.recent", PhoneEmptyRequest(), as: [String].self)
    }

    // MARK: - Tasks

    /// Ask the runner to run one goal by itself.
    /// @param goal - the task in plain words.
    /// @param provider - model endpoint, key, and model id.
    /// @param maxSteps - step budget.
    /// @returns the run identity.
    func startTask(goal: String, provider: PhoneProviderChoice, maxSteps: Int = 30) async throws -> String {
        let value = try await callRaw(
            "task.start",
            PhoneTaskStartRequest(goal: goal, provider: provider, maxSteps: maxSteps, startApp: nil)
        )
        return value["runId"]?.stringValue ?? ""
    }

    /// Read one task's progress.
    /// @param runId - task identity; the newest task when nil.
    func taskStatus(runId: String? = nil) async throws -> PhoneTaskStatus {
        let value = try await callRaw("task.status", PhoneTaskIdRequest(runId: runId))
        return try value.decode(PhoneTaskStatus.self)
    }

    /// Stop one task.
    /// @param runId - task identity; the newest task when nil.
    func stopTask(runId: String? = nil) async throws {
        _ = try await callRaw("task.stop", PhoneTaskIdRequest(runId: runId))
    }

    // MARK: - Transport

    private func call<Result: Decodable>(_ method: String, _ params: some Encodable, as: Result.Type) async throws -> Result {
        let value = try await callRaw(method, params)
        do {
            return try value.decode(Result.self)
        } catch {
            throw RunnerLinkError.malformed("\(method) 的结果无法解析")
        }
    }

    private func callRaw(_ method: String, _ params: some Encodable) async throws -> PhoneJSON {
        guard let credential else { throw RunnerLinkError.notPaired }
        let body = try PhoneRPCRequest(id: UUID().uuidString, method: method, params: PhoneJSON.from(params))
        var request = URLRequest(url: base.appendingPathComponent("rpc"))
        request.httpMethod = "POST"
        request.timeoutInterval = method == "act" ? 35 : 20
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(credential)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(body)
        let data: Data
        do {
            (data, _) = try await Self.session.data(for: request)
        } catch {
            throw RunnerLinkError.transport("runner 没有响应：\(error.localizedDescription)")
        }
        let envelope: PhoneRPCResponse
        do {
            envelope = try JSONDecoder().decode(PhoneRPCResponse.self, from: data)
        } catch {
            throw RunnerLinkError.malformed("runner 的回应无法解析")
        }
        if let failure = envelope.error {
            throw RunnerLinkError.remote(failure)
        }
        return envelope.result ?? .null
    }
}
