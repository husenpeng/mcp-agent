//
//  HostWire.swift
//  Tomato Runner
//
//  Frames on the Host's Remote wire.
//
//  The application already encodes these envelopes in `Net/Streams.swift` and
//  `Net/HubClient.swift`, but those files belong to the app target and carry
//  its types. The runner needs the same two envelopes and nothing else, so they
//  are restated here; the protocol file stays the one shared contract.
//

import Foundation

/// Encoders for the Host's WebSocket mux and RPC carrier.
enum HostWire {
    /// One `open` frame asking for the `phone/attach` stream.
    /// @param streamId - identity the Host echoes on every frame of this stream.
    /// @param request - runner identity and capabilities.
    /// @returns the encoded frame text.
    static func openFrame(streamId: String, request: PhoneAttachRequest) throws -> String {
        let body = try PhoneJSON.from(request)
        let frame: [String: PhoneJSON] = [
            "type": .string("open"),
            "streamId": .string(streamId),
            "endpoint": .string("phone/attach"),
            "payload": .object(["args": .object(["request": body])]),
        ]
        let data = try JSONEncoder().encode(PhoneJSON.object(frame))
        guard let text = String(data: data, encoding: .utf8) else {
            throw PhoneFailure(.internal, "open 帧无法编码成文本")
        }
        return text
    }

    /// One `client-request` envelope for a unary endpoint.
    /// @param rpcId - correlation identity for this call.
    /// @param method - `<namespace>/<method>` endpoint.
    /// @param request - the endpoint's `request` argument.
    /// @returns the request body.
    static func clientRequest(rpcId: String, method: String, request: PhoneJSON) throws -> Data {
        let envelope: [String: PhoneJSON] = [
            "type": .string("client-request"),
            "rpcId": .string(rpcId),
            "method": .string(method),
            "payload": .object(["args": .object(["request": request])]),
        ]
        return try JSONEncoder().encode(PhoneJSON.object(envelope))
    }

    /// One failure the Host reported for a unary call.
    struct Failure: Decodable {
        let code: String
        let message: String
    }

    /// The `result` member of a `server-response`.
    struct Response: Decodable {
        struct Result: Decodable {
            let ok: Bool
            let value: PhoneJSON?
            let error: Failure?
        }

        let result: Result
    }
}
