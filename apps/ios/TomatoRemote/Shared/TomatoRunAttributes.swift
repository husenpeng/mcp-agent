//
//  TomatoRunAttributes.swift
//  TomatoRemoteWidgets
//
//  Shared by the app and its Live Activity widget: the identity and the facts
//  one long-running Session shows while the app is away.
//

import ActivityKit
import Foundation

/// Live Activity attributes of one running Session.
struct TomatoRunAttributes: ActivityAttributes {
    /// What the activity shows at any moment.
    struct ContentState: Codable, Hashable {
        /// One short line about what the Agent is doing, or empty.
        var detail: String
        /// Whether the Session is still running.
        var running: Bool
        /// Answerable requests waiting on the owner.
        var pending: Int
    }

    /// Session the activity follows.
    let sessionId: String
    /// Conversation title, shown in the island.
    let title: String
}
