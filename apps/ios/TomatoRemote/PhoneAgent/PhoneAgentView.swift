//
//  PhoneAgentView.swift
//  Tomato Remote
//
//  Tomato Phone: the local agent and its capability market.
//
//  The layout follows the desktop agent — a transcript, tool cards, a composer —
//  while the palette is deliberately softer than the Host client: a light
//  canvas, large white cards, and one blue-violet accent. The capability
//  market is the second half of this tab: plugins, skills, and MCP servers,
//  each of which the agent can propose from a conversation.
//

import PhotosUI
import SwiftUI
import UIKit
import UniformTypeIdentifiers

/// Tomato Phone tab: conversation and capability market.
struct PhoneAgentView: View {
    @ObservedObject private var agent = PhoneAgentModel.shared
    @ObservedObject private var store = AgentCapabilityStore.shared
    @ObservedObject private var auth = AccountAuthStore.shared
    @EnvironmentObject private var tabMenu: FloatingTabMenuState
    @State private var segment = ProcessInfo.processInfo.arguments.contains("-TOMATO_PHONE_MARKET") ? 1 : 0
    @State private var showsSettings = false
    /// Event log of the conversation on screen.
    @State private var showsAudit = false
    /// The history sheet; the header's title control opens it.
    @State private var showsConversations = false
    @State private var showsMCP = false
    @State private var showsSkill = false
    /// Company Feishu sign-in, offered in place when search needs it.
    @State private var showsLogin = false
    @State private var marketKind: AgentCapabilityKind = .mcp
    /// Catalog rows currently connecting or installing.
    @State private var installing: Set<String> = []
    /// Why the last catalog install failed; the row shows it in place.
    @State private var installError: String?
    /// The endpoint, model, and depth the next turn uses.
    @State private var config = AgentConfigStore.load()
    /// Which model picker the composer is showing, if any.
    @State private var picker: PhonePicker?
    /// Photos staged for the next prompt.
    @State private var photos: [StagedPhoto] = []
    @State private var pickerItems: [PhotosPickerItem] = []
    /// Document staged for the next prompt, already read to text.
    @State private var document: AgentDocument?
    @State private var attachError: String?
    @State private var showsImporter = false
    @State private var showsCamera = false
    @FocusState private var composerFocused: Bool
    /// Voice capture for this composer; it becomes the draft text.
    @StateObject private var dictation = VoiceDictation()
    @State private var inputMode: InputMode = .typing
    /// Upward travel of the finger on the voice bar; negative is up.
    @State private var dragUp: CGFloat = 0
    /// Coalesces streamed scroll animations.
    @State private var scrollTask: Task<Void, Never>?
    @State private var scrollWanted = false
    /// When the local agent's current turn opened, for the header's clock.
    @State private var turnStartedAt: Date?

