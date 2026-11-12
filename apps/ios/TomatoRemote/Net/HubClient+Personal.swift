//
//  HubClient+Personal.swift
//  Tomato Remote
//
//  Calls behind the personal-agent surfaces: Host memories, the forwarded-event
//  stream that carries questions and approvals, schedules, background jobs,
//  daily insights, and file transfer.
//
//  Every namespace here is optional on a given Host. A 404 from one of them
//  means the deployment does not mount that plugin, and the screen renders its
//  empty case rather than an error.
//

import Foundation

extension HubClient {
    // MARK: Memories

    /// Read the signed-in owner's memories for one Session's workspace.
    /// - Parameter sessionId: Session whose project scopes the workspace records.
    /// - Returns: the records, or an empty list while nobody is signed in.
    func listMemories(sessionId: String) async throws -> HostMemoryList {
        try await call("memories/list", body: MemoryListRequest(sessionId: sessionId), as: HostMemoryList.self)
    }

    /// Propose habits this phone derived; each waits for the owner's confirmation.
    /// - Parameters:
    ///   - sessionId: Session whose project receives workspace-scoped entries.
    ///   - entries: candidates to store.
    /// - Returns: the records as stored, in the candidate state.
    func proposeMemories(sessionId: String, entries: [HostMemoryEntry]) async throws -> HostMemoryProposal {
        try await call(
            "memories/propose",
            body: MemoryProposeRequest(sessionId: sessionId, entries: entries),
            as: HostMemoryProposal.self
        )
    }

    /// Promote one candidate so later turns receive it.
    /// - Parameters:
    ///   - sessionId: Session whose workspace the record belongs to.
    ///   - id: record to promote.
    /// - Returns: the promoted record, or `not_found` when it was already changed.
    func confirmMemory(sessionId: String, id: String) async throws -> HostMemoryConfirmation {
        try await call(
            "memories/confirm",
            body: MemoryTargetRequest(sessionId: sessionId, id: id),
            as: HostMemoryConfirmation.self
        )
    }

    /// Delete one record.
    /// - Parameters:
    ///   - sessionId: Session whose workspace the record belongs to.
    ///   - id: record to delete.
    /// - Returns: whether a record was removed.
    func forgetMemory(sessionId: String, id: String) async throws -> HostMemoryDeletion {
        try await call(
            "memories/forget",
            body: MemoryTargetRequest(sessionId: sessionId, id: id),
            as: HostMemoryDeletion.self
        )
    }

    // MARK: Forwarded events

    /// Open the Gateway's forwarded-event stream.
    ///
    /// The stream delivers owner-scoped events in the order they happen: a
    /// `ready` frame binding this connection, `waterfall` frames for questions
    /// and approvals that are waiting on a person, and `cancel` frames for ones
    /// another client settled.
    /// - Returns: every downlink frame as JSON.
    func eventFrames() -> AsyncThrowingStream<JSONValue, Error> {
        RemoteStream.frames(base: base, cookie: cookie, endpoint: "$events", argName: nil, payload: EmptyBody())
    }

    /// Settle one pending waterfall.
    /// - Parameters:
    ///   - clientId: identity from the `ready` frame of the answering stream.
    ///   - eventId: the waterfall's `eventId`.
    ///   - outcome: `result`, `next`, or `rejected`.
    func resolveEvent(clientId: String, eventId: String, outcome: JSONValue) async throws {
        let envelope: [String: Any] = [
            "type": "client-request",
            "rpcId": UUID().uuidString,
            "method": "$events/result",
            "payload": ["args": [
                "clientId": clientId,
                "eventId": eventId,
                "outcome": jsonObject(outcome),
            ]],
        ]
        guard let body = try? JSONSerialization.data(withJSONObject: envelope) else {
            throw HubError.decoding("事件答复无法编码")
        }
        _ = try await send(path: "/api/$events/result", method: "POST", body: body, contentType: "application/json")
    }

    // MARK: Subagent transcripts

    /// Follow a child Session through its parent's durable address.
    ///
    /// The Host refuses `session/follow` on a child addressed as a root Session
    /// (`session/agent-busy`); the parent address is the supported read path.
    /// - Parameters:
    ///   - parentSessionId: Session that spawned the child.
    ///   - childSessionId: child whose log is followed.
    ///   - mode: descriptor mode the child was created with, or `unknown` to skip the check.
    ///   - maxMessages: opening page size.
    /// - Returns: the stream of frames.
    func followSubagent(
        parentSessionId: String,
        childSessionId: String,
        mode: String,
        maxMessages: Int? = nil
    ) -> AsyncThrowingStream<JSONValue, Error> {
        RemoteStream.frames(
            base: base,
            cookie: cookie,
            endpoint: "session/follow",
            payload: Self.subagentFollowPayload(parent: parentSessionId, child: childSessionId, mode: mode, maxMessages: maxMessages)
        )
    }

