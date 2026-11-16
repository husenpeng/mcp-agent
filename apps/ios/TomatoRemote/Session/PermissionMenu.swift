//
//  PermissionMenu.swift
//  Tomato Remote
//
//  The conversation's permission preset: what the Agent may do on this Mac.
//
//  The Host advertises the presets and projects the current one; the chip only
//  reads both and submits the picked value through the same `/permission`
//  command the Web composer uses. Full access and Auto review ask for an
//  explicit confirmation before the switch leaves the phone.
//

import SwiftUI

/// The conversation header's permission chip and its preset menu.
struct PermissionChip: View {
    /// Preset value the Host projects as current.
    let current: String
    /// Presets this Host offers, in contribution order.
    let options: [PermissionCatalogWire.Option]
    /// Whether a switch is already on its way to the Host.
    var isBusy = false
    /// Receives the picked preset; the caller owns the confirmation gate.
    let choose: (PermissionCatalogWire.Option) -> Void

    var body: some View {
        Menu {
            Picker("权限", selection: Binding(
                get: { current },
                set: { value in
                    guard let option = options.first(where: { $0.value == value }) else { return }
                    choose(option)
                }
            )) {
                ForEach(options) { option in
                    Label(PermissionPresentation.label(option), systemImage: PermissionPresentation.icon(option.value))
                        .tag(option.value)
                }
            }
        } label: {
            HStack(spacing: 5) {
                Image(systemName: PermissionPresentation.icon(current))
                    .font(.caption2.weight(.semibold))
                Text(PermissionPresentation.label(current: current, options: options))
                    .font(.caption.weight(.medium))
                    .lineLimit(1)
                if isBusy {
                    ProgressView()
                        .controlSize(.mini)
                } else {
                    Image(systemName: "chevron.down")
                        .font(.system(size: 8, weight: .semibold))
                }
            }
            .foregroundStyle(PermissionPresentation.tint(current))
            .padding(.horizontal, 9)
            .padding(.vertical, 5)
            .background(PermissionPresentation.background(current), in: Capsule())
            .overlay(Capsule().strokeBorder(PermissionPresentation.border(current), lineWidth: 0.5))
            .contentShape(Capsule())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("chat.permission")
        .accessibilityLabel("工作范围")
        .accessibilityValue(PermissionPresentation.label(current: current, options: options))
    }
}

/// Localized labels and glyphs for the presets this app ships with.
enum PermissionPresentation {
    /// Wording for the presets the shipped deployments configure; another
    /// deployment's own label still shows through {@link option}.
    /// - Parameters:
    ///   - current: preset value the Host projects.
    ///   - options: catalog entries, read for an unknown value's own label.
    /// - Returns: the label the chip and menu show.
    static func label(current: String, options: [PermissionCatalogWire.Option]) -> String {
        if let known = builtinLabel(current) {
            return known
        }
        return options.first(where: { $0.value == current })?.name ?? current
    }

    /// Label for one catalog option.
    /// - Parameter option: one selectable preset.
    /// - Returns: its localized built-in label, or the deployment's own name.
    static func label(_ option: PermissionCatalogWire.Option) -> String {
        builtinLabel(option.value) ?? option.name
    }

    /// SF Symbol for one preset value.
    /// - Parameter value: catalog value.
    /// - Returns: a shield glyph, or a wand for the Auto review preset.
    static func icon(_ value: String) -> String {
        switch value {
        case "read-only": "checkmark.shield"
        case "danger-full-access": "exclamationmark.shield"
        case "auto": "wand.and.stars"
        default: "shield"
        }
    }

    /// Tint for the chip: full access and Auto read as elevated, others quiet.
    /// - Parameter value: current preset value.
    /// - Returns: the chip's foreground colour.
    static func tint(_ value: String) -> Color {
        switch value {
        case "danger-full-access", "auto": TomatoToken.stateWarnPrimary
        default: TomatoToken.labelSecondary
        }
    }

    /// Chip fill for one preset value.
    /// - Parameter value: current preset value.
    /// - Returns: the capsule background.
    static func background(_ value: String) -> Color {
        switch value {
        case "danger-full-access", "auto": TomatoToken.stateWarnPrimary.opacity(0.10)
        default: TomatoToken.bgLayer2
        }
    }

    /// Chip outline for one preset value.
    /// - Parameter value: current preset value.
    /// - Returns: the capsule border colour.
    static func border(_ value: String) -> Color {
        switch value {
        case "danger-full-access", "auto": TomatoToken.stateWarnPrimary.opacity(0.30)
        default: TomatoToken.borderL2
        }
    }

    /// Whether a preset leaves the confined sandbox and needs a confirmation.
    /// - Parameter value: catalog value.
    /// - Returns: true for full access and Auto review.
    static func needsConfirmation(_ value: String) -> Bool {
        value == "danger-full-access" || value == "auto"
    }

    /// Confirmation title for one elevated preset.
    /// - Parameter value: catalog value.
    /// - Returns: the sentence the alert shows as its title.
    static func confirmationTitle(_ value: String) -> String {
        value == "auto" ? "确认启用自动审查？" : "确认启用完全权限？"
    }

    /// Confirmation body for one elevated preset.
    /// - Parameter option: the catalog entry being applied.
    /// - Returns: the deployment's own description, or the shipped wording.
    static func confirmationMessage(_ option: PermissionCatalogWire.Option) -> String {
        if let description = option.description, !description.isEmpty {
            return description
        }
        return option.value == "auto"
            ? "自动审查会在每次工具调用前判断，越界的动作仍会回来让你确认。"
            : "完全权限不再限制文件访问，也不再询问审批。只在你信任这次任务时启用。"
    }

    /// Chinese label for the presets the Web composer also names.
    /// - Parameter value: catalog value.
    /// - Returns: the shipped wording, or nil for a deployment-owned preset.
    private static func builtinLabel(_ value: String) -> String? {
        switch value {
        case "read-only": "仅可查看"
        case "workspace-write": "工作区内修改"
        case "danger-full-access": "完全权限"
        case "auto": "自动审查"
        case "custom": "自定义"
        default: nil
        }
    }
}

/// The conversation header's permission row: the chip and its failure line.
struct PermissionBar: View {
    let current: String?
    let options: [PermissionCatalogWire.Option]
    let isBusy: Bool
    let error: String?
    let choose: (PermissionCatalogWire.Option) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 3) {
            if let current, !options.isEmpty {
                HStack(spacing: 8) {
                    PermissionChip(current: current, options: options, isBusy: isBusy, choose: choose)
                    Spacer(minLength: 0)
                }
            }
            if let error {
                Text(error)
                    .font(.caption2)
                    .foregroundStyle(TomatoToken.stateErrorPrimary)
                    .lineLimit(2)
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 4)
    }
}
