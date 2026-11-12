//
//  Personal.swift
//  Tomato Remote
//
//  Wire values of the personal-agent surfaces the phone reads: Host memories,
//  pending interactions, schedules, goals, background jobs, daily insights, and
//  file deliverables. Every namespace here is optional on the Host and grows
//  additively, so a reader keeps the fields it renders and ignores the rest.
//

import Foundation

// MARK: - Memories (`memories/*`, from @tomato/experimental-tool-memory)

/// One Host memory as the `memories` namespace projects it.
struct HostMemory: Decodable, Identifiable, Hashable, Sendable {
    enum Scope: String, Decodable, Sendable { case profile, workspace }
    enum Status: String, Decodable, Sendable { case active, candidate }

    let id: String
    let scope: Scope
    let kind: String
    let entity: String
    let key: String
    let value: String
    let status: Status
    let updatedAt: Double
    let sessionId: String?
}

/// `memories/list` value.
struct HostMemoryList: Decodable, Sendable {
    let signedIn: Bool
    let records: [HostMemory]
}

/// `memories/propose` value.
struct HostMemoryProposal: Decodable, Sendable {
    let written: [HostMemory]
}

/// `memories/confirm` value: the promoted record, or `not_found`.
struct HostMemoryConfirmation: Decodable, Sendable {
    let record: HostMemory?
    let code: String?
}

/// `memories/forget` value.
struct HostMemoryDeletion: Decodable, Sendable {
    let deleted: Bool
}

/// One candidate the phone proposes; it waits for the owner's confirmation.
struct HostMemoryEntry: Encodable, Hashable, Sendable {
    let scope: String
    let kind: String
    let entity: String
    let key: String
    let value: String
}

struct MemoryListRequest: Encodable { let sessionId: String }
struct MemoryProposeRequest: Encodable { let sessionId: String; let entries: [HostMemoryEntry] }
struct MemoryTargetRequest: Encodable { let sessionId: String; let id: String }

// MARK: - Interactions (`$events` waterfalls)

/// One choice of a question.
struct QuestionOption: Decodable, Hashable, Sendable {
    let label: String
    let description: String?
}

/// Why a question is really an approval, when the asker says so.
struct QuestionIntent: Decodable, Hashable, Sendable {
    let kind: String
    let approve: String?
    let reject: String?
    let always: String?
}

/// One item of an `ask_user_question` call.
struct QuestionItem: Decodable, Identifiable, Hashable, Sendable {
    let id: String
    let question: String
    let detail: String?
    let header: String?
    let options: [QuestionOption]?
    let multiSelect: Bool?
    let intent: QuestionIntent?
}

/// One pending request the Host is waiting on a person for.
///
/// Both kinds arrive on the forwarded-event stream as waterfalls; whichever
/// client answers first settles them, and the others receive a cancel.
struct PendingInteraction: Identifiable, Hashable, Sendable {
    enum Kind: Hashable, Sendable {
        /// `user-questions/request`: one or more questions with options.
        case questions([QuestionItem], timed: Bool)
        /// `approval/request`: allow or reject one tool call.
        case approval(toolName: String, reason: String?)
    }

    /// The waterfall's `eventId`; the answer names it.
    let id: String
    /// Session of the Agent that asked.
    let sessionId: String?
    let kind: Kind
    let receivedAt: Date

    /// Short line for a notification or a list row.
    var summary: String {
        switch kind {
        case let .questions(items, _):
            items.first?.question ?? "Agent 在等你回答"
        case let .approval(toolName, reason):
            reason.map { "\(toolName)：\($0)" } ?? "请求执行 \(toolName)"
        }
    }
}

/// One selection the person made for one question item.
struct QuestionAnswer: Encodable, Hashable, Sendable {
    let id: String
    let selected: [String]
    let custom: String?
}

// MARK: - Schedules (`schedule/*`)

/// One scheduled task as `schedule/catalog` reports it.
struct ScheduleEntry: Decodable, Identifiable, Hashable, Sendable {
    struct Delivery: Decodable, Hashable, Sendable {
        let scheduledAt: String
        let deliveredAt: String
        let messageId: String
    }

    let id: String
    let kind: String
    let title: String
    let prompt: String
    let scheduledAt: String
    let sessionId: String
    let status: String
    /// Whether the owner paused this task; a paused task keeps its rule.
    let paused: Bool?
    let lastDelivery: Delivery?
    let everySeconds: Double?
    let afterSeconds: Double?
    let time: String?
    let timeZone: String?
    let weekdays: [Int]?
    let expression: String?

