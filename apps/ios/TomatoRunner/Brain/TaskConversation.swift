//
//  TaskConversation.swift
//  Tomato Runner
//
//  What the loop sends the model, turn by turn.
//
//  Only the newest screen stays in full. A screen describes the device at one
//  moment, so carrying every earlier one misleads a model that has to decide on
//  what is in front of the phone now, and it grows the request past the context
//  window over a full step budget. Every tool call keeps its result, because both
//  APIs reject a conversation that drops one.
//

import Foundation

/// One task's transcript.
struct TaskConversation {
    /// Answer that replaces a screen the model has already superseded.
    static let staleScreen = "（较早的屏幕已省略；最后一条屏幕结果才是当前屏幕）"
    /// Note that replaces the opening screen, which the goal turn carries.
    static let staleOpening = "（开局屏幕已省略；最后一条屏幕结果才是当前屏幕）"

    private(set) var items: [TranscriptItem] = []
    /// Goal turn without a screen, kept so the opening screen can be dropped.
    private var goalTurn = ""
    private var openingDropped = false
    /// Ids of results that carried a screen reading, oldest first.
    private var screens: [String] = []

    /// Open the conversation with the goal and the screen the task starts from.
    /// @param system - the loop's instructions.
    /// @param goal - the task as the owner wrote it.
    /// @param prelude - a remark the loop could not express as a tool call.
    /// @param screen - rendered first observation.
    mutating func start(system: String, goal: String, prelude: String?, screen: String) {
        var goalText = "目标：\(goal)"
        if let prelude {
            goalText += "\n\(prelude)"
        }
        goalTurn = goalText
        items = [.system(system), .user("\(goalText)\n\n当前屏幕：\n\(screen)")]
    }

    mutating func append(_ item: TranscriptItem) {
        items.append(item)
    }

    /// Answer one tool call.
    /// @param id - the call this answers.
    /// @param text - answer body.
    /// @param screen - whether the body is a screen reading, which supersedes
    /// every earlier one.
    mutating func answer(id: String, text: String, screen: Bool) {
        if screen {
            if !openingDropped, items.count > 1 {
                items[1] = .user("\(goalTurn)\n\n\(Self.staleOpening)")
                openingDropped = true
            }
            for old in screens {
                replace(id: old)
            }
            screens.append(id)
        }
        items.append(.toolResult(id: id, text: text))
    }

    private mutating func replace(id: String) {
        for index in items.indices {
            if case let .toolResult(resultId, _) = items[index], resultId == id {
                items[index] = .toolResult(id: id, text: Self.staleScreen)
            }
        }
    }
}
