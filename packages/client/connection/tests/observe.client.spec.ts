/**
 * Connection development observation: unary RPC exchanges, socket frames, and
 * observer lifetime on the mounted service.
 */
import { Context } from '@tomato/cordis'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ConnectionWebSocket, ConnectionWebSocketEventMap } from '../src/client/socket.ts'
import { createWebConnectionRpc } from '../src/client/rpc.ts'
import { observeConnectionWebSocket } from '../src/client/observed.ts'
import {
  apply,
  installConnection,
  type ClientTransportHooks,
  type ConnectionHandle,
  type ConnectionObservation,
} from '../src/client/index.ts'

type Win = { __TOMATO_TRANSPORT__?: ClientTransportHooks }

afterEach(() => {
  delete (globalThis as Win).__TOMATO_TRANSPORT__
  vi.unstubAllGlobals()
})

/** A socket that records the listeners and frames it receives. */
class FakeSocket implements ConnectionWebSocket {
  readonly sent: string[] = []
  readonly listeners = new Map<string, ((event: never) => void)[]>()
  readyState = 1

  send(data: string): void { this.sent.push(data) }
  close(): void { this.readyState = 3 }
  addEventListener<Event extends keyof ConnectionWebSocketEventMap>(
    event: Event, listener: (payload: ConnectionWebSocketEventMap[Event]) => void,
  ): void {
    this.listeners.set(event, [...this.listeners.get(event) ?? [], listener])
  }

  removeEventListener<Event extends keyof ConnectionWebSocketEventMap>(
    event: Event, listener: (payload: ConnectionWebSocketEventMap[Event]) => void,
  ): void {
    this.listeners.set(event, (this.listeners.get(event) ?? []).filter(entry => entry !== listener))
  }

  emit<Event extends keyof ConnectionWebSocketEventMap>(event: Event, payload: ConnectionWebSocketEventMap[Event]): void {
    const deliver = (listener: (value: never) => void): void => {
      (listener as (value: ConnectionWebSocketEventMap[Event]) => void)(payload)
    }
    for (const listener of [...this.listeners.get(event) ?? []]) deliver(listener)
  }
}

function jsonFetch(): typeof globalThis.fetch {
  return async (_input, init) => new Response(envelope(init, true), {
    status: 200, headers: { 'content-type': 'application/json' },
  })
}

function envelope(init: RequestInit | undefined, ok: boolean): string {
  const body = init?.body
  const request = JSON.parse(typeof body === 'string' ? body : '{}') as { rpcId: string }
  return JSON.stringify({
    type: 'server-response',
    rpcId: request.rpcId,
    result: ok ? { ok: true, value: 'value' } : { ok: false, error: { code: 'denied', message: 'no', details: {} } },
  })
}

describe('unary RPC observation', () => {
  it('records a successful exchange with the complete envelope', async () => {
    const observations: ConnectionObservation[] = []
    const rpc = createWebConnectionRpc(async (_url, init) => new Response(envelope(init, true), {
      status: 200, headers: { 'content-type': 'application/json' },
    }), undefined, observation => observations.push(observation))
    await expect(rpc.call('/api', 'goals/list', { limit: 5 })).resolves.toEqual({ ok: true, value: 'value' })
    expect(observations).toHaveLength(1)
    expect(observations[0]).toMatchObject({
      kind: 'rpc', channel: '/api', endpoint: 'goals/list', httpStatus: 200, outcome: 'ok',
      request: { type: 'client-request', method: 'goals/list', payload: { limit: 5 } },
      response: { ok: true, value: 'value' },
    })
    expect(observations[0]?.kind === 'rpc' && observations[0].durationMs >= 0).toBe(true)
  })

  it('records a business failure as an error outcome and keeps the response', async () => {
    const observations: ConnectionObservation[] = []
    const rpc = createWebConnectionRpc(async (_url, init) => new Response(envelope(init, false), {
      status: 200, headers: { 'content-type': 'application/json' },
    }), undefined, observation => observations.push(observation))
    await expect(rpc.call('/api', 'goals/list', {})).resolves.toMatchObject({ ok: false })
    expect(observations[0]).toMatchObject({ outcome: 'error', httpStatus: 200 })
    expect(observations[0]?.kind === 'rpc' && observations[0].response).toMatchObject({ ok: false })
  })

  it('records a transport failure with its status and no response', async () => {
    const observations: ConnectionObservation[] = []
    const rpc = createWebConnectionRpc(async () => new Response('unavailable', { status: 503 }), undefined,
      observation => observations.push(observation))
    await expect(rpc.call('/api', 'goals/list', {})).rejects.toThrow('HTTP 503')
    expect(observations[0]).toMatchObject({ outcome: 'error', httpStatus: 503 })
    expect(observations[0]?.kind === 'rpc' && observations[0].response).toBeUndefined()
  })

  it('records caller cancellation as cancelled', async () => {
    const observations: ConnectionObservation[] = []
    const controller = new AbortController()
    controller.abort()
    const rpc = createWebConnectionRpc(async (_url, init) => new Response(envelope(init, true), {
      status: 200, headers: { 'content-type': 'application/json' },
    }), undefined, observation => observations.push(observation))
    await expect(rpc.call('/api', 'goals/list', {}, controller.signal)).rejects.toThrow()
    expect(observations[0]).toMatchObject({ outcome: 'cancelled' })
  })

  it('never fails the call when the observer throws', async () => {
    const rpc = createWebConnectionRpc(async (_url, init) => new Response(envelope(init, true), {
      status: 200, headers: { 'content-type': 'application/json' },
    }), undefined, () => { throw new Error('observer failed') })
    await expect(rpc.call('/api', 'goals/list', {})).resolves.toEqual({ ok: true, value: 'value' })
  })
})

