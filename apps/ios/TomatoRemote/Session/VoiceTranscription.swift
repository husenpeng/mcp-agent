//
//  VoiceTranscription.swift
//  Tomato Remote
//
//  Recognition settings and text clean-up for dictation.
//
//  A recognizer reports one hypothesis per update: words separated by spaces,
//  hesitations nobody meant to send, and punctuation that only settles once the
//  sentence is finished. This file holds the choices that make that stream land
//  in the composer as one sentence, and keeps them out of the session itself.
//

import Foundation

/// What every dictation session shares: the words the recognizer is primed
/// with, the locale it listens in, and the clean-up a spoken sentence needs.
enum VoiceTranscription {
    /// Phrases the owner actually says about this product, so the recognizer
    /// prefers them over their homophones. The on-device model weighs these
    /// strings more heavily; the server model accepts the same list.
    static let vocabulary: [String] = [
        "Tomato",
        "Harness",
        "DeepSeek",
        "这个会话",
        "打开对话",
        "发一条消息",
        "定时任务",
        "角色卡",
        "找出达人",
        "整理发布说明",
        "交付物",
        "子代理",
        "工具调用",
        "上下文",
        "记忆",
        "模型",
        "提示词",
        "重新运行",
        "暂停任务",
        "审批",
        "部署",
        "截图",
        "飞书",
    ]

    /// Hesitations that carry no meaning when they open a sentence.
    private static let leadingHesitations: Set<Character> = ["嗯", "呃", "额", "唔", "唉"]

    /// Whisper writes Mandarin in either script; this app writes Simplified.
    private static let simplifiedTransform = StringTransform("Traditional-Simplified")

    /// The locale dictation listens in.
    /// - Parameter supported: the locales the device reports, that is
    ///   `SFSpeechRecognizer.supportedLocales()`.
    /// - Returns: the phone's Chinese variant when it prefers Chinese,
    ///   otherwise its first supported language, then `zh-CN`. A phone set to
    ///   English still gets Chinese recognition when no supported Chinese
    ///   locale matched, because every other surface of the app is Chinese.
    static func locale(among supported: Set<Locale>) -> Locale {
        let preferred = Locale.preferredLanguages.map { Locale(identifier: $0) }
        let chinese = preferred.filter { $0.language.languageCode?.identifier == "zh" }
        if let match = bestMatch(for: chinese, among: supported) {
            return match
        }
        if let match = bestMatch(for: preferred, among: supported) {
            return match
        }
        return supported.first { $0.identifier == "zh-CN" }
            ?? supported.first { $0.language.languageCode?.identifier == "zh" }
            ?? Locale(identifier: "zh-CN")
    }

    /// Clean-up applied to the recognizer's last hypothesis.
    /// - Parameter raw: the transcript as the recognizer reported it.
    /// - Returns: the same sentence without the artifacts of speech.
    static func normalized(_ raw: String) -> String {
        var text = raw.replacingOccurrences(of: "\u{00A0}", with: " ")
        text = dropLeadingHesitations(text)
        text = text.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        // Chinese is written without spaces; the recognizer inserts them
        // between words it is unsure about, and around its own punctuation.
        text = text.replacingOccurrences(
            of: "(?<=[\\p{Han}\\x{3001}-\\x{303F}\\x{FF01}-\\x{FF60}]) ",
            with: "",
            options: .regularExpression
        )
        text = text.replacingOccurrences(
            of: " (?=[\\p{Han}\\x{3001}-\\x{303F}\\x{FF01}-\\x{FF60}])",
            with: "",
            options: .regularExpression
        )
        text = text.replacingOccurrences(of: "([，。！？；：、])\\1+", with: "$1", options: .regularExpression)
        text = text.applyingTransform(Self.simplifiedTransform, reverse: false) ?? text
        return dropLeadingPunctuation(text.trimmingCharacters(in: .whitespacesAndNewlines))
    }

    /// Join what the owner already typed with one dictated sentence.
    /// - Parameters:
    ///   - typed: text already in the composer, left untouched.
    ///   - spoken: one finished transcript.
    /// - Returns: both, separated the way the two scripts need: a space between
    ///   Latin words, nothing next to Chinese.
    static func merged(into typed: String, _ spoken: String) -> String {
        joined(typed, normalized(spoken))
    }

