//
//  PhoneConversationListSheet.swift
//  Tomato Remote
//
//  Tomato Phone's conversation history: the rows to switch between, rename, and
//  remove the conversations kept on this phone.
//

import SwiftUI

/// The history sheet under the Tomato Phone header.
struct PhoneConversationListSheet: View {
    @ObservedObject var agent: PhoneAgentModel
    @Environment(\.dismiss) private var dismiss

    @State private var query = ""
    /// Conversation being renamed.
    @State private var renaming: PhoneConversationSummary?
    /// Conversation the delete confirmation names.
    @State private var pendingDelete: PhoneConversationSummary?

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(
                title: "会话",
                caption: "Tomato Phone 的对话只保存在这台手机上。",
                onClose: { dismiss() }
            )
            newButton
            if agent.isRunning {
                runningNotice
            }
            if !agent.conversations.isEmpty {
                searchField
            }
            content
        }
        .background(TomatoToken.bgBase)
        .sheet(item: $renaming) { summary in
            PhoneConversationRenameSheet(title: summary.title) { title in
                agent.rename(summary.id, to: title)
                renaming = nil
            }
            .tomatoSheet([.height(260)])
        }
        .confirmationDialog(
            "删除这个会话？",
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
        ) { summary in
            Button("删除", role: .destructive) {
                agent.delete(summary)
                pendingDelete = nil
            }
            Button("取消", role: .cancel) {
                pendingDelete = nil
            }
        } message: { summary in
            Text(deleteMessage(for: summary))
        }
    }

    // MARK: Actions

    private var newButton: some View {
        TomatoPrimaryButton(title: "新会话", systemImage: "square.and.pencil") {
            agent.startNewConversation()
            dismiss()
        }
        .accessibilityIdentifier("phone.conversation.new")
        .padding(.horizontal, 20)
        .padding(.bottom, 10)
    }

    /// A turn belongs to the conversation it started in, so the sheet says what
    /// switching will do before the reader taps a row.
    private var runningNotice: some View {
        HStack(spacing: 6) {
            RunningDot()
            Text("回答进行中，切换会话会停止当前回答。")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.bottom, 8)
        .accessibilityElement(children: .combine)
        .accessibilityLabel("回答进行中，切换会话会停止当前回答。")
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelDimmed)
            TextField("搜索会话", text: $query)
                .font(.subheadline)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.search)
                .accessibilityIdentifier("phone.conversation.search")
            if !query.isEmpty {
                Button {
                    query = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("清除搜索")
            }
        }
        .padding(.horizontal, 12)
        .frame(height: 38)
        .background(TomatoToken.bgLayer2, in: Capsule())
        .padding(.horizontal, 20)
        .padding(.bottom, 10)
    }

    // MARK: Content

    @ViewBuilder
    private var content: some View {
        if agent.conversations.isEmpty {
            ScrollView {
                EmptyPlaceholder(
                    systemImage: "clock.arrow.circlepath",
                    title: "还没有会话",
                    detail: "发送第一条消息后，会话会按时间列在这里。"
                )
                .padding(.horizontal, 20)
            }
        } else if filtered.isEmpty {
            ScrollView {
                EmptyPlaceholder(
                    systemImage: "magnifyingglass",
                    title: "没有匹配的会话",
                    detail: "换一个关键词试试。"
                )
                .padding(.horizontal, 20)
            }
        } else {
            list
        }
    }

    private var list: some View {
        List {
            ForEach(filtered) { summary in
                Button {
                    open(summary)
                } label: {
                    row(summary)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("phone.conversation.row.\(summary.id)")
                .listRowBackground(Color.clear)
                .listRowSeparator(.hidden)
                .listRowInsets(EdgeInsets(top: 3, leading: 16, bottom: 3, trailing: 16))
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button(role: .destructive) {
                        pendingDelete = summary
                    } label: {
                        Label("删除", systemImage: "trash")
                    }
                    Button {
                        renaming = summary
                    } label: {
                        Label("重命名", systemImage: "pencil")
                    }
                    .tint(AgentTheme.accent)
                }
                .contextMenu {
                    Button {
                        renaming = summary
                    } label: {
                        Label("重命名", systemImage: "pencil")
                    }
                    Button(role: .destructive) {
                        pendingDelete = summary
                    } label: {
                        Label("删除", systemImage: "trash")
                    }
                }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .scrollDismissesKeyboard(.immediately)
        .contentMargins(.bottom, 24, for: .scrollContent)
    }

    /// One history row: its title, the newest thing said, and when.
    /// - Parameter summary: the conversation this row opens.
    /// - Returns: the row with its current-conversation mark.
    private func row(_ summary: PhoneConversationSummary) -> some View {
        let isActive = summary.id == agent.activeConversationId
        return VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(summary.title)
                    .font(.body.weight(isActive ? .semibold : .medium))
                    .foregroundStyle(AgentTheme.ink)
                    .lineLimit(1)
                if isActive {
                    if agent.isRunning {
                        RunningDot()
                    } else {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundStyle(AgentTheme.accent)
                    }
                }
                Spacer(minLength: 6)
            }
            if let preview = summary.preview {
                Text(preview)
                    .font(.subheadline)
                    .foregroundStyle(AgentTheme.inkSecondary)
                    .lineLimit(1)
            }
            Text("\(relativeTime(summary.updatedAt.timeIntervalSince1970 * 1000)) · \(summary.messageCount) 条")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelDimmed)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 11)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            isActive ? AgentTheme.accent.opacity(0.06) : AgentTheme.surfaceMuted,
            in: RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous)
                .strokeBorder(isActive ? AgentTheme.accent.opacity(0.25) : AgentTheme.border, lineWidth: 1)
        )
        .contentShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityText(for: summary, isActive: isActive))
        .accessibilityHint("打开这个会话")
    }

    /// What a tap on one row says to VoiceOver.
    /// - Parameters:
    ///   - summary: the row's conversation.
    ///   - isActive: whether the row is the conversation on screen.
    /// - Returns: one sentence naming the row and its state.
    private func accessibilityText(for summary: PhoneConversationSummary, isActive: Bool) -> String {
        var parts = [summary.title]
        if let preview = summary.preview {
            parts.append(preview)
        }
        parts.append("\(summary.messageCount) 条")
        if isActive {
            parts.append(agent.isRunning ? "回答中" : "当前会话")
        }
        return parts.joined(separator: "，")
    }

    private func deleteMessage(for summary: PhoneConversationSummary) -> String {
        let isRunning = agent.isRunning && summary.id == agent.activeConversationId
        if isRunning {
            return "当前回答会停止；消息和附件会从这台手机上移除，不能恢复。"
        }
        return "消息和附件会从这台手机上移除，不能恢复。"
    }

    /// Conversations matching the search, in history order.
    private var filtered: [PhoneConversationSummary] {
        let needle = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !needle.isEmpty else { return agent.conversations }
        return agent.conversations.filter {
            $0.title.localizedCaseInsensitiveContains(needle)
                || ($0.preview ?? "").localizedCaseInsensitiveContains(needle)
        }
    }

    /// Open one conversation and leave the history.
    /// - Parameter summary: the row the reader tapped.
    private func open(_ summary: PhoneConversationSummary) {
        agent.selectConversation(summary.id)
        dismiss()
    }
}

/// One title field for a stored conversation.
private struct PhoneConversationRenameSheet: View {
    let onSave: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var title: String

    /// Open the field on the conversation's current name.
    /// - Parameters:
    ///   - title: the name the row shows now.
    ///   - onSave: called with the trimmed, non-empty new name.
    init(title: String, onSave: @escaping (String) -> Void) {
        _title = State(initialValue: title)
        self.onSave = onSave
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            SheetHeader(title: "重命名会话", caption: "只改列表里的显示名。", onClose: { dismiss() })
            TextField("标题", text: $title)
                .font(.body)
                .padding(.horizontal, 14)
                .frame(height: 46)
                .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
                .padding(.horizontal, 20)
                .accessibilityIdentifier("phone.conversation.rename")
            Spacer(minLength: 0)
            SheetPrimaryButton(
                title: "保存",
                isEnabled: !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ) {
                let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
                guard !trimmed.isEmpty else { return }
                onSave(trimmed)
                dismiss()
            }
            .padding(.bottom, 22)
        }
        .background(TomatoToken.bgBase)
    }
}