    /// Which surface the composer shows: the text field or the voice bar.
    private enum InputMode {
        case typing
        case voice
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                header
                segmented
                if segment == 0 {
                    turnStatus
                    cacheNoticeBar
                    chat
                } else {
                    market
                }
            }
            .background(AgentTheme.canvas.ignoresSafeArea())
            .navigationBarHidden(true)
            // The composer owns the bottom edge here; the destination palette is
            // opened from a button inside it, so no strip is reserved under the
            // input for a floating ball.
            .tomatoFloatingTabs(showsBall: false)
            .sheet(isPresented: $showsAudit) {
                PhoneAuditSheet(agent: agent)
                    .tomatoSheet([.large])
            }
            .sheet(
                isPresented: $showsSettings,
                onDismiss: {
                    // The settings sheet edits the same stored model configuration;
                    // the composer's chips must not keep a snapshot taken before it.
                    config = AgentConfigStore.load()
                },
                content: { AgentModelSettingsView().tint(AgentTheme.accent) }
            )
            .sheet(isPresented: $showsConversations) {
                PhoneConversationListSheet(agent: agent)
                    .tomatoSheet([.large])
                    .task { await agent.refreshHistory() }
            }
            .sheet(isPresented: $showsMCP) {
                MCPInstallSheet(store: store)
            }
            .sheet(isPresented: $showsSkill) {
                SkillInstallSheet(store: store)
            }
            .sheet(isPresented: $showsLogin) {
                FeishuLoginSheet(base: CompanyAuth.baseURL) { session, _ in
                    auth.save(sessionId: session, searchBaseURL: CompanyAuth.baseURL.absoluteString)
                }
                .tomatoSheet([.large])
            }
            .sheet(item: $picker) { which in
                switch which {
                case .model:
                    if agent.backend == .service {
                        PhoneServiceModelSheet(agent: agent)
                            .tomatoSheet()
                    } else {
                        PhoneModelSheet(config: $config)
                            .tomatoSheet()
                    }
                case .reasoning:
                    PhoneReasoningSheet(config: $config)
                        .tomatoSheet()
                }
            }
            .fileImporter(
                isPresented: $showsImporter,
                allowedContentTypes: [.pdf, .plainText, .text],
                allowsMultipleSelection: false
            ) { result in
                read(result)
            }
            .fullScreenCover(isPresented: $showsCamera) {
                PhoneCamera(
                    onPhoto: { image in
                        showsCamera = false
                        stage(image)
                    },
                    onCancel: { showsCamera = false }
                )
                .ignoresSafeArea()
            }
            .onChange(of: config) { _, next in
                AgentConfigStore.save(next)
            }
            // The local turn is the screen's own work; count from its first
            // running frame and let the finished turn announce itself.
            .onAppear {
                if agent.isRunning, turnStartedAt == nil {
                    turnStartedAt = .now
                }
            }
            .onChange(of: agent.isRunning) { was, running in
                if running {
                    turnStartedAt = .now
                } else {
                    turnStartedAt = nil
                    if was {
                        UINotificationFeedbackGenerator().notificationOccurred(.success)
                        UIAccessibility.post(notification: .announcement, argument: "Tomato 已完成回答")
                    }
                }
            }
            .onChange(of: agent.activeConversationId) { _, _ in
                // Staged files and spoken text belong to the conversation they
                // were prepared in; a switch must not carry them across.
                draft = ""
                photos = []
                pickerItems = []
                document = nil
                attachError = nil
                dictation.cancel()
                inputMode = .typing
                composerFocused = false
            }
            .onChange(of: pickerItems) { _, items in
                guard !items.isEmpty else { return }
                let picked = items
                pickerItems = []
                loadPickedPhotos(picked)
            }
            .task {
                stageDebugStateIfAsked()
                // The history read is off the launch path; the tab starts it
                // when the person actually opens Tomato Phone.
                await agent.loadHistoryIfNeeded()
            }
            .onDisappear {
                dictation.cancel()
                scrollTask?.cancel()
                scrollTask = nil
            }
        }
    }

    /// Stage the sample attachment or open a picker a test launch asked for.
    ///
    /// Present only with `-TOMATO_PHONE_SAMPLE_PHOTO`,
    /// `-TOMATO_PHONE_SHEET <model|reasoning>`, and
    /// `-TOMATO_PHONE_HISTORY`; a release build never stages a photo or opens a
    /// sheet on its own.
    private func stageDebugStateIfAsked() {
        #if DEBUG
            let arguments = ProcessInfo.processInfo.arguments
            agent.seedSampleHistoryIfAsked()
            if arguments.contains("-TOMATO_PHONE_HISTORY") {
                showsConversations = true
            }
            if arguments.contains("-TOMATO_PHONE_SAMPLE_PHOTO"), photos.isEmpty {
                let size = CGSize(width: 900, height: 600)
                let image = UIGraphicsImageRenderer(size: size).image { context in
                    let colors = [UIColor.systemRed.cgColor, UIColor.systemOrange.cgColor] as CFArray
                    let space = CGColorSpaceCreateDeviceRGB()
                    if let gradient = CGGradient(colorsSpace: space, colors: colors, locations: [0, 1]) {
                        context.cgContext.drawLinearGradient(
                            gradient,
                            start: .zero,
                            end: CGPoint(x: size.width, y: size.height),
                            options: []
                        )
                    }
                    let label = "Tomato Phone 样张" as NSString
                    label.draw(
                        at: CGPoint(x: 40, y: 40),
                        withAttributes: [
                            .font: UIFont.systemFont(ofSize: 48, weight: .semibold),
                            .foregroundColor: UIColor.white,
                        ]
                    )
                }
                if let data = image.jpegData(compressionQuality: 0.8) {
                    photos.append(StagedPhoto(data: data))
                }
            }
            if let index = arguments.firstIndex(of: "-TOMATO_PHONE_SHEET"),
               arguments.indices.contains(index + 1)
            {
                picker = arguments[index + 1] == "reasoning" ? .reasoning : .model
            }
        #endif
    }

    // MARK: Header

    private var header: some View {
        HStack(alignment: .center, spacing: 12) {
            // The current conversation is the useful title; the destination
            // palette already names Tomato Phone, so no extra page title competes.
            Button {
                composerFocused = false
                showsConversations = true
            } label: {
                HStack(spacing: 8) {
                    IconChip(systemImage: "clock.arrow.circlepath", side: 32)
                    Text(agent.currentTitle)
                        .font(.headline)
                        .lineLimit(1)
                        .foregroundStyle(AgentTheme.ink)
                    Image(systemName: "chevron.down")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(AgentTheme.inkSecondary)
                }
                .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("会话列表")
            .accessibilityValue(agent.currentTitle)
            .accessibilityHint("打开这台手机上的历史会话")
            .accessibilityIdentifier("phone.conversations")
            Spacer(minLength: 8)
            Button {
                showsAudit = true
            } label: {
                Image(systemName: "list.bullet.rectangle")
                    .font(.body.weight(.medium))
                    .foregroundStyle(AgentTheme.inkSecondary)
                    .frame(width: 44, height: 44)
            }
            .accessibilityLabel("会话审计")
            .accessibilityIdentifier("phone.audit")
            Button {
                showsSettings = true
            } label: {
                Image(systemName: "slider.horizontal.3")
                    .font(.body.weight(.medium))
                    .foregroundStyle(AgentTheme.inkSecondary)
                    .frame(width: 44, height: 44)
                    .background(AgentTheme.surface, in: Circle())
                    .overlay(Circle().strokeBorder(AgentTheme.border, lineWidth: 1))
            }
            .buttonStyle(.plain)
            .accessibilityLabel("模型设置")
            .accessibilityIdentifier("phone.modelSettings")
        }
        .padding(.horizontal, 20)
        .padding(.top, 4)
        .padding(.bottom, 8)
    }

    /// The cache monitor's current conclusion, shown until dismissed.
    @ViewBuilder
    private var cacheNoticeBar: some View {
        if let notice = agent.cacheNotice {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: notice.severity == .warning ? "exclamationmark.triangle.fill" : "info.circle.fill")
                    .font(.caption)
                    .foregroundStyle(notice.severity == .warning ? AgentTheme.danger : AgentTheme.accent)
                VStack(alignment: .leading, spacing: 3) {
                    Text(notice.title)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AgentTheme.ink)
                        .accessibilityIdentifier("phone.cache.notice")
                    Text(notice.detail)
                        .font(.caption2)
                        .foregroundStyle(AgentTheme.inkSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Spacer(minLength: 4)
                Button {
                    agent.dismissCacheNotice()
                } label: {
                    Image(systemName: "xmark")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(AgentTheme.inkSecondary)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("phone.cache.dismiss")
            }
            .padding(12)
            .background(
                (notice.severity == .warning ? AgentTheme.danger : AgentTheme.accent).opacity(0.08),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(
                        (notice.severity == .warning ? AgentTheme.danger : AgentTheme.accent).opacity(0.25),
                        lineWidth: 0.5
                    )
            )
            .padding(.horizontal, 16)
            .padding(.bottom, 8)
        }
    }

    private var segmented: some View {
        HStack(spacing: 6) {
            segmentButton(0, "对话")
            segmentButton(1, "能力市场")
        }
        .padding(4)
        .background(AgentTheme.surfaceMuted, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding(.horizontal, 20)
        .padding(.bottom, 12)
    }

    private func segmentButton(_ value: Int, _ title: String) -> some View {
        Button {
            composerFocused = false
            withAnimation(.easeInOut(duration: 0.18)) { segment = value }
        } label: {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(segment == value ? AgentTheme.ink : AgentTheme.inkSecondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 9)
                .background(
                    segment == value ? AgentTheme.surface : Color.clear,
                    in: RoundedRectangle(cornerRadius: 12, style: .continuous)
                )
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("phone.segment.\(value)")
    }

    // MARK: Phase

    /// What the local agent is doing while a turn runs.
    private enum PhonePhase: Equatable {
        case thinking
        case writing
        case tool(String)

        var title: String {
            switch self {
            case .thinking: "Tomato 正在思考…"
            case .writing: "正在写回答…"
            case let .tool(name): "正在处理 \(name)…"
            }
        }
    }

    /// The live phase, or nil when the agent is idle.
    private var phase: PhonePhase? {
        guard agent.isRunning else { return nil }
        if !agent.streamingText.isEmpty {
            return .writing
        }
        if let last = agent.messages.last,
           last.role == .tool,
           let name = last.toolName,
           !name.isEmpty
        {
            return .tool(name)
        }
        return .thinking
    }

    /// The clock under the segmented control: without it a thinking turn looks
    /// like a stalled transcript between the last tool card and the composer.
    @ViewBuilder
    private var turnStatus: some View {
        if let phase {
            TimelineView(.periodic(from: .now, by: 1)) { context in
                HStack(spacing: 7) {
                    ProgressView()
                        .controlSize(.mini)
                        .tint(AgentTheme.accent)
                    Text(phase.title)
                        .font(.caption)
                        .foregroundStyle(AgentTheme.inkSecondary)
                        .lineLimit(1)
                    Spacer(minLength: 6)
                    if let elapsed = elapsedText(now: context.date) {
                        Text(elapsed)
                            .font(.caption2.monospacedDigit().weight(.medium))
                            .foregroundStyle(AgentTheme.accent)
                            .contentTransition(.numericText())
                    }
                }
                // One pill instead of a bare line: the running state sits in the
                // transcript like an element, not like a stray caption.
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(AgentTheme.surfaceMuted, in: Capsule())
                .overlay(Capsule().strokeBorder(AgentTheme.border.opacity(0.6), lineWidth: 0.5))
                .padding(.horizontal, 16)
                .padding(.bottom, 6)
                .accessibilityElement(children: .combine)
                .accessibilityLabel(statusLabel(phase, now: context.date))
            }
            .accessibilityIdentifier("phone.status")
        }
    }

    /// Seconds the current local turn has lasted.
    /// - Parameter now: current time from the timeline.
    /// - Returns: compact text, or nil before the turn has a start.
    private func elapsedText(now: Date) -> String? {
        guard let turnStartedAt else { return nil }
        let seconds = max(0, now.timeIntervalSince(turnStartedAt))
        let whole = Int(seconds.rounded())
        if whole < 60 {
            return "\(whole)s"
        }
        return String(format: "%dm %02ds", whole / 60, whole % 60)
    }

    /// One spoken sentence for the status row.
    /// - Parameters:
    ///   - phase: current phase.
    ///   - now: current time.
    /// - Returns: the VoiceOver label.
    private func statusLabel(_ phase: PhonePhase, now: Date) -> String {
        guard let turnStartedAt else { return phase.title }
        let seconds = Int(max(0, now.timeIntervalSince(turnStartedAt)).rounded())
        return "\(phase.title)，已用 \(seconds) 秒"
    }

    // MARK: Chat

    private var chat: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        if agent.messages.isEmpty {
                            if agent.isLoadingHistory {
                                historyLoading
                            } else {
                                greeting
                            }
                        }
                        ForEach(displayEntries) { entry in
                            switch entry {
                            case let .message(message):
                                row(message)
                                    .id(entry.id)
                            case let .process(id, items, running):
                                PhoneProcessGroup(items: items, running: running)
                                    .id(id)
                            }
                        }
                        if !agent.streamingText.isEmpty {
                            streamingRow
                                .id("streaming")
                        }
                        if let error = agent.errorMessage {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(AgentTheme.danger)
                                .padding(.horizontal, 4)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 4)
                    .padding(.bottom, 16)
                }
                .onChange(of: agent.messages.count) { _, _ in scheduleScroll(proxy) }
                // Two conversations can hold the same number of messages, so a
                // switch scrolls on its own identity rather than on the count.
                .onChange(of: agent.activeConversationId) { _, _ in scheduleScroll(proxy) }
                .onChange(of: agent.streamingText) { _, _ in scheduleScroll(proxy) }
                .onChange(of: agent.streamingReasoning) { _, _ in scheduleScroll(proxy) }
                .scrollDismissesKeyboard(.immediately)
                // A tap on the transcript belongs to the text; its links open
                // pages. The composer's collapse control and a drag still put
                // the keyboard away.
            }
            if !auth.isSignedIn {
                loginNotice
            }
            composer
        }
    }

    /// The transcript's rows: messages together with each turn's folded work.
    private var displayEntries: [PhoneTranscriptEntry] {
        PhoneTranscript.entries(
            from: agent.messages,
            liveReasoning: agent.streamingReasoning,
            isRunning: agent.isRunning
        )
    }

    /// Search needs a Feishu session, so the tab offers the sign-in in place
    /// instead of sending the owner to another page to discover the gap.
    private var loginNotice: some View {
        HStack(spacing: 10) {
            Image("FeishuLogo")
                .resizable()
                .scaledToFit()
                .frame(width: 22, height: 22)
                .accessibilityHidden(true)
            VStack(alignment: .leading, spacing: 2) {
                Text("使用公司 agent 需要飞书登录")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(AgentTheme.ink)
                Text("登录由公司飞书完成；登录后模型调用、会话与工具都在公司 agent_service。")
                    .font(.caption2)
                    .foregroundStyle(AgentTheme.inkSecondary)
            }
            Spacer(minLength: 8)
            Button("登录") { showsLogin = true }
                .font(.caption.weight(.semibold))
                .foregroundStyle(AgentTheme.accent)
                .accessibilityIdentifier("phone.login")
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
        .padding(.horizontal, 16)
        .padding(.bottom, 8)
    }

    private var greeting: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("你好，我是 Tomato")
                .font(.headline)
                .foregroundStyle(AgentTheme.ink)
            Text("我会用你配置的模型和已安装的能力帮你做事。数据来自 MCP，记忆留在个人记忆里。")
                .font(.subheadline)
                .foregroundStyle(AgentTheme.inkSecondary)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 8) {
                chip("帮我记住：我常喝美式") { agent.send("帮我记住：我常喝美式") }
                chip("你能做什么？") { agent.send("你能做什么？") }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: AgentTheme.cardRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AgentTheme.cardRadius, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
        .padding(.bottom, 4)
    }

    /// Shown while the on-disk history is being read. The greeting would claim
    /// an empty history the read has not confirmed yet.
    private var historyLoading: some View {
        HStack(spacing: 8) {
            ProgressView()
                .controlSize(.small)
            Text("正在载入本机会话…")
                .font(.subheadline)
                .foregroundStyle(AgentTheme.inkSecondary)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: AgentTheme.cardRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AgentTheme.cardRadius, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
        .accessibilityIdentifier("phone.history.loading")
        .padding(.bottom, 4)
    }

    private func chip(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.caption.weight(.medium))
                .foregroundStyle(AgentTheme.accent)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(AgentTheme.accent.opacity(0.08), in: Capsule())
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func row(_ message: AgentMessage) -> some View {
        switch message.role {
        case .user:
            userRow(message)
        case .assistant:
            assistantRow(message)
        case .tool:
            // Tool results are folded into the turn's process row.
            EmptyView()
        case .proposal:
            proposalCard(message)
        }
    }

    /// One assistant answer. Its thinking and tool work live in the turn's folded
    /// process row, built by `PhoneTranscript`.
    /// - Parameter message: the assistant message.
    @ViewBuilder
    private func assistantRow(_ message: AgentMessage) -> some View {
        if !message.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            answerBlock {
                assistantBubble(message.text)
            }
            .contextMenu {
                Button("复制") { UIPasteboard.general.string = message.text }
            }
            .accessibilityIdentifier("phone.message.assistant.\(message.id)")
        }
    }

    /// One answer with the phone's mark in the gutter, so a reply reads as the
    /// assistant speaking rather than as a floating card.
    /// - Parameter content: the bubble the answer draws.
    /// - Returns: the marked row.
    private func answerBlock(@ViewBuilder content: () -> some View) -> some View {
        HStack(alignment: .top, spacing: 8) {
            assistantMark
                .padding(.top, 2)
            content()
                .frame(maxWidth: 560, alignment: .leading)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Small identity mark beside an answer: brand red, one letter, no pretence
    /// at being a logo.
    private var assistantMark: some View {
        IconChip(systemImage: "sparkles", side: 24)
    }

    /// One answer bubble. The font is the transcript size, so a long turn scans
    /// like a conversation instead of a document.
    ///
    /// The local agent writes the same Markdown the Host one does, including
    /// fenced diagrams; drawing it through `MarkdownView` gives the phone the
    /// same headings, code, and Mermaid rendering instead of one text run.
    /// - Parameter text: Markdown the model wrote.
    private func assistantBubble(_ text: String) -> some View {
        phoneBubble {
            MarkdownView(text: text)
        }
    }

    /// The answer while it arrives, before the final Markdown pass.
    ///
    /// A partial fence would make the diagram renderer work on every chunk, so
    /// the live text stays one inline run and becomes the richer bubble once the
    /// message settles.
    /// - Parameter text: text streamed so far.
    private func streamingBubble(_ text: String) -> some View {
        phoneBubble {
            markdown(text)
                .font(AgentTheme.messageFont)
                .lineSpacing(2)
                .foregroundStyle(AgentTheme.ink)
        }
    }

    /// Surface shared by the finished and streaming answer bubbles.
    /// - Parameter content: what the bubble draws.
    /// - Returns: the content on the phone's card surface.
    private func phoneBubble(@ViewBuilder content: () -> some View) -> some View {
        content()
            .padding(.horizontal, 13)
            .padding(.vertical, 11)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: AgentTheme.bubbleRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AgentTheme.bubbleRadius, style: .continuous)
                    .strokeBorder(AgentTheme.border, lineWidth: 1)
            )
    }

    /// The answer as it arrives. It occupies the same bubble the finished row
    /// will, with a cursor-like dot so a slow first token still shows activity.
    private var streamingRow: some View {
        answerBlock {
            phoneBubble {
                HStack(alignment: .lastTextBaseline, spacing: 2) {
                    markdown(agent.streamingText)
                        .font(AgentTheme.messageFont)
                        .lineSpacing(2)
                        .foregroundStyle(AgentTheme.ink)
                    // A caret, not an animation: the phone's own frame probe and
                    // UI tests treat a forever-running animation as a hang.
                    RoundedRectangle(cornerRadius: 1, style: .continuous)
                        .fill(AgentTheme.accent.opacity(0.85))
                        .frame(width: 2, height: 14)
                        .accessibilityHidden(true)
                }
            }
        }
        .accessibilityIdentifier("phone.streaming")
    }

    /// One owner turn: staged photos first, then a document badge, then the text
    /// bubble. A prompt may carry any subset.
    /// - Parameter message: the user turn.
    private func userRow(_ message: AgentMessage) -> some View {
        let files = message.attachmentList
        let images = files.filter { $0.kind == .image }
        let documents = files.filter { $0.kind == .document }
        return VStack(alignment: .trailing, spacing: 8) {
            if !images.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(images) { attachment in
                            AgentPhotoTile(attachment: attachment, agent: agent)
                        }
                    }
                }
                .frame(maxWidth: 300, alignment: .trailing)
            }
            ForEach(documents) { attachment in
                HStack(spacing: 6) {
                    Image(systemName: "doc.text")
                    Text(attachment.name)
                        .lineLimit(1)
                    Text(ByteCountFormatter.string(fromByteCount: Int64(attachment.byteCount), countStyle: .file))
                        .foregroundStyle(AgentTheme.inkSecondary)
                }
                .font(.caption)
                .foregroundStyle(AgentTheme.inkSecondary)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(AgentTheme.surface, in: Capsule())
                .overlay(Capsule().strokeBorder(AgentTheme.border, lineWidth: 1))
            }
            if !message.text.isEmpty {
                Text(message.text)
                    .font(AgentTheme.messageFont)
                    .lineSpacing(2)
                    .foregroundStyle(TomatoContainer.primary.label)
                    .padding(.horizontal, 13)
                    .padding(.vertical, 10)
                    .background(
                        TomatoContainer.primary.fill,
                        in: UnevenRoundedRectangle(
                            topLeadingRadius: AgentTheme.bubbleRadius,
                            bottomLeadingRadius: AgentTheme.bubbleRadius,
                            bottomTrailingRadius: 6,
                            topTrailingRadius: AgentTheme.bubbleRadius,
                            style: .continuous
                        )
                    )
                    .contextMenu {
                        Button("复制") { UIPasteboard.general.string = message.text }
                    }
                    .accessibilityIdentifier("phone.message.user.\(message.id)")
            }
        }
        .frame(maxWidth: 300, alignment: .trailing)
        .frame(maxWidth: .infinity, alignment: .trailing)
    }

    /// Basic markdown the model commonly writes: bold spans, line breaks.
    private func markdown(_ text: String) -> Text {
        if let attributed = try? AttributedString(
            markdown: text,
            options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        ) {
            return Text(attributed)
        }
        return Text(text)
    }

    private func proposalCard(_ message: AgentMessage) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: message.proposal?.kind.symbol ?? "plus.circle")
                    .foregroundStyle(AgentTheme.accent)
                Text("添加能力：\(message.proposal?.name ?? "")")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(AgentTheme.ink)
            }
            Text(message.proposal?.summary ?? "")
                .font(.caption)
                .foregroundStyle(AgentTheme.inkSecondary)
            Button {
                guard let proposal = message.proposal else { return }
                Task { await agent.install(proposal) }
            } label: {
                Text("添加")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(AgentTheme.accentGradient, in: Capsule())
            }
            .buttonStyle(.plain)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(AgentTheme.accent.opacity(0.25), lineWidth: 1)
        )
    }

    /// The service is waiting on a tool approval; both decisions are explicit.
    /// - Parameter approval: the pending request.
    private func approvalBar(_ approval: AgentServiceApproval) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("服务端要执行：\(approval.toolName)")
                .font(.caption.weight(.medium))
                .foregroundStyle(AgentTheme.ink)
            Text("风险：\(approval.risk)")
                .font(.caption2)
                .foregroundStyle(AgentTheme.inkSecondary)
            HStack(spacing: 10) {
                Button("拒绝") { agent.rejectPendingApproval() }
                    .buttonStyle(.bordered)
                    .accessibilityIdentifier("phone.approval.reject")
                Button("允许") { agent.approvePendingApproval() }
                    .buttonStyle(.borderedProminent)
                    .accessibilityIdentifier("phone.approval.approve")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal, 16)
    }

    private var composer: some View {
        VStack(spacing: 8) {
            if let approval = agent.pendingApproval {
                approvalBar(approval)
            }
            if let attachError {
                Text(attachError)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.danger)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .accessibilityIdentifier("phone.composer.error")
            }
            if !photos.isEmpty {
                photoStrip
            }
            if let document {
                documentChip(document)
            }
            if let failure = dictation.failure {
                Text(failure)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.danger)
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if let hint = dictation.hint {
                Text(hint)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.inkSecondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            if dictation.isActive, dictation.phase != .preparing {
                VoiceCapturePanel(
                    live: dictation.live,
                    phase: dictation.phase,
                    startedAt: dictation.startedAt,
                    isCancelling: dragUp <= -VoiceDictation.cancelDistance,
                    isHandsFree: dictation.isHandsFree,
                    isPreviewing: dictation.isPreviewing,
                    onCancel: { dictation.cancel() },
                    onFinish: { finishVoice() }
                )
            }
            VStack(alignment: .leading, spacing: 6) {
                modelRow
                HStack(alignment: .bottom, spacing: 8) {
                    if inputMode == .typing {
                        inputField
                    } else {
                        VoiceInputBar(
                            dictation: dictation,
                            dragUp: $dragUp,
                            identifier: "phone.composer.holdToTalk",
                            onFinish: finishVoice,
                            onCancel: { dictation.cancel() }
                        )
                    }
                    sendButton
                }
                toolbar
            }
            .padding(12)
            .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: AgentTheme.cardRadius, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: AgentTheme.cardRadius, style: .continuous)
                    .strokeBorder(
                        composerFocused ? TomatoLine.brandSoft : AgentTheme.border,
                        lineWidth: 1
                    )
            )
            .shadow(
                color: TomatoShadow.flat.color,
                radius: TomatoShadow.flat.radius,
                y: TomatoShadow.flat.y
            )
            .animation(.easeOut(duration: 0.16), value: composerFocused)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(AgentTheme.canvas.ignoresSafeArea(edges: .bottom))
    }

    @State private var draft = ""

    // MARK: Composer

    /// The model and reasoning chips: each opens its own sheet, because the two
    /// choices are independent.
    private var modelRow: some View {
        HStack(spacing: 6) {
            ModelChoiceChip(title: AgentBackendStore.serviceModelRoute ?? "默认模型", identifier: "phone.composer.model") {
                composerFocused = false
                picker = .model
            }
            .layoutPriority(1)
            Spacer(minLength: 0)
            Button {
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                withAnimation(.spring(response: 0.34, dampingFraction: 0.82)) {
                    tabMenu.expanded = true
                }
            } label: {
                Image(systemName: "square.grid.2x2")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(AgentTheme.accent)
                    .frame(width: 30, height: 30)
                    .background(AgentTheme.surfaceMuted, in: Circle())
                    .frame(width: 44, height: 32)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("切换页面")
            .accessibilityHint("打开页面列表")
            .accessibilityIdentifier("phone.tabMenu")
        }
        .padding(.horizontal, 2)
        .padding(.top, 2)
    }

    private var inputField: some View {
        TextField("问点什么，或者让我记住一件事", text: $draft, axis: .vertical)
            .lineLimit(1 ... 4)
            .focused($composerFocused)
            .font(AgentTheme.inputFont)
            .padding(.horizontal, 6)
            .padding(.top, 4)
            .accessibilityIdentifier("phone.composer.input")
    }

    /// Photo library, camera, document, and the way back out of the keyboard.
    private var toolbar: some View {
        HStack(spacing: 8) {
            PhotosPicker(
                selection: $pickerItems,
                maxSelectionCount: max(1, 4 - photos.count),
                matching: .images
            ) {
                composerIcon("photo.on.rectangle")
            }
            .buttonStyle(.plain)
            .disabled(photos.count >= 4)
            .accessibilityLabel("附加照片")
            .accessibilityIdentifier("phone.composer.photo")

            Button(action: openCamera) {
                composerIcon("camera")
            }
            .buttonStyle(.plain)
            .accessibilityLabel("拍照")
            .accessibilityIdentifier("phone.composer.camera")

            Button {
                composerFocused = false
                showsImporter = true
            } label: {
                composerIcon("paperclip")
            }
            .buttonStyle(.plain)
            .accessibilityLabel("附加文档")
            .accessibilityIdentifier("phone.composer.document")

            if inputMode == .typing {
                Button(action: enterVoiceMode) {
                    composerIcon("mic")
                }
                .buttonStyle(.plain)
                .accessibilityLabel("语音输入")
                .accessibilityIdentifier("phone.composer.mic")
            } else {
                Button(action: leaveVoiceMode) {
                    composerIcon("keyboard")
                }
                .buttonStyle(.plain)
                .accessibilityLabel("切回键盘")
                .accessibilityIdentifier("phone.composer.keyboard")
            }

            Spacer(minLength: 0)

            if composerFocused, inputMode == .typing {
                Button {
                    composerFocused = false
                } label: {
                    composerIcon("keyboard.chevron.compact.down")
                }
                .buttonStyle(.plain)
                .accessibilityLabel("收起输入框")
                .accessibilityIdentifier("phone.composer.collapse")
            }
        }
    }

    /// One 34-point tap target in the composer's toolbar.
    /// - Parameter name: SF Symbol.
    private func composerIcon(_ name: String) -> some View {
        Image(systemName: name)
            .font(.body)
            .foregroundStyle(AgentTheme.inkSecondary)
            .frame(width: 34, height: 34)
            .contentShape(Circle())
    }

    @ViewBuilder
    private var sendButton: some View {
        let hasContent = !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || !photos.isEmpty
            || document != nil
        Button {
            if agent.isRunning {
                agent.stop()
            } else {
                send()
            }
        } label: {
            Image(systemName: agent.isRunning ? "stop.fill" : "arrow.up")
                .font(.footnote.weight(.bold))
                .foregroundStyle(agent.isRunning || hasContent ? Color.white : AgentTheme.inkSecondary)
                .frame(width: 38, height: 38)
                .background {
                    if agent.isRunning {
                        Circle().fill(AgentTheme.accent)
                    } else if hasContent {
                        Circle().fill(AgentTheme.accentGradient)
                    } else {
                        Circle().fill(AgentTheme.surfaceMuted)
                    }
                }
        }
        .buttonStyle(.plain)
        .disabled(!agent.isRunning && !hasContent)
        .accessibilityLabel(agent.isRunning ? "停止" : "发送")
        .accessibilityIdentifier("phone.composer.send")
    }

    /// Staged photos with a way to drop each one.
    private var photoStrip: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(photos) { photo in
                    ZStack(alignment: .topTrailing) {
                        if let image = photo.image {
                            Image(uiImage: image)
                                .resizable()
                                .scaledToFill()
                                .frame(width: 56, height: 56)
                                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                                        .strokeBorder(AgentTheme.border, lineWidth: 1)
                                )
                        }
                        Button {
                            photos.removeAll { $0.id == photo.id }
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.footnote)
                                .foregroundStyle(AgentTheme.inkSecondary)
                                .background(Circle().fill(AgentTheme.surface))
                        }
                        .buttonStyle(.plain)
                        .offset(x: 5, y: -5)
                        .accessibilityLabel("移除照片")
                    }
                }
            }
            .padding(.top, 5)
            .padding(.trailing, 6)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Staged document, shown by name so the owner knows what rides along.
    /// - Parameter document: the file already read to text.
    private func documentChip(_ document: AgentDocument) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "doc.text")
                .font(.footnote)
                .foregroundStyle(AgentTheme.accent)
            VStack(alignment: .leading, spacing: 2) {
                Text(document.name)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.ink)
                    .lineLimit(1)
                Text(document.truncated
                    ? "已保留前 6 万字 · \(Self.byteCount(document.byteCount))"
                    : Self.byteCount(document.byteCount))
                    .font(.caption2)
                    .foregroundStyle(AgentTheme.inkSecondary)
            }
            Spacer(minLength: 0)
            Button {
                self.document = nil
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(AgentTheme.inkSecondary)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("移除文档")
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Hand the staged prompt to the agent, then put the dock back in its
    /// one-line state with the keyboard down.
    /// Replace the field with the hold-to-talk bar and ask for permission.
    private func enterVoiceMode() {
        guard inputMode == .typing else { return }
        inputMode = .voice
        composerFocused = false
        Task { await dictation.prepare() }
    }

    /// Return to typing without committing anything the microphone heard.
    private func leaveVoiceMode() {
        dictation.cancel()
        inputMode = .typing
        composerFocused = true
    }

    /// Put the spoken sentence at the end of the draft for review.
    private func finishVoice() {
        Task { @MainActor in
            let capture = await dictation.finish()
            guard capture.text != nil || capture.audio != nil else { return }
            guard let spoken = capture.text, !spoken.isEmpty else {
                dictation.note("没有听清，请再说一次")
                return
            }
            draft = VoiceTranscription.merged(into: draft, spoken)
            inputMode = .typing
            composerFocused = true
        }
    }

    /// Scroll once per burst: streaming text changes many times per second and
    /// an animation per token makes the transcript stutter.
    /// - Parameter proxy: the transcript's scroll proxy.
    private func scheduleScroll(_ proxy: ScrollViewProxy) {
        scrollWanted = true
        guard scrollTask == nil else { return }
        scrollTask = Task { @MainActor in
            while scrollWanted {
                scrollWanted = false
                try? await Task.sleep(nanoseconds: 100_000_000)
                let target: AnyHashable? = agent.streamingText.isEmpty
                    ? displayEntries.last.map { AnyHashable($0.id) }
                    : AnyHashable("streaming")
                guard let target else { continue }
                withAnimation(.easeOut(duration: 0.12)) {
                    proxy.scrollTo(target, anchor: .bottom)
                }
            }
            scrollTask = nil
        }
    }

    private func send() {
        let text = draft
        let images = photos.map(\.data)
        let file = document
        guard !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            || !images.isEmpty
            || file != nil
        else { return }
        UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
        dictation.cancel()
        inputMode = .typing
        draft = ""
        photos = []
        pickerItems = []
        document = nil
        attachError = nil
        composerFocused = false
        agent.send(text, images: images, document: file)
    }

    private func openCamera() {
        guard PhoneCamera.isAvailable else {
            attachError = "这台设备没有可用的相机"
            return
        }
        composerFocused = false
        attachError = nil
        showsCamera = true
    }

    /// Downscale a capture or library photo and stage it.
    /// - Parameter image: the full-size image.
    private func stage(_ image: UIImage) {
        guard photos.count < 4 else {
            attachError = "一次最多带 4 张照片"
            return
        }
        guard let data = ComposerView.prepare(image) else {
            attachError = "无法压缩这张照片"
            return
        }
        attachError = nil
        photos.append(StagedPhoto(data: data))
    }

    /// Load and stage each picked library photo.
    /// - Parameter items: picker selection.
    private func loadPickedPhotos(_ items: [PhotosPickerItem]) {
        Task { @MainActor in
            for item in items {
                guard photos.count < 4 else {
                    attachError = "一次最多带 4 张照片"
                    break
                }
                do {
                    guard let original = try await item.loadTransferable(type: Data.self),
                          let image = UIImage(data: original)
                    else {
                        attachError = "无法读取这张照片"
                        continue
                    }
                    stage(image)
                } catch {
                    attachError = error.localizedDescription
                }
            }
        }
    }

    /// Read a chosen document while its security scope is open.
    /// - Parameter result: the file importer's result.
    private func read(_ result: Result<[URL], Error>) {
        switch result {
        case let .success(urls):
            guard let url = urls.first else { return }
            let accessed = url.startAccessingSecurityScopedResource()
            Task { @MainActor in
                defer {
                    if accessed {
                        url.stopAccessingSecurityScopedResource()
                    }
                }
                do {
                    let file = try await Task.detached { try PhoneDocumentReader.read(url) }.value
                    document = file
                    attachError = nil
                } catch {
                    attachError = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
                }
            }
        case let .failure(error):
            attachError = error.localizedDescription
        }
    }

    private static func byteCount(_ bytes: Int) -> String {
        ByteCountFormatter.string(fromByteCount: Int64(bytes), countStyle: .file)
    }

    // MARK: Market

    private var market: some View {
        VStack(spacing: 0) {
            HStack(spacing: 6) {
                ForEach(AgentCapabilityKind.allCases) { kind in
                    Button {
                        withAnimation(.easeInOut(duration: 0.16)) { marketKind = kind }
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: kind.symbol)
                            Text(kind.title)
                        }
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(marketKind == kind ? AgentTheme.accent : AgentTheme.inkSecondary)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(
                            marketKind == kind ? AgentTheme.accent.opacity(0.10) : AgentTheme.surface,
                            in: Capsule()
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("market.kind.\(kind.rawValue)")
                }
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 8)

            ScrollView {
                LazyVStack(spacing: 12) {
                    if installed(for: marketKind).isEmpty {
                        Text(emptyText(for: marketKind))
                            .font(.caption)
                            .foregroundStyle(AgentTheme.inkSecondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(16)
                            .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                    }
                    ForEach(installed(for: marketKind)) { capability in
                        capabilityCard(capability)
                    }
                    recommended
                    addCard
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 24)
            }
        }
    }

    private func installed(for kind: AgentCapabilityKind) -> [AgentCapability] {
        store.items.filter { $0.kind == kind }
    }

    private func emptyText(for kind: AgentCapabilityKind) -> String {
        switch kind {
        case .plugin: "还没有插件。插件把技能和 MCP 组合成一套能力。"
        case .skill: "还没有 Skill。Skill 是给 agent 的指令包，不执行代码。"
        case .mcp: "还没有 MCP。MCP 提供远程工具，所有外部数据都从这里来。"
        }
    }

    private func capabilityCard(_ capability: AgentCapability) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: capability.kind.symbol)
                .font(.body)
                .foregroundStyle(AgentTheme.accent)
                .frame(width: 38, height: 38)
                .background(AgentTheme.accent.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(capability.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(AgentTheme.ink)
                    Text("v\(capability.version)")
                        .font(.caption2)
                        .foregroundStyle(AgentTheme.inkSecondary)
                }
                Text(capability.summary)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.inkSecondary)
                    .lineLimit(2)
                if !capability.tools.isEmpty {
                    Text("\(capability.tools.count) 个工具")
                        .font(.caption2)
                        .foregroundStyle(AgentTheme.accent)
                }
            }
            Spacer(minLength: 4)
            VStack(spacing: 8) {
                Toggle("", isOn: Binding(
                    get: { capability.enabled },
                    set: { store.setEnabled(capability, $0) }
                ))
                .labelsHidden()
                .tint(AgentTheme.accent)
                Button {
                    store.remove(capability)
                } label: {
                    Image(systemName: "trash")
                        .font(.caption)
                        .foregroundStyle(AgentTheme.inkSecondary)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(14)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
    }

    @ViewBuilder
    private var addCard: some View {
        switch marketKind {
        case .mcp:
            Button { showsMCP = true } label: { addLabel("添加 MCP 服务器", "连接远程工具服务器") }
                .buttonStyle(.plain)
        case .skill:
            Button { showsSkill = true } label: { addLabel("添加 Skill", "写入一段给 agent 的指令") }
                .buttonStyle(.plain)
        case .plugin:
            Button {
                Task {
                    _ = try? await store.installPlugin(AgentPluginManifest(
                        name: "外卖订单助手",
                        version: "1.0",
                        summary: "把订单查询技能与 MCP 工具组合成一套能力。",
                        skillText: "查订单时先确认平台（淘宝闪购/外卖）与时间范围，再调用订单工具；只读，不下单不支付。",
                        mcpURL: nil,
                        mcpName: nil
                    ))
                }
            } label: { addLabel("安装示例插件", "技能 + MCP 的声明式组合") }
                .buttonStyle(.plain)
        }
    }

    private func addLabel(_ title: String, _ subtitle: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "plus")
                .font(.body.weight(.semibold))
                .foregroundStyle(AgentTheme.accent)
                .frame(width: 38, height: 38)
                .background(AgentTheme.accent.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(AgentTheme.ink)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.inkSecondary)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(AgentTheme.inkSecondary)
        }
        .padding(14)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
    }

    /// Open-source capabilities the app knows how to install itself.
    private var recommended: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("推荐安装")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(AgentTheme.ink)
                .frame(maxWidth: .infinity, alignment: .leading)
            Text("内置的开源 Skill、公开 MCP 端点与组合插件，点一下就能安装。")
                .font(.caption2)
                .foregroundStyle(AgentTheme.inkSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            if let installError {
                Text(installError)
                    .font(.caption2)
                    .foregroundStyle(AgentTheme.danger)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            ForEach(CapabilityCatalog.entries(for: marketKind)) { entry in
                catalogCard(entry)
            }
        }
        .padding(.top, 4)
    }

    /// One catalog row: what it is, where it comes from, and its install action.
    /// - Parameter entry: shipped capability declaration.
    private func catalogCard(_ entry: CapabilityCatalogEntry) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: entry.kind.symbol)
                .font(.body)
                .foregroundStyle(AgentTheme.accent)
                .frame(width: 38, height: 38)
                .background(AgentTheme.accent.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(entry.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(AgentTheme.ink)
                        .accessibilityIdentifier("market.recommend.\(entry.id)")
                    Text("v\(entry.version)")
                        .font(.caption2)
                        .foregroundStyle(AgentTheme.inkSecondary)
                }
                Text(entry.summary)
                    .font(.caption)
                    .foregroundStyle(AgentTheme.inkSecondary)
                    .lineLimit(3)
                VStack(alignment: .leading, spacing: 2) {
                    if let url = URL(string: entry.sourceURL) {
                        Link(entry.sourceName, destination: url)
                            .font(.caption2)
                            .foregroundStyle(AgentTheme.accent)
                            .lineLimit(1)
                    } else {
                        Text(entry.sourceName)
                            .font(.caption2)
                            .foregroundStyle(AgentTheme.accent)
                            .lineLimit(1)
                    }
                    Text(entry.license)
                        .font(.caption2)
                        .foregroundStyle(AgentTheme.inkSecondary)
                        .lineLimit(1)
                }
            }
            Spacer(minLength: 4)
            installControl(entry)
        }
        .padding(14)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
    }

    /// Install, installing, or already present.
    /// - Parameter entry: catalog row the owner may add.
    @ViewBuilder
    private func installControl(_ entry: CapabilityCatalogEntry) -> some View {
        if isInstalled(entry) {
            Label("已安装", systemImage: "checkmark.circle.fill")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(AgentTheme.success)
                .accessibilityIdentifier("market.installed.\(entry.id)")
        } else if installing.contains(entry.id) {
            ProgressView()
                .controlSize(.small)
                .accessibilityIdentifier("market.installing.\(entry.id)")
        } else {
            Button("安装") {
                install(entry)
            }
            .font(.caption.weight(.semibold))
            .buttonStyle(.bordered)
            .tint(AgentTheme.accent)
            .controlSize(.small)
            .accessibilityIdentifier("market.install.\(entry.id)")
        }
    }

    /// Whether a catalog row is already in the capability table.
    /// - Parameter entry: catalog row.
    /// - Returns: true when the skill, MCP endpoint, or plugin is present.
    private func isInstalled(_ entry: CapabilityCatalogEntry) -> Bool {
        switch entry.kind {
        case .mcp:
            store.items.contains { $0.kind == .mcp && $0.mcpURL == entry.mcpURL }
        case .skill:
            store.items.contains { $0.kind == .skill && $0.name == entry.name }
        case .plugin:
            store.items.contains { $0.kind == .plugin && $0.name == entry.name }
        }
    }

    /// Install one catalog row; remote entries connect before they appear.
    /// - Parameter entry: shipped capability declaration.
    private func install(_ entry: CapabilityCatalogEntry) {
        installError = nil
        switch entry.kind {
        case .skill:
            guard let text = entry.skillText else { return }
            store.installSkill(name: entry.name, text: text)
        case .mcp, .plugin:
            guard !installing.contains(entry.id) else { return }
            installing.insert(entry.id)
            Task {
                defer { installing.remove(entry.id) }
                do {
                    if entry.kind == .plugin {
                        _ = try await store.installPlugin(entry.manifest)
                    } else if let url = entry.mcpURL {
                        _ = try await store.installMCP(urlString: url, name: entry.name, token: "")
                    }
                } catch {
                    installError = "\(entry.name)：\(error.localizedDescription)"
                }
            }
        }
    }
}

