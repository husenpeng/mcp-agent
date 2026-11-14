//
//  FeishuLoginSheet.swift
//  Tomato Remote
//
//  Feishu sign-in on the phone.
//
//  The company BFF owns the Feishu OAuth exchange. This sheet loads its web
//  login in one web view, lets the owner confirm on the real Feishu page, then
//  reads the BFF's `session_id` cookie and hands that session to the account
//  store. The cookie is the success signal: the BFF writes it only after Feishu
//  authorizes the account. No app secret and no Mac are involved.
//

import SwiftUI
import WebKit

/// Bottom sheet driving the company Feishu sign-in flow.
struct FeishuLoginSheet: View {
    /// Company BFF origin.
    let base: URL
    /// Called with the session the BFF minted, and its account when the sheet
    /// already read it.
    let onSignedIn: (String, CompanyUser?) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var phase: Phase = .consent
    @State private var consent = false
    @State private var isLoading = false

    /// What the sheet is showing.
    private enum Phase: Equatable {
        /// Branding, consent, and the way into Feishu.
        case consent
        /// The BFF login running in the web view.
        case web
        /// A failure with its reason.
        case failure(String)
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                switch phase {
                case .consent:
                    consentPanel
                case .web:
                    webPanel
                case let .failure(message):
                    failurePanel(message)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .background(TomatoToken.bgBase)
            .navigationTitle("飞书登录")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                }
            }
        }
    }

    // MARK: - Consent

    private var consentPanel: some View {
        ScrollView {
            VStack(spacing: 20) {
                brand
                consentRow
                TomatoPrimaryButton(
                    title: "继续，前往飞书",
                    isEnabled: consent
                ) {
                    phase = .web
                }
                .accessibilityIdentifier("feishu.continue")
                Text("授权在飞书页面完成；确认后会回到这里，不需要连接 Mac。")
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelDimmed)
                    .multilineTextAlignment(.center)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 24)
            .padding(.top, 28)
            .padding(.bottom, 24)
        }
    }

    private var brand: some View {
        VStack(spacing: 12) {
            Image("FeishuLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 64, height: 64)
                .accessibilityHidden(true)
            Text("使用飞书账号登录")
                .font(.title3.weight(.semibold))
                .foregroundStyle(TomatoToken.labelPrimary)
            Text("用公司飞书账号验证身份。登录后 Tomato Phone 可以用公司搜索服务，账号会话只保存在这台手机的钥匙串。")
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelCaption)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity)
    }

    private var consentRow: some View {
        TomatoCard(padding: 14) {
            HStack(alignment: .top, spacing: 10) {
                Button {
                    consent.toggle()
                } label: {
                    Image(systemName: consent ? "checkmark.square.fill" : "square")
                        .font(.body)
                        .foregroundStyle(consent ? TomatoToken.brandPrimary : TomatoToken.labelDimmed)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("同意服务条款与隐私政策")
                .accessibilityValue(consent ? "已勾选" : "未勾选")
                .accessibilityIdentifier("feishu.consent")

                VStack(alignment: .leading, spacing: 4) {
                    Text("我已阅读并同意以下条款，然后继续登录：")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                    HStack(spacing: 4) {
                        legalLink("服务条款", path: "/terms-conditions")
                        Text("和")
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.labelCaption)
                        legalLink("隐私政策", path: "/privacy-policy")
                    }
                }
                Spacer(minLength: 0)
            }
        }
    }

    /// One legal document, opened outside the sign-in flow.
    /// - Parameters:
    ///   - title: link text.
    ///   - path: document route on the BFF.
    /// - Returns: the link.
    private func legalLink(_ title: String, path: String) -> some View {
        Link(title, destination: CompanyAuth.url(base: base, path: path))
            .font(.footnote.weight(.medium))
            .tint(TomatoToken.brandPrimary)
    }

    // MARK: - Web

    private var webPanel: some View {
        VStack(spacing: 0) {
            ZStack(alignment: .top) {
                FeishuWebView(
                    base: base,
                    isLoading: $isLoading,
                    onSession: { session, user in
                        onSignedIn(session, user)
                        dismiss()
                    },
                    onFailure: { message in
                        phase = .failure(message)
                    }
                )
                if isLoading {
                    ProgressView()
                        .controlSize(.small)
                        .padding(8)
                        .background(TomatoToken.bgLayer2, in: Capsule())
                        .padding(.top, 8)
                }
            }
            Text("在飞书中确认授权后会自动返回。")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelDimmed)
                .padding(.vertical, 10)
                .frame(maxWidth: .infinity)
                .background(TomatoToken.bgBase)
        }
    }

    // MARK: - Failure

    private func failurePanel(_ message: String) -> some View {
        VStack(spacing: 18) {
            Image("FeishuLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 44, height: 44)
                .opacity(0.55)
                .accessibilityHidden(true)
            ErrorBanner(message: message)
            TomatoPrimaryButton(title: "重新登录", isEnabled: true) {
                phase = .web
            }
            TomatoSecondaryButton(title: "关闭") { dismiss() }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 20)
        .padding(.top, 24)
    }
}

