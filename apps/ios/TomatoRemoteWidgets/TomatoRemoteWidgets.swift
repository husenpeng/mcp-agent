//
//  TomatoRemoteWidgets.swift
//  TomatoRemoteWidgets
//
//  The Live Activity and Dynamic Island for a running Session: compact state in
//  the island, the title and current line on the Lock Screen.
//

import ActivityKit
import SwiftUI
import WidgetKit

/// Entry point of the extension: the Live Activity the app starts.
@main
struct TomatoWidgetsBundle: WidgetBundle {
    var body: some Widget {
        TomatoRunWidget()
    }
}

/// Live Activity rendering for one running Session.
struct TomatoRunWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: TomatoRunAttributes.self) { context in
            lockScreen(context)
                .activityBackgroundTint(TomatoWidgetTokens.surface)
                .activitySystemActionForegroundColor(TomatoWidgetTokens.brand)
                .widgetURL(deepLink(context.attributes.sessionId))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    icon(context.state, side: 24)
                }
                DynamicIslandExpandedRegion(.center) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(context.attributes.title)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(TomatoWidgetTokens.labelPrimary)
                            .lineLimit(1)
                        Text(line(context.state))
                            .font(.caption2)
                            .foregroundStyle(TomatoWidgetTokens.labelSecondary)
                            .lineLimit(1)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    status(context.state)
                }
            } compactLeading: {
                Image(systemName: context.state.pending > 0 ? "bell.badge.fill" : "sparkles")
                    .foregroundStyle(TomatoWidgetTokens.brand)
            } compactTrailing: {
                status(context.state)
            } minimal: {
                Image(systemName: context.state.pending > 0 ? "bell.fill" : (context.state.running ? "sparkles" : "checkmark"))
                    .foregroundStyle(TomatoWidgetTokens.brand)
            }
        }
    }

    /// The Lock Screen card: one brand badge, the conversation, and what it is
    /// doing right now.
    ///
    /// Every colour is stated, because a Live Activity renders outside the app
    /// and its text otherwise takes the widget environment's own label colour,
    /// which stops matching a surface this view paints itself.
    private func lockScreen(_ context: ActivityViewContext<TomatoRunAttributes>) -> some View {
        HStack(alignment: .center, spacing: 12) {
            icon(context.state)
            VStack(alignment: .leading, spacing: 3) {
                Text(context.attributes.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TomatoWidgetTokens.labelPrimary)
                    .lineLimit(1)
                Text(line(context.state))
                    .font(.caption)
                    .foregroundStyle(TomatoWidgetTokens.labelSecondary)
                    .lineLimit(2)
            }
            Spacer(minLength: 8)
            status(context.state)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }

    /// Rounded brand mark; a bell replaces it while requests wait on the owner.
    ///
    /// The Island's leading region is shorter than the card, so its badge keeps
    /// a smaller side instead of being clipped to the region's height.
    private func icon(_ state: TomatoRunAttributes.ContentState, side: CGFloat = 32) -> some View {
        let glyph = side * 0.47
        return RoundedRectangle(cornerRadius: side * 0.28, style: .continuous)
            .fill(TomatoWidgetTokens.brand)
            .frame(width: side, height: side)
            .overlay(
                Image(systemName: state.pending > 0 ? "bell.badge.fill" : "sparkles")
                    .font(.system(size: glyph, weight: .semibold))
                    .foregroundStyle(.white)
            )
    }

    /// Pending count, or the running/done word, so the card never ends in an
    /// empty trail when nothing is spinning.
    @ViewBuilder
    private func status(_ state: TomatoRunAttributes.ContentState) -> some View {
        if state.pending > 0 {
            HStack(spacing: 3) {
                Text("\(state.pending)")
                    .font(.caption.weight(.semibold))
                    .monospacedDigit()
                Image(systemName: "bell.fill")
                    .font(.system(size: 9))
            }
            .foregroundStyle(TomatoWidgetTokens.brandLabel)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(TomatoWidgetTokens.brandWash, in: Capsule())
        } else if state.running {
            HStack(spacing: 5) {
                ProgressView()
                    .controlSize(.mini)
                    .tint(TomatoWidgetTokens.labelSecondary)
                Text("进行中")
                    .font(.caption2)
                    .foregroundStyle(TomatoWidgetTokens.labelSecondary)
            }
        } else {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 16))
                .foregroundStyle(TomatoWidgetTokens.stateSuccess)
        }
    }

    /// Tapping the card opens the conversation it describes.
    private func deepLink(_ sessionId: String) -> URL? {
        let escaped = sessionId.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? sessionId
        return URL(string: "tomato://session/\(escaped)")
    }

    /// The line under the title: what the turn is doing, then what it waits for.
    ///
    /// A pending count is carried by the status pill, so it appears here only
    /// once nothing is running and the wait itself is the whole story.
    private func line(_ state: TomatoRunAttributes.ContentState) -> String {
        if state.running {
            return state.detail.isEmpty ? "正在执行…" : state.detail
        }
        if state.pending > 0 {
            return "有 \(state.pending) 项在等你处理"
        }
        return state.detail.isEmpty ? "已完成" : state.detail
    }
}

/// Colours the island can use without the app's asset catalog.
///
/// The card paints its own near-black surface in both appearances, the way a
/// system notification stays legible over any wallpaper, so the labels are fixed
/// light values rather than the appearance-dependent app tokens.
enum TomatoWidgetTokens {
    /// Brand red, matched to the app's primary action colour.
    static let brand = Color(red: 1, green: 0.1569, blue: 0.1569)
    /// Surface the card paints, one step off black for depth against a wallpaper.
    static let surface = Color(red: 0.098, green: 0.1059, blue: 0.1098)
    /// Title and body text on that surface.
    static let labelPrimary = Color(red: 0.9412, green: 0.949, blue: 0.9569)
    /// The state line and the running spinner.
    static let labelSecondary = Color(red: 0.6275, green: 0.6392, blue: 0.6471)
    /// Finished sessions.
    static let stateSuccess = Color(red: 0.3098, green: 0.749, blue: 0.3647)
    /// Text of the pending count: the brand lightened until it clears 4.5:1
    /// against its own wash, which the raw brand red does not.
    static let brandLabel = Color(red: 1, green: 0.5373, blue: 0.4902)
    /// Badge behind a pending count, faint enough to read as a tint, not a chip.
    static let brandWash = Color(red: 1, green: 0.1569, blue: 0.1569).opacity(0.14)
}
