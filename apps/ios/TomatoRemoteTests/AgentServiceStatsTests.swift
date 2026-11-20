//
//  AgentServiceStatsTests.swift
//  TomatoRemoteTests
//
//  The audit panel reads one session's event log. Its totals must add up the
//  service's per-step usage, count the tools the steps called, and never let a
//  partial cache hit display as a full one.
//

@testable import TomatoRemote
import XCTest

final class AgentServiceStatsTests: XCTestCase {
    /// One event as the service's log reports it.
    private func event(
        _ seq: Int,
        _ type: String,
        step: String? = nil,
        turn: String? = "turn-1",
        at: String? = nil,
        payload: [String: JSONValue]? = nil
    ) -> AgentServiceEventRecord {
        AgentServiceEventRecord(
            eventId: "e\(seq)",
            seq: seq,
            type: type,
            surface: nil,
            turnId: turn,
            stepId: step,
            payload: payload.map(JSONValue.object),
            createdAt: at
        )
    }

    /// Usage payload in the service's normalized field names.
    private func usage(prompt: Int, cached: Int, written: Int, output: Int) -> [String: JSONValue] {
        [
            "prompt_tokens": .number(Double(prompt)),
            "cached_tokens": .number(Double(cached)),
            "cache_creation_tokens": .number(Double(written)),
            "completion_tokens": .number(Double(output)),
            "estimated": .bool(false),
        ]
    }

    func testUsageBucketsAreDisjointAndTotalIncludesOutput() {
        let events = [
            event(1, "step/start", step: "s1"),
            event(2, "usage", step: "s1", payload: usage(prompt: 100_000, cached: 95_000, written: 0, output: 1_000)),
            event(3, "usage", step: "s1", payload: usage(prompt: 50_000, cached: 40_000, written: 1_000, output: 500)),
        ]

        let stats = AgentServiceStats.fold(events)

        // The second request reports a prompt of 50K whose 40K cache read and
        // 1K cache write are inside it, so its uncached share is 9K.
        XCTAssertEqual(stats.tokens.uncachedInput, 14_000)
        XCTAssertEqual(stats.tokens.cacheRead, 135_000)
        XCTAssertEqual(stats.tokens.cacheWrite, 1_000)
        XCTAssertEqual(stats.tokens.output, 1_500)
        XCTAssertEqual(stats.tokens.total, 151_500)
        XCTAssertEqual(stats.tokens.promptTokens, 150_000)
        XCTAssertEqual(stats.tokens.steps, 1)
        XCTAssertEqual(stats.turns, 1)
    }

    func testCacheHitPercentNeverRoundsAPartialHitToFull() {
        var stats = AgentServiceTokenStats()
        stats.uncachedInput = 135_661
        stats.cacheRead = 3_163_648
        stats.output = 10_817
        // 3163648 / 3299309 = 95.9%, one decimal kept while below 100.
        XCTAssertEqual(AgentServiceStats.cacheHitPercent(stats), "95.9")

        stats.uncachedInput = 1
        stats.cacheRead = 9_999
        XCTAssertEqual(AgentServiceStats.cacheHitPercent(stats), "99.9")

        stats.uncachedInput = 0
        XCTAssertEqual(AgentServiceStats.cacheHitPercent(stats), "100")

        XCTAssertNil(AgentServiceStats.cacheHitPercent(AgentServiceTokenStats()))
    }

    func testToolCallsFailuresAndWallTimeComeFromPairedEvents() {
        let events = [
            event(1, "tool/call", step: "s1", at: "2026-11-19T09:00:00Z", payload: ["tool_call_id": .string("c1"), "name": .string("web_search")]),
            event(2, "tool/call", step: "s1", at: "2026-11-19T09:00:01Z", payload: ["tool_call_id": .string("c2"), "name": .string("web_fetch")]),
            event(3, "tool/result", step: "s1", at: "2026-11-19T09:00:03Z", payload: ["tool_call_id": .string("c1"), "is_error": .bool(false), "content": .string("ok")]),
            event(4, "tool/result", step: "s1", at: "2026-11-19T09:00:05Z", payload: ["tool_call_id": .string("c2"), "is_error": .bool(true), "content": .string("boom")]),
            // A result whose call fell outside the window cannot be timed.
            event(5, "tool/result", step: "s1", at: "2026-11-19T09:00:06Z", payload: ["tool_call_id": .string("c9"), "is_error": .bool(false)]),
        ]

        let stats = AgentServiceStats.fold(events)

        XCTAssertEqual(stats.tools.calls, 2)
        XCTAssertEqual(stats.tools.failures, 1)
        // c1: 0s→3s, c2: 1s→5s; the unanswered call c9 adds nothing.
        XCTAssertEqual(stats.toolMs, 7_000)
    }

    func testRepeatedSequencesCountOnce() {
        let once = [
            event(1, "step/start", step: "s1"),
            event(2, "usage", step: "s1", payload: usage(prompt: 10, cached: 0, written: 0, output: 5)),
        ]

        XCTAssertEqual(AgentServiceStats.fold(once + once).tokens.total, 15)
    }

    func testTimingUsesStepStartFirstDeltaAndStepEnd() {
        let events = [
            event(1, "step/start", step: "s1", at: "2026-11-19T09:00:00.000Z"),
            event(2, "assistant/delta", step: "s1", at: "2026-11-19T09:00:00.800Z"),
            event(3, "assistant/message", step: "s1", at: "2026-11-19T09:00:02.800Z"),
            event(4, "usage", step: "s1", at: "2026-11-19T09:00:02.800Z", payload: usage(prompt: 100, cached: 50, written: 0, output: 400)),
        ]

        let stats = AgentServiceStats.fold(events)

        XCTAssertEqual(stats.llmMs, 2_800)
        XCTAssertEqual(stats.timing.averageTTFTMs, 800)
        XCTAssertEqual(stats.timing.tokensPerSecond, 200)
    }

    func testTurnsCountDistinctTurnIdsIncludingUserEvents() throws {
        let events = [
            event(1, "user/message", turn: "turn-1"),
            event(2, "step/start", step: "s1", turn: "turn-1"),
            event(3, "assistant/message", step: "s1", turn: "turn-1"),
            event(4, "user/message", turn: "turn-2"),
            event(5, "step/start", step: "s2", turn: "turn-2"),
        ]

        let stats = AgentServiceStats.fold(events)

        XCTAssertEqual(stats.turns, 2)
        XCTAssertEqual(stats.tokens.steps, 2)
    }
}