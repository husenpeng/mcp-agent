//
//  Engine+Act.swift
//  Tomato Runner
//
//  Action execution: resolve a ref against the current screen, pass the risk
//  gate, synthesize the gesture, then read the settled screen back.
//

import UIKit
import XCTest

extension Engine {

    func act(request: PhoneActRequest) throws -> PhoneJSON {
        try requireLease(holder: nil)
        let action = request.action
        let app = currentApplication()
        let bundleId = bundleIdentifier(of: app)
        let target = try resolveTarget(for: action)
        let labels = [target?.label, target?.value].compactMap { $0 }
        if let failure = risk.evaluate(action: action, targetLabels: labels, foregroundBundleId: bundleId) {
            if let token = request.confirmToken, risk.consume(token: token, for: action) {
                Log.shared.append("act: confirmation accepted for \(action.type.rawValue)")
            } else {
                throw failure
            }
        }
        let before = lastSnapshot?.signature
        let hint = try execute(action, target: target, app: app)
        // A push navigation settles well after the first read: the acceptance
        // saw a 通用 tap answer with the root screen while the page had already
        // changed. Read again until the screen stops matching the pre-action
        // signature, up to about two seconds.
        Thread.sleep(forTimeInterval: 0.3)
        var after = try observe(request: PhoneObserveRequest(maxElements: nil, includeOcr: nil, screenshot: nil))
        var attempts = 0
        while attempts < 6, after.signature == before {
            Thread.sleep(forTimeInterval: 0.3)
            after = try observe(request: PhoneObserveRequest(maxElements: nil, includeOcr: nil, screenshot: nil))
            attempts += 1
        }
        let changed = before != nil && before != after.signature
        var result = PhoneActResult(ok: true, pageChanged: changed, foreground: after.observation.foreground, hint: hint, observation: nil)
        if request.observeAfter ?? true {
            result.observation = after.observation
        }
        Log.shared.append("act: \(action.type.rawValue) changed=\(changed)")
        return try PhoneJSON.from(result)
    }

    /// Re-read the screen and prove the ref still names the same element.
    ///
    /// A ref is an index into one observation. Between observing and acting the
    /// screen may have changed, so the current dump is parsed again and the same
    /// index must still carry the same role and label; anything else is
    /// `STALE_REF` rather than a tap at a remembered coordinate.
    func resolveTarget(for action: PhoneAction) throws -> SnapshotTarget? {
        guard let ref = action.ref else { return nil }
        guard let recorded = lastSnapshot?.targets[ref] else {
            throw PhoneFailure(.staleRef, "元素 \(ref) 不在最近一次观测里，请重新观测")
        }
        let app = currentApplication()
        let current = SnapshotReader.read(app: app, maxElements: 200)
        guard let now = current.targets[ref] else {
            throw PhoneFailure(.staleRef, "元素 \(ref) 已经不在屏幕上，请重新观测")
        }
        guard now.role == recorded.role, now.label == recorded.label else {
            throw PhoneFailure(.staleRef, "元素 \(ref) 已经变成“\(now.label)”，请重新观测")
        }
        return now
    }

