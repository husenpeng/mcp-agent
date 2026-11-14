//
//  FloatingTabBar.swift
//  Tomato Remote
//
//  The app's destinations, as one floating ball instead of a bar.
//
//  The six destinations are occasional switches, not the work itself: a full
//  tab bar spent the bottom edge of every screen, and a conversation already
//  hides it. This control keeps a 54-point ball at the trailing corner and opens
//  the destinations only when asked, so the transcript, list, and composer keep
//  the space. It also carries the two facts the old bar spread across badges:
//  requests waiting on the person, and turns running on the Host.
//
//  A composer screen (Tomato Phone) has no free bottom corner; it offers the same
//  palette from a compact button in its composer instead, so the screen does not
//  reserve a strip under the input.
//

import SwiftUI
import UIKit

// MARK: - Destinations

/// What the ball needs to know about one destination: its name, its symbol, and
/// the identifier a UI test addresses it by.
extension AppModel.Tab: CaseIterable, Identifiable {
    static var allCases: [AppModel.Tab] {
        [.home, .sessions, .phoneAgent, .robots, .rooms, .account]
    }

    var id: String {
        identifier
    }

    /// Name the palette and the navigation bar share.
    var title: String {
        switch self {
        case .home: "记忆"
        case .sessions: "会话"
        case .phoneAgent: "Tomato Phone"
        case .robots: "智能体"
        case .rooms: "群聊"
        case .account: "账号"
        }
    }

    /// Symbol the destination uses in the palette and on the ball.
    var systemImage: String {
        switch self {
        case .home: "brain"
        case .sessions: "bubble.left.and.bubble.right"
        case .phoneAgent: "iphone.gen3"
        case .robots: "brain.head.profile"
        case .rooms: "person.3"
        case .account: "person.crop.circle"
        }
    }

    /// Stable accessibility identifier for this destination's palette item.
    var identifier: String {
        switch self {
        case .home: "app.tab.home"
        case .sessions: "app.tab.sessions"
        case .phoneAgent: "app.tab.phoneAgent"
        case .robots: "app.tab.robots"
        case .rooms: "app.tab.rooms"
        case .account: "app.tab.account"
        }
    }
}

// MARK: - Menu state

/// Whether the destination palette is open.
///
/// A root with a bottom ball and a root with an inline trigger both read this
/// one object, so the full-screen layer never has to be owned by the button that
/// opened it.
@MainActor
final class FloatingTabMenuState: ObservableObject {
    @Published var expanded = false
}

// MARK: - Counts

/// Numbers the ball and the palette both draw.
private struct TabCounts {
    let pending: Int
    let runningSessions: Int
    let phoneRunning: Bool

    var anyRunning: Bool {
        runningSessions > 0 || phoneRunning
    }
}

// MARK: - Layer

/// The scrim, the palette, and the ball as one full-screen layer.
///
/// Drawing them separately let the scrim's ignored safe area move the ball down
/// over the home indicator. One layer keeps the ball where a thumb expects it
/// and lets the scrim cover the whole screen.
private struct FloatingTabsLayer: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var interactions: InteractionCenter
    @EnvironmentObject private var menu: FloatingTabMenuState
    @ObservedObject private var phone = PhoneAgentModel.shared
    /// A composer screen hides the ball and opens this layer from its composer.
    let showsBall: Bool

    private var counts: TabCounts {
        TabCounts(
            pending: interactions.pending.count,
            runningSessions: model.sessions.filter(\.running).count,
            phoneRunning: phone.isRunning
        )
    }

    var body: some View {
        if showsBall || menu.expanded {
            GeometryReader { proxy in
                ZStack(alignment: .bottomTrailing) {
                    PaletteScrim()
                    if showsBall {
                        FloatingTabBall(counts: counts)
                            .padding(.trailing, 18)
                            .padding(.bottom, 10 + bottomInset(proxy))
                    }
                    if menu.expanded {
                        FloatingTabPalette(counts: counts)
                            .padding(.trailing, 18)
                            .padding(.bottom, 10 + bottomInset(proxy) + (showsBall ? 64 : 12))
                            .transition(
                                .scale(scale: 0.86, anchor: .bottomTrailing)
                                    .combined(with: .opacity)
                            )
                    }
                }
                .frame(width: proxy.size.width, height: proxy.size.height, alignment: .bottomTrailing)
            }
            .ignoresSafeArea()
            .onChange(of: model.tab) { _, _ in
                close()
            }
            .onChange(of: menu.expanded) { _, open in
                if open {
                    UIImpactFeedbackGenerator(style: .light).impactOccurred()
                }
            }
            .animation(.spring(response: 0.34, dampingFraction: 0.82), value: menu.expanded)
        }
    }

    /// Bottom inset of the key window.
    ///
    /// The layer ignores the safe area, so its `GeometryProxy` reports zero and
    /// the ball would land on the home indicator. The window still knows the
    /// inset the screen actually has.
    private func bottomInset(_ proxy: GeometryProxy) -> CGFloat {
        max(proxy.safeAreaInsets.bottom, Self.windowBottomInset)
    }

    private static var windowBottomInset: CGFloat {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let window = scenes.flatMap(\.windows).first(where: \.isKeyWindow)
            ?? scenes.flatMap(\.windows).first
        return window?.safeAreaInsets.bottom ?? 0
    }

    private func close() {
        guard menu.expanded else { return }
        withAnimation(.easeOut(duration: 0.16)) { menu.expanded = false }
    }
}

