//
//  MermaidView.swift
//  Tomato Remote
//
//  One diagram, drawn by the shared renderer, and the full-screen reader.
//
//  The runtime ships inside the app: a diagram must draw on a plane or a train
//  without a network round trip, and the answer text never leaves the device to
//  be rendered. `MermaidRenderer` keeps one web view and returns a snapshot, so
//  scrolling the transcript never starts another 3.4 MB JavaScript compile.
//  A tap opens the vector at full size, where `svg-pan-zoom` (3.6.2, MIT, shipped
//  beside the Mermaid runtime) gives pinch zoom, drag, and double-tap zoom.
//

import SwiftUI
import UIKit
import WebKit

/// Renders one Mermaid source into the transcript.
struct MermaidView: View {
    let source: String

    @Environment(\.colorScheme) private var scheme
    @State private var diagram: MermaidRenderer.Diagram?
    @State private var failed = false
    @State private var width: CGFloat = 0
    @State private var showsFull = false
    /// Bumped by the retry control so a failed render can be asked for again.
    @State private var attempt = 0

    /// Seed the diagram from the shared cache so a row re-realized while
    /// scrolling paints content on its first frame instead of the placeholder.
    /// - Parameter source: Mermaid source to draw.
    @MainActor
    init(source: String) {
        self.source = source
        _diagram = State(initialValue: MermaidRenderer.shared.cachedAnyWidth(source: source))
    }

    var body: some View {
        content
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                GeometryReader { proxy in
                    Color.clear.preference(key: MermaidWidthKey.self, value: proxy.size.width)
                }
            )
            .onPreferenceChange(MermaidWidthKey.self) { value in
                if abs(value - width) > 1 {
                    width = value
                }
            }
            .task(id: "\(Int(width.rounded()))-\(scheme == .dark ? "dark" : "light")-\(attempt)") {
                await load()
            }
            .fullScreenCover(isPresented: $showsFull) {
                if let diagram {
                    MermaidDiagramSheet(source: source, svg: diagram.svg)
                }
            }
    }

    @ViewBuilder
    private var content: some View {
        if let diagram {
            Button {
                showsFull = true
            } label: {
                Image(uiImage: diagram.image)
                    .resizable()
                    .scaledToFit()
                    .frame(width: width > 0 ? width : nil, height: diagram.height)
                    .frame(maxWidth: .infinity)
                    .overlay(alignment: .topTrailing) {
                        Image(systemName: "arrow.up.left.and.arrow.down.right")
                            .font(.system(size: 10, weight: .semibold))
                            .foregroundStyle(TomatoToken.labelCaption)
                            .frame(width: 24, height: 24)
                            .tomatoGlass(in: Circle())
                            .padding(6)
                    }
                    .contentShape(Rectangle())
            }
            .buttonStyle(TomatoPressableStyle())
            .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous)
                    .strokeBorder(TomatoToken.borderL1, lineWidth: 1)
            )
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("流程图")
            .accessibilityHint("双击查看大图")
        } else if failed {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.stateWarnPrimary)
                    Text("这张图暂时画不出来，下面保留源码。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                    Spacer(minLength: 4)
                    Button("重试") {
                        failed = false
                        attempt += 1
                    }
                    .font(.caption.weight(.medium))
                    .foregroundStyle(TomatoToken.brandPrimary)
                }
                CodeBlock(language: "mermaid", source: source)
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel("流程图源码")
        } else {
            ZStack {
                TomatoToken.bgLayer2
                HStack(spacing: 6) {
                    ProgressView()
                        .controlSize(.mini)
                    Text("正在画图…")
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelCaption)
                }
            }
            .frame(height: 120)
            .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous)
                    .strokeBorder(TomatoToken.borderL1, lineWidth: 1)
            )
            .accessibilityLabel("正在渲染流程图")
        }
    }

    /// Ask the shared renderer for this diagram at the width it must fill.
    @MainActor
    private func load() async {
        guard width > 80 else { return }
        if let cached = MermaidRenderer.shared.cached(source: source, width: width, scheme: scheme) {
            diagram = cached
            failed = false
            openFullScreenIfAsked()
            return
        }
        diagram = nil
        if let rendered = await MermaidRenderer.shared.diagram(source: source, width: width, scheme: scheme) {
            diagram = rendered
            failed = false
            openFullScreenIfAsked()
        } else {
            failed = true
        }
    }

    /// Present the full-screen reader for a design run, so the pan/zoom surface
    /// can be inspected without a tap. Present only with
    /// `-TOMATO_MERMAID_FULLSCREEN`; a release build never reaches this.
    private func openFullScreenIfAsked() {
        #if DEBUG
            if ProcessInfo.processInfo.arguments.contains("-TOMATO_MERMAID_FULLSCREEN") {
                showsFull = true
            }
        #endif
    }
}

