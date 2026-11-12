//
//  ComposerView.swift
//  Tomato Remote
//
//  The input dock. Send while idle, stop while a turn runs.
//
//  A photo is downscaled and re-encoded here, before it reaches the wire: the
//  Host carries an image inline inside the prompt, so the phone decides the
//  bytes that count against the deployment's per-image limit.
//

import PhotosUI
import SwiftUI
import UIKit

struct ComposerView: View {
    @Binding var text: String
    /// Focus is owned by the conversation screen, which drops it when the
    /// reader scrolls, taps the transcript, or presses 完成.
    let isFocused: FocusState<Bool>.Binding
    let isRunning: Bool
    /// Whether a prompt can be queued at all. A dropped stream does not block
    /// sending: the prompt travels over HTTP and the stream only carries back
    /// the answer.
    let canSend: Bool
    /// Receives the staged photo, if any. A document is uploaded by the
    /// conversation screen before sending and travels by receipt instead.
    let onSend: ([Data]) -> Void
    let onCancel: () -> Void
    /// Called with a document the owner chose and whether its security scope
    /// was opened; the screen stages it and closes the scope when done.
    var onPickDocument: ((URL, Bool) -> Void)?
    /// Name of the document already staged, shown so the owner can drop it.
    var stagedDocument: String?
    var onRemoveDocument: (() -> Void)?
    /// Requests this conversation is waiting on, shown above the field.
    var pending: [PendingInteraction] = []
    var onAnswer: (() -> Void)?

    @State private var pickerItems: [PhotosPickerItem] = []
    @State private var pickedImages: [Data] = []
    @State private var attachError: String?
    @State private var showsImporter = false
    @StateObject private var dictation = VoiceDictation()

    /// Longest edge kept from a picked photo. Vision input loses nothing useful
    /// beyond this, and the Host counts the encoded bytes.
    private static let maximumEdge: CGFloat = 1568
    private static let jpegQuality: CGFloat = 0.8

    private var isReadyToSend: Bool {
        let hasText = !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        return canSend && (hasText || !pickedImages.isEmpty || stagedDocument != nil)
    }