// MARK: - Scrim

/// The veil between an open palette and the page.
///
/// A flat black tint left the white page looking washed out and stopped at the
/// bottom safe area. A vertical veil keeps the page readable, darkens the field
/// the palette sits on, and the full-screen layer carries it over the
/// home-indicator strip too.
private struct PaletteScrim: View {
    @EnvironmentObject private var menu: FloatingTabMenuState

    var body: some View {
        if menu.expanded {
            LinearGradient(
                colors: [TomatoToken.bgMask2, TomatoToken.bgMask1],
                startPoint: .top,
                endPoint: .bottom
            )
            .contentShape(Rectangle())
            .onTapGesture {
                withAnimation(.easeOut(duration: 0.16)) { menu.expanded = false }
            }
            .transition(.opacity)
            .accessibilityHidden(true)
        }
    }
}

// MARK: - Ball

/// The floating destination control.
///
/// A tap opens the palette; the current destination is marked, the ball carries
/// its current glyph, the pending-request count sits on it, and a thin ring says
/// a turn is running. Selecting a destination is the only thing that switches the
/// tab, so the control never hides content behind a gesture nobody asked for.
private struct FloatingTabBall: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var menu: FloatingTabMenuState
    let counts: TabCounts

    var body: some View {
        Button {
            withAnimation(.spring(response: 0.34, dampingFraction: 0.82)) {
                menu.expanded.toggle()
            }
        } label: {
            ZStack {
                Image(systemName: model.tab.systemImage)
                    .font(.system(size: 20, weight: .medium))
                    .foregroundStyle(TomatoToken.brandPrimary)
                if counts.anyRunning {
                    Circle()
                        .strokeBorder(TomatoToken.stateSuccessPrimary.opacity(0.55), lineWidth: 1.5)
                        .padding(2)
                }
            }
            .frame(width: 54, height: 54)
            .tomatoGlass(in: Circle())
            .overlay(alignment: .topTrailing) {
                if counts.pending > 0 {
                    TabBadge(text: "\(counts.pending)", color: TomatoToken.brandPrimary)
                        .offset(x: 3, y: -3)
                }
            }
            .overlay(alignment: .bottomTrailing) {
                Image(systemName: menu.expanded ? "chevron.down" : "chevron.up")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .frame(width: 18, height: 18)
                    .tomatoGlass(in: Circle())
                    .offset(x: 2, y: 2)
            }
        }
        .buttonStyle(TomatoPressableStyle())
        .accessibilityIdentifier("app.tabBall")
        .accessibilityLabel("切换页面")
        .accessibilityValue(accessibilityValue)
        .accessibilityHint("双击打开页面菜单")
    }

    private var accessibilityValue: String {
        var parts = ["当前 \(model.tab.title)"]
        if counts.pending > 0 {
            parts.append("\(counts.pending) 项等待处理")
        }
        if counts.anyRunning {
            parts.append("有对话正在运行")
        }
        return parts.joined(separator: "，")
    }
}

// MARK: - Palette

/// The destinations, one per row, above the ball or the composer.
///
/// A single column keeps every title on one line: two columns forced the longest
/// destination ("Tomato Phone") into an ellipsis, and a grid of six equal tiles
/// read as a menu of unrelated actions instead of the app's page order.
private struct FloatingTabPalette: View {
    @EnvironmentObject private var model: AppModel
    @EnvironmentObject private var menu: FloatingTabMenuState
    let counts: TabCounts

