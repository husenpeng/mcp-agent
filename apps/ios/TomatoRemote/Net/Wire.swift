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
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
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

    /// Bridge a `JSONSerialization` result, which the stream mux parses.
    static func from(_ any: Any) -> JSONValue {
        switch any {
        case is NSNull:
            return .null
        case let value as Bool:
            return .bool(value)
        case let value as Int:
            return .number(Double(value))
        case let value as Double:
            return .number(value)
        case let value as String:
            return .string(value)
        case let value as [Any]:
            return .array(value.map(JSONValue.from))
        case let value as [String: Any]:
            return .object(value.mapValues(JSONValue.from))
        default:
            return .null
        }
    }

    var stringValue: String? {
        if case let .string(value) = self { return value }
        return nil
    }

    var doubleValue: Double? {
        if case let .number(value) = self { return value }
        return nil
    }

    var boolValue: Bool? {
        if case let .bool(value) = self { return value }
        return nil
    }

    var objectValue: [String: JSONValue]? {
        if case let .object(value) = self { return value }
        return nil
    }

    var arrayValue: [JSONValue]? {
        if case let .array(value) = self { return value }
        return nil
    }

    subscript(key: String) -> JSONValue? { objectValue?[key] }
}

/// Reads the first non-empty string found under any of `keys`, tolerating one
/// level of wrapper objects such as `{ title: { value: "…" } }`.
func firstString(in values: [String: JSONValue]?, keys: [String]) -> String? {
    guard let values else { return nil }
    for key in keys {
        if let found = values[key]?.stringValue, !found.isEmpty { return found }
    }
    for key in keys {
        guard let nested = values[key]?.objectValue else { continue }
        for nestedKey in ["value", "text", "title", "preview"] {
            if let found = nested[nestedKey]?.stringValue, !found.isEmpty { return found }
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
    case stream(String)

    var errorDescription: String? {
        switch self {
        case .invalidBaseURL:
            return "Host 地址无效，请填形如 https://tomato-hub.xxx.ts.net 的地址"
        case .notPaired:
            return "尚未配对，请先输入设备码"
        case .unauthorized:
            return "认证已失效，请用新的设备码重新配对"
        case .forbidden:
            return "Host 拒绝了这个来源（Host/Origin 校验未通过）"
        case .notFound:
            return "Host 上没有这个接口，版本可能不匹配"
        case let .transport(message):
            return "网络错误：\(message)"
        case let .remote(code, message):
            return "\(message)（\(code)）"
        case let .decoding(message):
            return "响应无法解析：\(message)"
        case let .stream(message):
            return "事件流中断：\(message)"
        }
    }
}

// MARK: - Session wire types

/// One Session list row. `sessionId`, `updatedAt` and the flags always exist;
/// `projections` is a partial, possibly stale hint block.
struct SessionSummary: Decodable, Identifiable, Hashable, Sendable {
    struct Projections: Decodable, Hashable, Sendable {
        let kind: String?
        let asOfSeq: Double?
        let values: [String: JSONValue]?
    }

    let sessionId: String
    let updatedAt: Double
    let running: Bool
    let blank: Bool
    let agentAvailable: Bool
    let formatStatus: String?
    let cwd: String?
    let origin: String?
    let projections: Projections?

    var id: String { sessionId }

    /// Title fallback chain. The list endpoint does not guarantee a title
    /// projection, so a row may legitimately have none.
    var displayTitle: String {
        firstString(in: projections?.values, keys: ["title", "sessionTitle", "displayTitle", "name"])
            ?? cwd.map { URL(fileURLWithPath: $0).lastPathComponent }
            ?? "未命名会话"
    }

    /// Best-effort secondary line for the row.
    var displaySubtitle: String {
        firstString(in: projections?.values, keys: ["lastMessage", "lastMessagePreview", "summary", "preview"])
            ?? cwd
            ?? String(sessionId.prefix(8))
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
}

/// One element of a prompt. An image travels inline as base64 because the Host
/// accepts no receipt for it; only files are staged first.
enum PromptContentPart: Encodable {
    case text(String)
    case image(mediaType: String, base64: String, name: String?)

    private enum CodingKeys: String, CodingKey {
        case type, text, mediaType, data, name
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

/// Identity of the requesting UI, forwarded by the Host to Platform.
struct AccountClientMetadata: Encodable {
    let version: String
    let locale: String
    let timezoneOffsetSeconds: Int
}

/// `account/getState` value.
struct AccountState: Decodable, Sendable {
    let status: String
    let links: JSONValue?
    let attempt: JSONValue?

    var isSignedIn: Bool { status == "credential-stored" }
}

/// `account/getProfile` is display-safe platform data whose members are owned
/// by the platform; read only the names this client renders.
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

    var email: String? { firstString(in: raw, keys: ["email", "mail"]) }
}

// MARK: - Pairing

/// The launch token travels in the printed `tomato web:` URL; the Host
/// exchanges it at `/connect` for a persistent signed cookie.

// MARK: - Watchdog wire types

/// `GET /-/watchdog/health` value.
/// `GET /-/watchdog/health`. `state` is the keeper's verdict about the Desktop
/// application, not about the Host process inside it.
struct WatchdogHealth: Decodable, Sendable {
    let state: String
    let pid: Double?

    var isOnline: Bool { state == "running" }
    var isUnresponsive: Bool { state == "unresponsive" }
}