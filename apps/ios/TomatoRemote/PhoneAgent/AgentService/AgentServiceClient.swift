//
//  AgentServiceClient.swift
//  Tomato Remote
//
//  HTTP and SSE client for the company agent_service, reached through the web
//  BFF with the Feishu account session this phone already holds. It speaks the
//  same `/api/agent-v2/*` routes the web assistant uses, so a conversation here
//  is the same conversation there.
//

import Foundation

/// Failures the phone reports for agent_service calls.
enum AgentServiceError: LocalizedError {
    case notSignedIn
    case transport(String)
    case rejected(Int, String)
    /// A response body, or the field a call needs, did not match the wire types.
    case malformed(String)

    var errorDescription: String? {
        switch self {
        case .notSignedIn:
            "飞书登录已失效，请重新登录。"
        case let .transport(detail):
            "服务端连接失败：\(detail)"
        case let .rejected(code, message):
            message.isEmpty ? "服务端返回 \(code)" : message
        case let .malformed(detail):
            "服务端回应无法解析：\(detail)"
        }
    }
}

/// Client for one signed-in account.
struct AgentServiceClient {
    /// BFF origin, such as `https://tomato.example.com`.
    let base: URL
    /// auth_service session value the BFF reads from its `session_id` cookie.
    let sessionId: String
    /// Transport; tests pass a stub.
    var fetch: (URLRequest) async throws -> (Data, URLResponse) = { try await URLSession.shared.data(for: $0) }

    /// Caller identity the service keys its client whitelist on.
    ///
    /// The phone presents the same `web` client the browser does, which is what
    /// makes a conversation created here show up in the browser list.
    static let clientId = "web"

    /// Client for the signed-in account against the company test BFF.
    /// - Returns: the client, or nil when this phone has no account session.
    @MainActor
    static func current() -> AgentServiceClient? {
        guard let context = AccountAuthStore.shared.searchContext else { return nil }
        return AgentServiceClient(base: AgentBackendStore.serviceBase, sessionId: context.sessionId)
    }

    // MARK: - Sessions

    /// Create one session and pin its model route and local skills.
    /// - Parameters:
    ///   - modelRoute: model route name, or nil for the agent default.
    ///   - skills: local skills the phone carries into the session.
    /// - Returns: the created session.
    func createSession(
        modelRoute: String?,
        skills: [AgentServiceSkill],
        thinkingLevel: String? = nil
    ) async throws -> AgentServiceSession {
        var body: [String: JSONValue] = [:]
        if let modelRoute, !modelRoute.isEmpty {
            body["modelRoute"] = .string(modelRoute)
        }
        if let thinkingLevel, !thinkingLevel.isEmpty {
            body["thinkingLevel"] = .string(thinkingLevel)
        }
        if !skills.isEmpty {
            body["clientSkills"] = .array(skills.map { skill in
                .object(["name": .string(skill.name), "content": .string(skill.content)])
            })
        }
        return try await send(.post, "/api/agent-v2/sessions", body: .object(body))
    }

    /// List the signed-in user's sessions.
    func listSessions(limit: Int = 20, offset: Int = 0) async throws -> JSONValue {
        try await send(.get, "/api/agent-v2/sessions?limit=\(limit)&offset=\(offset)")
    }

    /// The signed-in user's sessions, newest activity first.
    func sessions(limit: Int = 50, offset: Int = 0) async throws -> AgentServiceSessionList {
        try await send(.get, "/api/agent-v2/sessions?limit=\(limit)&offset=\(offset)")
    }

    /// Read one session's history, newest page first.
    func messages(sessionId: String, limit: Int = 50, beforeSeq: Int? = nil, includeTools: Bool = true)
        async throws -> AgentServiceMessages
    {
        var path = "/api/agent-v2/sessions/\(sessionId)/messages?limit=\(limit)&includeTools=\(includeTools)"
        if let beforeSeq {
            path += "&beforeSeq=\(beforeSeq)"
        }
        return try await send(.get, path)
    }

    /// Rename or switch the model route of one session.
    func patchSession(
        sessionId: String,
        title: String? = nil,
        modelRoute: String? = nil,
        thinkingLevel: String? = nil,
        clearThinkingLevel: Bool = false
    ) async throws {
        var body: [String: JSONValue] = [:]
        if let title {
            body["title"] = .string(title)
        }
        if let modelRoute {
            body["modelRoute"] = .string(modelRoute)
        }
        if let thinkingLevel {
            body["thinkingLevel"] = .string(thinkingLevel)
        } else if clearThinkingLevel {
            body["thinkingLevel"] = .null
        }
        _ = try await raw(.patch, "/api/agent-v2/sessions/\(sessionId)", body: .object(body))
    }