    var body: some View {
        VStack(spacing: 2) {
            ForEach(AppModel.Tab.allCases) { tab in
                item(tab)
            }
        }
        .frame(width: 208)
        .padding(8)
        .background(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .fill(.regularMaterial)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 26, style: .continuous)
                .strokeBorder(TomatoToken.borderL2, lineWidth: 0.5)
        )
        .shadow(color: .black.opacity(0.14), radius: 20, y: 10)
    }

    /// One destination, sized for a thumb and labelled in words as well as with
    /// a glyph.
    /// - Parameter tab: destination the item switches to.
    private func item(_ tab: AppModel.Tab) -> some View {
        let active = tab == model.tab
        return Button {
            select(tab)
        } label: {
            HStack(spacing: 10) {
                Image(systemName: tab.systemImage)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(active ? Color.white : TomatoToken.labelSecondary)
                    .frame(width: 30, height: 30)
                    .background(
                        active ? TomatoToken.brandPrimary : TomatoToken.bgLayer3,
                        in: Circle()
                    )
                Text(tab.title)
                    .font(.subheadline.weight(active ? .semibold : .medium))
                    .foregroundStyle(active ? TomatoToken.brandPrimary : TomatoToken.labelSecondary)
                    .lineLimit(1)
                Spacer(minLength: 0)
                if let count = badgeCount(for: tab), count > 0 {
                    Text("\(count)")
                        .font(.caption2.monospacedDigit().weight(.semibold))
                        .foregroundStyle(TomatoToken.brandPrimary)
                }
            }
            .padding(.horizontal, 10)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .background(
                active ? TomatoToken.brandPrimary.opacity(0.10) : Color.clear,
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .strokeBorder(
                        active ? TomatoToken.brandPrimary.opacity(0.25) : Color.clear,
                        lineWidth: 1
                    )
            )
            .contentShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(TomatoPressableStyle())
        .accessibilityIdentifier(tab.identifier)
        .accessibilityLabel(tab.title)
        .accessibilityAddTraits(active ? .isSelected : AccessibilityTraits())
    }

    /// The count a destination carries: waiting requests on memory, running
    /// conversations on sessions, the local agent's turn on Tomato Phone.
    /// - Parameter tab: destination the item shows.
    /// - Returns: the number to draw, or nil for a destination with no count.
    private func badgeCount(for tab: AppModel.Tab) -> Int? {
        switch tab {
        case .home: counts.pending
        case .sessions: counts.runningSessions
        case .phoneAgent: counts.phoneRunning ? 1 : 0
        case .robots, .rooms, .account: nil
        }
    }

    private func select(_ tab: AppModel.Tab) {
        UISelectionFeedbackGenerator().selectionChanged()
        if model.tab != tab {
            model.tab = tab
        }
        withAnimation(.easeOut(duration: 0.16)) { menu.expanded = false }
    }
}

// MARK: - Small pieces

/// One small count bubble over the ball.
private struct TabBadge: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption2.monospacedDigit().weight(.bold))
            .foregroundStyle(.white)
            .padding(.horizontal, 5)
            .frame(minWidth: 18, minHeight: 18)
            .background(color, in: Capsule())
            .overlay(Capsule().strokeBorder(.white, lineWidth: 1.5))
    }
}

// MARK: - Root modifier

/// Replace the release tab bar on one root screen with the floating control.
///
/// The modifier is applied inside each tab's navigation stack, so a pushed
/// conversation or room hides the control with the root it belongs to. The tab
/// bar itself is hidden on the same screen: the palette is the only destination
/// control a reader sees.
private struct FloatingTabsModifier: ViewModifier {
    @EnvironmentObject private var menu: FloatingTabMenuState
    /// False on a screen whose bottom edge belongs to a composer; that screen
    /// opens the palette from its own inline trigger.
    let showsBall: Bool

    func body(content: Content) -> some View {
        content
            .toolbar(.hidden, for: .tabBar)
            .overlay {
                FloatingTabsLayer(showsBall: showsBall)
            }
            .onAppear {
                #if DEBUG
                    // A design run can inspect the palette without a tap; a
                    // release build never reads this argument.
                    if ProcessInfo.processInfo.arguments.contains("-TOMATO_TAB_PALETTE") {
                        menu.expanded = true
                    }
                #endif
            }
    }
}

extension View {
    /// Adopt the floating destination control on a tab root.
    /// - Parameter showsBall: false on a composer screen, which places its own
    ///   trigger and uses the same palette.
    /// - Returns: the screen with the tab bar hidden and the palette attached.
    func tomatoFloatingTabs(showsBall: Bool = true) -> some View {
        modifier(FloatingTabsModifier(showsBall: showsBall))
    }
}
