//
//  RemoteObjects.swift
//  Tomato Remote
//
//  Wire values of the optional `robot` and `room` Remote namespaces. Both
//  namespaces are experimental and grow additively, so a reader keeps the
//  fields it renders and ignores the rest instead of failing a whole frame.
//

import Foundation

// MARK: - Robot

/// One whole `robot/watch` frame: the latest revisions, every robot, and runs.
struct RobotSnapshot: Decodable, Sendable {
    let specs: [RobotSpecRevision]
    let robots: [Robot]
    let runs: [RobotRun]
    /// Starter templates the Host offers; empty when no registry is mounted.
    let templates: [RobotTemplate]

    private enum CodingKeys: String, CodingKey {
        case specs, robots, runs, templates
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        specs = try container.decodeIfPresent([RobotSpecRevision].self, forKey: .specs) ?? []
        robots = try container.decodeIfPresent([Robot].self, forKey: .robots) ?? []
        runs = try container.decodeIfPresent([RobotRun].self, forKey: .runs) ?? []
        templates = try container.decodeIfPresent([RobotTemplate].self, forKey: .templates) ?? []
    }
}

/// One hireable starter template, as the Host publishes it.
struct RobotTemplate: Decodable, Identifiable, Hashable, Sendable {
    struct Text: Decodable, Hashable, Sendable {
        let category: String
        let name: String
        let description: String
        let mission: String
    }

    let id: String
    let category: String
    let text: [String: Text]

    /// Copy for the reader's language, falling back to English.
    var localizedText: Text? {
        Self.pick(text)
    }

    private static func pick(_ copies: [String: Text]) -> Text? {
        // `zh-CN` and `zh` are the same language here; the Host keys by the
        // lowercase locale id it registered.
        let preferred = Locale.preferredLanguages
        for language in preferred {
            let keys = [language.lowercased(), String(language.prefix(2)).lowercased()]
            for key in keys where copies[key] != nil {
                return copies[key]
            }
        }
        return copies["en"] ?? copies.values.first
    }
}

/// One exact published specification revision.
struct RobotSpecRevision: Decodable, Hashable, Sendable {
    let ref: RobotSpecRef
    let spec: RobotSpec
    let publishedAt: Double
}

/// Specification identity plus revision number.
struct RobotSpecRef: Decodable, Hashable, Sendable {
    let spec: String
    let revision: Int
}

/// The specification fields this app renders.
struct RobotSpec: Decodable, Hashable, Sendable {
    let name: String
    let description: String?
    let goal: RobotGoal
    let capability: RobotCapability?

    private enum CodingKeys: String, CodingKey {
        case name, description, goal, capability
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decodeIfPresent(String.self, forKey: .name) ?? "未命名智能体"
        description = try container.decodeIfPresent(String.self, forKey: .description)
        goal = try container.decodeIfPresent(RobotGoal.self, forKey: .goal) ?? RobotGoal.empty
        capability = try container.decodeIfPresent(RobotCapability.self, forKey: .capability)
    }
}

/// The goal block of a specification.
struct RobotGoal: Decodable, Hashable, Sendable {
    let mission: String
    let successCriteria: [String]

    private enum CodingKeys: String, CodingKey {
        case mission, successCriteria
    }

    init(mission: String, successCriteria: [String]) {
        self.mission = mission
        self.successCriteria = successCriteria
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        mission = try container.decodeIfPresent(String.self, forKey: .mission) ?? ""
        successCriteria = try container.decodeIfPresent([String].self, forKey: .successCriteria) ?? []
    }

    /// A goal block for a frame that omitted it.
    static let empty = RobotGoal(mission: "", successCriteria: [])
}

/// The capability block of a specification, reduced to what this app renders.
struct RobotCapability: Decodable, Hashable, Sendable {
    let workspaceRoots: [String]

    private enum CodingKeys: String, CodingKey {
        case workspaceRoots
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        workspaceRoots = try container.decodeIfPresent([String].self, forKey: .workspaceRoots) ?? []
    }
}

/// One instantiated robot.
struct Robot: Decodable, Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let spec: RobotSpecRef
    let state: String
    let createdAt: Double

    private enum CodingKeys: String, CodingKey {
        case id, name, spec, state, createdAt
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decodeIfPresent(String.self, forKey: .name) ?? "未命名智能体"
        spec = try container.decodeIfPresent(RobotSpecRef.self, forKey: .spec)
            ?? RobotSpecRef(spec: "", revision: 0)
        state = try container.decodeIfPresent(String.self, forKey: .state) ?? "idle"
        createdAt = try container.decodeIfPresent(Double.self, forKey: .createdAt) ?? 0
    }
}

/// The input one run started with.
struct RobotRunInput: Decodable, Hashable, Sendable {
    let message: String
    let task: String?

