//
//  Provider.swift
//  Tomato Runner
//
//  The model call behind the on-device task loop.
//
//  One transcript, two wire shapes: an OpenAI-compatible `chat/completions`
//  endpoint and Anthropic's `messages` API. Both receive the same tool schema
//  and both answer one tool call per turn, so the loop above them does not
//  branch on the provider.
//
//  Both APIs reject a tool result that does not answer a call the model made in
//  the preceding turn, so every call keeps its id until its result goes back.
//

import Foundation

/// One tool call the model asked for.
struct ToolCall: Sendable {
    /// Identity that binds this call to its result.
    let id: String
    let name: String
    let arguments: PhoneJSON
}

/// What one model turn produced.
enum Decision: Sendable {
    case tool(ToolCall)
    case text(String)
}

/// One entry of the conversation sent to a provider.
enum TranscriptItem: Sendable {
    case system(String)
    case user(String)
    case assistant(String)
    /// A tool call; its id binds the matching `toolResult`.
    case toolCall(id: String, name: String, arguments: PhoneJSON)
    /// The answer to one `toolCall`.
    case toolResult(id: String, text: String)
}

/// One provider's request shape.
protocol ModelProvider: Sendable {
    /// Ask for the next step.
    /// @param transcript - conversation the loop built.
    /// @param signal - cancellation; a provider stops as soon as it is set.
    /// @returns the tool call to perform, or the final text.
    func decide(transcript: [TranscriptItem], signal: AsyncSignal) async throws -> Decision
}

/// Cancellation a provider can observe while an HTTP task runs.
final class AsyncSignal: @unchecked Sendable {
    private let lock = NSLock()
    private var cancelled = false

    var isCancelled: Bool {
        lock.lock()
        defer { lock.unlock() }
        return cancelled
    }

    func cancel() {
        lock.lock()
        cancelled = true
        lock.unlock()
    }
}

/// Which provider to call for one task.
struct ProviderChoice: Codable, Sendable {
    enum Kind: String, Codable, Sendable {
        case openai
        case anthropic
        /// Deterministic actions, for device checks without a model.
        case script
    }

    var kind: Kind
    var baseURL: String
    var apiKey: String
    var model: String
    /// Scripted actions, used only by `script`.
    var script: [String]?
}

/// The tool schema both providers receive.
///
/// Built as `PhoneJSON` values rather than one raw document so the members below
/// stay the wire action's own fields: a member missing here is a gesture the
/// model cannot ask for, whatever the engine supports.
enum BrainTools {
    private static let observeDescription = "Read the phone's current screen: the app in front, "
        + "one line per actionable element with a ref, and the system alert when one is open."
    private static let actDescription = "Perform one action on the phone and return the settled screen. "
        + "The answer says whether the page changed; when it did not, read the screen again instead of "
        + "repeating the action, and scroll before tapping an element near the bottom edge."
    private static let doneDescription = "Finish the task and report the outcome."

    /// One action; `type` selects which of the other members apply.
    static let action: PhoneJSON = .object([
        "type": .string("object"),
        "additionalProperties": .bool(false),
        "required": .array([.string("type")]),
        "properties": .object([
            "type": strings(["tap", "longPress", "swipe", "type", "press", "launch", "openUrl", "wait"]),
            "ref": .object([
                "type": .string("string"),
                "description": .string("Element ref from the latest screen result; it is valid for that result only."),
            ]),
            "point": point("Tap or long press at this screen point instead of a ref."),
            "from": point("Gesture start point."),
            "to": point("Gesture end point."),
            "direction": strings(["up", "down", "left", "right"]),
            "durationMs": integer("Gesture length in milliseconds."),
            "count": integer("1 for a tap, 2 for a double tap."),
            "text": .object([
                "type": .string("string"),
                "description": .string("Text to enter, up to 4000 characters."),
            ]),
            "submit": .object([
                "type": .string("boolean"),
                "description": .string("Send Return after the text."),
            ]),
            "button": strings(["home", "volumeUp", "volumeDown"]),
            "bundleId": .object([
                "type": .string("string"),
                "description": .string("Application to launch, by bundle id."),
            ]),
            "name": .object([
                "type": .string("string"),
                "description": .string("Application to launch, by name, such as 设置."),
            ]),
            "fresh": .object([
                "type": .string("boolean"),
                "description": .string("Terminate the application before launching it."),
            ]),
            "url": .object([
                "type": .string("string"),
                "description": .string("http(s) URL, or a scheme this device has an application for."),
            ]),
            "ms": integer("Milliseconds to wait."),
            "untilText": .object([
                "type": .string("string"),
                "description": .string("Wait until this text appears."),
            ]),
            "timeoutMs": integer("How long a wait may take, in milliseconds."),
        ]),
    ])

