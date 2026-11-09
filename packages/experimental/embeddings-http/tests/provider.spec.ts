/** HTTP embeddings provider: configuration, batching, credentials, and response validation. */
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context } from '@tomato/cordis'
import { createVolatile } from '@tomato/cosmokit'
import { credentialRef } from '@tomato/credentials'
import LocalCredentialProvider from '@tomato/credentials-local'
import HttpEmbeddings, { probeEmbeddingsEndpoint, resolveEmbeddingsConfig } from '@tomato/experimental-embeddings-http'

const contexts: Context[] = []
const directories: string[] = []

afterEach(async () => {
  vi.unstubAllGlobals()
  for (const ctx of contexts.splice(0)) await ctx.fiber.dispose()
  for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true })
})

/** Values one test overrides in the provider configuration. */
interface TestConfig {
  baseUrl?: string
  model?: string
  apiKeyEnv?: string
  dimensions?: number
  timeoutMs?: number
  batchSize?: number
  maxInputChars?: number
  enabled?: boolean
}

/** Mount a provider over a private credential store. */
async function harness(config: TestConfig = {}, credentials = true) {
  const ctx = new Context()
  contexts.push(ctx)
  const directory = await mkdtemp(join(tmpdir(), 'tomato-embeddings-'))
  directories.push(directory)
  if (credentials) await ctx.plugin(LocalCredentialProvider, { path: join(directory, 'credentials.yaml'), tomatoHome: directory, watch: false })
  await ctx.plugin(HttpEmbeddings, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', ...config })
  return { ctx, embeddings: ctx.embeddings }
}

it('probes an endpoint from the Host and reports its length and latency', async () => {
  const { ctx } = await harness()
  const request = respond({ data: [{ index: 0, embedding: [1, 2, 3] }] })
  const result = await probeEmbeddingsEndpoint(ctx, {
    baseUrl: ctx.embeddings === undefined ? '' : 'https://api.example.test/v1', model: 'embed-small', dimensions: 3,
  })
  expect(result).toMatchObject({ ok: true, dimensions: 3 })
  expect(result.latencyMs).toBeGreaterThanOrEqual(0)
  expect(request).toHaveBeenCalledTimes(1)

  respond({ data: [] })
  expect(await probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 0 }))
    .toMatchObject({ ok: false, detail: 'the reply carried no embedding vector' })
  respond({ data: [{ index: 0, embedding: [1, 2] }] })
  expect(await probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 3 }))
    .toMatchObject({ ok: false, detail: 'the endpoint returned 2 values, not 3' })
  expect(await probeEmbeddingsEndpoint(ctx, { baseUrl: 'http://plain.example.test/v1', model: 'embed-small', dimensions: 0 }))
    .toMatchObject({ ok: false, detail: expect.stringContaining('baseUrl must use HTTPS') })
  expect(await probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 0, apiKeyEnv: 'MISSING_KEY' }))
    .toMatchObject({ ok: false, detail: 'embedding credential "MISSING_KEY" is not configured' })

  respond({ error: 'down' }, 500)
  expect(await probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 0 }))
    .toMatchObject({ ok: false, detail: 'endpoint answered HTTP 500' })
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('socket closed') }))
  expect(await probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 0 }))
    .toMatchObject({ ok: false, detail: 'socket closed' })
  vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 200 })))
  expect(await probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 0 }).then(result => result.ok))
    .toBe(false)

  vi.stubGlobal('fetch', vi.fn(async () => new Response('null', { status: 200 })))
  expect(await probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 0 }))
    .toMatchObject({ ok: false, detail: 'the reply carried no embedding vector' })
  vi.stubGlobal('fetch', vi.fn(async () => { throw 'boom' }))
  expect(await probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 0 }))
    .toMatchObject({ ok: false, detail: 'boom' })

  await ctx.credentials.set(credentialRef('EMBED_KEY'), 'secret')
  const authorized = respond({ data: [{ index: 0, embedding: [1, 2] }] })
  await probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 0, apiKeyEnv: 'EMBED_KEY' })
  expect((authorized.mock.calls[0]?.[1] as RequestInit | undefined)?.headers).toMatchObject({ authorization: 'Bearer secret' })

  const slow = vi.fn((_url: string, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => { reject(new DOMException('aborted', 'AbortError')) })
  }))
  vi.stubGlobal('fetch', slow)
  expect(await probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 0, timeoutMs: 1 }))
    .toMatchObject({ ok: false, detail: expect.stringContaining('timed out after 1 ms') })

  const controller = new AbortController()
  controller.abort()
  vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('aborted', 'AbortError') }))
  await expect(probeEmbeddingsEndpoint(ctx, { baseUrl: 'https://api.example.test/v1', model: 'embed-small', dimensions: 0 }, controller.signal))
    .rejects.toBeInstanceOf(DOMException)
})

