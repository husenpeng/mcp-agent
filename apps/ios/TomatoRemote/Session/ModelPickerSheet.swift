//
//  ModelPickerSheet.swift
//  Tomato Remote
//
//  The model sheet behind the composer's model chip.
//
//  It reads the Host's catalog rather than a phone-owned list: providers,
//  display names, descriptions, and blocked models all come from the Host. A
//  switch is one `session/selectModel` call and applies to the next model step,
//  so it is safe while a turn runs. Reasoning levels have their own sheet,
//  because they describe the chosen model rather than the choice itself.
//

import SwiftUI

struct ModelPickerSheet: View {
    @ObservedObject var chat: ChatModel
    @ObservedObject var models: ModelCatalogStore
    /// The paired Host; the catalog read needs it.
    let hub: HubClient?
    @Environment(\.dismiss) private var dismiss
    /// Route already on its way to the Host, shown as a spinner on its row.
    @State private var pending: ModelRoute?
    /// Why the last switch was refused; kept in the sheet, not the transcript.
    @State private var failure: String?

    /// Choice the next message uses: the Session's, or the deployment default.
    private var currentRoute: ModelRoute? {
        chat.modelSelection ?? models.defaultRoute
    }

    private var isWorking: Bool {
        pending != nil || chat.isSwitchingModel
    }

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(title: "选择模型", caption: "切换后，这段会话之后的消息都由选中的模型处理。", onClose: { dismiss() })
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if let failure {
                        ErrorBanner(message: failure)
                    }
                    content
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 28)
                .padding(.top, 4)
            }
        }
        .background(TomatoToken.bgBase)
        .accessibilityIdentifier("model.sheet")
        .task { await models.load(hub: hub) }
        .onChange(of: chat.modelError) { _, error in
            if let error {
                failure = error
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        if let value = models.catalog {
            groups(value)
            failures(value)
            Text("切换只影响这段会话之后的消息；已经完成的消息不会重新计算。")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelDimmed)
                .fixedSize(horizontal: false, vertical: true)
        } else if models.status == .failed {
            VStack(alignment: .leading, spacing: 10) {
                ErrorBanner(message: models.error ?? "模型目录读取失败") {
                    Task { await models.load(hub: hub, force: true) }
                }
                Text("没有目录就无法列出模型；稍后重试，或先在 Mac 上确认模型凭据。")
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelCaption)
            }
        } else {
            HStack(spacing: 8) {
                ProgressView().controlSize(.small)
                Text("正在读取模型目录…")
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelCaption)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 8)
        }
    }

    // MARK: Groups

    /// The provider-grouped model list.
    /// @param value - the loaded catalog.
    private func groups(_ value: ModelCatalog) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            if value.groups.isEmpty {
                EmptyPlaceholder(
                    systemImage: "square.stack.3d.up.slash",
                    title: "没有可用模型",
                    detail: "这台 Mac 还没有配置能用的模型凭据。"
                )
            }
            ForEach(value.groups, id: \.id) { group in
                VStack(alignment: .leading, spacing: 8) {
                    Text(providerName(group))
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelCaption)
                    TomatoCard(padding: 0) {
                        VStack(spacing: 0) {
                            ForEach(Array(group.models.enumerated()), id: \.element.id) { index, model in
                                row(model, provider: group)
                                if index < group.models.count - 1 {
                                    Divider()
                                        .overlay(TomatoToken.borderL1)
                                        .padding(.leading, 14)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /// One selectable model.
    /// @param model - the catalog entry.
    /// @param provider - provider group that owns it.
    private func row(_ model: ModelCatalogModel, provider: ModelCatalog.Provider) -> some View {
        let route = ModelRoute(
            provider: provider.id,
            model: model.id,
            reasoningEffort: model.reasoning?.defaultEffort
        )
        let isSelected = currentRoute?.provider == provider.id && currentRoute?.model == model.id
        let isBlocked = model.blockedReason != nil
        return Button {
            if isSelected {
                // Re-picking the route in use must not replace a reasoning level
                // the reader chose in the other sheet.
                dismiss()
            } else {
                choose(route)
            }
        } label: {
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(model.name)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(tint(selected: isSelected, blocked: isBlocked))
                    subtitle(model)
                }
                Spacer(minLength: 8)
                marker(route, isSelected: isSelected)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
            .background(isSelected ? TomatoToken.brandPrimary.opacity(0.06) : Color.clear)
        }
        .buttonStyle(.plain)
        .disabled(isBlocked || isWorking)
        .accessibilityIdentifier("model.row.\(provider.id).\(model.id)")
        .accessibilityLabel(model.name)
        .accessibilityValue(isSelected ? "已选择" : "")
        .accessibilityHint(isBlocked ? (model.blockedReason ?? "不可用") : "切换到 \(model.name)")
    }

    /// The Host's own description, or why the deployment refuses the model.
    /// @param model - the catalog entry.
    @ViewBuilder
    private func subtitle(_ model: ModelCatalogModel) -> some View {
        if let description = model.description, !description.isEmpty {
            Text(description)
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
        }
        if let blocked = model.blockedReason {
            Text(blocked)
                .font(.caption)
                .foregroundStyle(TomatoToken.stateWarnLabel)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
        }
    }

    /// Selection tick, or a spinner while this row is on its way to the Host.
    /// @param route - the row's route.
    /// @param isSelected - whether it is the choice in use.
    @ViewBuilder
    private func marker(_ route: ModelRoute, isSelected: Bool) -> some View {
        if isWorking, pending == route {
            ProgressView().controlSize(.small)
        } else {
            Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                .font(.body)
                .foregroundStyle(isSelected ? TomatoToken.brandPrimary : TomatoToken.labelDimmed)
        }
    }

    private func tint(selected: Bool, blocked: Bool) -> Color {
        if blocked {
            return TomatoToken.labelDimmed
        }
        return selected ? TomatoToken.brandPrimary : TomatoToken.labelPrimary
    }

    private func providerName(_ group: ModelCatalog.Provider) -> String {
        group.id == "account" ? "账号" : group.name
    }

    // MARK: Failures

    /// Providers whose catalog could not be read; the rest stay usable.
    /// @param value - the loaded catalog.
    private func failures(_ value: ModelCatalog) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(value.failures, id: \.id) { failure in
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "exclamationmark.circle")
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.stateWarnLabel)
                    Text("\(providerLabel(failure)) 的模型目录读取失败：\(failure.message)")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private func providerLabel(_ failure: ModelCatalog.Failure) -> String {
        failure.id == "account" ? "账号" : failure.name
    }

    // MARK: Switching

    /// Submit one route and close the sheet on what the Host answered.
    /// @param route - provider, model, and the level to pin.
    private func choose(_ route: ModelRoute) {
        guard !isWorking else { return }
        pending = route
        failure = nil
        Task {
            await chat.selectModel(route)
            pending = nil
            if let error = chat.modelError {
                failure = error
                return
            }
            dismiss()
        }
    }
}
