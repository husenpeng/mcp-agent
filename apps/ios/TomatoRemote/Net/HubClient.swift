//
//  HubClient.swift
//  Tomato Remote
//
//  The HTTP half of the wire. One `HubClient` is bound to a paired Host and
//  holds the session cookie read from the Keychain.
//

import Foundation

/// Calls the Remote API of one paired Host.
struct HubClient: Sendable {
    /// Host root, without a trailing slash, as the user entered it.
    let base: URL
    /// Complete `name=value` cookie header value minted at pairing time.
    let cookie: String
    /// Gateway account session (`tomato_session=…`) obtained by Feishu sign-in.
    /// Optional: a paired phone reads the Host's account without one.
    let accountCookie: String?
    /// Bearer token the Watchdog accepts. The Watchdog runs outside the Host and
    /// reads no session cookie, so its calls carry their own credential.
    let watchdogToken: String?

    /// The `Cookie` header value sent to the Host: the pairing credential plus
    /// the account session when the owner signed in on this phone.
    var cookieHeader: String {
        guard let accountCookie, !accountCookie.isEmpty else { return cookie }
        return cookie.isEmpty ? accountCookie : "\(cookie); \(accountCookie)"
    }

    private static let transport: URLSession = {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 120
        configuration.waitsForConnectivity = false
        return URLSession(configuration: configuration)
    }()

    init(base: URL, cookie: String, accountCookie: String? = nil, watchdogToken: String? = nil) {
        self.base = base
        self.cookie = cookie
        self.accountCookie = accountCookie
        self.watchdogToken = watchdogToken
    }

    // MARK: Endpoints

    func listSessions(cursor: String? = nil) async throws -> [SessionSummary] {
        let value = try await call("session/list", argName: "_request", body: SessionListRequest(cursor: cursor), as: SessionListValue.self)
        return value.items
    }

    func createSession(cwd: String? = nil, agentPreset: String? = nil) async throws -> SessionCreateValue {
        try await call("session/create", body: SessionCreateRequest(cwd: cwd, agentPreset: agentPreset), as: SessionCreateValue.self)
    }

    func renameSession(sessionId: String, title: String) async throws {
        try await callDiscarding("session/rename", body: SessionRenameRequest(sessionId: sessionId, title: title))
    }

    func cancelSession(sessionId: String) async throws {
        try await callDiscarding("session/cancel", body: SessionCancelRequest(sessionId: sessionId))
    }

    /// One backwards page of raw events, kept as JSON so a reader can fold the
    /// same values the live stream delivers.
    /// @param sessionId - Session whose log is read.
    /// @param throughSeq - newest sequence included in the page.
    /// @param beforeSeq - exclusive upper bound, or nil for the newest page.
    /// @param maxMessages - page size hint.
    /// @returns the page's events (oldest first) and whether older records exist.
    func pageEvents(
        sessionId: String,
        throughSeq: Double,
        beforeSeq: Double? = nil,
        maxMessages: Int? = nil
    ) async throws -> (events: [JSONValue], hasMore: Bool) {
        let request = SessionPageRequest(
            address: SessionAddress(sessionId: sessionId),
            throughSeq: throughSeq,
            beforeSeq: beforeSeq,
            maxMessages: maxMessages
        )
        let value = try await invoke("session/page", argName: "request", body: request)
        let events = (value["records"]?.arrayValue ?? []).compactMap { $0["event"] }
        return (events, value["hasMore"]?.boolValue ?? false)
    }

    /// Live control stream: one baseline, then replacement frames. It carries
    /// projection values only — liveness travels as `api-session/*` on the
    /// forwarded event stream — so no screen reads it yet.
    func controlStream() -> AsyncThrowingStream<JSONValue, Error> {
        RemoteStream.frames(base: base, cookie: cookieHeader, endpoint: "session/control", payload: EmptyBody())
    }

    /// One conversation's opening snapshot followed by its live events and
    /// assistant presentation frames.
    ///
    /// The opening page is bounded: a phone reads the newest messages first and
    /// pages backwards for the rest, so a long Session opens at the same speed
    /// as a short one.
    /// - Parameters:
    ///   - sessionId: the Session to follow.
    ///   - maxMessages: messages the opening snapshot carries, or nil for the
    ///     Host's default.
    /// - Returns: the multiplexed frame stream.
    func followStream(
        sessionId: String,
        maxMessages: Int? = nil
    ) -> AsyncThrowingStream<JSONValue, Error> {
        RemoteStream.frames(
            base: base,
            cookie: cookieHeader,
            endpoint: "session/follow",
            payload: SessionFollowRequest(
                address: SessionAddress(sessionId: sessionId),
                assistantStream: true,
                maxMessages: maxMessages
            )
        )
    }