    func execute(_ action: PhoneAction, target: SnapshotTarget?, app: XCUIApplication) throws -> String {
        switch action.type {
        case .tap:
            let point = try point(for: action, target: target, app: app)
            if action.count == 2 {
                try Input.doubleTap(at: point)
                return "双击 (\(Int(point.x)), \(Int(point.y)))"
            }
            try Input.tap(at: point)
            return "点击 (\(Int(point.x)), \(Int(point.y)))"
        case .longPress:
            let point = try point(for: action, target: target, app: app)
            try Input.longPress(at: point, durationMs: action.durationMs ?? 800)
            return "长按 (\(Int(point.x)), \(Int(point.y)))"
        case .swipe:
            let (from, to) = try swipePoints(action, app: app)
            try Input.swipe(from: from, to: to, durationMs: action.durationMs ?? 300)
            return " swipe (\(Int(from.x)), \(Int(from.y))) → (\(Int(to.x)), \(Int(to.y)))"
        case .type:
            guard let text = action.text else {
                throw PhoneFailure(.badRequest, "type 缺少 text")
            }
            if let target {
                try Input.tap(at: target.frame.center)
                Thread.sleep(forTimeInterval: 0.15)
            }
            try Input.type(text: text, submit: action.submit ?? false)
            return "输入 \(text.count) 个字符"
        case .press:
            switch action.button ?? .home {
            case .home:
                XCUIDevice.shared.press(.home)
                setBoundApplication("com.apple.springboard")
                return "回到主屏幕"
            case .volumeUp:
                XCUIDevice.shared.press(.volumeUp)
                return "音量加"
            case .volumeDown:
                XCUIDevice.shared.press(.volumeDown)
                return "音量减"
            }
        case .launch:
            let query = action.bundleId ?? action.name ?? ""
            let matches = Apps.resolve(query: query, history: history)
            guard let match = matches.first else {
                throw PhoneFailure(.notFound, "找不到应用 \(query)")
            }
            let launched = Apps.launch(
                bundleId: match.bundleId,
                fresh: action.fresh ?? false,
                arguments: action.arguments ?? []
            )
            setBoundApplication(match.bundleId)
            if !history.contains(where: { $0.bundleId == match.bundleId }) {
                history.append(match)
            }
            _ = launched
            return "打开 \(match.name)"
        case .openUrl:
            guard let raw = action.url, let url = URL(string: raw) else {
                throw PhoneFailure(.badRequest, "openUrl 需要合法的 url")
            }
            guard Apps.open(url: url) else {
                throw PhoneFailure(.internal, "LaunchServices 没有接受这个 URL")
            }
            return "打开 \(raw)"
        case .wait:
            if let untilText = action.untilText {
                let deadline = Date().addingTimeInterval(Double(action.timeoutMs ?? 5000) / 1000)
                while Date() < deadline {
                    let snapshot = SnapshotReader.read(app: app, maxElements: 200)
                    if snapshot.observation.elements.contains(where: { $0.label.localizedCaseInsensitiveContains(untilText) }) {
                        return "出现 \(untilText)"
                    }
                    Thread.sleep(forTimeInterval: 0.2)
                }
                throw PhoneFailure(.notFound, "等待 \(untilText) 超时")
            }
            let ms = max(0, min(10000, action.ms ?? 500))
            Thread.sleep(forTimeInterval: Double(ms) / 1000)
            return "等待 \(ms)ms"
        }
    }

    func point(for action: PhoneAction, target: SnapshotTarget?, app: XCUIApplication) throws -> CGPoint {
        if let point = action.point {
            return CGPoint(x: point.x, y: point.y)
        }
        guard let target else {
            throw PhoneFailure(.badRequest, "需要 ref 或 point")
        }
        return target.frame.center
    }

    func swipePoints(_ action: PhoneAction, app: XCUIApplication) throws -> (CGPoint, CGPoint) {
        if let from = action.from, let to = action.to {
            return (CGPoint(x: from.x, y: from.y), CGPoint(x: to.x, y: to.y))
        }
        let bounds = app.frame
        let center = bounds.center
        let distance = min(bounds.width, bounds.height) * 0.35
        switch action.direction ?? .up {
        case .up: return (CGPoint(x: center.x, y: center.y + distance), CGPoint(x: center.x, y: center.y - distance))
        case .down: return (CGPoint(x: center.x, y: center.y - distance), CGPoint(x: center.x, y: center.y + distance))
        case .left: return (CGPoint(x: center.x + distance, y: center.y), CGPoint(x: center.x - distance, y: center.y))
        case .right: return (CGPoint(x: center.x - distance, y: center.y), CGPoint(x: center.x + distance, y: center.y))
        }
    }

}
