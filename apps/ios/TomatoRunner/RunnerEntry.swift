//
//  RunnerEntry.swift
//  Tomato Runner
//
//  Entry point of the long-lived XCUITest runner. The test never finishes on
//  its own: it starts the loopback server, then blocks until a stop request.
//
//  XCTest ends a test as soon as it records a failure, which would take the
//  server down with it, so failures are swallowed and control interruptions do
//  not halt the run — the same shape WebDriverAgent established.
//

import UIKit
import UserNotifications
import XCTest

/// The runner's single test case; its body is the server's lifetime.
final class RunnerEntry: XCTestCase, UNUserNotificationCenterDelegate {
    private var server: LoopbackServer?
    private var engine: Engine?
    /// Strong owner of the task loop: the engine only holds a weak reference so
    /// the two do not retain each other.
    private var brain: Brain?

    override func setUpWithError() throws {
        continueAfterFailure = true
        if responds(to: Selector(("setShouldHaltWhenReceivesControl:"))) {
            setValue(false, forKey: "shouldHaltWhenReceivesControl")
        }
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        Notifier.register(center: center)
        center.requestAuthorization(options: [.alert, .sound]) { granted, error in
            Log.shared.append("notification authorization granted=\(granted) error=\(error?.localizedDescription ?? "none")")
        }
    }

    /// Exercise the loopback HTTP endpoint on the device.
    func testTransport() {
        let steps = TransportCheck.run()
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        print("TRANSPORT_JSON_BEGIN")
        print((try? encoder.encode(steps)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]")
        print("TRANSPORT_JSON_END")
        XCTAssertTrue(steps.allSatisfy(\.ok), "transport failed: \(steps.filter { !$0.ok }.map(\.name))")
    }

    /// Report the private entry points this XCTest build exposes.
    func testProbe() {
        let report = Probe.run()
        print("PROBE_JSON_BEGIN")
        print((try? JSONSerialization.data(withJSONObject: report, options: [.prettyPrinted, .sortedKeys])).flatMap { String(
            data: $0,
            encoding: .utf8
        ) } ?? "{}")
        print("PROBE_JSON_END")
    }

    /// Task-loop wire shapes, checked with no model and no screen work.
    ///
    /// The scripted provider never reads a request, so a shape only one API
    /// accepts would otherwise wait for a real key to show up as an HTTP 400.
    func testBrainWire() {
        let failures = BrainCheck.run()
        print("BRAIN_JSON_BEGIN")
        print(failures.isEmpty ? "ok" : failures.joined(separator: "\n"))
        print("BRAIN_JSON_END")
        XCTAssertTrue(failures.isEmpty, "brain wire check failed: \(failures.joined(separator: " / "))")
    }

    /// Scripted engine pass, used as the real-device acceptance for M0.
    ///
    /// It runs on the device with no Mac in the loop: the engine is driven
    /// directly, so a failure here is the engine's, not the transport's.
    func testSelfCheck() throws {
        let engine = Engine()
        let report = try SelfCheck.run(engine: engine)
        let failures = report.steps.filter { !$0.ok }
        XCTAssertTrue(failures.isEmpty, "self-check failed: \(failures.map(\.name).joined(separator: ", "))")
    }

    /// Start the local endpoint and block. `stop` (or a test timeout) ends it.
    ///
    /// Gated on `TEST_RUNNER_TOMATO_RUNNER_SERVE=1`: the serve test never
    /// returns, so it must not start during a plain `xcodebuild test`.
    func testServe() {
        guard ProcessInfo.processInfo.environment["TOMATO_RUNNER_SERVE"] == "1" else {
            print("TOMATO_RUNNER_SERVE is not set; the serve test stays idle")
            return
        }
        _ = UIDevice.current
        // An explicit launch environment outranks a stored credential: the
        // operator who supplies one expects this process to use it.
        if let credential = ProcessInfo.processInfo.environment["TOMATO_RUNNER_CREDENTIAL"], !credential.isEmpty {
            PairCoordinator.shared.restore(credential)
            CredentialStore.save(credential)
        } else if let saved = CredentialStore.load() {
            PairCoordinator.shared.restore(saved)
        }
        let port = ProcessInfo.processInfo.environment["TOMATO_RUNNER_PORT"].flatMap { UInt16($0) } ?? PhoneProtocol.defaultPort
        let engine = Engine()
        self.engine = engine
        // The Host link is the only consumer of `link.set`; it dials out and
        // replaces its connection whenever new credentials arrive.
        // The loop lives in this process: the application is suspended as soon
        // as a task drives another app.
        let brain = Brain(engine: engine)
        self.brain = brain
        engine.brain = brain
        let hostLink = HostLink(engine: engine)
        engine.linkUpdate = { config in
            if let config {
                hostLink.configure(config)
            } else {
                hostLink.stop()
            }
        }
        if let base = ProcessInfo.processInfo.environment["TOMATO_HOST_BASE"],
           let credential = ProcessInfo.processInfo.environment["TOMATO_HOST_CREDENTIAL"],
           let deviceId = ProcessInfo.processInfo.environment["TOMATO_DEVICE_ID"]
        {
            hostLink.configure(PhoneLinkSetRequest(
                hostBase: base,
                credential: credential,
                deviceId: deviceId,
                deviceName: UIDevice.current.name
            ))
        }
        let server = LoopbackServer(engine: engine, port: port)
        self.server = server
        guard server.start() else {
            Log.shared.append("loopback bind failed on port \(port)")
            XCTFail("Tomato Runner could not bind 127.0.0.1:\(port)")
            return
        }
        Log.shared.append("Tomato Runner \(BuildStamp.value) ready (protocol \(PhoneProtocol.version))")
        while !RunnerExit.isRequested {
            RunLoop.current.run(mode: .default, before: Date().addingTimeInterval(0.5))
        }
        server.stop()
        Log.shared.append("Tomato Runner stopped")
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        switch response.actionIdentifier {
        case Notifier.allowAction:
            if !ConfirmCenter.shared.settle(allowed: true) {
                PairCoordinator.shared.settle(allowed: true)
            }
        case Notifier.denyAction:
            if !ConfirmCenter.shared.settle(allowed: false) {
                PairCoordinator.shared.settle(allowed: false)
            }
        case UNNotificationDefaultActionIdentifier:
            break
        default:
            break
        }
        completionHandler()
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound])
    }
}
