//
//  ChatLinkTests.swift
//  TomatoRemoteTests
//
//  A transcript's links: a path on the Mac becomes a Host file preview, the
//  app's own routes stay in the app, and anything else goes to the system.
//

@testable import TomatoRemote
import XCTest

final class ChatLinkTests: XCTestCase {
    /// An absolute path names a Mac file the Host can serve.
    func testAbsolutePathOpensTheHostPreview() throws {
        let link = try ChatLink(XCTUnwrap(URL(string: "/Users/me/report.png")))
        XCTAssertEqual(link, .hostFile("/Users/me/report.png"))
    }

    /// A file URL is the same destination in its explicit form.
    func testFileURLOpensTheHostPreview() throws {
        let link = try ChatLink(XCTUnwrap(URL(string: "file:///Users/me/report.png")))
        XCTAssertEqual(link, .hostFile("/Users/me/report.png"))
    }

    /// An ordinary web address stays with the system browser.
    func testHTTPSStaysExternal() throws {
        let url = try XCTUnwrap(URL(string: "https://example.com/report"))
        XCTAssertEqual(ChatLink(url), .external(url))
    }

    /// A `tomato://` address is a route inside this app.
    func testTomatoRouteStaysInTheApp() throws {
        let url = try XCTUnwrap(URL(string: "tomato://session/abc"))
        XCTAssertEqual(ChatLink(url), .appRoute(url))
    }

    /// Mail and telephone links belong to the system too.
    func testOtherSchemesStayExternal() throws {
        let mail = try XCTUnwrap(URL(string: "mailto:me@example.com"))
        XCTAssertEqual(ChatLink(mail), .external(mail))
    }

    /// A relative path has no base the message can supply, so the app does not
    /// guess one.
    func testRelativePathIsUnresolved() throws {
        let link = try ChatLink(XCTUnwrap(URL(string: "docs/report.png")))
        XCTAssertEqual(link, .unresolved)
    }

    /// A preview with no Host says why it cannot load instead of spinning.
    @MainActor
    func testPreviewWithoutAHostReportsTheReason() {
        let file = DeliveredFile(path: "/Users/me/report.png", description: nil, seq: nil)
        let preview = FilePreviewModel(file: file)
        preview.fail("未连接 Mac，无法读取这个文件。")
        XCTAssertEqual(preview.state, .failed("未连接 Mac，无法读取这个文件。"))
    }
}
