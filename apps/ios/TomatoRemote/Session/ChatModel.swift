//
//  ChatModel.swift
//  Tomato Remote
//
//  One conversation: the history already read, the live follow stream, and the
//  rows both of them fold into.
//
//  Messages arrive three ways — a first page, an opening snapshot, and live
//  frames — and all of them describe the same ordered log. Folding appends only
//  what is new, so a long conversation does not cost a full rebuild per token.
//

import Foundation

// MARK: - Model

/// Reads one Session's history and live frames.
@MainActor
final class ChatModel: ObservableObject {
    /// How the live stream currently stands. A dropped socket is a recovery
    /// state, not an error: the reader keeps the page and the composer.
    enum Link: Equatable {
        case connecting
        case live
        case retrying(attempt: Int)
        /// Attempts are spent, or the Host refused the stream for good.
        case offline(String?)

        var isLive: Bool {
            self == .live
        }
    }

    /// Reconnects before the reader is told the conversation stopped updating.
    private static let attemptsBeforeOffline = 10

    let sessionId: String

    /// Rows the transcript draws: the folded history plus any prompt this phone
    /// sent that the Host has not echoed back yet.
    @Published private(set) var rows: [ChatItem] = []
    /// The rows grouped for display: one turn's tool work folds under a single
    /// disclosure. Recomputed on each publish rather than in the view body,
    /// which used to regroup the whole transcript on every evaluation.
    @Published private(set) var entries: [TranscriptEntry] = []
    /// The tool call still running, if any. The status pill reads this instead
    /// of scanning the rows on every body evaluation.
    @Published private(set) var runningTool: ToolDetail?
    @Published private(set) var streamingText = ""
    @Published private(set) var isRunning: Bool
    @Published private(set) var link: Link = .connecting
    @Published private(set) var state: SessionState
    /// Host milliseconds when the running turn opened, so the header can count
    /// without guessing from a local clock. Nil while no turn runs.
    @Published private(set) var turnStartedAt: Double?
    /// Whether a prompt has left this phone and the Host has not opened its turn
    /// yet. Distinguishes "sent, waiting for the Host" from "thinking".
    @Published private(set) var awaitingTurn = false
    /// How long the last settled turn took, in milliseconds.
    @Published private(set) var lastTurnDuration: Double?
    @Published private(set) var usage = TokenTotals()
    @Published private(set) var agentPreset: String?
    /// Model the next message uses, as the Host recorded it. Nil until the Host
    /// reports a choice; the deployment default stands in until then.
    @Published private(set) var modelSelection: ModelRoute?
    /// Whether a model switch is already on its way to the Host.
    @Published private(set) var isSwitchingModel = false
    /// Why the last switch failed. The model sheet shows it in place instead of
    /// the transcript's error banner, which belongs to the conversation itself.
    @Published var modelError: String?
    /// Directory this Session works in on the Mac, as the Host projects it.
    @Published private(set) var workingDirectory: String?
    /// Selectable permission presets the Host advertises for this Session.
    @Published private(set) var permissionOptions: [PermissionCatalogWire.Option] = []
    /// Preset the Host projects as the Session's current permission.
    @Published private(set) var currentPermission: String?
    /// Whether a permission switch is already on its way to the Host.
    @Published private(set) var isChangingPermission = false
    /// Why the last permission switch failed; the chip's menu shows it in place.
    @Published var permissionError: String?
    /// Photos this transcript draws, keyed by what the Host recorded. The rows
    /// carry references rather than pixels, so the fold stays cheap to replay.
    let photos = ChatImages()
    /// Files the Agent presented in this conversation, newest turn first.
    @Published private(set) var deliverables: [DeliveredFile] = []
    @Published private(set) var hasEarlier = false
    @Published private(set) var isLoadingEarlier = false
    /// Why the previous page refused to load, shown next to its control.
    @Published private(set) var earlierError: String?
    @Published private(set) var isLoadingInitial: Bool
    @Published var errorMessage: String?

    private var hub: HubClient?
    private var streamTask: Task<Void, Never>?
    /// Distinguishes the current stream loop from one that is still tearing down.
    private var generation = 0

    private var events: [JSONValue] = []
    private var seenSeqs: Set<Double> = []
    private var folded = Fold()
    /// Set while a publish is pending; bursts of events share one UI update.
    private var flushScheduled = false
    /// Stream chunks held until the next publish; publishing every delta would
    /// re-diff the whole transcript once per token.
    private var pendingStreamText = ""
    private var streamFlushScheduled = false
    /// Prompts sent from this phone, shown until their Host event arrives.
    private var echo: [ChatItem] = []
    /// Running flag the list reported, used until a turn event is seen.
    private let seededRunning: Bool
    /// Whether the Host reported the Session as never used before.
    private let seededBlank: Bool
    /// Guards the backfill that closes a hole a socket drop left behind.
    private var isFillingGap = false
    /// Photos of prompts still in flight, by request identity, so the durable
    /// message can adopt the bytes this phone already holds.
    private var echoImages: [String: [String]] = [:]
    /// Whether a prompt from this phone is still on its way to the Host. The
    /// button already turns into Stop once `isRunning` flips, but two taps in
    /// one run-loop turn would otherwise send two prompts with two identities,
    /// and the Host would admit both as separate user messages.
    private var isSendingPrompt = false
    /// Whether the Host held an Agent when this screen opened.
    /// Set when the Host reports another client writing this Session.
    @Published private(set) var externallyOwned = false
    private var agentAttached: Bool

    /// Watermark the list projected, used for the first page before the stream opens.
    private let cursorHint: Double?
    /// Newest sequence the Host reported in an opening snapshot. A page cut above
    /// it is rejected as `past cursor`, so paging clamps to this value.
    private var snapshotCursor: Double?
    /// Sequence of the newest model fact already applied. A history page from
    /// before a switch must not put the old choice back on screen.
    private var modelWatermark: Double = -1
    /// Sequence of the newest directory fact already applied.
    private var workingDirectoryWatermark: Double = -1
    /// Sequence of the newest permission fact already applied.
    private var permissionWatermark: Double = -1
    private var loadedEarlier = false

    private let blockedReason: String?
    /// Parent of a child Session; the Host serves a child only through this address.
    private let parentSessionId: String?
    /// Descriptor mode the child was created with, `unknown` when the list did not say.
    private let subagentMode: String?
    private let preloaded: [JSONValue]