    /// One backwards page of a child Session's log, through its parent address.
    /// - Parameters:
    ///   - parentSessionId: Session that spawned the child.
    ///   - childSessionId: child whose log is read.
    ///   - mode: descriptor mode, or `unknown`.
    ///   - throughSeq: newest sequence the page ends at.
    ///   - maxMessages: page size hint.
    /// - Returns: the page's events and whether older records exist.
    func pageSubagent(
        parentSessionId: String,
        childSessionId: String,
        mode: String,
        throughSeq: Double,
        maxMessages: Int? = nil
    ) async throws -> (events: [JSONValue], hasMore: Bool) {
        var request: [String: JSONValue] = [
            "address": Self.subagentAddress(parent: parentSessionId, child: childSessionId, mode: mode),
            "throughSeq": .number(throughSeq),
            "assistantStream": .bool(true),
        ]
        if let maxMessages {
            request["maxMessages"] = .number(Double(maxMessages))
        }
        let value = try await call("session/page", body: JSONValue.object(request), as: JSONValue.self)
        let events = (value["records"]?.arrayValue ?? []).compactMap { $0["event"] }
        return (events, value["hasMore"]?.boolValue ?? false)
    }

    /// Address object for a child Session.
    private static func subagentAddress(parent: String, child: String, mode: String) -> JSONValue {
        .object([
            "kind": .string("subagent"),
            "parentSessionId": .string(parent),
            "childSessionId": .string(child),
            "mode": .string(mode.isEmpty ? "unknown" : mode),
        ])
    }

    private static func subagentFollowPayload(
        parent: String,
        child: String,
        mode: String,
        maxMessages: Int?
    ) -> JSONValue {
        var payload: [String: JSONValue] = [
            "address": subagentAddress(parent: parent, child: child, mode: mode),
            "assistantStream": .bool(true),
        ]
        if let maxMessages {
            payload["maxMessages"] = .number(Double(maxMessages))
        }
        return .object(payload)
    }

    // MARK: Schedules

    /// Every reminder the Host keeps, active or not, with its Session binding.
    /// - Returns: tasks ordered by their next due instant.
    func scheduleCatalog() async throws -> [ScheduleEntry] {
        try await call("schedule/catalog", argName: nil, body: EmptyBody(), as: [ScheduleEntry].self)
    }

    /// Recent deliveries of one task, newest first.
    /// - Parameters:
    ///   - sessionId: Session the task belongs to.
    ///   - id: task whose deliveries are read.
    ///   - limit: how many to read.
    /// - Returns: the deliveries, or the Host's `code` when the task is gone.
    func scheduleHistory(sessionId: String, id: String, limit: Int = 20) async throws -> ScheduleHistory {
        try await call(
            "schedule/history",
            body: ScheduleHistoryRequest(sessionId: sessionId, id: id, limit: limit),
            as: ScheduleHistory.self
        )
    }

    /// Create one task bound to a Session.
    /// - Parameter request: Session, title, prompt, and the chosen selector.
    /// - Returns: the stored task as the catalog reports it.
    func createSchedule(_ request: ScheduleCreateBody) async throws -> ScheduleEntry {
        try await call("schedule/create", argName: "request", body: request, as: ScheduleEntry.self)
    }

    /// Pause or resume one task.
    /// - Parameters:
    ///   - sessionId: Session the task belongs to.
    ///   - id: task to change.
    ///   - paused: true to pause, false to resume.
    /// - Returns: the resulting state, or the refusal code.
    func setSchedulePaused(sessionId: String, id: String, paused: Bool) async throws -> SchedulePauseReply {
        try await call(
            paused ? "schedule/pause" : "schedule/resume",
            body: ScheduleTargetRequest(sessionId: sessionId, id: id),
            as: SchedulePauseReply.self
        )
    }

    /// Delete one task.
    /// - Parameters:
    ///   - sessionId: Session the task belongs to.
    ///   - id: task to delete.
    /// - Returns: whether a task was removed.
    func deleteSchedule(sessionId: String, id: String) async throws -> ScheduleDeletion {
        try await call("schedule/delete", body: ScheduleTargetRequest(sessionId: sessionId, id: id), as: ScheduleDeletion.self)
    }

    // MARK: Background jobs

    /// Frames of the live job list for one Session; each `rows` frame replaces
    /// the whole set.
    /// - Parameter sessionId: Session whose jobs are listed.
    /// - Returns: the stream of frames.
    func jobFrames(sessionId: String) -> AsyncThrowingStream<JSONValue, Error> {
        RemoteStream.frames(base: base, cookie: cookie, endpoint: "job/list", payload: JobListRequest(sessionId: sessionId))
    }