    private static let observeParameters: PhoneJSON = .object([
        "type": .string("object"),
        "properties": .object([:]),
        "additionalProperties": .bool(false),
    ])

    private static let actParameters: PhoneJSON = .object([
        "type": .string("object"),
        "properties": .object(["action": action]),
        "required": .array([.string("action")]),
        "additionalProperties": .bool(false),
    ])

    private static let doneParameters: PhoneJSON = .object([
        "type": .string("object"),
        "properties": .object([
            "summary": .object([
                "type": .string("string"),
                "description": .string("What the task ended with, in the owner's language."),
            ]),
        ]),
        "required": .array([.string("summary")]),
        "additionalProperties": .bool(false),
    ])

    /// OpenAI-compatible `tools` array.
    static let openAI: PhoneJSON = .array([
        function("observe", observeDescription, observeParameters),
        function("act", actDescription, actParameters),
        function("done", doneDescription, doneParameters),
    ])

    /// Anthropic `tools` array: the same parameters under `input_schema`.
    static let anthropic: PhoneJSON = .array([
        anthropicTool("observe", observeDescription, observeParameters),
        anthropicTool("act", actDescription, actParameters),
        anthropicTool("done", doneDescription, doneParameters),
    ])

    private static func function(_ name: String, _ description: String, _ parameters: PhoneJSON) -> PhoneJSON {
        .object([
            "type": .string("function"),
            "function": .object([
                "name": .string(name),
                "description": .string(description),
                "parameters": parameters,
            ]),
        ])
    }

    private static func anthropicTool(_ name: String, _ description: String, _ parameters: PhoneJSON) -> PhoneJSON {
        .object([
            "name": .string(name),
            "description": .string(description),
            "input_schema": parameters,
        ])
    }

    private static func strings(_ values: [String]) -> PhoneJSON {
        .object([
            "type": .string("string"),
            "enum": .array(values.map { .string($0) }),
        ])
    }

    private static func integer(_ description: String) -> PhoneJSON {
        .object([
            "type": .string("integer"),
            "description": .string(description),
        ])
    }

    private static func point(_ description: String) -> PhoneJSON {
        .object([
            "type": .string("object"),
            "description": .string(description),
            "properties": .object([
                "x": .object(["type": .string("number")]),
                "y": .object(["type": .string("number")]),
            ]),
            "required": .array([.string("x"), .string("y")]),
            "additionalProperties": .bool(false),
        ])
    }
}

/// OpenAI-compatible chat completions.
struct OpenAIProvider: ModelProvider {
    let choice: ProviderChoice

