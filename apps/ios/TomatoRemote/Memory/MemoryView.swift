//
//  MemoryView.swift
//  Tomato Remote
//
//  The owner's memories, as the Mac holds them.
//
//  There is one memory store: the Host's account-scoped records, which every
//  Session already receives. The phone derives habits this device observes,
//  proposes them as unconfirmed candidates, and lets the owner confirm or
//  delete them here or with `/memory confirm` on the Mac. The phone never
//  appends its own prose to a prompt.
//

import SwiftUI

/// The Host records of one Session's workspace, plus the phone's proposals.
@MainActor
final class MemoryModel: ObservableObject {
    @Published private(set) var records: [HostMemory] = []
    @Published private(set) var signedIn = true
    @Published private(set) var isLoading = false
    @Published private(set) var unavailable = false
    @Published private(set) var syncSummary: String?
    @Published var errorMessage: String?
    /// Which row action is in flight, and whether the list is still settling.
    /// The view reads it to disable every row while one request travels.
    @Published private(set) var gate = MemoryActionGate()

    private var hub: HubClient?
    private var sessionId: String?
    /// Bumped by every read; a slower earlier response must not replace a newer
    /// list, or a refresh that started before a mutation can undo it.
    private var refreshGeneration = 0
    /// Unlocks row actions a moment after the list has been replaced.
    private var settleTask: Task<Void, Never>?

    /// Point the model at the Host and the Session that scopes workspace records.
    /// - Parameters:
    ///   - hub: client for the paired Host.
    ///   - sessionId: newest Session, or nil when there is none.
    func start(hub: HubClient?, sessionId: String?) {
        self.hub = hub
        self.sessionId = sessionId
        AppLog.screen("个人记忆")
    }

    /// Re-read the Host's records.
    func refresh() async {
        guard let hub, let sessionId else { return }
        refreshGeneration += 1
        let generation = refreshGeneration
        isLoading = true
        do {
            let list = try await hub.listMemories(sessionId: sessionId)
            guard generation == refreshGeneration, !Task.isCancelled else { return }
            records = list.records
            signedIn = list.signedIn
            unavailable = false
            errorMessage = nil
        } catch HubError.notFound {
            guard generation == refreshGeneration, !Task.isCancelled else { return }
            unavailable = true
            records = []
        } catch {
            guard generation == refreshGeneration, !Task.isCancelled else { return }
            errorMessage = describe(error)
        }
        if generation == refreshGeneration {
            isLoading = false
        }
    }

    /// Propose this phone's derived habits as candidates.
    /// - Parameter facts: facts derived from the usage journal.
    func propose(facts: [MemoryFact]) async {
        guard let hub, let sessionId, !facts.isEmpty else { return }
        let entries = facts.compactMap { Self.entry(for: $0) }
        guard !entries.isEmpty else { return }
        do {
            let written = try await hub.proposeMemories(sessionId: sessionId, entries: entries)
            syncSummary = "已提交 \(written.written.count) 条候选，等你在下面确认。"
            await refresh()
        } catch {
            errorMessage = describe(error)
        }
    }

    /// Promote one candidate.
    ///
    /// The gate refuses a second tap while this request travels, and keeps
    /// every row inert for a moment after the list reflows, so a tap aimed at
    /// the row that just moved cannot hit its neighbour.
    /// - Parameter record: the record to confirm.
    func confirm(_ record: HostMemory) async {
        await mutate(record, action: .confirm)
    }

    /// Delete one record.
    /// - Parameter record: the record to forget.
    func forget(_ record: HostMemory) async {
        await mutate(record, action: .forget)
    }

    /// Which action of one row is in flight, when it is the given row.
    /// - Parameter record: row the view is drawing.
    /// - Returns: the action, or nil when this row is not busy.
    func busyAction(for record: HostMemory) -> MemoryActionGate.Action? {
        gate.busyId == record.id ? gate.busyAction : nil
    }

    /// Run one row mutation under the gate.
    /// - Parameters:
    ///   - record: row the action targets.
    ///   - action: confirm or delete.
    private func mutate(_ record: HostMemory, action: MemoryActionGate.Action) async {
        guard let hub, let sessionId, gate.begin(record.id, action) else { return }
        do {
            switch action {
            case .confirm:
                let confirmation = try await hub.confirmMemory(sessionId: sessionId, id: record.id)
                apply(confirmation, to: record)
            case .forget:
                _ = try await hub.forgetMemory(sessionId: sessionId, id: record.id)
                records.removeAll { $0.id == record.id }
            }
            await refresh()
        } catch {
            errorMessage = describe(error)
        }
        finishMutation()
    }