// MARK: - Model settings}

// MARK: - Model settings

/// Model endpoint, key, and model id for the local agent.
struct AgentModelSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var agent = PhoneAgentModel.shared
    @ObservedObject private var auth = AccountAuthStore.shared
    @State private var showsLogin = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    LabeledContent("运行位置", value: "公司 agent_service")
                    if auth.isSignedIn {
                        LabeledContent("账号", value: "已登录")
                        Button("退出登录", role: .destructive) {
                            auth.clear()
                            agent.startNewConversation()
                        }
                    } else {
                        Button("飞书登录") { showsLogin = true }
                            .accessibilityIdentifier("phone.settings.login")
                    }
                } header: {
                    Text("Agent")
                } footer: {
                    Text("模型调用、工具与会话都在公司 agent_service；手机不保存模型 Key。")
                }

                Section {
                    LabeledContent("当前模型", value: AgentBackendStore.serviceModelRoute ?? "服务端默认")
                } header: {
                    Text("模型")
                } footer: {
                    Text("在对话页的模型芯片里切换；选择会写回当前会话，下一条消息生效。")
                }

                Section {
                    LabeledContent("服务端", value: AgentBackendStore.serviceBase.host ?? "测试环境")
                } header: {
                    Text("连接")
                } footer: {
                    Text("固定接入公司 agent_service 测试服务端，无需配置地址。")
                }
            }
            .navigationTitle("Tomato Phone 设置")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("完成") { dismiss() }
                }
            }
            .sheet(isPresented: $showsLogin) {
                FeishuLoginSheet(base: CompanyAuth.baseURL) { session, _ in
                    auth.save(sessionId: session, searchBaseURL: CompanyAuth.baseURL.absoluteString)
                    Task { await agent.refreshServiceConversations() }
                }
                .tomatoSheet([.large])
            }
            .presentationDragIndicator(.visible)
        }
    }
}

