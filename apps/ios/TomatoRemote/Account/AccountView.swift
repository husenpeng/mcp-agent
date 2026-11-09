//
//  AccountView.swift
//  Tomato Remote
//
//  Sign-in state and display-safe account facts. Sign-in is a Host-side OAuth
//  flow: the app opens `/api/auth/start` in an `ASWebAuthenticationSession`
//  and then reads the resulting state from the Host, because the credential
//  lives on the Host, not in this app.
//

import AuthenticationServices
import SwiftUI

struct AccountView: View {
    @EnvironmentObject private var model: AppModel

    @State private var state: AccountState?
    @State private var profile: AccountProfile?
    @State private var balance: JSONValue?
    @State private var errorMessage: String?
    @State private var isLoading = false
    @State private var isSigningIn = false
    @State private var coordinator = SignInCoordinator()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let errorMessage {
                        ErrorBanner(message: errorMessage) { Task { await load() } }
                    }

                    TomatoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "账号")
                            InfoRow(
                                label: "状态",
                                value: isLoading ? "读取中…" : (state?.isSignedIn == true ? "已登录" : "未登录")
                            )
                            if let name = profile?.displayName {
                                InfoRow(label: "昵称", value: name)
                            }
                            if let email = profile?.email {
                                InfoRow(label: "邮箱", value: email)
                            }
                            if let balanceText {
                                InfoRow(label: "余额", value: balanceText)
                            }
                        }
                    }

                    TomatoCard {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "Host")
                            InfoRow(label: "地址", value: model.hostLabel)
                            if let authority = model.profile?.authority {
                                InfoRow(label: "主机", value: authority)
                            }
                        }
                    }

                    if state?.isSignedIn == true {
                        TomatoSecondaryButton(title: "退出登录", systemImage: "rectangle.portrait.and.arrow.right", isDestructive: true) {
                            Task { await signOut() }
                        }
                    } else {
                        TomatoPrimaryButton(
                            title: "登录",
                            systemImage: "person.crop.circle.badge.checkmark",
                            isBusy: isSigningIn
                        ) {
                            Task { await signIn() }
                        }
                    }

                    TomatoSecondaryButton(title: "解除配对", systemImage: "link.badge.plus", isDestructive: true) {
                        model.unpair()
                    }

                    Text("登录在 Host 上完成，凭据不会进入这个 App。解除配对会清除本机保存的 cookie，之后需要重新输入设备码。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                .padding(16)
            }
            .background(TomatoToken.bgBase)
            .navigationTitle("账号")
            .task { await load() }
            .refreshable { await load() }
        }
    }

    private var balanceText: String? {
        guard let balance else { return nil }
        if let wallets = balance.arrayValue {
            let parts = wallets.compactMap { wallet -> String? in
                let currency = wallet["currency"]?.stringValue
                let amount = wallet["balance"]?.stringValue
                guard let amount else { return nil }
                return currency.map { "\($0) \(amount)" } ?? amount
            }
            return parts.isEmpty ? nil : parts.joined(separator: " · ")
        }
        if let amount = balance["balance"]?.stringValue {
            let currency = balance["currency"]?.stringValue
            return currency.map { "\($0) \(amount)" } ?? amount
        }
        return balance.stringValue
    }

    private func load() async {
        guard let hub = model.hub else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            state = try await hub.accountState()
            errorMessage = nil
        } catch {
            errorMessage = describe(error)
            return
        }
        guard state?.isSignedIn == true else {
            profile = nil
            balance = nil
            return
        }
        profile = try? await hub.accountProfile()
        balance = try? await hub.accountBalance()
    }

    private func signIn() async {
        guard let hub = model.hub, let base = model.profile?.url else { return }
        isSigningIn = true
        defer { isSigningIn = false }
        errorMessage = nil
        let startURL = base.appendingPathComponent("api/auth/start")
        await coordinator.present(url: startURL)
        // The credential lands on the Host, so the app polls the resulting
        // state instead of waiting for a callback scheme the Host never sends.
        for _ in 0..<60 {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            if let latest = try? await hub.accountState(), latest.isSignedIn {
                coordinator.dismiss()
                await load()
                return
            }
        }
        coordinator.dismiss()
        errorMessage = "登录未完成，请重试"
    }

    private func signOut() async {
        guard let hub = model.hub else { return }
        do {
            try await hub.signOut()
            await load()
        } catch {
            errorMessage = describe(error)
        }
    }
}

/// Thin wrapper so the view stays declarative around an imperative UIKit flow.
@MainActor
final class SignInCoordinator {
    private var session: ASWebAuthenticationSession?

    func present(url: URL) async {
        let session = ASWebAuthenticationSession(
            url: url,
            callbackURLScheme: "tomato",
            completionHandler: { _, _ in }
        )
        session.presentationContextProvider = AnchorProvider.shared
        session.prefersEphemeralWebBrowserSession = true
        self.session = session
        _ = session.start()
    }

    func dismiss() {
        session?.cancel()
        session = nil
    }
}

/// Supplies the window the authentication sheet attaches to.
final class AnchorProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = AnchorProvider()

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first { $0.activationState == .foregroundActive }
        return scene?.keyWindow ?? ASPresentationAnchor()
    }
}
