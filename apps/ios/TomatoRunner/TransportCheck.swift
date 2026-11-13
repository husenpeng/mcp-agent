//
//  TransportCheck.swift
//  Tomato Runner
//
//  Exercises the loopback HTTP endpoint from inside the device: health, pairing,
//  and one control call over the wire the application actually uses. The engine
//  is already covered by SelfCheck; this covers the server, the envelope, and
//  the bearer check.
//

import Foundation
import XCTest

/// One HTTP round trip against the runner's own endpoint.
enum TransportCheck {
    struct Step: Codable {
        let name: String
        let ok: Bool
        let ms: Int
        let detail: String
    }

    static func run(port: UInt16 = 18200) -> [Step] {
        var steps: [Step] = []
        // Seeded on purpose: the approval step needs a person, and it is checked
        // by hand in the application. This pass covers the wire, not the prompt.
        PairCoordinator.shared.restore("transport-check")
        let engine = Engine()
        let server = LoopbackServer(engine: engine, port: port)
        guard server.start() else {
            return [Step(name: "bind", ok: false, ms: 0, detail: "127.0.0.1:\(port) 无法绑定")]
        }
        defer { server.stop() }
        let base = URL(string: "http://127.0.0.1:\(port)")!

        var credential: String?

        step(&steps, "health") {
            let data = try get(base.appendingPathComponent("health"))
            let health = try JSONDecoder().decode(PhoneHealth.self, from: data)
            return "protocol \(health.protocol), screen \(Int(health.screen.width))x\(Int(health.screen.height))"
        }

        step(&steps, "pair") {
            var request = URLRequest(url: base.appendingPathComponent("pair"))
            request.httpMethod = "POST"
            request.httpBody = Data("{}".utf8)
            let data = try send(request)
            struct Reply: Decodable { let credential: String }
            let reply = try JSONDecoder().decode(Reply.self, from: data)
            credential = reply.credential
            return "credential \(reply.credential.count) chars"
        }

        step(&steps, "rpc-observe") {
            guard let credential else { throw CheckError.missing("credential") }
            let body = try PhoneRPCRequest(
                id: "1",
                method: "observe",
                params: PhoneJSON.from(PhoneObserveRequest(maxElements: 40, includeOcr: "auto", screenshot: nil))
            )
            let response = try rpc(base: base, credential: credential, body: body)
            let observation = try (response.result ?? .null).decode(PhoneObservation.self)
            return "\(observation.elements.count) elements"
        }

        step(&steps, "rpc-unauthorized") {
            let body = try PhoneRPCRequest(
                id: "2",
                method: "observe",
                params: PhoneJSON.from(PhoneObserveRequest(maxElements: 10, includeOcr: "never", screenshot: nil))
            )
            var request = URLRequest(url: base.appendingPathComponent("rpc"))
            request.httpMethod = "POST"
            request.httpBody = try JSONEncoder().encode(body)
            request.setValue("Bearer wrong", forHTTPHeaderField: "Authorization")
            let (data, response) = try sendWithResponse(request)
            guard (response as? HTTPURLResponse)?.statusCode == 401 else {
                throw CheckError.failed("错误的密钥没有被拒绝")
            }
            let envelope = try JSONDecoder().decode(PhoneRPCResponse.self, from: data)
            guard envelope.error?.code == PhoneErrorCode.unauthorized.rawValue else {
                throw CheckError.failed("拒绝原因不是 UNAUTHORIZED")
            }
            return "401 UNAUTHORIZED"
        }

        step(&steps, "rpc-lease") {
            guard let credential else { throw CheckError.missing("credential") }
            let body = try PhoneRPCRequest(
                id: "4",
                method: "lease.acquire",
                params: PhoneJSON.from(PhoneLeaseRequest(holder: "local:transport", ttlMs: 300_000))
            )
            let response = try rpc(base: base, credential: credential, body: body)
            let grant = try (response.result ?? .null).decode(PhoneLeaseGrant.self)
            return "granted \(grant.granted) for \(grant.holder)"
        }

        step(&steps, "rpc-launch") {
            guard let credential else { throw CheckError.missing("credential") }
            let body = try PhoneRPCRequest(
                id: "3",
                method: "act",
                params: PhoneJSON.from(PhoneActRequest(
                    action: PhoneAction(type: .launch, name: "设置", fresh: true),
                    observeAfter: true,
                    confirmToken: nil
                ))
            )
            let response = try rpc(base: base, credential: credential, body: body)
            let result = try (response.result ?? .null).decode(PhoneActResult.self)
            return "foreground \(result.foreground?.bundleId ?? "?"), pageChanged \(result.pageChanged)"
        }

        return steps
    }

    private enum CheckError: Error, CustomStringConvertible {
        case missing(String)
        case failed(String)

        var description: String {
            switch self {
            case let .missing(what): "缺少 \(what)"
            case let .failed(why): why
            }
        }
    }

    private static func step(_ steps: inout [Step], _ name: String, _ body: () throws -> String) {
        let started = Date()
        do {
            let detail = try body()
            steps.append(Step(name: name, ok: true, ms: Int(Date().timeIntervalSince(started) * 1000), detail: detail))
        } catch {
            let message = (error as? CustomStringConvertible)?.description ?? error.localizedDescription
            steps.append(Step(name: name, ok: false, ms: Int(Date().timeIntervalSince(started) * 1000), detail: message))
        }
    }

    private static func rpc(base: URL, credential: String, body: PhoneRPCRequest) throws -> PhoneRPCResponse {
        var request = URLRequest(url: base.appendingPathComponent("rpc"))
        request.httpMethod = "POST"
        request.httpBody = try JSONEncoder().encode(body)
        request.setValue("Bearer \(credential)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let data = try send(request)
        let envelope = try JSONDecoder().decode(PhoneRPCResponse.self, from: data)
        if let failure = envelope.error {
            throw CheckError.failed("\(failure.code): \(failure.message)")
        }
        return envelope
    }

    private static func get(_ url: URL) throws -> Data {
        try send(URLRequest(url: url))
    }

    private static func send(_ request: URLRequest) throws -> Data {
        try sendWithResponse(request).0
    }

    private static func sendWithResponse(_ request: URLRequest) throws -> (Data, URLResponse) {
        let semaphore = DispatchSemaphore(value: 0)
        var result: Result<(Data, URLResponse), Error>?
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error {
                result = .failure(error)
            } else if let data, let response {
                result = .success((data, response))
            } else {
                result = .failure(CheckError.failed("空响应"))
            }
            semaphore.signal()
        }.resume()
        // Spin the run loop instead of blocking: the server hands its work to
        // the main queue, so a blocked main thread would deadlock the call.
        _ = semaphore
        let deadline = Date().addingTimeInterval(40)
        while result == nil, Date() < deadline {
            RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.02))
        }
        guard result != nil else {
            throw CheckError.failed("请求超时")
        }
        switch result {
        case let .success(pair): return pair
        case let .failure(error): throw error
        case .none: throw CheckError.failed("没有结果")
        }
    }
}
