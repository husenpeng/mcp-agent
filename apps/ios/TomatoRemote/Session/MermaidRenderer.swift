//
//  MermaidRenderer.swift
//  Tomato Remote
//
//  One web view draws every diagram, and each result is kept as an image.
//
//  A bundled Mermaid runtime is 3.4 MB of JavaScript; compiling it in a fresh
//  `WKWebView` for every diagram cost seconds and made the transcript hitch when
//  a diagram scrolled into view. This renderer loads the runtime once, renders
//  requests one at a time, and hands back a snapshot the transcript can draw
//  like any other image.
//

import SwiftUI
import UIKit
import WebKit

/// Draws Mermaid sources through a single shared web view.
@MainActor
final class MermaidRenderer: NSObject, WKNavigationDelegate {
    /// One rendered diagram: the image and the height it needs.
    struct Diagram {
        let image: UIImage
        let height: CGFloat
    }

    static let shared = MermaidRenderer()

    private struct Key: Hashable {
        let source: String
        let width: Int
    }

    /// Diagrams kept; a transcript window holds far fewer distinct diagrams.
    private static let cacheLimit = 8
    /// Set once a diagram has rendered, so later launches may warm the runtime.
    private static let usedKey = "mermaid.hasRendered"

    private var web: WKWebView?
    private var loadWaiters: [CheckedContinuation<Void, Never>] = []
    private var isLoading = false
    private var isBusy = false
    private var waiters: [CheckedContinuation<Void, Never>] = []
    private var renderCount = 0

    private var cache: [Key: Diagram] = [:]
    private var order: [Key] = []

    override private init() {
        super.init()
    }

    /// Cached result for one source at one width.
    /// - Parameters:
    ///   - source: Mermaid source.
    ///   - width: width the image was rendered at, in points.
    /// - Returns: the diagram, or nil when it has not been drawn yet.
    func cached(source: String, width: CGFloat) -> Diagram? {
        cache[Key(source: source, width: Int(width.rounded()))]
    }

    /// Load the runtime before a diagram asks for it, on a device that has used
    /// diagrams before. The first compile is minutes-of-CPU-free but seconds of
    /// latency; warming it while the reader browses the Session list removes
    /// that wait from the first chat they open.
    func warmIfUsedBefore() async {
        guard UserDefaults.standard.bool(forKey: Self.usedKey) else { return }
        AppLog.debug(.ui, "Mermaid 预热开始")
        _ = await prepared(width: 340)
        AppLog.debug(.ui, "Mermaid 预热完成")
    }

    /// Render one source, or return the cached result.
    /// - Parameters:
    ///   - source: Mermaid source.
    ///   - width: available width in points.
    /// - Returns: the image and height, or nil when rendering failed.
    func diagram(source: String, width: CGFloat) async -> Diagram? {
        let key = Key(source: source, width: max(120, Int(width.rounded())))
        if let hit = cache[key] {
            return hit
        }

        await acquire()
        defer { release() }

        // Two rows can ask for the same diagram before the first result lands;
        // the second waits here, so it must look again instead of rendering it
        // twice.
        if let hit = cache[key] {
            return hit
        }

        guard let web = await prepared(width: CGFloat(key.width)), let rendered = await render(source, in: web) else { return nil }
        guard let image = await snapshot(web, size: CGSize(width: CGFloat(key.width), height: rendered)) else {
            AppLog.warning(.ui, "Mermaid 截图失败", detail: "宽 \(key.width)")
            return nil
        }

        let diagram = Diagram(image: image, height: rendered)
        store(diagram, for: key)
        UserDefaults.standard.set(true, forKey: Self.usedKey)
        AppLog.debug(
            .ui,
            "Mermaid 渲染完成",
            detail: "宽 \(key.width) · 高 \(Int(rendered)) · 图 \(Int(image.size.width))×\(Int(image.size.height))"
        )
        return diagram
    }

    // MARK: Web view

    private func prepared(width: CGFloat) async -> WKWebView? {
        if let web {
            web.frame.size.width = width
            web.frame.size.height = 1600
            return web
        }

        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        guard let script = Self.runtimeScript else {
            AppLog.warning(.ui, "Mermaid 运行时缺失")
            return nil
        }
        configuration.userContentController.addUserScript(script)

        let web = WKWebView(frame: CGRect(x: 0, y: 0, width: width, height: 1600), configuration: configuration)
        web.isOpaque = false
        web.backgroundColor = .clear
        web.isUserInteractionEnabled = false
        web.alpha = 1
        web.navigationDelegate = self
        attach(web)

        self.web = web
        isLoading = true
        web.loadHTMLString(Self.page, baseURL: nil)
        await withCheckedContinuation { continuation in
            if isLoading {
                loadWaiters.append(continuation)
            } else {
                continuation.resume()
            }
        }
        return web
    }

