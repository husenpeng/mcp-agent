//
//  Primitives.swift
//  Tomato Remote
//
//  The design-system atoms: surfaces, controls, status, and the small reusable
//  pieces every screen composes. Everything reads `TomatoToken`/`TomatoRadius`;
//  no primitive defines its own colors. Composed patterns live in Patterns.swift.
//
//  Layering (tokens → primitives → patterns → screens) follows the open-source
//  design-system convention: atoms here are dumb and reusable, screens compose
//  them and own no raw colors.
//

import SwiftUI

// MARK: - Press feedback

/// Pressed acknowledgement for the app's custom controls.
///
/// A short spring rather than a linear fade: the control dips and settles with
/// a little life, which reads as responsive instead of merely dimmed.
struct TomatoPressableStyle: ButtonStyle {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .opacity(configuration.isPressed ? 0.90 : 1)
            .scaleEffect(configuration.isPressed && !reduceMotion ? 0.98 : 1)
            .animation(
                reduceMotion ? nil : .spring(response: 0.28, dampingFraction: 0.72),
                value: configuration.isPressed
            )
    }
}

// MARK: - Surfaces

/// Grouped surface: the shape iOS uses for a block of related facts.
///
/// Stacked cards stay flat (fill + one hairline) so a scroll reads as one page,
/// not a pile of floating sheets. A standalone or hero card opts into
/// `elevated`, which adds a soft ambient shadow and a faint top sheen for depth.
struct TomatoCard<Content: View>: View {
    private let padding: CGFloat
    private let elevated: Bool
    private let content: Content

    init(padding: CGFloat = 16, elevated: Bool = false, @ViewBuilder content: () -> Content) {
        self.padding = padding
        self.elevated = elevated
        self.content = content()
    }

    var body: some View {
        content
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(TomatoSurface.card)
            .overlay(alignment: .top) {
                if elevated {
                    LinearGradient(
                        colors: [TomatoToken.labelPrimary.opacity(0.025), .clear],
                        startPoint: .top, endPoint: .bottom
                    )
                    .frame(height: 24)
                    .allowsHitTesting(false)
                }
            }
            .clipShape(RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous)
                    .strokeBorder(TomatoLine.hairline, lineWidth: 1)
            )
            // A warm-slate lift, not a black wash: one preset per elevation.
            .shadow(
                color: elevated ? TomatoShadow.raised.color : .clear,
                radius: elevated ? TomatoShadow.raised.radius : 0,
                x: 0,
                y: elevated ? TomatoShadow.raised.y : 0
            )
    }
}

/// A hero surface: a clean white card for the one place a screen opens with its
/// headline (the Today recap). The reference language keeps the answer/content
/// area quiet; brand color belongs to actionable entries, not the recap wash.
struct TomatoHero<Content: View>: View {
    private let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(TomatoSurface.card)
            .clipShape(RoundedRectangle(cornerRadius: TomatoCorner.hero, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoCorner.hero, style: .continuous)
                    .strokeBorder(TomatoLine.hairline, lineWidth: 1)
            )
    }
}

/// A tinted rounded-square icon container — the leading visual of an action
/// entry. The glyph sits on a soft wash of its own tint with no extra border,
/// matching the reference's lighter icon treatment.
struct IconChip: View {
    let systemImage: String
    var tint: Color = TomatoToken.brandPrimary
    /// A neutral chip stays a quiet grey surface; a tinted one carries its hue
    /// on a soft wash of the same colour.
    var neutral: Bool = false
    var side: CGFloat = 36

    var body: some View {
        Image(systemName: systemImage)
            .font(.system(size: side * 0.42, weight: .medium))
            .foregroundStyle(glyph)
            .frame(width: side, height: side)
            .background(fill, in: RoundedRectangle(cornerRadius: side * 0.28, style: .continuous))
            .accessibilityHidden(true)
    }

    private var fill: Color {
        neutral ? TomatoSurface.variant : tint.opacity(0.10)
    }

    private var glyph: Color {
        neutral ? TomatoToken.labelSecondary : tint
    }
}

/// The standard actionable entry, modelled on the "进行中" card the product
/// owner chose as the reference: soft brand fill, one brand hairline, a 36pt
/// icon chip, a semibold title, one caption line, and a trailing chevron.
/// Home's memory entry, pending interactions and running sessions all use it.
struct TomatoActionEntry: View {
    let systemImage: String
    let title: String
    var subtitle: String?
    var tint: Color = TomatoToken.brandPrimary
    var badge: String?
    var showsChevron: Bool = true

    var body: some View {
        HStack(spacing: 12) {
            IconChip(systemImage: systemImage, tint: tint, side: 36)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .lineLimit(1)
                if let subtitle, !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelSecondary)
                        .lineLimit(1)
                }
            }
            Spacer(minLength: 8)
            if let badge, !badge.isEmpty {
                Text(badge)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(tint)
            }
            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelCaption)
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            TomatoBrand.soft,
            in: RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous)
                .strokeBorder(TomatoLine.brandSoft, lineWidth: 1)
        )
        .contentShape(RoundedRectangle(cornerRadius: TomatoCorner.card, style: .continuous))
    }
}

extension View {
    /// A soft ambient lift for a standalone card or control. Kept off stacked
    /// list rows so a scroll stays one surface.
    func tomatoDepth() -> some View {
        shadow(
            color: TomatoShadow.flat.color,
            radius: TomatoShadow.flat.radius,
            x: 0,
            y: TomatoShadow.flat.y
        )
    }
}

