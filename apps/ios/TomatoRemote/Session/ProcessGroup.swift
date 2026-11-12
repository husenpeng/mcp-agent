//
//  ProcessGroup.swift
//  Tomato Remote
//
//  One turn's work details: the tool calls behind an answer, folded under a
//  single disclosure so the transcript reads as a conversation.
//

import SwiftUI

/// What the transcript draws at one position: a row, or a folded tool group.
enum TranscriptEntry: Identifiable {
    case single(ChatItem)
    case process([ChatItem])

    var id: String {
        switch self {
        case let .single(item): "row-\(item.id)"
        case let .process(steps): "process-\(steps.first?.id ?? "none")"
        }
    }
}

struct ProcessGroup: View {
    let steps: [ChatItem]
    let open: (ChatItem) -> Void

    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button {
                withAnimation(.easeOut(duration: 0.15)) { expanded.toggle() }
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "list.bullet.rectangle")
                        .font(.caption2)
                    Text("过程 · \(steps.count) 步")
                        .font(.caption.weight(.medium))
                    Text(steps.compactMap { $0.tool?.name }.prefix(3).joined(separator: " · "))
                        .font(.caption2)
                        .lineLimit(1)
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
            .accessibilityIdentifier("chat.row.process")

            if expanded {
                ForEach(steps) { step in
                    if let tool = step.tool {
                        ToolCard(tool: tool) { open(step) }
                    }
                }
            }
        }
    }
}
