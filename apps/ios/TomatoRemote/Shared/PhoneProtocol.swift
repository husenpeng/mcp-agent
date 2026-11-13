//
//  PhoneProtocol.swift
//  Tomato Remote
//
//  Wire contract between TomatoRemote, TomatoRunner, and the Host plugin.
//
//  Both the application and the runner compile this file, so it may import
//  Foundation only. The Host mirrors these values in
//  `packages/experimental/phone-use/src/protocol.ts`; protocol version bumps
//  require both sides and `tests/fixtures/protocol` in the same change.
//

import Foundation

/// Version carried by every `/health` answer and accepted by the Host.
enum PhoneProtocol {
    /// Bumped only when an existing field changes meaning or disappears.
    static let version = 1
    /// Loopback port the runner listens on, overridable in the runner process.
    static let defaultPort: UInt16 = 8200
    /// Keychain account holding the runner credential in the application.
    static let credentialAccount = "runnerCredential"
    /// Keychain account holding the device identity in the application.
    static let deviceIdAccount = "runnerDeviceId"
}

// MARK: - Transport envelope

/// One JSON-RPC 2.0 request body for `POST /rpc`.
struct PhoneRPCRequest: Codable, Sendable {
    var jsonrpc: String = "2.0"
    var id: String
    var method: String
    var params: PhoneJSON

    init(id: String, method: String, params: PhoneJSON = .object([:])) {
        self.id = id
        self.method = method
        self.params = params
    }
}

/// One JSON-RPC 2.0 response body; exactly one of `result` or `error` is set.
struct PhoneRPCResponse: Codable, Sendable {
    var jsonrpc: String = "2.0"
    var id: String
    var result: PhoneJSON?
    var error: PhoneFailure?

    static func success(id: String, value: PhoneJSON) -> PhoneRPCResponse {
        PhoneRPCResponse(id: id, result: value, error: nil)
    }

    static func failure(id: String, _ failure: PhoneFailure) -> PhoneRPCResponse {
        PhoneRPCResponse(id: id, result: nil, error: failure)
    }
}

// MARK: - Failures

/// Stable machine-readable failure, mirrored by `PhoneErrorCode` on the Host.
struct PhoneFailure: Codable, Error, Sendable, Equatable {
    var code: String
    var message: String
    var retryable: Bool
    var details: PhoneJSON?

    init(_ code: PhoneErrorCode, _ message: String, retryable: Bool = false, details: PhoneJSON? = nil) {
        self.code = code.rawValue
        self.message = message
        self.retryable = retryable
        self.details = details
    }
}

/// Every failure code the engine may return.
enum PhoneErrorCode: String, Codable, Sendable {
    case locked = "LOCKED"
    case staleRef = "STALE_REF"
    case notFound = "NOT_FOUND"
    case needsConfirmation = "NEEDS_CONFIRMATION"
    case blockedApp = "BLOCKED_APP"
    case leaseHeld = "LEASE_HELD"
    case timeout = "TIMEOUT"
    case halted = "HALTED"
    case badRequest = "BAD_REQUEST"
    case unauthorized = "UNAUTHORIZED"
    case pairDenied = "PAIR_DENIED"
    case `internal` = "INTERNAL"
}

// MARK: - Values

/// A point in UIKit points, origin at the top-left of the screen.
struct PhonePoint: Codable, Sendable, Equatable {
    var x: Double
    var y: Double
}

/// Screen geometry in points and the backing scale factor.
struct PhoneScreen: Codable, Sendable, Equatable {
    var width: Double
    var height: Double
    var scale: Double
}

/// The application in front, as far as the runner can prove.
struct PhoneForeground: Codable, Sendable, Equatable {
    var bundleId: String
    var name: String?
}

/// One actionable element from the current observation.
///
/// `ref` is valid only within the observation that produced it; the runner
/// re-resolves it before acting and answers `STALE_REF` when it no longer
/// matches.
struct PhoneElement: Codable, Sendable, Equatable {
    var ref: String
    var role: String
    var label: String
    var value: String?
    /// `[x, y, width, height]` in points.
    var frame: [Double]
    var enabled: Bool
}