    /// Accumulated rows plus the facts a rebuild has to reconstruct.
    private struct Fold {
        var rows: [ChatItem] = []
        var totals = TokenTotals()
        var running = false
        var sawTurn = false
        /// Host milliseconds when the current turn opened, cleared on its end.
        var turnStartedAt: Double?
        /// Duration of the last settled turn, in milliseconds.
        var lastTurnDuration: Double?
        /// Turn the log is currently recording; a prompt and every step it
        /// causes inherit it so the transcript can fold one turn's work as a
        /// unit instead of one group per run of tool calls.
        var turn = 0
        /// Whether any conversation row exists; a rebuilt fold starts empty.
        var sawMessage = false
        /// Prompt identities the durable log already holds; an optimistic echo
        /// carrying one of them was acknowledged and stops being drawn.
        var echoedRequests: Set<String> = []
    }

    /// - Parameters:
    ///   - sessionId: the Session this screen follows.
    ///   - running: whether the list last saw a turn executing.
    ///   - agentAttached: whether the Host still holds an Agent for it.
    ///   - blank: whether the Host reported no turn ever run.
    ///   - cursor: projection watermark from the list, when the Host reported one.
    ///   - blockedReason: why the Host refuses a direct follow, when it does.
    ///   - preloaded: events already fetched by the list, served instantly.
    ///   - selection: model choice a list hint already carried, or nil.
    init(
        sessionId: String,
        running: Bool = false,
        agentAttached: Bool = true,
        blank: Bool = false,
        cursor: Double? = nil,
        blockedReason: String? = nil,
        preloaded: [JSONValue] = [],
        parentSessionId: String? = nil,
        subagentMode: String? = nil,
        selection: ModelRoute? = nil,
        workingDirectory: String? = nil,
        permission: String? = nil
    ) {
        self.sessionId = sessionId
        self.parentSessionId = parentSessionId
        self.subagentMode = subagentMode
        modelSelection = selection
        self.workingDirectory = workingDirectory
        currentPermission = permission
        seededRunning = running
        seededBlank = blank
        isRunning = running
        self.agentAttached = agentAttached
        cursorHint = cursor
        self.blockedReason = blockedReason
        self.preloaded = preloaded
        isLoadingInitial = true
        state = SessionState.resolve(running: running, agentAttached: agentAttached, hasContent: !blank)
        folded.running = running
    }

    // MARK: Lifecycle

    /// Opens the follow stream. Idempotent, so `.task`, a retry, and a return to
    /// the foreground can all call it.
    /// - Parameter hub: the client bound to the paired Host.
    func start(hub: HubClient?) {
        if let blockedReason {
            AppLog.warning(.chat, "会话 \(sessionId.prefix(8)) 无法跟随", detail: blockedReason)
            errorMessage = blockedReason
            link = .offline(nil)
            isLoadingInitial = false
            return
        }
        guard streamTask == nil, let hub else { return }
        self.hub = hub
        errorMessage = nil
        AppLog.info(.chat, "会话 \(sessionId.prefix(8)) 打开", detail: "预载 \(preloaded.count) 条")
        if !preloaded.isEmpty, events.isEmpty {
            mergeHistory(preloaded, hasMore: nil)
        }
        generation += 1
        let id = generation
        link = .connecting
        streamTask = Task { [weak self] in
            await self?.run(hub: hub, generation: id)
        }
    }

    /// Stop following; the screen is leaving.
    func stop() {
        generation += 1
        streamTask?.cancel()
        streamTask = nil
        link = .connecting
        AppLog.debug(.chat, "会话 \(sessionId.prefix(8)) 停止跟随")
    }

    /// Restart a stream that a suspension or a long outage left dead.
    /// - Parameter hub: the client bound to the paired Host.
    func resume(hub: HubClient?) {
        guard let hub else { return }
        if link.isLive, streamTask != nil {
            return
        }
        AppLog.info(.chat, "会话 \(sessionId.prefix(8)) 恢复跟随", detail: "link=\(link)")
        stop()
        start(hub: hub)
    }

    /// Replace this screen's liveness with the Host's current report; a
    /// message-aligned opening page can begin mid-turn and hold no `turn/start`.
    /// - Parameters:
    ///   - running: whether the Host holds a turn executing for this Session.
    ///   - agentAttached: whether the Host holds an Agent for it.
    /// Whether the Host refused the prompt because another client owns the write.
    /// @param error - value the prompt call rejected with.
    static func isWriterHeld(_ error: Error) -> Bool {
        if let hubError = error as? HubError, case let .remote(code, _) = hubError {
            return code.contains("writer-held")
        }
        return error.localizedDescription.contains("writer-held")
            || error.localizedDescription.contains("active write handle")
    }

    /// Take a warm-up page that arrived after this screen opened.
    ///
    /// A tap that outruns the list's prefetch opened on a skeleton while the
    /// page was still travelling. The page is the same newest history the
    /// follow snapshot carries, so adopting it paints the conversation early
    /// instead of waiting for the socket. History already folded wins: a page
    /// that arrives after the snapshot adds nothing.
    /// - Parameter page: events the list cached for this Session.
    func adoptPreview(_ page: [JSONValue]) {
        guard !page.isEmpty, events.isEmpty else { return }
        mergeHistory(page, hasMore: nil)
        AppLog.info(.chat, "会话 \(sessionId.prefix(8)) 采用预取页", detail: "\(page.count) 条")
    }

    func adopt(running: Bool, agentAttached: Bool) {
        self.agentAttached = agentAttached
        isRunning = running
        folded.running = running
        folded.sawTurn = true
        // A turn the Host started before this screen opened has no start time in
        // the log; count from now rather than showing a stalled header.
        if running {
            if turnStartedAt == nil {
                turnStartedAt = Date().timeIntervalSince1970 * 1000
            }
        } else {
            turnStartedAt = nil
            awaitingTurn = false
        }
        refreshState()
    }

    // MARK: Commands

