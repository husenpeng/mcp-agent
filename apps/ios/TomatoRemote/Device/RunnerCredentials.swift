//
//  RunnerCredentials.swift
//  Tomato Remote
//
//  The runner credential and this device's identity.
//
//  The credential is what the runner accepts over loopback; it lives in the
//  Keychain because any application on the phone can reach a loopback port.
//

import Foundation
import UIKit

/// Keychain-backed runner pairing state.
enum RunnerCredentials {
    /// Read the credential issued by the runner, or nil before pairing.
    static func credential() -> String? {
        KeychainStore.secret(account: PhoneProtocol.credentialAccount).flatMap {
            String(data: $0, encoding: .utf8)
        }
    }

    /// Persist a credential the runner just issued.
    /// @param value - credential from `POST /pair`.
    static func saveCredential(_ value: String) throws {
        try KeychainStore.saveSecret(Data(value.utf8), account: PhoneProtocol.credentialAccount)
    }

    /// Forget the credential; the next call has to pair again.
    static func clearCredential() {
        KeychainStore.removeSecret(account: PhoneProtocol.credentialAccount)
    }

    /// Stable identity for this phone, created on first use.
    ///
    /// The Host names a device by this value, so reinstalling the app is the
    /// only thing that changes it.
    static func deviceId() -> String {
        if let data = KeychainStore.secret(account: PhoneProtocol.deviceIdAccount),
           let value = String(data: data, encoding: .utf8), !value.isEmpty
        {
            return value
        }
        let value = UUID().uuidString
        try? KeychainStore.saveSecret(Data(value.utf8), account: PhoneProtocol.deviceIdAccount)
        return value
    }

    /// Display name shown on the Mac's device list.
    static var deviceName: String {
        UIDevice.current.name
    }
}
