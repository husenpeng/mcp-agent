//
//  RunningSessionsView.swift
//  Tomato Remote
//
//  The conversations executing a turn right now, as a page of their own.
//
//  The Session list answers what was worked on; this page answers what is
//  happening at this moment. It reads the rows the list already follows, keeps
//  a row that finished while the page was open, and pushes the conversation on
//  a second tap.
//

import SwiftUI
import UIKit

/// The Session list's navigation value for the in-progress page.
struct RunningSessionsRoute: Hashable {}

/// The rows the in-progress page draws, folded from the Session list.
struct RunningSessionsRows: Equatable {
    /// Sessions executing a turn right now, most recent activity first.
    private(set) var running: [SessionSummary] = []
    /// Sessions that stopped running while the page was open.
    private(set) var finished: [SessionSummary] = []

    /// Fold one read of the Session list into these rows.
    ///
    /// A turn that ends stays listed, so its row does not disappear under the
    /// reader's finger; a Session the Host deleted, or one that started another
    /// turn, leaves that section.
    /// - Parameter sessions: every row the Host's list holds.
    mutating func observe(_ sessions: [SessionSummary]) {
        // Subagent children only read through their parent, and robot runs are
        // listed under 智能体; neither opens from this page either.
        let candidates = sessions.filter { !$0.isSubagent && !$0.isRobotRun }
        let now = Self.newestFirst(candidates.filter(\.running))
        let runningIds = Set(now.map(\.sessionId))
        var finishedById = Dictionary(uniqueKeysWithValues: finished.map { ($0.sessionId, $0) })
        for previous in running where !runningIds.contains(previous.sessionId) {
            finishedById[previous.sessionId] = candidates.first { $0.sessionId == previous.sessionId }
                ?? previous
        }
        let listedIds = Set(candidates.map(\.sessionId))
        finishedById = finishedById.filter { listedIds.contains($0.key) && !runningIds.contains($0.key) }
        running = now
        finished = Self.newestFirst(Array(finishedById.values))
    }

    /// Order rows by activity, with the Session id breaking a tie so one list
    /// always draws in one order.
    private static func newestFirst(_ rows: [SessionSummary]) -> [SessionSummary] {
        rows.sorted {
            $0.updatedAt == $1.updatedAt
                ? $0.sessionId > $1.sessionId
                : $0.updatedAt > $1.updatedAt
        }
    }
}

/// The Session list's shortcut into this page — the standard action entry.
struct RunningSessionsEntry: View {
    let count: Int

    var body: some View {
        TomatoActionEntry(
            systemImage: "bolt.fill",
            title: "进行中",
            subtitle: "\(count) 个会话正在执行"
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel("进行中，\(count) 个会话正在执行")
    }
}

// MARK: - Page

/// The in-progress page: what is working now, and what just stopped.
struct RunningSessionsView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var interactions: InteractionCenter
    /// Opens one conversation on the Session list's stack, which owns the path.
    let onOpen: (SessionSummary) -> Void

    @State private var rows = RunningSessionsRows()

    var body: some View {
        content
            .background(TomatoSurface.page)
            .navigationTitle("进行中")
            .navigationBarTitleDisplayMode(.inline)
            // The page's title must stay in the bar: iOS 26 can grow it into the
            // large presentation while the list scrolls, and a returning Session
            // list then had it drawn over its rows.
            .toolbarTitleDisplayMode(.inline)
            .tomatoScrollEdge()
            .refreshable { await model.refreshSessions(force: true) }
            // The page is the liveness surface, so it reads once on entry
            // instead of trusting a list the last tab visit left behind. The
            // read starts after the rows the list already holds are painted,
            // so a slow link never shows the empty state first.
            .task {
                rows.observe(model.sessions)
                await model.refreshSessions(force: true)
                rows.observe(model.sessions)
            }
            .onChange(of: model.sessions) { _, sessions in
                rows.observe(sessions)
            }
    }

