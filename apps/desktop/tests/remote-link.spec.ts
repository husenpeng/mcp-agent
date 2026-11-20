/** Pairing-link composition, QR encoding, and the delivery the Phone page follows. */

import { expect, it, vi } from 'vitest'
import { createPairingSnapshots, encodePairingQr, pairingSnapshot } from '../src/remote-link.ts'
import type { DesktopRemoteState } from '../src/ipc.ts'
import type { RemoteTunnelState } from '../src/remote-tunnel.ts'

const ONLINE: RemoteTunnelState = { phase: 'online', host: 'example.trycloudflare.com' }
const HOST_ONE = 'http://127.0.0.1:43110/?token=first'
const HOST_TWO = 'http://127.0.0.1:43110/?token=second'

function harness(encodeQr?: (url: string) => Promise<string | undefined>) {
  const sent: DesktopRemoteState[] = []
  let hostUrl: string | undefined = HOST_ONE
  const encoder = vi.fn(encodeQr ?? (async (url: string) => `png:${url}`))
  const snapshots = createPairingSnapshots({
    hostUrl: () => hostUrl,
    send: (snapshot) => { sent.push(snapshot) },
    encodeQr: encoder,
  })
  return { snapshots, sent, encoder, useHost: (url: string | undefined) => { hostUrl = url } }
}

it('composes the pairing link from the tunnel host and the Host token', () => {
  expect(pairingSnapshot({ phase: 'online', host: 'example.trycloudflare.com' }, 'http://127.0.0.1:43110/?token=abc'))
    .toEqual({ phase: 'online', host: 'example.trycloudflare.com', pairingUrl: 'https://example.trycloudflare.com/?token=abc' })
})

it('omits the link until the Host has reported its token', () => {
  expect(pairingSnapshot({ phase: 'starting' }, 'http://127.0.0.1:43110/?token=abc')).toEqual({ phase: 'starting' })
  expect(pairingSnapshot({ phase: 'online', host: 'example.trycloudflare.com' }, undefined))
    .toEqual({ phase: 'online', host: 'example.trycloudflare.com' })
})

it('keeps the failure detail without a link', () => {
  expect(pairingSnapshot({ phase: 'failed', message: 'cloudflared exited with code 1' }, undefined))
    .toEqual({ phase: 'failed', message: 'cloudflared exited with code 1' })
})

it('encodes the link as a PNG data URL', async () => {
  const data = await encodePairingQr('https://example.trycloudflare.com/?token=abc')
  expect(data?.startsWith('data:image/png;base64,')).toBe(true)
})

it('reports an unencodable link instead of throwing', async () => {
  expect(await encodePairingQr('x'.repeat(5_000))).toBeUndefined()
})

it('answers the status read with the link and its QR image', async () => {
  const { snapshots } = harness()
  await expect(snapshots.snapshot(ONLINE)).resolves.toEqual({
    phase: 'online',
    host: 'example.trycloudflare.com',
    pairingUrl: 'https://example.trycloudflare.com/?token=first',
    pairingQr: 'png:https://example.trycloudflare.com/?token=first',
  })
})

it('delivers the link of a replacement Host that minted a new launch token', async () => {
  const { snapshots, sent, useHost } = harness()
  snapshots.publish(ONLINE)
  await vi.waitFor(() => { expect(sent).toHaveLength(1) })
  useHost(HOST_TWO)
  snapshots.publish(ONLINE)
  await vi.waitFor(() => { expect(sent).toHaveLength(2) })
  expect(sent[0]?.pairingUrl).toBe('https://example.trycloudflare.com/?token=first')
  expect(sent[1]).toEqual({
    phase: 'online',
    host: 'example.trycloudflare.com',
    pairingUrl: 'https://example.trycloudflare.com/?token=second',
    pairingQr: 'png:https://example.trycloudflare.com/?token=second',
  })
})

it('re-encodes the QR image only when the link changes', async () => {
  const { snapshots, sent, encoder, useHost } = harness()
  snapshots.publish(ONLINE)
  await vi.waitFor(() => { expect(sent).toHaveLength(1) })
  // The same link published again reuses the image instead of encoding it twice.
  snapshots.publish(ONLINE)
  await vi.waitFor(() => { expect(sent).toHaveLength(2) })
  expect(encoder).toHaveBeenCalledTimes(1)
  useHost(HOST_TWO)
  snapshots.publish(ONLINE)
  await vi.waitFor(() => { expect(sent).toHaveLength(3) })
  expect(encoder).toHaveBeenCalledTimes(2)
})

it('drops a snapshot that a newer request replaced while it was encoding', async () => {
  const pending: { url: string; resolve: (data: string) => void }[] = []
  const encoder = vi.fn((url: string) => new Promise<string>((resolve) => { pending.push({ url, resolve }) }))
  const { snapshots, sent, useHost } = harness(encoder)
  snapshots.publish(ONLINE)
  useHost(HOST_TWO)
  snapshots.publish(ONLINE)
  pending[1]?.resolve('png:second')
  await vi.waitFor(() => { expect(sent).toHaveLength(1) })
  expect(sent[0]?.pairingUrl).toBe('https://example.trycloudflare.com/?token=second')
  pending[0]?.resolve('png:first')
  await vi.waitFor(() => { expect(encoder).toHaveBeenCalledTimes(2) })
  await new Promise(resolve => setImmediate(resolve))
  expect(sent).toHaveLength(1)
})

it('delivers the tunnel phase before the Host has a link', async () => {
  const { snapshots, sent, useHost } = harness()
  useHost(undefined)
  snapshots.publish({ phase: 'starting' })
  await vi.waitFor(() => { expect(sent).toEqual([{ phase: 'starting' }]) })
})

it('leaves out the QR image when encoding fails', async () => {
  const { snapshots } = harness(async () => {
    throw new Error('encoder unavailable')
  })
  await expect(snapshots.snapshot(ONLINE)).resolves.toEqual({
    phase: 'online',
    host: 'example.trycloudflare.com',
    pairingUrl: 'https://example.trycloudflare.com/?token=first',
  })
})
