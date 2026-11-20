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
    @State private var showsMemory = false

    var body: some View {
        NavigationStack {
            List {
                if let error = home.errorMessage {
                    ErrorBanner(message: error) { Task { await home.refresh() } }
                        .listRowInsets(EdgeInsets(top: 4, leading: 20, bottom: 4, trailing: 20))
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }

                if interactions.hasPending {
                    Section {
                        pendingRow
                    }
                }

                if let recap = home.insights?.recap, !recap.headline.isEmpty || !recap.summary.isEmpty {
                    header(recap)
                        .listRowInsets(EdgeInsets(top: 2, leading: 20, bottom: 4, trailing: 20))
                        .listRowBackground(Color.clear)
                        .listRowSeparator(.hidden)
                }

                // The goal is one fact about one Session: it stays a card because
                // there is never a list of it to trim.
                if let goal = home.goal {
                    Section {
                        goalCard(goal)
                            .listRowInsets(EdgeInsets(top: 2, leading: 20, bottom: 2, trailing: 20))
                            .listRowBackground(Color.clear)
                            .listRowSeparator(.hidden)
                    }
                }

                Section {
                    if home.insightsUnavailable {
                        note("Host 没有开启「Memory and goal focus」插件包，所以没有每日回顾。")
                    } else if let recap = home.insights?.recap {
                        ForEach(visible(recap.workItems, showsAll: showsAllRecap), id: \.problem) { item in
                            workItemRow(item)
                        }
                        toggleRow(
                            shown: visible(recap.workItems, showsAll: showsAllRecap).count,
                            total: recap.workItems.count,
                            showsAll: $showsAllRecap,
                            identifier: "home.recap.more"
                        )
                    } else {
                        note(home.isLoading ? "正在读今天的会话……" : "今天还没有可以归纳的会话。")
                    }
                } header: {
                    sectionHeader("今日回顾", trailing: anySuffix(home.insights?.recap))
                }

                Section {
                    if home.openTasks.isEmpty {
                        note("Host 没有报告未完成的任务。")
                    } else {
                        ForEach(visible(home.openTasks, showsAll: showsAllTasks)) { task in
                            openTaskRow(task)
                        }
                        toggleRow(
                            shown: visible(home.openTasks, showsAll: showsAllTasks).count,
                            total: home.openTasks.count,
                            showsAll: $showsAllTasks,
                            identifier: "home.tasks.more"
                        )
                    }
                } header: {
                    sectionHeader("未完成", trailing: home.openTasks.isEmpty ? nil : "\(home.openTasks.count) 项")
                }

                Section {
                    if home.schedulesUnavailable {
                        note("Host 上没有定时任务服务。")
                    } else if home.upcoming.isEmpty {
                        note("没有进行中的定时任务。可以在会话里让 Agent 建一个。")
                    } else {
                        ForEach(visible(home.upcoming, showsAll: showsAllSchedules)) { entry in
                            scheduleRow(entry)
                        }
                        toggleRow(
                            shown: visible(home.upcoming, showsAll: showsAllSchedules).count,
                            total: home.upcoming.count,
                            showsAll: $showsAllSchedules,
                            identifier: "home.schedules.more"
                        )
                    }
                } header: {
                    sectionHeader("定时任务") {
                        NavigationLink("全部") {
                            SchedulesView(home: home)
                        }
                        .font(.caption.weight(.medium))
                        .foregroundStyle(TomatoToken.brandPrimary)
                    }
                }

                Section {
                    memoryRow
                }
            }
            .listStyle(.plain)
            .scrollContentBackground(.hidden)
            .listSectionSpacing(6)
            .environment(\.defaultMinListRowHeight, 1)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                // The ball and the palette float over the page; without a reserved
                // strip the last section would end under them.
                Color.clear.frame(height: Self.bottomClearance)
            }
            .background(TomatoSurface.page)
            // No page title: the tab ball already names the destination, and a
            // title line spent the first rows on words instead of content.
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .tomatoScrollEdge()
            .tomatoFloatingTabs()
            .refreshable {
                await model.refreshSessions()
                home.follow(model.sessions)
                await home.refresh()
            }
            .sheet(isPresented: $showsPending) {
                InteractionSheet(center: interactions)
                    .tomatoSheet()
            }
            .navigationDestination(isPresented: $showsMemory) {
                MemoryView()
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

    // MARK: Header

    /// Today's headline and summary, as a gradient hero card opening the list.
    ///
    /// The page carries no title of its own: the recap opens the content
    /// directly. A tracked eyebrow label and a display-size headline give the
    /// one hero treatment per screen; the accent stays a wash behind the words.
    /// - Parameter recap: the Host's recap of today.
    private func header(_ recap: DailyRecap) -> some View {
        TomatoHero {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(TomatoToken.brandPrimary)
                    Text("今天 · 每日摘要")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(TomatoToken.brandPrimary)
                }
                .accessibilityHidden(true)
                if !recap.headline.isEmpty {
                    Text(recap.headline)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .lineLimit(3)
                        .fixedSize(horizontal: false, vertical: true)
                }
                if !recap.summary.isEmpty {
                    Text(recap.summary)
                        .font(.subheadline)
                        .foregroundStyle(TomatoToken.labelSecondary)
                        .lineLimit(3)
                        .lineSpacing(2)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
        .accessibilityIdentifier("home.header")
    }

    // MARK: Truncation

    /// Rows a collapsed section shows before its "查看全部" row.
    private static let collapsedRows = 3
    /// A placeholder's height plus the ball above the bottom safe area.
    private static let bottomClearance: CGFloat = 96

    /// Whether 今日回顾 lists every work item.
    @State private var showsAllRecap = false
    /// Whether 未完成 lists every open task.
    @State private var showsAllTasks = false
    /// Whether 定时任务 lists every reminder.
    @State private var showsAllSchedules = false

    /// The rows one section shows right now.
    ///
    /// Only this page uses the rule, so it stays here rather than in the model.
    /// - Parameters:
    ///   - items: all rows the section has.
    ///   - showsAll: true once the reader asked for the rest.
    /// - Returns: every row, or the leading ones while collapsed.
    private func visible<T>(_ items: [T], showsAll: Bool) -> ArraySlice<T> {
        showsAll ? items[...] : items.prefix(Self.collapsedRows)
    }

    // MARK: Rows

    /// The 查看全部 / 收起 control, shown only when a section has hidden rows.
    /// - Parameters:
    ///   - shown: how many rows the section shows.
    ///   - total: how many rows it has.
    ///   - showsAll: binding the control flips.
    ///   - identifier: accessibility identifier for a UI test.
    /// - Returns: the control row, or nothing when every row already shows.
    @ViewBuilder
    private func toggleRow(shown: Int, total: Int, showsAll: Binding<Bool>, identifier: String) -> some View {
        if total > shown || showsAll.wrappedValue {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    showsAll.wrappedValue.toggle()
                }
            } label: {
                HStack(spacing: 4) {
                    Text(showsAll.wrappedValue ? "收起" : "查看全部 \(total) 项")
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(TomatoToken.brandPrimary)
                    Image(systemName: showsAll.wrappedValue ? "chevron.up" : "chevron.down")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(TomatoToken.brandPrimary)
                    Spacer(minLength: 0)
                }
                .frame(minHeight: 44)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier(identifier)
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
            .listRowInsets(Self.rowInsets)
        }
    }

    /// Section title with an optional count or link on the trailing edge.
    /// - Parameters:
    ///   - title: section name.
    ///   - trailing: caption to show beside the name, or nil.
    /// - Returns: the header, sized like every other list header in the app.
    private func sectionHeader(_ title: String, trailing: String? = nil) -> some View {
        sectionHeader(title) {
            if let trailing {
                Text(trailing)
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(TomatoToken.labelCaption)
            }
        }
    }

    /// Section title with an accessory on the trailing edge.
    /// - Parameters:
    ///   - title: section name.
    ///   - accessory: the trailing view.
    /// - Returns: the header the list draws above its rows.
    private func sectionHeader<Accessory: View>(
        _ title: String,
        @ViewBuilder accessory: () -> Accessory
    ) -> some View {
        HStack {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(TomatoToken.labelPrimary)
                .accessibilityAddTraits(.isHeader)
            Spacer(minLength: 6)
            accessory()
        }
        .textCase(nil)
        .padding(.horizontal, 4)
        .accessibilityElement(children: .contain)
    }

    /// Suffix 今日回顾 carries: how many messages the Host summarized, and the
    /// day they belong to.
    /// - Parameter recap: the Host's recap, when it has one.
    /// - Returns: the caption, or nil when there is nothing to count.
    private func anySuffix(_ recap: DailyRecap?) -> String? {
        guard let recap, let count = recap.messageCount, count > 0 else { return nil }
        return "\(count) 条消息 · \(recap.day)"
    }

    /// One row of the list: a sentence, or a stated empty case.
    /// - Parameter text: what the row says.
    /// - Returns: the row.
    private func note(_ text: String) -> some View {
        Text(text)
            .font(.footnote)
            .foregroundStyle(TomatoToken.labelCaption)
            .fixedSize(horizontal: false, vertical: true)
            .listRowBackground(Color.clear)
            .listRowSeparator(.hidden)
            .listRowInsets(Self.rowInsets)
    }

    /// Where the list pads every row that is not a card.
    private static let rowInsets = EdgeInsets(top: 1, leading: 20, bottom: 1, trailing: 20)

    // MARK: Cards

    /// The way into the memory store: the same action-entry card as pending
    /// interactions and running sessions, so the three doors read as one family.
    private var memoryRow: some View {
        Button {
            showsMemory = true
        } label: {
            TomatoActionEntry(
                systemImage: "brain.head.profile",
                title: "个人记忆",
                subtitle: "偏好、习惯和事实，由 Agent 记住并在这里确认。"
            )
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("home.memory")
        .listRowInsets(EdgeInsets(top: 4, leading: 20, bottom: 4, trailing: 20))
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
    }

    /// Requests the Host is holding for a person right now.
    private var pendingRow: some View {
        Button {
            showsPending = true
        } label: {
            TomatoActionEntry(
                systemImage: "bell.badge.fill",
                title: "Agent 在等你",
                subtitle: interactions.pending.first?.summary,
                badge: "\(interactions.pending.count)"
            )
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("interactions.banner")
        .listRowInsets(EdgeInsets(top: 2, leading: 20, bottom: 2, trailing: 20))
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
    }

    /// The goal of the Session the reader last opened, when it has one.
    private func goalCard(_ goal: GoalProgress) -> some View {
        TomatoCard(padding: 14) {
            VStack(alignment: .leading, spacing: 8) {
                SectionHeader(title: "当前目标") {
                    StatusPill(text: goal.phaseText, tone: goal.phase == "blocked" ? .error : goal.phase == "complete" ? .ok : .active)
                }
                Text(goal.objective)
                    .font(.subheadline)
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .lineLimit(3)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
                GoalRoundsProgress(roundsStarted: goal.roundsStarted, maxGoalRounds: goal.maxGoalRounds)
            }
        }
    }

    /// One item the Host worked on today, whose headline and summary the header
    /// already carries.
    /// - Parameter item: the Host's work item.
    /// - Returns: the row.
    private func workItemRow(_ item: DailyRecap.WorkItem) -> some View {
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
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
        .listRowInsets(Self.rowInsets)
    }

    /// One task the Host still considers open.
    /// - Parameter task: the open task.
    /// - Returns: the row.
    private func openTaskRow(_ task: UnfinishedTask) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 6) {
                Image(systemName: task.status == "in_progress" ? "circle.dotted" : "circle")
                    .font(.caption)
                    .foregroundStyle(task.status == "in_progress" ? TomatoToken.brandPrimary : TomatoToken.labelDimmed)
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
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
        .listRowInsets(Self.rowInsets)
    }

    /// One reminder that will run next.
    /// - Parameter entry: the scheduled task.
    /// - Returns: the row.
    private func scheduleRow(_ entry: ScheduleEntry) -> some View {
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
        .listRowBackground(Color.clear)
        .listRowSeparator(.hidden)
        .listRowInsets(Self.rowInsets)
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
        case "ongoing": TomatoToken.brandPrimary
        default: TomatoToken.labelDimmed
        }
    }
}
