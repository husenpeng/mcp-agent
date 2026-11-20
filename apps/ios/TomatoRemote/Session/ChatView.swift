//
//  ChatView.swift
//  Tomato Remote
//
//  Conversation screen: a status line, the messages that have been read, and
//  the composer. History arrives a page at a time; the model lives in
//  `ChatModel`.
//

import Combine
import SwiftUI
import UIKit

/// Which model picker the dock opens. The two are separate sheets: a model is
/// one choice, its reasoning level another.
private enum ModelPicker: String, Identifiable {
    case model
    case reasoning

    var id: String {
        rawValue
    }
}

struct ChatView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var journal: UsageJournal
    @EnvironmentObject private var interactions: InteractionCenter
    /// The paired Host's model directory, shared by every conversation.
    @EnvironmentObject private var models: ModelCatalogStore
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var chat: ChatModel
    @State private var detail: ChatItem?
    @State private var showsAgent = false
    @State private var pendingPermission: PermissionCatalogWire.Option?
    @State private var showsProgress = false
    @State private var showsPendings = false
    /// Which model picker the dock is showing, if any. The two are separate
    /// sheets: a model is one choice, its reasoning level is another.
    @State private var picker: ModelPicker?
    /// Island state for this conversation, owned by the screen that follows it.
    @State private var live = LiveActivityController()
    @StateObject private var progress: ProgressModel
    @State private var previewFile: DeliveredFile?
    /// Photo of this conversation opened full screen.
    @State private var previewPhoto: ChatImageRef?
    /// Document staged on the Host for the next prompt, with the bytes its chip
    /// previews.
    @State private var staged: StagedFile?
    @State private var stagedLocal: StagedDocument?
    @State private var isUploading = false
    @FocusState private var composerFocused: Bool
    /// A starter prompt waiting to land in the dock, unsent.
    @State private var prefill: ComposerPrefill?
    /// Whether the viewport is being kept on the newest message. A drag that
    /// scrolls up releases it until the reader asks to come back.
    @State private var followsBottom = true
    @State private var scrollTask: Task<Void, Never>?
    @State private var scrollWanted = false
    /// Whether the opening viewport was placed on the newest turn already.
    @State private var anchored = false
    /// Cleared when the reader takes over the scroll, so the opening anchor
    /// stops re-applying itself under their finger.
    @State private var anchorHolds = true
    /// Whether the end of the transcript is on screen; the jump control is only
    /// useful when it is not.
    @State private var bottomVisible = false
    /// Laid-out heights, compared to tell a scrollable transcript from one that
    /// already fits the screen.
    @State private var transcriptHeight: CGFloat = 0
    @State private var viewportHeight: CGFloat = 0
    @State private var topVisible = false
    /// Set once the top has been off screen, so reaching it again is deliberate.
    @State private var topSeen = false

    let title: String
    /// Folder the Session runs in, for the journal's project fact.
    private let project: String?

    init(summary: SessionSummary, preloaded: [JSONValue] = []) {
        let blocked = summary.isSubagent
            ? "这是一个子代理会话，Host 只通过父会话提供它的内容。"
            : nil
        // A hint for the first paint only: the list's projection block is the
        // fold at its last read, and the stream's snapshot replaces it.
        let hinted = summary.projections?.values?["modelSelection"]?.decoded(ModelSelectionProjection.self)
        // The list's flags are a snapshot taken when the list was read; this
        // screen adopts the live facts the moment its control stream reports
        // them. Starting from `agentAvailable: false` therefore labelled a
        // running conversation as 已结束, so the opening state only claims a
        // running turn — never that the conversation has ended.
        _chat = StateObject(wrappedValue: ChatModel(
            sessionId: summary.sessionId,
            running: summary.running,
            agentAttached: summary.running || summary.agentAvailable,
            blank: summary.blank,
            cursor: summary.projections?.asOfSeq,
            blockedReason: blocked,
            preloaded: preloaded,
            selection: hinted.flatMap { $0.next ?? $0.lastUsed },
            workingDirectory: summary.projections?.values?["workingDirectory"]?.stringValue ?? summary.cwd,
            permission: summary.projections?.values?["permissions"]?["currentValue"]?.stringValue
        ))
        _progress = StateObject(wrappedValue: ProgressModel(sessionId: summary.sessionId))
        title = summary.displayTitle
        project = summary.folderName
    }

    /// Open a child Session through its parent's durable address.
    /// - Parameters:
    ///   - sessionId: child Session identity.
    ///   - title: page title.
    ///   - parentSessionId: Session that spawned the child.
    ///   - subagentMode: descriptor mode, or `unknown` to skip the Host's check.
    ///   - preloaded: events already fetched.
    init(
        sessionId: String,
        title: String,
        preloaded: [JSONValue] = [],
        parentSessionId: String? = nil,
        subagentMode: String? = nil
    ) {
        _chat = StateObject(wrappedValue: ChatModel(
            sessionId: sessionId,
            agentAttached: true,
            preloaded: preloaded,
            parentSessionId: parentSessionId,
            subagentMode: subagentMode
        ))
        _progress = StateObject(wrappedValue: ProgressModel(sessionId: sessionId))
        self.title = title
        project = nil
    }

    /// Whether anything long-running makes the progress button worth a glance.
    private var runningWork: Bool {
        chat.isRunning || progress.goal?.phase == "active" || progress.jobs.contains(where: \.isRunning)
    }

    var body: some View {
        VStack(spacing: 0) {
            statusBar
            permissionBar
            if let error = chat.errorMessage {
                ErrorBanner(message: error) {
                    chat.errorMessage = nil
                    chat.start(hub: model.hub)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 6)
            }

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 18) {
                        // Touch target that reports the reader reaching the top;
                        // older pages load from there instead of all at once.
                        Color.clear
                            .frame(height: 1)
                            .onAppear {
                                topVisible = true
                                Task { await autoLoadEarlier(proxy) }
                            }
                            .onDisappear {
                                topVisible = false
                                topSeen = true
                            }

                        if chat.hasEarlier {
                            earlierControl(proxy)
                        }

                        if chat.isLoadingInitial, chat.rows.isEmpty {
                            ChatSkeleton()
                        } else {
                            ForEach(chat.entries) { entry in
                                Group {
                                    switch entry {
                                    case let .single(item):
                                        row(item)
                                    case let .process(steps, running):
                                        ProcessGroup(steps: steps, running: running) { detail = $0 }
                                            .equatable()
                                    }
                                }
                                .id(entry.id)
                            }
                            if !chat.streamingText.isEmpty {
                                AssistantRow(text: chat.streamingText, pending: true)
                                    .id("streaming")
                            }
                            // The persistent status strip already reports the
                            // active phase; do not repeat the same live row here.
                        }
                        if !chat.deliverables.isEmpty {
                            DeliverablesCard(files: chat.deliverables) { previewFile = $0 }
                        }
                        Color.clear
                            .frame(height: 1)
                            .id("bottom")
                            .onAppear { bottomVisible = true }
                            .onDisappear { bottomVisible = false }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)
                    .background(
                        GeometryReader { geometry in
                            Color.clear.preference(key: TranscriptHeightKey.self, value: geometry.size.height)
                        }
                    )
                }
                // A conversation shorter than the screen reads from the top;
                // pinning it to the bottom left a blank band above the first
                // message. Only an overflowing transcript starts at the newest
                // line.
                .defaultScrollAnchor(transcriptHeight > viewportHeight + 4 ? .bottom : .top)
                .background(
                    GeometryReader { geometry in
                        Color.clear.preference(key: ViewportHeightKey.self, value: geometry.size.height)
                    }
                )
                .scrollDismissesKeyboard(.immediately)
                .scrollBounceBehavior(.basedOnSize, axes: .vertical)
                // Taps inside the transcript belong to the text, whose links open
                // files and pages; a tap gesture layered over it competed with
                // those links. A drag and the keyboard's own 收起 still dismiss
                // the keyboard.
                .simultaneousGesture(
                    DragGesture(minimumDistance: 12)
                        .onChanged { value in
                            // Only a drag toward older messages takes the
                            // scroll over. An upward flick at the bottom is
                            // bounce; releasing the follow there stopped the
                            // transcript right before the answer landed.
                            guard value.translation.height > 0 else { return }
                            if followsBottom {
                                followsBottom = false
                            }
                            anchorHolds = false
                        }
                        // A short conversation cannot scroll, so the scroll
                        // dismissal alone would leave the keyboard up; any drag
                        // on the transcript puts it away.
                        .onEnded { _ in
                            if composerFocused {
                                composerFocused = false
                            }
                        }
                )
                .tomatoScrollEdge()
                .overlay(alignment: .bottomTrailing) {
                    if !followsBottom, !bottomVisible, !chat.rows.isEmpty {
                        jumpToLatest(proxy)
                    }
                }
                .overlay { welcomeOverlay }
                .onChange(of: chat.rows.count) { _, _ in scheduleScroll(proxy) }
                .onChange(of: chat.entries.count) { _, _ in scheduleScroll(proxy) }
                .onChange(of: chat.streamingText) { _, _ in scheduleScroll(proxy) }
                .onChange(of: chat.deliverables.count) { _, _ in scheduleScroll(proxy) }
                // The turn's last update replaces the streaming text with the
                // durable Markdown row, whose height the lazy stack measures
                // after the change lands; follow it once more as it settles.
                .onChange(of: chat.isRunning) { was, running in
                    if was, !running {
                        scheduleScroll(proxy)
                    }
                }
                // The keyboard and the growing dock take height out of the
                // viewport. A transcript that was following the newest message
                // must keep it on screen instead of leaving blank space above
                // the dock.
                .onChange(of: composerFocused) { _, focused in
                    if focused {
                        reanchorToBottom(proxy)
                    }
                }
                .onChange(of: viewportHeight) { _, _ in reanchorToBottom(proxy) }
                .onPreferenceChange(TranscriptHeightKey.self) { transcriptHeight = $0 }
                .onPreferenceChange(ViewportHeightKey.self) { viewportHeight = $0 }
                .task { await anchorNewestTurn(proxy) }
                .onAppear {
                    AppLog.screen("对话 \(chat.sessionId.prefix(8))")
                    AppLog.info(
                        .ui,
                        "打开对话 \(chat.sessionId.prefix(8))",
                        detail: "\(chat.rows.count) 行 · \(chat.deliverables.count) 个交付物"
                    )
                    chat.start(hub: model.hub)
                    // A tap can outrun the list's warm-up; take the page if it
                    // has landed since this screen was constructed.
                    chat.adoptPreview(model.cachedEvents(chat.sessionId))
                }
                .task { await autoscrollTranscriptIfAsked(proxy) }
                .task { stageDebugSampleIfAsked() }
            }
            // The composer sits on the screen's own bottom safe area. That
            // inset is the home indicator and nothing else once the tab bar is
            // hidden. Behind the dock the page continues to the physical edge
            // in its own fill: a material there tinted the band under the card
            // grey and drew a seam across the page, and the dock floats clear of
            // the transcript on its own soft shadow instead.
            composer
                .background {
                    TomatoToken.bgBase.ignoresSafeArea(edges: .bottom)
                }
                .overlay(alignment: .top) {
                    FadeOutToPage()
                        .frame(height: 24)
                        .allowsHitTesting(false)
                }
        }
        .background(TomatoSurface.page)
        // Messages carry Markdown links. A path on the Mac, or a tomato://
        // address, is this app's business; everything else belongs to the system.
        .environment(\.openURL, OpenURLAction { openLink($0) })
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        // A conversation is a focused task: the composer owns the bottom edge,
        // and the destination control stays on the root list behind it.
        .toolbar(.hidden, for: .tabBar)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Button { showsProgress = true } label: {
                    // The filled icon already says a turn is running; a
                    // perpetual pulse kept the display link busy for nothing.
                    Image(systemName: runningWork ? "bolt.horizontal.circle.fill" : "bolt.horizontal.circle")
                }
                .accessibilityLabel("进度")
                Button { showsAgent = true } label: {
                    Image(systemName: "person.crop.circle")
                }
                .accessibilityLabel("Agent 信息")
            }
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("收起") { composerFocused = false }
                    .accessibilityIdentifier("chat.keyboard.dismiss")
            }
        }
        .sheet(item: $detail) { item in
            if let tool = item.tool {
                ToolDetailSheet(tool: tool)
                    .tomatoSheet()
            }
        }
        .sheet(isPresented: $showsAgent) {
            AgentSheet(
                sessionId: chat.sessionId,
                preset: chat.agentPreset,
                usage: chat.usage,
                running: chat.isRunning,
                model: chat.modelSelection?.model
            )
            .tomatoSheet()
        }
        .confirmationDialog(
            pendingPermission.map { PermissionPresentation.confirmationTitle($0.value) } ?? "确认切换权限？",
            isPresented: Binding(
                get: { pendingPermission != nil },
                set: {
                    if !$0 {
                        pendingPermission = nil
                    }
                }
            ),
            titleVisibility: .visible
        ) {
            if let option = pendingPermission {
                Button("启用\(PermissionPresentation.label(option))", role: .destructive) {
                    pendingPermission = nil
                    Task { await chat.setPermission(option.value) }
                }
            }
            Button("取消", role: .cancel) { pendingPermission = nil }
        } message: {
            if let option = pendingPermission {
                Text(PermissionPresentation.confirmationMessage(option))
            }
        }
        .sheet(isPresented: $showsProgress) {
            ProgressSheet(progress: progress)
                .tomatoSheet([.large])
        }
        .sheet(item: $previewFile) { file in
            FilePreviewSheet(file: file)
                .tomatoFullSheet()
        }
        .sheet(item: $previewPhoto) { photo in
            if let image = chat.photos.image(for: photo.id) {
                ImagePreviewSheet(image: image)
                    .tomatoFullSheet()
                    .presentationBackground(.black)
            }
        }
        .onChange(of: scenePhase) { _, phase in
            switch phase {
            case .active:
                chat.resume(hub: model.hub)
            case .background:
                // A suspended app cannot read its socket; reconnecting is the
                // only way back, so the loop stops instead of tightening.
                chat.stop()
            default:
                break
            }
        }
        // The list's repair read is the only traffic left when the Host goes
        // away. A read that succeeds after failures means it answers again, so a
        // conversation left "离线" rejoins without the reader reopening it.
        .onChange(of: model.hostReachableTick) { _, _ in
            chat.resume(hub: model.hub)
        }
        // The list follows the Host's own notifications, so the conversation
        // takes its liveness from there: a turn that starts after this screen
        // opened, or before it in a page that begins mid-turn, is the same fact.
        // The read lives in a zero-size bridge so a status change in any Session
        // does not re-render this transcript.
        .background(LivenessBridge(sessionId: chat.sessionId, chat: chat))
        // The transcript is long enough that a finished turn can end off screen.
        // A short haptic plus a spoken notice is how the reader learns about it
        // without watching the header.
        .onChange(of: chat.isRunning) { was, running in
            guard was, !running else { return }
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            UIAccessibility.post(notification: .announcement, argument: "Tomato 已完成回答")
        }
        .onChange(of: pendingHere.count) { before, after in
            guard after > before else { return }
            UINotificationFeedbackGenerator().notificationOccurred(.warning)
        }
        .onDisappear {
            chat.stop()
            Task { await live.end() }
        }
        // The island mirrors the turn: it starts with the first running state,
        // follows the pending count, and ends once the Session settles.
        .task(id: islandState) { await syncIsland() }
        // One catalog read for the whole Host; the composer's chips read names
        // and levels from it, and a failure stays in the sheet.
        .task { await models.load(hub: model.hub) }
        .task { await chat.loadPermissions(hub: model.hub) }
    }

    /// Open one link a message carried.
    ///
    /// An absolute path names a file on the Mac, which the phone cannot open
    /// locally; the Host's download route serves it, so the tap opens the same
    /// preview the deliverables card uses. A relative path resolves against the
    /// Session's working directory when one is known; with none, the app does
    /// not guess one.
    /// - Parameter url: destination the Markdown renderer produced.
    /// - Returns: whether this app handled the link.
    private func openLink(_ url: URL) -> OpenURLAction.Result {
        switch ChatLink(url, base: chat.workingDirectory) {
        case let .hostFile(path):
            composerFocused = false
            previewFile = DeliveredFile(path: path, description: nil, seq: nil)
            return .handled
        case let .appRoute(route):
            composerFocused = false
            model.handle(route)
            return .handled
        case .external:
            return .systemAction
        case .unresolved:
            return .discarded
        }
    }
}

