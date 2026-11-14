//
//  HubClient+Speech.swift
//  Tomato Remote
//
//  The Host's own recognizer: one finished recording in, one transcript out.
//
//  This is the second pass behind the phone's live transcript. The recording
//  travels only to the paired Host over its own connection, never to Apple's
//  service, and never into a Session log. The catalog call lets the phone ask
//  for the model a mixed Chinese-English sentence needs instead of whatever
//  the Host happens to have selected.
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

/// One Host preparation state; only the phase decides readiness here.
struct SpeechPreparation: Decodable {
    let phase: String
}

/// One recognizer to ask for, with the language hint it should use.
struct SpeechProviderChoice: Equatable {
    let id: String
    /// Explicit hint, or nil to keep the Host's saved selection.
    let language: String?
}

/// Recognizers the Host advertises, with the readiness the phone needs to pick one.
struct SpeechCatalog: Decodable {
    struct Provider: Decodable {
        let id: String
        let preparation: SpeechPreparation

        /// Whether the recognizer can run a recording right now.
        var isReady: Bool {
            preparation.phase == "ready" || preparation.phase == "standby"
        }
    }

    struct Selection: Decodable {
        let providerId: String
    }

    let providers: [Provider]
    let selection: Selection
}

extension HubClient {
    /// Read the Host's recognizers and their readiness.
    /// - Returns: every registered provider and the Host's saved selection.
    func speechCatalog() async throws -> SpeechCatalog {
        try await call("speech/catalog", argName: nil, body: EmptyBody(), as: SpeechCatalog.self)
    }

    /// Pick the recognizer a finished sentence should use.
    ///
    /// A Whisper provider, when the Host has one ready, handles mixed Chinese
    /// and English better than the other local models, so it wins over the
    /// saved selection. Everything else keeps the Host's own choice.
    /// - Returns: a provider and its language hint, or nil when the Host decides.
    func preferredSpeechProvider() async -> SpeechProviderChoice? {
        guard let catalog = try? await speechCatalog() else {
            return nil
        }
        let ready = catalog.providers.filter(\.isReady)
        if let whisper = ready.first(where: { $0.id == "whisper-local" }) {
            // Automatic detection keeps a mixed sentence from being forced
            // into a language the Host saved for another model.
            return SpeechProviderChoice(id: whisper.id, language: "auto")
        }
        return ready.first { $0.id == catalog.selection.providerId }
            .map { SpeechProviderChoice(id: $0.id, language: nil) }
    }

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
