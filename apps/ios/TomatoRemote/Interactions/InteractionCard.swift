//
//  InteractionCard.swift
//  Tomato Remote
//
//  One waiting request: an approval with two verbs, or a question with options.
//

import SwiftUI

/// One card of the pending sheet.
struct InteractionCard: View {
    let interaction: PendingInteraction
    @Binding var answers: [String: Set<String>]
    @Binding var custom: [String: String]
    let submitting: Bool
    let allow: (PendingInteraction) -> Void
    let reject: (PendingInteraction) -> Void
    let submit: (PendingInteraction, [QuestionItem]) -> Void

    var body: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                switch interaction.kind {
                case let .approval(toolName, reason):
                    approval(toolName: toolName, reason: reason)
                case let .questions(items, _):
                    questions(items)
                }
            }
        }
        .overlay(
            RoundedRectangle(cornerRadius: TomatoRadius.lg, style: .continuous)
                .strokeBorder(borderTone, lineWidth: 1)
        )
    }

    /// A waiting approval is the one card that should read as a stop sign.
    private var borderTone: Color {
        if case .approval = interaction.kind {
            return TomatoToken.stateWarnPrimary.opacity(0.35)
        }
        return TomatoToken.borderL1
    }

    @ViewBuilder
    private func approval(toolName: String, reason: String?) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "hand.raised.fill")
                .foregroundStyle(TomatoToken.stateWarnPrimary)
            Text("请求执行 \(toolName)")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(TomatoToken.labelPrimary)
        }
        if let reason {
            Text(reason)
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelCaption)
                .fixedSize(horizontal: false, vertical: true)
        }
        HStack(spacing: 10) {
            TomatoPrimaryButton(
                title: "允许本次",
                systemImage: "checkmark",
                isEnabled: !submitting,
                isBusy: submitting,
                action: { allow(interaction) }
            )
            TomatoSecondaryButton(
                title: "拒绝",
                isDestructive: true,
                isEnabled: !submitting,
                action: { reject(interaction) }
            )
        }
        Text("允许只对这一次生效；同样的调用下次还会再问。")
            .font(.caption2)
            .foregroundStyle(TomatoToken.labelDimmed)
    }

    @ViewBuilder
    private func questions(_ items: [QuestionItem]) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "questionmark.bubble.fill")
                .foregroundStyle(TomatoToken.brandPrimary)
            Text(items.count == 1 ? "Agent 有一个问题" : "Agent 有 \(items.count) 个问题")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(TomatoToken.labelPrimary)
        }
        ForEach(items) { item in
            itemView(item)
        }
        TomatoPrimaryButton(
            title: "提交",
            systemImage: "paperplane",
            isEnabled: !submitting,
            isBusy: submitting,
            action: { submit(interaction, items) }
        )
    }

    private func itemView(_ item: QuestionItem) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(item.question)
                .font(.callout)
                .foregroundStyle(TomatoToken.labelPrimary)
                .fixedSize(horizontal: false, vertical: true)
            if let detail = item.detail {
                Text(detail)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelCaption)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let options = item.options, !options.isEmpty {
                ForEach(options, id: \.label) { option in
                    optionRow(item: item, option: option)
                }
            } else {
                TextField("你的回答", text: Binding(
                    get: { custom[item.id] ?? "" },
                    set: { custom[item.id] = $0 }
                ), axis: .vertical)
                    .lineLimit(1 ... 4)
                    .font(.callout)
                    .padding(10)
                    .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            }
        }
    }

    private func optionRow(item: QuestionItem, option: QuestionOption) -> some View {
        let selected = answers[item.id]?.contains(option.label) == true
        let multi = item.multiSelect == true
        return Button {
            var current = answers[item.id] ?? []
            if multi {
                if selected {
                    current.remove(option.label)
                } else {
                    current.insert(option.label)
                }
            } else {
                current = [option.label]
            }
            answers[item.id] = current
        } label: {
            HStack(spacing: 10) {
                Image(systemName: selected ? (multi ? "checkmark.square.fill" : "largecircle.fill.circle") : (multi ? "square" : "circle"))
                    .foregroundStyle(selected ? TomatoToken.brandPrimary : TomatoToken.labelDimmed)
                VStack(alignment: .leading, spacing: 2) {
                    Text(option.label)
                        .font(.callout)
                        .foregroundStyle(TomatoToken.labelPrimary)
                    if let description = option.description {
                        Text(description)
                            .font(.caption)
                            .foregroundStyle(TomatoToken.labelCaption)
                            .multilineTextAlignment(.leading)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(10)
            .background(
                selected ? TomatoToken.brandPrimary.opacity(0.08) : TomatoToken.bgLayer2,
                in: RoundedRectangle(cornerRadius: 10, style: .continuous)
            )
            .contentShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
