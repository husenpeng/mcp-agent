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
    @StateObject private var journal = UsageJournal()
    @StateObject private var interactions = InteractionCenter()
    /// Shared by the bottom ball and composer triggers, so one palette state
    /// serves every root.
    @StateObject private var tabMenu = FloatingTabMenuState()

    init() {
        // Installed before the first view builds, so a launch that hangs leaves
        // a record instead of a silent freeze.
        AppDiagnostics.start()
        #if DEBUG
            // A sign-in check starts from a known state; a release build never
            // reaches this branch.
            if ProcessInfo.processInfo.arguments.contains("-TOMATO_CLEAR_ACCOUNT") {
                AccountAuthStore.shared.clear()
            }
        #endif
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(model)
                .environmentObject(model.modelCatalog)
                .environmentObject(journal)
                .environmentObject(interactions)
                .environmentObject(tabMenu)
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var journal: UsageJournal
    @EnvironmentObject private var interactions: InteractionCenter
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var lock = BiometricLock()
    #if DEBUG
        /// Owner of a `-TOMATO_LIVE_DEMO` activity, which has no Session to hold it.
        @State private var demoLive = LiveActivityController()
    #endif

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
                    #if DEBUG
                        if ProcessInfo.processInfo.arguments.contains("-TOMATO_CHAT_STYLE_PREVIEW") {
                            ChatStylePreview()
                        } else if ProcessInfo.processInfo.arguments.contains("-TOMATO_CHAT_LAYOUT_PREVIEW") {
                            ChatLayoutPreview()
                        } else {
                            MainTabs()
                        }
                    #else
                        MainTabs()
                    #endif
                }
            }
        }
        .tint(TomatoToken.brandPrimary)
        .overlay {
            if model.phase == .ready, !lock.unlocked, !skipsLock {
                LockedCover(failure: lock.failure) { Task { await lock.unlock() } }
            }
        }
        // `.inactive` also fires while the system's own biometric sheet is up, so
        // only leaving the foreground drops the gate.
        .onChange(of: scenePhase) { _, phase in
            AppDiagnostics.scene(Self.label(phase))
            switch phase {
            case .background: lock.lock()
            case .active: Task { await unlockIfPaired() }
            default: break
            }
        }
        // A test run opens one Host file directly; no other presentation is
        // attached here, so this sheet is the only one the root owns.
        .sheet(item: $model.debugPreview) { file in
            FilePreviewSheet(file: file)
        }
        .task {
            model.attach(journal)
            model.attach(interactions)
            AppLog.shared.recordEnvironment(host: model.hostLabel)
            AppLog.screen("根视图")
            // A test run names its Host explicitly, so it also replaces a
            // pairing left on the device by an earlier run.
            AppModel.logLaunchArguments()
            #if DEBUG
                // A simulator or device check may leave one model seed, one MCP
                // server, and one prompt; run the local agent and record it.
                if let prompt = AgentDebugSeed.serviceProbePrompt {
                    model.tab = .phoneAgent
                    await AgentDebugSeed.runServiceProbe(prompt: prompt)
                } else if AgentDebugSeed.isPresent {
                    model.tab = .phoneAgent
                    await AgentDebugSeed.runIfPresent()
                } else if ProcessInfo.processInfo.arguments.contains("-TOMATO_PHONE_TAB") {
                    model.tab = .phoneAgent
                }
                // A design check on a real Lock Screen need not depend on a turn.
                if let demo = LiveActivityController.demoState {
                    await demoLive.startDemo(demo)
                }
            #endif
            if let pairing = AppModel.debugPairing {
                do {
                    try await model.pair(base: pairing.base, token: pairing.token)
                } catch {
                    // A test run that cannot pair must say why; the pairing screen
                    // shows no other trace of the attempt.
                    NSLog("TomatoRemote debug pairing failed: %@", describe(error))
                    AppLog.error(.app, "调试配对失败", detail: describe(error))
                }
            }
            #if DEBUG
                // UI automation cannot accept the system's "open in app?" prompt
                // a simulator `openurl` raises, so a debug launch may route one
                // link itself through the same handler.
                let arguments = ProcessInfo.processInfo.arguments
                if let index = arguments.firstIndex(of: "-TOMATO_OPEN_URL"),
                   arguments.indices.contains(index + 1),
                   let url = URL(string: arguments[index + 1])
                {
                    // `-TOMATO_DELAY_OPEN <seconds>` lets a launch settle (and
                    // warm its renderers) before the link lands.
                    var delay: Double = 0
                    if let delayIndex = arguments.firstIndex(of: "-TOMATO_DELAY_OPEN"),
                       arguments.indices.contains(delayIndex + 1),
                       let value = Double(arguments[delayIndex + 1])
                    {
                        delay = value
                    }
                    if delay > 0 {
                        Task {
                            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                            model.handle(url)
                        }
                    } else {
                        model.handle(url)
                    }
                }
            #endif
            #if DEBUG
                // Prove the export path on a device: write the same report the
                // share sheet would, next to the log so `devicectl copy` can
                // bring it back.
                if ProcessInfo.processInfo.arguments.contains("-TOMATO_EXPORT_LOGS") {
                    Task { @MainActor in
                        try? await Task.sleep(nanoseconds: 3_000_000_000)
                        let text = AppLog.shared.exportText()
                        let url = DiagnosticsStorage.directory.appendingPathComponent("export-test.txt")
                        try? text.write(to: url, atomically: true, encoding: .utf8)
                        AppLog.info(.diagnostics, "导出测试已写入 export-test.txt", detail: "\(text.count) 字符")
                    }
                }
            #endif
            await unlockIfPaired()
        }
        .onOpenURL { url in model.handle(url) }
    }

    /// One-word scene label the diagnostics log records.
    /// - Parameter phase: the scene phase SwiftUI reported.
    /// - Returns: a stable English word, so the log is greppable.
    private static func label(_ phase: ScenePhase) -> String {
        switch phase {
        case .active: "active"
        case .inactive: "inactive"
        case .background: "background"
        @unknown default: "unknown"
        }
    }

    private func unlockIfPaired() async {
        guard model.phase == .ready, !skipsLock else { return }
        await lock.unlock()
    }

    /// Debug launches can bypass the biometric gate so UI automation can reach
    /// the screens; a release build never sees the argument.
    private var skipsLock: Bool {
        #if DEBUG
            ProcessInfo.processInfo.arguments.contains("-TOMATO_NO_LOCK")
        #else
            false
        #endif
    }
}