it('counts embedding requests, texts, failures, and elapsed time', async () => {
  const { embeddings } = await harness()
  respond(vectors(2))
  await embeddings.embed({ texts: ['one', 'two'] })
  expect(embeddings.usage).toMatchObject({ requests: 1, texts: 2, failures: 0 })
  expect(embeddings.usage.totalMs).toBeGreaterThanOrEqual(0)
  respond({ error: 'down' }, 500)
  await expect(embeddings.embed({ texts: ['three'] })).rejects.toThrow('HTTP 500')
  expect(embeddings.usage).toMatchObject({ requests: 2, texts: 3, failures: 1, lastError: expect.stringContaining('HTTP 500') })
})

it('stays mounted but is ignored while disabled, including a live switch', async () => {
  const disabled = await harness({ enabled: false })
  expect(disabled.embeddings.enabled).toBe(false)
  const enabled = await harness({ enabled: true })
  expect(enabled.embeddings.enabled).toBe(true)
  const fallback = await harness()
  expect(fallback.embeddings.enabled).toBe(true)
  const liveCtx = new Context()
  contexts.push(liveCtx)
  const liveOff = new HttpEmbeddings(liveCtx, {
    baseUrl: 'http://127.0.0.1:11434/v1', model: 'nomic-embed-text', enabled: createVolatile(false),
  })
  expect(liveOff.enabled).toBe(false)
  const liveOnCtx = new Context()
  contexts.push(liveOnCtx)
  const liveOn = new HttpEmbeddings(liveOnCtx, {
    baseUrl: 'http://127.0.0.1:11434/v1', model: 'nomic-embed-text', enabled: createVolatile(true),
  })
  expect(liveOn.enabled).toBe(true)
  const omittedCtx = new Context()
  contexts.push(omittedCtx)
  const omitted = new HttpEmbeddings(omittedCtx, { baseUrl: 'http://127.0.0.1:11434/v1', model: 'nomic-embed-text' })
  expect(omitted.enabled).toBe(true)
  const plainCtx = new Context()
  contexts.push(plainCtx)
  expect(new HttpEmbeddings(plainCtx, { baseUrl: 'http://127.0.0.1:11434/v1', model: 'nomic-embed-text', enabled: true }).enabled).toBe(true)
  const plainOffCtx = new Context()
  contexts.push(plainOffCtx)
  expect(new HttpEmbeddings(plainOffCtx, { baseUrl: 'http://127.0.0.1:11434/v1', model: 'nomic-embed-text', enabled: false }).enabled).toBe(false)
})

it('serves its configuration to a mounted settings server', async () => {
  const ctx = new Context()
  contexts.push(ctx)
  const configure = vi.fn(() => () => {})
  ctx.provide('settings', { configure } as never)
  await ctx.plugin(HttpEmbeddings, { baseUrl: 'http://127.0.0.1:11434/v1', model: 'nomic-embed-text' })
  await vi.waitFor(() => { expect(configure).toHaveBeenCalledWith({ auto: false }, expect.anything()) })
})

/** Answer every request with one JSON body. */
function respond(body: unknown, status = 200): ReturnType<typeof vi.fn> {
  const stub = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))
  vi.stubGlobal('fetch', stub)
  return stub
}

/** One two-value vector per input. */
function vectors(count: number, length = 2): unknown {
  return {
    data: Array.from({ length: count }, (_, index) => ({
      index,
      embedding: Array.from({ length }, (_, position) => index + position + 1),
    })),
  }
}

