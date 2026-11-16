//
//  ModelProtocol.swift
//  Tomato Remote
//
//  The wire protocols Tomato Phone can speak, and what each one needs.
//
//  The phone's loop reaches a model directly, so the protocol is a stored
//  choice rather than a Host decision. Two exist here: an OpenAI-compatible
//  chat endpoint and Anthropic's Messages API. Everything protocol-specific —
//  endpoint paths, credentials, request bodies, streaming events, and reply
//  parsing — lives in this file so the loop itself stays one shape.
//

import CryptoKit
import Foundation

/// One model wire protocol the phone can call.
enum AgentModelProtocol: String, CaseIterable, Codable, Identifiable {
    case openai
    case anthropic

    var id: String {
        rawValue
    }

    /// Wording on the settings picker and the model sheet.
    var title: String {
        switch self {
        case .openai: "OpenAI 兼容"
        case .anthropic: "Anthropic Messages"
        }
    }

    /// Endpoint root the settings preset fills in.
    var defaultBaseURL: String {
        switch self {
        case .openai: "https://api.openai.com/v1"
        case .anthropic: "https://api.anthropic.com"
        }
    }

    /// Model the preset starts with.
    var defaultModel: String {
        switch self {
        case .openai: "gpt-4.1-mini"
        case .anthropic: "claude-haiku-4-5"
        }
    }

    /// Path that lists this endpoint's models.
    var modelsPath: String {
        switch self {
        case .openai: "/models"
        case .anthropic: "/v1/models"
        }
    }

    /// Path that opens one chat turn.
    var messagesPath: String {
        switch self {
        case .openai: "/chat/completions"
        case .anthropic: "/v1/messages"
        }
    }
}

/// Token accounting one reply reported, including cached prefixes.
struct ModelUsage: Equatable {
    var inputTokens: Int?
    var outputTokens: Int?
    /// Input tokens served from the provider's prompt cache.
    var cachedInputTokens: Int?
    /// Input tokens written to the provider's prompt cache.
    var cacheWriteTokens: Int?

    var isEmpty: Bool {
        inputTokens == nil && outputTokens == nil && cachedInputTokens == nil && cacheWriteTokens == nil
    }

    /// One line for the transport log.
    var summary: String {
        [
            inputTokens.map { "in \($0)" },
            outputTokens.map { "out \($0)" },
            cachedInputTokens.map { "cached \($0)" },
            cacheWriteTokens.map { "cache-write \($0)" },
        ].compactMap { $0 }.joined(separator: " ")
    }
}

/// Cache controls a request can carry beyond the protocol's own defaults.
struct ModelCachePolicy: Equatable {
    /// Add a fourth breakpoint on the last turn, so Anthropic can cache the
    /// conversation prefix rather than only system and tools.
    var anthropicCachesLastTurn = false
    /// Stable key OpenAI uses to route a conversation to the same prompt cache.
    var openAIPromptCacheKey: String?

    static let standard = ModelCachePolicy()
}

/// One model step's settled answer.
struct ModelAnswer: Equatable {
    var text: String
    var reasoning: String?
    var toolCalls: [AgentToolCall]?
    var usage: ModelUsage?
}

/// One tool call while its deltas are still arriving.
struct PartialToolCall {
    var id = ""
    var name = ""
    var arguments = ""
}

