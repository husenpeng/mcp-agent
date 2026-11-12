//
//  ModelChips.swift
//  Tomato Remote
//
//  The composer's two model chips, drawn the way Qwen's composer draws its
//  model seat: the name in use with a chevron, and the reasoning level beside
//  it, tinted while the model actually reasons.
//

import SwiftUI

/// Name of the model the next message uses.
struct ModelChoiceChip: View {
    /// Catalog name, or the model id before the catalog loads.
    let title: String
    /// Whether the Host is already recording another choice.
    var isBusy = false
    /// Accessibility identifier, so a screen with its own model source can be
    /// addressed without colliding with another composer's chip.
    var identifier = "composer.model"
    let open: () -> Void

    var body: some View {
        Button(action: open) {
            HStack(spacing: 4) {
                Text(title)
                    .font(.caption.weight(.medium))
                    .lineLimit(1)
                    .truncationMode(.middle)
                    // A long provider id truncates here; the sheet still reads
                    // the full name.
                    .frame(maxWidth: 190, alignment: .leading)
                if isBusy {
                    ProgressView()
                        .controlSize(.mini)
                } else {
                    Image(systemName: "chevron.down")
                        .font(.system(size: 9, weight: .semibold))
                }
            }
            .foregroundStyle(TomatoToken.labelSecondary)
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(TomatoToken.bgLayer2, in: Capsule())
            .overlay(Capsule().strokeBorder(TomatoToken.borderL2, lineWidth: 0.5))
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(identifier)
        .accessibilityLabel("选择模型")
        .accessibilityValue(title)
    }
}

/// Reasoning level the next message uses.
struct EffortChoiceChip: View {
    /// Wording for the level, already resolved by the screen.
    let title: String
    /// Whether the model reasons at all at this level.
    var isActive = false
    /// Accessibility identifier, for the composer that owns this chip.
    var identifier = "composer.effort"
    let open: () -> Void

    var body: some View {
        Button(action: open) {
            HStack(spacing: 4) {
                Image(systemName: "brain")
                    .font(.system(size: 10, weight: .medium))
                Text(title)
                    .font(.caption.weight(.medium))
                    .lineLimit(1)
            }
            .foregroundStyle(isActive ? TomatoToken.brandPrimary : TomatoToken.labelSecondary)
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(
                isActive ? TomatoToken.brandPrimary.opacity(0.10) : TomatoToken.bgLayer2,
                in: Capsule()
            )
            .overlay(
                Capsule().strokeBorder(
                    isActive ? TomatoToken.brandPrimary.opacity(0.30) : TomatoToken.borderL2,
                    lineWidth: 0.5
                )
            )
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier(identifier)
        .accessibilityLabel("推理等级")
        .accessibilityValue(title)
    }
}
