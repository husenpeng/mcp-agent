/**
 * OpenAI-compatible embeddings provider for `ctx.embeddings`. One batched
 * `POST <baseUrl>/embeddings` request per `embed()` call, split by
 * `batchSize`; the provider sends text off the machine, so a non-loopback
 * endpoint must use HTTPS and its key comes from a credential reference.
 * @module @tomato/experimental-embeddings-http
 */

import z from '@tomato/schemastery'
import { credentialRef } from '@tomato/credentials'
import { launchEnvironmentOf } from '@tomato/launch-environment'
import type { Context, Volatile } from '@tomato/cordis'
import type {} from '@tomato/settings'
import { Embeddings, EmbeddingsError } from '@tomato/experimental-embeddings'
import type { EmbeddingsUsage, EmbedRequest } from '@tomato/experimental-embeddings'

/** Deployment configuration of the HTTP embeddings provider. */
export interface Config {
  /** Base URL of the OpenAI-compatible API, for example `https://api.example.com/v1`; the provider appends `/embeddings`. */
  baseUrl: string
  /** Embedding model id the endpoint accepts. */
  model: string
  /** Credential reference (an environment-variable name) holding the bearer key; omitted sends no authorization. */
  apiKeyEnv?: string
  /** Vector length the endpoint returns; `0` or omitted defers to the first response. */
  dimensions?: number
  /** Whether memory search may use this provider; `false` leaves search lexical until re-enabled. */
  enabled?: boolean | Volatile<boolean | undefined>
  /** Deadline of one HTTP request. */
  timeoutMs?: number | Volatile<number>
  /** Texts per HTTP request. */
  batchSize?: number | Volatile<number>
  /** Characters kept from one text before it is sent. */
  maxInputChars?: number | Volatile<number>
}

/** Fully resolved provider configuration. */
export interface ResolvedEmbeddingsConfig {
  /** Normalized base URL without a trailing slash. */
  readonly baseUrl: string
  /** Embedding model id. */
  readonly model: string
  /** Credential reference, when the endpoint needs a bearer key. */
  readonly apiKeyEnv: string | undefined
  /** Vector length, or `0` while unknown. */
  readonly dimensions: number
  /** Deadline of one HTTP request. */
  readonly timeoutMs: number
  /** Texts per HTTP request. */
  readonly batchSize: number
  /** Characters kept from one text before it is sent. */
  readonly maxInputChars: number
}

/** Resolve the bearer key from the credential store, else the launch environment. */
async function resolveKey(ctx: Context, name: string | undefined): Promise<string | undefined> {
  if (name === undefined) return undefined
  const ref = credentialRef(name)
  const credentials = ctx.get('credentials')
  if (credentials !== undefined) {
    const hit = await credentials.resolve(ref)
    if (hit !== undefined) return hit.value
  } else {
    const ambient = launchEnvironmentOf(ctx).get(ref)
    if (ambient !== undefined && ambient.value !== '') return ambient.value
  }
  throw new EmbeddingsError(`embedding credential "${name}" is not configured`, 'provider')
}

/** Loopback host names that may use plain HTTP. */
const LOOPBACK = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

/**
 * Resolve the live configuration and reject a value the provider cannot honor.
 * @param config - partially specified provider configuration.
 * @returns every field, defaulted and validated.
 * @throws TypeError when the URL, model, or a limit is unusable.
 */
export function resolveEmbeddingsConfig(config: Config): ResolvedEmbeddingsConfig {
  const now = (value: number | Volatile<number> | undefined, fallback: number): number =>
    value === undefined ? fallback : typeof value === 'number' ? value : value.get()
  const url = new URL(config.baseUrl)
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && LOOPBACK.has(url.hostname))) {
    throw new TypeError(`experimental-embeddings-http: baseUrl must use HTTPS unless it is loopback, got "${config.baseUrl}"`)
  }
  if (url.search !== '' || url.hash !== '') {
    throw new TypeError('experimental-embeddings-http: baseUrl must not carry a query or fragment')
  }
  const model = config.model.trim()
  if (model === '') throw new TypeError('experimental-embeddings-http: model must not be empty')
  const dimensions = config.dimensions ?? 0
  if (!Number.isSafeInteger(dimensions) || dimensions < 0 || dimensions > 16_384) {
    throw new TypeError('experimental-embeddings-http: dimensions must be an integer from 0 to 16384')
  }
  const limits = {
    timeoutMs: now(config.timeoutMs, 15_000),
    batchSize: now(config.batchSize, 32),
    maxInputChars: now(config.maxInputChars, 4000),
  }
  for (const [field, value] of Object.entries(limits)) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new TypeError(`experimental-embeddings-http: ${field} must be a positive safe integer`)
    }
  }
  return {
    baseUrl: url.href.replace(/\/$/u, ''),
    model,
    apiKeyEnv: config.apiKeyEnv?.trim() || undefined,
    dimensions,
    ...limits,
  }
}

/** One decoded vector of an OpenAI-compatible embeddings response. */
interface VectorEntry {
  /** Position of the input this vector embeds. */
  index?: number
  /** Numeric vector. */
  embedding?: unknown
}

