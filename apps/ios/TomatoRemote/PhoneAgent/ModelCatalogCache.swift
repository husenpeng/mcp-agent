//
//  ModelCatalogCache.swift
//  Tomato Remote
//
//  The model list each protocol and endpoint last returned.
//
//  A model catalog read is expensive enough to keep across launches and
//  cheap enough to expire: the sheet reuses a recent list, shows a stored one
//  when the endpoint is unreachable, and never writes the credential down.
//  Entries are separated by protocol, endpoint, and a fingerprint of the key,
//  so switching any of the three misses instead of showing another service's
//  models.
//

import CryptoKit
import Foundation

/// One persisted model-list read.
struct ModelCatalogCacheEntry: Codable, Equatable {
    /// Protocol the list came from.
    let wireProtocol: String
    /// Endpoint root the list came from.
    let baseURL: String
    /// Digest of the credential used; never the credential itself.
    let keyFingerprint: String
    /// Ids the endpoint advertised.
    let models: [String]
    /// When the read finished.
    let fetchedAt: Date
}

/// Persists one model list per protocol, endpoint, and credential.
struct ModelCatalogCache {
    static let shared = ModelCatalogCache()

    /// Storage key for the bounded entry table.
    private static let storageKey = "phoneModelCatalogCache.v1"
    /// Most services kept before the oldest read is dropped.
    private static let limit = 8
    /// How long the sheet reuses a read without asking again.
    static let freshFor: TimeInterval = 300
    /// Age after which an entry is only an offline fallback.
    static let staleAfter: TimeInterval = 24 * 60 * 60

    private let defaults: UserDefaults

    /// - Parameter defaults - store to read and write; tests pass a suite.
    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
    }

    /// Stable entry key; the raw credential never reaches storage.
    /// - Parameters:
    ///   - protocol: wire protocol the list belongs to.
    ///   - baseURL: endpoint root.
    ///   - apiKey: credential used for the read.
    /// - Returns: a hex SHA-256 digest.
    static func fingerprint(protocol wire: AgentModelProtocol, baseURL: String, apiKey: String) -> String {
        let material = "\(wire.rawValue)|\(normalized(baseURL))|\(apiKey)"
        return SHA256.hash(data: Data(material.utf8))
            .map { String(format: "%02x", $0) }
            .joined()
    }

    /// Read the stored list for one endpoint when it is still useful.
    /// - Parameters:
    ///   - protocol: wire protocol the caller is about to speak.
    ///   - baseURL: endpoint root.
    ///   - apiKey: credential the caller holds.
    ///   - now: clock, injectable for tests.
    /// - Returns: the entry when present and younger than `staleAfter`.
    func entry(
        protocol wire: AgentModelProtocol,
        baseURL: String,
        apiKey: String,
        now: Date = .now
    ) -> ModelCatalogCacheEntry? {
        let key = Self.fingerprint(protocol: wire, baseURL: baseURL, apiKey: apiKey)
        guard let entry = load()[key],
              now.timeIntervalSince(entry.fetchedAt) < Self.staleAfter
        else { return nil }
        return entry
    }

    /// Store one successful read, dropping the oldest entry beyond the limit.
    /// - Parameters:
    ///   - protocol: wire protocol that produced the list.
    ///   - baseURL: endpoint root.
    ///   - apiKey: credential used for the read.
    ///   - models: ids the endpoint advertised.
    ///   - date: completion time, injectable for tests.
    func store(
        protocol wire: AgentModelProtocol,
        baseURL: String,
        apiKey: String,
        models: [String],
        at date: Date = .now
    ) {
        let key = Self.fingerprint(protocol: wire, baseURL: baseURL, apiKey: apiKey)
        var entries = load()
        entries[key] = ModelCatalogCacheEntry(
            wireProtocol: wire.rawValue,
            baseURL: Self.normalized(baseURL),
            keyFingerprint: key,
            models: models,
            fetchedAt: date
        )
        if entries.count > Self.limit {
            let oldest = entries.sorted { $0.value.fetchedAt < $1.value.fetchedAt }
                .prefix(entries.count - Self.limit)
                .map(\.key)
            for key in oldest {
                entries.removeValue(forKey: key)
            }
        }
        save(entries)
    }

    /// Drop every stored list.
    func clear() {
        defaults.removeObject(forKey: Self.storageKey)
    }

    /// Trim a root to the form the fingerprint and the entry store.
    /// - Parameter base: endpoint root as typed.
    /// - Returns: the root without surrounding spaces or trailing slashes.
    static func normalized(_ base: String) -> String {
        base.trimmingCharacters(in: CharacterSet(charactersIn: "/ "))
    }

    private func load() -> [String: ModelCatalogCacheEntry] {
        guard let data = defaults.data(forKey: Self.storageKey),
              let entries = try? JSONDecoder().decode([String: ModelCatalogCacheEntry].self, from: data)
        else { return [:] }
        return entries
    }

    private func save(_ entries: [String: ModelCatalogCacheEntry]) {
        guard let data = try? JSONEncoder().encode(entries) else { return }
        defaults.set(data, forKey: Self.storageKey)
    }
}