    var isActive: Bool {
        status == "active"
    }

    /// Whether the task is paused rather than armed.
    var isPaused: Bool {
        paused == true
    }

    /// Next due instant, when the Host's timestamp parses.
    var nextDue: Date? {
        parseInstant(scheduledAt)
    }

    /// One readable line for the recurrence.
    var recurrence: String {
        switch kind {
        case "every":
            guard let seconds = everySeconds else { return "重复" }
            if seconds.truncatingRemainder(dividingBy: 3600) == 0 {
                return "每 \(Int(seconds / 3600)) 小时"
            }
            return "每 \(Int(seconds / 60)) 分钟"
        case "daily":
            return "每天 \(time ?? "")"
        case "weekly":
            let names = ["", "一", "二", "三", "四", "五", "六", "日"]
            let days = (weekdays ?? []).compactMap { (1 ... 7).contains($0) ? names[$0] : nil }.joined(separator: "、")
            return "每周\(days) \(time ?? "")"
        case "cron":
            return "cron \(expression ?? "")"
        default:
            return "一次"
        }
    }
}

/// One past delivery of a task.
struct ScheduleDelivery: Decodable, Identifiable, Hashable, Sendable {
    let scheduledAt: String
    let deliveredAt: String
    let messageId: String
    let prompt: String?

    var id: String {
        messageId
    }
}

/// `schedule/history` value; `code` is set when the task or cursor is gone.
struct ScheduleHistory: Decodable, Sendable {
    let records: [ScheduleDelivery]?
    let code: String?
}

/// `schedule/delete` value.
struct ScheduleDeletion: Decodable, Sendable {
    let deleted: Bool
    let code: String?
}

struct ScheduleTargetRequest: Encodable { let sessionId: String; let id: String }

/// `schedule/create` request: the selector the phone chose.
///
/// The Host's field names carry underscores, so the wire keys are spelled here
/// and the Swift members stay ordinary camel case.
struct ScheduleCreateBody: Encodable {
    let sessionId: String
    let title: String
    let prompt: String
    var afterSeconds: Double?
    var everySeconds: Double?
    var daily: ScheduleDailyInput?
    var weekly: ScheduleWeeklyInput?
    var at: String?

    private enum CodingKeys: String, CodingKey {
        case sessionId, title, prompt, daily, weekly, at
        case afterSeconds = "after_seconds"
        case everySeconds = "every_seconds"
    }
}

/// Daily wall-clock selector.
struct ScheduleDailyInput: Encodable {
    let time: String
    let timeZone: String

    private enum CodingKeys: String, CodingKey {
        case time
        case timeZone = "time_zone"
    }
}

/// Weekly wall-clock selector.
struct ScheduleWeeklyInput: Encodable {
    let time: String
    let timeZone: String
    let weekdays: [Int]

    private enum CodingKeys: String, CodingKey {
        case time, weekdays
        case timeZone = "time_zone"
    }
}

/// `schedule/pause` or `schedule/resume` answer.
struct SchedulePauseReply: Decodable, Sendable {
    let id: String
    let updated: Bool
    let paused: Bool
    let code: String?
}

struct ScheduleHistoryRequest: Encodable { let sessionId: String; let id: String; let limit: Int }

// MARK: - Goals, jobs, subagents

/// The `goal` Session projection: one objective and its progress.
struct GoalProgress: Hashable, Sendable {
    let objective: String
    let phase: String
    let roundsStarted: Int
    let maxGoalRounds: Int?

    /// Read the projection value, which nests the goal under `goal`.
    init?(projection: JSONValue?) {
        guard let projection, !projection.isNull else { return nil }
        let goal = projection["goal"] ?? projection
        guard let objective = goal["objective"]?.stringValue else { return nil }
        self.objective = objective
        phase = goal["phase"]?.stringValue ?? "active"
        roundsStarted = Int(projection["roundsStarted"]?.doubleValue ?? goal["roundsStarted"]?.doubleValue ?? 0)
        maxGoalRounds = (goal["maxGoalRounds"]?.doubleValue).map { Int($0) }
    }

    var phaseText: String {
        switch phase {
        case "active": "进行中"
        case "paused": "已暂停"
        case "blocked": "受阻"
        case "complete": "已完成"
        default: phase
        }
    }
}