    func projections(sessionId: String) async throws -> JSONValue {
        try await call("session/projections", body: SessionProjectionsRequest(sessionId: sessionId), as: JSONValue.self)
    }

    /// Send one prompt. A photo travels inline as base64: the Host accepts no
    /// receipt for images, so staging one would buy nothing.
    /// @param sessionId - the Session that receives the prompt.
    /// @param requestId - identity the Host records on the durable message, so
    ///   the sending screen can retire the row it drew optimistically.
    /// @param text - trimmed prompt text; may be empty when an image is attached.
    /// @param image - JPEG bytes to attach, already downscaled by the caller.
    /// @param context - personal memory derived on this phone, sent as its own
    ///   text part so the person's own words stay a separate block in the log.
    func sendPrompt(
        sessionId: String,
        requestId: String,
        text: String,
        images: [Data] = [],
        context: String? = nil,
        receiptId: String? = nil,
        mode: String = "queue"
    ) async throws {
        var content: [PromptContentPart] = []
        if !text.isEmpty {
            content.append(.text(text))
        }
        if let context, !context.isEmpty {
            content.append(.text(context))
        }
        if let receiptId, !receiptId.isEmpty {
            content.append(.file(receiptId: receiptId))
        }
        for image in images {
            content.append(.image(
                mediaType: "image/jpeg",
                base64: image.base64EncodedString(),
                name: nil
            ))
        }
        let request = SessionPromptRequest(
            requestId: requestId,
            sessionId: sessionId,
            mode: mode,
            content: content,
            clientTimeZone: TimeZone.current.identifier
        )
        try await callDiscarding("session/prompt", body: request)
    }
}

/// A call whose endpoint takes no arguments still needs a JSON object body.
struct EmptyBody: Encodable {}

/// One `client-request` envelope on Connection's RPC carrier.
private struct ClientRequestEnvelope: Encodable {
    struct Payload: Encodable {
        let args: [String: JSONValue]
    }

    let type = "client-request"
    let rpcId: String
    let method: String
    let payload: Payload
}

/// One `server-response`; `result` carries either a value or a typed failure.
private struct ServerResponse: Decodable {
    struct Failure: Decodable {
        let code: String
        let message: String
    }

    struct Result: Decodable {
        let ok: Bool
        let value: JSONValue?
        let error: Failure?
    }

    let result: Result
}

/// Refuses the root exchange's redirect: following it would load the GUI
/// document and lose the one response carrying the cookie.
final class NoRedirectDelegate: NSObject, URLSessionTaskDelegate {
    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        willPerformHTTPRedirection response: HTTPURLResponse,
        newRequest request: URLRequest,
        completionHandler: @escaping (URLRequest?) -> Void
    ) {
        completionHandler(nil)
    }
}

extension HubClient {
    /// Current account projection from the Host gateway's session route.
    ///
    /// The account surface of this Host is an HTTP route, not a Remote
    /// namespace: `account/*` Remote methods answer 404 here.
    /// @returns the three-state projection; `unavailable` means the Host has no
    /// configured login service.
    func accountSession() async throws -> AccountSession {
        let data = try await request(path: "/api/auth/session", method: "GET", body: nil)
        return try decode(AccountSession.self, from: data)
    }

    /// Desktop posture this Host was launched with.
    func desktopStatus() async throws -> DesktopStatus {
        let data = try await request(path: "/api/desktop/status", method: "GET", body: nil)
        return try decode(DesktopStatus.self, from: data)
    }

    /// End the Host-side account session this client's cookie identifies.
    func signOutAccount() async throws {
        _ = try await request(path: "/api/auth/logout", method: "POST", body: Data("{}".utf8))
    }

