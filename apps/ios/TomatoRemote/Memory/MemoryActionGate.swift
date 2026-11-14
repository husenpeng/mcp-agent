//
//  MemoryActionGate.swift
//  Tomato Remote
//
//  Which memory row may act on the Host right now.
//

import Foundation

/// One-at-a-time gate for the confirm and delete actions on memory rows.
///
/// A mutation over a slow link leaves its row where it was. A second tap would
/// send the same request twice, and once the response reflows the list a tap
/// aimed at the vanished row can land on its neighbour's delete. The gate
/// therefore closes for the whole mutation and for a short settle window after
/// the list has been replaced.
struct MemoryActionGate: Equatable {
    /// The two mutations a memory row offers.
    enum Action: Equatable {
        case confirm
        case forget
    }

    /// Row whose request is in flight, if any.
    private(set) var busyId: String?
    /// Which action that row is running.
    private(set) var busyAction: Action?
    /// Whether the list is still settling after the last response.
    private(set) var isSettling = false

    /// Whether every row action must ignore input.
    var blocksInput: Bool {
        busyId != nil || isSettling
    }

    /// Close the gate for one row action.
    /// - Parameters:
    ///   - id: record the action targets.
    ///   - action: action being sent.
    /// - Returns: whether the action may start.
    mutating func begin(_ id: String, _ action: Action) -> Bool {
        guard !blocksInput else { return false }
        busyId = id
        busyAction = action
        return true
    }

    /// The request finished; keep input closed until the list has settled.
    mutating func finish() {
        busyId = nil
        busyAction = nil
        isSettling = true
    }

    /// The list settled; actions may start again.
    mutating func settle() {
        isSettling = false
    }
}