/** Staged endpoint one Host-side probe reads. */
export interface EmbeddingsProbeInput {
  readonly baseUrl: string
  readonly model: string
  readonly dimensions: number
  readonly apiKeyEnv?: string
  readonly timeoutMs?: number
}

/** Outcome of one Host-side embedding probe. */
export interface EmbeddingsProbeResult {
  readonly ok: boolean
  readonly detail: string
  /** Vector length the endpoint returned, when it returned one. */
  readonly dimensions?: number
  /** Wall-clock milliseconds the probe took. */
  readonly latencyMs: number
}

/**
 * Send one minimal embedding request from the Host, resolving credentials the
 * same way the mounted provider does. The page uses it instead of a browser
 * request, so a remote endpoint's CORS policy cannot mask a working provider.
 * @param ctx - Host context carrying optional credentials and launch environment.
 * @param input - staged endpoint, model, length, and credential name.
 * @param signal - caller cancellation.
 * @returns whether a vector came back, its length, and the probe latency.
 */
export async function probeEmbeddingsEndpoint(
  ctx: Context,
  input: EmbeddingsProbeInput,
  signal?: AbortSignal,
): Promise<EmbeddingsProbeResult> {
  const started = Date.now()
  const latency = (): number => Date.now() - started
  let settings: ResolvedEmbeddingsConfig
  try {
    settings = resolveEmbeddingsConfig({
      baseUrl: input.baseUrl,
      model: input.model,
      dimensions: input.dimensions,
      ...input.apiKeyEnv === undefined || input.apiKeyEnv.trim() === '' ? {} : { apiKeyEnv: input.apiKeyEnv },
      ...input.timeoutMs === undefined ? {} : { timeoutMs: input.timeoutMs },
    })
  } catch (error: unknown) {
    /* v8 ignore next -- resolveEmbeddingsConfig throws Errors only */
    return { ok: false, detail: error instanceof Error ? error.message : String(error), latencyMs: latency() }
  }
  const timeout = AbortSignal.timeout(settings.timeoutMs)
  const combined = signal === undefined ? timeout : AbortSignal.any([signal, timeout])
  try {
    const key = await resolveKey(ctx, settings.apiKeyEnv)
    const response = await fetch(`${settings.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...key === undefined ? {} : { authorization: `Bearer ${key}` },
      },
      body: JSON.stringify({ model: settings.model, input: 'ping' }),
      signal: combined,
    })
    if (!response.ok) return { ok: false, detail: `endpoint answered HTTP ${response.status}`, latencyMs: latency() }
    const body: unknown = await response.json()
    const record = typeof body === 'object' && body !== null ? body as Record<string, unknown> : undefined
    const data = Array.isArray(record?.data) ? record.data : undefined
    const first = data?.[0]
    const vector = typeof first === 'object' && first !== null && Array.isArray((first as { embedding?: unknown }).embedding)
      ? (first as { embedding: number[] }).embedding
      : undefined
    if (vector === undefined || vector.length === 0) {
      return { ok: false, detail: 'the reply carried no embedding vector', latencyMs: latency() }
    }
    if (settings.dimensions !== 0 && vector.length !== settings.dimensions) {
      return { ok: false, detail: `the endpoint returned ${vector.length} values, not ${settings.dimensions}`, latencyMs: latency() }
    }
    return { ok: true, detail: `returned a ${vector.length}-value vector`, dimensions: vector.length, latencyMs: latency() }
  } catch (error: unknown) {
    if (signal?.aborted === true) throw error
    if (timeout.aborted) return { ok: false, detail: `the endpoint timed out after ${settings.timeoutMs} ms`, latencyMs: latency() }
    return { ok: false, detail: error instanceof Error ? error.message : String(error), latencyMs: latency() }
  }
}

/**
 * Mount the provider as `ctx.embeddings`.
 */
export default class HttpEmbeddings extends Embeddings {
  static Config = z.object({
    baseUrl: z.string().required(),
    model: z.string().required(),
    apiKeyEnv: z.string(),
    dimensions: z.number().step(1).min(0).max(16_384),
    enabled: z.boolean().default(true).volatile(),
    timeoutMs: z.number().step(1).min(1).max(120_000).default(15_000).volatile(),
    batchSize: z.number().step(1).min(1).max(256).default(32).volatile(),
    maxInputChars: z.number().step(1).min(1).max(100_000).default(4000).volatile(),
  })

  /** Embedding model id sent with every request. */
  readonly model: string

  /** Configured vector length, or `0` while the first response defines it. */
  readonly dimensions: number

  /** Whether memory search may use this provider now; the Plugins page toggles it. */
  override get enabled(): boolean {
    const value = this.config.enabled
    if (value === undefined) return true
    if (typeof value === 'boolean') return value
    return value.get() !== false
  }

  override get usage(): EmbeddingsUsage {
    const { requests, texts, failures, totalMs, lastError } = this.counters
    return { requests, texts, failures, totalMs, ...lastError === undefined ? {} : { lastError } }
  }

  private readonly endpoint: string
  private readonly counters = { requests: 0, texts: 0, failures: 0, totalMs: 0, lastError: undefined as string | undefined }

  /**
   * @param ctx - Host context owning the provider.
   * @param config - validated provider configuration.
   */
  constructor(ctx: Context, private readonly config: Config) {
    super(ctx)
    // Serve this row's Config to the Plugins page; the browser half supplies the page.
    ctx.inject(['settings'], (child) => { child.effect(() => child.settings.configure({ auto: false }, ctx.fiber)) })
    const resolved = resolveEmbeddingsConfig(config)
    this.model = resolved.model
    this.dimensions = resolved.dimensions
    this.endpoint = `${resolved.baseUrl}/embeddings`
  }

  /**
   * Embed one batch of texts, splitting it by `batchSize`.
   * @param request - texts in caller order and the caller's cancellation.
   * @returns one vector per text, in the same order.
   * @throws {@link EmbeddingsError} on a provider, timeout, or response failure.
   */
  async embed(request: EmbedRequest): Promise<readonly Float32Array[]> {
    if (request.texts.length === 0) return []
    const settings = resolveEmbeddingsConfig(this.config)
    const vectors: Float32Array[] = []
    const started = Date.now()
    this.counters.requests += 1
    this.counters.texts += request.texts.length
    try {
      for (let start = 0; start < request.texts.length; start += settings.batchSize) {
        const batch = request.texts.slice(start, start + settings.batchSize)
          .map(text => text.slice(0, settings.maxInputChars))
        vectors.push(...await this.request(batch, settings, request.signal))
      }
      return vectors
    } catch (error: unknown) {
      this.counters.failures += 1
      /* v8 ignore next -- embed failures are EmbeddingsError instances */
      this.counters.lastError = error instanceof Error ? error.message : String(error)
      throw error
    } finally {
      this.counters.totalMs += Date.now() - started
    }
  }

  /** Resolve the bearer key from the credential store, else the launch environment. */
  private async apiKey(settings: ResolvedEmbeddingsConfig): Promise<string | undefined> {
    return await resolveKey(this.ctx, settings.apiKeyEnv)
  }

  /** Send one batch and decode its vectors. */
  private async request(batch: readonly string[], settings: ResolvedEmbeddingsConfig, signal?: AbortSignal): Promise<Float32Array[]> {
    const key = await this.apiKey(settings)
    const timeout = AbortSignal.timeout(settings.timeoutMs)
    const combined = signal === undefined ? timeout : AbortSignal.any([signal, timeout])
    let response: Response
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...key === undefined ? {} : { authorization: `Bearer ${key}` },
        },
        body: JSON.stringify({ model: settings.model, input: batch }),
        signal: combined,
      })
    } catch (error) {
      if (signal?.aborted === true) throw error
      if (timeout.aborted) throw new EmbeddingsError(`embedding request timed out after ${settings.timeoutMs} ms`, 'timeout')
      throw new EmbeddingsError(`embedding request failed: ${error instanceof Error ? error.message : String(error)}`, 'provider')
    }
    if (!response.ok) {
      throw new EmbeddingsError(`embedding endpoint returned HTTP ${response.status}`, 'provider')
    }
    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw new EmbeddingsError('embedding endpoint returned a body that is not JSON', 'invalid-response')
    }
    return this.decode(body, batch.length, settings.dimensions)
  }

  /** Validate the response document and return its vectors in input order. */
  private decode(body: unknown, count: number, dimensions: number): Float32Array[] {
    const record = typeof body === 'object' && body !== null ? body as Record<string, unknown> : undefined
    const data = Array.isArray(record?.data) ? record.data as readonly VectorEntry[] : undefined
    if (data === undefined || data.length !== count) {
      throw new EmbeddingsError(`embedding endpoint returned ${data?.length ?? 0} vectors for ${count} inputs`, 'invalid-response')
    }
    const ordered: (Float32Array | undefined)[] = Array.from({ length: count })
    let length = dimensions
    for (const [position, entry] of data.entries()) {
      const index = entry.index ?? position
      if (!Number.isSafeInteger(index) || index < 0 || index >= count || ordered[index] !== undefined) {
        throw new EmbeddingsError('embedding endpoint returned an out-of-range or duplicate vector index', 'invalid-response')
      }
      const raw = entry.embedding
      if (!Array.isArray(raw) || raw.length === 0 || !raw.every(value => typeof value === 'number' && Number.isFinite(value))) {
        throw new EmbeddingsError('embedding endpoint returned a malformed vector', 'invalid-response')
      }
      if (length !== 0 && raw.length !== length) {
        throw new EmbeddingsError(`embedding endpoint returned ${raw.length} values for a ${length}-value vector`, 'invalid-response')
      }
      length = raw.length
      ordered[index] = Float32Array.from(raw)
    }
    return ordered.map((vector) => {
      /* v8 ignore next -- the length check above rejects any missing index before this point */
      if (vector === undefined) throw new EmbeddingsError('embedding endpoint returned no vector for one input', 'invalid-response')
      return vector
    })
  }
}
