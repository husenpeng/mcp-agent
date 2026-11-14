//
//  RunningSessionsRowsTests.swift
//  TomatoRemoteTests
//
//  Which rows the in-progress page lists, and how long a finished row stays.
//

@testable import TomatoRemote
import XCTest

final class RunningSessionsRowsTests: XCTestCase {
    /// Rows that cannot open from the Session list stay off this page, even
    /// while they are executing.
    func testSubagentChildrenAndRobotRunsStayOffThePage() {
        var rows = RunningSessionsRows()
        rows.observe([
            session("chat", running: true),
            session("child", running: true, origin: "subagent"),
            session("robot", running: true, robot: true),
        ])
        XCTAssertEqual(rows.running.map(\.sessionId), ["chat"])
        XCTAssertTrue(rows.finished.isEmpty)
    }

    /// The page reads like the list it came from: newest activity first, with
    /// the id breaking a tie so one state draws one order.
    func testRowsFollowNewestActivity() {
        var rows = RunningSessionsRows()
        rows.observe([
            session("old", running: true, updatedAt: 100),
            session("new", running: true, updatedAt: 300),
            session("tied-b", running: true, updatedAt: 200),
            session("tied-a", running: true, updatedAt: 200),
        ])
        XCTAssertEqual(rows.running.map(\.sessionId), ["new", "tied-b", "tied-a", "old"])
    }

    /// A turn that ends keeps its row, and further reads do not duplicate or
    /// rewrite it.
    func testFinishedRowStaysListed() {
        var rows = RunningSessionsRows()
        rows.observe([session("a", running: true)])
        rows.observe([session("a", running: false, updatedAt: 200)])
        XCTAssertTrue(rows.running.isEmpty)
        XCTAssertEqual(rows.finished.map(\.sessionId), ["a"])
        XCTAssertEqual(rows.finished.first?.updatedAt, 200)

        rows.observe([session("a", running: false, updatedAt: 300)])
        XCTAssertEqual(rows.finished.map(\.sessionId), ["a"])
        XCTAssertEqual(rows.finished.first?.updatedAt, 200)
    }

    /// A Session that starts another turn returns to the running section.
    func testRestartedSessionLeavesFinished() {
        var rows = RunningSessionsRows()
        rows.observe([session("a", running: true)])
        rows.observe([session("a", running: false)])
        rows.observe([session("a", running: true)])
        XCTAssertEqual(rows.running.map(\.sessionId), ["a"])
        XCTAssertTrue(rows.finished.isEmpty)
    }

    /// A Session the Host deleted does not linger as finished.
    func testDeletedSessionLeavesThePage() {
        var rows = RunningSessionsRows()
        rows.observe([session("a", running: true)])
        rows.observe([session("a", running: false)])
        rows.observe([])
        XCTAssertTrue(rows.running.isEmpty)
        XCTAssertTrue(rows.finished.isEmpty)
    }

    /// Finished rows keep the order of their last activity.
    func testFinishedRowsFollowTheirLastActivity() {
        var rows = RunningSessionsRows()
        rows.observe([
            session("a", running: true, updatedAt: 100),
            session("b", running: true, updatedAt: 200),
        ])
        rows.observe([
            session("a", running: false, updatedAt: 100),
            session("b", running: false, updatedAt: 300),
        ])
        XCTAssertEqual(rows.finished.map(\.sessionId), ["b", "a"])
    }

    /// One row with the facts the page draws.
    private func session(
        _ id: String,
        running: Bool,
        updatedAt: Double = 1000,
        origin: String? = nil,
        robot: Bool = false
    ) -> SessionSummary {
        SessionSummary(
            sessionId: id,
            updatedAt: updatedAt,
            running: running,
            blank: false,
            agentAvailable: true,
            parentSessionId: origin == "subagent" ? "chat" : nil,
            formatStatus: "current",
            cwd: "/Users/me/work/\(id)",
            origin: origin,
            projections: robot
                ? SessionSummary.Projections(kind: "sequenced", asOfSeq: 7, values: ["robotRun": .object([:])])
                : nil
        )
    }
}
