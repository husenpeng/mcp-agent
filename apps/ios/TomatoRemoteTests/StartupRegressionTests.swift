//
//  StartupRegressionTests.swift
//  TomatoRemoteTests
//
//  Two launch regressions this suite pins down: wire numbers that used to trap
//  when converted to `Int`, and the phone store doing disk work in its
//  initializer.
//

@testable import TomatoRemote
import XCTest

final class StartupRegressionTests: XCTestCase {
    /// A Host or model value outside `Int` must fall back instead of trapping.
    func testOutOfRangeWireNumbersUseTheFallback() {
        XCTAssertEqual(finiteInt(3.9), 3)
        XCTAssertEqual(finiteInt(-2.4), -2)
        XCTAssertEqual(finiteInt(nil, or: 7), 7)
        XCTAssertEqual(finiteInt(.nan, or: 7), 7)
        XCTAssertEqual(finiteInt(.infinity, or: 7), 7)
        XCTAssertEqual(finiteInt(-.infinity, or: 7), 7)
        XCTAssertEqual(finiteInt(1e30, or: 7), 7)
        XCTAssertEqual(finiteInt(-1e30, or: 7), 7)
    }

    /// The store is constructed while the phone tab builds; its folders belong
    /// to the first write, so opening the tab cannot wait on the disk.
    func testPhoneStoreCreatesItsFoldersOnFirstWrite() throws {
        let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        defer { try? FileManager.default.removeItem(at: root) }
        let folder = root.appendingPathComponent("conversations", isDirectory: true)
        let attachments = root.appendingPathComponent("attachments", isDirectory: true)
        let store = PhoneConversationStore(
            folder: folder,
            attachments: attachments,
            legacyThread: root.appendingPathComponent("thread.json")
        )

        XCTAssertFalse(FileManager.default.fileExists(atPath: folder.path))
        XCTAssertTrue(store.loadAll().isEmpty)

        try store.save(PhoneConversation(id: "one", messages: [AgentMessage(role: .user, text: "你好")]))

        XCTAssertTrue(FileManager.default.fileExists(atPath: folder.path))
        XCTAssertEqual(store.loadAll().map(\.id), ["one"])
    }

    /// The renderer loads its page and 3.4 MB runtime from the app bundle; a
    /// missing resource would silently turn every diagram into a failure row.
    func testMermaidPageAndRuntimeShipInTheApp() {
        XCTAssertNotNil(Bundle.main.url(forResource: "render", withExtension: "html"))
        XCTAssertNotNil(Bundle.main.url(forResource: "mermaid.min", withExtension: "js"))
    }
}
