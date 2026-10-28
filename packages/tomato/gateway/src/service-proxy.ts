/** `/api/services/*`: fixed-table HTTP forwarding with session-derived identity. */

import type { IncomingMessage, ServerResponse } from 'node:http'
import { Readable } from 'node:stream'
import type { Context } from '@tomato/cordis'
import { AuthService } from './auth-service.ts'
import type { Config, ServiceEntry, UserIdInjection } from './config.ts'
import { requestSessionId } from './cookies.ts'
import type { SessionUser } from './types.ts'

/** Headers that describe the local hop or carry credentials the browser must not forward. */
const DROPPED_REQUEST_HEADERS = new Set([
  'host', 'connection', 'content-length', 'cookie', 'authorization', 'x-tomato-session',
  'x-tomato-user-id', 'x-session-user-id', 'origin', 'referer', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest',
  'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip',
  'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade',
])

/** Response headers the gateway owns or Node fetch already decoded. */
const DROPPED_RESPONSE_HEADERS = new Set([
  'set-cookie', 'content-encoding', 'content-length', 'connection', 'keep-alive',
  'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade',
])

/** One resolved service row. */
interface ResolvedService {
  readonly id: string
  readonly url: URL
  readonly entry: ServiceEntry
}

/** Read a request body up to a byte cap. */
async function readBody(request: IncomingMessage, limit: number): Promise<Buffer | undefined> {
  const declared = request.headers['content-length']
  if (declared !== undefined && Number(declared) > limit) return undefined
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of request) {
    const buffer = chunk as Buffer
    total += buffer.byteLength
    if (total > limit) return undefined
    chunks.push(buffer)
  }
  return Buffer.concat(chunks)
}

/** Resolve one configured injection to its field and name. */
function injectionOf(value: UserIdInjection | undefined): { readonly in: 'query' | 'body'; readonly name: string } | undefined {
  if (value === undefined) return undefined
  if (value === 'query') return { in: 'query', name: 'userId' }
  if (value === 'body') return { in: 'body', name: 'userId' }
  return value
}

/** Send a JSON error without leaking upstream details. */
function sendError(response: ServerResponse, status: number, code: string): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  response.end(JSON.stringify({ error: { code } }))
}

/** Build the upstream target, rejecting path traversal and absolute-path escalation. */
function targetOf(service: ResolvedService, remainder: string, search: string): URL | undefined {
  let decoded: string
  try { decoded = decodeURIComponent(remainder) } catch { return undefined }
  if (decoded.includes('\\') || decoded.split('/').some(segment => segment === '..' || segment === '.')) return undefined
  const base = service.url.href.replace(/\/+$/u, '')
  try {
    return new URL(`${base}${remainder}${search}`)
  } catch {
    return undefined
  }
}

/** Forward the browser's request headers, adding the gateway-owned identity. */
function upstreamHeaders(request: IncomingMessage, user: SessionUser, body: Buffer | undefined): Headers {
  const headers = new Headers()
  for (const [name, value] of Object.entries(request.headers)) {
    if (value === undefined || DROPPED_REQUEST_HEADERS.has(name)) continue
    for (const item of Array.isArray(value) ? value : [value]) headers.append(name, item)
  }
  headers.set('x-tomato-user-id', user.id)
  if (body !== undefined) {
    headers.set('content-length', String(body.byteLength))
    if (!headers.has('content-type')) headers.set('content-type', 'application/json')
  }
  return headers
}

/** Copy an upstream response, streaming its body with backpressure. */
async function writeUpstream(response: ServerResponse, upstream: Response): Promise<void> {
  const headers: Record<string, string> = {}
  for (const [name, value] of upstream.headers) {
    if (DROPPED_RESPONSE_HEADERS.has(name)) continue
    headers[name] = value
  }
  headers['cache-control'] = upstream.headers.get('cache-control') ?? 'no-store'
  response.writeHead(upstream.status, headers)
  if (upstream.body === null) {
    response.end()
    return
  }
  for await (const chunk of upstream.body) {
    if (response.destroyed) return
    if (!response.write(chunk)) {
      await new Promise<void>((resolve) => {
        const done = (): void => {
          response.off('drain', done)
          response.off('close', done)
          resolve()
        }
        response.once('drain', done)
        response.once('close', done)
      })
    }
  }
  response.end()
}

/** Forward one browser service request. */
export class ServiceProxy {
  private readonly services = new Map<string, ResolvedService>()
  /** Path prefix this proxy owns on the Host webserver. */
  readonly prefix = '/api/services'