// MARK: - Status and content

extension ChatView {
    // MARK: - Status

    /// The liveness facts the list currently holds for this conversation.
    private struct Liveness: Equatable {
        let running: Bool
        let agentAttached: Bool
    }

    /// Forwards the list's liveness facts into the conversation model.
    ///
    /// Reading `AppModel.sessions` subscribes whichever view's body reads it, and
    /// every Host list event republishes that array. Keeping the read in this
    /// empty bridge stops a status change in any Session from re-rendering the
    /// whole transcript.
    private struct LivenessBridge: View {
        @EnvironmentObject private var model: AppModel
        let sessionId: String
        let chat: ChatModel

        var body: some View {
            Color.clear
                .frame(width: 0, height: 0)
                .allowsHitTesting(false)
                .onChange(of: current) { _, next in
                    guard let next else { return }
                    chat.adopt(running: next.running, agentAttached: next.agentAttached)
                }
        }

        /// What the Host last said about this Session, while the list still holds
        /// it.
        ///
        /// A child Session and a just-created one may have no row; this screen then
        /// keeps what it opened with and follows its own events.
        private var current: Liveness? {
            guard let summary = model.sessions.first(where: { $0.sessionId == sessionId })
            else { return nil }
            return Liveness(running: summary.running, agentAttached: summary.agentAvailable)
        }
    }

