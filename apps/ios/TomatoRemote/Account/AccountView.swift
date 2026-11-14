//
//  AccountView.swift
//  Tomato Remote
//
//  The phone's own Feishu account, plus the account a paired Host projects.
//  Pairing authenticates the device; Feishu sign-in authenticates the person
//  and works with no Mac.
//

import SwiftUI

struct AccountView: View {
    @EnvironmentObject private var model: AppModel
    @StateObject private var auth = AccountAuthStore.shared
    /// One line of context under the page title.
    private static let caption = "用飞书账号登录这台手机；配对凭据和登录会话分开保存。"

    @State private var session: AccountSession?
    /// Account the phone's own Feishu session names, when it has one.
    @State private var localUser: CompanyUser?
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var isSigningOut = false
    @State private var showsLogin = false
    /// When the account card last read successfully; a tab return inside the
    /// window reuses it.
    @State private var loadedAt: Date?
    /// Pushed destinations; a deep link appends the memory page once rather
    /// than flipping a bound presentation flag from two places.
    @State private var path = NavigationPath()
    private static let memoryRoute = "memory"
    private static let desktopRoute = "desktop"
    private static let logsRoute = "logs"

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    // The caption sits in the content: a navigation subtitle
                    // grows the iOS 26 bar, and the auto-inset of the first
                    // block under it was unreliable.
                    PageCaption(caption: Self.caption)

                    if let errorMessage {
                        ErrorBanner(message: errorMessage) { Task { await load() } }
                    }

