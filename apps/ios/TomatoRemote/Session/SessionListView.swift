//
//  SessionListView.swift
//  Tomato Remote
//
//  Session management: list, running indicator, create, rename, open.
//

import SwiftUI

struct SessionListView: View {
    @EnvironmentObject private var model: AppModel

    @State private var path = NavigationPath()
    @State private var renaming: SessionSummary?
    @State private var draftTitle = ""
    @State private var openedSessionId: String?

    var body: some View {
        NavigationStack(path: $path) {
            List {
                if let error = model.sessionsError {
                    Section {
                        ErrorBanner(message: error) {
                            Task { await model.refreshSessions() }
                        }
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(top: 8, leading: 16, bottom: 8, trailing: 16))
                    }
                }

                if model.sessions.isEmpty && !model.isLoadingSessions {
                    Section {
                        EmptyPlaceholder(
                            systemImage: "bubble.left.and.bubble.right",
                            title: "还没有会话",
                            detail: "点右上角新建一个，Mac 上的 agent 会在这个会话里执行任务。"
                        )
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                    }
                }

                Section {
                    ForEach(model.sessions) { summary in
                        NavigationLink(value: summary) {
                            SessionRow(summary: summary)
                        }
                        .listRowBackground(TomatoToken.bgLayer1)
                        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                            Button {
                                draftTitle = summary.displayTitle
                                renaming = summary
                            } label: {
                                Label("重命名", systemImage: "pencil")
                            }
                            .tint(TomatoToken.brandPrimary)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .scrollContentBackground(.hidden)
            .background(TomatoToken.bgBase)
            .navigationTitle("会话")
            .navigationDestination(for: SessionSummary.self) { summary in
                ChatView(summary: summary)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task {
                            if let created = await model.createSession() {
                                openedSessionId = created
                            }
                        }
                    } label: {
                        if model.isCreatingSession {
                            ProgressView()
                        } else {
                            Image(systemName: "square.and.pencil")
                        }
                    }
                    .disabled(model.isCreatingSession || model.hub == nil)
                }
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        Task { await model.refreshSessions() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .disabled(model.isLoadingSessions)
                }
            }
            .task { await model.refreshSessions() }
            // `session/control` carries projection frames only — it never reports
            // the running flag — so the list keeps its own cadence while visible.
            // A Session's own conversation stream is what reports live turns.
            .task {
                while !Task.isCancelled {
                    try? await Task.sleep(nanoseconds: 15_000_000_000)
                    if Task.isCancelled { return }
                    await model.refreshSessions()
                }
            }
            .refreshable { await model.refreshSessions() }
            // A notification tap deep-links one Session; the row has to exist
            // before the stack can push it, so resolve after a refresh once.
            .task(id: model.pendingSessionId) { await openPendingSession() }
            .alert("重命名会话", isPresented: Binding(
                get: { renaming != nil },
                set: { if !$0 { renaming = nil } }
            )) {
                TextField("标题", text: $draftTitle)
                Button("取消", role: .cancel) { renaming = nil }
                Button("保存") {
                    if let target = renaming {
                        let title = draftTitle
                        renaming = nil
                        Task { await model.rename(target, to: title) }
                    }
                }
            }
            .navigationDestination(isPresented: Binding(
                get: { openedSessionId != nil },
                set: { if !$0 { openedSessionId = nil } }
            )) {
                if let openedSessionId {
                    ChatView(sessionId: openedSessionId, title: "新会话")
                }
            }
        }
    }

    /// Push the Session a deep link named, refreshing once when the row is cold.
    private func openPendingSession() async {
        guard let id = model.pendingSessionId else { return }
        if !model.sessions.contains(where: { $0.sessionId == id }) {
            await model.refreshSessions()
        }
        model.clearPendingSession()
        guard let summary = model.sessions.first(where: { $0.sessionId == id }) else {
            model.sessionsError = "链接指向的会话不在列表里：\(id)"
            return
        }
        path.append(summary)
    }
}

private struct SessionRow: View {
    let summary: SessionSummary

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Text(summary.displayTitle)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .lineLimit(1)
                    if summary.running { RunningDot() }
                }
                Text(summary.displaySubtitle)
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelCaption)
                    .lineLimit(1)
                if summary.blank {
                    Text("空白会话")
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
            }
            Spacer(minLength: 8)
            Text(relativeTime(summary.updatedAt))
                .font(.caption2)
                .foregroundStyle(TomatoToken.labelDimmed)
        }
        .padding(.vertical, 4)
    }
}