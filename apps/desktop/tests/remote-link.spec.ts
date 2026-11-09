/** Pairing-link composition and QR encoding for the remote-access page. */

import { expect, it } from 'vitest'
import { encodePairingQr, pairingSnapshot } from '../src/remote-link.ts'

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