/// Request bodies, credentials, and reply parsing per protocol.
enum ModelWire {
    /// Join an endpoint root and one protocol path without duplicating `/v1`.
    /// - Parameters:
    ///   - base: root as configured, with or without a trailing slash.
    ///   - path: protocol path, normally starting with `/`.
    /// - Returns: the absolute URL, or nil when the root is unusable.
    static func endpoint(base: String, path: String) -> URL? {
        let trimmed = base.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))
        guard !trimmed.isEmpty else { return nil }
        if trimmed.hasSuffix("/v1"), path.hasPrefix("/v1/") {
            return URL(string: trimmed + path.dropFirst(3))
        }
        return URL(string: trimmed + path)
    }

    /// One chat request for the stored protocol.
    /// - Parameters:
    ///   - protocol: wire protocol to speak.
    ///   - baseURL: endpoint root.
    ///   - model: model id.
    ///   - key: credential.
    ///   - system: system prompt, sent as a system message or the top-level field.
    ///   - messages: OpenAI-shaped messages the loop already assembles.
    ///   - tools: OpenAI-shaped function tools the loop already declares.
    ///   - reasoningEffort: stored depth, or nil for the provider's own default.
    /// - Returns: the prepared request.
    /// - Throws: `AgentError.transport` when the endpoint is unusable.
    static func request(
        protocol wire: AgentModelProtocol,
        baseURL: String,
        model: String,
        key: String,
        system: String,
        messages: [JSONValue],
        tools: [JSONValue],
        reasoningEffort: String?,
        cache: ModelCachePolicy = .standard
    ) throws -> URLRequest {
        guard let url = endpoint(base: baseURL, path: wire.messagesPath) else {
            throw AgentError.transport("模型地址不合法")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 120
        switch wire {
        case .openai:
            request.setValue("Bearer \(key)", forHTTPHeaderField: "Authorization")
        case .anthropic:
            request.setValue(key, forHTTPHeaderField: "x-api-key")
            request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        }
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        let body = try body(
            protocol: wire,
            model: model,
            system: system,
            messages: messages,
            tools: tools,
            reasoningEffort: reasoningEffort,
            cache: cache
        )
        request.httpBody = try JSONEncoder().encode(JSONValue.object(body))
        return request
    }

    /// One chat body for the protocol.
    /// - Parameters:
    ///   - protocol: wire protocol to speak.
    ///   - model: model id.
    ///   - system: system prompt.
    ///   - messages: OpenAI-shaped messages.
    ///   - tools: OpenAI-shaped function tools.
    ///   - reasoningEffort: stored depth, or nil.
    /// - Returns: the JSON object the request carries.
    /// - Throws: when an Anthropic message cannot be built from the loop's rows.
    static func body(
        protocol wire: AgentModelProtocol,
        model: String,
        system: String,
        messages: [JSONValue],
        tools: [JSONValue],
        reasoningEffort: String?,
        cache: ModelCachePolicy = .standard
    ) throws -> [String: JSONValue] {
        switch wire {
        case .openai:
            var body: [String: JSONValue] = [
                "model": .string(model),
                "messages": .array([.object(["role": .string("system"), "content": .string(system)])] + messages),
                "tools": .array(tools),
                "tool_choice": .string("auto"),
                "stream": .bool(true),
            ]
            if let reasoningEffort {
                body["reasoning_effort"] = .string(reasoningEffort)
            }
            if let key = cache.openAIPromptCacheKey {
                body["prompt_cache_key"] = .string(key)
            }
            return body
        case .anthropic:
            return AnthropicBody.make(
                model: model,
                system: system,
                messages: messages,
                tools: tools,
                reasoningEffort: reasoningEffort,
                cacheLastTurn: cache.anthropicCachesLastTurn
            )
        }
    }

    /// One `GET` request for the endpoint's model list.
    /// - Parameters:
    ///   - protocol: wire protocol the endpoint speaks.
    ///   - baseURL: endpoint root.
    ///   - apiKey: credential.
    /// - Returns: the prepared request, or nil when the root is unusable.
    static func modelListRequest(
        protocol wire: AgentModelProtocol,
        baseURL: String,
        apiKey: String
    ) -> URLRequest? {
        guard let url = endpoint(base: baseURL, path: wire.modelsPath) else { return nil }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.timeoutInterval = 20
        switch wire {
        case .openai:
            request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        case .anthropic:
            request.setValue(apiKey, forHTTPHeaderField: "x-api-key")
            request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
        }
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        return request
    }

    /// Read model ids from either protocol's list body.
    /// - Parameters:
    ///   - protocol: protocol that produced the body.
    ///   - data: response body.
    /// - Returns: unique ids, sorted.
    static func parseModelList(protocol wire: AgentModelProtocol, data: Data) -> [String] {
        guard let object = try? JSONSerialization.jsonObject(with: data),
              let root = object as? [String: Any]
        else { return [] }
        // Both APIs answer with `{ data: [{ id }] }`; a relay may use `models`.
        let entries = root["data"] as? [[String: Any]] ?? root["models"] as? [[String: Any]] ?? []
        var seen = Set<String>()
        return entries
            .compactMap { $0["id"] as? String ?? $0["name"] as? String }
            .filter { seen.insert($0).inserted }
            .sorted()
    }

    /// Decode one non-streaming reply.
    /// - Parameters:
    ///   - protocol: protocol that produced the body.
    ///   - data: response body.
    /// - Returns: the step's text, reasoning, and tool calls.
    /// - Throws: `AgentError.transport` when the body is not a reply.
    static func parseAnswer(protocol wire: AgentModelProtocol, data: Data) throws -> ModelAnswer {
        switch wire {
        case .openai:
            try openAIAnswer(data)
        case .anthropic:
            try anthropicAnswer(data)
        }
    }

    /// One streaming parser for the protocol.
    /// - Parameter protocol: protocol whose events the stream carries.
    /// - Returns: an accumulator the loop feeds decoded lines.
    static func streamParser(protocol wire: AgentModelProtocol) -> ModelStreamParser {
        ModelStreamParser(protocol: wire)
    }

    // MARK: - Anthropic body

    // MARK: - Non-streaming replies

    private static func openAIAnswer(_ data: Data) throws -> ModelAnswer {
        guard let root = try? JSONDecoder().decode(JSONValue.self, from: data),
              let message = root["choices"]?.arrayValue?.first?["message"]
        else {
            throw AgentError.transport("模型回应无法解析")
        }
        let text = message["content"]?.stringValue ?? ""
        let reasoning = message["reasoning_content"]?.stringValue ?? message["reasoning"]?.stringValue
        let calls = (message["tool_calls"]?.arrayValue ?? []).compactMap { entry -> AgentToolCall? in
            guard let id = entry["id"]?.stringValue,
                  let name = entry["function"]?["name"]?.stringValue
            else { return nil }
            let raw = entry["function"]?["arguments"]?.stringValue ?? "{}"
            let arguments = (try? JSONDecoder().decode(JSONValue.self, from: Data(raw.utf8))) ?? .object([:])
            return AgentToolCall(id: id, name: name, arguments: arguments)
        }
        let usage = openAIUsage(root["usage"])
        return ModelAnswer(
            text: text,
            reasoning: reasoning.flatMap { $0.isEmpty ? nil : $0 },
            toolCalls: calls.isEmpty ? nil : calls,
            usage: usage.isEmpty ? nil : usage
        )
    }

    private static func anthropicAnswer(_ data: Data) throws -> ModelAnswer {
        guard let root = try? JSONDecoder().decode(JSONValue.self, from: data),
              let blocks = root["content"]?.arrayValue
        else {
            throw AgentError.transport("模型回应无法解析")
        }
        var text = ""
        var reasoning = ""
        var calls: [AgentToolCall] = []
        for block in blocks {
            switch block["type"]?.stringValue {
            case "text":
                text += block["text"]?.stringValue ?? ""
            case "thinking":
                reasoning += block["thinking"]?.stringValue ?? ""
            case "tool_use":
                let id = block["id"]?.stringValue ?? ""
                let name = block["name"]?.stringValue ?? ""
                guard !name.isEmpty else { continue }
                calls.append(AgentToolCall(
                    id: id.isEmpty ? "call_\(calls.count)" : id,
                    name: name,
                    arguments: block["input"] ?? .object([:])
                ))
            default:
                // A newer block type the loop has no use for.
                continue
            }
        }
        let usage = anthropicUsage(root["usage"])
        return ModelAnswer(
            text: text,
            reasoning: reasoning.isEmpty ? nil : reasoning,
            toolCalls: calls.isEmpty ? nil : calls,
            usage: usage.isEmpty ? nil : usage
        )
    }

    /// Read OpenAI's token counters, including the cached-prefix detail.
    fileprivate static func openAIUsage(_ value: JSONValue?) -> ModelUsage {
        var usage = ModelUsage()
        usage.inputTokens = value?["prompt_tokens"]?.doubleValue.map { Int($0) }
        usage.outputTokens = value?["completion_tokens"]?.doubleValue.map { Int($0) }
        // OpenAI reports cache hits under prompt_tokens_details; DeepSeek's
        // OpenAI-compatible API uses prompt_cache_hit_tokens directly.
        usage.cachedInputTokens = value?["prompt_tokens_details"]?["cached_tokens"]?.doubleValue.map { Int($0) }
            ?? value?["prompt_cache_hit_tokens"]?.doubleValue.map { Int($0) }
        return usage
    }

    /// Read Anthropic's token counters, including cache reads and writes.
    fileprivate static func anthropicUsage(_ value: JSONValue?) -> ModelUsage {
        var usage = ModelUsage()
        usage.inputTokens = value?["input_tokens"]?.doubleValue.map { Int($0) }
        usage.outputTokens = value?["output_tokens"]?.doubleValue.map { Int($0) }
        usage.cachedInputTokens = value?["cache_read_input_tokens"]?.doubleValue.map { Int($0) }
        usage.cacheWriteTokens = value?["cache_creation_input_tokens"]?.doubleValue.map { Int($0) }
        return usage
    }
}

