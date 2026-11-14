//
//  RobotDetailView.swift
//  Tomato Remote
//
//  One robot's run controls, current run, and conversation history.
//

import SwiftUI

// MARK: - Detail

struct RobotDetailView: View {
    @ObservedObject var robotModel: RobotListModel
    let robotId: String

    @State private var showsStart = false
    @State private var showsCorrect = false
    @State private var showsInfo = false
    @State private var confirmsCancel = false

    private var robot: Robot? {
        robotModel.robots.first { $0.id == robotId }
    }

    private var spec: RobotSpec? {
        robot.flatMap { robotModel.spec(for: $0) }
    }

    /// Conversations that already settled, newest first. The run still
    /// executing has its own card above, so it is not listed twice.
    private var history: [RobotRun] {
        robotModel.runs(for: robotId).filter { !runIsActive($0.state) }
    }

    private var activeRun: RobotRun? {
        robotModel.activeRun(for: robotId)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                if let error = robotModel.errorMessage {
                    ErrorBanner(message: error) {
                        robotModel.retry()
                    }
                }
                if let robot {
                    header(robot)
                    missionCard
                    controlCard(robot)
                    if let activeRun {
                        currentRunCard(activeRun)
                    }
                    conversationHistoryCard
                } else if robotModel.isConnecting {
                    ProgressView("正在读取智能体…")
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                } else {
                    EmptyPlaceholder(
                        systemImage: "questionmark.circle",
                        title: "这个智能体不在列表里",
                        detail: "它可能刚被删除，或这个 Host 上没有 Tomato Rbot。"
                    )
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 28)
        }
        .background(TomatoToken.bgBase)
        .navigationTitle(robot?.name ?? "智能体")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .tabBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showsInfo = true } label: {
                    Image(systemName: "info.circle")
                }
                .accessibilityLabel("智能体信息")
            }
        }
        .sheet(isPresented: $showsStart) {
            RobotMessageSheet(
                title: "运行一次",
                caption: "写清楚要它产出什么；这次指令只属于这一次运行。",
                placeholder: "例如：整理本周竞品的新品发布，输出三条要点",
                actionTitle: "启动",
                onSubmit: { text in
                    Task { _ = await robotModel.startRun(robotId: robotId, message: text) }
                }
            )
            .tomatoSheet()
        }
        .sheet(isPresented: $showsCorrect) {
            RobotMessageSheet(
                title: "纠正这次运行",
                caption: "运行会收到这条消息：等待中时作为下一轮，运行中时作为转向指令。",
                placeholder: "例如：先别写文案，把数据来源列清楚",
                actionTitle: "发送",
                onSubmit: { text in
                    guard let activeRun else { return }
                    Task { await robotModel.correct(runId: activeRun.id, message: text) }
                }
            )
            .tomatoSheet()
        }
        .sheet(isPresented: $showsInfo) {
            if let robot, let spec {
                RobotInfoSheet(robot: robot, spec: spec)
                    .tomatoSheet()
            }
        }
        .tomatoConfirm(
            isPresented: $confirmsCancel,
            title: "取消这次运行？",
            message: "已经产生的记录会保留，但这次运行不会再继续。",
            confirmTitle: "取消运行",
            destructive: true
        ) {
            guard let activeRun else { return }
            Task { await robotModel.cancel(runId: activeRun.id) }
        }
    }
}

/// One settled run drawn as the conversation it was: the instruction the
/// person gave, then the answer the robot produced.
private struct RobotConversationRow: View {
    let run: RobotRun