/// The width the row offers a diagram.
private struct MermaidWidthKey: PreferenceKey {
    static var defaultValue: CGFloat = 0

    static func reduce(value: inout CGFloat, nextValue: () -> CGFloat) {
        value = max(value, nextValue())
    }
}

// MARK: - Full screen

/// The diagram at full size, drawn as vector.
///
/// A raster snapshot cannot be read once a sequence diagram is four screens
/// tall; the same SVG the renderer produced is inserted into a web view and
/// driven by `svg-pan-zoom`, so text stays sharp at every scale.
struct MermaidDiagramSheet: View {
    let source: String
    let svg: String

    @Environment(\.dismiss) private var dismiss
    @StateObject private var controller = MermaidCanvasController()

    var body: some View {
        ZStack {
            TomatoToken.bgBase.ignoresSafeArea()
            if svg.isEmpty {
                VStack(spacing: 8) {
                    ProgressView()
                    Text("这张图暂时画不出来。")
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelCaption)
                }
            } else {
                MermaidSVGCanvas(svg: svg, controller: controller)
                    .ignoresSafeArea(edges: .bottom)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("流程图，可双指缩放")
                    .accessibilityIdentifier("mermaid.canvas")
            }
        }
        .overlay(alignment: .top) {
            header
        }
        .overlay(alignment: .bottom) {
            Text("双指缩放 · 拖动查看")
                .font(.caption2)
                .foregroundStyle(TomatoToken.labelDimmed)
                .padding(.horizontal, 10)
                .padding(.vertical, 5)
                .tomatoGlass(in: Capsule())
                .padding(.bottom, 14)
                .allowsHitTesting(false)
        }
    }

    private var header: some View {
        HStack(spacing: 8) {
            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .frame(width: 32, height: 32)
                    .tomatoGlass(in: Circle())
                    // The glass circle stays 32 pt; the touch target meets 44 pt.
                    .contentShape(Circle().inset(by: -6))
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("关闭")
            .accessibilityIdentifier("mermaid.close")

            Text("流程图")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(TomatoToken.labelPrimary)

            Spacer(minLength: 0)

            Button {
                UIPasteboard.general.string = source
            } label: {
                Image(systemName: "doc.on.doc")
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .frame(width: 32, height: 32)
                    .tomatoGlass(in: Circle())
                    // The glass circle stays 32 pt; the touch target meets 44 pt.
                    .contentShape(Circle().inset(by: -6))
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("复制源码")
            .accessibilityIdentifier("mermaid.copy")

            Button {
                controller.fit()
            } label: {
                Image(systemName: "arrow.up.left.and.arrow.down.right")
                    .font(.footnote)
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .frame(width: 32, height: 32)
                    .tomatoGlass(in: Circle())
                    // The glass circle stays 32 pt; the touch target meets 44 pt.
                    .contentShape(Circle().inset(by: -6))
            }
            .buttonStyle(TomatoPressableStyle())
            .accessibilityLabel("适应屏幕")
            .accessibilityIdentifier("mermaid.fit")
        }
        .padding(.horizontal, 16)
        .padding(.top, 8)
        .padding(.bottom, 6)
        .background(.ultraThinMaterial)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(TomatoToken.borderL1)
                .frame(height: 0.5)
        }
    }
}

/// Owns the full-screen web view so a SwiftUI control can ask it to fit.
@MainActor
final class MermaidCanvasController: ObservableObject {
    weak var web: WKWebView?

    /// Fit the diagram to the screen and center it.
    func fit() {
        web?.evaluateJavaScript("window.tomatoFit && window.tomatoFit()")
    }
}

/// A web view holding one SVG, panned and zoomed by `svg-pan-zoom`.
private struct MermaidSVGCanvas: UIViewRepresentable {
    let svg: String
    let controller: MermaidCanvasController

    func makeCoordinator() -> Coordinator {
        Coordinator(svg: svg, controller: controller)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.userContentController.add(context.coordinator, name: Self.messageName)
        let web = WKWebView(frame: .zero, configuration: configuration)
        web.isOpaque = false
        web.backgroundColor = .clear
        // The surface is read by looking at it; its SVG text is not a second
        // transcript, and leaving hundreds of text nodes in the accessibility
        // tree made XCUITest snapshots of this screen very expensive.
        web.isAccessibilityElement = false
        web.accessibilityElementsHidden = true
        web.navigationDelegate = context.coordinator
        // svg-pan-zoom reads the touches; WebKit's own scroll view would steal
        // the pinch and leave the diagram stuck at 100%.
        web.scrollView.isScrollEnabled = false
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.scrollView.bounces = false
        controller.web = web
        web.loadHTMLString(Self.page, baseURL: nil)
        return web
    }

