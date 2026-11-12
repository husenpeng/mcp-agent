//
//  DebugLaunch.swift
//  Tomato Remote
//
//  Launch-time hooks a test run uses: naming its Host, previewing a Host file,
//  and the arguments that asked for either. A release build compiles all of it
//  out, so no shipped path pairs or downloads on its own.
//

import Foundation

extension AppModel {
    /// Print the launch arguments once, so a test run that cannot pair can be
    /// told apart from one whose arguments never arrived.
    static func logLaunchArguments() {
        #if DEBUG
            NSLog("TomatoRemote launch arguments: %@", ProcessInfo.processInfo.arguments.joined(separator: " "))
        #endif
    }

    /// Debug-only pairing from launch arguments, used by device test runs.
    ///
    /// Present only with `-TOMATO_PAIR_BASE <url> -TOMATO_PAIR_TOKEN <token>`;
    /// a release build ignores both.
    static var debugPairing: (base: URL, token: String)? {
        #if DEBUG
            let arguments = ProcessInfo.processInfo.arguments
            guard let baseIndex = arguments.firstIndex(of: "-TOMATO_PAIR_BASE"),
                  let tokenIndex = arguments.firstIndex(of: "-TOMATO_PAIR_TOKEN"),
                  arguments.indices.contains(baseIndex + 1), arguments.indices.contains(tokenIndex + 1),
                  let base = URL(string: arguments[baseIndex + 1])
            else { return nil }
            return (base, arguments[tokenIndex + 1])
        #else
            return nil
        #endif
    }
}

#if DEBUG
    extension LiveActivityController {
        /// The sample state a `-TOMATO_LIVE_DEMO <running|pending|done>` launch asks for.
        static var demoState: String? {
            let arguments = ProcessInfo.processInfo.arguments
            guard let index = arguments.firstIndex(of: "-TOMATO_LIVE_DEMO"),
                  arguments.indices.contains(index + 1)
            else { return nil }
            return arguments[index + 1]
        }

        /// Show the Live Activity from fixed sample content, so the Lock Screen
        /// card can be inspected on a device with no Session running: tapping it
        /// leads to an unknown Session and the app says so.
        /// - Parameter state: `running`, `pending`, or `done`.
        func startDemo(_ state: String) async {
            let detail = "正在写回答…"
            await begin(sessionId: "demo", title: "优化锁屏消息卡片", detail: detail)
            switch state {
            case "pending":
                await update(running: true, detail: detail, pending: 2)
            case "done":
                await update(running: false, detail: "已完成", pending: 0)
            default:
                await update(running: true, detail: detail, pending: 0)
            }
        }
    }
#endif
