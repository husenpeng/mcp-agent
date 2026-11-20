//
//  RobotsView.swift
//  Tomato Remote
//
//  The 智能体 tab: the robots the paired Mac has published, their
//  conversations, and the controls the `robot` Remote namespace exposes. Run
//  transcripts are opened here, which is why the Session list hides them.
//

import SwiftUI

// MARK: - Model

/// Follows the robot registry and issues run-control calls.
@MainActor
final class RobotListModel: ObservableObject {
    @Published private(set) var robots: [Robot] = []
    @Published private(set) var specs: [RobotSpecRevision] = []
    @Published private(set) var runs: [RobotRun] = []
    @Published private(set) var isConnecting = true
    @Published private(set) var isFollowing = false
    @Published var errorMessage: String?
    @Published private(set) var isStarting = false
    @Published private(set) var busyRunId: String?

    private var streamTask: Task<Void, Never>?
    /// Distinguishes the current stream loop from one still tearing down.
    private var generation = 0
    /// Client bound to the paired Host, exposed so the hire sheet can write.
    private(set) var hub: HubClient?
    /// Starter templates the Host offers, from the newest snapshot.
    @Published private(set) var templates: [RobotTemplate] = []

    /// Robots in the order a person scans them: active first, then name.
    var ordered: [Robot] {
        robots.sorted { left, right in
            let leftWeight = Self.stateWeight(left.state)
            let rightWeight = Self.stateWeight(right.state)
            if leftWeight != rightWeight {
                return leftWeight < rightWeight
            }
            return left.name.localizedStandardCompare(right.name) == .orderedAscending
        }
    }

    /// The published specification a robot is bound to.
    /// @param robot - instance whose revision is read.
    /// @returns the specification, or nil when the frame omitted it.
    func spec(for robot: Robot) -> RobotSpec? {
        specs.first { $0.ref == robot.spec }?.spec
    }

    /// Runs of one robot, newest first.
    /// @param robotId - robot whose runs are listed.
    func runs(for robotId: String) -> [RobotRun] {
        runs.filter { $0.robot == robotId }.sorted { $0.startedAt > $1.startedAt }
    }

    /// The run currently executing or waiting for correction, if any.
    /// @param robotId - robot whose active run is read.
    func activeRun(for robotId: String) -> RobotRun? {
        runs(for: robotId).first { runIsActive($0.state) }
    }

    /// Open the snapshot stream, replacing an earlier attempt.
    /// @param hub - client bound to the paired Host.
    func start(hub: HubClient?) {
        guard streamTask == nil, let hub else { return }
        self.hub = hub
        AppLog.mark("智能体")
        isConnecting = true
        isFollowing = false
        generation += 1
        let generation = generation
        streamTask = Task { [weak self] in
            var attempt = 0
            while !Task.isCancelled {
                do {
                    for try await frame in hub.robotSnapshot(
                        logAttempt: attempt <= StreamRetry.quickAttempts
                    ) {
                        guard let self, self.generation == generation else { return }
                        if errorMessage != nil {
                            // Self-healed: the banner that said the stream was
                            // down must not outlive the outage.
                            errorMessage = nil
                            AppLog.info(.stream, "智能体流已恢复")
                        }
                        attempt = 0
                        apply(frame)
                    }
                } catch {
                    guard let self, !Task.isCancelled else { break }
                    // A refused namespace answers identically on every attempt.
                    if let failure = error as? HubError, failure.isFinal {
                        errorMessage = Self.message(for: failure)
                        break
                    }
                }
                guard let self, !Task.isCancelled else { break }
                // A closed snapshot stream is a disconnect too: the Host
                // restarted or moved port, and nothing reopens this socket while
                // the app stays on this tab.
                isFollowing = false
                attempt += 1
                errorMessage = StreamRetry.status(attempt: attempt)
                if attempt <= StreamRetry.quickAttempts {
                    AppLog.warning(.stream, "智能体流中断", detail: "第 \(attempt) 次")
                } else if attempt == StreamRetry.quickAttempts + 1 {
                    AppLog.warning(.stream, "智能体流改为每分钟重试", detail: "第 \(attempt) 次")
                }
                try? await Task.sleep(
                    nanoseconds: UInt64(StreamRetry.pause(afterAttempt: attempt) * 1_000_000_000)
                )
            }
            guard let self, self.generation == generation else { return }
            isConnecting = false
            isFollowing = false
            streamTask = nil
        }
    }