                    profileCard
                    if !isSignedIn {
                        loginButton
                    }
                    NavigationLink(value: Self.memoryRoute) {
                        memoryRow
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("account.memory")
                    hostCard
                    NavigationLink(value: Self.desktopRoute) {
                        linkRow(
                            systemImage: "desktopcomputer",
                            title: "桌面状态",
                            detail: "Watchdog 与重启 Mac 上的 Desktop"
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("account.desktop")
                    NavigationLink(value: Self.logsRoute) {
                        linkRow(
                            systemImage: "doc.text.magnifyingglass",
                            title: "运行日志",
                            detail: "崩溃、卡顿与网络记录，可导出"
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("account.logs")
                    actions
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 88)
            }
            .background(TomatoToken.bgBase)
            .navigationTitle("账号")
            .navigationBarTitleDisplayMode(.inline)
            .tomatoScrollEdge()
            .tomatoFloatingTabs()
            .navigationDestination(for: String.self) { route in
                switch route {
                case Self.memoryRoute: MemoryView()
                case Self.desktopRoute: DesktopStatusView()
                case Self.logsRoute: DiagnosticsView()
                default: EmptyView()
                }
            }
            .task(id: model.showsMemory) {
                guard model.showsMemory, path.isEmpty else { return }
                path.append(Self.memoryRoute)
                model.showsMemory = false
            }
            .task(id: model.showsLogs) {
                guard model.showsLogs, path.isEmpty else { return }
                path.append(Self.logsRoute)
                model.showsLogs = false
            }
            .task {
                if let loadedAt, Date().timeIntervalSince(loadedAt) < 30 {
                    return
                }
                await load()
                if errorMessage == nil {
                    loadedAt = Date()
                }
            }
            .refreshable {
                await load()
                if errorMessage == nil {
                    loadedAt = Date()
                }
            }
            .task {
                #if DEBUG
                    // A sign-in check can open the flow without a tap; a release
                    // build never reaches this branch.
                    if ProcessInfo.processInfo.arguments.contains("-TOMATO_OPEN_LOGIN"), !isSignedIn {
                        showsLogin = true
                    }
                #endif
            }
            .sheet(isPresented: $showsLogin) {
                FeishuLoginSheet(base: CompanyAuth.baseURL) { session, user in
                    auth.save(sessionId: session, searchBaseURL: CompanyAuth.baseURL.absoluteString)
                    localUser = user
                    Task { await load() }
                }
                .tomatoSheet([.large])
            }
            .onChange(of: auth.isSignedIn) { _, signedIn in
                // The web view's own dismiss can race the cookie hand-off; the
                // parent closes the sheet as soon as the session is stored.
                if signedIn {
                    showsLogin = false
                }
            }
        }
    }

    /// One row of a page linked from the account screen.
    /// - Parameters:
    ///   - systemImage: leading glyph.
    ///   - title: row name.
    ///   - detail: one line saying what the page shows.
    /// - Returns: the row, styled like the memory entry.
    private func linkRow(systemImage: String, title: String, detail: String) -> some View {
        TomatoCard(padding: 16) {
            HStack(spacing: 12) {
                Image(systemName: systemImage)
                    .font(.body.weight(.medium))
                    .foregroundStyle(TomatoToken.brandPrimary)
                    .frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(TomatoToken.labelPrimary)
                    Text(detail)
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
        }
    }

    /// Personal memory is a property of this device, reached from the account
    /// page rather than given a tab of its own.
    private var memoryRow: some View {
        TomatoCard(padding: 16) {
            HStack(spacing: 12) {
                Image(systemName: "brain")
                    .font(.body.weight(.medium))
                    .foregroundStyle(TomatoToken.brandPrimary)
                    .frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text("个人记忆")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(TomatoToken.labelPrimary)
                    Text("这台手机怎么用 Agent，以及它被告知了什么")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .lineLimit(1)
                }
                Spacer(minLength: 8)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
        }
    }

    // MARK: - Cards

    private var profileCard: some View {
        TomatoCard(padding: 18) {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 14) {
                    monogram
                    VStack(alignment: .leading, spacing: 3) {
                        Text(title)
                            .font(.headline)
                            .foregroundStyle(TomatoToken.labelPrimary)
                        Text(subtitle)
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.labelCaption)
                    }
                    Spacer(minLength: 8)
                    StatusPill(text: statusText, tone: statusTone)
                }

                Divider().overlay(TomatoToken.borderL1)

                InfoRow(label: "状态", value: isLoading ? "读取中…" : statusText)
                if let name = displayName {
                    InfoRow(label: "昵称", value: name)
                }
                if let email {
                    InfoRow(label: "邮箱", value: email)
                }
            }
        }
    }

    private var hostCard: some View {
        TomatoCard(padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "Host") {
                    Image(systemName: "desktopcomputer")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                InfoRow(label: "地址", value: model.hostLabel)
                if let authority = model.profile?.authority {
                    InfoRow(label: "主机", value: authority)
                }
            }
        }
    }

    /// The one account action a signed-out phone needs, kept beside the profile
    /// card instead of at the bottom of the page.
    private var loginButton: some View {
        FeishuLoginButton(
            title: "用飞书登录",
            isEnabled: !isLoading,
            isBusy: isLoading
        ) {
            showsLogin = true
        }
        .accessibilityIdentifier("account.login")
    }

    private var actions: some View {
        VStack(spacing: 12) {
            if isSignedIn {
                TomatoSecondaryButton(
                    title: "退出登录",
                    systemImage: "rectangle.portrait.and.arrow.right",
                    isDestructive: true,
                    isEnabled: !isSigningOut
                ) {
                    Task { await signOut() }
                }
            }
            TomatoSecondaryButton(title: "解除配对", systemImage: "link.badge.plus", isDestructive: true) {
                model.unpair()
            }
            Text("登录由公司飞书完成，会话保存在这台手机的钥匙串；没有配对 Mac 也能登录。解除配对只清除这台 Mac 的配对凭据。")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelDimmed)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var monogram: some View {
        ZStack {
            Circle()
                .fill(TomatoToken.brandPrimary.opacity(isSignedIn ? 0.16 : 0.08))
                .frame(width: 52, height: 52)
            if let initial = displayName?.first {
                Text(String(initial))
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(TomatoToken.brandPrimary)
            } else {
                Image(systemName: "person.fill")
                    .font(.title3)
                    .foregroundStyle(TomatoToken.brandPrimary.opacity(0.7))
            }
        }
    }

    // MARK: - State

    /// Whether this phone holds a session of its own or inherits the Host's.
    private var isSignedIn: Bool {
        auth.isSignedIn || session?.isSignedIn == true
    }

    /// Display name from whichever account the phone can see.
    private var displayName: String? {
        localUser?.displayName ?? session?.user?.displayName
    }

    /// Email from whichever account the phone can see.
    private var email: String? {
        localUser?.email ?? session?.user?.email
    }

    private var title: String {
        if let displayName {
            return displayName
        }
        return isSignedIn ? "已登录" : "未登录"
    }

    private var subtitle: String {
        if auth.isSignedIn {
            return "本机飞书登录"
        }
        if session?.isUnavailable == true {
            return "Host 没有配置登录服务"
        }
        if session?.isShared == true {
            return "来自这台 Mac 的登录"
        }
        return session?.user?.email ?? "Host 账号"
    }

    private var statusText: String {
        if isLoading {
            return "读取中"
        }
        if isSignedIn {
            return "已登录"
        }
        if session?.isUnavailable == true {
            return "未启用"
        }
        return "未登录"
    }

    private var statusTone: StatusPill.Tone {
        if isSignedIn {
            return .ok
        }
        if session?.isUnavailable == true {
            return .warn
        }
        return .idle
    }

    // MARK: - Actions

    private func load() async {
        AppLog.screen("账号")
        isLoading = true
        defer { isLoading = false }
        // A session without an origin cannot verify or search; keep none.
        if auth.isSignedIn, auth.searchContext == nil {
            auth.clear()
        }
        if let context = auth.searchContext {
            do {
                localUser = try await CompanyAuth.verify(base: context.base, sessionId: context.sessionId)
                session = nil
                errorMessage = nil
                return
            } catch {
                guard let authError = error as? CompanyAuthError, case .expired = authError else {
                    // The session came from a completed Feishu exchange; a
                    // profile read that fails does not make it invalid. The
                    // Host projection, when this phone is paired, still names
                    // the person.
                    AppLog.warning(.app, "飞书账号读取失败", detail: describe(error))
                    await loadHostProjection()
                    return
                }
                // The stored session no longer verifies; forget it and fall
                // back to the Host's projection, which may still be signed in.
                AppLog.warning(.app, "飞书会话失效", detail: describe(error))
                auth.clear()
                localUser = nil
            }
        }
        await loadHostProjection()
    }

    /// Read the account a paired Host projects, or leave the phone's own signed
    /// state visible when no Host is reachable.
    private func loadHostProjection() async {
        guard let hub = model.hub else {
            session = nil
            if !auth.isSignedIn {
                localUser = nil
            }
            errorMessage = nil
            return
        }
        do {
            session = try await hub.accountSession()
            errorMessage = nil
        } catch {
            // The phone's own session is still valid; a Host that is asleep is
            // not a reason to show a sign-in failure on this card.
            if auth.isSignedIn {
                session = nil
                errorMessage = nil
            } else {
                errorMessage = describe(error)
            }
        }
    }

    private func signOut() async {
        isSigningOut = true
        defer { isSigningOut = false }
        if let context = auth.searchContext {
            await CompanyAuth.logout(base: context.base, sessionId: context.sessionId)
        }
        if let hub = model.hub {
            do {
                try await hub.signOutAccount()
            } catch {
                errorMessage = describe(error)
            }
        }
        // The local session is cleared even when a service could not be told; a
        // phone that keeps a revoked cookie would look signed in forever.
        auth.clear()
        localUser = nil
        await load()
    }
}