// MARK: - Install sheets

/// Add one MCP server by endpoint.
struct MCPInstallSheet: View {
    @ObservedObject var store: AgentCapabilityStore
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var url = ""
    @State private var token = ""
    @State private var busy = false
    @State private var failure: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("名称", text: $name)
                    TextField("https://… 或 http://…", text: $url)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .keyboardType(.URL)
                    SecureField("Bearer Token（可选）", text: $token)
                } header: {
                    Text("MCP 服务器")
                } footer: {
                    Text("只支持远程 HTTP（Streamable HTTP）。添加时会连接服务器并读取工具列表。")
                }
                if let failure {
                    Section { Text(failure).foregroundStyle(AgentTheme.danger).font(.footnote) }
                }
                Section {
                    Button(busy ? "连接中…" : "连接并添加") { Task { await install() } }
                        .disabled(busy || url.isEmpty)
                }
            }
            .scrollDismissesKeyboard(.immediately)
            .presentationDragIndicator(.visible)
            .navigationTitle("添加 MCP")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } } }
        }
    }

    private func install() async {
        busy = true
        defer { busy = false }
        do {
            try await store.installMCP(urlString: url, name: name, token: token)
            dismiss()
        } catch {
            failure = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}

/// Add one skill as instructions.
struct SkillInstallSheet: View {
    @ObservedObject var store: AgentCapabilityStore
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var text = ""

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("名称", text: $name)
                    TextField("给 agent 的指令…", text: $text, axis: .vertical)
                        .lineLimit(4 ... 10)
                } header: {
                    Text("Skill")
                } footer: {
                    Text("Skill 只影响 agent 的提示词，不执行任何代码。")
                }
                Section {
                    Button("添加") {
                        store.installSkill(name: name, text: text)
                        dismiss()
                    }
                    .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
            .scrollDismissesKeyboard(.immediately)
            .presentationDragIndicator(.visible)
            .navigationTitle("添加 Skill")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("取消") { dismiss() } } }
        }
    }
}

