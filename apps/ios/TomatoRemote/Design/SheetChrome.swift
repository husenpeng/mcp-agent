//
//  SheetChrome.swift
//  Tomato Remote
//
//  One presentation for every sheet in the app.
//
//  Sheets used to pick their own detents, background, and title treatment, so two
//  panels opened a day apart could look unrelated. These helpers keep the shared
//  decisions — corner radius, page background, drag handle, title block, primary
//  action — in one place, and let each sheet supply only its content.
//

import SwiftUI

extension View {
    /// Standard bottom-sheet presentation: rounded top, page background, handle.
    /// - Parameter detents: the heights the sheet may rest at.
    /// - Returns: the view, presented as the app's sheets are.
    func tomatoSheet(_ detents: Set<PresentationDetent> = [.medium, .large]) -> some View {
        presentationDetents(detents)
            .presentationDragIndicator(.visible)
            .presentationCornerRadius(28)
            .presentationBackground(TomatoToken.bgBase)
    }

    /// A sheet that fills the screen and needs no drag handle.
    func tomatoFullSheet() -> some View {
        presentationDetents([.large])
            .presentationDragIndicator(.hidden)
            .presentationCornerRadius(28)
            .presentationBackground(TomatoToken.bgBase)
    }

    /// Keep form and list rows sitting on the sheet's own background.
    func tomatoSheetContent() -> some View {
        scrollContentBackground(.hidden)
            .background(TomatoToken.bgBase)
    }
}

/// The title block at the top of a sheet.
struct SheetHeader: View {
    let title: String
    var caption: String?
    var onClose: (() -> Void)?

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelPrimary)
                if let caption, !caption.isEmpty {
                    Text(caption)
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 0)
            if let onClose {
                Button(action: onClose) {
                    Image(systemName: "xmark")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelCaption)
                        .frame(width: 28, height: 28)
                        .background(TomatoToken.bgLayer2, in: Circle())
                        // The visible circle stays 28 pt; the touch target meets
                        // the 44 pt minimum this sheet's only close affordance
                        // deserves.
                        .frame(width: 44, height: 44)
                        .contentShape(Circle())
                }
                .buttonStyle(TomatoPressableStyle())
                .accessibilityLabel("关闭")
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 18)
        .padding(.bottom, 10)
    }
}

/// The primary action at the bottom of a sheet.
struct SheetPrimaryButton: View {
    let title: String
    var isBusy = false
    var isEnabled = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ZStack {
                Capsule(style: .continuous)
                    .fill(isEnabled ? TomatoToken.brandPrimary : TomatoToken.bgLayer2)
                if isBusy {
                    ProgressView()
                        .tint(.white)
                } else {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(isEnabled ? Color.white : TomatoToken.labelDimmed)
                }
            }
            .frame(height: 48)
        }
        .buttonStyle(TomatoPressableStyle())
        .disabled(!isEnabled || isBusy)
        .padding(.horizontal, 20)
    }
}