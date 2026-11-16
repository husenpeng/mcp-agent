//
//  ModelCatalogCacheTests.swift
//  TomatoRemoteTests
//
//  The phone's model-list cache: one entry per protocol, endpoint, and key,
//  reused while fresh, shown when the endpoint is unreachable, and stored
//  without the credential itself.
//

@testable import TomatoRemote
import XCTest

@MainActor
final class ModelCatalogCacheTests: XCTestCase {
    private var suite = ""
    private var defaults: UserDefaults!
    private let base = "https://example.com/v1"

    override func setUp() {
        super.setUp()
        suite = "ModelCatalogCacheTests.\(UUID().uuidString)"
        defaults = UserDefaults(suiteName: suite)
        defaults.removePersistentDomain(forName: suite)
    }

    override func tearDown() {
        defaults.removePersistentDomain(forName: suite)
        super.tearDown()
    }

    func testFingerprintSeparatesProtocolEndpointAndKey() {
        let openAI = ModelCatalogCache.fingerprint(protocol: .openai, baseURL: base, apiKey: "k1")
        XCTAssertEqual(openAI, ModelCatalogCache.fingerprint(protocol: .openai, baseURL: base + "/", apiKey: "k1"))
        XCTAssertNotEqual(openAI, ModelCatalogCache.fingerprint(protocol: .anthropic, baseURL: base, apiKey: "k1"))
        XCTAssertNotEqual(openAI, ModelCatalogCache.fingerprint(protocol: .openai, baseURL: base, apiKey: "k2"))
    }

    func testStoredEntryReadsBackWithoutPersistingTheKey() {
        let cache = ModelCatalogCache(defaults: defaults)
        cache.store(
            protocol: .anthropic,
            baseURL: base,
            apiKey: "secret-key",
            models: ["claude-a", "claude-b"],
            at: Date(timeIntervalSince1970: 1000)
        )
        let entry = cache.entry(
            protocol: .anthropic,
            baseURL: base,
            apiKey: "secret-key",
            now: Date(timeIntervalSince1970: 1100)
        )
        XCTAssertEqual(entry?.models, ["claude-a", "claude-b"])
        XCTAssertNil(cache.entry(protocol: .openai, baseURL: base, apiKey: "secret-key"))
        let stored = try? XCTUnwrap(defaults.data(forKey: "phoneModelCatalogCache.v1"))
        let text = stored.flatMap { String(data: $0, encoding: .utf8) } ?? ""
        XCTAssertFalse(text.contains("secret-key"))
    }

    func testExpiredEntryIsNotReturned() {
        let cache = ModelCatalogCache(defaults: defaults)
        cache.store(protocol: .openai, baseURL: base, apiKey: "k", models: ["m"], at: Date(timeIntervalSince1970: 0))
        XCTAssertNil(cache.entry(
            protocol: .openai,
            baseURL: base,
            apiKey: "k",
            now: Date(timeIntervalSince1970: ModelCatalogCache.staleAfter + 1)
        ))
    }

    func testCacheKeepsTheNewestEightEntries() {
        let cache = ModelCatalogCache(defaults: defaults)
        for index in 0 ..< 10 {
            cache.store(
                protocol: .openai,
                baseURL: "https://example.com/v1/\(index)",
                apiKey: "k",
                models: ["m\(index)"],
                at: Date(timeIntervalSince1970: Double(index))
            )
        }
        let oldest = cache.entry(
            protocol: .openai,
            baseURL: "https://example.com/v1/0",
            apiKey: "k",
            now: Date(timeIntervalSince1970: 10)
        )
        XCTAssertNil(oldest)
        let newest = cache.entry(
            protocol: .openai,
            baseURL: "https://example.com/v1/9",
            apiKey: "k",
            now: Date(timeIntervalSince1970: 10)
        )
        XCTAssertEqual(newest?.models, ["m9"])
    }

    func testCatalogReusesAFreshStoredListWithoutFetching() async {
        let cache = ModelCatalogCache(defaults: defaults)
        cache.store(protocol: .openai, baseURL: base, apiKey: "k", models: ["stored"])
        var calls = 0
        let catalog = PhoneModelCatalog(cache: cache) { _ in
            calls += 1
            throw URLError(.notConnectedToInternet)
        }
        await catalog.load(protocol: .openai, baseURL: base, apiKey: "k")
        XCTAssertEqual(catalog.models, ["stored"])
        XCTAssertNil(catalog.error)
        XCTAssertEqual(calls, 0)
    }

    func testCatalogShowsTheStoredListWhenTheReadFails() async {
        let cache = ModelCatalogCache(defaults: defaults)
        cache.store(
            protocol: .openai,
            baseURL: base,
            apiKey: "k",
            models: ["stored"],
            at: Date.now.addingTimeInterval(-(ModelCatalogCache.freshFor + 1))
        )
        let catalog = PhoneModelCatalog(cache: cache) { _ in
            throw URLError(.notConnectedToInternet)
        }
        await catalog.load(protocol: .openai, baseURL: base, apiKey: "k")
        XCTAssertEqual(catalog.models, ["stored"])
        XCTAssertNotNil(catalog.error)
    }

    func testCatalogFetchesAndCachesAnOpenAIList() async {
        let cache = ModelCatalogCache(defaults: defaults)
        var requested: URLRequest?
        let catalog = PhoneModelCatalog(cache: cache) { request in
            requested = request
            let body = Data(#"{"data":[{"id":"gpt-b"},{"id":"gpt-a"}]}"#.utf8)
            return (body, HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
                httpVersion: "HTTP/1.1",
                headerFields: ["Content-Type": "application/json"]
            )!)
        }
        await catalog.load(protocol: .openai, baseURL: base, apiKey: "sk")
        XCTAssertEqual(catalog.models, ["gpt-a", "gpt-b"])
        XCTAssertEqual(requested?.url?.absoluteString, "\(base)/models")
        XCTAssertEqual(requested?.value(forHTTPHeaderField: "Authorization"), "Bearer sk")
        XCTAssertNotNil(cache.entry(protocol: .openai, baseURL: base, apiKey: "sk"))
    }

    func testCatalogFetchesAndCachesAnAnthropicList() async {
        let cache = ModelCatalogCache(defaults: defaults)
        var requested: URLRequest?
        let catalog = PhoneModelCatalog(cache: cache) { request in
            requested = request
            let body = Data(#"{"data":[{"id":"claude-b"},{"id":"claude-a"}]}"#.utf8)
            return (body, HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
                httpVersion: "HTTP/1.1",
                headerFields: ["Content-Type": "application/json"]
            )!)
        }
        await catalog.load(protocol: .anthropic, baseURL: "https://api.anthropic.com", apiKey: "ak")
        XCTAssertEqual(catalog.models, ["claude-a", "claude-b"])
        XCTAssertEqual(requested?.url?.absoluteString, "https://api.anthropic.com/v1/models")
        XCTAssertEqual(requested?.value(forHTTPHeaderField: "x-api-key"), "ak")
        XCTAssertNotNil(cache.entry(protocol: .anthropic, baseURL: "https://api.anthropic.com", apiKey: "ak"))
    }
}
