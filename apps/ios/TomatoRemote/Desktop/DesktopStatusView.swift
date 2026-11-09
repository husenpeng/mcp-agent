//
//  DesktopStatusView.swift
//  Tomato Remote
//
//  Desktop process management. The Watchdog runs outside the Host, so this
//  screen can still report and restart a Desktop whose Host has hung.
//

import SwiftUI

struct DesktopStatusView: View {
    @EnvironmentObject private var model: AppModel

    @State private var health: WatchdogHealth?
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var isRestarting = false
    @State private var lastChecked: Date?
    @State private var tokenDraft = ""
    @State private var tokenError: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let errorMessage {
                        ErrorBanner(message: errorMessage) { Task { await refresh() } }
                    }

                    TomatoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "Desktop") {
                                statusBadge
                            }
                            InfoRow(label: "状态", value: statusText)
                            if let pid = health?.pid {
                                InfoRow(label: "进程", value: String(Int(pid)))
                            }
                            InfoRow(label: "地址", value: model.hostLabel)
                            if let lastChecked {
                                InfoRow(
                                    label: "检查于",
                                    value: lastChecked.formatted(date: .omitted, time: .standard)
                                )
                            }
                        }
                    }

                    TomatoPrimaryButton(
                        title: "重启 Desktop",
                        systemImage: "arrow.triangle.2.circlepath",
                        isBusy: isRestarting
                    ) {
                        Task { await restart() }
                    }

                    TomatoSecondaryButton(title: "刷新状态", systemImage: "arrow.clockwise", isEnabled: !isLoading) {
                        Task { await refresh() }
                    }

                    Text("重启走 Watchdog（独立于 Desktop 的进程），所以即使在 Host 挂死时也能用。重启期间会话会短暂中断。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)

                    if model.profile?.watchdogToken == nil {
                        TomatoCard {
                            VStack(alignment: .leading, spacing: 10) {
                                SectionHeader(title: "Watchdog 凭据") {
                                    Text("未设置").font(.caption).foregroundStyle(TomatoToken.labelDimmed)
                                }
                                Text("Watchdog 在 Host 之外运行，只认自己的令牌。把 Mac 上 `~/.tomato-watchdog/token` 的内容粘贴进来一次。")
                                    .font(.caption)
                                    .foregroundStyle(TomatoToken.labelCaption)
                                TextField("令牌", text: $tokenDraft)
                                    .textInputAutocapitalization(.never)
                                    .autocorrectionDisabled()
                                    .font(.footnote.monospaced())
                                    .padding(8)
                                    .background(TomatoToken.bgLayer2)
                                    .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
                                if let tokenError {
                                    Text(tokenError)
                                        .font(.caption)
                                        .foregroundStyle(TomatoToken.stateErrorPrimary)
                                }
                                TomatoSecondaryButton(title: "保存", systemImage: "checkmark", isEnabled: !tokenDraft.isEmpty) {
                                    do {
                                        try model.setWatchdogToken(tokenDraft)
                                        tokenDraft = ""
                                        tokenError = nil
                                        Task { await refresh() }
                                    } catch {
                                        tokenError = describe(error)
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(16)
            }
            .background(TomatoToken.bgBase)
            .navigationTitle("桌面")
            .task { await refresh() }
            .refreshable { await refresh() }
        }
    }

    private var statusBadge: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(badgeColor)
                .frame(width: 8, height: 8)
            Text(statusText)
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
        }
    }

    private var badgeColor: Color {
        if health?.isOnline == true { return TomatoToken.stateSuccessPrimary }
        if health?.isUnresponsive == true { return TomatoToken.stateErrorPrimary }
        return TomatoToken.labelDimmed
    }

    private var statusText: String {
        guard let health else { return errorMessage == nil ? "未知" : "离线" }
        if health.isOnline { return "在线" }
        if health.isUnresponsive { return "无响应" }
        return "已停止"
    }

    private func refresh() async {
        guard let hub = model.hub else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            health = try await hub.watchdogHealth()
            errorMessage = nil
        } catch {
            health = nil
            errorMessage = describe(error)
        }
        lastChecked = Date()
    }

    private func restart() async {
        guard let hub = model.hub else { return }
        isRestarting = true
        defer { isRestarting = false }
        errorMessage = nil
        do {
            try await hub.watchdogRestart()
        } catch {
            errorMessage = describe(error)
            return
        }
        // Desktop needs a moment to come back; poll instead of reporting a
        // half-restarted state.
        for _ in 0..<20 {
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            await refresh()
            if health?.isOnline == true { return }
        }
        errorMessage = "重启后 Desktop 仍未就绪"
    }
}