//
//  HTTP.swift
//  Tomato Runner
//
//  Minimal HTTP/1.1 over a loopback socket. Only what the server needs:
//  one request per connection, `Content-Length` bodies, and `Connection: close`.
//

import Darwin
import Foundation

/// One parsed request head plus body.
struct HTTPRequest {
    let method: String
    let path: String
    let headers: [String: String]
    let body: Data

    /// Case-insensitive header read.
    /// @param name - header name.
    func header(_ name: String) -> String? {
        headers[name.lowercased()]
    }
}

/// Parse and write helpers shared by the listener.
enum HTTP {
    /// Largest accepted body; a screen observation or screenshot command is far
    /// smaller, and a larger body is a caller defect rather than a big payload.
    static let maxBodyBytes = 1 << 20

    /// Read one request from a connected socket.
    /// @param fd - accepted socket.
    /// @returns the request, or nil when the peer closed early or sent junk.
    static func readRequest(fd: Int32) -> HTTPRequest? {
        var buffer = Data()
        var headEnd: Range<Int>?
        while headEnd == nil {
            var chunk = [UInt8](repeating: 0, count: 4096)
            let read = recv(fd, &chunk, chunk.count, 0)
            guard read > 0 else { return nil }
            buffer.append(contentsOf: chunk[0 ..< read])
            headEnd = buffer.range(of: Data("\r\n\r\n".utf8))
            if buffer.count > 64 * 1024 {
                return nil
            }
        }
        guard let headEnd, let head = String(data: buffer[..<headEnd.lowerBound], encoding: .utf8) else { return nil }
        let lines = head.components(separatedBy: "\r\n")
        guard let startLine = lines.first else { return nil }
        let parts = startLine.split(separator: " ")
        guard parts.count >= 2 else { return nil }
        var headers: [String: String] = [:]
        for line in lines.dropFirst() {
            guard let separator = line.firstIndex(of: ":") else { continue }
            let name = line[..<separator].trimmingCharacters(in: .whitespaces).lowercased()
            let value = line[line.index(after: separator)...].trimmingCharacters(in: .whitespaces)
            headers[name] = value
        }
        let length = Int(headers["content-length"] ?? "0") ?? 0
        guard length >= 0, length <= maxBodyBytes else { return nil }
        var body = buffer[headEnd.upperBound...]
        while body.count < length {
            var chunk = [UInt8](repeating: 0, count: min(4096, length - body.count))
            let read = recv(fd, &chunk, chunk.count, 0)
            guard read > 0 else { return nil }
            body.append(contentsOf: chunk[0 ..< read])
        }
        return HTTPRequest(
            method: String(parts[0]),
            path: String(parts[1]),
            headers: headers,
            body: Data(body.prefix(length))
        )
    }

    /// Write one response and close.
    /// @param fd - accepted socket.
    /// @param status - HTTP status code.
    /// @param body - response bytes.
    static func respond(fd: Int32, status: Int, body: Data) {
        let head = "HTTP/1.1 \(status) \(reason(status))\r\n"
            + "Content-Type: application/json; charset=utf-8\r\n"
            + "Content-Length: \(body.count)\r\n"
            + "Connection: close\r\n"
            + "\r\n"
        var payload = Data(head.utf8)
        payload.append(body)
        payload.withUnsafeBytes { raw in
            guard let base = raw.baseAddress else { return }
            var sent = 0
            while sent < payload.count {
                let written = send(fd, base + sent, payload.count - sent, 0)
                guard written > 0 else { return }
                sent += written
            }
        }
    }

    private static func reason(_ status: Int) -> String {
        switch status {
        case 200: "OK"
        case 400: "Bad Request"
        case 401: "Unauthorized"
        case 404: "Not Found"
        case 405: "Method Not Allowed"
        case 408: "Request Timeout"
        case 500: "Internal Server Error"
        default: "Unknown"
        }
    }
}