// MARK: - Staged photos

/// One JPEG staged for the next Tomato Phone prompt.
private struct StagedPhoto: Identifiable, Equatable {
    let id = UUID()
    let data: Data
    /// Decoded once at staging: the strip and the send path both reuse it, so a
    /// keystroke no longer re-decodes every staged photo.
    let image: UIImage?

    init(data: Data) {
        self.data = data
        image = UIImage(data: data)
    }

    static func == (lhs: StagedPhoto, rhs: StagedPhoto) -> Bool {
        lhs.id == rhs.id && lhs.data == rhs.data
    }
}

/// One attached photo in a transcript row, decoded off the main thread at the
/// size it is drawn.
///
/// The row used to read the file and decode the full-resolution JPEG inside
/// `body`, once per photo per evaluation; a 12 MP pick is tens of milliseconds
/// of main-thread work for a 156 pt tile. Decoded tiles are shared through one
/// cache keyed by the attachment's identity.
private struct AgentPhotoTile: View {
    let attachment: AgentAttachment
    let agent: PhoneAgentModel

    @State private var image: UIImage?

    /// Decoded tiles shared by every row; the transcript holds few distinct
    /// photos and each is immutable once attached. Bounded so a photo-heavy
    /// history cannot grow without limit between memory warnings.
    private static let cache: NSCache<NSString, UIImage> = {
        let cache = NSCache<NSString, UIImage>()
        cache.countLimit = 24
        return cache
    }()