/// The Messages API body: a translation of the loop's OpenAI-shaped turns.
private enum AnthropicBody {
    /// Build the Messages API body from the loop's OpenAI-shaped turns.
    /// - Parameters:
    ///   - model: model id.
    ///   - system: system prompt.
    ///   - messages: OpenAI-shaped messages.
    ///   - tools: OpenAI-shaped function tools.
    ///   - reasoningEffort: stored depth, or nil.
    /// - Returns: the Messages API body.
    static func make(
        model: String,
        system: String,
        messages: [JSONValue],
        tools: [JSONValue],
        reasoningEffort: String?,
        cacheLastTurn: Bool
    ) -> [String: JSONValue] {
        var systemTexts: [String] = system.isEmpty ? [] : [system]
        var turns: [(role: String, content: [JSONValue])] = []
        var pendingToolResults: [JSONValue] = []

        func append(role: String, blocks: [JSONValue]) {
            guard !blocks.isEmpty else { return }
            if let last = turns.last, last.role == role {
                turns[turns.count - 1].content.append(contentsOf: blocks)
            } else {
                turns.append((role, blocks))
            }
        }
        func flushToolResults() {
            guard !pendingToolResults.isEmpty else { return }
            append(role: "user", blocks: pendingToolResults)
            pendingToolResults = []
        }

        for message in messages {
            switch message["role"]?.stringValue ?? "" {
            case "system":
                if let text = message["content"]?.stringValue, !text.isEmpty {
                    systemTexts.append(text)
                }
            case "user":
                flushToolResults()
                append(role: "user", blocks: content(message["content"]))
            case "assistant":
                flushToolResults()
                var blocks: [JSONValue] = []
                if let text = message["content"]?.stringValue, !text.isEmpty {
                    blocks.append(.object(["type": .string("text"), "text": .string(text)]))
                }
                for entry in message["tool_calls"]?.arrayValue ?? [] {
                    let id = entry["id"]?.stringValue ?? ""
                    let name = entry["function"]?["name"]?.stringValue ?? ""
                    let raw = entry["function"]?["arguments"]?.stringValue ?? "{}"
                    let input = (try? JSONDecoder().decode(JSONValue.self, from: Data(raw.utf8))) ?? .object([:])
                    blocks.append(.object([
                        "type": .string("tool_use"),
                        "id": .string(id),
                        "name": .string(name),
                        "input": input,
                    ]))
                }
                append(role: "assistant", blocks: blocks)
            case "tool":
                pendingToolResults.append(.object([
                    "type": .string("tool_result"),
                    "tool_use_id": .string(message["tool_call_id"]?.stringValue ?? ""),
                    "content": .array([.object([
                        "type": .string("text"),
                        "text": .string(message["content"]?.stringValue ?? ""),
                    ])]),
                ]))
            default:
                // Proposal rows never reach the wire.
                continue
            }
        }
        flushToolResults()

        // The last turn is the growing edge of the conversation; a breakpoint
        // there lets the next turn reuse everything before it.
        if cacheLastTurn, var last = turns.last, !last.content.isEmpty {
            let index = last.content.count - 1
            if var block = last.content[index].objectValue {
                block["cache_control"] = .object(["type": .string("ephemeral")])
                last.content[index] = .object(block)
                turns[turns.count - 1] = last
            }
        }

        var body: [String: JSONValue] = [
            "model": .string(model),
            "messages": .array(turns.map { turn in
                .object(["role": .string(turn.role), "content": .array(turn.content)])
            }),
            "max_tokens": .number(4096),
            "stream": .bool(true),
        ]
        let joined = systemTexts.filter { !$0.isEmpty }.joined(separator: "\n\n")
        if !joined.isEmpty {
            body["system"] = .array([.object([
                "type": .string("text"),
                "text": .string(joined),
                "cache_control": .object(["type": .string("ephemeral")]),
            ])])
        }
        let schema = toolSchemas(tools)
        if !schema.isEmpty {
            // The last tool carries the breakpoint, so the whole tool block
            // and the system prompt before it are reused on the next turn.
            var cached = schema
            cached[cached.count - 1] = .object([
                "name": cached[cached.count - 1]["name"] ?? .string(""),
                "description": cached[cached.count - 1]["description"] ?? .string(""),
                "input_schema": cached[cached.count - 1]["input_schema"] ?? .object([:]),
                "cache_control": .object(["type": .string("ephemeral")]),
            ])
            body["tools"] = .array(cached)
        }
        if let reasoningEffort {
            let budget = thinkingBudget(reasoningEffort)
            body["thinking"] = .object([
                "type": .string("enabled"),
                "budget_tokens": .number(Double(budget)),
            ])
            body["max_tokens"] = .number(Double(budget + 4096))
        }
        return body
    }

