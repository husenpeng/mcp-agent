//
//  AccountAuth.swift
//  Tomato Remote
//
//  The Feishu account session this phone obtained from the company BFF.
//
//  Pairing authenticates the device; the account session authenticates the
//  person. The BFF keeps the person in `session_id`, which its Feishu callback
//  writes as an HttpOnly cookie. This store keeps only that value in the
//  Keychain, presents it to the company search route as `session_id`, and adds
//  it to Host requests as `tomato_session` so the paired gateway can verify the
//  same auth_service session.
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

    /// Cookie header for the Host gateway, or nil when signed out.
    ///
    /// The gateway owns a cookie of a different name but the same auth_service
    /// session value, so a paired Host verifies the phone's account with it.
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
    ///   - sessionId: value of the BFF's `session_id` cookie.
    ///   - searchBaseURL: company origin the sign-in ran against.
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
