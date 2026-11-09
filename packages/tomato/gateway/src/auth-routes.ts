/** `/api/auth/*`: Feishu start/callback, session projection, and logout. */

import { createHash, randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { AuthService } from './auth-service.ts'
import type { Config } from './config.ts'
import { clearSessionCookie, requestSessionId, sessionCookie } from './cookies.ts'
import type { LoginAttempt, LoginFailure } from './types.ts'

/** One active login attempt. */
interface Attempt extends LoginAttempt {
  readonly state: string
}

/** Remove expired attempts and bound the map so a stuck client cannot grow it without limit. */
const MAX_ATTEMPTS = 32

/** Send one JSON response without caching. */
function sendJson(response: ServerResponse, status: number, value: unknown, headers: Record<string, string> = {}): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  })
  response.end(JSON.stringify(value))
}

/**
 * Render the popup result page and close itself after notifying an opener.
 * @param ok - whether the handoff succeeded.
 * @param failure - failure vocabulary for the popup, when it did not.
 * @param desktop - whether the page belongs to the isolated Desktop window.
 * @returns the callback HTML.
 */
function callbackPage(ok: boolean, failure?: LoginFailure, desktop = false): string {
  const payload = ok
    ? "{ type: 'tomato-auth-result', ok: true }"
    : `{ type: 'tomato-auth-result', ok: false, errorCode: '${failure ?? 'failed'}' }`
  const message = ok ? '登录成功，可以关闭此窗口。' : '登录未完成，请回到应用重试。'
  return '<!doctype html><meta charset="utf-8"><title>Tomato AI</title>'
    + '<p>' + message + '</p>'
    + '<script>try { if (window.opener) window.opener.postMessage(' + payload + ', window.location.origin) }'
    + ' finally { if (window.opener || ' + String(desktop) + ') window.close()'
    + ' else window.location.replace("/") }</script>'
}

/** Map the BFF's login-page reason to the local callback failure vocabulary. */
function failureOf(value: string | null): LoginFailure {
  switch (value) {
    case 'feishu_denied': return 'denied'
    case 'feishu_email_missing': return 'email-missing'
    default: return 'failed'
  }
}

/** Loopback hostnames the handoff contract admits as callback origins. */
const LOOPBACK_HOSTNAMES: ReadonlySet<string> = new Set(['127.0.0.1', 'localhost', '[::1]', '::1'])

/**
 * Resolve the callback origin from the request's own Host header when it names
 * a loopback host. The advertised origin and the browser's origin can differ
 * (`localhost` vs `127.0.0.1`); the callback must land on the origin the
 * browser actually uses or its session cookie is written to the other host.
 * @param host - incoming Host header, including the port.
 * @param secure - whether the listener serves TLS.
 * @returns the request origin, or undefined for an absent or non-loopback host.
 */
function loopbackRequestOrigin(host: string | undefined, secure: boolean): string | undefined {
  if (host === undefined || host.trim() === '') return undefined
  let url: URL
  try { url = new URL(`${secure ? 'https' : 'http'}://${host}`) }
  catch { return undefined }
  return LOOPBACK_HOSTNAMES.has(url.hostname) ? url.origin : undefined
}

/** Owns the login attempt map and the auth routes' shared dependencies. */
export class AuthRoutes {
  private readonly attempts = new Map<string, Attempt>()
  private readonly secure: boolean
  private advertisedRoot: (() => string) | undefined

  /**
   * @param config - validated gateway configuration.
   * @param auth - auth_service client.
   * @param origin - this gateway's absolute origin.
   * @param secure - whether the listener serves TLS.
   * @param onSignedOut - called when the browser has no session: on a logout before the remote revoke, and on a
   *   session request without a session id.
   */
  constructor(
    private readonly config: Config,
    private readonly auth: AuthService,
    private readonly origin: string,
    secure: boolean,
    private readonly onSignedOut: () => void = () => {},
  ) {
    this.secure = secure
  }

  /**
   * Point the sign-in return leg at the root browsers actually use.
   *
   * A request that arrives through a forwarding host presents that host's
   * authority, not this listener's, so deriving the callback from the request
   * would send the browser back to a loopback address it cannot reach. The
   * advertised root is a configured single value rather than a value read from
   * the request, so adopting it cannot redirect anywhere an operator did not
   * already publish. A loopback request still wins: there the request's own
   * origin is the one whose session cookie the browser must receive.
   * @param supplier - reads the advertised root, normalised to end in `/`; omitted means never advertised.
   */
  setAdvertisedRoot(supplier: (() => string) | undefined): void {
    this.advertisedRoot = supplier
  }

  /** Drop one expired attempt, or the oldest attempt when the map is full. */
  private prune(): void {
    const now = Date.now()
    for (const [state, attempt] of this.attempts) {
      if (attempt.expiresAt <= now) this.attempts.delete(state)
    }
    if (this.attempts.size < MAX_ATTEMPTS) return
    const oldest = [...this.attempts.entries()].sort((left, right) => left[1].expiresAt - right[1].expiresAt)[0]
    if (oldest !== undefined) this.attempts.delete(oldest[0])
  }

