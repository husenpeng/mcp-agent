//
//  AgentServiceWire.swift
//  Tomato Remote
//
//  Wire types and the SSE frame parser for the company agent_service behind the
//  web BFF. The phone sends one turn and reads the same event stream the web
//  client reads; token deltas are best effort and the final `assistant/message`
//  stays authoritative.
//

import Foundation

/// One local skill submitted with a session.
struct AgentServiceSkill: Encodable, Equatable {
    var name: String
    var content: String
}

/// One session as the service reports it.
struct AgentServiceSession: Decodable, Equatable {
    var sessionId: String
    var agentName: String?
    var agentRevision: String?
    var title: String?

    private enum CodingKeys: String, CodingKey {
        case sessionId, agentName, agentRevision, title
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        sessionId = try container.decode(String.self, forKey: .sessionId)
        agentName = container.tolerantString(.agentName)
        agentRevision = container.tolerantString(.agentRevision)
        title = container.tolerantString(.title)
    }
}

/// One accepted turn.
struct AgentServiceTurnAccepted: Decodable, Equatable {
    var sessionId: String
    var turnId: String
    var status: String?
}

/// One row of the service conversation list.
///
/// Every member after the id decodes leniently: the list is a page the phone
/// only reads, and one absent or retyped field must not hide the whole page.
struct AgentServiceSessionSummary: Decodable, Equatable {
    var sessionId: String
    var title: String?
    var preview: String?
    var turnCount: Int?
    var lastActiveAt: String?
    var createdAt: String?

    private enum CodingKeys: String, CodingKey {
        case sessionId, title, preview, turnCount, lastActiveAt, createdAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        sessionId = try container.decode(String.self, forKey: .sessionId)
        title = container.tolerantString(.title)
        preview = container.tolerantString(.preview)
        turnCount = container.tolerantNumber(.turnCount).map { Int($0.rounded(.towardZero)) }
        lastActiveAt = container.tolerantString(.lastActiveAt)
        createdAt = container.tolerantString(.createdAt)
    }
}

/// One page of the service conversation list.
struct AgentServiceSessionList: Decodable {
    var items: [AgentServiceSessionSummary]
    var total: Int?

    private enum CodingKeys: String, CodingKey {
        case items, total
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        items = (try? container.decodeIfPresent([AgentServiceSessionSummary].self, forKey: .items)) ?? []
        total = container.tolerantNumber(.total).map { Int($0.rounded(.towardZero)) }
    }
}

/// One history message the service projects from its event log.
///
/// Only the id is required; the body fields are what the phone renders, so a
/// message with an unfamiliar payload still reaches the transcript.
struct AgentServiceMessage: Decodable, Equatable {
    var messageId: String
    var seq: Int?
    var role: String
    var kind: String
    var text: String
    var data: JSONValue?

    private enum CodingKeys: String, CodingKey {
        case messageId, seq, role, kind, text, data
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        messageId = try container.decode(String.self, forKey: .messageId)
        seq = container.tolerantNumber(.seq).map { Int($0.rounded(.towardZero)) }
        role = container.tolerantString(.role) ?? "assistant"
        kind = container.tolerantString(.kind) ?? "message"
        text = container.tolerantString(.text) ?? ""
        data = try? container.decodeIfPresent(JSONValue.self, forKey: .data)
    }
}

/// One page of history messages.
struct AgentServiceMessages: Decodable {
    var items: [AgentServiceMessage]
    var hasMore: Bool?
    var nextBeforeSeq: Int?
}

/// One row of a session's event log (the service's audit trail).
struct AgentServiceEventRecord: Decodable, Identifiable, Equatable {
    var eventId: String
    var seq: Int
    var type: String
    var surface: Bool?
    var turnId: String?
    /// Model step the event belongs to; absent on events outside a step.
    var stepId: String?
    var payload: JSONValue?
    var createdAt: String?

    var id: String {
        eventId
    }
}

/// One page of a session's event log.
struct AgentServiceEventList: Decodable {
    var sessionId: String
    var events: [AgentServiceEventRecord]
    var nextAfterSeq: Int?
}

/// Reads one optional member without failing on an absent or retyped value.
extension KeyedDecodingContainer {
    /// String member where an empty string counts as absent and any other type
    /// as unreadable, so a retyped stamp never renders as a number.
    /// - Parameter key: member to read.
    /// - Returns: the text, or nil when the member is missing or not text-like.
    func tolerantString(_ key: Key) -> String? {
        guard let value = try? decodeIfPresent(JSONValue.self, forKey: key) else { return nil }
        guard let text = value.stringValue else { return nil }
        return text.isEmpty ? nil : text
    }

    /// Number member that also accepts a numeric string.
    /// - Parameter key: member to read.
    /// - Returns: the count, or nil when the member is missing or not numeric.
    func tolerantNumber(_ key: Key) -> Double? {
        guard let value = try? decodeIfPresent(JSONValue.self, forKey: key) else { return nil }
        if case let .number(number) = value, number.isFinite {
            return number
        }
        if let text = value.stringValue, let number = Double(text), number.isFinite {
            return number
        }
        return nil
    }
}

/// Timestamps the service writes as ISO 8601, with or without fractional seconds.
enum AgentServiceDate {
    /// Parse one timestamp; unusable values fall back to now.
    /// - Parameter raw: timestamp string from the service.
    /// - Returns: parsed date.
    static func parse(_ raw: String?) -> Date {
        guard let raw, !raw.isEmpty else { return .now }
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = iso.date(from: raw) {
            return date
        }
        iso.formatOptions = [.withInternetDateTime]
        if let date = iso.date(from: raw) {
            return date
        }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        for format in ["yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXXXX", "yyyy-MM-dd'T'HH:mm:ss.SSSXXXXX"] {
            formatter.dateFormat = format
            if let date = formatter.date(from: raw) {
                return date
            }
        }
        return .now
    }
}

