//
//  PhoneProcessGroup.swift
//  Tomato Remote
//
//  One turn's thinking and tool calls, folded under a single row. The answer
//  stays on the transcript; the work that produced it opens on a tap, one item
//  per row, with each row opening its own detail.
//

import SwiftUI

/// A turn's folded work in the Tomato Phone transcript.
struct PhoneProcessGroup: View {
    let items: [PhoneProcessItem]
    let running: Bool

    @State private var expanded = false
    /// Tool whose full result is presented.
    @State private var detail: PhoneProcessItem?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            header
            if expanded {
                ForEach(items) { item in
                    detailRow(item)
                }
            }
        }
        .sheet(item: $detail) { item in
            PhoneToolDetailSheet(item: item)
                .tomatoSheet([.large])
        }
    }

    /// The one line the transcript shows while the work is folded.
    private var header: some View {
        Button {
            withAnimation(.easeOut(duration: 0.15)) { expanded.toggle() }
        } label: {
            HStack(spacing: 6) {
                if running {
                    ProgressView()
                        .controlSize(.mini)
                        .tint(AgentTheme.accent)
                } else {
                    Image(systemName: "brain")
                        .font(.caption2)
                }
                Text(running ? "正在处理…" : "处理过程")
                    .font(.caption.weight(.medium))
                    .lineLimit(1)
                    .layoutPriority(1)
                Spacer(minLength: 4)
                Text(summary)
                    .font(.caption2.monospacedDigit())
                    .lineLimit(1)
                    .truncationMode(.tail)
                Image(systemName: expanded ? "chevron.down" : "chevron.right")
                    .font(.caption2.weight(.semibold))
            }
            .foregroundStyle(AgentTheme.inkSecondary)
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(AgentTheme.surfaceMuted, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(AgentTheme.border, lineWidth: 1)
            )
            .contentShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("phone.process")
        .accessibilityLabel("\(running ? "正在处理" : "处理过程")，\(summary)，\(expanded ? "已展开" : "已收起")")
        .accessibilityHint(expanded ? "收起过程" : "查看过程")
    }

    /// What the folded work contains, in a line that fits beside the title.
    private var summary: String {
        let thoughts = items.reduce(0) { count, item in
            if case .thinking = item {
                return count + 1
            }
            return count
        }
        let tools = items.reduce(0) { count, item in
            if case .tool = item {
                return count + 1
            }
            return count
        }
        var parts: [String] = []
        if thoughts > 0 {
            parts.append("思考 \(thoughts)")
        }
        if tools > 0 {
            parts.append("工具 \(tools)")
        }
        return parts.isEmpty ? "\(items.count) 项" : parts.joined(separator: " · ")
    }

    /// One item of the work: thinking, a note, or a tool result.
    /// - Parameter item: item to draw.
    /// - Returns: the row or card that item uses.
    @ViewBuilder
    private func detailRow(_ item: PhoneProcessItem) -> some View {
        switch item {
        case let .thinking(_, text):
            ReasoningBlock(text: text, live: running && item.id == "live-thinking")
        case let .note(_, text):
            PhoneProcessNote(text: text)
        case .tool:
            PhoneToolRow(item: item) { detail = item }
        }
    }
}

/// One tool result, one line, with its full output behind a tap.
private struct PhoneToolRow: View {
    let item: PhoneProcessItem
    let open: () -> Void

    var body: some View {
        Button(action: open) {
            HStack(spacing: 8) {
                Image(systemName: "wrench.and.screwdriver.fill")
                    .font(.caption2)
                    .foregroundStyle(AgentTheme.accent)
                    .frame(width: 18)
                VStack(alignment: .leading, spacing: 1) {
                    Text(name)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(AgentTheme.ink)
                        .lineLimit(1)
                    Text(preview)
                        .font(.caption2)
                        .foregroundStyle(AgentTheme.inkSecondary)
                        .lineLimit(1)
                }
                Spacer(minLength: 4)
                Image(systemName: "chevron.right")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(AgentTheme.inkSecondary)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(AgentTheme.border, lineWidth: 1)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("phone.process.tool")
        .accessibilityLabel("\(name)，\(preview)")
        .accessibilityHint("查看工具结果")
    }

    private var name: String {
        if case let .tool(_, name, _) = item {
            return name
        }
        return "工具"
    }

    private var preview: String {
        guard case let .tool(_, _, result) = item else { return "无输出" }
        let text = result.split(whereSeparator: \.isWhitespace).joined(separator: " ")
        return text.isEmpty ? "无输出" : String(text.prefix(48))
    }
}

/// The full result of one tool call.
private struct PhoneToolDetailSheet: View {
    let item: PhoneProcessItem
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            SheetHeader(title: name, caption: "工具的执行结果", onClose: { dismiss() })
            ScrollView {
                Text(result.isEmpty ? "没有输出。" : result)
                    .font(.footnote.monospaced())
                    .foregroundStyle(AgentTheme.ink)
                    .textSelection(.enabled)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)
            }
        }
        .background(AgentTheme.canvas)
        .accessibilityIdentifier("phone.process.toolDetail")
    }

    private var name: String {
        if case let .tool(_, name, _) = item {
            return name
        }
        return "工具"
    }

    private var result: String {
        if case let .tool(_, _, result) = item {
            return result
        }
        return ""
    }
}

/// One narration the agent wrote between tool calls, one line until tapped.
private struct PhoneProcessNote: View {
    let text: String
    @State private var expanded = false

    var body: some View {
        Text(text)
            .font(.caption)
            .foregroundStyle(AgentTheme.inkSecondary)
            .lineSpacing(2)
            .lineLimit(expanded ? nil : 1)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(AgentTheme.surface, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(AgentTheme.border, lineWidth: 1)
            )
            .contentShape(Rectangle())
            .onTapGesture {
                withAnimation(.easeOut(duration: 0.15)) { expanded.toggle() }
            }
            .accessibilityIdentifier("phone.process.note")
            .accessibilityHint(expanded ? "收起说明" : "查看完整说明")
    }
}
