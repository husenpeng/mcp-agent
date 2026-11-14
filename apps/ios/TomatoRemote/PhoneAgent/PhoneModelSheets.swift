//
//  PhoneModelSheets.swift
//  Tomato Remote
//
//  The two pickers behind Tomato Phone's composer chips.
//
//  The phone's agent talks straight to one OpenAI-compatible endpoint, so the
//  model sheet lists that endpoint's `/models` rather than a paired Host's
//  catalog. A model and its reasoning depth are separate choices, exactly as
//  they are in the Host conversation, and each sheet writes one field of the
//  stored model configuration.
//

import SwiftUI

/// Which phone picker the composer opens.
enum PhonePicker: String, Identifiable {
    case model
    case reasoning

    var id: String {
        rawValue
    }
}

/// Model sheet for the endpoint Tomato Phone calls directly.
struct PhoneModelSheet: View {
    @Binding var config: AgentModelConfig
    @Environment(\.dismiss) private var dismiss
    @StateObject private var catalog = PhoneModelCatalog.shared
    /// Manual entry, for an endpoint that advertises nothing or a model the
    /// list omits.
    @State private var manual = ""

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(
                title: "选择模型",
                caption: "Tomato Phone 直接连这个模型服务；选择只影响之后的消息。",
                onClose: { dismiss() }
            )
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if let error = catalog.error {
                        ErrorBanner(message: error) {
                            Task { await refresh() }
                        }
                    }
                    InfoRow(label: "当前模型", value: config.model)
                    content
                    manualEntry
                    Text("影像输入需要模型支持图片；不支持时请去掉照片再发送。")
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
        .accessibilityIdentifier("phone.model.sheet")
        .task {
            manual = config.model
            await catalog.load(baseURL: config.baseURL, apiKey: AgentConfigStore.apiKey)
        }
    }

    @ViewBuilder
    private var content: some View {
        if catalog.isLoading, catalog.models.isEmpty {
            HStack(spacing: 8) {
                ProgressView().controlSize(.small)
                Text("正在读取模型列表…")
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelCaption)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 8)
        } else if catalog.models.isEmpty {
            Text("没有可选的模型。填写服务地址和 Key 后重试，或在下面直接输入模型 ID。")
                .font(.footnote)
                .foregroundStyle(TomatoToken.labelCaption)
                .fixedSize(horizontal: false, vertical: true)
        } else {
            VStack(alignment: .leading, spacing: 8) {
                Text("这个服务提供的模型")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelCaption)
                TomatoCard(padding: 0) {
                    VStack(spacing: 0) {
                        ForEach(Array(catalog.models.enumerated()), id: \.element) { index, model in
                            row(model)
                            if index < catalog.models.count - 1 {
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

    /// One model row; the chosen id carries a check.
    /// - Parameter model: id the endpoint advertised.
    private func row(_ model: String) -> some View {
        let selected = model == config.model
        return Button {
            choose(model)
        } label: {
            HStack(spacing: 12) {
                Text(model)
                    .font(.subheadline.weight(.medium))
                    .foregroundStyle(selected ? TomatoToken.brandPrimary : TomatoToken.labelPrimary)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 8)
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.body)
                    .foregroundStyle(selected ? TomatoToken.brandPrimary : TomatoToken.labelDimmed)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("phone.model.\(model)")
    }

    private var manualEntry: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("手动指定")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(TomatoToken.labelCaption)
            HStack(spacing: 8) {
                TextField("模型 ID", text: $manual)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .font(.subheadline)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 10)
                    .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
                    .accessibilityIdentifier("phone.model.manual")
                Button("使用") {
                    choose(manual)
                }
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(TomatoToken.brandPrimary)
                .disabled(manual.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            Button(catalog.isLoading ? "正在刷新…" : "刷新模型列表") {
                Task { await refresh() }
            }
            .font(.footnote)
            .foregroundStyle(TomatoToken.brandPrimary)
            .disabled(catalog.isLoading)
        }
    }

    private func refresh() async {
        await catalog.load(
            baseURL: config.baseURL,
            apiKey: AgentConfigStore.apiKey,
            force: true
        )
    }

    /// Record one model id and close.
    /// - Parameter model: id typed or chosen.
    private func choose(_ model: String) {
        let trimmed = model.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        // Start from the stored configuration: the settings sheet writes the
        // same record, and this sheet's snapshot may predate that write.
        var saved = AgentConfigStore.load()
        saved.model = trimmed
        AgentConfigStore.save(saved)
        config = saved
        dismiss()
    }
}

/// Reasoning-depth sheet for Tomato Phone.
struct PhoneReasoningSheet: View {
    @Binding var config: AgentModelConfig
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(
                title: "推理等级",
                caption: "模型在回答前投入的推理量；等级越高，耗时和用量越大。",
                onClose: { dismiss() }
            )
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    InfoRow(label: "当前模型", value: config.model)
                    TomatoCard(padding: 0) {
                        VStack(spacing: 0) {
                            row(effort: nil, name: "自动", detail: "由模型自己决定是否推理、推理多深。")
                            ForEach(AgentReasoningLevel.allCases) { level in
                                Divider()
                                    .overlay(TomatoToken.borderL1)
                                    .padding(.leading, 14)
                                row(effort: level.rawValue, name: level.title, detail: level.detail)
                            }
                        }
                    }
                    Text("等级只作用于这段对话之后的消息；已经完成的消息不会重新计算。")
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
        .accessibilityIdentifier("phone.reasoning.sheet")
    }

    /// One depth row.
    /// - Parameters:
    ///   - effort: value sent as `reasoning_effort`, nil for automatic.
    ///   - name: wording on the row.
    ///   - detail: what the level spends.
    private func row(effort: String?, name: String, detail: String) -> some View {
        let selected = config.reasoningEffort == effort
        return Button {
            // Start from the stored configuration so a model or depth chosen
            // elsewhere is kept instead of being overwritten by this snapshot.
            var saved = AgentConfigStore.load()
            saved.reasoningEffort = effort
            AgentConfigStore.save(saved)
            config = saved
            dismiss()
        } label: {
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(name)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(selected ? TomatoToken.brandPrimary : TomatoToken.labelPrimary)
                    Text(detail)
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                        .multilineTextAlignment(.leading)
                }
                Spacer(minLength: 8)
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.body)
                    .foregroundStyle(selected ? TomatoToken.brandPrimary : TomatoToken.labelDimmed)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("phone.reasoning.\(effort ?? "auto")")
    }
}