    /// Exchanges a launch token for the persistent signed cookie.
    ///
    /// This is the listener's root exchange, not `/connect`. Root mints the
    /// browser-session cookie, which stays valid for its whole lifetime and may
    /// be presented on any number of connections. `/connect` mints an API
    /// operator, and the Host releases that Peer when its one WebSocket closes:
    /// every later handshake with that cookie answers `401`, which CFNetwork
    /// reports as `-1011`. A phone reconnects on every screen and network
    /// change, so only the browser-session cookie is usable here.
    ///
    /// The Host answers `303` with `Set-Cookie`, and the redirect must not be
    /// followed — the cookie is the whole result. The token is process-scoped
    /// (a Desktop restart mints a new one) while the cookie lasts 30 days, so
    /// one successful exchange survives restarts.
    ///
    /// - Parameters:
    ///   - base: Host root, exactly as the cookie's authority will be built.
    ///   - token: the `token` query value from the printed `tomato web:` URL.
    /// - Returns: the complete `name=value` cookie header value.
    static func connect(base: URL, token: String) async throws -> String {
        var components = URLComponents(url: base, resolvingAgainstBaseURL: false)
        // Connection accepts the token only at the listener root, where its
        // redirect target is the clean `./` of the served document directory.
        components?.path = "/"
        components?.queryItems = [URLQueryItem(name: "token", value: token)]
        guard let url = components?.url else { throw HubError.invalidBaseURL }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        let data: Data
        let response: URLResponse
        AppLog.info(.network, "交换配对令牌", detail: url.host ?? "")
        do {
            (data, response) = try await URLSession.shared.data(for: request, delegate: NoRedirectDelegate())
        } catch {
            let failure = error as NSError
            // iOS refuses cleartext to an address outside the Info.plist
            // exceptions. Say which half of the pairing is wrong instead of
            // relaying the framework's ATS sentence.
            if failure.domain == NSURLErrorDomain,
               failure.code == NSURLErrorAppTransportSecurityRequiresSecureConnection
            {
                AppLog.error(.network, "配对被 ATS 拒绝", detail: url.host ?? "")
                throw HubError.transport("这个地址是 http，且不在局域网或 Tailscale 范围内，iOS 不允许明文连接。请改用桌面端隧道生成的 https 链接。")
            }
            AppLog.error(.network, "交换配对令牌失败", detail: failure.localizedDescription)
            throw HubError.transport(failure.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else { throw HubError.transport("非 HTTP 响应") }
        guard let cookie = sessionCookie(from: http) else {
            // A reachable Host that answers without a cookie refused either the
            // token — spent, expired, or from another process — or the address
            // itself, which the fence rejects before it reads the token.
            AppLog.warning(.network, "配对未拿到 cookie", detail: "HTTP \(http.statusCode)")
            switch http.statusCode {
            case 403: throw HubError.forbidden
            case 200 ..< 400: throw HubError.unauthorized
            default: throw HubError.transport("HTTP \(http.statusCode)")
            }
        }
        _ = data
        AppLog.info(.network, "配对令牌已交换")
        return cookie
    }

    /// Reads the `tomato-auth-*` pair out of one or more `Set-Cookie` headers.
    static func sessionCookie(from response: HTTPURLResponse) -> String? {
        guard let raw = response.value(forHTTPHeaderField: "Set-Cookie") else { return nil }
        for candidate in raw.components(separatedBy: ",") {
            let pair = candidate
                .split(separator: ";", maxSplits: 1)
                .first
                .map(String.init)?
                .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if pair.hasPrefix("tomato-auth-") {
                return pair
            }
        }
        return nil
    }

    // MARK: Watchdog

    /// Health of the Desktop process, served outside `/api` by the Watchdog. The
    /// endpoint itself needs no credential; the restart that follows does.
    func watchdogHealth() async throws -> WatchdogHealth {
        let data = try await request(path: "/-/watchdog/health", method: "GET", body: nil)
        return try decode(WatchdogHealth.self, from: data)
    }

    func watchdogRestart() async throws {
        _ = try await request(path: "/-/watchdog/restart", method: "POST", body: Data("{}".utf8))
    }

    // MARK: Transport

    /// One Remote call over Connection's RPC carrier.
    ///
    /// `/api/<ns>/<method>` is not a REST surface: the body is
    /// `{type, rpcId, method, payload:{args:{<parameter>: value}}}` and the answer
    /// is `{type, rpcId, result:{ok, value|error}}`. The argument key names the
    /// Host method's own parameter, so it differs per method — `session/list`
    /// names it `_request` while most name it `request` — and a method that takes
    /// nothing sends an empty `args`.
    /// @param endpoint - `namespace/method`, matching the URL path segment.
    /// @param argName - the parameter key, or nil for a method that takes none.
    /// @param body - the parameter value.
    /// @returns the `value` member of a successful result.
    private func invoke(
        _ endpoint: String,
        argName: String?,
        body: some Encodable
    ) async throws -> JSONValue {
        let args: [String: JSONValue]
        if let argName {
            // Optional Swift members encode as an explicit null, which the Host's
            // wire schema refuses; send the field absent instead.
            let value = try JSONDecoder().decode(JSONValue.self, from: encode(body))
            args = [argName: value.omittingNullMembers()]
        } else {
            args = [:]
        }
        let envelope = ClientRequestEnvelope(
            rpcId: UUID().uuidString,
            method: endpoint,
            payload: .init(args: args)
        )
        let data = try await request(
            path: "/api/\(endpoint)",
            method: "POST",
            body: JSONEncoder().encode(envelope)
        )
        let response = try decode(ServerResponse.self, from: data)
        guard response.result.ok else {
            throw HubError.remote(
                code: response.result.error?.code ?? "unknown",
                message: response.result.error?.message ?? "Host 返回了失败"
            )
        }
        return response.result.value ?? .null
    }

    func call<Result: Decodable>(
        _ endpoint: String,
        argName: String? = "request",
        body: some Encodable,
        as: Result.Type
    ) async throws -> Result {
        let value = try await invoke(endpoint, argName: argName, body: body)
        return try decode(Result.self, from: JSONEncoder().encode(value))
    }

    func callDiscarding(_ endpoint: String, argName: String? = "request", body: some Encodable) async throws {
        _ = try await invoke(endpoint, argName: argName, body: body)
    }

    private func request(path: String, method: String, body: Data?) async throws -> Data {
        let trimmed = base.absoluteString.hasSuffix("/")
            ? String(base.absoluteString.dropLast())
            : base.absoluteString
        guard let url = URL(string: trimmed + path) else { throw HubError.invalidBaseURL }
        AppLog.debug(.network, "\(method) \(path)", detail: "请求 \(body?.count ?? 0) 字节")

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // The Host fence refuses a cross-site marker and matches an attached
        // `Origin` against `Host`, so a native client must send neither.
        if path.hasPrefix("/-/watchdog/") {
            // The Watchdog is a separate process with its own credential; a Host
            // cookie means nothing to it.
            guard let watchdogToken, !watchdogToken.isEmpty else { throw HubError.unauthorized }
            request.setValue("Bearer \(watchdogToken)", forHTTPHeaderField: "Authorization")
        } else if !cookieHeader.isEmpty {
            request.setValue(cookieHeader, forHTTPHeaderField: "Cookie")
        }
        request.httpBody = body

        let started = CFAbsoluteTimeGetCurrent()
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await Self.transport.data(for: request)
        } catch {
            AppLog.error(.network, "\(method) \(path) 连接失败", detail: describe(error))
            throw HubError.transport((error as NSError).localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else {
            AppLog.error(.network, "\(method) \(path) 不是 HTTP 响应")
            throw HubError.transport("非 HTTP 响应")
        }
        let elapsed = Int(((CFAbsoluteTimeGetCurrent() - started) * 1000).rounded())
        AppLog.debug(.network, "\(method) \(path) → \(http.statusCode)", detail: "\(elapsed) ms · \(data.count) 字节")
        switch http.statusCode {
        case 200 ..< 300:
            return data
        case 401:
            throw HubError.unauthorized
        case 403:
            throw HubError.forbidden
        case 404:
            throw HubError.notFound
        default:
            // A non-2xx may still carry the RPC envelope with a structured failure.
            if let envelope = try? decode(ServerResponse.self, from: data),
               let failure = envelope.result.error
            {
                AppLog.error(.network, "\(method) \(path) 被拒绝", detail: "\(failure.code)：\(failure.message)")
                throw HubError.remote(code: failure.code, message: failure.message)
            }
            throw HubError.transport("HTTP \(http.statusCode)")
        }
    }

    private func encode(_ body: some Encodable) throws -> Data {
        do { return try JSONEncoder().encode(body) }
        catch {
            AppLog.error(.network, "请求无法编码", detail: error.localizedDescription)
            throw HubError.decoding("请求无法编码：\(error.localizedDescription)")
        }
    }

    private func decode<Result: Decodable>(_ type: Result.Type, from data: Data) throws -> Result {
        do { return try JSONDecoder().decode(type, from: data) }
        catch {
            AppLog.error(.network, "响应无法解码为 \(String(describing: type))", detail: error.localizedDescription)
            throw HubError.decoding(error.localizedDescription)
        }
    }
}
