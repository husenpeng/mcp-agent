//
//  InteractionCenter.swift
//  Tomato Remote
//
//  Pending questions and approvals, delivered live.
//
//  A Host that wants a person asks through a forwarded waterfall: it holds the
//  Agent until some client answers, and whichever client answers first settles
//  the request for everyone. The phone therefore keeps the event stream open
//  while the app is running, answers from a sheet, and posts a local
//  notification when a request arrives with the app in the background.
//
//  The same stream carries the Host's session notifications — a turn that
//  starts or ends, a Session that gains or loses an Agent. They are forwarded
//  through `onHostEvent` so the list reflects them immediately instead of
//  reading the whole list again.
//
//  The Host has no push capability, so a suspended app receives nothing. The
//  stream reconnects whenever the app returns to the foreground.
//

import SwiftUI
import UserNotifications

/// One card the owner must settle.
@MainActor
final class InteractionCenter: ObservableObject {
    @Published private(set) var pending: [PendingInteraction] = []
    /// Requests whose answer is in flight; keeps the card visible until the
    /// Host acknowledges it.
    @Published private(set) var resolving: Set<String> = []
    @Published private(set) var isConnected = false
    @Published var errorMessage: String?
    /// Sink for the Host notifications that are not interactions, as
    /// `(event, positional arguments)`.
    ///
    /// One socket carries both kinds, so a second stream would duplicate the
    /// reconnect loop and the Host would push the same state twice.
    var onHostEvent: (@MainActor (String, [JSONValue]) -> Void)?

    /// Identity the Host bound to this event-stream connection; every answer
    /// names it.
    private var clientId: String?
    private var streamTask: Task<Void, Never>?
    /// Distinguishes the current stream loop from one still tearing down.
    private var generation = 0
    private var hub: HubClient?
    /// Requests already announced, so a reconnect does not repeat a banner.
    private var announced = Set<String>()
    /// Cards that existed when the current stream opened. The Host re-delivers
    /// every request still waiting, so one it does not repeat was settled by
    /// another client (or its turn ended) while this phone was away.
    private var awaitingRedelivery = Set<String>()
    /// Which reconciliation the pending window belongs to; a reconnect bumps it.
    private var reconcileTicket = 0
    private var reconcileTask: Task<Void, Never>?
    /// Grace period for the re-delivery that follows a `ready` frame.
    private static let redeliveryWindow = Duration.seconds(2)

    /// Whether any request is waiting on the owner.
    var hasPending: Bool {
        !pending.isEmpty
    }

