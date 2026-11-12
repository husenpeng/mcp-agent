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

/// The person's own message: a brand-tinted bubble at the trailing edge.
///
/// Colour, side, and shape all say "you wrote this", which is what keeps a long
/// mixed transcript readable at a glance. The bubble is sized by its own words,
/// not by the page: a short line keeps a short bubble, and the row's frame —
/// with a leading inset — does the right alignment.
struct UserRow: View {
    let text: String

    var body: some View {
        bubble
            .padding(.leading, 56)
            .frame(maxWidth: .infinity, alignment: .trailing)
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

/// The tint, shape, and copy action every one of the person's messages carries.
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
            .accessibilityIdentifier("chat.row.user")
    }
}
