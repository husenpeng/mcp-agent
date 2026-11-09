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
    /// Bearer token the Watchdog accepts. The Watchdog runs outside the Host and
    /// reads no session cookie, so its calls carry their own credential.
    let watchdogToken: String?

    private static let transport: URLSession = {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 120
        configuration.waitsForConnectivity = false
        return URLSession(configuration: configuration)
    }()

    init(base: URL, cookie: String, watchdogToken: String? = nil) {
        self.base = base
        self.cookie = cookie
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

    /// Backwards history page below `beforeSeq`. `throughSeq` is the inclusive
    /// cut read from the follow stream's opening snapshot.
    func page(sessionId: String, throughSeq: Double, beforeSeq: Double? = nil, maxMessages: Int? = nil) async throws -> SessionPage {
        let request = SessionPageRequest(
            address: SessionAddress(sessionId: sessionId),
            throughSeq: throughSeq,
            beforeSeq: beforeSeq,
            maxMessages: maxMessages
        )
        return try await call("session/page", body: request, as: SessionPage.self)
    }

    /// Live control stream: one baseline, then replacement frames. Not yet
    /// wired into a V1 screen; the list refreshes instead.
    func controlStream() -> AsyncThrowingStream<JSONValue, Error> {
        RemoteStream.frames(base: base, cookie: cookie, endpoint: "session/control", payload: EmptyBody())
    }

    func projections(sessionId: String) async throws -> JSONValue {
        try await call("session/projections", body: SessionProjectionsRequest(sessionId: sessionId), as: JSONValue.self)
    }

    /// Send one prompt. A photo travels inline as base64: the Host accepts no
    /// receipt for images, so staging one would buy nothing.
    /// @param sessionId - the Session that receives the prompt.
    /// @param text - trimmed prompt text; may be empty when an image is attached.
    /// @param image - JPEG bytes to attach, already downscaled by the caller.
    func sendPrompt(
        sessionId: String,
        text: String,
        image: Data? = nil,
        mode: String = "queue"
    ) async throws {
        var content: [PromptContentPart] = []
        if !text.isEmpty { content.append(.text(text)) }
        if let image {
            content.append(.image(
                mediaType: "image/jpeg",
                base64: image.base64EncodedString(),
                name: nil
            ))
        }
        let request = SessionPromptRequest(
            requestId: UUID().uuidString,
            sessionId: sessionId,
            mode: mode,
            content: content,
            clientTimeZone: TimeZone.current.identifier
        )
        try await callDiscarding("session/prompt", body: request)
    }

    func accountState() async throws -> AccountState {
        try await call("account/getState", argName: nil, body: EmptyBody(), as: AccountState.self)
    }

    /// Platform profile data, or `nil` when the account grant is absent.
    func accountProfile() async throws -> AccountProfile? {
        let value = try await callRaw("account/getProfile", argName: "client", body: accountClient)
        guard let object = value.objectValue else { return nil }
        return AccountProfile(raw: object)
    }

    /// Platform balance; the platform owns the members, so it stays raw.
    func accountBalance() async throws -> JSONValue {
        try await callRaw("account/getBalance", argName: "client", body: accountClient)
    }

    func signOut() async throws {
        try await callDiscarding("account/signOut", argName: "client", body: accountClient)
    }

    /// Exchanges a launch token for the persistent signed cookie.
    ///
    /// This is Connection's existing `/connect` route, not a new endpoint:
    /// the Host answers `302` with `Set-Cookie`, and the redirect must not be
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
        components?.path = "/connect"
        components?.queryItems = [
            URLQueryItem(name: "token", value: token),
            URLQueryItem(name: "interactions", value: "answer"),
        ]
        guard let url = components?.url else { throw HubError.invalidBaseURL }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request, delegate: NoRedirectDelegate())
        } catch {
            throw HubError.transport((error as NSError).localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else { throw HubError.transport("非 HTTP 响应") }
        guard let cookie = sessionCookie(from: http) else {
            // A reachable Host that answers without a cookie refused the
            // token: it is spent, expired, or from another process.
            throw http.statusCode == 200 || http.statusCode == 302
                ? HubError.unauthorized
                : HubError.transport("HTTP \(http.statusCode)")
        }
        _ = data
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
            if pair.hasPrefix("tomato-auth-") { return pair }
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

    /// Identity this UI reports to Platform. The Host forwards it rather than
    /// remembering the last caller it saw.
    private var accountClient: AccountClientMetadata {
        AccountClientMetadata(
            version: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0",
            locale: Locale.current.identifier,
            timezoneOffsetSeconds: TimeZone.current.secondsFromGMT()
        )
    }

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
    private func invoke<Body: Encodable>(
        _ endpoint: String,
        argName: String?,
        body: Body
    ) async throws -> JSONValue {
        let args: [String: JSONValue]
        if let argName {
            args = [argName: try JSONDecoder().decode(JSONValue.self, from: try encode(body))]
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
            body: try JSONEncoder().encode(envelope)
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

    private func call<Body: Encodable, Result: Decodable>(
        _ endpoint: String,
        argName: String? = "request",
        body: Body,
        as: Result.Type
    ) async throws -> Result {
        let value = try await invoke(endpoint, argName: argName, body: body)
        return try decode(Result.self, from: try JSONEncoder().encode(value))
    }

    private func callDiscarding<Body: Encodable>(_ endpoint: String, argName: String? = "request", body: Body) async throws {
        _ = try await invoke(endpoint, argName: argName, body: body)
    }

    /// Call one endpoint and return its `value` as raw JSON, so endpoints whose
    /// `value` is `null` or platform-owned still succeed.
    private func callRaw<Body: Encodable>(_ endpoint: String, argName: String? = "request", body: Body) async throws -> JSONValue {
        try await invoke(endpoint, argName: argName, body: body)
    }

    private func request(path: String, method: String, body: Data?) async throws -> Data {
        let trimmed = base.absoluteString.hasSuffix("/")
            ? String(base.absoluteString.dropLast())
            : base.absoluteString
        guard let url = URL(string: trimmed + path) else { throw HubError.invalidBaseURL }

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
        } else if !cookie.isEmpty {
            request.setValue(cookie, forHTTPHeaderField: "Cookie")
        }
        request.httpBody = body

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await Self.transport.data(for: request)
        } catch {
            throw HubError.transport((error as NSError).localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else { throw HubError.transport("非 HTTP 响应") }
        switch http.statusCode {
        case 200..<300:
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
               let failure = envelope.result.error {
                throw HubError.remote(code: failure.code, message: failure.message)
            }
            throw HubError.transport("HTTP \(http.statusCode)")
        }
    }

    private func encode<Body: Encodable>(_ body: Body) throws -> Data {
        do { return try JSONEncoder().encode(body) }
        catch { throw HubError.decoding("请求无法编码：\(error.localizedDescription)") }
    }

    private func decode<Result: Decodable>(_ type: Result.Type, from data: Data) throws -> Result {
        do { return try JSONDecoder().decode(type, from: data) }
        catch { throw HubError.decoding(error.localizedDescription) }
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
/// Refuses the `302` that ends a `/connect` exchange: following it would load
/// the GUI document and lose the one response carrying the cookie.
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
