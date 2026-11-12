//
//  SchedulesView.swift
//  Tomato Remote
//
//  Reminders the Host will run, and what they already delivered.
//
//  The Remote API can read, retime, delete, and page a task's deliveries, but it
//  cannot create one: the only creator is the `schedule_create` tool inside a
//  conversation. This screen therefore states that path instead of pretending
//  to offer a form it cannot submit.
//

import SwiftUI

struct SchedulesView: View {
    @EnvironmentObject private var model: AppModel
    @ObservedObject var home: HomeModel

    @State private var errorMessage: String?
    @State private var pendingDelete: ScheduleEntry?
    @State private var history: [String: [ScheduleDelivery]] = [:]
    @State private var isLoading = false
    @State private var showsNew = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                if let errorMessage {
                    ErrorBanner(message: errorMessage) { Task { await home.refresh() } }
                }
                if let pendingDelete {
                    confirmCard(pendingDelete)
                }
                if home.schedules.isEmpty, !isLoading {
                    EmptyPlaceholder(
                        systemImage: "clock.arrow.circlepath",
                        title: "还没有定时任务",
                        detail: "在会话里让 Agent 建一个，例如「每天九点检查一次发布状态」。"
                    )
                } else {
                    ForEach(home.schedules.sorted { $0.scheduledAt < $1.scheduledAt }) { entry in
                        card(entry)
                    }
                }
                Text("定时任务由 Mac 上的 Host 调度；手机只负责查看、改时间和删除。新建需要在会话里让 Agent 完成。")
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelDimmed)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 28)
        }
        .background(TomatoToken.bgBase)
        .navigationTitle("定时任务")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showsNew = true
                } label: {
                    Image(systemName: "plus")
                }
                .disabled(model.hub == nil || bindingSessionId == nil)
                .accessibilityLabel("新建定时任务")
            }
        }
        .sheet(isPresented: $showsNew) {
            if let hub = model.hub, let sessionId = bindingSessionId {
                NewScheduleSheet(sessionId: sessionId, hub: hub) {
                    await home.refresh()
                }
                .tomatoSheet()
            }
        }
        .tomatoScrollEdge()
        .refreshable { await home.refresh() }
        .onChange(of: showsNew) { _, open in
            // A created task is only visible after the catalog is re-read.
            if !open {
                Task { await home.refresh() }
            }
        }
        .task {
            isLoading = true
            await home.refresh()
            isLoading = false
        }
    }

    /// Session a new task binds to: the one an existing task uses, else the
    /// newest Session, because a reminder needs an Agent that will run it.
    private var bindingSessionId: String? {
        home.schedules.first?.sessionId
            ?? model.sessions.first(where: { $0.origin != "subagent" })?.sessionId
    }

    // MARK: Cards

    private func card(_ entry: ScheduleEntry) -> some View {
        ScheduleCard(
            entry: entry,
            deliveries: history[entry.id],
            onHistory: { Task { await loadHistory(entry) } },
            onTogglePause: { Task { await setPaused(entry, paused: !entry.isPaused) } },
            onDelete: { pendingDelete = entry }
        )
    }

    private func confirmCard(_ entry: ScheduleEntry) -> some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                Text("删除「\(entry.title)」？")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelPrimary)
                Text("删除后不会再触发，投递记录也会随任务移除。")
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelCaption)
                HStack(spacing: 10) {
                    TomatoPrimaryButton(title: "删除", systemImage: "trash") {
                        Task { await delete(entry) }
                    }
                    TomatoSecondaryButton(title: "取消") {
                        pendingDelete = nil
                    }
                }
            }
        }
    }

    // MARK: Actions

    private func loadHistory(_ entry: ScheduleEntry) async {
        guard let hub = model.hub else { return }
        do {
            let page = try await hub.scheduleHistory(sessionId: entry.sessionId, id: entry.id)
            history[entry.id] = page.records ?? []
        } catch {
            errorMessage = describe(error)
        }
    }

    /// Pause or resume one task, then re-read the catalog.
    private func setPaused(_ entry: ScheduleEntry, paused: Bool) async {
        guard let hub = model.hub else { return }
        do {
            let reply = try await hub.setSchedulePaused(sessionId: entry.sessionId, id: entry.id, paused: paused)
            if !reply.updated, let code = reply.code {
                errorMessage = code == "schedule_ended"
                    ? "这个任务已经结束，不能再暂停或恢复。"
                    : "Host 没有这个任务了（\(code)）"
            }
            await home.refresh()
        } catch {
            errorMessage = describe(error)
        }
    }

    private func delete(_ entry: ScheduleEntry) async {
        guard let hub = model.hub else { return }
        do {
            let result = try await hub.deleteSchedule(sessionId: entry.sessionId, id: entry.id)
            pendingDelete = nil
            if !result.deleted {
                errorMessage = "Host 没有这个任务了（\(result.code ?? "schedule_not_found")）"
            }
            await home.refresh()
        } catch {
            errorMessage = describe(error)
        }
    }
}
