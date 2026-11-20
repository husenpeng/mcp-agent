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
import UIKit

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
            // Outcome haptic at the moment the mutation lands, matching the
            // conversation's success/error mapping.
            UINotificationFeedbackGenerator().notificationOccurred(.success)
            await refresh()
        } catch {
            errorMessage = describe(error)
            UINotificationFeedbackGenerator().notificationOccurred(.error)
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
    /// The explanation sheet: how the one store works, off the page itself.
    @State private var showsAbout = false
    /// The record whose detail page is open. Rows are clean cards that only
    /// navigate; the confirm and delete actions live on the detail page.
    @State private var openRecord: HostMemory?

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
        List {
            if let error = memories.errorMessage {
                ErrorBanner(message: error) { Task { await memories.refresh() } }
                    .listRowInsets(EdgeInsets(top: 4, leading: 20, bottom: 4, trailing: 20))
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
            }
            if memories.unavailable {
                noticeRow(icon: "exclamationmark.triangle", text: "Host 未开启记忆服务，手机无法读写记忆。")
            } else if !memories.signedIn {
                noticeRow(icon: "person.crop.circle.badge.xmark", text: "Mac 上还没登录账号，登录后回来刷新。")
            } else {
                Section {
                    if candidates.isEmpty {
                        noteRow("没有待确认的记忆。")
                    } else {
                        ForEach(candidates) { record in
                            memoryRow(record, pending: true)
                        }
                    }
                } header: {
                    sectionHeader("待确认", trailing: "\(candidates.count) 条")
                }
                Section {
                    if active.isEmpty {
                        noteRow("还没有生效的记忆。")
                    } else {
                        ForEach(active) { record in
                            memoryRow(record, pending: false)
                        }
                    }
                } header: {
                    sectionHeader("生效中", trailing: "\(active.count) 条")
                }
            }
            Section {
                VStack(alignment: .leading, spacing: 8) {
                    if derived.facts.isEmpty {
                        Text("还看不出习惯，再正常用几天。")
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.labelCaption)
                    } else {
                        ForEach(derived.facts) { fact in
                            factRow(fact)
                        }
                    }
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(TomatoSurface.card, in: RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous)
                        .strokeBorder(TomatoLine.hairline, lineWidth: 1)
                )
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets(top: 4, leading: 20, bottom: 4, trailing: 20))
                if let summary = memories.syncSummary {
                    Text(summary)
                        .font(.caption)
                        .foregroundStyle(TomatoToken.stateSuccessPrimary)
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                        .listRowInsets(Self.rowInsets)
                }
                TomatoPrimaryButton(
                    title: "提交为待确认记忆",
                    systemImage: "arrow.up.doc",
                    isEnabled: !derived.facts.isEmpty && !memories.unavailable,
                    isBusy: memories.isLoading
                ) {
                    Task { await memories.propose(facts: derived.facts) }
                }
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets(top: 6, leading: 20, bottom: 2, trailing: 20))
                if let writeError = journal.writeError {
                    Text("使用记录无法写入本机：\(writeError)。这次记录只在内存里，退出后会丢失。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.stateWarnPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                        .listRowInsets(Self.rowInsets)
                }
                Button {
                    confirmsClear = true
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "trash")
                            .font(.caption)
                        Text("清除使用记录")
                            .font(.footnote)
                        Spacer(minLength: 0)
                    }
                    .foregroundStyle(journal.events.isEmpty ? TomatoToken.labelDimmed : TomatoToken.stateErrorPrimary)
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .disabled(journal.events.isEmpty)
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(Self.rowInsets)
            } header: {
                sectionHeader("这台手机的观察", trailing: "\(derived.sampleCount) 条记录")
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .listSectionSpacing(8)
        .environment(\.defaultMinListRowHeight, 1)
        .background(TomatoSurface.page)
        // No page title: the sections name themselves; the info icon carries
        // the explanation that used to be a paragraph at the top.
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showsAbout = true
                } label: {
                    Image(systemName: "info.circle")
                }
                .accessibilityLabel("关于记忆")
                .accessibilityIdentifier("memory.about")
            }
        }
        .tomatoScrollEdge()
        .toolbar(.hidden, for: .tabBar)
        .navigationDestination(item: $openRecord) { record in
            MemoryRecordDetailView(recordId: record.id, memories: memories)
        }
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
        .sheet(isPresented: $showsAbout) {
            MemoryAboutSheet()
                .tomatoSheet()
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
    /// Where the list pads every row that is not a card.
    private static let rowInsets = EdgeInsets(top: 1, leading: 20, bottom: 1, trailing: 20)

    /// Section title with a count on the trailing edge.
    /// - Parameters:
    ///   - title: section name.
    ///   - trailing: caption to show beside the name.
    /// - Returns: the header the list draws above its rows.
    private func sectionHeader(_ title: String, trailing: String) -> some View {
        HStack {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(TomatoToken.labelPrimary)
            Spacer(minLength: 6)
            Text(trailing)
                .font(.caption.monospacedDigit())
                .foregroundStyle(TomatoToken.labelCaption)
        }
        .textCase(nil)
        .padding(.horizontal, 4)
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }

    /// One short empty or advisory line, instead of a paragraph card.
    /// - Parameter text: what the row says.
    /// - Returns: the row.
    private func noteRow(_ text: String) -> some View {
        Text(text)
            .font(.footnote)
            .foregroundStyle(TomatoToken.labelCaption)
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
            .listRowInsets(Self.rowInsets)
    }

    /// A degraded state as one icon and one line.
    /// - Parameters:
    ///   - icon: SF Symbol that names the state.
    ///   - text: the one-line statement.
    /// - Returns: the row.
    private func noticeRow(icon: String, text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: icon)
                .font(.footnote)
                .foregroundStyle(TomatoToken.stateWarnPrimary)
            Text(text)
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelCaption)
                .fixedSize(horizontal: false, vertical: true)
        }
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
        .listRowInsets(Self.rowInsets)
    }

    /// One observed habit: a bullet and its sentence, capped at two lines.
    /// Drawn inside the observation card, so it carries no list-row styling.
    /// - Parameter fact: the derived fact.
    /// - Returns: the row.
    private func factRow(_ fact: MemoryFact) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "circle.fill")
                .font(.system(size: 5))
                .foregroundStyle(TomatoToken.brandPrimary)
                .padding(.top, 7)
            Text(fact.text)
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelPrimary)
                .lineLimit(2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    /// One memory as a clean card: its sentence, a scope tag, and a single
    /// guide chevron into the detail page. The technical identifier and the
    /// confirm/delete actions stay off the list — they live on the detail page,
    /// with swipe actions as the native shortcut.
    ///
    /// While a request travels the row shows a spinner in place of its chevron.
    /// - Parameters:
    ///   - record: the record to draw.
    ///   - pending: whether the record is still a candidate.
    /// - Returns: the row.
    private func memoryRow(_ record: HostMemory, pending: Bool) -> some View {
        let busy = memories.busyAction(for: record)
        return Button {
            openRecord = record
        } label: {
            HStack(spacing: 12) {
                IconChip(
                    systemImage: kindIcon(record.kind),
                    tint: pending ? TomatoToken.brandPrimary : TomatoToken.labelCaption,
                    side: 32
                )
                VStack(alignment: .leading, spacing: 4) {
                    Text(record.value)
                        .font(.subheadline)
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    scopeTag(record)
                }
                Spacer(minLength: 8)
                if busy != nil {
                    ProgressView()
                        .controlSize(.small)
                        .accessibilityIdentifier("memory.busy.\(record.id)")
                } else {
                    Image(systemName: "chevron.right")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                pending ? TomatoBrand.soft : TomatoSurface.card,
                in: RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous)
                    .strokeBorder(
                        pending ? TomatoLine.brandSoft : TomatoLine.hairline,
                        lineWidth: 1
                    )
            )
            .contentShape(RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous))
        }
        .buttonStyle(TomatoPressableStyle())
        .accessibilityIdentifier("memory.row.\(record.id)")
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button(role: .destructive) {
                pendingDelete = record
            } label: {
                Label("删除", systemImage: "trash")
            }
        }
        .swipeActions(edge: .leading, allowsFullSwipe: false) {
            if pending {
                Button {
                    Task { await memories.confirm(record) }
                } label: {
                    Label("确认", systemImage: "checkmark")
                }
                .tint(TomatoToken.brandPrimary)
            }
        }
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: 4, leading: 20, bottom: 4, trailing: 20))
    }

    /// The small capsule that says where a memory applies.
    /// - Parameter record: the record whose scope is drawn.
    /// - Returns: the tag.
    private func scopeTag(_ record: HostMemory) -> some View {
        Text(record.scope == .profile ? "全部项目" : "当前项目")
            .font(.caption2.weight(.medium))
            .foregroundStyle(TomatoContainer.neutral.label)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(TomatoContainer.neutral.fill, in: Capsule())
    }

    /// A glyph for the memory's kind, so a row reads at a glance.
    /// - Parameter kind: the record's kind string.
    /// - Returns: an SF Symbol name.
    private func kindIcon(_ kind: String) -> String {
        switch kind {
        case "preference": "slider.horizontal.3"
        case "fact": "lightbulb"
        case "decision": "checkmark.seal"
        case "constraint": "lock"
        default: "brain.head.profile"
        }
    }
}