/// Six destinations in five tab slots; a Session's conversation is pushed from
/// its list.
///
/// iOS moves a sixth child into its own More stack, which adds a system list and
/// a back button this app does not use. The floating ball is the real navigation,
/// so the last slot hosts both destinations the system would move there and
/// swaps between them. Personal memory is not a destination of its own: it is a
/// property of the account, reached from there.
struct MainTabs: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var interactions: InteractionCenter
    @Environment(\.scenePhase) private var scenePhase
    // The robot and room streams belong to the tab container: a pushed detail
    // must keep receiving registry frames after the list disappears.
    @StateObject private var robots = RobotListModel()
    @StateObject private var rooms = RoomListModel()

    var body: some View {
        TabView(selection: tabSelection) {
            HomeView()
                .tabItem { Label(AppModel.Tab.home.title, systemImage: AppModel.Tab.home.systemImage) }
                .tag(AppModel.Tab.home)
            SessionListView()
                .tabItem { Label(AppModel.Tab.sessions.title, systemImage: AppModel.Tab.sessions.systemImage) }
                .tag(AppModel.Tab.sessions)
            PhoneAgentView()
                .tabItem { Label(AppModel.Tab.phoneAgent.title, systemImage: AppModel.Tab.phoneAgent.systemImage) }
                .tag(AppModel.Tab.phoneAgent)
            RobotsView(robotModel: robots)
                .tabItem { Label(AppModel.Tab.robots.title, systemImage: AppModel.Tab.robots.systemImage) }
                .tag(AppModel.Tab.robots)
            extraTab
                .tabItem {
                    let tab: AppModel.Tab = model.tab == .account ? .account : .rooms
                    Label(tab.title, systemImage: tab.systemImage)
                }
                .tag(AppModel.Tab.rooms)
        }
        // The floating ball is the only destination control in this app. Hide
        // the system bar on the container itself: a hidden bar on each root
        // still left iOS's own More list reachable, and that list spoke English
        // and used none of this app's surfaces.
        .toolbar(.hidden, for: .tabBar)
        .task {
            interactions.start(hub: model.hub)
            robots.start(hub: model.hub)
            rooms.start(hub: model.hub)
            AppLog.screen(Self.label(for: model.tab))
            #if DEBUG
                autotourIfAsked()
            #endif
            // A returning diagram reader warms the 3.4 MB runtime so opening a
            // chat does not start that compile. Warming builds a WKWebView on
            // the main thread, and landing that inside a scroll or a tab switch
            // is a several-hundred-millisecond dropped frame, so it waits for
            // the reader to go quiet instead of firing on a blind timer.
            Task {
                // The first seconds hold the launch burst: session list, today's
                // cards, and the account read all land before the reader touches
                // anything, so "no tab change yet" is not idle. Give that burst a
                // window of its own before looking for quiet.
                try? await Task.sleep(nanoseconds: 6_000_000_000)
                let deadline = Date().addingTimeInterval(20)
                while Date() < deadline {
                    try? await Task.sleep(nanoseconds: 1_000_000_000)
                    if Date().timeIntervalSince(model.lastNavigation) > 2 {
                        break
                    }
                }
                await MermaidRenderer.shared.warmIfUsedBefore()
            }
        }
        // Attribute a dropped frame to the tab that was on screen.
        .onChange(of: model.tab) { _, tab in
            model.lastNavigation = Date()
            AppLog.screen(Self.label(for: tab))
            AppLog.info(.ui, "切换到 \(Self.label(for: tab))", detail: "占用 \(MemoryFootprint.text())")
        }
        // A suspended app receives no frames. The sockets may have ended while
        // the app was away, so returning to the foreground reopens the ones
        // that stopped.
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active else { return }
            interactions.resume(hub: model.hub)
            robots.resume(hub: model.hub)
            rooms.resume(hub: model.hub)
        }
        // A reopened stream delivers new changes only, so the rows that changed
        // while it was down are read again. The first connection needs no read:
        // the list's own opening read covers it.
        .onChange(of: interactions.isConnected) { was, connected in
            guard was, connected else { return }
            Task { await model.refreshSessions(force: true) }
        }
        .onDisappear {
            robots.stop()
            rooms.stop()
            interactions.stop()
        }
    }

    /// The fifth slot hosts the two destinations iOS would move into its own
    /// More stack.
    @ViewBuilder
    private var extraTab: some View {
        if model.tab == .account {
            AccountView()
        } else {
            RoomsView(roomModel: rooms, availableRobots: robots.ordered)
        }
    }

    /// Selection for the five-slot container.
    ///
    /// Account shares the rooms slot, so the fifth child stays selected and the
    /// destination never lands inside a system More stack.
    private var tabSelection: Binding<AppModel.Tab> {
        Binding(
            get: { model.tab == .account ? .rooms : model.tab },
            set: { model.tab = $0 }
        )
    }

    #if DEBUG
        /// Cycle every tab without XCUITest, so the frame log measures the
        /// screen transitions themselves. Present only with `-TOMATO_AUTOTOUR`.
        private func autotourIfAsked() {
            guard ProcessInfo.processInfo.arguments.contains("-TOMATO_AUTOTOUR") else { return }
            Task { @MainActor in
                // Let the first screen and its reads settle.
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                let tabs: [(AppModel.Tab, String)] = [
                    (.home, "今天"),
                    (.sessions, "会话"),
                    (.robots, "智能体"),
                    (.rooms, "群聊"),
                    (.account, "账号"),
                ]
                for _ in 0 ..< 2 {
                    for (tab, label) in tabs {
                        AppLog.mark("切页 → \(label)")
                        model.tab = tab
                        try? await Task.sleep(nanoseconds: 1_500_000_000)
                    }
                }
                AppLog.info(.ui, "自动切页结束")
            }
        }
    #endif

    /// Screen name the diagnostics log records for one tab.
    /// - Parameter tab: selected destination.
    /// - Returns: the label the log reader groups by.
    private static func label(for tab: AppModel.Tab) -> String {
        switch tab {
        case .home: "今天"
        case .sessions: "会话"
        case .phoneAgent: "Tomato Phone"
        case .robots: "智能体"
        case .rooms: "群聊"
        case .account: "账号"
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

    /// Destinations, addressed by a deep link as well as by the floating palette.
    enum Tab: Hashable {
        case home
        case sessions
        case phoneAgent
        case robots
        case rooms
        case account
    }

    @Published var tab: Tab = .home
    /// When the reader last switched destination. Deliberately not published:
    /// it only gates the diagram-runtime warm-up, and publishing it would
    /// re-render the whole container on every tab change for no consumer.
    var lastNavigation = Date()
    /// Whether the account tab shows the personal-memory page; a
    /// `tomato://memory` link sets it.
    @Published var showsMemory = false
    /// Whether the account tab opens the diagnostics page; a `tomato://logs`
    /// link sets it, and a support reply can point at that address.
    @Published var showsLogs = false
    /// One file a test run asked to preview, present only with
    /// `-TOMATO_PREVIEW_PATH <absolute path>`. A release build leaves it nil.
    @Published var debugPreview: DeliveredFile?
    @Published var sessions: [SessionSummary] = []
    @Published var sessionsError: String?
    /// The paired Host's model directory. One read serves every conversation,
    /// because the provider list belongs to the Host rather than to a Session.
    let modelCatalog = ModelCatalogStore()
    /// Recent event pages keyed by Session, filled ahead of a tap so the
    /// conversation renders its history immediately. Bounded and
    /// least-recently-used, so history sessions stay warm too.
    let previews = SessionPreviewCache()
    /// Sessions with a warm-up already in flight, so a row that re-appears
    /// during a scroll does not ask the Host for the same page twice.
    private var previewsInFlight: Set<String> = []
    @Published var isLoadingSessions = false
    @Published var isCreatingSession = false
    /// Failed list reads since the last success, so the repair read backs off
    /// instead of probing a Host that is not there every minute.
    private(set) var consecutiveRefreshFailures = 0
    /// Bumped whenever a list read succeeds after failures. Screens holding a
    /// stream that gave up use it to reopen without a scene change.
    @Published private(set) var hostReachableTick = 0
    /// When the last successful list read landed.
    private(set) var lastSessionsRead: Date?

    /// Wait the repair read uses next.
    var sessionPollInterval: TimeInterval {
        SessionPollSchedule.pause(afterConsecutiveFailures: consecutiveRefreshFailures)
    }

    /// Where list-level interactions are remembered. Optional so a test can
    /// build the model without a journal.
    private weak var journal: UsageJournal?
    /// Host event stream the list follows. Optional for the same reason; a model
    /// without it falls back to reading the whole list.
    private weak var interactions: InteractionCenter?

    /// Point this model at the device journal that records what the list does.
    /// - Parameter journal: the session's journal, owned by the app scene.
    func attach(_ journal: UsageJournal) {
        self.journal = journal
    }

    /// Follow the Host's forwarded notifications through the open event stream.
    ///
    /// The stream already exists for approvals and questions, and the Host
    /// forwards its Session notifications on it, so the list learns about a turn
    /// that starts or ends without reading every row again.
    /// - Parameter interactions: the event-stream owner, owned by the app scene.
    func attach(_ interactions: InteractionCenter) {
        self.interactions = interactions
        interactions.onHostEvent = { [weak self] event, args in
            self?.applyHostEvent(event, args: args)
        }
    }

    /// Whether the Host is pushing Session changes right now.
    ///
    /// A list that cannot follow events is only a snapshot, so its header says
    /// so rather than presenting rows as current.
    var isFollowingEvents: Bool {
        interactions?.isConnected == true
    }

    /// Why the Session rows may lag the Host: the last read failed and the event
    /// stream is down, so nothing is correcting them.
    var staleSessionsWarning: String? {
        guard !isFollowingEvents, let sessionsError else { return nil }
        return "状态可能已过期：\(sessionsError)"
    }

    /// Session a `tomato://session/<id>` link asked to open, consumed by the list
    /// once it can resolve the row.
    @Published var pendingSessionId: String?
    /// Room a `tomato://room/<id>` link asked to open, consumed by the room list
    /// once its snapshot carries the room.
    @Published var pendingRoomId: String?

    init() {
        if let preview = Self.previewProfile {
            // UI automation cannot pair: the token is process-scoped and the Host
            // is not reachable from the runner. A debug launch may therefore
            // enter the paired phase against an address that never answers, so
            // screens render their own offline state instead of the pairing
            // flow. The named address also wins over a pairing an earlier run
            // left in the keychain.
            profile = preview
            phase = .ready
        } else if let stored = KeychainStore.load(), stored.url != nil {
            profile = stored
            phase = .ready
        } else {
            profile = nil
            phase = .pairing
        }
        // The previous answer paints the list before this launch's first read
        // returns; the read below still replaces it.
        if let base = profile?.base {
            sessions = HostSnapshots.read([SessionSummary].self, key: Self.sessionsKey(base)) ?? []
        }
        #if DEBUG
            let arguments = ProcessInfo.processInfo.arguments
            if let index = arguments.firstIndex(of: "-TOMATO_PREVIEW_PATH"),
               arguments.indices.contains(index + 1)
            {
                let path = arguments[index + 1]
                debugPreview = DeliveredFile(path: path, description: nil, seq: nil)
            }
        #endif
    }

    /// Debug-only standing pairing, present only with `-TOMATO_PREVIEW_PAIRING`.
    private static var previewProfile: PairingProfile? {
        #if DEBUG
            let arguments = ProcessInfo.processInfo.arguments
            guard let index = arguments.firstIndex(of: "-TOMATO_PREVIEW_PAIRING"),
                  arguments.indices.contains(index + 1)
            else { return nil }
            let base = arguments[index + 1]
            guard URL(string: base) != nil else { return nil }
            return PairingProfile(base: base, cookie: "", authority: URL(string: base)?.host)
        #else
            return nil
        #endif
    }

    /// Route one incoming deep link.
    ///
    /// `session/<id>` opens a conversation and `memory` opens the personal
    /// memory page; an unrecognised host or a malformed path is reported rather
    /// than ignored, because a notification that leads nowhere is
    /// indistinguishable from a broken app.
    /// @param url - the URL the system handed the application.
    func handle(_ url: URL) {
        guard url.scheme == "tomato" else {
            AppLog.warning(.app, "忽略了非 tomato 链接")
            return
        }
        AppLog.info(.app, "深链 \(url.host ?? "")", detail: url.absoluteString)
        // `tomato://session/<id>` puts `session` in the host position.
        let segments = [url.host].compactMap { $0 } + url.pathComponents.filter { $0 != "/" }
        if segments == ["new"] {
            tab = .sessions
            pendingSessionId = "new"
            return
        }
        if segments == ["latest"] || segments == ["recent"] {
            tab = .sessions
            pendingSessionId = segments[0]
            return
        }
        if segments == ["sessions"] {
            tab = .sessions
            return
        }
        if segments == ["account"] {
            tab = .account
            return
        }
        if segments == ["memory"] {
            tab = .account
            showsMemory = true
            return
        }
        #if DEBUG
            // A diagnostics self-test ends the process on purpose so the next
            // launch can show what the crash guard recorded.
            if segments == ["crash"] {
                AppLog.warning(.crash, "调试：主动触发崩溃")
                DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                    CrashGuard.selfTest()
                }
                return
            }
        #endif
        if segments == ["logs"] || segments == ["diagnostics"] {
            tab = .account
            showsLogs = true
            return
        }
        if segments == ["robots"] {
            tab = .robots
            return
        }
        if segments == ["rooms"] {
            tab = .rooms
            return
        }
        if segments.first == "room", segments.count >= 2 {
            tab = .rooms
            pendingRoomId = segments[1]
            return
        }
        guard segments.first == "session", segments.count >= 2 else {
            sessionsError = "无法识别的链接：\(url.absoluteString)"
            return
        }
        tab = .sessions
        pendingSessionId = segments[1]
    }

    /// Acknowledge one consumed deep link so the list does not reopen it.
    func clearPendingSession() {
        pendingSessionId = nil
    }

    /// Client bound to the paired Host, or `nil` before pairing.
    var hub: HubClient? {
        guard let profile, let url = profile.url else { return nil }
        return HubClient(
            base: url,
            cookie: profile.cookie,
            accountCookie: AccountAuthStore.shared.accountCookie,
            watchdogToken: profile.watchdogToken
        )
    }

    var hostLabel: String {
        profile?.base ?? "未配对"
    }

    // MARK: Pairing

    /// Exchange a launch token for the persistent cookie and become ready.
    ///
    /// A host typed without a scheme gets `https://`. The other scheme is tried
    /// only where plain HTTP can legally work — a local network or tailnet host —
    /// because ATS refuses cleartext for a public name, and that refusal would
    /// otherwise replace the real failure with a misleading one.
    /// @param base - host root the user supplied.
    /// @param token - the launch token from the printed URL.
    func pair(base: URL, token: String) async throws {
        AppLog.info(.app, "开始配对", detail: "Host \(base.absoluteString)")
        var firstError: Error?
        for candidate in Self.pairCandidates(base) {
            do {
                let cookie = try await HubClient.connect(base: candidate, token: token)
                let stored = PairingProfile(
                    base: candidate.absoluteString,
                    cookie: cookie,
                    authority: candidate.host
                )
                do {
                    try KeychainStore.save(stored)
                } catch {
                    // The simulator build carries no keychain entitlement
                    // (`-34018`). A debug launch that named its Host keeps the
                    // profile in memory for this run; a release build never
                    // reaches this branch.
                    guard Self.debugPairing != nil else { throw error }
                    NSLog("TomatoRemote debug pairing kept in memory: %@", describe(error))
                    AppLog.error(.app, "凭据未存入钥匙串，仅本次运行有效", detail: describe(error))
                }
                // A new Host gets no account session minted for the old one.
                AccountAuthStore.shared.clear()
                profile = stored
                phase = .ready
                AppLog.info(.app, "配对成功", detail: "Host \(stored.base)")
                AppLog.shared.recordEnvironment(host: stored.base)
                await refreshSessions(force: true)
                return
            } catch {
                AppLog.warning(.app, "配对尝试失败", detail: "\(candidate.absoluteString)：\(describe(error))")
                if firstError == nil {
                    firstError = error
                }
            }
        }
        AppLog.error(.app, "配对失败", detail: firstError.map(describe) ?? "没有可用地址")
        throw firstError ?? HubError.invalidBaseURL
    }

    /// The requested host root first, plus the same host under the other HTTP
    /// scheme when that scheme can work for this address.
    /// @param base - the requested host root.
    /// @returns one or two candidates, the requested one first.
    private static func pairCandidates(_ base: URL) -> [URL] {
        var alternate = URLComponents(url: base, resolvingAgainstBaseURL: false)
        alternate?.scheme = base.scheme == "https" ? "http" : "https"
        guard let other = alternate?.url, other != base else { return [base] }
        if base.scheme == "https", !isLocalHost(base.host ?? "") {
            return [base]
        }
        return [base, other]
    }

    /// Whether plain HTTP to this host is exempt from ATS: a literal address, an
    /// unqualified name, or a `.local` / tailnet name.
    /// @param host - the URL host.
    /// @returns true when the cleartext fallback may be attempted.
    private static func isLocalHost(_ host: String) -> Bool {
        if host.contains(":") {
            return true
        }
        if !host.contains(".") {
            return true
        }
        if host.hasSuffix(".local") || host.hasSuffix(".ts.net") {
            return true
        }
        let parts = host.split(separator: ".")
        return parts.count == 4 && parts.allSatisfy { Int($0).map { (0 ... 255).contains($0) } == true }
    }

    func unpair() {
        AppLog.notice(.app, "解除配对")
        // The mirrored WebSocket cookie lives outside the Keychain; leaving it
        // behind would keep presenting a credential the person revoked.
        if let profile, let url = profile.url {
            RemoteSocket.forgetCookie(for: url)
        }
        KeychainStore.clear()
        // The phone's own Feishu session belongs to this device, not to the Mac;
        // unpairing removes the Host credential and leaves the person signed in.
        profile = nil
        sessions = []
        sessionsError = nil
        // A buffered list belongs to the Host just forgotten; keeping it would
        // paint another Host's conversations at the next pairing.
        HostSnapshots.removeAll()
        phase = .pairing
        AppLog.shared.recordEnvironment(host: "未配对")
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

    func refreshSessions(force: Bool = false) async {
        guard let hub else { return }
        // A tab return reads again only when the last read is stale; replacing an
        // equal list would re-diff every row for no new information.
        if !force, !sessions.isEmpty, let lastSessionsRead,
           Date().timeIntervalSince(lastSessionsRead) < Self.sessionFreshness
        {
            return
        }
        isLoadingSessions = true
        defer { isLoadingSessions = false }
        AppLog.mark("刷新列表")
        let started = CFAbsoluteTimeGetCurrent()
        do {
            let items = try await hub.listSessions()
            let sorted = items.sorted { $0.updatedAt > $1.updatedAt }
            HostSnapshots.write(sorted, key: Self.sessionsKey(hub.base.absoluteString))
            if sorted != sessions {
                sessions = sorted
            }
            sessionsError = nil
            lastSessionsRead = Date()
            noteSessionsRead(count: items.count, since: started)
        } catch {
            noteSessionsReadFailed(error)
        }
    }

    /// Seconds a read stays fresh for a plain appearance-driven refresh.
    private static let sessionFreshness: TimeInterval = 15

    /// Snapshot key of one Host's Session list.
    /// - Parameter base: the paired Host's base address.
    /// - Returns: the key the buffer is read and written under.
    private static func sessionsKey(_ base: String) -> String {
        "sessions-\(base)"
    }

    /// Elapsed milliseconds, rounded, for a log detail.
    /// - Parameter start: `CFAbsoluteTimeGetCurrent()` the work began at.
    /// - Returns: the elapsed time in milliseconds.
    private static func milliseconds(since start: CFAbsoluteTime) -> Int {
        Int(((CFAbsoluteTimeGetCurrent() - start) * 1000).rounded())
    }

    // MARK: Forwarded Host events

    /// Apply one Host notification to the rows on screen.
    ///
    /// The Host announces every Agent and Session change on the event stream the
    /// approval cards already follow, which is how a browser client stays
    /// current. A row whose turn starts while the reader watches must not keep
    /// showing what the last read said.
    /// - Parameters:
    ///   - event - forwarded event name.
    ///   - args - the Host's positional arguments, in its own order.
    func applyHostEvent(_ event: String, args: [JSONValue]) {
        AppLog.debug(.stream, "Host 事件 \(event)", detail: "\(args.count) 个参数")
        guard let next = SessionLiveEvents.apply(event: event, args: args, to: sessions) else { return }
        sessions = next
    }

    /// Creates a Session and returns its identity, or reports why it failed.
    /// - Parameter cwd: absolute folder the new Session joins; nil lets the Host choose.
    func createSession(cwd: String? = nil) async -> String? {
        guard let hub else { return nil }
        // Two taps inside one frame queue two Tasks before the busy flag can
        // repaint the button; the second would create a duplicate Session.
        guard !isCreatingSession else { return nil }
        isCreatingSession = true
        defer { isCreatingSession = false }
        do {
            let created = try await hub.createSession(cwd: cwd)
            AppLog.info(.session, "创建会话", detail: "\(created.sessionId.prefix(8))")
            journal?.record(UsageEvent(kind: .created))
            await refreshSessions(force: true)
            return created.sessionId
        } catch {
            sessionsError = describe(error)
            AppLog.error(.session, "创建会话失败", detail: describe(error))
            return nil
        }
    }

    /// Fetch one Session's newest page into the preview cache.
    ///
    /// A failure is not reported: the conversation loads its own first page and
    /// this cache only decides whether it can paint before that round trip ends.
    /// A page already warm, or a request already travelling, is left alone.
    /// - Parameter summary: Session to warm.
    func prefetch(_ summary: SessionSummary) async {
        let sessionId = summary.sessionId
        guard let hub, !previews.contains(sessionId), !previewsInFlight.contains(sessionId) else { return }
        // The Host refuses a `throughSeq` past the Session's cursor, so the only
        // usable address is the watermark the list projected. Without one the
        // conversation waits for its follow snapshot instead of guessing.
        guard let cursor = summary.projections?.asOfSeq else { return }
        previewsInFlight.insert(sessionId)
        defer { previewsInFlight.remove(sessionId) }
        let started = CFAbsoluteTimeGetCurrent()
        guard let page = try? await hub.pageEvents(
            sessionId: sessionId,
            throughSeq: cursor,
            maxMessages: SessionPageLimit.opening
        ) else { return }
        // The Session may have been dropped from the list while the page was in
        // flight; caching it would only spend room on a row nobody can open.
        guard sessions.contains(where: { $0.sessionId == sessionId }) else { return }
        previews.store(page.events, for: sessionId)
        AppLog.debug(
            .session,
            "预取会话 \(sessionId.prefix(8))",
            detail: "\(page.events.count) 条 · \(Int((CFAbsoluteTimeGetCurrent() - started) * 1000)) ms"
        )
    }

    /// Warm the conversations a reader is most likely to open next.
    ///
    /// The newest few rows are warmed together at list load, so the list opens
    /// with the top conversations ready; every other row warms its own page as
    /// it scrolls into view. Both paths share the bounded cache, so a long
    /// history stays instant to revisit without growing without limit.
    /// - Parameter summaries: rows currently visible, newest first.
    func prefetchLikely(_ summaries: [SessionSummary]) async {
        let candidates = summaries
            .filter { !$0.isSubagent && !$0.isRobotRun }
            .prefix(Self.prefetchAtLoad)
        // Three at a time: enough to have the next tap ready on a slow link,
        // few enough that a page read does not queue behind a burst.
        await withTaskGroup(of: Void.self) { group in
            for summary in candidates {
                group.addTask { @MainActor [weak self] in
                    await self?.prefetch(summary)
                }
            }
            await group.waitForAll()
        }
    }

    /// How many of the newest conversations the list warms on load.
    private static let prefetchAtLoad = 6

    /// Events already fetched for one Session, if any.
    /// @param sessionId - Session whose preview is read.
    /// @returns the cached page, or an empty array.
    func cachedEvents(_ sessionId: String) -> [JSONValue] {
        previews.page(for: sessionId) ?? []
    }

    func rename(_ summary: SessionSummary, to title: String) async {
        guard let hub else { return }
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        do {
            try await hub.renameSession(sessionId: summary.sessionId, title: trimmed)
            AppLog.info(.session, "重命名会话", detail: "\(summary.sessionId.prefix(8))")
            journal?.record(UsageEvent(kind: .renamed, project: summary.folderName))
            await refreshSessions(force: true)
        } catch {
            sessionsError = describe(error)
            AppLog.error(.session, "重命名会话失败", detail: describe(error))
        }
    }

    /// Remember that the list opened one conversation.
    /// - Parameter summary: the row the reader tapped.
    func noteOpened(_ summary: SessionSummary) {
        journal?.record(UsageEvent(kind: .opened, project: summary.folderName))
    }
}

// MARK: - List read accounting

/// What a list read means for the retry cadence and for screens whose stream died.
extension AppModel {
    /// Record a successful read, and tell screens that gave up on their stream
    /// that the Host answers again.
    /// - Parameters:
    ///   - count: Sessions the read returned.
    ///   - started: `CFAbsoluteTimeGetCurrent()` the read began at.
    private func noteSessionsRead(count: Int, since started: CFAbsoluteTime) {
        let failures = consecutiveRefreshFailures
        consecutiveRefreshFailures = 0
        AppLog.info(
            .session,
            "会话列表已刷新",
            detail: "\(count) 条 · \(Self.milliseconds(since: started)) ms"
                + (failures > 0 ? " · 连续失败 \(failures) 次后恢复" : "")
        )
        guard failures > 0 else { return }
        hostReachableTick += 1
    }

    /// Record a failed read: one error per outage, then a counted retry line.
    /// - Parameter error: the failure the read threw.
    private func noteSessionsReadFailed(_ error: Error) {
        consecutiveRefreshFailures += 1
        sessionsError = describe(error)
        let wait = Int(SessionPollSchedule.pause(afterConsecutiveFailures: consecutiveRefreshFailures))
        // The banner keeps showing the reason; repeating it every attempt is
        // what turned one dead pairing into 4704 error lines.
        guard consecutiveRefreshFailures == 1 else {
            AppLog.debug(
                .session,
                "会话列表仍不可达",
                detail: "连续 \(consecutiveRefreshFailures) 次 · \(wait) 秒后重试 · \(describe(error))"
            )
            return
        }
        AppLog.error(.session, "会话列表刷新失败", detail: "\(describe(error)) · \(wait) 秒后重试")
    }
}
