//
//  FilePreviewSheet.swift
//  Tomato Remote
//
//  Open a file the Agent produced, on the phone.
//
//  The bytes come over the Host's plain file route rather than the Remote byte
//  method: that method answers multipart attachments, which this client does not
//  reassemble, while the route streams a real file. QuickLook then renders Word,
//  Excel, PowerPoint, PDF, and images without the Host converting anything.
//

import QuickLook
import SwiftUI

/// Downloads one file once and hands the local copy to QuickLook.
@MainActor
final class FilePreviewModel: ObservableObject {
    enum State: Equatable {
        case loading
        case ready(URL)
        case failed(String)
    }

    @Published private(set) var state: State = .loading
    let file: DeliveredFile

    /// @param file - the presented file to open.
    init(file: DeliveredFile) {
        self.file = file
    }

    /// Fetch the bytes into a temporary file QuickLook can read.
    /// - Parameter hub: client for the paired Host.
    func load(hub: HubClient) async {
        guard case .loading = state else { return }
        do {
            let (data, _) = try await hub.download(path: file.path)
            let folder = FileManager.default.temporaryDirectory.appendingPathComponent("TomatoPreview", isDirectory: true)
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let target = folder.appendingPathComponent(file.name.isEmpty ? "file" : file.name)
            try data.write(to: target, options: .atomic)
            state = .ready(target)
        } catch let error as HubError {
            state = .failed(error.errorDescription ?? "下载失败")
        } catch {
            state = .failed(describe(error))
        }
    }

    /// Report why bytes cannot arrive, in place of the loading spinner.
    /// - Parameter message: reason the sheet shows.
    func fail(_ message: String) {
        guard case .loading = state else { return }
        state = .failed(message)
    }
}

struct FilePreviewSheet: View {
    @EnvironmentObject private var model: AppModel
    @StateObject private var preview: FilePreviewModel
    @Environment(\.dismiss) private var dismiss

    init(file: DeliveredFile) {
        _preview = StateObject(wrappedValue: FilePreviewModel(file: file))
    }

    var body: some View {
        NavigationStack {
            Group {
                switch preview.state {
                case .loading:
                    ProgressView("正在从 Mac 取文件…")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                case let .ready(url):
                    QuickLookView(url: url)
                        .ignoresSafeArea(edges: .bottom)
                case let .failed(message):
                    EmptyPlaceholder(systemImage: "exclamationmark.triangle", title: "打不开这个文件", detail: message)
                }
            }
            .background(TomatoToken.bgBase)
            .navigationTitle(preview.file.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完成") { dismiss() }
                }
            }
        }
        .task {
            guard let hub = model.hub else {
                preview.fail("未连接 Mac，无法读取这个文件。")
                return
            }
            await preview.load(hub: hub)
        }
    }
}

/// QuickLook over bytes the app already holds.
///
/// The composer stages a document by uploading it to the Host, whose receipt
/// does not serve the contents back. The bytes stay here while the chip is
/// staged, so tapping the chip opens the local copy instead of a download that
/// has nothing to name.
struct LocalFilePreviewSheet: View {
    let name: String
    let data: Data
    @Environment(\.dismiss) private var dismiss
    @State private var file: URL?
    @State private var failure: String?

    var body: some View {
        NavigationStack {
            Group {
                if let file {
                    QuickLookView(url: file)
                        .ignoresSafeArea(edges: .bottom)
                } else if let failure {
                    EmptyPlaceholder(systemImage: "exclamationmark.triangle", title: "打不开这个文件", detail: failure)
                } else {
                    ProgressView("正在准备预览…")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .background(TomatoToken.bgBase)
            .navigationTitle(name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完成") { dismiss() }
                }
            }
        }
        .task { await prepare() }
    }

    /// Write the held bytes where QuickLook can read them.
    ///
    /// A staged PDF can be several megabytes, so the write and directory setup
    /// stay off the main thread; the sheet shows its spinner until they land.
    private func prepare() async {
        guard file == nil, failure == nil else { return }
        do {
            let target = try await Task.detached(priority: .userInitiated) {
                let folder = FileManager.default.temporaryDirectory
                    .appendingPathComponent("TomatoStaged/\(UUID().uuidString)", isDirectory: true)
                try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
                let leaf = URL(fileURLWithPath: name).lastPathComponent
                let target = folder.appendingPathComponent(leaf.isEmpty ? "file" : leaf)
                try data.write(to: target, options: .atomic)
                return target
            }.value
            file = target
        } catch {
            failure = describe(error)
        }
    }
}

/// The QuickLook controller, wrapped for SwiftUI.
private struct QuickLookView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> QLPreviewController {
        let controller = QLPreviewController()
        controller.dataSource = context.coordinator
        return controller
    }

    func updateUIViewController(_ controller: QLPreviewController, context: Context) {
        controller.reloadData()
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(url: url)
    }

    final class Coordinator: NSObject, QLPreviewControllerDataSource {
        let url: URL

        init(url: URL) {
            self.url = url
        }

        func numberOfPreviewItems(in controller: QLPreviewController) -> Int {
            1
        }

        func previewController(_ controller: QLPreviewController, previewItemAt index: Int) -> any QLPreviewItem {
            url as NSURL
        }
    }
}
