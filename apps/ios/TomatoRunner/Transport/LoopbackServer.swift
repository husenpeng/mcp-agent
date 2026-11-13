//
//  LoopbackServer.swift
//  Tomato Runner
//
//  The device-local endpoint: `POST /rpc` for control, `POST /pair` for the
//  application on this device, `GET /health` for readiness.
//
//  The listener binds 127.0.0.1 only. Any application on the phone can reach a
//  loopback port, so everything except health and pairing requires the bearer
//  key issued at pairing.
//

import Darwin
import Foundation

/// Pairing approval state and the credential issued once a person allows it.
final class PairCoordinator {
    static let shared = PairCoordinator()

    private let lock = NSLock()
    private var credential: String?
    private var pending: ((Bool) -> Void)?
    private var approvalRequested = false

    /// Read the stored credential, or nil before pairing.
    var currentCredential: String? {
        lock.lock()
        defer { lock.unlock() }
        return credential
    }

    /// Load a credential persisted by an earlier launch.
    /// @param value - credential read from disk.
    func restore(_ value: String) {
        lock.lock()
        credential = value
        lock.unlock()
    }

    /// Issue a credential, ending any pending request as refused.
    /// @returns the new credential.
    @discardableResult
    func issueCredential() -> String {
        var bytes = [UInt8](repeating: 0, count: 32)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        let value = Data(bytes).base64EncodedString()
        lock.lock()
        credential = value
        let waiting = pending
        pending = nil
        lock.unlock()
        waiting?(true)
        return value
    }

    /// Ask the device owner to allow this pairing.
    /// @param completion - called with the decision.
    func requestApproval(completion: @escaping (Bool) -> Void) {
        lock.lock()
        let already = pending != nil
        pending = completion
        let shouldPost = !already
        lock.unlock()
        guard shouldPost else { return }
        Notifier.postPairingRequest()
    }

    /// Settle the pending request from a notification action.
    /// @param allowed - whether the owner allowed control.
    func settle(allowed: Bool) {
        lock.lock()
        let waiting = pending
        pending = nil
        lock.unlock()
        waiting?(allowed)
    }
}

/// Loopback HTTP server backed by a blocking BSD socket.
final class LoopbackServer {
    private let engine: Engine
    private let port: UInt16
    private var listenFD: Int32 = -1
    private let acceptQueue = DispatchQueue(label: "ai.tomato.runner.accept")
    private let workerQueue = DispatchQueue(label: "ai.tomato.runner.workers", attributes: .concurrent)
    private var stopped = false

    init(engine: Engine, port: UInt16) {
        self.engine = engine
        self.port = port
    }

