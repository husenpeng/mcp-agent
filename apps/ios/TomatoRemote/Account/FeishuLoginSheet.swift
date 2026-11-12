//
//  FeishuLoginSheet.swift
//  Tomato Remote
//
//  Feishu sign-in on the phone.
//
//  The Host gateway owns the OAuth exchange: its `/api/auth/start` redirects to
//  the company Feishu page and its callback writes the `tomato_session` cookie.
//  This sheet drives that flow inside one web view, injects the device's pairing
//  cookie first, and reads the session cookie back once the callback page
//  settles. No token crosses the app's own URLs.
//

import SwiftUI
import WebKit

/// Bottom sheet hosting the Host's Feishu sign-in flow.
struct FeishuLoginSheet: View {
    /// Paired Host root.
    let base: URL
    /// Device cookie minted at pairing, presented to the gateway start route.
    let pairingCookie: String
    /// Called with the gateway session value and the company gateway origin
    /// observed during the redirect.
    let onSignedIn: (String, String?) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var isLoading = true
    @State private var failure: String?
    @State private var finished = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                if let failure {
                    ErrorBanner(message: failure)
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                }
                if pairingCookie.isEmpty {
                    Text("这台手机还没有完成设备配对，登录页无法确认设备。请先在配对页连接 Host。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                ZStack(alignment: .top) {
                    FeishuWebView(
                        base: base,
                        pairingCookie: pairingCookie,
                        isLoading: $isLoading,
                        onSession: { session, origin in
                            guard !finished else { return }
                            finished = true
                            onSignedIn(session, origin)
                            dismiss()
                        },
                        onFailure: { message in
                            guard !finished else { return }
                            failure = message
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
            }
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
}

/// One WKWebView running the gateway's sign-in flow.
private struct FeishuWebView: UIViewRepresentable {
    let base: URL
    let pairingCookie: String
    @Binding var isLoading: Bool
    /// Session value and the company origin observed on the way to the callback.
    let onSession: (String, String?) -> Void
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

    /// Remove a stale account cookie, add the pairing cookie, then load the
    /// gateway start route.
    /// - Parameter webView: the web view about to load.
    private func prepareCookies(then webView: WKWebView) {
        let store = WKWebsiteDataStore.default().httpCookieStore
        let host = base.host ?? ""
        store.getAllCookies { cookies in
            let stale = cookies.filter { $0.name == "tomato_session" }
            let group = DispatchGroup()
            for cookie in stale {
                group.enter()
                store.delete(cookie) { group.leave() }
            }
            group.notify(queue: .main) {
                let load = {
                    DispatchQueue.main.async {
                        webView.load(URLRequest(url: startURL))
                    }
                }
                guard let pair = Self.cookiePair(pairingCookie),
                      let cookie = HTTPCookie(properties: [
                          .domain: host,
                          .path: "/",
                          .name: pair.name,
                          .value: pair.value,
                          .secure: base.scheme == "https",
                      ])
                else {
                    load()
                    return
                }
                store.setCookie(cookie) { load() }
            }
        }
    }

    private var startURL: URL {
        var components = URLComponents(url: base, resolvingAgainstBaseURL: false)
        components?.path = "/api/auth/start"
        components?.query = nil
        components?.fragment = nil
        return components?.url ?? base
    }

    /// Split one `name=value` cookie header pair.
    /// - Parameter header: the stored pairing cookie.
    /// - Returns: its name and value, or nil when malformed.
    private static func cookiePair(_ header: String) -> (name: String, value: String)? {
        let first = header.split(separator: ";", maxSplits: 1).first.map(String.init) ?? ""
        guard let separator = first.firstIndex(of: "=") else { return nil }
        let name = String(first[..<separator]).trimmingCharacters(in: .whitespaces)
        let value = String(first[first.index(after: separator)...]).trimmingCharacters(in: .whitespaces)
        guard !name.isEmpty, !value.isEmpty else { return nil }
        return (name, value)
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        private let parent: FeishuWebView
        /// Company BFF origin the sign-in redirect passed through.
        private var companyOrigin: String?

        init(_ parent: FeishuWebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            guard let url = webView.url else { return }
            if url.path.contains("/api/auth/feishu/start"), let scheme = url.scheme, let host = url.host {
                // Keep the port: a LAN or tunnel Host may not listen on the
                // scheme's default, and the search route lives on this origin.
                var components = URLComponents()
                components.scheme = scheme
                components.host = host
                components.port = url.port
                companyOrigin = components.url?.absoluteString
                AppLog.info(.ui, "飞书登录跳转", detail: "\(url.absoluteString) → \(companyOrigin ?? "nil")")
            }
            guard url.path.contains("/api/auth/callback") else { return }
            // The callback page replaces itself with the app root when it
            // cannot close; stop it so the session cookie is read in place.
            webView.stopLoading()
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                self.readSession(from: webView)
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
            parent.onFailure(error.localizedDescription)
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            parent.isLoading = false
            parent.onFailure(error.localizedDescription)
        }

        /// Read the gateway's HttpOnly session cookie out of the browser store.
        /// - Parameter webView: the web view that just reached the callback.
        private func readSession(from webView: WKWebView) {
            WKWebsiteDataStore.default().httpCookieStore.getAllCookies { cookies in
                let match = cookies.first { $0.name == "tomato_session" && !$0.value.isEmpty }
                DispatchQueue.main.async {
                    guard let match else {
                        self.parent.onFailure("登录页没有返回会话，请重试。")
                        return
                    }
                    self.parent.onSession(match.value, self.companyOrigin)
                }
            }
        }
    }
}
