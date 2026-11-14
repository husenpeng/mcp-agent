//
//  CompanyAuth.swift
//  Tomato Remote
//
//  Feishu sign-in served by the company web BFF.
//
//  The phone signs in against the company's own web login: the BFF owns the
//  Feishu OAuth exchange and writes its `session_id` cookie, which the sign-in
//  web view reads and this app keeps in the Keychain. auth_service verifies that
//  session for both the company search route and the paired Host gateway, so the
//  phone needs no Mac and no app secret to sign in.
//

import Foundation

/// One verified company account.
struct CompanyUser: Decodable, Sendable {
    /// auth_service account id.
    let id: String
    /// Work email the account is registered with.
    let email: String
    /// Display name the BFF reported, when the account has one.
    let name: String?
    /// Avatar URL the BFF reported, when the account has one.
    let avatarUrl: String?

    /// Name to show in the account card; the email is the fallback.
    var displayName: String {
        guard let name, !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return email }
        return name
    }
}

/// Failures the phone reports for company sign-in.
enum CompanyAuthError: LocalizedError {
    /// The BFF no longer accepts the stored session.
    case expired
    /// The provider refused the sign-in with a reason the login page named.
    case rejected(String)
    /// The BFF answered with an unexpected status.
    case server(Int)
    /// The request never reached the BFF.
    case transport(String)
    /// The BFF answered with a body this app cannot read.
    case malformed

    var errorDescription: String? {
        switch self {
        case .expired:
            "飞书登录已过期，请重新登录。"
        case let .rejected(reason):
            reason
        case let .server(status):
            "登录服务返回 HTTP \(status)"
        case let .transport(detail):
            "登录服务连接失败：\(detail)"
        case .malformed:
            "登录服务回应无法解析"
        }
    }
}

/// Company Feishu login endpoints and their wire rules.
enum CompanyAuth {
    /// Cookie the BFF writes after a successful Feishu exchange.
    static let sessionCookieName = "session_id"
    /// Route that starts the web login and redirects to Feishu.
    static let loginPath = "/api/auth/feishu/start"
    /// Route that projects the current session and its user.
    ///
    /// The BFF has no public session route; an authenticated GET under
    /// `/api/auth/session` passes the auth middleware and then 404s. Reading the
    /// profile returns the same user and is the route the web client itself uses.
    static let profilePath = "/api/auth/profile"
    /// Route that ends the session.
    static let logoutPath = "/api/auth/logout"
    /// Build setting that selects the BFF for this deployment.
    static let baseInfoKey = "TomatoCompanyAuthBase"
    /// BFF the company's test deployment serves.
    static let defaultBase = "https://test.tomatoai.vip"

    /// Origin of the BFF this build signs in against.
    ///
    /// A debug launch may override it so a UI test can point the flow at a local
    /// fixture; a release build reads only the packaged setting.
    static var baseURL: URL {
        #if DEBUG
            let arguments = ProcessInfo.processInfo.arguments
            if let index = arguments.firstIndex(of: "-TOMATO_COMPANY_AUTH"),
               arguments.indices.contains(index + 1),
               let override = URL(string: arguments[index + 1]),
               override.host != nil
            {
                return origin(of: override)
            }
        #endif
        let configured = Bundle.main.object(forInfoDictionaryKey: baseInfoKey) as? String
        let trimmed = (configured ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: trimmed.isEmpty ? defaultBase : trimmed), url.host != nil else {
            return origin(of: URL(string: defaultBase) ?? URL(fileURLWithPath: "/"))
        }
        return origin(of: url)
    }

    /// Build one absolute route on the BFF origin.
    /// - Parameters:
    ///   - base: BFF origin.
    ///   - path: absolute route such as `/api/auth/session`.
    /// - Returns: the route, with any base query and fragment removed.
    static func url(base: URL, path: String) -> URL {
        var components = URLComponents(url: base, resolvingAgainstBaseURL: false)
        components?.path = path
        components?.query = nil
        components?.fragment = nil
        return components?.url ?? base
    }

    /// Start URL the sign-in web view loads.
    /// - Parameter base: BFF origin.
    /// - Returns: the Feishu login handoff entry.
    static func loginURL(base: URL) -> URL {
        url(base: base, path: loginPath)
    }

    /// Cookie header that authenticates one company request.
    /// - Parameter sessionId: value read from the BFF's session cookie.
    /// @returns the `Cookie` header value.
    static func cookieHeader(sessionId: String) -> String {
        "\(sessionCookieName)=\(sessionId)"
    }

    /// Pick the BFF session cookie out of a web view's cookie store.
    ///
    /// A cookie for a parent domain applies to the BFF host as well, so the most
    /// specific matching domain wins when several are present.
    /// - Parameters:
    ///   - cookies: every cookie the web view holds.
    ///   - base: BFF origin the sign-in ran against.
    /// - Returns: the session cookie, or nil when the flow wrote none.
    static func sessionCookie(in cookies: [HTTPCookie], base: URL) -> HTTPCookie? {
        guard let host = base.host?.lowercased() else { return nil }
        return cookies
            .filter { $0.name == sessionCookieName && !$0.value.isEmpty }
            .filter { cookieDomain($0.domain, appliesTo: host) }
            .max { left, right in
                left.domain.count < right.domain.count
            }
    }

