//
//  ChatStylePreview.swift
//  Tomato Remote
//
//  Debug-only harness for the conversation surface.
//
//  The real chat needs a paired Host. This preview puts the real status strip,
//  transcript rows, a diagram, and the dock over sample content so the phases a
//  reader sees can be inspected on a simulator with no Host at all.
//

#if DEBUG
    import SwiftUI

    /// A turn state the preview can stand in for.
    private enum PreviewPhase: String, CaseIterable, Identifiable {
        case thinking = "思考"
        case tool = "工具"
        case writing = "写回答"
        case waiting = "等确认"
        case idle = "空闲"

        var id: String {
            rawValue
        }

        var activity: ChatActivity {
            switch self {
            case .thinking: .thinking
            case .tool: .tool(name: "bash")
            case .writing: .writing
            case .waiting: .waiting(count: 1)
            case .idle: .idle(.live)
            }
        }
    }

    /// The conversation surface under fixed content, for layout checks.
    struct ChatStylePreview: View {
        @FocusState private var focused: Bool
        @State private var phase: PreviewPhase = .tool
        @State private var startedAt = Date().timeIntervalSince1970 * 1000 - 12000

        var body: some View {
            NavigationStack {
                VStack(spacing: 0) {
                    ChatStatusStrip(
                        activity: phase.activity,
                        startedAt: startedAt,
                        note: phase == .idle ? "发送消息可重新开始" : nil,
                        onAnswer: {},
                        onRetry: {}
                    )
                    ScrollView {
                        VStack(alignment: .leading, spacing: 18) {
                            UserRow(
                                text: "会话列表点进去没反应，帮我看看",
                                photos: ChatImages()
                            )
                            AssistantRow(
                                text: """
                                原因找到了：行上叠加的 `simultaneousGesture` 抢走了 NavigationLink 的点击。

                                ```mermaid
                                graph TD
                                  A[点击会话行] --> B{手势竞争}
                                  B -->|同时手势| C[点击被吞掉]
                                  B -->|只留链接| D[正常打开会话]
                                ```
                                """,
                                pending: false
                            )
                            if phase.activity.showsInTranscript {
                                ChatLiveRow(activity: phase.activity, startedAt: startedAt)
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.vertical, 16)
                    }
                    .tomatoScrollEdge()
                }
                .background(TomatoToken.bgBase)
                .tomatoBottomBar {
                    VStack(spacing: 6) {
                        Picker("阶段", selection: $phase) {
                            ForEach(PreviewPhase.allCases) { item in
                                Text(item.rawValue).tag(item)
                            }
                        }
                        .pickerStyle(.segmented)
                        .padding(.horizontal, 16)
                        .onChange(of: phase) { _, _ in
                            startedAt = Date().timeIntervalSince1970 * 1000 - 12000
                        }
                        ComposerView(
                            isFocused: $focused,
                            isRunning: phase != .idle,
                            canSend: true,
                            hub: nil,
                            onSend: { _, _ in },
                            onCancel: {},
                            modelTitle: "DeepSeek-V4.1-Flash-1017",
                            effortTitle: "最大",
                            effortIsActive: true,
                            onOpenModel: {},
                            onOpenReasoning: {}
                        )
                    }
                }
                .navigationTitle("对话样式")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar(.hidden, for: .tabBar)
            }
        }
    }

    /// The real conversation screen over a fixture summary, for bottom-edge checks.
    ///
    /// The chat cannot be opened without a paired Host, so a layout that depends
    /// on the screen's own bottom inset — the composer above the home indicator,
    /// the dock's material under it — has no way to be inspected on a simulator.
    /// This runs the shipped `ChatView` instead of a copy of it, so the frame that
    /// measures is the frame the reader sees.
    struct ChatLayoutPreview: View {
        /// One finished conversation with a title and a preview, no Host behind it.
        private static let fixture = SessionSummary(
            sessionId: "layout-preview",
            updatedAt: 0,
            running: false,
            blank: false,
            agentAvailable: true,
            parentSessionId: nil,
            formatStatus: nil,
            cwd: "/tmp/vera-rubin",
            origin: nil,
            projections: SessionSummary.Projections(
                kind: "chat",
                asOfSeq: 0,
                values: [
                    "title": .string("英伟达 Vera Rubin 供应链"),
                    "lastMessage": .string("两处必须提醒的口径差异"),
                ]
            )
        )

        var body: some View {
            // The shipped screen is pushed from a list inside the tab container,
            // which is where the bottom edge differs from a bare NavigationStack.
            TabView {
                NavigationStack {
                    Color.clear
                        .navigationTitle("会话")
                        .navigationDestination(isPresented: $pushed) {
                            ChatView(summary: Self.fixture)
                        }
                        .onAppear { pushed = true }
                }
                .tabItem { Label("会话", systemImage: "bubble.left.and.bubble.right") }
            }
            .toolbar(.hidden, for: .tabBar)
        }

        @State private var pushed = false
    }
#endif
