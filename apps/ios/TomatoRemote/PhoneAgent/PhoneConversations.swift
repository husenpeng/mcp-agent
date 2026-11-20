//
//  PhoneConversations.swift
//  Tomato Remote
//
//  The conversations Tomato Phone keeps on this device. Each one is a JSON file
//  under Application Support; the history list reads one row per file, and the
//  single transcript older builds wrote is folded in on first launch.
//

import Foundation

/// One conversation as the history list draws it.
struct PhoneConversationSummary: Identifiable, Equatable {
    let id: String
    var title: String
    let updatedAt: Date
    let messageCount: Int
    let preview: String?
}

/// One conversation and its transcript.
struct PhoneConversation: Codable, Equatable, Identifiable {
    /// Title a conversation carries until its first prompt names it.
    static let untitled = "新会话"

    var id: String
    var title: String
    var createdAt: Date
    var updatedAt: Date
    var messages: [AgentMessage]
    /// Session id on the company agent_service, when this conversation runs there.
    var serviceSessionId: String?

    init(
        id: String = UUID().uuidString,
        title: String = PhoneConversation.untitled,
        createdAt: Date = .now,
        updatedAt: Date = .now,
        messages: [AgentMessage] = [],
        serviceSessionId: String? = nil
    ) {
        self.id = id
        self.title = title
        self.createdAt = createdAt
        self.updatedAt = updatedAt
        self.messages = messages
        self.serviceSessionId = serviceSessionId
    }

    /// Whether nothing has been said in this conversation yet.
    var isEmpty: Bool {
        messages.isEmpty
    }

    /// The row behind this conversation in the history list.
    var summary: PhoneConversationSummary {
        PhoneConversationSummary(
            id: id,
            title: title,
            updatedAt: updatedAt,
            messageCount: messages.count,
            preview: Self.preview(from: messages)
        )
    }

    /// Name a conversation after the prompt that opened it.
    ///
    /// The history row has room for one short line, so a long prompt is cut at a
    /// fixed length and a prompt that carried only files is named for its files.
    /// - Parameter first: the conversation's first message.
    /// - Returns: a title that fits the history row.
    static func title(for first: AgentMessage) -> String {
        let text = collapsed(first.text)
        if !text.isEmpty {
            return clipped(text, limit: 18)
        }
        let documents = first.attachmentList.filter { $0.kind == .document }
        if let name = documents.first?.name.trimmingCharacters(in: .whitespacesAndNewlines), !name.isEmpty {
            return clipped(name, limit: 18)
        }
        if !documents.isEmpty {
            return "文档对话"
        }
        if first.attachmentList.contains(where: { $0.kind == .image }) {
            return "照片对话"
        }
        return untitled
    }

    /// One line describing the newest turn that said something.
    ///
    /// Tool output and capability proposals are machinery rather than
    /// conversation, so the preview stays with the owner's and the agent's own
    /// words.
    /// - Parameter messages: the conversation's transcript.
    /// - Returns: the preview line, or nil before the first text.
    static func preview(from messages: [AgentMessage]) -> String? {
        for message in messages.reversed() where message.role == .user || message.role == .assistant {
            let text = collapsed(message.text)
            if !text.isEmpty {
                return clipped(text, limit: 44)
            }
            if !message.attachmentList.isEmpty {
                return attachments(from: message.attachmentList)
            }
        }
        return nil
    }

    /// What a file-only turn was carrying, in a few words.
    /// - Parameter attachments: files on one user message.
    /// - Returns: a phrase that keeps the row informative without its text.
    private static func attachments(from attachments: [AgentAttachment]) -> String {
        let images = attachments.filter { $0.kind == .image }.count
        let documents = attachments.filter { $0.kind == .document }
        if images > 0, documents.isEmpty {
            return images == 1 ? "1 张照片" : "\(images) 张照片"
        }
        if images == 0, documents.count == 1, let name = documents.first?.name, !name.isEmpty {
            return clipped("文档 \(name)", limit: 44)
        }
        if images == 0, !documents.isEmpty {
            return "\(documents.count) 份文档"
        }
        return "照片与文档"
    }

    /// Collapse every run of whitespace into one space.
    /// - Parameter text: raw message text.
    /// - Returns: one line with no leading or trailing whitespace.
    private static func collapsed(_ text: String) -> String {
        text.split(whereSeparator: \.isWhitespace).joined(separator: " ")
    }

    /// Cut one line to the length its row can show.
    /// - Parameters:
    ///   - text: already collapsed text.
    ///   - limit: characters kept before the ellipsis.
    /// - Returns: the text, marked when it was cut.
    private static func clipped(_ text: String, limit: Int) -> String {
        text.count <= limit ? text : String(text.prefix(limit)) + "…"
    }
}

/// Reads and writes the conversations Tomato Phone keeps on this device.
///
/// The folders are prepared on the first write, not here: construction runs
/// while the phone tab builds, and a launch must not wait on the disk.
struct PhoneConversationStore {
    /// Folder holding one JSON file per conversation.
    let folder: URL
    /// Folder holding staged photos and documents referenced by messages.
    let attachments: URL
    /// Single-transcript file older builds wrote, folded in on first launch.
    let legacyThread: URL

