//
//  PersonalMemory.swift
//  Tomato Remote
//
//  Fold this device's usage journal into the few facts worth telling the agent.
//
//  The Host sees prompts and tool calls. It cannot see the phone: whether its
//  owner works at midnight, which projects they keep returning to, that they
//  send photos instead of typing paths. This file derives those facts from
//  `UsageJournal`, so the owner can read exactly what this phone proposes to
//  the Host's account memory.
//
//  Derivation is deterministic and pure: the same events always produce the
//  same text, so the owner can read exactly what the agent will be told before
//  it is told, and a review of this file explains every sentence that reaches
//  a model.
//

import Foundation

/// One durable observation about how this device is used.
struct MemoryFact: Identifiable, Equatable, Sendable {
    /// Stable identity so a row survives a re-derivation.
    let id: String
    /// The sentence the agent reads, in the owner's language.
    let text: String
}

/// Derived personal context this phone proposes to the Host memory.
struct PersonalMemory: Equatable, Sendable {
    /// Facts ordered strongest first.
    let facts: [MemoryFact]
    /// Events the derivation read, so a screen can state its evidence.
    let sampleCount: Int
    /// Wall-clock day the derivation covered, `YYYY-MM-DD`.
    let windowStart: String

    var isEmpty: Bool {
        facts.isEmpty
    }

    /// Days the derivation covers.
    static let windowDays = 30

    /// Tag that opens and closes the legacy context block.
    private static let tag = "personal-context"

    /// A user message's text with the memory block this app appended removed.
    ///
    /// The Host stores the block as a second text part of the prompt, and the
    /// chat fold joins text parts, so replaying the log would otherwise show the
    /// block as words the owner typed.
    /// - Parameter text: one user message's joined text.
    /// - Returns: the owner's own words, possibly empty when the message was
    ///   only the block.
    static func strippingContextBlock(_ text: String) -> String {
        guard let open = text.range(of: "<\(tag)"),
              let close = text.range(of: "</\(tag)>", range: open.upperBound ..< text.endIndex)
        else { return text }
        var result = text
        result.removeSubrange(open.lowerBound ..< close.upperBound)
        return result.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Derive facts from a journal.
    /// - Parameters:
    ///   - events: the journal's records, in the order they happened.
    ///   - now: the reference instant; tests pass a fixed one.
    /// - Returns: the strongest facts, at most `maxFacts`.
    static func derive(from events: [UsageEvent], now: Date = Date()) -> PersonalMemory {
        let cutoff = now.addingTimeInterval(-Double(windowDays) * 86400)
        let window = events.filter { $0.at / 1000 >= cutoff.timeIntervalSince1970 }
        var facts: [MemoryFact] = []

        if let hours = activeHours(window) {
            facts.append(MemoryFact(id: "hours", text: hours))
        }
        if let rhythm = weekdayRhythm(window, now: now) {
            facts.append(MemoryFact(id: "rhythm", text: rhythm))
        }
        if let projects = habitualProjects(window) {
            facts.append(MemoryFact(id: "projects", text: projects))
        }
        if let length = promptLength(window) {
            facts.append(MemoryFact(id: "length", text: length))
        }
        if let photos = photoHabit(window) {
            facts.append(MemoryFact(id: "photos", text: photos))
        }
        if let naming = namingHabit(window) {
            facts.append(MemoryFact(id: "naming", text: naming))
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = .current
        return PersonalMemory(
            facts: Array(facts.prefix(maxFacts)),
            sampleCount: window.count,
            windowStart: formatter.string(from: cutoff)
        )
    }

    /// Most facts one prompt carries; more turns into an essay the model skips.
    static let maxFacts = 5

    /// Minimum prompts before any habit is stated. Three interactions say
    /// nothing about a person, and guessing costs more than silence.
    static let minimumPrompts = 3

    // MARK: Derivations

    /// The band of the day this owner reaches for the phone, from prompt hours.
    private static func activeHours(_ events: [UsageEvent]) -> String? {
        let prompts = events.filter { $0.kind == .prompt }
        guard prompts.count >= minimumPrompts else { return nil }
        let calendar = Calendar.current
        let hours = prompts.map { calendar.component(.hour, from: Date(timeIntervalSince1970: $0.at / 1000)) }
        let counts = Dictionary(grouping: hours, by: { $0 }).mapValues(\.count)
        guard let peak = counts.max(by: { $0.value < $1.value })?.key else { return nil }
        let late = peak >= 22 || peak < 5
        let band = late ? "深夜" : peak < 11 ? "上午" : peak < 18 ? "下午" : "晚上"
        return "最常在\(band)使用（\(String(format: "%02d", peak)) 点前后），安排需要等待的长任务时可以按这个节奏。"
    }

    /// Whether work concentrates on weekdays or the weekend.
    private static func weekdayRhythm(_ events: [UsageEvent], now: Date) -> String? {
        let prompts = events.filter { $0.kind == .prompt }
        guard prompts.count >= minimumPrompts * 2 else { return nil }
        let calendar = Calendar.current
        let weekend = prompts.filter { calendar.isDateInWeekend(Date(timeIntervalSince1970: $0.at / 1000)) }.count
        let share = Double(weekend) / Double(prompts.count)
        if share >= 0.5 {
            return "周末用得比工作日多，更像个人项目而不是办公场景。"
        }
        if share <= 0.1 {
            return "几乎只在工作日使用，语气可以更偏向工作语境。"
        }
        return nil
    }

    /// The one project this owner returns to most.
    private static func habitualProjects(_ events: [UsageEvent]) -> String? {
        let named = events.compactMap(\.project).filter { !$0.isEmpty }
        guard named.count >= minimumPrompts else { return nil }
        let counts = Dictionary(grouping: named, by: { $0 }).mapValues(\.count)
        guard let top = counts.max(by: { $0.value < $1.value }), top.value >= 3 else { return nil }
        let share = Int((Double(top.value) / Double(named.count) * 100).rounded())
        return "最常回到项目「\(top.key)」（占 \(share)% 的会话），默认上下文优先猜这个目录。"
    }

    /// Whether prompts are terse commands or long briefs.
    private static func promptLength(_ events: [UsageEvent]) -> String? {
        let lengths = events.compactMap { $0.kind == .prompt ? $0.length : nil }.filter { $0 > 0 }
        guard lengths.count >= minimumPrompts else { return nil }
        let average = lengths.reduce(0, +) / lengths.count
        if average <= 30 {
            return "提问很短（平均 \(average) 字），通常默认你知道上下文，不必解释基础概念。"
        }
        if average >= 160 {
            return "习惯写长需求（平均 \(average) 字），可以直接按完整简报执行，不需要反复确认。"
        }
        return nil
    }

    /// Whether this person sends photos as part of a request.
    private static func photoHabit(_ events: [UsageEvent]) -> String? {
        let prompts = events.filter { $0.kind == .prompt }.count
        let photos = events.filter { $0.kind == .photo }.count
        guard prompts >= minimumPrompts, photos >= 2 else { return nil }
        return "经常直接发照片而不是描述（\(photos) 次），看到图片时可以默认当作任务输入。"
    }

    /// Whether conversations get organised by title.
    private static func namingHabit(_ events: [UsageEvent]) -> String? {
        let created = events.filter { $0.kind == .created }.count
        let renamed = events.filter { $0.kind == .renamed }.count
        guard created >= 2, renamed * 2 >= created else { return nil }
        return "习惯把会话重命名成有意义的名字，可以主动建议标题。"
    }
}
