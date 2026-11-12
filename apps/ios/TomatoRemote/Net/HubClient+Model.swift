//
//  HubClient+Model.swift
//  Tomato Remote
//
//  The two model calls a conversation makes: read what the Host can route, and
//  record one choice for this Session.
//

import Foundation

extension HubClient {
    /// Every model this Host currently routes, grouped by provider.
    ///
    /// The catalog takes no parameter, so the request carries an empty `args`
    /// map rather than a body the Host would reject as an unknown argument.
    /// - Returns: the deployment default, provider groups, and provider failures.
    func modelCatalog() async throws -> ModelCatalog {
        try await call("session/modelCatalog", argName: nil, body: EmptyBody(), as: ModelCatalog.self)
    }

    /// Record one model choice for a Session; the Host resumes it when needed.
    /// - Parameters:
    ///   - sessionId: Session whose next model step uses the choice.
    ///   - route: provider, provider-owned model id, and optional effort.
    /// - Returns: the normalized selection the Host accepted.
    func selectModel(sessionId: String, route: ModelRoute) async throws -> ModelRoute {
        let request = SessionSelectModelRequest(
            sessionId: sessionId,
            provider: route.provider,
            model: route.model,
            reasoningEffort: route.reasoningEffort
        )
        let value = try await call("session/selectModel", body: request, as: SessionSelectModelValue.self)
        return value.selected
    }
}
