//
//  MarkdownTable.swift
//  Tomato Remote
//
//  A Markdown pipe table, read on a phone. Short cells keep the comparison a
//  grid offers; a table carrying paragraphs becomes labelled cards, because
//  panning across long Chinese columns loses the row a reader is following.
//

import SwiftUI

/// One table block from an answer.
struct MarkdownTable: View {
    let header: [String]
    let rows: [[String]]
    let alignments: [MarkdownTableAlignment]

    var body: some View {
        if usesCards {
            cards
        } else {
            grid
        }
    }

    /// Long cells or many columns are more readable as one card per row.
    private var usesCards: Bool {
        header.count > 3 || rows.contains { row in row.contains { $0.count > 24 } }
    }

    // MARK: Cards

    private var cards: some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                card(row)
            }
        }
        .accessibilityIdentifier("markdown.table")
    }

    /// One row rendered with the header of every column beside its value.
    /// - Parameter row: cells padded to the header's column count.
    /// - Returns: the row's card.
    private func card(_ row: [String]) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            if let title = row.first, !title.isEmpty {
                VStack(alignment: .leading, spacing: 1) {
                    Text(header[0])
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelCaption)
                    Text(inlineMarkdown(title))
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelPrimary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            ForEach(Array(header.indices.dropFirst()), id: \.self) { index in
                VStack(alignment: .leading, spacing: 1) {
                    Text(header[index])
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(TomatoToken.labelCaption)
                    Text(inlineMarkdown(row.indices.contains(index) ? row[index] : ""))
                        .font(.caption)
                        .foregroundStyle(TomatoToken.labelSecondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(TomatoToken.bgLayer1, in: RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous)
                .strokeBorder(TomatoToken.borderL1, lineWidth: 1)
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel(for: row))
    }

    /// One spoken sentence for a row's card.
    /// - Parameter row: cells of the row.
    /// - Returns: every header and its value, separated for VoiceOver.
    private func accessibilityLabel(for row: [String]) -> String {
        header.indices.map { index in
            "\(header[index])：\(row.indices.contains(index) ? row[index] : "")"
        }
        .joined(separator: "；")
    }

    // MARK: Grid

    /// Short cells stay a grid: side-by-side comparison is the reason a table
    /// exists, and a horizontal scroll keeps even a wide one readable.
    private var grid: some View {
        ScrollView(.horizontal, showsIndicators: true) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 0) {
                    ForEach(header.indices, id: \.self) { index in
                        cell(header[index], index: index, header: true)
                    }
                }
                .background(TomatoToken.bgLayer2)
                ForEach(Array(rows.enumerated()), id: \.offset) { index, row in
                    Divider()
                        .overlay(TomatoToken.borderL1)
                    HStack(spacing: 0) {
                        ForEach(header.indices, id: \.self) { column in
                            cell(row.indices.contains(column) ? row[column] : "", index: column, header: false)
                        }
                    }
                    .background(index.isMultiple(of: 2) ? Color.clear : TomatoToken.bgLayer2.opacity(0.45))
                }
            }
            .background(TomatoToken.bgLayer1)
            .clipShape(RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: TomatoRadius.sm, style: .continuous)
                    .strokeBorder(TomatoToken.borderL1, lineWidth: 1)
            )
        }
        .accessibilityIdentifier("markdown.table")
    }

    /// One grid cell.
    /// - Parameters:
    ///   - text: cell Markdown.
    ///   - index: column the cell belongs to.
    ///   - header: whether this cell is in the header row.
    /// - Returns: the cell, sized to its column.
    private func cell(_ text: String, index: Int, header: Bool) -> some View {
        Text(inlineMarkdown(text))
            .font(header ? .caption.weight(.semibold) : .caption)
            .foregroundStyle(header ? TomatoToken.labelPrimary : TomatoToken.labelSecondary)
            .multilineTextAlignment(alignment(for: index).textAlignment)
            .frame(width: 150, alignment: alignment(for: index).frame)
            .padding(.horizontal, 8)
            .padding(.vertical, 8)
            .overlay(alignment: .leading) {
                if index > 0 {
                    Rectangle()
                        .fill(TomatoToken.borderL1)
                        .frame(width: 0.5)
                }
            }
    }

    /// Column alignment the separator row named.
    /// - Parameter index: column to look up.
    /// - Returns: leading when the separator did not name one.
    private func alignment(for index: Int) -> MarkdownTableAlignment {
        alignments.indices.contains(index) ? alignments[index] : .leading
    }
}

private extension MarkdownTableAlignment {
    var frame: Alignment {
        switch self {
        case .leading: .leading
        case .center: .center
        case .trailing: .trailing
        }
    }

    var textAlignment: TextAlignment {
        switch self {
        case .leading: .leading
        case .center: .center
        case .trailing: .trailing
        }
    }
}
