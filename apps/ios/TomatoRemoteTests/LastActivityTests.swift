//
//  LastActivityTests.swift
//  TomatoRemoteTests
//
//  The synchronous breadcrumb a watchdog kill leaves behind: one current line
//  and the line the previous run left.
//

@testable import TomatoRemote
import XCTest

final class LastActivityTests: XCTestCase {
    private var folder: URL!

    override func setUpWithError() throws {
        folder = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
    }

    override func tearDownWithError() throws {
        try? FileManager.default.removeItem(at: folder)
    }

    /// The newest record replaces the file in one write.
    func testRecordKeepsTheNewestLine() {
        LastActivity.record("会话 · 刷新列表", in: folder)
        LastActivity.record("对话 s3 · 重建转录 45 条", in: folder)
        XCTAssertEqual(label(LastActivity.current(in: folder)), "对话 s3 · 重建转录 45 条")
    }

    /// A launch archives the line the previous run left before this run writes
    /// its own.
    func testBeginArchivesThePreviousLine() {
        LastActivity.record("对话 s3 · 重建转录 45 条", in: folder)
        let previous = LastActivity.begin(in: folder)
        XCTAssertEqual(label(previous), "对话 s3 · 重建转录 45 条")

        LastActivity.record("启动", in: folder)
        XCTAssertEqual(label(LastActivity.current(in: folder)), "启动")
        let archived = folder.appendingPathComponent("last-activity.previous.txt")
        XCTAssertTrue(FileManager.default.fileExists(atPath: archived.path))
        let previousText = try? String(contentsOf: archived, encoding: .utf8)
        XCTAssertEqual(label(previousText), "对话 s3 · 重建转录 45 条")
    }

    /// A first launch has no previous line to report.
    func testBeginWithoutAPreviousRunReturnsNil() {
        XCTAssertNil(LastActivity.begin(in: folder))
    }

    /// One record is a timestamp and the label, separated by a tab.
    private func label(_ line: String?) -> String? {
        guard let line else { return nil }
        return line.split(separator: "\t", maxSplits: 1).last
            .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines) }
    }
}
