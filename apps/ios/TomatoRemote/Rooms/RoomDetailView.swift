//
//  RoomDetailView.swift
//  Tomato Remote
//
//  One room's live feed, composer, approvals, and operator controls.
//

import SwiftUI

// MARK: - Detail

struct RoomDetailView: View {
    @EnvironmentObject private var app: AppModel
    @ObservedObject var rooms: RoomListModel
    @StateObject private var thread: RoomThreadModel
    let roomId: String

    @State private var draft = ""
    @State private var mentions: Set<String> = []
    @State private var showsInfo = false
    @State private var isChangingState = false
    @State private var actionError: String?

    init(roomId: String, rooms: RoomListModel) {
        self.roomId = roomId
        self.rooms = rooms
        _thread = StateObject(wrappedValue: RoomThreadModel(roomId: roomId))
    }

    private var room: Room? {
        rooms.room(id: roomId)
    }

    var body: some View {
        VStack(spacing: 0) {
            if let error = thread.errorMessage {
                ErrorBanner(message: error) { thread.retry() }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
            }
            if let actionMessage = actionError {
                ErrorBanner(message: actionMessage) { actionError = nil }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
            }
            if let room, room.state != "active" {
                stateBanner(room)
            }
            feed
        }
        .background(TomatoToken.bgBase)
        .navigationTitle(room?.name ?? "群聊")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .tabBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if let room {
                    Button {
                        Task { await toggleState(room) }
                    } label: {
                        if isChangingState {
                            ProgressView().controlSize(.small)
                        } else {
                            Image(systemName: room.state == "active" ? "pause.fill" : "play.fill")
                        }
                    }
                    .disabled(isChangingState)
                    .accessibilityLabel(room.state == "active" ? "暂停群聊" : "恢复群聊")
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("放宽一次") { Task { await relaxOnce() } }
                    Button("结束本轮", role: .destructive) { Task { await endEpisode() } }
                    Button("群聊信息") { showsInfo = true }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
                .accessibilityLabel("群聊操作")
            }
        }
        .sheet(isPresented: $showsInfo) {
            if let room {
                RoomInfoSheet(room: room)
                    .tomatoSheet()
            }
        }
        .task { thread.start(hub: app.hub) }
        .onDisappear { thread.stop() }
    }

    private var feed: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 12) {
                    if thread.isLoading, thread.messages.isEmpty {
                        ProgressView("正在读取消息…")
                            .frame(maxWidth: .infinity)
                            .padding(.top, 50)
                    } else if thread.messages.isEmpty {
                        EmptyPlaceholder(
                            systemImage: "bubble.left.and.bubble.right",
                            title: "群里还没有消息",
                            detail: "发第一条消息；不 @ 成员时按群聊的路由规则唤醒。"
                        )
                    }
                    ForEach(thread.messages) { message in
                        RoomMessageRow(
                            message: message,
                            room: room,
                            isDeciding: thread.isDeciding,
                            onDecide: { decision in
                                guard let approvalId = message.approval?.id else { return }
                                Task { await thread.decide(approvalId: approvalId, decision: decision) }
                            }
                        )
                        .id(message.id)
                    }
                    Color.clear.frame(height: 1).id("bottom")
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 14)
            }
            .scrollDismissesKeyboard(.interactively)
            .tomatoScrollEdge()
            .onChange(of: thread.messages.count) { _, _ in
                withAnimation(.easeOut(duration: 0.2)) { proxy.scrollTo("bottom", anchor: .bottom) }
            }
            .onAppear {
                proxy.scrollTo("bottom", anchor: .bottom)
            }
            .tomatoBottomBar {
                composer
            }
        }
    }

    private var composer: some View {
        VStack(spacing: 8) {
            if let room, !room.members.isEmpty {
                mentionBar(room)
            }
            HStack(alignment: .bottom, spacing: 8) {
                TextField("给群聊发消息", text: $draft, axis: .vertical)
                    .lineLimit(1 ... 5)
                    .accessibilityIdentifier("room.composer")
                    .font(.body)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 9)
                    .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                Button {
                    send()
                } label: {
                    // The visible circle stays 34 pt; the touch target meets 44 pt.
                    if thread.isSending {
                        ProgressView().controlSize(.small)
                            .frame(width: 34, height: 34)
                            .contentShape(Circle().inset(by: -5))
                    } else {
                        Image(systemName: "arrow.up")
                            .font(.footnote.weight(.bold))
                            .foregroundStyle(canSend ? Color.white : TomatoToken.labelTertiary)
                            .frame(width: 34, height: 34)
                            .background(canSend ? TomatoToken.buttonPrimaryFill : TomatoToken.bgLayer3, in: Circle())
                            .contentShape(Circle().inset(by: -5))
                    }
                }
                .buttonStyle(.plain)
                .disabled(!canSend || thread.isSending)
                .accessibilityLabel("发送")
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
    }

    private func mentionBar(_ room: Room) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                ForEach(room.members.filter(\.enabled)) { member in
                    let selected = mentions.contains(member.id)
                    Button {
                        if selected {
                            mentions.remove(member.id)
                        } else {
                            mentions.insert(member.id)
                        }
                    } label: {
                        Text("@" + member.label)
                            .font(.caption.weight(.medium))
                            .foregroundStyle(selected ? TomatoToken.brandPrimary : TomatoToken.labelCaption)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4)
                            .background(
                                selected ? TomatoToken.brandPrimary.opacity(0.12) : TomatoToken.bgLayer2,
                                in: Capsule()
                            )
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("room.mention.\(member.id)")
                }
            }
        }
    }

    private var canSend: Bool {
        !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private func send() {
        let outgoing = draft
        let addressed = Array(mentions)
        draft = ""
        mentions = []
        Task {
            if await !(thread.send(outgoing, mentions: addressed)) {
                draft = outgoing
                mentions = Set(addressed)
            }
        }
    }

    private func stateBanner(_ room: Room) -> some View {
        HStack(spacing: 8) {
            Image(systemName: room.state == "tripped" ? "exclamationmark.triangle.fill" : "pause.circle.fill")
                .foregroundStyle(room.state == "tripped" ? TomatoToken.stateWarnPrimary : TomatoToken.stateIdlePrimary)
            Text(room.state == "tripped" ? "群聊已熔断：恢复前成员不会继续对话。" : "群聊已暂停：成员不会被新的消息唤醒。")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
            Spacer(minLength: 6)
            Button("恢复") {
                Task { await resume() }
            }
            .font(.caption.weight(.medium))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 8)
        .background(TomatoToken.bgLayer2)
    }

    // MARK: Actions

    private func toggleState(_ room: Room) async {
        if room.state == "active" {
            await perform { hub in try await hub.pauseRoom(roomId: roomId, paused: true) }
        } else {
            await resume()
        }
    }

    private func resume() async {
        await perform { hub in try await hub.resumeRoom(roomId: roomId) }
    }

    private func relaxOnce() async {
        await perform { hub in try await hub.relaxRoomOnce(roomId: roomId) }
    }

    private func endEpisode() async {
        await perform { hub in try await hub.endRoomEpisode(roomId: roomId) }
    }

    private func perform(_ action: (HubClient) async throws -> Void) async {
        guard let hub = app.hub else { return }
        isChangingState = true
        defer { isChangingState = false }
        do {
            try await action(hub)
            actionError = nil
        } catch {
            actionError = RoomListModel.message(for: error)
        }
    }
}

