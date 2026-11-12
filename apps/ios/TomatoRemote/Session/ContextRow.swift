//
//  ContextRow.swift
//  Tomato Remote
//
//  One model-context injection, shown the way the Desktop shows it: a subdued
//  line naming the producer, expandable to the text that reached the model.
//
//  These rows exist so the transcript stays faithful without pretending the
//  person typed a turn notice or a compaction checkpoint.
//

import SwiftUI

struct ContextRow: View {
    let label: String
    let text: String

    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Button {
                withAnimation(.easeOut(duration: 0.15)) { expanded.toggle() }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "text.bubble")
                        .font(.caption2)
                    Text(label)
                        .font(.caption.weight(.medium))
                    Text("· \(text.count) 字")
                        .font(.caption2.monospacedDigit())
                    Image(systemName: expanded ? "chevron.down" : "chevron.right")
                        .font(.caption2.weight(.semibold))
                    Spacer(minLength: 0)
                }
                .foregroundStyle(TomatoToken.labelCaption)
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
                .contentShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("chat.row.context")

            if expanded {
                Text(text)
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(10)
                    .background(TomatoToken.bgLayer1, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
        }
    }
}
