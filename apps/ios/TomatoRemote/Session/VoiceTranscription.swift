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
        "Tomato Phone",
        "Harness",
        "DeepSeek",
        "Agent",
        "Agent Service",
        "MCP",
        "MCP Gateway",
        "Gateway",
        "tools/list",
        "Service",
        "survey",
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
        "端到端",
        "子进程",
        "网关",
        "令牌",
        "会话身份",
        "打通",
        "正式的模型",
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
        // A recognizer can repeat one Latin word while it revises; Chinese
        // repetition ("看看", "试试") is meaningful and stays.
        text = text.replacingOccurrences(
            of: "(?i)\\b([A-Za-z][A-Za-z'’-]*)(?:\\s+\\1\\b)+",
            with: "$1",
            options: .regularExpression
        )
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

    /// Adopt one live hypothesis without duplicating an attempt the owner
    /// repeated.
    ///
    /// The on-device recognizer can restart its hypothesis after a pause, and
    /// the owner may repeat the whole sentence when the first attempt looked
    /// wrong. A newer, longer hypothesis is therefore a fuller attempt: it
    /// replaces the shown text instead of being appended to it. Only a shorter
    /// hypothesis that overlaps the shown tail is a continuation, and only the
    /// unseen part joins the sentence.
    /// - Parameters:
    ///   - hypothesis: the recognizer's newest best sentence.
    ///   - current: what the panel is showing for this session.
    /// - Returns: the sentence to show next.
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
        // A longer hypothesis is a fuller new attempt. Replacing rather than
        // appending keeps a repeated sentence from appearing twice.
        if next.count >= shown.count {
            return next
        }
        // A shorter fragment that is mostly already shown is a repeat, not a
        // new tail; keep the fuller sentence.
        if containment(of: next, in: shown) >= 0.75 {
            return shown
        }
        // A true continuation after a pause or punctuation appends only the
        // words not already at the end of the shown sentence.
        let shared = suffixPrefixOverlap(shown, next)
        return joined(shown, shared >= 3 ? String(next.dropFirst(shared)) : next)
    }

    /// How much of one sentence's character bigrams already occur in another.
    /// - Parameters:
    ///   - part: candidate fragment.
    ///   - whole: the sentence that may already contain it.
    /// - Returns: 0…1; 1 when every bigram of the fragment is present.
    private static func containment(of part: String, in whole: String) -> Double {
        let fragment = bigrams(part)
        guard !fragment.isEmpty else { return 0 }
        var remaining = bigrams(whole)
        var shared = 0
        for (gram, count) in fragment {
            let used = min(count, remaining[gram] ?? 0)
            shared += used
            remaining[gram] = (remaining[gram] ?? 0) - used
        }
        return Double(shared) / Double(fragment.count)
    }

    /// Longest suffix of the shown sentence that is also the next prefix.
    /// - Parameters:
    ///   - shown: sentence already displayed.
    ///   - next: shorter candidate continuation.
    /// - Returns: shared character count.
    private static func suffixPrefixOverlap(_ shown: String, _ next: String) -> Int {
        var shared = min(shown.count, next.count)
        while shared > 0 {
            if shown.suffix(shared).lowercased() == next.prefix(shared).lowercased() {
                return shared
            }
            shared -= 1
        }
        return 0
    }

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
