/** Cookie parsing and session-cookie serialization for the gateway's own origin. */

import type { IncomingMessage } from 'node:http'

/** Gateway-owned session cookie; distinct from the BFF `session_id` and Host auth cookies. */
export const SESSION_COOKIE = 'tomato_session'

/** Header the Desktop main process uses to carry the stored auth_service session id. */
export const DESKTOP_SESSION_HEADER = 'x-tomato-session'

/**
 * Read one cookie value without implementing general cookie decoding.
 * @param header - raw `cookie` request header.
 * @param name - exact cookie name.
 * @returns the value, or undefined when absent.
 */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (header === undefined) return undefined
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
 * Read the auth_service session id from the Desktop header first, then the Web cookie.
 * @param request - incoming browser or Desktop-forwarded request.
 * @returns the session id, or undefined when signed out.
 */
export function requestSessionId(request: Pick<IncomingMessage, 'headers'>): string | undefined {
  const desktop: string | string[] | undefined = request.headers[DESKTOP_SESSION_HEADER]
  const value = Array.isArray(desktop) ? desktop[0] : desktop
  if (value !== undefined && value !== '') return value
  const cookie: string | undefined = request.headers.cookie
  return readCookie(cookie, SESSION_COOKIE)
}

/**
 * Serialize the session cookie: HttpOnly, SameSite=Lax, session-scoped.
 * @param value - auth_service session id.
 * @param secure - whether this listener serves TLS.
 * @returns one `Set-Cookie` value.
 */
export function sessionCookie(value: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax${secure ? '; Secure' : ''}`
}

/**
 * Serialize a clearing session cookie.
 * @param secure - whether this listener serves TLS.
 * @returns one `Set-Cookie` value that expires the cookie.
 */
export function clearSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`
}
