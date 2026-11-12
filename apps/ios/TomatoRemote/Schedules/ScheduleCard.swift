//
//  ScheduleCard.swift
//  Tomato Remote
//
//  One reminder: when it runs next, when it last delivered, and its history.
//

import SwiftUI

/// One scheduled task on the schedule page.
struct ScheduleCard: View {
    let entry: ScheduleEntry
    let deliveries: [ScheduleDelivery]?
    let onHistory: () -> Void
    /// Pause an armed task, or resume a paused one.
    let onTogglePause: () -> Void
    let onDelete: () -> Void

    var body: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text(entry.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .lineLimit(2)
                    Spacer(minLength: 6)
                    StatusPill(
                        text: entry.isPaused ? "已暂停" : entry.isActive ? "进行中" : "已结束",
                        tone: entry.isPaused ? .warn : entry.isActive ? .ok : .idle
                    )
                }
                Text(entry.recurrence)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelCaption)
                if let next = entry.nextDue {
                    InfoRow(label: "下次", value: next.formatted(date: .abbreviated, time: .shortened))
                }
                if let delivery = entry.lastDelivery, let at = parseInstant(delivery.deliveredAt) {
                    InfoRow(label: "上次投递", value: relativeTime(at.timeIntervalSince1970 * 1000))
                }
                Text(entry.prompt)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelDimmed)
                    .lineLimit(3)
                    .fixedSize(horizontal: false, vertical: true)
                HStack(spacing: 10) {
                    if entry.isActive {
                        TomatoSecondaryButton(
                            title: entry.isPaused ? "恢复" : "暂停",
                            systemImage: entry.isPaused ? "play.circle" : "pause.circle",
                            action: onTogglePause
                        )
                        .accessibilityIdentifier("schedule.toggle.\(entry.id)")
                    }
                    TomatoSecondaryButton(title: "投递记录", systemImage: "list.bullet", action: onHistory)
                }
                TomatoSecondaryButton(title: "删除", systemImage: "trash", isDestructive: true, action: onDelete)
                if let deliveries {
                    deliveryList(deliveries)
                }
            }
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("schedule.card.\(entry.title)")
    }

    private func deliveryList(_ records: [ScheduleDelivery]) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            if records.isEmpty {
                Text("还没有投递记录。")
                    .font(.caption2)
                    .foregroundStyle(TomatoToken.labelDimmed)
            } else {
                ForEach(records.prefix(5)) { delivery in
                    HStack(spacing: 6) {
                        Image(systemName: "arrow.down.circle")
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelDimmed)
                        Text(parseInstant(delivery.deliveredAt).map { relativeTime($0.timeIntervalSince1970 * 1000) } ?? delivery
                            .deliveredAt)
                            .font(.caption2)
                            .foregroundStyle(TomatoToken.labelCaption)
                    }
                }
            }
        }
    }
}