    /// Send one prompt, optionally with a photo the composer already downscaled.
    /// @param text - prompt text; may be empty when `image` is present.
    /// @param image - JPEG bytes to attach, or nil.
    /// @param context - a context block the phone appends itself; the Host's
    ///   own memory replaces it, so callers normally pass nil.
    /// @param receiptId - staged document to attach, when the owner uploaded one.
    func send(_ text: String, images: [Data] = [], context: String? = nil, receiptId: String? = nil) async {
        guard let hub, !isSendingPrompt else { return }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty || !images.isEmpty || receiptId != nil else { return }
        isSendingPrompt = true
        defer { isSendingPrompt = false }
        errorMessage = nil
        let wasAttached = agentAttached
        let localId = "local-\(UUID().uuidString)"
        // The Host records this identity on the durable message, so the echo
        // below can recognize the log's own copy of the prompt and stand down.
        let requestId = UUID().uuidString
        // The photos are already on the phone, so the echo draws them at once;
        // the durable message adopts these bytes when it arrives.
        let imageKeys = images.indices.map { index in "pending:\(requestId):\(index)" }
        for (key, data) in zip(imageKeys, images) {
            photos.seed(data, for: key)
        }
        if !imageKeys.isEmpty {
            echoImages[requestId] = imageKeys
        }
        echo.append(ChatItem(
            id: localId,
            kind: .user,
            text: Self.promptBody(text: trimmed, hasDocument: receiptId != nil),
            images: imageKeys.map { ChatImageRef(id: $0) },
            pending: true,
            requestId: requestId
        ))
        isRunning = true
        agentAttached = true
        publishRows(folded.rows + liveEcho)
        // The prompt counts as a running turn from the tap, so the header counts
        // the wait instead of freezing until the Host's first frame lands.
        turnStartedAt = Date().timeIntervalSince1970 * 1000
        awaitingTurn = true
        refreshState()
        do {
            try await hub.sendPrompt(
                sessionId: sessionId,
                requestId: requestId,
                text: trimmed,
                images: images,
                context: context,
                receiptId: receiptId
            )
            externallyOwned = false
            AppLog.info(
                .chat,
                "会话 \(sessionId.prefix(8)) 已发送",
                detail: "\(trimmed.count) 字 · \(images.count) 张图 · 回执 \(receiptId == nil ? "无" : "有")"
            )
        } catch {
            // Nothing was queued, so the conversation returns to the state the
            // reader last saw instead of claiming an Agent that never woke.
            isRunning = false
            agentAttached = wasAttached
            turnStartedAt = nil
            awaitingTurn = false
            echo.removeAll { $0.id == localId }
            if let keys = echoImages.removeValue(forKey: requestId) {
                photos.forget(keys)
            }
            publishRows(folded.rows + liveEcho)
            // A Session another client holds open is not over: its history is
            // current and the next prompt works once that writer lets go. The
            // Host says so with `session/writer-held`, and the header must not
            // read it as "ended".
            externallyOwned = Self.isWriterHeld(error)
            refreshState()
            errorMessage = externallyOwned
                ? "这段会话正在 Mac 上被写入（同一个会话同时只能有一个输入方）。在 Mac 上关掉它，或稍后重试。"
                : describe(error)
            AppLog.error(.chat, "会话 \(sessionId.prefix(8)) 发送失败", detail: describe(error))
        }
    }

    func cancel() async {
        guard let hub else { return }
        AppLog.notice(.chat, "会话 \(sessionId.prefix(8)) 请求停止")
        do {
            try await hub.cancelSession(sessionId: sessionId)
        } catch {
            errorMessage = describe(error)
            AppLog.error(.chat, "停止失败", detail: describe(error))
        }
    }

    /// Fetch the page before the oldest event already held, then fold again.
    /// History arrives one page at a time, when the reader reaches the top.
    func loadEarlier() async {
        // The oldest sequence is the cut for the page before it; a first record
        // without one must not stop paging for good.
        guard let hub, hasEarlier, !isLoadingEarlier,
              let oldest = events.compactMap({ $0["seq"]?.doubleValue }).min()
        else { return }
        isLoadingEarlier = true
        defer { isLoadingEarlier = false }
        AppLog.mark("对话 · 加载更早消息")
        let started = CFAbsoluteTimeGetCurrent()
        // A cut above the Host's cursor is refused as `past cursor`; the opening
        // snapshot names the newest sequence, so paging never runs past it.
        let cut = min(oldest - 1, snapshotCursor ?? oldest - 1)
        do {
            let page: (events: [JSONValue], hasMore: Bool) = if let parentSessionId {
                try await hub.pageSubagent(
                    parentSessionId: parentSessionId,
                    childSessionId: sessionId,
                    mode: subagentMode ?? "unknown",
                    throughSeq: cut,
                    maxMessages: SessionPageLimit.earlier
                )
            } else {
                try await hub.pageEvents(
                    sessionId: sessionId,
                    throughSeq: cut,
                    maxMessages: SessionPageLimit.earlier
                )
            }
            let known = seenSeqs
            let older = page.events.filter { event in
                guard let seq = event["seq"]?.doubleValue else { return true }
                return !known.contains(seq)
            }
            events = older + events
            seenSeqs.formUnion(older.compactMap { $0["seq"]?.doubleValue })
            loadedEarlier = true
            hasEarlier = page.hasMore
            earlierError = nil
            rebuild()
            AppLog.info(
                .chat,
                "会话 \(sessionId.prefix(8)) 加载更早消息",
                detail: "\(older.count) 条 · 共 \(events.count) 条 · \(Int((CFAbsoluteTimeGetCurrent() - started) * 1000)) ms"
            )
        } catch {
            // A page that failed to load is not a broken conversation: the
            // reader still sees what arrived, and the control stays available.
            earlierError = describe(error)
            AppLog.warning(.chat, "加载更早消息失败", detail: describe(error))
        }
    }
}

// MARK: - Stream

extension ChatModel {
    // MARK: Frames

