//
//  ChatStatus.swift
//  Tomato Remote
//
//  What a conversation is doing, said in one place.
//
//  A turn has visible phases: the prompt is travelling, the model is thinking,
//  a tool is running, the answer is being written. The transcript only shows the
//  results, so the header carries the phase and the elapsed time, and the same
//  wording appears once at the end of the transcript where the next row will
//  land. Both surfaces read `ChatActivity`, so they never describe the turn
//  differently.
//

import SwiftUI

/// The phase a conversation is in right now.
enum ChatActivity: Equatable {
    /// Nothing is running; the badge carries the Session's resting state.
    case idle(SessionState)
    /// The prompt has left the phone and the Host has not opened the turn yet.
    case sending
    /// The Host holds a running turn that has not produced text or a tool call.
    case thinking
    /// A tool call is executing.
    case tool(name: String)
    /// Answer text is streaming in.
    case writing
    /// The Agent is blocked on a person's answer.
    case waiting(count: Int)
    /// The event stream dropped and is retrying.
    case reconnecting(attempt: Int)
    /// The stream gave up; the page stays readable.
    case offline(String?)

    /// Whether the turn is still doing something the reader should see.
    var isBusy: Bool {
        switch self {
        case .idle, .offline: false
        case .sending, .thinking, .tool, .writing, .waiting, .reconnecting: true
        }
    }

    /// Whether the transcript should show the phase where the next row lands.
    var showsInTranscript: Bool {
        switch self {
        case .sending, .thinking, .tool, .writing: true
        case .idle, .waiting, .reconnecting, .offline: false
        }
    }

    /// Whether the seconds since `startedAt` are worth showing.
    var showsElapsed: Bool {
        switch self {
        case .sending, .thinking, .tool, .writing: true
        case .idle, .waiting, .reconnecting, .offline: false
        }
    }

    /// What the reader is told the Agent is doing.
    var title: String {
        switch self {
        case let .idle(state):
            switch state {
            case .running: "进行中"
            case .live: "对话中"
            case .fresh: "未开始"
            case .ended: "已结束"
            }
        case .sending: "正在发送…"
        case .thinking: "Tomato 正在思考…"
        case let .tool(name): "正在调用 \(name)…"
        case .writing: "正在写回答…"
        case let .waiting(count): count > 1 ? "等待你确认 \(count) 项" : "等待你确认"
        case let .reconnecting(attempt): "连接中断，正在重连（\(attempt)）…"
        case .offline: "连接已断开"
        }
    }

    /// A second line for phases that need one; nil keeps the pill on one line.
    var detail: String? {
        switch self {
        case let .offline(reason): reason
        default: nil
        }
    }

    /// What the phase's dot or spinner is tinted.
    var tint: Color {
        switch self {
        case .idle(.ended): TomatoToken.stateIdlePrimary
        case .idle(.fresh): TomatoToken.stateWarnPrimary
        case .idle: TomatoToken.stateSuccessPrimary
        case .sending, .thinking, .tool, .writing: TomatoToken.brandPrimary
        case .waiting, .reconnecting: TomatoToken.stateWarnPrimary
        case .offline: TomatoToken.stateErrorPrimary
        }
    }

    /// Symbol shown for phases that have no running spinner.
    var symbol: String {
        switch self {
        case .idle(.running): "bolt.horizontal.circle.fill"
        case .idle(.live): "bubble.left.and.bubble.right"
        case .idle(.fresh): "sparkles"
        case .idle(.ended): "moon.zzz"
        case .sending: "paperplane"
        case .thinking: "ellipsis.bubble"
        case .tool: "wrench.and.screwdriver"
        case .writing: "text.cursor"
        case .waiting: "hand.raised.fill"
        case .reconnecting: "arrow.triangle.2.circlepath"
        case .offline: "wifi.slash"
        }
    }

    /// VoiceOver wording for the whole strip, elapsed time included.
    /// - Parameter elapsed: seconds the current phase has lasted, or nil.
    /// - Returns: one spoken sentence.
    func spoken(_ elapsed: TimeInterval?) -> String {
        var parts = [title]
        if let detail {
            parts.append(detail)
        }
        if let elapsed, elapsed >= 1, showsElapsed {
            parts.append("已用 \(Int(elapsed)) 秒")
        }
        return parts.joined(separator: "，")
    }
}

// MARK: - Header

/// The conversation's live line under the navigation bar.
///
/// A resting Session keeps the existing badge and one note. A working turn
/// replaces that with a tinted pill that names the phase and counts the seconds,
/// because "still doing something" and "how long" are the facts a reader needs
/// while the transcript sits still.
struct ChatStatusStrip: View {
    let activity: ChatActivity
    /// When the current phase began, in the Host's milliseconds.
    let startedAt: Double?
    /// One line for a resting phase: connecting, or an ended conversation.
    var note: String?
    /// Opens the requests this conversation is blocked on.
    var onAnswer: () -> Void = {}
    /// Reconnects the dropped stream.
    var onRetry: () -> Void = {}