    func stop() {
        generation += 1
        streamTask?.cancel()
        streamTask = nil
        isConnecting = false
        isFollowing = false
    }

    /// Reopen the stream after the app returns from the background.
    /// @param hub - client bound to the paired Host.
    func resume(hub: HubClient?) {
        guard streamTask == nil else { return }
        start(hub: hub)
    }

    /// Drop the current stream and open a fresh one; also the retry action.
    func retry() {
        let current = hub
        stop()
        errorMessage = nil
        start(hub: current)
    }

    /// Open one explicit Host; a pull-to-refresh after re-pairing uses it.
    /// @param hub - client bound to the paired Host.
    func restart(hub: HubClient?) {
        stop()
        errorMessage = nil
        start(hub: hub)
    }

    /// Start one run with a human instruction.
    /// @param robotId - robot to run.
    /// @param message - instruction handed to the run.
    /// @returns true when the Host accepted the run.
    func startRun(robotId: String, message: String) async -> Bool {
        guard let hub else { return false }
        isStarting = true
        defer { isStarting = false }
        do {
            _ = try await hub.startRobot(robotId: robotId, message: message)
            errorMessage = nil
            return true
        } catch {
            errorMessage = Self.message(for: error)
            return false
        }
    }

    /// Pause an executing run for a correction.
    /// @param runId - run to interrupt.
    func interrupt(runId: String) async {
        await perform(runId: runId) { hub in try await hub.interruptRobotRun(runId: runId) }
    }

    /// Cancel a run.
    /// @param runId - run to cancel.
    func cancel(runId: String) async {
        await perform(runId: runId) { hub in try await hub.cancelRobotRun(runId: runId) }
    }

    /// Deliver a correction into an executing run.
    /// @param runId - run to correct.
    /// @param message - correction text.
    func correct(runId: String, message: String) async {
        await perform(runId: runId) { hub in try await hub.correctRobotRun(runId: runId, message: message) }
    }

    // MARK: Internals

    private func perform(runId: String, action: (HubClient) async throws -> Void) async {
        guard let hub else { return }
        busyRunId = runId
        defer { busyRunId = nil }
        do {
            try await action(hub)
            errorMessage = nil
        } catch {
            errorMessage = Self.message(for: error)
        }
    }

    private func apply(_ frame: JSONValue) {
        let snapshot: RobotSnapshot
        do {
            snapshot = try decodeRemote(RobotSnapshot.self, from: frame)
        } catch {
            errorMessage = "智能体列表无法解析这台 Mac 返回的数据。"
            return
        }
        robots = snapshot.robots
        specs = snapshot.specs
        runs = snapshot.runs
        templates = snapshot.templates
        isConnecting = false
        isFollowing = true
        errorMessage = nil
    }

    private static func stateWeight(_ state: String) -> Int {
        switch state {
        case "running": 0
        case "provisioning": 1
        case "idle": 2
        case "paused": 3
        case "failed": 4
        default: 5
        }
    }

    private static func message(for error: Error) -> String {
        if let failure = error as? HubError, failure == .notFound {
            return "这台 Mac 没有启用智能体。在桌面端的「插件」里打开 Tomato Rbot 后重试。"
        }
        return describe(error)
    }
}

// MARK: - List

struct RobotsView: View {
    @ObservedObject var robotModel: RobotListModel
    /// One line of context under the page title.
    private static let caption = "桌面端配置的机器人；这里启动、中断，并查看它们的对话记录。"
    @State private var showsHire = false