    /// One line that says what the conversation is doing: whether it is live,
    /// ended, or reconnecting. The composer never depends on it, because a
    /// prompt travels over HTTP and the stream only delivers the answer.
    private var statusBar: some View {
        ChatStatusStrip(
            activity: activity,
            startedAt: activityStartedAt,
            note: restingNote,
            onAnswer: { showsPendings = true },
            onRetry: { chat.resume(hub: model.hub) }
        )
    }

    /// The Session's permission preset: what the Agent may do on this Mac.
    private var permissionBar: some View {
        PermissionBar(
            current: chat.currentPermission,
            options: chat.permissionOptions,
            isBusy: chat.isChangingPermission,
            error: chat.permissionError
        ) { option in
            guard option.value != chat.currentPermission else { return }
            if PermissionPresentation.needsConfirmation(option.value) {
                pendingPermission = option
            } else {
                Task { await chat.setPermission(option.value) }
            }
        }
    }

    /// The phase this conversation is in, in the order a reader would notice:
    /// a blocked request outranks a running turn, a dropped stream outranks
    /// both, and the turn's own work is read from the newest rows.
    private var activity: ChatActivity {
        switch chat.link {
        case let .retrying(attempt):
            return .reconnecting(attempt: attempt)
        case let .offline(reason):
            return .offline(reason)
        case .connecting, .live:
            break
        }
        if !pendingHere.isEmpty {
            return .waiting(count: pendingHere.count)
        }
        guard chat.isRunning else {
            return .idle(chat.state)
        }
        if !chat.streamingText.isEmpty {
            return .writing
        }
        if let running = chat.runningTool {
            return .tool(name: running.name)
        }
        return chat.awaitingTurn ? .sending : .thinking
    }

