//
//  MessageRows.swift
//  Tomato Remote
//
//  The two speakers of a transcript, drawn so they never look alike.
//

import SwiftUI
import UIKit

/// The speaker's text, rendered block by block.
///
/// The Desktop renders answers through a Markdown pipeline; this view draws the
/// same kinds — headings, lists, quotes, code, diagrams — at a phone reading
/// size instead of one oversized text run.
struct MarkdownText: View {
    let text: String
    var lineSpacing: CGFloat = 4

    var body: some View {
        MarkdownView(text: text)
    }
}

struct AssistantRow: View {
    let text: String
    let pending: Bool

    var body: some View {
        // The answer sits on a page-colored card with a leading accent, so the
        // two speakers can be told apart without reading the labels.
        HStack(alignment: .top, spacing: 0) {
            RoundedRectangle(cornerRadius: 1.5, style: .continuous)
                .fill(TomatoToken.brandPrimary.opacity(0.55))
                .frame(width: 3)
            VStack(alignment: .leading, spacing: 6) {
                HStack(spacing: 6) {
                    Image(systemName: "sparkles")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(TomatoToken.brandPrimary)
                    Text("Tomato")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelCaption)
                    if pending {
                        RunningDot()
                    }
                }
                MarkdownText(text: text, lineSpacing: 5)
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .contextMenu {
                        Button("复制") { UIPasteboard.general.string = text }
                    }
            }
            .padding(.leading, 10)
            .padding(.vertical, 10)
            .padding(.trailing, 12)
        }
        .background(TomatoToken.bgLayer2, in: RoundedRectangle(cornerRadius: TomatoRadius.md, style: .continuous))
        .accessibilityIdentifier("chat.row.assistant")
    }
}

/// The person's own message: photos, then a brand-tinted bubble, at the trailing
/// edge.
///
/// Colour, side, and shape all say "you wrote this", which is what keeps a long
/// mixed transcript readable at a glance. The bubble is sized by its own words,
/// not by the page: a short line keeps a short bubble, and the row's frame —
/// with a leading inset — does the right alignment. A photo is drawn as a
/// picture above the words, the way the Desktop draws it; a prompt that carried
/// only a photo therefore has no bubble at all.
struct UserRow: View {
    let text: String
    /// Photos the message carries, in sent order.
    var images: [ChatImageRef] = []
    /// Conversation photos the tiles read their bytes from.
    @ObservedObject var photos: ChatImages
    /// Opens one photo full screen.
    var open: (ChatImageRef) -> Void = { _ in }
    /// Asks the conversation for the bytes of one photo.
    var needs: (ChatImageRef) -> Void = { _ in }

    var body: some View {
        VStack(alignment: .trailing, spacing: 6) {
            if !images.isEmpty {
                UserImageRow(images: images, photos: photos, open: open, needs: needs)
            }
            if !text.isEmpty {
                bubble
            }
        }
        .padding(.leading, 56)
        .frame(maxWidth: .infinity, alignment: .trailing)
        // A container identifier replaces its children's, so `contain` is what
        // keeps the photos addressable next to the row they belong to.
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("chat.row.user")
    }

    /// A pasted code block or diagram needs the whole width; every other message
    /// is drawn as one run of its own words, which is what makes the bubble hug.
    @ViewBuilder
    private var bubble: some View {
        if MarkdownParser.needsFullWidth(text) {
            MarkdownText(text: text)
                .foregroundStyle(TomatoToken.labelPrimary)
                .textSelection(.enabled)
                .frame(maxWidth: .infinity, alignment: .leading)
                .modifier(UserBubble(text: text))
        } else {
            Text(inlineMarkdown(text))
                .font(.subheadline)
                .lineSpacing(4)
                .foregroundStyle(TomatoToken.labelPrimary)
                .multilineTextAlignment(.leading)
                .textSelection(.enabled)
                .fixedSize(horizontal: false, vertical: true)
                .modifier(UserBubble(text: text))
        }
    }
}

/// Photos in one of the person's messages.
///
/// One photo keeps its own proportions; several become square tiles, the way a
/// gallery reads on a phone. A photo that is still loading, or that the Host no
/// longer holds, stays a picture-shaped placeholder — never a line of words
/// inside the message.
struct UserImageRow: View {
    let images: [ChatImageRef]
    @ObservedObject var photos: ChatImages
    let open: (ChatImageRef) -> Void
    /// Asks the conversation for one photo the row is about to draw.
    var needs: (ChatImageRef) -> Void = { _ in }

