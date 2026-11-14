//
//  ChatTranscript.swift
//  Tomato Remote
//
//  The rows one conversation renders and the values a tool card needs. The
//  reader that produces them lives in `ChatModel`.
//

import Foundation

// MARK: - Rendered model

/// One assistant or user message, one tool call, or one quiet notice.
struct ChatItem: Identifiable, Equatable {
    enum Kind: Equatable {
        case user
        case assistant
        case tool
        /// Model context the harness injected: a turn notice, an action-card
        /// status, a compaction checkpoint. Desktop shows these as a disclosure,
        /// never as the person's own message.
        case context
        case notice
    }

    let id: String
    let kind: Kind
    var text: String
    /// Photos the message carries, in the order they were sent. An image-only
    /// prompt has no text at all; the transcript draws the photos themselves.
    var images: [ChatImageRef] = []
    var pending: Bool = false
    var time: Double?
    /// Turn the row was recorded in, so one turn's work folds as a unit even
    /// when the Agent writes text between its tool calls.
    var turn: Int?
    /// Short label for a context row, taken from the producer that injected it.
    var label: String?
    var tool: ToolDetail?
    /// Prompt identity this phone chose; set only on a local echo, so the row
    /// steps aside once the durable message carrying the same `rpcId` arrives.
    var requestId: String?
}

/// One photo inside one of the person's messages.
///
/// The key is what the transcript looks the picture up by: the Host's durable
/// attachment identity once the message is recorded, or a prompt's temporary key
/// while it is still on its way.
struct ChatImageRef: Identifiable, Equatable {
    let id: String

    /// Whether the message carrying this photo is still being sent.
    var isPending: Bool {
        id.hasPrefix("pending:")
    }
}

/// What one of the person's messages carries, before it becomes a row.
struct ChatMessageContent: Equatable {
    /// The words the person typed.
    var text = ""
    /// Photos, in sent order.
    var images: [ChatImageRef] = []
    /// Staged documents, still shown as one line inside the bubble.
    var files = 0

    /// Whether the message would draw anything at all.
    var isEmpty: Bool {
        text.isEmpty && images.isEmpty && files == 0
    }
}

/// Everything a tool card needs, including the payload behind its detail sheet.
struct ToolDetail: Equatable {
    enum Status: Equatable {
        case running
        case done
        case failed
    }

    let callId: String
    var name: String
    var arguments: String
    var result: String?
    var status: Status
    var startedAt: Double?
    var finishedAt: Double?
    /// One line that tells apart two calls of the same tool. Arguments are
    /// immutable after the call event, so this is derived once at construction
    /// instead of re-parsing the payload on every card body evaluation.
    let summary: String

    /// Defaults keep the two construction sites (call, then result) short.
    init(
        callId: String,
        name: String,
        arguments: String,
        result: String? = nil,
        status: Status,
        startedAt: Double? = nil,
        finishedAt: Double? = nil
    ) {
        self.callId = callId
        self.name = name
        self.arguments = arguments
        self.result = result
        self.status = status
        self.startedAt = startedAt
        self.finishedAt = finishedAt
        self.summary = Self.summarize(name: name, arguments: arguments)
    }

    /// One line that tells apart two calls of the same tool.
    /// - Parameters:
    ///   - name: tool name, the fallback when the payload names nothing.
    ///   - arguments: raw JSON payload the call carried.
    /// - Returns: the first identifying string the payload holds.
    static func summarize(name: String, arguments: String) -> String {
        if let parsed = json(arguments) as? [String: Any] {
            for key in ["command", "path", "pattern", "url", "query", "prompt", "description"] {
                if let value = parsed[key] as? String, !value.isEmpty {
                    return value.replacingOccurrences(of: "\n", with: " ")
                }
            }
        }
        return name
    }

    var durationText: String? {
        guard let startedAt, let finishedAt, finishedAt >= startedAt else { return nil }
        let seconds = (finishedAt - startedAt) / 1000
        return seconds < 1 ? String(format: "%.0f ms", seconds * 1000) : String(format: "%.1f s", seconds)
    }

    /// Pretty-printed JSON when the payload is JSON, otherwise the raw text.
    static func pretty(_ raw: String) -> String {
        guard let value = json(raw),
              let data = try? JSONSerialization.data(withJSONObject: value, options: [.prettyPrinted, .sortedKeys]),
              let text = String(data: data, encoding: .utf8)
        else { return raw }
        return text
    }

    private static func json(_ raw: String) -> Any? {
        guard let data = raw.data(using: .utf8) else { return nil }
        return try? JSONSerialization.jsonObject(with: data)
    }
}

/// Token totals the Host reported for this Session's assistant messages.
struct TokenTotals: Equatable {
    var input = 0
    var output = 0
    var cacheRead = 0
    var cacheWrite = 0
    var toolCalls = 0

    var isEmpty: Bool {
        input == 0 && output == 0 && cacheRead == 0 && cacheWrite == 0
    }

    mutating func add(usage: JSONValue?) {
        guard let usage else { return }
        input += finiteInt(usage["inputTokens"]?.doubleValue)
        output += finiteInt(usage["outputTokens"]?.doubleValue)
        cacheRead += finiteInt(usage["cacheReadTokens"]?.doubleValue)
        cacheWrite += finiteInt(usage["cacheWriteTokens"]?.doubleValue)
    }
}
