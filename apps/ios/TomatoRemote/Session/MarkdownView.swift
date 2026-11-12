//
//  MarkdownView.swift
//  Tomato Remote
//
//  Rendering an answer: readable type at a phone's reading size, with the block
//  kinds a technical reply actually uses — headings, lists, quotes, fenced code,
//  and Mermaid diagrams — drawn as their own views instead of one text run.
//

import SwiftUI

struct MarkdownView: View {
    let text: String
    /// Width one full-width block may use; diagrams center in it.
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(MarkdownParser.blocks(of: text)) { block in
                MarkdownBlockView(block: block)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// Inline Markdown only: emphasis, code spans, links.
///
/// Parsed at most once per distinct run; SwiftUI rebuilds a row's body while a
/// long transcript scrolls, and `AttributedString(markdown:)` is not free.
/// - Parameter text: one line or paragraph of a message.
/// - Returns: the attributed text both speakers' plain runs draw.
func inlineMarkdown(_ text: String) -> AttributedString {
    inlineCache.value(for: text) {
        (try? AttributedString(markdown: text, options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)))
            ?? AttributedString(text)
    }
}

/// Bounded cache for inline Markdown results.
private let inlineCache = InlineMarkdownCache()

/// Bounded cache for inline Markdown results.
private final class InlineMarkdownCache: @unchecked Sendable {
    private static let limit = 256

    private let lock = NSLock()
    private var values: [String: AttributedString] = [:]
    private var order: [String] = []

    /// Cached text for one run, or the result of parsing it.
    /// - Parameters:
    ///   - text: one line or paragraph.
    ///   - make: parser to run on a miss.
    /// - Returns: the attributed text.
    func value(for text: String, make: () -> AttributedString) -> AttributedString {
        lock.lock()
        if let hit = values[text] {
            lock.unlock()
            return hit
        }
        lock.unlock()

        let parsed = make()

        lock.lock()
        if values[text] == nil {
            values[text] = parsed
            order.append(text)
            if order.count > Self.limit {
                for key in order.prefix(order.count - Self.limit) {
                    values[key] = nil
                }
                order.removeFirst(order.count - Self.limit)
            }
        }
        lock.unlock()
        return parsed
    }
}

private struct MarkdownBlockView: View {
    let block: MarkdownBlock

    var body: some View {
        switch block {
        case let .heading(level, text):
            Text(inline(text))
                .font(headingFont(level))
                .foregroundStyle(TomatoToken.labelPrimary)
                .padding(.top, level <= 2 ? 6 : 2)
        case let .paragraph(text):
            Text(inline(text))
                .font(.subheadline)
                .lineSpacing(4)
                .foregroundStyle(TomatoToken.labelPrimary)
                .textSelection(.enabled)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        case let .code(language, body):
            CodeBlock(language: language, source: body)
        case let .mermaid(source):
            MermaidView(source: source)
        case let .quote(text):
            HStack(alignment: .top, spacing: 8) {
                RoundedRectangle(cornerRadius: 1.5, style: .continuous)
                    .fill(TomatoToken.borderL3)
                    .frame(width: 3)
                Text(inline(text))
                    .font(.subheadline)
                    .lineSpacing(4)
                    .foregroundStyle(TomatoToken.labelSecondary)
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            .padding(.vertical, 2)
        case let .bullet(items):
            VStack(alignment: .leading, spacing: 4) {
                ForEach(items, id: \.self) { item in
                    row(marker: "•", text: item)
                }
            }
        case let .numbered(items):
            VStack(alignment: .leading, spacing: 4) {
                ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                    row(marker: "\(index + 1).", text: item)
                }
            }
        case .rule:
            Rectangle()
                .fill(TomatoToken.borderL2)
                .frame(height: 1)
                .padding(.vertical, 4)
        }
    }

    private func row(marker: String, text: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 6) {
            Text(marker)
                .font(.subheadline)
                .foregroundStyle(TomatoToken.labelCaption)
            Text(inline(text))
                .font(.subheadline)
                .lineSpacing(4)
                .foregroundStyle(TomatoToken.labelPrimary)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func headingFont(_ level: Int) -> Font {
        switch level {
        case 1: .headline
        case 2: .subheadline.weight(.semibold)
        default: .subheadline.weight(.semibold)
        }
    }

    private func inline(_ text: String) -> AttributedString {
        inlineMarkdown(text)
    }
}

/// A fenced block: language label, copy action, and the code itself.
struct CodeBlock: View {
    let language: String?
    /// The code itself; named apart from SwiftUI's `body` view property.
    let source: String

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 6) {
                Text(language?.isEmpty == false ? language!.uppercased() : "代码")
                    .font(.system(size: 10, weight: .semibold, design: .monospaced))
                    .foregroundStyle(TomatoToken.labelCaption)
                Spacer(minLength: 0)
                Button {
                    UIPasteboard.general.string = source
                } label: {
                    Image(systemName: "doc.on.doc")
                        .font(.caption2)
                        .foregroundStyle(TomatoToken.labelCaption)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("复制代码")
                .accessibilityIdentifier("markdown.copyCode")
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 7)
            .background(TomatoToken.markdownCodeBlockBanner)

            ScrollView(.horizontal, showsIndicators: false) {
                Text(source)
                    .font(.footnote.monospaced())
                    .foregroundStyle(TomatoToken.labelPrimary)
                    .textSelection(.enabled)
                    .padding(10)
            }
        }
        .background(TomatoToken.markdownCodeBlock)
        .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous)
                .strokeBorder(TomatoToken.borderL1, lineWidth: 1)
        )
        .accessibilityIdentifier("markdown.code")
    }
}