    /// Every stored conversation, newest first.
    /// - Returns: the conversations that decode; a damaged file is reported and
    ///   skipped rather than hiding the rest of the history.
    func loadAll() -> [PhoneConversation] {
        let files = (try? FileManager.default.contentsOfDirectory(
            at: folder,
            includingPropertiesForKeys: nil
        )) ?? []
        var loaded: [PhoneConversation] = []
        for file in files where file.pathExtension == "json" {
            do {
                try loaded.append(JSONDecoder().decode(PhoneConversation.self, from: Data(contentsOf: file)))
            } catch {
                AppLog.warning(.session, "Phone 会话文件无法读取", detail: file.lastPathComponent)
            }
        }
        return loaded.sorted { $0.updatedAt > $1.updatedAt }
    }

    /// One conversation by identity.
    /// - Parameter id: the conversation's identity.
    /// - Returns: the stored transcript, or nil when its file is gone.
    func load(_ id: String) -> PhoneConversation? {
        guard let data = try? Data(contentsOf: fileURL(id)) else { return nil }
        return try? JSONDecoder().decode(PhoneConversation.self, from: data)
    }

    /// Write one conversation to its own file.
    /// - Parameter conversation: the transcript to store.
    /// - Throws: when the file cannot be encoded or written.
    func save(_ conversation: PhoneConversation) throws {
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        let data = try JSONEncoder().encode(conversation)
        try data.write(to: fileURL(conversation.id), options: .atomic)
    }

    /// Remove one conversation and the attachment files only it referenced.
    /// - Parameter conversation: the stored transcript to delete.
    /// - Throws: when the transcript file cannot be removed.
    func delete(_ conversation: PhoneConversation) throws {
        let referencedElsewhere = Set(
            loadAll()
                .filter { $0.id != conversation.id }
                .flatMap { $0.messages.flatMap(\.attachmentList).map(\.file) }
        )
        for attachment in conversation.messages.flatMap(\.attachmentList)
            where !referencedElsewhere.contains(attachment.file)
        {
            try? FileManager.default.removeItem(at: attachments.appendingPathComponent(attachment.file))
        }
        let url = fileURL(conversation.id)
        if FileManager.default.fileExists(atPath: url.path) {
            try FileManager.default.removeItem(at: url)
        }
    }

    /// Fold the one transcript older builds wrote into the history.
    ///
    /// The old file is renamed after a successful import, so deleting every
    /// conversation later cannot resurrect it.
    /// - Returns: the conversations on disk after migration, newest first.
    func migrateLegacyThread() -> [PhoneConversation] {
        let stored = loadAll()
        guard FileManager.default.fileExists(atPath: legacyThread.path) else { return stored }
        guard stored.isEmpty else {
            archiveLegacyThread()
            return stored
        }
        guard let data = try? Data(contentsOf: legacyThread),
              let messages = try? JSONDecoder().decode([AgentMessage].self, from: data)
        else {
            AppLog.warning(.session, "Phone 旧对话无法读取", detail: legacyThread.lastPathComponent)
            return stored
        }
        guard !messages.isEmpty else {
            archiveLegacyThread()
            return stored
        }
        let first = messages.first(where: { $0.role == .user }) ?? messages[0]
        let conversation = PhoneConversation(
            title: PhoneConversation.title(for: first),
            createdAt: messages.first?.time ?? .now,
            updatedAt: messages.last?.time ?? .now,
            messages: messages
        )
        do {
            try save(conversation)
        } catch {
            AppLog.error(.session, "Phone 旧对话迁移失败", detail: error.localizedDescription)
            return stored
        }
        archiveLegacyThread()
        return [conversation]
    }

    /// Store one attachment file next to the conversations.
    /// - Parameters:
    ///   - data: encoded image or extracted document text.
    ///   - fileExtension: extension without the dot.
    /// - Returns: the file name a message record carries.
    /// - Throws: when the file cannot be written.
    func write(_ data: Data, fileExtension: String) throws -> String {
        try FileManager.default.createDirectory(at: attachments, withIntermediateDirectories: true)
        let name = "\(UUID().uuidString).\(fileExtension)"
        try data.write(to: attachments.appendingPathComponent(name), options: .atomic)
        return name
    }

    /// Bytes of one stored attachment.
    /// - Parameter name: the file name a message record carries.
    /// - Returns: the file's data, or nil when it is gone.
    func data(named name: String) -> Data? {
        try? Data(contentsOf: attachments.appendingPathComponent(name))
    }

    /// Extracted text of one stored document.
    /// - Parameter name: the file name a message record carries.
    /// - Returns: the text, or nil when it is gone.
    func text(named name: String) -> String? {
        try? String(contentsOf: attachments.appendingPathComponent(name), encoding: .utf8)
    }

    /// File behind one conversation.
    /// - Parameter id: the conversation's identity.
    /// - Returns: the JSON file that conversation lives in.
    private func fileURL(_ id: String) -> URL {
        folder.appendingPathComponent("\(id).json")
    }

    /// Move an imported transcript aside, replacing an earlier archive.
    private func archiveLegacyThread() {
        let archive = URL(fileURLWithPath: legacyThread.path + ".migrated")
        try? FileManager.default.removeItem(at: archive)
        do {
            try FileManager.default.moveItem(at: legacyThread, to: archive)
        } catch {
            AppLog.warning(.session, "Phone 旧对话没能归档", detail: error.localizedDescription)
        }
    }
}
