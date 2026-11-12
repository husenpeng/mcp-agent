//
//  HostLink.swift
//  Tomato Runner
//
//  Outbound connection to the Host.
//
//  The runner dials the Host, never the other way round: the phone may sit
//  behind a LAN, a tailnet, or the desktop tunnel, and a DeviceManager on the Mac
//  has no inbound port to reach. Commands arrive on the attach stream and each
//  outcome is posted as a unary call, so a dropped socket loses no input — the
//  Host fails its own call instead of replaying it.
//

import Foundation

/// Maintains one attach stream to the Host and executes its commands.
final class HostLink: @unchecked Sendable {
    private let engine: Engine
    private let queue = DispatchQueue(label: "ai.tomato.runner.hostlink")
    private let session: URLSession
    private var task: URLSessionWebSocketTask?
    private var config: PhoneLinkSetRequest?
    private var attachId: String?
    private var attempt = 0
    private var stopped = true
    private var cancelled = Set<String>()

    init(engine: Engine) {
        self.engine = engine
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.waitsForConnectivity = false
        session = URLSession(configuration: configuration)
    }

    /// Apply new Host credentials, replacing any live connection.
    /// @param config - Host base, credential, and this device's identity.
    func configure(_ config: PhoneLinkSetRequest) {
        queue.async {
            self.config = config
            self.task?.cancel(with: .goingAway, reason: nil)
            self.task = nil
            self.attachId = nil
            self.attempt = 0
            if self.stopped {
                self.stopped = false
                self.connectLoop()
            }
        }
    }

    /// Drop the connection and forget the credentials.
    func stop() {
        queue.async {
            self.stopped = true
            self.config = nil
            self.task?.cancel(with: .goingAway, reason: nil)
            self.task = nil
            self.attachId = nil
            self.engine.setLinkState("off")
        }
    }

    // MARK: - Connection

    private func connectLoop() {
        guard !stopped, let config else { return }
        guard let base = URL(string: config.hostBase) else {
            engine.setLinkState("off")
            return
        }
        engine.setLinkState(attempt == 0 ? "connecting" : "reconnecting")
        var request = URLRequest(url: base.appendingPathComponent("api/remote.mux").absoluteURL)
        request.setValue(config.credential, forHTTPHeaderField: "Cookie")
        var components = URLComponents(url: base.appendingPathComponent("api/remote.mux"), resolvingAgainstBaseURL: false)
        components?.scheme = base.scheme == "https" ? "wss" : "ws"
        guard let url = components?.url else { return }
        request.url = url
        let task = session.webSocketTask(with: request)
        self.task = task
        task.resume()
        do {
            let streamId = UUID().uuidString
            let attach = PhoneAttachRequest(
                deviceId: config.deviceId,
                deviceName: config.deviceName,
                protocol: PhoneProtocol.version,
                runnerVersion: engine.health().runnerVersion,
                screen: engine.health().screen,
                capabilities: ["observe", "screenshot", "act", "ocr"]
            )
            let frame = try HostWire.openFrame(streamId: streamId, request: attach)
            task.send(.string(frame)) { [weak self] error in
                guard let self else { return }
                if let error {
                    Log.shared.append("hostlink open failed: \(error.localizedDescription)")
                    self.reconnect()
                } else {
                    self.receive(on: task, streamId: streamId)
                }
            }
        } catch {
            Log.shared.append("hostlink attach encode failed")
            reconnect()
        }
    }

