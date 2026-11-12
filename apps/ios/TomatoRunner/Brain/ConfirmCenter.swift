//
//  ConfirmCenter.swift
//  Tomato Runner
//
//  Human approval for one risky step.
//
//  The loop cannot ask through a window — it has none — so it posts a
//  notification and blocks that step until the owner answers or the window
//  closes. A refusal ends the task instead of retrying unattended.
//

import Foundation

/// What the owner is asked to approve.
struct ConfirmRequest {
    let reason: String
    let target: String
    /// One-shot token the risk gate issued for exactly this action.
    let token: String
}

/// Notification-driven approval for the on-device loop.
final class ConfirmCenter: @unchecked Sendable {
    static let shared = ConfirmCenter()

    private let lock = NSCondition()
    private var pending: ConfirmRequest?
    private var decision: String?
    private var requestedAt: Date?

    /// Post the question and wait for the answer.
    /// @param prompt - what the runner refused and the token that authorizes it.
    /// @param timeout - seconds the owner has to answer.
    /// @returns the token when allowed, nil when refused or timed out.
    func await(prompt: ConfirmRequest, timeout: TimeInterval = 60) -> String? {
        lock.lock()
        pending = prompt
        decision = nil
        requestedAt = Date()
        lock.unlock()
        Notifier.postConfirmation(reason: "\(prompt.reason)（\(prompt.target)）")
        let deadline = Date().addingTimeInterval(timeout)
        lock.lock()
        defer { lock.unlock() }
        while decision == nil, Date() < deadline {
            lock.wait(until: Date().addingTimeInterval(0.5))
        }
        let allowed = decision
        pending = nil
        decision = nil
        requestedAt = nil
        return allowed == "allow" ? prompt.token : nil
    }

    /// Settle the current question from a notification action.
    /// @param allowed - whether the owner allowed the step.
    /// @returns whether a question was waiting.
    @discardableResult
    func settle(allowed: Bool) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        guard pending != nil, decision == nil else { return false }
        decision = allowed ? "allow" : "deny"
        lock.broadcast()
        return true
    }
}
