//
//  Patterns.swift
//  Tomato Remote
//
//  Composed patterns built from the Primitives atoms: feedback banners, empty
//  and loading states, the conversation welcome, goal progress, and page chrome.
//  Everything reads `TomatoToken`/`TomatoRadius`.
//

import SwiftUI
import Foundation


/// Inline, dismissible failure report. Nothing fails silently in this app.
struct ErrorBanner: View {
    let message: String
    var retry: (() -> Void)?

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundStyle(TomatoToken.stateErrorPrimary)
            Text(message)
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelPrimary)
                .frame(maxWidth: .infinity, alignment: .leading)
            if let retry {
                Button("重试", action: retry)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(TomatoToken.brandPrimary)
                    // A text glyph alone is a ~24 pt target; the retry on a
                    // failure banner deserves the 44 pt minimum.
                    .frame(minHeight: 44)
                    .contentShape(Rectangle())
            }
        }
        .padding(12)
        .background(TomatoContainer.error.fill)
        .clipShape(RoundedRectangle(cornerRadius: TomatoCorner.control, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: TomatoCorner.control, style: .continuous)
                .strokeBorder(TomatoToken.stateErrorPrimary.opacity(0.18), lineWidth: 1)
        )
        .accessibilityElement(children: .contain)
    }
}

/// Two-column fact row used by the account and desktop screens.
///
/// The value is right-aligned and set in tabular digits so a column of live
/// numbers (tokens, rounds, counts) does not jitter as it updates.


/// A goal's round progress: a determinate linear fill when the cap is known,
/// with the "第 X / Y 轮" count beneath. Length encodes the quantity; an
/// open-ended goal (no cap) keeps the count alone.
struct GoalRoundsProgress: View {
    let roundsStarted: Int
    let maxGoalRounds: Int?

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            if let max = maxGoalRounds, max > 0 {
                ProgressView(value: Double(min(roundsStarted, max)), total: Double(max))
                    .progressViewStyle(.linear)
                    .tint(TomatoToken.brandPrimary)
                    .accessibilityHidden(true)
            }
            Text(maxGoalRounds.map { "第 \(roundsStarted) / \($0) 轮" } ?? "第 \(roundsStarted) 轮")
                .font(.caption.monospacedDigit())
                .foregroundStyle(TomatoToken.labelCaption)
        }
    }
}

/// Persistent, non-blocking advisory strip. Used where a degraded state is the
/// user's own configuration rather than a failure of the last action.


/// Persistent, non-blocking advisory strip. Used where a degraded state is the
/// user's own configuration rather than a failure of the last action.
struct NoticeBar: View {
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "info.circle.fill")
                .foregroundStyle(TomatoToken.stateBusinessPrimary)
            Text(text)
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 9)
        .background(TomatoContainer.info.fill)
    }
}

/// Section heading with an optional trailing accessory.


/// Centered placeholder for empty collections.
struct EmptyPlaceholder: View {
    let systemImage: String
    let title: String
    var detail: String?

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: systemImage)
                .font(.system(size: 23, weight: .medium))
                .foregroundStyle(TomatoToken.labelSecondary)
                .frame(width: 54, height: 54)
                .background(TomatoSurface.variant, in: RoundedRectangle(cornerRadius: TomatoCorner.control, style: .continuous))
                .accessibilityHidden(true)
            Text(title)
                .font(.headline)
                .foregroundStyle(TomatoToken.labelPrimary)
            if let detail {
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelCaption)
                    .multilineTextAlignment(.center)
                    .lineSpacing(2)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 24)
        .padding(.vertical, 24)
        .accessibilityElement(children: .combine)
    }
}

/// The welcome a conversation shows before its first turn.
///
/// Deliberately not `EmptyPlaceholder`: a conversation's first screen is the one
/// place the app says who answers, what gets recorded, and what a first message
/// can look like. The starters put a sentence in the dock rather than sending
/// it, so the owner can edit before the Agent sees it.


/// The welcome a conversation shows before its first turn.
///
/// Deliberately not `EmptyPlaceholder`: a conversation's first screen is the one
/// place the app says who answers, what gets recorded, and what a first message
/// can look like. The starters put a sentence in the dock rather than sending
/// it, so the owner can edit before the Agent sees it.
struct ConversationWelcome: View {
    /// Resting state of the Session; an ended one gets no starters.
    let state: SessionState
    /// Receives a starter prompt, which goes into the dock unsent.
    let onStart: (String) -> Void

