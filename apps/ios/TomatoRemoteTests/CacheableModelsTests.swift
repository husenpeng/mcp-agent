//
//  CacheableModelsTests.swift
//  TomatoRemoteTests
//
//  The model picker's allow-list: only measured cacheable models, each with
//  the protocol that produced the hit.
//

@testable import TomatoRemote
import XCTest

final class CacheableModelsTests: XCTestCase {
    func testOnlyMeasuredModelsAreSelectable() {
        XCTAssertEqual(CacheableModels.all.count, 19)
        XCTAssertEqual(Set(CacheableModels.all.map(\.id)).count, 19)
        for unverified in [
            "DeepSeek-V4-Flash", "DeepSeek-V4-Flash-0731", "Doubao-Seed-2.1-pro",
            "MiniMax-M2.7", "gpt-5.4", "glm-5.3", "qwen3.6-plus", "gemini-3.5-flash",
        ] {
            XCTAssertNil(CacheableModels.entry(for: unverified), "\(unverified) should be filtered")
        }
    }

    func testMeasuredProtocolPerModel() {
        XCTAssertEqual(CacheableModels.entry(for: "DeepSeek-V4-Pro")?.wire, .openai)
        XCTAssertEqual(CacheableModels.entry(for: "DeepSeek-V4-Pro-0813")?.wire, .anthropic)
        XCTAssertEqual(CacheableModels.entry(for: "claude-opus-5")?.wire, .anthropic)
        XCTAssertEqual(CacheableModels.entry(for: "qwen3.8-max")?.wire, .openai)
    }

    func testNormalizingReplacesUnverifiedModelAndProtocol() {
        var config = AgentModelConfig()
        config.model = "Doubao-Seed-2.1-pro"
        config.api = .openai
        let normalized = CacheableModels.normalized(config)
        XCTAssertEqual(normalized.model, CacheableModels.defaultModel)
        XCTAssertEqual(normalized.api, .openai)

        var claude = config
        claude.model = "claude-opus-5"
        claude.api = .openai
        let claudeNormalized = CacheableModels.normalized(claude)
        XCTAssertEqual(claudeNormalized.model, "claude-opus-5")
        XCTAssertEqual(claudeNormalized.api, .anthropic)
    }
}
