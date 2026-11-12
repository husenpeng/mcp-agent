//
//  PhoneDocuments.swift
//  Tomato Remote
//
//  Reads a chosen document into text for Tomato Phone.
//
//  The local agent speaks a text-and-image chat shape, so a PDF or plain-text
//  file rides as extracted text on the user's message. The limit keeps one
//  attachment from crowding the system prompt, history, and tool results out of
//  the endpoint's context.
//

import Foundation
import PDFKit

/// Reads one chosen file into a prompt attachment.
enum PhoneDocumentReader {
    /// Longest document text kept from one file.
    static let maximumCharacters = 60000

    /// Read a PDF or UTF-8 text file.
    /// - Parameter url: file URL; the caller keeps its security scope open.
    /// - Returns: the document name, extracted text, and original size.
    /// - Throws: `AgentError.transport` when the file is unreadable, binary, or
    ///   has no text.
    static func read(_ url: URL) throws -> AgentDocument {
        let data = try Data(contentsOf: url)
        let text: String
        if url.pathExtension.lowercased() == "pdf" {
            guard let document = PDFDocument(url: url), let extracted = document.string else {
                throw AgentError.transport("无法读取这份 PDF")
            }
            text = extracted
        } else {
            guard let decoded = String(data: data, encoding: .utf8) else {
                throw AgentError.transport("只支持文本或 PDF 文件")
            }
            text = decoded
        }
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw AgentError.transport("这个文件没有可读取的文字")
        }
        return AgentDocument(
            name: url.lastPathComponent,
            text: String(trimmed.prefix(maximumCharacters)),
            byteCount: data.count,
            truncated: trimmed.count > maximumCharacters
        )
    }
}