/// One OCR result, offered when the accessibility tree is thin.
struct PhoneOCRItem: Codable, Sendable, Equatable {
    var ref: String
    var text: String
    var frame: [Double]
}

/// A system alert covering the screen.
struct PhoneAlert: Codable, Sendable, Equatable {
    var title: String?
    var buttons: [String]
}

/// One screen reading.
struct PhoneObservation: Codable, Sendable, Equatable {
    var observationId: String
    var foreground: PhoneForeground?
    var screen: PhoneScreen
    var elements: [PhoneElement]
    var ocr: [PhoneOCRItem]?
    var truncated: Bool
    var keyboardVisible: Bool
    var alert: PhoneAlert?
}

/// Runner identity and readiness, answered without the engine queue.
struct PhoneHealth: Codable, Sendable, Equatable {
    var `protocol`: Int
    var runnerVersion: String
    var build: String
    var screen: PhoneScreen
    var locked: Bool
    var foreground: PhoneForeground?
    var lease: PhoneLeaseState?
    var hostLink: String
}

/// Who currently holds the device.
struct PhoneLeaseState: Codable, Sendable, Equatable {
    var holder: String
    var since: String
}

/// Result of `lease.acquire`.
struct PhoneLeaseGrant: Codable, Sendable, Equatable {
    var granted: Bool
    var holder: String
}

// MARK: - Actions

/// One action the engine can perform.
///
/// A flat shape with `type` as the discriminator keeps the JSON schema and both
/// decoders identical; the engine rejects fields that do not belong to `type`.
struct PhoneAction: Codable, Sendable, Equatable {
    enum Kind: String, Codable, Sendable {
        case tap
        case longPress
        case swipe
        case type
        case press
        case launch
        case openUrl
        case wait
    }

    enum Direction: String, Codable, Sendable {
        case up, down, left, right
    }

    enum HardwareButton: String, Codable, Sendable {
        case home
        case volumeUp
        case volumeDown
    }

    var type: Kind
    var ref: String?
    var point: PhonePoint?
    var from: PhonePoint?
    var to: PhonePoint?
    var direction: Direction?
    var durationMs: Int?
    var count: Int?
    var text: String?
    var submit: Bool?
    var clear: Bool?
    var button: HardwareButton?
    var bundleId: String?
    var name: String?
    var fresh: Bool?
    /// Launch arguments, passed before launch. A debug build alone reads the
    /// ones it declares, so an argument cannot change a release build's behavior.
    var arguments: [String]?
    var url: String?
    var ms: Int?
    var untilText: String?
    var timeoutMs: Int?
}

/// Result of one action, with a fresh observation unless suppressed.
struct PhoneActResult: Codable, Sendable, Equatable {
    var ok: Bool
    var pageChanged: Bool
    var foreground: PhoneForeground?
    var hint: String?
    var observation: PhoneObservation?
}

/// Parameters of `act`, wrapping the action with execution options.
struct PhoneActRequest: Codable, Sendable {
    var action: PhoneAction
    var observeAfter: Bool?
    var confirmToken: String?
}

/// One captured frame, JPEG encoded.
struct PhoneScreenshot: Codable, Sendable, Equatable {
    var mime: String
    var base64: String
    var pixelWidth: Int
    var pixelHeight: Int
    var observationId: String
}

/// One application match from the offline table or this device's history.
struct PhoneAppMatch: Codable, Sendable, Equatable {
    var bundleId: String
    var name: String
}

/// Result of `apps.resolve`.
struct PhoneAppResolveResult: Codable, Sendable, Equatable {
    var matches: [PhoneAppMatch]
}

/// Opening frame a runner sends when it attaches to the Host.
struct PhoneAttachRequest: Codable, Sendable {
    var deviceId: String
    var deviceName: String
    var `protocol`: Int
    var runnerVersion: String
    var screen: PhoneScreen
    var capabilities: [String]
}

/// Parameters of `link.set`: how the runner reaches the Host.
struct PhoneLinkSetRequest: Codable, Sendable {
    var hostBase: String
    var credential: String
    var deviceId: String
    var deviceName: String
}

// MARK: - JSON