/// One model route the service lets the caller pick.
struct AgentServiceModel: Decodable, Identifiable, Equatable {
    var name: String
    var provider: String?
    var model: String?
    /// Thinking depth the route carries; empty means the provider default.
    var thinkingLevel: String?
    /// Levels this route allows, as the service reports them; empty or absent
    /// means the route does not open thinking at all.
    var thinkingLevels: [String]?
    /// Prompt capacity the route advertises; absent when it lists none.
    var contextWindow: Int?

    var id: String {
        name
    }

    /// Offered depths, deduplicated and ordered from least to most effort.
    ///
    /// A name the phone does not know sorts after the known ones, so a route
    /// that grows a new level still offers it without a client update.
    var selectableThinkingLevels: [String] {
        var seen = Set<String>()
        let unique = (thinkingLevels ?? []).filter { level in
            !level.isEmpty && seen.insert(level).inserted
        }
        return unique.sorted { lhs, rhs in
            switch (Self.order(of: lhs), Self.order(of: rhs)) {
            case let (left?, right?): left < right
            case (.some, nil): true
            case (nil, .some): false
            case (nil, nil): lhs < rhs
            }
        }
    }

    /// Whether the route accepts one depth; an absent depth follows the route.
    /// - Parameter level: depth carried by a session pin, or nil.
    /// - Returns: true when the service would accept that depth for this route.
    func allowsThinkingLevel(_ level: String?) -> Bool {
        guard let level, !level.isEmpty else { return true }
        return selectableThinkingLevels.contains(level)
    }

    /// Position of a known depth in the effort ladder.
    /// - Parameter level: depth name from the service.
    /// - Returns: the index, or nil for a name this build does not know.
    private static func order(of level: String) -> Int? {
        effortOrder.firstIndex(of: level)
    }

    private static let effortOrder = ["low", "balanced", "high", "ultra", "max"]
}

/// One tool approval waiting for the owner.
struct AgentServiceApproval: Identifiable, Equatable {
    var id: String
    var toolName: String
    var risk: String
}

/// One decoded SSE frame.
struct AgentServiceEvent: Equatable {
    /// Frame name from the `event:` line, such as `assistant/message`.
    var name: String
    /// Event id from the `id:` line; absent on token deltas.
    var id: String?
    /// Whole JSON document from the `data:` line.
    var data: JSONValue

    /// The `data.data` envelope the service writes for every event.
    var envelope: JSONValue? {
        data["data"]
    }

    /// Event type carried inside the envelope.
    var type: String? {
        envelope?["type"]?.stringValue
    }

    /// Session sequence number; absent on token deltas.
    var seq: Int? {
        envelope?["seq"]?.doubleValue.map { Int($0) }
    }

    /// Event payload.
    var payload: JSONValue? {
        envelope?["payload"]
    }

    /// Turn this event belongs to. Absent only on frames older Hosts wrote.
    var turnId: String? {
        envelope?["turnId"]?.stringValue
    }

    /// Whether this event belongs to the turn a reader is showing.
    ///
    /// A stream resumes from a sequence, and a session that already ran turns
    /// replays theirs first; rendering them again re-prints answers that had
    /// already finished, which is what made the previous answer pop up when the
    /// next turn started.
    /// - Parameter turnId: the turn the reader is following.
    /// - Returns: false for an event that names another turn.
    func belongsToTurn(_ turnId: String) -> Bool {
        guard let owner = self.turnId else { return true }
        return owner == turnId
    }

    /// Text blocks of an `assistant/message` event.
    var assistantText: String {
        let blocks = payload?["blocks"]?.arrayValue ?? []
        return blocks.compactMap { block in
            block["type"]?.stringValue == "text" ? block["text"]?.stringValue : nil
        }.joined()
    }

    /// One token delta.
    var delta: (stepId: String, attempt: Int, text: String)? {
        guard name == "assistant/delta", let text = envelope?["text"]?.stringValue else { return nil }
        let step = envelope?["stepId"]?.stringValue ?? ""
        let attempt = envelope?["attempt"]?.doubleValue.map { Int($0) } ?? 0
        return (step, attempt, text)
    }
}

/// Incremental parser for the service's SSE frames.
struct AgentServiceSSEParser {
    private var event: String?
    private var id: String?
    private var data = ""

    /// Feed one line; returns a frame when a blank line closes it.
    mutating func ingest(_ line: String) -> AgentServiceEvent? {
        if line.isEmpty {
            defer { event = nil; id = nil; data = "" }
            guard let name = event, !name.isEmpty, !data.isEmpty, data != "[DONE]", let value = try? JSONDecoder().decode(
                JSONValue.self,
                from: Data(data.utf8)
            ) else { return nil }
            return AgentServiceEvent(name: name, id: id, data: value)
        }
        if line.hasPrefix("event:") {
            event = Self.trim(line, prefix: "event:")
        } else if line.hasPrefix("id:") {
            id = Self.trim(line, prefix: "id:")
        } else if line.hasPrefix("data:") {
            let piece = Self.trim(line, prefix: "data:")
            data += piece
        }
        return nil
    }

    /// Whether the stream signalled its end with `[DONE]`.
    var isDone: Bool {
        data == "[DONE]"
    }

    private static func trim(_ line: String, prefix: String) -> String {
        String(line.dropFirst(prefix.count)).trimmingCharacters(in: .whitespaces)
    }
}
