//
//  AgentServiceThinkingTests.swift
//  TomatoRemoteTests
//
//  The service publishes each route's thinking whitelist, and a session may
//  only pin a depth from it. These cover the phone reading that list, ordering
//  it, and presenting the client identity the service keys the whitelist on.
//

@testable import TomatoRemote
import XCTest

final class AgentServiceThinkingTests: XCTestCase {
    /// Remembers the requests the stubbed transport received.
    private actor RequestLog {
        private(set) var requests: [URLRequest] = []

        func record(_ request: URLRequest) {
            requests.append(request)
        }
    }

    /// Stub the transport with one JSON body.
    private func client(loggingTo log: RequestLog, body: String) throws -> AgentServiceClient {
        let base = try XCTUnwrap(URL(string: "https://service.example"))
        var client = AgentServiceClient(base: base, sessionId: "cookie-session")
        client.fetch = { request in
            await log.record(request)
            let url = try XCTUnwrap(request.url)
            let response = try XCTUnwrap(HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: nil))
            return (Data(body.utf8), response)
        }
        return client
    }

    func testModelListReadsTheRouteWhitelist() async throws {
        let log = RequestLog()
        let client = try client(
            loggingTo: log,
            body: #"""
            {"code":0,"message":"success","data":{"items":[
              {"name":"claude","provider":"anthropic","model":"claude-sonnet-4-5","thinkingLevel":"high","thinkingLevels":["high","low"]},
              {"name":"plain","provider":"openai","model":"gpt-5","thinkingLevel":null,"thinkingLevels":[]}
            ],"total":2}}
            """#
        )

        let models = try await client.listModels()

        XCTAssertEqual(models.count, 2)
        let claude = try XCTUnwrap(models.first)
        XCTAssertEqual(claude.thinkingLevel, "high")
        XCTAssertEqual(claude.selectableThinkingLevels, ["low", "high"])
        let plain = try XCTUnwrap(models.last)
        XCTAssertEqual(plain.selectableThinkingLevels, [])
        XCTAssertFalse(plain.allowsThinkingLevel("low"))
        XCTAssertTrue(plain.allowsThinkingLevel(nil))
    }

    func testLevelsAreDeduplicatedAndUnknownNamesSortLast() {
        let model = AgentServiceModel(
            name: "route",
            provider: "openai",
            model: "m",
            thinkingLevel: nil,
            thinkingLevels: ["max", "weird", "low", "balanced", "low"]
        )

        XCTAssertEqual(model.selectableThinkingLevels, ["low", "balanced", "max", "weird"])
    }

    func testSessionCallsPresentTheWebClient() async throws {
        let log = RequestLog()
        let client = try client(loggingTo: log, body: #"{"code":0,"message":"success","data":{"items":[]}}"#)

        _ = try await client.listModels()

        let recorded = await log.requests.first
        let request = try XCTUnwrap(recorded)
        XCTAssertEqual(request.value(forHTTPHeaderField: "X-Client-Id"), AgentServiceClient.clientId)
        XCTAssertEqual(AgentServiceClient.clientId, "web")
    }

    func testSwitchingToARouteThatRejectsTheDepthSendsModelOnly() async throws {
        let log = RequestLog()
        let client = try client(loggingTo: log, body: #"{"code":0,"message":"success","data":{}}"#)

        try await client.patchSession(sessionId: "ses_1", modelRoute: "plain", thinkingLevel: nil)

        let recorded = await log.requests.first
        let request = try XCTUnwrap(recorded)
        let body = try XCTUnwrap(request.httpBody)
        let sent = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(sent["modelRoute"] as? String, "plain")
        XCTAssertNil(sent["thinkingLevel"])
    }
}