//
//  MermaidRenderer.swift
//  Tomato Remote
//
//  One web view draws every diagram, and each result is kept as an image and SVG.
//
//  A bundled Mermaid runtime is 3.4 MB of JavaScript; compiling it in a fresh
//  `WKWebView` for every diagram cost seconds and made the transcript hitch when
//  a diagram scrolled into view. This renderer loads the runtime once, renders
//  requests one at a time, and hands back a snapshot the transcript can draw
//  like any other image. The SVG is kept beside the snapshot so the diagram can
//  be opened at full size without a second parse.
//
//  The runtime is referenced by `render.html` instead of being injected as a
//  user script: an injected 3.4 MB script was copied on the main thread for
//  every warm-up and froze the UI for roughly half a second. The page also owns
//  a bounded load: a WebKit content process that dies before `didFinish` used to
//  leave every later diagram waiting on a continuation that could never resume.
//
//  Mermaid is the third-party renderer (v11.17.2, MIT, `mermaid.min.js` beside
//  this file). Its base theme is configured from the app tokens on every render,
//  so a diagram belongs to the page instead of arriving in Mermaid's purple
//  defaults, and a dark phone does not get a light diagram.
//

import SwiftUI
import UIKit
import WebKit

/// Draws Mermaid sources through a single shared web view.
@MainActor
final class MermaidRenderer: NSObject, WKNavigationDelegate {
    /// One rendered diagram: the raster for the transcript and the vector for
    /// full-screen reading.
    struct Diagram {
        let image: UIImage
        let height: CGFloat
        let svg: String
    }

    static let shared = MermaidRenderer()

    struct Key: Hashable {
        let source: String
        let width: Int
        let scheme: String
    }

    /// Diagrams kept; a transcript window can hold a dozen distinct diagrams and
    /// scrolling back through them must not re-render each one through the
    /// serialized WebView.
    private static let cacheLimit = 12
    /// Set once a diagram has rendered, so later launches may warm the runtime.
    private static let usedKey = "mermaid.hasRendered"
    /// Pixel multiplier of the snapshot. The vector carries full-screen zoom;
    /// 2x keeps the inline image crisp without tripling cache memory.
    private static let snapshotScale: CGFloat = 2
    /// A page that has not finished loading by then is replaced, not awaited
    /// forever. A frozen WebKit content process leaves no navigation callback.
    private static let loadTimeout: UInt64 = 8_000_000_000
    /// Tallest diagram the snapshot path will rasterize, in points. A malformed
    /// or very long diagram used to size a bitmap without a bound, which ended
    /// in a memory kill rather than an error row.
    private static let maximumDiagramHeight: CGFloat = 10000
    /// Pixels one snapshot may hold; beyond this the scale is reduced and the
    /// vector stays available in the full-screen reader.
    private static let maximumSnapshotPixels: Double = 8_000_000

    private var web: WKWebView?
    private var loadWaiters: [CheckedContinuation<Void, Never>] = []
    private var isLoading = false
    private var loadWatchdog: Task<Void, Never>?
    private var isBusy = false
    private var isWarming = false
    private var waiters: [CheckedContinuation<Void, Never>] = []
    private var renderCount = 0

    private var cache: [Key: Diagram] = [:]
    private var order: [Key] = []

    override private init() {
        super.init()
    }

    /// Cached result for one source at one width and appearance.
    /// - Parameters:
    ///   - source: Mermaid source.
    ///   - width: width the image was rendered at, in points.
    ///   - scheme: light or dark page the diagram was themed for.
    /// - Returns: the diagram, or nil when it has not been drawn yet.
    func cached(source: String, width: CGFloat, scheme: ColorScheme) -> Diagram? {
        cache[key(source: source, width: width, scheme: scheme)]
    }

    /// The most recently stored diagram for one source at any width or scheme.
    ///
    /// A row re-realized while scrolling knows its source before it knows its
    /// width, and painting the placeholder until `.task` reaches the cache is a
    /// visible flash plus a height jump. A diagram at a neighbouring width or
    /// theme carries the right height and reads as content, not as a gap.
    /// - Parameter source: Mermaid source.
    /// - Returns: the newest cached diagram for this source, or nil when none is
    ///   held.
    func cachedAnyWidth(source: String) -> Diagram? {
        order.last { $0.source == source }.flatMap { cache[$0] }
    }