    private enum CodingKeys: String, CodingKey {
        case message, task
    }

    init(message: String, task: String?) {
        self.message = message
        self.task = task
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        message = try container.decodeIfPresent(String.self, forKey: .message) ?? ""
        task = try container.decodeIfPresent(String.self, forKey: .task)
    }

    /// Input for a frame that omitted it.
    static let empty = RobotRunInput(message: "", task: nil)
}

/// One activation of a robot, including the Session that recorded it.
struct RobotRun: Decodable, Identifiable, Hashable, Sendable {
    let id: String
    let robot: String
    let state: String
    let input: RobotRunInput
    let startedAt: Double
    let endedAt: Double?
    let sessionId: String?
    let output: String?
    let error: String?

    private enum CodingKeys: String, CodingKey {
        case id, robot, state, input, startedAt, endedAt, sessionId, output, error
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        robot = try container.decodeIfPresent(String.self, forKey: .robot) ?? ""
        state = try container.decodeIfPresent(String.self, forKey: .state) ?? "queued"
        input = try container.decodeIfPresent(RobotRunInput.self, forKey: .input) ?? RobotRunInput.empty
        startedAt = try container.decodeIfPresent(Double.self, forKey: .startedAt) ?? 0
        endedAt = try container.decodeIfPresent(Double.self, forKey: .endedAt)
        sessionId = try container.decodeIfPresent(String.self, forKey: .sessionId)
        output = try container.decodeIfPresent(String.self, forKey: .output)
        error = try container.decodeIfPresent(String.self, forKey: .error)
    }
}

// MARK: - Room

/// One whole `room/watch` frame.
struct RoomSnapshot: Decodable, Sendable {
    let rooms: [Room]

    private enum CodingKeys: String, CodingKey {
        case rooms
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        rooms = try container.decodeIfPresent([Room].self, forKey: .rooms) ?? []
    }
}

/// One published room, with the specification fields this app renders.
struct Room: Decodable, Identifiable, Hashable, Sendable {
    let id: String
    let name: String
    let charter: String
    let members: [RoomMember]
    let workspaceRoot: String?
    let revision: Int
    let state: String
    let createdAt: Double
    let updatedAt: Double

    private enum CodingKeys: String, CodingKey {
        case id, spec, revision, state, createdAt, updatedAt
    }

    private enum SpecKeys: String, CodingKey {
        case name, charter, members, workspaceRoot
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        revision = try container.decodeIfPresent(Int.self, forKey: .revision) ?? 1
        state = try container.decodeIfPresent(String.self, forKey: .state) ?? "active"
        createdAt = try container.decodeIfPresent(Double.self, forKey: .createdAt) ?? 0
        updatedAt = try container.decodeIfPresent(Double.self, forKey: .updatedAt) ?? createdAt
        if let spec = try? container.nestedContainer(keyedBy: SpecKeys.self, forKey: .spec) {
            name = try spec.decodeIfPresent(String.self, forKey: .name) ?? "未命名群聊"
            charter = try spec.decodeIfPresent(String.self, forKey: .charter) ?? ""
            members = try spec.decodeIfPresent([RoomMember].self, forKey: .members) ?? []
            workspaceRoot = try spec.decodeIfPresent(String.self, forKey: .workspaceRoot)
        } else {
            name = "未命名群聊"
            charter = ""
            members = []
            workspaceRoot = nil
        }
    }
}

/// One member of a room. The robot name lives in the registry; the room copy
/// can override it.
struct RoomMember: Decodable, Identifiable, Hashable, Sendable {
    let id: String
    let displayName: String?
    let role: String
    let enabled: Bool

    private enum CodingKeys: String, CodingKey {
        case id, displayName, role, enabled
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        displayName = try container.decodeIfPresent(String.self, forKey: .displayName)
        role = try container.decodeIfPresent(String.self, forKey: .role) ?? "worker"
        enabled = try container.decodeIfPresent(Bool.self, forKey: .enabled) ?? true
    }

    /// The name the feed and mention chips use.
    var label: String {
        displayName ?? id
    }
}

/// Who wrote one room message.
enum RoomAuthor: Decodable, Hashable, Sendable {
    case human(id: String, name: String)
    case member(id: String)
    case system

    private enum CodingKeys: String, CodingKey {
        case kind, id, name
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        switch try container.decodeIfPresent(String.self, forKey: .kind) {
        case "human":
            self = try .human(
                id: container.decodeIfPresent(String.self, forKey: .id) ?? "",
                name: container.decodeIfPresent(String.self, forKey: .name) ?? "操作者"
            )
        case "member":
            self = try .member(id: container.decodeIfPresent(String.self, forKey: .id) ?? "")
        default:
            self = .system
        }
    }
}