    /// Convert one OpenAI user content value into Messages API content blocks.
    private static func content(_ content: JSONValue?) -> [JSONValue] {
        switch content {
        case let .string(text):
            text.isEmpty ? [] : [.object(["type": .string("text"), "text": .string(text)])]
        case let .array(parts):
            parts.compactMap { part in
                switch part["type"]?.stringValue {
                case "text":
                    guard let text = part["text"]?.stringValue, !text.isEmpty else { return nil }
                    return .object(["type": .string("text"), "text": .string(text)])
                case "image_url":
                    guard let url = part["image_url"]?["url"]?.stringValue else { return nil }
                    if let data = base64ImageData(url) {
                        return .object([
                            "type": .string("image"),
                            "source": .object([
                                "type": .string("base64"),
                                "media_type": .string("image/jpeg"),
                                "data": .string(data),
                            ]),
                        ])
                    }
                    return .object([
                        "type": .string("image"),
                        "source": .object(["type": .string("url"), "url": .string(url)]),
                    ])
                default:
                    return nil
                }
            }
        default:
            []
        }
    }

    /// Base64 payload of a data URL, or nil for an ordinary URL.
    private static func base64ImageData(_ url: String) -> String? {
        guard url.hasPrefix("data:"), let comma = url.firstIndex(of: ",") else { return nil }
        return String(url[url.index(after: comma)...])
    }