    /// Start listening; returns false when the port cannot be bound.
    @discardableResult
    func start() -> Bool {
        let fd = socket(AF_INET, SOCK_STREAM, 0)
        guard fd >= 0 else { return false }
        var reuse: Int32 = 1
        setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &reuse, socklen_t(MemoryLayout<Int32>.size))
        var address = sockaddr_in()
        address.sin_family = sa_family_t(AF_INET)
        address.sin_port = port.bigEndian
        address.sin_addr.s_addr = inet_addr("127.0.0.1")
        let size = socklen_t(MemoryLayout<sockaddr_in>.size)
        let bound = withUnsafePointer(to: &address) { pointer in
            pointer.withMemoryRebound(to: sockaddr.self, capacity: 1) { bind(fd, $0, size) }
        }
        guard bound == 0, listen(fd, 16) == 0 else {
            close(fd)
            return false
        }
        listenFD = fd
        acceptQueue.async { [weak self] in
            self?.acceptLoop()
        }
        Log.shared.append("loopback listening on 127.0.0.1:\(port)")
        return true
    }

    /// Stop accepting; in-flight requests finish on their own.
    func stop() {
        stopped = true
        if listenFD >= 0 {
            shutdown(listenFD, SHUT_RDWR)
            close(listenFD)
            listenFD = -1
        }
    }

    private func acceptLoop() {
        while !stopped {
            var clientAddress = sockaddr()
            var length = socklen_t(MemoryLayout<sockaddr>.size)
            let client = accept(listenFD, &clientAddress, &length)
            guard client >= 0 else {
                if stopped {
                    return
                }
                continue
            }
            workerQueue.async { [weak self] in
                self?.serve(client)
            }
        }
    }

    private func serve(_ client: Int32) {
        defer { close(client) }
        guard let request = HTTP.readRequest(fd: client) else {
            HTTP.respond(fd: client, status: 400, body: Data("{}".utf8))
            return
        }
        switch (request.method, request.path) {
        case ("GET", "/health"):
            respondJSON(client, 200, healthBody())
        case ("POST", "/pair"):
            respondPair(client)
        case ("POST", "/rpc"):
            respondRPC(client, request: request)
        default:
            HTTP.respond(fd: client, status: 404, body: Data("{}".utf8))
        }
    }

    private func healthBody() -> Data {
        let health = engine.health()
        let value = try? PhoneJSON.from(health)
        return (try? JSONEncoder().encode(value ?? .null)) ?? Data("{}".utf8)
    }

    private func respondJSON(_ client: Int32, _ status: Int, _ body: Data) {
        HTTP.respond(fd: client, status: status, body: body)
    }

    private func respondPair(_ client: Int32) {
        let coordinator = PairCoordinator.shared
        // An automated device check cannot tap a notification. The bypass is
        // opt-in per launch and absent unless the environment asks for it.
        if ProcessInfo.processInfo.environment["TOMATO_RUNNER_AUTOPAIR"] == "1" {
            let credential = coordinator.currentCredential ?? coordinator.issueCredential()
            CredentialStore.save(credential)
            let payload = ["credential": credential]
            respondJSON(client, 200, (try? JSONEncoder().encode(payload)) ?? Data("{}".utf8))
            return
        }
        if let existing = coordinator.currentCredential {
            let payload = ["credential": existing]
            respondJSON(client, 200, (try? JSONEncoder().encode(payload)) ?? Data("{}".utf8))
            return
        }
        let semaphore = DispatchSemaphore(value: 0)
        var allowed = false
        coordinator.requestApproval { decision in
            allowed = decision
            semaphore.signal()
        }
        if semaphore.wait(timeout: .now() + 60) == .timedOut {
            coordinator.settle(allowed: false)
            let failure = PhoneFailure(.pairDenied, "配对请求 60 秒内没有被允许")
            respondJSON(client, 200, (try? JSONEncoder().encode(PhoneRPCResponse.failure(id: "pair", failure))) ?? Data("{}".utf8))
            return
        }
        guard allowed else {
            let failure = PhoneFailure(.pairDenied, "设备所有者拒绝了配对")
            respondJSON(client, 200, (try? JSONEncoder().encode(PhoneRPCResponse.failure(id: "pair", failure))) ?? Data("{}".utf8))
            return
        }
        let credential = coordinator.currentCredential ?? coordinator.issueCredential()
        CredentialStore.save(credential)
        let payload = ["credential": credential]
        respondJSON(client, 200, (try? JSONEncoder().encode(payload)) ?? Data("{}".utf8))
    }

    private func respondRPC(_ client: Int32, request: HTTPRequest) {
        guard let bearer = request.header("authorization")?.replacingOccurrences(of: "Bearer ", with: ""),
              let current = PairCoordinator.shared.currentCredential,
              bearer == current
        else {
            let failure = PhoneFailure(.unauthorized, "缺少或错误的设备密钥")
            let body = (try? JSONEncoder().encode(PhoneRPCResponse.failure(id: "unknown", failure))) ?? Data("{}".utf8)
            respondJSON(client, 401, body)
            return
        }
        guard let envelope = try? JSONDecoder().decode(PhoneRPCRequest.self, from: request.body) else {
            let failure = PhoneFailure(.badRequest, "请求体不是合法的 JSON-RPC")
            let body = (try? JSONEncoder().encode(PhoneRPCResponse.failure(id: "unknown", failure))) ?? Data("{}".utf8)
            respondJSON(client, 400, body)
            return
        }
        if envelope.method == "health" {
            respondJSON(
                client,
                200,
                (try? JSONEncoder().encode(try PhoneRPCResponse.success(id: envelope.id, value: PhoneJSON.from(engine.health())))) ??
                    Data("{}".utf8)
            )
            return
        }
        if envelope.method == "server.stop" {
            let response = PhoneRPCResponse.success(id: envelope.id, value: .object(["stopped": .bool(true)]))
            respondJSON(client, 200, (try? JSONEncoder().encode(response)) ?? Data("{}".utf8))
            RunnerExit.request()
            return
        }
        let deadline: TimeInterval = envelope.method == "act" ? 30 : 15
        let outcome = engine.perform(method: envelope.method, params: envelope.params, deadline: deadline)
        let response: PhoneRPCResponse = switch outcome {
        case let .success(value):
            .success(id: envelope.id, value: value)
        case let .failure(failure):
            .failure(id: envelope.id, failure)
        }
        respondJSON(client, 200, (try? JSONEncoder().encode(response)) ?? Data("{}".utf8))
    }
}

/// Persists the pairing credential in the runner's own container.
enum CredentialStore {
    private static let url: URL? = {
        guard let directory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first else { return nil }
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        return directory.appendingPathComponent("runner-credential.json")
    }()

    static func save(_ credential: String) {
        guard let url else { return }
        try? JSONEncoder().encode(["credential": credential]).write(to: url, options: [.completeFileProtection, .atomic])
    }

    static func load() -> String? {
        guard let url, let data = try? Data(contentsOf: url),
              let value = try? JSONDecoder().decode([String: String].self, from: data)
        else { return nil }
        return value["credential"]
    }
}
