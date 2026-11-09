//
//  KeychainStore.swift
//  Tomato Remote
//
//  The paired Host lives in the Keychain: the authority, the signed session
//  cookie, and the device identity issued at pairing. Nothing here is stored
//  in UserDefaults, and nothing is ever logged.
//

import Foundation
import Security

/// Everything this app needs to talk to one paired Host again after a restart.
struct PairingProfile: Codable, Equatable, Sendable {
    /// Host root as entered, without a trailing slash, e.g. `https://tomato-hub.tail1234.ts.net`.
    var base: String
    /// Complete `name=value` cookie header value.
    var cookie: String
    /// Authority the cookie was minted for. The cookie binds to the request
    /// `Host`, so changing the hostname (tailnet name vs LAN IP) forces a
    /// re-pair.
    var authority: String?
    /// Bearer token the Watchdog accepts. Optional: a deployment that runs no
    /// Watchdog never issues one, and the desktop-status page then reads no
    /// health instead of failing.
    var watchdogToken: String?

    var url: URL? { URL(string: base) }
}

enum KeychainError: LocalizedError {
    case status(OSStatus)

    var errorDescription: String? {
        switch self {
        case let .status(status):
            return "钥匙串操作失败（\(status)）"
        }
    }
}

/// One generic-password item holding the pairing profile as JSON.
enum KeychainStore {
    private static let service = "ai.tomato.remote"
    private static let account = "pairing"

    private static var baseQuery: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }

    static func save(_ profile: PairingProfile) throws {
        let data = try JSONEncoder().encode(profile)
        var query = baseQuery
        let attributes: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ]
        let status = SecItemCopyMatching(query as CFDictionary, nil)
        if status == errSecSuccess {
            let updateStatus = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
            guard updateStatus == errSecSuccess else { throw KeychainError.status(updateStatus) }
            return
        }
        guard status == errSecItemNotFound else { throw KeychainError.status(status) }
        query.merge(attributes) { _, new in new }
        let addStatus = SecItemAdd(query as CFDictionary, nil)
        guard addStatus == errSecSuccess else { throw KeychainError.status(addStatus) }
    }

    static func load() -> PairingProfile? {
        var query = baseQuery
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        guard status == errSecSuccess,
              let data = item as? Data,
              let profile = try? JSONDecoder().decode(PairingProfile.self, from: data)
        else { return nil }
        return profile
    }

    static func clear() {
        let status = SecItemDelete(baseQuery as CFDictionary)
        if status != errSecSuccess && status != errSecItemNotFound {
            // A stale credential is worse than a noisy console, but a failed
            // delete must not abort unpairing; the Host side is reset next.
            print("keychain: delete failed with status \(status)")
        }
    }
}