    var body: some View {
        VStack(spacing: 0) {
            mark
                .padding(.bottom, 16)
            VStack(spacing: 6) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .multilineTextAlignment(.center)
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelCaption)
                    .multilineTextAlignment(.center)
                    .lineSpacing(3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .accessibilityElement(children: .combine)
            .accessibilityAddTraits(.isHeader)
            if state != .ended {
                VStack(spacing: 8) {
                    ForEach(Self.starters) { starter in
                        Button {
                            onStart(starter.prompt)
                        } label: {
                            starterRow(starter)
                        }
                        .buttonStyle(TomatoPressableStyle())
                        .accessibilityIdentifier("chat.welcome.starter.\(starter.id)")
                        .accessibilityHint("填入输入框，发送前可修改")
                    }
                }
                .padding(.top, 24)
            }
        }
        .frame(maxWidth: 380)
        .padding(.vertical, 24)
        .frame(maxWidth: .infinity)
    }

    /// Brand mark: the same sparkles the Agent's own rows carry, on a soft tint
    /// that reads as the conversation's starting point instead of an icon left
    /// at body size.
    private var mark: some View {
        ZStack {
            Circle()
                .fill(accent.opacity(0.07))
                .frame(width: 72)
            Circle()
                .fill(
                    LinearGradient(
                        colors: [accent.opacity(0.18), accent.opacity(0.08)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 56)
                .overlay(Circle().strokeBorder(accent.opacity(0.20), lineWidth: 0.5))
            Image(systemName: state == .ended ? "moon.zzz" : "sparkles")
                .font(.system(size: 26, weight: .medium))
                .foregroundStyle(accent)
        }
        .accessibilityHidden(true)
    }

    /// One starter prompt, drawn like the tool cards so it reads as something
    /// that acts rather than as a hint in body text.
    /// - Parameter starter: prompt and symbol to draw.
    /// - Returns: the tappable row.
    private func starterRow(_ starter: Starter) -> some View {
        HStack(spacing: 11) {
            Image(systemName: starter.systemImage)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(TomatoToken.brandPrimary)
                .frame(width: 22)
                .accessibilityHidden(true)
            Text(starter.prompt)
                .font(.subheadline)
                .foregroundStyle(TomatoToken.labelPrimary)
                .multilineTextAlignment(.leading)
                .frame(maxWidth: .infinity, alignment: .leading)
            Image(systemName: "plus")
                .font(.caption.weight(.semibold))
                .foregroundStyle(TomatoToken.labelCaption)
                .accessibilityHidden(true)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(minHeight: 44)
        .background(TomatoSurface.card, in: RoundedRectangle(cornerRadius: TomatoCorner.control, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: TomatoCorner.control, style: .continuous)
                .strokeBorder(TomatoLine.hairline, lineWidth: 1)
        )
        .contentShape(RoundedRectangle(cornerRadius: TomatoCorner.control, style: .continuous))
    }

    private var title: String {
        state == .ended ? "这段对话已结束" : "和 Mac 上的 agent 打个招呼"
    }

    private var detail: String {
        state == .ended
            ? "历史还在。发一条消息会让 Host 重新启动这个会话的 agent。"
            : "它会在这里回答，并把用到的工具和花费记在时间线上。"
    }

    /// Tint shared by the mark: brand red while a conversation can start, a
    /// quiet grey once it has ended.
    private var accent: Color {
        state == .ended ? TomatoToken.labelCaption : TomatoToken.brandPrimary
    }

    /// One prompt the welcome offers.
    private struct Starter: Identifiable {
        let id: Int
        let systemImage: String
        let prompt: String
    }

    /// Starters in reading order. They name work this Agent can do on the Mac —
    /// reading a project, running its tests, and writing a summary — instead of
    /// the generic "ask me anything" that would promise nothing.
    private static let starters: [Starter] = [
        Starter(id: 0, systemImage: "folder", prompt: "看看这个项目里有什么"),
        Starter(id: 1, systemImage: "terminal", prompt: "跑一下测试，把失败的列出来"),
        Starter(id: 2, systemImage: "doc.text", prompt: "总结一下最近的改动"),
    ]
}

/// Page-level header: a large title, one explanatory line, and an optional
/// accessory that belongs to the title row.
///
/// A page that keeps its title in the navigation bar uses
/// `CaptionFallback` instead, so the same line is stated once either way.


/// Page-level header: a large title, one explanatory line, and an optional
/// accessory that belongs to the title row.
///
/// A page that keeps its title in the navigation bar uses
/// `CaptionFallback` instead, so the same line is stated once either way.
struct PageHeader<Accessory: View>: View {
    let title: String
    let caption: String?
    private let accessory: Accessory

    init(title: String, caption: String? = nil, @ViewBuilder accessory: () -> Accessory) {
        self.title = title
        self.caption = caption
        self.accessory = accessory()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(alignment: .firstTextBaseline) {
                Text(title)
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(TomatoToken.labelPrimary)
                Spacer(minLength: 8)
                accessory
            }
            if let caption {
                Text(caption)
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelCaption)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 8)
        .padding(.bottom, 2)
    }
}


extension PageHeader where Accessory == EmptyView {
    init(title: String, caption: String? = nil) {
        self.init(title: title, caption: caption) { EmptyView() }
    }
}

/// Compact state chip: a coloured dot with a short label.


/// The explanatory line of a page whose title lives in the navigation bar.
///
/// iOS 26 puts that line in the bar through `navigationSubtitle`, where it
/// scrolls away with the title; earlier releases render it here, as the page's
/// first paragraph, so no release states it twice or drops it.
struct CaptionFallback: View {
    let caption: String

    var body: some View {
        if #available(iOS 26.0, *) {
            EmptyView()
        } else {
            Text(caption)
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelCaption)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.top, 4)
        }
    }
}

