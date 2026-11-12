//
//  UsageJournal.swift
//  Tomato Remote
//
//  What this phone did, kept on this phone.
//
//  A paired device is the only place that knows how its owner actually works:
//  which hours they reach for the agent, which projects they keep open, whether
//  they type or send photos. The Host sees prompts but not the phone. The
//  journal therefore records interaction facts here, and `MemoryDigest`
//  proposes them to the Host's account memory; the phone no longer appends
//  them to a prompt.
//
//  Nothing here is a credential, and nothing here is transmitted on its own.
//  The records never leave the device except as the digest text a person can
//  read and switch off.
//

import Foundation

/// One interaction the phone observed.
struct UsageEvent: Codable, Equatable, Sendable {
    enum Kind: String, Codable, Sendable {
        /// The Session list opened a conversation.
        case opened
        /// A prompt left the composer.
        case prompt
        /// A prompt carried a photo.
        case photo
        /// The Session list created a conversation.
        case created
        /// The owner renamed a conversation.
        case renamed
    }

    let kind: Kind
    /// Unix epoch milliseconds; a wall clock, because the digest groups by hour
    /// of the owner's day rather than by elapsed intervals.
    let at: Double
    /// Folder name of the Session the event belongs to, when it has one.
    var project: String?
    /// Characters the prompt carried, so the digest can tell typed-short from
    /// typed-long without keeping the text.
    var length: Int?

    init(kind: Kind, at: Double = Date().timeIntervalSince1970 * 1000, project: String? = nil, length: Int? = nil) {
        self.kind = kind
        self.at = at
        self.project = project
        self.length = length
    }
}

/// Durable, bounded history of {@link UsageEvent} on this device.
///
/// Records are appended in memory and written back as JSON on every change. The
/// file is not a Session log and needs no migration: a record that fails to
/// decode is dropped, because the digest only ever describes habits.
@MainActor
final class UsageJournal: ObservableObject {
    /// Most events kept. A month of normal use stays well under this, and the
    /// digest reads only the recent window regardless.
    static let capacity = 2000

    @Published private(set) var events: [UsageEvent] = []
    /// Why the last write failed, when it did; the in-memory window is still
    /// usable but does not survive the next launch.
    @Published private(set) var writeError: String?

    private let fileURL: URL

    /// Open the journal next to the app's other state.
    /// - Parameter fileURL: override for tests; the app uses Application Support.
    init(fileURL: URL = UsageJournal.defaultFileURL()) {
        self.fileURL = fileURL
        events = Self.read(fileURL)
    }

    /// Default location: `Application Support/<bundle>/usage-journal.json`.
    /// - Returns: the file the app appends to.
    nonisolated static func defaultFileURL() -> URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        let folder = base.appendingPathComponent("TomatoRemote", isDirectory: true)
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        return folder.appendingPathComponent("usage-journal.json")
    }

    /// Append one event and persist.
    /// - Parameter event: the interaction to remember.
    func record(_ event: UsageEvent) {
        events.append(event)
        if events.count > Self.capacity {
            events.removeFirst(events.count - Self.capacity)
        }
        write()
    }

    /// Drop every record this device kept.
    func clear() {
        events = []
        try? FileManager.default.removeItem(at: fileURL)
    }

    /// Events at or after a wall-clock instant.
    /// - Parameter since: unix epoch milliseconds.
    /// - Returns: the tail of the journal inside the window.
    func recent(since: Double) -> [UsageEvent] {
        events.filter { $0.at >= since }
    }

    /// Record a prompt that just left the composer.
    /// - Parameters:
    ///   - text: what the person typed; only its length is kept.
    ///   - project: folder name of the Session, when it has one.
    ///   - carriedPhoto: whether the prompt also carried an image.
    func recordPrompt(_ text: String, project: String?, carriedPhoto: Bool) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        record(UsageEvent(kind: .prompt, project: project, length: trimmed.count))
        if carriedPhoto {
            record(UsageEvent(kind: .photo, project: project))
        }
    }

    private func write() {
        do {
            let data = try JSONEncoder().encode(events)
            try data.write(to: fileURL, options: .atomic)
            writeError = nil
        } catch {
            // A journal that cannot be written must not break sending a prompt;
            // the memory page states that this window will not survive a launch.
            writeError = error.localizedDescription
        }
    }

    private static func read(_ url: URL) -> [UsageEvent] {
        guard let data = try? Data(contentsOf: url) else { return [] }
        return (try? JSONDecoder().decode([UsageEvent].self, from: data)) ?? []
    }
}