    /// Ask for notification permission once, when the stream first opens.
    /// The prompt is cheap and reversible; denying it leaves the in-app sheet.
    func requestNotificationPermission() {
        #if DEBUG
            // A UI check or screenshot run owns the screen; the system prompt
            // would sit over the surface under inspection.
            if ProcessInfo.processInfo.arguments.contains("-TOMATO_NO_NOTIFICATIONS") {
                return
            }
        #endif
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    /// Open the forwarded-event stream. Idempotent across `.task` and retries.
    /// - Parameter hub: client bound to the paired Host.
    func start(hub: HubClient?) {
        guard streamTask == nil, let hub else { return }
        self.hub = hub
        errorMessage = nil
        requestNotificationPermission()
        AppLog.info(.stream, "打开交互事件流")
        generation += 1
        let generation = generation
        streamTask = Task { [weak self] in
            guard let self else { return }
            var attempt = 0
            while !Task.isCancelled {
                do {
                    for try await frame in hub.eventFrames() {
                        guard self.generation == generation else { return }
                        ingest(frame)
                        attempt = 0
                        if !isConnected {
                            isConnected = true
                            AppLog.info(.stream, "交互事件流已连接")
                        }
                    }
                    isConnected = false
                    break
                } catch {
                    if Task.isCancelled {
                        break
                    }
                    isConnected = false
                    attempt += 1
                    if attempt > 5 {
                        errorMessage = describe(error)
                        AppLog.error(.stream, "交互事件流停止重连", detail: describe(error))
                        break
                    }
                    errorMessage = "事件流中断，正在重试（\(attempt)/5）…"
                    AppLog.warning(.stream, "交互事件流中断", detail: "第 \(attempt) 次 · \(describe(error))")
                    try? await Task.sleep(nanoseconds: UInt64(attempt) * 2_000_000_000)
                }
            }
            if self.generation == generation {
                streamTask = nil
            }
        }
    }

    func stop() {
        generation += 1
        streamTask?.cancel()
        streamTask = nil
        reconcileTask?.cancel()
        reconcileTask = nil
        reconcileTicket += 1
        awaitingRedelivery.removeAll()
        isConnected = false
        clientId = nil
        AppLog.debug(.stream, "关闭交互事件流")
    }

    /// Reopen the stream after the app returns from the background.
    /// - Parameter hub: client bound to the paired Host.
    func resume(hub: HubClient?) {
        guard streamTask == nil else { return }
        start(hub: hub)
    }

    // MARK: Frames

    private func ingest(_ frame: JSONValue) {
        switch frame["type"]?.stringValue {
        case "ready":
            clientId = frame["clientId"]?.stringValue
            errorMessage = nil
            awaitRedelivery()
        case "waterfall":
            guard let id = frame["eventId"]?.stringValue,
                  let event = frame["event"]?.stringValue,
                  let request = frame["request"] else { return }
            AppLog.info(.stream, "收到待处理请求", detail: event)
            awaitingRedelivery.remove(id)
            let sessionId = frame["agentId"]?.stringValue
            let interaction: PendingInteraction? = switch event {
            case "user-questions/request":
                Self.questions(id: id, sessionId: sessionId, request: request)
            case "approval/request":
                Self.approval(id: id, sessionId: sessionId, request: request)
            default:
                nil
            }
            guard let interaction else { return }
            if !pending.contains(where: { $0.id == id }) {
                pending.append(interaction)
            }
            announce(interaction)
        case "cancel":
            guard let id = frame["eventId"]?.stringValue else { return }
            awaitingRedelivery.remove(id)
            pending.removeAll { $0.id == id }
            resolving.remove(id)
            Self.withdrawNotification([id])
        case "emit":
            // Forwarded notifications name their event and carry the Host's own
            // positional arguments; the sink decides which ones it reads.
            guard let event = frame["event"]?.stringValue else { return }
            onHostEvent?(event, frame["args"]?.arrayValue ?? [])
        default:
            break
        }
    }

    /// Read the questions of one `user-questions/request`.
    private static func questions(id: String, sessionId: String?, request: JSONValue) -> PendingInteraction? {
        guard let raw = request["questions"]?.arrayValue else { return nil }
        let items = raw.compactMap { item -> QuestionItem? in
            guard let text = item["question"]?.stringValue, let itemId = item["id"]?.stringValue else { return nil }
            return QuestionItem(
                id: itemId,
                question: text,
                detail: item["detail"]?.stringValue,
                header: item["header"]?.stringValue,
                options: item["options"]?.arrayValue?.compactMap { option in
                    option["label"]?.stringValue.map { QuestionOption(label: $0, description: option["description"]?.stringValue) }
                },
                multiSelect: item["multiSelect"]?.boolValue ?? item["multi_select"]?.boolValue,
                intent: nil
            )
        }
        guard !items.isEmpty else { return nil }
        return PendingInteraction(
            id: id,
            sessionId: sessionId,
            kind: .questions(items, timed: request["wait"] != nil),
            receivedAt: Date()
        )
    }

    /// Read one `approval/request`.
    private static func approval(id: String, sessionId: String?, request: JSONValue) -> PendingInteraction? {
        guard let tool = request["toolName"]?.stringValue else { return nil }
        let reason = request["displayReason"]?["zh"]?.stringValue
            ?? request["displayReason"]?["en"]?.stringValue
            ?? request["reason"]?.stringValue
        return PendingInteraction(
            id: id,
            sessionId: sessionId,
            kind: .approval(toolName: tool, reason: reason),
            receivedAt: Date()
        )
    }

    private func announce(_ interaction: PendingInteraction) {
        guard !announced.contains(interaction.id) else { return }
        announced.insert(interaction.id)
        // Foreground delivery belongs to the sheet; a banner on top of it would
        // be noise. Absent key means the app is not foreground.
        guard UIApplication.shared.applicationState != .active else { return }
        let content = UNMutableNotificationContent()
        switch interaction.kind {
        case let .approval(toolName, reason):
            // The tool is what the person decides about, so it leads.
            content.title = "批准 \(toolName)"
            content.body = reason ?? "Agent 想执行一个工具，等你点头。"
        case .questions:
            content.title = "Agent 想确认一件事"
            content.body = interaction.summary
        }
        content.subtitle = interaction.sessionId.map { "会话 \(String($0.suffix(6)))" } ?? "等待答复"
        content.sound = .default
        content.threadIdentifier = interaction.sessionId ?? "tomato-approvals"
        content.userInfo = ["interactionId": interaction.id]
        let request = UNNotificationRequest(
            identifier: interaction.id,
            content: content,
            trigger: nil
        )
        UNUserNotificationCenter.current().add(request)
    }

    /// Treat the cards already on screen as candidates for re-delivery.
    ///
    /// The Host queues every waiting request before it answers the stream's
    /// `ready` frame, so the ones it repeats arrive within the same burst. A
    /// card it does not repeat has no waiting request behind it any more: the
    /// answer was given on another client, the turn ended, or the Agent went
    /// away. Removing it keeps the phone from offering a decision that no
    /// longer exists, which would also be a second answer to a settled request.
    private func awaitRedelivery() {
        let candidates = Set(pending.map(\.id))
        awaitingRedelivery = candidates
        reconcileTask?.cancel()
        guard !candidates.isEmpty else {
            reconcileTask = nil
            return
        }
        reconcileTicket += 1
        let ticket = reconcileTicket
        reconcileTask = Task { [weak self] in
            try? await Task.sleep(for: Self.redeliveryWindow)
            guard !Task.isCancelled else { return }
            self?.dropSettledElsewhere(candidates, ticket: ticket)
        }
    }

    /// Remove cards the reopened stream did not re-deliver.
    ///
    /// A request that reaches this phone after the window would be added again
    /// by its own `waterfall` frame, so a slow link costs a flicker rather than
    /// a lost question. A card whose answer is already in flight stays until
    /// the Host settles it, because that answer may still be the one that wins.
    /// - Parameters:
    ///   - candidates: cards that existed when this stream opened.
    ///   - ticket: reconciliation this task belongs to; a newer stream cancels it.
    private func dropSettledElsewhere(_ candidates: Set<String>, ticket: Int) {
        guard ticket == reconcileTicket else { return }
        let stale = candidates.intersection(awaitingRedelivery).subtracting(resolving)
        awaitingRedelivery.subtract(candidates)
        reconcileTask = nil
        guard !stale.isEmpty else { return }
        pending.removeAll { stale.contains($0.id) }
        Self.withdrawNotification(Array(stale))
        AppLog.info(.stream, "其他端已处理等待中的请求", detail: "\(stale.count) 个")
    }

    /// Withdraw a notification whose request no longer waits.
    /// - Parameter ids: event identities posted as notifications.
    private static func withdrawNotification(_ ids: [String]) {
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: ids)
    }

