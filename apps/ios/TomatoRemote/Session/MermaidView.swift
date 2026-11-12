//
//  MermaidView.swift
//  Tomato Remote
//
//  One diagram, drawn by the shared renderer.
//
//  The runtime ships inside the app: a diagram must draw on a plane or a train
//  without a network round trip, and the answer text never leaves the device to
//  be rendered. `MermaidRenderer` keeps one web view and returns a snapshot, so
//  scrolling the transcript never starts another 3.4 MB JavaScript compile.
//

import SwiftUI

/// Renders one Mermaid source into the transcript.
struct MermaidView: View {
    let source: String

    @State private var image: UIImage?
    @State private var height: CGFloat = 180
    @State private var failed = false

    var body: some View {
        GeometryReader { proxy in
            content(width: proxy.size.width)
                .task(id: Int(proxy.size.width.rounded())) {
                    await load(width: proxy.size.width)
                }
        }
        .frame(height: height)
        .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous)
                .strokeBorder(TomatoToken.borderL1, lineWidth: 1)
        )
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("流程图")
        .accessibilityIdentifier("markdown.mermaid")
    }

    @ViewBuilder
    private func content(width: CGFloat) -> some View {
        if let image {
            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .frame(width: width, height: height)
        } else if failed {
            VStack(spacing: 4) {
                Text("这张图暂时画不出来。")
                    .font(.caption)
                    .foregroundStyle(TomatoToken.labelCaption)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(TomatoToken.bgLayer2)
        } else {
            ZStack {
                TomatoToken.bgLayer2
                ProgressView()
                    .controlSize(.small)
            }
        }
    }

    /// Ask the shared renderer for this diagram at the width it must fill.
    /// - Parameter width: width the row offers.
    @MainActor
    private func load(width: CGFloat) async {
        guard width > 80 else { return }
        if let cached = MermaidRenderer.shared.cached(source: source, width: width) {
            image = cached.image
            height = cached.height
            failed = false
            return
        }
        image = nil
        if let diagram = await MermaidRenderer.shared.diagram(source: source, width: width) {
            image = diagram.image
            height = diagram.height
            failed = false
        } else {
            failed = true
            height = 60
        }
    }
}