    /// Load the runtime before a diagram asks for it, on a device that has used
    /// diagrams before. The first compile is seconds of latency; warming it
    /// while the reader browses the Session list removes that wait from the
    /// first chat they open.
    func warmIfUsedBefore() async {
        guard UserDefaults.standard.bool(forKey: Self.usedKey), !isWarming else { return }
        isWarming = true
        defer { isWarming = false }
        AppLog.debug(.ui, "Mermaid 预热开始")
        _ = await prepared(width: 340, scheme: .light)
        AppLog.debug(.ui, "Mermaid 预热完成")
    }

    /// Render one source, or return the cached result.
    /// - Parameters:
    ///   - source: Mermaid source.
    ///   - width: available width in points.
    ///   - scheme: light or dark appearance the diagram must match.
    /// - Returns: the image, height, and verified SVG, or nil when rendering failed.
    func diagram(source: String, width: CGFloat, scheme: ColorScheme) async -> Diagram? {
        let key = key(source: source, width: width, scheme: scheme)
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

        guard let web = await prepared(width: CGFloat(key.width), scheme: scheme),
              let rendered = await render(source, in: web, scheme: scheme)
        else { return nil }
        // A malformed diagram can report an arbitrarily large height. Clamping
        // keeps the raster bounded; the full-screen vector still shows all of it.
        let height = min(rendered.height, Self.maximumDiagramHeight)
        if height < rendered.height {
            AppLog.warning(
                .ui,
                "Mermaid 图过高，已截断",
                detail: "高 \(finiteInt(Double(rendered.height))) → \(finiteInt(Double(height)))"
            )
        }
        // A sequence diagram can be taller than the render view; grow the view
        // before the snapshot so `takeSnapshot` has the content in its bounds.
        if height + 40 > web.frame.height {
            web.frame.size.height = height + 40
            try? await Task.sleep(nanoseconds: 50_000_000)
        }
        guard let image = await snapshot(web, size: CGSize(width: CGFloat(key.width), height: height)) else {
            AppLog.warning(.ui, "Mermaid 截图失败", detail: "宽 \(key.width)")
            return nil
        }

        let diagram = Diagram(image: image, height: height, svg: rendered.svg)
        store(diagram, for: key)
        UserDefaults.standard.set(true, forKey: Self.usedKey)
        AppLog.debug(
            .ui,
            "Mermaid 渲染完成",
            detail: "宽 \(key.width) · 高 \(finiteInt(Double(rendered.height))) · 图 \(Int(image.size.width))×\(Int(image.size.height)) · \(key.scheme)"
        )
        return diagram
    }

    private func key(source: String, width: CGFloat, scheme: ColorScheme) -> Key {
        Key(
            source: source,
            width: max(120, Int(width.rounded())),
            scheme: scheme == .dark ? "dark" : "light"
        )
    }

    // MARK: Web view

    private func prepared(width: CGFloat, scheme: ColorScheme) async -> WKWebView? {
        if let web {
            web.frame.size.width = width
            web.frame.size.height = 1600
            return web
        }

        guard let page = Self.pageURL else {
            AppLog.warning(.ui, "Mermaid 运行时缺失")
            return nil
        }
        let started = CFAbsoluteTimeGetCurrent()
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        let web = WKWebView(frame: CGRect(x: 0, y: 0, width: width, height: 1600), configuration: configuration)
        let created = Self.milliseconds(since: started)
        AppLog.debug(.ui, "Mermaid 视图已创建", detail: "\(created) ms")
        web.isOpaque = false
        web.backgroundColor = .clear
        web.isUserInteractionEnabled = false
        web.alpha = 1
        // This view only produces snapshots; leaving its rendered SVG in the
        // accessibility tree made every UI-test query walk the whole diagram.
        web.isAccessibilityElement = false
        web.accessibilityElementsHidden = true
        web.navigationDelegate = self
        attach(web)

        self.web = web
        isLoading = true
        scheduleLoadWatchdog()
        web.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
        AppLog.debug(
            .ui,
            "Mermaid 页面已请求",
            detail: "\(Self.milliseconds(since: started)) ms · 创建 \(created) ms"
        )
        await withCheckedContinuation { continuation in
            if isLoading {
                loadWaiters.append(continuation)
            } else {
                continuation.resume()
            }
        }
        // A timeout or a dead content process dropped this view while the
        // caller waited; report failure so the row can offer a retry.
        guard self.web === web else { return nil }
        AppLog.debug(.ui, "Mermaid 页面加载完成", detail: "\(Self.milliseconds(since: started)) ms")
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

    private struct Rendered {
        let height: CGFloat
        let svg: String
    }

    private func render(_ source: String, in web: WKWebView, scheme: ColorScheme) async -> Rendered? {
        renderCount += 1
        let identifier = "tomato-\(renderCount)"
        do {
            let value = try await web.callAsyncJavaScript(
                "return await window.tomatoRender(id, source, config)",
                arguments: [
                    "id": identifier,
                    "source": source,
                    "config": MermaidTheme.configuration(scheme: scheme),
                ],
                in: nil,
                contentWorld: .page
            )
            guard let result = value as? [String: Any],
                  let height = result["height"] as? Double,
                  height > 0,
                  let svg = result["svg"] as? String,
                  !svg.isEmpty
            else {
                let reason = (value as? [String: Any])?["error"] as? String ?? "未知错误"
                AppLog.warning(.ui, "Mermaid 渲染失败", detail: reason)
                return nil
            }
            // The page pads the diagram by 8 points on each side; the snapshot
            // must include that padding or the rim is clipped.
            return Rendered(height: CGFloat(height + 16), svg: svg)
        } catch {
            // Throwing means the script world is gone (usually a content
            // process restart), not a bad diagram. Rebuild on the next retry
            // instead of asking a detached web view forever.
            AppLog.warning(.ui, "Mermaid 渲染失败，已重建", detail: error.localizedDescription)
            dropWebView()
            return nil
        }
    }

    private func snapshot(_ web: WKWebView, size: CGSize) async -> UIImage? {
        let configuration = WKSnapshotConfiguration()
        configuration.rect = CGRect(origin: .zero, size: size)
        configuration.snapshotWidth = NSNumber(value: Double(size.width * Self.snapshotScale(for: size)))
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
        finishLoad()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        AppLog.warning(.ui, "Mermaid 页面加载失败", detail: error.localizedDescription)
        finishLoad()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        AppLog.warning(.ui, "Mermaid 页面无法打开", detail: error.localizedDescription)
        finishLoad()
    }

    /// The content process ended; a detached web view can never render again.
    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        AppLog.warning(.ui, "Mermaid 渲染进程结束，已重建")
        dropWebView()
    }

