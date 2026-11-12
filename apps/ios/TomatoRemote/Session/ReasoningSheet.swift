//
//  ReasoningSheet.swift
//  Tomato Remote
//
//  The reasoning-level sheet behind the composer's second chip.
//
//  Levels are the chosen model's own adapter vocabulary — `off`, `low`,
//  `medium`, `high`, `max` for the shipped adapters, other ids for a provider
//  that defines its own — so the sheet lists exactly what the Host advertises
//  for that model and submits one exact id. Unpinned stays an option: it lets
//  the model decide instead of freezing today's default.
//

import SwiftUI

struct ReasoningSheet: View {
    @ObservedObject var chat: ChatModel
    @ObservedObject var models: ModelCatalogStore
    /// The paired Host; a catalog read may still be running for this screen.
    let hub: HubClient?
    @Environment(\.dismiss) private var dismiss
    /// Route already on its way to the Host, shown as a spinner on its row.
    @State private var pending: ModelRoute?
    /// Why the last switch was refused; kept in the sheet, not the transcript.
    @State private var failure: String?

    /// Choice whose levels this sheet lists.
    private var route: ModelRoute? {
        chat.modelSelection ?? models.defaultRoute
    }

    private var model: ModelCatalogModel? {
        route.flatMap { models.model(for: $0) }
    }

    private var efforts: [ModelCatalogModel.Effort] {
        model?.reasoning?.efforts ?? []
    }

    private var isWorking: Bool {
        pending != nil || chat.isSwitchingModel
    }

    /// Level the next model step actually uses.
    private var effectiveEffort: String? {
        route?.reasoningEffort ?? model?.reasoning?.defaultEffort
    }

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(title: "推理等级", caption: "模型在回答前投入的推理量；等级越高，耗时和用量越大。", onClose: { dismiss() })
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if let failure {
                        ErrorBanner(message: failure)
                    }
                    if let name = model?.name ?? route?.model {
                        InfoRow(label: "当前模型", value: name)
                    }
                    content
                    Text("推理等级只作用于这段会话之后的消息；已经完成的消息不会重新计算。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 28)
                .padding(.top, 4)
            }
        }
        .background(TomatoToken.bgBase)
        .accessibilityIdentifier("reasoning.sheet")
        .task { await models.load(hub: hub) }
        .onChange(of: chat.modelError) { _, error in
            if let error {
                failure = error
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        if route == nil {
            HStack(spacing: 8) {
                ProgressView().controlSize(.small)
                Text("正在读取模型目录…")
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelCaption)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 8)
        } else if efforts.isEmpty {
            Text(
                models.catalog == nil
                    ? "模型目录尚未加载，无法列出推理等级。"
                    : "当前模型不提供可调的推理等级。"
            )
            .font(.footnote)
            .foregroundStyle(TomatoToken.labelCaption)
            .fixedSize(horizontal: false, vertical: true)
        } else {
            TomatoCard(padding: 0) {
                VStack(spacing: 0) {
                    row(effort: nil, name: ModelEffortLabel.automatic, detail: unpinnedDetail)
                    ForEach(efforts, id: \.id) { effort in
                        Divider()
                            .overlay(TomatoToken.borderL1)
                            .padding(.leading, 14)
                        row(
                            effort: effort.id,
                            name: ModelEffortLabel.text(effort.id, in: model?.reasoning),
                            detail: effort.description
                        )
                    }
                }
            }
        }
    }

    /// What unpinned means for this model.
    private var unpinnedDetail: String {
        guard let fallback = model?.reasoning?.defaultEffort else {
            return "由模型自行决定推理等级。"
        }
        return "跟随模型默认：\(ModelEffortLabel.text(fallback, in: model?.reasoning))。"
    }

    /// One level: pressing it records the route with that level pinned, or
    /// clears the pin for the default row.
    /// @param effort - adapter-owned level id, or nil for the model default.
    /// @param name - the row's wording.
    /// @param detail - the adapter's own explanation of the level, when sent.
    private func row(effort: String?, name: String, detail: String?) -> some View {
        let target = route.map {
            ModelRoute(provider: $0.provider, model: $0.model, reasoningEffort: effort)
        }
        let isSelected = route?.reasoningEffort == effort
        return Button {
            guard let target else { return }
            choose(target)
        } label: {
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(name)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(isSelected ? TomatoToken.brandPrimary : TomatoToken.labelPrimary)
                    if let detail, !detail.isEmpty {
                        Text(detail)
                            .font(.caption)
                            .foregroundStyle(TomatoToken.labelCaption)
                            .lineLimit(3)
                            .multilineTextAlignment(.leading)
                    }
                }
                Spacer(minLength: 8)
                if isWorking, pending == target {
                    ProgressView().controlSize(.small)
                } else {
                    Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                        .font(.body)
                        .foregroundStyle(isSelected ? TomatoToken.brandPrimary : TomatoToken.labelDimmed)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
            .background(isSelected ? TomatoToken.brandPrimary.opacity(0.06) : Color.clear)
        }
        .buttonStyle(.plain)
        .disabled(isWorking || route == nil)
        .accessibilityIdentifier("reasoning.row.\(effort ?? "default")")
        .accessibilityLabel(name)
        .accessibilityValue(isSelected ? "已选择" : "")
        .accessibilityHint("使用 \(name) 推理等级")
    }

    // MARK: Switching

    /// Submit one level and close the sheet on what the Host answered.
    /// @param target - the same route with the level to pin, or without a pin.
    private func choose(_ target: ModelRoute) {
        guard !isWorking else { return }
        pending = target
        failure = nil
        Task {
            await chat.selectModel(target)
            pending = nil
            if let error = chat.modelError {
                failure = error
                return
            }
            dismiss()
        }
    }
}
