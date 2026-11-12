//
//  DeliverablesCard.swift
//  Tomato Remote
//
//  Files the Agent presented, grouped where the conversation ends.
//

import SwiftUI

/// The files one conversation produced; tapping one opens the preview sheet.
struct DeliverablesCard: View {
    let files: [DeliveredFile]
    let open: (DeliveredFile) -> Void

    var body: some View {
        TomatoCard(padding: 12) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "tray.full")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                    Text("产出文件")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelCaption)
                    Spacer(minLength: 0)
                    Text("\(files.count)")
                        .font(.caption2.monospacedDigit())
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                ForEach(files) { file in
                    Button {
                        open(file)
                    } label: {
                        row(file)
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("chat.file.\(file.name)")
                }
            }
        }
    }

    private func row(_ file: DeliveredFile) -> some View {
        HStack(spacing: 10) {
            Image(systemName: file.systemImage)
                .font(.footnote)
                .foregroundStyle(TomatoToken.brandPrimary)
                .frame(width: 18)
            VStack(alignment: .leading, spacing: 1) {
                Text(file.name)
                    .font(.footnote.weight(.medium))
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .lineLimit(1)
                if let description = file.description, !description.isEmpty {
                    Text(description)
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .lineLimit(1)
                }
            }
            Spacer(minLength: 6)
            Image(systemName: "chevron.right")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(TomatoToken.labelDimmed)
        }
        .contentShape(Rectangle())
    }
}