    // MARK: Answers

    /// Allow one approval.
    /// - Parameter interaction: the pending approval.
    func allow(_ interaction: PendingInteraction) {
        resolve(interaction, outcome: .object(["kind": .string("result"), "value": .string("allowed-once")]))
    }

    /// Reject one approval.
    /// - Parameter interaction: the pending approval.
    func reject(_ interaction: PendingInteraction) {
        resolve(interaction, outcome: .object(["kind": .string("result"), "value": .string("rejected")]))
    }

    /// Answer a question card.
    /// - Parameters:
    ///   - interaction: the pending question.
    ///   - answers: one selection per item.
    func answer(_ interaction: PendingInteraction, answers: [QuestionAnswer]) {
        let value = answers.map { answer -> JSONValue in
            var fields: [String: JSONValue] = [
                "id": .string(answer.id),
                "selected": .array(answer.selected.map { .string($0) }),
            ]
            if let custom = answer.custom, !custom.isEmpty {
                fields["custom"] = .string(custom)
            }
            return .object(fields)
        }
        resolve(interaction, outcome: .object([
            "kind": .string("result"),
            "value": .object(["answers": .array(value)]),
        ]))
    }

    /// Whether this card's answer is already on its way to the Host.
    /// - Parameter interaction: card whose state is read.
    func isResolving(_ interaction: PendingInteraction) -> Bool {
        resolving.contains(interaction.id)
    }

    private func resolve(_ interaction: PendingInteraction, outcome: JSONValue) {
        guard let hub, let clientId else {
            errorMessage = "事件流没有连接，无法答复"
            return
        }
        guard !resolving.contains(interaction.id) else { return }
        resolving.insert(interaction.id)
        Task {
            do {
                try await hub.resolveEvent(clientId: clientId, eventId: interaction.id, outcome: outcome)
                pending.removeAll { $0.id == interaction.id }
                resolving.remove(interaction.id)
                Self.withdrawNotification([interaction.id])
            } catch {
                // The Host never settled the request, so the card stays; the
                // owner can retry instead of losing the question.
                resolving.remove(interaction.id)
                errorMessage = describe(error)
                AppLog.error(.stream, "答复请求失败", detail: describe(error))
            }
        }
    }
}
