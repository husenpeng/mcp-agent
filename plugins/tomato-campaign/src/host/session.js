/**
 * Session extraction shared by the proxy and the tools.
 *
 * The browser holds `tomato_session` (written by the local gateway), which is the
 * auth_service session id. The company BFF wants that value as `session_id`, so
 * the plugin only translates names and never stores credentials on disk.
 */

/**
 * Read one cookie value from a raw `cookie` header.
 * @param header - request `cookie` header.
 * @param name - exact cookie name.
 * @returns the value, or undefined when absent or empty.
 */
export function readCookie(header, name) {
  if (typeof header !== 'string' || header === '') return undefined
  for (const part of header.split(';')) {
    const separator = part.indexOf('=')
    if (separator < 0) continue
    if (part.slice(0, separator).trim() !== name) continue
    const value = part.slice(separator + 1).trim()
    return value === '' ? undefined : value
  }
  return undefined
}

/**
 * Read the auth session id from the request: Desktop header first, then the cookie.
 * @param headers - node request headers.
 * @param config - resolved plugin configuration.
 * @returns the session id, or undefined when the caller is signed out.
 */
export function sessionOf(headers, config) {
  const header = headers[config.sessionHeader]
  const fromHeader = Array.isArray(header) ? header[0] : header
  if (fromHeader) return fromHeader
  return readCookie(headers.cookie, config.sessionCookie)
}