    /// Map the loop's OpenAI function tools to Messages API tool definitions.
    private static func toolSchemas(_ tools: [JSONValue]) -> [JSONValue] {
        tools.compactMap { entry in
            guard let function = entry["function"] else { return nil }
            let name = function["name"]?.stringValue ?? ""
            guard !name.isEmpty else { return nil }
            return .object([
                "name": .string(name),
                "description": .string(function["description"]?.stringValue ?? ""),
                "input_schema": function["parameters"] ?? .object(["type": .string("object")]),
            ])
        }
    }

    /// Thinking budget for one stored depth. Anthropic requires 1024 or more.
    private static func thinkingBudget(_ effort: String) -> Int {
        switch effort {
        case "low": 1024
        case "high": 4096
        default: 2048
        }
    }
}

/// Incremental SSE/JSON parser for one model step.
struct ModelStreamParser {
    let wire: AgentModelProtocol
    private(set) var text = ""
    private(set) var reasoning = ""
    /// Error the endpoint reported inside the stream, when it did.
    private(set) var failure: String?
    private(set) var usage = ModelUsage()
    private var partials: [Int: PartialToolCall] = [:]

    init(protocol wire: AgentModelProtocol) {
        self.wire = wire
    }

    /// Feed one decoded line.
    /// - Parameter line: one stream line, including its `data:` prefix.
    /// - Returns: whether the stream finished.
    mutating func ingest(_ line: String) -> Bool {
        guard line.hasPrefix("data:") else { return false }
        let payload = line.dropFirst(5).trimmingCharacters(in: .whitespaces)
        guard !payload.isEmpty else { return false }
        if payload == "[DONE]" {
            return true
        }
        guard let chunk = try? JSONDecoder().decode(JSONValue.self, from: Data(payload.utf8)) else {
            return false
        }
        switch wire {
        case .openai:
            return ingestOpenAI(chunk)
        case .anthropic:
            return ingestAnthropic(chunk)
        }
    }

