//
//  MarkdownBlocks.swift
//  Tomato Remote
//
//  Splitting an answer into the blocks a reader sees.
//
//  SwiftUI's own Markdown support covers inline emphasis and links; it does not
//  draw fenced code, headings, quotes, or diagrams, which is most of what a
//  technical answer contains. This parser keeps each block's raw text so the
//  renderer can choose a presentation per kind instead of one text run.
//

import Foundation

/// One block of an answer.
enum MarkdownBlock: Identifiable, Equatable {
    case heading(level: Int, text: String)
    case paragraph(String)
    case code(language: String?, body: String)
    case mermaid(String)
    case quote(String)
    case bullet([String])
    case numbered([String])
    case table(header: [String], rows: [[String]], alignments: [MarkdownTableAlignment])
    case rule

    var id: String {
        switch self {
        case let .heading(level, text): "h\(level)-\(text)"
        case let .paragraph(text): "p-\(text)"
        case let .code(language, body): "c-\(language ?? "")-\(body)"
        case let .mermaid(body): "m-\(body)"
        case let .quote(text): "q-\(text)"
        case let .bullet(items): "b-\(items.joined(separator: "|"))"
        case let .numbered(items): "n-\(items.joined(separator: "|"))"
        case let .table(header, rows, _):
            "t-\(header.joined(separator: "|"))-\(rows.map { $0.joined(separator: "|") }.joined(separator: "/"))"
        case .rule: "r"
        }
    }
}

/// How one table column aligns its text.
enum MarkdownTableAlignment: Equatable {
    case leading
    case center
    case trailing
}

/// Parse one message's Markdown into blocks.
enum MarkdownParser {
    /// Results kept for messages already on screen. SwiftUI recreates row views
    /// while scrolling, and re-parsing a long answer per frame is a visible
    /// cost; the same text always parses to the same blocks.
    private static let cache = BlockCache()

    /// Split `text` into blocks, preserving fenced code verbatim.
    /// - Parameter text: one message body.
    /// - Returns: the blocks in document order.
    static func blocks(of text: String) -> [MarkdownBlock] {
        cache.blocks(for: text) {
            var scanner = Scanner(lines: text.components(separatedBy: "\n"))
            return scanner.run()
        }
    }

    /// Whether a message holds a block that cannot size itself to its text.
    ///
    /// A code block or a diagram scrolls or scales inside whatever width it is
    /// given, so a bubble drawn around one has to claim the full width instead of
    /// hugging its longest line.
    /// - Parameter text: one message body.
    /// - Returns: true when the message needs the whole width.
    static func needsFullWidth(_ text: String) -> Bool {
        blocks(of: text).contains { block in
            switch block {
            case .code, .mermaid, .table: true
            default: false
            }
        }
    }

    /// Line walker that turns one document into blocks.
    private struct Scanner {
        let lines: [String]
        var index = 0
        var blocks: [MarkdownBlock] = []
        var paragraph: [String] = []

        init(lines: [String]) {
            self.lines = lines
        }

        mutating func run() -> [MarkdownBlock] {
            while index < lines.count {
                let trimmed = lines[index].trimmingCharacters(in: .whitespaces)
                if consumeFence(trimmed) {
                    continue
                }
                if trimmed.isEmpty {
                    flushParagraph()
                    index += 1
                    continue
                }
                if consumeHeading(trimmed) {
                    continue
                }
                if consumeRule(trimmed) {
                    continue
                }
                if consumeTable(trimmed) {
                    continue
                }
                if consumeQuote(trimmed) {
                    continue
                }
                if consumeBullets(trimmed) {
                    continue
                }
                if consumeNumbers(trimmed) {
                    continue
                }
                paragraph.append(lines[index])
                index += 1
            }
            flushParagraph()
            return blocks
        }

        private mutating func flushParagraph() {
            defer { paragraph.removeAll() }
            let joined = paragraph.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
            guard !joined.isEmpty else { return }
            blocks.append(.paragraph(joined))
        }

