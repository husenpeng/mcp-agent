import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { launchWebScaffold, type WebScaffold } from './scaffold.ts'

/** Read one request body. */
async function bodyOf(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

/** Run one JSON response. */
function json(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(value))
}

/** Start one local HTTP server on an ephemeral loopback port. */
async function listen(
  handler: (request: IncomingMessage, response: ServerResponse) => Promise<void>,
): Promise<{ server: Server; url: string }> {
  const server = createServer((request, response) => {
    void handler(request, response).catch((error: unknown) => {
      if (!response.headersSent) json(response, 500, { error: String(error) })
      else response.end()
    })
  })
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', resolve) })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('fake server did not bind')
  return { server, url: `http://127.0.0.1:${String(address.port)}` }
}

/** One forwarded service request captured by the fake upstream. */
interface Captured {
  method: string
  url: string
  headers: IncomingMessage['headers']
  body: string
}

describe('local gateway', () => {
  const closers: (() => Promise<void>)[] = []
  let scaffold: WebScaffold | undefined

  afterEach(async () => {
    try { await scaffold?.close() } finally { scaffold = undefined }
    for (const close of closers.splice(0)) await close()
  })

  it('logs in through the BFF handoff, projects the session, and forwards an injected identity', async () => {
    const captured: Captured[] = []
    const auth = await listen(async (request, response) => {
      if (request.url === '/api/v1/auth/session/verify') {
        const body = JSON.parse(await bodyOf(request)) as { sessionId?: string }
        json(response, 200, body.sessionId === 'session-1'
          ? { valid: true, user: { id: 'user-1', email: 'user@example.com', name: 'Test User', avatarUrl: null, language: 'zh-CN' } }
          : { valid: false })
        return
      }
      if (request.url === '/api/v1/auth/session/revoke') {
        await bodyOf(request)
        response.writeHead(204)
        response.end()
        return
      }
      if (request.url === '/api/v1/auth/handoff/redeem') {
        const body = JSON.parse(await bodyOf(request)) as { code?: string }
        json(response, body.code === 'handoff-code' ? 200 : 400, body.code === 'handoff-code'
          ? { sessionId: 'session-1' }
          : { error: { code: 'handoff-invalid' } })
        return
      }
      json(response, 404, {})
    })
    closers.push(async () => { await new Promise<void>((resolve) => { auth.server.close(() => { resolve() }) }) })
    const bff = await listen(async (request, response) => {
      const url = new URL(request.url ?? '/', 'http://bff.test')
      if (url.pathname !== '/api/auth/feishu/start') { json(response, 404, {}); return }
      const returnTo = url.searchParams.get('returnTo')
      if (returnTo === null) { json(response, 400, {}); return }
      response.writeHead(302, { location: `${returnTo}&code=handoff-code` })
      response.end()
    })
    closers.push(async () => { await new Promise<void>((resolve) => { bff.server.close(() => { resolve() }) }) })
    const service = await listen(async (request, response) => {
      const body = await bodyOf(request)
      captured.push({ method: request.method ?? 'GET', url: request.url ?? '/', headers: request.headers, body })
      json(response, 200, {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body,
      })
    })
    closers.push(async () => { await new Promise<void>((resolve) => { service.server.close(() => { resolve() }) }) })

    const overlay = join(await mkdtemp(join(tmpdir(), 'tomato-gateway-')), 'gateway.overlay.yml')
    await writeFile(overlay, [
      '- id: tomato-gateway',
      '  config:',
      `    authServiceUrl: ${auth.url}`,
      `    companyWebUrl: ${bff.url}`,
      '    services:',
      '      demo:',
      `        baseURL: ${service.url}`,
      '        userIdInjection: query',
      '',
    ].join('\n'))
    scaffold = await launchWebScaffold({ extraOverlayPath: overlay, deepSeekMissingCredential: true })

    const authenticate = await fetch(scaffold.authenticatedUrl, { redirect: 'manual' })
    const hostCookie = authenticate.headers.get('set-cookie')?.split(';')[0]
    expect(hostCookie).toContain('=')
    const host = scaffold.baseUrl

    const signedOut = await fetch(new URL('/api/auth/session', host), { headers: { cookie: hostCookie! } })
    await expect(signedOut.json()).resolves.toEqual({ status: 'signed-out' })

    const start = await fetch(new URL('/api/auth/start', host), { headers: { cookie: hostCookie! }, redirect: 'manual' })
    expect(start.status).toBe(302)
    const authorizeUrl = start.headers.get('location')
    expect(authorizeUrl).toContain('/api/auth/feishu/start')

    const callback = await fetch(authorizeUrl!, { redirect: 'manual' })
    expect(callback.status).toBe(302)
    const callbackUrl = callback.headers.get('location')
    expect(callbackUrl).toContain('/api/auth/callback')
    const completed = await fetch(callbackUrl!, { headers: { cookie: hostCookie! }, redirect: 'manual' })
    expect(completed.status).toBe(200)
    const tomatoCookie = completed.headers.get('set-cookie')?.split(';')[0]
    expect(tomatoCookie).toContain('tomato_session=')

    const session = await fetch(new URL('/api/auth/session', host), { headers: { cookie: `${hostCookie!}; ${tomatoCookie!}` } })
    await expect(session.json()).resolves.toMatchObject({ status: 'signed-in', user: { id: 'user-1' } })

    const forwarded = await fetch(new URL('/api/services/demo/echo?from=browser', host), {
      method: 'POST',
      headers: { cookie: `${hostCookie!}; ${tomatoCookie!}`, 'content-type': 'application/json' },
      body: JSON.stringify({ hello: 'world' }),
    })
    expect(forwarded.status).toBe(200)
    const echoed = await forwarded.json() as { url: string; headers: Record<string, string>; body: string }
    expect(echoed.url).toBe('/echo?from=browser&userId=user-1')
    expect(echoed.headers['x-tomato-user-id']).toBe('user-1')
    expect(JSON.parse(echoed.body)).toEqual({ hello: 'world' })

    const anonymous = await fetch(new URL('/api/services/demo/echo', host), { headers: { cookie: hostCookie! } })
    expect(anonymous.status).toBe(401)

    const authServiceRoute = await fetch(new URL('/api/services/auth/anything', host), {
      headers: { cookie: `${hostCookie!}; ${tomatoCookie!}` },
    })
    expect(authServiceRoute.status).toBe(404)

    const logout = await fetch(new URL('/api/auth/logout', host), {
      method: 'POST',
      headers: { cookie: `${hostCookie!}; ${tomatoCookie!}` },
    })
    await expect(logout.json()).resolves.toEqual({ remoteRevoked: true })
    expect(captured).toHaveLength(1)
  })

  it('reports unavailable without inventing a session', async () => {
    const overlay = join(await mkdtemp(join(tmpdir(), 'tomato-gateway-')), 'gateway.overlay.yml')
    await writeFile(overlay, [
      '- id: tomato-gateway',
      '  config:',
      "    authServiceUrl: ''",
      "    companyWebUrl: ''",
      '    services: {}',
      '',
    ].join('\n'))
    scaffold = await launchWebScaffold({ extraOverlayPath: overlay, deepSeekMissingCredential: true })
    const authenticate = await fetch(scaffold.authenticatedUrl, { redirect: 'manual' })
    const hostCookie = authenticate.headers.get('set-cookie')?.split(';')[0]
    const session = await fetch(new URL('/api/auth/session', scaffold.baseUrl), { headers: { cookie: hostCookie! } })
    expect(session.status).toBe(503)
    await expect(session.json()).resolves.toEqual({ status: 'unavailable' })
    const start = await fetch(new URL('/api/auth/start', scaffold.baseUrl), { headers: { cookie: hostCookie! }, redirect: 'manual' })
    expect(start.status).toBe(503)
  })
})
