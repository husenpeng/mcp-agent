//
//  ModelProtocolTests.swift
//  TomatoRemoteTests
//
//  The two phone wire protocols: what each sends, and how each reply reads.
//

@testable import TomatoRemote
import XCTest

final class ModelProtocolTests: XCTestCase {
    private let openAITools: [JSONValue] = [
        .object([
            "type": .string("function"),
            "function": .object([
                "name": .string("web_search"),
                "description": .string("Search the web"),
                "parameters": .object([
                    "type": .string("object"),
                    "properties": .object(["query": .object(["type": .string("string")])]),
                    "required": .array([.string("query")]),
                ]),
            ]),
        ]),
    ]

    func testLegacyConfigurationDefaultsToOpenAI() throws {
        let legacy = Data(#"{"baseURL":"https://example.com/v1","model":"m","maxSteps":8}"#.utf8)
        let config = try JSONDecoder().decode(AgentModelConfig.self, from: legacy)
        XCTAssertEqual(config.wireProtocol, .openai)
        XCTAssertNil(config.api)
    }

    func testOpenAIRequestCarriesBearerAndItsOwnBody() throws {
        let request = try ModelWire.request(
            protocol: .openai,
            baseURL: "https://example.com/v1",
            model: "gpt-test",
            key: "sk-test",
            system: "be brief",
            messages: [.object(["role": .string("user"), "content": .string("hi")])],
            tools: openAITools,
            reasoningEffort: "low"
        )
        XCTAssertEqual(request.url?.absoluteString, "https://example.com/v1/chat/completions")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer sk-test")
        let body = try XCTUnwrap(JSONDecoder().decode(JSONValue.self, from: XCTUnwrap(request.httpBody)))
        XCTAssertEqual(body["model"]?.stringValue, "gpt-test")
        XCTAssertEqual(body["reasoning_effort"]?.stringValue, "low")
        XCTAssertEqual(body["messages"]?.arrayValue?.first?["role"]?.stringValue, "system")
        XCTAssertEqual(body["tools"]?.arrayValue?.count, 1)
        XCTAssertEqual(body["stream"]?.boolValue, true)
    }

    func testAnthropicRequestUsesItsHeadersAndJoinsV1Once() throws {
        let request = try ModelWire.request(
            protocol: .anthropic,
            baseURL: "https://api.anthropic.com/v1",
            model: "claude-test",
            key: "ak-test",
            system: "be brief",
            messages: [
                .object(["role": .string("user"), "content": .string("hi")]),
                .object([
                    "role": .string("assistant"),
                    "content": .string(""),
                    "tool_calls": .array([.object([
                        "id": .string("call-1"),
                        "type": .string("function"),
                        "function": .object(["name": .string("web_search"), "arguments": .string("{\"query\":\"x\"}")]),
                    ])]),
                ]),
                .object(["role": .string("tool"), "tool_call_id": .string("call-1"), "content": .string("result")]),
            ],
            tools: openAITools,
            reasoningEffort: "medium"
        )
        XCTAssertEqual(request.url?.absoluteString, "https://api.anthropic.com/v1/messages")
        XCTAssertEqual(request.value(forHTTPHeaderField: "x-api-key"), "ak-test")
        XCTAssertNil(request.value(forHTTPHeaderField: "Authorization"))
        XCTAssertEqual(request.value(forHTTPHeaderField: "anthropic-version"), "2023-06-01")
        let body = try XCTUnwrap(JSONDecoder().decode(JSONValue.self, from: XCTUnwrap(request.httpBody)))
        XCTAssertEqual(body["system"]?.arrayValue?.first?["text"]?.stringValue, "be brief")
        XCTAssertEqual(body["system"]?.arrayValue?.first?["cache_control"]?["type"]?.stringValue, "ephemeral")
        XCTAssertEqual(body["thinking"]?["budget_tokens"]?.doubleValue, 2048)
        XCTAssertEqual(body["tools"]?.arrayValue?.first?["input_schema"]?["type"]?.stringValue, "object")
        XCTAssertEqual(body["tools"]?.arrayValue?.last?["cache_control"]?["type"]?.stringValue, "ephemeral")
        let turns = body["messages"]?.arrayValue ?? []
        XCTAssertEqual(turns.count, 3)
        XCTAssertEqual(turns[0]["role"]?.stringValue, "user")
        XCTAssertEqual(turns[1]["role"]?.stringValue, "assistant")
        XCTAssertEqual(turns[1]["content"]?.arrayValue?.first?["type"]?.stringValue, "tool_use")
        // The tool result opens the next user turn, addressed to the call.
        XCTAssertEqual(turns[2]["role"]?.stringValue, "user")
        XCTAssertEqual(turns[2]["content"]?.arrayValue?.first?["type"]?.stringValue, "tool_result")
    }

    func testAnthropicKeepsToolResultsInOneUserTurn() throws {
        let body = try ModelWire.body(
            protocol: .anthropic,
            model: "claude-test",
            system: "",
            messages: [
                .object(["role": .string("user"), "content": .string("go")]),
                .object([
                    "role": .string("assistant"),
                    "content": .string(""),
                    "tool_calls": .array([
                        .object([
                            "id": .string("a"),
                            "type": .string("function"),
                            "function": .object(["name": .string("f"), "arguments": .string("{}")]),
                        ]),
                        .object([
                            "id": .string("b"),
                            "type": .string("function"),
                            "function": .object(["name": .string("g"), "arguments": .string("{}")]),
                        ]),
                    ]),
                ]),
                .object(["role": .string("tool"), "tool_call_id": .string("a"), "content": .string("one")]),
                .object(["role": .string("tool"), "tool_call_id": .string("b"), "content": .string("two")]),
            ],
            tools: [],
            reasoningEffort: nil
        )
        let turns = body["messages"]?.arrayValue ?? []
        XCTAssertEqual(turns.count, 3)
        XCTAssertEqual(turns[2]["content"]?.arrayValue?.count, 2)
        XCTAssertNil(body["thinking"])
        XCTAssertEqual(body["max_tokens"]?.doubleValue, 4096)
    }

    func testDeepSeekCacheHitTokensAreRead() throws {
        let answer = try ModelWire.parseAnswer(
            protocol: .openai,
            data: Data(
                #"{"choices":[{"message":{"content":"ok"}}],"usage":{"prompt_tokens":24000,"completion_tokens":80,"prompt_cache_hit_tokens":22000,"prompt_cache_miss_tokens":2000}}"#
                    .utf8
            )
        )
        XCTAssertEqual(answer.usage?.cachedInputTokens, 22000)
    }

    func testStreamsReportCacheUsage() {
        var openAI = ModelWire.streamParser(protocol: .openai)
        for line in [
            #"data: {"choices":[],"usage":{"prompt_tokens":120,"completion_tokens":8,"prompt_tokens_details":{"cached_tokens":100}}}"#,
            "data: [DONE]",
        ] {
            if openAI.ingest(line) {
                break
            }
        }
        XCTAssertEqual(openAI.answer().usage?.cachedInputTokens, 100)
        XCTAssertEqual(openAI.answer().usage?.outputTokens, 8)

        var anthropic = ModelWire.streamParser(protocol: .anthropic)
        for line in [
            #"data: {"type":"message_start","message":{"usage":{"input_tokens":120,"cache_read_input_tokens":100,"cache_creation_input_tokens":20}}}"#,
            #"data: {"type":"message_delta","usage":{"output_tokens":9}}"#,
            #"data: {"type":"message_stop"}"#,
        ] {
            if anthropic.ingest(line) {
                break
            }
        }
        XCTAssertEqual(anthropic.answer().usage?.cachedInputTokens, 100)
        XCTAssertEqual(anthropic.answer().usage?.cacheWriteTokens, 20)
        XCTAssertEqual(anthropic.answer().usage?.outputTokens, 9)
    }

    func testOpenAIStreamCollectsTextReasoningAndToolArguments() {
        var parser = ModelWire.streamParser(protocol: .openai)
        for line in [
            "data: {\"choices\":[{\"delta\":{\"reasoning_content\":\"think\"}}]}",
            "data: {\"choices\":[{\"delta\":{\"content\":\"hello\"}}]}",
            "data: {\"choices\":[{\"delta\":{\"tool_calls\":[{\"index\":0,\"id\":\"c1\",\"function\":{\"name\":\"web_search\",\"arguments\":\"{\\\"query\\\":\"}}]}}]}",
            "data: {\"choices\":[{\"delta\":{\"tool_calls\":[{\"index\":0,\"function\":{\"arguments\":\"\\\"x\\\"}\"}}]}}]}",
            "data: [DONE]",
        ] {
            if parser.ingest(line) {
                break
            }
        }
        let answer = parser.answer()
        XCTAssertEqual(answer.text, "hello")
        XCTAssertEqual(answer.reasoning, "think")
        XCTAssertEqual(answer.toolCalls?.first?.name, "web_search")
        XCTAssertEqual(answer.toolCalls?.first?.arguments["query"]?.stringValue, "x")
    }

    func testAnthropicStreamCollectsEventsAndToolInput() {
        var parser = ModelWire.streamParser(protocol: .anthropic)
        for line in [
            "data: {\"type\":\"content_block_start\",\"index\":0,\"content_block\":{\"type\":\"thinking\"}}",
            "data: {\"type\":\"content_block_delta\",\"index\":0,\"delta\":{\"type\":\"thinking_delta\",\"thinking\":\"plan\"}}",
            "data: {\"type\":\"content_block_start\",\"index\":1,\"content_block\":{\"type\":\"text\"}}",
            "data: {\"type\":\"content_block_delta\",\"index\":1,\"delta\":{\"type\":\"text_delta\",\"text\":\"hi\"}}",
            "data: {\"type\":\"content_block_start\",\"index\":2,\"content_block\":{\"type\":\"tool_use\",\"id\":\"t1\",\"name\":\"web_search\"}}",
            "data: {\"type\":\"content_block_delta\",\"index\":2,\"delta\":{\"type\":\"input_json_delta\",\"partial_json\":\"{\\\"query\\\":\\\"x\\\"}\"}}",
            "data: {\"type\":\"message_stop\"}",
        ] {
            if parser.ingest(line) {
                break
            }
        }
        let answer = parser.answer()
        XCTAssertEqual(answer.text, "hi")
        XCTAssertEqual(answer.reasoning, "plan")
        XCTAssertEqual(answer.toolCalls?.first?.id, "t1")
        XCTAssertEqual(answer.toolCalls?.first?.arguments["query"]?.stringValue, "x")
    }

    func testNonStreamingRepliesReadBothShapes() throws {
        let openAI = try ModelWire.parseAnswer(
            protocol: .openai,
            data: Data(#"{"choices":[{"message":{"content":"ok","tool_calls":[{"id":"c","function":{"name":"f","arguments":"{}"}}]}}]}"#
                .utf8)
        )
        XCTAssertEqual(openAI.text, "ok")
        XCTAssertEqual(openAI.toolCalls?.first?.name, "f")

        let anthropic = try ModelWire.parseAnswer(
            protocol: .anthropic,
            data: Data(
                #"{"content":[{"type":"thinking","thinking":"why"},{"type":"text","text":"ok"},{"type":"tool_use","id":"c","name":"f","input":{}}]}"#
                    .utf8
            )
        )
        XCTAssertEqual(anthropic.text, "ok")
        XCTAssertEqual(anthropic.reasoning, "why")
        XCTAssertEqual(anthropic.toolCalls?.first?.id, "c")
    }

    func testCachePolicyAddsAnthropicLastTurnBreakpointAndOpenAIKey() throws {
        let anthropic = try ModelWire.body(
            protocol: .anthropic,
            model: "claude-test",
            system: "stable",
            messages: [
                .object(["role": .string("user"), "content": .string("first")]),
                .object(["role": .string("assistant"), "content": .string("answer")]),
                .object(["role": .string("user"), "content": .string("second")]),
            ],
            tools: [],
            reasoningEffort: nil,
            cache: ModelCachePolicy(anthropicCachesLastTurn: true)
        )
        let lastTurn = anthropic["messages"]?.arrayValue?.last
        XCTAssertEqual(lastTurn?["content"]?.arrayValue?.last?["cache_control"]?["type"]?.stringValue, "ephemeral")

        let openAI = try ModelWire.body(
            protocol: .openai,
            model: "gpt-test",
            system: "stable",
            messages: [.object(["role": .string("user"), "content": .string("hi")])],
            tools: [],
            reasoningEffort: nil,
            cache: ModelCachePolicy(openAIPromptCacheKey: "conversation-1")
        )
        XCTAssertEqual(openAI["prompt_cache_key"]?.stringValue, "conversation-1")
    }

    func testModelListRequestAndParseFollowTheProtocol() {
        let openAI = ModelWire.modelListRequest(protocol: .openai, baseURL: "https://example.com/v1/", apiKey: "k")
        XCTAssertEqual(openAI?.url?.absoluteString, "https://example.com/v1/models")
        XCTAssertEqual(openAI?.value(forHTTPHeaderField: "Authorization"), "Bearer k")
        let anthropic = ModelWire.modelListRequest(protocol: .anthropic, baseURL: "https://api.anthropic.com", apiKey: "k")
        XCTAssertEqual(anthropic?.url?.absoluteString, "https://api.anthropic.com/v1/models")
        XCTAssertEqual(anthropic?.value(forHTTPHeaderField: "x-api-key"), "k")

        let body = Data(#"{"data":[{"id":"b"},{"id":"a"},{"id":"a"}]}"#.utf8)
        XCTAssertEqual(ModelWire.parseModelList(protocol: .openai, data: body), ["a", "b"])
        XCTAssertEqual(ModelWire.parseModelList(protocol: .anthropic, data: body), ["a", "b"])
    }
}