    private func run(hub: HubClient, generation id: Int) async {
        await loadFirstPage(hub)
        var attempt = 0
        streamLoop: while !Task.isCancelled {
            do {
                if attempt > 0 {
                    link = .retrying(attempt: attempt)
                }
                attempt = try await followOnce(hub: hub, attempt: attempt)
            } catch {
                if Task.isCancelled {
                    return
                }
                switch await decision(for: error, hub: hub, attempt: attempt) {
                case let .retry(next):
                    attempt = next
                    link = .retrying(attempt: next)
                    AppLog.warning(
                        .chat,
                        "会话 \(sessionId.prefix(8)) 事件流中断，准备重连",
                        detail: "第 \(next) 次 · \(describe(error))"
                    )
                case let .stop(message):
                    // The status line already carries this sentence; a banner
                    // would repeat it and hide the conversation behind it.
                    link = .offline(message)
                    AppLog.error(.chat, "会话 \(sessionId.prefix(8)) 停止跟随", detail: message)
                    break streamLoop
                }
            }
            if attempt >= Self.attemptsBeforeOffline {
                link = .offline(nil)
                isLoadingInitial = false
                AppLog.error(.chat, "会话 \(sessionId.prefix(8)) 进入离线", detail: "重连次数用尽")
                break
            }
            let pause = min(8.0, 0.8 * Double(attempt))
            try? await Task.sleep(nanoseconds: UInt64(pause * 1_000_000_000))
        }
        if generation == id {
            streamTask = nil
        }
    }

    /// Hold one connection until the Host ends it or it fails.
    /// - Parameters:
    ///   - hub: the client bound to the paired Host.
    ///   - attempt: reconnects already spent.
    /// - Returns: the counter the next connection starts from.
    private func followOnce(hub: HubClient, attempt: Int) async throws -> Int {
        let stream: AsyncThrowingStream<JSONValue, Error> = if let parentSessionId {
            hub.followSubagent(
                parentSessionId: parentSessionId,
                childSessionId: sessionId,
                mode: subagentMode ?? "unknown",
                maxMessages: SessionPageLimit.opening
            )
        } else {
            hub.followStream(sessionId: sessionId, maxMessages: SessionPageLimit.opening)
        }
        var current = attempt
        for try await frame in stream {
            if Task.isCancelled {
                throw CancellationError()
            }
            if current > 0 {
                current = 0
            }
            if !link.isLive {
                link = .live
                AppLog.info(
                    .chat,
                    "会话 \(sessionId.prefix(8)) 事件流已连上",
                    detail: attempt > 0 ? "第 \(attempt) 次重连后" : nil
                )
            }
            ingest(frame)
        }
        guard !Task.isCancelled else { throw CancellationError() }
        // The Host closed the stream. A cold Session is still followable, so
        // reopen unless the credential itself was refused.
        return current + 1
    }

    /// What one stream failure means for this screen.
    private enum FailureDecision {
        case retry(Int)
        case stop(String)
    }

    /// Decide whether a failure is worth reconnecting from.
    /// - Parameters:
    ///   - error: what the stream threw.
    ///   - hub: the client bound to the paired Host.
    ///   - attempt: reconnects already spent.
    /// - Returns: the next attempt, or the message that ends the loop.
    private func decision(for error: Error, hub: HubClient, attempt: Int) async -> FailureDecision {
        // A refused upgrade is ambiguous: the mux answers `401` for a dead
        // cookie, and a tunnel in front of it answers the same way when the
        // Host is down. The HTTP carrier settles which one this is.
        if let failure = error as? HubError, case .handshakeRefused = failure,
           await cookieRejected(hub)
        {
            return .stop(describe(HubError.unauthorized))
        }
        guard let failure = error as? HubError, failure.isFinal else {
            return .retry(attempt + 1)
        }
        return .stop(describe(failure))
    }

    /// Ask the HTTP carrier whether the paired cookie is still accepted.
    /// - Parameter hub: the client bound to the paired Host.
    /// - Returns: true only when the Host answered `401` to an ordinary call;
    ///   a probe that could not complete proves nothing either way.
    private func cookieRejected(_ hub: HubClient) async -> Bool {
        do {
            _ = try await hub.listSessions()
            return false
        } catch HubError.unauthorized {
            return true
        } catch {
            return false
        }
    }

    /// Paint history before the socket finishes its handshake: the list's
    /// watermark addresses the newest page, so one short round trip is enough.
    private func loadFirstPage(_ hub: HubClient) async {
        guard events.isEmpty else {
            isLoadingInitial = false
            return
        }
        guard preloaded.isEmpty else {
            mergeHistory(preloaded, hasMore: nil)
            return
        }
        guard let cursorHint else { return }
        do {
            let page: (events: [JSONValue], hasMore: Bool) = if let parentSessionId {
                try await hub.pageSubagent(
                    parentSessionId: parentSessionId,
                    childSessionId: sessionId,
                    mode: subagentMode ?? "unknown",
                    throughSeq: cursorHint,
                    maxMessages: SessionPageLimit.opening
                )
            } else {
                try await hub.pageEvents(
                    sessionId: sessionId,
                    throughSeq: cursorHint,
                    maxMessages: SessionPageLimit.opening
                )
            }
            mergeHistory(page.events, hasMore: page.hasMore)
        } catch let failure as HubError where failure.isFinal {
            // A refusal the follow stream will repeat; showing it twice would
            // bury the conversation behind two identical reports.
            errorMessage = describe(failure)
        } catch {
            // Any other failure is the link's: the opening snapshot carries the
            // same page, so the skeleton stays a moment longer instead.
            return
        }
    }
}

// MARK: - Frames

extension ChatModel {
    private func ingest(_ frame: JSONValue) {
        switch frame["type"]?.stringValue {
        case "snapshot":
            snapshotCursor = frame["cursor"]?.doubleValue
            let page = (frame["records"]?.arrayValue ?? []).compactMap { $0["event"] }
            mergeHistory(page, hasMore: frame["hasMore"]?.boolValue ?? false)
            pendingStreamText = ""
            streamingText = ""
            agentPreset = frame["header"]?["agentPreset"]?.stringValue
            adoptProjection(frame["projections"])
            isLoadingInitial = false
        case "event":
            if let event = frame["event"] {
                merge(event)
            }
        case "assistant-stream":
            ingestAssistantStream(frame["frame"])
        default:
            // Frame types are merge-extensible: a newer Host may send one this
            // build does not know, and the stream stays usable without it.
            break
        }
    }

    private func ingestAssistantStream(_ frame: JSONValue?) {
        guard let frame else { return }
        switch frame["type"]?.stringValue {
        case "start":
            pendingStreamText = ""
            streamingText = ""
        case "chunk":
            guard let chunk = frame["chunk"] else { return }
            if chunk["type"]?.stringValue == "text-delta", let text = chunk["text"]?.stringValue {
                pendingStreamText += text
                scheduleStreamFlush()
            }
        case "end":
            pendingStreamText = ""
            streamingText = ""
        default:
            // Presentation frames grow additively; an unknown one is not an answer.
            break
        }
    }

