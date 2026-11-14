//
//  ProcessGroup.swift
//  Tomato Remote
//
//  One turn's work details: every tool call and every note the Agent wrote on
//  the way, folded under a single disclosure so the transcript reads as a
//  conversation — the person's message, one line about the work, the answer.
//

import SwiftUI

/// What the transcript draws at one position: a row, or one turn's folded work.
enum TranscriptEntry: Identifiable {
    case single(ChatItem)
    case process(steps: [ChatItem], running: Bool)

    var id: String {
        switch self {
        case let .single(item): "row-\(item.id)"
        case let .process(steps, _): "process-\(steps.first?.id ?? "none")"
        }
    }
}

/// Equality is the step list and the running flag; the reader's own fold choice
/// lives in `@State` and invalidates the view on its own.
extension ProcessGroup: Equatable {
    static func == (lhs: ProcessGroup, rhs: ProcessGroup) -> Bool {
        lhs.steps == rhs.steps && lhs.running == rhs.running
    }
}

struct ProcessGroup: View {
    let steps: [ChatItem]
    /// Whether the turn behind this group is still working.
    let running: Bool
    let open: (ChatItem) -> Void

    /// A reader's own choice for this group; until they make one, a live turn
    /// stays open and a settled turn folds away.
    @State private var choice: Bool?

    private var expanded: Bool {
        choice ?? running
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            header
            if expanded {
                ForEach(steps) { step in
                    detail(step)
                }
            }
        }
    }

    private var header: some View {
        Button {
            withAnimation(.easeOut(duration: 0.15)) { choice = !expanded }
        } label: {
            HStack(spacing: 6) {
                if running {
                    ProgressView().controlSize(.mini)
                } else {
                    Image(systemName: "checkmark.circle")
                        .font(.caption2)
                }
                Text(title)
                    .font(.caption.weight(.medium))
                    .lineLimit(1)
                    .layoutPriority(1)
                Spacer(minLength: 0)
                Text(trailing)
                    .font(.caption2.monospacedDigit())
                    .lineLimit(1)
                    .truncationMode(.tail)
                Image(systemName: expanded ? "chevron.down" : "chevron.right")
                    .font(.caption2.weight(.semibold))
            }
            .foregroundStyle(TomatoToken.labelCaption)
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            // The caption row is ~30 pt tall; the fold it toggles is the main way
            // into a turn's work, so the touch area grows past the capsule.
            .contentShape(RoundedRectangle(cornerRadius: 10, style: .continuous).inset(by: -7))
        }
        .buttonStyle(TomatoPressableStyle())
        .accessibilityIdentifier("chat.row.process")
    }

    /// "正在处理 · 4 次工具调用" while live, "已完成 · 4 次工具调用" once settled.
    private var title: String {
        var parts = [running ? "正在处理" : "已完成"]
        let tools = steps.filter { $0.tool != nil }.count
        if tools > 0 {
            parts.append("\(tools) 次工具调用")
        }
        return parts.joined(separator: " · ")
    }

    /// What sits at the trailing edge: the tools of a live turn, the settled
    /// turn's own duration, or the tool names when the log kept no timestamps.
    private var trailing: String {
        if running {
            return toolNames
        }
        return span ?? toolNames
    }

    private var toolNames: String {
        let names = steps.compactMap { $0.tool?.name }
        return names.prefix(3).joined(separator: " · ")
    }

    /// How long the turn worked, from its first row to its last.
    private var span: String? {
        guard let first = steps.first?.time, let last = steps.last?.time, last >= first else { return nil }
        let seconds = (last - first) / 1000
        if seconds < 1 {
            return String(format: "%.0fms", seconds * 1000)
        }
        if seconds < 60 {
            return String(format: "%.1fs", seconds)
        }
        return "\(Int(seconds) / 60)m\(Int(seconds) % 60)s"
    }

    @ViewBuilder
    private func detail(_ step: ChatItem) -> some View {
        switch step.kind {
        case .tool:
            if let tool = step.tool {
                ToolCard(tool: tool) { open(step) }
            }
        case .assistant:
            ProcessNote(text: step.text)
        case .context:
            ContextRow(label: step.label ?? "上下文注入", text: step.text)
        default:
            EmptyView()
        }
    }
}

/// One note the Agent wrote between tool calls: folded by default, readable in
/// full on a tap.
private struct ProcessNote: View {
    let text: String

    @State private var expanded = false

    var body: some View {
        Text(text)
            .font(.footnote)
            .foregroundStyle(TomatoToken.labelSecondary)
            .lineSpacing(3)
            .lineLimit(expanded ? nil : 3)
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
            .contentShape(Rectangle())
            .onTapGesture { expanded.toggle() }
            .contextMenu {
                Button("复制") { UIPasteboard.general.string = text }
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(TomatoToken.bgLayer1, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}