    var body: some View {
        // The dock floats over the conversation rather than sitting under a
        // divider, so it carries the navigation layer's material instead of an
        // opaque page fill.
        VStack(spacing: 8) {
            if let first = pending.first {
                PendingBanner(interaction: first, count: pending.count) { onAnswer?() }
            }
            if let attachError {
                Text(attachError)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.stateErrorPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            if !pickedImages.isEmpty {
                HStack(spacing: 8) {
                    ForEach(Array(pickedImages.enumerated()), id: \.offset) { index, data in
                        attachmentChip(data) {
                            pickedImages.remove(at: index)
                        }
                    }
                    Spacer(minLength: 0)
                }
            }
            if let stagedDocument {
                documentChip(stagedDocument)
            }
            if let failure = dictation.failure {
                Text(failure)
                    .font(.caption)
                    .foregroundStyle(TomatoToken.stateErrorPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            // One container holds the field and both actions, the way chat
            // assistants draw their input: the whole capsule reads as the place
            // to type, and the send action sits inside it at the trailing edge.
            VStack(alignment: .leading, spacing: 6) {
                TextField("给 Tomato 发消息", text: $text, axis: .vertical)
                    .lineLimit(1 ... 6)
                    .focused(isFocused)
                    .font(.body)
                    .submitLabel(.send)
                    .onSubmit {
                        if isReadyToSend {
                            send()
                        }
                    }
                    .padding(.horizontal, 6)
                    .padding(.top, 4)
                    .accessibilityIdentifier("composer.input")
                HStack(spacing: 8) {
                    PhotosPicker(selection: $pickerItems, maxSelectionCount: 6, matching: .images) {
                        Image(systemName: "photo.on.rectangle")
                            .font(.body)
                            .foregroundStyle(TomatoToken.labelSecondary)
                            .frame(width: 34, height: 34)
                            .contentShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("附加照片")

                    Button {
                        showsImporter = true
                    } label: {
                        Image(systemName: "paperclip")
                            .font(.body)
                            .foregroundStyle(TomatoToken.labelSecondary)
                            .frame(width: 34, height: 34)
                            .contentShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("附加文档")

                    Button {
                        toggleDictation()
                    } label: {
                        Image(systemName: dictation.isListening ? "waveform.circle.fill" : "mic")
                            .font(.body)
                            .foregroundStyle(dictation.isListening ? TomatoToken.brandPrimary : TomatoToken.labelSecondary)
                            .frame(width: 34, height: 34)
                            .contentShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel(dictation.isListening ? "结束听写" : "语音输入")
                    .accessibilityIdentifier("composer.mic")

                    Spacer(minLength: 0)
                    actionButton
                }
            }
            .padding(8)
            .tomatoGlass(in: RoundedRectangle(cornerRadius: 24, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 24, style: .continuous)
                    .strokeBorder(isFocused.wrappedValue ? TomatoToken.brandPrimary.opacity(0.35) : Color.clear, lineWidth: 1)
            )
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        // A test run may start dictation without a tap, so the microphone path
        // can be observed on a device that automation cannot touch.
        .task {
            #if DEBUG
                guard ProcessInfo.processInfo.arguments.contains("-TOMATO_DICTATE"),
                      !dictation.isListening
                else { return }
                toggleDictation()
            #endif
        }
        .onChange(of: pickerItems) { _, items in
            guard !items.isEmpty else { return }
            let picked = items
            pickerItems = []
            Task {
                for item in picked {
                    await load(item)
                }
            }
        }
        // The dock carries no identifier of its own: an identifier on a container
        // replaces every child's, which left the field, the send control, and the
        // attachment buttons unreachable for a test run and for VoiceOver.
        .fileImporter(
            isPresented: $showsImporter,
            allowedContentTypes: [.pdf, .plainText, .spreadsheet, .presentation, .image, .data],
            allowsMultipleSelection: false
        ) { result in
            guard case let .success(urls) = result, let url = urls.first else { return }
            // A document outside the app's container arrives security-scoped.
            // Access stays open through the upload, which runs after this
            // callback returns.
            let accessed = url.startAccessingSecurityScopedResource()
            onPickDocument?(url, accessed)
        }
    }

    /// Send while idle, stop while a turn runs.
    @ViewBuilder
    private var actionButton: some View {
        if isRunning {
            Button(action: onCancel) {
                Image(systemName: "stop.fill")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(Color.white)
                    .frame(width: 34, height: 34)
                    .background(TomatoToken.labelPrimary, in: Circle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("停止")
            .accessibilityIdentifier("composer.stop")
        } else {
            Button(action: send) {
                Image(systemName: "arrow.up")
                    .font(.footnote.weight(.bold))
                    .foregroundStyle(isReadyToSend ? Color.white : TomatoToken.labelTertiary)
                    .frame(width: 34, height: 34)
                    .background(isReadyToSend ? TomatoToken.buttonPrimaryFill : TomatoToken.bgLayer3, in: Circle())
            }
            .buttonStyle(.plain)
            .disabled(!isReadyToSend)
            .accessibilityLabel("发送")
            .accessibilityIdentifier("composer.send")
        }
    }

    /// Staged document, shown by name so the owner knows what rides along.
    private func documentChip(_ name: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "doc")
                .font(.footnote)
                .foregroundStyle(TomatoToken.brandPrimary)
            Text(name)
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
                .lineLimit(1)
            Spacer(minLength: 0)
            Button {
                onRemoveDocument?()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("移除文档")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    /// Start or stop dictation, writing the transcript into the field.
    private func toggleDictation() {
        if dictation.isListening {
            dictation.stop()
            return
        }
        let typed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        dictation.start(onText: { transcript in
            text = typed.isEmpty ? transcript : "\(typed) \(transcript)"
        }, onFinish: {})
    }

    /// Staged-photo preview with its size and a way to drop it.
    /// @param data - JPEG bytes of one staged photo.
    /// @param remove - drops this photo from the staged set.
    private func attachmentChip(_ data: Data, remove: @escaping () -> Void) -> some View {
        HStack(spacing: 10) {
            if let image = UIImage(data: data) {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 44, height: 44)
                    .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
            }
            Text("照片 · \(byteCount(data.count))")
                .font(.caption)
                .foregroundStyle(TomatoToken.labelCaption)
            Spacer()
            Button(action: remove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("移除照片")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func send() {
        UIImpactFeedbackGenerator(style: .rigid).impactOccurred()
        let images = pickedImages
        pickedImages = []
        pickerItems = []
        attachError = nil
        onSend(images)
    }

    /// Load, downscale, and re-encode one picked photo.
    /// @param item - the Photos picker selection.
    private func load(_ item: PhotosPickerItem) async {
        attachError = nil
        do {
            guard let original = try await item.loadTransferable(type: Data.self),
                  let source = UIImage(data: original)
            else {
                attachError = "无法读取这张照片"
                return
            }
            guard let encoded = Self.prepare(source) else {
                attachError = "无法压缩这张照片"
                return
            }
            pickedImages.append(encoded)
        } catch {
            attachError = describe(error)
        }
    }

    /// Downscale to `maximumEdge` and re-encode as JPEG.
    /// @param image - the decoded photo.
    /// @returns JPEG bytes, or nil when encoding fails.
    static func prepare(_ image: UIImage) -> Data? {
        let longest = max(image.size.width, image.size.height)
        let scale = longest > maximumEdge ? maximumEdge / longest : 1
        let target = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        let resized = UIGraphicsImageRenderer(size: target, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
        return resized.jpegData(compressionQuality: jpegQuality)
    }

    private func byteCount(_ bytes: Int) -> String {
        ByteCountFormatter.string(fromByteCount: Int64(bytes), countStyle: .file)
    }
}