    /// Newest sequence this screen holds; an empty log has none.
    private var newestSeq: Double {
        events.last?["seq"]?.doubleValue ?? snapshotCursor ?? -1
    }

    /// Adopt the model choice a snapshot's projection block carries.
    ///
    /// The projection is the only complete statement of the choice: a history
    /// page may start after the last switch, so folding events alone would show
    /// the route the Session used before it.
    /// - Parameter projections: the snapshot's projection baseline, or nil.
    private func adoptProjection(_ projections: JSONValue?) {
        guard let projections, let cut = projections["asOfSeq"]?.doubleValue else { return }
        if cut >= modelWatermark,
           let value = projections["values"]?["modelSelection"]?.decoded(ModelSelectionProjection.self)
        {
            modelWatermark = cut
            updateSelection(value.next ?? value.lastUsed)
        }
        if cut >= workingDirectoryWatermark,
           let directory = projections["values"]?["workingDirectory"]?.stringValue
        {
            workingDirectoryWatermark = cut
            updateWorkingDirectory(directory)
        }
        if cut >= permissionWatermark,
           let preset = projections["values"]?["permissions"]?["currentValue"]?.stringValue
        {
            permissionWatermark = cut
            currentPermission = preset
        }
    }

    /// Adopt one durable permission change younger than the applied facts.
    /// - Parameter event: one `permission/preset` wire event.
    private func adoptPermissionEvent(_ event: JSONValue) {
        guard event["type"]?.stringValue == "permission/preset",
              let seq = event["seq"]?.doubleValue, seq > permissionWatermark,
              let preset = event["data"]?["preset"]?.stringValue
        else { return }
        permissionWatermark = seq
        currentPermission = preset
    }

    /// Adopt one durable directory change younger than the applied facts.
    /// - Parameter event: one `working-directory/change` wire event.
    private func adoptWorkingDirectoryEvent(_ event: JSONValue) {
        guard event["type"]?.stringValue == "working-directory/change",
              let seq = event["seq"]?.doubleValue, seq > workingDirectoryWatermark,
              let directory = event["data"]?["cwd"]?.stringValue
        else { return }
        workingDirectoryWatermark = seq
        updateWorkingDirectory(directory)
    }

    /// Publish a directory without redrawing for the one already on screen.
    /// - Parameter directory: absolute directory, or nil when the Host reported none.
    private func updateWorkingDirectory(_ directory: String?) {
        if workingDirectory != directory {
            workingDirectory = directory
        }
    }

    /// Adopt one durable `model/selection` event younger than the applied facts.
    /// - Parameter event: one wire event, live or from a history page.
    private func adoptModelEvent(_ event: JSONValue) {
        guard event["type"]?.stringValue == "model/selection",
              let seq = event["seq"]?.doubleValue, seq > modelWatermark,
              let route = event["data"]?.decoded(ModelRoute.self)
        else { return }
        modelWatermark = seq
        updateSelection(route)
    }

    /// Publish a choice without redrawing for one already on screen.
    /// - Parameter route: the recorded choice, or nil when the Session has none.
    private func updateSelection(_ route: ModelRoute?) {
        if modelSelection != route {
            modelSelection = route
        }
    }

    /// Add one live event unless its sequence is already part of the log.
    private func merge(_ event: JSONValue) {
        adoptModelEvent(event)
        adoptWorkingDirectoryEvent(event)
        adoptPermissionEvent(event)
        guard let seq = event["seq"]?.doubleValue else {
            events.append(event)
            apply(event, to: &folded)
            scheduleFlush()
            return
        }
        guard seenSeqs.insert(seq).inserted else { return }
        if let newest = events.last?["seq"]?.doubleValue, seq < newest {
            // A frame that slipped behind one already held: keep the log ordered
            // and fold once over it rather than emitting rows out of order.
            let index = events.firstIndex { ($0["seq"]?.doubleValue ?? .infinity) > seq } ?? events.endIndex
            events.insert(event, at: index)
            rebuild()
        } else {
            events.append(event)
            apply(event, to: &folded)
            scheduleFlush()
        }
        if event["type"]?.stringValue == "assistant/message" {
            pendingStreamText = ""
            streamingText = ""
        }
    }

    /// Merge one page that may overlap events already held.
    /// - Parameters:
    ///   - page: events oldest first.
    ///   - hasMore: whether the Host holds older records, or nil when unknown.
    private func mergeHistory(_ page: [JSONValue], hasMore: Bool?) {
        guard !page.isEmpty else {
            isLoadingInitial = false
            if let hasMore, !loadedEarlier {
                hasEarlier = hasMore
            }
            return
        }
        let previousNewest = events.last?["seq"]?.doubleValue
        let incoming = Set(page.compactMap { $0["seq"]?.doubleValue })
        events.removeAll { event in
            guard let seq = event["seq"]?.doubleValue else { return false }
            return incoming.contains(seq)
        }
        events.append(contentsOf: page)
        events.sort { ($0["seq"]?.doubleValue ?? -1) < ($1["seq"]?.doubleValue ?? -1) }
        seenSeqs = Set(events.compactMap { $0["seq"]?.doubleValue })
        // A page can carry the newest recorded choice when the opening snapshot
        // did not; the projection adopted afterwards still wins when it is newer.
        for event in page {
            adoptModelEvent(event)
        }
        if let hasMore, !loadedEarlier {
            hasEarlier = hasMore
        }
        isLoadingInitial = false
        rebuild()
        AppLog.debug(
            .chat,
            "合并历史 \(sessionId.prefix(8))",
            detail: "\(page.count) 条 → 共 \(events.count) 条"
        )
        // A reconnect snapshots only its newest page; anything past it while the
        // socket was down stays missing unless the hole is paged back in.
        if let previousNewest,
           let snapshotOldest = page.compactMap({ $0["seq"]?.doubleValue }).min(),
           snapshotOldest > previousNewest + 1
        {
            let range = previousNewest + 1 ... snapshotOldest - 1
            Task { [weak self] in await self?.fillGap(range) }
        }
    }

