//
//  Components.swift
//  Tomato Remote
//
//  Small shared surfaces so screens stay declarative. Everything reads
//  `TomatoToken` and `TomatoRadius`; no view defines its own colors.
//

import SwiftUI

/// Grouped surface: the shape iOS uses for a block of related facts.
///
/// The fill plus one hairline is enough separation on a page whose content is
/// already on a distinct background; a drop shadow on every card made stacked
/// sections read as floating sheets rather than as one scroll.
struct TomatoCard<Content: View>: View {
    private let padding: CGFloat
    private let content: Content

    init(padding: CGFloat = 16, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(TomatoToken.bgLayer1)
            .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.lg, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoRadius.lg, style: .continuous)
                    .strokeBorder(TomatoToken.borderL2, lineWidth: 0.5)
            )
    }
}

/// Filled call to action. Shows a spinner instead of its label while busy.
struct TomatoPrimaryButton: View {
    let title: String
    var systemImage: String?
    var isEnabled: Bool = true
    var isBusy: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if isBusy {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(.white)
                } else if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
                    .fontWeight(.medium)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .padding(.horizontal, 16)
            .background(isEnabled && !isBusy ? TomatoToken.buttonPrimaryFill : TomatoToken.bgLayer3)
            .foregroundStyle(isEnabled && !isBusy ? Color.white : TomatoToken.labelDimmed)
            .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled || isBusy)
    }
}

/// Outlined secondary action.
struct TomatoSecondaryButton: View {
    let title: String
    var systemImage: String?
    var isDestructive: Bool = false
    var isEnabled: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let systemImage {
                    Image(systemName: systemImage)
                }
                Text(title)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .padding(.horizontal, 16)
            .background(TomatoToken.buttonElevatedFill)
            .foregroundStyle(isDestructive ? TomatoToken.stateErrorPrimary : TomatoToken.labelPrimary)
            .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous)
                    .strokeBorder(TomatoToken.borderL2, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.5)
    }
}

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
            }
        }
        .padding(12)
        .background(TomatoToken.stateErrorPrimary.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
    }
}

/// Two-column fact row used by the account and desktop screens.
struct InfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(label)
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelCaption)
            Spacer(minLength: 12)
            Text(value)
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelPrimary)
                .multilineTextAlignment(.trailing)
        }
    }
}

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
        .padding(.vertical, 8)
        .background(TomatoToken.stateBusinessPrimary.opacity(0.10))
    }
}

/// Section heading with an optional trailing accessory.
struct SectionHeader<Accessory: View>: View {
    let title: String
    private let accessory: Accessory

    init(title: String, @ViewBuilder accessory: () -> Accessory) {
        self.title = title
        self.accessory = accessory()
    }

    var body: some View {
        HStack {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(TomatoToken.labelPrimary)
            Spacer()
            accessory
        }
    }
}

extension SectionHeader where Accessory == EmptyView {
    init(title: String) {
        self.init(title: title) { EmptyView() }
    }
}

/// Dot used wherever a Session is running.
///
/// Deliberately static. A `repeatForever` opacity animation kept every visible
/// running row (and every kept-alive tab) driving frames continuously, which
/// cost scroll smoothness, battery, and XCUITest quiescence.
struct RunningDot: View {
    var body: some View {
        Circle()
            .fill(TomatoToken.brandPrimary)
            .frame(width: 8, height: 8)
            .accessibilityLabel("运行中")
    }
}

/// Centered placeholder for empty collections.
struct EmptyPlaceholder: View {
    let systemImage: String
    let title: String
    var detail: String?

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: systemImage)
                .font(.system(size: 28))
                .foregroundStyle(TomatoToken.labelDimmed)
            Text(title)
                .font(.subheadline)
                .foregroundStyle(TomatoToken.labelPrimary)
            if let detail {
                Text(detail)
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelCaption)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
}

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
struct StatusPill: View {
    enum Tone { case ok, warn, error, idle, info }

    let text: String
    var tone: Tone = .idle

    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(color)
                .frame(width: 6, height: 6)
            Text(text)
                .font(.caption.weight(.medium))
                .foregroundStyle(TomatoToken.labelPrimary)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .background(color.opacity(0.14))
        .clipShape(Capsule())
    }

    private var color: Color {
        switch tone {
        case .ok: TomatoToken.stateSuccessPrimary
        case .warn: TomatoToken.stateWarnPrimary
        case .error: TomatoToken.stateErrorPrimary
        case .info: TomatoToken.stateBusinessPrimary
        case .idle: TomatoToken.stateIdlePrimary
        }
    }
}

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

/// The conversation's liveness, as every list row and the conversation header
/// reports it. Colour alone never carries the state: the label says it too.
struct SessionStateBadge: View {
    let state: SessionState

    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(color)
                .frame(width: 6, height: 6)
            Text(label)
                .font(.caption2.weight(.medium))
                .foregroundStyle(state == .running ? TomatoToken.brandPrimary : TomatoToken.labelCaption)
        }
        .padding(.horizontal, 7)
        .padding(.vertical, 3)
        .background(color.opacity(state == .running ? 0.12 : 0.07), in: Capsule())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
    }

    private var label: String {
        switch state {
        case .running: "进行中"
        case .live: "对话中"
        case .fresh: "未开始"
        case .ended: "已结束"
        }
    }

    private var color: Color {
        switch state {
        case .running: TomatoToken.brandPrimary
        case .live: TomatoToken.stateSuccessPrimary
        case .fresh: TomatoToken.stateWarnPrimary
        case .ended: TomatoToken.stateIdlePrimary
        }
    }
}

/// Placeholder block shown while a conversation's first page is in flight, so
/// the screen paints structure instead of an empty canvas.
struct SkeletonBlock: View {
    var width: CGFloat?
    var height: CGFloat = 14

    var body: some View {
        RoundedRectangle(cornerRadius: 6, style: .continuous)
            .fill(TomatoToken.bgSkeleton)
            .frame(maxWidth: width ?? .infinity, alignment: .leading)
            .frame(height: height)
            .opacity(0.9)
    }
}

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
private let relativeTimeFormatter: RelativeDateTimeFormatter = {
    let formatter = RelativeDateTimeFormatter()
    formatter.unitsStyle = .short
    return formatter
}()

/// Format one epoch-millisecond timestamp relative to now.
/// - Parameter milliseconds: Unix epoch milliseconds.
/// - Returns: the localized short relative time.
func relativeTime(_ milliseconds: Double) -> String {
    let date = Date(timeIntervalSince1970: milliseconds / 1000)
    return relativeTimeFormatter.localizedString(for: date, relativeTo: Date())
}
