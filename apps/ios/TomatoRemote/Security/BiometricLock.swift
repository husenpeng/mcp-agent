//
//  BiometricLock.swift
//  Tomato Remote
//
//  Gate the paired Host behind the device owner's biometrics.
//
//  A paired phone holds an owner-level session cookie: whoever unlocks the
//  phone holds the Mac's keys. Pairing therefore installs a lock that is
//  released by Face ID (or the device passcode as its fallback) whenever the
//  app returns to the foreground.
//

import LocalAuthentication
import SwiftUI

/// One-shot owner check in front of the paired application.
///
/// The gate is deliberately closed on launch and closed again whenever the app
/// leaves the foreground. It does not remember a previous success beyond the
/// current foreground session.
@MainActor
final class BiometricLock: ObservableObject {
    /// Whether the paired application may render. False until a check passes.
    @Published private(set) var unlocked = false
    /// Why the last check did not pass, shown instead of the application.
    @Published private(set) var failure: String?
    /// True when this device cannot run any owner check at all. The gate then
    /// opens, because a device without a passcode has nothing to gate against,
    /// but the caller is told so it can say that out loud.
    @Published private(set) var unavailable = false

    private var checking = false

    /// Close the gate; the next foreground pass must succeed again.
    func lock() {
        unlocked = false
    }

    /// Ask the system for the owner check that a paired device requires.
    ///
    /// Uses `deviceOwnerAuthentication`, so a device with Face ID, Touch ID, or
    /// only a passcode all work, and a failed biometric match can fall back to
    /// the passcode instead of stranding the user.
    /// @param allowUnavailable - when true, a device with no owner authentication
    ///   opens the gate and reports `unavailable`, because it offers nothing to
    ///   verify against. Pass false to keep the gate shut regardless.
    func unlock(allowUnavailable: Bool = true) async {
        if unlocked || checking { return }
        checking = true
        defer { checking = false }

        let context = LAContext()
        context.localizedCancelTitle = "取消"
        var availabilityError: NSError?
        guard context.canEvaluatePolicy(.deviceOwnerAuthentication, error: &availabilityError) else {
            failure = nil
            if allowUnavailable {
                unavailable = true
                unlocked = true
            } else {
                unavailable = false
                failure = "此设备没有可用的面容 ID、触控 ID 或密码"
            }
            return
        }

        do {
            let passed = try await context.evaluatePolicy(
                .deviceOwnerAuthentication,
                localizedReason: "解锁已配对的 Mac"
            )
            unavailable = false
            failure = passed ? nil : "身份验证未通过"
            unlocked = passed
        } catch {
            unavailable = false
            failure = describe(error)
            unlocked = false
        }
    }
}

/// Full-screen cover drawn while the paired application is locked.
struct LockedCover: View {
    let failure: String?
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "faceid")
                .font(.system(size: 44, weight: .light))
                .foregroundStyle(TomatoToken.brandPrimary)
            Text("Tomato Remote 已锁定")
                .font(.headline)
                .foregroundStyle(TomatoToken.labelPrimary)
            Text("这台手机持有一把可以操作 Mac 的钥匙，因此每次回到前台都要验证身份。")
                .font(.footnote)
                .multilineTextAlignment(.center)
                .foregroundStyle(TomatoToken.labelCaption)
                .padding(.horizontal, 32)
            if let failure {
                Text(failure)
                    .font(.footnote)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(TomatoToken.stateErrorPrimary)
                    .padding(.horizontal, 32)
            }
            TomatoPrimaryButton(title: "解锁", systemImage: "lock.open") { retry() }
                .padding(.horizontal, 40)
                .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(TomatoToken.bgBase)
    }
}