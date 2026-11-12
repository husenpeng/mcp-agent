//
//  PhoneDeviceCard.swift
//  Tomato Remote
//
//  The device card on the Desktop screen: whether Tomato Runner is installed
//  and running on this phone, and two checks that prove it can act.
//

import SwiftUI

/// Status and controls for the on-device runner.
struct PhoneDeviceCard: View {
    /// The page owns the model so the mode switch and the card read one state.
    @ObservedObject var device: PhoneDeviceModel

    var body: some View {
        VStack(spacing: 14) {
            TomatoCard {
                VStack(alignment: .leading, spacing: 12) {
                    SectionHeader(title: "手机控制") {
                        StatusPill(text: statusText, tone: statusTone)
                    }
                    InfoRow(label: "Runner", value: runnerText)
                    if let health = device.health {
                        InfoRow(label: "协议版本", value: String(health.protocol))
                        InfoRow(label: "前台应用", value: health.foreground?.name ?? health.foreground?.bundleId ?? "—")
                        InfoRow(label: "占用", value: health.lease?.holder ?? "空闲")
                        InfoRow(
                            label: "屏幕",
                            value: "\(Int(health.screen.width))×\(Int(health.screen.height)) @\(Int(health.screen.scale))x"
                        )
                    }
                    InfoRow(label: "本机配对", value: device.isPaired ? "已配对" : "未配对")
                    if let errorMessage = device.errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundStyle(TomatoToken.stateErrorPrimary)
                    }
                }
            }

            if !device.isReachable {
                NoticeBar(text: "Runner 没有运行。在 Mac 上打开 apps/ios，选 TomatoRunner scheme 并对着这台手机执行一次测试，runner 会常驻在后台。")
            }

            if !device.isPaired {
                TomatoPrimaryButton(title: "配对 Runner", systemImage: "link", isBusy: device.busy) {
                    Task { await device.pair() }
                }
            } else {
                VStack(spacing: 10) {
                    NoticeBar(text: device.mode == .phone
                        ? "手机模式：按钮会在本机 Runner 上执行。"
                        : "现在是 Mac 模式：手机只发指令、不执行。切到「操控这台手机」才能执行下面的动作。")
                    TomatoPrimaryButton(
                        title: "在备忘录里输入一行字",
                        systemImage: "keyboard",
                        isEnabled: device.canAct,
                        isBusy: device.busy
                    ) {
                        Task { await device.typeIntoNotes() }
                    }
                    TomatoSecondaryButton(title: "观测一次", systemImage: "eye", isEnabled: !device.busy) {
                        Task { await device.observe() }
                    }
                    TomatoSecondaryButton(title: "刷新状态", systemImage: "arrow.clockwise", isEnabled: !device.busy) {
                        Task { await device.refresh() }
                    }
                }
            }

            if let observation = device.observation {
                TomatoCard {
                    VStack(alignment: .leading, spacing: 8) {
                        SectionHeader(title: "最近一次观测") {
                            Text("\(observation.elements.count) 个元素")
                                .font(.caption)
                                .foregroundStyle(TomatoToken.labelDimmed)
                        }
                        ForEach(observation.elements.prefix(8), id: \.ref) { element in
                            HStack(spacing: 8) {
                                Text(element.ref)
                                    .font(.caption2.monospaced())
                                    .foregroundStyle(TomatoToken.labelDimmed)
                                Text(element.role)
                                    .font(.caption2)
                                    .foregroundStyle(TomatoToken.labelDimmed)
                                Text(element.label.isEmpty ? "(无标题)" : element.label)
                                    .font(.caption)
                                    .lineLimit(1)
                            }
                        }
                        if observation.truncated {
                            Text("已截断：屏幕上元素比上限多")
                                .font(.caption2)
                                .foregroundStyle(TomatoToken.labelDimmed)
                        }
                    }
                }
            }

            if device.isPaired {
                TomatoSecondaryButton(title: "解除本机配对", systemImage: "xmark", isDestructive: true) {
                    device.unpair()
                }
            }
        }
        .task { await device.refresh() }
    }

    private var statusText: String {
        if !device.isReachable {
            return "未运行"
        }
        return device.isPaired ? "就绪" : "待配对"
    }

    private var statusTone: StatusPill.Tone {
        if !device.isReachable {
            return .idle
        }
        return device.isPaired ? .ok : .idle
    }

    private var runnerText: String {
        guard let health = device.health else { return "无响应" }
        return "\(health.runnerVersion) · \(health.hostLink == "off" ? "本机" : health.hostLink)"
    }
}