    func decide(transcript: [TranscriptItem], signal: AsyncSignal) async throws -> Decision {
        if signal.isCancelled {
            throw PhoneFailure(.halted, "任务已停止")
        }
        guard let url = Self.endpoint(choice.baseURL) else {
            throw PhoneFailure(.badRequest, "baseURL 不是合法地址")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(choice.apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 60
        let body: PhoneJSON = .object([
            "model": .string(choice.model),
            "messages": Self.messages(transcript),
            "tools": BrainTools.openAI,
            "tool_choice": .string("auto"),
        ])
        request.httpBody = try JSONEncoder().encode(body)
        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200 ..< 300).contains(status) else {
            throw PhoneFailure(.internal, "模型请求失败：HTTP \(status)\(Self.reason(in: data))")
        }
        let root = (try? JSONDecoder().decode(PhoneJSON.self, from: data)) ?? .object([:])
        let message = root["choices"]?.arrayValue?.first?["message"]
        guard let call = message?["tool_calls"]?.arrayValue?.first else {
            return .text(message?["content"]?.stringValue ?? "")
        }
        let name = call["function"]?["name"]?.stringValue ?? ""
        let raw = call["function"]?["arguments"]?.stringValue ?? "{}"
        let arguments = (try? JSONDecoder().decode(PhoneJSON.self, from: Data(raw.utf8))) ?? .object([:])
        return .tool(ToolCall(id: call["id"]?.stringValue ?? UUID().uuidString, name: name, arguments: arguments))
    }

    /// Chat-completions URL, whether or not the base already names the path.
    private static func endpoint(_ base: String) -> URL? {
        let trimmed = base.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))
        return URL(string: trimmed.hasSuffix("/chat/completions") ? trimmed : trimmed + "/chat/completions")
    }

    /// One OpenAI message per turn: a tool call travels as `tool_calls` on the
    /// assistant message, and its answer as a `tool` message naming the same id.
    static func messages(_ transcript: [TranscriptItem]) -> PhoneJSON {
        .array(transcript.map { item -> PhoneJSON in
            switch item {
            case let .system(text):
                .object(["role": .string("system"), "content": .string(text)])
            case let .user(text):
                .object(["role": .string("user"), "content": .string(text)])
            case let .assistant(text):
                .object(["role": .string("assistant"), "content": .string(text)])
            case let .toolCall(id, name, arguments):
                .object([
                    "role": .string("assistant"),
                    "content": .null,
                    "tool_calls": .array([.object([
                        "id": .string(id),
                        "type": .string("function"),
                        "function": .object([
                            "name": .string(name),
                            // Arguments travel as a JSON string, not an object.
                            "arguments": .string(encoded(arguments)),
                        ]),
                    ])]),
                ])
            case let .toolResult(id, text):
                .object([
                    "role": .string("tool"),
                    "tool_call_id": .string(id),
                    "content": .string(text),
                ])
            }
        })
    }

    /// Read the API's own error sentence, so a rejected request says why.
    private static func reason(in data: Data) -> String {
        guard let root = try? JSONDecoder().decode(PhoneJSON.self, from: data),
              let message = root["error"]?["message"]?.stringValue ?? root["message"]?.stringValue,
              !message.isEmpty
        else { return "" }
        return "（\(String(message.prefix(300)))）"
    }

    private static func encoded(_ value: PhoneJSON) -> String {
        guard let data = try? JSONEncoder().encode(value) else { return "{}" }
        return String(data: data, encoding: .utf8) ?? "{}"
    }
}

/// Anthropic's messages API.
struct AnthropicProvider: ModelProvider {
    let choice: ProviderChoice

