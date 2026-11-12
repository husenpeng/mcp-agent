//
//  Wire.swift
//  Tomato Remote
//
//  Wire types shared by the HTTP calls and the WebSocket mux.
//
//  Contract notes, taken from the Host side:
//  - Every Remote call is `POST <base>/api/<namespace>/<method>` with a JSON
//    request object and a result envelope `{ ok: true, value }` or
//    `{ ok: false, error: { code, message, details } }`.
//  - Streams ride `WS <base>/api/remote.mux` with `{type:'open', streamId,
//    endpoint, payload}`, `{type:'item', streamId, value}`, `{type:'end',
//    streamId}` and `{type:'error', streamId, error}`.
//  - Authentication is the `tomato-auth-*` cookie. Do not send `Origin`.
//

import Foundation

// MARK: - JSON

/// A decoded JSON value, used where the Host's shape is merge-extensible and
/// this client must not fail on unknown members.
enum JSONValue: Codable, Hashable, Sendable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([JSONValue])
    case object([String: JSONValue])

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Double.self) {
            // Numbers first: JSONDecoder also accepts `1` and `0` as booleans,
            // which would otherwise turn every sequence or revision of 1 into
            // `.bool(true)` and fail the typed model that reads it.
            self = .number(value)
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else if let value = try? container.decode([String: JSONValue].self) {
            self = .object(value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "unsupported JSON value")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null: try container.encodeNil()
        case let .bool(value): try container.encode(value)
        case let .number(value): try container.encode(value)
        case let .string(value): try container.encode(value)
        case let .array(value): try container.encode(value)
        case let .object(value): try container.encode(value)
        }
    }

    /// Whether this value is JSON `null`.
    var isNull: Bool {
        if case .null = self {
            return true
        }
        return false
    }

    /// Drop `null` object members, recursively.
    ///
    /// The Host's wire schema treats an absent optional field as undefined and
    /// rejects an explicit `null`, so an optional Swift member that encodes as
    /// null must leave the object instead of travelling.
    /// - Returns: this value with null object members removed; array elements stay.
    func omittingNullMembers() -> JSONValue {
        switch self {
        case let .array(values):
            .array(values.map { $0.omittingNullMembers() })
        case let .object(fields):
            .object(fields.compactMapValues { $0.isNull ? nil : $0.omittingNullMembers() })
        case .null, .bool, .number, .string:
            self
        }
    }

    /// Bridge a `JSONSerialization` result, which the stream mux parses.
    static func from(_ any: Any) -> JSONValue {
        switch any {
        case is NSNull:
            .null
        case let value as NSNumber:
            // JSONSerialization bridges `true` and `false` to the singleton
            // CFBoolean numbers, which also match `Int` and `Double`; read the
            // type id so `1` stays a number and a real boolean stays a boolean.
            if CFGetTypeID(value) == CFBooleanGetTypeID() {
                .bool(value.boolValue)
            } else {
                .number(value.doubleValue)
            }
        case let value as String:
            .string(value)
        case let value as [Any]:
            .array(value.map(JSONValue.from))
        case let value as [String: Any]:
            .object(value.mapValues(JSONValue.from))
        default:
            .null
        }
    }

    var stringValue: String? {
        if case let .string(value) = self {
            return value
        }
        return nil
    }

    var doubleValue: Double? {
        if case let .number(value) = self {
            return value
        }
        return nil
    }

    var boolValue: Bool? {
        if case let .bool(value) = self {
            return value
        }
        return nil
    }

    var objectValue: [String: JSONValue]? {
        if case let .object(value) = self {
            return value
        }
        return nil
    }

    var arrayValue: [JSONValue]? {
        if case let .array(value) = self {
            return value
        }
        return nil
    }

    subscript(key: String) -> JSONValue? {
        objectValue?[key]
    }

    /// Read this value as one typed wire model.
    ///
    /// Forwarded Host events carry their payload as plain JSON, so a model that
    /// already declares `Decodable` is read through the same decoder the HTTP
    /// carrier uses instead of a second hand-written mapping.
    /// - Parameter type - model to read.
    /// - Returns: the decoded value, or nil when the value does not match it.
    func decoded<Value: Decodable>(_ type: Value.Type) -> Value? {
        guard let data = try? JSONEncoder().encode(self) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }
}

