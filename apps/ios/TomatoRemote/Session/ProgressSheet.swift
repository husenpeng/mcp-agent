//
//  ProgressSheet.swift
//  Tomato Remote
//
//  What one Session is doing right now: its goal, its background jobs, and the
//  subagents it started.
//
//  A child Session cannot be followed directly — the Host refuses that address —
//  so a child opens through its parent's durable address, which is what the
//  conversation screen builds from `parentSessionId`.
//

import SwiftUI

/// Reads the long-running work of one Session.
@MainActor
final class ProgressModel: ObservableObject {
    let sessionId: String

    @Published private(set) var goal: GoalProgress?
    @Published private(set) var jobs: [BackgroundJob] = []
    @Published private(set) var children: [SubagentChild] = []
    @Published private(set) var isStreaming = false
    @Published var errorMessage: String?

    private var hub: HubClient?
    private var jobTask: Task<Void, Never>?
    /// Distinguishes the current job stream from one still tearing down.
    private var generation = 0

    /// @param sessionId - Session whose work is read.
    init(sessionId: String) {
        self.sessionId = sessionId
    }

    /// Start reading projections once and jobs continuously.
    /// - Parameter hub: client for the paired Host.
    func start(hub: HubClient?) {
        guard let hub else { return }
        self.hub = hub
        Task { await readProjections(hub: hub) }
        guard jobTask == nil else { return }
        generation += 1
        let generation = generation
        jobTask = Task { [weak self] in
            guard let self else { return }
            isStreaming = true
            do {
                for try await frame in hub.jobFrames(sessionId: sessionId) {
                    guard let rows = frame["jobs"]?.arrayValue else { continue }
                    jobs = rows.compactMap { row in
                        guard let id = row["id"]?.stringValue,
                              let label = row["label"]?.stringValue,
                              let status = row["status"]?.stringValue
                        else { return nil }
                        return BackgroundJob(
                            id: id,
                            kind: row["kind"]?.stringValue ?? "job",
                            label: label,
                            status: status,
                            progress: row["progress"]?.doubleValue,
                            detail: row["detail"]?.stringValue,
                            startedAt: row["startedAt"]?.doubleValue ?? 0,
                            finishedAt: row["finishedAt"]?.doubleValue
                        )
                    }
                }
            } catch {
                if !Task.isCancelled {
                    errorMessage = describe(error)
                }
            }
            guard self.generation == generation else { return }
            isStreaming = false
            jobTask = nil
        }
    }

    func stop() {
        generation += 1
        jobTask?.cancel()
        jobTask = nil
        isStreaming = false
    }

    /// Re-read the goal and the child catalog.
    func readProjections(hub: HubClient) async {
        guard let value = try? await hub.projections(sessionId: sessionId) else { return }
        let values = value["values"] ?? value
        goal = GoalProgress(projection: values["goal"])
        children = (values["subagentCatalog"]?.arrayValue ?? []).compactMap { entry in
            guard let id = entry["id"]?.stringValue else { return nil }
            return SubagentChild(
                id: id,
                mode: entry["mode"]?.stringValue ?? "unknown",
                label: entry["label"]?.stringValue,
                createdAt: entry["createdAt"]?.doubleValue
            )
        }
        if children.isEmpty, let catalog = values["subagentCatalog"]?["children"]?.arrayValue {
            children = catalog.compactMap { entry in
                guard let id = entry["id"]?.stringValue else { return nil }
                return SubagentChild(
                    id: id,
                    mode: entry["mode"]?.stringValue ?? "unknown",
                    label: entry["label"]?.stringValue,
                    createdAt: nil
                )
            }
        }
    }

    /// Ask the Host to stop one job.
    /// - Parameter job: the job to stop.
    func kill(_ job: BackgroundJob) async {
        guard let hub else { return }
        do {
            _ = try await hub.killJob(sessionId: sessionId, jobId: job.id)
        } catch {
            errorMessage = describe(error)
        }
    }
}

