//
//  PhoneDeviceModel.swift
//  Tomato Remote
//
//  State of the on-device runner: is it running, is this app paired with it,
//  and what does its screen currently show.
//
//  The runner is a separate process (an installed XCUITest bundle). This model
//  never touches the screen itself; it only asks the runner to.
//

import SwiftUI

/// One observation of the phone's own screen, driving the device card.
@MainActor
final class PhoneDeviceModel: ObservableObject {
    /// Lease identity this app uses against the runner.
    static let holder = "local:app"

    /// Which side currently does the work; switching to `phone` leases the device.
    @Published private(set) var mode: WorkMode = WorkModeStore.load()

    @Published private(set) var health: PhoneHealth?
    @Published private(set) var observation: PhoneObservation?
    @Published private(set) var credential: String? = RunnerCredentials.credential()
    @Published private(set) var busy = false
    @Published var errorMessage: String?
    @Published private(set) var logLines: [String] = []

    var isPaired: Bool {
        credential != nil
    }

    var isReachable: Bool {
        health != nil
    }

    private var link: RunnerLink {
        RunnerLink(credential: credential)
    }

    /// Switch working modes, releasing the device when phone mode ends.
    /// @param mode - mode the owner selected.
    func setMode(_ mode: WorkMode) async {
        guard mode != self.mode else { return }
        self.mode = mode
        WorkModeStore.save(mode)
        guard credential != nil else { return }
        do {
            if mode == .phone {
                _ = try await link.acquireLease(holder: Self.holder)
            } else {
                try await link.releaseLease(holder: Self.holder)
            }
            errorMessage = nil
        } catch {
            errorMessage = describe(error)
        }
    }

    /// Whether a control that changes the screen may run right now.
    var canAct: Bool {
        mode == .phone && credential != nil
    }

    /// Read readiness; a missing runner is a state, not an error.
    func refresh() async {
        do {
            health = try await RunnerLink().health()
            if health != nil, errorMessage?.contains("无响应") == true {
                errorMessage = nil
            }
        } catch {
            health = nil
        }
    }

    /// Pair with the runner; the owner approves on a notification.
    func pair() async {
        busy = true
        defer { busy = false }
        do {
            let issued = try await RunnerLink.pair()
            try RunnerCredentials.saveCredential(issued)
            credential = issued
            errorMessage = nil
            await refresh()
            await pushHostLinkIfPossible()
        } catch {
            errorMessage = describe(error)
        }
    }

    /// Forget the credential on this device.
    func unpair() {
        RunnerCredentials.clearCredential()
        credential = nil
        observation = nil
        health = nil
    }

    /// Give the runner the Host credentials the application already holds, so the
    /// desktop session can drive this phone without a second pairing.
    func pushHostLinkIfPossible() async {
        guard let profile = KeychainStore.load(), let credential, let health, health.hostLink != "attached" else { return }
        do {
            try await RunnerLink(credential: credential).setLink(PhoneLinkSetRequest(
                hostBase: profile.base,
                credential: profile.cookie,
                deviceId: RunnerCredentials.deviceId(),
                deviceName: RunnerCredentials.deviceName
            ))
        } catch {
            // A missing Host pairing is not this screen's failure to report; the
            // local controls keep working.
            errorMessage = describe(error)
        }
    }

    /// Read the screen through the runner.
    func observe() async {
        busy = true
        defer { busy = false }
        do {
            _ = try await link.acquireLease(holder: Self.holder)
            observation = try await link.observe()
            errorMessage = nil
        } catch {
            errorMessage = describe(error)
        }
    }

    /// Smoke action: open Notes and type a line, proving the whole chain.
    func typeIntoNotes() async {
        guard canAct else {
            errorMessage = "先切到「操控这台手机」再执行手机上的动作"
            return
        }
        busy = true
        defer { busy = false }
        do {
            _ = try await link.acquireLease(holder: Self.holder)
            _ = try await link.act(PhoneAction(type: .launch, name: "备忘录", fresh: true), observeAfter: false)
            let outcome = try await link.act(PhoneAction(type: .type, text: "你好 Tomato 123", submit: false))
            observation = outcome.observation
            if let hint = outcome.hint {
                logLines.append(hint)
            }
            errorMessage = nil
        } catch {
            errorMessage = describe(error)
        }
    }

    /// Load the runner's recent log for the diagnosis sheet.
    func loadLog() async {
        do {
            logLines = try await link.recentLog()
        } catch {
            errorMessage = describe(error)
        }
    }

    private func describe(_ error: Error) -> String {
        if let linkError = error as? RunnerLinkError {
            return linkError.errorDescription ?? "runner 调用失败"
        }
        return error.localizedDescription
    }
}
