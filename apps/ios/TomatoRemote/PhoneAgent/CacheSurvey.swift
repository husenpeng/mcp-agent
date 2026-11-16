//
//  CacheSurvey.swift
//  Tomato Remote
//
//  A DEBUG-only, key-safe cache survey. The app calls the configured endpoint
//  itself, so the credential never leaves the device; only token counters and
//  errors are written to Documents/cache-survey.json.
//

import Foundation
import UIKit

/// One protocol attempt for one model.
struct CacheSurveyAttempt: Codable {
    let protocolName: String
    let inputTokens: Int?
    let cachedTokens: Int?
    let cacheWriteTokens: Int?
    let error: String?
}

/// Both protocol attempts for one model.
struct CacheSurveyRow: Codable {
    let model: String
    let openAI: CacheSurveyAttempt
    let anthropic: CacheSurveyAttempt?
}

/// The complete survey file.
struct CacheSurveyDocument: Codable {
    let generatedAt: String
    let rows: [CacheSurveyRow]
}

/// Runs the cache survey inside the app so it can use the stored key.
enum CacheSurvey {
    private static let system = String(repeating: "你是 Tomato Phone 的缓存测试助手。请遵守固定格式回答，不要调用工具，也不要改变这段系统提示。", count: 40)
    private static let prompt = "只回答数字：1+1 等于几？"

    private static let tools: [JSONValue] = [
        .object([
            "type": .string("function"),
            "function": .object([
                "name": .string("echo"),
                "description": .string("返回输入文本。"),
                "parameters": .object([
                    "type": .string("object"),
                    "properties": .object(["text": .object(["type": .string("string")])]),
                    "required": .array([.string("text")]),
                ]),
            ]),
        ]),
        .object([
            "type": .string("function"),
            "function": .object([
                "name": .string("now"),
                "description": .string("返回固定时间，不访问网络。"),
                "parameters": .object(["type": .string("object"), "properties": .object([:])]),
            ]),
        ]),
    ]

    /// Models requested by `-TOMATO_CACHE_SURVEY <comma-separated ids>`.
    static var requestedModels: [String]? {
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: "-TOMATO_CACHE_SURVEY"), index + 1 < args.count else {
            return nil
        }
        let models = args[index + 1].split(separator: ",").map(String.init)
        return models.isEmpty ? nil : models
    }

    /// Run the survey and write each finished row to Documents.
    /// - Parameter models: model ids to test.
    static func run(models: [String]) async {
        await MainActor.run { UIApplication.shared.isIdleTimerDisabled = true }
        let config = AgentConfigStore.load()
        guard let key = AgentConfigStore.apiKey, !key.isEmpty else {
            write(CacheSurveyDocument(generatedAt: ISO8601DateFormatter().string(from: .now), rows: []))
            return
        }
        var rows: [CacheSurveyRow] = []
        for model in models {
            let openAI = await attempt(model: model, wire: .openai, baseURL: config.baseURL, key: key)
            var anthropic: CacheSurveyAttempt?
            if (openAI.cachedTokens ?? 0) == 0 {
                anthropic = await attempt(model: model, wire: .anthropic, baseURL: config.baseURL, key: key)
            }
            rows.append(CacheSurveyRow(model: model, openAI: openAI, anthropic: anthropic))
            write(CacheSurveyDocument(generatedAt: ISO8601DateFormatter().string(from: .now), rows: rows))
        }
    }

    private static func attempt(
        model: String,
        wire: AgentModelProtocol,
        baseURL: String,
        key: String
    ) async -> CacheSurveyAttempt {
        var messages: [JSONValue] = []
        var maxCached = 0
        var maxWrite = 0
        var lastInput: Int?
        var failure: String?
        for _ in 0 ..< 3 {
            messages.append(.object(["role": .string("user"), "content": .string(prompt)]))
            do {
                let answer = try await turn(
                    model: model,
                    wire: wire,
                    baseURL: baseURL,
                    key: key,
                    messages: messages
                )
                if let usage = answer.usage {
                    lastInput = usage.inputTokens
                    maxCached = max(maxCached, usage.cachedInputTokens ?? 0)
                    maxWrite = max(maxWrite, usage.cacheWriteTokens ?? 0)
                    if usage.cachedInputTokens == nil, usage.cacheWriteTokens == nil {
                        failure = "未上报缓存计数"
                    }
                } else {
                    failure = "未上报用量"
                }
                let text = answer.text.isEmpty ? "2" : answer.text
                messages.append(.object(["role": .string("assistant"), "content": .string(text)]))
            } catch {
                failure = error.localizedDescription
                break
            }
        }
        return CacheSurveyAttempt(
            protocolName: wire.rawValue,
            inputTokens: lastInput,
            cachedTokens: maxCached,
            cacheWriteTokens: maxWrite,
            error: failure
        )
    }

    private static func turn(
        model: String,
        wire: AgentModelProtocol,
        baseURL: String,
        key: String,
        messages: [JSONValue]
    ) async throws -> ModelAnswer {
        let request = try ModelWire.request(
            protocol: wire,
            baseURL: baseURL,
            model: model,
            key: key,
            system: system,
            messages: messages,
            tools: tools,
            reasoningEffort: nil,
            cache: wire == .anthropic ? ModelCachePolicy(anthropicCachesLastTurn: true) : .standard
        )
        let (bytes, response) = try await URLSession.shared.bytes(for: request)
        guard let http = response as? HTTPURLResponse, (200 ..< 300).contains(http.statusCode) else {
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            throw AgentError.transport("HTTP \(status)")
        }
        if http.value(forHTTPHeaderField: "Content-Type")?.contains("text/event-stream") == true {
            var parser = ModelWire.streamParser(protocol: wire)
            for try await line in bytes.lines {
                if parser.ingest(line) {
                    break
                }
            }
            if let failure = parser.failure {
                throw AgentError.transport(failure)
            }
            return parser.answer()
        }
        var data = Data()
        for try await byte in bytes {
            data.append(byte)
        }
        return try ModelWire.parseAnswer(protocol: wire, data: data)
    }

    private static func write(_ document: CacheSurveyDocument) {
        guard let folder = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return
        }
        let url = folder.appendingPathComponent("cache-survey.json")
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(document) else { return }
        try? data.write(to: url, options: .atomic)
    }
}
