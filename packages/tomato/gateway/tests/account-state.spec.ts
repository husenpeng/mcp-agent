/** Host account state follows auth_service verifications, logins, and logouts observed by the gateway routes. */
import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import type { Server } from 'node:http'
import { Socket } from 'node:net'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountState, AuthRoutes, AuthService } from '@tomato/gateway'
import type { CurrentAccount, GatewayConfig, SessionUser } from '@tomato/gateway'

const servers: Server[] = []

afterEach(async () => {
  vi.restoreAllMocks()
  for (const server of servers.splice(0)) await new Promise<void>((resolve) => { server.close(() => { resolve() }) })
})

const ALICE: SessionUser = { id: 'u-alice', email: 'alice@example.com', name: 'Alice', avatarUrl: null, language: 'zh' }

/** One scripted verify answer. */
interface Answer { status: number; body?: unknown }

/** A fake auth_service whose verify answer each test controls. */
async function authService(answer: Answer): Promise<{ url: string; set(next: Answer): void }> {
  let current = answer
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    request.resume()
    request.on('end', () => {
      if (request.url === '/api/v1/auth/session/revoke') {
        response.writeHead(204)
        response.end()
        return
      }
      response.writeHead(current.status, { 'content-type': 'application/json' })
      response.end(current.body === undefined ? '' : JSON.stringify(current.body))
    })
  })
  servers.push(server)
  await new Promise<void>((resolve) => { server.listen(0, '127.0.0.1', () => { resolve() }) })
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}`, set(next) { current = next } }
}

/** A response without a socket: Node buffers its output, and the tests observe account state, not HTTP. */
function recorder(): ServerResponse {
  return new ServerResponse(new IncomingMessage(new Socket()))
}

function request(headers: Record<string, string>): IncomingMessage {
  const incoming = new IncomingMessage(new Socket())
  incoming.headers = headers
  incoming.url = '/api/auth/session'
  return incoming
}

/** Wire the routes exactly as the plugin does; tests read the published view. */
function wire(url: string) {
  const state = new AccountState()
  const account = state.view()
  const seen: CurrentAccount[] = []
  account.watch((next) => { seen.push(next) })
  const config: GatewayConfig = {
    authServiceUrl: url,
    companyWebUrl: '',
    services: {},
    verifyTimeoutMs: 1000,
    requestTimeoutMs: 1000,
    maxRequestBodyBytes: 1024,
    stateTtlMs: 60_000,
  }
  const auth = new AuthService(url, config.verifyTimeoutMs, config.requestTimeoutMs, (outcome) => { state.observe(outcome) })
  const routes = new AuthRoutes(config, auth, 'http://127.0.0.1', false, () => { state.signOut() })
  return { account, seen, routes }
}

describe('AccountState through the gateway routes', () => {
  it('starts unknown, records a verified user, and keeps it on an unavailable verification', async () => {
    const fake = await authService({ status: 200, body: { valid: true, user: ALICE } })
    const { account, seen, routes } = wire(fake.url)
    expect(account.current()).toEqual({ status: 'unknown' })
    await routes.session(request({ 'x-tomato-session': 's1' }), recorder())
    expect(account.current()).toEqual({ status: 'signed-in', user: ALICE })
    fake.set({ status: 502 })
    await routes.session(request({ 'x-tomato-session': 's1' }), recorder())
    expect(account.current()).toEqual({ status: 'signed-in', user: ALICE })
    expect(seen).toEqual([{ status: 'signed-in', user: ALICE }])
  })

  it('carries verified roles and quotas into the Host account', async () => {
    const user = { ...ALICE, roles: ['admin'], quotas: { 'model.tokens.daily': 2000 } }
    const fake = await authService({ status: 200, body: { valid: true, user } })
    const { account, routes } = wire(fake.url)
    await routes.session(request({ cookie: 'tomato_session=s1' }), recorder())
    expect(account.current()).toEqual({ status: 'signed-in', user })
  })

  it('switches account on a different verified user and signs out on an invalid session, a logout, or a missing session', async () => {
    const fake = await authService({ status: 200, body: { valid: true, user: ALICE } })
    const { account, seen, routes } = wire(fake.url)
    await routes.session(request({ cookie: 'tomato_session=s1' }), recorder())
    const bob = { ...ALICE, id: 'u-bob', email: 'bob@example.com', name: 'Bob' }
    fake.set({ status: 200, body: { valid: true, user: bob } })
    await routes.session(request({ cookie: 'tomato_session=s2' }), recorder())
    expect(account.current()).toEqual({ status: 'signed-in', user: bob })
    fake.set({ status: 200, body: { valid: false } })
    await routes.session(request({ cookie: 'tomato_session=s2' }), recorder())
    expect(account.current()).toEqual({ status: 'signed-out' })
    fake.set({ status: 200, body: { valid: true, user: ALICE } })
    await routes.session(request({ cookie: 'tomato_session=s3' }), recorder())
    await routes.logout(request({ cookie: 'tomato_session=s3' }), recorder())
    expect(account.current()).toEqual({ status: 'signed-out' })
    await routes.session(request({ cookie: 'tomato_session=s4' }), recorder())
    await routes.session(request({}), recorder())
    expect(account.current()).toEqual({ status: 'signed-out' })
    expect(seen.map(entry => entry.status === 'signed-in' ? entry.user.id : entry.status))
      .toEqual(['u-alice', 'u-bob', 'signed-out', 'u-alice', 'signed-out', 'u-alice', 'signed-out'])
  })

  it('publishes nothing for an equal state, removes listeners, and contains a failing listener', () => {
    const account = new AccountState()
    const calls: string[] = []
    const stop = account.watch(() => { calls.push('a') })
    account.watch(() => { throw new Error('listener failed') })
    account.watch(() => { calls.push('c') })
    account.observe({ kind: 'valid', user: ALICE })
    account.observe({ kind: 'valid', user: { ...ALICE } })
    expect(calls).toEqual(['a', 'c'])
    account.observe({ kind: 'valid', user: { ...ALICE, name: 'Alice L.' } })
    expect(calls).toEqual(['a', 'c', 'a', 'c'])
    stop()
    account.signOut()
    account.signOut()
    expect(calls).toEqual(['a', 'c', 'a', 'c', 'c'])
    expect(Object.keys(account.view()).sort()).toEqual(['current', 'watch'])
  })

  it('treats an unconfigured auth_service as unavailable without changing the state', async () => {
    const account = new AccountState()
    const auth = new AuthService('', 1000, 1000, (outcome) => { account.observe(outcome) })
    expect(await auth.verify('s')).toEqual({ kind: 'unavailable' })
    expect(account.current()).toEqual({ status: 'unknown' })
    expect(await new AuthService('', 1000, 1000).verify('s')).toEqual({ kind: 'unavailable' })
  })
})
