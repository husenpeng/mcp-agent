//
//  HubClient+Robots.swift
//  Tomato Remote
//
//  Calls of the optional `robot` and `room` Remote namespaces. The Host mounts
//  them only when the Tomato Rbot bundle is on, so each call may answer 404.
//

import Foundation

extension HubClient {
    // MARK: Robots

    /// Whole-registry frames for the optional `robot` namespace. The first
    /// frame of a reconnect already carries every spec, robot, and run, so a
    /// reader replaces its state instead of merging frames.
    func robotSnapshot(logAttempt: Bool = true) -> AsyncThrowingStream<JSONValue, Error> {
        RemoteStream.frames(
            base: base,
            cookie: cookie,
            endpoint: "robot/watch",
            argName: nil,
            logAttempt: logAttempt,
            payload: EmptyBody()
        )
    }

    /// Start one manual run.
    /// @param robotId - robot that owns the run.
    /// @param message - instruction handed to the run.
    /// @returns the accepted run.
    func startRobot(robotId: String, message: String) async throws -> RobotRun {
        try await call(
            "robot/start",
            body: RobotStartRequest(robotId: robotId, message: message),
            as: RobotRun.self
        )
    }

    /// Cancel a run that has not settled.
    /// @param runId - run to cancel.
    func cancelRobotRun(runId: String) async throws {
        try await callDiscarding("robot/cancel", body: RobotRunTargetRequest(runId: runId))
    }

    /// Pause a running run for a human correction, keeping its Session alive.
    /// @param runId - run to interrupt.
    func interruptRobotRun(runId: String) async throws {
        try await callDiscarding("robot/interrupt", body: RobotRunTargetRequest(runId: runId))
    }

    /// Deliver a correction into an executing run.
    /// @param runId - run to correct.
    /// @param message - correction the run's Agent receives.
    func correctRobotRun(runId: String, message: String) async throws {
        try await callDiscarding(
            "robot/correct",
            body: RobotCorrectRequest(runId: runId, message: message)
        )
    }

    // MARK: Rooms

    /// Whole-room frames for the optional `room` namespace.
    func roomSnapshot(logAttempt: Bool = true) -> AsyncThrowingStream<JSONValue, Error> {
        RemoteStream.frames(
            base: base,
            cookie: cookie,
            endpoint: "room/watch",
            argName: nil,
            logAttempt: logAttempt,
            payload: EmptyBody()
        )
    }

    /// Read messages after a room sequence cursor.
    /// @param roomId - room whose messages are read.
    /// @param afterSeq - exclusive lower bound; nil reads from the first message.
    /// @param limit - page size hint, 1...500.
    /// @returns messages in room order.
    func roomMessages(roomId: String, afterSeq: Int? = nil, limit: Int? = nil) async throws -> [RoomMessage] {
        try await call(
            "room/messages",
            body: RoomMessagesRequest(room: roomId, afterSeq: afterSeq, limit: limit),
            as: [RoomMessage].self
        )
    }

    /// Record one human message, optionally addressing members.
    /// @param roomId - room that receives the message.
    /// @param text - message body.
    /// @param mentions - members the message addresses.
    /// @returns the recorded message.
    func postRoomMessage(roomId: String, text: String, mentions: [String] = []) async throws -> RoomMessage {
        try await call(
            "room/post",
            body: RoomPostRequest(room: roomId, text: text, mentions: mentions.isEmpty ? nil : mentions),
            as: RoomMessage.self
        )
    }

    /// Stop or resume robot wakes in one room.
    /// @param roomId - room to change.
    /// @param paused - true stops wakes; false resumes them.
    func pauseRoom(roomId: String, paused: Bool) async throws {
        try await callDiscarding("room/pause", body: RoomPauseRequest(room: roomId, paused: paused))
    }

    /// Resume a paused or tripped room.
    /// @param roomId - room to resume.
    func resumeRoom(roomId: String) async throws {
        try await callDiscarding("room/resume", body: RoomTargetRequest(room: roomId))
    }

    /// Allow one more episode while the breaker stays open.
    /// @param roomId - room to relax.
    func relaxRoomOnce(roomId: String) async throws {
        try await callDiscarding("room/relaxOnce", body: RoomTargetRequest(room: roomId))
    }

    /// End the current episode.
    /// @param roomId - room whose episode ends.
    func endRoomEpisode(roomId: String) async throws {
        try await callDiscarding("room/endEpisode", body: RoomTargetRequest(room: roomId))
    }

    /// Decide one pending approval.
    /// @param roomId - room that raised the approval.
    /// @param approvalId - approval to settle.
    /// @param decision - `approved` or `rejected`.
    func approveRoom(roomId: String, approvalId: String, decision: String) async throws {
        try await callDiscarding(
            "room/approve",
            body: RoomApprovalRequest(room: roomId, approval: approvalId, decision: decision)
        )
    }
}