    /// Read one session's event log (the audit trail the panel shows).
    func events(sessionId: String, afterSeq: Int = 0, limit: Int = 200) async throws -> AgentServiceEventList {
        try await send(
            .get,
            "/api/agent-v2/sessions/\(sessionId)/events?afterSeq=\(afterSeq)&limit=\(limit)"
        )
    }

    /// Soft-delete one session.
    func deleteSession(sessionId: String) async throws {
        _ = try await raw(.delete, "/api/agent-v2/sessions/\(sessionId)")
    }

    /// Replace the local skill catalog of one session.
    func putClientSkills(sessionId: String, skills: [AgentServiceSkill]) async throws {
        let body = JSONValue.object([
            "skills": .array(skills.map { skill in
                .object(["name": .string(skill.name), "content": .string(skill.content)])
            }),
        ])
        _ = try await raw(.put, "/api/agent-v2/sessions/\(sessionId)/client-skills", body: body)
    }

    /// The models the owner may pick from, each with the thinking depths the
    /// service accepts for it. The list is the same for every caller: it is
    /// filtered by the admin's model enablement, not by this account.
    func listModels() async throws -> [AgentServiceModel] {
        let envelope = try await raw(.get, "/api/agent-v2/models")
        let items = envelope["data"]?["items"]?.arrayValue ?? []
        return items.compactMap { item in
            guard let name = item["name"]?.stringValue else { return nil }
            return AgentServiceModel(
                name: name,
                provider: item["provider"]?.stringValue,
                model: item["model"]?.stringValue,
                thinkingLevel: item["thinkingLevel"]?.stringValue,
                thinkingLevels: item["thinkingLevels"]?.arrayValue?.compactMap(\.stringValue),
                contextWindow: item["contextWindowTokens"]?.doubleValue.map { Int($0) }
            )
        }
    }

    // MARK: - Turns

    /// Submit one user turn.
    func submitTurn(sessionId: String, text: String, attachmentIds: [String]) async throws -> AgentServiceTurnAccepted {
        let body = JSONValue.object([
            "text": .string(text),
            "attachments": .array(attachmentIds.map { .string($0) }),
        ])
        return try await send(.post, "/api/agent-v2/sessions/\(sessionId)/turns", body: body)
    }

    /// Cancel one running turn.
    func cancel(sessionId: String, turnId: String) async throws {
        _ = try await raw(.post, "/api/agent-v2/sessions/\(sessionId)/turns/\(turnId)/cancel")
    }

    /// Answer a pending tool approval.
    func decideApproval(sessionId: String, approvalId: String, decision: String) async throws {
        let body = JSONValue.object(["decision": .string(decision)])
        _ = try await raw(.post, "/api/agent-v2/sessions/\(sessionId)/approvals/\(approvalId)", body: body)
    }

    /// Stream one turn's events.
    /// - Parameters:
    ///   - sessionId: session that owns the turn.
    ///   - turnId: turn to follow.
    ///   - afterSeq: last sequence already rendered, for reconnect.
    func stream(sessionId: String, turnId: String, afterSeq: Int = 0) -> AsyncThrowingStream<AgentServiceEvent, Error> {
        AsyncThrowingStream { continuation in
            do {
                let request = try makeRequest(
                    .get,
                    "/api/agent-v2/sessions/\(sessionId)/turns/\(turnId)/stream?afterSeq=\(afterSeq)",
                    body: nil,
                    accept: "text/event-stream"
                )
                // A data delegate delivers each network chunk as it lands;
                // `bytes(for:)` held this stream back until the response ended,
                // which is why deltas read as one finished answer on screen.
                let reader = AgentServiceStreamReader(
                    continuation: continuation,
                    turnId: String(turnId.prefix(8))
                )
                reader.start(request)
                continuation.onTermination = { _ in reader.cancel() }
            } catch {
                continuation.finish(throwing: error)
            }
        }
    }

    // MARK: - Attachments

