//
//  RiskGate.swift
//  Tomato Runner
//
//  Deterministic confirmation for irreversible actions.
//
//  The gate runs inside the runner because both callers — the Host session and
//  the on-device task loop — must be held to the same rule. A prompt instruction
//  asking the model to be careful is not a control.
//

import CryptoKit
import Foundation

/// Rules loaded from `RiskRules.json`.
struct RiskRules: Codable {
    var version: Int
    var keywords: [String]
    var blockedBundleIds: [String]
    var sensitiveTextPatterns: [String]
}

/// Issues and validates one-shot confirmation tokens.
final class RiskGate {
    private struct Pending {
        let actionHash: String
        let reason: String
        let expiresAt: Date
    }

    let rules: RiskRules
    private let lock = NSLock()
    private var pending: [String: Pending] = [:]

    init(rules: RiskRules) {
        self.rules = rules
    }

    /// Load the bundled rules, falling back to the built-in set when the
    /// resource is missing from a test bundle.
    /// @param bundle - bundle that carries `RiskRules.json`.
    static func loadRules(bundle: Bundle) -> RiskRules {
        if let url = bundle.url(forResource: "RiskRules", withExtension: "json"),
           let data = try? Data(contentsOf: url),
           let rules = try? JSONDecoder().decode(RiskRules.self, from: data)
        {
            return rules
        }
        return RiskRules(
            version: 1,
            keywords: ["支付", "付款", "删除", "发送", "分享", "Pay", "Buy", "Send", "Delete", "Share"],
            blockedBundleIds: ["com.apple.Passbook"],
            sensitiveTextPatterns: []
        )
    }

    /// Decide whether an action needs a person.
    /// @param action - action about to run.
    /// @param targetLabels - labels and values of the element it touches.
    /// @param foregroundBundleId - application in front.
    /// @returns the refusal carrying a confirmation token, or nil to proceed.
    func evaluate(action: PhoneAction, targetLabels: [String], foregroundBundleId: String) -> PhoneFailure? {
        if rules.blockedBundleIds.contains(foregroundBundleId) {
            return PhoneFailure(.blockedApp, "这个应用被列为禁止操作", details: .object(["bundleId": .string(foregroundBundleId)]))
        }
        let haystack = targetLabels.joined(separator: " ") + " " + (action.text ?? "")
        guard let keyword = matchedKeyword(in: haystack) else {
            if action.type == .type, let text = action.text, matchesSensitive(text) {
                return refusal(reason: "输入的文本像卡号、证件号或验证码", target: "输入框", action: action)
            }
            return nil
        }
        return refusal(reason: "命中风险词：\(keyword)", target: targetLabels.first(where: { $0.contains(keyword) }) ?? keyword, action: action)
    }

    /// Consume a token issued for exactly this action.
    /// @param token - token from a previous refusal.
    /// @param action - action being retried.
    /// @returns whether the token authorizes this action.
    func consume(token: String, for action: PhoneAction) -> Bool {
        lock.lock()
        defer { lock.unlock() }
        guard let entry = pending.removeValue(forKey: token), entry.expiresAt > Date(),
              entry.actionHash == Self.hash(action) else { return false }
        return true
    }

    private func refusal(reason: String, target: String, action: PhoneAction) -> PhoneFailure {
        let token = UUID().uuidString
        lock.lock()
        pending = pending.filter { $0.value.expiresAt > Date() }
        pending[token] = Pending(actionHash: Self.hash(action), reason: reason, expiresAt: Date().addingTimeInterval(60))
        lock.unlock()
        return PhoneFailure(
            .needsConfirmation,
            reason,
            details: .object([
                "reason": .string(reason),
                "target": .string(target),
                "confirmToken": .string(token),
            ])
        )
    }

    private func matchedKeyword(in text: String) -> String? {
        guard !text.isEmpty else { return nil }
        return rules.keywords.first { text.localizedCaseInsensitiveContains($0) }
    }

    private func matchesSensitive(_ text: String) -> Bool {
        rules.sensitiveTextPatterns.contains { pattern in
            text.range(of: pattern, options: .regularExpression) != nil
        }
    }

    private static func hash(_ action: PhoneAction) -> String {
        let data = (try? JSONEncoder().encode(action)) ?? Data()
        return SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
    }
}
