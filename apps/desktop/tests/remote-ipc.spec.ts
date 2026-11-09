/** Remote-access channels: sender fence, lifecycle forwarding, and returned snapshots. */

import { expect, it, vi } from 'vitest'
import type { IpcMainInvokeEvent } from 'electron'
import { DESKTOP_IPC, type DesktopRemoteState } from '../src/ipc.ts'
import { registerRemoteIpc, type RemoteIpcHost } from '../src/remote-ipc.ts'

const ONLINE: DesktopRemoteState = { phase: 'online', host: 'example.trycloudflare.com', pairingUrl: 'https://example.trycloudflare.com/?token=abc' }
const event = {} as IpcMainInvokeEvent

function harness(overrides: { start?: () => void; stop?: () => void; reject?: boolean } = {}) {
  const handlers = new Map<string, (event: IpcMainInvokeEvent) => Promise<DesktopRemoteState>>()
  const host: RemoteIpcHost = {
    handle: (channel, listener) => { handlers.set(channel, listener) },
  }
  const assertSender = vi.fn(() => {
    if (overrides.reject === true) throw new Error('rejected IPC from an unowned renderer')
  })
  const snapshot = vi.fn(async (): Promise<DesktopRemoteState> => ONLINE)
  registerRemoteIpc({
    host,
    tunnel: { start: overrides.start ?? vi.fn(), stop: overrides.stop ?? vi.fn() },
    assertSender,
    snapshot,
  })
  return { handlers, assertSender, snapshot }
}

it('registers the three remote channels', () => {
  const { handlers } = harness()
  expect([...handlers.keys()].sort()).toEqual([
    DESKTOP_IPC.remoteStart, DESKTOP_IPC.remoteStatus, DESKTOP_IPC.remoteStop,
  ].sort())
})

it('answers status through the sender fence and the snapshot reader', async () => {
  const { handlers, assertSender, snapshot } = harness()
  await expect(handlers.get(DESKTOP_IPC.remoteStatus)?.(event)).resolves.toEqual(ONLINE)
  expect(assertSender).toHaveBeenCalledWith(event)
  expect(snapshot).toHaveBeenCalledTimes(1)
})

it('starts and stops the tunnel before answering', async () => {
  const start = vi.fn()
  const stop = vi.fn()
  const { handlers } = harness({ start, stop })
  await handlers.get(DESKTOP_IPC.remoteStart)?.(event)
  expect(start).toHaveBeenCalledTimes(1)
  await handlers.get(DESKTOP_IPC.remoteStop)?.(event)
  expect(stop).toHaveBeenCalledTimes(1)
})

it('refuses an unowned renderer before touching the tunnel', async () => {
  const start = vi.fn()
  const { handlers } = harness({ start, reject: true })
  await expect(handlers.get(DESKTOP_IPC.remoteStart)?.(event)).rejects.toThrow(/unowned renderer/u)
  expect(start).not.toHaveBeenCalled()
})
