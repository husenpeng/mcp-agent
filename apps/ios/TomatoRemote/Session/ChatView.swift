//
//  ChatView.swift
//  Tomato Remote
//
//  Conversation core: follows one Session's event stream, renders messages,
//  and sends prompts through the same Remote surface the Web client uses.
//

import SwiftUI

// MARK: - Rendered model

struct ChatMessage: Identifiable, Equatable {
    enum Role: Equatable {
        case user
        case assistant
        case tool
        case note
    }

    let id: String
    let role: Role
    var text: String
    var pending: Bool = false
}

/// Reads one Session's history and live frames.
@MainActor
final class ChatModel: ObservableObject {
    let sessionId: String

    @Published private(set) var messages: [ChatMessage] = []
    @Published private(set) var streamingText: String = ""
    @Published private(set) var isRunning = false
    @Published private(set) var isFollowing = false
    @Published var errorMessage: String?

    private var streamTask: Task<Void, Never>?
    private var hub: HubClient?
    private var sequence: Int = 0

    init(sessionId: String) {
        self.sessionId = sessionId
    }

    /// Opens the follow stream. Idempotent, so `.task` and a manual retry can both call it.
    func start(hub: HubClient?) {
        guard streamTask == nil, let hub else { return }
        self.hub = hub
        errorMessage = nil
        isFollowing = true
        streamTask = Task { [weak self] in
            guard let self else { return }
            do {
                let stream = RemoteStream.frames(
                    base: hub.base,
                    cookie: hub.cookie,
                    endpoint: "session/follow",
                    payload: SessionFollowRequest(
                        address: SessionAddress(sessionId: self.sessionId),
                        assistantStream: true
                    )
                )
                for try await frame in stream {
                    self.ingest(frame)
                }
            } catch {
                if !Task.isCancelled {
                    self.errorMessage = describe(error)
                }
            }
            self.isFollowing = false
            self.streamTask = nil
        }
    }

    func stop() {
        streamTask?.cancel()
        streamTask = nil
        isFollowing = false
    }

    /// Send one prompt, optionally with a photo the composer already downscaled.
    /// @param text - prompt text; may be empty when `image` is present.
    /// @param image - JPEG bytes to attach, or nil.
    func send(_ text: String, image: Data? = nil) async {
        guard let hub else { return }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty || image != nil else { return }
        errorMessage = nil
        append(role: .user, text: trimmed.isEmpty ? "（图片）" : trimmed)
        isRunning = true
        do {
            try await hub.sendPrompt(sessionId: sessionId, text: trimmed, image: image)
        } catch {
            isRunning = false
            errorMessage = describe(error)
        }
    }

    func cancel() async {
        guard let hub else { return }
        do {
            try await hub.cancelSession(sessionId: sessionId)
        } catch {
            errorMessage = describe(error)
        }
    }

    // MARK: Frames

    private func ingest(_ frame: JSONValue) {
        switch frame["type"]?.stringValue {
        case "snapshot":
            messages = []
            streamingText = ""
            for record in frame["records"]?.arrayValue ?? [] {
                if let event = record["event"] { ingestEvent(event) }
            }
            isRunning = true
        case "event":
            if let event = frame["event"] { ingestEvent(event) }
        case "assistant-stream":
            ingestAssistantStream(frame["frame"])
        default:
            break
        }
    }

    private func ingestAssistantStream(_ frame: JSONValue?) {
        guard let frame else { return }
        switch frame["type"]?.stringValue {
        case "start":
            streamingText = ""
        case "chunk":
            guard let chunk = frame["chunk"] else { return }
            if chunk["type"]?.stringValue == "text-delta", let text = chunk["text"]?.stringValue {
                streamingText += text
            }
        case "end":
            if !streamingText.isEmpty {
                append(role: .assistant, text: streamingText)
            }
            streamingText = ""
        default:
            break
        }
    }

    private func ingestEvent(_ event: JSONValue) {
        let type = event["type"]?.stringValue ?? ""
        let data = event["data"]
        switch type {
        case "user/message":
            guard let text = Self.text(of: data), !text.isEmpty else { return }
            append(role: .user, text: text)
        case "assistant/message":
            guard let text = Self.text(of: data), !text.isEmpty else { return }
            append(role: .assistant, text: text)
        case "turn/start":
            isRunning = true
        case "turn/end":
            isRunning = false
            streamingText = ""
        default:
            if type.hasPrefix("tool") {
                append(role: .tool, text: Self.toolLabel(type: type, data: data))
            }
        }
    }