    var body: some View {
        Group {
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
            } else {
                Color.clear
            }
        }
        .frame(width: 156, height: 156)
        .clipShape(RoundedRectangle(cornerRadius: AgentTheme.bubbleRadius, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: AgentTheme.bubbleRadius, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
        .accessibilityLabel("附带的照片")
        .task(id: attachment.id) {
            let key = attachment.id as NSString
            if let hit = Self.cache.object(forKey: key) {
                image = hit
                return
            }
            let decoded = await Task.detached(priority: .userInitiated) { [agent, attachment] () -> UIImage? in
                guard let data = agent.imageData(for: attachment) else { return nil }
                return Self.downsampled(data, to: 312)
            }.value
            guard let decoded else { return }
            Self.cache.setObject(decoded, forKey: key)
            image = decoded
        }
    }

    /// Decode straight to the tile size instead of materializing the original.
    /// - Parameters:
    ///   - data: encoded image bytes.
    ///   - edge: longest edge in pixels the tile needs.
    /// - Returns: the downsampled image, or a full decode when ImageIO refuses.
    private static func downsampled(_ data: Data, to edge: CGFloat) -> UIImage? {
        let options = [kCGImageSourceShouldCache: false] as CFDictionary
        guard let source = CGImageSourceCreateWithData(data as CFData, options) else {
            return UIImage(data: data)
        }
        let request = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceShouldCacheImmediately: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: edge,
        ] as [CFString: Any] as CFDictionary
        guard let cg = CGImageSourceCreateThumbnailAtIndex(source, 0, request) else {
            return UIImage(data: data)
        }
        return UIImage(cgImage: cg)
    }
}