    /// Put the Host's answer on screen before the follow-up read lands.
    /// - Parameters:
    ///   - confirmation: the promoted record, or a `not_found` answer.
    ///   - record: the row that was confirmed.
    private func apply(_ confirmation: HostMemoryConfirmation, to record: HostMemory) {
        guard let promoted = confirmation.record,
              let index = records.firstIndex(where: { $0.id == record.id })
        else {
            records.removeAll { $0.id == record.id }
            return
        }
        records[index] = promoted
    }

    /// Release the row gate once the reflowed list has been on screen briefly.
    private func finishMutation() {
        gate.finish()
        settleTask?.cancel()
        settleTask = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: 500_000_000)
            self?.gate.settle()
        }
    }

    /// Map one derived fact onto the Host's identifier vocabulary.
    ///
    /// The identifiers are stable kebab-case names, so a habit the phone reports
    /// twice replaces its earlier candidate instead of piling up duplicates.
    /// - Parameter fact: one derived fact.
    /// - Returns: the candidate to store, or nil when the fact has no mapping.
    private static func entry(for fact: MemoryFact) -> HostMemoryEntry? {
        let names: [String: (entity: String, key: String)] = [
            "hours": ("usage-pattern", "active-hours"),
            "rhythm": ("usage-pattern", "weekday-rhythm"),
            "projects": ("project-preference", "frequent-project"),
            "length": ("prompt-style", "typical-length"),
            "photos": ("input-style", "photo-usage"),
            "naming": ("session-habit", "renames-sessions"),
        ]
        guard let name = names[fact.id] else { return nil }
        return HostMemoryEntry(
            scope: "profile",
            kind: "preference",
            entity: name.entity,
            key: name.key,
            value: fact.text
        )
    }
}

struct MemoryView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var journal: UsageJournal
    @StateObject private var memories = MemoryModel()

    @State private var confirmsClear = false
    /// Record the owner is about to delete. Deleting from the list directly
    /// let a stray second tap remove whatever row replaced the one that moved.
    @State private var pendingDelete: HostMemory?

    /// Facts the phone derives from its own journal right now.
    private var derived: PersonalMemory {
        PersonalMemory.derive(from: journal.events)
    }

    private var candidates: [HostMemory] {
        memories.records.filter { $0.status == .candidate }
    }

    private var active: [HostMemory] {
        memories.records.filter { $0.status == .active }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                intro
                if let error = memories.errorMessage {
                    ErrorBanner(message: error) { Task { await memories.refresh() } }
                }
                if memories.unavailable {
                    unavailableCard
                } else if !memories.signedIn {
                    signedOutCard
                } else {
                    candidatesCard
                    activeCard
                }
                deviceCard
                actions
            }
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, 28)
        }
        .background(TomatoToken.bgBase)
        .navigationTitle("记忆")
        .navigationBarTitleDisplayMode(.large)
        .tomatoScrollEdge()
        .toolbar(.hidden, for: .tabBar)
        .refreshable { await memories.refresh() }
        .task {
            // Workspace records need a Session; a cold launch may not have the
            // list yet.
            if model.sessions.isEmpty {
                await model.refreshSessions()
            }
            memories.start(
                hub: model.hub,
                sessionId: model.sessions.first(where: { $0.origin != "subagent" })?.sessionId
            )
            await memories.refresh()
        }
        .tomatoConfirm(
            isPresented: $confirmsClear,
            title: "清除这台手机的使用记录？",
            message: "记录只用来生成上面的候选；已提交到 Mac 的记忆不受影响，需要在这里或 Mac 上删除。",
            confirmTitle: "清除",
            destructive: true
        ) {
            journal.clear()
        }
        .confirmationDialog(
            "删除这条记忆？",
            isPresented: Binding(
                get: { pendingDelete != nil },
                set: {
                    if !$0 {
                        pendingDelete = nil
                    }
                }
            ),
            titleVisibility: .visible,
            presenting: pendingDelete
        ) { record in
            Button("删除", role: .destructive) {
                pendingDelete = nil
                Task { await memories.forget(record) }
            }
            Button("取消", role: .cancel) {
                pendingDelete = nil
            }
        } message: { record in
            Text(record.value)
        }
    }
}

extension MemoryView {
    private var intro: some View {
        Text("记忆只有一份，存在 Mac 上，每次对话都会带上。这台 iPhone 只把观察到的习惯提交成「待确认」，你确认后才会生效；也可以直接在 Mac 上用 /memory confirm。")
            .font(.footnote)
            .foregroundStyle(TomatoToken.labelCaption)
            .fixedSize(horizontal: false, vertical: true)
    }

