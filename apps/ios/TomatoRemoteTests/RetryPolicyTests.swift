//
//  RetryPolicyTests.swift
//  TomatoRemoteTests
//
//  What the phone does with a Host that stopped answering: how long it waits,
//  what it says, and whether an empty answer is read as a broken parse.
//

@testable import TomatoRemote
import XCTest

final class RetryPolicyTests: XCTestCase {
    // MARK: List repair read

    /// A Host that answers is read once a minute.
    func testHealthyReadStaysAtAMinute() {
        XCTAssertEqual(SessionPollSchedule.pause(afterConsecutiveFailures: 0), 60)
        XCTAssertEqual(SessionPollSchedule.pause(afterConsecutiveFailures: 1), 60)
    }

    /// Each further failure doubles the wait, up to ten minutes.
    func testFailedReadsBackOffAndCap() {
        XCTAssertEqual(SessionPollSchedule.pause(afterConsecutiveFailures: 2), 120)
        XCTAssertEqual(SessionPollSchedule.pause(afterConsecutiveFailures: 3), 240)
        XCTAssertEqual(SessionPollSchedule.pause(afterConsecutiveFailures: 4), 480)
        XCTAssertEqual(SessionPollSchedule.pause(afterConsecutiveFailures: 5), 600)
        XCTAssertEqual(SessionPollSchedule.pause(afterConsecutiveFailures: 400), 600)
    }

    // MARK: Stream retry

    /// The first retries run within seconds so a restart is invisible.
    func testStreamRetriesStartQuickly() {
        XCTAssertEqual(StreamRetry.pause(afterAttempt: 0), 0)
        XCTAssertEqual(StreamRetry.pause(afterAttempt: 1), 1.5)
        XCTAssertEqual(StreamRetry.pause(afterAttempt: 5), 7.5)
    }

    /// After the quick attempts the stream is probed once a minute, never
    /// dropped: giving up left the phone offline for hours after the Host was
    /// back.
    func testStreamNeverGivesUp() {
        XCTAssertEqual(StreamRetry.pause(afterAttempt: 6), 60)
        XCTAssertEqual(StreamRetry.pause(afterAttempt: 500), 60)
    }

    /// The status line stays true once the quick attempts are spent.
    func testStreamStatusNamesTheCadence() {
        XCTAssertEqual(StreamRetry.status(attempt: 2), "连接中断，正在重试（2/5）…")
        XCTAssertEqual(StreamRetry.status(attempt: 6), "连接中断，每分钟重试一次…")
    }

    // MARK: Transport copy

    /// A dead Host names the cause and the fix instead of relaying CFNetwork.
    func testCannotConnectExplainsThePairing() {
        let failure = NSError(domain: NSURLErrorDomain, code: NSURLErrorCannotConnectToHost)
        let message = HubError.transport(from: failure).errorDescription ?? ""
        XCTAssertTrue(message.contains("桌面端"), message)
        XCTAssertFalse(message.contains("Could not connect"), message)
    }

    /// No network, a timeout, and refused cleartext each read differently.
    func testTransportCopyDistinguishesCauses() {
        let offline = HubError.transport(
            from: NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet)
        ).errorDescription ?? ""
        let timeout = HubError.transport(
            from: NSError(domain: NSURLErrorDomain, code: NSURLErrorTimedOut)
        ).errorDescription ?? ""
        let cleartext = HubError.transport(
            from: NSError(domain: NSURLErrorDomain, code: NSURLErrorAppTransportSecurityRequiresSecureConnection)
        ).errorDescription ?? ""
        XCTAssertTrue(offline.contains("没有网络"), offline)
        XCTAssertTrue(timeout.contains("30 秒"), timeout)
        XCTAssertTrue(cleartext.contains("https"), cleartext)
        XCTAssertEqual(Set([offline, timeout, cleartext]).count, 3)
    }

    /// A Cloudflare quick tunnel takes a new name on every Desktop start, so
    /// the paired address stops resolving instead of refusing; the copy names
    /// the address, not the process.
    func testMissingHostnameBlamesTheTunnelAddress() {
        let message = HubError.transport(
            from: NSError(domain: NSURLErrorDomain, code: NSURLErrorCannotFindHost)
        ).errorDescription ?? ""
        XCTAssertTrue(message.contains("域名"), message)
        XCTAssertTrue(message.contains("隧道"), message)
    }

    /// A failure from another domain still yields a sentence rather than a
    /// framework's localized text.
    func testForeignDomainFailureKeepsItsOwnDescription() {
        let failure = NSError(domain: "au.edu.example", code: 7, userInfo: [
            NSLocalizedDescriptionKey: "示例失败",
        ])
        XCTAssertEqual(HubError.transport(from: failure).errorDescription, "网络错误：示例失败")
    }

    // MARK: Empty result

    /// A Host from another build answers `ok` with no value; that is a version
    /// mismatch, not a parse bug.
    func testEmptyResultIsNotContent() {
        XCTAssertFalse(HubClient.hasContent(.null))
        XCTAssertFalse(HubClient.hasContent(.object([:])))
        XCTAssertTrue(HubClient.hasContent(.object(["options": .array([])])))
        XCTAssertTrue(HubClient.hasContent(.array([])))
    }

    // MARK: Turn ownership

    /// A resumed stream replays the session's earlier turns; only the turn being
    /// rendered may reach the transcript.
    func testEventOwnershipFollowsTheTurnId() {
        let mine = AgentServiceEvent(
            name: "assistant/message",
            id: "1",
            data: .object(["data": .object([
                "type": .string("assistant/message"),
                "turnId": .string("trn_new"),
            ])])
        )
        let earlier = AgentServiceEvent(
            name: "assistant/message",
            id: "2",
            data: .object(["data": .object([
                "type": .string("assistant/message"),
                "turnId": .string("trn_old"),
            ])])
        )
        XCTAssertTrue(mine.belongsToTurn("trn_new"))
        XCTAssertFalse(earlier.belongsToTurn("trn_new"))
    }

    /// A frame that names no turn (a token delta from an older Host) still counts:
    /// dropping it would silence the answer.
    func testEventWithoutATurnStillCounts() {
        let delta = AgentServiceEvent(
            name: "assistant/delta",
            id: nil,
            data: .object(["data": .object(["text": .string("片")])])
        )
        XCTAssertTrue(delta.belongsToTurn("trn_new"))
    }

    // MARK: Attribution

    /// A step label older than a few seconds says how old it is, so a stall is
    /// not blamed on whatever last set the label.
    func testStepLabelCarriesItsAge() {
        XCTAssertEqual(AppLog.step("刷新列表", age: 0.4), "刷新列表")
        XCTAssertEqual(AppLog.step("刷新列表", age: 41), "刷新列表（41 秒前）")
        XCTAssertEqual(AppLog.step("刷新列表", age: 600), "刷新列表（10 分钟前）")
    }
}