    /// Ask the Host to stop one running job.
    /// - Parameters:
    ///   - sessionId: Session that owns the job.
    ///   - jobId: job to stop.
    /// - Returns: `requested` or `already-finished`.
    func killJob(sessionId: String, jobId: String) async throws -> String {
        let value = try await call(
            "job/kill",
            body: JobKillRequest(sessionId: sessionId, jobId: jobId),
            as: JSONValue.self
        )
        return value["outcome"]?.stringValue ?? "requested"
    }

    // MARK: Daily insights

    /// Read the Host's daily recap and its open-task analysis. A Host that does
    /// not mount the insights plugin answers 404.
    /// - Returns: the snapshot, whose `available` flag says whether the plugin is on.
    func insightsSnapshot() async throws -> InsightsSnapshot {
        try await call("museInsights/snapshot", argName: nil, body: EmptyBody(), as: InsightsSnapshot.self)
    }

    // MARK: Files

    /// Download one Host file.
    ///
    /// The route answers a `302` to the versioned URL when no version is given;
    /// the session follows it, which keeps the caller out of the versioning the
    /// cache layer cares about.
    /// - Parameter path: absolute path on the Host.
    /// - Returns: the file's bytes and the response's content type.
    func download(path: String) async throws -> (data: Data, type: String?) {
        var components = URLComponents(url: base, resolvingAgainstBaseURL: false)
        components?.path = "/api/file"
        components?.queryItems = [URLQueryItem(name: "path", value: path)]
        guard let url = components?.url else { throw HubError.invalidBaseURL }
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if !cookie.isEmpty {
            request.setValue(cookie, forHTTPHeaderField: "Cookie")
        }
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200 ..< 300).contains(http.statusCode) else {
            throw HubError.transport("无法下载 \(URL(fileURLWithPath: path).lastPathComponent)")
        }
        return (data, http.value(forHTTPHeaderField: "Content-Type"))
    }

    /// Stage one document for the next prompt.
    ///
    /// The bytes travel as a raw stream rather than base64, so a large PDF costs
    /// one upload and no JSON inflation. The reply is the route's own JSON, not
    /// the RPC envelope.
    /// - Parameters:
    ///   - sessionId: Session that will receive the prompt.
    ///   - name: file name shown to the Agent.
    ///   - data: the document's bytes.
    /// - Returns: the receipt the `file` prompt part names.
    func uploadDocument(sessionId: String, name: String, data: Data) async throws -> StagedFile {
        var components = URLComponents(url: base, resolvingAgainstBaseURL: false)
        components?.path = "/api/session/uploadFileBinary"
        components?.queryItems = [
            URLQueryItem(name: "sessionId", value: sessionId),
            URLQueryItem(name: "name", value: name),
        ]
        guard let url = components?.url else { throw HubError.invalidBaseURL }
        let path = url.query.map { "\(url.path)?\($0)" } ?? url.path
        let body = try await send(path: path, method: "POST", body: data, contentType: "application/octet-stream")
        let reply = try JSONDecoder().decode(UploadReply.self, from: body)
        guard reply.ok, let value = reply.value else {
            throw HubError.remote(
                code: reply.error?.code ?? "upload-failed",
                message: reply.error?.message ?? "上传失败"
            )
        }
        return StagedFile(receiptId: value.receiptId, name: value.file?.name ?? name, bytes: value.file?.bytes ?? data.count)
    }

    // MARK: Transport helpers

    /// Send one raw request under the paired cookie.
    /// - Parameters:
    ///   - path: path under the Host root, with any query.
    ///   - method: HTTP method.
    ///   - body: request body bytes.
    ///   - contentType: media type of the body.
    /// - Returns: the response body.
    private func send(path: String, method: String, body: Data?, contentType: String?) async throws -> Data {
        let trimmed = base.absoluteString.hasSuffix("/")
            ? String(base.absoluteString.dropLast())
            : base.absoluteString
        guard let url = URL(string: trimmed + path) else { throw HubError.invalidBaseURL }
        var request = URLRequest(url: url)
        request.httpMethod = method
        if let contentType {
            request.setValue(contentType, forHTTPHeaderField: "Content-Type")
        }
        if !cookie.isEmpty {
            request.setValue(cookie, forHTTPHeaderField: "Cookie")
        }
        request.httpBody = body
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else { throw HubError.transport("非 HTTP 响应") }
        switch http.statusCode {
        case 200 ..< 300:
            return data
        case 401:
            throw HubError.unauthorized
        case 403:
            throw HubError.forbidden
        case 404:
            throw HubError.notFound
        default:
            throw HubError.transport("HTTP \(http.statusCode)")
        }
    }
}

/// Convert one JSON value into a Foundation object for `JSONSerialization`.
/// - Parameter value: decoded JSON.
/// - Returns: the equivalent `Any` tree.
private func jsonObject(_ value: JSONValue) -> Any {
    switch value {
    case .null: NSNull()
    case let .bool(flag): flag
    case let .number(number): number
    case let .string(text): text
    case let .array(items): items.map(jsonObject)
    case let .object(fields): fields.mapValues(jsonObject)
    }
}
