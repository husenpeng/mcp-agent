//
//  AgentServiceStats.swift
//  Tomato Remote
//
//  Session statistics folded from one service session's event log: the usage
//  the service records per step, the tools the steps called, and the timing it
//  stamps on each lifecycle event. Reading the log directly means the panel
//  shows the conversation on screen, never a neighbour's turns.
//

import Foundation

/// Token usage one session's events add up to.
struct AgentServiceTokenStats: Equatable {
    /// Prompt tokens the provider billed without a cache hit.
    var uncachedInput = 0
    /// Prompt tokens served from the provider's cache.
    var cacheRead = 0
    /// Prompt tokens written into that cache.
    var cacheWrite = 0
    /// Completion tokens, which already include reasoning tokens.
    var output = 0
    /// Model steps the session ran.
    var steps = 0

    /// Every token the session consumed, prompt and completion.
    var total: Int {
        uncachedInput + cacheRead + cacheWrite + output
    }

    /// Prompt-sized input over the session; the denominator for a cache hit.
    var promptTokens: Int {
        uncachedInput + cacheRead + cacheWrite
    }
}

/// Tool calls one session made.
struct AgentServiceToolStats: Equatable {
    /// Calls the service logged.
    var calls = 0
    /// Calls that ended in an error result.
    var failures = 0
}

/// Wall-clock figures the service's event timestamps give up.
struct AgentServiceTimingStats: Equatable {
    /// Summed first-token latency and how many steps reported one.
    var ttftTotalMs = 0
    var ttftSteps = 0
    /// Summed decode time and output tokens over the steps that reported both.
    var decodeMs = 0
    var decodeTokens = 0

    /// Average time to the first token, or nil when no step reported one.
    var averageTTFTMs: Int? {
        ttftSteps == 0 ? nil : ttftTotalMs / ttftSteps
    }

    /// Decoded tokens per second, or nil without a measured decode window.
    var tokensPerSecond: Double? {
        guard decodeMs > 0, decodeTokens > 0 else { return nil }
        return Double(decodeTokens) * 1_000 / Double(decodeMs)
    }
}

/// Everything the session-statistics panel shows.
struct AgentServiceSessionStats: Equatable {
    var turns = 0
    var tokens = AgentServiceTokenStats()
    var tools = AgentServiceToolStats()
    /// Summed model time and tool time, both read from event timestamps.
    var llmMs = 0
    var toolMs = 0
    var timing = AgentServiceTimingStats()
}

/// Folds one session's events into the panel's figures.
enum AgentServiceStats {
    /// Cache-hit share of prompt-side input, in tenths of a percent.
    ///
    /// A partial hit never displays as a full one: when rounding would reach
    /// 100, the text stays just under it.
    /// - Parameter stats: the session's token totals.
    /// - Returns: `96`, `99.9`, or nil when the session billed no prompt input.
    static func cacheHitPercent(_ stats: AgentServiceTokenStats) -> String? {
        let prompt = stats.promptTokens
        guard prompt > 0 else { return nil }
        guard stats.cacheRead < prompt else { return "100" }
        let tenths = (stats.cacheRead * 1_000 + prompt / 2) / prompt
        let whole = tenths / 10
        let fraction = tenths % 10
        let rounded = fraction == 0 ? "\(whole)" : "\(whole).\(fraction)"
        guard whole == 100 else { return rounded }
        let gapTenths = ((prompt - stats.cacheRead) * 1_000 + prompt - 1) / prompt
        return gapTenths > 1 ? rounded : "99.9"
    }

