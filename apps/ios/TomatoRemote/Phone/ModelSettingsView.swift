//
//  ModelSettingsView.swift
//  Tomato Remote
//
//  Where the phone's own loop gets its model.
//

import SwiftUI

/// Provider, endpoint, model, and key for the on-device loop.
struct ModelSettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var settings = ModelSettingsStore.load()
    @State private var keyDraft = ""
    @State private var savedMessage: String?

    var body: some View {
        Form {
            Section {
                Picker("服务商", selection: $settings.kind) {
                    Text("OpenAI 兼容").tag(PhoneProviderChoice.Kind.openai)
                    Text("Anthropic").tag(PhoneProviderChoice.Kind.anthropic)
                }
                .onChange(of: settings.kind) { _, kind in
                    if let preset = ModelSettings.presets[kind] {
                        settings.baseURL = preset.baseURL
                        settings.model = preset.model
                    }
                    keyDraft = ModelSettingsStore.key(for: kind) ?? ""
                }
                TextField("Base URL", text: $settings.baseURL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
                TextField("模型", text: $settings.model)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                TextField("API Key", text: $keyDraft)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                Stepper("最多 \(settings.maxSteps) 步", value: $settings.maxSteps, in: 5 ... 60, step: 5)
            } header: {
                Text("模型服务")
            } footer: {
                Text("Key 只存在这台手机的钥匙串，按任务经本机 loopback 交给 Runner，不经过配对的 Mac，也不写日志。")
            }

            Section {
                TomatoPrimaryButton(title: "保存", systemImage: "checkmark") {
                    save()
                }
            }

            if let savedMessage {
                Section {
                    Text(savedMessage)
                        .font(.footnote)
                        .foregroundStyle(TomatoToken.stateSuccessPrimary)
                }
            }
        }
        .navigationTitle("手机模型")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { keyDraft = ModelSettingsStore.key(for: settings.kind) ?? "" }
    }

    private func save() {
        ModelSettingsStore.save(settings)
        do {
            if keyDraft.isEmpty {
                ModelSettingsStore.clearKey(for: settings.kind)
            } else {
                try ModelSettingsStore.setKey(keyDraft, for: settings.kind)
            }
            savedMessage = "已保存：\(settings.kind.rawValue) · \(settings.model)"
        } catch {
            savedMessage = "保存 Key 失败：\(error.localizedDescription)"
        }
    }
}
