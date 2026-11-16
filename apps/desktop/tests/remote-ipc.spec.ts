/** Remote-access channels: sender fence, lifecycle forwarding, keep-awake prompt, and snapshots. */

import { expect, it, vi } from 'vitest'
import type { IpcMainInvokeEvent } from 'electron'
import { DESKTOP_IPC, type DesktopRemoteState } from '../src/ipc.ts'
import { registerRemoteIpc, type RemoteIpcHost } from '../src/remote-ipc.ts'

const ONLINE: DesktopRemoteState = { phase: 'online', host: 'example.trycloudflare.com', pairingUrl: 'https://example.trycloudflare.com/?token=abc' }
const event = {} as IpcMainInvokeEvent

interface HarnessOverrides {
  start?: () => void
  stop?: () => void
  reject?: boolean
  keepAwake?: boolean
  ask?: () => Promise<boolean | undefined>
  restart?: (keepAwake: boolean) => void
}

function harness(overrides: HarnessOverrides = {}) {
  const handlers = new Map<string, (event: IpcMainInvokeEvent) => Promise<DesktopRemoteState>>()
  const host: RemoteIpcHost = {
    handle: (channel, listener) => { handlers.set(channel, listener) },
  }
  const assertSender = vi.fn(() => {
    if (overrides.reject === true) throw new Error('rejected IPC from an unowned renderer')
  })
  const snapshot = vi.fn(async (): Promise<DesktopRemoteState> => ONLINE)
  const start = overrides.start ?? vi.fn()
  const stop = overrides.stop ?? vi.fn()
  const restart = overrides.restart ?? vi.fn()
  registerRemoteIpc({
    host,
    tunnel: { start, stop },
    assertSender,
    snapshot,
    keepAwake: overrides.keepAwake ?? false,
    askKeepAwake: overrides.ask ?? vi.fn(async () => false),
    restartWithKeepAwake: restart,
  })
  return { handlers, assertSender, snapshot, start, stop, restart }
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

it('starts the tunnel after the prompt keeps the running keep-awake choice', async () => {
  const ask = vi.fn(async () => false)
  const { handlers, start, restart } = harness({ ask })
  await handlers.get(DESKTOP_IPC.remoteStart)?.(event)
  expect(ask).toHaveBeenCalledTimes(1)
  expect(start).toHaveBeenCalledTimes(1)
  expect(restart).not.toHaveBeenCalled()
})

it('restarts instead of starting the tunnel when the prompt changes the keep-awake choice', async () => {
  const restart = vi.fn()
  const { handlers, start } = harness({ ask: async () => true, keepAwake: false, restart })
  await handlers.get(DESKTOP_IPC.remoteStart)?.(event)
  expect(restart).toHaveBeenCalledWith(true)
  expect(start).not.toHaveBeenCalled()
})

it('starts nothing when the prompt is cancelled', async () => {
  const { handlers, start, restart } = harness({ ask: async () => undefined })
  await handlers.get(DESKTOP_IPC.remoteStart)?.(event)
  expect(start).not.toHaveBeenCalled()
  expect(restart).not.toHaveBeenCalled()
})

it('stops the tunnel before answering', async () => {
  const { handlers, stop } = harness()
  await handlers.get(DESKTOP_IPC.remoteStop)?.(event)
  expect(stop).toHaveBeenCalledTimes(1)
})

it('refuses an unowned renderer before touching the tunnel', async () => {
  const { handlers, start } = harness({ reject: true })
  await expect(handlers.get(DESKTOP_IPC.remoteStart)?.(event)).rejects.toThrow(/unowned renderer/u)
  expect(start).not.toHaveBeenCalled()
})
