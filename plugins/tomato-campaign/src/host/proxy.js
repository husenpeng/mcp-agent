/**
 * Same-origin reverse proxy for the company BFF.
 *
 * The browser calls `<harness>/api/clientweb/**`; this handler forwards to
 * `<company>/api/**`, translating the gateway's `tomato_session` cookie into the
 * BFF's `session_id` cookie. Keeping the browser on the harness origin avoids
 * third-party-cookie and SameSite problems entirely: the page, the proxy, and the
 * session cookie are all same-site.
 */

import http from 'node:http'
import https from 'node:https'
import { isConfigured } from './config.js'
import { sessionOf } from './session.js'

/** Headers that must not be forwarded in either direction. */
const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade',
])

/** Request headers the proxy owns rather than forwards. */
const OWNED_REQUEST_HEADERS = new Set([
  'host', 'cookie', 'origin', 'referer', 'content-length', 'x-session-user-id', 'x-tomato-session',
])

/**
 * Send one JSON answer.
 * @param response - node response.
 * @param status - HTTP status.
 * @param value - JSON body.
 */
function sendJson(response, status, value) {
  const body = JSON.stringify(value)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  response.end(body)
}

/**
 * Whether the request's `Origin`, when present, matches its own host.
 * @param request - node request.
 * @returns true when same-origin or when no Origin was sent (server-side caller).
 */
function sameOrigin(request) {
  const origin = request.headers.origin
  if (!origin) return true
  try {
    return new URL(origin).host === request.headers.host
  } catch {
    return false
  }
}

/**
 * Rewrite one upstream `set-cookie` value so the harness keeps its own cookies.
 * @param value - upstream Set-Cookie.
 * @returns the value to forward, or undefined to drop it.
 */
function filterSetCookie(value) {
  const name = value.split(';', 1)[0]?.split('=', 1)[0]?.trim()
  if (name === 'session_id' || name === 'tomato_session') return undefined
  return value.replace(/;\s*secure/gi, '').replace(/;\s*samesite=none/gi, '; SameSite=Lax')
}

/**
 * Build the proxy handler.
 * @param options - resolved config, the shared session slot, and the harness origin.
 * @returns a node request handler.
 */
export function createProxy({ config, state, origin }) {
  return function handler(request, response) {
    if (!sameOrigin(request)) {
      sendJson(response, 403, { error: { code: 'CROSS_ORIGIN', message: '只接受同源请求。' } })
      return
    }
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    if (url.pathname !== config.proxyPath && !url.pathname.startsWith(`${config.proxyPath}/`)) {
      sendJson(response, 404, { error: { code: 'NOT_FOUND', message: '未知的代理路径。' } })
      return
    }
    const rest = url.pathname.slice(config.proxyPath.length) || '/'
    if (rest === '/_status' || rest === '/_status/') {
      // The status is a projection of THIS request: the Desktop injects
      // `x-tomato-session`, a Web browser carries `tomato_session`, and no
      // proxied API call has run yet on first paint. Reading the in-memory slot
      // alone reported signed-out for a signed-in account.
      const session = sessionOf(request.headers, config)
      if (session) state.sessionId = session
      sendJson(response, 200, {
        signedIn: session !== undefined,
        configured: isConfigured(config),
        companyWebUrl: config.baseUrl,
        proxyPath: config.proxyPath,
        origin,
      })
      return
    }
    if (!isConfigured(config)) {
      sendJson(response, 503, { error: { code: 'UNCONFIGURED', message: '公司 BFF 未配置：设置插件 baseUrl（或 TOMATO_WEB_URL）。' } })
      return
    }
    const session = sessionOf(request.headers, config)
    if (!session) {
      sendJson(response, 401, { error: { code: 'NOT_SIGNED_IN', message: '还没有登录公司账号。' } })
      return
    }
    state.sessionId = session

    const upstreamPath = `/api${rest.startsWith('/') ? rest : `/${rest}`}${url.search}`
    const target = new URL(config.baseUrl)
    const headers = {}
    for (const [name, value] of Object.entries(request.headers)) {
      if (value === undefined) continue
      if (HOP_BY_HOP.has(name) || OWNED_REQUEST_HEADERS.has(name)) continue
      headers[name] = value
    }
    headers.host = target.host
    headers.cookie = `session_id=${session}`

    const transport = target.protocol === 'https:' ? https : http
    const upstream = transport.request({
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      method: request.method,
      path: upstreamPath,
      headers,
      timeout: config.timeoutMs,
    }, (upstreamResponse) => {
      const status = upstreamResponse.statusCode ?? 502
      const location = upstreamResponse.headers.location
      // The BFF sends a page redirect for expired sessions; an API call must see 401.
      if (status >= 300 && status < 400 && typeof location === 'string' && location.includes('/login')) {
        upstreamResponse.resume()
        sendJson(response, 401, { error: { code: 'UNAUTHENTICATED', message: '会话已失效，请重新登录。' } })
        return
      }
      const outgoing = {}
      for (const [name, value] of Object.entries(upstreamResponse.headers)) {
        if (value === undefined || HOP_BY_HOP.has(name)) continue
        if (name === 'set-cookie') {
          const kept = Array.isArray(value) ? value.map(filterSetCookie).filter(Boolean) : []
          if (kept.length > 0) outgoing[name] = kept
          continue
        }
        if (name === 'location' && typeof value === 'string' && value.startsWith(config.baseUrl)) {
          outgoing[name] = config.proxyPath + value.slice(config.baseUrl.length).replace(/^\/api/, '')
          continue
        }
        outgoing[name] = value
      }
      response.writeHead(status, outgoing)
      upstreamResponse.pipe(response)
    })

    upstream.on('timeout', () => {
      upstream.destroy(new Error(`upstream timeout after ${config.timeoutMs} ms`))
    })
    upstream.on('error', (cause) => {
      if (response.headersSent) {
        response.destroy(cause)
        return
      }
      sendJson(response, 502, {
        error: { code: 'UPSTREAM_UNAVAILABLE', message: `公司 BFF 不可达：${cause.message}`, retryable: true },
      })
    })
    request.on('aborted', () => { upstream.destroy() })
    request.pipe(upstream)
  }
}