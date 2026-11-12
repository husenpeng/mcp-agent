//
//  AccountAuth.swift
//  Tomato Remote
//
//  The Host gateway account session this phone obtained by Feishu sign-in.
//
//  Pairing authenticates the device; the account session authenticates the
//  person. The gateway keeps the person in `tomato_session`, which the sign-in
//  page writes as an HttpOnly cookie. This store keeps only that value in the
//  Keychain and appends it to every Host request beside the pairing cookie, so
//  the account screen and the phone's web tools can act as the signed-in person.
//

import Foundation

/// The signed-in Host account, persisted across launches.
@MainActor
final class AccountAuthStore: ObservableObject {
    static let shared = AccountAuthStore()

    @Published private(set) var sessionId: String?
    /// Company gateway origin captured from the sign-in redirect. Web searches
    /// use it with the session id, matching the desktop provider.
    @Published private(set) var searchBaseURL: String?

    private static let key = "account.auth"
    private static let keychainAccount = "account.session"
    private static let debugKey = "account.auth.debug"

    private struct Record: Codable {
        var sessionId: String
        var searchBaseURL: String?
    }

    private init() {
        load()
    }

    /// Cookie header for the gateway account session, or nil when signed out.
    var accountCookie: String? {
        guard let sessionId, !sessionId.isEmpty else { return nil }
        return "tomato_session=\(sessionId)"
    }

    /// Whether this phone holds its own signed-in session.
    var isSignedIn: Bool {
        accountCookie != nil
    }

    /// Gateway origin and session for company web search, or nil when either is
    /// missing.
    var searchContext: (base: URL, sessionId: String)? {
        guard let sessionId,
              !sessionId.isEmpty,
              let searchBaseURL,
              let base = URL(string: searchBaseURL)
        else { return nil }
        return (base, sessionId)
    }

    /// Record one completed sign-in.
    /// - Parameters:
    ///   - sessionId: value of the gateway's `tomato_session` cookie.
    ///   - searchBaseURL: company origin the sign-in passed through, when seen.
    func save(sessionId: String, searchBaseURL: String?) {
        let clean = sessionId.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !clean.isEmpty else { return }
        self.sessionId = clean
        if let searchBaseURL, let url = URL(string: searchBaseURL), url.host != nil {
            self.searchBaseURL = url.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        }
        persist()
    }

    /// Add the company origin once the sign-in redirect reveals it.
    /// - Parameter origin: scheme and host of the company BFF.
    func recordSearchBase(_ origin: String) {
        guard let url = URL(string: origin), url.host != nil else { return }
        searchBaseURL = url.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        persist()
    }

    /// Forget the phone's account session. The pairing cookie stays.
    func clear() {
        sessionId = nil
        searchBaseURL = nil
        KeychainStore.removeSecret(account: Self.keychainAccount)
        UserDefaults.standard.removeObject(forKey: Self.debugKey)
    }

    private func load() {
        #if DEBUG
            // A simulator keychain can keep an older record after the debug
            // fallback was rewritten; the fallback is the copy this process
            // last saved.
            let data = UserDefaults.standard.data(forKey: Self.debugKey)
                ?? KeychainStore.secret(account: Self.keychainAccount)
        #else
            let data = KeychainStore.secret(account: Self.keychainAccount)
        #endif
        guard let data, let record = try? JSONDecoder().decode(Record.self, from: data) else { return }
        sessionId = record.sessionId
        searchBaseURL = record.searchBaseURL
    }

    private func persist() {
        guard let sessionId else { return }
        let record = Record(sessionId: sessionId, searchBaseURL: searchBaseURL)
        guard let data = try? JSONEncoder().encode(record) else { return }
        #if DEBUG
            // Mirror every save for the simulator, whose keychain entitlement
            // is absent and whose old record may still resolve without it.
            UserDefaults.standard.set(data, forKey: Self.debugKey)
        #endif
        do {
            try KeychainStore.saveSecret(data, account: Self.keychainAccount)
        } catch {
            AppLog.error(.app, "账号会话写入钥匙串失败", detail: error.localizedDescription)
        }
    }
}