/// Reads the first non-empty string found under any of `keys`, tolerating one
/// level of wrapper objects such as `{ title: { value: "…" } }`.
func firstString(in values: [String: JSONValue]?, keys: [String]) -> String? {
    guard let values else { return nil }
    for key in keys {
        if let found = values[key]?.stringValue, !found.isEmpty {
            return found
        }
    }
    for key in keys {
        guard let nested = values[key]?.objectValue else { continue }
        for nestedKey in ["value", "text", "title", "preview"] {
            if let found = nested[nestedKey]?.stringValue, !found.isEmpty {
                return found
            }
        }
    }
    return nil
}

// MARK: - Errors

/// Everything this client can fail with. Every case carries text fit for a user.
enum HubError: LocalizedError, Equatable {
    case invalidBaseURL
    case notPaired
    case unauthorized
    case forbidden
    case notFound
    case transport(String)
    case remote(code: String, message: String)
    case decoding(String)
    /// A stream the Host refused in band, or a frame this client could not encode.
    case stream(code: String?, message: String)
    /// The WebSocket upgrade was answered with a non-101 response.
    ///
    /// CFNetwork hides the status line, so this case states only what is known:
    /// the upgrade did not complete. Whether the cookie is dead or the link is
    /// down is the HTTP carrier's question to answer.
    case handshakeRefused

    var errorDescription: String? {
        switch self {
        case .invalidBaseURL:
            "Host 地址无效，请填形如 https://tomato-hub.xxx.ts.net 的地址"
        case .notPaired:
            "尚未配对，请先输入设备码"
        case .unauthorized:
            "认证已失效，请用新的设备码重新配对"
        case .forbidden:
            "Host 拒绝了这个来源（Host/Origin 校验未通过）"
        case .notFound:
            "Host 上没有这个接口，版本可能不匹配"
        case let .transport(message):
            "网络错误：\(message)"
        case let .remote(code, message):
            "\(message)（\(code)）"
        case let .decoding(message):
            "响应无法解析：\(message)"
        case let .stream(code, message):
            code.map { "事件流中断：\(message)（\($0)）" } ?? "事件流中断：\(message)"
        case .handshakeRefused:
            "无法建立事件流连接，正在重试"
        }
    }

    /// Whether a retry can change this outcome.
    ///
    /// Whether retrying the same request could ever succeed.
    ///
    /// A stream refusal is final unless the Host named a state that clears by
    /// itself: `session/writer-held` ends when the other writer finishes, so a
    /// reconnect is exactly the right retry.
    var isFinal: Bool {
        switch self {
        case .unauthorized, .forbidden, .notFound, .notPaired, .invalidBaseURL:
            true
        case let .stream(code, _):
            !Self.transientStreamCodes.contains(code ?? "")
        case .handshakeRefused:
            // The same upgrade is refused identically only when the credential
            // is dead, and this failure alone cannot say that.
            false
        case .transport, .remote, .decoding:
            false
        }
    }

    /// Stream refusals that describe a temporary owner of the write handle.
    static let transientStreamCodes: Set<String> = ["session/writer-held"]

    /// Whether this failure names another writer holding the Session.
    var isWriterHeld: Bool {
        if case let .stream(code, _) = self {
            return code == "session/writer-held"
        }
        if case let .remote(code, _) = self {
            return code == "session/writer-held"
        }
        return false
    }
}

// MARK: - Session wire types

/// Liveness of one conversation.
///
/// The list reads it from the Host flags on each row; the conversation reads it
/// from the same flags plus what it has loaded. Both go through `resolve`, so
/// the two screens can never disagree about the same Session.
///
/// The flags are live: the Host forwards `api-session/status` and
/// `api-session/added` over the event stream, so a row follows a turn that
/// starts or ends without waiting for the next list read.
enum SessionState: Hashable, Sendable {
    /// A turn is executing on the Host right now.
    case running
    /// An Agent is attached and waiting for the next prompt.
    case live
    /// The Session exists but no turn has ever run.
    case fresh
    /// No Agent is attached: the conversation has ended, history only.
    case ended

