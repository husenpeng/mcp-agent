//
//  ModelCatalogStore.swift
//  Tomato Remote
//
//  One model catalog for the paired Host, shared by every conversation.
//
//  The provider list belongs to the Host rather than to a Session, so two
//  conversations opened a minute apart must not each pay for a provider
//  enumeration. A failed read stays visible and is retried only when the reader
//  asks, so a Host without credentials does not re-ask on every screen.
//

import Foundation

/// Loads and holds the paired Host's routable model directory.
@MainActor
final class ModelCatalogStore: ObservableObject {
    /// How the last read stands.
    enum Status: Equatable {
        case idle
        case loading
        case ready
        /// The read failed; `error` says why and a retry may change it.
        case failed
    }

    @Published private(set) var catalog: ModelCatalog?
    @Published private(set) var status: Status = .idle
    /// Why the last read failed, worded for the reader.
    @Published private(set) var error: String?

    /// Host the held catalog belongs to, so pairing to another Host refetches.
    private var host: String?
    /// When the held catalog landed, so a list that grows on the Mac is read
    /// again the next time a reader opens a picker.
    private var loadedAt: Date?
    private var inflight: Task<ModelCatalog, Error>?
    /// Distinguishes the current read from one that is still settling.
    private var generation = 0

    /// How long a held catalog serves without reading again. A model added on
    /// the Mac then shows up at the next reader, without a poll between.
    private static let freshness: TimeInterval = 60

    /// Read the catalog unless it is already held for this Host.
    ///
    /// Concurrent callers share one read; a forced read replaces the held one.
    /// - Parameters:
    ///   - hub: the client bound to the paired Host, or nil while unpaired.
    ///   - force: whether to read again after a failure or a Host-side change.
    func load(hub: HubClient?, force: Bool = false) async {
        guard let hub else { return }
        let hostId = hub.base.absoluteString
        if host != hostId {
            host = hostId
            catalog = nil
            status = .idle
            error = nil
            inflight = nil
            loadedAt = nil
        }
        if !force, let inflight {
            // A read already on its way publishes the result; this caller only
            // waits so the surface it opened does not read as empty.
            _ = try? await inflight.value
            return
        }
        if !force {
            if status == .ready, let loadedAt, Date().timeIntervalSince(loadedAt) < Self.freshness {
                return
            }
            // A failed read stays as it is until a reader asks for a retry.
            if status == .failed {
                return
            }
        }
        generation += 1
        let id = generation
        let task = Task { try await hub.modelCatalog() }
        inflight = task
        status = .loading
        error = nil
        do {
            let value = try await task.value
            guard id == generation, !Task.isCancelled else { return }
            catalog = value
            status = .ready
            loadedAt = Date()
            let models = value.groups.reduce(0) { $0 + $1.models.count }
            AppLog.info(
                .model,
                "模型目录已加载",
                detail: "\(value.groups.count) 个提供方 · \(models) 个模型 · \(value.failures.count) 个失败"
            )
        } catch {
            guard id == generation, !Task.isCancelled else { return }
            status = .failed
            self.error = describe(error)
            AppLog.warning(.model, "模型目录加载失败", detail: describe(error))
        }
        if id == generation {
            inflight = nil
        }
    }

    /// The catalog entry for one route, when the Host advertised it.
    /// - Parameter route: provider and provider-owned model id.
    /// - Returns: the entry, or nil for a model the current catalog lacks.
    func model(for route: ModelRoute) -> ModelCatalogModel? {
        catalog?.groups
            .first { $0.id == route.provider }?
            .models.first { $0.id == route.model }
    }

    /// The model a deployment routes when a Session has recorded no choice yet.
    var defaultRoute: ModelRoute? {
        catalog?.defaultRoute
    }
}
