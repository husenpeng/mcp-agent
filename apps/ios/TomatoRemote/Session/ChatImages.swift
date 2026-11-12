//
//  ChatImages.swift
//  Tomato Remote
//
//  The photos one conversation shows, keyed by what the Host recorded.
//
//  A user message carries durable image references, not pixels: the bytes come
//  back from the Host's authorized attachment call. A prompt this phone has just
//  sent is seeded from the bytes it already holds, under a temporary key that
//  the acknowledged message adopts, so the photo never blinks while the echo
//  hands over to the durable row.
//

import SwiftUI
import UIKit

/// Thumbnails one conversation keeps for its own transcript.
@MainActor
final class ChatImages: ObservableObject {
    /// Photos decoded for display, by store key.
    @Published private(set) var images: [String: UIImage] = [:]
    /// Keys whose read failed; a retry needs a new screen.
    @Published private(set) var failures: Set<String> = []
    /// Keys whose read is in flight.
    @Published private(set) var loading: Set<String> = []

    /// Widest thumbnail edge kept, in pixels. A transcript tile is far smaller;
    /// the same thumbnail also backs the full-screen preview.
    private static let thumbnailEdge: CGFloat = 900
    /// Photos held at once; a long conversation drops its oldest rows first.
    private static let capacity = 8

    private var order: [String] = []

    /// The decoded photo for one key, when it is already on the phone.
    /// - Parameter key: durable attachment identity, or a prompt's temporary key.
    /// - Returns: the thumbnail, or nil while it loads or after it failed.
    func image(for key: String) -> UIImage? {
        images[key]
    }

    /// Whether the read for one key failed.
    /// - Parameter key: the store key.
    /// - Returns: true when the Host refused or the bytes did not decode.
    func didFail(_ key: String) -> Bool {
        failures.contains(key)
    }

    /// Whether the read for one key is still running.
    /// - Parameter key: the store key.
    /// - Returns: true between the request and its settlement.
    func isLoading(_ key: String) -> Bool {
        loading.contains(key)
    }

    /// Keep the bytes this phone already has for a prompt it is sending.
    /// - Parameters:
    ///   - data: JPEG the composer encoded.
    ///   - key: the prompt's temporary key.
    func seed(_ data: Data, for key: String) {
        guard images[key] == nil else { return }
        guard let decoded = UIImage(data: data) else {
            failures.insert(key)
            return
        }
        keep(Self.thumbnail(decoded), for: key)
    }

    /// Hand a pending prompt's photos to the durable identities the Host
    /// recorded, in the order the parts were sent.
    /// - Parameters:
    ///   - keys: temporary keys, in message order.
    ///   - durableIds: attachment identities of the same message, in order.
    func adopt(_ keys: [String], as durableIds: [String]) {
        guard keys.count == durableIds.count else { return }
        for (key, id) in zip(keys, durableIds) where key != id {
            guard let photo = images[key] else { continue }
            keep(photo, for: id)
        }
    }

    /// Drop what a failed or abandoned prompt had staged.
    /// - Parameter keys: temporary keys of the prompt.
    func forget(_ keys: [String]) {
        for key in keys where key.hasPrefix("pending:") {
            images[key] = nil
            failures.remove(key)
            loading.remove(key)
            order.removeAll { $0 == key }
        }
    }

    /// Fetch the photos this transcript needs and does not hold yet.
    ///
    /// Every call is idempotent: a key that is loaded, loading, or failed starts
    /// nothing, so a transcript rebuild never repeats a read.
    /// - Parameters:
    ///   - keys: durable attachment identities the visible rows reference.
    ///   - sessionId: Session whose log authorizes the reads.
    ///   - hub: client for the paired Host.
    func load(_ keys: Set<String>, sessionId: String, hub: HubClient) {
        for key in keys where !key.hasPrefix("pending:") {
            guard images[key] == nil, !failures.contains(key), !loading.contains(key) else { continue }
            loading.insert(key)
            Task { [weak self] in
                await self?.fetch(key, sessionId: sessionId, hub: hub)
            }
        }
    }

    /// Read one attachment and keep its thumbnail.
    /// - Parameters:
    ///   - key: the durable attachment identity.
    ///   - sessionId: Session whose log authorizes the read.
    ///   - hub: client for the paired Host.
    private func fetch(_ key: String, sessionId: String, hub: HubClient) async {
        defer { loading.remove(key) }
        do {
            let (_, data) = try await hub.attachment(sessionId: sessionId, attachmentId: key)
            let photo = await Task.detached(priority: .userInitiated) {
                UIImage(data: data)
            }.value
            guard let photo else {
                failures.insert(key)
                AppLog.warning(.chat, "消息图片无法解码", detail: key)
                return
            }
            guard !Task.isCancelled else { return }
            await keep(Task.detached(priority: .userInitiated) { Self.thumbnail(photo) }.value, for: key)
            AppLog.debug(.chat, "消息图片已取回", detail: "\(data.count) 字节")
        } catch {
            // A photo the Host no longer holds is a tile with an icon, not a
            // sentence: the words of the message still read on their own.
            failures.insert(key)
            AppLog.warning(.chat, "消息图片读取失败", detail: describe(error))
        }
    }

    /// Store one thumbnail and evict the oldest beyond the held count.
    /// - Parameters:
    ///   - photo: the decoded thumbnail.
    ///   - key: the store key.
    private func keep(_ photo: UIImage, for key: String) {
        images[key] = photo
        if !order.contains(key) {
            order.append(key)
        }
        while order.count > Self.capacity {
            let dropped = order.removeFirst()
            images[dropped] = nil
        }
    }

    /// Downscale one decoded photo to the transcript's kept size.
    /// - Parameter photo: the decoded image.
    /// - Returns: a thumbnail no wider or taller than `thumbnailEdge`.
    private nonisolated static func thumbnail(_ photo: UIImage) -> UIImage {
        let longest = max(photo.size.width, photo.size.height)
        guard longest > thumbnailEdge else { return photo }
        let scale = thumbnailEdge / longest
        let target = CGSize(width: photo.size.width * scale, height: photo.size.height * scale)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        return UIGraphicsImageRenderer(size: target, format: format).image { _ in
            photo.draw(in: CGRect(origin: .zero, size: target))
        }
    }
}