describe('configuration', () => {
  it('normalizes the base URL and validates every bound', () => {
    const resolved = resolveEmbeddingsConfig({
      baseUrl: 'https://api.example.test/v1/',
      model: ' embed-small ',
      apiKeyEnv: '  ',
      dimensions: 384,
    })
    expect(resolved).toEqual({
      baseUrl: 'https://api.example.test/v1',
      model: 'embed-small',
      apiKeyEnv: undefined,
      dimensions: 384,
      timeoutMs: 15_000,
      batchSize: 32,
      maxInputChars: 4000,
    })
    expect(resolveEmbeddingsConfig({ baseUrl: 'http://127.0.0.1:11434/v1', model: 'm' }).baseUrl)
      .toBe('http://127.0.0.1:11434/v1')
    expect(resolveEmbeddingsConfig({ baseUrl: 'http://localhost:8080', model: 'm' }).baseUrl)
      .toBe('http://localhost:8080')
    expect(resolveEmbeddingsConfig({
      baseUrl: 'https://x.test',
      model: 'm',
      timeoutMs: createVolatile(250),
      batchSize: createVolatile(4),
      maxInputChars: createVolatile(90),
    })).toMatchObject({ timeoutMs: 250, batchSize: 4, maxInputChars: 90 })
  })

  it('rejects an insecure remote URL, a query, an empty model, and unusable limits', () => {
    expect(() => resolveEmbeddingsConfig({ baseUrl: 'http://api.example.test', model: 'm' }))
      .toThrow(/must use HTTPS unless it is loopback/u)
    expect(() => resolveEmbeddingsConfig({ baseUrl: 'https://api.example.test/v1?key=1', model: 'm' }))
      .toThrow(/query or fragment/u)
    expect(() => resolveEmbeddingsConfig({ baseUrl: 'https://api.example.test', model: '  ' }))
      .toThrow(/model must not be empty/u)
    expect(() => resolveEmbeddingsConfig({ baseUrl: 'https://api.example.test', model: 'm', dimensions: -1 }))
      .toThrow(/dimensions must be an integer/u)
    expect(() => resolveEmbeddingsConfig({ baseUrl: 'https://api.example.test', model: 'm', timeoutMs: 0 }))
      .toThrow(/timeoutMs must be a positive safe integer/u)
  })
})

describe('embedding requests', () => {
  it('returns no vectors for no texts and sends one batch otherwise', async () => {
    const { embeddings } = await harness()
    expect(await embeddings.embed({ texts: [] })).toEqual([])
    const fetch = respond(vectors(2))
    const result = await embeddings.embed({ texts: ['alpha', 'beta'] })
    expect(result).toEqual([Float32Array.from([1, 2]), Float32Array.from([2, 3])])
    expect(fetch).toHaveBeenCalledOnce()
    const [url, init] = fetch.mock.calls[0] ?? []
    expect(url).toBe('https://api.example.test/v1/embeddings')
    assert.equal(typeof init, 'object')
    assert.equal((init as { body?: unknown }).body, JSON.stringify({ model: 'embed-small', input: ['alpha', 'beta'] }))
  })

  it('splits by batch size and truncates each text', async () => {
    const { embeddings } = await harness({ batchSize: 2, maxInputChars: 3 })
    const fetch = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)) as { input: readonly string[] }
      return new Response(JSON.stringify(vectors(body.input.length)), { headers: { 'content-type': 'application/json' } })
    })
    vi.stubGlobal('fetch', fetch)
    const result = await embeddings.embed({ texts: ['abcdef', 'gh', 'ijkl'] })
    expect(result).toHaveLength(3)
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(JSON.parse(String((fetch.mock.calls[0]?.[1] as { body: string }).body))).toEqual({ model: 'embed-small', input: ['abc', 'gh'] })
    expect(JSON.parse(String((fetch.mock.calls[1]?.[1] as { body: string }).body))).toEqual({ model: 'embed-small', input: ['ijk'] })
  })

  it('uses a stored credential before the launch environment and sends it as a bearer token', async () => {
    const { ctx, embeddings } = await harness({ apiKeyEnv: 'EMBEDDINGS_KEY' })
    await ctx.credentials.set(credentialRef('EMBEDDINGS_KEY'), 'stored-key')
    process.env['EMBEDDINGS_KEY'] = 'environment-key'
    try {
      const fetch = respond(vectors(1))
      await embeddings.embed({ texts: ['alpha'] })
      const headers = (fetch.mock.calls[0]?.[1] as { headers: Record<string, string> }).headers
      expect(headers.authorization).toBe('Bearer stored-key')
    } finally {
      delete process.env['EMBEDDINGS_KEY']
    }
  })

  it('falls back to the launch environment and refuses a missing credential', async () => {
    const environment = await harness({ apiKeyEnv: 'EMBEDDINGS_ENV_KEY' })
    process.env['EMBEDDINGS_ENV_KEY'] = 'environment-key'
    try {
      const fetch = respond(vectors(1))
      await environment.embeddings.embed({ texts: ['alpha'] })
      expect((fetch.mock.calls[0]?.[1] as { headers: Record<string, string> }).headers.authorization)
        .toBe('Bearer environment-key')
    } finally {
      delete process.env['EMBEDDINGS_ENV_KEY']
    }
    const missing = await harness({ apiKeyEnv: 'EMBEDDINGS_ABSENT_KEY' })
    await expect(missing.embeddings.embed({ texts: ['alpha'] }))
      .rejects.toThrow(/embedding credential "EMBEDDINGS_ABSENT_KEY" is not configured/u)
    const withoutStore = await harness({ apiKeyEnv: 'EMBEDDINGS_NO_STORE_KEY' }, false)
    await expect(withoutStore.embeddings.embed({ texts: ['alpha'] }))
      .rejects.toThrow(/embedding credential "EMBEDDINGS_NO_STORE_KEY" is not configured/u)
    process.env['EMBEDDINGS_NO_STORE_KEY'] = 'ambient-key'
    try {
      const fetch = respond(vectors(1))
      await withoutStore.embeddings.embed({ texts: ['alpha'] })
      expect((fetch.mock.calls[0]?.[1] as { headers: Record<string, string> }).headers.authorization)
        .toBe('Bearer ambient-key')
    } finally {
      delete process.env['EMBEDDINGS_NO_STORE_KEY']
    }
  })
})

