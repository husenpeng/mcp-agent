//
//  PhoneTaskView.swift
//  Tomato Remote
//
//  One goal handed to the phone's own loop.
//

import SwiftUI

/// Goal entry, progress, and the step log of the on-device task.
struct PhoneTaskView: View {
    @ObservedObject var device: PhoneDeviceModel
    @StateObject private var task = PhoneTaskModel()
    @State private var showsModel = false

    var body: some View {
        VStack(spacing: 14) {
            TomatoCard {
                VStack(alignment: .leading, spacing: 10) {
                    SectionHeader(title: "让手机自己做事") {
                        Button("模型设置") { showsModel = true }
                            .font(.caption)
                    }
                    TextField("例如：打开设置，告诉我电池电量", text: $task.goal, axis: .vertical)
                        .lineLimit(2 ... 4)
                        .textFieldStyle(.roundedBorder)
                    if let error = task.errorMessage {
                        Text(error).font(.caption).foregroundStyle(TomatoToken.stateErrorPrimary)
                    }
                    HStack(spacing: 10) {
                        TomatoPrimaryButton(
                            title: "开始",
                            systemImage: "play.fill",
                            isEnabled: device.canAct && task.goal.isEmpty == false && task.isRunning == false,
                            isBusy: task.busy
                        ) {
                            guard let credential = device.credential else { return }
                            Task { await task.start(credential: credential, settings: ModelSettingsStore.load()) }
                        }
                        if task.isRunning {
                            TomatoSecondaryButton(title: "停止", systemImage: "stop.fill", isDestructive: true) {
                                guard let credential = device.credential else { return }
                                Task { await task.stop(credential: credential) }
                            }
                        }
                    }
                    if !device.canAct {
                        Text("先在上面切到「操控这台手机」。")
                            .font(.caption)
                            .foregroundStyle(TomatoToken.labelCaption)
                    }
                }
            }

            if let status = task.status {
                TomatoCard {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionHeader(title: "任务状态") {
                            Text(status.status).font(.caption).foregroundStyle(TomatoToken.labelDimmed)
                        }
                        if let summary = status.summary {
                            Text(summary).font(.footnote)
                        }
                        if let error = status.error {
                            Text(error).font(.caption).foregroundStyle(TomatoToken.stateErrorPrimary)
                        }
                        ForEach(status.steps, id: \.n) { step in
                            HStack(alignment: .top, spacing: 8) {
                                Text("\(step.n)")
                                    .font(.caption2.monospaced())
                                    .foregroundStyle(TomatoToken.labelDimmed)
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(step.action).font(.caption)
                                    Text(step.detail)
                                        .font(.caption2)
                                        .foregroundStyle(TomatoToken.labelCaption)
                                        .lineLimit(2)
                                }
                                Spacer()
                                Text("\(step.ms)ms")
                                    .font(.caption2.monospaced())
                                    .foregroundStyle(TomatoToken.labelDimmed)
                            }
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showsModel) {
            NavigationStack { ModelSettingsView() }
        }
    }
}
