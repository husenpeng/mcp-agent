//
//  AgentServiceFailureTests.swift
//  TomatoRemoteTests
//
//  A phone holds one Feishu session, and the BFF rejects an expired one with a
//  bare 401. That has to read as "sign in again", not as an opaque refusal, and
//  an unreachable origin has to name the address it dialed.
//

@testable import TomatoRemote
import XCTest

final class AgentServiceFailureTests: XCTestCase {
    /// Client whose transport fails or answers as told.
    private func client(status: Int, body: String) throws -> AgentServiceClient {
        let base = try XCTUnwrap(URL(string: "https://service.example:8443"))
        var client = AgentServiceClient(base: base, sessionId: "cookie-session")
        client.fetch = { request in
            let url = try XCTUnwrap(request.url)
            let response = try XCTUnwrap(HTTPURLResponse(url: url, statusCode: status, httpVersion: nil, headerFields: nil))
            return (Data(body.utf8), response)
        }
        return client
    }

    func testRejectedCookieReadsAsSignInAgain() async throws {
        let client = try client(status: 401, body: #"{"message":"未登录"}"#)

        do {
            _ = try await client.listModels()
            XCTFail("a rejected cookie must not produce a model list")
        } catch let error as AgentServiceError {
            guard case .notSignedIn = error else {
                return XCTFail("expected .notSignedIn, got \(error)")
            }
            XCTAssertEqual(error.errorDescription, "飞书登录已失效，请重新登录。")
        }
    }

    func testNonJSONRefusalAlsoReadsAsSignInAgain() async throws {
        let client = try client(status: 401, body: "tomato web authentication required")

        do {
            _ = try await client.listModels()
            XCTFail("a rejected cookie must not produce a model list")
        } catch let error as AgentServiceError {
            guard case .notSignedIn = error else {
                return XCTFail("expected .notSignedIn, got \(error)")
            }
        }
    }

    func testTransportFailureNamesTheOrigin() async throws {
        let base = try XCTUnwrap(URL(string: "http://172.24.60.45:3000"))
        var client = AgentServiceClient(base: base, sessionId: "cookie-session")
        client.fetch = { _ in throw URLError(.cannotConnectToHost) }

        do {
            _ = try await client.listModels()
            XCTFail("an unreachable origin must not produce a model list")
        } catch let error as AgentServiceError {
            guard case let .transport(detail) = error else {
                return XCTFail("expected .transport, got \(error)")
            }
            XCTAssertTrue(detail.contains("172.24.60.45:3000"), detail)
            XCTAssertTrue(error.errorDescription?.hasPrefix("服务端连接失败") == true)
        }
    }

    /// A success envelope whose fields do not match the wire types must say
    /// which call and which field failed, not just "cannot parse".
    func testMalformedPayloadNamesTheCallAndField() async throws {
        let client = try client(status: 200, body: #"{"code":0,"message":"ok","data":{"sessionId":"s1"}}"#)

        do {
            _ = try await client.submitTurn(sessionId: "s1", text: "你好", attachmentIds: [])
            XCTFail("a turn acceptance without a turnId must not decode")
        } catch let error as AgentServiceError {
            guard case let .malformed(detail) = error else {
                return XCTFail("expected .malformed, got \(error)")
            }
            XCTAssertTrue(detail.contains("POST /api/agent-v2/sessions/s1/turns"), detail)
            XCTAssertTrue(detail.contains("turnId"), detail)
            XCTAssertTrue(error.errorDescription?.hasPrefix("服务端回应无法解析") == true)
        }
    }

    /// A non-JSON body on a successful status names the status and content type.
    func testNonJSONSuccessNamesTheContentType() async throws {
        let client = try client(status: 200, body: "<html>gateway</html>")

        do {
            _ = try await client.listModels()
            XCTFail("an HTML body must not produce a model list")
        } catch let error as AgentServiceError {
            guard case let .malformed(detail) = error else {
                return XCTFail("expected .malformed, got \(error)")
            }
            XCTAssertTrue(detail.contains("HTTP 200"), detail)
        }
    }

    /// The event log decodes step ids, which the audit panel groups by.
    func testEventLogDecodesStepIds() async throws {
        let body = #"""
        {"code":0,"message":"ok","data":{"sessionId":"s1","events":[{"eventId":"e1","seq":3,"type":"usage","surface":false,"turnId":"t1","stepId":"st1","payload":{"prompt_tokens":10,"completion_tokens":2},"createdAt":"2026-11-19T09:00:00Z"}],"nextAfterSeq":3}}
        """#
        let client = try client(status: 200, body: body)

        let page = try await client.events(sessionId: "s1")

        XCTAssertEqual(page.events.first?.stepId, "st1")
        XCTAssertEqual(page.nextAfterSeq, 3)
    }

    /// A conversation-list page with unfamiliar or retyped members still lists
    /// its conversations: the phone only reads that page.
    func testSessionListToleratesUnfamiliarMembers() async throws {
        let body = #"""
        {"code":0,"message":"ok","data":{"items":[
          {"sessionId":"s1","title":"帮我记住","preview":null,"turnCount":"3","lastActiveAt":1789000000000,"createdAt":null,"status":"open"},
          {"sessionId":"s2","title":null,"turnCount":null}
        ],"total":"2"}}
        """#
        let client = try client(status: 200, body: body)

        let page = try await client.sessions()

        XCTAssertEqual(page.items.map(\.sessionId), ["s1", "s2"])
        XCTAssertEqual(page.items.first?.turnCount, 3)
        XCTAssertNil(page.items.first?.lastActiveAt, "a numeric stamp stays unreadable text, not a crash")
        XCTAssertEqual(page.items.first?.title, "帮我记住")
    }

    /// A history page whose message body is unfamiliar still renders its rows.
    func testMessagesTolerateUnfamiliarBodies() async throws {
        let body = #"""
        {"code":0,"message":"ok","data":{"sessionId":"s1","hasMore":false,"nextBeforeSeq":1,"items":[
          {"messageId":"m1","seq":1,"role":"user","kind":"message","text":"你好","data":null},
          {"messageId":"m2","seq":2,"role":"assistant","kind":null,"text":null,"data":{"blocks":[]}}
        ]}}
        """#
        let client = try client(status: 200, body: body)

        let page = try await client.messages(sessionId: "s1")

        XCTAssertEqual(page.items.map(\.messageId), ["m1", "m2"])
        XCTAssertEqual(page.items.last?.kind, "message")
        XCTAssertEqual(page.items.last?.text, "")
    }

    /// A 404 HTML page names the status and content type, so an unshipped BFF
    /// route reads as one instead of a generic parse failure.
    func testHtmlNotFoundNamesTheStatusAndType() async throws {
        let client = try client(status: 404, body: "<!DOCTYPE html><html>Not Found</html>")

        do {
            _ = try await client.listModels()
            XCTFail("an HTML 404 must not produce a model list")
        } catch let error as AgentServiceError {
            guard case let .malformed(detail) = error else {
                return XCTFail("expected .malformed, got \(error)")
            }
            XCTAssertTrue(detail.contains("HTTP 404"), detail)
        }
    }
}