// MARK: - Rows

private struct RoomMessageRow: View {
    let message: RoomMessage
    let room: Room?
    let isDeciding: Bool
    let onDecide: (String) -> Void

    private var authorName: String {
        switch message.author {
        case let .human(_, name): name
        case let .member(id): memberName(id)
        case .system: "系统"
        }
    }

    private var isHuman: Bool {
        if case .human = message.author {
            return true
        }
        return false
    }

    private var authorIsSystem: Bool {
        if case .system = message.author {
            return true
        }
        return false
    }

    var body: some View {
        if message.kind == "approval" {
            VStack(alignment: .leading, spacing: 6) {
                approvalCard
                Text(relativeTime(message.at))
                    .font(.caption2)
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        } else if message.kind == "guard" {
            VStack(alignment: .leading, spacing: 5) {
                Text("熔断")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(TomatoToken.stateWarnPrimary)
                Text(guardText)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.stateWarnPrimary)
                    .padding(.horizontal, 11)
                    .padding(.vertical, 7)
                    .background(TomatoToken.stateWarnPrimary.opacity(0.10), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                Text(relativeTime(message.at))
                    .font(.caption2)
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
        } else if authorIsSystem {
            HStack(spacing: 8) {
                Rectangle().fill(TomatoToken.borderL2).frame(height: 0.5)
                Text(messageText)
                    .font(.caption2)
                    .foregroundStyle(TomatoToken.labelDimmed)
                    .lineLimit(2)
                Rectangle().fill(TomatoToken.borderL2).frame(height: 0.5)
            }
            .padding(.vertical, 2)
        } else if isHuman {
            HStack {
                Spacer(minLength: 48)
                VStack(alignment: .trailing, spacing: 3) {
                    Text(message.text.isEmpty ? messageText : message.text)
                        .font(.body)
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .padding(.horizontal, 13)
                        .padding(.vertical, 9)
                        .background(TomatoToken.bgLayer3, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
                        .textSelection(.enabled)
                    if !message.mentions.isEmpty {
                        Text(message.mentions.map { "@" + memberName($0) }.joined(separator: " "))
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelDimmed)
                    }
                    Text(relativeTime(message.at))
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
            }
        } else {
            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 6) {
                    Text(authorName)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(TomatoToken.brandPrimary)
                    if case let .member(id) = message.author {
                        Text(memberRole(id))
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelDimmed)
                    }
                    Text(relativeTime(message.at))
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                card
            }
        }
    }

    @ViewBuilder
    private var card: some View {
        switch message.kind {
        case "activity":
            Text(activityText)
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
                .padding(.horizontal, 11)
                .padding(.vertical, 7)
                .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        case "a2a":
            VStack(alignment: .leading, spacing: 4) {
                Text(a2aLabel)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(TomatoToken.stateBusinessPrimary)
                Text(message.a2a?.task.isEmpty == false ? message.a2a?.task ?? "" : message.text)
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.horizontal, 11)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(TomatoToken.stateBusinessPrimary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
        case "episode":
            Text(messageText)
                .font(.caption2)
                .foregroundStyle(TomatoToken.labelDimmed)
        default:
            Text(message.text.isEmpty ? messageText : message.text)
                .font(.body)
                .foregroundStyle(TomatoToken.labelPrimary)
                .fixedSize(horizontal: false, vertical: true)
                .textSelection(.enabled)
        }
    }

    private var approvalCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "checkmark.shield")
                    .font(.caption)
                    .foregroundStyle(TomatoToken.stateWarnPrimary)
                Text(message.text.isEmpty ? "等待批准的委派" : message.text)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let approval = message.approval {
                if let decision = approval.decision {
                    Text(decision == "approved" ? "已批准" : "已拒绝")
                        .font(.caption)
                        .foregroundStyle(decision == "approved" ? TomatoToken.stateSuccessPrimary : TomatoToken.stateErrorPrimary)
                } else {
                    HStack(spacing: 8) {
                        Button("批准") { onDecide("approved") }
                            .buttonStyle(.borderedProminent)
                            .tint(TomatoToken.brandPrimary)
                            .controlSize(.small)
                            .disabled(isDeciding)
                        Button("拒绝") { onDecide("rejected") }
                            .buttonStyle(.bordered)
                            .controlSize(.small)
                            .disabled(isDeciding)
                    }
                }
            } else {
                Text("审批编号缺失，无法提交。")
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
        }
        .padding(11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TomatoToken.stateWarnPrimary.opacity(0.08), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }

    private var messageText: String {
        if let guardRecord = message.guardRecord, !guardRecord.detail.isEmpty {
            return guardRecord.detail
        }
        if !message.text.isEmpty {
            return message.text
        }
        if let activity = message.activity {
            return activity.label
        }
        return fallbackText
    }

    private var guardText: String {
        if let detail = message.guardRecord?.detail, !detail.isEmpty {
            return detail
        }
        return messageText
    }

    private var activityText: String {
        guard let activity = message.activity else { return message.text }
        var line = activity.label
        if let tokens = activity.tokens, tokens > 0 {
            line += " · \(tokens) tokens"
        }
        return line
    }

    private var a2aLabel: String {
        switch message.a2a?.intent {
        case "delegate": "委派"
        case "handoff": "交接"
        case "inform": "告知"
        case "reply": "回复"
        default: "请求"
        }
    }

    private var fallbackText: String {
        switch message.kind {
        case "approval": "等待批准的委派"
        case "episode": "本轮对话"
        default: "（无内容）"
        }
    }

    private func memberName(_ id: String) -> String {
        room?.members.first { $0.id == id }?.label ?? id
    }

    private func memberRole(_ id: String) -> String {
        guard let role = room?.members.first(where: { $0.id == id })?.role else { return "" }
        return memberRoleLabel(role)
    }
}

// MARK: - Info

private struct RoomInfoSheet: View {
    let room: Room

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    TomatoCard(padding: 18) {
                        VStack(alignment: .leading, spacing: 10) {
                            InfoRow(label: "名称", value: room.name)
                            InfoRow(label: "状态", value: roomStateLabel(room.state))
                            InfoRow(label: "版本", value: "r\(room.revision)")
                            InfoRow(label: "成员", value: "\(room.members.count)")
                            if let root = room.workspaceRoot {
                                InfoRow(label: "工作目录", value: root)
                            }
                        }
                    }
                    if !room.charter.isEmpty {
                        TomatoCard(padding: 18) {
                            VStack(alignment: .leading, spacing: 8) {
                                SectionHeader(title: "群聊说明")
                                Text(room.charter)
                                    .font(.footnote)
                                    .foregroundStyle(TomatoToken.labelSecondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                    TomatoCard(padding: 18) {
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: "成员")
                            ForEach(room.members) { member in
                                HStack(spacing: 8) {
                                    Text(member.label)
                                        .font(.subheadline.weight(.medium))
                                        .foregroundStyle(TomatoToken.labelPrimary)
                                    Text(memberRoleLabel(member.role))
                                        .font(.caption2)
                                        .foregroundStyle(TomatoToken.labelCaption)
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(TomatoToken.bgLayer2, in: Capsule())
                                    Spacer(minLength: 6)
                                    if !member.enabled {
                                        Text("停用")
                                            .font(.caption2)
                                            .foregroundStyle(TomatoToken.labelDimmed)
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(20)
            }
            .background(TomatoToken.bgBase)
            .navigationTitle("群聊")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完成") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Labels

/// Human label of a room lifecycle state.
/// @param state - wire state.
func roomStateLabel(_ state: String) -> String {
    switch state {
    case "active": "活跃"
    case "paused": "已暂停"
    case "tripped": "已熔断"
    case "archived": "已归档"
    default: state
    }
}

/// Tone of a room lifecycle state.
/// @param state - wire state.
func roomStateTone(_ state: String) -> StatusPill.Tone {
    switch state {
    case "active": .active
    case "paused": .idle
    case "tripped": .error
    case "archived": .idle
    default: .idle
    }
}

/// Human label of a member role.
/// @param role - wire role.
func memberRoleLabel(_ role: String) -> String {
    switch role {
    case "coordinator": "协调"
    case "worker": "执行"
    case "reviewer": "复核"
    case "observer": "观察"
    default: role
    }
}
