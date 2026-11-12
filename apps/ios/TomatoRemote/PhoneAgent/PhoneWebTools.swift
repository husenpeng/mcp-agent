//
//  PhoneWebTools.swift
//  Tomato Remote
//
//  `web_search` and `web_fetch` for Tomato Phone.
//
//  Search follows the desktop provider: the phone sends the query and its
//  Feishu account session to the company gateway, which owns the search vendor
//  and its credential. Signed out, the tool reports the missing credential
//  instead of scraping a second vendor. Fetch is the desktop's anonymous HTTP
//  provider: one public URL, readable text, a bounded body, and no local or
//  private destination.
//

import Foundation

/// Web access for the local agent.
enum PhoneWebTools {
    /// User agent sent on every request; an explicit product agent, not a
    /// browser disguise.
    static let userAgent = "TomatoPhone/0.1 (iPhone; iOS)"
    /// Most results one search returns.
    static let maxSearchResults = 8
    /// Whole search answer bound.
    static let maxSearchOutput = 4000
    /// Largest response body read by one fetch.
    static let maxFetchBytes = 5_000_000
    /// Largest text one fetch returns.
    static let maxFetchOutput = 200_000

    /// Search the web for one query.
    /// - Parameters:
    ///   - query: words to search.
    ///   - maxResults: requested result bound, when the model gave one.
    /// - Returns: formatted results for the model, with titles, URLs, snippets,
    ///   and the gateway's answer when it supplied one.
    @MainActor
    static func search(query: String, maxResults: Int?) async throws -> String {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw AgentError.rejected("web_search 需要一个查询词")
        }
        let limit = min(max(maxResults ?? 5, 1), maxSearchResults)
        guard let context = AccountAuthStore.shared.searchContext else {
            throw AgentError.rejected("web_search 需要先用飞书登录；登录后由公司搜索服务执行")
        }
        return try await companySearch(trimmed, limit: limit, context: context)
    }

    /// Read one public web page as text.
    /// - Parameters:
    ///   - url: absolute HTTP(S) URL.
    ///   - maxChars: requested body bound, when the model gave one.
    /// - Returns: final URL, status, and readable text.
    static func fetch(url: String, maxChars: Int?) async throws -> String {
        let trimmed = url.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let target = URL(string: trimmed),
              let scheme = target.scheme?.lowercased(),
              scheme == "http" || scheme == "https",
              target.host != nil
        else {
            throw AgentError.rejected("web_fetch 需要一个 http 或 https 地址")
        }
        guard !isPrivate(target) else {
            throw AgentError.rejected("web_fetch 只读取公开网页，不访问本机或局域网地址")
        }
        var request = URLRequest(url: target)
        request.timeoutInterval = 30
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        request.setValue("text/html, application/xhtml+xml, text/plain;q=0.9, */*;q=0.5", forHTTPHeaderField: "Accept")
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw AgentError.transport("读取网页失败：\(error.localizedDescription)")
        }
        guard let http = response as? HTTPURLResponse else {
            throw AgentError.transport("网页没有返回 HTTP 响应")
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            throw AgentError.transport("网页返回 HTTP \(http.statusCode)")
        }
        let contentType = http.value(forHTTPHeaderField: "Content-Type") ?? ""
        let body = String(decoding: data.prefix(maxFetchBytes), as: UTF8.self)
        let readable = contentType.contains("html") ? plainText(body) : body
        let bound = min(max(maxChars ?? maxFetchOutput, 1000), maxFetchOutput)
        let text = String(readable.prefix(bound))
        return """
        URL: \(http.url?.absoluteString ?? target.absoluteString)
        HTTP: \(http.statusCode)
        Content-Type: \(contentType.isEmpty ? "未知" : contentType)

        \(text)
        """
    }

    // MARK: Company gateway

    /// One authenticated search against the company BFF, mirroring
    /// `@tomato/web-search-company`.
    /// - Parameters:
    ///   - query: search words.
    ///   - limit: result bound.
    ///   - context: company origin and gateway session.
    /// - Returns: formatted results.
    private static func companySearch(
        _ query: String,
        limit: Int,
        context: (base: URL, sessionId: String)
    ) async throws -> String {
        let base = context.base.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        guard let url = URL(string: base + "/api/v1/search/web") else {
            throw AgentError.transport("搜索服务地址不合法")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 45
        request.setValue("session_id=\(context.sessionId)", forHTTPHeaderField: "Cookie")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        let body: [String: JSONValue] = [
            "query": .string(query),
            "maxResults": .number(Double(limit)),
            "maxCharsPerResult": .number(500),
            "maxChars": .number(3000),
        ]
        request.httpBody = try JSONEncoder().encode(JSONValue.object(body))
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw AgentError.transport("搜索服务连接失败：\(error.localizedDescription)")
        }
        guard let http = response as? HTTPURLResponse else {
            throw AgentError.transport("搜索服务没有返回 HTTP 响应")
        }
        if http.statusCode == 401 {
            throw AgentError.rejected("飞书登录已过期，请到账号页重新登录后再搜索")
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            throw AgentError.transport("搜索服务返回 HTTP \(http.statusCode)")
        }
        guard let root = try? JSONDecoder().decode(JSONValue.self, from: data),
              let payload = root["data"]
        else {
            throw AgentError.transport("搜索服务回应无法解析")
        }
        let answer = payload["answer"]?.stringValue ?? ""
        let results = (payload["results"]?.arrayValue ?? []).compactMap { entry -> SearchResult? in
            guard let url = entry["url"]?.stringValue, !url.isEmpty else { return nil }
            return SearchResult(
                title: entry["title"]?.stringValue ?? "",
                url: url,
                snippet: entry["snippet"]?.stringValue ?? ""
            )
        }
        guard !results.isEmpty || !answer.isEmpty else {
            return "没有找到与「\(query)」相关的结果。"
        }
        return format(query: query, answer: answer, results: Array(results.prefix(limit)))
    }

    /// Turn one answer and its sources into the tool's text.
    /// - Parameters:
    ///   - query: words searched.
    ///   - answer: gateway summary, empty when it gave none.
    ///   - results: sources in gateway order.
    /// - Returns: bounded text for the model.
    private static func format(query: String, answer: String, results: [SearchResult]) -> String {
        var lines = ["搜索：\(query)"]
        if !answer.isEmpty {
            lines.append("摘要：\(answer)")
        }
        for (index, result) in results.enumerated() {
            lines.append("\(index + 1). \(result.title)")
            lines.append("URL: \(result.url)")
            if !result.snippet.isEmpty {
                lines.append("摘要：\(result.snippet)")
            }
        }
        let text = lines.joined(separator: "\n")
        return String(text.prefix(maxSearchOutput))
    }

    // MARK: Reading

    /// Strip scripts, styles, and tags down to readable text.
    /// - Parameter html: page body.
    /// - Returns: collapsed text.
    private static func plainText(_ html: String) -> String {
        var text = html
        for pattern in [
            #"(?is)<script\b.*?</script>"#,
            #"(?is)<style\b.*?</style>"#,
            #"(?is)<noscript\b.*?</noscript>"#,
            #"(?is)<!--.*?-->"#,
        ] {
            text = text.replacingOccurrences(of: pattern, with: " ", options: .regularExpression)
        }
        for pattern in [
            #"(?i)<br\s*/?>"#,
            #"(?i)</p>"#,
            #"(?i)</div>"#,
            #"(?i)</li>"#,
            #"(?i)</h[1-6]>"#,
            #"(?i)</tr>"#,
            #"(?i)</section>"#,
        ] {
            text = text.replacingOccurrences(of: pattern, with: "\n", options: .regularExpression)
        }
        text = text.replacingOccurrences(of: #"(?is)<[^>]+>"#, with: " ", options: .regularExpression)
        text = decodeEntities(text)
        text = text.replacingOccurrences(of: #"[ \t\r\f]+"#, with: " ", options: .regularExpression)
        text = text.replacingOccurrences(of: #" *\n *"#, with: "\n", options: .regularExpression)
        text = text.replacingOccurrences(of: #"\n{3,}"#, with: "\n\n", options: .regularExpression)
        return text.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    /// Decode the entities a page body commonly uses.
    /// - Parameter value: HTML text.
    /// - Returns: text with named and numeric entities replaced.
    private static func decodeEntities(_ value: String) -> String {
        var text = value
        let named = [
            "&nbsp;": " ",
            "&amp;": "&",
            "&lt;": "<",
            "&gt;": ">",
            "&quot;": "\"",
            "&#39;": "'",
            "&#x27;": "'",
            "&#x2F;": "/",
            "&hellip;": "…",
            "&mdash;": "—",
            "&ndash;": "–",
            "&rsquo;": "’",
            "&lsquo;": "‘",
            "&ldquo;": "“",
            "&rdquo;": "”",
        ]
        for (entity, replacement) in named {
            text = text.replacingOccurrences(of: entity, with: replacement)
        }
        return text
    }

    // MARK: Destination policy

    /// Whether a URL names the phone's own network. Anonymous fetch refuses
    /// these so a prompt cannot turn the tool into a local port scanner.
    /// - Parameter url: destination.
    /// - Returns: true for loopback, link-local, and RFC 1918 hosts.
    private static func isPrivate(_ url: URL) -> Bool {
        guard let host = url.host?.lowercased(), !host.isEmpty else { return true }
        if host == "localhost" || host.hasSuffix(".local") || host == "::1" {
            return true
        }
        let parts = host.split(separator: ".").compactMap { UInt8($0) }
        guard parts.count == 4 else {
            // IPv6 unique-local and link-local ranges.
            return host.hasPrefix("fc") || host.hasPrefix("fd") || host.hasPrefix("fe80")
        }
        if parts[0] == 10 || parts[0] == 127 || parts[0] == 0 {
            return true
        }
        if parts[0] == 169, parts[1] == 254 {
            return true
        }
        if parts[0] == 192, parts[1] == 168 {
            return true
        }
        if parts[0] == 172, (16 ... 31).contains(parts[1]) {
            return true
        }
        return false
    }

    private struct SearchResult {
        let title: String
        let url: String
        let snippet: String
    }
}
