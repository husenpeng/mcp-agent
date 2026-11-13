//
//  ModelSettings.swift
//  Tomato Remote
//
//  The model the phone's own loop calls.
//
//  Configuration lives on the phone because the loop does: the runner has no
//  account, so the key travels with each task over loopback and stays in memory
//  there. Nothing here reaches the paired Mac.
//

import Foundation

/// Non-secret half of one provider configuration.
struct ModelSettings: Codable, Equatable, Sendable {
    var kind: PhoneProviderChoice.Kind = .openai
    var baseURL: String = "https://api.openai.com/v1"
    var model: String = "gpt-4.1-mini"
    var maxSteps: Int = 30

    /// Chainlink the UI shows for each supported provider.
    static let presets: [PhoneProviderChoice.Kind: (baseURL: String, model: String)] = [
        .openai: ("https://api.openai.com/v1", "gpt-4.1-mini"),
        .anthropic: ("https://api.anthropic.com", "claude-haiku-4-5"),
    ]
}

/// Persists the model settings and each provider's key.
enum ModelSettingsStore {
    private static let key = "phoneModelSettings"

    static func load() -> ModelSettings {
        guard let data = UserDefaults.standard.data(forKey: key),
              let settings = try? JSONDecoder().decode(ModelSettings.self, from: data)
        else { return ModelSettings() }
        return settings
    }

    /// @param settings - non-secret configuration to persist.
    static func save(_ settings: ModelSettings) {
        guard let data = try? JSONEncoder().encode(settings) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }

    private static func account(_ kind: PhoneProviderChoice.Kind) -> String {
        "model.\(kind.rawValue)"
    }

    /// Read one provider's key.
    /// @param kind - provider whose key to load.
    static func key(for kind: PhoneProviderChoice.Kind) -> String? {
        KeychainStore.secret(account: account(kind)).flatMap { String(data: $0, encoding: .utf8) }
    }

    /// Store one provider's key.
    /// @param key - secret as entered.
    /// @param kind - provider that owns it.
    static func setKey(_ key: String, for kind: PhoneProviderChoice.Kind) throws {
        try KeychainStore.saveSecret(Data(key.utf8), account: account(kind))
    }

    static func clearKey(for kind: PhoneProviderChoice.Kind) {
        KeychainStore.removeSecret(account: account(kind))
    }
}
