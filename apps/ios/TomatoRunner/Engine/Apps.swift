//
//  Apps.swift
//  Tomato Runner
//
//  Application lookup, launch, and the foreground reading.
//
//  iOS offers no public "which app is in front" query from a test process, so
//  the engine tracks the application it bound on launch and verifies that the
//  application still reports `runningForeground`. When it does not, SpringBoard
//  is reported instead.
//

import XCTest

/// Known system applications, used to resolve a name without a Mac.
enum Apps {
    /// Bundle ids the engine can launch by name on this platform.
    static let known: [PhoneAppMatch] = [
        .init(bundleId: "com.apple.Preferences", name: "设置"),
        .init(bundleId: "com.apple.mobilenotes", name: "备忘录"),
        .init(bundleId: "com.apple.MobileSMS", name: "信息"),
        .init(bundleId: "com.apple.mobilesafari", name: "Safari"),
        .init(bundleId: "com.apple.MobileMail", name: "邮件"),
        .init(bundleId: "com.apple.mobilecal", name: "日历"),
        .init(bundleId: "com.apple.Photos", name: "照片"),
        .init(bundleId: "com.apple.camera", name: "相机"),
        .init(bundleId: "com.apple.Maps", name: "地图"),
        .init(bundleId: "com.apple.AppStore", name: "App Store"),
        .init(bundleId: "com.apple.springboard", name: "主屏幕"),
        .init(bundleId: "com.apple.Music", name: "音乐"),
        .init(bundleId: "com.apple.reminders", name: "提醒事项"),
        .init(bundleId: "com.apple.DocumentsApp", name: "文件"),
        .init(bundleId: "com.apple.Passbook", name: "钱包"),
    ]

    /// Resolve a user-supplied name or bundle id.
    /// @param query - bundle id, or a localized application name.
    /// @param history - applications this device launched before.
    /// @returns every plausible match, exact bundle id first.
    static func resolve(query: String, history: [PhoneAppMatch]) -> [PhoneAppMatch] {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return [] }
        let pool = history + known
        var matches: [PhoneAppMatch] = []
        var seen = Set<String>()
        // A bundle id is a complete answer on its own: the offline table can
        // never list every installed application, and the caller that names one
        // already knows what it wants.
        if trimmed.contains(".") && !trimmed.contains(" ") {
            matches.append(PhoneAppMatch(bundleId: trimmed, name: trimmed))
            seen.insert(trimmed)
        }
        for candidate in pool {
            let exact = candidate.bundleId.caseInsensitiveCompare(trimmed) == .orderedSame
            let named = candidate.name.caseInsensitiveCompare(trimmed) == .orderedSame
            let partial = candidate.name.localizedCaseInsensitiveContains(trimmed)
            guard exact || named || partial, seen.insert(candidate.bundleId).inserted else { continue }
            matches.append(candidate)
        }
        return matches.sorted { lhs, rhs in
            let lhsExact = lhs.bundleId.caseInsensitiveCompare(trimmed) == .orderedSame
            let rhsExact = rhs.bundleId.caseInsensitiveCompare(trimmed) == .orderedSame
            if lhsExact != rhsExact {
                return lhsExact
            }
            return lhs.name.localizedCaseInsensitiveCompare(rhs.name) == .orderedAscending
        }
    }

    /// Launch one application.
    /// @param bundleId - application to start.
    /// @param fresh - whether to terminate it first so it opens at its root.
    /// @returns the application, ready for a snapshot.
    /// Launch one application.
    /// @param bundleId - application to start.
    /// @param fresh - whether to terminate it first so it opens at its root.
    /// @param arguments - launch arguments the target build may read.
    /// @returns the application, ready for a snapshot.
    static func launch(bundleId: String, fresh: Bool, arguments: [String] = []) -> XCUIApplication {
        let app = XCUIApplication(bundleIdentifier: bundleId)
        if !arguments.isEmpty {
            app.launchArguments = arguments
        }
        if fresh {
            app.terminate()
        }
        app.launch()
        return app
    }

    /// Open a URL through LaunchServices.
    ///
    /// A test bundle cannot call `UIApplication.open`, so this asks
    /// LaunchServices directly. The call is best-effort: when the private
    /// entry point is unavailable the action reports `INTERNAL` instead of
    /// pretending to have opened anything.
    /// @param url - target URL.
    /// @returns whether LaunchServices accepted the request.
    static func open(url: URL) -> Bool {
        guard let workspaceClass = NSClassFromString("LSApplicationWorkspace") as? NSObject.Type else {
            return false
        }
        let defaultSelector = NSSelectorFromString("defaultWorkspace")
        guard workspaceClass.responds(to: defaultSelector),
              let unmanaged = workspaceClass.perform(defaultSelector)
        else { return false }
        let workspace = unmanaged.takeUnretainedValue() as AnyObject
        let openSelector = NSSelectorFromString("openURL:withOptions:error:")
        guard workspace.responds(to: openSelector) else { return false }
        typealias OpenFunction = @convention(c) (AnyObject, Selector, NSURL, NSDictionary?, NSErrorPointer) -> Bool
        let implementation = workspace.method(for: openSelector)
        let function = unsafeBitCast(implementation, to: OpenFunction.self)
        var error: NSError?
        return function(workspace, openSelector, url as NSURL, nil, &error)
    }
}