    /// Upload one file and return its attachment id.
    ///
    /// The route binds every upload to the session that may later reference it,
    /// so the session travels as a form field beside the file. Without it the
    /// service answers `sessionId: Field required` and no attachment id ever
    /// reaches the turn.
    /// - Parameters:
    ///   - sessionId: session the attachment belongs to.
    ///   - data: file bytes.
    ///   - name: file name the server keeps.
    ///   - mime: declared content type.
    /// - Returns: the attachment id the turn names.
    /// - Throws: `AgentServiceError` when the service refuses the upload or
    ///   answers without an id.
    func uploadAttachment(sessionId: String, data: Data, name: String, mime: String) async throws -> String {
        let boundary = "TomatoPhone-\(UUID().uuidString)"
        var body = Data()
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"sessionId\"\r\n\r\n".data(using: .utf8)!)
        body.append(sessionId.data(using: .utf8)!)
        body.append("\r\n--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(name)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mime)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        var request = try makeRequest(.post, "/api/agent-v2/attachments", body: nil)
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.httpBody = body
        let (payload, response) = try await perform(request)
        let envelope = try decodeEnvelope(payload, response: response)
        guard let attachmentId = envelope["data"]?["attachmentId"]?.stringValue else {
            throw AgentServiceError.malformed("POST /api/agent-v2/attachments 成功但缺少 attachmentId")
        }
        return attachmentId
    }

    // MARK: - Transport

    private enum Method: String {
        case get = "GET"
        case post = "POST"
        case put = "PUT"
        case patch = "PATCH"
        case delete = "DELETE"
    }

    private func send<T: Decodable>(_ method: Method, _ path: String, body: JSONValue? = nil) async throws -> T {
        let value = try await raw(method, path, body: body)
        guard let data = value["data"] else {
            throw AgentServiceError.malformed("\(method.rawValue) \(path) 成功但缺少 data")
        }
        let encoded = try JSONEncoder().encode(data)
        do {
            return try JSONDecoder().decode(T.self, from: encoded)
        } catch let DecodingError.keyNotFound(key, _) {
            throw AgentServiceError.malformed("\(method.rawValue) \(path) 缺少字段 \(key.stringValue)")
        } catch let DecodingError.typeMismatch(type, context) {
            throw AgentServiceError.malformed("\(method.rawValue) \(path) 的 \(Self.location(context)) 应为 \(type)")
        } catch let DecodingError.valueNotFound(type, context) {
            throw AgentServiceError.malformed("\(method.rawValue) \(path) 的 \(Self.location(context)) 为空，应为 \(type)")
        } catch {
            throw AgentServiceError.malformed("\(method.rawValue) \(path) 的 data 读不出")
        }
    }

    /// Field path a decode failure points at, for the error message.
    /// - Parameter context: decoding context of the failing field.
    /// - Returns: dotted path, or `data` at the root.
    private static func location(_ context: DecodingError.Context) -> String {
        let path = context.codingPath.map(\.stringValue).joined(separator: ".")
        return path.isEmpty ? "data" : path
    }

    private func raw(_ method: Method, _ path: String, body: JSONValue? = nil) async throws -> JSONValue {
        let request = try makeRequest(method, path, body: body)
        let (payload, response) = try await perform(request)
        return try decodeEnvelope(payload, response: response)
    }

    /// Send one request, naming the origin when the network, not the service,
    /// failed. An unreachable address is the usual cause of a dead session seen
    /// from a phone, and the message alone never says which address it dialed.
    /// - Parameter request: prepared request.
    /// - Returns: body and response.
    private func perform(_ request: URLRequest) async throws -> (Data, URLResponse) {
        do {
            return try await fetch(request)
        } catch {
            throw AgentServiceError.transport("\(base.absoluteString)：\(error.localizedDescription)")
        }
    }

    private func decodeEnvelope(_ payload: Data, response: URLResponse) throws -> JSONValue {
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard let value = try? JSONDecoder().decode(JSONValue.self, from: payload) else {
            if status == 401 {
                throw AgentServiceError.notSignedIn
            }
            let contentType = (response as? HTTPURLResponse)?.value(forHTTPHeaderField: "Content-Type") ?? "?"
            throw AgentServiceError.malformed("HTTP \(status) 返回的不是 JSON（\(contentType)）")
        }
        let code = value["code"]?.doubleValue.map { Int($0) } ?? 0
        // The BFF answers a rejected cookie with a bare 401 and no error code,
        // which is still the sign-in being gone rather than a request error.
        if status == 401 || code == 40101 {
            throw AgentServiceError.notSignedIn
        }
        if !(200 ..< 300).contains(status) || code >= 40000 {
            throw AgentServiceError.rejected(code, value["message"]?.stringValue ?? "")
        }
        return value
    }

    private func makeRequest(
        _ method: Method,
        _ path: String,
        body: JSONValue?,
        accept: String = "application/json"
    ) throws -> URLRequest {
        guard let url = URL(string: base.absoluteString + path) else {
            throw AgentServiceError.transport("地址不合法：\(path)")
        }
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.timeoutInterval = accept == "text/event-stream" ? 600 : 60
        request.setValue(accept, forHTTPHeaderField: "Accept")
        request.setValue(Self.clientId, forHTTPHeaderField: "X-Client-Id")
        request.setValue("session_id=\(sessionId)", forHTTPHeaderField: "Cookie")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(body)
        }
        return request
    }
}

