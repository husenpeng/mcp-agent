//
//  WorkMode.swift
//  Tomato Remote
//
//  Which side of the pair does the work right now.
//
//  The two capabilities never run at once: "Mac" sends instructions to the Mac
//  Agent, and "phone" hands the screen to this phone's runner. The switch is
//  explicit because the app cannot tell from context which one the owner means,
//  and because leaving phone mode must release the device lease.
//

import Foundation

/// One of the app's two working modes.
enum WorkMode: String, CaseIterable, Identifiable, Sendable {
    /// Send instructions to the paired Mac; the phone only shows and answers.
    case mac
    /// Hand the screen to this phone's runner for a local task.
    case phone

    var id: String {
        rawValue
    }

    /// Tab-title text.
    var title: String {
        switch self {
        case .mac: "操控 Mac"
        case .phone: "操控这台手机"
        }
    }

    /// One sentence on what the mode changes.
    var summary: String {
        switch self {
        case .mac:
            "指令发给 Mac 上的 Agent，结果与审批回到这台手机。手机自己不执行任何操作。"
        case .phone:
            "由这台手机的 Runner 读屏、点击与输入；App 只负责发起任务和展示进度。切回 Mac 模式会释放对手机的占用。"
        }
    }
}

/// Remembers the mode across launches.
enum WorkModeStore {
    private static let key = "workMode"

    static func load() -> WorkMode {
        UserDefaults.standard.string(forKey: key).flatMap(WorkMode.init(rawValue:)) ?? .mac
    }

    /// @param mode - mode the owner selected.
    static func save(_ mode: WorkMode) {
        UserDefaults.standard.set(mode.rawValue, forKey: key)
    }
}
