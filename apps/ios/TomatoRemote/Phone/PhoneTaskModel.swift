//
//  PhoneTaskModel.swift
//  Tomato Remote
//
//  One on-device task, as the phone page shows it.
//
//  The loop runs in the runner, so this model only starts it, polls its
//  progress, and stops it. Leaving the app does not interrupt the task.
//

import SwiftUI

/// Starts, watches, and stops one runner task.
@MainActor
final class PhoneTaskModel: ObservableObject {
    @Published var goal = ""
    @Published private(set) var status: PhoneTaskStatus?
    @Published private(set) var busy = false
    @Published var errorMessage: String?

    private var pollTask: Task<Void, Never>?

    var isRunning: Bool {
        guard let status else { return false }
        return ["running", "needs_confirm"].contains(status.status)
    }

    /// Start the typed goal on the phone.
    /// @param credential - runner bearer.
    /// @param settings - model configuration; its key must already be stored.
    func start(credential: String, settings: ModelSettings) async {
        let goal = goal.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !goal.isEmpty else {
            errorMessage = "先写下要手机做的事"
            return
        }
        guard let key = ModelSettingsStore.key(for: settings.kind), !key.isEmpty else {
            errorMessage = "还没有填 \(settings.kind.rawValue) 的 API Key"
            return
        }
        busy = true
        defer { busy = false }
        do {
            let provider = PhoneProviderChoice(
                kind: settings.kind,
                baseURL: settings.baseURL,
                apiKey: key,
                model: settings.model,
                script: nil
            )
            // The runner admits one controller, and this page held the device to
            // enable the button. Hand it over first, or the task starts under a
            // lease it never took and every action it sends is refused.
            try? await RunnerLink(credential: credential).releaseLease(holder: PhoneDeviceModel.holder)
            _ = try await RunnerLink(credential: credential).startTask(goal: goal, provider: provider, maxSteps: settings.maxSteps)
            errorMessage = nil
            poll(credential: credential)
        } catch {
            errorMessage = (error as? RunnerLinkError)?.errorDescription ?? error.localizedDescription
        }
    }

    /// Stop the running task.
    /// @param credential - runner bearer.
    func stop(credential: String) async {
        do {
            try await RunnerLink(credential: credential).stopTask()
        } catch {
            errorMessage = (error as? RunnerLinkError)?.errorDescription ?? error.localizedDescription
        }
    }

    private func poll(credential: String) {
        pollTask?.cancel()
        pollTask = Task { [weak self] in
            guard let self else { return }
            while !Task.isCancelled {
                do {
                    let next = try await RunnerLink(credential: credential).taskStatus()
                    await MainActor.run { self.status = next }
                    if !["running", "needs_confirm"].contains(next.status) {
                        return
                    }
                } catch {
                    await MainActor.run { self.errorMessage = "读不到任务状态" }
                    return
                }
                try? await Task.sleep(for: .seconds(1))
            }
        }
    }
}