    /// Photos drawn as tiles before the rest fold into one count.
    private static let visibleTiles = 3

    var body: some View {
        Group {
            if images.count == 1, let only = images.first {
                single(only)
            } else {
                HStack(spacing: 6) {
                    ForEach(Array(images.prefix(Self.visibleTiles).enumerated()), id: \.element.id) { index, image in
                        tile(image)
                            .accessibilityIdentifier("chat.row.user.image.\(index)")
                            .accessibilityLabel("图片 \(index + 1)")
                    }
                    if images.count > Self.visibleTiles {
                        overflow
                    }
                }
            }
        }
        // A realized row asks for its bytes here; the conversation answers once
        // per photo, so scrolling back and forth costs nothing.
        .task(id: images.map(\.id)) {
            for image in images {
                needs(image)
            }
        }
    }

    /// One photo shown whole, at the width the dock leaves it.
    /// @param image - the reference to draw.
    private func single(_ image: ChatImageRef) -> some View {
        Button {
            if photos.image(for: image.id) != nil {
                open(image)
            }
        } label: {
            shape(for: image)
                .frame(minWidth: 140, maxWidth: 240, minHeight: 96, maxHeight: 280)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .strokeBorder(TomatoToken.borderL2, lineWidth: 0.5)
                )
                .contentShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(photos.image(for: image.id) == nil)
        .accessibilityIdentifier("chat.row.user.image")
        .accessibilityLabel("图片")
        .accessibilityHint("查看大图")
    }

    /// One square tile of a multi-photo message.
    /// @param image - the reference to draw.
    private func tile(_ image: ChatImageRef) -> some View {
        Button {
            if photos.image(for: image.id) != nil {
                open(image)
            }
        } label: {
            Group {
                if let loaded = photos.image(for: image.id) {
                    Image(uiImage: loaded)
                        .resizable()
                        .scaledToFill()
                } else if photos.didFail(image.id) {
                    Image(systemName: "photo.badge.exclamationmark")
                        .font(.title3)
                        .foregroundStyle(TomatoToken.labelDimmed)
                } else {
                    ProgressView().controlSize(.small)
                }
            }
            .frame(width: 96, height: 96)
            .background(TomatoToken.bgLayer2)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(TomatoToken.borderL2, lineWidth: 0.5)
            )
            .contentShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(photos.image(for: image.id) == nil)
    }

    /// Photos past the tiles, stated rather than drawn.
    private var overflow: some View {
        ZStack {
            TomatoToken.bgLayer3
            Text("+\(images.count - Self.visibleTiles)")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(TomatoToken.labelSecondary)
        }
        .frame(width: 96, height: 96)
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .accessibilityLabel("还有 \(images.count - Self.visibleTiles) 张")
    }

    /// The photo itself, or the placeholder that stands in for it.
    /// @param image - the reference to draw.
    @ViewBuilder
    private func shape(for image: ChatImageRef) -> some View {
        if let loaded = photos.image(for: image.id) {
            Image(uiImage: loaded)
                .resizable()
                .scaledToFit()
        } else if photos.didFail(image.id) {
            placeholder(symbol: "photo.badge.exclamationmark", label: "图片无法显示")
        } else {
            placeholder(symbol: nil, label: "正在读取图片")
        }
    }

    /// A photo-shaped block for a picture that is not on screen yet.
    /// @param symbol - icon to draw, or nil for a spinner.
    /// @param label - the accessible name.
    private func placeholder(symbol: String?, label: String) -> some View {
        ZStack {
            TomatoToken.bgLayer2
            if let symbol {
                Image(systemName: symbol)
                    .font(.title3)
                    .foregroundStyle(TomatoToken.labelDimmed)
            } else {
                ProgressView().controlSize(.small)
            }
        }
        .frame(width: 220, height: 150)
        .accessibilityLabel(label)
    }
}

/// The tint, shape, and copy action a message's own words carry.
private struct UserBubble: ViewModifier {
    /// The message's own words; the copy action shares them verbatim.
    let text: String

    func body(content: Content) -> some View {
        content
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                TomatoToken.brandPrimary.opacity(0.12),
                in: RoundedRectangle(cornerRadius: 18, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .strokeBorder(TomatoToken.brandPrimary.opacity(0.18), lineWidth: 1)
            )
            .contextMenu {
                Button("复制") { UIPasteboard.general.string = text }
            }
    }
}