describe('transport and response failures', () => {
  it('classifies a malformed body, a wrong vector count, a bad index, a malformed vector, and a length mismatch', async () => {
    const { embeddings } = await harness()
    respond({ data: 'nope' })
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toMatchObject({ code: 'invalid-response' })
    respond({ data: [] })
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toThrow(/0 vectors for 1 inputs/u)
    respond({ data: [{ index: 5, embedding: [1, 2] }] })
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toThrow(/out-of-range or duplicate vector index/u)
    respond({ data: [{ index: -1, embedding: [1, 2] }] })
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toThrow(/out-of-range or duplicate vector index/u)
    respond({ data: [{ index: 0, embedding: [1, 2] }, { index: 0, embedding: [1, 2] }] })
    await expect(embeddings.embed({ texts: ['a', 'b'] })).rejects.toThrow(/out-of-range or duplicate vector index/u)
    respond({ data: [{ index: 0, embedding: [] }] })
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toThrow(/malformed vector/u)
    respond({ data: [{ index: 0, embedding: [1, 2] }, { index: 1, embedding: [1, 2, 3] }] })
    await expect(embeddings.embed({ texts: ['a', 'b'] })).rejects.toThrow(/for a 2-value vector/u)
    respond('not-an-object')
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toThrow(/0 vectors for 1 inputs/u)
    respond({ data: [{ embedding: [1, 2] }] })
    expect(await embeddings.embed({ texts: ['a'] })).toEqual([Float32Array.from([1, 2])])
  })

  it('rejects a configured vector length that disagrees with the response', async () => {
    const { embeddings } = await harness({ dimensions: 3 })
    respond(vectors(1, 2))
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toThrow(/returned 2 values for a 3-value vector/u)
  })

  it('classifies a non-OK response, a non-JSON body, a provider failure, and its own timeout', async () => {
    const { embeddings } = await harness({ timeoutMs: 20 })
    respond({ error: 'no' }, 503)
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toMatchObject({ code: 'provider', message: expect.stringMatching(/HTTP 503/u) })
    vi.stubGlobal('fetch', vi.fn(async () => new Response('plain', { status: 200 })))
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toMatchObject({ code: 'invalid-response' })
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down') }))
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toMatchObject({ code: 'provider', message: expect.stringMatching(/network down/u) })
    vi.stubGlobal('fetch', vi.fn(async () => { throw 'network down' }))
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toMatchObject({ code: 'provider', message: 'embedding request failed: network down' })
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => { reject(new DOMException('aborted', 'AbortError')) })
    })))
    await expect(embeddings.embed({ texts: ['a'] })).rejects.toMatchObject({ code: 'timeout' })
  })

  it('rethrows the caller cancellation instead of converting it', async () => {
    const { embeddings } = await harness({ timeoutMs: 60_000 })
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => new Promise((_resolve, reject) => {
      if (init?.signal?.aborted === true) {
        reject(new DOMException('aborted', 'AbortError'))
        return
      }
      init?.signal?.addEventListener('abort', () => { reject(new DOMException('aborted', 'AbortError')) })
    })))
    const controller = new AbortController()
    const pending = embeddings.embed({ texts: ['a'], signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toBeInstanceOf(DOMException)
  })
})
