//
//  PendingBanner.swift
//  Tomato Remote
//
//  One line above the composer naming the request that is holding the turn.
//

import SwiftUI

/// A waiting question or approval, stated where the answer will be typed.
struct PendingBanner: View {
    let interaction: PendingInteraction
    let count: Int
    let open: () -> Void

    var body: some View {
        Button(action: open) {
            HStack(spacing: 8) {
                Image(systemName: "bell.badge.fill")
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.brandPrimary)
                Text(interaction.summary)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .lineLimit(1)
                if count > 1 {
                    Text("+\(count - 1)")
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                Spacer(minLength: 6)
                Text("处理")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(TomatoToken.brandPrimary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(TomatoToken.brandPrimary.opacity(0.08), in: RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous)
                    .strokeBorder(TomatoToken.brandPrimary.opacity(0.18), lineWidth: 1)
            )
            .contentShape(RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 16)
        .accessibilityIdentifier("composer.pending")
    }
}
