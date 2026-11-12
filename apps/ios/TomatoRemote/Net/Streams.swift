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
/// thrown `HubError`, never as a silent end.
enum RemoteStream {
    /// @param argName - the Host method's parameter key for `payload`; nil opens a
    ///   stream whose method takes no argument, which still sends an empty `args`.
    static func frames(
        base: URL,
        cookie: String,
        endpoint: String,
        argName: String? = "request",
        payload: some Encodable
    ) -> AsyncThrowingStream<JSONValue, Error> {
        AsyncThrowingStream { continuation in
            let task = Task {
                let streamId = UUID().uuidString
                let tag = streamId.prefix(8)
                let started = CFAbsoluteTimeGetCurrent()
                AppLog.debug(.stream, "打开 \(endpoint)", detail: "#\(tag)")
                do {
                    let socket = try RemoteSocket(base: base, cookie: cookie)
                    defer { socket.close() }
                    // A handshake that never completes would otherwise surface as a
                    // read failure an hour later; the reader gets a bounded attempt.
                    try await socket.awaitOpen(timeout: 15)
                    AppLog.info(
                        .stream,
                        "已连接 \(endpoint)",
                        detail: "#\(tag) · \(Self.milliseconds(since: started)) ms"
                    )
                    try await socket.send(openFrame(
                        streamId: streamId,
                        endpoint: endpoint,
                        argName: argName,
                        payload: payload
                    ))
                    let heartbeat = socket.startHeartbeat(interval: 20)
                    defer { heartbeat.cancel() }
                    var items = 0
                    while !Task.isCancelled {
                        guard let message = try await socket.receive() else {
                            AppLog.info(.stream, "连接关闭 \(endpoint)", detail: "#\(tag) · \(items) 帧")
                            continuation.finish()
                            return
                        }
                        guard let frame = Self.parse(message), frame.streamId == streamId else { continue }
                        switch frame.type {
                        case "item":
                            if let value = frame.value {
                                items += 1
                                continuation.yield(value)
                            }
                        case "end":
                            AppLog.debug(.stream, "Host 结束流 \(endpoint)", detail: "#\(tag) · \(items) 帧")
                            continuation.finish()
                            return
                        case "error":
                            let code = frame.error?["code"]?.stringValue ?? "unknown"
                            let message = frame.error?["message"]?.stringValue ?? "Host 关闭了事件流"
                            AppLog.warning(.stream, "Host 拒绝流 \(endpoint)", detail: "#\(tag) · \(code)")
                            continuation.finish(throwing: HubError.stream(code: code, message: message))
                            return
                        default:
                            // Frame types are merge-extensible: a newer Host may
                            // send one this build does not know, and the stream
                            // stays usable without it.
                            continue
                        }
                    }
                    continuation.finish()
                } catch is CancellationError {
                    AppLog.debug(.stream, "取消流 \(endpoint)", detail: "#\(tag)")
                    continuation.finish()
                } catch {
                    let classified = Self.classify(error)
                    AppLog.error(
                        .stream,
                        "流失败 \(endpoint)",
                        detail: "#\(tag) · \(describe(classified))"
                    )
                    continuation.finish(throwing: classified)
                }
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    /// Elapsed milliseconds, rounded, for a log detail.
    /// - Parameter start: `CFAbsoluteTimeGetCurrent()` the attempt began at.
    /// - Returns: the elapsed time in milliseconds.
    private static func milliseconds(since start: CFAbsoluteTime) -> Int {
        Int(((CFAbsoluteTimeGetCurrent() - start) * 1000).rounded())
    }

    // MARK: Frames

    /// One `open` frame. `payload` carries the same `{args: …}` wrapper the HTTP
    /// carrier uses, because both reach the same Remote decoder.
    private static func openFrame(
        streamId: String,
        endpoint: String,
        argName: String?,
        payload: some Encodable
    ) throws -> String {
        let encoded = try JSONEncoder().encode(payload)
        let value = try JSONValue.from(JSONSerialization.jsonObject(with: encoded))
        let args = argName.map { [$0: value.omittingNullMembers()] } ?? [:]
        let frame: [String: JSONValue] = [
            "type": .string("open"),
            "streamId": .string(streamId),
            "endpoint": .string(endpoint),
            "payload": .object(["args": .object(args)]),
        ]
        let data = try JSONEncoder().encode(JSONValue.object(frame))
        guard let text = String(data: data, encoding: .utf8) else {
            throw HubError.stream(code: nil, message: "无法编码 open 帧")
        }
        return text
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

    /// Report a failed handshake or a dropped socket the way a reader can act on.
    ///
    /// `URLSessionWebSocketTask` exposes no status line, so a Host that answers
    /// the upgrade with `401` reaches this layer as CFNetwork's
    /// `NSURLErrorBadServerResponse` (`-1011`). The mux answers only `401`,
    /// `403` and `409`, and every one of them means this cookie may no longer
    /// be presented: the reader needs the pairing prompt, not that sentence.
    /// Everything else — a tunnel that dropped the connection, a phone that
    /// changed network — is worth reconnecting from, so it stays a transport
    /// failure.
    /// @param error - failure thrown while opening or reading the socket.
    /// @returns the failure that describes what the reader must do.
    static func classify(_ error: Error) -> Error {
        let failure = error as NSError
        if failure.domain == NSURLErrorDomain, failure.code == NSURLErrorBadServerResponse {
            return HubError.handshakeRefused
        }
        if failure.domain == NSPOSIXErrorDomain
            || (failure.domain == NSURLErrorDomain && Self.isConnectivityCode(failure.code))
        {
            return HubError.transport("连接已断开")
        }
        return error
    }

    /// CFNetwork codes that describe a link, not a request: the next attempt
    /// over the same base and cookie may succeed.
    /// @param code - `NSURLErrorDomain` code.
    /// @returns true when reconnecting is the right response.
    static func isConnectivityCode(_ code: Int) -> Bool {
        switch code {
        case NSURLErrorTimedOut,
             NSURLErrorCannotFindHost,
             NSURLErrorCannotConnectToHost,
             NSURLErrorNetworkConnectionLost,
             NSURLErrorNotConnectedToInternet,
             NSURLErrorSecureConnectionFailed,
             NSURLErrorCannotLoadFromNetwork:
            true
        default:
            false
        }
    }
}

/// One mux socket and the `URLSession` that owns it.
///
/// The session must outlive the task: a `URLSessionWebSocketTask` whose session
/// has been released fails every later read with `-57 "Socket is not
/// connected"`, which a reader sees as an endless reconnect loop. The
/// connection therefore keeps both, reports its handshake, and answers pings
/// so an idle tunnel does not decide the connection is dead.
final class RemoteSocket: NSObject, URLSessionWebSocketDelegate, @unchecked Sendable {
    private var session: URLSession!
    private var socket: URLSessionWebSocketTask!
    private let stateLock = NSLock()
    private var opened = false
    /// Settled handshake outcome, kept so a late waiter sees it instead of hanging.
    private var openResult: Result<Void, Error>?
    private var openWaiter: CheckedContinuation<Void, Error>?
    private var closed = false

    /// @param base - Host root the socket addresses.
    /// @param cookie - complete `name=value` cookie header value from the Keychain.
    /// @throws HubError.invalidBaseURL when the mux URL cannot be built.
    init(base: URL, cookie: String) throws {
        super.init()
        let trimmed = base.absoluteString.hasSuffix("/")
            ? String(base.absoluteString.dropLast())
            : base.absoluteString
        guard let url = URL(string: trimmed + "/api/remote.mux") else { throw HubError.invalidBaseURL }
        var request = URLRequest(url: url)
        if !cookie.isEmpty {
            request.setValue(cookie, forHTTPHeaderField: "Cookie")
            // Current CFNetwork carries the hand-built header into the
            // handshake. Older releases drop it for an HTTPS origin, so mirror
            // the pair into the shared store as well.
            Self.storeCookie(cookie, for: url)
        }
        let configuration = URLSessionConfiguration.default
        configuration.httpCookieStorage = .shared
        configuration.timeoutIntervalForRequest = 60
        configuration.waitsForConnectivity = false
        session = URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
        socket = session.webSocketTask(with: request)
        socket.resume()
    }

    /// Wait for the delegate to report the upgrade, bounded by a timeout.
    ///
    /// The delegate decides the outcome; the timeout only bounds how long the
    /// caller may wait for it, so a black-holed link cannot hang the stream.
    /// @param timeout - seconds to wait before reporting an unresponsive Host.
    /// @throws HubError.transport when the upgrade never completed in time.
    func awaitOpen(timeout: TimeInterval) async throws {
        let timer = Task { [weak self] in
            try? await Task.sleep(nanoseconds: UInt64(timeout * 1_000_000_000))
            self?.resolveOpen(.failure(HubError.transport("连接超时")))
        }
        defer { timer.cancel() }
        try await withCheckedThrowingContinuation { continuation in
            stateLock.lock()
            if let result = openResult {
                stateLock.unlock()
                switch result {
                case .success:
                    continuation.resume()
                case let .failure(error):
                    continuation.resume(throwing: error)
                }
                return
            }
            openWaiter = continuation
            stateLock.unlock()
        }
    }

    /// Settle the handshake exactly once: whichever of the delegate, the timeout,
    /// or teardown arrives first decides the outcome for the waiting caller.
    /// @param result - the upgrade outcome.
    private func resolveOpen(_ result: Result<Void, Error>) {
        stateLock.lock()
        guard openResult == nil else {
            stateLock.unlock()
            return
        }
        openResult = result
        let waiter = openWaiter
        openWaiter = nil
        stateLock.unlock()
        switch result {
        case .success:
            waiter?.resume()
        case let .failure(error):
            waiter?.resume(throwing: error)
        }
    }

    /// @param text - one JSON frame.
    func send(_ text: String) async throws {
        try await socket.send(.string(text))
    }

    /// @returns the next text frame, or nil when the socket closed cleanly.
    func receive() async throws -> String? {
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

    /// Keep an idle link alive through tunnels that close silent sockets.
    /// @param interval - seconds between pings.
    /// @returns the task that pings until the socket stops answering.
    func startHeartbeat(interval: TimeInterval) -> Task<Void, Never> {
        Task { [weak self] in
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: UInt64(interval * 1_000_000_000))
                if Task.isCancelled {
                    return
                }
                guard let self else { return }
                let alive = await ping()
                if !alive {
                    AppLog.warning(.stream, "心跳无响应，连接判定为断开")
                    return
                }
            }
        }
    }

    /// @returns false when the peer no longer answers, which ends the heartbeat.
    private func ping() async -> Bool {
        await withCheckedContinuation { continuation in
            socket.sendPing { error in
                continuation.resume(returning: error == nil)
            }
        }
    }

    /// Tear the socket down and release the session and its delegate.
    func close() {
        stateLock.lock()
        if closed {
            stateLock.unlock()
            return
        }
        closed = true
        stateLock.unlock()
        AppLog.debug(.stream, "关闭 WebSocket")
        // A caller still waiting on the handshake must not wait out its timeout
        // after the stream was told to stop.
        resolveOpen(.failure(CancellationError()))
        socket.cancel(with: .goingAway, reason: nil)
        session.invalidateAndCancel()
    }

    // MARK: URLSessionWebSocketDelegate

    func urlSession(
        _ session: URLSession,
        webSocketTask: URLSessionWebSocketTask,
        didOpenWithProtocol protocol: String?
    ) {
        stateLock.lock()
        opened = true
        stateLock.unlock()
        resolveOpen(.success(()))
    }

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didCompleteWithError error: Error?
    ) {
        guard let error else { return }
        let failure = error as NSError
        AppLog.warning(
            .stream,
            "WebSocket 结束",
            detail: "\(failure.domain) \(failure.code) · \(failure.localizedDescription)"
        )
        stateLock.lock()
        let opened = opened
        stateLock.unlock()
        // A failed upgrade completes the task with CFNetwork's error before any
        // frame arrives; keeping it lets `awaitOpen` report a refused cookie at
        // once instead of waiting out the timeout.
        guard !opened else { return }
        resolveOpen(.failure(RemoteStream.classify(error)))
    }

    // MARK: Cookie

    /// Remove the mirrored pairing cookie from the shared store.
    ///
    /// CFNetwork would otherwise keep presenting it to that host for a month,
    /// including after the person unpaired the device.
    /// @param url - the Host root the cookie was stored for.
    static func forgetCookie(for url: URL) {
        guard let host = url.host else { return }
        for cookie in HTTPCookieStorage.shared.cookies(for: url) ?? [] where cookie.domain == host {
            HTTPCookieStorage.shared.deleteCookie(cookie)
        }
    }

    /// Put the pairing cookie into the shared store so CFNetwork attaches it to
    /// the upgrade request.
    /// @param cookie - complete `name=value` header value from the Keychain.
    /// @param url - the mux URL the handshake addresses.
    private static func storeCookie(_ cookie: String, for url: URL) {
        let pair = cookie.split(separator: "=", maxSplits: 1).map(String.init)
        guard pair.count == 2, let host = url.host, let stored = HTTPCookie(properties: [
            .domain: host,
            .path: "/",
            .name: pair[0],
            .value: pair[1],
            .secure: url.scheme == "https" ? "TRUE" : "FALSE",
            .expires: Date(timeIntervalSinceNow: 60 * 60 * 24 * 30),
        ]) else { return }
        HTTPCookieStorage.shared.setCookie(stored)
    }
}