    /// When the phase began, in the Host's milliseconds.
    private var activityStartedAt: Double? {
        chat.runningTool?.startedAt ?? chat.turnStartedAt
    }

    /// Whether the conversation still shows its welcome.
    ///
    /// A running turn without words draws its own live row, so an empty
    /// transcript under one is not the welcome state; neither is a transcript
    /// still loading, one with an earlier page to load, one that only carries
    /// deliverables, or one whose owner is already typing.
    private var showsWelcome: Bool {
        !chat.isLoadingInitial
            && !composerFocused
            && !chat.hasEarlier
            && chat.rows.isEmpty
            && chat.streamingText.isEmpty
            && chat.deliverables.isEmpty
            && !activity.showsInTranscript
    }

    /// The first screen of a conversation is its welcome, not empty canvas. It
    /// centers in the viewport and scrolls when a large type size makes it taller
    /// than the screen.
    @ViewBuilder
    private var welcomeOverlay: some View {
        if showsWelcome {
            GeometryReader { geometry in
                ScrollView {
                    ConversationWelcome(state: chat.state) { prompt in
                        prefill = ComposerPrefill(text: prompt)
                    }
                    .padding(.horizontal, 20)
                    .frame(minHeight: geometry.size.height, alignment: .center)
                }
                .scrollBounceBehavior(.basedOnSize)
            }
        }
    }