    private func append(role: ChatMessage.Role, text: String) {
        sequence += 1
        messages.append(ChatMessage(id: "local-\(sequence)", role: role, text: text))
    }

    /// Extracts text blocks from a `{ role, content: [...] }` message payload.
    /// Non-text blocks are skipped rather than rendered as noise.
    private static func text(of data: JSONValue?) -> String? {
        if let plain = data?.stringValue { return plain }
        guard let blocks = data?["content"]?.arrayValue else { return nil }
        let parts = blocks.compactMap { block -> String? in
            guard block["type"]?.stringValue == "text" else { return nil }
            return block["text"]?.stringValue
        }
        return parts.isEmpty ? nil : parts.joined(separator: "\n")
    }

    private static func toolLabel(type: String, data: JSONValue?) -> String {
        let name = data?["name"]?.stringValue
            ?? data?["tool"]?.stringValue
            ?? data?["toolName"]?.stringValue
        if let name { return "工具：\(name)" }
        return type
    }
}

// MARK: - Screen

struct ChatView: View {
    @EnvironmentObject private var model: AppModel
    @StateObject private var chat: ChatModel
    @State private var draft: String = ""

    let title: String

    init(summary: SessionSummary) {
        _chat = StateObject(wrappedValue: ChatModel(sessionId: summary.sessionId))
        title = summary.displayTitle
    }

    init(sessionId: String, title: String) {
        _chat = StateObject(wrappedValue: ChatModel(sessionId: sessionId))
        self.title = title
    }

    var body: some View {
        VStack(spacing: 0) {
            if let error = chat.errorMessage {
                ErrorBanner(message: error) {
                    chat.errorMessage = nil
                    chat.start(hub: model.hub)
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
            }

            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 12) {
                        ForEach(chat.messages) { message in
                            MessageRow(message: message)
                                .id(message.id)
                        }
                        if !chat.streamingText.isEmpty {
                            MessageRow(
                                message: ChatMessage(
                                    id: "streaming",
                                    role: .assistant,
                                    text: chat.streamingText,
                                    pending: true
                                )
                            )
                            .id("streaming")
                        }
                        if chat.messages.isEmpty && chat.streamingText.isEmpty {
                            EmptyPlaceholder(
                                systemImage: "bubble.left",
                                title: chat.isFollowing ? "开始对话" : "正在连接…",
                                detail: chat.isFollowing ? "输入一句话，Mac 上的 agent 会在这里回应并执行。" : nil
                            )
                        }
                        Color.clear.frame(height: 1).id("bottom")
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: chat.messages.count) { _, _ in scrollToBottom(proxy) }
                .onChange(of: chat.streamingText) { _, _ in scrollToBottom(proxy) }
                .onAppear {
                    scrollToBottom(proxy, animated: false)
                    chat.start(hub: model.hub)
                }
            }

            ComposerView(
                text: $draft,
                isRunning: chat.isRunning,
                isConnected: chat.isFollowing,
                onSend: { image in
                    let outgoing = draft
                    draft = ""
                    Task { await chat.send(outgoing, image: image) }
                },
                onCancel: { Task { await chat.cancel() } }
            )
        }
        .background(TomatoToken.bgBase)
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .onDisappear { chat.stop() }
    }

    private func scrollToBottom(_ proxy: ScrollViewProxy, animated: Bool = true) {
        if animated {
            withAnimation(.easeOut(duration: 0.2)) { proxy.scrollTo("bottom", anchor: .bottom) }
        } else {
            proxy.scrollTo("bottom", anchor: .bottom)
        }
    }
}

private struct MessageRow: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.role == .user { Spacer(minLength: 40) }
            VStack(alignment: .leading, spacing: 4) {
                if message.role == .tool {
                    HStack(spacing: 6) {
                        Image(systemName: "wrench.and.screwdriver")
                            .font(.caption2)
                        Text(message.text)
                            .font(.caption)
                    }
                    .foregroundStyle(TomatoToken.labelCaption)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(TomatoToken.bgLayer2)
                    .clipShape(Capsule())
                } else {
                    Text(message.text)
                        .font(.callout)
                        .foregroundStyle(message.role == .user ? Color.white : TomatoToken.labelPrimary)
                        .textSelection(.enabled)
                    if message.pending {
                        Text("生成中…")
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelDimmed)
                    }
                }
            }
            .padding(message.role == .tool ? 0 : 10)
            .background(message.role == .user ? TomatoToken.brandPrimary : TomatoToken.bgLayer1)
            .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
            if message.role != .user { Spacer(minLength: 40) }
        }
    }
}