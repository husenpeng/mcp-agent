//
//  PhoneTranscriptTests.swift
//  TomatoRemoteTests
//
//  Tomato Phone's transcript splitter: thinking and tool calls fold into the
//  turn's work, and the answer is drawn without its reasoning.
//

@testable import TomatoRemote
import XCTest

final class PhoneTranscriptTests: XCTestCase {
    private let call = AgentToolCall(id: "call_1", name: "web_search", arguments: .object([:]))

    /// One turn's thinking, narration, and tool result fold before its answer.
    func testTurnFoldsThinkingAndToolsBeforeTheAnswer() {
        let messages = [
            AgentMessage(id: "u", role: .user, text: "查一下"),
            AgentMessage(id: "a1", role: .assistant, text: "我查一下", toolCalls: [call], reasoning: "先拆解"),
            AgentMessage(id: "t", role: .tool, text: "搜索结果", toolName: "web_search", toolCallId: "call_1"),
            AgentMessage(id: "a2", role: .assistant, text: "答案", reasoning: "整理"),
        ]

        let entries = PhoneTranscript.entries(from: messages)

        XCTAssertEqual(entries.count, 3)
        XCTAssertEqual(entries[0].id, "u")
        XCTAssertEqual(entries[1], .process(id: "process-a1", items: [
            .thinking(id: "a1-thinking", text: "先拆解"),
            .note(id: "a1", text: "我查一下"),
            .tool(id: "t", name: "web_search", result: "搜索结果"),
            .thinking(id: "a2-thinking", text: "整理"),
        ], running: false))
        guard case let .message(answer) = entries[2] else {
            return XCTFail("the answer is not a visible message")
        }
        XCTAssertEqual(answer.text, "答案")
        XCTAssertNil(answer.reasoning, "the answer's thinking belongs to the folded work")
    }

    /// A plain answer stays one row.
    func testPlainAnswerHasNoProcess() {
        let time = Date(timeIntervalSince1970: 1)
        let user = AgentMessage(id: "u", role: .user, text: "你好", time: time)
        let answer = AgentMessage(id: "a", role: .assistant, text: "你好，我是 Tomato。", time: time)
        XCTAssertEqual(PhoneTranscript.entries(from: [user, answer]), [
            .message(user),
            .message(answer),
        ])
    }

    /// Consecutive observations start a new turn's group.
    func testUserMessageSplitsTheTurnGroups() {
        let messages = [
            AgentMessage(id: "u1", role: .user, text: "第一件"),
            AgentMessage(id: "a1", role: .assistant, text: "第一件答案", reasoning: "想第一件"),
            AgentMessage(id: "u2", role: .user, text: "第二件"),
            AgentMessage(id: "a2", role: .assistant, text: "第二件答案", reasoning: "想第二件"),
        ]
        let entries = PhoneTranscript.entries(from: messages)
        XCTAssertEqual(entries.count, 6)
        guard case let .process(firstID, _, _) = entries[1],
              case let .process(secondID, _, _) = entries[4]
        else {
            return XCTFail("each turn should keep its own process group")
        }
        XCTAssertEqual(firstID, "process-a1")
        XCTAssertEqual(secondID, "process-a2")
    }

    /// A capability proposal stays a card rather than becoming a folded detail.
    func testProposalStaysAVisibleCard() {
        let proposal = AgentProposal(kind: .mcp, name: "地图", url: "https://example.com/mcp", summary: "查路线")
        let messages = [
            AgentMessage(id: "u", role: .user, text: "加个地图"),
            AgentMessage(id: "t", role: .tool, text: "已检查", toolName: "capability_propose", toolCallId: "call_1"),
            AgentMessage(id: "p", role: .proposal, text: "查路线", proposal: proposal),
        ]
        let entries = PhoneTranscript.entries(from: messages)
        XCTAssertEqual(entries.count, 3)
        guard case .process = entries[1], case let .message(message) = entries[2] else {
            return XCTFail("the proposal should stay a visible message")
        }
        XCTAssertEqual(message.id, "p")
    }

    /// A live turn's streaming reasoning joins the group and marks it running.
    func testLiveReasoningJoinsTheRunningGroup() {
        let messages = [
            AgentMessage(id: "u", role: .user, text: "想一下"),
        ]
        let entries = PhoneTranscript.entries(from: messages, liveReasoning: "正在拆解", isRunning: true)
        XCTAssertEqual(entries.count, 2)
        XCTAssertEqual(entries[1], .process(id: "live-process", items: [
            .thinking(id: "live-thinking", text: "正在拆解"),
        ], running: true))
    }

    /// Only the newest group is marked running; settled groups stay closed.
    func testOnlyTheNewestGroupRuns() {
        let messages = [
            AgentMessage(id: "u1", role: .user, text: "第一件"),
            AgentMessage(id: "a1", role: .assistant, text: "第一件答案", reasoning: "想第一件"),
            AgentMessage(id: "u2", role: .user, text: "第二件"),
            AgentMessage(id: "a2", role: .assistant, text: "", toolCalls: [call], reasoning: "想第二件"),
            AgentMessage(id: "t", role: .tool, text: "结果", toolName: "web_search", toolCallId: "call_1"),
        ]
        let entries = PhoneTranscript.entries(from: messages, isRunning: true)
        guard case let .process(_, _, firstRunning) = entries[1],
              case let .process(_, _, secondRunning) = entries[4]
        else {
            return XCTFail("the two turns should keep their groups")
        }
        XCTAssertFalse(firstRunning)
        XCTAssertTrue(secondRunning, "the live turn's group is the one that runs")
    }
}