/// Reads one SSE response chunk by chunk as its bytes arrive.
///
/// The delegate calls back on the bytes the network just delivered, so a model
/// delta reaches the transcript while it is written instead of at the end of
/// the response. Every callback runs off the main queue; the state here is
/// touched only from there.
final class AgentServiceStreamReader: NSObject, URLSessionDataDelegate, @unchecked Sendable {
    private let continuation: AsyncThrowingStream<AgentServiceEvent, Error>.Continuation
    private let turnId: String
    private let started = CFAbsoluteTimeGetCurrent()
    private var parser = AgentServiceSSEParser()
    private var line = Data()
    private var session: URLSession?
    private var task: URLSessionDataTask?
    private var frames = 0
    private var firstFrameMS: Int?
    private var finished = false

    /// @param continuation - sink the parsed frames are yielded into.
    /// @param turnId - short turn identity the logs name.
    init(continuation: AsyncThrowingStream<AgentServiceEvent, Error>.Continuation, turnId: String) {
        self.continuation = continuation
        self.turnId = turnId
        super.init()
    }

    /// Open the connection and start feeding frames.
    /// - Parameter request: GET request for the turn's event stream.
    func start(_ request: URLRequest) {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 600
        configuration.timeoutIntervalForResource = 3600
        configuration.waitsForConnectivity = false
        let session = URLSession(configuration: configuration, delegate: self, delegateQueue: nil)
        self.session = session
        var streaming = request
        // A streamed body is read as it arrives; a decoder in the middle of the
        // path can hold frames back until the response ends.
        streaming.setValue("identity", forHTTPHeaderField: "Accept-Encoding")
        let task = session.dataTask(with: streaming)
        self.task = task
        task.resume()
    }

    /// Stop the connection when the consumer goes away.
    func cancel() {
        finish(throwing: nil)
    }

    // MARK: URLSessionDataDelegate

    func urlSession(
        _ session: URLSession,
        dataTask: URLSessionDataTask,
        didReceive response: URLResponse,
        completionHandler: @escaping (URLSession.ResponseDisposition) -> Void
    ) {
        guard let http = response as? HTTPURLResponse, (200 ..< 300).contains(http.statusCode) else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            finish(throwing: AgentServiceError.rejected(status, "事件流 HTTP \(status)"))
            completionHandler(.cancel)
            return
        }
        AppLog.debug(
            .model,
            "事件流已连",
            detail: "HTTP \(http.statusCode) · \(response.mimeType ?? "?") · \(turnId)"
        )
        completionHandler(.allow)
    }

    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        guard !finished else { return }
        for byte in data {
            if byte == 0x0A {
                let text = String(decoding: line, as: UTF8.self)
                line.removeAll(keepingCapacity: true)
                if let event = parser.ingest(text) {
                    frames += 1
                    if firstFrameMS == nil {
                        firstFrameMS = Self.milliseconds(since: started)
                        AppLog.debug(
                            .model,
                            "首帧到达",
                            detail: "\(firstFrameMS ?? 0) ms · \(event.name) · \(turnId)"
                        )
                    }
                    continuation.yield(event)
                }
                if parser.isDone {
                    finish(throwing: nil)
                    return
                }
            } else {
                line.append(byte)
            }
        }
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        finish(throwing: error)
    }

    // MARK: Teardown

    /// Close the connection once and report what the stream delivered.
    /// - Parameter error: failure that ended the stream, or nil for a clean end.
    private func finish(throwing error: Error?) {
        guard !finished else { return }
        finished = true
        AppLog.debug(
            .model,
            "事件流结束",
            detail: "\(frames) 帧 · 首帧 \(firstFrameMS.map { "\($0) ms" } ?? "无") · \(turnId)"
        )
        task?.cancel()
        session?.invalidateAndCancel()
        if let error {
            continuation.finish(throwing: error)
        } else {
            continuation.finish()
        }
    }

    /// Elapsed milliseconds, rounded, since the connection opened.
    /// - Parameter start: `CFAbsoluteTimeGetCurrent()` when it opened.
    /// - Returns: the elapsed time in milliseconds.
    private static func milliseconds(since start: CFAbsoluteTime) -> Int {
        Int(((CFAbsoluteTimeGetCurrent() - start) * 1000).rounded())
    }
}
