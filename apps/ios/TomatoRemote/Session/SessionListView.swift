//
//  SessionListView.swift
//  Tomato Remote
//
//  Session management: one folder per project, its conversations underneath,
//  each row carrying the conversation's liveness.
//

import SwiftUI

struct SessionListView: View {
    @EnvironmentObject private var model: AppModel

    @State private var path = NavigationPath()
    @State private var renaming: SessionSummary?
    @State private var draftTitle = ""
    @State private var openedSessionId: String?
    @State private var query = ""
    @State private var showingNewSession = false
    /// Folders the reader closed, persisted so the list opens as it was left.
    @AppStorage("sessions.collapsedFolders") private var collapsedFoldersJSON = "[]"

    var body: some View {
        NavigationStack(path: $path) {
            content
                .background(TomatoToken.bgBase)
                .navigationTitle("会话")
                .searchable(text: $query, placement: .navigationBarDrawer(displayMode: .always), prompt: "搜索会话")
                .navigationDestination(for: SessionSummary.self) { summary in
                    ChatView(summary: summary, preloaded: model.cachedEvents(summary.sessionId))
                }
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showingNewSession = true
                        } label: {
                            if model.isCreatingSession {
                                ProgressView()
                            } else {
                                Image(systemName: "square.and.pencil")
                            }
                        }
                        .disabled(model.isCreatingSession || model.hub == nil)
                        .accessibilityLabel("新建会话")
                    }
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            Task { await model.refreshSessions(force: true) }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                        .disabled(model.isLoadingSessions)
                        .accessibilityLabel("刷新")
                    }
                }
                .task {
                    await model.refreshSessions()
                    await model.prefetchLikely(model.sessions)
                }
                // The Host forwards each turn start and end over the event
                // stream, so a row does not wait for a read. This slow re-read
                // only repairs what a dropped stream never delivered, and picks
                // up rows the phone did not know about.
                .task {
                    while !Task.isCancelled {
                        try? await Task.sleep(nanoseconds: 60_000_000_000)
                        if Task.isCancelled {
                            return
                        }
                        await model.refreshSessions()
                    }
                }
                .refreshable {
                    await model.refreshSessions(force: true)
                    await model.prefetchLikely(model.sessions)
                }
                .task(id: model.pendingSessionId) { await openPendingSession() }
                .sheet(isPresented: Binding(
                    get: { renaming != nil },
                    set: {
                        if !$0 {
                            renaming = nil
                        }
                    }
                )) {
                    RenameSessionSheet(title: $draftTitle) {
                        if let target = renaming {
                            let title = draftTitle
                            renaming = nil
                            Task { await model.rename(target, to: title) }
                        }
                    }
                    .tomatoSheet([.height(260)])
                }
                .navigationDestination(isPresented: Binding(
                    get: { openedSessionId != nil },
                    set: {
                        if !$0 {
                            openedSessionId = nil
                        }
                    }
                )) {
                    if let openedSessionId {
                        ChatView(sessionId: openedSessionId, title: "新会话")
                    }
                }
                .sheet(isPresented: $showingNewSession) {
                    NewSessionSheet(folders: knownFolders, isBusy: model.isCreatingSession) { cwd in
                        Task {
                            if let created = await model.createSession(cwd: cwd) {
                                showingNewSession = false
                                openedSessionId = created
                            }
                        }
                    }
                    .tomatoSheet()
                }
        }
    }
}

// MARK: - Rows and folders

extension SessionListView {
    // MARK: - Content