    var body: some View {
        VStack(alignment: .leading, spacing: 9) {
            HStack(spacing: 8) {
                StatusPill(text: runStateLabel(run.state), tone: runStateTone(run.state))
                Spacer(minLength: 6)
                Text(relativeTime(run.endedAt ?? run.startedAt))
                    .font(.caption2)
                    .foregroundStyle(TomatoToken.labelDimmed)
                if run.sessionId != nil {
                    Image(systemName: "chevron.right")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
            }
            if let message = Self.trimmed(run.input.message) {
                RobotUserBubble(text: message, runId: run.id)
            }
            outcome
        }
        .padding(.vertical, 4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(Rectangle())
    }

    @ViewBuilder
    private var outcome: some View {
        if let output = Self.trimmed(run.output) {
            RobotAnswerBubble(text: output, lineLimit: 5, runId: run.id)
        } else if let error = Self.trimmed(run.error) {
            RobotFailureLine(text: error, runId: run.id)
        } else {
            Text("这次对话没有留下回答。")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelDimmed)
        }
    }

    static func trimmed(_ value: String?) -> String? {
        guard let value else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}

/// The instruction the person wrote, aligned to the trailing edge so a
/// conversation reads as two speakers before either line is parsed.
private struct RobotUserBubble: View {
    let text: String
    let runId: String

    var body: some View {
        HStack(alignment: .top) {
            Spacer(minLength: 44)
            Text(inlineMarkdown(text))
                .font(.footnote)
                .lineSpacing(3)
                .foregroundStyle(TomatoToken.labelPrimary)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(
                    TomatoToken.brandPrimary.opacity(0.12),
                    in: RoundedRectangle(cornerRadius: 14, style: .continuous)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .strokeBorder(TomatoToken.brandPrimary.opacity(0.16), lineWidth: 1)
                )
        }
        .accessibilityIdentifier("robot.message.user.\(runId)")
    }
}

/// The robot's answer as a quoted block: one accent line keeps it distinct
/// from the person's instruction without competing with the page's own type.
private struct RobotAnswerBubble: View {
    let text: String
    var lineLimit: Int?
    let runId: String

    var body: some View {
        HStack(alignment: .top, spacing: 9) {
            RoundedRectangle(cornerRadius: 1.5, style: .continuous)
                .fill(TomatoToken.brandPrimary.opacity(0.55))
                .frame(width: 3)
            Text(inlineMarkdown(text))
                .font(.footnote)
                .lineSpacing(3)
                .foregroundStyle(TomatoToken.labelSecondary)
                .lineLimit(lineLimit)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.vertical, 4)
        }
        .accessibilityIdentifier("robot.message.answer.\(runId)")
    }
}

/// A failed run keeps its reason where the answer would have been.
private struct RobotFailureLine: View {
    let text: String
    let runId: String

    var body: some View {
        HStack(alignment: .top, spacing: 6) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.caption2)
                .foregroundStyle(TomatoToken.stateErrorPrimary)
            Text(text)
                .font(.caption)
                .foregroundStyle(TomatoToken.stateErrorPrimary)
                .lineLimit(4)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .accessibilityIdentifier("robot.message.failure.\(runId)")
    }
}

// MARK: - Sheets

private struct RobotMessageSheet: View {
    let title: String
    let caption: String
    let placeholder: String
    let actionTitle: String
    let onSubmit: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var text = ""

    private var canSubmit: Bool {
        !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(caption)
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .fixedSize(horizontal: false, vertical: true)
                    TextField(placeholder, text: $text, axis: .vertical)
                        .lineLimit(4 ... 10)
                        .accessibilityIdentifier("robot.message")
                        .font(.body)
                        .padding(12)
                        .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
                }
                .padding(20)
            }
            .background(TomatoToken.bgBase)
            .navigationTitle(title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("取消") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button(actionTitle) {
                        let value = text.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard !value.isEmpty else { return }
                        onSubmit(value)
                        dismiss()
                    }
                    .disabled(!canSubmit)
                }
            }
        }
    }
}

