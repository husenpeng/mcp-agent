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
            guard let hub = model.hub else { return }
            await preview.load(hub: hub)
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
