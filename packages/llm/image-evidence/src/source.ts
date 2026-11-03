/**
 * Image source loading for the `read_image` tool: an absolute path or an
 * http(s) URL, bounded in bytes and time, with private-address refusals on the
 * paths this process fetches itself.
 * @module @tomato/image-evidence/src/source
 */

import { lookup } from 'node:dns/promises'
import { readFile, stat } from 'node:fs/promises'
import { isIP } from 'node:net'
import type { ImageMediaType } from '@tomato/attachment'

/** Limits applied to every source this module reads. */
export interface ImageSourceLimits {
  /** Maximum encoded bytes accepted for one source. */
  readonly maxBytes: number
  /** Deadline for one fetch or read. */
  readonly timeoutMs: number
  /** Whether loopback, private, and link-local destinations are allowed. */
  readonly allowPrivateHosts: boolean
}

/** One loaded image, identified by its verified magic bytes. */
export interface LoadedImageSource {
  readonly data: Uint8Array
  readonly mediaType: ImageMediaType
}

/** Address resolver shape; injectable so tests never touch the network. */
export type AddressLookup = (host: string) => Promise<readonly { address: string; family: number }[]>

const REDIRECT_LIMIT = 3

/**
 * Load one image source under the configured limits.
 * @param source - absolute filesystem path, or an http(s) URL.
 * @param limits - byte cap, deadline, and private-host policy.
 * @param signal - caller cancellation.
 * @param resolve - address resolver; defaults to DNS.
 * @returns the bytes and the media type read from their magic bytes.
 * @throws {Error} with an actionable message when the source is refused or unreadable.
 */
export async function loadImageSource(
  source: string,
  limits: ImageSourceLimits,
  signal: AbortSignal | undefined,
  resolve: AddressLookup = defaultLookup,
): Promise<LoadedImageSource> {
  const trimmed = source.trim()
  if (trimmed === '') throw new Error('read_image needs a source path or URL')
  const isUrl = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//u.test(trimmed)
  if (isUrl) {
    const protocol = new URL(trimmed).protocol
    if (protocol !== 'http:' && protocol !== 'https:') {
      throw new Error(`read_image: unsupported protocol "${protocol}"; use http(s) or an absolute path`)
    }
  }
  const loaded = isUrl
    ? await fetchUrl(trimmed, limits, signal, resolve)
    : await readPath(trimmed, limits, signal)
  const mediaType = mediaTypeOf(loaded)
  if (mediaType === undefined) {
    throw new Error('read_image: the source is not a PNG, JPEG, WebP, or GIF image')
  }
  return { data: loaded, mediaType }
}

/**
 * Media type from an image's leading magic bytes.
 * @param data - encoded image bytes.
 * @returns the media type, or undefined when the bytes are not a supported image.
 */
export function mediaTypeOf(data: Uint8Array): ImageMediaType | undefined {
  if (data.length >= 8
    && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47
    && data[4] === 0x0d && data[5] === 0x0a && data[6] === 0x1a && data[7] === 0x0a) return 'image/png'
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg'
  if (data.length >= 12
    && data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46
    && data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) return 'image/webp'
  if (data.length >= 6 && data[0] === 0x47 && data[1] === 0x49 && data[2] === 0x46) return 'image/gif'
  return undefined
}

/**
 * Whether one literal address is loopback, private, link-local, or otherwise
 * reserved. Hostnames are resolved before this check, so a name that points at
 * a private address is refused too.
 * @param address - IPv4 or IPv6 literal.
 * @returns whether fetching it would reach a non-public destination.
 */
export function isPrivateAddress(address: string): boolean {
  const version = isIP(address)
  if (version === 4) return privateIpv4(address)
  if (version === 6) return privateIpv6(address)
  return true
}

function privateIpv4(address: string): boolean {
  const octets = address.split('.').map(Number)
  const [a = 0, b = 0] = octets
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a >= 224) return true
  return false
}