    func updateUIView(_ web: WKWebView, context: Context) {
        guard context.coordinator.svg != svg else { return }
        context.coordinator.svg = svg
        context.coordinator.insert(web)
    }

    static func dismantleUIView(_ web: WKWebView, coordinator: Coordinator) {
        coordinator.controller.web = nil
        web.configuration.userContentController.removeScriptMessageHandler(forName: messageName)
        web.stopLoading()
    }

    /// Loader that waits for the page and then hands the SVG to the runtime.
    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        var svg: String
        let controller: MermaidCanvasController
        private var isReady = false

        init(svg: String, controller: MermaidCanvasController) {
            self.svg = svg
            self.controller = controller
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            isReady = true
            insert(webView)
        }

        /// Record whether the pan/zoom runtime started; a static SVG still reads,
        /// but a silent failure would leave the gesture hint lying.
        func userContentController(
            _ userContentController: WKUserContentController,
            didReceive message: WKScriptMessage
        ) {
            guard let body = message.body as? [String: Any] else { return }
            if body["ready"] as? Bool == true {
                AppLog.debug(.ui, "Mermaid 全屏缩放就绪")
            } else {
                let reason = body["error"] as? String ?? "未知错误"
                AppLog.warning(.ui, "Mermaid 全屏缩放不可用", detail: reason)
            }
        }

        /// Put the SVG in the stage and start the pan/zoom runtime.
        /// - Parameter web: the full-screen web view.
        func insert(_ web: WKWebView) {
            guard isReady, !svg.isEmpty else { return }
            let svg = svg
            Task { @MainActor in
                do {
                    _ = try await web.callAsyncJavaScript(
                        "window.tomatoInsert(svg)",
                        arguments: ["svg": svg],
                        in: nil,
                        contentWorld: .page
                    )
                } catch {
                    AppLog.warning(.ui, "Mermaid 全屏显示失败", detail: error.localizedDescription)
                }
            }
        }
    }

    /// The static page: the bundled pan/zoom runtime plus one empty stage.
    /// - Returns: HTML the web view can load without reading the network.
    private static let page = """
    <!doctype html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
      html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: transparent; }
      #stage { position: absolute; inset: 0; }
      #stage svg { width: 100%; height: 100%; display: block; }
    </style>
    </head><body><div id="stage"></div>
    <script>\(panZoomScript)</script>
    <script>
      const notify = function (message) {
        try { window.webkit.messageHandlers.mermaid.postMessage(message); } catch (error) {}
      };
      window.tomatoInsert = function (svg) {
        const stage = document.getElementById('stage');
        stage.innerHTML = svg;
        const diagram = stage.querySelector('svg');
        if (!diagram) { return; }
        diagram.removeAttribute('width');
        diagram.removeAttribute('height');
        diagram.style.width = '100%';
        diagram.style.height = '100%';
        try {
          if (window.tomatoPZ) { window.tomatoPZ.destroy(); }
          window.tomatoPZ = svgPanZoom(diagram, {
            fit: true,
            center: true,
            minZoom: 0.4,
            maxZoom: 24,
            zoomScaleSensitivity: 0.35,
            dblClickZoomEnabled: true,
            mouseWheelZoomEnabled: true,
            preventMouseEventsDefault: true,
            controlIconsEnabled: false
          });
          window.tomatoFit = function () {
            if (!window.tomatoPZ) { return; }
            window.tomatoPZ.resize();
            window.tomatoPZ.fit();
            window.tomatoPZ.center();
          };
          notify({ ready: true });
        } catch (error) {
          window.tomatoPZ = null;
          window.tomatoFit = function () {};
          notify({ ready: false, error: String(error) });
        }
      };
      window.addEventListener('resize', function () { window.tomatoFit && window.tomatoFit(); });
    </script>
    </body></html>
    """

    /// Script-message channel the page reports its pan/zoom state on.
    private static let messageName = "mermaid"

    /// The vendored runtime; an empty string leaves a readable static SVG.
    private static let panZoomScript: String = {
        guard let url = Bundle.main.url(forResource: "svg-pan-zoom.min", withExtension: "js"),
              let text = try? String(contentsOf: url, encoding: .utf8)
        else { return "" }
        return text
    }()
}