    /// Adopt one live hypothesis without dropping words a long pause erased.
    ///
    /// Apple's on-device recognizer restarts its hypothesis after a long
    /// silence: the next update begins with the words spoken after the pause and
    /// carries nothing from before it. Such an update continues the sentence
    /// already shown instead of replacing it, so words the owner has read always
    /// reach the composer. An update that still describes the same utterance —
    /// extended, or revised in place — replaces the text, keeping the longer of
    /// the two so a trim cannot erase anything.
    /// - Parameters:
    ///   - hypothesis: the recognizer's newest best sentence.
    ///   - current: what the panel is showing for this session.
    /// - Returns: the sentence to show next, which never holds less than `current`.
    static func adopted(_ hypothesis: String, after current: String) -> String {
        let next = hypothesis.trimmingCharacters(in: .whitespacesAndNewlines)
        let shown = current.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !shown.isEmpty else { return next }
        guard !next.isEmpty else { return shown }
        if next == shown {
            return shown
        }
        // The same utterance, extended word by word.
        if next.hasPrefix(shown) {
            return next
        }
        // A trimmed update: every word in it is already shown.
        if shown.hasPrefix(next) {
            return shown
        }
        if similarity(shown, next) >= Self.revisionThreshold {
            // The same utterance, revised in place; a shorter revision keeps the
            // words it dropped so a correction cannot delete content.
            return next.count >= shown.count ? next : shown
        }
        // A restarted hypothesis covers only what followed the pause.
        return joined(shown, continuation(of: next, after: shown))
    }

    /// Similarity at which two hypotheses describe the same utterance. Below it
    /// the recognizer has started a new hypothesis rather than revised one.
    private static let revisionThreshold = 0.5

    /// Join one continuation to the text already shown, where a script needs a
    /// separator.
    /// @param head - text already shown.
    /// @param tail - what follows it; empty returns `head`.
    /// @returns both, with one space between Latin neighbours and none between Chinese.
    private static func joined(_ head: String, _ tail: String) -> String {
        guard !head.isEmpty else { return tail }
        guard !tail.isEmpty else { return head }
        if head.hasSuffix("\n") || head.hasSuffix(" ") || head.hasSuffix("\t") {
            return head + tail
        }
        guard let last = head.last, let first = tail.first else { return head + tail }
        return isLatin(last) && isLatin(first) ? head + " " + tail : head + tail
    }

    /// The part of a restarted hypothesis that is new.
    /// @param next - the restarted hypothesis.
    /// @param shown - the sentence already displayed.
    /// @returns `next` without the words it repeats from the end of `shown`, or
    ///   all of it when the two do not overlap.
    private static func continuation(of next: String, after shown: String) -> String {
        let shortest = min(next.count, shown.count)
        var shared = shortest
        while shared > 0 {
            if shown.suffix(shared).lowercased() == next.prefix(shared).lowercased() {
                break
            }
            shared -= 1
        }
        // One or two characters can match by accident; a real repeat is a word.
        guard shared >= 3 else { return next }
        return String(next.dropFirst(shared))
    }

    /// Dice coefficient over character bigrams: how much two hypotheses talk
    /// about the same words, regardless of where a revision changed them.
    /// @param left - first sentence.
    /// @param right - second sentence.
    /// @returns 0…1; 1 when both are identical.
    private static func similarity(_ left: String, _ right: String) -> Double {
        let first = bigrams(left)
        let second = bigrams(right)
        guard !first.isEmpty, !second.isEmpty else { return left == right ? 1 : 0 }
        var remaining = first
        var shared = 0
        for gram in second.keys where (remaining[gram] ?? 0) > 0 {
            shared += 1
            remaining[gram] = (remaining[gram] ?? 1) - 1
        }
        return 2 * Double(shared) / Double(first.count + second.count)
    }

    /// Adjacent character pairs of one sentence.
    /// @param text - the sentence.
    /// @returns each pair and how often it occurs.
    private static func bigrams(_ text: String) -> [String: Int] {
        let characters = Array(text.lowercased())
        guard characters.count > 1 else { return [:] }
        var pairs: [String: Int] = [:]
        for index in 0 ..< characters.count - 1 {
            let pair = String([characters[index], characters[index + 1]])
            pairs[pair, default: 0] += 1
        }
        return pairs
    }

    /// Best supported locale for one preference list: exact identifier, then
    /// language and script, then language alone.
    private static func bestMatch(for candidates: [Locale], among supported: Set<Locale>) -> Locale? {
        for candidate in candidates {
            if let exact = supported.first(where: { $0.identifier == candidate.identifier }) {
                return exact
            }
            let language = candidate.language
            guard let code = language.languageCode else { continue }
            if let scripted = supported.first(where: {
                $0.language.languageCode == code && $0.language.script == language.script
            }) {
                return scripted
            }
            if let same = supported.first(where: { $0.language.languageCode == code }) {
                return same
            }
        }
        return nil
    }

    private static func dropLeadingHesitations(_ text: String) -> String {
        var result = text.trimmingCharacters(in: .whitespaces)
        while result.count > 1, let first = result.first, leadingHesitations.contains(first) {
            result.removeFirst()
        }
        return result
    }

    private static func dropLeadingPunctuation(_ text: String) -> String {
        var result = text
        while let first = result.first, "，。、；：！？,.!?;: ".contains(first) {
            result.removeFirst()
        }
        return result
    }

    private static func isLatin(_ character: Character) -> Bool {
        guard let scalar = character.unicodeScalars.first else { return false }
        switch scalar.value {
        case 0x30 ... 0x39, 0x41 ... 0x5A, 0x61 ... 0x7A:
            return true
        default:
            return false
        }
    }
}
