//
//  CacheableModels.swift
//  Tomato Remote
//
//  The models whose prompt cache was measured on the configured relay, and the
//  protocol that produced the hit. The model picker shows only this table, so
//  choosing a model also chooses its cache-capable protocol.
//

import Foundation

/// One measured cache-capable model.
struct CacheableModel: Identifiable, Hashable {
    let id: String
    let vendor: String
    let wire: AgentModelProtocol

    /// Menu wording with the vendor beside the model id.
    var title: String {
        "\(vendor) · \(id)"
    }
}

/// The shipped cacheable model table.
enum CacheableModels {
    /// OpenAI-compatible models measured with a cache hit.
    private static let openAI: [CacheableModel] = [
        CacheableModel(id: "DeepSeek-V4-Pro", vendor: "DeepSeek", wire: .openai),
        CacheableModel(id: "DeepSeek-V4.1-Flash-1017", vendor: "DeepSeek", wire: .openai),
        CacheableModel(id: "MiniMax-M3", vendor: "MiniMax", wire: .openai),
        CacheableModel(id: "MiniMax-M3.1-Flash", vendor: "MiniMax", wire: .openai),
        CacheableModel(id: "gpt-5.4-mini", vendor: "OpenAI", wire: .openai),
        CacheableModel(id: "gpt-5.5", vendor: "OpenAI", wire: .openai),
        CacheableModel(id: "kimi-k2.6", vendor: "Moonshot", wire: .openai),
        CacheableModel(id: "kimi-k3", vendor: "Moonshot", wire: .openai),
        CacheableModel(id: "kimi-k3.1-pro", vendor: "Moonshot", wire: .openai),
        CacheableModel(id: "qwen3.8-max", vendor: "Alibaba", wire: .openai),
    ]

    /// Models that only produced a cache hit through Anthropic Messages.
    private static let anthropic: [CacheableModel] = [
        CacheableModel(id: "DeepSeek-V4-Pro-0813", vendor: "DeepSeek", wire: .anthropic),
        CacheableModel(id: "DeepSeek-V4.1-Flash", vendor: "DeepSeek", wire: .anthropic),
        CacheableModel(id: "claude-opus-4-7", vendor: "Anthropic", wire: .anthropic),
        CacheableModel(id: "claude-opus-4-8", vendor: "Anthropic", wire: .anthropic),
        CacheableModel(id: "claude-opus-5", vendor: "Anthropic", wire: .anthropic),
        CacheableModel(id: "claude-opus-5-5", vendor: "Anthropic", wire: .anthropic),
        CacheableModel(id: "claude-sonnet-5", vendor: "Anthropic", wire: .anthropic),
        CacheableModel(id: "claude-sonnet-5-5", vendor: "Anthropic", wire: .anthropic),
        CacheableModel(id: "claude-haiku-5-5", vendor: "Anthropic", wire: .anthropic),
    ]

    /// Every selectable model, OpenAI-capable rows first.
    static let all: [CacheableModel] = openAI + anthropic

    /// Model used when a saved configuration names an unverified model.
    static let defaultModel = "DeepSeek-V4.1-Flash-1017"

    /// Look up one model's measured protocol.
    /// - Parameter model: model id from the stored configuration.
    /// - Returns: the measured entry, or nil for an unverified model.
    static func entry(for model: String) -> CacheableModel? {
        all.first { $0.id == model }
    }

    /// Force a configuration onto a verified model and its cache protocol.
    /// - Parameter config: configuration saved by an older build or the picker.
    /// - Returns: the config to use, and to persist when it changed.
    static func normalized(_ config: AgentModelConfig) -> AgentModelConfig {
        var next = config
        if let entry = entry(for: config.model) {
            next.api = entry.wire
            return next
        }
        let fallback = entry(for: defaultModel)
        next.model = fallback?.id ?? defaultModel
        next.api = fallback?.wire ?? .openai
        return next
    }
}