    /// One derivation for the list row and the conversation header.
    /// - Parameters:
    ///   - running: whether a turn is executing.
    ///   - agentAttached: whether the Host holds an Agent for this Session.
    ///   - hasContent: whether any turn or message exists.
    /// - Returns: the state both screens report.
    static func resolve(running: Bool, agentAttached: Bool, hasContent: Bool) -> SessionState {
        if running {
            return .running
        }
        // Content decides first: the Host reports `agentAvailable: false` for
        // every Session without a live Agent, including one that never ran.
        guard hasContent else {
            return .fresh
        }
        return agentAttached ? .live : .ended
    }
}

/// Page sizes the phone asks the Host for. One opening page fills a phone
/// screen; older pages load only when the reader reaches the top.
enum SessionPageLimit {
    /// Newest messages fetched before the reader has read anything.
    static let opening = 20
    /// One step further back through history.
    static let earlier = 24
}

/// One Session list row. `sessionId`, `updatedAt` and the flags always exist;
/// `projections` is a partial, possibly stale hint block.
///
/// `updatedAt`, `running`, `blank` and `agentAvailable` are the facts the Host
/// also forwards as notifications, so the list replaces them in place instead of
/// waiting for the next read.
struct SessionSummary: Decodable, Identifiable, Hashable, Sendable {
    struct Projections: Decodable, Hashable, Sendable {
        let kind: String?
        let asOfSeq: Double?
        let values: [String: JSONValue]?
    }

    let sessionId: String
    var updatedAt: Double
    var running: Bool
    var blank: Bool
    var agentAvailable: Bool
    /// Parent of a subagent child; the Host only serves these through the
    /// parent's durable address.
    let parentSessionId: String?
    let formatStatus: String?
    let cwd: String?
    let origin: String?
    let projections: Projections?

    var id: String {
        sessionId
    }

    /// Title fallback chain. The list endpoint does not guarantee a title
    /// projection, so a row may legitimately have none.
    var displayTitle: String {
        firstString(in: projections?.values, keys: ["title", "sessionTitle", "displayTitle", "name"])
            ?? cwd.map { URL(fileURLWithPath: $0).lastPathComponent }
            ?? "未命名会话"
    }

    /// The folder a reader sees for a Session whose cwd is known.
    var folderName: String? {
        cwd.map { URL(fileURLWithPath: $0).lastPathComponent }
    }

    /// Best-effort secondary line for the row.
    var displaySubtitle: String {
        firstString(in: projections?.values, keys: ["lastMessage", "lastMessagePreview", "summary", "preview"])
            ?? cwd
            ?? String(sessionId.prefix(8))
    }

    /// How the conversation currently stands, as the list and the conversation
    /// header both report it.
    ///
    /// The Host publishes two independent facts: `running` (a turn is executing)
    /// and `agentAvailable` (an Agent is attached). A session with neither is
    /// cold: its history stays readable, but the conversation has ended until
    /// the next prompt activates an Agent.
    var state: SessionState {
        SessionState.resolve(running: running, agentAttached: agentAvailable, hasContent: !blank)
    }

    /// Whether this Session is a subagent's transcript. The Host serves those
    /// only through the parent's durable address.
    var isSubagent: Bool {
        origin == "subagent"
    }

    /// Whether this Session is the transcript of a Tomato Rbot run.
    ///
    /// The browser keeps those out of the workspace tree and lists them under
    /// the robot; this app does the same, so an agent the person configured
    /// does not read as an ordinary conversation.
    var isRobotRun: Bool {
        guard let value = projections?.values?["robotRun"] else { return false }
        return !value.isNull
    }
}

/// `session/list` value.
struct SessionListValue: Decodable, Sendable {
    let items: [SessionSummary]
}

/// `session/create` value.
struct SessionCreateValue: Decodable, Sendable {
    let sessionId: String
    let agentPreset: String?
}

/// `session/follow` and `session/page` address.
struct SessionAddress: Encodable, Sendable {
    let kind = "session"
    let sessionId: String
}

/// One wire event: `{ type, seq, time, data }` with merge-extensible `type`.
struct SessionWireEvent: Decodable, Sendable {
    let type: String
    let seq: Double?
    let time: Double?
    let data: JSONValue?
}

/// `{ type: 'event', event: … }` history record.
struct SessionEventEntry: Decodable, Sendable {
    let event: SessionWireEvent
}

