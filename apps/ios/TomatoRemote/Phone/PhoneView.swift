//
//  PhoneView.swift
//  Tomato Remote
//
//  The phone-control page: this device's own runner, kept apart from the Mac
//  screens so the two capabilities never share a page, a stream, or a gate.
//

import SwiftUI

/// Everything about operating this iPhone itself.
struct PhoneView: View {
    @StateObject private var device = PhoneDeviceModel()
    @State private var showsModel = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                CaptionFallback(caption: "这一页只管这台手机：Runner 的状态、本机配对与手机上的任务。控制 Mac 的能力在「今天」「会话」等页面，两边互不影响。")
                modeCard
                PhoneDeviceCard(device: device)
                PhoneTaskView(device: device)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 28)
        }
        .background(TomatoToken.bgBase)
        .tomatoPageTitle("手机", caption: "Runner 在手机上执行；Mac 只负责安装、续签与拉起。")
        .navigationBarTitleDisplayMode(.large)
        .tomatoScrollEdge()
        .task { await device.refresh() }
    }

    /// The explicit switch between the two capabilities.
    private var modeCard: some View {
        TomatoCard {
            VStack(alignment: .leading, spacing: 10) {
                SectionHeader(title: "工作模式") {
                    Text(device.mode.title)
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
                Picker("工作模式", selection: Binding(
                    get: { device.mode },
                    set: { mode in Task { await device.setMode(mode) } }
                )) {
                    ForEach(WorkMode.allCases) { mode in
                        Text(mode.title).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                Text(device.mode.summary)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelCaption)
            }
        }
    }
}
