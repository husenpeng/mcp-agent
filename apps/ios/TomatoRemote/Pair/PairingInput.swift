//
//  PairingInput.swift
//  Tomato Remote
//
//  Turns whatever the user pasted into the two facts pairing needs. Kept to
//  Foundation so the rules can be exercised without a UI.
//

import Foundation

/// Turns whatever the user pasted into the two facts pairing needs.
enum PairingInput {
    /// Accepts a full `tomato web:` link, a bare host, or host plus a separate
    /// token field. The returned base carries no path and no query: the
    /// cookie's authority is the host, so the path the link happened to use is
    /// irrelevant and must not leak into later API URLs.
    ///
    /// - Parameters:
    ///   - link: pasted link or host text.
    ///   - token: the separate token field, used when `link` has none.
    /// - Returns: the Host root and the launch token, or `nil` when either is missing.
    static func parse(link: String, token: String) -> (base: URL, token: String)? {
        guard let components = urlComponents(in: link) else { return nil }
        let scheme = components.scheme ?? ""
        guard scheme == "https" || scheme == "http", let host = components.host, !host.isEmpty else { return nil }

        let fromLink = tokenInQuery(components) ?? tokenInRawText(link) ?? ""
        let fromField = token.trimmingCharacters(in: .whitespacesAndNewlines)
        // An explicit value in the token field wins: it is the one the user can
        // see, and the link may still carry a fragment the parser trims away.
        let resolved = sanitize(fromField.isEmpty ? fromLink : fromField)
        guard !resolved.isEmpty else { return nil }

        var baseComponents = URLComponents()
        baseComponents.scheme = scheme
        baseComponents.host = host
        baseComponents.port = components.port
        guard let base = baseComponents.url else { return nil }
        return (base, resolved)
    }

    /// Trim anything that cannot be part of a launch token.
    ///
    /// The Host mints these as base64url from random bytes, so a trailing `。`
    /// or `）` that came along with a pasted sentence would only ever break the
    /// exchange.
    /// @param value - the candidate token.
    /// @returns the token with non-base64url characters trimmed from both ends.
    static func sanitize(_ value: String) -> String {
        let allowed = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-_"))
        return value.trimmingCharacters(in: allowed.inverted)
    }

    /// Read the token from parsed query items.
    /// @param components - the address the paste was reduced to.
    /// @returns the token value, when the query names one.
    private static func tokenInQuery(_ components: URLComponents) -> String? {
        let value = components.queryItems?.first { $0.name == "token" }?.value
        guard let value, !value.isEmpty else { return nil }
        return value
    }

    /// Read the token straight out of the pasted text.
    ///
    /// `URLComponents` drops or rejects a query that carries characters it will
    /// not parse, and a paste can keep an encoded `?`; scanning the raw text for
    /// `token=` finds the value either way.
    /// @param text - the raw link field.
    /// @returns the token value, when the text names one.
    static func tokenInRawText(_ text: String) -> String? {
        let pattern = "[?&]token=([A-Za-z0-9_.~%+/-]+)"
        guard let match = try? NSRegularExpression(pattern: pattern, options: []),
              let result = match.firstMatch(in: text, range: NSRange(text.startIndex..., in: text)),
              let range = Range(result.range(at: 1), in: text)
        else { return nil }
        let value = String(text[range]).removingPercentEncoding ?? String(text[range])
        return value.isEmpty ? nil : value
    }

    /// Find the address inside whatever was pasted.
    ///
    /// The printed line reads `tomato web: http://…?token=…`, and a paste from a
    /// chat or a terminal can carry the label, a bullet, or trailing punctuation.
    /// Searching for the scheme instead of trusting the whole string keeps those
    /// pastes working; a bare host still gets `https://` so the field can be typed
    /// by hand.
    /// @param text - the raw link field.
    /// @returns parsed components, or nil when the text holds no address.
    static func urlComponents(in text: String) -> URLComponents? {
        // A paste can carry a byte-order mark or stray control characters that
        // `URLComponents` rejects outright.
        let trimmed = text
            .replacingOccurrences(of: "\u{FEFF}", with: "")
            .filter { !$0.unicodeScalars.allSatisfy { CharacterSet.controlCharacters.contains($0) } }
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return nil }

        var candidate: String
        if let start = ["https://", "http://"].lazy.compactMap({ trimmed.range(of: $0) }).min(by: { $0.lowerBound < $1.lowerBound }) {
            // Everything from the scheme to the first whitespace after it.
            let tail = trimmed[start.lowerBound...]
            candidate = tail.split(whereSeparator: { $0.isWhitespace }).first.map(String.init) ?? String(tail)
        } else if trimmed.contains("://") {
            return nil
        } else if trimmed.contains(".") && !trimmed.contains(" ") {
            candidate = "https://" + trimmed
        } else {
            return nil
        }

        // A pasted sentence can end the address with Chinese or ASCII punctuation.
        while let last = candidate.last, ")),.;，。”’\"'".contains(last) {
            candidate.removeLast()
        }
        return URLComponents(string: candidate)
    }
}