/// `{ type: 'snapshot', header, cursor, records, hasMore, projections }`.
struct SessionSnapshot: Decodable, Sendable {
    struct Header: Decodable, Sendable {
        let id: String
        let createdAt: Double?
        let cwd: String?
        let agentPreset: String?
    }

    let header: Header
    let cursor: Double
    let records: [SessionEventEntry]
    let hasMore: Bool
}

/// `session/page` value.
struct SessionPage: Decodable, Sendable {
    let records: [SessionEventEntry]
    let hasMore: Bool
}

// MARK: - Requests

struct SessionListRequest: Encodable { let cursor: String? }
struct SessionCreateRequest: Encodable { let cwd: String?; let agentPreset: String? }
struct SessionRenameRequest: Encodable { let sessionId: String; let title: String }
struct SessionCancelRequest: Encodable { let sessionId: String }
struct SessionProjectionsRequest: Encodable { let sessionId: String }
struct SessionPageRequest: Encodable {
    let address: SessionAddress
    let throughSeq: Double
    let beforeSeq: Double?
    let maxMessages: Int?
}

struct SessionFollowRequest: Encodable {
    let address: SessionAddress
    let assistantStream: Bool
    let maxMessages: Int?
}

/// One element of a prompt. An image travels inline as base64 because the Host
/// accepts no receipt for it; only files are staged first.
enum PromptContentPart: Encodable {
    case text(String)
    case image(mediaType: String, base64: String, name: String?)
    /// A document staged through the Host's upload route; the receipt is single
    /// Session and retired once the Host reads it.
    case file(receiptId: String)

    private enum CodingKeys: String, CodingKey {
        case type, text, mediaType, data, name, receiptId
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        switch self {
        case let .text(text):
            try container.encode("text", forKey: .type)
            try container.encode(text, forKey: .text)
        case let .image(mediaType, base64, name):
            try container.encode("image", forKey: .type)
            try container.encode(mediaType, forKey: .mediaType)
            try container.encode(base64, forKey: .data)
            try container.encodeIfPresent(name, forKey: .name)
        case let .file(receiptId):
            try container.encode("file", forKey: .type)
            try container.encode(receiptId, forKey: .receiptId)
        }
    }
}

struct SessionPromptRequest: Encodable {
    let requestId: String
    let sessionId: String
    let mode: String
    let content: [PromptContentPart]
    let clientTimeZone: String?
}

// MARK: - Account wire types

/// `GET /api/auth/session` projection: `signed-in`, `signed-out`, or
/// `unavailable` when the Host has no configured login service.
struct AccountSession: Decodable, Sendable {
    let status: String
    let user: AccountProfile?
    /// The Desktop shell's account, projected to this paired device.
    let shared: Bool?

    var isSignedIn: Bool {
        status == "signed-in"
    }

    var isUnavailable: Bool {
        status == "unavailable"
    }

    var isShared: Bool {
        shared == true
    }
}

/// Desktop posture the shell reports for this Host (`GET /api/desktop/status`).
struct DesktopStatus: Decodable, Sendable {
    let listenPort: Int?
    let trustedHosts: [String]?
    let tunnel: Bool?
    let keepAwake: Bool?
    let launchAtLogin: Bool?
    let version: String?
}

/// Platform-owned display data; read only the names this client renders.
struct AccountProfile: Decodable, Sendable {
    let raw: [String: JSONValue]

    init(raw: [String: JSONValue]) {
        self.raw = raw
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        raw = (try? container.decode([String: JSONValue].self)) ?? [:]
    }

    var displayName: String? {
        firstString(in: raw, keys: ["displayName", "name", "nickname", "nickName", "userName", "email"])
    }

    var email: String? {
        firstString(in: raw, keys: ["email", "mail"])
    }
}

// MARK: - Pairing

// The launch token travels in the printed `tomato web:` URL; the Host
// exchanges it at its root route for a persistent signed browser cookie,
// which stays valid across reconnections for its whole lifetime.

// MARK: - Watchdog wire types

/// `GET /-/watchdog/health` value.
/// `GET /-/watchdog/health`. `state` is the keeper's verdict about the Desktop
/// application, not about the Host process inside it.
struct WatchdogHealth: Decodable, Sendable {
    let state: String
    let pid: Double?

    var isOnline: Bool {
        state == "running"
    }

    var isUnresponsive: Bool {
        state == "unresponsive"
    }
}
