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

/** Mount the plugin over a Web server and Connection that admit every request and record routes. */
async function mount(authServiceUrl: string) {
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
  // The Loader passes partial YAML config through the same schema, which fills every default.
  const fiber = await ctx.plugin(Gateway, Gateway.Config({ authServiceUrl } as Gateway.GatewayConfig))
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

  it('names no account when auth_service is not configured', async () => {
    const { ctx, routes } = await mount('')
    expect(ctx.get('tomatoAccount')).toBeUndefined()
    expect([...routes.keys()]).toContain('/api/auth/session')
  })
})