    private var unavailableCard: some View {
        TomatoCard(padding: 16) {
            Text("这个 Host 没有开启记忆服务（Memory and goal focus 插件包），所以手机无法读写记忆。")
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelCaption)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var signedOutCard: some View {
        TomatoCard(padding: 16) {
            Text("Mac 上还没登录账号，记忆不可用。登录后回到这一页刷新。")
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelCaption)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var candidatesCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "待确认") {
                    Text("\(candidates.count) 条")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                if candidates.isEmpty {
                    Text("没有待确认的记忆。手机提交的习惯会先出现在这里。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                } else {
                    ForEach(candidates) { record in
                        memoryRow(record, pending: true)
                    }
                }
            }
        }
    }

    private var activeCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "生效中") {
                    Text("\(active.count) 条")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                if active.isEmpty {
                    Text("还没有生效的记忆。确认后的记忆每次对话都会带上。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                } else {
                    ForEach(active) { record in
                        memoryRow(record, pending: false)
                    }
                }
            }
        }
    }

    /// What this phone observes, and the one action that moves it to the Host.
    private var deviceCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "这台手机的观察") {
                    Text("\(derived.sampleCount) 条记录")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                if derived.facts.isEmpty {
                    Text("还看不出习惯。再正常用几天，这里会出现可读的句子；样本太少时宁可不猜。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .fixedSize(horizontal: false, vertical: true)
                } else {
                    ForEach(derived.facts) { fact in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "circle.fill")
                                .font(.system(size: 5))
                                .foregroundStyle(TomatoToken.brandPrimary)
                                .padding(.top, 7)
                            Text(fact.text)
                                .font(.footnote)
                                .foregroundStyle(TomatoToken.labelPrimary)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
                if let summary = memories.syncSummary {
                    Text(summary)
                        .font(.caption)
                        .foregroundStyle(TomatoToken.stateSuccessPrimary)
                }
                TomatoPrimaryButton(
                    title: "提交为待确认记忆",
                    systemImage: "arrow.up.doc",
                    isEnabled: !derived.facts.isEmpty && !memories.unavailable,
                    isBusy: memories.isLoading
                ) {
                    Task { await memories.propose(facts: derived.facts) }
                }
                if let writeError = journal.writeError {
                    Text("使用记录无法写入本机：\(writeError)。这次记录只在内存里，退出后会丢失。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.stateWarnPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                Text("记录只存在本机，只有上面这些句子会被提交，且需要你确认才会生效。")
                    .font(.caption2)
                    .foregroundStyle(TomatoToken.labelDimmed)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    private var actions: some View {
        TomatoSecondaryButton(title: "清除使用记录", systemImage: "trash", isDestructive: true, isEnabled: !journal.events.isEmpty) {
            confirmsClear = true
        }
    }

    /// One memory: its statement, then the action that changes its state.
    ///
    /// While one request travels every row's action is disabled, and the row
    /// that is waiting shows its own progress instead of its buttons. Deleting
    /// asks for confirmation, so a tap whose row moved cannot remove its
    /// neighbour.
    private func memoryRow(_ record: HostMemory, pending: Bool) -> some View {
        let busy = memories.busyAction(for: record)
        let blocked = memories.gate.blocksInput
        return VStack(alignment: .leading, spacing: 6) {
            Text("\(record.entity) / \(record.key)")
                .font(.caption2.monospaced())
                .foregroundStyle(TomatoToken.labelDimmed)
            Text(record.value)
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelPrimary)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 12) {
                if let busy {
                    ProgressView()
                        .controlSize(.mini)
                    Text(busy == .confirm ? "正在确认…" : "正在删除…")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .accessibilityIdentifier("memory.busy.\(record.id)")
                } else {
                    if pending {
                        Button("确认") {
                            Task { await memories.confirm(record) }
                        }
                        .font(.caption.weight(.medium))
                        .foregroundStyle(TomatoToken.brandPrimary)
                        .disabled(blocked)
                        .opacity(blocked ? 0.4 : 1)
                        .accessibilityIdentifier("memory.confirm.\(record.id)")
                    }
                    Button("删除", role: .destructive) {
                        pendingDelete = record
                    }
                    .font(.caption)
                    .foregroundStyle(TomatoToken.stateErrorPrimary)
                    .disabled(blocked)
                    .opacity(blocked ? 0.4 : 1)
                    .accessibilityIdentifier("memory.delete.\(record.id)")
                }
                Spacer(minLength: 0)
                Text(record.scope == .profile ? "全部项目" : "当前项目")
                    .font(.caption2)
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
        }
        .padding(10)
        .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}