    /// Put the web view in a window so WebKit renders it; a detached view never
    /// produces a snapshot.
    /// - Parameter web: the renderer's web view.
    private func attach(_ web: WKWebView) {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        guard let window = scenes.flatMap(\.windows).first(where: \.isKeyWindow)
            ?? scenes.flatMap(\.windows).first
        else { return }
        window.addSubview(web)
        window.sendSubviewToBack(web)
    }

    private func render(_ source: String, in web: WKWebView) async -> CGFloat? {
        renderCount += 1
        let identifier = "tomato-\(renderCount)"
        let body = """
        const out = document.getElementById('out');
        out.innerHTML = '';
        try {
          const rendered = await mermaid.render(id, source);
          out.innerHTML = rendered.svg;
          const svg = out.querySelector('svg');
          if (svg) {
            // Mermaid fixes the SVG's pixel height from its own viewport; that
            // height no longer matches once the width is the phone's, so let
            // the aspect ratio drive it before measuring.
            svg.removeAttribute('height');
            svg.setAttribute('width', '100%');
            svg.style.height = 'auto';
            svg.style.maxWidth = '100%';
          }
          if (document.fonts && document.fonts.ready) { await document.fonts.ready; }
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          const height = Math.max(
            out.scrollHeight,
            out.getBoundingClientRect().height,
            svg ? svg.getBoundingClientRect().height : 0
          );
          return Math.ceil(height) + 120;
        } catch (error) {
          return -1;
        }
        """
        do {
            let value = try await web.callAsyncJavaScript(
                body,
                arguments: ["id": identifier, "source": source],
                in: nil,
                contentWorld: .page
            )
            guard let number = value as? Double, number > 0 else { return nil }
            return CGFloat(number + 16)
        } catch {
            AppLog.warning(.ui, "Mermaid 渲染失败", detail: error.localizedDescription)
            return nil
        }
    }

    private func snapshot(_ web: WKWebView, size: CGSize) async -> UIImage? {
        let configuration = WKSnapshotConfiguration()
        configuration.rect = CGRect(origin: .zero, size: size)
        configuration.snapshotWidth = NSNumber(value: Double(size.width))
        return try? await web.takeSnapshot(configuration: configuration)
    }

    // MARK: Cache

    private func store(_ diagram: Diagram, for key: Key) {
        cache[key] = diagram
        order.append(key)
        if order.count > Self.cacheLimit {
            for key in order.prefix(order.count - Self.cacheLimit) {
                cache[key] = nil
            }
            order.removeFirst(order.count - Self.cacheLimit)
        }
    }

    // MARK: Serialization

    private func acquire() async {
        if !isBusy {
            isBusy = true
            return
        }
        await withCheckedContinuation { waiters.append($0) }
    }

    private func release() {
        if waiters.isEmpty {
            isBusy = false
        } else {
            waiters.removeFirst().resume()
        }
    }

    // MARK: WKNavigationDelegate

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        isLoading = false
        let waiters = loadWaiters
        loadWaiters = []
        for waiter in waiters {
            waiter.resume()
        }
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        AppLog.warning(.ui, "Mermaid 页面加载失败", detail: error.localizedDescription)
        isLoading = false
        let waiters = loadWaiters
        loadWaiters = []
        for waiter in waiters {
            waiter.resume()
        }
    }

    // MARK: Page

    /// The runtime, read once and injected at document start.
    private static let runtimeScript: WKUserScript? = {
        guard let url = Bundle.main.url(forResource: "mermaid.min", withExtension: "js"),
              let text = try? String(contentsOf: url, encoding: .utf8)
        else { return nil }
        return WKUserScript(source: text, injectionTime: .atDocumentStart, forMainFrameOnly: true)
    }()

    private static let page = """
    <!doctype html><html><head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { margin: 0; padding: 8px; background: transparent; font-family: -apple-system; }
      #out svg { max-width: 100%; height: auto; }
    </style>
    </head><body><div id="out"></div></body></html>
    """
}
