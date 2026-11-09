//
//  Components.swift
//  Tomato Remote
//
//  Small shared surfaces so screens stay declarative. Everything reads
//  `TomatoToken` and `TomatoRadius`; no view defines its own colors.
//

import SwiftUI

/// Rounded surface used for every card on every screen.
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
                    .strokeBorder(TomatoToken.borderL1, lineWidth: 1)
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
                if let systemImage { Image(systemName: systemImage) }
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

/// Pulsing dot used wherever a Session is running.
struct RunningDot: View {
    @State private var pulsing = false

    var body: some View {
        Circle()
            .fill(TomatoToken.brandPrimary)
            .frame(width: 8, height: 8)
            .opacity(pulsing ? 0.35 : 1)
            .animation(.easeInOut(duration: 0.9).repeatForever(autoreverses: true), value: pulsing)
            .onAppear { pulsing = true }
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

/// Relative timestamp used by list rows and messages.
func relativeTime(_ milliseconds: Double) -> String {
    let date = Date(timeIntervalSince1970: milliseconds / 1000)
    let formatter = RelativeDateTimeFormatter()
    formatter.unitsStyle = .short
    return formatter.localizedString(for: date, relativeTo: Date())
}