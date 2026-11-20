//
//  AgentServiceUploadTests.swift
//  TomatoRemoteTests
//
//  The service binds every attachment to one session, so the upload names that
//  session beside the file. An upload without it is refused before the bytes
//  are stored, and the turn then has no attachment id to carry.
//

@testable import TomatoRemote
import XCTest

final class AgentServiceUploadTests: XCTestCase {
    /// Remembers the one request the stubbed transport received.
    private actor RequestLog {
        private(set) var request: URLRequest?

        func record(_ request: URLRequest) {
            self.request = request
        }
    }

    /// Stub the transport so one upload runs without a service.
    private func client(
        loggingTo log: RequestLog,
        status: Int,
        body: String
    ) throws -> AgentServiceClient {
        let base = try XCTUnwrap(URL(string: "https://service.example"))
        var client = AgentServiceClient(base: base, sessionId: "cookie-session")
        client.fetch = { request in
            await log.record(request)
            let url = try XCTUnwrap(request.url)
            let response = try XCTUnwrap(HTTPURLResponse(url: url, statusCode: status, httpVersion: nil, headerFields: nil))
            return (Data(body.utf8), response)
        }
        return client
    }

    func testUploadNamesTheSessionBesideTheFile() async throws {
        let log = RequestLog()
        let client = try client(
            loggingTo: log,
            status: 201,
            body: #"{"code":0,"message":"success","data":{"attachmentId":"att_1","sessionId":"ses_42"}}"#
        )

        let id = try await client.uploadAttachment(
            sessionId: "ses_42",
            data: Data("TOMATO".utf8),
            name: "probe.pdf",
            mime: "application/pdf"
        )

        XCTAssertEqual(id, "att_1")
        let recorded = await log.request
        let request = try XCTUnwrap(recorded)
        XCTAssertEqual(request.url?.path, "/api/agent-v2/attachments")
        let body = String(decoding: request.httpBody ?? Data(), as: UTF8.self)
        XCTAssertTrue(body.contains("name=\"sessionId\"\r\n\r\nses_42\r\n"), body)
        XCTAssertTrue(body.contains("name=\"file\"; filename=\"probe.pdf\""), body)
        XCTAssertTrue(body.contains("Content-Type: application/pdf"), body)
        XCTAssertTrue(body.contains("TOMATO"), body)
    }

    func testUploadRefusalSurfacesTheServiceMessage() async throws {
        let log = RequestLog()
        let client = try client(
            loggingTo: log,
            status: 400,
            body: #"{"code":40001,"message":"请求参数不合法。"}"#
        )

        do {
            _ = try await client.uploadAttachment(
                sessionId: "ses_42",
                data: Data("TOMATO".utf8),
                name: "probe.pdf",
                mime: "application/pdf"
            )
            XCTFail("an upload refused by the service must not yield an id")
        } catch let error as AgentServiceError {
            XCTAssertEqual(error.errorDescription, "请求参数不合法。")
        }
    }
}
