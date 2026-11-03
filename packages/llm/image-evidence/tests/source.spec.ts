import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { isPrivateAddress, loadImageSource, mediaTypeOf } from '../src/source.ts'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const LIMITS = { maxBytes: 1024, timeoutMs: 1_000, allowPrivateHosts: false }
const homes: string[] = []

afterEach(async () => {
  for (const home of homes.splice(0)) await rm(home, { recursive: true, force: true })
})

describe('mediaTypeOf', () => {
  it('recognizes the supported image signatures', () => {
    expect(mediaTypeOf(PNG)).toBe('image/png')
    expect(mediaTypeOf(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg')
    expect(mediaTypeOf(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe('image/webp')
    expect(mediaTypeOf(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))).toBe('image/gif')
  })

  it('rejects anything else', () => {
    expect(mediaTypeOf(new TextEncoder().encode('not an image'))).toBeUndefined()
  })
})

describe('isPrivateAddress', () => {
  it('refuses loopback, private, link-local, and reserved IPv4', () => {
    for (const address of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.169.254', '0.0.0.0', '100.64.0.1', '224.0.0.1']) {
      expect(isPrivateAddress(address), address).toBe(true)
    }
  })

  it('accepts public IPv4 and refuses private IPv6 and embedded IPv4', () => {
    expect(isPrivateAddress('93.184.216.34')).toBe(false)
    expect(isPrivateAddress('::1')).toBe(true)
    expect(isPrivateAddress('fd00::1')).toBe(true)
    expect(isPrivateAddress('fe80::1')).toBe(true)
    expect(isPrivateAddress('::ffff:10.0.0.1')).toBe(true)
    expect(isPrivateAddress('2606:4700:4700::1111')).toBe(false)
  })
})

describe('loadImageSource', () => {
  it('reads a local image within the limit', async () => {
    const home = await mkdtemp(join(tmpdir(), 'image-source-'))
    homes.push(home)
    const path = join(home, 'image.png')
    await writeFile(path, PNG)
    await expect(loadImageSource(path, LIMITS, undefined)).resolves.toMatchObject({ mediaType: 'image/png' })
  })

  it('refuses an oversized file and non-image bytes', async () => {
    const home = await mkdtemp(join(tmpdir(), 'image-source-'))
    homes.push(home)
    const large = join(home, 'large.png')
    await writeFile(large, new Uint8Array(2048))
    await expect(loadImageSource(large, LIMITS, undefined)).rejects.toThrow(/exceeding the 1024-byte limit/u)
    const text = join(home, 'note.txt')
    await writeFile(text, 'hello')
    await expect(loadImageSource(text, LIMITS, undefined)).rejects.toThrow(/not a PNG, JPEG, WebP, or GIF/u)
  })

  it('refuses a hostname that resolves to a private address', async () => {
    await expect(loadImageSource('http://images.test/a.png', LIMITS, undefined, async () => [
      { address: '10.0.0.7', family: 4 },
    ])).rejects.toThrow(/private address/u)
  })

  it('refuses localhost and unsupported protocols before any request', async () => {
    await expect(loadImageSource('http://localhost/a.png', LIMITS, undefined))
      .rejects.toThrow(/local address/u)
    await expect(loadImageSource('ftp://images.test/a.png', LIMITS, undefined, async () => []))
      .rejects.toThrow(/unsupported protocol/u)
  })
})