/// One web view running the BFF's Feishu login.
private struct FeishuWebView: UIViewRepresentable {
    let base: URL
    @Binding var isLoading: Bool
    /// Session the BFF minted, and its account when already known.
    let onSession: (String, CompanyUser?) -> Void
    let onFailure: (String) -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        prepareCookies(then: webView)
        return webView
    }

    func updateUIView(_ controller: WKWebView, context: Context) {}

    /// Remove a stale session and state cookie, then load the BFF login route.
    ///
    /// A previous sign-in may have ended on another account or expired; keeping
    /// either cookie would skip the Feishu page or fail the state check.
    /// - Parameter webView: the web view about to load.
    private func prepareCookies(then webView: WKWebView) {
        let host = base.host ?? ""
        let store = WKWebsiteDataStore.default().httpCookieStore
        store.getAllCookies { cookies in
            let stale = cookies.filter { cookie in
                guard cookie.name == CompanyAuth.sessionCookieName || cookie.name == "feishu_oauth_state" else {
                    return false
                }
                let domain = cookie.domain.trimmingCharacters(in: CharacterSet(charactersIn: "."))
                return domain == host || host.hasSuffix("." + domain)
            }
            let group = DispatchGroup()
            for cookie in stale {
                group.enter()
                store.delete(cookie) { group.leave() }
            }
            group.notify(queue: .main) {
                DispatchQueue.main.async {
                    webView.load(URLRequest(url: CompanyAuth.loginURL(base: base)))
                }
            }
        }
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        private let parent: FeishuWebView
        /// Set once the sheet has reported a session or a failure, so a second
        /// redirect cannot report twice.
        private var settled = false

        init(_ parent: FeishuWebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            guard !settled, let url = webView.url else { return }
            if let message = CompanyAuth.failureMessage(from: url) {
                settle(failure: message)
                return
            }
            guard let host = parent.base.host, url.host == host else { return }
            // The login route itself redirects to Feishu; the pages that mean
            // the exchange finished are the ones the BFF serves afterwards.
            guard url.path != CompanyAuth.loginPath, url.path != "/login" else { return }
            readSession(webView, attempt: 0)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            settle(failure: error.localizedDescription)
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            parent.isLoading = false
            settle(failure: error.localizedDescription)
        }

        /// Read the BFF session cookie once the callback page settles.
        ///
        /// A cookie here is the proof that the exchange succeeded: the BFF writes
        /// it only after Feishu returns an authorized account, and this flow
        /// cleared any earlier session before it started. `Set-Cookie` lands
        /// asynchronously in the web view's store, so an empty read is retried
        /// briefly before it is reported as a failure.
        /// - Parameters:
        ///   - webView: the web view that reached the post-login page.
        ///   - attempt: how many reads have already happened.
        private func readSession(_ webView: WKWebView, attempt: Int) {
            WKWebsiteDataStore.default().httpCookieStore.getAllCookies { cookies in
                if let cookie = CompanyAuth.sessionCookie(in: cookies, base: self.parent.base) {
                    DispatchQueue.main.async {
                        guard !self.settled else { return }
                        self.settled = true
                        self.parent.onSession(cookie.value, nil)
                    }
                    return
                }
                guard attempt < 3 else {
                    self.settle(failure: "登录页没有返回会话，请重试。")
                    return
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    self.readSession(webView, attempt: attempt + 1)
                }
            }
        }

        /// Report one failure and stop watching further redirects.
        /// - Parameter message: reason to show.
        private func settle(failure message: String) {
            guard !settled else { return }
            settled = true
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.onFailure(message)
            }
        }
    }
}
