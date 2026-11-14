//
//  RoomsView.swift
//  Tomato Remote
//
//  The 群聊 tab: published rooms, their live feed, and the operator
//  controls of the `room` Remote namespace. Messages have no delta stream, so
//  the feed follows the same short poll the browser page uses, resuming from
//  its own sequence cursor.
//

import SwiftUI

// MARK: - Models

/// Follows the room snapshot stream.
@MainActor
final class RoomListModel: ObservableObject {
    @Published private(set) var rooms: [Room] = []
    @Published private(set) var isConnecting = true
    @Published private(set) var isFollowing = false
    @Published var errorMessage: String?

    private var streamTask: Task<Void, Never>?
    /// Distinguishes the current stream loop from one still tearing down.
    private var generation = 0
    /// Client bound to the paired Host, exposed so the composer can publish.
    private(set) var hub: HubClient?

    /// Active rooms first, then the most recently changed.
    var ordered: [Room] {
        rooms.sorted { left, right in
            let leftRank = left.state == "active" ? 0 : 1
            let rightRank = right.state == "active" ? 0 : 1
            if leftRank != rightRank {
                return leftRank < rightRank
            }
            return left.updatedAt > right.updatedAt
        }
    }

    /// One room by identity.
    /// @param id - room to read.
    /// @returns the room, or nil when the latest frame does not carry it.
    func room(id: String) -> Room? {
        rooms.first { $0.id == id }
    }

    /// Open the snapshot stream.
    /// @param hub - client bound to the paired Host.
    func start(hub: HubClient?) {
        guard streamTask == nil, let hub else { return }
        self.hub = hub
        AppLog.mark("群聊")
        isConnecting = true
        isFollowing = false
        generation += 1
        let generation = generation
        streamTask = Task { [weak self] in
            var attempt = 0
            while !Task.isCancelled {
                do {
                    for try await frame in hub.roomSnapshot() {
                        guard let self, self.generation == generation else { return }
                        apply(frame)
                    }
                    break
                } catch {
                    guard let self, !Task.isCancelled else { break }
                    if let failure = error as? HubError, failure.isFinal {
                        errorMessage = Self.message(for: failure)
                        break
                    }
                    attempt += 1
                    if attempt > 5 {
                        errorMessage = describe(error)
                        break
                    }
                    errorMessage = "连接中断，正在重试（\(attempt)/5）…"
                    try? await Task.sleep(nanoseconds: UInt64(attempt) * 1_500_000_000)
                }
            }
            guard let self, self.generation == generation else { return }
            isConnecting = false
            isFollowing = false
            streamTask = nil
        }
    }

    func stop() {
        generation += 1
        streamTask?.cancel()
        streamTask = nil
        isConnecting = false
        isFollowing = false
    }

    /// Reopen the stream after the app returns from the background.
    /// @param hub - client bound to the paired Host.
    func resume(hub: HubClient?) {
        guard streamTask == nil else { return }
        start(hub: hub)
    }

    /// Reopen the stream against the stored Host.
    func retry() {
        let current = hub
        stop()
        errorMessage = nil
        start(hub: current)
    }

    private func apply(_ frame: JSONValue) {
        let snapshot: RoomSnapshot
        do {
            snapshot = try decodeRemote(RoomSnapshot.self, from: frame)
        } catch {
            errorMessage = "群聊列表无法解析这台 Mac 返回的数据。"
            return
        }
        rooms = snapshot.rooms
        isConnecting = false
        isFollowing = true
        errorMessage = nil
    }

    static func message(for error: Error) -> String {
        if let failure = error as? HubError, failure == .notFound {
            return "这台 Mac 没有启用群聊。在桌面端的「插件」里打开 Tomato Rbot 后重试。"
        }
        return describe(error)
    }
}

/// Reads one room's feed and posts into it.
@MainActor
final class RoomThreadModel: ObservableObject {
    let roomId: String

    @Published private(set) var messages: [RoomMessage] = []
    @Published private(set) var isLoading = true
    @Published private(set) var isSending = false
    @Published private(set) var isDeciding = false
    @Published var errorMessage: String?

    private var pollTask: Task<Void, Never>?
    /// Distinguishes the current poll loop from one still tearing down.
    private var generation = 0
    private var hub: HubClient?

    init(roomId: String) {
        self.roomId = roomId
    }