    /// Fold a session's whole event log.
    ///
    /// A repeated sequence number is counted once, so paging the same window
    /// twice cannot inflate the totals.
    /// - Parameter events: the session's events, in any order.
    /// - Returns: the panel's figures.
    static func fold(_ events: [AgentServiceEventRecord]) -> AgentServiceSessionStats {
        var seen = Set<Int>()
        let unique = events
            .filter { seen.insert($0.seq).inserted }
            .sorted { $0.seq < $1.seq }
        var stats = AgentServiceSessionStats()
        var turns = Set<String>()
        var stepStart: [String: Date] = [:]
        var firstDelta: [String: Date] = [:]
        var assistantAt: [String: Date] = [:]
        var toolCalls: [String: Date] = [:]
        for event in unique {
            if let turnId = event.turnId, !turnId.isEmpty, event.type != "tool/result" {
                turns.insert(turnId)
            }
            let at = event.createdAt.map(AgentServiceDate.parse)
            switch event.type {
            case "step/start":
                stats.tokens.steps += 1
                if let at, let step = event.stepId {
                    stepStart[step] = at
                }
            case "assistant/message":
                if let at, let step = event.stepId {
                    assistantAt[step] = at
                }
            case "assistant/delta":
                if let at, let step = event.stepId, firstDelta[step] == nil {
                    firstDelta[step] = at
                }
            case "usage":
                guard let usage = buckets(event.payload) else { break }
                stats.tokens.uncachedInput += usage.uncached
                stats.tokens.cacheRead += usage.cacheRead
                stats.tokens.cacheWrite += usage.cacheWrite
                stats.tokens.output += usage.output
                if let step = event.stepId, let start = stepStart[step] {
                    let end = assistantAt[step] ?? at
                    if let end {
                        stats.llmMs += milliseconds(from: start, to: end)
                    }
                    let first = firstDelta[step] ?? start
                    let ttft = milliseconds(from: start, to: first)
                    stats.timing.ttftTotalMs += ttft
                    stats.timing.ttftSteps += 1
                    if let end {
                        let decode = milliseconds(from: first, to: end)
                        stats.timing.decodeMs += decode
                        stats.timing.decodeTokens += usage.output
                    }
                }
            case "tool/call":
                stats.tools.calls += 1
                if let at {
                    toolCalls[event.payload?["tool_call_id"]?.stringValue ?? "seq:\(event.seq)"] = at
                }
            case "tool/result":
                let failed = event.payload?["is_error"]?.boolValue == true
                if failed {
                    stats.tools.failures += 1
                }
                if let at,
                   let id = event.payload?["tool_call_id"]?.stringValue,
                   let started = toolCalls[id]
                {
                    stats.toolMs += milliseconds(from: started, to: at)
                }
            default:
                break
            }
        }
        stats.turns = turns.count
        return stats
    }

    /// Token buckets one `usage` event carries.
    /// - Parameter payload: the event's payload.
    /// - Returns: bucket counts, or nil when the event reports none.
    private static func buckets(
        _ payload: JSONValue?
    ) -> (uncached: Int, cacheRead: Int, cacheWrite: Int, output: Int)? {
        guard let payload else { return nil }
        let prompt = count(payload["prompt_tokens"])
        let cacheRead = count(payload["cached_tokens"])
        let cacheWrite = count(payload["cache_creation_tokens"])
        let output = count(payload["completion_tokens"])
        guard prompt + cacheRead + cacheWrite + output > 0 else { return nil }
        return (max(0, prompt - cacheRead - cacheWrite), cacheRead, cacheWrite, output)
    }

    /// Non-negative integer a payload field carries.
    /// - Parameter value: JSON value from an event payload.
    /// - Returns: the count, or 0 when the field is absent or not a number.
    private static func count(_ value: JSONValue?) -> Int {
        guard let double = value?.doubleValue, double.isFinite, double > 0 else { return 0 }
        return Int(double.rounded(.down))
    }

    /// Whole milliseconds between two stamps.
    /// - Parameters:
    ///   - start: earlier stamp.
    ///   - end: later stamp.
    /// - Returns: the gap, never negative.
    private static func milliseconds(from start: Date, to end: Date) -> Int {
        max(0, Int((end.timeIntervalSince(start) * 1_000).rounded()))
    }
}