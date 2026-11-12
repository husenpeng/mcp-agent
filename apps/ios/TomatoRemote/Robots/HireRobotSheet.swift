//
//  HireRobotSheet.swift
//  Tomato Remote
//
//  Hiring a robot from one of the Host's templates.
//
//  The Host owns the templates and the specification copy; the phone picks one
//  and names the result. What it creates is an ordinary published robot, so the
//  Desktop lists it exactly like one hired there.
//

import SwiftUI

struct HireRobotSheet: View {
    let hub: HubClient
    let templates: [RobotTemplate]
    let onHired: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var selected: String?
    @State private var name = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(title: "新建智能体", caption: "从 Host 的模板聘用一个 Rbot；聘用后桌面端立即可见。", onClose: { dismiss() })
            Form {
                if templates.isEmpty {
                    Section {
                        Text("Host 没有提供可聘用的模板。先在桌面端安装模板包，再回到这里。")
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.labelCaption)
                    }
                } else {
                    Section {
                        ForEach(templates) { template in
                            row(template)
                        }
                    } header: {
                        Text("模板")
                    } footer: {
                        if let current = templates.first(where: { $0.id == selected }),
                           let text = current.localizedText
                        {
                            Text(text.mission)
                        }
                    }
                }
                Section("名字") {
                    TextField("留空则用模板名", text: $name)
                }
                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.stateErrorPrimary)
                    }
                }
            }
            .tomatoSheetContent()
            SheetPrimaryButton(title: "聘用", isBusy: isSaving, isEnabled: selected != nil) {
                Task { await hire() }
            }
            .padding(.top, 8)
            .padding(.bottom, 16)
            .accessibilityIdentifier("robot.hire")
        }
    }

    private func row(_ template: RobotTemplate) -> some View {
        let text = template.localizedText
        let chosen = selected == template.id
        return Button {
            selected = template.id
        } label: {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: chosen ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(chosen ? TomatoToken.brandPrimary : TomatoToken.labelDimmed)
                VStack(alignment: .leading, spacing: 2) {
                    Text(text?.name ?? template.id)
                        .font(.callout.weight(.medium))
                        .foregroundStyle(TomatoToken.labelPrimary)
                    if let description = text?.description, !description.isEmpty {
                        Text(description)
                            .font(.caption)
                            .foregroundStyle(TomatoToken.labelCaption)
                            .multilineTextAlignment(.leading)
                    }
                    if let category = text?.category, !category.isEmpty {
                        Text(category)
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelDimmed)
                    }
                }
                Spacer(minLength: 0)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func hire() async {
        guard let template = selected else { return }
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil
        do {
            _ = try await hub.hireRobot(
                templateId: template,
                name: name.trimmingCharacters(in: .whitespacesAndNewlines)
            )
            await onHired()
            dismiss()
        } catch {
            errorMessage = describe(error)
        }
    }
}
