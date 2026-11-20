//
//  StreamRetry.swift
//  Tomato Remote
//
//  How long a dropped event stream waits before it opens again.
//
//  Every long-lived stream — approvals, robots, rooms — drops when the Host
//  restarts, changes port, or the network moves. The first attempts run within
//  seconds, because those recoveries are common and the screen should come back
//  quickly. After that the stream is probed once a minute instead: a stream that
//  gave up entirely left the phone showing "离线" with no way back until the app
//  was backgrounded and resumed, while the Host had been answering the whole
//  time.
//

import Foundation

/// Retry timing every long-lived stream shares.
enum StreamRetry {
    /// Attempts that run at short intervals before the slow cadence starts.
    static let quickAttempts = 5
    /// Wait between attempts once the quick ones are spent.
    static let slowInterval: TimeInterval = 60
    /// Wait added per quick attempt.
    private static let quickStep: TimeInterval = 1.5

    /// Wait before retry number `attempt`, where 1 is the first retry.
    /// - Parameter attempt: retries already spent on this stream.
    /// - Returns: seconds to sleep before opening the socket again.
    static func pause(afterAttempt attempt: Int) -> TimeInterval {
        guard attempt > 0 else { return 0 }
        guard attempt > quickAttempts else { return quickStep * Double(attempt) }
        return slowInterval
    }

    /// Line a screen shows while its stream is down.
    /// - Parameter attempt: retries already spent on this stream.
    /// - Returns: copy that stays true once the quick attempts are spent.
    static func status(attempt: Int) -> String {
        attempt <= quickAttempts
            ? "连接中断，正在重试（\(attempt)/\(quickAttempts)）…"
            : "连接中断，每分钟重试一次…"
    }
}