/// One activity summary a member turn records.
struct RoomActivity: Decodable, Hashable, Sendable {
    let label: String
    let tokens: Int?
    let done: Bool?

    private enum CodingKeys: String, CodingKey {
        case label, tokens, done
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        label = try container.decodeIfPresent(String.self, forKey: .label) ?? "活动"
        tokens = try container.decodeIfPresent(Int.self, forKey: .tokens)
        done = try container.decodeIfPresent(Bool.self, forKey: .done)
    }
}

/// One loop-guard record a message carries.
struct RoomGuardRecord: Decodable, Hashable, Sendable {
    let code: String
    let detail: String

    private enum CodingKeys: String, CodingKey {
        case code, detail
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        code = try container.decodeIfPresent(String.self, forKey: .code) ?? "guard"
        detail = try container.decodeIfPresent(String.self, forKey: .detail) ?? ""
    }
}

/// One A2A envelope label.
struct RoomA2a: Decodable, Hashable, Sendable {
    let intent: String
    let task: String

    private enum CodingKeys: String, CodingKey {
        case intent, task
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        intent = try container.decodeIfPresent(String.self, forKey: .intent) ?? "request"
        task = try container.decodeIfPresent(String.self, forKey: .task) ?? ""
    }
}

/// One approval an operator owes the room.
struct RoomApproval: Decodable, Hashable, Sendable {
    let id: String
    let at: Double
    let decision: String?

    private enum CodingKeys: String, CodingKey {
        case id, at, decision
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        at = try container.decodeIfPresent(Double.self, forKey: .at) ?? 0
        decision = try container.decodeIfPresent(String.self, forKey: .decision)
    }
}

/// One durable message in a room feed.
struct RoomMessage: Decodable, Identifiable, Hashable, Sendable {
    let id: String
    let room: String
    let seq: Int
    let kind: String
    let text: String
    let author: RoomAuthor
    let mentions: [String]
    let approval: RoomApproval?
    let activity: RoomActivity?
    let guardRecord: RoomGuardRecord?
    let a2a: RoomA2a?
    let at: Double
    let depth: Int

    private enum CodingKeys: String, CodingKey {
        case id, room, seq, kind, text, author, mentions, approval, activity, `guard`, a2a, at, depth
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        room = try container.decodeIfPresent(String.self, forKey: .room) ?? ""
        seq = try container.decodeIfPresent(Int.self, forKey: .seq) ?? 0
        kind = try container.decodeIfPresent(String.self, forKey: .kind) ?? "chat"
        text = try container.decodeIfPresent(String.self, forKey: .text) ?? ""
        author = try container.decodeIfPresent(RoomAuthor.self, forKey: .author) ?? .system
        mentions = try container.decodeIfPresent([String].self, forKey: .mentions) ?? []
        approval = try container.decodeIfPresent(RoomApproval.self, forKey: .approval)
        activity = try container.decodeIfPresent(RoomActivity.self, forKey: .activity)
        guardRecord = try container.decodeIfPresent(RoomGuardRecord.self, forKey: .guard)
        a2a = try container.decodeIfPresent(RoomA2a.self, forKey: .a2a)
        at = try container.decodeIfPresent(Double.self, forKey: .at) ?? 0
        depth = try container.decodeIfPresent(Int.self, forKey: .depth) ?? 0
    }
}

// MARK: - Requests

struct RobotStartRequest: Encodable {
    let robotId: String
    let message: String
}

struct RobotRunTargetRequest: Encodable {
    let runId: String
}

struct RobotCorrectRequest: Encodable {
    let runId: String
    let message: String
}

struct RoomMessagesRequest: Encodable {
    let room: String
    let afterSeq: Int?
    let limit: Int?
}

struct RoomPostRequest: Encodable {
    let room: String
    let text: String
    let mentions: [String]?
}

struct RoomPauseRequest: Encodable {
    let room: String
    let paused: Bool
}

struct RoomTargetRequest: Encodable {
    let room: String
}

struct RoomApprovalRequest: Encodable {
    let room: String
    let approval: String
    let decision: String
}

// MARK: - Decoding

/// Decode one stream item into its concrete wire type.
///
/// The stream layer decodes items without a target type, because one mux
/// carries unrelated namespaces. Re-encoding the value and decoding it again
/// keeps the concrete model's own defaults and unknown-member tolerance.
/// @param type - the wire type to decode.
/// @param value - one `item` value from the Remote mux.
/// @returns the decoded value.
/// @throws HubError.decoding when the frame does not match the type.
func decodeRemote<Value: Decodable>(_ type: Value.Type, from value: JSONValue) throws -> Value {
    do {
        return try JSONDecoder().decode(type, from: JSONEncoder().encode(value))
    } catch {
        throw HubError.decoding(error.localizedDescription)
    }
}