    /// The step's settled answer.
    /// - Returns: text, reasoning, and any tool calls the stream completed.
    func answer() -> ModelAnswer {
        let calls = partials.keys.sorted().compactMap { index -> AgentToolCall? in
            guard let partial = partials[index], !partial.name.isEmpty else { return nil }
            let raw = partial.arguments.isEmpty ? "{}" : partial.arguments
            let arguments = (try? JSONDecoder().decode(JSONValue.self, from: Data(raw.utf8))) ?? .object([:])
            return AgentToolCall(
                id: partial.id.isEmpty ? "call_\(index)" : partial.id,
                name: partial.name,
                arguments: arguments
            )
        }
        return ModelAnswer(
            text: text,
            reasoning: reasoning.isEmpty ? nil : reasoning,
            toolCalls: calls.isEmpty ? nil : calls,
            usage: usage.isEmpty ? nil : usage
        )
    }

    private mutating func ingestOpenAI(_ chunk: JSONValue) -> Bool {
        if let value = chunk["usage"] {
            let delta = ModelWire.openAIUsage(value)
            if delta.inputTokens != nil {
                usage.inputTokens = delta.inputTokens
            }
            if delta.outputTokens != nil {
                usage.outputTokens = delta.outputTokens
            }
            if delta.cachedInputTokens != nil {
                usage.cachedInputTokens = delta.cachedInputTokens
            }
        }
        guard let choice = chunk["choices"]?.arrayValue?.first else { return false }
        let delta = choice["delta"] ?? choice["message"]
        if let piece = delta?["reasoning_content"]?.stringValue ?? delta?["reasoning"]?.stringValue,
           !piece.isEmpty
        {
            reasoning += piece
        }
        if let content = delta?["content"]?.stringValue, !content.isEmpty {
            text += content
        }
        for entry in delta?["tool_calls"]?.arrayValue ?? [] {
            let index = finiteInt(entry["index"]?.doubleValue)
            var partial = partials[index] ?? PartialToolCall()
            if let id = entry["id"]?.stringValue, !id.isEmpty {
                partial.id = id
            }
            if let name = entry["function"]?["name"]?.stringValue, !name.isEmpty {
                partial.name = name
            }
            if let arguments = entry["function"]?["arguments"]?.stringValue {
                partial.arguments += arguments
            }
            partials[index] = partial
        }
        return false
    }

    private mutating func ingestAnthropic(_ chunk: JSONValue) -> Bool {
        switch chunk["type"]?.stringValue {
        case "message_start":
            let value = chunk["message"]?["usage"]
            let delta = ModelWire.anthropicUsage(value)
            if delta.inputTokens != nil {
                usage.inputTokens = delta.inputTokens
            }
            if delta.cachedInputTokens != nil {
                usage.cachedInputTokens = delta.cachedInputTokens
            }
            if delta.cacheWriteTokens != nil {
                usage.cacheWriteTokens = delta.cacheWriteTokens
            }
            return false
        case "message_delta":
            let delta = ModelWire.anthropicUsage(chunk["usage"])
            if delta.outputTokens != nil {
                usage.outputTokens = delta.outputTokens
            }
            return false
        case "content_block_start":
            let index = finiteInt(chunk["index"]?.doubleValue)
            guard let block = chunk["content_block"], block["type"]?.stringValue == "tool_use" else {
                return false
            }
            var partial = partials[index] ?? PartialToolCall()
            partial.id = block["id"]?.stringValue ?? partial.id
            partial.name = block["name"]?.stringValue ?? partial.name
            partials[index] = partial
            return false
        case "content_block_delta":
            let index = finiteInt(chunk["index"]?.doubleValue)
            let delta = chunk["delta"]
            switch delta?["type"]?.stringValue {
            case "text_delta":
                text += delta?["text"]?.stringValue ?? ""
            case "thinking_delta":
                reasoning += delta?["thinking"]?.stringValue ?? ""
            case "input_json_delta":
                var partial = partials[index] ?? PartialToolCall()
                partial.arguments += delta?["partial_json"]?.stringValue ?? ""
                partials[index] = partial
            default:
                break
            }
            return false
        case "message_stop":
            return true
        case "error":
            failure = chunk["error"]?["message"]?.stringValue ?? "模型流返回错误"
            return true
        default:
            return false
        }
    }
}