    @ViewBuilder
    private var content: some View {
        if rows.running.isEmpty, rows.finished.isEmpty {
            ScrollView {
                VStack(spacing: 0) {
                    if let warning = model.staleSessionsWarning {
                        ErrorBanner(message: warning) {
                            Task { await model.refreshSessions(force: true) }
                        }
                        .padding(20)
                    }
                    EmptyPlaceholder(
                        systemImage: "moon.zzz",
                        title: "现在没有正在运行的会话",
                        detail: "在会话里发一条消息，它就会出现在这里。"
                    )
                    .padding(.top, model.staleSessionsWarning == nil ? 40 : 12)
                }
            }
        } else {
            List {
                if let warning = model.staleSessionsWarning {
                    ErrorBanner(message: warning) {
                        Task { await model.refreshSessions(force: true) }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 6)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                }
                if !rows.running.isEmpty {
                    Section {
                        ForEach(rows.running) { summary in
                            row(summary, finished: false)
                        }
                    } header: {
                        SectionCaption(text: "正在运行")
                    }
                }
                if !rows.finished.isEmpty {
                    Section {
                        ForEach(rows.finished) { summary in
                            row(summary, finished: true)
                        }
                    } header: {
                        SectionCaption(text: "刚刚完成")
                    }
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .listSectionSpacing(8)
        }
    }

    /// One row, and the conversation it opens.
    private func row(_ summary: SessionSummary, finished: Bool) -> some View {
        Button {
            onOpen(summary)
        } label: {
            RunningSessionRow(summary: summary, finished: finished, waiting: waiting(in: summary))
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("session.running.row.\(summary.sessionId)")
        .contextMenu {
            if let preview = summary.rowPreview, !preview.isEmpty {
                Button {
                    UIPasteboard.general.string = preview
                } label: {
                    Label("复制消息", systemImage: "doc.on.doc")
                }
            }
        }
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: 1, leading: 20, bottom: 1, trailing: 20))
    }

    /// How many requests in one Session wait on the reader, if any.
    private func waiting(in summary: SessionSummary) -> Int {
        interactions.pending.reduce(0) { total, interaction in
            total + (interaction.sessionId == summary.sessionId ? 1 : 0)
        }
    }
}

// MARK: - Rows

/// One conversation on the in-progress page: its title, state, and last line.
private struct RunningSessionRow: View {
    let summary: SessionSummary
    let finished: Bool
    let waiting: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack(spacing: 8) {
                Text(summary.displayTitle)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .lineLimit(1)
                Spacer(minLength: 6)
                badge
            }
            if let preview = summary.rowPreview {
                Text(preview)
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelCaption)
                    .lineLimit(1)
            }
            if waiting > 0 {
                Label("等你确认 \(waiting) 项", systemImage: "hand.raised.fill")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(TomatoToken.brandPrimary)
            }
            HStack(spacing: 6) {
                if let folder = summary.folderName {
                    Text(folder)
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .lineLimit(1)
                    Text("·")
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                Text(relativeTime(summary.updatedAt))
                    .font(.caption2)
                    .foregroundStyle(TomatoToken.labelCaption)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(background, in: RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous)
                .strokeBorder(finished ? TomatoLine.hairline : TomatoLine.brandSoft, lineWidth: 1)
        )
        .contentShape(RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityLabel(spoken)
    }

    @ViewBuilder
    private var badge: some View {
        if finished {
            Text("已完成")
                .font(.caption2.weight(.medium))
                .foregroundStyle(TomatoContainer.neutral.label)
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background(TomatoContainer.neutral.fill, in: Capsule())
        } else {
            SessionStateBadge(state: .running)
        }
    }

    /// A running row keeps the brand wash the Session list gives it; a finished
    /// one returns to the quiet neutral surface.
    private var background: Color {
        finished ? TomatoSurface.subtle : TomatoBrand.soft
    }

    /// One sentence for VoiceOver: the state, the title, and what waits on the
    /// reader.
    private var spoken: String {
        var parts = [finished ? "已完成" : "进行中", summary.displayTitle]
        if waiting > 0 {
            parts.append("等你确认 \(waiting) 项")
        }
        return parts.joined(separator: "，")
    }
}

/// A quieter section heading than the plain list style provides, on the type
/// scale the Session list's folder labels already use.
private struct SectionCaption: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(TomatoToken.labelCaption)
            .textCase(nil)
    }
}
