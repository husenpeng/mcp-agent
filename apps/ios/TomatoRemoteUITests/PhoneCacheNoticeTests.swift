//
//  PhoneCacheNoticeTests.swift
//  TomatoRemoteUITests
//
//  The cache notice is visible and dismissible; the detection itself is covered
//  by ModelCacheHealthTests.
//

import XCTest

final class PhoneCacheNoticeTests: XCTestCase {
    func testCacheNoticeShowsAndDismisses() throws {
        guard let host = ProcessInfo.processInfo.environment["TOMATO_UITEST_HOST"], !host.isEmpty else {
            throw XCTSkip("TOMATO_UITEST_HOST is not set")
        }
        let app = XCUIApplication()
        app.launchArguments = [
            "-TOMATO_NO_LOCK", "-TOMATO_NO_NOTIFICATIONS", "-TOMATO_PHONE_TAB",
            "-TOMATO_CACHE_NOTICE_DEMO", "-TOMATO_PREVIEW_PAIRING", host,
        ]
        app.launch()

        let notice = app.descendants(matching: .any)["phone.cache.notice"]
        XCTAssertTrue(notice.waitForExistence(timeout: 10), "the cache notice is missing")
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = "phone-cache-notice"
        shot.lifetime = .keepAlways
        add(shot)
        app.buttons["phone.cache.dismiss"].tap()
        XCTAssertTrue(notice.waitForNonExistence(timeout: 5), "the cache notice did not dismiss")
    }
}
