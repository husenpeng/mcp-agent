/** The gateway plugin publishes the read-only account view only when auth_service is configured. */
import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import type { Server } from 'node:http'
import { Socket } from 'node:net'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { Context } from '@tomato/cordis'
import type { HostConnectionHandle, PeerScope } from '@tomato/client-connection'
import type { WebRoute, WebServer } from '@tomato/host-webserver'
import * as Gateway from '@tomato/gateway'
import type { SessionUser } from '@tomato/gateway'

const contexts: Context[] = []
const servers: Server[] = []

afterEach(async () => {
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
  for (const server of servers.splice(0)) await new Promise<void>((resolve) => { server.close(() => { resolve() }) })
})

const ALICE: SessionUser = { id: 'u-alice', email: 'alice@example.com', name: 'Alice', avatarUrl: null, language: 'en' }

/** auth_service that verifies every session as Alice. */
async function authService(): Promise<string> {
  const server = createServer((request, response) => {
    request.resume()
    request.on('end', () => {
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end(JSON.stringify({ valid: true, user: ALICE }))
    })
  })
  servers.push(server)
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', () => { resolve() }) })
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}

/**
 * Mount the plugin over a Web server and Connection that admit every request and record routes.
 * @param authServiceUrl - auth_service base URL; an empty value mounts with no configured account.
 * @param companyWebUrl - company BFF origin the handoff starts on.
 * @param advertisedRoot - Web application root browsers use, when this deployment advertises one.
 */
async function mount(authServiceUrl: string, companyWebUrl = '', advertisedRoot?: string) {
  const ctx = new Context()
  contexts.push(ctx)
  const routes = new Map<string, WebRoute['handler']>()
  const webServer = {
    protocol: 'http:',
    getOrigin: () => 'http://127.0.0.1:4100',
    register: (route: WebRoute) => {
      routes.set(route.path, route.handler)
      return () => { routes.delete(route.path) }
    },
  } as WebServer
  // The routes only read whether admission rejected, so the admitted Peer is never inspected.
  const admitted: ReturnType<HostConnectionHandle['admit']> = { peer: {} as PeerScope }
  const connection = { admit: () => admitted } as Partial<HostConnectionHandle> as HostConnectionHandle
  ctx.provide('webServer', webServer)
  ctx.provide('connection', connection)
  if (advertisedRoot !== undefined) {
    ctx.provide('webApp', { getAdvertisedUrl: () => advertisedRoot })
  }
  // The Loader passes partial YAML config through the same schema, which fills every default.
  const fiber = await ctx.plugin(Gateway, Gateway.Config({ authServiceUrl, companyWebUrl } as Gateway.GatewayConfig))
  return { ctx, fiber, routes }
}

function sessionRequest(): IncomingMessage {
  const request = new IncomingMessage(new Socket())
  request.method = 'GET'
  request.url = '/api/auth/session'
  request.headers = { 'x-tomato-session': 's1' }
  return request
}

describe('gateway account service', () => {
  it('follows a verified browser session through the registered route and withdraws with the plugin', async () => {
    const { ctx, fiber, routes } = await mount(await authService())
    const account = ctx.get('tomatoAccount')
    expect(account?.current()).toEqual({ status: 'unknown' })
    await routes.get('/api/auth/session')?.(sessionRequest(), new ServerResponse(new IncomingMessage(new Socket())))
    expect(account?.current()).toEqual({ status: 'signed-in', user: ALICE })
    expect(Object.keys(account ?? {}).sort()).toEqual(['current', 'watch'])
    await fiber.dispose()
    expect(ctx.get('tomatoAccount')).toBeUndefined()
    expect(routes.size).toBe(0)
  })

  it('sends the handoff callback to the loopback origin the browser used', async () => {
    const { routes } = await mount(await authService(), 'https://company.example')
    const request = new IncomingMessage(new Socket())
    request.method = 'GET'
    request.url = '/api/auth/start'
    request.headers = { host: 'localhost:4100' }
    const response = new ServerResponse(new IncomingMessage(new Socket()))
    const captured: { status?: number; headers?: Record<string, unknown> } = {}
    response.writeHead = ((status: number, headers: Record<string, unknown>) => {
      captured.status = status
      captured.headers = headers
      return response
    }) as typeof response.writeHead
    response.end = (() => response) as typeof response.end
    await routes.get('/api/auth/start')?.(request, response)
    expect(captured.status).toBe(302)
    const location = new URL(String(captured.headers?.location))
    expect(location.origin).toBe('https://company.example')
    expect(location.searchParams.get('returnTo')).toMatch(/^http:\/\/localhost:4100\/api\/auth\/callback\?state=/)
  })

  /** Drive one `/api/auth/start` request and return the parsed BFF handoff URL. */
  async function handoff(routes: Map<string, WebRoute['handler']>, host: string): Promise<URL> {
    const request = new IncomingMessage(new Socket())
    request.method = 'GET'
    request.url = '/api/auth/start'
    request.headers = { host }
    const response = new ServerResponse(new IncomingMessage(new Socket()))
    const captured: Record<string, unknown> = {}
    response.writeHead = ((_status: number, headers: Record<string, unknown>) => {
      Object.assign(captured, headers)
      return response
    }) as typeof response.writeHead
    response.end = (() => response) as typeof response.end
    await routes.get('/api/auth/start')?.(request, response)
    return new URL(String(captured.location))
  }

  it('returns through the advertised root when a forwarding host presents its own authority', async () => {
    const { routes } = await mount(await authService(), 'https://company.example', 'https://hub.example/app/')
    const location = await handoff(routes, 'hub.example')
    // The prefix stays: the proxy strips it before the request reaches this listener.
    expect(location.searchParams.get('returnTo'))
      .toMatch(/^https:\/\/hub\.example\/app\/api\/auth\/callback\?state=/)
  })

  it('keeps the request origin for a loopback browser even when a root is advertised', async () => {
    const { routes } = await mount(await authService(), 'https://company.example', 'https://hub.example/app/')
    const location = await handoff(routes, '127.0.0.1:4100')
    expect(location.searchParams.get('returnTo'))
      .toMatch(/^http:\/\/127\.0\.0\.1:4100\/api\/auth\/callback\?state=/)
  })

  it('falls back to the listener origin when nothing is advertised', async () => {
    const { routes } = await mount(await authService(), 'https://company.example')
    const location = await handoff(routes, 'hub.example')
    expect(location.searchParams.get('returnTo'))
      .toMatch(/^http:\/\/127\.0\.0\.1:4100\/api\/auth\/callback\?state=/)
  })

  it('names no account when auth_service is not configured', async () => {
    const { ctx, routes } = await mount('')
    expect(ctx.get('tomatoAccount')).toBeUndefined()
    expect([...routes.keys()]).toContain('/api/auth/session')
  })
})
