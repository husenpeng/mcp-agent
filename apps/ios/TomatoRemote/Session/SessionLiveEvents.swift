//
//  SessionLiveEvents.swift
//  Tomato Remote
//
//  What the Host announces about its Sessions, folded into the rows on screen.
//
//  The Host forwards one notification per Session change over the event stream
//  the approval cards already listen to. Each one names a single Session and
//  carries the value the list endpoint would have returned for it, so a row is
//  corrected in place instead of every row being read again.
//

import Foundation

/// The Host's Session notifications, folded into the rows the list shows.
enum SessionLiveEvents {
    /// Apply one notification to the rows.
    /// - Parameters:
    ///   - event - forwarded event name.
    ///   - args - the Host's positional arguments, in its own order.
    ///   - rows - rows currently on screen, newest first.
    /// - Returns: the rows after the notification, or nil when it leaves them as they are.
    static func apply(
        event: String,
        args: [JSONValue],
        to rows: [SessionSummary]
    ) -> [SessionSummary]? {
        switch event {
        case "api-session/status":
            guard let sessionId = args.first?.stringValue,
                  let running = args.dropFirst().first?.boolValue,
                  let index = rows.firstIndex(where: { $0.sessionId == sessionId }),
                  rows[index].running != running
            else { return nil }
            var next = rows
            next[index].running = running
            return next
        case "api-session/added":
            guard let summary = args.first?.decoded(SessionSummary.self) else { return nil }
            return upserting(rows, summary)
        case "api-session/removed":
            guard let sessionId = args.first?.stringValue,
                  rows.contains(where: { $0.sessionId == sessionId })
            else { return nil }
            return rows.filter { $0.sessionId != sessionId }
        case "api-session/activity":
            guard let sessionId = args.first?.stringValue,
                  let updatedAt = args.dropFirst().first?.doubleValue,
                  let index = rows.firstIndex(where: { $0.sessionId == sessionId }),
                  rows[index].updatedAt < updatedAt
            else { return nil }
            var next = rows
            next[index].updatedAt = updatedAt
            return newestFirst(next)
        default:
            // The forwarded set is merge-extensible: a newer Host may announce
            // something this build has no row for, and the list stays usable.
            return nil
        }
    }

    /// Replace or add the row a Host summary names.
    ///
    /// An Agent attaching or releasing re-announces the whole row, so its
    /// availability, blank flag, and title all arrive together.
    private static func upserting(_ rows: [SessionSummary], _ summary: SessionSummary) -> [SessionSummary]? {
        var next = rows
        guard let index = next.firstIndex(where: { $0.sessionId == summary.sessionId }) else {
            next.append(summary)
            return newestFirst(next)
        }
        guard next[index] != summary else { return nil }
        next[index] = summary
        return newestFirst(next)
    }

    private static func newestFirst(_ rows: [SessionSummary]) -> [SessionSummary] {
        rows.sorted { $0.updatedAt > $1.updatedAt }
    }
}
