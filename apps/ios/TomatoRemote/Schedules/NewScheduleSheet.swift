//
//  NewScheduleSheet.swift
//  Tomato Remote
//
//  Creating a reminder from the phone.
//
//  The Host's Remote face accepts the same selectors its tool does: a one-shot
//  instant, a fixed interval, a daily or weekly wall-clock time, or a cron
//  expression. The sheet offers the four everyday shapes; cron stays in the
//  conversation, where an Agent can explain the expression it writes.
//

import SwiftUI

struct NewScheduleSheet: View {
    /// Session the task is bound to; its Agent receives the deliveries.
    let sessionId: String
    let hub: HubClient
    let onCreated: () async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var prompt = ""
    @State private var shape: Shape = .daily
    @State private var onceAt = Date().addingTimeInterval(3600)
    @State private var minutes = 30
    @State private var time = Calendar.current.date(from: DateComponents(hour: 9, minute: 0)) ?? Date()
    @State private var weekday = 2
    @State private var isSaving = false
    @State private var errorMessage: String?

    private enum Shape: String, CaseIterable, Identifiable {
        case once, every, daily, weekly

        var id: String {
            rawValue
        }

        var label: String {
            switch self {
            case .once: "一次"
            case .every: "每隔"
            case .daily: "每天"
            case .weekly: "每周"
            }
        }
    }

    private var canSave: Bool {
        !title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            && !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(title: "新建定时任务", caption: "到点由 Mac 上的 Agent 执行，手机只负责新建、暂停和查看。", onClose: { dismiss() })
            Form {
                Section("内容") {
                    TextField("任务名，例如「检查发布状态」", text: $title)
                    TextField("到点交给 Agent 的指令", text: $prompt, axis: .vertical)
                        .lineLimit(2 ... 4)
                }
                Section("什么时候") {
                    Picker("重复", selection: $shape) {
                        ForEach(Shape.allCases) { shape in
                            Text(shape.label).tag(shape)
                        }
                    }
                    .pickerStyle(.segmented)
                    timing
                }
                if let errorMessage {
                    Section {
                        Text(errorMessage)
                            .font(.footnote)
                            .foregroundStyle(TomatoToken.stateErrorPrimary)
                    }
                }
                Section {
                    Text("任务由 Mac 上的 Agent 执行；手机只负责创建、暂停和查看。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelDimmed)
                }
            }
            .tomatoSheetContent()
            SheetPrimaryButton(title: "创建", isBusy: isSaving, isEnabled: canSave) {
                Task { await save() }
            }
            .padding(.top, 8)
            .padding(.bottom, 16)
            .accessibilityIdentifier("schedule.create")
        }
    }

    @ViewBuilder
    private var timing: some View {
        switch shape {
        case .once:
            DatePicker("执行时间", selection: $onceAt, in: Date()...)
        case .every:
            Stepper("每 \(minutes) 分钟", value: $minutes, in: 5 ... 1440, step: 5)
        case .daily:
            DatePicker("每天", selection: $time, displayedComponents: .hourAndMinute)
        case .weekly:
            Picker("星期", selection: $weekday) {
                ForEach(Array(zip(1 ... 7, ["一", "二", "三", "四", "五", "六", "日"])), id: \.0) { value, name in
                    Text("周\(name)").tag(value)
                }
            }
            DatePicker("时间", selection: $time, displayedComponents: .hourAndMinute)
        }
    }

    private func save() async {
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil
        var body = ScheduleCreateBody(
            sessionId: sessionId,
            title: title.trimmingCharacters(in: .whitespacesAndNewlines),
            prompt: prompt.trimmingCharacters(in: .whitespacesAndNewlines)
        )
        let zone = TimeZone.current.identifier
        switch shape {
        case .once:
            body.at = Self.instantFormatter.string(from: onceAt)
        case .every:
            body.everySeconds = Double(minutes * 60)
        case .daily:
            body.daily = ScheduleDailyInput(time: Self.clock(time), timeZone: zone)
        case .weekly:
            body.weekly = ScheduleWeeklyInput(time: Self.clock(time), timeZone: zone, weekdays: [weekday])
        }
        do {
            _ = try await hub.createSchedule(body)
            await onCreated()
            dismiss()
        } catch {
            errorMessage = describe(error)
        }
    }

    /// Wall-clock part of a date, as the Host's `HH:mm:ss` selector expects.
    private static func clock(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: date)
    }

    private static let instantFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
}
