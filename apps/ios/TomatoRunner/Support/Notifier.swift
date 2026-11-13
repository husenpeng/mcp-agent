//
//  Notifier.swift
//  Tomato Runner
//
//  A test runner cannot show a window, so pairing and confirmation requests are
//  delivered as notifications with actions. This is the only surface the person
//  holding the phone can answer while another app is in front.
//

import Foundation
import UserNotifications

/// Notification categories and their action identifiers.
enum Notifier {
    static let pairingCategory = "TOMATO_PAIR_REQUEST"
    static let allowAction = "TOMATO_ALLOW"
    static let denyAction = "TOMATO_DENY"

    /// Register the categories the runner posts.
    /// @param center - notification center owned by the runner process.
    static func register(center: UNUserNotificationCenter) {
        let allow = UNNotificationAction(identifier: allowAction, title: "允许", options: [])
        let deny = UNNotificationAction(identifier: denyAction, title: "拒绝", options: [.destructive])
        let category = UNNotificationCategory(
            identifier: pairingCategory,
            actions: [allow, deny],
            intentIdentifiers: [],
            options: []
        )
        center.setNotificationCategories([category])
    }

    /// Ask the owner to allow control by an application on this device.
    static func postPairingRequest() {
        let content = UNMutableNotificationContent()
        content.title = "Tomato 请求控制这台 iPhone"
        content.body = "允许后，Tomato 可以读取屏幕并点击；你可以随时在通知里停止。"
        content.categoryIdentifier = pairingCategory
        content.interruptionLevel = .timeSensitive
        let request = UNNotificationRequest(identifier: "tomato.pair", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
        Log.shared.append("pairing request posted")
    }

    /// Ask the owner to allow one risky action.
    /// @param reason - why the action needs a person.
    static func postConfirmation(reason: String) {
        let content = UNMutableNotificationContent()
        content.title = "Tomato 需要确认"
        content.body = reason
        content.categoryIdentifier = pairingCategory
        content.interruptionLevel = .timeSensitive
        let request = UNNotificationRequest(identifier: "tomato.confirm", content: content, trigger: nil)
        UNUserNotificationCenter.current().add(request)
    }
}

/// A process-wide stop flag the server sets when it is asked to stop.
enum RunnerExit {
    private static let lock = NSLock()
    private static var requested = false

    /// Ask the run loop to return so XCTest can finish.
    static func request() {
        lock.lock()
        requested = true
        lock.unlock()
    }

    static var isRequested: Bool {
        lock.lock()
        defer { lock.unlock() }
        return requested
    }
}