    private var restingNote: String? {
        switch chat.link {
        case .connecting:
            chat.isLoadingInitial ? "正在加载对话…" : "正在连接 Host…"
        case .live:
            chat.state == .ended ? "发送消息可重新开始" : nil
        case .retrying, .offline:
            // The activity pill already names the reconnect; a second note would
            // say the same thing twice.
            nil
        }
    }

    // MARK: - Model

    /// The choice the next message uses: the Session's recorded one, or the
    /// deployment default until this Session records its own.
    private var modelRoute: ModelRoute? {
        chat.modelSelection ?? models.defaultRoute
    }

    /// The catalog entry of the choice in use, when the Host advertises it.
    private var catalogModel: ModelCatalogModel? {
        modelRoute.flatMap { models.model(for: $0) }
    }

    /// What the model chip shows, or nil when this screen offers no choice.
    private var modelChipTitle: String? {
        guard model.hub != nil, chat.allowsModelSwitch else { return nil }
        return catalogModel?.name ?? modelRoute?.model ?? "选择模型"
    }

    /// The level the next model step actually uses.
    private var effectiveEffort: String? {
        modelRoute?.reasoningEffort ?? catalogModel?.reasoning?.defaultEffort
    }

    /// What the reasoning chip shows, or nil when the model has no levels.
    private var effortChipTitle: String? {
        guard chat.allowsModelSwitch else { return nil }
        if let pinned = modelRoute?.reasoningEffort {
            return ModelEffortLabel.text(pinned, in: catalogModel?.reasoning)
        }
        guard catalogModel?.reasoning != nil else { return nil }
        return ModelEffortLabel.automatic
    }

    /// Whether the model actually reasons, which tints the reasoning chip.
    private var effortIsActive: Bool {
        guard let effort = effectiveEffort else { return false }
        return effort != "off"
    }

    // MARK: - Content

    @ViewBuilder
    private func row(_ item: ChatItem) -> some View {
        switch item.kind {
        case .user:
            UserRow(
                text: item.text,
                images: item.images,
                photos: chat.photos,
                open: { previewPhoto = $0 },
                needs: { chat.loadImage($0) }
            )
            .equatable()
            .opacity(item.pending ? 0.7 : 1)
        case .assistant:
            AssistantRow(text: item.text, pending: item.pending)
                .equatable()
        case .tool:
            if let tool = item.tool {
                ToolCard(tool: tool) { detail = item }
                    .equatable()
            }
        case .context:
            ContextRow(label: item.label ?? "上下文注入", text: item.text)
        case .notice:
            Text(item.text)
                .font(.caption)
                .foregroundStyle(TomatoToken.labelDimmed)
                .frame(maxWidth: .infinity)
        }
    }