describe('socket observation', () => {
  it('records sent and received frames and preserves the socket surface', () => {
    const observations: ConnectionObservation[] = []
    const socket = new FakeSocket()
    const observed = observeConnectionWebSocket(socket, '/api/remote.mux', observation => observations.push(observation))
    expect(observed.readyState).toBe(1)
    observed.send('{"type":"open"}')
    expect(socket.sent).toEqual(['{"type":"open"}'])
    socket.emit('message', { data: '{"type":"item","value":1}' })
    socket.emit('message', { data: 'not json' })
    socket.emit('open', {})
    expect(observations).toMatchObject([
      { kind: 'stream', path: '/api/remote.mux', direction: 'out', frame: { type: 'open' } },
      { kind: 'stream', path: '/api/remote.mux', direction: 'in', frame: { type: 'item', value: 1 } },
      { kind: 'stream', path: '/api/remote.mux', direction: 'in', frame: 'not json' },
    ])
    observed.close(1000, 'done')
    expect(socket.readyState).toBe(3)
  })

  it('removes the consumer listener while observation keeps recording', () => {
    const observations: ConnectionObservation[] = []
    const socket = new FakeSocket()
    const observed = observeConnectionWebSocket(socket, '/api/remote.mux', observation => observations.push(observation))
    const listener = vi.fn()
    observed.addEventListener('message', listener)
    socket.emit('message', { data: '{}' })
    expect(listener).toHaveBeenCalledTimes(1)
    observed.removeEventListener('message', listener)
    socket.emit('message', { data: '{}' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(observations).toHaveLength(2)
    const openListener = vi.fn()
    observed.addEventListener('open', openListener)
    observed.removeEventListener('open', vi.fn())
    expect(socket.listeners.get('open')).toEqual([openListener])
  })

  it('returns the same socket without an observer and keeps observer failures inside', () => {
    const socket = new FakeSocket()
    expect(observeConnectionWebSocket(socket, '/api/remote.mux')).toBe(socket)
    const observed = observeConnectionWebSocket(socket, '/api/remote.mux', () => { throw new Error('observer failed') })
    expect(() => { observed.send('{}') }).not.toThrow()
  })
})

describe('mounted connection observation', () => {
  async function mount(transport?: ClientTransportHooks): Promise<ConnectionHandle> {
    const ctx = new Context()
    if (transport === undefined) {
      await ctx.plugin({ apply, inject: [] })
    } else {
      installConnection(ctx, { transport })
    }
    const handle = ctx.get('connection')
    if (handle === undefined) throw new Error('ctx.connection not provided')
    return handle
  }

  it('delivers observations to registered observers until disposal', async () => {
    const fetch = jsonFetch()
    const socket = new FakeSocket()
    vi.stubGlobal('__TOMATO_TRANSPORT__', { fetch, streamBaseUrl: 'http://host/', createWebSocket: () => socket })
    const handle = await mount()
    const observations: ConnectionObservation[] = []
    const dispose = handle.observe(observation => observations.push(observation))
    await handle.rpc.call('/api', 'settings/describe', {})
    const observed = handle.openWebSocket('/api/remote.mux')
    observed.send('{"type":"open"}')
    expect(observations.map(observation => observation.kind)).toEqual(['rpc', 'stream'])
    dispose()
    await handle.rpc.call('/api', 'settings/describe', {})
    expect(observations).toHaveLength(2)
  })

  it('keeps the service alive when an observer throws', async () => {
    const fetch = jsonFetch()
    vi.stubGlobal('__TOMATO_TRANSPORT__', { fetch })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const handle = await mount()
    handle.observe(() => { throw new Error('observer failed') })
    await expect(handle.rpc.call('/api', 'x/y', {})).resolves.toMatchObject({ ok: true })
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })
})
