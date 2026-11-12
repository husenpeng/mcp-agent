//
//  HubClient+Attachment.swift
//  Tomato Remote
//
//  Reading back one image the Host recorded for a message. The Session log keeps
//  only the admitted reference and its dimensions; the bytes come from this call,
//  which is authorized against the same log.
//

import Foundation

/// One durable image reference as the Host recorded it on a message.
struct ChatImageAttachment: Decodable, Hashable, Sendable {
    let attachmentId: String
    let mediaType: String
    let width: Double?
    let height: Double?
    let bytes: Int?
}

/// `session/attachment` request: which image of which Session.
struct SessionAttachmentRequest: Encodable {
    let sessionId: String
    let attachmentId: String
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
    /// - Parameters:
    ///   - sessionId: Session whose log holds the message.
    ///   - attachmentId: the recorded attachment identity.
    /// - Returns: the reference and the decoded image bytes.
    /// @throws HubError when the reference is not in this Session or the bytes
    ///   do not decode.
    func attachment(sessionId: String, attachmentId: String) async throws -> (ref: ChatImageAttachment, data: Data) {
        let request = SessionAttachmentRequest(sessionId: sessionId, attachmentId: attachmentId)
        let value = try await call("session/attachment", body: request, as: SessionAttachmentValue.self)
        guard let data = Data(base64Encoded: value.data) else {
            throw HubError.decoding("图片数据不是合法的 base64")
        }
        return (value.attachment, data)
    }
}