    func decide(transcript: [TranscriptItem], signal: AsyncSignal) async throws -> Decision {
        if signal.isCancelled {
            throw PhoneFailure(.halted, "任务已停止")
        }
        let base = choice.baseURL.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))
        guard let url = URL(string: base.hasSuffix("/v1/messages") ? base : base + "/v1/messages") else {
            throw PhoneFailure(.badRequest, "baseURL 不是合法地址")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(choice.apiKey, forHTTPHeaderField: "x-api-key")
        request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 60
        let body: PhoneJSON = .object([
            "model": .string(choice.model),
            "max_tokens": .number(1024),
            "system": .string(Self.systemText(transcript)),
            "messages": Self.messages(transcript),
            "tools": BrainTools.anthropic,
        ])
        request.httpBody = try JSONEncoder().encode(body)
        let (data, response) = try await URLSession.shared.data(for: request)
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard (200 ..< 300).contains(status) else {
            throw PhoneFailure(.internal, "模型请求失败：HTTP \(status)\(Self.reason(in: data))")
        }
        let root = (try? JSONDecoder().decode(PhoneJSON.self, from: data)) ?? .object([:])
        let content = root["content"]?.arrayValue ?? []
        guard let block = content.first(where: { $0["type"]?.stringValue == "tool_use" }) else {
            return .text(content.first(where: { $0["type"]?.stringValue == "text" })?["text"]?.stringValue ?? "")
        }
        return .tool(ToolCall(
            id: block["id"]?.stringValue ?? UUID().uuidString,
            name: block["name"]?.stringValue ?? "",
            arguments: block["input"] ?? .object([:])
        ))
    }

    private static func systemText(_ transcript: [TranscriptItem]) -> String {
        transcript.compactMap { item -> String? in
            if case let .system(text) = item {
                return text
            }
            return nil
        }.joined(separator: "\n\n")
    }

    /// Anthropic carries calls and results as content blocks and rejects a
    /// request whose roles repeat, so adjacent turns with the same role merge.
    static func messages(_ transcript: [TranscriptItem]) -> PhoneJSON {
        var turns: [(role: String, blocks: [PhoneJSON])] = []
        func push(_ role: String, _ block: PhoneJSON) {
            if var last = turns.last, last.role == role {
                last.blocks.append(block)
                turns[turns.count - 1] = last
            } else {
                turns.append((role, [block]))
            }
        }
        for item in transcript {
            switch item {
            case .system:
                continue
            case let .user(text):
                push("user", Self.textBlock(text))
            case let .assistant(text):
                push("assistant", Self.textBlock(text))
            case let .toolCall(id, name, arguments):
                push("assistant", .object([
                    "type": .string("tool_use"),
                    "id": .string(id),
                    "name": .string(name),
                    "input": arguments,
                ]))
            case let .toolResult(id, text):
                push("user", .object([
                    "type": .string("tool_result"),
                    "tool_use_id": .string(id),
                    "content": .string(text),
                ]))
            }
        }
        return .array(turns.map { turn in
            .object(["role": .string(turn.role), "content": .array(turn.blocks)])
        })
    }

    private static func textBlock(_ text: String) -> PhoneJSON {
        .object(["type": .string("text"), "text": .string(text)])
    }

    private static func reason(in data: Data) -> String {
        guard let root = try? JSONDecoder().decode(PhoneJSON.self, from: data),
              let message = root["error"]?["message"]?.stringValue,
              !message.isEmpty
        else { return "" }
        return "（\(String(message.prefix(300)))）"
    }
}

/// Deterministic actions for a device check with no model in the loop.
///
/// The cursor belongs to the instance: each task builds its own provider, and a
/// cursor shared across runs would start the second scripted task mid-script.
final class ScriptedProvider: ModelProvider, @unchecked Sendable {
    let choice: ProviderChoice
    private let lock = NSLock()
    private var cursor = 0

    init(choice: ProviderChoice) {
        self.choice = choice
    }

    func decide(transcript: [TranscriptItem], signal: AsyncSignal) async throws -> Decision {
        if signal.isCancelled {
            throw PhoneFailure(.halted, "任务已停止")
        }
        let step = advance()
        let script = choice.script ?? []
        guard step < script.count else {
            return .tool(ToolCall(id: UUID().uuidString, name: "done", arguments: .object(["summary": .string("脚本执行完毕")])))
        }
        let raw = script[step]
        guard let data = raw.data(using: .utf8),
              let parsed = try? JSONDecoder().decode(PhoneJSON.self, from: data),
              let name = parsed["name"]?.stringValue
        else {
            throw PhoneFailure(.internal, "脚本条目无法解析")
        }
        return .tool(ToolCall(id: UUID().uuidString, name: name, arguments: parsed["arguments"] ?? .object([:])))
    }

    /// Next script position. Synchronous so the async entry may take the lock.
    private func advance() -> Int {
        lock.lock()
        defer { lock.unlock() }
        let step = cursor
        cursor += 1
        return step
    }
}

/// Build the provider a task asked for.
/// @param choice - provider kind, endpoint, key, and model.
/// @returns the provider, or a failure naming the unsupported kind.
func makeProvider(_ choice: ProviderChoice) throws -> ModelProvider {
    switch choice.kind {
    case .openai: OpenAIProvider(choice: choice)
    case .anthropic: AnthropicProvider(choice: choice)
    case .script: ScriptedProvider(choice: choice)
    }
}