    /// Settle the page waiters once.
    private func finishLoad() {
        loadWatchdog?.cancel()
        loadWatchdog = nil
        isLoading = false
        let waiters = loadWaiters
        loadWaiters = []
        for waiter in waiters {
            waiter.resume()
        }
    }

    // MARK: Page

    /// The bundled page, which references the runtime from the same directory.
    private static let pageURL = Bundle.main.url(forResource: "render", withExtension: "html")
}

// MARK: - Warm-up, sizing, and recovery

extension MermaidRenderer {
    /// Drop the cached snapshots, keeping the loaded runtime. A memory warning
    /// arrives while the transcript still needs the renderer; the next diagram
    /// redraws instead of the process being killed with several megabyte
    /// bitmaps it no longer shows.
    func releaseSnapshots() {
        cache.removeAll()
        order.removeAll()
        AppLog.debug(.ui, "Mermaid 快照已释放")
    }

    /// Bound one page load. The timer resumes the waiters itself, so a WebKit
    /// process that never answers cannot leave every later diagram blocked.
    private func scheduleLoadWatchdog() {
        loadWatchdog?.cancel()
        loadWatchdog = Task { @MainActor [weak self] in
            try? await Task.sleep(nanoseconds: Self.loadTimeout)
            guard let self, isLoading else { return }
            AppLog.warning(.ui, "Mermaid 页面加载超时，已重建")
            dropWebView()
        }
    }

    /// Give up on the current web view and answer every waiter.
    private func dropWebView() {
        loadWatchdog?.cancel()
        loadWatchdog = nil
        isLoading = false
        web?.stopLoading()
        web?.removeFromSuperview()
        web = nil
        let waiters = loadWaiters
        loadWaiters = []
        for waiter in waiters {
            waiter.resume()
        }
    }

    /// Elapsed milliseconds for a warm-up log line.
    /// - Parameter start: `CFAbsoluteTimeGetCurrent()` the step began at.
    /// - Returns: rounded elapsed milliseconds.
    private static func milliseconds(since start: CFAbsoluteTime) -> Int {
        Int(((CFAbsoluteTimeGetCurrent() - start) * 1000).rounded())
    }

    /// Snapshot scale that keeps one bitmap inside the pixel budget.
    /// - Parameter size: points the snapshot covers.
    /// - Returns: the configured scale, or the largest scale the budget allows.
    private static func snapshotScale(for size: CGSize) -> CGFloat {
        guard size.width > 0, size.height > 0 else { return 1 }
        let pixels = Double(size.width * size.height) * Double(snapshotScale * snapshotScale)
        guard pixels > maximumSnapshotPixels else { return snapshotScale }
        let scale = (maximumSnapshotPixels / Double(size.width * size.height)).squareRoot()
        return max(1, CGFloat(scale))
    }
}
