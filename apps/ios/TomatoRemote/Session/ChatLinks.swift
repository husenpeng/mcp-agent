//
//  ChatLinks.swift
//  Tomato Remote
//
//  How a link in a transcript opens. The Host writes absolute file paths as
//  Markdown links; on the phone that path names a file on the Mac, so the tap
//  has to become the same file preview the deliverables card uses instead of a
//  URL handed to the system.
//

import Foundation

/// The destination one Markdown link in a message names.
enum ChatLink: Equatable {
    /// Absolute path on the Mac; the Host can fetch its bytes.
    case hostFile(String)
    /// A `tomato://` link the app routes itself.
    case appRoute(URL)
    /// A URL the system opens in another app.
    case external(URL)
    /// A relative path with no base to resolve it against.
    case unresolved

    /// Read one link destination into the action the phone can take.
    /// - Parameter url: the destination the Markdown renderer produced.
    init(_ url: URL) {
        if url.isFileURL {
            self = .hostFile(url.path)
        } else if url.scheme == nil, url.relativeString.hasPrefix("/") {
            self = .hostFile(url.path)
        } else if url.scheme == "tomato" {
            self = .appRoute(url)
        } else if url.scheme == nil {
            self = .unresolved
        } else {
            self = .external(url)
        }
    }

    /// Read one link destination, resolving a relative path against the folder
    /// the Session runs in when one is known.
    ///
    /// A message that links `docs/x.md` means it relative to its own working
    /// directory; discarding the tap silently read as a broken link.
    /// - Parameters:
    ///   - url: destination the Markdown renderer produced.
    ///   - base: absolute folder the Session runs in, when known.
    init(_ url: URL, base: String?) {
        let relative = url.relativeString
        if let base, !base.isEmpty, url.scheme == nil,
           !relative.hasPrefix("/"), !relative.hasPrefix("//")
        {
            self = .hostFile(URL(fileURLWithPath: base).appendingPathComponent(relative).path)
        } else {
            self.init(url)
        }
    }
}
