//
//  PhoneAuditSheet.swift
//  Tomato Remote
//
//  The audit trail of the conversation on screen: the service's event log, which
//  carries the tool calls, approvals, quota and retry records the transcript does
//  not show, folded into the session's token, tool, cache and timing totals.
//  Reading it needs the server session, not the phone's local cache.
//

import SwiftUI

struct PhoneAuditSheet: View {
    @ObservedObject var agent: PhoneAgentModel
    @Environment(\.dismiss) private var dismiss
    @State private var events: [AgentServiceEventRecord] = []
    @State private var stats: AgentServiceSessionStats?
    @State private var contextWindow: Int?
    /// Why a page could not be read, kept apart from an empty log.
    @State private var error: String?
    /// Why paging stopped short of the whole log.
    @State private var incomplete: String?
    @State private var isLoading = false
    /// Events read per page while walking the log.
    private static let pageSize = 1000
    /// Pages one refresh may read before it reports the log as too long.
    private static let pageLimit = 20

    var body: some View {
        NavigationStack {
            Group {
                if isLoading, events.isEmpty {
                    ProgressView("读取审计记录…")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let error, events.isEmpty {
                    Text(error)
                        .font(.callout)
                        .foregroundStyle(AgentTheme.danger)
                        .padding(20)
                        .frame(maxWidth: .infinity, alignment: .top)
                } else {
                    List {
                        if let stats {
                            statisticsSection(stats)
                        }
                        if let error {
                            Section {
                                Text(error)
                                    .font(.footnote)
                                    .foregroundStyle(AgentTheme.danger)
                            }
                        } else if let incomplete {
                            Section {
                                Text(incomplete)
                                    .font(.footnote)
                                    .foregroundStyle(AgentTheme.inkSecondary)
                            }
                        }
                        Section("事件记录") {
                            if events.isEmpty {
                                Text("这个会话还没有服务端事件。")
                                    .font(.callout)
                                    .foregroundStyle(AgentTheme.inkSecondary)
                            } else {
                                ForEach(events.reversed()) { event in
                                    row(event)
                                }
                            }
                        }
                    }
                    .listStyle(.insetGrouped)
                }
            }
            .background(AgentTheme.canvas)
            .navigationTitle("会话审计")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("关闭") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await load() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                    .accessibilityLabel("刷新审计")
                }
            }
            .task { await load() }
        }
    }

    // MARK: - Statistics

    /// The session's totals, laid out as the desktop's statistics and token cards.
    /// - Parameter stats: folded figures of the whole log.
    /// - Returns: the statistics sections, as one view so the caller shows them together.
    @ViewBuilder
    private func statisticsSection(_ stats: AgentServiceSessionStats) -> some View {
        Section {
            statRow("轮次 / 步数", value: "\(stats.turns) 轮 \(stats.tokens.steps) 步")
            statRow("模型用时", value: formatDuration(stats.llmMs))
            statRow("工具调用用时", value: formatDuration(stats.toolMs))
            statRow("工具调用次数", value: "\(stats.tools.calls) 次（失败 \(stats.tools.failures)）")
            if let ttft = stats.timing.averageTTFTMs {
                statRow("首 token 平均（TTFT）", value: formatSeconds(ttft))
            }
            if let speed = stats.timing.tokensPerSecond {
                statRow("输出速度（TPS）", value: "\(Int(speed.rounded())) tok/s")
            }
        } header: {
            Text("会话统计")
        }

        Section {
            statRow("Token 总量", value: "\(formatExact(stats.tokens.total)) tok")
            if let hit = AgentServiceStats.cacheHitPercent(stats.tokens) {
                statRow("缓存命中", value: "\(hit)%")
            }
            statRow("未缓存输入", value: "\(formatExact(stats.tokens.uncachedInput)) tok")
            statRow("缓存读取", value: "\(formatExact(stats.tokens.cacheRead)) tok")
            statRow("缓存写入", value: "\(formatExact(stats.tokens.cacheWrite)) tok")
            statRow("输出", value: "\(formatExact(stats.tokens.output)) tok")
        } header: {
            Text("Token 用量")
        }

        Section {
            statRow("上下文", value: contextReading(stats))
        } header: {
            Text("上下文")
        } footer: {
            Text("会话累加的输入规模占模型窗口容量的比例；持久日志不保留单轮输入，因此不是最近一轮的占用。")
        }
    }

    /// Context reading: used over capacity when the route lists a window.
    /// - Parameter stats: folded figures.
    /// - Returns: the reading text.
    private func contextReading(_ stats: AgentServiceSessionStats) -> String {
        guard let contextWindow, contextWindow > 0, stats.tokens.promptTokens > 0 else { return "—" }
        let used = min(stats.tokens.promptTokens, contextWindow)
        return "\(percent(used, of: contextWindow))% · ≈\(compact(used)) / \(compact(contextWindow))"
    }

    /// One label and value line.
    /// - Parameters:
    ///   - title: row label.
    ///   - value: reading, already formatted.
    private func statRow(_ title: String, value: String) -> some View {
        LabeledContent(title, value: value)
            .font(.callout)
    }

    // MARK: - Event rows

    /// One event row: what happened, when, and whether the model could see it.
    /// - Parameter event: event from the service log.
    private func row(_ event: AgentServiceEventRecord) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 8) {
                Text(event.type)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(AgentTheme.accent)
                Spacer(minLength: 6)
                Text(event.surface == true ? "模型可见" : "仅审计")
                    .font(.caption2)
                    .foregroundStyle(event.surface == true ? AgentTheme.inkSecondary : AgentTheme.danger)
                Text(time(event.createdAt))
                    .font(.caption2)
                    .foregroundStyle(AgentTheme.inkSecondary)
            }
            let summary = summary(event)
            if !summary.isEmpty {
                Text(summary)
                    .font(.footnote)
                    .foregroundStyle(AgentTheme.ink)
                    .lineLimit(3)
            }
        }
        .padding(.vertical, 4)
    }

    /// Human summary of the payload fields this panel draws.
    /// - Parameter event: event from the service log.
    /// - Returns: one line, or empty when the type has no summary.
    private func summary(_ event: AgentServiceEventRecord) -> String {
        let payload = event.payload
        switch event.type {
        case "tool/call":
            let name = payload?["name"]?.stringValue ?? ""
            return name.isEmpty ? "" : "调用 \(name)"
        case "tool/result":
            let content = payload?["content"]?.stringValue ?? ""
            return content.isEmpty ? "" : "工具返回：\(String(content.prefix(120)))"
        case "usage":
            let prompt = Int(payload?["prompt_tokens"]?.doubleValue ?? 0)
            let cached = Int(payload?["cached_tokens"]?.doubleValue ?? 0)
            let output = Int(payload?["completion_tokens"]?.doubleValue ?? 0)
            return "输入 \(formatExact(prompt)) · 缓存 \(formatExact(cached)) · 输出 \(formatExact(output)) tok"
        case "approval/request":
            let tool = payload?["tool_name"]?.stringValue ?? ""
            let risk = payload?["risk"]?.stringValue ?? ""
            return "请求审批：\(tool)（风险 \(risk)）"
        case "approval/decision":
            return "审批结果：\(payload?["status"]?.stringValue ?? payload?["decision"]?.stringValue ?? "")"
        case "turn/end":
            return "轮结束：\(payload?["status"]?.stringValue ?? "")"
        case "quota/hit", "quota/exceeded":
            return "配额：\(payload?["kind"]?.stringValue ?? "")"
        case "rate_limit/hit":
            return "限流命中"
        case "retry/scheduled", "retry/started":
            return "重试：\(payload?["reason"]?.stringValue ?? "")"
        case "compaction/summary", "compaction/start":
            return "上下文压缩"
        default:
            return ""
        }
    }

    // MARK: - Loading

    /// Read the whole event log of the session on screen from the service.
    private func load() async {
        guard let sessionId = agent.activeServiceSessionId else {
            error = "这个会话还没有服务端记录；先发一条消息。"
            return
        }
        guard let client = AgentServiceClient.current() else {
            error = AgentServiceError.notSignedIn.errorDescription
            return
        }
        isLoading = true
        defer { isLoading = false }
        do {
            var collected: [AgentServiceEventRecord] = []
            var cursor = 0
            var pages = 0
            while pages < Self.pageLimit {
                let page = try await client.events(sessionId: sessionId, afterSeq: cursor, limit: Self.pageSize)
                collected += page.events
                pages += 1
                guard let next = page.nextAfterSeq, !page.events.isEmpty, next > cursor else { break }
                cursor = next
            }
            // Only the session on screen: a conversation opened meanwhile must
            // not show another one's figures.
            guard sessionId == agent.activeServiceSessionId else { return }
            events = collected
            stats = AgentServiceStats.fold(collected)
            contextWindow = await routeCapacity(client: client)
            incomplete = pages >= Self.pageLimit
                ? "事件较多，只统计了最早的 \(Self.pageLimit * Self.pageSize) 条。"
                : nil
            error = nil
        } catch {
            self.error = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription
        }
    }

    /// Window capacity of the model the session runs on, when the route lists one.
    ///
    /// The session pins its route at creation; an unreadable route list leaves
    /// the context card out rather than guessing a window.
    /// - Parameter client: service client.
    /// - Returns: the pinned route's context window, or nil.
    private func routeCapacity(client: AgentServiceClient) async -> Int? {
        guard let pinned = AgentBackendStore.serviceModelRoute,
              let routes = try? await client.listModels()
        else { return nil }
        return routes.first { $0.name == pinned }?.contextWindow
    }

    // MARK: - Formatting

    /// Short clock label for one event.
    /// - Parameter raw: timestamp string from the service.
    private func time(_ raw: String?) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: AgentServiceDate.parse(raw))
    }

    /// Minutes and seconds, as the desktop's statistics card writes them.
    /// - Parameter ms: duration in milliseconds.
    private func formatDuration(_ ms: Int) -> String {
        let seconds = ms / 1_000
        guard seconds >= 60 else { return "\(seconds) 秒" }
        return "\(seconds / 60) 分 \(seconds % 60) 秒"
    }

    /// One decimal second under a minute, rounded as the desktop card does.
    /// - Parameter ms: duration in milliseconds.
    private func formatSeconds(_ ms: Int) -> String {
        String(format: "%.1f 秒", Double(ms) / 1_000)
    }

    /// Exact integer with thousands separators.
    /// - Parameter value: token count.
    private func formatExact(_ value: Int) -> String {
        value.formatted(.number.grouping(.automatic))
    }

    /// Integer percent rounded down, so the card never overstates occupancy.
    /// - Parameters:
    ///   - part: consumed amount.
    ///   - whole: capacity.
    private func percent(_ part: Int, of whole: Int) -> Int {
        Int((Double(part) * 100 / Double(whole)).rounded(.down))
    }

    /// Compact token count: 2K / 87.2K / 1M.
    /// - Parameter value: token count.
    private func compact(_ value: Int) -> String {
        if value < 1_000 {
            return "\(value)"
        }
        if value < 1_000_000 {
            return scaled(Double(value) / 1_000) + "K"
        }
        return scaled(Double(value) / 1_000_000) + "M"
    }

    /// Unit-scale figure: whole numbers stay whole, others keep one decimal.
    /// - Parameter value: figure in thousands or millions.
    private func scaled(_ value: Double) -> String {
        value == value.rounded() ? String(Int(value)) : String(format: "%.1f", value)
    }
}