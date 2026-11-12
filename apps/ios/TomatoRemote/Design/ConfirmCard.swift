//
//  ConfirmCard.swift
//  Tomato Remote
//
//  The app's own confirmation dialogs.
//
//  System alerts cannot carry the app's cards, corner radius, or typography, and
//  a destructive question deserves a caption explaining what survives. These
//  present as the same short bottom card every sheet uses, with the reason
//  spelled out and the destructive action separated from cancel.
//

import SwiftUI

/// A short question with one primary answer and a cancel.
struct ConfirmCard: View {
    let title: String
    let message: String
    var confirmTitle = "确定"
    var destructive = false
    let confirm: () -> Void

    @Environment(\.dismiss) private var dismiss

    /// A sheet tall enough for the reason, without a field of empty white below.
    /// - Parameter message: the explanation the card shows.
    /// - Returns: a detent height between 220 and 300 points.
    static func height(for message: String) -> CGFloat {
        let lines = max(1, Int(ceil(Double(message.count) / 22)))
        return min(300, 172 + CGFloat(lines) * 22)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            SheetHeader(title: title, onClose: { dismiss() })
            Text(message)
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelCaption)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            Spacer(minLength: 0)
            HStack(spacing: 10) {
                Button {
                    dismiss()
                } label: {
                    Text("取消")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(TomatoToken.bgLayer2, in: Capsule(style: .continuous))
                }
                .buttonStyle(.plain)
                Button {
                    dismiss()
                    confirm()
                } label: {
                    Text(confirmTitle)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .frame(height: 48)
                        .background(
                            destructive ? TomatoToken.stateErrorPrimary : TomatoToken.brandPrimary,
                            in: Capsule(style: .continuous)
                        )
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("confirm.primary")
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 16)
        }
        .background(TomatoToken.bgBase)
    }
}

extension View {
    /// Present the app's confirmation card instead of a system alert.
    func tomatoConfirm(
        isPresented: Binding<Bool>,
        title: String,
        message: String,
        confirmTitle: String,
        destructive: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        sheet(isPresented: isPresented) {
            ConfirmCard(
                title: title,
                message: message,
                confirmTitle: confirmTitle,
                destructive: destructive,
                confirm: action
            )
            .tomatoSheet([.height(ConfirmCard.height(for: message))])
        }
    }
}