//
//  HomeModel.swift
//  Tomato Remote
//
//  What the phone can say about today without opening a conversation: the
//  Host's daily recap, the tasks it still considers open, and the reminders it
//  will run.
//
//  Both Host surfaces are optional plugins, so an unavailable one is a stated
//  empty case rather than an error.
//

import SwiftUI

@MainActor
final class HomeModel: ObservableObject {
    @Published private(set) var insights: InsightsSnapshot?
    @Published private(set) var schedules: [ScheduleEntry] = []
    /// Goal of the newest Session that has one, so the phone can show progress.
    @Published private(set) var goal: GoalProgress?
    @Published private(set) var isLoading = false
    /// Set when the Host has no insights plugin, which is a configuration fact.
    @Published private(set) var insightsUnavailable = false
    @Published private(set) var schedulesUnavailable = false
    @Published var errorMessage: String?

    private var hub: HubClient?

    /// Point the model at the paired Host.
    /// - Parameters:
    ///   - hub: client for the Host, or nil before pairing.
    ///   - sessions: the list the goal lookup follows, newest first.
    func start(hub: HubClient?, sessions: [SessionSummary] = []) {
        self.hub = hub
        summaries = sessions.sorted { $0.updatedAt > $1.updatedAt }
        guard hub != nil else { return }
        // A tab return inside the window reuses the cards already shown; the
        // refresh control and `refresh()` still read on demand.
        if let lastRefresh, Date().timeIntervalSince(lastRefresh) < Self.freshness {
            return
        }
        Task { await refresh() }
    }

    /// Seconds the cards stay valid for an appearance-driven refresh.
    private static let freshness: TimeInterval = 30
    /// When the last complete read landed.
    private var lastRefresh: Date?

    /// Replace the Session order the goal lookup follows, without re-reading.
    /// - Parameter sessions: the list the app currently shows.
    func follow(_ sessions: [SessionSummary]) {
        summaries = sessions.sorted { $0.updatedAt > $1.updatedAt }
    }

    /// Re-read both surfaces.
    func refresh() async {
        guard let hub else { return }
        isLoading = true
        defer { isLoading = false }
        AppLog.mark("刷新")
        let started = CFAbsoluteTimeGetCurrent()
        do {
            insights = try await hub.insightsSnapshot()
            insightsUnavailable = false
            errorMessage = nil
        } catch HubError.notFound {
            insights = nil
            insightsUnavailable = true
        } catch {
            insightsUnavailable = false
            errorMessage = describe(error)
            AppLog.warning(.network, "今天摘要读取失败", detail: describe(error))
        }
        await readGoal(hub: hub)
        do {
            schedules = try await hub.scheduleCatalog()
            schedulesUnavailable = false
        } catch HubError.notFound {
            schedules = []
            schedulesUnavailable = true
        } catch {
            schedulesUnavailable = false
            AppLog.warning(.network, "定时任务读取失败", detail: describe(error))
        }
        AppLog.debug(
            .ui,
            "今天刷新完成",
            detail: "\(Int(((CFAbsoluteTimeGetCurrent() - started) * 1000).rounded())) ms · \(openTasks.count) 个待办 · \(upcoming.count) 个提醒"
        )
        if errorMessage == nil {
            lastRefresh = Date()
        }
    }

    /// Read the goal of the newest active Session, if any.
    private func readGoal(hub: HubClient) async {
        goal = nil
        let candidates = summaries.prefix(5).filter { $0.origin != "subagent" && !$0.isRobotRun }
        // The list already carries a projection hint block; a goal inside it
        // costs no round trip at all.
        for summary in candidates {
            if let parsed = GoalProgress(projection: summary.projections?.values?["goal"]) {
                goal = parsed
                return
            }
        }
        // Hints can predate the goal write. Ask the Host for the Sessions whose
        // hint lacks one, in parallel: five sequential round trips here were the
        // single largest cost of a 今天 refresh.
        goal = await withTaskGroup(of: (Int, GoalProgress?).self) { group in
            for (index, summary) in candidates.enumerated() {
                group.addTask {
                    guard let value = try? await hub.projections(sessionId: summary.sessionId) else {
                        return (index, nil)
                    }
                    return (index, GoalProgress(projection: value["values"]?["goal"]))
                }
            }
            var best: (Int, GoalProgress)?
            for await (index, parsed) in group {
                guard let parsed else { continue }
                if best.map({ index < $0.0 }) ?? true {
                    best = (index, parsed)
                }
            }
            return best?.1
        }
    }

    /// Sessions the summary ranks, so the goal lookup follows the same order.
    private var summaries: [SessionSummary] = []

    /// Tasks the Host still believes are open, from the newest analysis.
    var openTasks: [UnfinishedTask] {
        insights?.unfinished?.tasks ?? []
    }

    /// Reminders still active, soonest first.
    var upcoming: [ScheduleEntry] {
        schedules.filter(\.isActive).sorted { ($0.nextDue ?? .distantFuture) < ($1.nextDue ?? .distantFuture) }
    }
}
