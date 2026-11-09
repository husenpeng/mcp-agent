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
    let isRunning: Bool
    let isConnected: Bool
    let onSend: (Data?) -> Void
    let onCancel: () -> Void

    @FocusState private var focused: Bool

    @State private var pickerItem: PhotosPickerItem?
    @State private var pickedImage: Data?
    @State private var attachError: String?

    /// Longest edge kept from a picked photo. Vision input loses nothing useful
    /// beyond this, and the Host counts the encoded bytes.
    private static let maximumEdge: CGFloat = 1_568
    private static let jpegQuality: CGFloat = 0.8

    private var canSend: Bool {
        let hasText = !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        return isConnected && (hasText || pickedImage != nil)
    }

    var body: some View {
        VStack(spacing: 0) {
            Divider().overlay(TomatoToken.borderL1)
            VStack(spacing: 8) {
                if let attachError {
                    Text(attachError)
                        .font(.caption)
                        .foregroundStyle(TomatoToken.stateErrorPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                if let pickedImage {
                    attachmentChip(pickedImage)
                }
                HStack(alignment: .bottom, spacing: 8) {
                    PhotosPicker(selection: $pickerItem, matching: .images) {
                        Image(systemName: "photo")
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(TomatoToken.labelCaption)
                            .frame(width: 36, height: 36)
                            .background(TomatoToken.bgLayer2)
                            .clipShape(Circle())
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("附加照片")

                    TextField("说点什么…", text: $text, axis: .vertical)
                        .lineLimit(1...6)
                        .focused($focused)
                        .font(.callout)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(TomatoToken.bgLayer2)
                        .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.lg, style: .continuous))

                    if isRunning {
                        Button(action: onCancel) {
                            Image(systemName: "stop.fill")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(Color.white)
                                .frame(width: 36, height: 36)
                                .background(TomatoToken.buttonPrimaryFill)
                                .clipShape(Circle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("停止")
                    } else {
                        Button(action: send) {
                            Image(systemName: "arrow.up")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(canSend ? Color.white : TomatoToken.labelDimmed)
                                .frame(width: 36, height: 36)
                                .background(canSend ? TomatoToken.buttonPrimaryFill : TomatoToken.bgLayer3)
                                .clipShape(Circle())
                        }
                        .buttonStyle(.plain)
                        .disabled(!canSend)
                        .accessibilityLabel("发送")
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .background(TomatoToken.bgBase)
        .onChange(of: pickerItem) { _, item in
            guard let item else { return }
            Task { await load(item) }
        }
    }

    /// Staged-photo preview with its size and a way to drop it.
    @ViewBuilder
    private func attachmentChip(_ data: Data) -> some View {
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
            Button {
                pickedImage = nil
                pickerItem = nil
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(TomatoToken.labelDimmed)
            }
            .buttonStyle(.plain)
            .accessibilityLabel("移除照片")
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func send() {
        let image = pickedImage
        pickedImage = nil
        pickerItem = nil
        attachError = nil
        onSend(image)
    }

    /// Load, downscale, and re-encode one picked photo.
    /// @param item - the Photos picker selection.
    private func load(_ item: PhotosPickerItem) async {
        attachError = nil
        do {
            guard let original = try await item.loadTransferable(type: Data.self),
                  let source = UIImage(data: original) else {
                attachError = "无法读取这张照片"
                return
            }
            guard let encoded = Self.prepare(source) else {
                attachError = "无法压缩这张照片"
                return
            }
            pickedImage = encoded
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