//
//  HostSnapshots.swift
//  Tomato Remote
//
//  The last successful read of a Host list, kept on disk.
//
//  A cold launch painted an empty list until the first round trip answered, and
//  a tab return could not tell a slow Host from an empty one. Each snapshot is
//  the previous answer, not authority: the screen paints it at once and the
//  next read replaces it. A missing, corrupt, or foreign file reads as nil, so a
//  snapshot never blocks pairing or a first read.
//

import Foundation

/// Disk buffer for Host reads the app can show before revalidating them.
///
/// A snapshot belongs to one paired Host, so the key carries its base address;
/// pairing to another Host therefore starts from an empty screen instead of the
/// previous Host's rows.
enum HostSnapshots {
    /// Folder holding one JSON file per key.
    private static var folder: URL? {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first
            ?? URL(fileURLWithPath: NSTemporaryDirectory())
        let url = base.appendingPathComponent("TomatoRemote/snapshots", isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    /// Read one snapshot.
    /// - Parameters:
    ///   - type: decoded value type.
    ///   - key: identity of the read, including the Host it came from.
    /// - Returns: the buffered value, or nil when nothing usable is stored.
    static func read<T: Decodable>(_ type: T.Type, key: String) -> T? {
        guard let url = file(for: key), let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(type, from: data)
    }

    /// Replace one snapshot, ignoring a write the file system refuses.
    ///
    /// The encode and the write leave the main actor: a list large enough to be
    /// worth buffering is also large enough to cost a frame.
    /// - Parameters:
    ///   - value: decoded value to store.
    ///   - key: identity of the read.
    static func write<T: Encodable & Sendable>(_ value: T, key: String) {
        guard let url = file(for: key) else { return }
        Task.detached(priority: .utility) {
            guard let data = try? JSONEncoder().encode(value) else { return }
            try? data.write(to: url, options: .atomic)
        }
    }

    /// Drop every buffered read; called when the phone forgets its Host.
    static func removeAll() {
        guard let folder else { return }
        try? FileManager.default.removeItem(at: folder)
    }

    /// One file per key, in a name no key can escape.
    /// - Parameter key: identity of the read.
    /// - Returns: the file address, or nil when the folder is unavailable.
    private static func file(for key: String) -> URL? {
        guard let folder else { return nil }
        let safe = key.unicodeScalars.map { scalar -> Character in
            CharacterSet.alphanumerics.contains(scalar) || scalar == "-" || scalar == "_"
                ? Character(scalar)
                : "_"
        }
        return folder.appendingPathComponent(String(safe).prefix(120) + ".json")
    }
}