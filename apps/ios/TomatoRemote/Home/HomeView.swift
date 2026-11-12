//
//  HomeView.swift
//  Tomato Remote
//
//  The first screen: what the Host worked on today, what it says is still open,
//  and which reminders will run next.
//

import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var interactions: InteractionCenter
    @StateObject private var home = HomeModel()
    @State private var showsPending = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    CaptionFallback(caption: "Mac 上今天做了什么、还剩什么，由 Host 归纳。")

                    if let error = home.errorMessage {
                        ErrorBanner(message: error) { Task { await home.refresh() } }
                    }

                    if interactions.hasPending {
                        pendingCard
                    }

                    NavigationLink {
                        PhoneView()
                    } label: {
                        TomatoCard(padding: 16) {
                            VStack(alignment: .leading, spacing: 6) {
                                SectionHeader(title: "这台手机") {
                                    Text("Runner")
                                        .font(.caption)
                                        .foregroundStyle(TomatoToken.labelDimmed)
                                }
                                Text("读取屏幕、点击与输入都由手机上的 Runner 执行；点进来看状态与本机配对。")
                                    .font(.caption)
                                    .foregroundStyle(TomatoToken.labelCaption)
                            }
                        }
                    }
                    .buttonStyle(.plain)

                    if let goal = home.goal {
                        goalCard(goal)
                    }

                    recapCard
                    openTasksCard
                    schedulesCard
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 28)
            }
            .background(TomatoToken.bgBase)
            .tomatoPageTitle("今天", caption: "Mac 上今天做了什么、还剩什么，由 Host 归纳。")
            .navigationBarTitleDisplayMode(.large)
            .tomatoScrollEdge()
            .refreshable {
                await model.refreshSessions()
                home.follow(model.sessions)
                await home.refresh()
            }
            .sheet(isPresented: $showsPending) {
                InteractionSheet(center: interactions)
                    .tomatoSheet()
            }
            .task {
                AppLog.screen("今天")
                // The goal lookup follows the newest Sessions, so the list has to
                // exist before the model captures it.
                if model.sessions.isEmpty {
                    await model.refreshSessions()
                }
                home.start(hub: model.hub, sessions: model.sessions)
            }
        }
    }

    // MARK: Cards

    /// Requests the Host is holding for a person right now.
    private var pendingCard: some View {
        Button {
            showsPending = true
        } label: {
            TomatoCard(padding: 16) {
                HStack(spacing: 10) {
                    Image(systemName: "bell.badge.fill")
                        .foregroundStyle(TomatoToken.brandPrimary)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Agent 在等你")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(TomatoToken.labelPrimary)
                        Text(interactions.pending.first?.summary ?? "")
                            .font(.caption)
                            .foregroundStyle(TomatoToken.labelCaption)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 6)
                    Text("\(interactions.pending.count)")
                        .font(.caption.monospacedDigit())
                        .foregroundStyle(TomatoToken.labelDimmed)
                    Image(systemName: "chevron.right")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("interactions.banner")
    }

    /// The goal of the Session the reader last opened, when it has one.
    private func goalCard(_ goal: GoalProgress) -> some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "当前目标") {
                    StatusPill(text: goal.phaseText, tone: goal.phase == "blocked" ? .error : goal.phase == "complete" ? .ok : .info)
                }
                Text(goal.objective)
                    .font(.callout)
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .fixedSize(horizontal: false, vertical: true)
                Text(goal.maxGoalRounds.map { "第 \(goal.roundsStarted) / \($0) 轮" } ?? "第 \(goal.roundsStarted) 轮")
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelCaption)
            }
        }
    }

    /// What the Host worked on today.
    private var recapCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "今日回顾") {
                    if home.isLoading {
                        ProgressView().controlSize(.small)
                    }
                }
                if home.insightsUnavailable {
                    Text("Host 没有开启「Memory and goal focus」插件包，所以没有每日回顾。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .fixedSize(horizontal: false, vertical: true)
                } else if let recap = home.insights?.recap {
                    if !recap.headline.isEmpty {
                        Text(recap.headline)
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(TomatoToken.labelPrimary)
                    }
                    if !recap.summary.isEmpty {
                        Text(recap.summary)
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.labelCaption)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    ForEach(recap.workItems.prefix(4), id: \.problem) { item in
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: statusIcon(item.status))
                                .font(.caption)
                                .foregroundStyle(statusTone(item.status))
                                .padding(.top, 2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.problem)
                                    .font(.footnote.weight(.medium))
                                    .foregroundStyle(TomatoToken.labelPrimary)
                                    .fixedSize(horizontal: false, vertical: true)
                                if !item.conclusion.isEmpty {
                                    Text(item.conclusion)
                                        .font(.caption)
                                        .foregroundStyle(TomatoToken.labelCaption)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                            Spacer(minLength: 0)
                        }
                    }
                    if let count = recap.messageCount, count > 0 {
                        Text("\(count) 条消息 · \(recap.day)")
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelDimmed)
                    }
                } else {
                    Text("今天还没有可以归纳的会话。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                }
            }
        }
    }

    /// Tasks the Host still considers open.
    private var openTasksCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "未完成") {
                    Text("\(home.openTasks.count) 项")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                if home.openTasks.isEmpty {
                    Text("Host 没有报告未完成的任务。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                } else {
                    ForEach(home.openTasks.prefix(6)) { task in
                        VStack(alignment: .leading, spacing: 2) {
                            HStack(spacing: 6) {
                                Image(systemName: task.status == "in_progress" ? "circle.dotted" : "circle")
                                    .font(.caption)
                                    .foregroundStyle(task.status == "in_progress" ? TomatoToken.stateBusinessPrimary : TomatoToken
                                        .labelDimmed)
                                Text(task.title)
                                    .font(.footnote.weight(.medium))
                                    .foregroundStyle(TomatoToken.labelPrimary)
                                    .lineLimit(2)
                            }
                            if !task.detail.isEmpty {
                                Text(task.detail)
                                    .font(.caption)
                                    .foregroundStyle(TomatoToken.labelCaption)
                                    .lineLimit(2)
                                    .padding(.leading, 18)
                            }
                        }
                    }
                }
            }
        }
    }

    /// Reminders that will run next.
    private var schedulesCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "定时任务") {
                    NavigationLink("全部") {
                        SchedulesView(home: home)
                    }
                    .font(.caption.weight(.medium))
                    .foregroundStyle(TomatoToken.brandPrimary)
                }
                if home.schedulesUnavailable {
                    Text("Host 上没有定时任务服务。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                } else if home.upcoming.isEmpty {
                    Text("没有进行中的定时任务。可以在会话里让 Agent 建一个。")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .fixedSize(horizontal: false, vertical: true)
                } else {
                    ForEach(home.upcoming.prefix(3)) { entry in
                        HStack(spacing: 8) {
                            Image(systemName: "clock.arrow.circlepath")
                                .font(.caption)
                                .foregroundStyle(TomatoToken.brandPrimary)
                            VStack(alignment: .leading, spacing: 1) {
                                Text(entry.title)
                                    .font(.footnote.weight(.medium))
                                    .foregroundStyle(TomatoToken.labelPrimary)
                                    .lineLimit(1)
                                Text(entry.recurrence ?? (entry.nextDue?.formatted(date: .omitted, time: .shortened) ?? ""))
                                    .font(.caption2)
                                    .foregroundStyle(TomatoToken.labelCaption)
                            }
                            Spacer(minLength: 0)
                        }
                    }
                }
            }
        }
    }

    private func statusIcon(_ status: String) -> String {
        switch status {
        case "done": "checkmark.circle.fill"
        case "blocked": "exclamationmark.circle.fill"
        case "ongoing": "circle.dotted"
        default: "circle"
        }
    }

    private func statusTone(_ status: String) -> Color {
        switch status {
        case "done": TomatoToken.stateSuccessPrimary
        case "blocked": TomatoToken.stateErrorPrimary
        case "ongoing": TomatoToken.stateBusinessPrimary
        default: TomatoToken.labelDimmed
        }
    }
}
