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

    /// What one person's message shows in the transcript.
    ///
    /// A prompt may carry nothing but a photo or a staged document; joining only
    /// its text blocks returned nothing for those, so the whole message vanished
    /// from history. Each attachment contributes one marker instead.
    /// - Parameter data: the `user/message` payload.
    /// - Returns: the text to render, or nil when the message holds no content.
    static func body(of data: JSONValue?) -> String? {
        guard let blocks = data?["content"]?.arrayValue else { return text(of: data) }
        var parts: [String] = []
        var images = 0
        var files = 0
        for block in blocks {
            switch block["type"]?.stringValue {
            case "text":
                if let value = block["text"]?.stringValue {
                    parts.append(value)
                }
            case "image":
                images += 1
            case "file":
                files += 1
            default:
                break
            }
        }
        parts.append(contentsOf: markers(images: images, files: files))
        return parts.isEmpty ? nil : parts.joined(separator: "\n")
    }

    /// One person's prompt rows, in the same words `body(of:)` renders.
    /// @param text - what the person typed; may be empty.
    /// @param images - photos attached to the prompt.
    /// @param hasDocument - whether a staged document rides along.
    /// @returns the row text this phone shows before the Host echoes it.
    static func promptBody(text: String, images: Int, hasDocument: Bool) -> String {
        var parts: [String] = []
        if !text.isEmpty {
            parts.append(text)
        }
        parts.append(contentsOf: markers(images: images, files: hasDocument ? 1 : 0))
        return parts.joined(separator: "\n")
    }

    /// One line per attachment kind, so the durable row and the local echo of the
    /// same prompt can never word it differently.
    /// @param images - photos the message carries.
    /// @param files - staged documents it carries.
    /// @returns the markers in the order attachments were sent.
    private static func markers(images: Int, files: Int) -> [String] {
        var parts: [String] = []
        if images > 0 {
            parts.append(images == 1 ? "［图片］" : "［图片 ×\(images)］")
        }
        if files > 0 {
            parts.append(files == 1 ? "［文件］" : "［文件 ×\(files)］")
        }
        return parts
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
        guard let value = data?["turn"]?.doubleValue else { return nil }
        return Int(value)
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
