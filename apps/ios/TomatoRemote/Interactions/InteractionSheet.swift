//
//  InteractionSheet.swift
//  Tomato Remote
//
//  The sheet a waiting Agent blocks on: approvals first, then questions.
//
//  A question with options is answered by tapping; a question the owner must
//  describe gets one text field. Every answer names the question's own id, so a
//  multi-question call settles in one reply.
//

import SwiftUI

struct InteractionSheet: View {
    @ObservedObject var center: InteractionCenter
    @Environment(\.dismiss) private var dismiss

    @State private var answers: [String: Set<String>] = [:]
    @State private var custom: [String: String] = [:]

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(
                title: center.pending.isEmpty ? "没有待处理" : "待处理 · \(center.pending.count)",
                caption: "Agent 在等一个答复；答案会直接回到它正在跑的会话。",
                onClose: { dismiss() }
            )
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if let error = center.errorMessage {
                        ErrorBanner(message: error)
                    }
                    ForEach(center.pending) { interaction in
                        card(interaction)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 24)
            }
            .background(TomatoToken.bgBase)
            // A typed custom answer puts the keyboard over the cards below;
            // dragging the sheet down would discard the draft instead of the
            // keyboard, so the scroll itself dismisses.
            .scrollDismissesKeyboard(.interactively)
        }
        .onAppear { prefill() }
    }

    // MARK: Cards

    private func card(_ interaction: PendingInteraction) -> some View {
        InteractionCard(
            interaction: interaction,
            answers: $answers,
            custom: $custom,
            submitting: center.isResolving(interaction),
            allow: { center.allow($0) },
            reject: { center.reject($0) },
            submit: { interaction, items in submit(interaction, items: items) }
        )
    }

    // MARK: Answers

    /// Start from the Host's suggested answer, when it proposed one.
    private func prefill() {
        for interaction in center.pending {
            guard case let .questions(items, _) = interaction.kind else { continue }
            for item in items where answers[item.id] == nil {
                let suggested = item.intent?.approve
                if let suggested, !suggested.isEmpty {
                    answers[item.id] = [suggested]
                }
            }
        }
    }

    private func submit(_ interaction: PendingInteraction, items: [QuestionItem]) {
        let reply = items.map { item in
            QuestionAnswer(id: item.id, selected: Array(answers[item.id] ?? []), custom: custom[item.id])
        }
        center.answer(interaction, answers: reply)
    }
}
