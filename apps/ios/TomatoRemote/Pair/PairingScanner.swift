//
//  PairingScanner.swift
//  Tomato Remote
//
//  Camera reader for the pairing link the Desktop prints. The first QR payload
//  that parses as a pairing link fills the paste fields and closes the sheet, so
//  the phone never retypes a token by hand. Camera permission, an unavailable
//  camera (the simulator), and an unreadable code all report back on the sheet
//  instead of failing silently.
//

import AVFoundation
import SwiftUI

/// Sheet that scans one pairing QR code.
struct PairingScanner: View {
    let onScan: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var failure: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                if let failure {
                    Text(failure)
                        .font(.callout)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.white)
                        .padding(24)
                } else {
                    QRCaptureView(
                        onCode: { code in
                            onScan(code)
                            dismiss()
                        },
                        onFailure: { message in failure = message }
                    )
                    .ignoresSafeArea()
                    reticle
                }
            }
            .navigationTitle("扫描二维码")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                }
            }
        }
    }

    /// Bounds hint; the capture itself reads any QR inside the frame.
    private var reticle: some View {
        RoundedRectangle(cornerRadius: 16, style: .continuous)
            .strokeBorder(Color.white.opacity(0.8), lineWidth: 2)
            .frame(width: 220, height: 220)
    }
}

/// SwiftUI wrapper around the capture controller.
private struct QRCaptureView: UIViewControllerRepresentable {
    let onCode: (String) -> Void
    let onFailure: (String) -> Void

    func makeUIViewController(context: Context) -> QRCaptureController {
        let controller = QRCaptureController()
        controller.onCode = onCode
        controller.onFailure = onFailure
        return controller
    }

    func updateUIViewController(_ controller: QRCaptureController, context: Context) {}
}

/// Camera session that reports the first QR payload it reads.
final class QRCaptureController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    var onCode: ((String) -> Void)?
    var onFailure: ((String) -> Void)?

    private let session = AVCaptureSession()
    private let sessionQueue = DispatchQueue(label: "ai.tomato.remote.qr-session")
    private var reported = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            configure()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                DispatchQueue.main.async {
                    guard let self else { return }
                    if granted {
                        self.configure()
                    } else {
                        self.onFailure?("没有相机权限。到 设置 → Tomato Remote 打开相机，或手动粘贴配对链接。")
                    }
                }
            }
        default:
            onFailure?("没有相机权限。到 设置 → Tomato Remote 打开相机，或手动粘贴配对链接。")
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        let session = self.session
        sessionQueue.async { session.stopRunning() }
    }

    private func configure() {
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device)
        else {
            onFailure?("这台设备没有可用的相机，请手动粘贴配对链接。")
            return
        }
        session.beginConfiguration()
        if session.canAddInput(input) {
            session.addInput(input)
        }
        let output = AVCaptureMetadataOutput()
        if session.canAddOutput(output) {
            session.addOutput(output)
            output.setMetadataObjectsDelegate(self, queue: .main)
            output.metadataObjectTypes = [.qr]
        }
        session.commitConfiguration()

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.frame = view.bounds
        preview.videoGravity = .resizeAspectFill
        view.layer.addSublayer(preview)

        let session = self.session
        sessionQueue.async { session.startRunning() }
    }

    func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard !reported,
              let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let value = object.stringValue
        else { return }
        // The session keeps delivering frames while the sheet dismisses; one
        // payload is one pairing attempt.
        reported = true
        onCode?(value)
    }
}