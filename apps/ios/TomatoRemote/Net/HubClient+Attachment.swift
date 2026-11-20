//
//  HubClient+Attachment.swift
//  Tomato Remote
//
//  Reading back one image the Host recorded for a message. The Session log keeps
//  the admitted reference; the bytes come from this call, which is authorized
//  against the same log.
//

import Foundation

/// One durable image reference as the Host recorded it on a message.
///
/// The Host verifies the whole reference, not only its identity, so every field
/// the log records travels back with the read. `name` is a display label the
/// Host strips of local paths; it is absent when the upload carried none.
struct ChatImageAttachment: Codable, Hashable, Sendable {
    let attachmentId: String
    let mediaType: String
    let bytes: Int
    let width: Double
    let height: Double
    let name: String?
}

/// `session/attachment` request: the complete image reference of one Session.
struct SessionAttachmentRequest: Encodable {
    let sessionId: String
    let attachment: ChatImageAttachment
}

/// `session/attachment` value: the verified reference and the encoded bytes.
struct SessionAttachmentValue: Decodable, Sendable {
    let attachment: ChatImageAttachment
    /// Base64 of the stored image, already normalized by the Host.
    let data: String
}

extension HubClient {
    /// Read one image a Session log references.
    ///
    /// The Host re-verifies the bytes against the recorded reference, so a
    /// response is worth showing even after the attachment store was rewritten.
    /// The request carries that reference in full: the Host rejects a read that
    /// names only the identity.
    /// - Parameters:
    ///   - sessionId: Session whose log holds the message.
    ///   - attachment: the complete reference the message recorded.
    /// - Returns: the reference and the decoded image bytes.
    /// @throws HubError when the reference is not in this Session or the bytes
    ///   do not decode.
    func attachment(
        sessionId: String,
        attachment: ChatImageAttachment
    ) async throws -> (ref: ChatImageAttachment, data: Data) {
        let request = SessionAttachmentRequest(sessionId: sessionId, attachment: attachment)
        let value = try await call("session/attachment", body: request, as: SessionAttachmentValue.self)
        guard let data = Data(base64Encoded: value.data) else {
            throw HubError.decoding("图片数据不是合法的 base64")
        }
        return (value.attachment, data)
    }
}
