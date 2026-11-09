/** Shell-bridge mirroring: subscription, refresh, and lifecycle forwarding. */

import { afterEach, expect, it, vi } from 'vitest'
import { createRemotePageStore, desktopRemoteBridge, type DesktopRemoteBridge, type RemotePageState } from '../src/client/state.ts'

const ONLINE: RemotePageState = {
  supported: true,
  phase: 'online',
  host: 'example.trycloudflare.com',
  pairingUrl: 'https://example.trycloudflare.com/?token=abc',
  pairingQr: 'data:image/png;base64,AAAA',
}

function bridgeStub(overrides: Partial<DesktopRemoteBridge> = {}) {
  let listener: ((state: RemotePageState) => void) | undefined
  const status = vi.fn(async (): Promise<RemotePageState> => ({ supported: true, phase: 'off' }))
  const start = vi.fn(async (): Promise<RemotePageState> => ONLINE)
  const stop = vi.fn(async (): Promise<RemotePageState> => ({ supported: true, phase: 'off' }))
  const subscribe = vi.fn((next: (state: RemotePageState) => void) => {
    listener = next
    return () => { listener = undefined }
  })
  const bridge: DesktopRemoteBridge = { status, start, stop, subscribe, ...overrides }
  return {
    bridge, status, start, stop, subscribe,
    emit: (state: RemotePageState) => { listener?.(state) },
    attached: () => listener !== undefined,
  }
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'tomatoDesktop')
})

it('reports an unsupported page without the shell bridge', () => {
  expect(desktopRemoteBridge()).toBeUndefined()
  const store = createRemotePageStore(undefined)
  expect(store.snapshot.getSnapshot()).toEqual({ supported: false, phase: 'off' })
})

it('attaches on the first reader and detaches after the last', async () => {
  const { bridge, attached, status } = bridgeStub()
  const store = createRemotePageStore(bridge)
  const listener = vi.fn()
  const off = store.snapshot.subscribe(listener)
  expect(attached()).toBe(true)
  await vi.waitFor(() => { expect(status).toHaveBeenCalledTimes(1) })
  off()
  expect(attached()).toBe(false)
})

it('publishes shell updates with one stable snapshot between changes', () => {
  const { bridge, emit } = bridgeStub()
  const store = createRemotePageStore(bridge)
  const listener = vi.fn()
  store.snapshot.subscribe(listener)
  const before = store.snapshot.getSnapshot()
  emit(ONLINE)
  expect(listener).toHaveBeenCalledTimes(1)
  const after = store.snapshot.getSnapshot()
  expect(after).not.toBe(before)
  expect(after).toEqual(ONLINE)
  expect(store.snapshot.getSnapshot()).toBe(after)
  emit(ONLINE)
  expect(listener).toHaveBeenCalledTimes(1)
})

it('forwards lifecycle actions and publishes their answer', async () => {
  const { bridge, start, stop } = bridgeStub()
  const store = createRemotePageStore(bridge)
  await store.start()
  expect(start).toHaveBeenCalledTimes(1)
  expect(store.snapshot.getSnapshot()).toEqual(ONLINE)
  await store.stop()
  expect(stop).toHaveBeenCalledTimes(1)
  expect(store.snapshot.getSnapshot().phase).toBe('off')
})

it('reports a failed action without throwing', async () => {
  const { bridge } = bridgeStub({ start: vi.fn(async () => { throw new Error('refused') }) })
  const store = createRemotePageStore(bridge)
  await store.start()
  expect(store.snapshot.getSnapshot().phase).toBe('failed')
})

it('reads the bridge off the desktop global', () => {
  const { bridge } = bridgeStub()
  Reflect.set(globalThis, 'tomatoDesktop', { remote: bridge })
  expect(desktopRemoteBridge()).toBe(bridge)
  Reflect.set(globalThis, 'tomatoDesktop', { remote: { status: 'nope' } })
  expect(desktopRemoteBridge()).toBeUndefined()
})

it('disposes the shell subscription', () => {
  const { bridge, attached } = bridgeStub()
  const store = createRemotePageStore(bridge)
  store.snapshot.subscribe(() => {})
  store.dispose()
  expect(attached()).toBe(false)
})