    var body: some View {
        NavigationStack {
            content
                .background(TomatoSurface.page)
                // No page title: the caption and the rows are the page.
                .navigationTitle("")
                .navigationBarTitleDisplayMode(.inline)
                .tomatoFloatingTabs()
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            showsHire = true
                        } label: {
                            Image(systemName: "plus")
                        }
                        .disabled(robotModel.hub == nil)
                        .accessibilityLabel("新建智能体")
                    }
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            robotModel.retry()
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                        .disabled(robotModel.isConnecting)
                        .accessibilityLabel("刷新智能体")
                    }
                }
                .sheet(isPresented: $showsHire) {
                    if let hub = robotModel.hub {
                        HireRobotSheet(hub: hub, templates: robotModel.templates) {
                            // The watch stream delivers the new robot; a retry
                            // covers a Host that has not pushed yet.
                            robotModel.retry()
                        }
                        .tomatoSheet()
                    }
                }
                .navigationDestination(for: String.self) { robotId in
                    RobotDetailView(robotModel: robotModel, robotId: robotId)
                }
                .navigationDestination(for: RobotRun.self) { run in
                    if let sessionId = run.sessionId {
                        ChatView(sessionId: sessionId, title: "对话记录")
                    }
                }
        }
    }

    @ViewBuilder
    private var content: some View {
        if let error = robotModel.errorMessage, robotModel.robots.isEmpty {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PageCaption(caption: Self.caption)
                    ErrorBanner(message: error) {
                        robotModel.retry()
                    }
                }
                .padding(20)
            }
            .tomatoScrollEdge()
        } else if robotModel.isConnecting, robotModel.robots.isEmpty {
            ScrollView {
                ProgressView("正在读取智能体…")
                    .frame(maxWidth: .infinity)
                    .padding(.top, 60)
            }
        } else if robotModel.robots.isEmpty {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    PageCaption(caption: Self.caption)
                    EmptyPlaceholder(
                        systemImage: "brain.head.profile",
                        title: "还没有智能体",
                        detail: "在桌面端的 Tomato Rbot 里创建或聘用一个机器人，它就会出现在这里。"
                    )
                }
                .padding(20)
            }
            .tomatoScrollEdge()
        } else {
            List {
                Section {
                    ForEach(robotModel.ordered) { robot in
                        NavigationLink(value: robot.id) {
                            RobotRow(
                                robot: robot,
                                spec: robotModel.spec(for: robot),
                                activeRun: robotModel.activeRun(for: robot.id),
                                lastRun: robotModel.runs(for: robot.id).first
                            )
                        }
                        .accessibilityIdentifier("robot.row.\(robot.id)")
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                        .listRowInsets(EdgeInsets(top: 2, leading: 12, bottom: 2, trailing: 12))
                    }
                } header: {
                    VStack(alignment: .leading, spacing: 8) {
                        PageCaption(caption: Self.caption)
                        SectionHeader(title: "已发布") {
                            Text("\(robotModel.ordered.count) 个")
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(TomatoToken.labelCaption)
                        }
                    }
                    .textCase(nil)
                    .padding(.leading, 4)
                    .padding(.bottom, 2)
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .contentMargins(.bottom, 76, for: .scrollContent)
            .tomatoScrollEdge()
            .refreshable { robotModel.retry() }
        }
    }
}

private struct RobotRow: View {
    let robot: Robot
    let spec: RobotSpec?
    let activeRun: RobotRun?
    let lastRun: RobotRun?

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            IconChip(
                systemImage: "cpu",
                tint: robot.state == "running" ? TomatoToken.brandPrimary : TomatoToken.labelCaption,
                neutral: robot.state != "running",
                side: 36
            )
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(robot.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .lineLimit(1)
                    Spacer(minLength: 6)
                    StatusPill(text: robotStateLabel(robot.state), tone: robotStateTone(robot.state))
                }
                if let mission = spec?.goal.mission, !mission.isEmpty {
                    Text(mission)
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .lineLimit(2)
                }
                HStack(spacing: 5) {
                    if let activeRun {
                        Image(systemName: "bolt.fill")
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.brandPrimary)
                        Text("这次运行：\(runStateLabel(activeRun.state))")
                    } else if let lastRun {
                        Image(systemName: "clock")
                            .font(.caption2)
                        Text("上次：\(runStateLabel(lastRun.state)) · \(relativeTime(lastRun.startedAt))")
                    } else {
                        Image(systemName: "circle.dashed")
                            .font(.caption2)
                        Text("还没有运行过")
                    }
                }
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            robot.state == "running" ? TomatoBrand.soft : TomatoSurface.card,
            in: RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous)
                .strokeBorder(robot.state == "running" ? TomatoLine.brandSoft : TomatoLine.hairline, lineWidth: 1)
        )
        .contentShape(RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous))
        .accessibilityElement(children: .combine)
    }
}