private struct RobotInfoSheet: View {
    let robot: Robot
    let spec: RobotSpec

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    TomatoCard(padding: 18) {
                        VStack(alignment: .leading, spacing: 10) {
                            InfoRow(label: "名称", value: robot.name)
                            InfoRow(label: "状态", value: robotStateLabel(robot.state))
                            InfoRow(label: "规格", value: robot.spec.spec)
                            InfoRow(label: "版本", value: "r\(robot.spec.revision)")
                            InfoRow(label: "创建于", value: relativeTime(robot.createdAt))
                        }
                    }
                    if let description = spec.description, !description.isEmpty {
                        TomatoCard(padding: 18) {
                            VStack(alignment: .leading, spacing: 8) {
                                SectionHeader(title: "说明")
                                Text(description)
                                    .font(.footnote)
                                    .foregroundStyle(TomatoToken.labelSecondary)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }
                .padding(20)
            }
            .background(TomatoToken.bgBase)
            .navigationTitle("智能体")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完成") { dismiss() }
                }
            }
        }
    }
}

// MARK: - Labels

/// Human label of a robot lifecycle state.
/// @param state - wire state.
func robotStateLabel(_ state: String) -> String {
    switch state {
    case "provisioning": "准备中"
    case "idle": "空闲"
    case "running": "运行中"
    case "paused": "已暂停"
    case "failed": "失败"
    case "stopped": "已停止"
    default: state
    }
}

/// Tone of a robot lifecycle state.
/// @param state - wire state.
func robotStateTone(_ state: String) -> StatusPill.Tone {
    switch state {
    case "running": .ok
    case "provisioning": .info
    case "paused": .warn
    case "failed": .error
    case "stopped": .idle
    default: .idle
    }
}

/// Human label of a run state.
/// @param state - wire state.
func runStateLabel(_ state: String) -> String {
    switch state {
    case "queued": "排队中"
    case "leased": "已领取"
    case "running": "运行中"
    case "waiting": "等待纠正"
    case "finalizing": "收尾中"
    case "succeeded": "成功"
    case "failed": "失败"
    case "cancelled": "已取消"
    case "timed_out": "超时"
    default: state
    }
}

/// Tone of a run state.
/// @param state - wire state.
func runStateTone(_ state: String) -> StatusPill.Tone {
    switch state {
    case "running", "leased": .ok
    case "queued", "finalizing": .info
    case "waiting": .warn
    case "failed", "timed_out": .error
    default: .idle
    }
}

/// Whether a run still accepts control calls.
/// @param state - wire state.
func runIsActive(_ state: String) -> Bool {
    switch state {
    case "queued", "leased", "running", "waiting", "finalizing": true
    default: false
    }
}