    /// Older history: one page per request, anchored so the rows on screen do
    /// not jump when the page lands above them.
    private func earlierControl(_ proxy: ScrollViewProxy) -> some View {
        VStack(spacing: 4) {
            Button {
                loadEarlier(proxy)
            } label: {
                HStack(spacing: 6) {
                    if chat.isLoadingEarlier {
                        ProgressView().controlSize(.small)
                    }
                    Text(chat.isLoadingEarlier ? "加载中…" : "加载更早的消息")
                        .font(.footnote)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
            }
            .buttonStyle(TomatoPressableStyle())
            .foregroundStyle(TomatoToken.labelCaption)
            .accessibilityIdentifier("chat.loadEarlier")
            if let error = chat.earlierError {
                Text(error)
                    .font(.caption2)
                    .foregroundStyle(TomatoToken.stateErrorPrimary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    /// What the island would show, as one comparable value.
    private var islandState: String {
        "\(chat.isRunning)-\(pendingHere.count)-\(chat.streamingText.isEmpty ? "idle" : "streaming")-\(activity.title)"
    }

    /// Push the current state into the Live Activity, starting it on the first
    /// running turn and ending it when everything settles.
    private func syncIsland() async {
        let pending = pendingHere.count
        // The island carries the same phase the header names, so the Lock Screen
        // and the conversation never describe the turn differently.
        let detail = activity.showsElapsed ? activity.title : ""
        if chat.isRunning || pending > 0 {
            if await live.isActive {
                await live.update(running: chat.isRunning, detail: detail, pending: pending)
            } else {
                await live.begin(sessionId: chat.sessionId, title: title, detail: detail)
            }
        } else {
            await live.end()
        }
    }

    /// Requests raised by this very conversation, so the card sits with the turn
    /// that is blocked instead of in a separate list.
    private var pendingHere: [PendingInteraction] {
        interactions.pending.filter { $0.sessionId == chat.sessionId }
    }

    /// The picker one chip opens.
    @ViewBuilder
    private func pickerSheet(_ which: ModelPicker) -> some View {
        switch which {
        case .model:
            ModelPickerSheet(chat: chat, models: models, hub: model.hub)
        case .reasoning:
            ReasoningSheet(chat: chat, models: models, hub: model.hub)
        }
    }

    /// The dock, plus the one thing it decides: what the agent is told about
    /// its owner before reading the prompt.
    private var composer: some View {
        // The composer draws the pending line itself, so this stack adds nothing
        // above it.
        VStack(spacing: 0) {
            ComposerView(
                isFocused: $composerFocused,
                isRunning: chat.isRunning,
                canSend: model.hub != nil,
                hub: model.hub,
                onSend: { outgoing, images in
                    let receipt = staged?.receiptId
                    staged = nil
                    stagedLocal = nil
                    followsBottom = true
                    journal.recordPrompt(outgoing, project: project, carriedPhoto: !images.isEmpty)
                    // Personal context now lives on the Host: the phone proposes
                    // habits as candidates and stops appending them to every prompt.
                    Task { await chat.send(outgoing, images: images, receiptId: receipt) }
                },
                onCancel: { Task { await chat.cancel() } },
                onPickDocument: { url, accessed in
                    Task { await uploadDocument(url, accessed: accessed) }
                },
                stagedDocument: stagedLocal,
                onRemoveDocument: {
                    staged = nil
                    stagedLocal = nil
                },
                prefill: prefill,
                pending: pendingHere,
                onAnswer: { showsPendings = true },
                modelTitle: modelChipTitle,
                effortTitle: effortChipTitle,
                effortIsActive: effortIsActive,
                isSwitchingModel: chat.isSwitchingModel,
                onOpenModel: { picker = .model },
                onOpenReasoning: { picker = .reasoning }
            )
            .sheet(item: $picker) { which in
                pickerSheet(which)
                    .tomatoSheet()
            }
        }
        .sheet(isPresented: $showsPendings) {
            InteractionSheet(center: interactions)
                .tomatoSheet()
        }
    }

    /// Stage the bundled sample document when the test run asks for it.
    ///
    /// Present only with `-TOMATO_STAGE_SAMPLE`; a release build never uploads
    /// without the owner choosing a file.
    private func stageDebugSampleIfAsked() {
        #if DEBUG
            guard ProcessInfo.processInfo.arguments.contains("-TOMATO_STAGE_SAMPLE"),
                  staged == nil,
                  let url = Bundle.main.url(forResource: "sample", withExtension: "pdf")
            else { return }
            Task { await uploadDocument(url, accessed: false) }
        #endif
    }

    /// Read a chosen document and stage it on the Host.
    /// - Parameter url: the file the document picker returned.
    private func uploadDocument(_ url: URL, accessed: Bool) async {
        guard let hub = model.hub else {
            if accessed {
                url.stopAccessingSecurityScopedResource()
            }
            return
        }
        isUploading = true
        defer {
            isUploading = false
            if accessed {
                url.stopAccessingSecurityScopedResource()
            }
        }
        do {
            let data = try Data(contentsOf: url)
            let staged = try await hub.uploadDocument(
                sessionId: chat.sessionId,
                name: url.lastPathComponent,
                data: data
            )
            self.staged = staged
            // The Host receipt names the upload but cannot serve the bytes back,
            // so the chip keeps the local copy it previews.
            stagedLocal = StagedDocument(name: staged.name, data: data)
        } catch {
            chat.errorMessage = describe(error)
            AppLog.error(.ui, "上传文档失败", detail: "\(url.lastPathComponent)：\(describe(error))")
        }
    }

    private func jumpToLatest(_ proxy: ScrollViewProxy) -> some View {
        Button {
            followsBottom = true
            withAnimation(.easeOut(duration: 0.2)) { proxy.scrollTo("bottom", anchor: .bottom) }
        } label: {
            Image(systemName: "arrow.down")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(TomatoToken.labelPrimary)
                .frame(width: 36, height: 36)
                .tomatoGlass(in: Circle())
                // The glass circle stays 36 pt; the touch target meets 44 pt.
                .contentShape(Circle().inset(by: -4))
        }
        .buttonStyle(TomatoPressableStyle())
        .padding(.trailing, 14)
        .padding(.bottom, 10)
        .accessibilityLabel("回到最新")
    }

    // MARK: - Scrolling

    #if DEBUG
        /// Step through a long transcript without XCUITest, so the frame log
        /// measures the Markdown rows themselves. Present only with
        /// `-TOMATO_AUTOSCROLL_CHAT`.
        /// - Parameter proxy: the transcript's scroll proxy.
        @MainActor
        private func autoscrollTranscriptIfAsked(_ proxy: ScrollViewProxy) async {
            guard ProcessInfo.processInfo.arguments.contains("-TOMATO_AUTOSCROLL_CHAT") else { return }

            var ids: [String] = []
            for _ in 0 ..< 30 {
                ids = chat.entries.map(\.id)
                if ids.count > 10 {
                    break
                }
                try? await Task.sleep(nanoseconds: 200_000_000)
            }
            guard ids.count > 10 else { return }

            AppLog.mark("自动滚动")
            try? await Task.sleep(nanoseconds: 1_500_000_000)
            let step = max(1, ids.count / 20)
            let targets = stride(from: 0, to: ids.count, by: step).map { ids[$0] }
            for id in targets {
                withAnimation(.linear(duration: 0.25)) {
                    proxy.scrollTo(id, anchor: .top)
                }
                try? await Task.sleep(nanoseconds: 280_000_000)
            }
            for id in targets.reversed() {
                withAnimation(.linear(duration: 0.25)) {
                    proxy.scrollTo(id, anchor: .top)
                }
                try? await Task.sleep(nanoseconds: 280_000_000)
            }
            AppLog.info(.ui, "对话自动滚动结束", detail: "\(ids.count) 行")
        }
    #endif

    /// Open a settled conversation at the start of its newest turn.
    ///
    /// Pinning the very bottom of a long answer showed neither the person's
    /// words nor the beginning of the Agent's reply. A running turn keeps
    /// following the newest text instead, and a reader who has already taken
    /// the scroll keeps their place. The scroll is re-applied while the turn's
    /// own blocks settle their height, because the lazy stack measures its rows
    /// as it realizes them.
    /// - Parameter proxy: the transcript's scroll proxy.
    private func anchorNewestTurn(_ proxy: ScrollViewProxy) async {
        guard !anchored else { return }
        anchored = true
        for attempt in 0 ..< 14 {
            try? await Task.sleep(nanoseconds: 250_000_000)
            guard anchorHolds, !chat.isLoadingInitial, !chat.rows.isEmpty else { continue }
            guard !chat.isRunning else {
                // A live turn is still writing: the newest text is the news.
                followsBottom = true
                return
            }
            // A transcript that fits the screen keeps its bottom alignment; only
            // a long answer hides the turn's opening message.
            guard viewportHeight > 0, transcriptHeight > viewportHeight + 4 else { continue }
            let opener = chat.rows.last(where: { $0.kind == .user }) ?? chat.rows[0]
            followsBottom = false
            proxy.scrollTo("row-\(opener.id)", anchor: .top)
            if attempt >= 6 {
                return
            }
        }
    }

    /// Put a followed transcript back on its newest line after a layout change.
    ///
    /// The keyboard appearing or the dock growing changes the viewport after
    /// the scroll position was already clamped, and a lazy stack keeps drawing
    /// nothing where the rows no longer reach. Waiting one runloop lets the new
    /// height settle before the anchor is applied.
    /// - Parameter proxy: the transcript's scroll proxy.
    private func reanchorToBottom(_ proxy: ScrollViewProxy) {
        guard followsBottom else { return }
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 120_000_000)
            guard followsBottom, transcriptHeight > viewportHeight + 4 else { return }
            proxy.scrollTo("bottom", anchor: .bottom)
        }
    }

    /// Scroll once per burst: streaming text changes many times per second and
    /// a `scrollTo` per chunk makes the thread stutter.
    ///
    /// After the burst goes quiet one more pass lands: the change that ends a
    /// turn swaps the streaming text for the durable Markdown row, and the lazy
    /// stack measures that row after the scroll already ran. Without the second
    /// pass the finished answer sits below the viewport until a manual pull.
    private func scheduleScroll(_ proxy: ScrollViewProxy) {
        scrollWanted = true
        guard scrollTask == nil else { return }
        scrollTask = Task { @MainActor in
            while true {
                while scrollWanted {
                    scrollWanted = false
                    try? await Task.sleep(nanoseconds: 100_000_000)
                    if followsBottom, transcriptHeight > viewportHeight + 4 {
                        withAnimation(.easeOut(duration: 0.18)) {
                            proxy.scrollTo("bottom", anchor: .bottom)
                        }
                    }
                }
                try? await Task.sleep(nanoseconds: 350_000_000)
                // A new burst during the wait belongs to the loop above.
                if scrollWanted {
                    continue
                }
                if followsBottom, transcriptHeight > viewportHeight + 4 {
                    proxy.scrollTo("bottom", anchor: .bottom)
                }
                break
            }
            scrollTask = nil
        }
    }

    /// Load the next older page when the reader scrolls back to the top; the
    /// opening layout alone does not fetch pages nobody asked for.
    private func autoLoadEarlier(_ proxy: ScrollViewProxy) async {
        guard topVisible, topSeen, chat.hasEarlier, !chat.isLoadingEarlier else { return }
        loadEarlier(proxy)
    }

    private func loadEarlier(_ proxy: ScrollViewProxy) {
        let anchor = chat.rows.first?.id
        Task {
            await chat.loadEarlier()
            if let anchor {
                proxy.scrollTo(anchor, anchor: .top)
            }
        }
    }
}

private struct ToolDetailSheet: View {
    let tool: ToolDetail
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack(spacing: 8) {
                        StatusPill(text: statusText, tone: tone)
                        if let duration = tool.durationText {
                            Text(duration)
                                .font(.caption)
                                .foregroundStyle(TomatoToken.labelDimmed)
                        }
                    }

                    section("参数", text: ToolDetail.pretty(tool.arguments), monospaced: true)
                    if let result = tool.result, !result.isEmpty {
                        section("结果", text: ToolDetail.pretty(result), monospaced: true)
                    }
                }
                .padding(20)
            }
            .background(TomatoSurface.page)
        }
        // safeAreaInset reserves the header's height: as an overlay its opaque
        // background hid the first card at scroll-top and ate its touches.
        .safeAreaInset(edge: .top, spacing: 0) {
            SheetHeader(title: tool.name, caption: "工具调用", onClose: { dismiss() })
                .background(TomatoSurface.page)
        }
    }

    private func section(_ title: String, text: String, monospaced: Bool) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                SectionHeader(title: title)
                Spacer()
                Button {
                    UIPasteboard.general.string = text
                } label: {
                    Image(systemName: "doc.on.doc")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                }
                .buttonStyle(TomatoPressableStyle())
                .accessibilityLabel("复制\(title)")
            }
            Text(text.isEmpty ? "（空）" : text)
                .font(monospaced ? .system(size: 12, design: .monospaced) : .footnote)
                .foregroundStyle(TomatoToken.labelPrimary)
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(12)
                .background(TomatoToken.bgLayer2)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    private var statusText: String {
        switch tool.status {
        case .running: "执行中"
        case .done: "完成"
        case .failed: "失败"
        }
    }

    private var tone: StatusPill.Tone {
        switch tool.status {
        case .running: .info
        case .done: .ok
        case .failed: .error
        }
    }
}

