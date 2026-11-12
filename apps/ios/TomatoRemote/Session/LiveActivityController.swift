//
//  LiveActivityController.swift
//  Tomato Remote
//
//  The Dynamic Island and Lock Screen view of one running Session.
//
//  A Live Activity is the only place iOS lets a backgrounded app keep something
//  on screen, and it updates only while this process runs: the Host has no push
//  capability, so nothing refreshes an island after the system suspends the app.
//  The activity therefore starts when a turn starts and ends shortly after the
//  Session stops running.
//

import ActivityKit
import Foundation

@MainActor
final class LiveActivityController {
    /// The activity this app started, if any.
    private var activity: Activity<TomatoRunAttributes>?

    /// Whether an activity is already on screen for this app.
    var isActive: Bool {
        activity != nil
    }

    /// Whether this device can show Live Activities at all.
    var isSupported: Bool {
        ActivityAuthorizationInfo().areActivitiesEnabled
    }

    /// Begin following one Session, replacing any activity left from another.
    /// - Parameters:
    ///   - sessionId: Session being watched.
    ///   - title: conversation title shown in the island.
    ///   - detail: first line of state.
    func begin(sessionId: String, title: String, detail: String) async {
        guard isSupported, activity == nil else { return }
        do {
            activity = try Activity.request(
                attributes: TomatoRunAttributes(sessionId: sessionId, title: title),
                content: .init(state: .init(detail: detail, running: true, pending: 0), staleDate: Date().addingTimeInterval(900)),
                pushType: nil
            )
        } catch {
            // A Host without the entitlement or a user who denied Live Activities
            // simply gets no island; the conversation still works.
            activity = nil
            AppLog.warning(.ui, "灵动岛活动未能开始", detail: describe(error))
        }
    }

    /// Replace the shown state.
    /// - Parameters:
    ///   - running: whether the Session still works.
    ///   - detail: one short line of progress.
    ///   - pending: count of requests waiting on the owner.
    func update(running: Bool, detail: String, pending: Int) async {
        guard let activity else { return }
        await activity.update(.init(
            state: .init(detail: detail, running: running, pending: pending),
            staleDate: Date().addingTimeInterval(900)
        ))
    }

    /// End the activity and forget it.
    func end() async {
        guard let activity else { return }
        self.activity = nil
        await activity.end(nil, dismissalPolicy: .immediate)
    }
}
