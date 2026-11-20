//
//  SessionPreviewCache.swift
//  Tomato Remote
//
//  The list's warm-up cache: the newest page of a Session, kept so opening a
//  conversation paints its history immediately instead of a skeleton.
//
//  The first version warmed exactly one Session and never evicted, so every
//  history conversation opened cold — the reader saw a loading placeholder
//  even for a conversation they had just been reading the row of. This keeps a
//  bounded set of sessions in least-recently-used order: a row that scrolls
//  into view warms its own page, and only the least recently read page is
//  dropped when the cache is full.
//

import Foundation

/// A bounded LRU of the newest page of recently listed Sessions.
@MainActor
final class SessionPreviewCache {
    /// How many conversations stay warm. Twenty opening pages is a few hundred
    /// kilobytes of JSON and covers a realistic back-and-forth between a
    /// history session and the newest one.
    static let capacity = 20

    private var pages: [String: [JSONValue]] = [:]
    /// Least recent first; the tail is the most recently touched.
    private var order: [String] = []

    /// The cached page for one Session, marking it most recently used.
    /// - Parameter sessionId: Session whose preview is read.
    /// - Returns: the cached events, or nil when the cache has none.
    func page(for sessionId: String) -> [JSONValue]? {
        guard let page = pages[sessionId] else { return nil }
        touch(sessionId)
        return page
    }

    /// Whether this Session is already warm.
    /// - Parameter sessionId: Session to check, without changing its recency.
    /// - Returns: true when a page is cached.
    func contains(_ sessionId: String) -> Bool {
        pages[sessionId] != nil
    }

    /// Store one Session's page, evicting the least recently read entry.
    /// - Parameters:
    ///   - events: the newest page the Host returned.
    ///   - sessionId: Session the page belongs to.
    func store(_ events: [JSONValue], for sessionId: String) {
        pages[sessionId] = events
        touch(sessionId)
        while order.count > Self.capacity {
            let evicted = order.removeFirst()
            pages[evicted] = nil
        }
    }

    /// Drop one Session's page, so a failed or stale read is not served again.
    /// - Parameter sessionId: Session to forget.
    func remove(_ sessionId: String) {
        pages[sessionId] = nil
        order.removeAll { $0 == sessionId }
    }

    func clear() {
        pages.removeAll()
        order.removeAll()
    }

    /// Move one Session to the most-recently-used end.
    /// - Parameter sessionId: Session that was just read or written.
    private func touch(_ sessionId: String) {
        order.removeAll { $0 == sessionId }
        order.append(sessionId)
    }
}