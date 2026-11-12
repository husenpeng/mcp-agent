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
    @Published private(set) var streamingText = ""
    @Published private(set) var isRunning: Bool
    @Published private(set) var link: Link = .connecting
    @Published private(set) var state: SessionState
    @Published private(set) var usage = TokenTotals()
    @Published private(set) var agentPreset: String?
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
    /// Prompts sent from this phone, shown until their Host event arrives.
    private var echo: [ChatItem] = []
    /// Running flag the list reported, used until a turn event is seen.
    private let seededRunning: Bool
    /// Whether the Host reported the Session as never used before.
    private let seededBlank: Bool
    /// Guards the backfill that closes a hole a socket drop left behind.
    private var isFillingGap = false
    /// Whether the Host held an Agent when this screen opened.
    /// Set when the Host reports another client writing this Session.
    @Published private(set) var externallyOwned = false
    private var agentAttached: Bool

    /// Watermark the list projected, used for the first page before the stream opens.
    private let cursorHint: Double?
    /// Newest sequence the Host reported in an opening snapshot. A page cut above
    /// it is rejected as `past cursor`, so paging clamps to this value.
    private var snapshotCursor: Double?
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
    init(
        sessionId: String,
        running: Bool = false,
        agentAttached: Bool = true,
        blank: Bool = false,
        cursor: Double? = nil,
        blockedReason: String? = nil,
        preloaded: [JSONValue] = [],
        parentSessionId: String? = nil,
        subagentMode: String? = nil
    ) {
        self.sessionId = sessionId
        self.parentSessionId = parentSessionId
        self.subagentMode = subagentMode
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

    func adopt(running: Bool, agentAttached: Bool) {
        self.agentAttached = agentAttached
        isRunning = running
        folded.running = running
        folded.sawTurn = true
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
        guard let hub else { return }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty || !images.isEmpty || receiptId != nil else { return }
        errorMessage = nil
        let wasAttached = agentAttached
        let localId = "local-\(UUID().uuidString)"
        // The Host records this identity on the durable message, so the echo
        // below can recognize the log's own copy of the prompt and stand down.
        let requestId = UUID().uuidString
        echo.append(ChatItem(
            id: localId,
            kind: .user,
            text: Self.promptBody(text: trimmed, images: images.count, hasDocument: receiptId != nil),
            pending: true,
            requestId: requestId
        ))
        rows = folded.rows + liveEcho
        isRunning = true
        agentAttached = true
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
            echo.removeAll { $0.id == localId }
            rows = folded.rows + liveEcho
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
            streamingText = ""
            agentPreset = frame["header"]?["agentPreset"]?.stringValue
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
            streamingText = ""
        case "chunk":
            guard let chunk = frame["chunk"] else { return }
            if chunk["type"]?.stringValue == "text-delta", let text = chunk["text"]?.stringValue {
                streamingText += text
            }
        case "end":
            streamingText = ""
        default:
            // Presentation frames grow additively; an unknown one is not an answer.
            break
        }
    }

    /// Add one live event unless its sequence is already part of the log.
    private func merge(_ event: JSONValue) {
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
            fold.running = true
            fold.sawTurn = true
        case "turn/end":
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
        guard let joined = Self.body(of: data), !joined.isEmpty else { return }
        guard Self.isPersonMessage(data) else {
            // The Desktop renders these as a context disclosure; a row keeps the
            // same information without claiming the person wrote it.
            fold.rows.append(ChatItem(
                id: "context-\(event["seq"]?.doubleValue ?? Double(fold.rows.count))",
                kind: .context,
                text: joined,
                time: time,
                label: Self.contextLabel(data)
            ))
            return
        }
        // The message is in the log now, so this screen's echo of it — the row
        // shown while the prompt travelled — has nothing left to stand in for.
        if let requestId = Self.requestId(of: data) {
            fold.echoedRequests.insert(requestId)
        }
        let text = PersonalMemory.strippingContextBlock(joined)
        guard !text.isEmpty else { return }
        if let last = fold.rows.last, last.kind == .user, last.text == text {
            return
        }
        fold.sawMessage = true
        fold.rows.append(ChatItem(
            id: "user-\(event["seq"]?.doubleValue ?? Double(fold.rows.count))",
            kind: .user,
            text: text,
            time: time
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
        if let last = fold.rows.last, last.kind == .assistant, last.text == text {
            return
        }
        fold.sawMessage = true
        fold.rows.append(ChatItem(
            id: "assistant-\(event["seq"]?.doubleValue ?? Double(fold.rows.count))",
            kind: .assistant,
            text: text,
            time: time
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

    /// Publish the accumulated rows, totals, and running flag once.
    private func flush() {
        rows = folded.rows + liveEcho
        usage = folded.totals
        // Until a turn event arrives, an optimistic send keeps the composer in
        // its stop state instead of flipping back to send.
        let running = folded.sawTurn ? folded.running : (isRunning || seededRunning)
        isRunning = running
        refreshState()
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