function privateIpv6(address: string): boolean {
  const normalized = address.toLowerCase()
  if (normalized === '::1' || normalized === '::') return true
  if (normalized.startsWith('fe80') || normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/u.exec(normalized)
  return mapped?.[1] === undefined ? false : privateIpv4(mapped[1])
}

async function defaultLookup(host: string): Promise<readonly { address: string; family: number }[]> {
  return lookup(host, { all: true, order: 'verbatim' })
}

async function readPath(
  path: string,
  limits: ImageSourceLimits,
  signal: AbortSignal | undefined,
): Promise<Uint8Array> {
  signal?.throwIfAborted()
  const info = await stat(path)
  if (!info.isFile()) throw new Error(`read_image: "${path}" is not a file`)
  if (info.size > limits.maxBytes) {
    throw new Error(`read_image: "${path}" is ${info.size} bytes, exceeding the ${limits.maxBytes}-byte limit`)
  }
  const data = await readFile(path, signal === undefined ? {} : { signal })
  return new Uint8Array(data)
}

async function fetchUrl(
  initial: string,
  limits: ImageSourceLimits,
  signal: AbortSignal | undefined,
  resolve: AddressLookup,
): Promise<Uint8Array> {
  let current = initial
  for (let hop = 0; hop <= REDIRECT_LIMIT; hop += 1) {
    signal?.throwIfAborted()
    const url = new URL(current)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error(`read_image: unsupported protocol "${url.protocol}"`)
    }
    if (!limits.allowPrivateHosts) await assertPublicHost(url.hostname, resolve)
    const controller = new AbortController()
    const forward = (): void => {
      controller.abort(signal?.reason)
    }
    signal?.addEventListener('abort', forward, { once: true })
    const timer = setTimeout(() => {
      controller.abort(new Error(`read_image: ${url.hostname} timed out`))
    }, limits.timeoutMs)
    timer.unref()
    try {
      const response = await fetch(current, { redirect: 'manual', signal: controller.signal })
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (location === null) throw new Error(`read_image: ${url.hostname} redirected without a location`)
        current = new URL(location, current).toString()
        continue
      }
      if (!response.ok) throw new Error(`read_image: ${url.hostname} answered HTTP ${response.status}`)
      return await readBounded(response, limits)
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', forward)
    }
  }
  throw new Error(`read_image: ${initial} redirected more than ${REDIRECT_LIMIT} times`)
}

async function assertPublicHost(host: string, resolve: AddressLookup): Promise<void> {
  const name = host.replace(/^\[|\]$/gu, '')
  if (name === 'localhost' || name.endsWith('.localhost')) {
    throw new Error(`read_image: "${host}" is a local address and is refused`)
  }
  if (isIP(name) !== 0) {
    if (isPrivateAddress(name)) throw new Error(`read_image: "${host}" is a private address and is refused`)
    return
  }
  const addresses = await resolve(name)
  if (addresses.length === 0) throw new Error(`read_image: "${host}" did not resolve`)
  for (const entry of addresses) {
    if (isPrivateAddress(entry.address)) {
      throw new Error(`read_image: "${host}" resolves to the private address ${entry.address} and is refused`)
    }
  }
}

async function readBounded(response: Response, limits: ImageSourceLimits): Promise<Uint8Array> {
  const declared = response.headers.get('content-length')
  if (declared !== null && Number(declared) > limits.maxBytes) {
    throw new Error(`read_image: the source declares ${declared} bytes, exceeding the ${limits.maxBytes}-byte limit`)
  }
  if (response.body === null) return new Uint8Array()
  const chunks: Uint8Array[] = []
  let total = 0
  const reader = response.body.getReader()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > limits.maxBytes) {
        throw new Error(`read_image: the source exceeds the ${limits.maxBytes}-byte limit`)
      }
      chunks.push(value)
    }
  } finally {
    await reader.cancel().catch(() => undefined)
  }
  const data = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    data.set(chunk, offset)
    offset += chunk.byteLength
  }
  return data
}
