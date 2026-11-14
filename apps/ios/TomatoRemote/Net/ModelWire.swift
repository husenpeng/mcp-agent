//
//  ModelWire.swift
//  Tomato Remote
//
//  The Host's model catalog and the model choice a Session records.
//
//  A Host advertises what it can route together with the reasoning levels each
//  exact model accepts; the phone never carries its own list of models or
//  levels, because both are provider facts that change with the Host's
//  credentials and adapters.
//

import Foundation

/// One provider route plus the adapter-owned effort that decides how hard the
/// model thinks: what the Host records for a Session and what a switch sends.
struct ModelRoute: Codable, Hashable, Sendable {
    let provider: String
    let model: String
    /// Adapter-owned effort id; absence keeps the provider's own default.
    var reasoningEffort: String?

    /// Stable identity of the route for view diffing.
    var id: String {
        "\(provider)/\(model)"
    }
}

/// One model a Host can route right now.
struct ModelCatalogModel: Codable, Hashable, Sendable {
    /// One reasoning level the model's adapter accepts.
    struct Effort: Codable, Hashable, Sendable {
        let id: String
        let name: String
        let description: String?
    }

    /// The reasoning levels this exact model accepts, and the one its adapter
    /// defaults to.
    struct Reasoning: Codable, Hashable, Sendable {
        let efforts: [Effort]
        let defaultEffort: String?
    }

    let id: String
    let name: String
    let description: String?
    let reasoning: Reasoning?
    /// Why a deployment policy refuses this model; nil when it may be selected.
    let blockedReason: String?
}

/// `session/modelCatalog` value: routes grouped by provider, the deployment
/// default, and the providers whose catalogs failed to load.
struct ModelCatalog: Codable, Sendable {
    /// One provider and the models it successfully advertised.
    struct Provider: Codable, Hashable, Sendable {
        let id: String
        let name: String
        let models: [ModelCatalogModel]
    }

    /// One provider whose catalog lookup failed; usable providers stay usable.
    struct Failure: Codable, Hashable, Sendable {
        let id: String
        let name: String
        let message: String
    }

    /// Selection an unconfigured Session uses.
    let defaultRoute: ModelRoute
    let routableProviders: [String]
    let groups: [Provider]
    let failures: [Failure]

    private enum CodingKeys: String, CodingKey {
        case defaultRoute = "default"
        case routableProviders
        case groups
        case failures
    }
}

/// Durable fold of one Session's recorded model choices: the last route that
/// answered, and the route the next model step uses.
struct ModelSelectionProjection: Decodable, Sendable {
    let lastUsed: ModelRoute?
    let next: ModelRoute?
}

/// `session/selectModel` request.
struct SessionSelectModelRequest: Encodable {
    let sessionId: String
    let provider: String
    let model: String
    let reasoningEffort: String?
}

/// `session/selectModel` value: the selection the Host accepted.
struct SessionSelectModelValue: Decodable, Sendable {
    let selected: ModelRoute
}

/// How one adapter-owned reasoning level reads on this screen.
///
/// The set of levels and their labels come from the Host; only the wording for
/// the ids the shipped adapters advertise is owned here, so a new provider
/// still reads through its own `name`.
enum ModelEffortLabel {
    /// Chinese wording for the advertised reasoning-effort ids.
    static let known: [String: String] = [
        "off": "关闭",
        "low": "低",
        "medium": "中",
        "high": "高",
        "max": "最大",
    ]

    /// The unpinned level, which follows the model's own default.
    static let automatic = "默认"

    /// Text for one effort id.
    /// @param effort - adapter-owned effort id, or nil for the provider default.
    /// @param reasoning - the selected model's advertised levels, when known.
    /// @returns the locale wording, the Host's own level name, or the raw id.
    static func text(_ effort: String?, in reasoning: ModelCatalogModel.Reasoning?) -> String {
        guard let effort else { return automatic }
        if let mapped = known[effort] {
            return mapped
        }
        return reasoning?.efforts.first { $0.id == effort }?.name ?? effort
    }
}
