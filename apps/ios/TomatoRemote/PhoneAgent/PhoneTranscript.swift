//
//  PhoneTranscript.swift
//  Tomato Remote
//
//  Folding Tomato Phone's thinking and tool calls into the turn's work.
//
//  The local agent writes its transcript as separate messages: its thinking and
//  the narration before a tool call ride on assistant messages, the result is a
//  tool message, and the answer is the last assistant message. The screen wants
//  one folded row for that work and the answer alone, so this splitter gives the
//  view those rows without changing what is stored or sent to the model.
//

import Foundation

/// One item of a turn's folded work.
enum PhoneProcessItem: Identifiable, Equatable {
    case thinking(id: String, text: String)
    case note(id: String, text: String)
    case tool(id: String, name: String, result: String)

    var id: String {
        switch self {
        case let .thinking(id, _): id
        case let .note(id, _): id
        case let .tool(id, _, _): id
        }
    }
}

/// One row the local transcript draws: a message, or a turn's folded work.
enum PhoneTranscriptEntry: Identifiable, Equatable {
    case message(AgentMessage)
    case process(id: String, items: [PhoneProcessItem], running: Bool)

    var id: String {
        switch self {
        case let .message(message): message.id
        case let .process(id, _, _): id
        }
    }
}

/// Split a stored transcript into the rows Tomato Phone shows.
enum PhoneTranscript {
    /// Build the display rows for one conversation.
    ///
    /// Thinking and tool calls are folded into the work of the turn they belong
    /// to; the answer is copied without its reasoning so it cannot be drawn
    /// twice. A live turn may append its streaming reasoning and mark the last
    /// group as still running.
    /// - Parameters:
    ///   - messages: persisted transcript entries in order.
    ///   - liveReasoning: reasoning the endpoint is streaming right now.
    ///   - isRunning: whether the local agent has an active turn.
    /// - Returns: the rows to draw.
    static func entries(
        from messages: [AgentMessage],
        liveReasoning: String = "",
        isRunning: Bool = false
    ) -> [PhoneTranscriptEntry] {
        var entries: [PhoneTranscriptEntry] = []
        var items: [PhoneProcessItem] = []
        var groupID = ""

        func add(_ item: PhoneProcessItem, from messageID: String) {
            if items.isEmpty {
                groupID = "process-\(messageID)"
            }
            items.append(item)
        }

        func flush() {
            guard !items.isEmpty else {
                groupID = ""
                return
            }
            entries.append(.process(id: groupID, items: items, running: false))
            items = []
            groupID = ""
        }

        for message in messages {
            switch message.role {
            case .user:
                flush()
                entries.append(.message(message))
            case .assistant:
                if let reasoning = message.reasoning, !reasoning.isEmpty {
                    add(.thinking(id: "\(message.id)-thinking", text: reasoning), from: message.id)
                }
                if message.toolCalls != nil || message.text.isEmpty {
                    if !message.text.isEmpty {
                        add(.note(id: message.id, text: message.text), from: message.id)
                    }
                } else {
                    flush()
                    var answer = message
                    answer.reasoning = nil
                    entries.append(.message(answer))
                }
            case .tool:
                add(.tool(
                    id: message.id,
                    name: message.toolName ?? "工具",
                    result: message.text
                ), from: message.id)
            case .proposal:
                flush()
                entries.append(.message(message))
            }
        }
        flush()
        return withLive(reasoning: liveReasoning, running: isRunning, entries: entries)
    }

    /// Add a live turn's streaming reasoning and running mark to its newest group.
    /// - Parameters:
    ///   - reasoning: reasoning streaming right now, or an empty string.
    ///   - running: whether the local agent has an active turn.
    ///   - entries: rows built from the persisted transcript.
    /// - Returns: the rows with the live tail applied.
    private static func withLive(
        reasoning: String,
        running: Bool,
        entries: [PhoneTranscriptEntry]
    ) -> [PhoneTranscriptEntry] {
        var result = entries
        if !reasoning.isEmpty {
            let live = PhoneProcessItem.thinking(id: "live-thinking", text: reasoning)
            if case let .process(id, existing, _) = result.last {
                result[result.count - 1] = .process(id: id, items: existing + [live], running: true)
            } else {
                result.append(.process(id: "live-process", items: [live], running: true))
            }
        } else if running, case let .process(id, existing, _) = result.last {
            result[result.count - 1] = .process(id: id, items: existing, running: true)
        }
        return result
    }
}
