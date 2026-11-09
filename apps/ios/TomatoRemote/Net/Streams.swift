//
//  Streams.swift
//  Tomato Remote
//
//  The stream half of the wire: one WebSocket carrying every Remote stream.
//
//  Frames, both directions, are JSON text:
//    → { type: "open", streamId, endpoint, payload }
//    → { type: "cancel", streamId }
//    ← { type: "item", streamId, value }
//    ← { type: "end", streamId }
//    ← { type: "error", streamId, error: { code, message } }
//

import Foundation

/// Opens one multiplexed Remote stream and yields its `item` values.
///
/// The socket closes when the caller stops iterating, when the Host ends the
/// stream, or when the connection fails. A failed connection surfaces as a
/// thrown `HubError.stream`, never as a silent end.
enum RemoteStream {
    /// @param argName - the Host method's parameter key for `payload`; nil opens a
    ///   stream whose method takes no argument, which still sends an empty `args`.
    static func frames<Payload: Encodable>(
        base: URL,
        cookie: String,
        endpoint: String,
        argName: String? = "request",
        payload: Payload
    ) -> AsyncThrowingStream<JSONValue, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                let streamId = UUID().uuidString
                do {
                    let socket = try Self.openSocket(base: base, cookie: cookie)
                    defer { socket.cancel(with: .goingAway, reason: nil) }
                    try await Self.sendOpen(socket: socket, streamId: streamId, endpoint: endpoint, argName: argName, payload: payload)
                    while !Task.isCancelled {
                        guard let message = try await Self.receive(socket: socket) else {
                            continuation.finish()
                            return
                        }
                        guard let frame = Self.parse(message), frame.streamId == streamId else { continue }
                        switch frame.type {
                        case "item":
                            if let value = frame.value { continuation.yield(value) }
                        case "end":
                            continuation.finish()
                            return
                        case "error":
                            let code = frame.error?["code"]?.stringValue ?? "unknown"
                            let message = frame.error?["message"]?.stringValue ?? "Host 关闭了事件流"
                            continuation.finish(throwing: HubError.stream("\(message)（\(code)）"))
                            return
                        default:
                            continue
                        }
                    }
                    continuation.finish()
                } catch is CancellationError {
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    // MARK: Internals

    private static func openSocket(base: URL, cookie: String) throws -> URLSessionWebSocketTask {
        let trimmed = base.absoluteString.hasSuffix("/")
            ? String(base.absoluteString.dropLast())
            : base.absoluteString
        guard let url = URL(string: trimmed + "/api/remote.mux") else { throw HubError.invalidBaseURL }
        var request = URLRequest(url: url)
        if !cookie.isEmpty {
            request.setValue(cookie, forHTTPHeaderField: "Cookie")
        }
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 60
        configuration.waitsForConnectivity = false
        let session = URLSession(configuration: configuration)
        let socket = session.webSocketTask(with: request)
        socket.resume()
        return socket
    }

    /// Open one logical stream. `payload` carries the same `{args: …}` wrapper the
    /// HTTP carrier uses, because both reach the same Remote decoder.
    private static func sendOpen<Payload: Encodable>(
        socket: URLSessionWebSocketTask,
        streamId: String,
        endpoint: String,
        argName: String?,
        payload: Payload
    ) async throws {
        let value = try JSONSerialization.jsonObject(with: JSONEncoder().encode(payload))
        let args = argName.map { [($0): value] } ?? [:]
        let frame: [String: Any] = [
            "type": "open",
            "streamId": streamId,
            "endpoint": endpoint,
            "payload": ["args": args],
        ]
        let data = try JSONSerialization.data(withJSONObject: frame)
        guard let text = String(data: data, encoding: .utf8) else {
            throw HubError.stream("无法编码 open 帧")
        }
        try await socket.send(.string(text))
    }

    private static func receive(socket: URLSessionWebSocketTask) async throws -> String? {
        let message = try await socket.receive()
        switch message {
        case let .string(text):
            return text
        case let .data(data):
            return String(data: data, encoding: .utf8)
        @unknown default:
            return nil
        }
    }

    private struct Frame {
        let type: String
        let streamId: String?
        let value: JSONValue?
        let error: [String: JSONValue]?
    }

    private static func parse(_ text: String) -> Frame? {
        guard let data = text.data(using: .utf8),
              let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let type = object["type"] as? String
        else { return nil }
        let envelope = JSONValue.from(object)
        return Frame(
            type: type,
            streamId: object["streamId"] as? String,
            value: envelope["value"],
            error: envelope["error"]?.objectValue
        )
    }
}