        private mutating func consumeFence(_ trimmed: String) -> Bool {
            guard trimmed.hasPrefix("```") else { return false }
            flushParagraph()
            let language = String(trimmed.dropFirst(3)).trimmingCharacters(in: .whitespaces)
            var body: [String] = []
            index += 1
            while index < lines.count, !lines[index].trimmingCharacters(in: .whitespaces).hasPrefix("```") {
                body.append(lines[index])
                index += 1
            }
            index += 1
            let code = body.joined(separator: "\n")
            blocks.append(language.lowercased() == "mermaid" ? .mermaid(code) : .code(
                language: language.isEmpty ? nil : language,
                body: code
            ))
            return true
        }

        private mutating func consumeHeading(_ trimmed: String) -> Bool {
            guard let heading = MarkdownParser.heading(trimmed) else { return false }
            flushParagraph()
            blocks.append(heading)
            index += 1
            return true
        }

        private mutating func consumeRule(_ trimmed: String) -> Bool {
            guard trimmed == "---" || trimmed == "***" else { return false }
            flushParagraph()
            blocks.append(.rule)
            index += 1
            return true
        }

        private mutating func consumeQuote(_ trimmed: String) -> Bool {
            guard trimmed.hasPrefix(">") else { return false }
            flushParagraph()
            var quote: [String] = []
            while index < lines.count {
                let candidate = lines[index].trimmingCharacters(in: .whitespaces)
                guard candidate.hasPrefix(">") else { break }
                quote.append(String(candidate.dropFirst()).trimmingCharacters(in: .whitespaces))
                index += 1
            }
            blocks.append(.quote(quote.joined(separator: "\n")))
            return true
        }

        /// A pipe table: a header row, a dash separator, then its rows.
        ///
        /// The separator row is what makes the block a table; a paragraph that
        /// merely contains pipes stays a paragraph. A short or long row is padded
        /// or cut to the header's column count so it still draws one grid.
        /// - Parameter trimmed: first candidate line.
        /// - Returns: whether a table was consumed.
        private mutating func consumeTable(_ trimmed: String) -> Bool {
            guard trimmed.contains("|"), index + 1 < lines.count else { return false }
            let header = MarkdownParser.tableCells(trimmed)
            guard header.count >= 2 else { return false }
            let separator = MarkdownParser.tableCells(lines[index + 1].trimmingCharacters(in: .whitespaces))
            guard separator.count == header.count,
                  separator.allSatisfy(MarkdownParser.isTableSeparator)
            else { return false }

            flushParagraph()
            var rows: [[String]] = []
            index += 2
            while index < lines.count {
                let candidate = lines[index].trimmingCharacters(in: .whitespaces)
                guard !candidate.isEmpty, candidate.contains("|") else { break }
                if candidate.hasPrefix("```") || candidate.hasPrefix("#") || candidate.hasPrefix(">")
                    || MarkdownParser.isBullet(candidate) || MarkdownParser.numberedItem(candidate) != nil
                {
                    break
                }
                var cells = MarkdownParser.tableCells(candidate)
                if cells.count < header.count {
                    cells += Array(repeating: "", count: header.count - cells.count)
                } else if cells.count > header.count {
                    cells = Array(cells.prefix(header.count))
                }
                rows.append(cells)
                index += 1
            }
            blocks.append(.table(
                header: header,
                rows: rows,
                alignments: separator.map(MarkdownParser.tableAlignment)
            ))
            return true
        }

        private mutating func consumeBullets(_ trimmed: String) -> Bool {
            guard MarkdownParser.isBullet(trimmed) else { return false }
            flushParagraph()
            var items: [String] = []
            while index < lines.count {
                let candidate = lines[index].trimmingCharacters(in: .whitespaces)
                guard MarkdownParser.isBullet(candidate) else { break }
                items.append(String(candidate.dropFirst(2)))
                index += 1
            }
            blocks.append(.bullet(items))
            return true
        }