struct ProgressSheet: View {
    @ObservedObject var progress: ProgressModel
    @EnvironmentObject private var model: AppModel
    @Environment(\.dismiss) private var dismiss
    @State private var openChild: SubagentChild?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                SheetHeader(
                    title: "进度",
                    caption: "这一刻在做什么、跑了哪些后台任务、子代理到哪一步了。",
                    onClose: { dismiss() }
                )
                ScrollView {
                    VStack(alignment: .leading, spacing: 16) {
                        if let error = progress.errorMessage {
                            ErrorBanner(message: error)
                        }
                        goalCard
                        jobsCard
                        childrenCard
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)
                }
                .background(TomatoToken.bgBase)
            }
            .navigationDestination(item: $openChild) { child in
                ChatView(
                    sessionId: child.id,
                    title: child.label ?? "子代理",
                    parentSessionId: progress.sessionId,
                    subagentMode: child.mode
                )
            }
        }
        .task { progress.start(hub: model.hub) }
        .onDisappear { progress.stop() }
    }

    private var goalCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "目标") {
                    if let goal = progress.goal {
                        StatusPill(text: goal.phaseText, tone: goal.phase == "blocked" ? .error : goal.phase == "complete" ? .ok : .info)
                    }
                }
                if let goal = progress.goal {
                    Text(goal.objective)
                        .font(.callout)
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(goal.maxGoalRounds.map { "第 \(goal.roundsStarted) / \($0) 轮" } ?? "第 \(goal.roundsStarted) 轮")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                } else {
                    Text("这个会话没有设定目标。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                }
            }
        }
    }

    private var jobsCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "后台任务") {
                    if progress.isStreaming {
                        ProgressView().controlSize(.mini)
                    }
                }
                if progress.jobs.isEmpty {
                    Text("没有正在跑的后台任务。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                } else {
                    ForEach(progress.jobs) { job in
                        VStack(alignment: .leading, spacing: 4) {
                            HStack(spacing: 6) {
                                Circle()
                                    .fill(job.isRunning ? TomatoToken.stateBusinessPrimary : TomatoToken.labelDimmed)
                                    .frame(width: 6, height: 6)
                                Text(job.label)
                                    .font(.footnote.weight(.medium))
                                    .foregroundStyle(TomatoToken.labelPrimary)
                                    .lineLimit(1)
                                Spacer(minLength: 6)
                                Text(job.status)
                                    .font(.caption2)
                                    .foregroundStyle(TomatoToken.labelCaption)
                            }
                            if let detail = job.detail, !detail.isEmpty {
                                Text(detail)
                                    .font(.caption)
                                    .foregroundStyle(TomatoToken.labelCaption)
                                    .lineLimit(2)
                                    .padding(.leading, 12)
                            }
                            if job.isRunning {
                                Button("停止", role: .destructive) {
                                    Task { await progress.kill(job) }
                                }
                                .font(.caption)
                                .padding(.leading, 12)
                            }
                        }
                    }
                }
            }
        }
    }

    private var childrenCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "子代理") {
                    Text("\(progress.children.count)")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                if progress.children.isEmpty {
                    Text("这个会话没有派生子代理。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                } else {
                    ForEach(progress.children) { child in
                        Button {
                            openChild = child
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "person.2")
                                    .font(.footnote)
                                    .foregroundStyle(TomatoToken.brandPrimary)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text(child.label ?? String(child.id.prefix(8)))
                                        .font(.footnote.weight(.medium))
                                        .foregroundStyle(TomatoToken.labelPrimary)
                                        .lineLimit(1)
                                    Text(child.mode == "external" ? "外部" : child.mode)
                                        .font(.caption2)
                                        .foregroundStyle(TomatoToken.labelCaption)
                                }
                                Spacer(minLength: 6)
                                Image(systemName: "chevron.right")
                                    .font(.caption2.weight(.semibold))
                                    .foregroundStyle(TomatoToken.labelDimmed)
                            }
                            .contentShape(Rectangle())
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}