    /// Fetch the events a reconnect skipped, newest page first, until the hole
    /// closes against what this screen already holds.
    /// - Parameter range: missing sequence span, inclusive.
    private func fillGap(_ range: ClosedRange<Double>) async {
        guard let hub, !isFillingGap, !isLoadingEarlier else { return }
        isFillingGap = true
        defer { isFillingGap = false }
        var upper = range.upperBound
        for _ in 0 ..< 8 {
            guard upper >= range.lowerBound else { return }
            let page: (events: [JSONValue], hasMore: Bool)
            do {
                if let parentSessionId {
                    page = try await hub.pageSubagent(
                        parentSessionId: parentSessionId,
                        childSessionId: sessionId,
                        mode: subagentMode ?? "unknown",
                        throughSeq: upper,
                        maxMessages: SessionPageLimit.earlier
                    )
                } else {
                    page = try await hub.pageEvents(
                        sessionId: sessionId,
                        throughSeq: upper,
                        maxMessages: SessionPageLimit.earlier
                    )
                }
            } catch {
                return
            }
            let incoming = page.events.filter { event in
                guard let seq = event["seq"]?.doubleValue else { return true }
                return !seenSeqs.contains(seq)
            }
            guard let oldest = incoming.compactMap({ $0["seq"]?.doubleValue }).min() else { return }
            mergeFetched(incoming)
            guard oldest > range.lowerBound else { return }
            upper = oldest - 1
        }
    }

    /// Insert events fetched out of band, leaving the older-history flag alone.
    /// - Parameter page: events in any order.
    private func mergeFetched(_ page: [JSONValue]) {
        events.append(contentsOf: page)
        events.sort { ($0["seq"]?.doubleValue ?? -1) < ($1["seq"]?.doubleValue ?? -1) }
        seenSeqs.formUnion(page.compactMap { $0["seq"]?.doubleValue })
        rebuild()
    }

    /// Rebuild rows from the whole log; used when a page arrives out of order.
    private func rebuild() {
        let started = CFAbsoluteTimeGetCurrent()
        AppLog.mark("重建转录 \(events.count) 条")
        // A rebuild replays the whole log, so the files it collects start empty.
        deliverables = []
        var fold = Fold(running: seededRunning)
        for event in events {
            apply(event, to: &fold)
        }
        folded = fold
        flush()
        let elapsed = Int(((CFAbsoluteTimeGetCurrent() - started) * 1000).rounded())
        if elapsed >= 150 {
            // A rebuild this slow runs on the main actor; a long Session that
            // rebuilt on every out-of-order frame is a hang candidate, so the
            // cost stays visible in the log.
            AppLog.warning(
                .chat,
                "会话 \(sessionId.prefix(8)) 重建转录",
                detail: "\(elapsed) ms · \(events.count) 条事件 · \(fold.rows.count) 行"
            )
        }
    }

    // Fold one event into the rows already built.
}

// MARK: - Folding

extension ChatModel {
    private func apply(_ event: JSONValue, to fold: inout Fold) {
        let type = event["type"]?.stringValue ?? ""
        let data = event["data"]
        let time = event["time"]?.doubleValue
        switch type {
        case "user/message":
            appendUserMessage(event, data, time: time, to: &fold)
        case "assistant/message":
            appendAssistantMessage(event, data, time: time, to: &fold)
        case "tool/call":
            appendToolCall(data, time: time, to: &fold)
        case "tool/result":
            settleToolResult(data, time: time, to: &fold)
        case "turn/start":
            if let turn = data?["turn"]?.doubleValue {
                fold.turn = finiteInt(turn)
            }
            fold.running = true
            fold.sawTurn = true
            // The Host's own clock is the only start both screens agree on; a
            // frame without one still leaves the phase countable.
            fold.turnStartedAt = time ?? Date().timeIntervalSince1970 * 1000
        case "turn/end":
            if let start = fold.turnStartedAt, let time, time >= start {
                fold.lastTurnDuration = time - start
            }
            fold.turnStartedAt = nil
            fold.running = false
            fold.sawTurn = true
        case "deliverables/presented":
            collectDeliverables(event, data)
        default:
            return
        }
    }

    /// Append the owner's own words, without the memory block the phone added.
    ///
    /// The log also carries user-role messages the harness wrote itself: turn
    /// timing notices, action-card statuses, skill load results, approvals. Only
    /// `source.kind == "user"` is something the person typed, so everything else
    /// stays off the transcript a reader sees as their own words.
    private func appendUserMessage(
        _ event: JSONValue,
        _ data: JSONValue?,
        time: Double?,
        to fold: inout Fold
    ) {
        let content = Self.content(of: data)
        guard !content.isEmpty else { return }
        guard Self.isPersonMessage(data) else {
            // The Desktop renders these as a context disclosure; a row keeps the
            // same information without claiming the person wrote it. A notice
            // with no words of its own has nothing to disclose.
            guard !content.text.isEmpty else { return }
            fold.rows.append(ChatItem(
                id: "context-\(event["seq"]?.doubleValue ?? Double(fold.rows.count))",
                kind: .context,
                text: content.text,
                time: time,
                turn: fold.turn,
                label: Self.contextLabel(data)
            ))
            return
        }
        // The message is in the log now, so this screen's echo of it — the row
        // shown while the prompt travelled — has nothing left to stand in for.
        if let requestId = Self.requestId(of: data) {
            fold.echoedRequests.insert(requestId)
            // The same prompt's photos were seeded under the echo's own keys;
            // hand them to the identities the Host recorded so the picture does
            // not blink when the row becomes durable.
            if let keys = echoImages.removeValue(forKey: requestId) {
                photos.adopt(keys, as: content.images.map(\.id))
            }
        }
        let text = PersonalMemory.strippingContextBlock(content.text)
        guard !text.isEmpty || !content.images.isEmpty else { return }
        fold.sawMessage = true
        fold.rows.append(ChatItem(
            id: "user-\(event["seq"]?.doubleValue ?? Double(fold.rows.count))",
            kind: .user,
            text: text,
            images: content.images,
            time: time,
            turn: fold.turn
        ))
    }