/// Minimal JSON tree shared by both processes.
///
/// The application already has `JSONValue` in `Net/Wire.swift`, but that type
/// belongs to the Host wire and cannot be compiled into the runner; this one
/// stays Foundation-only and is the only dynamic value the runner understands.
enum PhoneJSON: Codable, Equatable, Sendable {
    case null
    case bool(Bool)
    case number(Double)
    case string(String)
    case array([PhoneJSON])
    case object([String: PhoneJSON])

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([PhoneJSON].self) {
            self = .array(value)
        } else if let value = try? container.decode([String: PhoneJSON].self) {
            self = .object(value)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unsupported JSON value")
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .null: try container.encodeNil()
        case let .bool(value): try container.encode(value)
        case let .number(value): try container.encode(value)
        case let .string(value): try container.encode(value)
        case let .array(value): try container.encode(value)
        case let .object(value): try container.encode(value)
        }
    }

    var stringValue: String? {
        if case let .string(value) = self {
            return value
        }
        return nil
    }

    var doubleValue: Double? {
        switch self {
        case let .number(value): value
        case let .string(value): Double(value)
        default: nil
        }
    }

    var intValue: Int? {
        doubleValue.map { Int($0) }
    }

    var boolValue: Bool? {
        switch self {
        case let .bool(value): value
        case let .number(value): value != 0
        default: nil
        }
    }

    var objectValue: [String: PhoneJSON]? {
        if case let .object(value) = self {
            return value
        }
        return nil
    }

    var arrayValue: [PhoneJSON]? {
        if case let .array(value) = self {
            return value
        }
        return nil
    }

    /// Read one member of an object, or nil for any other case.
    /// @param key - member name.
    subscript(key: String) -> PhoneJSON? {
        objectValue?[key]
    }

    /// Decode this tree into a typed value.
    /// @param type - model to decode.
    /// @returns the decoded value; throws when the tree does not match.
    func decode<T: Decodable>(_ type: T.Type) throws -> T {
        let data = try JSONEncoder().encode(self)
        return try JSONDecoder().decode(type, from: data)
    }

    /// Encode a typed value into this tree.
    /// @param value - model to encode.
    /// @returns the encoded tree.
    static func from(_ value: some Encodable) throws -> PhoneJSON {
        let data = try JSONEncoder().encode(value)
        return try JSONDecoder().decode(PhoneJSON.self, from: data)
    }
}

// MARK: - Requests

/// Parameters of `observe`.
struct PhoneObserveRequest: Codable, Sendable {
    var maxElements: Int?
    var includeOcr: String?
    var screenshot: Bool?
}

/// Parameters of `screenshot`.
struct PhoneScreenshotRequest: Codable, Sendable {
    var maxEdge: Int?
    var quality: Double?
}

/// Parameters of `lease.acquire`.
struct PhoneLeaseRequest: Codable, Sendable {
    var holder: String
    var ttlMs: Int?
}

/// Parameters of `lease.release`.
struct PhoneLeaseReleaseRequest: Codable, Sendable {
    var holder: String
}

/// Parameters of `apps.resolve`.
struct PhoneResolveRequest: Codable, Sendable {
    var query: String
}

/// Which model the on-device loop calls.
struct PhoneProviderChoice: Codable, Sendable {
    enum Kind: String, Codable, Sendable {
        case openai
        case anthropic
        /// Deterministic actions for a device check; never offered in the UI.
        case script
    }

    var kind: Kind
    var baseURL: String
    var apiKey: String
    var model: String
    var script: [String]?
}

/// Parameters of `task.start`.
struct PhoneTaskStartRequest: Codable, Sendable {
    var goal: String
    var provider: PhoneProviderChoice
    var maxSteps: Int?
    var startApp: String?
}

/// Parameters of `task.status` and `task.stop`.
struct PhoneTaskIdRequest: Codable, Sendable {
    var runId: String?
}

/// One task's state and steps.
struct PhoneTaskStatus: Codable, Sendable, Equatable {
    struct Step: Codable, Sendable, Equatable {
        var n: Int
        var action: String
        var ok: Bool
        var ms: Int
        var detail: String
    }

    var runId: String
    var goal: String
    var status: String
    var steps: [Step]
    var summary: String?
    var error: String?
}

/// Parameters of `account.switch`-style calls that take nothing.
struct PhoneEmptyRequest: Codable, Sendable {}
