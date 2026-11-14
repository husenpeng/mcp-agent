//
//  PhoneReasoningBlock.swift
//  Tomato Remote
//
//  The thinking Tomato Phone's endpoint streamed for one turn.
//

import SwiftUI

/// One turn's thinking: open while the step streams, collapsed once it ends.
///
/// Rendering it is what lets an owner confirm that the selected depth changed
/// what the endpoint produced; without it a working level looks identical to
/// one the endpoint ignored.
struct ReasoningBlock: View {
    let text: String
    let live: Bool
    @State private var expanded: Bool

    /// - Parameters:
    ///   - text: reasoning the endpoint sent for this turn.
    ///   - live: whether the step is still streaming.
    init(text: String, live: Bool) {
        self.text = text
        self.live = live
        _expanded = State(initialValue: live)
    }

    var body: some View {
        DisclosureGroup(isExpanded: $expanded) {
            Text(text)
                .font(.caption)
                .foregroundStyle(AgentTheme.inkSecondary)
                .lineSpacing(2)
                .frame(maxWidth: .infinity, alignment: .leading)
                .textSelection(.enabled)
                .padding(.top, 6)
        } label: {
            HStack(spacing: 5) {
                Image(systemName: "brain")
                    .font(.caption2)
                Text(live ? "正在思考… · \(text.count) 字" : "思考过程 · \(text.count) 字")
                    .font(.caption.weight(.medium))
            }
            .foregroundStyle(AgentTheme.inkSecondary)
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(AgentTheme.border, lineWidth: 1)
        )
        .accessibilityIdentifier("phone.reasoning")
    }
}