    /// Open the feed and keep it current while the screen is visible.
    /// @param hub - client bound to the paired Host.
    func start(hub: HubClient?) {
        guard pollTask == nil, let hub else { return }
        self.hub = hub
        generation += 1
        let generation = generation
        pollTask = Task { [weak self] in
            var failures = 0
            while !Task.isCancelled {
                guard let self else { return }
                do {
                    try await poll()
                    failures = 0
                } catch {
                    if Task.isCancelled {
                        break
                    }
                    if let failure = error as? HubError, failure.isFinal {
                        errorMessage = RoomListModel.message(for: failure)
                        break
                    }
                    failures += 1
                    if failures > 5 {
                        errorMessage = describe(error)
                        break
                    }
                    errorMessage = "读取消息失败，正在重试（\(failures)/5）…"
                    try? await Task.sleep(nanoseconds: 2_000_000_000)
                    continue
                }
                try? await Task.sleep(nanoseconds: 1_200_000_000)
            }
            guard let self, self.generation == generation else { return }
            pollTask = nil
        }
    }

    func stop() {
        generation += 1
        pollTask?.cancel()
        pollTask = nil
    }

    /// Restart the feed against the stored Host.
    func retry() {
        let current = hub
        stop()
        errorMessage = nil
        start(hub: current)
    }

    /// Post one human message.
    /// @param text - message body.
    /// @param mentions - members the message addresses.
    /// @returns true when the Host recorded the message.
    func send(_ text: String, mentions: [String]) async -> Bool {
        guard let hub else { return false }
        isSending = true
        defer { isSending = false }
        do {
            let message = try await hub.postRoomMessage(roomId: roomId, text: text, mentions: mentions)
            merge([message])
            errorMessage = nil
            return true
        } catch {
            errorMessage = RoomListModel.message(for: error)
            return false
        }
    }

    /// Decide one pending approval.
    /// @param approvalId - approval to settle.
    /// @param decision - `approved` or `rejected`.
    func decide(approvalId: String, decision: String) async {
        guard let hub else { return }
        guard !approvalId.isEmpty else {
            errorMessage = "这条审批没有可用的编号，无法提交。"
            return
        }
        isDeciding = true
        defer { isDeciding = false }
        do {
            try await hub.approveRoom(roomId: roomId, approvalId: approvalId, decision: decision)
            try? await poll()
            errorMessage = nil
        } catch {
            errorMessage = RoomListModel.message(for: error)
        }
    }

    // MARK: Internals

    /// Bring the feed current.
    ///
    /// The Host reads messages forward from a sequence and offers no
    /// `beforeSeq`, so opening a room means paging from the first message to
    /// the end. The cap keeps a very long room from pinning the phone on open;
    /// later polls continue from whatever page was reached.
    private func poll() async throws {
        guard let hub else { return }
        if messages.isEmpty {
            var cursor: Int?
            for _ in 0 ..< Self.initialPages {
                let page = try await hub.roomMessages(roomId: roomId, afterSeq: cursor, limit: Self.pageSize)
                merge(page)
                guard page.count >= Self.pageSize, let last = page.last?.seq else { break }
                cursor = last
            }
        } else {
            let cursor = messages.map(\.seq).max()
            let page = try await hub.roomMessages(roomId: roomId, afterSeq: cursor, limit: 100)
            merge(page)
        }
        isLoading = false
        errorMessage = nil
    }

    /// Page size the Host accepts for one message read.
    private static let pageSize = 500
    /// Pages read on first open before the feed starts from what it has.
    private static let initialPages = 20

    private func merge(_ page: [RoomMessage]) {
        let known = Set(messages.map(\.id))
        let fresh = page.filter { !known.contains($0.id) }
        guard !fresh.isEmpty else { return }
        messages.append(contentsOf: fresh)
        messages.sort { $0.seq < $1.seq }
    }
}

// MARK: - List

struct RoomsView: View {
    @EnvironmentObject private var app: AppModel
    @ObservedObject var roomModel: RoomListModel
    /// Published robots a new room can seat; the composer needs at least two.
    let availableRobots: [Robot]
    /// One line of context under the page title.
    private static let caption = "一个群聊一条日志：成员、委派、回复和熔断都在这里。"
    @State private var path = NavigationPath()
    @State private var showsCompose = false