/// The explanatory line of a page whose title stays in an inline navigation bar.
///
/// On iOS 26 `navigationSubtitle` grows the bar, and a plain `List` under it drew
/// its first row over the caption. The caption lives in the content instead, so
/// the bar keeps its standard height and the list keeps a correct top inset.


/// The explanatory line of a page whose title stays in an inline navigation bar.
///
/// On iOS 26 `navigationSubtitle` grows the bar, and a plain `List` under it drew
/// its first row over the caption. The caption lives in the content instead, so
/// the bar keeps its standard height and the list keeps a correct top inset.
struct PageCaption: View {
    let caption: String

    var body: some View {
        Text(caption)
            .font(.footnote)
            .foregroundStyle(TomatoToken.labelCaption)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// The conversation's liveness, as every list row and the conversation header
/// reports it. Colour alone never carries the state: the label says it too.


/// A few skeleton rows shaped like a conversation, used before its first page
/// lands.
struct ChatSkeleton: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack {
                Spacer(minLength: 56)
                SkeletonBlock(width: 180, height: 34)
            }
            VStack(alignment: .leading, spacing: 8) {
                SkeletonBlock(width: 64, height: 10)
                SkeletonBlock(height: 14)
                SkeletonBlock(height: 14)
                SkeletonBlock(width: 220, height: 14)
            }
            HStack {
                Spacer(minLength: 56)
                SkeletonBlock(width: 140, height: 30)
            }
        }
        .accessibilityLabel("正在加载会话")
    }
}

/// Relative timestamp used by list rows and messages.
///
/// One formatter is reused: creating a `RelativeDateTimeFormatter` per row on
/// every scroll frame is a measurable cost, and the formatter is immutable
/// after configuration.


/// Relative timestamp used by list rows and messages.
///
/// One formatter is reused: creating a `RelativeDateTimeFormatter` per row on
/// every scroll frame is a measurable cost, and the formatter is immutable
/// after configuration.
private let relativeTimeFormatter: RelativeDateTimeFormatter = {
    let formatter = RelativeDateTimeFormatter()
    formatter.locale = Locale(identifier: "zh_CN")
    formatter.unitsStyle = .short
    return formatter
}()

/// Format one epoch-millisecond timestamp relative to now.
/// - Parameter milliseconds: Unix epoch milliseconds.
/// - Returns: the localized short relative time.


/// Format one epoch-millisecond timestamp relative to now.
/// - Parameter milliseconds: Unix epoch milliseconds.
/// - Returns: the localized short relative time.
func relativeTime(_ milliseconds: Double) -> String {
    let date = Date(timeIntervalSince1970: milliseconds / 1000)
    return relativeTimeFormatter.localizedString(for: date, relativeTo: Date())
}