  /**
   * Begin one login: keep the verifier locally, send only its challenge to the
   * company BFF, and return the BFF start URL to the caller.
   * @param request - browser request.
   * @param response - browser response.
   */
  start(request: IncomingMessage, response: ServerResponse): void {
    if (!this.auth.configured() || this.config.companyWebUrl === '') {
      response.writeHead(503, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
      response.end('login is not configured')
      return
    }
    let company: URL
    try {
      company = new URL(this.config.companyWebUrl)
    } catch {
      response.writeHead(503, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
      response.end('login is not configured')
      return
    }
    if (company.username !== '' || company.password !== '' || (company.protocol !== 'https:' && company.protocol !== 'http:')) {
      response.writeHead(503, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' })
      response.end('login is not configured')
      return
    }
    this.prune()
    const state = randomBytes(16).toString('base64url')
    const verifier = randomBytes(32).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')
    const desktop = new URL(request.url ?? '/', this.origin).searchParams.get('desktop') === '1'
    const origin = loopbackRequestOrigin(request.headers.host, this.secure)
      ?? this.advertisedRoot?.()
      ?? this.origin
    const returnTo = `${origin}${origin.endsWith('/') ? '' : '/'}api/auth/callback?state=${encodeURIComponent(state)}${desktop ? '&desktop=1' : ''}`
    this.attempts.set(state, {
      state,
      verifier,
      returnTo,
      expiresAt: Date.now() + this.config.stateTtlMs,
    })
    const target = new URL('/api/auth/feishu/start', company.origin)
    target.searchParams.set('clientState', challenge)
    target.searchParams.set('returnTo', returnTo)
    response.writeHead(302, { location: target.href, 'cache-control': 'no-store' })
    response.end()
  }

  /**
   * Finish one login: verify the state, redeem the one-time code, and set the
   * local session cookie.
   * @param request - callback request from the BFF.
   * @param response - browser response.
   */
  async callback(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const url = new URL(request.url ?? '/', this.origin)
    const state = url.searchParams.get('state')
    const code = url.searchParams.get('code')
    const feishuError = url.searchParams.get('error')
    if (feishuError !== null) {
      if (state !== null) this.attempts.delete(state)
      this.renderCallback(response, 200, false, failureOf(feishuError), undefined, url.searchParams.get('desktop') === '1')
      return
    }
    if (state === null || code === null || code === '') {
      this.renderCallback(response, 400, false, 'failed', undefined, url.searchParams.get('desktop') === '1')
      return
    }
    const attempt = this.attempts.get(state)
    if (attempt === undefined || attempt.expiresAt <= Date.now()) {
      this.attempts.delete(state)
      this.renderCallback(response, 400, false, 'failed', undefined, url.searchParams.get('desktop') === '1')
      return
    }
    this.attempts.delete(state)
    const redeemed = await this.auth.redeem(code, attempt.verifier, attempt.returnTo)
    if (redeemed.kind !== 'redeemed') {
      this.renderCallback(response, redeemed.kind === 'refused' ? 400 : 503, false, 'failed', undefined, url.searchParams.get('desktop') === '1')
      return
    }
    this.renderCallback(response, 200, true, undefined, sessionCookie(redeemed.sessionId, this.secure), url.searchParams.get('desktop') === '1')
  }

  /** Render the small callback HTML page, optionally setting the session cookie. */
  private renderCallback(
    response: ServerResponse,
    status: number,
    ok: boolean,
    failure?: LoginFailure,
    cookie?: string,
    desktop = false,
  ): void {
    response.writeHead(status, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      ...cookie === undefined ? {} : { 'set-cookie': cookie },
    })
    response.end(callbackPage(ok, failure, desktop))
  }

  /**
   * Project the current session as the three-state account view.
   * @param request - browser request.
   * @param response - browser response.
   */
  async session(request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (!this.auth.configured()) {
      sendJson(response, 503, { status: 'unavailable' })
      return
    }
    const sessionId = requestSessionId(request)
    if (sessionId === undefined) {
      this.onSignedOut()
      sendJson(response, 200, { status: 'signed-out' })
      return
    }
    const verified = await this.auth.verify(sessionId)
    if (verified.kind === 'valid') {
      sendJson(response, 200, { status: 'signed-in', user: verified.user })
      return
    }
    if (verified.kind === 'invalid') {
      sendJson(response, 200, { status: 'signed-out' }, { 'set-cookie': clearSessionCookie(this.secure) })
      return
    }
    sendJson(response, 503, { status: 'unavailable' })
  }

  /**
   * Revoke the auth_service session best-effort and always clear the local cookie.
   * @param request - browser request.
   * @param response - browser response.
   */
  async logout(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const sessionId = requestSessionId(request)
    // Host-side state stops naming the account before the remote revoke settles.
    this.onSignedOut()
    const remoteRevoked = sessionId === undefined ? false : await this.auth.revoke(sessionId)
    sendJson(response, 200, { remoteRevoked }, { 'set-cookie': clearSessionCookie(this.secure) })
  }
}

/** @returns the encoded callback HTML for tests and route handlers. */
export { callbackPage as renderCallbackPage }
