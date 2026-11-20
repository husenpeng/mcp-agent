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

/// Model sheet for the company agent_service.
///
/// The list comes from the service catalog, and a tap writes the route onto the
/// open session; the phone stores only the chosen name, never a model key.
struct PhoneServiceModelSheet: View {
    @ObservedObject var agent: PhoneAgentModel
    @StateObject private var catalog = AgentServiceModelCatalog()
    /// Depth the sheet shows as chosen; the store alone does not repaint a row.
    @State private var pickedLevel: String?
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(
                title: "选择模型",
                caption: "由服务端 agent 提供；选择会写回当前会话。",
                onClose: { dismiss() }
            )
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if let error = catalog.error {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(AgentTheme.danger)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    if catalog.isLoading, catalog.models.isEmpty {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    }
                    TomatoCard(padding: 0) {
                        VStack(spacing: 0) {
                            ForEach(Array(catalog.models.enumerated()), id: \.element.id) { index, model in
                                row(model)
                                if index < catalog.models.count - 1 {
                                    Divider()
                                        .overlay(TomatoToken.borderL1)
                                        .padding(.leading, 14)
                                }
                            }
                        }
                    }
                    Text("推理档位")
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(AgentTheme.ink)
                    thinkingSection
                    Text("由服务端模型路由执行；选择会写回当前会话。")
                        .font(.caption)
                        .foregroundStyle(AgentTheme.inkSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("模型由公司 agent_service 管理；手机上不再保存模型 Key。")
                        .font(.caption)
                        .foregroundStyle(AgentTheme.inkSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 28)
                .padding(.top, 4)
            }
        }
        .background(AgentTheme.canvas)
        .task {
            await catalog.load()
            reconcileThinkingLevel()
            pickedLevel = AgentBackendStore.serviceThinkingLevel
        }
        .accessibilityIdentifier("phone.service.model.sheet")
    }

    /// The depths the service accepts for the route on screen.
    ///
    /// A route reports its own whitelist; an empty one means the route does not
    /// open thinking, so no depth is offered for it. Before a route is chosen
    /// the whitelist is unknown — the session would follow the agent's own
    /// route — so the picker waits instead of guessing.
    @ViewBuilder private var thinkingSection: some View {
        if let model = selectedModel {
            let levels = model.selectableThinkingLevels
            if levels.isEmpty {
                Text("该模型不开放推理档位；会话使用服务端默认设置。")
                    .font(.caption)
                    .foregroundStyle(AgentTheme.inkSecondary)
                    .fixedSize(horizontal: false, vertical: true)
            } else {
                TomatoCard(padding: 0) {
                    VStack(spacing: 0) {
                        thinkingRow(title: "服务端默认", detail: routeDefaultDetail(model), level: nil)
                        ForEach(levels, id: \.self) { level in
                            Divider()
                                .overlay(TomatoToken.borderL1)
                                .padding(.leading, 14)
                            thinkingRow(title: title(for: level), level: level)
                        }
                    }
                }
            }
        } else {
            Text("先选择一个模型；可选档位由该模型的白名单决定。")
                .font(.caption)
                .foregroundStyle(AgentTheme.inkSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    /// Route the stored choice names, when the catalog still lists it.
    private var selectedModel: AgentServiceModel? {
        guard let name = AgentBackendStore.serviceModelRoute else { return nil }
        return catalog.models.first { $0.name == name }
    }

    /// Default depth the route itself carries.
    /// - Parameter model: route the service offers.
    /// - Returns: one supporting line for the "service default" row.
    private func routeDefaultDetail(_ model: AgentServiceModel) -> String {
        guard let level = model.thinkingLevel, !level.isEmpty else {
            return "路由不启用推理"
        }
        return "路由默认 \(level)"
    }

    /// Wording for one depth; a name this build does not know shows as sent.
    /// - Parameter level: depth the route lists.
    /// - Returns: the row title.
    private func title(for level: String) -> String {
        switch level {
        case "low": "低"
        case "balanced": "中"
        case "high": "高"
        case "ultra": "很高"
        case "max": "最高"
        default: level
        }
    }

    /// Drop a stored depth the route on screen no longer lists.
    private func reconcileThinkingLevel() {
        guard let model = selectedModel,
              let stored = AgentBackendStore.serviceThinkingLevel,
              !model.allowsThinkingLevel(stored)
        else { return }
        agent.selectServiceThinkingLevel(nil)
    }

    /// One thinking-depth row.
    /// - Parameters:
    ///   - title: wording on the row.
    ///   - detail: optional supporting line.
    ///   - level: stored value, nil for the route default.
    private func thinkingRow(title: String, detail: String? = nil, level: String?) -> some View {
        let selected = pickedLevel == level
        return Button {
            pickedLevel = level
            agent.selectServiceThinkingLevel(level)
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(selected ? AgentTheme.accent : AgentTheme.ink)
                    if let detail {
                        Text(detail)
                            .font(.caption)
                            .foregroundStyle(AgentTheme.inkSecondary)
                    }
                }
                Spacer(minLength: 8)
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(selected ? AgentTheme.accent : AgentTheme.inkSecondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("phone.service.thinking.\(level ?? "default")")
    }

    /// Vendor plus the thinking depth the route carries.
    /// - Parameter model: route the service offers.
    /// - Returns: one supporting line.
    private func subtitle(for model: AgentServiceModel) -> String {
        let vendor = model.provider ?? model.name
        guard let level = model.thinkingLevel, !level.isEmpty else { return vendor }
        return "\(vendor) · 默认推理 \(level)"
    }

    /// One route row; the stored choice carries a check.
    /// - Parameter model: route the service offers.
    private func row(_ model: AgentServiceModel) -> some View {
        let selected = AgentBackendStore.serviceModelRoute == model.name
        return Button {
            agent.selectServiceModel(model)
            dismiss()
        } label: {
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(model.model ?? model.name)
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(selected ? AgentTheme.accent : AgentTheme.ink)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Text(subtitle(for: model))
                        .font(.caption)
                        .foregroundStyle(AgentTheme.inkSecondary)
                }
                Spacer(minLength: 8)
                Image(systemName: selected ? "checkmark.circle.fill" : "circle")
                    .font(.body)
                    .foregroundStyle(selected ? AgentTheme.accent : AgentTheme.inkSecondary)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("phone.service.model.\(model.name)")
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