/// One record in full: the statement without a line cap, the facts around it,
/// and the actions that change its state. The list row stays two lines; this
/// page is where a long memory is actually read.
struct MemoryRecordDetailView: View {
    let recordId: String
    @ObservedObject var memories: MemoryModel
    @Environment(\.dismiss) private var dismiss
    @State private var confirmsDelete = false

    /// The live record: a refresh or a mutation replaces it, and a deletion
    /// removes it, which closes this page.
    private var record: HostMemory? {
        memories.records.first { $0.id == recordId }
    }

    var body: some View {
        ScrollView {
            if let record {
                VStack(alignment: .leading, spacing: 16) {
                    TomatoCard(padding: 16) {
                        Text(record.value)
                            .font(.body)
                            .foregroundStyle(TomatoToken.labelPrimary)
                            .textSelection(.enabled)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    TomatoCard(padding: 16) {
                        VStack(alignment: .leading, spacing: 10) {
                            InfoRow(label: "状态", value: record.status == .candidate ? "待确认" : "生效中")
                            InfoRow(label: "范围", value: record.scope == .profile ? "全部项目" : "当前项目")
                            InfoRow(label: "类型", value: record.kind)
                            InfoRow(label: "标识", value: "\(record.entity) / \(record.key)")
                            InfoRow(label: "更新于", value: relativeTime(record.updatedAt))
                        }
                    }
                    actions(record)
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 28)
            } else {
                EmptyPlaceholder(systemImage: "tray", title: "这条记忆已不在列表里")
                    .padding(.top, 40)
            }
        }
        .background(TomatoSurface.page)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .tomatoScrollEdge()
        .confirmationDialog(
            "删除这条记忆？",
            isPresented: $confirmsDelete,
            titleVisibility: .visible
        ) {
            Button("删除", role: .destructive) {
                if let record {
                    Task { await memories.forget(record) }
                }
            }
            Button("取消", role: .cancel) {}
        } message: {
            if let record {
                Text(record.value)
            }
        }
        // A deletion (here or on the Mac) empties the page; staying on a
        // placeholder would strand the reader one tap from nothing.
        .onChange(of: record == nil) { _, gone in
            if gone {
                dismiss()
            }
        }
    }

    /// The state-changing actions, under the same gate the list rows use.
    /// - Parameter record: the record the actions target.
    /// - Returns: the action stack.
    @ViewBuilder
    private func actions(_ record: HostMemory) -> some View {
        let busy = memories.busyAction(for: record)
        let blocked = memories.gate.blocksInput
        VStack(spacing: 10) {
            if record.status == .candidate {
                TomatoPrimaryButton(
                    title: "确认生效",
                    systemImage: "checkmark",
                    isEnabled: !blocked,
                    isBusy: busy == .confirm
                ) {
                    Task { await memories.confirm(record) }
                }
                .accessibilityIdentifier("memory.confirm.\(record.id)")
            }
            TomatoSecondaryButton(
                title: "删除这条记忆",
                systemImage: "trash",
                isDestructive: true,
                isEnabled: !blocked
            ) {
                confirmsDelete = true
            }
            .accessibilityIdentifier("memory.delete.\(record.id)")
        }
    }
}

/// How the one memory store works, told off the page: the list stays facts,
/// and the explanation is one tap away behind the info icon.
private struct MemoryAboutSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                TomatoCard(padding: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionHeader(title: "一份记忆，存在 Mac 上")
                        Text("每次对话都会带上生效中的记忆。这台 iPhone 只把观察到的习惯提交成「待确认」，你确认后才会生效；也可以直接在 Mac 上用 /memory confirm。")
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.labelCaption)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                TomatoCard(padding: 16) {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionHeader(title: "本机记录只留在本机")
                        Text("使用记录只存在这台手机上，只有「这台手机的观察」里的句子会被提交，且需要你确认才会生效。清除记录不影响已提交到 Mac 的记忆。")
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.labelCaption)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)
        }
        .safeAreaInset(edge: .top, spacing: 0) {
            SheetHeader(title: "关于记忆", onClose: { dismiss() })
                .background(TomatoSurface.page)
        }
    }
}
