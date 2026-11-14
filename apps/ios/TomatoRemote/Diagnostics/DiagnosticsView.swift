//
//  DiagnosticsView.swift
//  Tomato Remote
//
//  The in-app reader for the log: what the app was doing, what failed, and what
//  the system said when the last run ended.
//
//  A phone cannot be attached to a debugger while its owner uses it, so this
//  screen is the debugging surface: filter to errors, read the last activity
//  before a hang, and export one file that carries both this run and the tail
//  of the previous one.
//

import SwiftUI
import UIKit

struct DiagnosticsView: View {
    @ObservedObject private var log = AppLog.shared

    @State private var query = ""
    @State private var level: AppLogLevel?
    @State private var category: AppLogCategory?
    @State private var showPrevious = false
    @State private var previousText = ""
    @State private var expanded: UInt64?
    @State private var shareURL: URL?
    @State private var showingShare = false
    @State private var copied = false
    @State private var confirmingClear = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                CaptionFallback(caption: "崩溃、卡顿与网络记录；导出后可以发给开发者。")
                statusCard
                rangePicker
                if showPrevious {
                    previousCard
                } else {
                    filters
                    entryList
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 28)
        }
        .background(TomatoToken.bgBase)
        .tomatoPageTitle("运行日志", caption: "崩溃、卡顿与网络记录；导出后可以发给开发者。")
        .navigationBarTitleDisplayMode(.large)
        .tomatoScrollEdge()
        .toolbar(.hidden, for: .tabBar)
        .task {
            AppLog.screen("运行日志")
            previousText = log.previousRunText()
        }
        .sheet(isPresented: $showingShare) {
            if let shareURL {
                ShareSheet(items: [shareURL])
            }
        }
        .tomatoConfirm(
            isPresented: $confirmingClear,
            title: "清空本次运行日志？",
            message: "只删除这台手机上的记录，不影响 Host。",
            confirmTitle: "清空",
            destructive: true
        ) {
            log.clear()
            previousText = ""
            copied = false
        }
    }

    // MARK: Status

    private var statusCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 12) {
                SectionHeader(title: "状态")
                InfoRow(label: "环境", value: log.environment.isEmpty ? "尚未记录" : log.environment)
                InfoRow(label: "占用", value: MemoryFootprint.text())
                InfoRow(label: "主机", value: log.host)
                InfoRow(label: "条目", value: "\(log.entries.count) / \(AppLog.capacity)")
                if let crash = log.lastCrash {
                    crashNotice(crash)
                }
                actions
            }
        }
    }

    private func crashNotice(_ crash: CrashRecord) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ErrorBanner(message: "上次运行异常结束：\(crash.summary)")
            if expanded == 0 {
                Text(crash.stack.prefix(16).joined(separator: "\n"))
                    .font(.caption2.monospaced())
                    .foregroundStyle(TomatoToken.labelCaption)
                    .textSelection(.enabled)
                    .fixedSize(horizontal: false, vertical: true)
            }
            // A signal record names the signal and time only; its stack comes
            // from MetricKit, so there is nothing to expand here.
            if !crash.stack.isEmpty {
                Button(expanded == 0 ? "收起调用栈" : "查看调用栈") {
                    expanded = expanded == 0 ? nil : 0
                }
                .font(.caption.weight(.medium))
                .foregroundStyle(TomatoToken.brandPrimary)
            }
        }
    }

    private var actions: some View {
        HStack(spacing: 10) {
            actionButton("导出", systemImage: "square.and.arrow.up") {
                shareURL = log.exportFile()
                showingShare = shareURL != nil
            }
            .accessibilityIdentifier("diagnostics.export")
            actionButton(copied ? "已复制" : "复制", systemImage: "doc.on.doc") {
                UIPasteboard.general.string = log.exportText()
                copied = true
                Task {
                    try? await Task.sleep(nanoseconds: 2_000_000_000)
                    copied = false
                }
            }
            .accessibilityIdentifier("diagnostics.copy")
            actionButton("清空", systemImage: "trash", destructive: true) {
                confirmingClear = true
            }
            .accessibilityIdentifier("diagnostics.clear")
        }
    }

    /// One equal-width action in the status card.
    private func actionButton(
        _ title: String,
        systemImage: String,
        destructive: Bool = false,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Image(systemName: systemImage).font(.footnote.weight(.medium))
                Text(title).font(.footnote.weight(.medium))
            }
            .foregroundStyle(destructive ? TomatoToken.stateErrorPrimary : TomatoToken.labelPrimary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 10)
            .background(TomatoToken.bgLayer3)
            .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    // MARK: Range and filters

    private var rangePicker: some View {
        Picker("范围", selection: $showPrevious) {
            Text("本次").tag(false)
            Text("上次").tag(true)
        }
        .pickerStyle(.segmented)
        .accessibilityIdentifier("diagnostics.range")
    }

    private var filters: some View {
        VStack(spacing: 10) {
            HStack(spacing: 10) {
                Menu {
                    Button("全部级别") { level = nil }
                    Divider()
                    ForEach(AppLogLevel.allCases, id: \.self) { item in
                        Button(item.label) { level = item }
                    }
                } label: {
                    filterChip(level?.label ?? "全部级别")
                }
                Menu {
                    Button("全部类别") { category = nil }
                    Divider()
                    ForEach(AppLogCategory.allCases, id: \.self) { item in
                        Button(item.label) { category = item }
                    }
                } label: {
                    filterChip(category?.label ?? "全部类别")
                }
                Spacer(minLength: 0)
                Text("\(filtered.count) 条")
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelCaption)
            }
            TextField("搜索消息、接口或类别", text: $query)
                .font(.footnote)
                .textFieldStyle(.roundedBorder)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .accessibilityIdentifier("diagnostics.search")
        }
    }

    private func filterChip(_ title: String) -> some View {
        HStack(spacing: 4) {
            Text(title).font(.caption.weight(.medium))
            Image(systemName: "chevron.down").font(.caption2)
        }
        .foregroundStyle(TomatoToken.labelPrimary)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(TomatoToken.bgLayer3)
        .clipShape(Capsule())
    }

    // MARK: Entries

    private var entryList: some View {
        LogEntryList(entries: filtered, searching: !query.isEmpty, expanded: $expanded)
    }

    private var previousCard: some View {
        TomatoCard(padding: 16) {
            VStack(alignment: .leading, spacing: 8) {
                SectionHeader(title: "上次运行（尾部）")
                if previousText.isEmpty {
                    Text("上次运行没有留下记录。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                } else {
                    Text(previousText)
                        .font(.caption2.monospaced())
                        .foregroundStyle(TomatoToken.labelSecondary)
                        .textSelection(.enabled)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    // MARK: Derived

    private var filtered: [AppLogEntry] {
        let keyword = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        return log.entries.reversed().filter { entry in
            if let level, entry.level < level {
                return false
            }
            if let category, entry.category != category {
                return false
            }
            guard !keyword.isEmpty else { return true }
            if entry.message.lowercased().contains(keyword) {
                return true
            }
            if let detail = entry.detail, detail.lowercased().contains(keyword) {
                return true
            }
            return entry.category.label.contains(keyword) || entry.level.label.contains(keyword)
        }
    }
}

/// The filtered rows of one run, drawn lazily so a full buffer stays responsive.
private struct LogEntryList: View {
    let entries: [AppLogEntry]
    /// Whether the empty state should describe a filter that matched nothing.
    let searching: Bool
    @Binding var expanded: UInt64?

    var body: some View {
        LazyVStack(alignment: .leading, spacing: 0) {
            if entries.isEmpty {
                EmptyPlaceholder(
                    systemImage: "doc.text.magnifyingglass",
                    title: searching ? "没有匹配的记录" : "还没有记录",
                    detail: searching
                        ? "换一个关键词或放宽筛选。"
                        : "运行一段时间后，这里会显示启动、网络和对话的过程。"
                )
                .padding(.vertical, 24)
            }
            ForEach(entries) { entry in
                row(entry)
                Divider().overlay(TomatoToken.borderL1)
            }
        }
    }

    private func row(_ entry: AppLogEntry) -> some View {
        Button {
            expanded = expanded == entry.id ? nil : entry.id
        } label: {
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 6) {
                    Text(entry.clock)
                        .font(.caption2.monospaced())
                        .foregroundStyle(TomatoToken.labelCaption)
                    Text(entry.level.label)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(color(for: entry.level))
                    Text(entry.category.label)
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelDimmed)
                    Spacer(minLength: 0)
                }
                Text(entry.message)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .multilineTextAlignment(.leading)
                if expanded == entry.id, let detail = entry.detail, !detail.isEmpty {
                    Text(detail)
                        .font(.caption2.monospaced())
                        .foregroundStyle(TomatoToken.labelSecondary)
                        .multilineTextAlignment(.leading)
                        .textSelection(.enabled)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.vertical, 7)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func color(for level: AppLogLevel) -> Color {
        switch level {
        case .debug, .info: TomatoToken.labelDimmed
        case .notice: TomatoToken.stateBusinessPrimary
        case .warning: TomatoToken.stateWarnPrimary
        case .error, .fault: TomatoToken.stateErrorPrimary
        }
    }
}

/// System share sheet for one exported file.
private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ controller: UIActivityViewController, context: Context) {}
}