    /// Append one answer when it first appears.
    private func appendAssistantMessage(
        _ event: JSONValue,
        _ data: JSONValue?,
        time: Double?,
        to fold: inout Fold
    ) {
        // A durable assistant event keeps its message under `message`; only the
        // usage counters sit beside it. Older sources wrote the content inline.
        let payload = data?["message"] ?? data
        // A step that only reasoned writes a whitespace-only text block; it is
        // not an answer and must not become an empty bubble.
        guard let raw = Self.text(of: payload),
              case let text = raw.trimmingCharacters(in: .whitespacesAndNewlines),
              !text.isEmpty
        else { return }
        fold.totals.add(usage: data?["usage"])
        fold.sawMessage = true
        fold.rows.append(ChatItem(
            id: "assistant-\(event["seq"]?.doubleValue ?? Double(fold.rows.count))",
            kind: .assistant,
            text: text,
            time: time,
            turn: Self.turn(of: data) ?? fold.turn
        ))
    }

    /// Append one tool card when its call first appears.
    private func appendToolCall(_ data: JSONValue?, time: Double?, to fold: inout Fold) {
        let callId = data?["callId"]?.stringValue ?? UUID().uuidString
        guard !fold.rows.contains(where: { $0.tool?.callId == callId }) else { return }
        fold.totals.toolCalls += 1
        fold.rows.append(ChatItem(
            id: "tool-\(callId)",
            kind: .tool,
            text: "",
            time: time,
            turn: Self.turn(of: data) ?? fold.turn,
            tool: ToolDetail(
                callId: callId,
                name: data?["name"]?.stringValue ?? "tool",
                arguments: data?["arguments"]?.stringValue ?? "",
                status: .running,
                startedAt: time
            )
        ))
    }

    /// Attach one result to the card its call created.
    private func settleToolResult(_ data: JSONValue?, time: Double?, to fold: inout Fold) {
        let message = data?["message"]
        let callId = message?["source"]?["callId"]?.stringValue ?? ""
        guard let index = fold.rows.lastIndex(where: { $0.tool?.callId == callId }) else { return }
        var detail = fold.rows[index].tool ?? ToolDetail(callId: callId, name: "tool", arguments: "", status: .done)
        detail.result = Self.text(of: message) ?? Self.text(of: data)
        detail.status = message?["isError"]?.boolValue == true ? .failed : .done
        detail.finishedAt = time
        fold.rows[index].tool = detail
    }

    /// Collect the files a turn presented, replacing the list once per replay.
    private func collectDeliverables(_ event: JSONValue, _ data: JSONValue?) {
        for entry in data?["files"]?.arrayValue ?? [] {
            guard let path = entry["path"]?.stringValue, !path.isEmpty,
                  !deliverables.contains(where: { $0.path == path })
            else { continue }
            deliverables.append(DeliveredFile(
                path: path,
                description: entry["description"]?.stringValue,
                seq: event["seq"]?.doubleValue
            ))
        }
    }

    /// Coalesce a burst of events into one UI update; a turn arrives as many
    /// frames and publishing each one re-diffs the whole transcript.
    private func scheduleFlush() {
        guard !flushScheduled else { return }
        flushScheduled = true
        Task { @MainActor [weak self] in
            // 60 ms keeps a streaming turn fluid while halving the number of
            // full transcript re-diffs a fast Host would otherwise cause.
            try? await Task.sleep(nanoseconds: 60_000_000)
            guard let self else { return }
            flushScheduled = false
            flush()
        }
    }

    /// Coalesce stream chunks the way `scheduleFlush` coalesces events: a fast
    /// Host sends tens of deltas a second and each published delta re-diffs the
    /// whole transcript, so the pending row repaints at a fixed cadence instead
    /// of once per token.
    private func scheduleStreamFlush() {
        guard !streamFlushScheduled else { return }
        streamFlushScheduled = true
        Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 80_000_000)
            guard let self else { return }
            streamFlushScheduled = false
            if streamingText != pendingStreamText {
                streamingText = pendingStreamText
            }
        }
    }

    /// Publish the accumulated rows, totals, and running flag once.
    private func flush() {
        publishRows(folded.rows + liveEcho)
        usage = folded.totals
        // A prompt this phone sent keeps the turn running until the Host opens it,
        // even when history already holds a settled turn: `sawTurn` alone would
        // flip the composer back to Send during the HTTP round trip.
        let running = folded.running || awaitingTurn || (!folded.sawTurn && (isRunning || seededRunning))
        isRunning = running
        // The Host's turn start replaces the optimistic clock; a settled turn
        // clears both, so the header never counts a turn that already ended.
        if let started = folded.turnStartedAt {
            if turnStartedAt != started {
                turnStartedAt = started
            }
            awaitingTurn = false
        } else if !running {
            turnStartedAt = nil
            awaitingTurn = false
        }
        if lastTurnDuration != folded.lastTurnDuration {
            lastTurnDuration = folded.lastTurnDuration
        }
        refreshState()
    }

    /// Publish one transcript snapshot: the rows, their display grouping, and the
    /// still-running tool.
    ///
    /// Grouping and the running-tool scan used to live in the view body, which
    /// regrouped and rescanned the whole transcript on every evaluation — once
    /// per streamed chunk while a turn writes.
    /// - Parameter value: the rows the transcript draws.
    private func publishRows(_ value: [ChatItem]) {
        rows = value
        entries = group(value)
        runningTool = value.last(where: { $0.tool?.status == .running })?.tool
    }

    /// Group rows for display: one turn's tool calls, the notes the Agent wrote
    /// between them, and the context the harness injected all sit under one
    /// disclosure. The last answer with no tool call after it stays in the
    /// stream as the answer, so a long turn reads as
    /// "message → 已完成 · N 次工具调用 → 回答".
    /// - Parameter rows: the rows to group.
    /// - Returns: the transcript entries, in display order.
    private func group(_ rows: [ChatItem]) -> [TranscriptEntry] {
        var entries: [TranscriptEntry] = []
        var pending: [ChatItem] = []
        for (index, item) in rows.enumerated() {
            switch item.kind {
            case .user, .notice:
                flushTools(&pending, into: &entries, rows: rows)
                entries.append(.single(item))
            case .assistant where isAnswer(at: index, in: rows):
                flushTools(&pending, into: &entries, rows: rows)
                entries.append(.single(item))
            default:
                pending.append(item)
            }
        }
        flushTools(&pending, into: &entries, rows: rows)
        return entries
    }

    /// Whether one assistant row is the turn's answer rather than a note the
    /// Agent wrote on its way to a tool call.
    ///
    /// A step that only narrates its next call ends with a tool call right
    /// after it, so the final text of a turn — the one no call follows — is the
    /// answer. Everything before it belongs to the folded work.
    /// - Parameters:
    ///   - index: position in `rows`.
    ///   - rows: the rows being grouped.
    /// - Returns: whether the row is the turn's answer.
    private func isAnswer(at index: Int, in rows: [ChatItem]) -> Bool {
        let item = rows[index]
        var cursor = index + 1
        while cursor < rows.count {
            let next = rows[cursor]
            if next.kind == .user || next.kind == .notice || next.turn != item.turn {
                return true
            }
            if next.kind == .tool || next.kind == .assistant {
                return false
            }
            cursor += 1
        }
        return true
    }

    /// Fold the rows collected since the last message.
    ///
    /// Context rows alone are not work: a turn that only injected notices
    /// keeps its disclosures visible instead of hiding them under a "过程"
    /// header with nothing behind it.
    /// - Parameters:
    ///   - pending: rows accumulated since the last flush point; emptied here.
    ///   - entries: the entry list being built.
    ///   - rows: the full row list, for the running-turn check.
    private func flushTools(_ pending: inout [ChatItem], into entries: inout [TranscriptEntry], rows: [ChatItem]) {
        defer { pending.removeAll() }
        guard !pending.isEmpty else { return }
        guard pending.contains(where: { $0.kind == .tool || $0.kind == .assistant }) else {
            entries.append(contentsOf: pending.map { .single($0) })
            return
        }
        let lastId = rows.last?.id
        let running = isRunning && pending.contains { $0.id == lastId }
        entries.append(.process(steps: pending, running: running))
    }

    /// Prompts this phone sent that the durable log does not hold yet.
    ///
    /// A prompt travels over HTTP while its message reaches this screen over the
    /// stream, so the row appears immediately and leaves once the Host's own copy
    /// of it, carrying the same `rpcId`, has been folded in.
    private var liveEcho: [ChatItem] {
        echo.filter { item in
            guard let requestId = item.requestId else { return true }
            return !folded.echoedRequests.contains(requestId)
        }
    }

    /// Re-derive the header state from the flags this screen holds.
    private func refreshState() {
        // Any row the reader can see is content; a Session the Host called blank
        // has none until the first message arrives.
        // A Session another client holds is live, whatever this screen's own
        // flags say: the Host refused a write, not the conversation.
        let next = SessionState.resolve(
            running: isRunning || externallyOwned,
            agentAttached: agentAttached || externallyOwned,
            hasContent: folded.sawMessage || !seededBlank
        )
        if state != next {
            state = next
        }
    }
}