private struct AgentSheet: View {
    let sessionId: String
    let preset: String?
    let usage: TokenTotals
    let running: Bool
    /// Model the Session last routed to, when the Host has reported one.
    let model: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    TomatoCard(padding: 18) {
                        AgentIdentity(
                            preset: preset ?? "默认",
                            model: model,
                            running: running,
                            onCopySessionId: { UIPasteboard.general.string = sessionId }
                        )
                    }

                    TomatoCard(padding: 18) {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "用量")
                            InfoRow(label: "输入", value: formatTokens(usage.input))
                            InfoRow(label: "输出", value: formatTokens(usage.output))
                            InfoRow(label: "缓存读", value: formatTokens(usage.cacheRead))
                            InfoRow(label: "缓存写", value: formatTokens(usage.cacheWrite))
                            InfoRow(label: "工具调用", value: String(usage.toolCalls))
                        }
                    }

                    Text("记忆、技能与日程属于个人 Agent 的下一层：它们读的是 Host 上同一份会话与文件服务，这一页先只汇总本次会话的运行事实。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(20)
            }
            .background(TomatoSurface.page)
        }
        // Same reason as the tool sheet: the header must reserve its height
        // instead of covering the first row of facts.
        .safeAreaInset(edge: .top, spacing: 0) {
            SheetHeader(title: "Agent", caption: "这个会话当前的运行事实。", onClose: { dismiss() })
                .background(TomatoSurface.page)
        }
    }
}

