//
//  App.swift
//  Tomato Remote
//
//  Entry point and the app-wide model. The model owns the pairing phase and
//  the Session list; per-Session conversation state lives in `ChatModel`.
//

import SwiftUI

@main
struct TomatoRemoteApp: App {
    @StateObject private var model = AppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(model)
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var model: AppModel
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var lock = BiometricLock()

    var body: some View {
        Group {
            switch model.phase {
            case .pairing:
                PairingFlow()
            case .ready:
                VStack(spacing: 0) {
                    if lock.unavailable {
                        NoticeBar(text: "此设备没有面容 ID、触控 ID 或密码，配对后的钥匙没有任何本地保护。")
                    }
                    MainTabs()
                }
            }
        }
        .tint(TomatoToken.brandPrimary)
        .overlay {
            if model.phase == .ready && !lock.unlocked {
                LockedCover(failure: lock.failure) { Task { await lock.unlock() } }
            }
        }
        // `.inactive` also fires while the system's own biometric sheet is up, so
        // only leaving the foreground drops the gate.
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .background: lock.lock()
            case .active: Task { await unlockIfPaired() }
            default: break
            }
        }
        .task { await unlockIfPaired() }
        .onOpenURL { url in model.handle(url) }
    }

    private func unlockIfPaired() async {
        guard model.phase == .ready else { return }
        await lock.unlock()
    }
}

/// Three destinations; a Session's conversation is pushed from the list.
struct MainTabs: View {
    var body: some View {
        TabView {
            SessionListView()
                .tabItem { Label("会话", systemImage: "bubble.left.and.bubble.right") }
            AccountView()
                .tabItem { Label("账号", systemImage: "person.crop.circle") }
            DesktopStatusView()
                .tabItem { Label("桌面", systemImage: "desktopcomputer") }
        }
    }
}

/// Renders any thrown error the way every screen should.
func describe(_ error: Error) -> String {
    if let localized = error as? LocalizedError, let description = localized.errorDescription {
        return description
    }
    return error.localizedDescription
}

@MainActor
final class AppModel: ObservableObject {
    enum Phase: Equatable {
        case pairing
        case ready
    }

    @Published private(set) var phase: Phase
    @Published private(set) var profile: PairingProfile?

    @Published var sessions: [SessionSummary] = []
    @Published var sessionsError: String?
    @Published var isLoadingSessions = false
    @Published var isCreatingSession = false

    /// Session a `tomato://session/<id>` link asked to open, consumed by the list
    /// once it can resolve the row.
    @Published var pendingSessionId: String?

    init() {
        if let stored = KeychainStore.load(), stored.url != nil {
            profile = stored
            phase = .ready
        } else {
            profile = nil
            phase = .pairing
        }
    }

    /// Route one incoming deep link.
    ///
    /// Only `session` is accepted for now; an unrecognised host or a malformed
    /// path is reported rather than ignored, because a notification that leads
    /// nowhere is indistinguishable from a broken app.
    /// @param url - the URL the system handed the application.
    func handle(_ url: URL) {
        guard url.scheme == "tomato" else { return }
        // `tomato://session/<id>` puts `session` in the host position.
        let segments = [url.host].compactMap { $0 } + url.pathComponents.filter { $0 != "/" }
        guard segments.first == "session", segments.count >= 2 else {
            sessionsError = "无法识别的链接：\(url.absoluteString)"
            return
        }
        pendingSessionId = segments[1]
    }

    /// Acknowledge one consumed deep link so the list does not reopen it.
    func clearPendingSession() {
        pendingSessionId = nil
    }

    /// Client bound to the paired Host, or `nil` before pairing.
    var hub: HubClient? {
        guard let profile, let url = profile.url else { return nil }
        return HubClient(base: url, cookie: profile.cookie, watchdogToken: profile.watchdogToken)
    }

    var hostLabel: String {
        profile?.base ?? "未配对"
    }

    // MARK: Pairing

    /// Exchange a launch token for the persistent cookie and become ready.
    ///
    /// A host typed without a scheme gets `https://`, while a tailnet deployment
    /// serves plain HTTP until its certificate is issued, so both schemes are
    /// tried before the attempt is called a failure. The cookie's authority is the
    /// host either way, so a retry costs nothing but one round trip.
    /// @param base - host root the user supplied.
    /// @param token - the launch token from the printed URL.
    func pair(base: URL, token: String) async throws {
        var lastError: Error?
        for candidate in Self.pairCandidates(base) {
            do {
                let cookie = try await HubClient.connect(base: candidate, token: token)
                let stored = PairingProfile(
                    base: candidate.absoluteString,
                    cookie: cookie,
                    authority: candidate.host
                )
                try KeychainStore.save(stored)
                profile = stored
                phase = .ready
                await refreshSessions()
                return
            } catch {
                lastError = error
            }
        }
        throw lastError ?? HubError.invalidBaseURL
    }

    /// The base plus the same host under the other HTTP scheme.
    /// @param base - the requested host root.
    /// @returns one or two candidates, the requested one first.
    private static func pairCandidates(_ base: URL) -> [URL] {
        var alternate = URLComponents(url: base, resolvingAgainstBaseURL: false)
        alternate?.scheme = base.scheme == "https" ? "http" : "https"
        guard let other = alternate?.url, other != base else { return [base] }
        return [base, other]
    }

    func unpair() {
        KeychainStore.clear()
        profile = nil
        sessions = []
        sessionsError = nil
        phase = .pairing
    }

    /// Attach or replace the Watchdog bearer token on the stored pairing.
    ///
    /// The Watchdog runs outside the Host and issues its own credential, so the
    /// session cookie cannot reach it. A deployment that runs no Watchdog leaves
    /// this unset.
    /// @param token - the value printed at `~/.tomato-watchdog/token`, or an empty string to clear it.
    func setWatchdogToken(_ token: String) throws {
        guard var stored = profile else { return }
        let trimmed = token.trimmingCharacters(in: .whitespacesAndNewlines)
        stored.watchdogToken = trimmed.isEmpty ? nil : trimmed
        try KeychainStore.save(stored)
        profile = stored
    }

    // MARK: Sessions

    func refreshSessions() async {
        guard let hub else { return }
        isLoadingSessions = true
        defer { isLoadingSessions = false }
        do {
            let items = try await hub.listSessions()
            sessions = items.sorted { $0.updatedAt > $1.updatedAt }
            sessionsError = nil
        } catch {
            sessionsError = describe(error)
        }
    }

    /// Creates a Session and returns its identity, or reports why it failed.
    func createSession() async -> String? {
        guard let hub else { return nil }
        isCreatingSession = true
        defer { isCreatingSession = false }
        do {
            let created = try await hub.createSession()
            await refreshSessions()
            return created.sessionId
        } catch {
            sessionsError = describe(error)
            return nil
        }
    }

    func rename(_ summary: SessionSummary, to title: String) async {
        guard let hub else { return }
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        do {
            try await hub.renameSession(sessionId: summary.sessionId, title: trimmed)
            await refreshSessions()
        } catch {
            sessionsError = describe(error)
        }
    }
}