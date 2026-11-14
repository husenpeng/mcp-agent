//
//  PhoneConversationsTests.swift
//  TomatoRemoteTests
//
//  The rules behind Tomato Phone's history: how a first prompt names a
//  conversation, what the list previews, where conversations are stored, and
//  how the single transcript older builds wrote is folded in once.
//

@testable import TomatoRemote
import XCTest

final class PhoneConversationsTests: XCTestCase {
    private var root: URL!

    override func setUpWithError() throws {
        root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: root)
    }

    /// A store over a disposable folder, so no test reads the app's history.
    /// - Returns: the store and its one root folder.
    private func makeStore() -> PhoneConversationStore {
        PhoneConversationStore(
            folder: root.appendingPathComponent("conversations", isDirectory: true),
            attachments: root.appendingPathComponent("attachments", isDirectory: true),
            legacyThread: root.appendingPathComponent("thread.json")
        )
    }

    // MARK: - Titles

    /// The first prompt names the conversation, one collapsed line at a time.
    func testFirstPromptNamesTheConversation() {
        let prompt = AgentMessage(role: .user, text: "  帮我整理一下这周的发布说明，\n并列出三件要紧的事。 ")
        let title = PhoneConversation.title(for: prompt)
        XCTAssertEqual(title, "帮我整理一下这周的发布说明， 并列出…")
        XCTAssertTrue(title.hasSuffix("…"))
        XCTAssertEqual(title.count, 19)
    }

    /// A prompt that fits stays whole, and a blank prompt keeps the default.
    func testShortPromptKeepsItsWholeText() {
        XCTAssertEqual(
            PhoneConversation.title(for: AgentMessage(role: .user, text: " 帮我记住：我常喝美式 ")),
            "帮我记住：我常喝美式"
        )
        XCTAssertEqual(
            PhoneConversation.title(for: AgentMessage(role: .user, text: "   ")),
            PhoneConversation.untitled
        )
    }

    /// A prompt that carried only files is named for what it carried.
    func testFileOnlyPromptIsNamedForItsFiles() {
        let photo = AgentAttachment(kind: .image, name: "照片", file: "photo.jpg", byteCount: 120)
        let document = AgentAttachment(kind: .document, name: "季度报告.pdf", file: "report.txt", byteCount: 400)
        XCTAssertEqual(
            PhoneConversation.title(for: AgentMessage(role: .user, text: "", attachments: [photo])),
            "照片对话"
        )
        XCTAssertEqual(
            PhoneConversation.title(for: AgentMessage(role: .user, text: "", attachments: [document])),
            "季度报告.pdf"
        )
    }

    // MARK: - Previews

    /// The preview is the newest thing a person or the agent said, not tool
    /// output that happens to be newest.
    func testPreviewSkipsToolOutput() {
        let messages = [
            AgentMessage(role: .user, text: "帮我查一下明天的天气"),
            AgentMessage(role: .assistant, text: "明天多云，20–26℃。"),
            AgentMessage(role: .tool, text: "{\"ok\":true}", toolName: "web_fetch", toolCallId: "call_1"),
        ]
        XCTAssertEqual(PhoneConversation.preview(from: messages), "明天多云，20–26℃。")
    }

    /// A transcript with nothing said yet has no preview.
    func testPreviewStaysEmptyBeforeTheFirstWords() {
        XCTAssertNil(PhoneConversation.preview(from: []))
        XCTAssertNil(PhoneConversation.preview(from: [AgentMessage(role: .tool, text: "{}", toolName: "x")]))
    }

    // MARK: - Store

    /// Each conversation keeps its transcript in its own file, newest first.
    func testStoreRoundTripsConversationsNewestFirst() throws {
        let store = makeStore()
        let older = PhoneConversation(
            id: "older",
            title: "旧会话",
            createdAt: Date(timeIntervalSince1970: 100),
            updatedAt: Date(timeIntervalSince1970: 200),
            messages: [AgentMessage(role: .user, text: "旧会话")]
        )
        let newer = PhoneConversation(
            id: "newer",
            title: "新会话",
            createdAt: Date(timeIntervalSince1970: 300),
            updatedAt: Date(timeIntervalSince1970: 400),
            messages: [AgentMessage(role: .user, text: "新会话")]
        )
        try store.save(older)
        try store.save(newer)

        XCTAssertEqual(store.loadAll().map(\.id), ["newer", "older"])
        XCTAssertEqual(store.load("older")?.title, "旧会话")
        XCTAssertEqual(store.load("older")?.messages.first?.text, "旧会话")
    }

    /// Deleting one conversation removes the files only it carried.
    func testDeleteRemovesOnlyItsAttachments() throws {
        let store = makeStore()
        let keptFile = try store.write(Data("kept".utf8), fileExtension: "txt")
        let removedFile = try store.write(Data("gone".utf8), fileExtension: "txt")
        let kept = PhoneConversation(
            id: "kept",
            messages: [AgentMessage(
                role: .user,
                text: "保留",
                attachments: [AgentAttachment(kind: .document, name: "kept.txt", file: keptFile, byteCount: 4)]
            )]
        )
        let removed = PhoneConversation(
            id: "removed",
            messages: [AgentMessage(
                role: .user,
                text: "删除",
                attachments: [AgentAttachment(kind: .document, name: "gone.txt", file: removedFile, byteCount: 4)]
            )]
        )
        try store.save(kept)
        try store.save(removed)

        try store.delete(removed)

        XCTAssertNil(store.load("removed"))
        XCTAssertNotNil(store.load("kept"))
        XCTAssertTrue(FileManager.default.fileExists(atPath: store.attachments.appendingPathComponent(keptFile).path))
        XCTAssertFalse(FileManager.default.fileExists(atPath: store.attachments.appendingPathComponent(removedFile).path))
    }

    /// The transcript older builds wrote becomes one conversation, then moves
    /// aside so deleting it later cannot bring it back.
    func testLegacyThreadIsMigratedOnce() throws {
        let store = makeStore()
        let messages = [
            AgentMessage(role: .user, text: "上一版留下的第一句", time: Date(timeIntervalSince1970: 10)),
            AgentMessage(role: .assistant, text: "上一版留下的回答", time: Date(timeIntervalSince1970: 20)),
        ]
        let legacy = root.appendingPathComponent("thread.json")
        try JSONEncoder().encode(messages).write(to: legacy, options: .atomic)

        let migrated = store.migrateLegacyThread()

        XCTAssertEqual(migrated.count, 1)
        XCTAssertEqual(migrated.first?.title, "上一版留下的第一句")
        XCTAssertEqual(migrated.first?.messages.count, 2)
        XCTAssertFalse(FileManager.default.fileExists(atPath: legacy.path), "the old transcript should be archived")
        XCTAssertTrue(FileManager.default.fileExists(atPath: legacy.path + ".migrated"))
        XCTAssertEqual(store.migrateLegacyThread().count, 1, "the archived transcript must not import twice")
    }

    /// An empty legacy transcript is archived without becoming a row.
    func testEmptyLegacyThreadDoesNotBecomeAConversation() throws {
        let store = makeStore()
        let legacy = root.appendingPathComponent("thread.json")
        try JSONEncoder().encode([AgentMessage]()).write(to: legacy, options: .atomic)

        XCTAssertTrue(store.migrateLegacyThread().isEmpty)
        XCTAssertFalse(FileManager.default.fileExists(atPath: legacy.path))
        XCTAssertTrue(store.loadAll().isEmpty)
    }

    /// A summary carries the title, the newest preview, and the message count.
    func testSummaryDescribesTheConversation() {
        let conversation = PhoneConversation(
            id: "summary",
            title: "季度复盘",
            updatedAt: Date(timeIntervalSince1970: 50),
            messages: [
                AgentMessage(role: .user, text: "帮我整理季度复盘"),
                AgentMessage(role: .assistant, text: "这是一版提纲。"),
            ]
        )
        XCTAssertEqual(conversation.summary.id, "summary")
        XCTAssertEqual(conversation.summary.title, "季度复盘")
        XCTAssertEqual(conversation.summary.preview, "这是一版提纲。")
        XCTAssertEqual(conversation.summary.messageCount, 2)
    }
}