extension RobotDetailView {
    private func header(_ robot: Robot) -> some View {
        TomatoCard(padding: 18) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 10) {
                    Text(robot.name)
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelPrimary)
                    Spacer(minLength: 8)
                    StatusPill(text: robotStateLabel(robot.state), tone: robotStateTone(robot.state))
                }
                if let description = spec?.description, !description.isEmpty {
                    Text(description)
                        .font(.subheadline)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .fixedSize(horizontal: false, vertical: true)
                }
                InfoRow(label: "规格版本", value: "r\(robot.spec.revision)")
                if let roots = spec?.capability?.workspaceRoots, !roots.isEmpty {
                    InfoRow(label: "工作目录", value: roots.joined(separator: "、"))
                }
            }
        }
    }

    private var missionCard: some View {
        TomatoCard(padding: 18) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "任务")
                Text(spec?.goal.mission ?? "还没有任务说明。")
                    .font(.subheadline)
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .fixedSize(horizontal: false, vertical: true)
                let criteria = spec?.goal.successCriteria ?? []
                if !criteria.isEmpty {
                    Divider().overlay(TomatoToken.borderL1)
                    SectionHeader(title: "算完成的条件")
                    ForEach(criteria, id: \.self) { line in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "checkmark.circle")
                                .font(.caption)
                                .foregroundStyle(TomatoToken.stateSuccessPrimary)
                            Text(line)
                                .font(.footnote)
                                .foregroundStyle(TomatoToken.labelCaption)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }
        }
    }

    private func controlCard(_ robot: Robot) -> some View {
        TomatoCard(padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "运行")
                TomatoPrimaryButton(
                    title: "运行一次",
                    systemImage: "play.fill",
                    isEnabled: activeRun == nil,
                    isBusy: robotModel.isStarting
                ) {
                    showsStart = true
                }
                if let activeRun {
                    HStack(spacing: 10) {
                        TomatoSecondaryButton(
                            title: "中断",
                            systemImage: "pause.fill",
                            isEnabled: robotModel.busyRunId != activeRun.id
                        ) {
                            Task { await robotModel.interrupt(runId: activeRun.id) }
                        }
                        TomatoSecondaryButton(
                            title: "纠正",
                            systemImage: "text.bubble",
                            isEnabled: robotModel.busyRunId != activeRun.id
                        ) {
                            showsCorrect = true
                        }
                    }
                    TomatoSecondaryButton(
                        title: "取消运行",
                        systemImage: "xmark.circle",
                        isDestructive: true,
                        isEnabled: robotModel.busyRunId != activeRun.id
                    ) {
                        confirmsCancel = true
                    }
                } else {
                    Text("没有正在执行的运行。启动后，这次运行会出现在下面，并可以打开完整对话。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private func currentRunCard(_ run: RobotRun) -> some View {
        TomatoCard(padding: 18) {
            VStack(alignment: .leading, spacing: 11) {
                SectionHeader(title: "这次运行") {
                    HStack(spacing: 8) {
                        Text(relativeTime(run.startedAt))
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelDimmed)
                        StatusPill(text: runStateLabel(run.state), tone: runStateTone(run.state))
                    }
                }
                if let message = RobotConversationRow.trimmed(run.input.message) {
                    RobotUserBubble(text: message, runId: run.id)
                }
                if let output = RobotConversationRow.trimmed(run.output) {
                    RobotAnswerBubble(text: output, lineLimit: 8, runId: run.id)
                } else if let error = RobotConversationRow.trimmed(run.error) {
                    RobotFailureLine(text: error, runId: run.id)
                } else {
                    HStack(spacing: 8) {
                        if run.state == "waiting" {
                            Image(systemName: "pause.circle")
                                .font(.caption)
                                .foregroundStyle(TomatoToken.stateWarnPrimary)
                        } else {
                            RunningDot()
                        }
                        Text(progressText(run.state))
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.labelDimmed)
                    }
                }
                if run.sessionId != nil {
                    NavigationLink(value: run) {
                        Label("打开完整对话", systemImage: "text.book.closed")
                            .font(.footnote.weight(.medium))
                    }
                    .buttonStyle(.plain)
                    .foregroundStyle(TomatoToken.brandPrimary)
                    .accessibilityIdentifier("robot.run.open")
                }
            }
        }
    }

    /// What the live card says while a run has not produced an answer yet.
    private func progressText(_ state: String) -> String {
        switch state {
        case "queued", "leased": "正在排队…"
        case "waiting": "等待你的纠正"
        case "finalizing": "正在收尾…"
        default: "正在处理…"
        }
    }

    private var conversationHistoryCard: some View {
        TomatoCard(padding: 18) {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "历史对话") {
                    Text("\(history.count)")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                if history.isEmpty {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("还没有历史对话。")
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.labelDimmed)
                        Text("运行一次后，你的指令和智能体的回答会留在这里。")
                            .font(.caption)
                            .foregroundStyle(TomatoToken.labelDimmed)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                } else {
                    ForEach(history) { run in
                        if run.sessionId == nil {
                            RobotConversationRow(run: run)
                        } else {
                            NavigationLink(value: run) {
                                RobotConversationRow(run: run)
                            }
                            .buttonStyle(.plain)
                            .accessibilityIdentifier("robot.run.\(run.id)")
                            .accessibilityHint("查看这次运行的完整对话")
                        }
                        if run.id != history.last?.id {
                            Divider().overlay(TomatoToken.borderL1)
                        }
                    }
                }
            }
        }
    }
}
