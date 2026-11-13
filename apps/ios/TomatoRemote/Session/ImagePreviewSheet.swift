//
//  ImagePreviewSheet.swift
//  Tomato Remote
//
//  One photo of the conversation, full screen.
//
//  The transcript already holds the decoded thumbnail; this sheet shows it
//  against black, where a screenshot's colours read the way they do on the Mac.
//

import SwiftUI

struct ImagePreviewSheet: View {
    let image: UIImage
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            Color.black
                .ignoresSafeArea()
            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .padding(12)
        }
        .contentShape(Rectangle())
        .onTapGesture { dismiss() }
        .overlay(alignment: .topTrailing) {
            Button { dismiss() } label: {
                Image(systemName: "xmark")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.white)
                    .frame(width: 34, height: 34)
                    .background(.white.opacity(0.16), in: Circle())
                    .contentShape(Circle())
            }
            .buttonStyle(.plain)
            .padding(16)
            .accessibilityLabel("关闭")
            .accessibilityIdentifier("image.preview.close")
        }
        // The sheet is a container so the close control keeps its own identity;
        // a bare identifier here would rename it too.
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("image.preview")
    }
}