// MARK: - Controls

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
            .frame(minHeight: 44)
            .background(isEnabled && !isBusy ? TomatoBrand.solid : TomatoSurface.variant)
            .foregroundStyle(isEnabled && !isBusy ? Color.white : TomatoToken.labelDimmed)
            .clipShape(RoundedRectangle(cornerRadius: TomatoCorner.control, style: .continuous))
        }
        .buttonStyle(TomatoPressableStyle())
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
            .frame(minHeight: 44)
            .background(TomatoSurface.card)
            .foregroundStyle(isDestructive ? TomatoToken.stateErrorPrimary : TomatoToken.labelPrimary)
            .clipShape(RoundedRectangle(cornerRadius: TomatoCorner.control, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoCorner.control, style: .continuous)
                    .strokeBorder(TomatoLine.strong, lineWidth: 1)
            )
        }
        .buttonStyle(TomatoPressableStyle())
        .disabled(!isEnabled)
        .opacity(isEnabled ? 1 : 0.5)
    }
}

// MARK: - Facts & headings

/// Two-column fact row used by the account and desktop screens.
///
/// The value is right-aligned and set in tabular digits so a column of live
/// numbers (tokens, rounds, counts) does not jitter as it updates.
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
                .font(.footnote.monospacedDigit())
                .foregroundStyle(TomatoToken.labelPrimary)
                .multilineTextAlignment(.trailing)
        }
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
                .accessibilityAddTraits(.isHeader)
            Spacer()
            accessory
        }
        .accessibilityElement(children: .contain)
    }
}

extension SectionHeader where Accessory == EmptyView {
    init(title: String) {
        self.init(title: title) { EmptyView() }
    }
}

// MARK: - Status

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

/// Compact state chip: a tinted icon plus a short label on a soft capsule.
///
/// The icon and the word both carry the state, so color is never the only
/// channel. A call site may pass a state-specific `symbol`; otherwise the tone
/// supplies a sensible default.
struct StatusPill: View {
    enum Tone { case ok, warn, error, idle, info, active }

    let text: String
    var tone: Tone = .idle
    var symbol: String?

    var body: some View {
        HStack(spacing: 5) {
            Image(systemName: symbol ?? defaultSymbol)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(pair.label)
            Text(text)
                .font(.caption.weight(.medium))
                .foregroundStyle(pair.label)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 3)
        .background(pair.fill, in: Capsule())
    }

    private var defaultSymbol: String {
        switch tone {
        case .ok: "checkmark.circle.fill"
        case .warn: "pause.circle.fill"
        case .error: "exclamationmark.octagon.fill"
        case .info: "info.circle.fill"
        case .active: "bolt.fill"
        case .idle: "moon.fill"
        }
    }

    /// The container pair, so the label and its wash keep contrast rather than
    /// relying on one tint at two alphas. Running/active work uses the brand
    /// pair; blue is reserved for informational notices, never live state.
    private var pair: TomatoContainer.Pair {
        switch tone {
        case .ok: TomatoContainer.success
        case .warn: TomatoContainer.warning
        case .error: TomatoContainer.error
        case .info: TomatoContainer.info
        case .active: TomatoContainer.primary
        case .idle: TomatoContainer.neutral
        }
    }
}

/// The conversation's liveness, as every list row and the conversation header
/// reports it. An icon and the label both carry the state; color reinforces.
struct SessionStateBadge: View {
    let state: SessionState

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: symbol)
                .font(.system(size: 9, weight: .semibold))
                .foregroundStyle(pair.label)
            Text(label)
                .font(.caption2.weight(.medium))
                .foregroundStyle(pair.label)
        }
        .padding(.horizontal, 7)
        .padding(.vertical, 3)
        .background(pair.fill, in: Capsule())
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(label)
    }

    /// A running Session takes the brand container; the resting states take
    /// the quiet neutral one so only live work carries colour.
    private var pair: TomatoContainer.Pair {
        state == .running ? TomatoContainer.primary : TomatoContainer.neutral
    }

    private var symbol: String {
        switch state {
        case .running: "bolt.fill"
        case .live: "bubble.left.fill"
        case .fresh: "sparkles"
        case .ended: "moon.fill"
        }
    }

    private var label: String {
        switch state {
        case .running: "进行中"
        case .live: "对话中"
        case .fresh: "未开始"
        case .ended: "已结束"
        }
    }

    }

// MARK: - Loading

/// Placeholder block shown while a conversation's first page is in flight, so
/// the screen paints structure instead of an empty canvas. A gentle shimmer
/// sweeps it while it is on screen; the block disappears once content lands,
/// so the animation never runs on a settled page.
struct SkeletonBlock: View {
    var width: CGFloat?
    var height: CGFloat = 14

    var body: some View {
        RoundedRectangle(cornerRadius: 6, style: .continuous)
            .fill(TomatoToken.bgSkeleton)
            .frame(maxWidth: width ?? .infinity, alignment: .leading)
            .frame(height: height)
            .tomatoShimmer()
    }
}

extension View {
    /// A soft light sweep for loading placeholders. Transient by design: apply
    /// only to skeletons that are removed once real content arrives.
    func tomatoShimmer() -> some View {
        modifier(ShimmerSweep())
    }
}

private struct ShimmerSweep: ViewModifier {
    @State private var phase: CGFloat = -0.6

    func body(content: Content) -> some View {
        content.overlay(
            GeometryReader { geometry in
                LinearGradient(
                    colors: [.clear, TomatoToken.labelPrimary.opacity(0.05), .clear],
                    startPoint: .leading, endPoint: .trailing
                )
                .frame(width: geometry.size.width * 0.5)
                .offset(x: geometry.size.width * phase)
            }
            .allowsHitTesting(false)
            .onAppear {
                withAnimation(.linear(duration: 1.3).repeatForever(autoreverses: false)) {
                    phase = 1.2
                }
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }
}