    var body: some View {
        NavigationStack(path: $path) {
            content
                .background(TomatoToken.bgBase)
                .navigationTitle("群聊")
                .navigationBarTitleDisplayMode(.inline)
                .tomatoFloatingTabs()
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showsCompose = true
                        } label: {
                            Image(systemName: "plus")
                        }
                        .disabled(roomModel.hub == nil)
                        .accessibilityLabel("新建群聊")
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            roomModel.retry()
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                        .disabled(roomModel.isConnecting)
                        .accessibilityLabel("刷新群聊")
                    }
                }
                .sheet(isPresented: $showsCompose) {
                    if let hub = roomModel.hub {
                        RoomComposerSheet(hub: hub, robots: availableRobots) {
                            roomModel.retry()
                        }
                        .tomatoSheet([.large])
                    }
                }
                .navigationDestination(for: String.self) { roomId in
                    RoomDetailView(roomId: roomId, rooms: roomModel)
                }
                .task(id: app.pendingRoomId) { await openPendingRoom() }
        }
    }

    /// Push the room a deep link named, waiting for the snapshot to carry it.
    private func openPendingRoom() async {
        guard let id = app.pendingRoomId else { return }
        for _ in 0 ..< 10 {
            if roomModel.room(id: id) != nil {
                path.append(id)
                break
            }
            try? await Task.sleep(nanoseconds: 500_000_000)
        }
        app.pendingRoomId = nil
    }

    @ViewBuilder
    private var content: some View {
        if let error = roomModel.errorMessage, roomModel.rooms.isEmpty {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PageCaption(caption: Self.caption)
                    ErrorBanner(message: error) {
                        roomModel.retry()
                    }
                }
                .padding(20)
            }
            .tomatoScrollEdge()
        } else if roomModel.isConnecting, roomModel.rooms.isEmpty {
            ScrollView {
                ProgressView("正在读取群聊…")
                    .frame(maxWidth: .infinity)
                    .padding(.top, 60)
            }
        } else if roomModel.rooms.isEmpty {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PageCaption(caption: Self.caption)
                    EmptyPlaceholder(
                        systemImage: "person.3",
                        title: "还没有群聊",
                        detail: "在桌面端的群聊页面新建一个群聊，选两个已发布的 Rbot 开始。"
                    )
                }
                .padding(20)
            }
            .tomatoScrollEdge()
        } else {
            List {
                Section {
                    ForEach(roomModel.ordered) { room in
                        NavigationLink(value: room.id) {
                            RoomRow(room: room)
                        }
                        .accessibilityIdentifier("room.row.\(room.id)")
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(top: 2, leading: 12, bottom: 2, trailing: 12))
                    }
                } header: {
                    VStack(alignment: .leading, spacing: 6) {
                        PageCaption(caption: Self.caption)
                        Text("群聊")
                            .font(.footnote.weight(.medium))
                            .foregroundStyle(TomatoToken.labelCaption)
                            .textCase(nil)
                    }
                    .textCase(nil)
                    .padding(.leading, 4)
                    .padding(.bottom, 2)
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .contentMargins(.bottom, 76, for: .scrollContent)
            .tomatoScrollEdge()
            .refreshable { roomModel.retry() }
        }
    }
}

private struct RoomRow: View {
    let room: Room

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack(spacing: 8) {
                if room.state == "tripped" {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.stateWarnPrimary)
                }
                Text(room.name)
                    .font(.body.weight(.medium))
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .lineLimit(1)
                Spacer(minLength: 6)
                StatusPill(text: roomStateLabel(room.state), tone: roomStateTone(room.state))
            }
            if !room.charter.isEmpty {
                Text(room.charter)
                    .font(.subheadline)
                    .foregroundStyle(TomatoToken.labelCaption)
                    .lineLimit(2)
            }
            HStack(spacing: 5) {
                Image(systemName: "person.2")
                    .font(.caption2)
                Text("\(room.members.count) 个成员")
                Text("·")
                Text(relativeTime(room.updatedAt))
            }
            .font(.caption)
            .foregroundStyle(TomatoToken.labelDimmed)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            room.state == "tripped" ? TomatoToken.stateWarnPrimary.opacity(0.08) : TomatoToken.bgLayer2,
            in: RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous)
        )
        .contentShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}
