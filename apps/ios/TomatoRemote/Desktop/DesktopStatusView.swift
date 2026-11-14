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
    @State private var hostOnline: Bool?
    @State private var desktop: DesktopStatus?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                CaptionFallback(caption: "Watchdog 独立于 Desktop 运行，所以 Host 挂死时这里仍能重启它。")

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
                        if let authority = model.profile?.authority {
                            InfoRow(label: "主机", value: authority)
                        }
                        InfoRow(label: "Host", value: hostText)
                        InfoRow(label: "Watchdog", value: watchdogText)
                        if let port = desktop?.listenPort {
                            InfoRow(label: "端口", value: String(port))
                        }
                        if let tunnel = desktop?.tunnel {
                            InfoRow(label: "隧道", value: tunnel ? "开启" : "关闭")
                        }
                        if let keepAwake = desktop?.keepAwake {
                            InfoRow(label: "保持唤醒", value: keepAwake ? "开启" : "关闭")
                        }
                        if let launchAtLogin = desktop?.launchAtLogin {
                            InfoRow(label: "登录启动", value: launchAtLogin ? "开启" : "关闭")
                        }
                        if let hosts = desktop?.trustedHosts, !hosts.isEmpty {
                            InfoRow(label: "受信主机", value: hosts.joined(separator: "、"))
                        }
                        if let version = desktop?.version {
                            InfoRow(label: "版本", value: version)
                        }
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
                    isEnabled: watchdogConfigured,
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

                if !watchdogConfigured {
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
            .padding(.horizontal, 20)
            .padding(.bottom, 28)
        }
        .background(TomatoToken.bgBase)
        .tomatoPageTitle("桌面", caption: "Watchdog 独立于 Desktop 运行，所以 Host 挂死时这里仍能重启它。")
        .navigationBarTitleDisplayMode(.large)
        .tomatoScrollEdge()
        .toolbar(.hidden, for: .tabBar)
        .task { await refresh() }
        .refreshable { await refresh() }
    }

    /// The Watchdog is a separate process on the Mac's loopback port; without
    /// its bearer token this screen can report nothing but that fact.
    private var watchdogConfigured: Bool {
        (model.profile?.watchdogToken ?? "").isEmpty == false
    }

    private var statusBadge: some View {
        StatusPill(text: statusText, tone: statusTone)
    }

    private var statusTone: StatusPill.Tone {
        guard let hostOnline else { return .idle }
        return hostOnline ? .ok : .error
    }

    /// The screen reports the Desktop itself; the Watchdog is an optional extra
    /// channel and must not turn the whole page into `未配置`.
    private var statusText: String {
        guard let hostOnline else { return "检查中" }
        return hostOnline ? "在线" : "离线"
    }

    private var watchdogText: String {
        guard watchdogConfigured else { return "未接入（可选）" }
        guard let health else { return "未连接" }
        if health.isOnline {
            return "在线"
        }
        if health.isUnresponsive {
            return "无响应"
        }
        return "已停止"
    }

    /// `可达` answers whether the paired Host still serves the session API.
    private var hostText: String {
        guard let hostOnline else { return "—" }
        return hostOnline ? "可达" : "不可达"
    }

    private func refresh() async {
        guard let hub = model.hub else { return }
        AppLog.screen("桌面状态")
        hostOnline = await (try? hub.listSessions()) != nil
        desktop = try? await hub.desktopStatus()
        guard watchdogConfigured else {
            // No token: report `未配置` instead of a 401 that would read as a
            // broken sign-in.
            health = nil
            errorMessage = nil
            lastChecked = Date()
            return
        }
        isLoading = true
        defer { isLoading = false }
        do {
            health = try await hub.watchdogHealth()
            errorMessage = nil
        } catch HubError.notFound {
            // The tunnel reaches the Host only; the Watchdog listens on the
            // Mac's own loopback port and is not part of that surface.
            health = nil
            errorMessage = "隧道里没有 Watchdog：它只在本机回环端口运行，不经过 Host。"
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
        for _ in 0 ..< 20 {
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            await refresh()
            if health?.isOnline == true {
                return
            }
        }
        errorMessage = "重启后 Desktop 仍未就绪"
    }
}
