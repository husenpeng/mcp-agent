//
//  MarkdownParserTests.swift
//  TomatoRemoteTests
//
//  Pipe tables: the separator is what makes one, rows keep the header's column
//  count, and escaped pipes stay inside their cell.
//

@testable import TomatoRemote
import XCTest

final class MarkdownParserTests: XCTestCase {
    /// A header, an alignment separator, and its rows become one table block.
    func testPipeTableParsesHeaderRowsAndAlignment() {
        let text = """
        | 环节 | 作用 |
        | --- | ---: |
        | 运行时 | 进程 / stdio |
        | 清单 | 校验 |
        """
        XCTAssertEqual(MarkdownParser.blocks(of: text), [
            .table(
                header: ["环节", "作用"],
                rows: [["运行时", "进程 / stdio"], ["清单", "校验"]],
                alignments: [.leading, .trailing]
            ),
        ])
    }

    /// Pipes without a separator row are prose, not a table.
    func testPipesWithoutSeparatorStayParagraph() {
        let blocks = MarkdownParser.blocks(of: "甲 | 乙 | 丙")
        XCTAssertEqual(blocks, [.paragraph("甲 | 乙 | 丙")])
    }

    /// A row that lost a column is padded, and one with an extra cell is cut,
    /// so every row still lines up with its header.
    func testTableRowsMatchTheHeaderColumnCount() {
        let text = """
        | a | b | c |
        | --- | --- | --- |
        | 1 | 2 |
        | 1 | 2 | 3 | 4 |
        """
        XCTAssertEqual(MarkdownParser.blocks(of: text), [
            .table(
                header: ["a", "b", "c"],
                rows: [["1", "2", ""], ["1", "2", "3"]],
                alignments: [.leading, .leading, .leading]
            ),
        ])
    }

    /// An escaped pipe belongs to the cell instead of ending it.
    func testEscapedPipeStaysInsideCell() {
        let text = """
        | a\\|b | c |
        | --- | --- |
        | x | y |
        """
        XCTAssertEqual(MarkdownParser.blocks(of: text), [
            .table(
                header: ["a|b", "c"],
                rows: [["x", "y"]],
                alignments: [.leading, .leading]
            ),
        ])
    }

    /// A table needs the transcript's full width, like a code block or diagram.
    func testTableNeedsFullWidth() {
        let text = """
        | a | b |
        | --- | --- |
        | 1 | 2 |
        """
        XCTAssertTrue(MarkdownParser.needsFullWidth(text))
        XCTAssertFalse(MarkdownParser.needsFullWidth("普通回答"))
    }
}