    /// Read the failure reason a login page appended to its URL.
    /// - Parameter url: page the sign-in web view settled on.
    /// - Returns: the localized reason, or nil when the page names no failure.
    static func failureMessage(from url: URL) -> String? {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let code = components.queryItems?.first(where: { $0.name == "error" })?.value
        else { return nil }
        switch code {
        case "feishu_denied":
            return "已取消飞书登录"
        case "feishu_email_missing":
            return "你的飞书账号未绑定企业邮箱，无法登录。请联系管理员补充邮箱后重试。"
        case "feishu_failed":
            return "飞书登录失败，请重试"
        default:
            return "飞书登录未完成，请重试"
        }
    }

    /// Verify one session and read its account.
    ///
    /// The profile route is the authenticated resource the web client uses. A
    /// read is tried first; a route that serves only the update method answers
    /// 405, and an empty update then returns the same user without changing a
    /// field.
    /// - Parameters:
    ///   - base: BFF origin.
    ///   - sessionId: value read from the BFF's session cookie.
    /// - Returns: the signed-in user.
    /// @throws CompanyAuthError when the service refuses the session or is unreachable.
    static func verify(base: URL, sessionId: String) async throws -> CompanyUser {
        let read = try await profile(base: base, sessionId: sessionId, method: "GET", body: nil)
        switch read.status {
        case 200 ..< 300:
            return try decodeUser(read.data)
        case 401, 403:
            throw CompanyAuthError.expired
        case 404, 405:
            let updated = try await profile(
                base: base,
                sessionId: sessionId,
                method: "PATCH",
                body: Data("{}".utf8)
            )
            switch updated.status {
            case 200 ..< 300:
                return try decodeUser(updated.data)
            case 401, 403:
                throw CompanyAuthError.expired
            default:
                throw reported(base: base, status: updated.status, method: "PATCH")
            }
        default:
            throw reported(base: base, status: read.status, method: "GET")
        }
    }

    /// End the BFF session best effort. The local copy is cleared by the caller
    /// whether or not the service confirms.
    /// - Parameters:
    ///   - base: BFF origin.
    ///   - sessionId: session to revoke.
    static func logout(base: URL, sessionId: String) async {
        var request = URLRequest(url: url(base: base, path: logoutPath))
        request.httpMethod = "POST"
        request.timeoutInterval = 10
        request.setValue(cookieHeader(sessionId: sessionId), forHTTPHeaderField: "Cookie")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data("{}".utf8)
        _ = try? await URLSession.shared.data(for: request)
    }

    /// One authenticated profile request.
    /// - Parameters:
    ///   - base: BFF origin.
    ///   - sessionId: session the request presents.
    ///   - method: HTTP method the profile route serves.
    ///   - body: request body for the update method.
    /// - Returns: response body and status.
    /// @throws CompanyAuthError.transport when the request never completes.
    private static func profile(
        base: URL,
        sessionId: String,
        method: String,
        body: Data?
    ) async throws -> (data: Data, status: Int) {
        let target = url(base: base, path: profilePath)
        var request = URLRequest(url: target)
        request.httpMethod = method
        request.timeoutInterval = 15
        request.setValue(cookieHeader(sessionId: sessionId), forHTTPHeaderField: "Cookie")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if body != nil {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        request.httpBody = body
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw CompanyAuthError.transport(error.localizedDescription)
        }
        guard let http = response as? HTTPURLResponse else {
            throw CompanyAuthError.transport("没有 HTTP 回应")
        }
        return (data, http.statusCode)
    }

    /// Report an unexpected profile status and record where it came from.
    /// - Parameters:
    ///   - status: HTTP status the route answered.
    ///   - method: request method.
    /// - Returns: the typed failure the caller throws.
    private static func reported(base: URL, status: Int, method: String) -> CompanyAuthError {
        let target = url(base: base, path: profilePath)
        AppLog.error(.network, "登录验证失败", detail: "\(method) \(target.absoluteString) → \(status)")
        return .server(status)
    }

    /// Decode the account a profile response names.
    ///
    /// The profile route returns the user directly; the login and session
    /// envelopes wrap the same fields under `user`.
    /// - Parameter data: response body.
    /// - Returns: the account it names.
    /// @throws CompanyAuthError.malformed when the body carries neither shape.
    static func decodeUser(_ data: Data) throws -> CompanyUser {
        let decoder = JSONDecoder()
        if let wrapped = try? decoder.decode(SessionResponse.self, from: data) {
            return wrapped.user
        }
        if let direct = try? decoder.decode(CompanyUser.self, from: data) {
            return direct
        }
        throw CompanyAuthError.malformed
    }

    /// Strip a configured URL down to the origin the routes are built on.
    /// - Parameter url: configured or overridden BFF URL.
    /// - Returns: scheme, host, and port only.
    private static func origin(of url: URL) -> URL {
        var components = URLComponents(url: url, resolvingAgainstBaseURL: false)
        components?.path = ""
        components?.query = nil
        components?.fragment = nil
        components?.user = nil
        components?.password = nil
        return components?.url ?? url
    }

    /// Whether one cookie domain applies to a request host.
    /// - Parameters:
    ///   - domain: cookie domain, with or without a leading dot.
    ///   - host: BFF host.
    /// - Returns: true for the host itself and for its parent domains.
    private static func cookieDomain(_ domain: String, appliesTo host: String) -> Bool {
        let cleaned = domain.lowercased().trimmingCharacters(in: CharacterSet(charactersIn: "."))
        guard !cleaned.isEmpty else { return false }
        return host == cleaned || host.hasSuffix("." + cleaned)
    }

    /// `GET /api/auth/session` envelope.
    private struct SessionResponse: Decodable {
        let user: CompanyUser
    }
}
