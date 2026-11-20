//
//  ChatAttachmentTests.swift
//  TomatoRemoteTests
//
//  A photo prompt carries the Host's complete attachment reference from the
//  durable log back to the attachment read. The Host verifies that whole
//  reference, so a request that names only its identity is rejected.
//

@testable import TomatoRemote
import XCTest

@MainActor
final class ChatAttachmentTests: XCTestCase {
    private let attachment = ChatImageAttachment(
        attachmentId: "sha256:b1ff9c8ea3a780bad09b346c423d2d0e46815926879b18e841d928376a946640",
        mediaType: "image/png",
        bytes: 69,
        width: 1,
        height: 1,
        name: "reference-1.png"
    )

    /// One `user/message` payload holding a text block and an image block.
    private func payload() throws -> JSONValue {
        let json = """
        {
          "role": "user",
          "content": [
            {
              "type": "image",
              "attachment": {
                "attachmentId": "sha256:b1ff9c8ea3a780bad09b346c423d2d0e46815926879b18e841d928376a946640",
                "mediaType": "image/png",
                "width": 1,
                "height": 1,
                "bytes": 69,
                "name": "reference-1.png"
              }
            },
            { "type": "text", "text": "这张图里有什么" }
          ]
        }
        """
        return try JSONDecoder().decode(JSONValue.self, from: Data(json.utf8))
    }

    /// The row keeps every verified field, not only the identity it draws by.
    func testPromptKeepsTheCompleteImageReference() throws {
        let content = try ChatModel.content(of: payload())

        XCTAssertEqual(content.text, "这张图里有什么")
        XCTAssertEqual(content.images.count, 1)
        XCTAssertEqual(content.images.first?.id, attachment.attachmentId)
        XCTAssertEqual(content.images.first?.attachment, attachment)
        XCTAssertFalse(content.images.first?.isPending ?? true)
    }

    /// An older log without the reference's dimensions still draws its row, but
    /// its bytes cannot be verified and the tile settles as a failure.
    func testLegacyImageBlockKeepsOnlyTheIdentity() throws {
        let json = """
        {
          "role": "user",
          "content": [
            { "type": "image", "attachment": { "attachmentId": "sha256:legacy" } }
          ]
        }
        """
        let content = try ChatModel.content(of: JSONDecoder().decode(JSONValue.self, from: Data(json.utf8)))

        XCTAssertEqual(content.images.map(\.id), ["sha256:legacy"])
        XCTAssertNil(content.images.first?.attachment)
    }

    /// The read request carries the full reference where the Host expects it.
    func testAttachmentRequestEncodesTheWholeReference() throws {
        let request = SessionAttachmentRequest(sessionId: "s1", attachment: attachment)
        let data = try JSONEncoder().encode(request)
        let object = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])

        XCTAssertNil(object["attachmentId"], "the Host rejects a bare identity")
        XCTAssertEqual(object["sessionId"] as? String, "s1")
        let reference = try XCTUnwrap(object["attachment"] as? [String: Any])
        XCTAssertEqual(reference["attachmentId"] as? String, attachment.attachmentId)
        XCTAssertEqual(reference["mediaType"] as? String, "image/png")
        XCTAssertEqual(reference["bytes"] as? Int, 69)
        XCTAssertEqual(reference["width"] as? Double, 1)
        XCTAssertEqual(reference["height"] as? Double, 1)
        XCTAssertEqual(reference["name"] as? String, "reference-1.png")
    }
}