/// What this Session runs as: the preset, the model, and its live state.
///
/// The preset reads as the row's value, not as a second title, and the
/// Session id is the one fact worth carrying off this sheet, so it is a copy
/// target rather than a truncated string.
private struct AgentIdentity: View {
    let preset: String
    let model: String?
    let running: Bool
    let onCopySessionId: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                InfoRow(label: "预设", value: preset)
                if let model {
                    InfoRow(label: "模型", value: model)
                }
            }
            Spacer(minLength: 0)
            VStack(alignment: .trailing, spacing: 10) {
                StatusPill(text: running ? "运行中" : "空闲", tone: running ? .active : .idle)
                Button(action: onCopySessionId) {
                    Label("复制会话", systemImage: "doc.on.doc")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(TomatoToken.bgLayer2, in: Capsule())
                        // The pill is caption-sized; the touch target is not.
                        .frame(minHeight: 44)
                        .contentShape(Rectangle())
                }
                .buttonStyle(TomatoPressableStyle())
                .accessibilityLabel("复制会话 ID")
                .accessibilityIdentifier("agent.copySessionId")
            }
        }
    }
}

/// Compact token count: 1.2k, 1.2M.
func formatTokens(_ value: Int) -> String {
    if value >= 1_000_000 {
        return String(format: "%.1fM", Double(value) / 1_000_000)
    }
    if value >= 1000 {
        return String(format: "%.1fk", Double(value) / 1000)
    }
    return String(value)
}

// MARK: - Layout measurements

/// Height of the transcript's content, reported by its own layout.
private struct TranscriptHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

/// Height of the transcript's viewport, reported by its own background.
private struct ViewportHeightKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

/// A hairline-free transition into the dock's band: the transcript fades into
/// the page beneath it instead of ending at a divider.
private struct FadeOutToPage: View {
    var body: some View {
        Rectangle()
            .fill(
                LinearGradient(
                    colors: [TomatoToken.bgBase.opacity(0), TomatoToken.bgBase],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
    }
}