    private func receive(on task: URLSessionWebSocketTask, streamId: String) {
        task.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case let .failure(error):
                Log.shared.append("hostlink closed: \(error.localizedDescription)")
                self.reconnect()
            case let .success(message):
                if case let .string(text) = message {
                    self.handle(text: text, streamId: streamId)
                }
                guard self.task === task, !self.stopped else { return }
                self.receive(on: task, streamId: streamId)
            }
        }
    }

    private func reconnect() {
        guard !stopped else { return }
        task?.cancel(with: .goingAway, reason: nil)
        task = nil
        attachId = nil
        engine.setLinkState("connecting")
        attempt += 1
        let delay = min(30.0, pow(2.0, Double(min(attempt, 5))))
        queue.asyncAfter(deadline: .now() + delay) { [weak self] in
            guard let self, !self.stopped else { return }
            self.connectLoop()
        }
    }

    // MARK: - Frames

    private func handle(text: String, streamId: String) {
        guard let data = text.data(using: .utf8),
              let frame = try? JSONDecoder().decode(PhoneJSON.self, from: data)
        else { return }
        switch frame["type"]?.stringValue {
        case "item":
            guard let value = frame["value"] else { return }
            handleDown(frame: value)
        case "end":
            Log.shared.append("hostlink stream ended")
            reconnect()
        case "error":
            Log.shared.append("hostlink stream error: \(frame["error"]?["code"]?.stringValue ?? "unknown")")
            reconnect()
        default:
            break
        }
    }

    private func handleDown(frame: PhoneJSON) {
        switch frame["type"]?.stringValue {
        case "ready":
            attachId = frame["attachId"]?.stringValue
            attempt = 0
            engine.setLinkState("attached")
            Log.shared.append("hostlink attached")
        case "command":
            guard let commandId = frame["commandId"]?.stringValue,
                  let method = frame["method"]?.stringValue
            else { return }
            cancelled.remove(commandId)
            let params = frame["params"] ?? .object([:])
            let attachId = self.attachId ?? ""
            let deadline = Double(frame["deadlineMs"]?.intValue ?? 15_000) / 1000
            DispatchQueue.main.async { [weak self] in
                guard let self else { return }
                let outcome = self.engine.perform(method: method, params: params, deadline: deadline)
                self.queue.async {
                    if self.cancelled.contains(commandId) {
                        self.cancelled.remove(commandId)
                        Log.shared.append("hostlink dropped late result for \(method)")
                        return
                    }
                    self.post(commandId: commandId, attachId: attachId, method: method, outcome: outcome)
                }
            }
        case "cancel":
            if let commandId = frame["commandId"]?.stringValue {
                cancelled.insert(commandId)
            }
        case "ping":
            break
        default:
            break
        }
    }

    private func post(commandId: String, attachId: String, method: String, outcome: Result<PhoneJSON, PhoneFailure>) {
        guard let config else { return }
        var request: [String: PhoneJSON] = [
            "attachId": .string(attachId),
            "commandId": .string(commandId),
        ]
        switch outcome {
        case let .success(value):
            request["ok"] = .bool(true)
            request["value"] = value
        case let .failure(failure):
            request["ok"] = .bool(false)
            var error: [String: PhoneJSON] = [
                "code": .string(failure.code),
                "message": .string(failure.message),
                "retryable": .bool(failure.retryable),
            ]
            if let details = failure.details {
                error["details"] = details
            }
            request["error"] = .object(error)
        }
        guard let base = URL(string: config.hostBase),
              let body = try? HostWire.clientRequest(
                rpcId: UUID().uuidString,
                method: "phone/result",
                request: .object(request)
              )
        else { return }
        var urlRequest = URLRequest(url: base.appendingPathComponent("api/phone/result"))
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.setValue(config.credential, forHTTPHeaderField: "Cookie")
        urlRequest.httpBody = body
        session.dataTask(with: urlRequest) { [weak self] data, response, error in
            guard let self else { return }
            if let error {
                Log.shared.append("hostlink result post failed: \(error.localizedDescription)")
                return
            }
            guard let http = response as? HTTPURLResponse, (200 ..< 300).contains(http.statusCode) else {
                Log.shared.append("hostlink result rejected: HTTP \((response as? HTTPURLResponse)?.statusCode ?? 0)")
                return
            }
            if let data,
               let decoded = try? JSONDecoder().decode(HostWire.Response.self, from: data),
               decoded.result.ok == false
            {
                Log.shared.append("hostlink result rejected by Host: \(decoded.result.error?.code ?? "unknown")")
            }
            _ = data
        }.resume()
    }
}
