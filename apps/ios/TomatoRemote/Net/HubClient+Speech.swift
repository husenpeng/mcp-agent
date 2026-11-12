//
//  HubClient+Speech.swift
//  Tomato Remote
//
//  The Host's own recognizer: one finished recording in, one transcript out.
//
//  This is the second pass behind the phone's live transcript. The recording
//  travels only to the paired Host over its own connection, never to Apple's
//  service, and never into a Session log.
//

import Foundation

/// One recording handed to the Host's recognizer.
private struct SpeechTranscriptionRequest: Encodable {
    let audioBase64: String
    /// Explicit recognizer, or nil for the Host's saved selection.
    let providerId: String?
    /// Explicit language hint, or nil for the Host's saved selection.
    let language: String?
}

/// What the Host heard, with the timing it reports.
struct SpeechTranscript: Decodable {
    let text: String
    let audioSeconds: Double?
    let inferenceSeconds: Double?
}

extension HubClient {
    /// Transcribe one canonical WAV with the Host's recognizer.
    /// - Parameters:
    ///   - wav: 16 kHz mono PCM16 WAV bytes.
    ///   - providerId: explicit recognizer id, or nil for the Host's selection.
    ///   - language: explicit language hint, or nil for the Host's selection.
    /// - Returns: the transcript the Host's model produced.
    func transcribeSpeech(
        wav: Data,
        providerId: String? = nil,
        language: String? = nil
    ) async throws -> SpeechTranscript {
        try await call(
            "speech/transcribe",
            body: SpeechTranscriptionRequest(
                audioBase64: wav.base64EncodedString(),
                providerId: providerId,
                language: language
            ),
            as: SpeechTranscript.self
        )
    }
}