    var body: some View {
        HStack(spacing: 8) {
            // The timer ticks once a second, not with the display link: an
            // always-running animation kept the main run loop awake for nothing.
            if activity.showsElapsed {
                TimelineView(.periodic(from: .now, by: 1)) { context in
                    HStack(spacing: 8) {
                        pill(now: context.date)
                        Spacer(minLength: 0)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel(activity.spoken(Self.elapsed(startedAt: startedAt, now: context.date)))
                }
            } else {
                HStack(spacing: 8) {
                    pill(now: .now)
                    if let note, !note.isEmpty {
                        Text(note)
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelCaption)
                            .lineLimit(1)
                    }
                    if let detail = activity.detail, !detail.isEmpty {
                        Text(detail)
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelCaption)
                            .lineLimit(1)
                    }
                    Spacer(minLength: 0)
                }
                .accessibilityElement(children: .combine)
                .accessibilityLabel([activity.spoken(nil), note].compactMap { $0 }.joined(separator: "，"))
            }
            if showsRetry {
                Button("重试", action: onRetry)
                    .font(.caption.weight(.medium))
                    .foregroundStyle(TomatoToken.brandPrimary)
                    // A bare caption is a 16 pt target; the retry after a dropped
                    // stream deserves the 44 pt minimum.
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 20)
        .padding(.vertical, 4)
        .background(TomatoSurface.page)
        .accessibilityIdentifier("chat.status")
    }

    private var showsRetry: Bool {
        if case .offline = activity {
            return true
        }
        return false
    }

    @ViewBuilder
    private func pill(now: Date) -> some View {
        switch activity {
        case let .idle(state):
            SessionStateBadge(state: state)
        case let .waiting(count):
            Button(action: onAnswer) {
                capsule(count: count, now: now)
            }
            .buttonStyle(TomatoPressableStyle())
            // The capsule is caption2 plus a few points of padding, yet the
            // approval it opens is the one thing the reader must reach; the
            // touch area grows well past the glyph without moving it.
            .contentShape(Rectangle().inset(by: -10))
            .accessibilityHint("打开等待处理的问题")
        default:
            capsule(count: nil, now: now)
        }
    }

    /// The tinted capsule shared by every working phase.
    /// - Parameters:
    ///   - count: pending count for the waiting phase.
    ///   - now: current time, used for the elapsed label.
    private func capsule(count: Int?, now: Date) -> some View {
        HStack(spacing: 6) {
            if activity.isBusy, count == nil, activity.showsElapsed {
                ProgressView()
                    .controlSize(.mini)
                    .tint(activity.tint)
            } else {
                Image(systemName: activity.symbol)
                    .font(.system(size: 10, weight: .semibold))
                    .foregroundStyle(activity.tint)
            }
            Text(activity.title)
                .font(.caption2.weight(.medium))
                .foregroundStyle(activity.tint)
                .lineLimit(1)
            if let count {
                Text("\(count)")
                    .font(.caption2.monospacedDigit().weight(.semibold))
                    .foregroundStyle(activity.tint)
            } else if let seconds = Self.elapsed(startedAt: startedAt, now: now), activity.showsElapsed {
                Text(Self.format(seconds))
                    .font(.caption2.monospacedDigit())
                    .foregroundStyle(activity.tint.opacity(0.75))
                    .contentTransition(.numericText())
            }
        }
        .padding(.horizontal, 9)
        .padding(.vertical, 4)
        .background(activity.tint.opacity(0.10), in: Capsule())
        .overlay(Capsule().strokeBorder(activity.tint.opacity(0.16), lineWidth: 0.5))
    }

    /// Seconds the phase has lasted.
    /// - Parameters:
    ///   - startedAt: Host milliseconds, or nil before the Host said.
    ///   - now: current time.
    /// - Returns: elapsed seconds, or nil when nothing is running.
    static func elapsed(startedAt: Double?, now: Date) -> TimeInterval? {
        guard let startedAt else { return nil }
        return max(0, now.timeIntervalSince1970 - startedAt / 1000)
    }

    /// Whole seconds under a minute, then minutes and seconds.
    /// - Parameter seconds: elapsed seconds.
    /// - Returns: compact text like `12s` or `1m 05s`.
    static func format(_ seconds: TimeInterval) -> String {
        let whole = Int(seconds.rounded())
        if whole < 60 {
            return "\(whole)s"
        }
        return String(format: "%dm %02ds", whole / 60, whole % 60)
    }
}

// MARK: - Transcript

/// The working line that sits where the next transcript row will land.
///
/// Without it a thinking turn looks like a dead screen below the last message:
/// the folded process group is above, the composer is below, and nothing in
/// between says the Host is working.
struct ChatLiveRow: View {
    let activity: ChatActivity
    let startedAt: Double?

    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { context in
            HStack(spacing: 8) {
                ProgressView()
                    .controlSize(.mini)
                    .tint(activity.tint)
                Text(activity.title)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .lineLimit(1)
                Spacer(minLength: 6)
                if let seconds = ChatStatusStrip.elapsed(startedAt: startedAt, now: context.date) {
                    Text(ChatStatusStrip.format(seconds))
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(TomatoToken.labelDimmed)
                        .contentTransition(.numericText())
                }
            }
            .accessibilityElement(children: .combine)
            .accessibilityLabel(activity.spoken(ChatStatusStrip.elapsed(startedAt: startedAt, now: context.date)))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 9)
        .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(TomatoToken.borderL1, lineWidth: 0.5)
        )
        .accessibilityIdentifier("chat.liveRow")
    }
}
