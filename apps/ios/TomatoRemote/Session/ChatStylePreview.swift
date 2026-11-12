//
//  ChatStylePreview.swift
//  Tomato Remote
//
//  Debug-only harness for the conversation dock.
//
//  The real chat needs a paired Host. This preview puts the same composer over
//  a long transcript so the dock's height, its scroll-edge effect, and the
//  space left for the conversation can be inspected on a simulator with no
//  Host at all.
//

#if DEBUG
    import SwiftUI

    /// A long transcript under the real composer, for layout checks.
    struct ChatStylePreview: View {
        @State private var draft = ""
        @FocusState private var focused: Bool
        @State private var running = true

        var body: some View {
            NavigationStack {
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        ForEach(0 ..< 12, id: \.self) { index in
                            Text("第 \(index + 1) 段：这段文字用来检查底部输入框是否只占自己的高度，以及滚动区是否在输入框上方结束，而不是被一层玻璃盖住。")
                                .font(.body)
                                .foregroundStyle(TomatoToken.labelPrimary)
                                .padding(12)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                    }
                    .padding(20)
                }
                .tomatoScrollEdge()
                .tomatoBottomBar {
                    ComposerView(
                        text: $draft,
                        isFocused: $focused,
                        isRunning: running,
                        canSend: true,
                        hub: nil,
                        onSend: { _ in },
                        onCancel: { running = false },
                        modelTitle: "DeepSeek-V4.1-Flash-1017",
                        effortTitle: "最大",
                        effortIsActive: true,
                        onOpenModel: {},
                        onOpenReasoning: {}
                    )
                }
                .navigationTitle("对话样式")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar(.hidden, for: .tabBar)
            }
        }
    }
#endif