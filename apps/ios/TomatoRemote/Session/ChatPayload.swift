//
//  ChatPayload.swift
//  Tomato Remote
//
//  Reading one event payload: who wrote it, what it says, and what to call the
//  context a producer injected.
//

import Foundation

extension ChatModel {
    /// Reader-facing name of the producer that injected one context message.
    /// - Parameter data: the `user/message` payload.
    /// - Returns: the label its disclosure shows.
    static func contextLabel(_ data: JSONValue?) -> String {
        switch data?["source"]?["kind"]?.stringValue {
        case "compact-checkpoint": "压缩检查点"
        case "action-cards": "动作卡状态"
        case "schedule": "定时任务"
        case "turn-timing": "回合提示"
        case "retrieval": "跨会话召回"
        case "system-prompt": "上下文注入"
        default: "上下文注入"
        }
    }

    /// Whether a user-role message is the person's own input.
    ///
    /// A missing source predates the source field, and those messages came from a
    /// person, so only an explicit other kind is filtered out.
    /// - Parameter data: the `user/message` payload.
    /// - Returns: true when the person typed it.
    static func isPersonMessage(_ data: JSONValue?) -> Bool {
        guard let kind = data?["source"]?["kind"]?.stringValue else { return true }
        return kind == "user"
    }

    /// What one person's message carries in the transcript.
    ///
    /// Photos are structure, not words: the Host records each as a durable
    /// reference beside the text, and the transcript draws the pictures. That
    /// reference travels with the row in full, because reading the bytes back
    /// verifies the media type, byte length, and dimensions, not only the id.
    /// Only a staged document keeps a marker in the bubble, because the app
    /// shows its name in the composer but has no card for it yet.
    /// - Parameter data: the `user/message` payload.
    /// - Returns: the message's text, photo references, and document count.
    static func content(of data: JSONValue?) -> ChatMessageContent {
        guard let blocks = data?["content"]?.arrayValue else {
            return ChatMessageContent(text: text(of: data) ?? "")
        }
        var content = ChatMessageContent()
        var parts: [String] = []
        for block in blocks {
            switch block["type"]?.stringValue {
            case "text":
                if let value = block["text"]?.stringValue {
                    parts.append(value)
                }
            case "image":
                if let attachment = block["attachment"]?.decoded(ChatImageAttachment.self),
                   !attachment.attachmentId.isEmpty
                {
                    content.images.append(ChatImageRef(attachment))
                } else if let id = block["attachment"]?["attachmentId"]?.stringValue, !id.isEmpty {
                    // A log from before the reference carried its dimensions can
                    // still draw the row, but its bytes cannot be verified.
                    content.images.append(ChatImageRef(id: id))
                }
            case "file":
                content.files += 1
            default:
                break
            }
        }
        content.text = ([parts.joined(separator: "\n")].filter { !$0.isEmpty }
            + markers(files: content.files)).joined(separator: "\n")
        return content
    }

    /// What one injected context message reads as.
    ///
    /// These are harness notices rather than the person's own words: the row is
    /// a text disclosure, so a photo they carry has no place in it.
    /// - Parameter data: the `user/message` payload.
    /// - Returns: the text to render, or nil when the message holds no content.
    static func body(of data: JSONValue?) -> String? {
        let content = content(of: data)
        return content.isEmpty ? nil : content.text
    }

    /// One person's prompt row, in the same words `content(of:)` renders.
    /// @param text - what the person typed; may be empty.
    /// @param hasDocument - whether a staged document rides along.
    /// @returns the row text this phone shows before the Host echoes it.
    static func promptBody(text: String, hasDocument: Bool) -> String {
        ([text].filter { !$0.isEmpty } + markers(files: hasDocument ? 1 : 0)).joined(separator: "\n")
    }

    /// One line per staged document, so the durable row and the local echo of
    /// the same prompt can never word it differently.
    /// @param files - staged documents the message carries.
    /// @returns the markers in the order attachments were sent.
    private static func markers(files: Int) -> [String] {
        guard files > 0 else { return [] }
        return [files == 1 ? "［文件］" : "［文件 ×\(files)］"]
    }

    /// Identity the Host recorded for one prompt, when it reported one.
    /// @param data - the `user/message` payload.
    /// @returns the `rpcId` the sending client chose, or nil.
    static func requestId(of data: JSONValue?) -> String? {
        data?["source"]?["rpcId"]?.stringValue
    }

    /// Turn a step event was recorded in.
    /// @param data - an `assistant/message`, `tool/call`, or `tool/result` payload.
    /// @returns the turn number, or nil when the producer wrote none.
    static func turn(of data: JSONValue?) -> Int? {
        data?["turn"]?.doubleValue.map { finiteInt($0) }
    }

    /// Extracts text blocks from a `{ role, content: [...] }` message payload.
    /// Non-text blocks are skipped rather than rendered as noise.
    static func text(of data: JSONValue?) -> String? {
        if let plain = data?.stringValue {
            return plain
        }
        guard let blocks = data?["content"]?.arrayValue else { return nil }
        let parts = blocks.compactMap { block -> String? in
            guard block["type"]?.stringValue == "text" else { return nil }
            return block["text"]?.stringValue
        }
        return parts.isEmpty ? nil : parts.joined(separator: "\n")
    }
}