    @ViewBuilder
    private var content: some View {
        if let error = model.sessionsError, model.sessions.isEmpty {
            ScrollView {
                ErrorBanner(message: error) {
                    Task { await model.refreshSessions(force: true) }
                }
                .padding(20)
            }
        } else if filtered.isEmpty, !model.isLoadingSessions {
            ScrollView {
                EmptyPlaceholder(
                    systemImage: query.isEmpty ? "sparkles" : "magnifyingglass",
                    title: query.isEmpty ? "还没有会话" : "没有匹配的会话",
                    detail: query.isEmpty ? "Mac 上的 agent 会在这个会话里执行任务。" : nil
                )
                .padding(.top, 40)
                if query.isEmpty {
                    Button {
                        Task {
                            if let created = await model.createSession() {
                                openedSessionId = created
                            }
                        }
                    } label: {
                        Label("新建会话", systemImage: "square.and.pencil")
                            .font(.callout.weight(.medium))
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(TomatoToken.brandPrimary)
                    .disabled(model.isCreatingSession || model.hub == nil)
                }
            }
        } else {
            VStack(spacing: 0) {
                // A read that failed leaves the rows it replaced on screen, and a
                // row that stopped updating reads as a finished turn. Name the
                // failure instead of letting the states look current.
                if let error = model.sessionsError, !model.isFollowingEvents {
                    ErrorBanner(message: "状态可能已过期：\(error)") {
                        Task { await model.refreshSessions(force: true) }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
                }
                ScrollViewReader { proxy in
                    List {
                        ForEach(folders) { folder in
                            // The folder is the first level and its conversations the
                            // second, which is how the Host files them: a Session owns
                            // one working directory.
                            DisclosureGroup(isExpanded: expansion(for: folder)) {
                                ForEach(folder.items) { summary in
                                    row(for: summary)
                                        .id(summary.sessionId)
                                }
                            } label: {
                                FolderLabel(folder: folder)
                                    .padding(.vertical, 6)
                            }
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                            .accessibilityIdentifier("session.folder.\(folder.id)")
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                    .tomatoScrollEdge()
                    .task { await autoscrollIfAsked(proxy) }
                }
            }
        }
    }

    /// One conversation row. A plain button pushes the row itself, so the
    /// journal entry and the navigation are one action; a gesture layered on a
    /// `NavigationLink` competes with the link's own tap and swallows it.
    /// - Parameter summary: the Session this row opens.
    /// - Returns: the row with its rename affordances.
    private func row(for summary: SessionSummary) -> some View {
        Button {
            open(summary)
        } label: {
            SessionRow(summary: summary)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("session.row.\(summary.sessionId)")
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
        .listRowInsets(EdgeInsets(top: 2, leading: 4, bottom: 2, trailing: 12))
        .swipeActions(edge: .trailing, allowsFullSwipe: false) {
            Button {
                draftTitle = summary.displayTitle
                renaming = summary
            } label: {
                Label("重命名", systemImage: "pencil")
            }
            .tint(TomatoToken.brandPrimary)
        }
        .contextMenu {
            Button {
                draftTitle = summary.displayTitle
                renaming = summary
            } label: {
                Label("重命名", systemImage: "pencil")
            }
        }
    }

    private var filtered: [SessionSummary] {
        // Subagent children are served through their parent's durable address;
        // opening one directly fails with `session/agent-busy`, so the reader
        // list stays with the sessions a person can actually converse in.
        // Robot-run Sessions are listed under 智能体 instead, where their run
        // control lives; showing them here would read as ordinary chats.
        let sorted = model.sessions
            .filter { !$0.isSubagent && !$0.isRobotRun }
            .sorted { $0.updatedAt > $1.updatedAt }
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else { return sorted }
        let needle = query.lowercased()
        return sorted.filter {
            $0.displayTitle.lowercased().contains(needle)
                || ($0.cwd ?? "").lowercased().contains(needle)
        }
    }

    /// Conversations filed under their working directory, folders ordered by
    /// their most recent activity. A Session without a `cwd` still needs a home.
    private var folders: [SessionFolder] {
        var buckets: [String: [SessionSummary]] = [:]
        for summary in filtered {
            buckets[summary.cwd ?? "", default: []].append(summary)
        }
        return buckets.map { path, items in
            SessionFolder(
                id: path.isEmpty ? "unfiled" : path,
                title: path.isEmpty ? "未归入文件夹" : URL(fileURLWithPath: path).lastPathComponent,
                path: path.isEmpty ? nil : path,
                items: items.sorted { $0.updatedAt > $1.updatedAt },
                latest: items.map(\.updatedAt).max() ?? 0
            )
        }
        .sorted { $0.latest > $1.latest }
    }

    /// Folder ids the reader closed.
    private var collapsedFolders: Set<String> {
        guard let data = collapsedFoldersJSON.data(using: .utf8),
              let list = try? JSONDecoder().decode([String].self, from: data)
        else { return [] }
        return Set(list)
    }

    /// Expansion state for one folder. A search always lists its matches, so a
    /// folder closed earlier cannot hide the result the reader is looking for.
    /// - Parameter folder: the folder row being drawn.
    /// - Returns: the binding `DisclosureGroup` toggles.
    private func expansion(for folder: SessionFolder) -> Binding<Bool> {
        Binding(
            get: { query.isEmpty ? !collapsedFolders.contains(folder.id) : true },
            set: { expanded in
                var next = collapsedFolders
                if expanded {
                    next.remove(folder.id)
                } else {
                    next.insert(folder.id)
                }
                guard let data = try? JSONEncoder().encode(Array(next).sorted()),
                      let text = String(data: data, encoding: .utf8)
                else { return }
                collapsedFoldersJSON = text
            }
        )
    }

    /// Full folder paths the Host already knows, for the new-Session chooser.
    private var knownFolders: [String] {
        var seen = Set<String>()
        return model.sessions
            .compactMap(\.cwd)
            .filter { seen.insert($0).inserted }
    }

    /// Open one conversation: remember it, then push it.
    /// - Parameter summary: the row the reader tapped.
    private func open(_ summary: SessionSummary) {
        AppLog.mark("打开 \(summary.sessionId.prefix(8))")
        AppLog.info(
            .ui,
            "打开会话 \(summary.sessionId.prefix(8))",
            detail: "\(summary.displayTitle) · 运行中 \(summary.running)"
        )
        model.noteOpened(summary)
        path.append(summary)
    }

    #if DEBUG
        /// Drive the list without XCUITest, so the frame log measures the app's
        /// own scrolling instead of the test runner's accessibility snapshots.
        /// Present only with `-TOMATO_AUTOSCROLL`.
        /// - Parameter proxy: the list's scroll proxy.
        private func autoscrollIfAsked(_ proxy: ScrollViewProxy) async {
            guard ProcessInfo.processInfo.arguments.contains("-TOMATO_AUTOSCROLL") else { return }

            // The list mounts before the first read lands, so wait for rows
            // instead of returning against an empty folder list.
            var ids: [String] = []
            for _ in 0 ..< 25 {
                ids = folders.flatMap(\.items).map(\.sessionId)
                if ids.count > 1 {
                    break
                }
                try? await Task.sleep(nanoseconds: 200_000_000)
            }
            guard ids.count > 1 else { return }

            AppLog.mark("自动滚动")
            // Let the first frame land before the animation starts.
            try? await Task.sleep(nanoseconds: 1_000_000_000)
            for _ in 0 ..< 3 {
                for id in ids {
                    withAnimation(.linear(duration: 0.35)) {
                        proxy.scrollTo(id, anchor: .top)
                    }
                    try? await Task.sleep(nanoseconds: 450_000_000)
                }
                for id in ids.reversed() {
                    withAnimation(.linear(duration: 0.35)) {
                        proxy.scrollTo(id, anchor: .top)
                    }
                    try? await Task.sleep(nanoseconds: 450_000_000)
                }
            }
            AppLog.info(.ui, "自动滚动结束", detail: "\(ids.count) 行 × 6 趟")
        }
    #endif

    /// Push the Session a deep link named, refreshing once when the row is cold.
    private func openPendingSession() async {
        guard let id = model.pendingSessionId else { return }
        if !model.sessions.contains(where: { $0.sessionId == id }) {
            await model.refreshSessions(force: true)
        }
        model.clearPendingSession()
        if id == "latest", let newest = model.sessions.first(where: { $0.origin != "subagent" }) {
            path.append(newest)
            return
        }
        // `new` always creates a cold Session, so no writer handle can be held.
        if id == "new" {
            if let created = await model.createSession() {
                openedSessionId = created
            }
            return
        }
        // `recent` needs a Session the Host is not already writing: its Agent
        // holds the write handle for the one executing right now
        // (`session/writer-held`). A fresh Session is the fallback.
        if id == "recent" {
            if let idle = model.sessions.first(where: { $0.origin != "subagent" && !$0.running && !$0.blank }) {
                path.append(idle)
            } else if let created = await model.createSession() {
                openedSessionId = created
            }
            return
        }
        guard let summary = model.sessions.first(where: { $0.sessionId == id }) else {
            // A list that never arrived already explains itself; blaming the
            // link would send the reader looking for the wrong problem.
            if model.sessionsError == nil {
                model.sessionsError = "链接指向的会话不在列表里：\(id)"
            }
            AppLog.warning(.session, "深链指向的会话不存在", detail: "\(id.prefix(8))")
            return
        }
        guard !summary.isRobotRun else {
            model.sessionsError = "「\(summary.displayTitle)」是智能体的运行记录，请在「智能体」页按机器人查看。"
            return
        }
        path.append(summary)
    }
}

/// One project folder and the conversations filed under it.
private struct SessionFolder: Identifiable {
    let id: String
    let title: String
    let path: String?
    let items: [SessionSummary]
    let latest: Double

    var runningCount: Int {
        items.reduce(0) { total, summary in total + (summary.running ? 1 : 0) }
    }
}

/// First-level row: the folder, its full path, and how much is filed under it.
private struct FolderLabel: View {
    let folder: SessionFolder

    var body: some View {
        HStack(spacing: 9) {
            Image(systemName: "folder")
                .font(.footnote.weight(.medium))
                .foregroundStyle(TomatoToken.labelCaption)
            VStack(alignment: .leading, spacing: 1) {
                Text(folder.title)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .lineLimit(1)
                if let path = folder.path {
                    Text(path)
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelDimmed)
                        .lineLimit(1)
                        .truncationMode(.middle)
                }
            }
            Spacer(minLength: 6)
            if folder.runningCount > 0 {
                HStack(spacing: 4) {
                    RunningDot()
                    Text("\(folder.runningCount)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(TomatoToken.brandPrimary)
                }
            }
            Text("\(folder.items.count)")
                .font(.caption.monospacedDigit())
                .foregroundStyle(TomatoToken.labelDimmed)
        }
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(folder.title)，\(folder.items.count) 个会话")
    }
}

/// One history row in the style chat assistants share: the title, a one-line
/// preview, the conversation's state, and its time. The folder lives in the
/// section header, and no icon tile is drawn — state is the only colour.
private struct SessionRow: View {
    let summary: SessionSummary

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(summary.displayTitle)
                    .font(.body.weight(.medium))
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .lineLimit(1)
                Spacer(minLength: 6)
                SessionStateBadge(state: summary.state)
            }
            if let preview {
                Text(preview)
                    .font(.subheadline)
                    .foregroundStyle(TomatoToken.labelCaption)
                    .lineLimit(1)
            }
            Text(relativeTime(summary.updatedAt))
                .font(.caption)
                .foregroundStyle(TomatoToken.labelDimmed)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(background, in: RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
        .contentShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
        .accessibilityElement(children: .combine)
    }

    /// A running Session gets a faint brand wash; idle rows stay neutral.
    private var background: Color {
        summary.running ? TomatoToken.brandPrimary.opacity(0.06) : TomatoToken.bgLayer2
    }

    /// The latest message the Host projected, when it says more than the title.
    private var preview: String? {
        let text = summary.displaySubtitle
        let fallbacks = [summary.cwd, String(summary.sessionId.prefix(8)), summary.displayTitle]
        guard !fallbacks.contains(text) else { return nil }
        return text.replacingOccurrences(of: "\n", with: " ")
    }
}

/// New-Session chooser: pick a folder the Host already knows, or type a path.
private struct NewSessionSheet: View {
    let folders: [String]
    let isBusy: Bool
    let onCreate: (String?) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var selected: String?
    @State private var manual = ""

    private var effective: String? {
        let typed = manual.trimmingCharacters(in: .whitespacesAndNewlines)
        return typed.isEmpty ? selected : typed
    }

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(title: "新建会话", caption: "会话在一个文件夹里运行；同一个文件夹的会话会归到一起。", onClose: { dismiss() })
            List {
                Section {
                    ForEach(folders, id: \.self) { folder in
                        Button {
                            selected = selected == folder ? nil : folder
                            manual = ""
                        } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "folder")
                                    .foregroundStyle(TomatoToken.brandPrimary)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(URL(fileURLWithPath: folder).lastPathComponent)
                                        .font(.callout)
                                        .foregroundStyle(TomatoToken.labelPrimary)
                                    Text(shortened(folder))
                                        .font(.caption2)
                                        .foregroundStyle(TomatoToken.labelDimmed)
                                        .lineLimit(1)
                                }
                                Spacer(minLength: 8)
                                if selected == folder {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(TomatoToken.brandPrimary)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                } header: {
                    Text("选择文件夹")
                }

                Section {
                    TextField("绝对路径，例如 /Users/you/work", text: $manual)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .font(.footnote.monospaced())
                        .onChange(of: manual) { _, value in
                            if !value.isEmpty {
                                selected = nil
                            }
                        }
                } header: {
                    Text("或手动输入")
                } footer: {
                    Text("目录必须在这台 Mac 上存在；Host 会拒绝不存在的路径。")
                }
            }
            .listStyle(.plain)
            .tomatoSheetContent()
            SheetPrimaryButton(title: "创建", isBusy: isBusy) {
                onCreate(effective)
            }
            .padding(.top, 8)
            .padding(.bottom, 16)
        }
    }

    /// Show the tail of a long path; the folder name is already the title.
    private func shortened(_ path: String) -> String {
        path.count <= 44 ? path : "…" + path.suffix(42)
    }
}

/// One field and a save action, styled like every other sheet.
private struct RenameSessionSheet: View {
    @Binding var title: String
    let onSave: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            SheetHeader(title: "重命名会话", caption: "只改显示名；Host 的会话 id 不变。", onClose: { dismiss() })
            TextField("标题", text: $title)
                .font(.body)
                .padding(.horizontal, 14)
                .frame(height: 46)
                .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
                .padding(.horizontal, 20)
            Spacer(minLength: 0)
            SheetPrimaryButton(
                title: "保存",
                isEnabled: !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ) {
                dismiss()
                onSave()
            }
            .padding(.bottom, 22)
        }
        .background(TomatoToken.bgBase)
    }
}
