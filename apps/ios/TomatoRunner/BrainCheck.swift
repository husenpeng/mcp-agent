//
//  BrainCheck.swift
//  Tomato Runner
//
//  The task loop's model-facing wire shapes, checked without a model.
//
//  A wrong shape here is invisible in a scripted task — the script never reads
//  the request — and shows up as an HTTP 400 from the first real model call, so
//  the structure is asserted directly instead of waiting for a key.
//

import Foundation

/// Assertions over the transcript and both providers' request bodies.
enum BrainCheck {
    /// Run every check.
    /// @returns one sentence per failure; empty when the shapes are sound.
    static func run() -> [String] {
        var conversation = TaskConversation()
        conversation.start(system: "rules", goal: "看电量", prelude: nil, screen: "SCREEN-0")
        conversation.append(.toolCall(id: "c1", name: "observe", arguments: .object([:])))
        conversation.answer(id: "c1", text: "SCREEN-1", screen: true)
        conversation.append(.toolCall(id: "c2", name: "act", arguments: .object([
            "action": .object(["type": .string("tap"), "ref": .string("e1")]),
        ])))
        conversation.answer(id: "c2", text: "动作没有执行：STALE_REF", screen: false)
        conversation.append(.toolCall(id: "c3", name: "observe", arguments: .object([:])))
        conversation.answer(id: "c3", text: "SCREEN-2", screen: true)

        return screenChecks(conversation) + openAIChecks(conversation) + anthropicChecks(conversation) + schemaChecks()
    }

    /// Only the newest screen may stay in full, and a refusal is never stubbed.
    /// @param conversation - transcript built like one task's.
    private static func screenChecks(_ conversation: TaskConversation) -> [String] {
        var failures: [String] = []
        if case let .user(goalTurn) = conversation.items[1], goalTurn.contains("SCREEN-0") {
            failures.append("开局屏幕没有被省略")
        }
        let screens = conversation.items.compactMap { item -> String? in
            if case let .toolResult(_, text) = item, text.contains("SCREEN-") {
                return text
            }
            return nil
        }
        if screens != ["SCREEN-2"] {
            failures.append("上下文里有 \(screens.count) 个完整屏幕")
        }
        if answer(to: conversation.items, id: "c2") == TaskConversation.staleScreen {
            failures.append("动作被拒绝的原因被当成屏幕省略掉了")
        }
        return failures
    }

    /// Every tool message must answer a call of an earlier assistant turn.
    /// @param conversation - transcript built like one task's.
    private static func openAIChecks(_ conversation: TaskConversation) -> [String] {
        var failures: [String] = []
        let messages = OpenAIProvider.messages(conversation.items).arrayValue ?? []
        var asked: Set<String> = []
        var answered = 0
        for message in messages {
            let role = message["role"]?.stringValue ?? ""
            if role == "assistant", let calls = message["tool_calls"]?.arrayValue {
                for call in calls {
                    guard let id = call["id"]?.stringValue else {
                        failures.append("OpenAI 的工具调用没有 id")
                        continue
                    }
                    if call["function"]?["arguments"]?.stringValue == nil {
                        failures.append("OpenAI 的 arguments 不是 JSON 字符串")
                    }
                    asked.insert(id)
                }
            }
            if role == "tool" {
                answered += 1
                guard let id = message["tool_call_id"]?.stringValue, asked.contains(id) else {
                    failures.append("OpenAI 的工具结果没有对上任何调用")
                    continue
                }
            }
        }
        if answered != 3 {
            failures.append("OpenAI 的工具结果有 \(answered) 条，应为 3 条")
        }
        return failures
    }

    /// Roles must alternate, and each result must answer the preceding call.
    /// @param conversation - transcript built like one task's.
    private static func anthropicChecks(_ conversation: TaskConversation) -> [String] {
        var failures: [String] = []
        let turns = AnthropicProvider.messages(conversation.items).arrayValue ?? []
        var previous = ""
        for turn in turns {
            let role = turn["role"]?.stringValue ?? ""
            if role == previous {
                failures.append("Anthropic 的 \(role) 角色连续出现")
            }
            previous = role
        }
        let blocks = turns.flatMap { $0["content"]?.arrayValue ?? [] }
        let calls = blocks.filter { $0["type"]?.stringValue == "tool_use" }.compactMap { $0["id"]?.stringValue }
        let results = blocks.filter { $0["type"]?.stringValue == "tool_result" }
            .compactMap { $0["tool_use_id"]?.stringValue }
        if calls != results {
            failures.append("Anthropic 的调用 \(calls) 与结果 \(results) 不配对")
        }
        return failures
    }

    /// The act schema must offer every member the engine accepts.
    private static func schemaChecks() -> [String] {
        var failures: [String] = []
        let wanted = [
            "type", "ref", "point", "from", "to", "direction", "durationMs", "count",
            "text", "submit", "button", "bundleId", "name", "fresh", "url", "ms", "untilText", "timeoutMs",
        ]
        for (name, tools) in [("OpenAI", BrainTools.openAI), ("Anthropic", BrainTools.anthropic)] {
            let act = (tools.arrayValue ?? []).first { tool in
                (tool["function"]?["name"]?.stringValue ?? tool["name"]?.stringValue) == "act"
            }
            let parameters = act?["function"]?["parameters"] ?? act?["input_schema"]
            let properties = parameters?["properties"]?["action"]?["properties"]?.objectValue ?? [:]
            let missing = wanted.filter { properties[$0] == nil }
            if !missing.isEmpty {
                failures.append("\(name) 的 act 参数缺少 \(missing)")
            }
        }
        return failures
    }

    private static func answer(to items: [TranscriptItem], id: String) -> String? {
        for item in items {
            if case let .toolResult(resultId, text) = item, resultId == id {
                return text
            }
        }
        return nil
    }
}
