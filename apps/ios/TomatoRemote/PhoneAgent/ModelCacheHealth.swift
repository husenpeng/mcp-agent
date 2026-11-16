//
//  ModelCacheHealth.swift
//  Tomato Remote
//
//  Watches the provider's prompt-cache counters across a conversation's steps
//  and names what changed when the cache stops helping.
//
//  The monitor only compares steps with the same stable prefix (protocol,
//  model, system prompt, tool declarations). A changed prefix, a small prompt,
//  or a provider that reports no cache counters is not a cache fault, so those
//  paths stay quiet or explain the limitation instead of claiming a failure.
//

import Foundation

/// What one observation says about the prompt cache.
enum ModelCacheVerdict: Equatable {
    /// A new prefix was recorded; there is no previous baseline to compare.
    case reset
    /// Too little input, or no cache counters yet.
    case unknown
    /// The provider reports tokens but no cache counters at all.
    case unsupported
    /// Anthropic wrote a cache entry this turn; a later turn may read it.
    case warming(written: Int)
    /// Input tokens came from the provider's prompt cache.
    case healthy(cached: Int)
    /// The same prefix that hit before now reports no cache read.
    case invalidated(previous: Int)
    /// Several turns with a stable prefix never read or wrote a cache entry.
    case ineffective(turns: Int)
}

/// One user-facing cache notice.
struct ModelCacheNotice: Identifiable, Equatable {
    enum Severity: Equatable {
        case info
        case warning
    }

    let id: String
    let title: String
    let detail: String
    let severity: Severity
    /// Whether this app already applied its repair for the notice.
    let repaired: Bool
}

/// Successive cache observations for one stable prompt prefix.
struct ModelCacheMonitor {
    /// Input below this says little about caching and would produce noise.
    /// Stable-prefix turns without any cache activity before reporting.
    private static let ineffectiveAfter = 3

    private var signature: String?
    private var lastCached = 0
    private var stableTurns = 0

    /// Record one model step and classify its cache behaviour.
    /// - Parameters:
    ///   - signature: digest of protocol, model, system prompt, and tools.
    ///   - usage: token counters the step reported, when it reported any.
    ///   - minimumInput: shortest prompt that can carry a provider cache entry.
    /// - Returns: the verdict used to decide whether to notify or repair.
    mutating func observe(
        signature next: String,
        usage: ModelUsage?,
        minimumInput: Int = 1000
    ) -> ModelCacheVerdict {
        let changed = signature != next
        if changed {
            signature = next
            lastCached = 0
            stableTurns = 0
        }
        guard let usage else { return changed ? .reset : .unknown }
        let hasCacheCounter = usage.cachedInputTokens != nil || usage.cacheWriteTokens != nil
        guard hasCacheCounter else { return changed ? .reset : .unsupported }
        let input = usage.inputTokens ?? 0
        guard input >= minimumInput else { return changed ? .reset : .unknown }

        let cached = usage.cachedInputTokens ?? 0
        let written = usage.cacheWriteTokens ?? 0
        if cached > 0 {
            lastCached = cached
            stableTurns = 1
            return changed ? .reset : .healthy(cached: cached)
        }
        stableTurns += 1
        if lastCached > 0 {
            let previous = lastCached
            lastCached = 0
            stableTurns = 1
            return .invalidated(previous: previous)
        }
        if written > 0 {
            return changed ? .reset : .warming(written: written)
        }
        if stableTurns >= Self.ineffectiveAfter {
            return .ineffective(turns: stableTurns)
        }
        return changed ? .reset : .unknown
    }
}

/// The client-side repair available for a cache anomaly.
enum ModelCacheRepair {
    /// Apply the protocol's cache controls and describe the change.
    /// - Parameters:
    ///   - wire: protocol the conversation speaks.
    ///   - baseURL: endpoint root.
    ///   - policy: controls the next request uses; mutated in place.
    ///   - conversationId: stable identity for OpenAI's routing key.
    /// - Returns: what changed, for the notice.
    static func apply(
        wire: AgentModelProtocol,
        baseURL: String,
        policy: inout ModelCachePolicy,
        conversationId: String
    ) -> String {
        switch wire {
        case .anthropic:
            policy.anthropicCachesLastTurn = true
            return "已自动为下一轮补上最后一轮对话的缓存断点，并保留系统与工具断点。"
        case .openai:
            if URL(string: baseURL)?.host == "api.openai.com" {
                policy.openAIPromptCacheKey = "tomato-\(conversationId)"
                return "已自动启用 prompt_cache_key，让同一对话固定命中同一缓存。"
            }
            return "已保持系统提示与工具前缀稳定；这个端点由服务端自动缓存，若仍为 0 说明上游未启用或未回报。"
        }
    }
}