        private mutating func consumeNumbers(_ trimmed: String) -> Bool {
            guard let first = MarkdownParser.numberedItem(trimmed) else { return false }
            flushParagraph()
            var items: [String] = [first]
            index += 1
            while index < lines.count, let item = MarkdownParser.numberedItem(lines[index].trimmingCharacters(in: .whitespaces)) {
                items.append(item)
                index += 1
            }
            blocks.append(.numbered(items))
            return true
        }
    }

    /// A `#`..`######` line, if this one is a heading.
    private static func heading(_ line: String) -> MarkdownBlock? {
        let trimmed = line.trimmingCharacters(in: .whitespaces)
        var level = 0
        for character in trimmed {
            if character == "#" {
                level += 1
            } else {
                break
            }
        }
        guard level > 0, level <= 6 else { return nil }
        let rest = trimmed.dropFirst(level)
        guard rest.hasPrefix(" ") else { return nil }
        return .heading(level: level, text: rest.trimmingCharacters(in: .whitespaces))
    }

    private static func isBullet(_ trimmed: String) -> Bool {
        trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") || trimmed.hasPrefix("+ ")
    }

    /// Split one pipe-table row into cells, honoring `\|` escapes.
    /// - Parameter line: one header, separator, or row line.
    /// - Returns: trimmed cell text in column order.
    static func tableCells(_ line: String) -> [String] {
        var text = line.trimmingCharacters(in: .whitespaces)
        if text.hasPrefix("|") {
            text.removeFirst()
        }
        if text.hasSuffix("|") {
            text.removeLast()
        }
        var cells: [String] = []
        var current = ""
        var escaped = false
        for character in text {
            if escaped {
                current.append(character)
                escaped = false
            } else if character == "\\" {
                escaped = true
            } else if character == "|" {
                cells.append(current.trimmingCharacters(in: .whitespaces))
                current = ""
            } else {
                current.append(character)
            }
        }
        cells.append(current.trimmingCharacters(in: .whitespaces))
        return cells
    }

    /// Whether one cell is the dashed separator that makes a pipe block a table.
    /// - Parameter cell: one cell of the candidate separator row.
    /// - Returns: true for a cell of dashes with optional alignment colons.
    static func isTableSeparator(_ cell: String) -> Bool {
        let trimmed = cell.trimmingCharacters(in: .whitespaces)
        return trimmed.range(of: "^:?-{1,}:?$", options: .regularExpression) != nil
    }

    /// Alignment a separator cell names.
    /// - Parameter cell: one cell of the separator row.
    /// - Returns: left unless a leading or trailing colon says otherwise.
    static func tableAlignment(_ cell: String) -> MarkdownTableAlignment {
        let trimmed = cell.trimmingCharacters(in: .whitespaces)
        let leading = trimmed.hasPrefix(":")
        let trailing = trimmed.hasSuffix(":")
        if leading, trailing {
            return .center
        }
        if trailing {
            return .trailing
        }
        return .leading
    }

    /// The item text of a `1.`-style line, if this one is numbered.
    private static func numberedItem(_ trimmed: String) -> String? {
        var digits = 0
        for character in trimmed {
            if character.isNumber {
                digits += 1
            } else {
                break
            }
        }
        guard digits > 0 else { return nil }
        let rest = trimmed.dropFirst(digits)
        guard rest.hasPrefix(". ") else { return nil }
        return String(rest.dropFirst(2))
    }
}

/// Bounded cache of parsed messages.
private final class BlockCache: @unchecked Sendable {
    /// Messages kept; a transcript window holds far fewer distinct bodies.
    private static let limit = 128

    private let lock = NSLock()
    private var values: [String: [MarkdownBlock]] = [:]
    /// Insertion order, so the oldest body is the one dropped.
    private var order: [String] = []

    /// Cached blocks for one body, or the result of parsing it.
    /// - Parameters:
    ///   - text: one message body.
    ///   - make: parser to run on a miss.
    /// - Returns: the blocks in document order.
    func blocks(for text: String, make: () -> [MarkdownBlock]) -> [MarkdownBlock] {
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
