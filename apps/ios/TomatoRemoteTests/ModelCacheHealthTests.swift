//
//  ModelCacheHealthTests.swift
//  TomatoRemoteTests
//
//  The prompt-cache monitor: when a stable prefix starts missing, when a
//  provider never reports cache counters, and when there is not enough context
//  to judge either way.
//

@testable import TomatoRemote
import XCTest

final class ModelCacheHealthTests: XCTestCase {
    private func usage(input: Int = 5000, cached: Int? = nil, write: Int? = nil) -> ModelUsage {
        ModelUsage(inputTokens: input, outputTokens: 10, cachedInputTokens: cached, cacheWriteTokens: write)
    }

    func testHealthyThenInvalidatedForTheSamePrefix() {
        var monitor = ModelCacheMonitor()
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 2400)), .reset)
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 2400)), .healthy(cached: 2400))
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 0)), .invalidated(previous: 2400))
        // The invalidation is reported once, not on every following miss.
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 0)), .unknown)
    }

    func testIneffectiveAfterThreeStableMisses() {
        var monitor = ModelCacheMonitor()
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 0)), .reset)
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 0)), .unknown)
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 0)), .ineffective(turns: 3))
    }

    func testUnsupportedWhenTheProviderReportsNoCacheCounters() {
        var monitor = ModelCacheMonitor()
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: nil, write: nil)), .reset)
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: nil, write: nil)), .unsupported)
    }

    func testWarmingAfterACacheWrite() {
        var monitor = ModelCacheMonitor()
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 0, write: 1800)), .reset)
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 0, write: 1800)), .warming(written: 1800))
    }

    func testShortOrMissingUsageStaysQuiet() {
        var monitor = ModelCacheMonitor()
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(input: 400, cached: 0)), .reset)
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(input: 400, cached: 0)), .unknown)
        XCTAssertEqual(monitor.observe(signature: "a", usage: nil), .unknown)
    }

    func testRepairAddsAnthropicLastTurnBreakpoint() {
        var policy = ModelCachePolicy.standard
        let text = ModelCacheRepair.apply(
            wire: .anthropic, baseURL: "https://api.anthropic.com", policy: &policy, conversationId: "c"
        )
        XCTAssertTrue(policy.anthropicCachesLastTurn)
        XCTAssertTrue(text.contains("缓存断点"))
    }

    func testRepairAddsOpenAIKeyOnlyForTheOfficialEndpoint() {
        var official = ModelCachePolicy.standard
        _ = ModelCacheRepair.apply(
            wire: .openai, baseURL: "https://api.openai.com/v1", policy: &official, conversationId: "conv-1"
        )
        XCTAssertEqual(official.openAIPromptCacheKey, "tomato-conv-1")

        var relay = ModelCachePolicy.standard
        _ = ModelCacheRepair.apply(
            wire: .openai, baseURL: "https://relay.example/v1", policy: &relay, conversationId: "conv-1"
        )
        XCTAssertNil(relay.openAIPromptCacheKey)
    }

    func testNewPrefixResetsTheBaseline() {
        var monitor = ModelCacheMonitor()
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 3000)), .reset)
        XCTAssertEqual(monitor.observe(signature: "a", usage: usage(cached: 3000)), .healthy(cached: 3000))
        XCTAssertEqual(monitor.observe(signature: "b", usage: usage(cached: 0)), .reset)
    }
}
