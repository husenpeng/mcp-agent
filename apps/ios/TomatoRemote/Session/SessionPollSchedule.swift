//
//  SessionPollSchedule.swift
//  Tomato Remote
//
//  How long the Session list waits before it reads again.
//
//  The list follows the Host's own notifications, so a plain read only repairs
//  what a dropped stream never delivered. While the Host answers that costs one
//  round trip a minute. While it does not, the wait doubles: a phone left on a
//  dead pairing read 2352 times and wrote 4704 error lines over a day and a half
//  without learning anything the first failure had not already said.
//

import Foundation

/// Cadence of the list's repair read.
enum SessionPollSchedule {
    /// Wait after a read that succeeded.
    static let healthy: TimeInterval = 60
    /// Wait after the first failed read.
    static let firstFailure: TimeInterval = 60
    /// Longest wait between failed reads.
    static let cap: TimeInterval = 600

    /// Wait before the next read.
    /// - Parameter failures: failed reads since the last success.
    /// - Returns: seconds to wait.
    static func pause(afterConsecutiveFailures failures: Int) -> TimeInterval {
        guard failures > 0 else { return healthy }
        let doubled = firstFailure * pow(2, Double(min(failures - 1, 6)))
        return min(cap, doubled)
    }
}