/// One background job as `job/list` frames report it.
struct BackgroundJob: Decodable, Identifiable, Hashable, Sendable {
    let id: String
    let kind: String
    let label: String
    let status: String
    let progress: Double?
    let detail: String?
    let startedAt: Double
    let finishedAt: Double?

    var isRunning: Bool {
        status == "running" || status == "stopping"
    }
}

/// One child of a Session from its `subagentCatalog` projection.
struct SubagentChild: Identifiable, Hashable, Sendable {
    let id: String
    let mode: String
    let label: String?
    let createdAt: Double?
}

struct JobListRequest: Encodable { let sessionId: String }
struct JobKillRequest: Encodable { let sessionId: String; let jobId: String }

// MARK: - Daily insights (`museInsights/*`)

/// `museInsights/snapshot` value.
struct InsightsSnapshot: Decodable, Sendable {
    let available: Bool
    let day: String?
    let recap: DailyRecap?
    let unfinished: Unfinished?
    let analyzing: Bool?

    struct Unfinished: Decodable, Sendable {
        let analyzedAt: Double?
        let tasks: [UnfinishedTask]
    }
}

/// One day's summary.
struct DailyRecap: Decodable, Sendable {
    struct WorkItem: Decodable, Hashable, Sendable {
        let problem: String
        let conclusion: String
        let status: String
        let sessionIds: [String]?
    }

    let day: String
    let headline: String
    let summary: String
    let workItems: [WorkItem]
    let openTasks: [String]
    let messageCount: Int?
}

/// One task the Host believes is still open.
struct UnfinishedTask: Decodable, Identifiable, Hashable, Sendable {
    let id: String
    let title: String
    let detail: String
    let status: String
    let sessionId: String?
    let sessionTitle: String?
}

// MARK: - Files

/// One file an Agent presented through `deliverables/presented`.
struct DeliveredFile: Identifiable, Hashable, Sendable {
    let path: String
    let description: String?
    let seq: Double?

    var id: String {
        path
    }

    var name: String {
        URL(fileURLWithPath: path).lastPathComponent
    }

    var fileExtension: String {
        URL(fileURLWithPath: path).pathExtension.lowercased()
    }

    /// Office documents the Host renders to PDF before preview.
    var needsRendering: Bool {
        ["doc", "docx", "xls", "xlsx", "ppt", "pptx"].contains(fileExtension)
    }

    var systemImage: String {
        switch fileExtension {
        case "pdf": "doc.richtext"
        case "ppt", "pptx", "key": "rectangle.on.rectangle"
        case "doc", "docx", "md", "txt": "doc.text"
        case "xls", "xlsx", "csv": "tablecells"
        case "png", "jpg", "jpeg", "gif", "webp", "heic": "photo"
        default: "doc"
        }
    }
}

/// Staged upload: the receipt a `file` prompt part names.
struct StagedFile: Hashable, Sendable {
    let receiptId: String
    let name: String
    let bytes: Int
}

/// `POST /api/session/uploadFileBinary` answer; not the RPC envelope.
struct UploadReply: Decodable, Sendable {
    /// The staged receipt and the Host's own view of the file.
    let value: UploadValue?
    /// The route's failure, when `ok` is false.
    let error: UploadFailure?
    let ok: Bool
}

/// Staged upload facts.
struct UploadValue: Decodable, Sendable {
    let receiptId: String
    let file: UploadFileFacts?
}

/// The Host's size and name for one staged upload.
struct UploadFileFacts: Decodable, Sendable {
    let name: String?
    let bytes: Int?
}

/// One refusal from the upload route.
struct UploadFailure: Decodable, Sendable {
    let code: String?
    let message: String?
}

/// Parse an ISO 8601 instant, with or without fractional seconds.
///
/// Both parsers are created once: this runs per record while a memory page or
/// a schedule list decodes.
private let fractionalInstantFormatter: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return formatter
}()

private let plainInstantFormatter = ISO8601DateFormatter()

/// Parse one Host timestamp.
/// - Parameter text: the Host's timestamp.
/// - Returns: the instant, or nil when it does not parse.
func parseInstant(_ text: String) -> Date? {
    if let date = fractionalInstantFormatter.date(from: text) {
        return date
    }
    return plainInstantFormatter.date(from: text)
}