// MARK: - Model

extension ChatModel {
    /// Read one photo a realized row is about to draw.
    ///
    /// The row asks when it appears rather than the transcript scanning every
    /// row it holds: a long conversation keeps only the photos it has shown, and
    /// the store dedupes so a redraw never repeats a request.
    /// - Parameter image: the photo, with the complete reference the Host
    ///   recorded once the message settled.
    func loadImage(_ image: ChatImageRef) {
        guard let hub else { return }
        photos.load([image], sessionId: sessionId, hub: hub)
    }

    /// Whether this screen may change the model at all.
    ///
    /// A child Session is served only through its parent's durable address, so
    /// an Agent-bound switch would wake it outside that path; the Host refuses
    /// that and the screen does not offer it.
    var allowsModelSwitch: Bool {
        parentSessionId == nil && blockedReason == nil
    }

    /// Read the Host's permission catalog once for this conversation.
    func loadPermissions(hub: HubClient?) async {
        guard let hub, permissionOptions.isEmpty else { return }
        do {
            permissionOptions = try await hub.permissionCatalog().options
        } catch {
            permissionError = describe(error)
            AppLog.warning(.session, "权限目录读取失败", detail: describe(error))
        }
    }

    /// Switch this Session's permission preset through the Host command.
    /// - Parameter preset: catalog value to apply.
    func setPermission(_ preset: String) async {
        guard let hub, !isChangingPermission else { return }
        isChangingPermission = true
        permissionError = nil
        defer { isChangingPermission = false }
        do {
            guard let execution = try await hub.executeCommand(
                sessionId: sessionId,
                line: "/permission \(preset)"
            ) else {
                permissionError = "Host 没有 /permission 命令"
                return
            }
            guard execution.result.kind == "success" else {
                permissionError = execution.result.text ?? "切换权限失败"
                return
            }
            currentPermission = preset
            permissionWatermark = max(permissionWatermark, newestSeq)
            AppLog.info(.session, "会话 \(sessionId.prefix(8)) 权限已切换", detail: preset)
        } catch {
            permissionError = describe(error)
            AppLog.error(.session, "切换权限失败", detail: describe(error))
        }
    }

    /// Record one model choice for this Session.
    ///
    /// The switch applies to the next model step, so it is safe while a turn is
    /// running; the Host answers with the selection it normalized.
    /// - Parameter route: provider, provider-owned model id, and optional effort.
    func selectModel(_ route: ModelRoute) async {
        guard allowsModelSwitch, let hub, !isSwitchingModel else { return }
        isSwitchingModel = true
        modelError = nil
        defer { isSwitchingModel = false }
        do {
            let selected = try await hub.selectModel(sessionId: sessionId, route: route)
            modelSelection = selected
            // The Host appends this choice at the log's tail; everything this
            // screen already holds is older, so a page that arrives later can
            // no longer put the previous choice back.
            modelWatermark = max(modelWatermark, newestSeq)
            AppLog.info(
                .model,
                "会话 \(sessionId.prefix(8)) 已切换模型",
                detail: "\(selected.provider)/\(selected.model) · 推理等级 \(selected.reasoningEffort ?? "默认")"
            )
        } catch {
            // A Session another client is writing refuses the same way a
            // prompt does; say that, instead of relaying the Host's sentence.
            if Self.isWriterHeld(error) {
                externallyOwned = true
                refreshState()
                modelError = "这段会话正在 Mac 上被写入（同一个会话同时只能有一个输入方）。在 Mac 上关掉它，或稍后重试。"
            } else {
                modelError = describe(error)
            }
            AppLog.error(.model, "切换模型失败", detail: describe(error))
        }
    }
}
