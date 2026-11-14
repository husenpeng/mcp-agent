//
//  ChatStatusTests.swift
//  TomatoRemoteTests
//
//  The phase text and elapsed clock the conversation header shows.
//

@testable import TomatoRemote
import XCTest

final class ChatStatusTests: XCTestCase {
    /// Elapsed time is computed from the Host's millisecond start.
    func testElapsedCountsFromTheHostClock() {
        let now = Date(timeIntervalSince1970: 1000)
        XCTAssertEqual(ChatStatusStrip.elapsed(startedAt: 994_000, now: now) ?? -1, 6)
        // A start in the future is a clock skew, not a negative timer.
        XCTAssertEqual(ChatStatusStrip.elapsed(startedAt: 1_005_000, now: now) ?? -1, 0)
        XCTAssertNil(ChatStatusStrip.elapsed(startedAt: nil, now: now))
    }

    /// Seconds stay compact below a minute and name the minute above it.
    func testElapsedTextStaysCompact() {
        XCTAssertEqual(ChatStatusStrip.format(0), "0s")
        XCTAssertEqual(ChatStatusStrip.format(12), "12s")
        XCTAssertEqual(ChatStatusStrip.format(59.4), "59s")
        XCTAssertEqual(ChatStatusStrip.format(65), "1m 05s")
        XCTAssertEqual(ChatStatusStrip.format(125), "2m 05s")
    }

    /// Every working phase describes itself in the reader's language, and the
    /// phases that are not working do not claim a running spinner.
    func testPhasesNameTheirWork() {
        XCTAssertEqual(ChatActivity.sending.title, "正在发送…")
        XCTAssertEqual(ChatActivity.thinking.title, "Tomato 正在思考…")
        XCTAssertEqual(ChatActivity.tool(name: "bash").title, "正在调用 bash…")
        XCTAssertEqual(ChatActivity.writing.title, "正在写回答…")
        XCTAssertEqual(ChatActivity.waiting(count: 2).title, "等待你确认 2 项")
        XCTAssertEqual(ChatActivity.reconnecting(attempt: 3).title, "连接中断，正在重连（3）…")
        XCTAssertTrue(ChatActivity.thinking.showsElapsed)
        XCTAssertFalse(ChatActivity.waiting(count: 1).showsElapsed)
        XCTAssertTrue(ChatActivity.waiting(count: 1).isBusy)
        XCTAssertFalse(ChatActivity.idle(.live).isBusy)
    }

    /// VoiceOver gets one sentence with the elapsed time when there is one.
    func testSpokenPhaseIncludesElapsed() {
        XCTAssertEqual(
            ChatActivity.tool(name: "bash").spoken(12),
            "正在调用 bash…，已用 12 秒"
        )
        XCTAssertEqual(ChatActivity.waiting(count: 2).spoken(12), "等待你确认 2 项")
    }
}
