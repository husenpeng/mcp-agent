//
//  PairingFlow.swift
//  Tomato Remote
//
//  First run: paste the `tomato web:` link the Desktop prints (or type the
//  host plus the launch token), exchange it at Connection's `/connect` route,
//  and store the resulting signed cookie in the Keychain.
//
//  The exchange is one `GET <base>/connect?token=…&interactions=answer` whose
//  `302` carries `Set-Cookie`. Following that redirect would load the GUI
//  document and discard the only response that matters, so redirects are
//  refused rather than followed.
//

import SwiftUI

struct PairingFlow: View {
    /// Text fields the keyboard toolbar can dismiss.
    private enum Field: Hashable {
        case link
        case token
    }

    @EnvironmentObject private var model: AppModel

    @State private var link: String = ""
    @State private var token: String = ""
    @FocusState private var focusedField: Field?
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @State private var isScanning = false

    private var parsed: (base: URL, token: String)? {
        PairingInput.parse(link: link, token: token)
    }

    private var canSubmit: Bool {
        parsed != nil
    }

    /// Why the primary action is unavailable. A disabled button that says nothing
    /// leaves the user guessing which half of the paste the app rejected.
    private var readiness: String? {
        let hasLink = !link.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        let hasToken = !token.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        guard hasLink || hasToken, parsed == nil else { return nil }
        guard PairingInput.urlComponents(in: link) != nil else {
            return "链接里没找到地址。形如 http://主机:端口/?token=… ，也可以只填主机、把 token 放到下一栏。"
        }
        return "地址已识别，但没找到 token：链接里没有 ?token=，下一栏也是空的。"
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header

                    TomatoCard {
                        VStack(alignment: .leading, spacing: 14) {
                            fieldTitle("连接链接")
                            TextField("http://…:43110/?token=…", text: $link)
                                .focused($focusedField, equals: .link)
                                .accessibilityIdentifier("pairing.link")
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .keyboardType(.URL)
                                .font(.callout)
                                .padding(10)
                                .background(TomatoToken.bgLayer2)
                                .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
                            Text("整段粘贴 Desktop 打印的 `tomato web: …` 链接即可，token 会自动从里面读出来。")
                                .font(.caption2)
                                .foregroundStyle(TomatoToken.labelDimmed)

                            TomatoSecondaryButton(title: "扫描二维码", systemImage: "qrcode.viewfinder") {
                                focusedField = nil
                                isScanning = true
                            }
                            .accessibilityIdentifier("pairing.scan")

                            fieldTitle("Token")
                            TextField("链接里没带 token 时填这里", text: $token)
                                .focused($focusedField, equals: .token)
                                .accessibilityIdentifier("pairing.token")
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .font(.system(.footnote, design: .monospaced))
                                .padding(10)
                                .background(TomatoToken.bgLayer2)
                                .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
                        }
                    }

                    if let errorMessage {
                        ErrorBanner(message: errorMessage)
                    }

                    TomatoPrimaryButton(
                        title: "连接",
                        systemImage: "link",
                        isEnabled: canSubmit,
                        isBusy: isSubmitting
                    ) {
                        Task { await submit() }
                    }

                    if let readiness {
                        Text(readiness)
                            .font(.caption)
                            .foregroundStyle(TomatoToken.labelCaption)
                    } else if let parsed {
                        Text("已识别：\(parsed.base.absoluteString) · token …\(parsed.token.suffix(4))")
                            .font(.caption)
                            .foregroundStyle(TomatoToken.labelDimmed)
                    }

                    hint
                }
                .padding(20)
            }
            .background(TomatoToken.bgBase.ignoresSafeArea())
            // `.immediately` fires when the scroll gesture begins; the
            // interactive mode waits for real scrolling, which a screen this
            // short never produces.
            .scrollDismissesKeyboard(.immediately)
            .scrollBounceBehavior(.always, axes: .vertical)
            // A drag that starts on a text field belongs to the field, so the
            // scroll view never sees it. Dismissing from a simultaneous drag
            // covers that case while taps still reach the controls.
            .simultaneousGesture(
                DragGesture(minimumDistance: 20)
                    .onChanged { value in
                        if value.translation.height > 20 { focusedField = nil }
                    }
            )
            .navigationTitle("连接 Desktop")
            .navigationBarTitleDisplayMode(.inline)
            .onChange(of: link) { _, text in
                // Mirror the token the link already carries into its own field,
                // so the parsed state is visible and a mostly-correct paste still
                // produces an enabled action.
                if let extracted = PairingInput.tokenInRawText(text)
                    ?? PairingInput.urlComponents(in: text).flatMap({ components in
                        components.queryItems?.first { $0.name == "token" }?.value
                    }) {
                    let cleaned = PairingInput.sanitize(extracted)
                    if !cleaned.isEmpty && cleaned != token {
                        token = cleaned
                    }
                }
            }
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button("完成") { focusedField = nil }
                }
            }
            .sheet(isPresented: $isScanning) {
                PairingScanner { code in
                    // The scanner hands back the exact string the Desktop
                    // encoded; the existing onChange mirror fills the token.
                    link = code
                    if let parsed = PairingInput.parse(link: code, token: "") {
                        token = parsed.token
                    }
                }
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Tomato Remote")
                .font(.title2.weight(.semibold))
                .foregroundStyle(TomatoToken.labelPrimary)
            Text("手机只负责发指令，任务在 Mac 上的 Desktop 里执行。")
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelCaption)
        }
    }

    /// Which binary is installed, so a stale build on the phone is obvious.
    private var buildLabel: String {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "?"
        let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "?"
        return "v\(version) (\(build))"
    }

    private var hint: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("App \(buildLabel)")
            Text("· token 是进程级的：Desktop 重启后会换一个新的，但换来的 cookie 默认 30 天有效，所以只需成功连一次。")
            Text("· cookie 和主机名绑定：把地址从 tailnet 名字改成局域网 IP，需要重新连一次。")
        }
        .font(.caption)
        .foregroundStyle(TomatoToken.labelDimmed)
    }

    private func fieldTitle(_ text: String) -> some View {
        Text(text)
            .font(.footnote.weight(.medium))
            .foregroundStyle(TomatoToken.labelCaption)
    }

    private func submit() async {
        guard let parsed else { return }
        isSubmitting = true
        errorMessage = nil
        defer { isSubmitting = false }
        do {
            try await model.pair(base: parsed.base, token: parsed.token)
        } catch {
            errorMessage = describe(error)
        }
    }
}
