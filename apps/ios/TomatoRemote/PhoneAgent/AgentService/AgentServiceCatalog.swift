//
//  AgentServiceCatalog.swift
//  Tomato Remote
//
//  The models agent_service lets this account pick from. The list is the same
//  one the web assistant shows; choosing one writes the route onto the open
//  session, so the phone keeps no model key of its own.
//

import Foundation

@MainActor
final class AgentServiceModelCatalog: ObservableObject {
    @Published private(set) var models: [AgentServiceModel] = []
    @Published private(set) var isLoading = false
    @Published private(set) var error: String?

    /// Read the service catalog for the signed-in account.
    func load() async {
        guard let client = AgentServiceClient.current() else {
            error = AgentServiceError.notSignedIn.errorDescription
            return
        }
        isLoading = true
        defer { isLoading = false }
        do {
            models = try await client.listModels()
            error = nil
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }
}