  /**
   * @param ctx - Host context carrying Connection admission.
   * @param config - validated gateway configuration.
   * @param auth - auth_service session verifier.
   */
  constructor(
    private readonly ctx: Context,
    private readonly config: Config,
    private readonly auth: AuthService,
  ) {
    for (const [id, entry] of Object.entries(config.services)) {
      const url = new URL(entry.baseURL)
      if (url.username !== '' || url.password !== '' || url.search !== '' || url.hash !== ''
        || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
        throw new Error(`tomato-gateway: service "${id}" has an invalid baseURL`)
      }
      this.services.set(id, { id, url, entry })
    }
  }

  /**
   * Handle one `/api/services/<service>/<path>` request.
   * @param request - browser request.
   * @param response - browser response.
   */
  async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const admission = this.ctx.connection.admit(request)
    if ('rejection' in admission) {
      response.writeHead(admission.rejection)
      response.end(admission.rejection === 401 ? 'unauthorized' : 'forbidden')
      return
    }
    const url = new URL(request.url ?? '/', 'http://tomato.internal')
    const rest = url.pathname.slice(this.prefix.length).replace(/^\//u, '')
    const separator = rest.indexOf('/')
    const id = separator < 0 ? rest : rest.slice(0, separator)
    const remainder = separator < 0 ? '' : rest.slice(separator)
    const service = this.services.get(id)
    if (service === undefined) {
      sendError(response, 404, 'gateway/service-not-found')
      return
    }
    const sessionId = requestSessionId(request)
    if (sessionId === undefined) {
      sendError(response, 401, 'auth/required')
      return
    }
    const verified = await this.auth.verify(sessionId)
    if (verified.kind === 'invalid') {
      sendError(response, 401, 'auth/invalid')
      return
    }
    if (verified.kind === 'unavailable') {
      sendError(response, 503, 'auth/unavailable')
      return
    }
    const target = targetOf(service, remainder, url.search)
    if (target === undefined) {
      sendError(response, 400, 'gateway/path-invalid')
      return
    }
    const injection = injectionOf(service.entry.userIdInjection)
    const maxBody = service.entry.maxRequestBodyBytes ?? this.config.maxRequestBodyBytes
    let body: Buffer | undefined
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (injection?.in === 'body') {
        const declared = request.headers['content-length']
        if (declared !== undefined && Number(declared) > maxBody) {
          sendError(response, 413, 'gateway/body-too-large')
          return
        }
        body = await readBody(request, maxBody)
        if (body === undefined) {
          sendError(response, 413, 'gateway/body-too-large')
          return
        }
        let parsed: unknown = {}
        if (body.byteLength > 0) {
          try { parsed = JSON.parse(body.toString('utf8')) } catch {
            sendError(response, 415, 'gateway/body-invalid')
            return
          }
        }
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
          sendError(response, 415, 'gateway/body-invalid')
          return
        }
        body = Buffer.from(JSON.stringify({ ...(parsed as Record<string, unknown>), [injection.name]: verified.user.id }))
      }
    }
    if (injection?.in === 'query') target.searchParams.set(injection.name, verified.user.id)
    const headers = upstreamHeaders(request, verified.user, body)
    const abort = new AbortController()
    response.on('close', () => { if (!response.writableEnded) abort.abort() })
    const timeout = AbortSignal.timeout(service.entry.timeoutMs ?? this.config.requestTimeoutMs)
    const signal = AbortSignal.any([abort.signal, timeout])
    const method = request.method ?? 'GET'
    const streaming = body === undefined && method !== 'GET' && method !== 'HEAD'
    const init: RequestInit & { duplex?: 'half' } = {
      method,
      headers,
      redirect: 'manual',
      signal,
      cache: 'no-store',
    }
    if (body !== undefined) init.body = body.toString('utf8')
    else if (streaming) {
      init.body = Readable.toWeb(request) as ReadableStream<Uint8Array>
      init.duplex = 'half'
    }
    try {
      const upstream = await fetch(target, init)
      if (upstream.status >= 300 && upstream.status < 400 && upstream.status !== 304) {
        await upstream.body?.cancel()
        sendError(response, 502, 'gateway/upstream-redirect')
        return
      }
      await writeUpstream(response, upstream)
    } catch {
      if (response.destroyed) return
      if (response.headersSent) {
        response.destroy()
        return
      }
      sendError(response, timeout.aborted ? 504 : 502,
        timeout.aborted ? 'gateway/upstream-timeout' : 'gateway/upstream-unreachable')
    } finally {
      if (streaming) request.destroy()
    }
  }
}
