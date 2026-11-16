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
///
/// Only models whose prompt cache was measured are offered; choosing one also
/// chooses the protocol that produced the cache hit, so the composer never
/// exposes a protocol switch.
struct PhoneModelSheet: View {
    @Binding var config: AgentModelConfig
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(
                title: "选择模型",
                caption: "只列出已验证可缓存的模型；协议随模型自动选择。",
                onClose: { dismiss() }
            )
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    InfoRow(label: "当前模型", value: config.model)
                    TomatoCard(padding: 0) {
                        VStack(spacing: 0) {
                            ForEach(Array(CacheableModels.all.enumerated()), id: \.element.id) { index, entry in
                                row(entry)
                                if index < CacheableModels.all.count - 1 {
                                    Divider()
                                        .overlay(TomatoToken.borderL1)
                                        .padding(.leading, 14)
                                }
                            }
                        }
                    }
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
    }

    /// One model row; the chosen id carries a check.
    /// - Parameter entry: measured cacheable model.
    private func row(_ entry: CacheableModel) -> some View {
        let selected = entry.id == config.model
        return Button {
            choose(entry)
        } label: {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(entry.id)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(selected ? TomatoToken.brandPrimary : TomatoToken.labelPrimary)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Text(entry.vendor)
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
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
        .accessibilityIdentifier("phone.model.\(entry.id)")
    }

    /// Record one model with its cache protocol and close.
    /// - Parameter entry: measured model the owner picked.
    private func choose(_ entry: CacheableModel) {
        // Start from the stored configuration: the settings sheet writes the
        // same record, and this sheet's snapshot may predate that write.
        var saved = AgentConfigStore.load()
        saved.model = entry.id
        saved.api = entry.wire
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
                caption: config.wireProtocol == .anthropic
                    ? "模型在回答前投入的 thinking 预算；等级越高，耗时和用量越大。"
                    : "模型在回答前投入的推理量；等级越高，耗时和用量越大。",
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
